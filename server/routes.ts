import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { EventEmitter } from "events";
import { timingSafeEqual } from "crypto";
import { db } from "./db";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, getSession } from "./auth";
import { adminRoleMiddleware, adminPinMiddleware, adminMiddleware } from "./admin-guard";
import passport from "passport";
import { cache, cacheKeys, cacheTTL } from "./cache";
import { slugify } from "@shared/utils";
import { healthCheck, readinessCheck, metricsEndpoint } from "./monitoring";
import { registerSitemapRoutes } from "./sitemap";
import { registerPrerenderRoutes } from "./prerender";
import { registerCronRoutes } from "./cron";

// Global notification event emitter for real-time WebSocket notifications
export const notificationEmitter = new EventEmitter();
export type NotificationEvent = {
  userId: string;
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    relatedId: string | null;
    createdAt: Date;
  };
};
import { locations, listings, blogPosts, users, messages, conversations, userPresence, messageReactions, favorites, savedSearches, categories, auctions, bids, liveStreams, insertLiveStreamSchema, vetServices, transportServices, reviews, stores, storeReviews, storeMedia, storeCategories, storeFollowers, notifications, insertNotificationSchema, reports, insertReportSchema, offers, insertOfferSchema, listingImages, insertListingImageSchema, userSettings, userDevices, loginHistory, restrictedCategories, auditLogs, systemSettings, adminBroadcasts, viewedListings, sellerReviews, listingVideos, contactRequests, categoryStats, searchNotificationLogs, marketPrices } from "@shared/schema";
import { processAndUploadImage, deleteImageVariants, validateImageFile, processStoreImage } from "./imageProcessor";
import { eq, ne, and, isNull, asc, desc, sql, count, inArray, gte, lte, ilike, or } from "drizzle-orm";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import multer from "multer";
import {
  insertUserSchema,
  insertListingSchema,
  insertAuctionSchema,
  insertBidSchema,
  insertMessageSchema,
  insertBlogPostSchema,
  insertVetServiceSchema,
  insertTransportServiceSchema,
  insertReviewSchema,
  insertFavoriteSchema,
  insertStoreSchema,
  insertStoreReviewSchema,
  type User,
} from "@shared/schema";
import {
  ObjectStorageService,
  ObjectNotFoundError,
  objectStorage,
  isObjectStorageConfigured,
} from "./objectStorage";
import { emailService, generateVerificationToken, shouldAutoVerifyEmail } from "./email";
import { botGuard, stripBotFields } from "./bot-protection";
import { moderateListingSchema } from "./validation";
import { registerAdvancedFeatureRoutes } from "./advancedFeatureRoutes";
import { getTCMBRates, formatCurrencyForTicker } from "./marketDataService";

// SESSION_SECRET is now used for session management (not JWT)

// ============ Multer Configuration for File Uploads ============
// Upload config for images only (listings, stores, etc.)
const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Açık liste kullanılıyor: "image/*" kalıbı SVG'yi de kabul ederdi.
    // SVG bir XML belgesidir ve içine <script> gömülebilir; ham hâlde
    // servis edildiğinde tarayıcıda çalışır. Raster formatlarla sınırlıyoruz.
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Sadece JPEG, PNG, WebP veya GIF yüklenebilir'));
    }
  },
});

// Upload config for messages (images + documents)
const uploadMessageFiles = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya türü'));
    }
  },
});

// Upload config for legal documents (PDF, images)
const uploadDocuments = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/webp'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Sadece PDF, JPEG, PNG veya WebP dosyaları yüklenebilir'));
    }
  },
});

// Legacy alias for backward compatibility
const upload = uploadImages;

// ============ Rate Limiting Configuration ============

// Moderate rate limiter for resource creation
// More generous limits for development, stricter in production
const isDevelopment = process.env.NODE_ENV !== 'production';

// Local rate limiter (fallback when Redis unavailable)
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDevelopment ? 60 : 20, // 60 requests/min in dev, 20 in production
  message: "Çok fazla istek gönderdiniz. Lütfen bir dakika bekleyin.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDevelopment && req.path === '/api/listings', // Skip rate limit for listings in dev
});

// Distributed rate limiting using Redis (for multi-instance deployments)
// Uses atomic INCR for thread-safe counter increments
async function checkRedisRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const windowKey = `ratelimit:${key}:${Math.floor(now / windowSeconds)}`;
    
    // Atomic increment using Redis INCR
    // This is thread-safe across all server instances
    const count = await cache.incr(windowKey, windowSeconds);
    
    const resetAt = (Math.floor(now / windowSeconds) + 1) * windowSeconds;
    
    if (count > limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt
      };
    }
    
    return {
      allowed: true,
      remaining: Math.max(0, limit - count),
      resetAt
    };
  } catch (error) {
    // Fail open - allow request if Redis is unavailable
    console.warn('Redis rate limit check failed, allowing request:', error);
    return { allowed: true, remaining: limit, resetAt: 0 };
  }
}

// Global API rate limiting middleware (stricter limits for production)
const globalApiLimiter = async (req: Request, res: Response, next: Function) => {
  if (isDevelopment) return next(); // Skip in development
  
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const limit = 100; // 100 requests per minute per IP
  const windowSeconds = 60;
  
  const result = await checkRedisRateLimit(`global:${ip}`, limit, windowSeconds);
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', result.resetAt);
  
  if (!result.allowed) {
    return res.status(429).json({
      message: 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.',
      retryAfter: result.resetAt - Math.floor(Date.now() / 1000)
    });
  }
  
  next();
};

/**
 * Giriş / kayıt gibi uçlar için IP tabanlı üst sınır.
 *
 * Eskiden IP başına 5 DAKİKADA 5 denemeydi ve bu gerçek kullanıcıları
 * engelliyordu: Türkiye'de mobil operatörler CGNAT kullanıyor, yani binlerce
 * abone aynı genel IP'den çıkıyor. Aynı ev, ofis veya kafe ağındaki herkes de
 * tek IP paylaşır. Bu ölçekte 5 deneme birkaç saniyede tükeniyor ve hiçbir
 * şey yapmamış kullanıcılar "Çok fazla deneme yaptınız" hatası alıyordu.
 *
 * Sınır artık paylaşılan bir IP'nin normal trafiğini rahatça geçirecek kadar
 * geniş; amacı yalnızca kaba bir sel baskınını kesmek. Şifre deneme
 * saldırısına karşı asıl koruma aşağıdaki hesap bazlı sayaçta.
 */
const authIpLimiter = async (req: Request, res: Response, next: Function) => {
  if (isDevelopment) return next();

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const result = await checkRedisRateLimit(`auth-ip:${ip}`, 120, 300); // 5 dakikada 120

  if (!result.allowed) {
    return res.status(429).json({
      message: 'Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.',
      retryAfter: result.resetAt - Math.floor(Date.now() / 1000)
    });
  }

  next();
};

/**
 * Şifre deneme saldırısına karşı HESAP bazlı koruma.
 *
 * IP yerine e-posta sayılır; CGNAT arkasındaki masum kullanıcılar birbirini
 * etkilemez, buna karşılık tek bir hesaba yönelik deneme saldırısı kaynak IP
 * değiştirse bile durur. Eşik bilinçli olarak yüksek: şifresini hatırlamaya
 * çalışan gerçek bir kullanıcı buraya takılmamalı.
 *
 * Sayaç yalnızca BAŞARISIZ girişte artar (recordFailedLogin) ve başarılı
 * girişte sıfırlanır (clearLoginFailures) — doğru şifreyi bilen kullanıcı
 * hiçbir koşulda kilitlenmez.
 */
const LOGIN_FAIL_LIMIT = 12;
const LOGIN_FAIL_WINDOW_MS = 15 * 60 * 1000;

/**
 * Son başarısız giriş sayısını VERİTABANINDAN okur.
 *
 * Neden bellek/cache değil: üretimde Redis yapılandırılmamış durumda
 * (UPSTASH_* tanımsız) ve `cache` bu durumda süreç içi bir Map'e düşüyor.
 * Vercel'de her istek ayrı bir sunucusuz örneğe gidebildiği ve örnekler sürekli
 * doğup öldüğü için böyle bir sayaç hiçbir zaman birikmiyor — yani bellek
 * tabanlı bir kilit pratikte hiç devreye girmez. PostgreSQL tüm örnekler
 * arasında paylaşılan tek durum kaynağı olduğu için sayaç oradan okunuyor.
 *
 * `login_history` tablosu zaten her denemeyi (başarılı/başarısız) kaydediyor;
 * ayrı bir tabloya gerek yok. Sayım son BAŞARILI girişten sonrasını kapsar:
 * doğru şifreyi giren kullanıcı anında temize çıkar, geçmiş denetim kaydı
 * silinmeden kilit kalkar.
 */
async function recentFailedLogins(userId: string): Promise<number> {
  try {
    const pencereBasi = new Date(Date.now() - LOGIN_FAIL_WINDOW_MS);

    const [sonBasarili] = await db
      .select({ at: loginHistory.createdAt })
      .from(loginHistory)
      .where(and(eq(loginHistory.userId, userId), eq(loginHistory.success, true)))
      .orderBy(desc(loginHistory.createdAt))
      .limit(1);

    const baslangic =
      sonBasarili?.at && sonBasarili.at > pencereBasi ? sonBasarili.at : pencereBasi;

    const [satir] = await db
      .select({ n: count() })
      .from(loginHistory)
      .where(
        and(
          eq(loginHistory.userId, userId),
          eq(loginHistory.success, false),
          gte(loginHistory.createdAt, baslangic)
        )
      );

    return Number(satir?.n ?? 0);
  } catch (error) {
    // Sayaç okunamıyorsa meşru kullanıcıyı kilitleme.
    console.warn("Başarısız giriş sayısı okunamadı:", error);
    return 0;
  }
}

/**
 * Yönetici PIN'i için deneme sınırı.
 *
 * PIN kısa (4-10 hane) olduğundan sınırsız deneme kaba kuvvetle kırılabilir.
 * Sayaç IP yerine KULLANICI başına tutulur — bu uca yalnızca kimliği
 * doğrulanmış yöneticiler ulaşabildiği için IP'ye bakmanın anlamı yok ve
 * paylaşılan IP'den giren ikinci yönetici cezalandırılmamalı.
 */
const pinAttemptLimiter = async (req: Request, res: Response, next: Function) => {
  const userId = (req.user as any)?.claims?.sub;
  if (!userId) return next(); // kimlik kontrolü zaten sonraki katmanda

  const result = await checkRedisRateLimit(`admin-pin:${userId}`, 10, 900); // 15 dakikada 10
  if (!result.allowed) {
    return res.status(429).json({
      message: 'Çok fazla hatalı PIN denemesi. Lütfen 15 dakika bekleyin.',
      retryAfter: result.resetAt - Math.floor(Date.now() / 1000)
    });
  }
  next();
};

// Extended user type for authenticated requests (combines session user with DB user)
interface AuthenticatedUser {
  id: string;
  email: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: 'admin' | 'buyer' | 'seller' | 'vet' | 'transporter';
  phone: string | null;
  city: string | null;
  district: string | null;
  bio: string | null;
  emailVerified: boolean;
  claims?: { sub: string; email?: string; [key: string]: any };
  dbUserId?: string;
}

/**
 * Kullanıcı kaydından istemciye ASLA gitmemesi gereken alanları çıkarır.
 *
 * Şifre hash'i sızarsa çevrimdışı kaba kuvvet saldırısına açık hale gelir;
 * doğrulama/sıfırlama token'ları ise hesap ele geçirmeye yarayabilir.
 * Kullanıcı nesnesi döndüren her uçta bu fonksiyondan geçirin.
 */
function sanitizeUser<T extends Record<string, any> | undefined | null>(user: T): T {
  if (!user) return user;
  const {
    password,
    verificationToken,
    verificationTokenExpiry,
    resetToken,
    resetTokenExpiry,
    ...safe
  } = user as Record<string, any>;
  return safe as T;
}

/**
 * Bir kullanıcı kaydının HERKESE AÇIK uçlarda gösterilebilecek alanları.
 *
 * `sanitizeUser` kara liste ile çalışır: bilinen hassas alanları çıkarır,
 * geri kalan her şeyi geçirir. Kullanıcının kendisine dönen yanıtlar için
 * uygun, ama herkese açık bir uçta yeterli değil — tabloya sonradan eklenen
 * bir alan (ör. son giriş IP'si) sessizce yayımlanır.
 *
 * Bu yardımcı beyaz liste kullanır: yalnızca aşağıdakiler döner.
 * `phone` listede, çünkü alıcının satıcıya/hizmet verene ulaşması gerekiyor
 * ve arayüz bunu gösteriyor. `email` listede DEĞİL: istenmeyen posta
 * toplayıcılarına açık hedef olur ve gösterilmesi için bir sebep yok.
 */
function publicUserFields<T extends Record<string, any> | undefined | null>(user: T) {
  if (!user) return null;
  const u = user as Record<string, any>;
  return {
    id: u.id,
    firstName: u.firstName ?? null,
    lastName: u.lastName ?? null,
    username: u.username ?? null,
    profileImageUrl: u.profileImageUrl ?? null,
    phone: u.phone ?? null,
    city: u.city ?? null,
    createdAt: u.createdAt ?? null,
  };
}

// Helper function to get user ID from session (handles OIDC and email/phone auth)
// Returns a non-null string for authenticated routes (throws if not found)
function getUserId(user: any): string {
  const id = user?.claims?.sub ?? user?.dbUserId ?? user?.id;
  if (!id) {
    throw new Error('User ID not found in session');
  }
  return id;
}

/**
 * Bir kullanıcıya olay bildirimi e-postası gönderir.
 *
 * Site içi bildirim (notifications tablosu) kullanıcı siteye girmediği sürece
 * görülmez. Önemli olaylarda — ilan onayı, teklif, iletişim talebi — kullanıcı
 * dışarıdan haberdar edilmezse fırsat kaçar. Bu yardımcı o boşluğu kapatıyor.
 *
 * Kullanıcı tercihi her zaman kontrol edilir. Ayar KAYDI OLMAYAN kullanıcıya
 * gönderilir (varsayılan açık), açıkça kapatmış olana gönderilmez.
 *
 * Bu yardımcı hata FIRLATMAZ: bildirim gönderilemedi diye ilan onayı ya da
 * teklif işlemi başarısız sayılmamalı.
 *
 * Çağrılar `await` ile yapılmalı, `void` ile DEĞİL. Sunucusuz ortamda yanıt
 * gönderildiği anda fonksiyon dondurulur ve arkada kalan iş tamamlanmaz;
 * `void` kullanıldığında e-postalar örneğin sıcak kalıp kalmamasına göre
 * rastgele gidiyor ya da hiç gitmiyordu (canlı logla doğrulandı).
 */
async function olayEpostasiGonder(
  userId: string,
  icerik: {
    title: string;
    body: string;
    actionPath?: string;
    actionLabel?: string;
    details?: Array<[string, string]>;
  },
  tercih: "notifyMessages" | "notifyListingUpdates" | "notifyFavorites" = "notifyListingUpdates"
): Promise<void> {
  try {
    const [ayar] = await db
      .select({
        emailNotifications: userSettings.emailNotifications,
        notifyMessages: userSettings.notifyMessages,
        notifyListingUpdates: userSettings.notifyListingUpdates,
        notifyFavorites: userSettings.notifyFavorites,
      })
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (ayar && (!ayar.emailNotifications || !ayar[tercih])) return;

    const [kullanici] = await db
      .select({ email: users.email, firstName: users.firstName })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!kullanici?.email) return;

    await emailService.sendEventNotice({
      to: kullanici.email,
      recipientName: kullanici.firstName,
      ...icerik,
    });
  } catch (error) {
    console.error("Olay e-postası gönderilemedi:", error);
  }
}

/**
 * Oturumdaki kullanıcının e-postasının doğrulanmış olup olmadığını
 * VERİTABANINDAN okur.
 *
 * Neden veritabanından: `req.user` yalnızca `{ claims: { sub } }` taşıyan
 * oturum nesnesidir; kullanıcı kaydındaki `emailVerified` gibi alanlar orada
 * BULUNMAZ. `req.user.emailVerified` okumak her zaman `undefined` döndürür,
 * yani "doğrulanmamış" sayılır.
 *
 * Bu, üretimde ilan verilmesini tamamen durduran bir hataya yol açmıştı:
 * e-postasını doğrulamış kullanıcılar bile ilan oluşturmaya çalıştığında
 * "email adresinizi doğrulayın" hatası alıyordu ve sitede hiç ilan
 * oluşmuyordu. Doğrulama durumu tek kaynaktan — veritabanından — okunmalı.
 */
async function isEmailVerified(user: any): Promise<boolean> {
  const [row] = await db
    .select({ emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, getUserId(user)))
    .limit(1);
  return !!row?.emailVerified;
}

// Helper function to parse user-agent and extract device info
function parseUserAgent(userAgent: string | undefined): { deviceType: string; browser: string; os: string } {
  if (!userAgent) {
    return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' };
  }

  // Detect device type
  let deviceType = 'desktop';
  if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
    deviceType = /ipad|tablet/i.test(userAgent) ? 'tablet' : 'mobile';
  }

  // Detect browser
  let browser = 'unknown';
  if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/edg/i.test(userAgent)) browser = 'Edge';
  else if (/chrome/i.test(userAgent)) browser = 'Chrome';
  else if (/safari/i.test(userAgent)) browser = 'Safari';
  else if (/opera|opr/i.test(userAgent)) browser = 'Opera';

  // Detect OS
  let os = 'unknown';
  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/mac os|macos/i.test(userAgent)) os = 'macOS';
  else if (/linux/i.test(userAgent)) os = 'Linux';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/iphone|ipad|ios/i.test(userAgent)) os = 'iOS';

  return { deviceType, browser, os };
}

// Helper function to record login history
async function recordLoginHistory(
  userId: string,
  req: Request,
  success: boolean,
  loginMethod: string,
  failureReason?: string
): Promise<void> {
  try {
    const userAgentStr = req.headers['user-agent'] || '';
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                      req.socket.remoteAddress || 
                      'unknown';

    await db.insert(loginHistory).values({
      id: crypto.randomUUID(),
      userId,
      loginMethod,
      ipAddress,
      userAgent: userAgentStr,
      location: null,
      success,
      failureReason: failureReason || null,
    });
  } catch (error) {
    console.error('Error recording login history:', error);
  }
}

// Helper function to register/update device
async function registerDevice(userId: string, req: Request): Promise<void> {
  try {
    const userAgentStr = req.headers['user-agent'] || '';
    const { deviceType, browser, os } = parseUserAgent(userAgentStr);
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                      req.socket.remoteAddress || 
                      'unknown';

    const deviceName = `${browser} - ${os}`;
    const deviceId = crypto.randomUUID();

    // Check if a similar device already exists
    const existingDevice = await db.query.userDevices.findFirst({
      where: and(
        eq(userDevices.userId, userId),
        eq(userDevices.browser, browser),
        eq(userDevices.os, os)
      ),
    });

    if (existingDevice) {
      // Update last active
      await db
        .update(userDevices)
        .set({ lastActive: new Date(), ipAddress })
        .where(eq(userDevices.id, existingDevice.id));
    } else {
      // Create new device record
      await db.insert(userDevices).values({
        id: deviceId,
        userId,
        deviceName,
        deviceType,
        browser,
        os,
        ipAddress,
        location: null,
        lastActive: new Date(),
        isTrusted: false,
      });
    }
  } catch (error) {
    console.error('Error registering device:', error);
  }
}

// Not: Express Request.user tipi server/auth.ts icinde genisletiliyor

// Eski JWT ara katmani kaldirildi - oturum tabanli kimlik dogrulama kullaniliyor
// Korumali rotalar icin server/auth.ts icindeki isAuthenticated kullanilir

export async function registerRoutes(app: Express, existingServer?: Server): Promise<Server> {
  // ============ Additional Monitoring Routes ============
  // Note: Main health checks (/ and /health) are registered in index.ts BEFORE any middleware
  // These are additional monitoring endpoints
  app.get("/readiness", readinessCheck);

  // SEO: dinamik sitemap (robots.txt statik olarak client/public altinda)
  registerSitemapRoutes(app);

  // Zamanlanmis gorevler (Vercel Cron tarafindan tetiklenir)
  registerCronRoutes(app);

  // SEO: icerik sayfalarina sunucu tarafinda sayfaya ozel meta etiketleri.
  // Yalnizca uretimde: gelistirmede index.html Vite tarafindan HMR ile
  // servis ediliyor, araya girmek gelistirme akisini bozar.
  if (process.env.NODE_ENV === "production") {
    registerPrerenderRoutes(app);
  }
  app.get("/metrics", metricsEndpoint);

  // ============ Kimlik Dogrulama Kurulumu ============
  await setupAuth(app);

  // ============ Global Rate Limiting (Production Only) ============
  // Apply Redis-based distributed rate limiting to all API routes
  app.use("/api", globalApiLimiter);

  // Use existing server if provided, otherwise create new one
  const httpServer = existingServer || createServer(app);
  
  // Skip WebSocket setup in serverless environments (Vercel)
  const isServerless = process.env.VERCEL === '1' || process.env.DISABLE_WEBSOCKET === 'true';
  const wss: WebSocketServer | null = isServerless ? null : new WebSocketServer({ 
    server: httpServer, 
    path: "/ws",
    maxPayload: 100 * 1024, // 100KB max message size
    perMessageDeflate: false, // Disable compression for better performance
  });

  // WebSocket connection handling with limits
  type ClientInfo = {
    ws: WebSocket;
    userId: string;
    auctionId?: string;
    streamId?: string;
    currentConversationId?: string;
  };
  
  const clients = new Map<string, ClientInfo>();
  const MAX_CONNECTIONS = 50000; // Limit concurrent connections
  const HEARTBEAT_INTERVAL = 30000; // 30 seconds
  const CONNECTION_TIMEOUT = 300000; // 5 minutes idle timeout for chat
  const TYPING_TIMEOUT = 3000; // 3 seconds typing indicator timeout
  
  // Heartbeat tracking
  const heartbeats = new Map<string, NodeJS.Timeout>();
  
  // Typing indicator tracking
  const typingUsers = new Map<string, NodeJS.Timeout>();
  
  // Helper: Generate conversation ID (sorted user IDs)
  const generateConversationId = (userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join('_');
  };
  
  // Helper: Update user presence
  const updateUserPresence = async (userId: string, isOnline: boolean, socketId?: string) => {
    try {
      await db
        .insert(userPresence)
        .values({
          userId,
          isOnline,
          lastSeenAt: new Date(),
          lastActiveAt: new Date(),
          socketId: socketId || null,
        })
        .onConflictDoUpdate({
          target: userPresence.userId,
          set: {
            isOnline,
            lastSeenAt: new Date(),
            lastActiveAt: new Date(),
            socketId: socketId || null,
          },
        });
    } catch (error) {
      console.error("Failed to update user presence:", error);
    }
  };
  
  // Helper: Broadcast to specific user
  const broadcastToUser = (userId: string, data: any) => {
    const client = clients.get(userId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  };
  
  // Listen for notification events from HTTP routes and broadcast via WebSocket
  notificationEmitter.on('notification', (event: NotificationEvent) => {
    broadcastToUser(event.userId, {
      type: "notification",
      notification: event.notification,
    });
  });
  
  // Helper: Get or create conversation
  const getOrCreateConversation = async (participant1Id: string, participant2Id: string, listingId?: string) => {
    const conversationId = generateConversationId(participant1Id, participant2Id);
    
    // Check if conversation exists
    const [existing] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    
    if (existing) {
      return existing;
    }
    
    // Create new conversation - ensure participant1 is always the smaller ID
    const [p1, p2] = [participant1Id, participant2Id].sort();
    const [newConversation] = await db
      .insert(conversations)
      .values({
        id: conversationId,
        participant1Id: p1,
        participant2Id: p2,
        listingId: listingId || null,
        participant1Archived: false,
        participant2Archived: false,
        participant1Pinned: false,
        participant2Pinned: false,
        participant1Muted: false,
        participant2Muted: false,
      })
      .returning();
    
    return newConversation;
  };
  
  wss?.on("connection", async (ws: WebSocket, req) => {
    // Check connection limit
    if (clients.size >= MAX_CONNECTIONS) {
      ws.close(1008, "Server at capacity");
      return;
    }

    let userId: string | null = null;

    try {
      // Try session-based authentication first
      const sessionMiddleware = getSession();
      await new Promise<void>((resolve, reject) => {
        sessionMiddleware(req as any, {} as any, (err?: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      await new Promise<void>((resolve, reject) => {
        passport.initialize()(req as any, {} as any, (err?: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      await new Promise<void>((resolve, reject) => {
        passport.session()(req as any, {} as any, (err?: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const user = (req as any).user;
      if ((req as any).isAuthenticated && (req as any).isAuthenticated() && user?.claims?.sub) {
        userId = user.claims.sub;
      }
    } catch {
      // Session auth failed, will wait for auth message
    }

    // If session auth failed, wait for auth message
    if (!userId) {
      // Set up temporary message handler for auth
      const authTimeout = setTimeout(() => {
        ws.close(1008, "Authentication timeout");
      }, 10000); // 10 second timeout for auth message

      ws.once("message", async (data) => {
        clearTimeout(authTimeout);
        try {
          const message = JSON.parse(data.toString());
          if (message.type === "auth" && message.userId) {
            // Verify user exists in database
            const [dbUser] = await db
              .select()
              .from(users)
              .where(eq(users.id, message.userId))
              .limit(1);
            
            if (dbUser) {
              setupAuthenticatedConnection(ws, message.userId, dbUser);
              ws.send(JSON.stringify({ type: "auth_success" }));
            } else {
              ws.close(1008, "Invalid user");
            }
          } else {
            ws.close(1008, "Authentication required");
          }
        } catch {
          ws.close(1008, "Invalid auth message");
        }
      });
      return;
    }

    // Session auth successful, get user from DB and set up connection
    const [dbUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (dbUser) {
      setupAuthenticatedConnection(ws, userId, dbUser);
    } else {
      ws.close(1008, "User not found");
    }
  });

  // Helper function to set up authenticated WebSocket connection
  async function setupAuthenticatedConnection(ws: WebSocket, userId: string, user: typeof users.$inferSelect) {
      
      // Close existing connection for this user
      const existingClient = clients.get(userId);
      if (existingClient && existingClient.ws.readyState === WebSocket.OPEN) {
        existingClient.ws.close(1000, "New connection established");
      }
      
      // Create client info
      const clientInfo: ClientInfo = {
        ws,
        userId,
      };
      
      clients.set(userId, clientInfo);
      
      // Update user presence to online
      await updateUserPresence(userId, true, `ws_${Date.now()}`);
      
      // Notify contacts that user is online
      const userConversations = await db
        .select()
        .from(conversations)
        .where(
          or(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, userId)
          )
        );
      
      for (const conv of userConversations) {
        const partnerId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
        broadcastToUser(partnerId, {
          type: "presence",
          userId,
          isOnline: true,
          lastSeenAt: new Date().toISOString(),
        });
      }
      
      // Setup heartbeat for this connection
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(heartbeat);
          heartbeats.delete(userId);
        }
      }, HEARTBEAT_INTERVAL);
      heartbeats.set(userId, heartbeat);
      
      // Setup idle timeout
      let idleTimeout = setTimeout(() => {
        ws.close(1000, "Connection idle timeout");
      }, CONNECTION_TIMEOUT);
      
      // Reset timeout on activity
      const resetTimeout = () => {
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(() => {
          ws.close(1000, "Connection idle timeout");
        }, CONNECTION_TIMEOUT);
      };

      ws.on("message", async (data) => {
        resetTimeout(); // Reset idle timeout on message
        
        try {
          // Validate message size
          if (data.toString().length > 10000) {
            ws.send(JSON.stringify({ type: "error", message: "Message too large" }));
            return;
          }
          
          const message = JSON.parse(data.toString());
          
          // Handle different message types
          if (message.type === "subscribe") {
            // Subscribe to auction or stream
            if (message.auctionId) {
              clientInfo.auctionId = message.auctionId;
              ws.send(JSON.stringify({ type: "subscribed", auctionId: message.auctionId }));
            } else if (message.streamId) {
              clientInfo.streamId = message.streamId;
              ws.send(JSON.stringify({ type: "subscribed", streamId: message.streamId }));
            } else if (message.conversationId) {
              clientInfo.currentConversationId = message.conversationId;
              ws.send(JSON.stringify({ type: "subscribed", conversationId: message.conversationId }));
            }
          } else if (message.type === "typing_start") {
            // Handle typing indicator start
            const receiverId = message.receiverId;
            const conversationId = generateConversationId(userId, receiverId);
            
            // Clear existing typing timeout
            const existingTimeout = typingUsers.get(`${userId}_${conversationId}`);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }
            
            // Notify receiver that user is typing
            broadcastToUser(receiverId, {
              type: "typing",
              userId,
              conversationId,
              isTyping: true,
            });
            
            // Auto-stop typing after timeout
            const timeout = setTimeout(() => {
              broadcastToUser(receiverId, {
                type: "typing",
                userId,
                conversationId,
                isTyping: false,
              });
              typingUsers.delete(`${userId}_${conversationId}`);
            }, TYPING_TIMEOUT);
            
            typingUsers.set(`${userId}_${conversationId}`, timeout);
          } else if (message.type === "typing_stop") {
            // Handle typing indicator stop
            const receiverId = message.receiverId;
            const conversationId = generateConversationId(userId, receiverId);
            
            // Clear existing typing timeout
            const existingTimeout = typingUsers.get(`${userId}_${conversationId}`);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
              typingUsers.delete(`${userId}_${conversationId}`);
            }
            
            // Notify receiver that user stopped typing
            broadcastToUser(receiverId, {
              type: "typing",
              userId,
              conversationId,
              isTyping: false,
            });
          } else if (message.type === "mark_read") {
            // Mark messages as read
            const conversationId = message.conversationId;
            const messageIds = message.messageIds;
            
            if (messageIds && messageIds.length > 0) {
              // Update specific messages
              await db
                .update(messages)
                .set({
                  status: "read",
                  readAt: new Date(),
                })
                .where(
                  and(
                    inArray(messages.id, messageIds),
                    eq(messages.receiverId, userId)
                  )
                );
              
              // Notify sender about read receipt
              for (const msgId of messageIds) {
                const [msg] = await db
                  .select()
                  .from(messages)
                  .where(eq(messages.id, msgId))
                  .limit(1);
                
                if (msg) {
                  broadcastToUser(msg.senderId, {
                    type: "message_read",
                    messageId: msgId,
                    conversationId,
                    readAt: new Date().toISOString(),
                  });
                }
              }
            }
            
            // Update conversation unread count
            const [conv] = await db
              .select()
              .from(conversations)
              .where(eq(conversations.id, conversationId))
              .limit(1);
            
            if (conv) {
              const updateData = conv.participant1Id === userId
                ? { participant1UnreadCount: 0, participant1LastReadAt: new Date() }
                : { participant2UnreadCount: 0, participant2LastReadAt: new Date() };
              
              await db
                .update(conversations)
                .set(updateData)
                .where(eq(conversations.id, conversationId));
            }
            
            ws.send(JSON.stringify({ type: "marked_read", conversationId }));
          } else if (message.type === "chat") {
            // Get or create conversation
            const conversation = await getOrCreateConversation(
              userId,
              message.receiverId,
              message.listingId
            );
            
            // Create message in PostgreSQL
            const [newMessage] = await db
              .insert(messages)
              .values({
                senderId: userId,
                receiverId: message.receiverId,
                conversationId: conversation.id,
                listingId: message.listingId || null,
                content: message.content,
                messageType: message.messageType || "text",
                replyToId: message.replyToId || null,
                attachments: message.attachments || [],
              })
              .returning();
            
            // Update conversation
            const isParticipant1Receiver = conversation.participant1Id === message.receiverId;
            await db
              .update(conversations)
              .set({
                lastMessageId: newMessage.id,
                lastMessageAt: new Date(),
                updatedAt: new Date(),
                ...(isParticipant1Receiver
                  ? { participant1UnreadCount: sql`${conversations.participant1UnreadCount} + 1` }
                  : { participant2UnreadCount: sql`${conversations.participant2UnreadCount} + 1` }),
              })
              .where(eq(conversations.id, conversation.id));

            // Send to receiver if online
            const receiverOnline = broadcastToUser(message.receiverId, {
              type: "chat",
              message: {
                ...newMessage,
                sender: {
                  id: userId,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  profileImageUrl: user.profileImageUrl,
                },
              },
              conversationId: conversation.id,
            });
            
            // If receiver is online, mark as delivered
            if (receiverOnline) {
              await db
                .update(messages)
                .set({
                  status: "delivered",
                  deliveredAt: new Date(),
                })
                .where(eq(messages.id, newMessage.id));
              
              // Notify sender about delivery
              ws.send(JSON.stringify({
                type: "message_delivered",
                messageId: newMessage.id,
                conversationId: conversation.id,
                deliveredAt: new Date().toISOString(),
              }));
            }

            // Send confirmation to sender
            ws.send(JSON.stringify({
              type: "chat_sent",
              message: newMessage,
              conversationId: conversation.id,
            }));
            
            // Clear typing indicator
            const existingTimeout = typingUsers.get(`${userId}_${conversation.id}`);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
              typingUsers.delete(`${userId}_${conversation.id}`);
            }
            broadcastToUser(message.receiverId, {
              type: "typing",
              userId,
              conversationId: conversation.id,
              isTyping: false,
            });
            
            // Create notification for receiver (if not online or in background)
            try {
              const senderName = user.firstName 
                ? `${user.firstName} ${user.lastName || ''}`.trim()
                : user.username || 'Birisi';
              
              const [notification] = await db.insert(notifications).values({
                userId: message.receiverId,
                type: 'new_message',
                title: 'Yeni Mesaj',
                message: `${senderName}: ${message.content?.substring(0, 100)}${message.content?.length > 100 ? '...' : ''}`,
                link: `/mesajlar`,
                relatedId: conversation.id,
              }).returning();
              
              // Send notification via WebSocket
              broadcastToUser(message.receiverId, {
                type: "notification",
                notification: {
                  ...notification,
                  senderName,
                  senderProfileImage: user.profileImageUrl,
                },
              });
            } catch (notifError) {
              console.error("Failed to create message notification:", notifError);
            }
          } else if (message.type === "delete_message") {
            // Soft delete a message
            const messageId = message.messageId;
            
            const [msg] = await db
              .select()
              .from(messages)
              .where(and(eq(messages.id, messageId), eq(messages.senderId, userId)))
              .limit(1);
            
            if (msg) {
              await db
                .update(messages)
                .set({
                  isDeleted: true,
                  deletedAt: new Date(),
                  content: "Bu mesaj silindi",
                })
                .where(eq(messages.id, messageId));
              
              // Notify receiver
              broadcastToUser(msg.receiverId, {
                type: "message_deleted",
                messageId,
                conversationId: msg.conversationId,
              });
              
              ws.send(JSON.stringify({
                type: "message_deleted",
                messageId,
                conversationId: msg.conversationId,
              }));
            }
          } else if (message.type === "edit_message") {
            // Edit a message
            const messageId = message.messageId;
            const newContent = message.content;
            
            const [msg] = await db
              .select()
              .from(messages)
              .where(and(eq(messages.id, messageId), eq(messages.senderId, userId)))
              .limit(1);
            
            if (msg && !msg.isDeleted) {
              await db
                .update(messages)
                .set({
                  content: newContent,
                  isEdited: true,
                  editedAt: new Date(),
                })
                .where(eq(messages.id, messageId));
              
              // Notify receiver
              broadcastToUser(msg.receiverId, {
                type: "message_edited",
                messageId,
                conversationId: msg.conversationId,
                newContent,
                editedAt: new Date().toISOString(),
              });
              
              ws.send(JSON.stringify({
                type: "message_edited",
                messageId,
                conversationId: msg.conversationId,
                newContent,
                editedAt: new Date().toISOString(),
              }));
            }
          } else if (message.type === "get_presence") {
            // Get presence status for a user
            const targetUserId = message.userId;
            const [presence] = await db
              .select()
              .from(userPresence)
              .where(eq(userPresence.userId, targetUserId))
              .limit(1);
            
            ws.send(JSON.stringify({
              type: "presence",
              userId: targetUserId,
              isOnline: presence?.isOnline || false,
              lastSeenAt: presence?.lastSeenAt?.toISOString() || null,
            }));
          } else if (message.type === "bid") {
            // Handle auction bid - Get auction from PostgreSQL
            const [auction] = await db
              .select()
              .from(auctions)
              .where(eq(auctions.id, message.auctionId))
              .limit(1);
            
            if (!auction) {
              ws.send(JSON.stringify({ type: "error", message: "Auction not found" }));
              return;
            }

            const bidAmount = parseFloat(message.amount);
            const currentPrice = parseFloat(auction.currentPrice);
            const minIncrement = parseFloat(auction.minIncrement);

            if (bidAmount < currentPrice + minIncrement) {
              ws.send(JSON.stringify({
                type: "error",
                message: `Minimum bid is ₺${(currentPrice + minIncrement).toFixed(2)}`,
              }));
              return;
            }

            // Create bid in PostgreSQL
            const [bid] = await db
              .insert(bids)
              .values({
                auctionId: message.auctionId,
                bidderId: userId,
                amount: message.amount,
              })
              .returning();

            // Broadcast bid only to clients subscribed to this auction
            for (const clientInfo of Array.from(clients.values())) {
              if (clientInfo.ws.readyState === WebSocket.OPEN && clientInfo.auctionId === message.auctionId) {
                clientInfo.ws.send(JSON.stringify({
                  type: "new_bid",
                  bid: {
                    id: bid.id,
                    auctionId: bid.auctionId,
                    bidderId: bid.bidderId,
                    amount: bid.amount,
                    createdAt: bid.createdAt,
                  },
                  auctionId: message.auctionId,
                }));
              }
            }
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
        }
      });

      ws.on("pong", () => {
        resetTimeout(); // Reset timeout on pong
      });
      
      ws.on("close", async () => {
        clients.delete(userId);
        clearInterval(heartbeat);
        heartbeats.delete(userId);
        clearTimeout(idleTimeout);
        
        // Update user presence to offline
        await updateUserPresence(userId, false);
        
        // Notify contacts that user is offline
        const userConvs = await db
          .select()
          .from(conversations)
          .where(
            or(
              eq(conversations.participant1Id, userId),
              eq(conversations.participant2Id, userId)
            )
          );
        
        for (const conv of userConvs) {
          const partnerId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
          broadcastToUser(partnerId, {
            type: "presence",
            userId,
            isOnline: false,
            lastSeenAt: new Date().toISOString(),
          });
        }
        
        // Clear any typing indicators for this user
        for (const [key, timeout] of Array.from(typingUsers.entries())) {
          if (key.startsWith(`${userId}_`)) {
            clearTimeout(timeout);
            typingUsers.delete(key);
          }
        }
      });
      
      ws.on("error", (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
        ws.close(1011, "Internal error");
      });
  }

  // ============ Kimlik Dogrulama Rotalari (E-posta / Sifre) ============
  
  // Unified Registration (Email + Phone)
  app.post('/api/auth/register', authIpLimiter, botGuard, async (req: Request, res: Response) => {
    try {
      const { email, phone, password, firstName, lastName } = req.body;

      // Kayıt e-posta ile yapılır; telefon yalnızca opsiyonel iletişim bilgisidir.
      if (!email || !password) {
        return res.status(400).json({ message: "E-posta ve şifre gereklidir" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Şifre en az 8 karakter olmalıdır" });
      }

      // Telefon verildiyse normalize et (zorunlu değil)
      const normalizedPhone = phone
        ? (String(phone).startsWith('+90') ? String(phone) : String(phone).replace(/^0/, '+90'))
        : null;

      // Check if user already exists with email
      const existingEmailUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingEmailUser) {
        return res.status(400).json({ message: "Bu email adresi zaten kayıtlı" });
      }

      // Telefon verildiyse başkasında kayıtlı olmasın
      if (normalizedPhone) {
        const existingPhoneUser = await db.query.users.findFirst({
          where: eq(users.phone, normalizedPhone),
        });

        if (existingPhoneUser) {
          return res.status(400).json({ message: "Bu telefon numarası zaten kayıtlı" });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate verification token for email
      const verificationToken = generateVerificationToken();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Resend yapılandırılmamışsa (geliştirme) hesabı doğrudan doğrulanmış say
      const autoVerify = shouldAutoVerifyEmail();

      const [newUser] = await db
        .insert(users)
        .values({
          email,
          phone: normalizedPhone,
          password: hashedPassword,
          firstName: firstName || null,
          lastName: lastName || null,
          emailVerified: autoVerify,
          verificationToken: autoVerify ? null : verificationToken,
          verificationTokenExpiry: autoVerify ? null : verificationTokenExpiry,
        })
        .returning();

      // Doğrulama e-postasını Resend ile gönder.
      // Gönderim başarısız olsa bile kayıt geçerlidir — kullanıcı daha sonra
      // "yeniden gönder" ile tekrar isteyebilir.
      if (!autoVerify) {
        try {
          await emailService.sendVerificationEmail(
            email,
            verificationToken,
            firstName || email.split('@')[0]
          );
        } catch (mailError) {
          console.error("Doğrulama e-postası gönderilemedi:", mailError);
        }
      }

      res.status(201).json({
        message: autoVerify
          ? "Kayıt başarılı! Giriş yapabilirsiniz."
          : "Kayıt başarılı! E-posta adresinize doğrulama bağlantısı gönderdik.",
        userId: newUser.id,
        requiresEmailVerification: !autoVerify,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Kayıt sırasında bir hata oluştu" });
    }
  });

  // Unified Login (Email or Phone + Password)
  app.post('/api/auth/login', authIpLimiter, async (req: Request, res: Response) => {
    try {
      const { identifier, emailOrUsername, password } = req.body;
      
      // Support both old and new field names
      const loginIdentifier = identifier || emailOrUsername;

      if (!loginIdentifier || !password) {
        return res.status(400).json({ message: "Email/telefon ve şifre gereklidir" });
      }


      // Normalize identifier - check if it looks like a phone number
      let normalizedIdentifier = loginIdentifier;
      const isPhone = /^[\d\s\+\-\(\)]+$/.test(loginIdentifier.replace(/\s/g, '')) && 
                     loginIdentifier.replace(/\D/g, '').length >= 10;
      
      if (isPhone) {
        // Normalize phone number
        const digits = loginIdentifier.replace(/\D/g, '');
        normalizedIdentifier = digits.startsWith('90') ? `+${digits}` : `+90${digits.replace(/^0/, '')}`;
      }

      // Find user by email, phone, or username
      const user = await db.query.users.findFirst({
        where: or(
          eq(users.email, loginIdentifier),
          eq(users.phone, normalizedIdentifier),
          eq(users.username, loginIdentifier)
        ),
      });

      if (!user || !user.password) {
        return res.status(401).json({ message: "Hatalı email/kullanıcı adı veya şifre" });
      }

      // Şifre deneme saldırısına karşı HESAP bazlı kilit.
      //
      // IP yerine hesap sayılıyor: Türkiye'de mobil operatörler CGNAT
      // kullandığı için binlerce abone aynı genel IP'den çıkar; IP bazlı bir
      // kilit masum kullanıcıları toplu hâlde engellerdi. Hesap bazlı sayaç
      // hem onları etkilemez hem de saldırgan IP değiştirse bile durur.
      //
      // Şifre karşılaştırmasından ÖNCE bakılıyor ki kilitli hesapta boşuna
      // bcrypt maliyeti ödenmesin.
      if ((await recentFailedLogins(user.id)) >= LOGIN_FAIL_LIMIT) {
        return res.status(429).json({
          message:
            "Bu hesap için çok fazla hatalı giriş denendi. Lütfen 15 dakika sonra tekrar deneyin veya şifrenizi sıfırlayın.",
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        // Bu kayıt hem denetim geçmişi hem de yukarıdaki kilidin sayacıdır.
        await recordLoginHistory(user.id, req, false, isPhone ? 'phone' : 'email', 'Hatalı şifre');
        return res.status(401).json({ message: "Hatalı email/kullanıcı adı veya şifre" });
      }

      // Hesap durumu — yasaklı/askıya alınmış kullanıcı giriş yapamaz.
      // (Şifre doğrulandıktan SONRA kontrol ediliyor ki hesap durumu
      //  kimlik doğrulamadan sızdırılmasın.)
      if (user.status === "banned" || user.status === "suspended") {
        await recordLoginHistory(
          user.id, req, false, isPhone ? 'phone' : 'email',
          `Hesap durumu: ${user.status}`
        );
        return res.status(403).json({
          message:
            user.status === "banned"
              ? "Hesabınız askıya alınmıştır. İtiraz için destek ile iletişime geçin."
              : "Hesabınız geçici olarak durdurulmuştur. Destek ile iletişime geçin.",
          status: user.status,
          reason: user.statusReason || undefined,
        });
      }

      // Log user in by creating session
      //
      // `role` oturuma yazılır: rotaların çoğu sahiplik kontrolünü
      // `listing.sellerId !== userId && req.user.role !== "admin"` biçiminde
      // yapıyor, veteriner/nakliyeci uçları da `req.user.role`a bakıyor.
      // Oturumda bu alan olmadığı sürece hepsi `undefined` okuyup herkesi
      // reddediyordu (veteriner ve nakliyeci panelleri tamamen kullanılamazdı,
      // yöneticiler başkasının ilanını yönetemiyordu).
      //
      // Bayatlama riski yok: rol değiştirildiğinde veya hesap askıya
      // alındığında kullanıcının oturumları veritabanından siliniyor
      // (aşağıda /api/admin/users/:id/role ve /status uçlarına bakınız).
      (req as any).login({ claims: { sub: user.id }, role: user.role }, async (err: any) => {
        if (err) {
          console.error("Session creation error:", err);
          await recordLoginHistory(user.id, req, false, isPhone ? 'phone' : 'email', 'Oturum oluşturulamadı');
          return res.status(500).json({ message: "Giriş sırasında bir hata oluştu" });
        }

        // Record successful login and register device
        await recordLoginHistory(user.id, req, true, isPhone ? 'phone' : 'email');
        await registerDevice(user.id, req);

        res.json({
          message: "Giriş başarılı!",
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            emailVerified: user.emailVerified,
          },
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Giriş sırasında bir hata oluştu" });
    }
  });

  // Forgot Password
  app.post('/api/auth/forgot-password', createLimiter, async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email gereklidir" });
      }

      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ message: "Eğer bu email kayıtlıysa, şifre sıfırlama linki gönderildi" });
      }

      // Generate reset token
      const resetToken = generateVerificationToken();
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Save reset token
      await db
        .update(users)
        .set({ resetToken, resetTokenExpiry })
        .where(eq(users.id, user.id));

      // Send password reset email
      await emailService.sendPasswordResetEmail(
        email,
        resetToken,
        user.username || user.firstName || email.split('@')[0]
      );

      res.json({ message: "Eğer bu email kayıtlıysa, şifre sıfırlama linki gönderildi" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Bir hata oluştu. Lütfen tekrar deneyin." });
    }
  });

  // Reset Password
  app.post('/api/auth/reset-password', createLimiter, async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token ve yeni şifre gereklidir" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Şifre en az 8 karakter olmalıdır" });
      }

      // Find user with valid reset token
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.resetToken, token),
          gte(users.resetTokenExpiry!, new Date())
        ),
      });

      if (!user) {
        return res.status(400).json({ message: "Geçersiz veya süresi dolmuş token" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      await db
        .update(users)
        .set({
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        })
        .where(eq(users.id, user.id));

      res.json({ message: "Şifreniz başarıyla güncellendi" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Bir hata oluştu. Lütfen tekrar deneyin." });
    }
  });



  // Verify Email
  app.get('/api/auth/verify-email', async (req: Request, res: Response) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Geçersiz doğrulama linki" });
      }

      // Find user with valid verification token
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.verificationToken, token),
          gte(users.verificationTokenExpiry!, new Date())
        ),
      });

      if (!user) {
        return res.status(400).json({ message: "Geçersiz veya süresi dolmuş doğrulama linki" });
      }

      // Verify email
      await db
        .update(users)
        .set({
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        })
        .where(eq(users.id, user.id));

      res.json({ message: "Email adresiniz başarıyla doğrulandı!" });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Bir hata oluştu. Lütfen tekrar deneyin." });
    }
  });

  // Resend Email Verification
  app.post('/api/auth/resend-verification', isAuthenticated, createLimiter, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);

      // Get current user
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!currentUser) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }

      if (currentUser.emailVerified) {
        return res.status(400).json({ message: "E-posta adresiniz zaten doğrulanmış" });
      }

      if (!currentUser.email) {
        return res.status(400).json({ message: "Hesabınızda e-posta adresi bulunamadı" });
      }

      // Check if we recently sent a verification email (rate limit)
      if (currentUser.verificationTokenExpiry) {
        const expiryTime = new Date(currentUser.verificationTokenExpiry);
        const createdTime = new Date(expiryTime.getTime() - 24 * 60 * 60 * 1000); // Token was created 24 hours before expiry
        const timeSinceCreation = Date.now() - createdTime.getTime();
        const oneMinute = 60 * 1000;
        
        if (timeSinceCreation < oneMinute) {
          return res.status(429).json({ 
            message: "Lütfen 1 dakika bekleyip tekrar deneyin",
            retryAfter: Math.ceil((oneMinute - timeSinceCreation) / 1000)
          });
        }
      }

      // Generate new verification token
      const verificationToken = generateVerificationToken();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with new token
      await db
        .update(users)
        .set({
          verificationToken,
          verificationTokenExpiry,
        })
        .where(eq(users.id, userId));

      // Check if auto-verify is enabled (development mode)
      if (shouldAutoVerifyEmail()) {
        // In development, auto-verify the email
        await db
          .update(users)
          .set({
            emailVerified: true,
            verificationToken: null,
            verificationTokenExpiry: null,
          })
          .where(eq(users.id, userId));

        return res.json({ 
          message: "Geliştirme modunda: E-posta otomatik doğrulandı",
          autoVerified: true
        });
      }

      // Doğrulama e-postasını gönder.
      // İmza: sendVerificationEmail(alıcı, token, isim) — bağlantıyı servis üretir.
      await emailService.sendVerificationEmail(
        currentUser.email,
        verificationToken,
        currentUser.firstName || currentUser.email.split('@')[0]
      );

      res.json({ 
        message: "Doğrulama e-postası gönderildi. Lütfen gelen kutunuzu kontrol edin.",
        emailSent: true
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "E-posta gönderilirken bir hata oluştu" });
    }
  });

  // ============ Phone Authentication Routes ============






  // Get current user (works for both auth methods)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      let user;
      
      // Priority 1: dbUserId (OAuth with dbUserId)
      if (req.user.dbUserId) {
        user = await storage.getUser(req.user.dbUserId);
      }
      
      // Priority 2: Traditional auth (claims.sub)
      if (!user && req.user.claims?.sub) {
        user = await storage.getUser(req.user.claims.sub);
      }
      
      // Priority 3: OAuth fallback - find by email
      if (!user && req.user.claims?.email) {
        user = await storage.getUserByEmail(req.user.claims.email);
      }
      
      // Priority 4: Direct id field
      if (!user && req.user.id) {
        user = await storage.getUser(req.user.id);
      }
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      res.json(sanitizeUser(user));
    } catch {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Update user profile
  app.patch('/api/auth/profile', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Kullanıcı bulunamadı" });
      }

      const { firstName, lastName, phone, city, district, bio, profileImageUrl } = req.body;

      // Validate phone format if provided
      if (phone && !/^[0-9+\-\s()]{10,20}$/.test(phone)) {
        return res.status(400).json({ message: "Geçersiz telefon numarası formatı" });
      }

      // Update user profile
      const [updatedUser] = await db
        .update(users)
        .set({
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          phone: phone || undefined,
          city: city || undefined,
          district: district || undefined,
          bio: bio || undefined,
          profileImageUrl: profileImageUrl || undefined,
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }

      // Kullanicinin kendisine donuyor; e-posta gorunebilir ama dogrulama ve
      // sifirlama token'lari yanitta yer almamali.
      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Profil güncellenirken bir hata oluştu" });
    }
  });

  // Change password
  app.post('/api/auth/change-password', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Kullanıcı bulunamadı" });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Mevcut ve yeni şifre gereklidir" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Yeni şifre en az 8 karakter olmalıdır" });
      }

      // Get current user
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!existingUser || !existingUser.password) {
        return res.status(400).json({ message: "Bu hesap için şifre değiştirilemez" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, existingUser.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Mevcut şifre hatalı" });
      }

      // Hash and save new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId));

      res.json({ message: "Şifreniz başarıyla güncellendi" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Şifre değiştirilirken bir hata oluştu" });
    }
  });

  // ============ User Settings Routes ============
  
  // Get user settings
  app.get('/api/settings', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      
      // Get existing settings or return defaults
      const [existingSettings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);
      
      if (existingSettings) {
        return res.json(existingSettings);
      }
      
      // Return default settings if none exist
      res.json({
        userId,
        emailNotifications: true,
        pushNotifications: true,
        notifyMessages: true,
        notifyFavorites: true,
        notifyPriceDrops: true,
        notifyListingUpdates: true,
        notifyPromotions: false,
        notifyNewsletter: false,
        showEmail: false,
        showPhone: true,
        showLocation: true,
        showOnlineStatus: true,
        allowMessages: true,
        profileVisibility: 'public',
        defaultCity: null,
        defaultDistrict: null,
        defaultCategoryId: null,
        autoRenewListings: false,
        theme: 'system',
        language: 'tr',
        currency: 'TRY',
      });
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ message: "Ayarlar yüklenirken bir hata oluştu" });
    }
  });
  
  // Update user settings (partial update)
  app.patch('/api/settings', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      
      const settingsData = req.body;
      
      // Check if settings exist
      const [existingSettings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);
      
      let updatedSettings;
      
      if (existingSettings) {
        // Update existing settings
        [updatedSettings] = await db
          .update(userSettings)
          .set({
            ...settingsData,
            updatedAt: new Date(),
          })
          .where(eq(userSettings.userId, userId))
          .returning();
      } else {
        // Create new settings
        [updatedSettings] = await db
          .insert(userSettings)
          .values({
            userId,
            ...settingsData,
          })
          .returning();
      }
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ message: "Ayarlar güncellenirken bir hata oluştu" });
    }
  });
  
  // Get user devices
  app.get('/api/settings/devices', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      
      const devices = await db
        .select()
        .from(userDevices)
        .where(eq(userDevices.userId, userId))
        .orderBy(desc(userDevices.lastActive));
      
      res.json(devices);
    } catch (error) {
      console.error("Get devices error:", error);
      res.status(500).json({ message: "Cihazlar yüklenirken bir hata oluştu" });
    }
  });
  
  // Remove a device
  app.delete('/api/settings/devices/:deviceId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      const { deviceId } = req.params;
      
      await db
        .delete(userDevices)
        .where(and(
          eq(userDevices.id, deviceId),
          eq(userDevices.userId, userId)
        ));
      
      res.json({ message: "Cihaz kaldırıldı" });
    } catch (error) {
      console.error("Remove device error:", error);
      res.status(500).json({ message: "Cihaz kaldırılırken bir hata oluştu" });
    }
  });
  
  // Get login history
  app.get('/api/settings/login-history', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      
      const history = await db
        .select()
        .from(loginHistory)
        .where(eq(loginHistory.userId, userId))
        .orderBy(desc(loginHistory.createdAt))
        .limit(50);
      
      res.json(history);
    } catch (error) {
      console.error("Get login history error:", error);
      res.status(500).json({ message: "Giriş geçmişi yüklenirken bir hata oluştu" });
    }
  });
  
  // Delete account (soft delete - requires confirmation)
  app.post('/api/settings/delete-account', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      const { confirmation, password } = req.body;
      
      if (confirmation !== 'DELETE') {
        return res.status(400).json({ message: "Hesap silme onayı gereklidir" });
      }
      
      // If user has password-based auth, verify password
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (existingUser?.password && password) {
        const isValidPassword = await bcrypt.compare(password, existingUser.password);
        if (!isValidPassword) {
          return res.status(401).json({ message: "Şifre hatalı" });
        }
      }
      
      // Initialize object storage for file deletion
      const objectStorage = new ObjectStorageService();
      
      // 1. Get all user's listings and delete their images from Object Storage
      const userListings = await db.select()
        .from(listings)
        .where(eq(listings.sellerId, userId));
      
      for (const listing of userListings) {
        // Delete listing images from Object Storage
        const listingImgs = await db.select()
          .from(listingImages)
          .where(eq(listingImages.listingId, listing.id));
        
        for (const img of listingImgs) {
          const pathsToDelete = [
            img.originalKey,
            img.thumbnailKey,
            img.mediumKey,
            img.largeKey
          ].filter(Boolean) as string[];
          await objectStorage.deleteMultipleFiles(pathsToDelete);
        }
        
        // Delete images from listing.images array if any
        if (listing.images && Array.isArray(listing.images)) {
          await objectStorage.deleteMultipleFiles(listing.images as string[]);
        }
      }
      
      // 2. Delete user profile image from Object Storage if exists
      if (existingUser?.profileImageUrl) {
        await objectStorage.deleteFile(existingUser.profileImageUrl);
      }
      
      // 3. Delete store images if user has a store
      const [userStore] = await db.select()
        .from(stores)
        .where(eq(stores.ownerId, userId))
        .limit(1);
      
      if (userStore) {
        // Delete store logo and banner
        if (userStore.logo) {
          await objectStorage.deleteFile(userStore.logo);
        }
        if (userStore.banner) {
          await objectStorage.deleteFile(userStore.banner);
        }
        
        // Delete store media
        const storeMediaItems = await db.select()
          .from(storeMedia)
          .where(eq(storeMedia.storeId, userStore.id));
        
        for (const media of storeMediaItems) {
          if (media.url) {
            await objectStorage.deleteFile(media.url);
          }
        }
      }
      
      // 4. Delete message attachments sent by this user
      const userMessages = await db.select()
        .from(messages)
        .where(eq(messages.senderId, userId));
      
      for (const msg of userMessages) {
        if (msg.attachments && Array.isArray(msg.attachments)) {
          for (const attachment of msg.attachments) {
            if (attachment && typeof attachment === 'object' && 'url' in attachment) {
              await objectStorage.deleteFile(attachment.url as string);
            }
          }
        }
      }
      
      // 5. Now delete user and related data (cascades will handle DB records)
      await db.delete(users).where(eq(users.id, userId));
      
      // Logout
      req.logout((err) => {
        if (err) {
          console.error("Logout error:", err);
        }
      });
      
      res.json({ message: "Hesabınız ve tüm verileriniz silindi" });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ message: "Hesap silinirken bir hata oluştu" });
    }
  });
  
  // Export user data
  app.get('/api/settings/export-data', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      
      // Get all user data
      const [userData] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const userListings = await db.select().from(listings).where(eq(listings.sellerId, userId));
      const userFavorites = await db.select().from(favorites).where(eq(favorites.userId, userId));
      const userMessages = await db.select().from(messages).where(
        or(eq(messages.senderId, userId), eq(messages.receiverId, userId))
      );
      const userSettings_ = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
      
      // Remove sensitive data
      if (userData) {
        delete (userData as any).password;
        delete (userData as any).verificationToken;
        delete (userData as any).resetToken;
      }
      
      const exportData = {
        user: userData,
        listings: userListings,
        favorites: userFavorites,
        messages: userMessages,
        settings: userSettings_,
        exportedAt: new Date().toISOString(),
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error("Export data error:", error);
      res.status(500).json({ message: "Veri dışa aktarılırken bir hata oluştu" });
    }
  });

  // ============ Category Routes ============
  // Get main categories (depth=0) for homepage
  app.get("/api/categories/main", async (_req: Request, res: Response) => {
    try {
      const mainCategories = await db
        .select()
        .from(categories)
        .where(eq(categories.depth, 0))
        .orderBy(categories.order);
      
      res.json(mainCategories);
    } catch (error) {
      console.error("Error fetching main categories:", error);
      res.status(500).json({ message: "Failed to fetch main categories" });
    }
  });

  // Get category statistics (listing count per category) - BEFORE parametric routes
  app.get("/api/categories/stats", async (_req: Request, res: Response) => {
    try {
      // Get listing counts per category
      const stats = await db
        .select({
          categoryId: listings.categoryId,
          count: count(),
        })
        .from(listings)
        .where(eq(listings.status, 'active'))
        .groupBy(listings.categoryId);

      res.json(stats);
    } catch (error) {
      console.error("Error fetching category stats:", error);
      res.status(500).json({ message: "Failed to fetch category stats" });
    }
  });

  app.get("/api/categories", async (_req: Request, res: Response) => {
    try {
      // Disable browser caching to ensure fresh data
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Check cache first (24h TTL - categories rarely change)
      const cacheKey = cacheKeys.categories();
      const cached = await cache.get<any[]>(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }
      
      // Get all categories from PostgreSQL, ordered by order
      const allCategories = await db
        .select()
        .from(categories)
        .orderBy(categories.order);
      
      // Cache for 24 hours
      await cache.set(cacheKey, allCategories, cacheTTL.categories);
      
      res.json(allCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  
  app.get("/api/categories/tree", async (_req: Request, res: Response) => {
    try {
      // Disable browser caching to ensure fresh data
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Check cache first (24h TTL - tree structure rarely changes)
      const cacheKey = cacheKeys.categoryTree();
      const cached = await cache.get<any[]>(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }
      
      // Get all categories from PostgreSQL
      const allCategories = await db
        .select()
        .from(categories)
        .orderBy(categories.order);
      
      // Build tree structure
      const categoryMap = new Map();
      const rootCategories: any[] = [];
      
      // First pass: create map of all categories
      allCategories.forEach(cat => {
        categoryMap.set(cat.id, { ...cat, children: [] });
      });
      
      // Second pass: build tree
      allCategories.forEach(cat => {
        const categoryNode = categoryMap.get(cat.id);
        if (cat.parentId === null) {
          rootCategories.push(categoryNode);
        } else {
          const parent = categoryMap.get(cat.parentId);
          if (parent) {
            parent.children.push(categoryNode);
          }
        }
      });
      
      // Cache for 24 hours
      await cache.set(cacheKey, rootCategories, cacheTTL.categories);
      
      res.json(rootCategories);
    } catch (error) {
      console.error("Failed to fetch category tree:", error);
      res.status(500).json({ message: "Failed to fetch category tree" });
    }
  });

  app.get("/api/categories/:slug", async (req: Request, res: Response) => {
    try {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, req.params.slug))
        .limit(1);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Fetch child categories
      const childCategories = await db
        .select()
        .from(categories)
        .where(eq(categories.parentId, category.id))
        .orderBy(categories.order);

      // Recursively fetch grandchildren for each child
      const categoryWithChildren = {
        ...category,
        children: await Promise.all(
          childCategories.map(async (child) => {
            const grandchildren = await db
              .select()
              .from(categories)
              .where(eq(categories.parentId, child.id))
              .orderBy(categories.order);
            
            return {
              ...child,
              children: grandchildren,
            };
          })
        ),
      };

      res.json(categoryWithChildren);
    } catch (error) {
      console.error("Failed to fetch category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // ============ Legal Compliance: Document Requirements ============
  // Get document requirements for a category
  /**
   * Kategoriye ait yasal satış kısıtlamaları.
   *
   * Bu uç eskiden belge gereksinimlerini de döndürüyordu (adı
   * "document-requirements" idi). Belge özelliği kaldırıldı; kısıtlamalar ise
   * KALDI çünkü ayrı bir konudur: koruma altındaki türlerin satışı 5199 sayılı
   * Hayvanları Koruma Kanunu kapsamında yasaktır ve kullanıcı ilan vermeden
   * önce uyarılmalıdır. İkisinin aynı uçta servis edilmesi tesadüftü.
   */
  app.get("/api/categories/:slug/restrictions", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;

      const kisitlamalar = await db
        .select()
        .from(restrictedCategories)
        .where(and(
          eq(restrictedCategories.categorySlug, slug),
          eq(restrictedCategories.isActive, true)
        ));

      // Üst kategoriden devralınan kısıtlamalar da geçerlidir: üst kategori
      // kısıtlıysa altındaki her tür de kısıtlıdır.
      const [kategori] = await db
        .select({ path: categories.path })
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);

      const atalar = Array.isArray(kategori?.path) ? (kategori.path as string[]) : [];
      let devralinan: typeof kisitlamalar = [];

      if (atalar.length > 0) {
        const atalarinSluglari = await db
          .select({ slug: categories.slug })
          .from(categories)
          .where(inArray(categories.id, atalar));

        if (atalarinSluglari.length > 0) {
          devralinan = await db
            .select()
            .from(restrictedCategories)
            .where(and(
              inArray(restrictedCategories.categorySlug, atalarinSluglari.map((a) => a.slug)),
              eq(restrictedCategories.isActive, true)
            ));
        }
      }

      res.json({ restrictions: [...kisitlamalar, ...devralinan], categorySlug: slug });
    } catch (error) {
      console.error("Kategori kısıtlamaları alınamadı:", error);
      res.status(500).json({ message: "Kategori kısıtlamaları alınamadı" });
    }
  });

  // Get all document requirements (for admin)

  // Get pending documents for admin verification

  // Verify or reject a document (admin only)
  
  // ============ Location Routes ============
  app.get("/api/locations", async (req: Request, res: Response) => {
    try {
      const { type, parent } = req.query;
      
      let query = db.select().from(locations);
      
      const conditions = [];
      
      // Filter by parent - ONLY if parent parameter is explicitly provided
      if (parent !== undefined) {
        if (parent === null || parent === '') {
          conditions.push(isNull(locations.parentId));
        } else {
          conditions.push(eq(locations.parentId, parent as string));
        }
      }
      
      // Filter by type
      if (type) {
        conditions.push(eq(locations.type, type as "il" | "ilce" | "mahalle" | "koy"));
      }
      
      const result = await query.where(conditions.length > 0 ? and(...conditions) : undefined);
      res.json(result);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  // ============ Listing Routes ============
  // Note: No auth required for browsing listings (guest access)
  // Kullanici giris yapmissa req.user oturumdan doldurulur
  // ── Arama Önerileri (Autocomplete) ──────────────────────────────────────
  app.get("/api/search/suggestions", async (req: Request, res: Response) => {
    try {
      const q = (req.query.q as string || "").trim();
      if (!q || q.length < 2) return res.json({ listings: [], categories: [] });

      const [listingSuggestions, categorySuggestions] = await Promise.all([
        db
          .select({ id: listings.id, title: listings.title, price: listings.price, city: listings.city })
          .from(listings)
          .where(and(
            sql`public.tr_normalize(${listings.title}) LIKE public.tr_normalize(${`%${q}%`})`,
            eq(listings.status, "active")
          ))
          .orderBy(desc(listings.createdAt))
          .limit(6),
        db
          .select({ id: categories.id, name: categories.name, slug: categories.slug })
          .from(categories)
          .where(sql`public.tr_normalize(${categories.name}) LIKE public.tr_normalize(${`%${q}%`})`)
          .limit(4),
      ]);

      res.json({ listings: listingSuggestions, categories: categorySuggestions });
    } catch (err) {
      res.json({ listings: [], categories: [] });
    }
  });

  app.get("/api/listings", async (req: Request, res: Response) => {
    try {
      const { 
        page = '1', 
        limit = '50', 
        categoryId, 
        city, 
        district,
        minPrice, 
        maxPrice, 
        status, 
        search,
        // Advanced filters
        minAge,
        maxAge,
        ageCategory,
        gender,
        breed,
        healthStatus,
        vaccinated,
        neutered,
        pedigree,
        characterTraits,
        // Sorting
        sortBy,
        sortOrder,
      } = req.query;
      
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50)); // Max 100
      const offset = (pageNum - 1) * limitNum;
      
      // Build query conditions
      const conditions = [];
      
      if (categoryId) {
        // Get all categories from cache or DB (single query)
        const cacheKey = cacheKeys.categories();
        let allCategories = await cache.get<any[]>(cacheKey);
        
        if (!allCategories) {
          allCategories = await db
            .select()
            .from(categories)
            .orderBy(categories.order);
          await cache.set(cacheKey, allCategories, cacheTTL.categories);
        }
        
        // Build in-memory parent-child map
        const childMap = new Map<string, string[]>();
        allCategories.forEach(cat => {
          if (cat.parentId) {
            const siblings = childMap.get(cat.parentId) || [];
            siblings.push(cat.id);
            childMap.set(cat.parentId, siblings);
          }
        });
        
        // Get all descendant IDs (in-memory recursive traversal)
        const getAllDescendants = (catId: string): string[] => {
          const children = childMap.get(catId) || [];
          let descendants = [catId]; // Include the category itself
          for (const childId of children) {
            descendants = [...descendants, ...getAllDescendants(childId)];
          }
          return descendants;
        };
        
        const categoryIds = getAllDescendants(categoryId as string);
        
        // Filter by category OR any of its descendants
        if (categoryIds.length > 1) {
          conditions.push(inArray(listings.categoryId, categoryIds));
        } else {
          conditions.push(eq(listings.categoryId, categoryId as string));
        }
      }
      
      if (city) {
        conditions.push(eq(listings.city, city as string));
      }
      
      if (district) {
        conditions.push(eq(listings.district, district as string));
      }
      
      if (status) {
        conditions.push(eq(listings.status, status as any));
      } else {
        // Default: only show active listings
        conditions.push(eq(listings.status, 'active'));
      }
      
      if (minPrice) {
        const minPriceNum = parseFloat(minPrice as string);
        if (!isNaN(minPriceNum)) {
          conditions.push(gte(listings.price, minPriceNum.toString()));
        }
      }
      
      if (maxPrice) {
        const maxPriceNum = parseFloat(maxPrice as string);
        if (!isNaN(maxPriceNum)) {
          conditions.push(lte(listings.price, maxPriceNum.toString()));
        }
      }
      
      if (search) {
        /*
         * Türkçe arama: iki taraf da `tr_normalize` ile sadeleştiriliyor
         * (küçük harf + aksan kaldırma). Önceden düz `ILIKE` kullanılıyordu
         * ve telefonda Türkçe karakter yazmayan kullanıcı hiçbir şey
         * bulamıyordu: "kopek" araması "Köpek yavrusu" ilanını getirmiyordu.
         *
         * Fonksiyon IMMUTABLE olduğu için trigram (pg_trgm) indeksleri bu
         * karşılaştırmada kullanılabiliyor; baştaki `%` yüzünden B-tree'nin
         * yapamadığı şey budur. Tanım: scripts/sql/turkce-arama.sql
         */
        const searchTerm = `%${search}%`;
        conditions.push(
          sql`(
            public.tr_normalize(${listings.title}) LIKE public.tr_normalize(${searchTerm})
            OR public.tr_normalize(${listings.description}) LIKE public.tr_normalize(${searchTerm})
            OR public.tr_normalize(coalesce(${listings.breed}, '')) LIKE public.tr_normalize(${searchTerm})
          )`
        );
      }
      
      // Advanced filters (with sanitization)
      if (minAge) {
        const minAgeNum = parseInt(minAge as string, 10);
        if (!isNaN(minAgeNum)) {
          conditions.push(sql`CAST(${listings.age} AS INTEGER) >= ${minAgeNum}`);
        }
      }
      
      if (maxAge) {
        const maxAgeNum = parseInt(maxAge as string, 10);
        if (!isNaN(maxAgeNum)) {
          conditions.push(sql`CAST(${listings.age} AS INTEGER) <= ${maxAgeNum}`);
        }
      }
      
      if (gender && gender !== 'all') {
        conditions.push(eq(listings.gender, gender as any));
      }
      
      if (breed && typeof breed === 'string' && breed.trim()) {
        // Irk filtresi de aksansız yazımla eşleşmeli ("kangal" / "Kangal").
        conditions.push(
          sql`public.tr_normalize(coalesce(${listings.breed}, '')) LIKE public.tr_normalize(${`%${breed}%`})`
        );
      }
      
      if (healthStatus && healthStatus !== 'all') {
        conditions.push(eq(listings.healthStatus, healthStatus as any));
      }
      
      if (vaccinated !== undefined && vaccinated !== 'all') {
        const isVaccinated = vaccinated === 'true' || vaccinated === '1';
        conditions.push(eq(listings.vaccinated, isVaccinated));
      }
      
      if (neutered !== undefined && neutered !== 'all') {
        const isNeutered = neutered === 'true' || neutered === '1';
        conditions.push(eq(listings.neutered, isNeutered));
      }
      
      if (pedigree !== undefined && pedigree !== 'all') {
        const hasPedigree = pedigree === 'true' || pedigree === '1';
        conditions.push(eq(listings.pedigree, hasPedigree));
      }
      
      // Age category filtering (maps to age ranges)
      if (ageCategory && ageCategory !== 'all') {
        const ageRanges: Record<string, [number, number]> = {
          '0-3-ay': [0, 3],
          '3-6-ay': [3, 6],
          '6-12-ay': [6, 12],
          '1-3-yas': [12, 36],
          '3-7-yas': [36, 84],
          '7-plus-yas': [84, 999],
        };
        const range = ageRanges[ageCategory as string];
        if (range) {
          // Check if age field contains the category value or falls in the range
          conditions.push(
            sql`(${listings.age} = ${ageCategory} OR 
                (${listings.age} ~ '^[0-9]+$' AND CAST(${listings.age} AS INTEGER) >= ${range[0]} AND CAST(${listings.age} AS INTEGER) < ${range[1]}))`
          );
        }
      }
      
      // Character traits filtering (JSONB array contains)
      if (characterTraits) {
        // Parse traits from query - handle both array format and comma-separated string
        let traitsArray: string[] = [];
        if (Array.isArray(characterTraits)) {
          traitsArray = characterTraits.filter((t): t is string => typeof t === 'string' && !!t.trim());
        } else if (typeof characterTraits === 'string' && characterTraits.trim()) {
          traitsArray = characterTraits.split(',').map(t => t.trim()).filter(Boolean);
        }
        
        // Filter listings that have ANY of the selected traits using JSONB @> operator
        // Check if the characterTraits column contains any of the selected traits
        if (traitsArray.length > 0) {
          const traitConditions = traitsArray.map(trait => 
            sql`${listings.characterTraits}::jsonb @> ${JSON.stringify([trait])}::jsonb`
          );
          conditions.push(sql`(${sql.join(traitConditions, sql` OR `)})`);
        }
      }
      
      // Filter out undefined conditions before applying
      const validConditions = conditions.filter(Boolean);
      
      // Get total count
      const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(listings)
        .where(validConditions.length > 0 ? and(...validConditions) : undefined);
      
      // Build sort order — strict allowlist to prevent injection
      type SortColumn = 'createdAt' | 'price' | 'views';
      const ALLOWED_SORT_COLUMNS: Record<string, SortColumn> = {
        createdAt: 'createdAt',
        price: 'price',
        views: 'views',
      };
      const ALLOWED_SORT_ORDERS = new Set(['asc', 'desc']);

      const sortCol: SortColumn = (typeof sortBy === 'string' && ALLOWED_SORT_COLUMNS[sortBy])
        ? ALLOWED_SORT_COLUMNS[sortBy]
        : 'createdAt';
      const sortDir = (typeof sortOrder === 'string' && ALLOWED_SORT_ORDERS.has(sortOrder))
        ? sortOrder
        : 'desc';

      const sortExpression =
        sortCol === 'price'
          ? (sortDir === 'asc' ? asc(listings.price) : desc(listings.price))
          : sortCol === 'views'
          ? (sortDir === 'asc' ? asc(listings.views) : desc(listings.views))
          : (sortDir === 'asc' ? asc(listings.createdAt) : desc(listings.createdAt));

      // Get paginated listings
      const listingsData = await db
        .select({
          listing: listings,
          store: {
            id: stores.id,
            slug: stores.slug,
            displayName: stores.displayName,
            logo: stores.logo,
          },
        })
        .from(listings)
        .leftJoin(stores, eq(listings.storeId, stores.id))
        .where(validConditions.length > 0 ? and(...validConditions) : undefined)
        .orderBy(sortExpression)
        .limit(limitNum)
        .offset(offset);
      
      // Flatten the results to match expected shape
      const flattenedListings = listingsData.map(row => ({
        ...row.listing,
        store: row.store?.id ? row.store : null,
      }));
      
      // If user is authenticated, check favorites
      let listingsWithFavorites = flattenedListings;
      if (req.user) {
        // Get favorites from PostgreSQL
        const userFavorites = await db
          .select()
          .from(favorites)
          .where(eq(favorites.userId, getUserId(req.user)));
        
        const favoriteIds = new Set(userFavorites.map(f => f.listingId));
        
        listingsWithFavorites = flattenedListings.map(listing => ({
          ...listing,
          isFavorite: favoriteIds.has(listing.id),
        }));
      }
      
      res.json({
        data: listingsWithFavorites,
        total: Number(totalCount),
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(Number(totalCount) / limitNum),
      });
    } catch (error) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  // Get hot/trending listings (most viewed/favorited in last 7 days)
  app.get("/api/listings/hot", async (_req: Request, res: Response) => {
    try {
      const cacheKey = cacheKeys.hotListings();
      const cached = await cache.get<any[]>(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      // Get listings sorted by views (last 7 days would need createdAt filter)
      const hotListings = await db
        .select()
        .from(listings)
        .where(eq(listings.status, 'active'))
        .orderBy(desc(listings.views))
        .limit(12);

      await cache.set(cacheKey, hotListings, cacheTTL.hotListings);
      res.json(hotListings);
    } catch (error) {
      console.error("Error fetching hot listings:", error);
      res.status(500).json({ message: "Failed to fetch hot listings" });
    }
  });

  // Get similar listings (same category, excluding current listing)
  app.get("/api/listings/:id/similar", async (req: Request, res: Response) => {
    try {
      const [currentListing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, req.params.id))
        .limit(1);

      if (!currentListing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      // Get similar listings from same category
      const similarListings = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.categoryId, currentListing.categoryId),
            eq(listings.status, 'active'),
            sql`${listings.id} != ${req.params.id}` // Exclude current listing
          )
        )
        .orderBy(desc(listings.views))
        .limit(8);

      res.json(similarListings);
    } catch (error) {
      console.error("Error fetching similar listings:", error);
      res.status(500).json({ message: "Failed to fetch similar listings" });
    }
  });

  // Note: No auth required for viewing listing details (guest access)
  // Kullanici giris yapmissa req.user oturumdan doldurulur
  /**
   * `/api/listings/...` altındaki SABİT yollar — `:id` kalıbı bunları yutmamalı.
   *
   * Express rotaları kayıt sırasına göre eşleştirir. `/api/listings/:id` bu
   * dosyada 2837. satırda tanımlı; `mine` (3377), `compare` (5135) ve `drafts`
   * (7188) ise çok daha aşağıda. Dolayısıyla `/api/listings/compare` isteği
   * `:id = "compare"` olarak buraya düşüyor, o kimlikte bir ilan bulunamıyor ve
   * 404 dönüyordu. Üç uç da erişilemez durumdaydı; karşılaştırma özelliği
   * (compare-bar.tsx, compare.tsx) bu yüzden hiç çalışmıyordu.
   *
   * Rotaları yukarı taşımak yerine buraya bir geçiş kapısı konuldu: bu isimler
   * geldiğinde `next()` çağrılıp sıradaki rotalara devredilir. Böylece 8000
   * satırlık dosyada büyük blokları yer değiştirmek gerekmiyor.
   *
   * YENİ bir `/api/listings/<sabit-ad>` ucu eklerken adı bu listeye de ekleyin,
   * yoksa sessizce 404 döner.
   */
  const LISTE_SABIT_YOLLARI = new Set(["mine", "compare", "drafts", "hot"]);

  app.get("/api/listings/:id", async (req: Request, res: Response, next: NextFunction) => {
    if (LISTE_SABIT_YOLLARI.has(req.params.id)) return next();
    try {
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, req.params.id))
        .limit(1);

      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      // Increment views
      await db
        .update(listings)
        .set({ views: sql`${listings.views} + 1` })
        .where(eq(listings.id, req.params.id));

      // Get seller info from PostgreSQL
      const [seller] = await db
        .select()
        .from(users)
        .where(eq(users.id, listing.sellerId))
        .limit(1);

      // Get category info
      let categoryInfo = null;
      if (listing.categoryId) {
        const [category] = await db
          .select()
          .from(categories)
          .where(eq(categories.id, listing.categoryId))
          .limit(1);
        categoryInfo = category || null;
      }

      // Get store info if listing is from a store
      let storeInfo = null;
      if (listing.storeId) {
        const [store] = await db
          .select({
            id: stores.id,
            slug: stores.slug,
            displayName: stores.displayName,
            logo: stores.logo,
          })
          .from(stores)
          .where(eq(stores.id, listing.storeId))
          .limit(1);
        storeInfo = store || null;
      }

      // Check if favorited
      let isFavorite = false;
      if (req.user) {
        const [favorite] = await db
          .select()
          .from(favorites)
          .where(
            and(
              eq(favorites.userId, getUserId(req.user)),
              eq(favorites.listingId, listing.id)
            )
          )
          .limit(1);
        
        isFavorite = !!favorite;
      }

      /*
       * Satıcı bilgisi BEYAZ LİSTE ile döndürülüyor.
       *
       * Burada eskiden yalnızca `password` çıkarılıyor, kullanıcı kaydının
       * geri kalanı OLDUĞU GİBİ herkese açık ilan detayında yayımlanıyordu.
       * Sızan alanlar arasında `resetToken` de vardı: bu, şifre sıfırlama
       * bağlantısındaki gizli değerdir. Satıcı şifresini sıfırlamak
       * istediğinde token üretiliyor ve o andan itibaren ilanını açan HERKES
       * token'ı okuyup /reset-password?token=... adresinden hesabı ele
       * geçirebiliyordu. Ayrıca `verificationToken` ve satıcının e-posta
       * adresi de açıktaydı (istenmeyen posta hedefi ve KVKK sorunu).
       *
       * Kara liste yerine beyaz liste: yalnızca arayüzün gerçekten kullandığı
       * ve kamuya açık olması gereken alanlar dönüyor. Kullanıcı tablosuna
       * ileride eklenecek bir alan buradan kendiliğinden sızamaz.
       *
       * `phone` bilinçli olarak listede: alıcının satıcıya ulaşması gerekiyor
       * ve arayüz iletişim bölümünde bunu kullanıyor.
       */
      const sanitizedSeller = seller
        ? {
            id: seller.id,
            firstName: seller.firstName,
            lastName: seller.lastName,
            username: seller.username,
            profileImageUrl: seller.profileImageUrl,
            phone: seller.phone,
            city: (seller as any).city ?? null,
            createdAt: seller.createdAt,
          }
        : null;

      res.json({
        ...listing,
        views: (listing.views || 0) + 1, // Return incremented view count
        seller: sanitizedSeller,
        category: categoryInfo,
        store: storeInfo,
        isFavorite,
      });
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  app.post("/api/listings", createLimiter, botGuard, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const sellerId = getUserId(user);

      // SECURITY: Email verification required to create listings (skip in development)
      // Doğrulama durumu veritabanından okunur — oturum nesnesinde yoktur.
      if (process.env.NODE_ENV === 'production' && !(await isEmailVerified(user))) {
        return res.status(403).json({
          message: "İlan oluşturabilmek için email adresinizi doğrulamanız gerekmektedir.",
          requiresVerification: true,
        });
      }

      // Bot koruması yukarıdaki botGuard katmanında yapılıyor (bal küpü +
      // form doldurma süresi). Ayrıca ilan verebilmek için e-posta doğrulaması
      // zorunlu ve aşağıda yinelenen/sık ilan filtreleri var.

      // SPAM FILTER: Check BEFORE counting toward hourly limit
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const normalizedTitle = req.body.title.toLowerCase().trim();
      
      const duplicates = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.sellerId, sellerId),
            sql`LOWER(TRIM(${listings.title})) = ${normalizedTitle}`,
            gte(listings.createdAt, oneHourAgo),
            // Ignore rejected/deleted listings
            sql`${listings.status} NOT IN ('rejected', 'deleted')`
          )
        )
        .limit(1);

      if (duplicates.length > 0) {
        return res.status(429).json({
          message: "Aynı başlıkla kısa süre önce ilan oluşturdunuz. Lütfen 1 saat bekleyin.",
          errorCode: "DUPLICATE_LISTING",
        });
      }

      // SPAM FILTER: Max 5 ACTIVE/PENDING listings per hour per user
      const recentListings = await db
        .select({ count: count() })
        .from(listings)
        .where(
          and(
            eq(listings.sellerId, sellerId),
            gte(listings.createdAt, oneHourAgo),
            sql`${listings.status} NOT IN ('rejected', 'deleted')`
          )
        );

      if (recentListings[0] && Number(recentListings[0].count) >= 5) {
        return res.status(429).json({
          message: "Saatte en fazla 5 ilan oluşturabilirsiniz. Lütfen daha sonra tekrar deneyin.",
          errorCode: "RATE_LIMIT_EXCEEDED",
        });
      }

      // LEGAL COMPLIANCE: Check category restrictions
      const categoryId = req.body.categoryId;
      if (categoryId) {
        // Get category info to check slug
        const categoryInfo = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
        
        if (categoryInfo.length > 0) {
          const categorySlug = categoryInfo[0].slug;
          
          // Check if category is restricted
          const restrictions = await db.select().from(restrictedCategories)
            .where(and(
              eq(restrictedCategories.categorySlug, categorySlug),
              eq(restrictedCategories.isActive, true)
            ));
          
          if (restrictions.length > 0) {
            const restriction = restrictions[0];
            
            // Check restriction type
            if (restriction.restrictionType === 'banned') {
              return res.status(403).json({
                message: `Bu kategoride ilan vermek yasaktır. ${restriction.reason}`,
                errorCode: "CATEGORY_BANNED",
                legalReference: restriction.legalReference,
                penaltyInfo: restriction.penaltyAmount,
              });
            }
            
            // Pet shop/store cannot sell cats and dogs
            if (restriction.restrictionType === 'individual_only') {
              const storeId = req.body.storeId;
              const listingSource = req.body.storeId ? 'store' : 'individual';
              
              if (listingSource === 'store' || storeId) {
                return res.status(403).json({
                  message: `Mağazalar bu kategoride ilan veremez. ${restriction.reason}`,
                  errorCode: "STORE_NOT_ALLOWED",
                  legalReference: restriction.legalReference,
                  penaltyInfo: restriction.penaltyAmount,
                });
              }
            }
            
            // CITES required categories - check if user declared CITES document
            if (restriction.restrictionType === 'cites_required') {
              const citesAccepted = req.body.citesDocumentDeclared;
              if (!citesAccepted) {
                return res.status(400).json({
                  message: `Bu tür CITES kapsamında korunan bir hayvandır. İlan verebilmek için yasal belge sahibi olduğunuzu beyan etmeniz gerekmektedir.`,
                  errorCode: "CITES_REQUIRED",
                  legalReference: restriction.legalReference,
                  penaltyInfo: restriction.penaltyAmount,
                  requiresCitesDeclaration: true,
                });
              }
            }
          }
          
          // Also check parent categories for restrictions
          if (categoryInfo[0].path && Array.isArray(categoryInfo[0].path)) {
            for (const parentId of categoryInfo[0].path) {
              const parentCat = await db.select().from(categories).where(eq(categories.id, parentId)).limit(1);
              if (parentCat.length > 0) {
                const parentRestrictions = await db.select().from(restrictedCategories)
                  .where(and(
                    eq(restrictedCategories.categorySlug, parentCat[0].slug),
                    eq(restrictedCategories.isActive, true)
                  ));
                
                if (parentRestrictions.length > 0) {
                  const restriction = parentRestrictions[0];
                  
                  if (restriction.restrictionType === 'individual_only' && req.body.storeId) {
                    return res.status(403).json({
                      message: `Mağazalar bu kategoride ilan veremez. ${restriction.reason}`,
                      errorCode: "STORE_NOT_ALLOWED",
                      legalReference: restriction.legalReference,
                      penaltyInfo: restriction.penaltyAmount,
                    });
                  }
                }
              }
            }
          }
        }
      }

      // Development: auto-approve listings for testing
      // Production: require admin moderation
      const listingStatus = process.env.NODE_ENV === 'production' ? 'pending' : 'active';
      
      // Validate and sanitize price
      let priceValue = req.body.price;
      if (typeof priceValue === 'string') {
        // Remove thousand separators (dots in Turkish format, commas in English)
        priceValue = priceValue.replace(/\./g, '').replace(/,/g, '.');
      }
      const numericPrice = parseFloat(priceValue);
      if (isNaN(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ message: "Geçerli bir fiyat giriniz" });
      }
      if (numericPrice > 99999999.99) {
        return res.status(400).json({ message: "Fiyat en fazla 99.999.999,99 TL olabilir" });
      }

      /*
       * Satıcının gönderebileceği alanlar BEYAZ LİSTE ile belirleniyor.
       *
       * Önceden gövdenin tamamı (`...req.body`) şemaya aktarılıyor, yalnızca
       * birkaç hassas alan çıkarılıyordu. Şema tablodaki TÜM sütunları kabul
       * ettiği için sunucuya ait alanlar da geçiyordu: kullanıcı `isPremium:
       * true` göndererek ilanını ücretsiz öne çıkarabiliyordu (canlı testle
       * doğrulandı). `isUrgent`, `isExampleListing`, `moderatedBy`,
       * `moderationReason` gibi alanlar da aynı şekilde açıktı.
       *
       * Kara liste yaklaşımı bu hatayı davet ediyor: şemaya yeni bir sütun
       * eklendiğinde listeye eklemeyi unutmak yeterli. Beyaz listede ise
       * unutulan alan sessizce yok sayılır — güvenli taraf.
       *
       * `microchipNumber`, `passportNumber`, `earTagNumber`, `turkvetNumber`
       * bilinçli olarak listede YOK: bunlar hayvanın kimlik numaraları ve
       * herkese açık bir ilanda yayımlanmamalı.
       */
      const SATICININ_BELIRLEYEBILECEGI = [
        "categoryId", "title", "description", "images",
        "breed", "age", "ageCategory", "gender", "healthStatus",
        "vaccinated", "neutered", "pedigree", "characterTraits",
        "videoUrls", "categoryAttributes",
        "deliveryInfo", "warrantyInfo", "allowOffers",
        "locationId", "city", "district", "storeId",
      ] as const;

      const safeBody: Record<string, unknown> = {};
      for (const alan of SATICININ_BELIRLEYEBILECEGI) {
        if (req.body[alan] !== undefined) safeBody[alan] = req.body[alan];
      }

      const parsedData = insertListingSchema.parse({
        ...safeBody,
        price: numericPrice.toString(),
        sellerId: sellerId,
        status: listingStatus,
        // Auto-detect listing source: if storeId provided, it's a store listing
        listingSource: safeBody.storeId ? 'store' : 'individual',
      });

      // Create listing - completely free, but requires admin approval
      const [listing] = await db.insert(listings).values(parsedData as any).returning();

      /*
       * Yüklenen görselleri bu ilana bağla.
       *
       * Görseller ilan kaydedilmeden ÖNCE yükleniyor (kullanıcı formu
       * doldururken), o yüzden `listing_images` satırları `listing_id = NULL`
       * olarak oluşuyor. Burada bağlanmazlarsa tablo sonsuza kadar sahipsiz
       * satır biriktirir: hangi görselin hangi ilana ait olduğu bilinemez,
       * ilan silinince görselleri depolamadan temizlemek de mümkün olmaz.
       *
       * Eşleştirme `listings.images` içindeki adreslerle yapılıyor — istemci
       * oraya küçük boyutun adresini yazıyor.
       */
      const gorselAdresleri = (parsedData as any).images as string[] | undefined;
      if (Array.isArray(gorselAdresleri) && gorselAdresleri.length > 0) {
        try {
          await db
            .update(listingImages)
            .set({ listingId: listing.id })
            .where(
              and(
                isNull(listingImages.listingId),
                inArray(listingImages.thumbnailUrl, gorselAdresleri)
              )
            );
        } catch (err) {
          // Bağlama başarısız olsa da ilan geçerlidir; görseller zaten
          // listings.images üzerinden gösteriliyor.
          console.error("İlan görselleri ilana bağlanamadı:", err);
        }
      }

      const responseMessage = listingStatus === 'active'
        ? "İlanınız başarıyla oluşturuldu ve yayında!"
        : "İlanınız başarıyla oluşturuldu. Admin onayından sonra yayına girecektir.";
      
      res.status(201).json({
        ...listing,
        message: responseMessage,
        requiresApproval: listingStatus === 'pending',
      });
    } catch (error) {
      console.error("Error creating listing:", error);
      res.status(400).json({ message: "İlan oluşturulamadı", error });
    }
  });

  app.patch("/api/listings/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, req.params.id))
        .limit(1);
        
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      if (listing.sellerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Validate and sanitize price if provided
      let sanitizedPrice: string | undefined;
      if (req.body.price) {
        let priceValue = req.body.price;
        if (typeof priceValue === 'string') {
          // Remove thousand separators (dots in Turkish format, commas in English)
          priceValue = priceValue.replace(/\./g, '').replace(/,/g, '.');
        }
        const numericPrice = parseFloat(priceValue);
        if (isNaN(numericPrice) || numericPrice < 0) {
          return res.status(400).json({ message: "Geçerli bir fiyat giriniz" });
        }
        if (numericPrice > 99999999.99) {
          return res.status(400).json({ message: "Fiyat en fazla 99.999.999,99 TL olabilir" });
        }
        sanitizedPrice = numericPrice.toString();
      }

      // Check for price drop to notify favorites
      const oldPrice = parseFloat(listing.price || '0');
      const newPrice = sanitizedPrice ? parseFloat(sanitizedPrice) : oldPrice;
      const isPriceDrop = newPrice < oldPrice && oldPrice > 0;

      // Auto-detect listing source when storeId changes
      // Remove sensitive fields that should not be stored
      const { microchipNumber, passportNumber, earTagNumber, turkvetNumber, ...safeBody } = req.body;
      const updateData: any = { ...safeBody, updatedAt: new Date() };
      if (sanitizedPrice) {
        updateData.price = sanitizedPrice;
      }
      if ('storeId' in safeBody) {
        updateData.listingSource = safeBody.storeId ? 'store' : 'individual';
      }

      const [updated] = await db
        .update(listings)
        .set(updateData)
        .where(eq(listings.id, req.params.id))
        .returning();

      // Send price drop notifications to users who favorited this listing
      if (isPriceDrop && listing.status === 'active') {
        try {
          const favoritedUsers = await db
            .select({ userId: favorites.userId })
            .from(favorites)
            .where(eq(favorites.listingId, req.params.id));

          const discountPercent = Math.round(((oldPrice - newPrice) / oldPrice) * 100);

          // Create notifications for all users who favorited
          if (favoritedUsers.length > 0) {
            const notificationValues = favoritedUsers.map(fav => ({
              userId: fav.userId,
              type: 'price_drop' as const,
              title: 'Fiyat Düştü!',
              message: `"${listing.title}" ilanının fiyatı %${discountPercent} düştü! Yeni fiyat: ₺${newPrice.toLocaleString('tr-TR')}`,
              link: `/ilan/${req.params.id}`,
              relatedId: req.params.id,
            }));

            await db.insert(notifications).values(notificationValues);
          }
        } catch (notifError) {
          // Don't fail the update if notification fails
          console.error("Failed to send price drop notifications:", notifError);
        }
      }
        
      res.json(updated);
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(400).json({ message: "Update failed", error });
    }
  });

  app.delete("/api/listings/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const listingId = req.params.id;
      
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);
        
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      if (listing.sellerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Initialize object storage for file deletion
      const objectStorage = new ObjectStorageService();

      // Delete all related records before deleting the listing
      // 1. Delete favorites
      await db.delete(favorites).where(eq(favorites.listingId, listingId));
      
      // 2. Get listing images and delete from Object Storage, then from DB
      const imagesToDelete = await db.select()
        .from(listingImages)
        .where(eq(listingImages.listingId, listingId));
      
      // Delete images from Object Storage
      for (const img of imagesToDelete) {
        const pathsToDelete = [
          img.originalKey,
          img.thumbnailKey,
          img.mediumKey,
          img.largeKey
        ].filter(Boolean) as string[];
        
        await objectStorage.deleteMultipleFiles(pathsToDelete);
      }
      
      // Delete from DB
      await db.delete(listingImages).where(eq(listingImages.listingId, listingId));
      
      // Also delete images from listing.images array if any
      if (listing.images && Array.isArray(listing.images)) {
        await objectStorage.deleteMultipleFiles(listing.images as string[]);
      }
      
      // 3. Delete reports related to this listing
      await db.delete(reports).where(
        and(eq(reports.reportedType, 'listing'), eq(reports.reportedId, listingId))
      );
      
      // 4. Delete offers related to this listing
      await db.delete(offers).where(eq(offers.listingId, listingId));
      
      // 5. Clear listing reference from conversations (don't delete conversations)
      await db.update(conversations)
        .set({ listingId: null })
        .where(eq(conversations.listingId, listingId));
      
      // 6. Delete auctions and their bids
      const relatedAuctions = await db.select({ id: auctions.id })
        .from(auctions)
        .where(eq(auctions.listingId, listingId));
      
      for (const auction of relatedAuctions) {
        await db.delete(bids).where(eq(bids.auctionId, auction.id));
      }
      await db.delete(auctions).where(eq(auctions.listingId, listingId));

      // 7. Finally delete the listing
      await db.delete(listings).where(eq(listings.id, listingId));
      
      res.json({ message: "Listing deleted successfully" });
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(400).json({ message: "Delete failed", error });
    }
  });

  // Deactivate listing (set to draft/inactive)
  app.patch("/api/listings/:id/deactivate", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const listingId = req.params.id;
      
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);
        
      if (!listing) {
        return res.status(404).json({ message: "İlan bulunamadı" });
      }

      if (listing.sellerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
      }

      const [updated] = await db
        .update(listings)
        .set({ status: "draft", updatedAt: new Date() })
        .where(eq(listings.id, listingId))
        .returning();
      
      res.json({ message: "İlan pasife alındı", listing: updated });
    } catch (error) {
      console.error("Error deactivating listing:", error);
      res.status(400).json({ message: "İlan pasife alınamadı" });
    }
  });

  // Activate listing (set to active)
  app.patch("/api/listings/:id/activate", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const listingId = req.params.id;
      
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);
        
      if (!listing) {
        return res.status(404).json({ message: "İlan bulunamadı" });
      }

      if (listing.sellerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
      }

      const [updated] = await db
        .update(listings)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(listings.id, listingId))
        .returning();
      
      res.json({ message: "İlan aktifleştirildi", listing: updated });
    } catch (error) {
      console.error("Error activating listing:", error);
      res.status(400).json({ message: "İlan aktifleştirilemedi" });
    }
  });

  app.get("/api/listings/mine", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userListings = await db
        .select()
        .from(listings)
        .where(eq(listings.sellerId, getUserId(req.user)))
        .orderBy(desc(listings.createdAt));
        
      res.json(userListings);
    } catch (error) {
      console.error("Error fetching user listings:", error);
      res.status(500).json({ message: "Failed to fetch user listings" });
    }
  });

  app.get("/api/users/:id/listings", async (req: Request, res: Response) => {
    try {
      const userListings = await db
        .select()
        .from(listings)
        .where(eq(listings.sellerId, req.params.id))
        .orderBy(desc(listings.createdAt));
        
      res.json(userListings);
    } catch (error) {
      console.error("Error fetching user listings:", error);
      res.status(500).json({ message: "Failed to fetch user listings" });
    }
  });

  // ============ Auction Routes ============
  app.get("/api/auctions", async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      
      // Get auctions from PostgreSQL
      let query = db.select().from(auctions);
      
      if (status) {
        query = query.where(eq(auctions.status, status as any)) as any;
      }
      
      const allAuctions = await query.orderBy(desc(auctions.createdAt));
      res.json(allAuctions);
    } catch (error) {
      console.error("Failed to fetch auctions:", error);
      res.status(500).json({ message: "Failed to fetch auctions" });
    }
  });

  app.get("/api/auctions/:id", async (req: Request, res: Response) => {
    try {
      const [auction] = await db
        .select()
        .from(auctions)
        .where(eq(auctions.id, req.params.id))
        .limit(1);
      
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }

      // Get bids for auction
      const auctionBids = await db
        .select()
        .from(bids)
        .where(eq(bids.auctionId, req.params.id))
        .orderBy(desc(bids.amount));
      
      // Get listing
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, auction.listingId))
        .limit(1);

      res.json({
        ...auction,
        bids: auctionBids,
        listing,
      });
    } catch (error) {
      console.error("Failed to fetch auction:", error);
      res.status(500).json({ message: "Failed to fetch auction" });
    }
  });

  app.post("/api/auctions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const data = insertAuctionSchema.parse(req.body);
      
      // Verify listing belongs to user
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, data.listingId))
        .limit(1);
      
      if (!listing || listing.sellerId !== getUserId(req.user)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Create auction in PostgreSQL
      const [auction] = await db
        .insert(auctions)
        .values(data as any)
        .returning();
      
      res.status(201).json(auction);
    } catch (error) {
      console.error("Failed to create auction:", error);
      res.status(400).json({ message: "Failed to create auction", error });
    }
  });

  app.get("/api/auctions/:id/bids", async (req: Request, res: Response) => {
    try {
      const auctionBids = await db
        .select()
        .from(bids)
        .where(eq(bids.auctionId, req.params.id))
        .orderBy(desc(bids.amount));
      
      res.json(auctionBids);
    } catch (error) {
      console.error("Failed to fetch bids:", error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  app.post("/api/auctions/:id/bids", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [auction] = await db
        .select()
        .from(auctions)
        .where(eq(auctions.id, req.params.id))
        .limit(1);
      
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }

      if (auction.status !== "live") {
        return res.status(400).json({ message: "Auction is not active" });
      }

      const bidAmount = parseFloat(req.body.amount);
      const currentPrice = parseFloat(auction.currentPrice);
      const minIncrement = parseFloat(auction.minIncrement);

      if (bidAmount < currentPrice + minIncrement) {
        return res.status(400).json({ 
          message: `Bid must be at least ₺${(currentPrice + minIncrement).toFixed(2)}` 
        });
      }

      const [bid] = await db
        .insert(bids)
        .values({
          auctionId: req.params.id,
          bidderId: getUserId(req.user),
          amount: bidAmount.toString(),
        } as any)
        .returning();

      await db
        .update(auctions)
        .set({
          currentPrice: bidAmount.toString(),
          totalBids: (auction.totalBids || 0) + 1,
        })
        .where(eq(auctions.id, req.params.id));

      wss?.clients?.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'new_bid',
            auctionId: req.params.id,
            bid: {
              ...bid,
              bidder: {
                id: getUserId(req.user),
                fullName: `${(req.user as any).firstName || ''} ${(req.user as any).lastName || ''}`.trim() || (req.user as any).username,
              },
            },
          }));
        }
      });

      res.status(201).json(bid);
    } catch (error) {
      console.error("Failed to place bid:", error);
      res.status(400).json({ message: "Failed to place bid", error });
    }
  });

  // ============ Live Stream Routes ============
  app.get("/api/streams", async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      
      // Get live streams from PostgreSQL
      let query = db.select().from(liveStreams);
      
      if (status) {
        query = query.where(eq(liveStreams.status, status as any)) as any;
      }
      
      const allStreams = await query.orderBy(desc(liveStreams.createdAt));
      res.json(allStreams);
    } catch (error) {
      console.error("Failed to fetch streams:", error);
      res.status(500).json({ message: "Failed to fetch streams" });
    }
  });

  app.get("/api/streams/:id", async (req: Request, res: Response) => {
    try {
      const [stream] = await db
        .select()
        .from(liveStreams)
        .where(eq(liveStreams.id, req.params.id))
        .limit(1);
      
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      // Get streamer info
      const [streamer] = await db
        .select()
        .from(users)
        .where(eq(users.id, stream.streamerId))
        .limit(1);
      
      // Get linked listing if exists
      let listing = null;
      if (stream.listingId) {
        [listing] = await db
          .select()
          .from(listings)
          .where(eq(listings.id, stream.listingId))
          .limit(1);
      }

      res.json({
        ...stream,
        streamer,
        listing,
      });
    } catch (error) {
      console.error("Failed to fetch stream:", error);
      res.status(500).json({ message: "Failed to fetch stream" });
    }
  });

  app.post("/api/streams", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const data = insertLiveStreamSchema.parse({
        ...req.body,
        streamerId: getUserId(req.user),
        channelName: `stream_${Date.now()}_${getUserId(req.user).substring(0, 8)}`,
      });

      // Create stream in PostgreSQL
      const [stream] = await db
        .insert(liveStreams)
        .values(data as any)
        .returning();
      
      res.status(201).json(stream);
    } catch (error) {
      console.error("Failed to create stream:", error);
      res.status(400).json({ message: "Failed to create stream", error });
    }
  });

  app.patch("/api/streams/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [stream] = await db
        .select()
        .from(liveStreams)
        .where(eq(liveStreams.id, req.params.id))
        .limit(1);
      
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      if (stream.streamerId !== getUserId(req.user)) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const [updated] = await db
        .update(liveStreams)
        .set(req.body)
        .where(eq(liveStreams.id, req.params.id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update stream:", error);
      res.status(400).json({ message: "Failed to update stream", error });
    }
  });

  app.post("/api/streams/:id/join", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [stream] = await db
        .select()
        .from(liveStreams)
        .where(eq(liveStreams.id, req.params.id))
        .limit(1);
      
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      if (stream.status !== "live") {
        return res.status(400).json({ message: "Stream is not live" });
      }

      const newViewerCount = (stream.viewerCount || 0) + 1;
      const newPeakViewers = Math.max(stream.peakViewers || 0, newViewerCount);

      const [updated] = await db
        .update(liveStreams)
        .set({
          viewerCount: newViewerCount,
          peakViewers: newPeakViewers,
        })
        .where(eq(liveStreams.id, req.params.id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Failed to join stream:", error);
      res.status(500).json({ message: "Failed to join stream" });
    }
  });

  app.post("/api/streams/:id/leave", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [stream] = await db
        .select()
        .from(liveStreams)
        .where(eq(liveStreams.id, req.params.id))
        .limit(1);
      
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      const newViewerCount = Math.max(0, (stream.viewerCount || 0) - 1);

      const [updated] = await db
        .update(liveStreams)
        .set({
          viewerCount: newViewerCount,
        })
        .where(eq(liveStreams.id, req.params.id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Failed to leave stream:", error);
      res.status(500).json({ message: "Failed to leave stream" });
    }
  });

  // Live Streaming RTC Token Generation (requires AGORA_APP_ID and AGORA_APP_CERTIFICATE)
  app.get("/api/streams/:id/token", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [stream] = await db
        .select()
        .from(liveStreams)
        .where(eq(liveStreams.id, req.params.id))
        .limit(1);
      
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      // Check if live streaming credentials are configured
      const appId = process.env.AGORA_APP_ID;
      const appCertificate = process.env.AGORA_APP_CERTIFICATE;
      
      if (!appId || !appCertificate) {
        return res.status(503).json({ 
          message: "Canlı yayın altyapısı henüz aktif değil. Entegrasyon tamamlandığında kullanıma açılacaktır.",
          requiresSetup: true 
        });
      }

      // Generate RTC token
      const { RtcTokenBuilder, RtcRole } = await import('agora-access-token');
      
      const uid = parseInt(getUserId(req.user).substring(0, 8), 16); // Convert user ID to number
      const role = stream.streamerId === getUserId(req.user) ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
      const expirationTimeInSeconds = 3600; // 1 hour
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

      const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        stream.channelName,
        uid,
        role,
        privilegeExpiredTs
      );

      res.json({
        token,
        channelName: stream.channelName,
        uid,
        appId,
      });
    } catch (error) {
      console.error("Failed to generate stream token:", error);
      res.status(500).json({ message: "Failed to generate token" });
    }
  });

  // ============ Notification Routes ============
  
  // Get user notifications
  app.get("/api/notifications", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const limit = parseInt(req.query.limit as string) || 20;
      const unreadOnly = req.query.unreadOnly === 'true';

      let query = db
        .select()
        .from(notifications)
        .where(
          unreadOnly 
            ? and(eq(notifications.userId, userId), eq(notifications.isRead, false))
            : eq(notifications.userId, userId)
        )
        .orderBy(desc(notifications.createdAt))
        .limit(limit);

      const userNotifications = await query;
      res.json(userNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/count", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);

      const [result] = await db
        .select({ count: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

      res.json({ count: result?.count || 0 });
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const notificationId = req.params.id;

      const [notification] = await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
        .returning();

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json(notification);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  // Mark all notifications as read
  app.post("/api/notifications/read-all", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      res.status(500).json({ message: "Failed to update notifications" });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const notificationId = req.params.id;

      const [deleted] = await db
        .delete(notifications)
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
        .returning();

      if (!deleted) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Failed to delete notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // ============ Message Routes ============
  
  // Get total unread message count
  app.get("/api/messages/unread-count", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      
      // Get unread count from conversations table
      const userConvs = await db
        .select()
        .from(conversations)
        .where(
          or(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, userId)
          )
        );
      
      let totalUnread = 0;
      for (const conv of userConvs) {
        if (conv.participant1Id === userId) {
          totalUnread += conv.participant1UnreadCount || 0;
        } else {
          totalUnread += conv.participant2UnreadCount || 0;
        }
      }
      
      res.json({ count: totalUnread });
    } catch (error) {
      console.error("Failed to get unread count:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });
  
  // Search messages
  app.get("/api/messages/search", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      const results = await db
        .select({
          message: messages,
          sender: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(
          and(
            or(
              eq(messages.senderId, userId),
              eq(messages.receiverId, userId)
            ),
            ilike(messages.content, `%${query}%`),
            eq(messages.isDeleted, false)
          )
        )
        .orderBy(desc(messages.createdAt))
        .limit(limit);
      
      res.json(results.map(r => ({
        ...r.message,
        sender: r.sender,
      })));
    } catch (error) {
      console.error("Failed to search messages:", error);
      res.status(500).json({ message: "Failed to search messages" });
    }
  });
  
  // Get conversations with advanced features
  app.get("/api/messages/conversations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const showArchived = req.query.archived === "true";
      
      // Get conversations from the new conversations table
      const userConvs = await db
        .select()
        .from(conversations)
        .where(
          and(
            or(
              eq(conversations.participant1Id, userId),
              eq(conversations.participant2Id, userId)
            ),
            // Filter archived based on query param
            showArchived 
              ? or(
                  and(eq(conversations.participant1Id, userId), eq(conversations.participant1Archived, true)),
                  and(eq(conversations.participant2Id, userId), eq(conversations.participant2Archived, true))
                )
              : and(
                  or(
                    and(eq(conversations.participant1Id, userId), eq(conversations.participant1Archived, false)),
                    and(eq(conversations.participant2Id, userId), eq(conversations.participant2Archived, false))
                  )
                )
          )
        )
        .orderBy(desc(conversations.lastMessageAt));
      
      if (userConvs.length === 0) {
        return res.json([]);
      }
      
      // Get partner IDs and last messages
      const partnerIds = userConvs.map(c => 
        c.participant1Id === userId ? c.participant2Id : c.participant1Id
      );
      const messageIds = userConvs.map(c => c.lastMessageId).filter(Boolean) as string[];
      
      // Toplu getirmelerde inArray kullanılmalı, sql`... = ANY(${dizi})` DEĞİL:
      // Drizzle şablon içindeki JS dizisini tek bir dizi parametresi olarak
      // değil, elemanlarını ayrı ayrı bağlayarak gönderiyor. Ortaya `= ANY(($1))`
      // çıkıyor ve $1 düz metin olduğu için PostgreSQL "malformed array literal"
      // hatası veriyor. Bu üç sorgu yüzünden gelen kutusu ucu her kullanıcıda
      // 500 dönüyordu: mesaj gelmiş görünüyor (okunmamış sayacı çalışıyor) ama
      // konuşma listesi hiç açılmıyordu.
      const partners = partnerIds.length > 0 ? await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        })
        .from(users)
        .where(inArray(users.id, partnerIds)) : [];
      
      // Batch fetch last messages with listing info
      const lastMsgs = messageIds.length > 0 ? await db
        .select({
          message: messages,
          listing: {
            id: listings.id,
            title: listings.title,
            price: listings.price,
            images: listings.images,
            city: listings.city,
            district: listings.district,
          },
        })
        .from(messages)
        .leftJoin(listings, eq(messages.listingId, listings.id))
        .where(inArray(messages.id, messageIds)) : [];
      
      // Batch fetch presence
      const presences = partnerIds.length > 0 ? await db
        .select()
        .from(userPresence)
        .where(inArray(userPresence.userId, partnerIds)) : [];
      
      // Create maps
      const partnersMap = new Map(partners.map(p => [p.id, p]));
      const messagesMap = new Map(lastMsgs.map(m => [m.message.id, { ...m.message, listing: m.listing }]));
      const presenceMap = new Map(presences.map(p => [p.userId, p]));
      
      // Build response
      const result = userConvs.map(conv => {
        const partnerId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
        const isParticipant1 = conv.participant1Id === userId;
        const partner = partnersMap.get(partnerId);
        const lastMessage = conv.lastMessageId ? messagesMap.get(conv.lastMessageId) : null;
        const presence = presenceMap.get(partnerId);
        
        return {
          id: conv.id,
          partnerId,
          user: partner ? {
            ...partner,
            isOnline: presence?.isOnline || false,
            lastSeenAt: presence?.lastSeenAt?.toISOString() || null,
          } : null,
          lastMessage,
          unreadCount: isParticipant1 ? conv.participant1UnreadCount : conv.participant2UnreadCount,
          isPinned: isParticipant1 ? conv.participant1Pinned : conv.participant2Pinned,
          isArchived: isParticipant1 ? conv.participant1Archived : conv.participant2Archived,
          isMuted: isParticipant1 ? conv.participant1Muted : conv.participant2Muted,
          lastReadAt: isParticipant1 ? conv.participant1LastReadAt : conv.participant2LastReadAt,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        };
      });
      
      // Sort: pinned first, then by lastMessageAt
      result.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const aTime = a.lastMessage?.createdAt?.getTime() || 0;
        const bTime = b.lastMessage?.createdAt?.getTime() || 0;
        return bTime - aTime;
      });
      
      res.json(result);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });
  
  // Archive/unarchive conversation
  app.patch("/api/conversations/:id/archive", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const conversationId = req.params.id;
      const { archived } = req.body;
      
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);
      
      if (!conv) {
        return res.status(404).json({ message: "Konuşma bulunamadı" });
      }
      
      // Check if user is participant
      if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
        return res.status(403).json({ message: "Bu konuşmaya erişim yetkiniz yok" });
      }
      
      const updateData = conv.participant1Id === userId
        ? { participant1Archived: archived }
        : { participant2Archived: archived };
      
      await db
        .update(conversations)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
      
      res.json({ message: archived ? "Konuşma arşivlendi" : "Konuşma arşivden çıkarıldı" });
    } catch (error) {
      console.error("Failed to archive conversation:", error);
      res.status(500).json({ message: "Failed to archive conversation" });
    }
  });
  
  // Pin/unpin conversation
  app.patch("/api/conversations/:id/pin", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const conversationId = req.params.id;
      const { pinned } = req.body;
      
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);
      
      if (!conv) {
        return res.status(404).json({ message: "Konuşma bulunamadı" });
      }
      
      if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
        return res.status(403).json({ message: "Bu konuşmaya erişim yetkiniz yok" });
      }
      
      const updateData = conv.participant1Id === userId
        ? { participant1Pinned: pinned }
        : { participant2Pinned: pinned };
      
      await db
        .update(conversations)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
      
      res.json({ message: pinned ? "Konuşma sabitlendi" : "Konuşma sabitten çıkarıldı" });
    } catch (error) {
      console.error("Failed to pin conversation:", error);
      res.status(500).json({ message: "Failed to pin conversation" });
    }
  });
  
  // Mute/unmute conversation
  app.patch("/api/conversations/:id/mute", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const conversationId = req.params.id;
      const { muted } = req.body;
      
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);
      
      if (!conv) {
        return res.status(404).json({ message: "Konuşma bulunamadı" });
      }
      
      if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
        return res.status(403).json({ message: "Bu konuşmaya erişim yetkiniz yok" });
      }
      
      const updateData = conv.participant1Id === userId
        ? { participant1Muted: muted }
        : { participant2Muted: muted };
      
      await db
        .update(conversations)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
      
      res.json({ message: muted ? "Konuşma sessize alındı" : "Konuşma sesi açıldı" });
    } catch (error) {
      console.error("Failed to mute conversation:", error);
      res.status(500).json({ message: "Failed to mute conversation" });
    }
  });
  
  // Mark conversation as read
  app.post("/api/conversations/:id/read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const conversationId = req.params.id;
      
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);
      
      if (!conv) {
        return res.status(404).json({ message: "Konuşma bulunamadı" });
      }
      
      if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
        return res.status(403).json({ message: "Bu konuşmaya erişim yetkiniz yok" });
      }
      
      // Update unread count and last read time
      const updateData = conv.participant1Id === userId
        ? { participant1UnreadCount: 0, participant1LastReadAt: new Date() }
        : { participant2UnreadCount: 0, participant2LastReadAt: new Date() };
      
      await db
        .update(conversations)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
      
      // Mark all messages as read
      await db
        .update(messages)
        .set({
          status: "read",
          readAt: new Date(),
        })
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(messages.receiverId, userId),
            sql`${messages.status} != 'read'`
          )
        );
      
      res.json({ message: "Konuşma okundu olarak işaretlendi" });
    } catch (error) {
      console.error("Failed to mark conversation as read:", error);
      res.status(500).json({ message: "Failed to mark conversation as read" });
    }
  });
  
  // Upload file/image for messages
  app.post("/api/messages/upload", isAuthenticated, uploadMessageFiles.single('file'), async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "Dosya gerekli" });
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "Dosya boyutu 10MB'ı aşamaz" });
      }
      
      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: "Desteklenmeyen dosya türü" });
      }
      
      const isImage = file.mimetype.startsWith('image/');
      const timestamp = Date.now();
      const ext = file.originalname.split('.').pop() || 'bin';
      const filename = `message_${userId}_${timestamp}.${ext}`;
      
      let fileBuffer = file.buffer;
      let finalFilename = filename;
      
      // Process images with Sharp
      if (isImage && file.mimetype !== 'image/gif') {
        const sharp = (await import('sharp')).default;
        
        // Resize large images and convert to WebP
        fileBuffer = await sharp(file.buffer)
          .rotate() // Auto-rotate based on EXIF
          .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();
        
        finalFilename = `message_${userId}_${timestamp}.webp`;
      }
      
      // Upload to object storage
      const objectStorage = new ObjectStorageService();
      const contentType = isImage && file.mimetype !== 'image/gif' ? 'image/webp' : file.mimetype;
      const objectPath = await objectStorage.uploadFileBuffer(fileBuffer, contentType);
      
      const fileUrl = `/api/objects/${objectPath}`;
      
      res.json({
        url: fileUrl,
        filename: file.originalname,
        mimeType: isImage && file.mimetype !== 'image/gif' ? 'image/webp' : file.mimetype,
        size: fileBuffer.length,
        type: isImage ? 'image' : 'file',
      });
    } catch (error) {
      console.error("Failed to upload message file:", error);
      res.status(500).json({ message: "Dosya yüklenemedi" });
    }
  });

  app.get("/api/messages/:userId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUserId = getUserId(req.user);
      const otherUserId = req.params.userId;
      
      // Get messages between two users with listing info
      const msgs = await db
        .select({
          message: messages,
          listing: {
            id: listings.id,
            title: listings.title,
            price: listings.price,
            images: listings.images,
            city: listings.city,
            district: listings.district,
          },
        })
        .from(messages)
        .leftJoin(listings, eq(messages.listingId, listings.id))
        .where(
          sql`(${messages.senderId} = ${currentUserId} AND ${messages.receiverId} = ${otherUserId}) OR (${messages.senderId} = ${otherUserId} AND ${messages.receiverId} = ${currentUserId})`
        )
        .orderBy(messages.createdAt);
      
      // Flatten and return messages with listing info attached
      const result = msgs.map(row => ({
        ...row.message,
        listing: row.listing,
      }));
      
      // Also get the conversation listing (most recent one with a listing)
      const conversationListing = msgs.find(m => m.listing)?.listing || null;
      
      res.json({
        messages: result,
        listing: conversationListing,
      });
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const senderId = getUserId(req.user);
      const { receiverId, content, listingId, messageType, replyToId, attachments } = req.body;
      
      if (!receiverId || !content) {
        return res.status(400).json({ message: "Alıcı ve mesaj içeriği gereklidir" });
      }
      
      // Check if this is an example listing - prevent messaging
      if (listingId) {
        const [listing] = await db
          .select({ isExampleListing: listings.isExampleListing })
          .from(listings)
          .where(eq(listings.id, listingId))
          .limit(1);
        
        if (listing?.isExampleListing) {
          return res.status(403).json({ 
            message: "Örnek ilanlara mesaj gönderilemez. Bu ilan sadece örnek amaçlıdır." 
          });
        }
      }
      
      // Get or create conversation
      const conversationId = [senderId, receiverId].sort().join('_');
      
      // Check if conversation exists
      const [existingConv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);
      
      if (!existingConv) {
        // Create new conversation
        const [p1, p2] = [senderId, receiverId].sort();
        await db.insert(conversations).values({
          id: conversationId,
          participant1Id: p1,
          participant2Id: p2,
          listingId: listingId || null,
          participant1Archived: false,
          participant2Archived: false,
          participant1Pinned: false,
          participant2Pinned: false,
          participant1Muted: false,
          participant2Muted: false,
        });
      }

      // Create message in PostgreSQL
      const [message] = await db
        .insert(messages)
        .values({
          senderId,
          receiverId,
          conversationId,
          content,
          listingId: listingId || null,
          messageType: messageType || "text",
          replyToId: replyToId || null,
          attachments: attachments || [],
        })
        .returning();
      
      // Update conversation
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);
      
      if (conv) {
        const isParticipant1Receiver = conv.participant1Id === receiverId;
        await db
          .update(conversations)
          .set({
            lastMessageId: message.id,
            lastMessageAt: new Date(),
            updatedAt: new Date(),
            ...(isParticipant1Receiver
              ? { participant1UnreadCount: sql`COALESCE(${conversations.participant1UnreadCount}, 0) + 1` }
              : { participant2UnreadCount: sql`COALESCE(${conversations.participant2UnreadCount}, 0) + 1` }),
          })
          .where(eq(conversations.id, conversationId));
      }

      // Send notification to receiver
      try {
        /*
         * Gönderenin adı VERİTABANINDAN okunuyor.
         *
         * Önceden `req.user.firstName` kullanılıyordu; `req.user` yalnızca
         * `{ claims: { sub }, role }` taşıyan oturum nesnesidir ve orada isim
         * alanı YOKTUR. Sonuç: her bildirim "Birisi size bir mesaj gönderdi"
         * diyordu — kim yazdığı hiç görünmüyordu.
         */
        const [gonderen] = await db
          .select({ firstName: users.firstName, lastName: users.lastName, username: users.username })
          .from(users)
          .where(eq(users.id, senderId))
          .limit(1);

        const senderName =
          [gonderen?.firstName, gonderen?.lastName].filter(Boolean).join(" ").trim() ||
          gonderen?.username ||
          "Birisi";

        await db.insert(notifications).values({
          userId: receiverId,
          type: 'new_message',
          title: 'Yeni Mesaj',
          message: `${senderName} size bir mesaj gönderdi`,
          link: `/mesajlar?conversationId=${conversationId}`,
          relatedId: message.id,
        });

        /*
         * Alıcıya e-posta bildirimi.
         *
         * Eskiden yalnızca site içi bildirim oluşuyordu; alıcı siteye
         * girmediği sürece kendisine mesaj geldiğini HİÇ öğrenmiyordu. Az
         * trafikli bir pazaryerinde kaçan her mesaj kaçan bir satıştır.
         *
         * SPAM ÖNLEME: e-posta yalnızca o konuşmadaki İLK okunmamış mesajda
         * gönderiliyor. Karşılıklı yazışma sırasında her mesaj için posta
         * atılmaz; alıcı mesajları okuyup konuşma temizlendikten sonra gelen
         * yeni mesaj tekrar bildirilir. Mesajlaşma uygulamalarının davranışı
         * budur ve ek bir tablo/sütun gerektirmez.
         */
        const [okunmamis] = await db
          .select({ n: count() })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conversationId),
              eq(messages.receiverId, receiverId),
              isNull(messages.readAt),
              ne(messages.id, message.id)
            )
          );

        if (Number(okunmamis?.n ?? 0) === 0) {
          // Kullanıcı tercihleri: ayar kaydı olmayan kullanıcıya bildirim
          // gönderilir (varsayılan açık), açıkça kapatan kullanıcıya gönderilmez.
          const [ayar] = await db
            .select({
              emailNotifications: userSettings.emailNotifications,
              notifyMessages: userSettings.notifyMessages,
            })
            .from(userSettings)
            .where(eq(userSettings.userId, receiverId))
            .limit(1);

          const izinVar = !ayar || (ayar.emailNotifications && ayar.notifyMessages);

          const [alici] = await db
            .select({ email: users.email, firstName: users.firstName })
            .from(users)
            .where(eq(users.id, receiverId))
            .limit(1);

          if (izinVar && alici?.email) {
            const onizleme = String(content).replace(/\s+/g, " ").trim().slice(0, 160);
            // Yanıt dönmeden ÖNCE bekleniyor. Sunucusuz ortamda yanıt
            // gönderildikten sonraki iş tamamlanmaz (fonksiyon donar), bu
            // yüzden "beklemeden gönder" kalıbı e-postanın rastgele
            // kaybolmasına yol açıyordu. Hatalar servis içinde yutuluyor.
            await emailService.sendNewMessageNotice({
              to: alici.email,
              recipientName: alici.firstName,
              senderName,
              preview: onizleme,
              conversationId,
              listingTitle: null,
            });
          }
        }
      } catch (notifError) {
        console.error("Failed to create message notification:", notifError);
      }
      
      res.status(201).json({ ...message, conversationId });
    } catch (error) {
      console.error("Failed to send message:", error);
      res.status(400).json({ message: "Failed to send message", error });
    }
  });

  // ============ Blog Routes ============
  app.get("/api/blog", async (req: Request, res: Response) => {
    try {
      // Check cache first (1h TTL - blog posts don't change frequently)
      const cacheKey = cacheKeys.blogPosts();
      const cached = await cache.get<any[]>(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }
      
      // Read blog posts directly from database (seeded data) with author info
      const published = req.query.published !== "false";
      const posts = await db.query.blogPosts.findMany({
        where: published ? eq(blogPosts.published, true) : undefined,
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
        with: {
          author: true,
        },
      });

      // Sanitize author - only expose safe fields (intentionally partial to avoid PII leak)
      const sanitizedPosts = posts.map((post) => {
        if (post.author) {
          return {
            ...post,
            author: {
              id: post.author.id,
              fullName: `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || post.author.username,
              avatar: post.author.profileImageUrl,
            } as any, // Type assertion: intentionally returning partial user object for security
          };
        }
        return post;
      });

      // Cache for 1 hour
      await cache.set(cacheKey, sanitizedPosts, cacheTTL.blogPosts);

      res.json(sanitizedPosts);
    } catch (error) {
      console.error("Blog API error:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog/:slug", async (req: Request, res: Response) => {
    try {
      // Read from database directly (seeded data) with author info
      const post = await db.query.blogPosts.findFirst({
        where: (posts, { eq }) => eq(posts.slug, req.params.slug),
        with: {
          author: true,
        },
      });
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Sanitize author - only expose safe fields (intentionally partial to avoid PII leak)
      let sanitizedPost = post;
      if (post.author) {
        sanitizedPost = {
          ...post,
          author: {
            id: post.author.id,
            fullName: `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || post.author.username,
            avatar: post.author.profileImageUrl,
          } as any, // Type assertion: intentionally returning partial user object for security
        };
      }

      res.json(sanitizedPost);
    } catch (error) {
      console.error("Blog detail API error:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.post("/api/blog", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if ((req.user as any).role !== "admin" && (req.user as any).role !== "vet") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const data = insertBlogPostSchema.parse({
        ...req.body,
        authorId: getUserId(req.user),
      });

      // Create blog post in PostgreSQL
      const [post] = await db
        .insert(blogPosts)
        .values(data as any)
        .returning();
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Failed to create blog post:", error);
      res.status(400).json({ message: "Failed to create post", error });
    }
  });

  // ============ Vet Service Routes ============
  app.get("/api/vet-services", async (req: Request, res: Response) => {
    try {
      const city = req.query.city as string;
      
      // Get vet services from PostgreSQL
      let query = db.select().from(vetServices);
      
      if (city) {
        query = query.where(eq(vetServices.city, city)) as any;
      }
      
      const services = await query.orderBy(desc(vetServices.createdAt));
      res.json(services);
    } catch (error) {
      console.error("Failed to fetch vet services:", error);
      res.status(500).json({ message: "Failed to fetch vet services" });
    }
  });

  app.get("/api/vet-services/:id", async (req: Request, res: Response) => {
    try {
      const [service] = await db
        .select()
        .from(vetServices)
        .where(eq(vetServices.id, req.params.id))
        .limit(1);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Get vet user
      const [vet] = await db
        .select()
        .from(users)
        .where(eq(users.id, service.vetId))
        .limit(1);
      
      // Get reviews
      const serviceReviews = await db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.targetId, req.params.id),
            eq(reviews.targetType, "vet_service")
          )
        );

      // Herkese acik uc: yalnizca kamuya acilabilir alanlar donuyor.
      // Onceden sadece sifre cikariliyor, resetToken dahil kaydin geri kalani
      // yayimlaniyordu.
      const sanitizedVet = publicUserFields(vet);

      res.json({
        ...service,
        vet: sanitizedVet,
        reviews: serviceReviews,
      });
    } catch (error) {
      console.error("Failed to fetch vet service:", error);
      res.status(500).json({ message: "Failed to fetch vet service" });
    }
  });

  /**
   * Klinik kaydında sahibin belirleyebileceği alanlar.
   *
   * `insertVetServiceSchema` yalnızca sayaçları çıkarıyordu; `verified`
   * açıkta kalıyordu. İstek gövdesine `{"verified":true}` yazan biri
   * kendini "doğrulanmış veteriner" gösterebilirdi. Doğrulama rozetini
   * yalnızca belge incelemesi verir.
   */
  const VET_HIZMET_ALANLARI = [
    "clinicName", "address", "city", "district", "phone", "email",
    "specializations", "services", "workingHours", "emergencyService",
  ] as const;

  app.post("/api/vet-services", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Rol veritabanından okunur; oturumdaki değer bayat olabilir (kullanıcı
      // doğrulaması onaylandığında rolü oturum açıkken değişir).
      const [kullanici] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, getUserId(req.user)))
        .limit(1);

      if (kullanici?.role !== "vet" && kullanici?.role !== "admin") {
        return res.status(403).json({
          message: "Klinik kaydı açmak için önce veteriner hekim doğrulamanızı tamamlamanız gerekiyor.",
          requiresProfessionalVerification: true,
          verificationPath: "/panel/dogrulama",
        });
      }

      const govde = req.body ?? {};
      const temiz: Record<string, any> = {};
      for (const alan of VET_HIZMET_ALANLARI) {
        if (govde[alan] !== undefined) temiz[alan] = govde[alan];
      }

      const data = insertVetServiceSchema.parse({
        ...temiz,
        vetId: getUserId(req.user),
      });

      // Doğrulama rozeti belgeleri onaylanmış hekime kendiliğinden verilir;
      // istek gövdesinden ASLA alınmaz.
      const [service] = await db
        .insert(vetServices)
        .values({ ...(data as any), verified: kullanici?.role === "vet" })
        .returning();

      res.status(201).json(service);
    } catch (error) {
      console.error("Failed to create vet service:", error);
      res.status(400).json({ message: "Failed to create service", error });
    }
  });

  // ============ Transport Service Routes ============
  app.get("/api/transport-services", async (req: Request, res: Response) => {
    try {
      // Get transport services from PostgreSQL
      // Note: TransportServices uses serviceAreas (array) not city field
      const services = await db
        .select()
        .from(transportServices)
        .orderBy(desc(transportServices.createdAt));
      
      res.json(services);
    } catch (error) {
      console.error("Failed to fetch transport services:", error);
      res.status(500).json({ message: "Failed to fetch transport services" });
    }
  });

  app.get("/api/transport-services/:id", async (req: Request, res: Response) => {
    try {
      const [service] = await db
        .select()
        .from(transportServices)
        .where(eq(transportServices.id, req.params.id))
        .limit(1);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Get transporter user
      const [transporter] = await db
        .select()
        .from(users)
        .where(eq(users.id, service.transporterId))
        .limit(1);
      
      // Get reviews
      const serviceReviews = await db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.targetId, req.params.id),
            eq(reviews.targetType, "transport_service")
          )
        );

      // Herkese acik uc: bkz. veteriner ucundaki aciklama.
      const sanitizedTransporter = publicUserFields(transporter);

      res.json({
        ...service,
        transporter: sanitizedTransporter,
        reviews: serviceReviews,
      });
    } catch (error) {
      console.error("Failed to fetch transport service:", error);
      res.status(500).json({ message: "Failed to fetch transport service" });
    }
  });

  /** Nakliye kaydında sahibin belirleyebileceği alanlar (bkz. VET_HIZMET_ALANLARI). */
  const NAKLIYE_HIZMET_ALANLARI = [
    "companyName", "serviceAreas", "vehicleTypes", "animalTypes",
    "phone", "pricePerKm", "minPrice", "insurance",
  ] as const;

  app.post("/api/transport-services", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [kullanici] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, getUserId(req.user)))
        .limit(1);

      if (kullanici?.role !== "transporter" && kullanici?.role !== "admin") {
        return res.status(403).json({
          message: "Nakliye hizmeti kaydı açmak için önce taşımacı doğrulamanızı tamamlamanız gerekiyor.",
          requiresProfessionalVerification: true,
          verificationPath: "/panel/dogrulama",
        });
      }

      const govde = req.body ?? {};
      const temiz: Record<string, any> = {};
      for (const alan of NAKLIYE_HIZMET_ALANLARI) {
        if (govde[alan] !== undefined) temiz[alan] = govde[alan];
      }

      const data = insertTransportServiceSchema.parse({
        ...temiz,
        transporterId: getUserId(req.user),
      });

      const [service] = await db
        .insert(transportServices)
        .values({ ...(data as any), verified: kullanici?.role === "transporter" })
        .returning();

      res.status(201).json(service);
    } catch (error) {
      console.error("Failed to create transport service:", error);
      res.status(400).json({ message: "Failed to create service", error });
    }
  });

  // ============ Review Routes ============
  app.post("/api/reviews", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const data = insertReviewSchema.parse({
        ...req.body,
        reviewerId: getUserId(req.user),
      });

      // Create review in PostgreSQL
      const [review] = await db
        .insert(reviews)
        .values(data)
        .returning();
      
      res.status(201).json(review);
    } catch (error) {
      console.error("Failed to create review:", error);
      res.status(400).json({ message: "Failed to create review", error });
    }
  });

  // ============ Favorite Routes ============
  app.get("/api/favorites", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get favorites from PostgreSQL
      const favs = await db
        .select()
        .from(favorites)
        .where(eq(favorites.userId, getUserId(req.user)));
      
      res.json(favs);
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const data = insertFavoriteSchema.parse({
        ...req.body,
        userId: getUserId(req.user),
      });

      // Create favorite in PostgreSQL
      const [favorite] = await db
        .insert(favorites)
        .values(data)
        .returning();

      // Send notification to listing owner
      try {
        const [listing] = await db
          .select()
          .from(listings)
          .where(eq(listings.id, data.listingId))
          .limit(1);
        
        if (listing && listing.sellerId !== getUserId(req.user)) {
          const favUser = req.user as any;
          const userName = favUser.firstName 
            ? `${favUser.firstName} ${favUser.lastName || ''}`.trim() 
            : favUser.username || 'Birisi';
          
          const [notification] = await db.insert(notifications).values({
            userId: listing.sellerId,
            type: 'new_favorite',
            title: 'Yeni Favori',
            message: `${userName} "${listing.title}" ilanınızı favorilere ekledi`,
            link: `/ilan/${listing.id}`,
            relatedId: listing.id,
          }).returning();
          
          // Emit WebSocket notification
          notificationEmitter.emit('notification', {
            userId: listing.sellerId,
            notification,
          });
        }
      } catch (notifError) {
        console.error("Failed to create favorite notification:", notifError);
      }
      
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Failed to add favorite:", error);
      res.status(400).json({ message: "Failed to add favorite", error });
    }
  });

  app.delete("/api/favorites/:listingId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Delete favorite from PostgreSQL
      await db
        .delete(favorites)
        .where(
          and(
            eq(favorites.userId, getUserId(req.user)),
            eq(favorites.listingId, req.params.listingId)
          )
        );
      
      res.json({ message: "Favorite removed" });
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      res.status(400).json({ message: "Failed to remove favorite", error });
    }
  });

  // ============ Saved Searches Routes (Kayıtlı Aramalar) ============

  // Get user's saved searches
  app.get("/api/saved-searches", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const userSearches = await db
        .select()
        .from(savedSearches)
        .where(eq(savedSearches.userId, userId))
        .orderBy(desc(savedSearches.createdAt));
      
      res.json(userSearches);
    } catch (error) {
      console.error("Failed to fetch saved searches:", error);
      res.status(500).json({ message: "Kayıtlı aramalar yüklenemedi" });
    }
  });

  // Create a new saved search
  app.post("/api/saved-searches", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const { name, filters, notifyEnabled } = req.body;

      if (!name || !filters) {
        return res.status(400).json({ message: "Arama adı ve filtreler gereklidir" });
      }

      // Check user's saved search limit (max 10)
      const existingSearches = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(savedSearches)
        .where(eq(savedSearches.userId, userId));
      
      const searchCount = existingSearches[0]?.count ?? 0;
      if (searchCount >= 10) {
        return res.status(400).json({ message: "En fazla 10 arama kaydedebilirsiniz" });
      }

      const [savedSearch] = await db
        .insert(savedSearches)
        .values({
          userId,
          name,
          filters,
          notifyEnabled: notifyEnabled || false,
        })
        .returning();
      
      res.status(201).json(savedSearch);
    } catch (error) {
      console.error("Failed to create saved search:", error);
      res.status(500).json({ message: "Arama kaydedilemedi" });
    }
  });

  // Update a saved search
  app.patch("/api/saved-searches/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const { id } = req.params;
      const { name, filters, notifyEnabled } = req.body;

      // Verify ownership
      const [existingSearch] = await db
        .select()
        .from(savedSearches)
        .where(and(
          eq(savedSearches.id, id),
          eq(savedSearches.userId, userId)
        ))
        .limit(1);
      
      if (!existingSearch) {
        return res.status(404).json({ message: "Kayıtlı arama bulunamadı" });
      }

      const updateData: any = { updatedAt: new Date() };
      if (name !== undefined) updateData.name = name;
      if (filters !== undefined) updateData.filters = filters;
      if (notifyEnabled !== undefined) updateData.notifyEnabled = notifyEnabled;

      const [updated] = await db
        .update(savedSearches)
        .set(updateData)
        .where(eq(savedSearches.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update saved search:", error);
      res.status(500).json({ message: "Arama güncellenemedi" });
    }
  });

  // Delete a saved search
  app.delete("/api/saved-searches/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const { id } = req.params;

      await db
        .delete(savedSearches)
        .where(and(
          eq(savedSearches.id, id),
          eq(savedSearches.userId, userId)
        ));
      
      res.json({ message: "Kayıtlı arama silindi" });
    } catch (error) {
      console.error("Failed to delete saved search:", error);
      res.status(500).json({ message: "Arama silinemedi" });
    }
  });

  // ============ Viewed Listings (Son Görüntülenen İlanlar) ============

  // Get user's recently viewed listings
  app.get("/api/viewed-listings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

      const viewed = await db
        .select({
          viewedAt: viewedListings.viewedAt,
          listing: {
            id: listings.id,
            title: listings.title,
            price: listings.price,
            images: listings.images,
            city: listings.city,
            district: listings.district,
            categoryId: listings.categoryId,
            status: listings.status,
            createdAt: listings.createdAt,
          }
        })
        .from(viewedListings)
        .innerJoin(listings, eq(viewedListings.listingId, listings.id))
        .where(eq(viewedListings.userId, userId))
        .orderBy(desc(viewedListings.viewedAt))
        .limit(limit);

      res.json(viewed.map(v => ({
        ...v.listing,
        viewedAt: v.viewedAt
      })));
    } catch (error) {
      console.error("Failed to fetch viewed listings:", error);
      res.status(500).json({ message: "Son görüntülenen ilanlar yüklenemedi" });
    }
  });

  // Add a listing to viewed history
  app.post("/api/viewed-listings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const { listingId } = req.body;

      if (!listingId) {
        return res.status(400).json({ message: "İlan ID gerekli" });
      }

      // Check if listing exists
      const [listing] = await db
        .select({ id: listings.id })
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);

      if (!listing) {
        return res.status(404).json({ message: "İlan bulunamadı" });
      }

      // Delete existing view record for same listing (if exists)
      await db
        .delete(viewedListings)
        .where(and(
          eq(viewedListings.userId, userId),
          eq(viewedListings.listingId, listingId)
        ));

      // Insert new view record
      await db.insert(viewedListings).values({
        userId,
        listingId,
      });

      // Keep only last 50 viewed listings per user
      const userViews = await db
        .select({ id: viewedListings.id })
        .from(viewedListings)
        .where(eq(viewedListings.userId, userId))
        .orderBy(desc(viewedListings.viewedAt));

      if (userViews.length > 50) {
        const idsToDelete = userViews.slice(50).map(v => v.id);
        await db
          .delete(viewedListings)
          .where(inArray(viewedListings.id, idsToDelete));
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to add viewed listing:", error);
      res.status(500).json({ message: "Görüntüleme kaydedilemedi" });
    }
  });

  // Clear viewed history
  app.delete("/api/viewed-listings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);

      await db
        .delete(viewedListings)
        .where(eq(viewedListings.userId, userId));

      res.json({ message: "Görüntüleme geçmişi temizlendi" });
    } catch (error) {
      console.error("Failed to clear viewed listings:", error);
      res.status(500).json({ message: "Görüntüleme geçmişi temizlenemedi" });
    }
  });

  // ============ Listing Comparison (İlan Karşılaştırma) ============

  // Get multiple listings for comparison
  app.get("/api/listings/compare", async (req: Request, res: Response) => {
    try {
      const ids = req.query.id;
      
      if (!ids) {
        return res.json([]);
      }

      const listingIds = Array.isArray(ids) ? ids as string[] : [ids as string];
      
      if (listingIds.length === 0 || listingIds.length > 4) {
        return res.status(400).json({ message: "1-4 arası ilan seçebilirsiniz" });
      }

      const compareListings = await db
        .select()
        .from(listings)
        .where(inArray(listings.id, listingIds));

      res.json(compareListings);
    } catch (error) {
      console.error("Failed to fetch listings for comparison:", error);
      res.status(500).json({ message: "İlanlar karşılaştırma için yüklenemedi" });
    }
  });

  // ============ Seller Reviews (Bireysel Satıcı Puanlama) ============

  // Get reviews for a seller
  app.get("/api/sellers/:sellerId/reviews", async (req: Request, res: Response) => {
    try {
      const { sellerId } = req.params;
      const { page = "1", limit = "10" } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const reviewsData = await db
        .select({
          review: sellerReviews,
          reviewer: {
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
          listing: {
            id: listings.id,
            title: listings.title,
            images: listings.images,
          },
        })
        .from(sellerReviews)
        .leftJoin(users, eq(sellerReviews.reviewerId, users.id))
        .leftJoin(listings, eq(sellerReviews.listingId, listings.id))
        .where(
          and(
            eq(sellerReviews.sellerId, sellerId),
            eq(sellerReviews.status, "active")
          )
        )
        .orderBy(desc(sellerReviews.createdAt))
        .limit(limitNum)
        .offset(offset);

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(sellerReviews)
        .where(
          and(
            eq(sellerReviews.sellerId, sellerId),
            eq(sellerReviews.status, "active")
          )
        );

      // Get average rating
      const [avgResult] = await db
        .select({ 
          avgRating: sql<number>`COALESCE(AVG(rating), 0)`,
          totalReviews: sql<number>`count(*)`
        })
        .from(sellerReviews)
        .where(
          and(
            eq(sellerReviews.sellerId, sellerId),
            eq(sellerReviews.status, "active")
          )
        );

      // Get rating distribution
      const ratingDistribution = await db
        .select({
          rating: sellerReviews.rating,
          count: sql<number>`count(*)`
        })
        .from(sellerReviews)
        .where(
          and(
            eq(sellerReviews.sellerId, sellerId),
            eq(sellerReviews.status, "active")
          )
        )
        .groupBy(sellerReviews.rating);

      res.json({
        reviews: reviewsData,
        total: Number(countResult?.count || 0),
        page: pageNum,
        limit: limitNum,
        avgRating: Number(avgResult?.avgRating || 0).toFixed(1),
        totalReviews: Number(avgResult?.totalReviews || 0),
        ratingDistribution: ratingDistribution.reduce((acc, r) => {
          acc[r.rating] = Number(r.count);
          return acc;
        }, {} as Record<number, number>),
      });
    } catch (error) {
      console.error("Failed to fetch seller reviews:", error);
      res.status(500).json({ message: "Değerlendirmeler yüklenemedi" });
    }
  });

  // Get seller summary (for showing in listing card/detail)
  app.get("/api/sellers/:sellerId/rating", async (req: Request, res: Response) => {
    try {
      const { sellerId } = req.params;

      const [result] = await db
        .select({ 
          avgRating: sql<number>`COALESCE(AVG(rating), 0)`,
          totalReviews: sql<number>`count(*)`
        })
        .from(sellerReviews)
        .where(
          and(
            eq(sellerReviews.sellerId, sellerId),
            eq(sellerReviews.status, "active")
          )
        );

      res.json({
        sellerId,
        avgRating: Number(result?.avgRating || 0).toFixed(1),
        totalReviews: Number(result?.totalReviews || 0),
      });
    } catch (error) {
      console.error("Failed to fetch seller rating:", error);
      res.status(500).json({ message: "Satıcı puanı yüklenemedi" });
    }
  });

  // Create a seller review (authenticated)
  app.post("/api/sellers/:sellerId/reviews", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { sellerId } = req.params;
      const reviewerId = getUserId(req.user);
      const { rating, comment, listingId } = req.body;

      // Can't review yourself
      if (sellerId === reviewerId) {
        return res.status(400).json({ message: "Kendinizi değerlendiremezsiniz" });
      }

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Geçerli bir puan verin (1-5)" });
      }

      // Check if already reviewed (within last 30 days for same listing)
      const existingReview = await db
        .select()
        .from(sellerReviews)
        .where(
          and(
            eq(sellerReviews.sellerId, sellerId),
            eq(sellerReviews.reviewerId, reviewerId),
            listingId ? eq(sellerReviews.listingId, listingId) : sql`true`
          )
        )
        .limit(1);

      if (existingReview.length > 0) {
        return res.status(400).json({ message: "Bu satıcıyı zaten değerlendirdiniz" });
      }

      // Check if verified purchase (if listing provided)
      let isVerifiedPurchase = false;
      if (listingId) {
        // Could check messages or transactions to verify purchase
        // For now, just mark as unverified
        isVerifiedPurchase = false;
      }

      const [review] = await db
        .insert(sellerReviews)
        .values({
          sellerId,
          reviewerId,
          listingId: listingId || null,
          rating,
          comment: comment || null,
          isVerifiedPurchase,
        })
        .returning();

      // Update seller's average rating in users table
      const [avgResult] = await db
        .select({ 
          avgRating: sql<number>`COALESCE(AVG(rating), 0)`,
          totalReviews: sql<number>`count(*)`
        })
        .from(sellerReviews)
        .where(
          and(
            eq(sellerReviews.sellerId, sellerId),
            eq(sellerReviews.status, "active")
          )
        );

      // Update seller's rating in users table
      await db
        .update(users)
        .set({
          sellerRating: avgResult?.avgRating?.toString() || "0",
          sellerReviewCount: Number(avgResult?.totalReviews || 0),
        })
        .where(eq(users.id, sellerId));

      // Create notification for seller
      await db.insert(notifications).values({
        userId: sellerId,
        type: "system",
        title: "Yeni Değerlendirme",
        message: `Bir alıcı size ${rating} yıldız verdi.`,
        relatedId: review.id,
        isRead: false,
      });

      res.status(201).json(review);
    } catch (error) {
      console.error("Failed to create seller review:", error);
      res.status(500).json({ message: "Değerlendirme oluşturulamadı" });
    }
  });

  // Seller responds to a review
  app.patch("/api/seller-reviews/:reviewId/respond", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { reviewId } = req.params;
      const userId = getUserId(req.user);
      const { response } = req.body;

      if (!response || response.length < 5) {
        return res.status(400).json({ message: "Yanıt en az 5 karakter olmalı" });
      }

      // Verify user is the seller
      const [review] = await db
        .select()
        .from(sellerReviews)
        .where(eq(sellerReviews.id, reviewId))
        .limit(1);

      if (!review) {
        return res.status(404).json({ message: "Değerlendirme bulunamadı" });
      }

      if (review.sellerId !== userId) {
        return res.status(403).json({ message: "Bu değerlendirmeye yanıt verme yetkiniz yok" });
      }

      if (review.sellerResponse) {
        return res.status(400).json({ message: "Bu değerlendirmeye zaten yanıt verdiniz" });
      }

      const [updated] = await db
        .update(sellerReviews)
        .set({
          sellerResponse: response,
          sellerResponseAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sellerReviews.id, reviewId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Failed to respond to review:", error);
      res.status(500).json({ message: "Yanıt verilemedi" });
    }
  });

  // Mark review as helpful
  app.post("/api/seller-reviews/:reviewId/helpful", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { reviewId } = req.params;

      const [updated] = await db
        .update(sellerReviews)
        .set({
          helpfulCount: sql`helpful_count + 1`,
        })
        .where(eq(sellerReviews.id, reviewId))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Değerlendirme bulunamadı" });
      }

      res.json({ helpfulCount: updated.helpfulCount });
    } catch (error) {
      console.error("Failed to mark review as helpful:", error);
      res.status(500).json({ message: "İşlem başarısız" });
    }
  });

  // ============ Category Statistics (Gelişmiş İstatistikler) ============

  // Get real-time category price statistics
  app.get("/api/category-stats/:categorySlug", async (req: Request, res: Response) => {
    try {
      const { categorySlug } = req.params;

      // Get the category and its children
      const category = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, categorySlug))
        .limit(1);

      if (!category.length) {
        return res.status(404).json({ message: "Kategori bulunamadı" });
      }

      // Get all subcategory slugs
      const allCategories = await db
        .select({ id: categories.id, slug: categories.slug })
        .from(categories)
        .where(
          or(
            eq(categories.slug, categorySlug),
            ilike(categories.slug, `${categorySlug}-%`)
          )
        );

      const categoryIds = allCategories.map(c => c.id);

      // Calculate real-time statistics for active listings
      const [stats] = await db
        .select({
          totalListings: sql<number>`count(*)`,
          avgPrice: sql<number>`COALESCE(AVG(CAST(${listings.price} AS DECIMAL)), 0)`,
          minPrice: sql<number>`COALESCE(MIN(CAST(${listings.price} AS DECIMAL)), 0)`,
          maxPrice: sql<number>`COALESCE(MAX(CAST(${listings.price} AS DECIMAL)), 0)`,
          medianPrice: sql<number>`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY CAST(${listings.price} AS DECIMAL))`,
          totalViews: sql<number>`COALESCE(SUM(${listings.views}), 0)`,
          totalFavorites: sql<number>`COALESCE(SUM(${listings.favoriteCount}), 0)`,
        })
        .from(listings)
        .where(
          and(
            inArray(listings.categoryId, categoryIds),
            eq(listings.status, "active")
          )
        );

      // Get city distribution
      const cityDistribution = await db
        .select({
          city: listings.city,
          count: sql<number>`count(*)`
        })
        .from(listings)
        .where(
          and(
            inArray(listings.categoryId, categoryIds),
            eq(listings.status, "active")
          )
        )
        .groupBy(listings.city)
        .orderBy(desc(sql`count(*)`))
        .limit(10);

      // Get price range distribution
      const priceRanges = await db
        .select({
          range: sql<string>`
            CASE 
              WHEN CAST(${listings.price} AS DECIMAL) < 1000 THEN '0-1K'
              WHEN CAST(${listings.price} AS DECIMAL) < 5000 THEN '1K-5K'
              WHEN CAST(${listings.price} AS DECIMAL) < 10000 THEN '5K-10K'
              WHEN CAST(${listings.price} AS DECIMAL) < 25000 THEN '10K-25K'
              WHEN CAST(${listings.price} AS DECIMAL) < 50000 THEN '25K-50K'
              ELSE '50K+'
            END
          `,
          count: sql<number>`count(*)`
        })
        .from(listings)
        .where(
          and(
            inArray(listings.categoryId, categoryIds),
            eq(listings.status, "active")
          )
        )
        .groupBy(sql`
          CASE 
            WHEN CAST(${listings.price} AS DECIMAL) < 1000 THEN '0-1K'
            WHEN CAST(${listings.price} AS DECIMAL) < 5000 THEN '1K-5K'
            WHEN CAST(${listings.price} AS DECIMAL) < 10000 THEN '5K-10K'
            WHEN CAST(${listings.price} AS DECIMAL) < 25000 THEN '10K-25K'
            WHEN CAST(${listings.price} AS DECIMAL) < 50000 THEN '25K-50K'
            ELSE '50K+'
          END
        `);

      // Get listings by date (last 30 days)
      const listingsByDate = await db
        .select({
          date: sql<string>`DATE(${listings.createdAt})`,
          count: sql<number>`count(*)`
        })
        .from(listings)
        .where(
          and(
            inArray(listings.categoryId, categoryIds),
            sql`${listings.createdAt} >= CURRENT_DATE - INTERVAL '30 days'`
          )
        )
        .groupBy(sql`DATE(${listings.createdAt})`)
        .orderBy(sql`DATE(${listings.createdAt})`);

      res.json({
        categorySlug,
        categoryName: category[0].name,
        stats: {
          totalListings: Number(stats?.totalListings || 0),
          avgPrice: Number(stats?.avgPrice || 0).toFixed(2),
          minPrice: Number(stats?.minPrice || 0).toFixed(2),
          maxPrice: Number(stats?.maxPrice || 0).toFixed(2),
          medianPrice: Number(stats?.medianPrice || 0).toFixed(2),
          totalViews: Number(stats?.totalViews || 0),
          totalFavorites: Number(stats?.totalFavorites || 0),
        },
        cityDistribution,
        priceRanges,
        listingsByDate,
      });
    } catch (error) {
      console.error("Failed to fetch category stats:", error);
      res.status(500).json({ message: "İstatistikler yüklenemedi" });
    }
  });

  // Get price trends for a category (historical data)
  app.get("/api/category-stats/:categorySlug/trends", async (req: Request, res: Response) => {
    try {
      const { categorySlug } = req.params;
      const { days = "30" } = req.query;
      const daysNum = parseInt(days as string) || 30;

      const trends = await db
        .select()
        .from(categoryStats)
        .where(
          and(
            eq(categoryStats.categorySlug, categorySlug),
            sql`${categoryStats.date} >= CURRENT_DATE - INTERVAL '${daysNum} days'`
          )
        )
        .orderBy(categoryStats.date);

      res.json(trends);
    } catch (error) {
      console.error("Failed to fetch category trends:", error);
      res.status(500).json({ message: "Trend verileri yüklenemedi" });
    }
  });

  // ─── Canlı piyasa verileri (TCMB döviz + DB hayvancılık) ───────────────────
  app.get("/api/market-prices/live", async (req: Request, res: Response) => {
    try {
      // 1) TCMB döviz kurları (gerçek zamanlı)
      let currencyItems: ReturnType<typeof formatCurrencyForTicker> = [];
      let tcmbDate = "";
      try {
        const tcmb = await getTCMBRates();
        currencyItems = formatCurrencyForTicker(tcmb);
        tcmbDate = tcmb.date;
      } catch (e) {
        console.warn("TCMB fetch failed, skipping currencies:", e);
      }

      // 2) Hayvancılık fiyatları (DB'den en güncel kayıt)
      const livestockItems = await db
        .select()
        .from(marketPrices)
        .orderBy(desc(marketPrices.date))
        .limit(50);

      const allItems = [
        ...livestockItems.map((p) => ({
          id: p.id,
          type: p.type,
          category: p.category,
          city: p.city,
          price: p.price,
          unit: p.unit,
          change_percent: p.changePercent,
          source: p.source,
          isLive: false,
          date: p.date?.toISOString() ?? new Date().toISOString(),
        })),
        ...currencyItems,
      ];

      res.json({
        items: allItems,
        tcmbDate,
        fetchedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("market-prices/live error:", error);
      res.status(500).json({ message: "Piyasa verileri alınamadı" });
    }
  });

  // Get overall market statistics
  app.get("/api/market-stats", async (req: Request, res: Response) => {
    try {
      // Get overall market stats
      const [overallStats] = await db
        .select({
          totalListings: sql<number>`count(*)`,
          activeListings: sql<number>`count(*) FILTER (WHERE ${listings.status} = 'active')`,
          avgPrice: sql<number>`COALESCE(AVG(CAST(${listings.price} AS DECIMAL)) FILTER (WHERE ${listings.status} = 'active'), 0)`,
          totalViews: sql<number>`COALESCE(SUM(${listings.views}), 0)`,
        })
        .from(listings);

      // Get top categories by listing count
      const topCategories = await db
        .select({
          categoryId: listings.categoryId,
          categoryName: categories.name,
          categorySlug: categories.slug,
          count: sql<number>`count(*)`,
          avgPrice: sql<number>`COALESCE(AVG(CAST(${listings.price} AS DECIMAL)), 0)`,
        })
        .from(listings)
        .leftJoin(categories, eq(listings.categoryId, categories.id))
        .where(eq(listings.status, "active"))
        .groupBy(listings.categoryId, categories.name, categories.slug)
        .orderBy(desc(sql`count(*)`))
        .limit(10);

      // Get listings created in last 7 days
      const recentActivity = await db
        .select({
          date: sql<string>`DATE(${listings.createdAt})`,
          count: sql<number>`count(*)`
        })
        .from(listings)
        .where(sql`${listings.createdAt} >= CURRENT_DATE - INTERVAL '7 days'`)
        .groupBy(sql`DATE(${listings.createdAt})`)
        .orderBy(sql`DATE(${listings.createdAt})`);

      res.json({
        overview: {
          totalListings: Number(overallStats?.totalListings || 0),
          activeListings: Number(overallStats?.activeListings || 0),
          avgPrice: Number(overallStats?.avgPrice || 0).toFixed(2),
          totalViews: Number(overallStats?.totalViews || 0),
        },
        topCategories: topCategories.map(c => ({
          ...c,
          count: Number(c.count),
          avgPrice: Number(c.avgPrice).toFixed(2),
        })),
        recentActivity,
      });
    } catch (error) {
      console.error("Failed to fetch market stats:", error);
      res.status(500).json({ message: "Pazar istatistikleri yüklenemedi" });
    }
  });

  // ============ Listing Videos (İlan Videoları) ============

  // Upload a video for a listing
  app.post("/api/listing-videos/upload", createLimiter, isAuthenticated, upload.single('video'), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "Video dosyası yüklemeniz gerekmektedir." });
      }

      const listingId = req.body.listingId;
      if (!listingId) {
        return res.status(400).json({ message: "İlan ID'si belirtilmemiş." });
      }

      // Verify ownership
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);

      if (!listing) {
        return res.status(404).json({ message: "İlan bulunamadı." });
      }

      if (listing.sellerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Bu ilana video yükleme yetkiniz yok." });
      }

      // Validate video file
      const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: "Desteklenen video formatları: MP4, WebM, MOV, AVI" });
      }

      // Supabase ücretsiz planda dosya başına üst sınır 50MB'dır.
      // Ücretli plana geçerseniz MAX_VIDEO_MB ile büyütebilirsiniz
      // (bucket limitini de Supabase panelinden yükseltmeyi unutmayın).
      const maxVideoMb = Number(process.env.MAX_VIDEO_MB || 50);
      const maxSize = maxVideoMb * 1024 * 1024;
      if (file.size > maxSize) {
        return res.status(400).json({ message: `Video boyutu ${maxVideoMb}MB'ı geçemez.` });
      }

      // Check video count limit
      const existingVideos = await db
        .select({ count: sql<number>`count(*)` })
        .from(listingVideos)
        .where(eq(listingVideos.listingId, listingId));

      if (Number(existingVideos[0]?.count || 0) >= 3) {
        return res.status(400).json({ message: "Bir ilan için en fazla 3 video yükleyebilirsiniz." });
      }

      // Upload to object storage (Supabase)
      if (!isObjectStorageConfigured()) {
        return res.status(500).json({ message: "Object storage yapılandırılmamış." });
      }

      const timestamp = Date.now();
      const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const videoPath = `videos/${listingId}/${timestamp}-${safeFilename}`;

      try {
        const videoUrl = await objectStorage.uploadBufferAt(
          videoPath,
          file.buffer,
          file.mimetype
        );

        // Get current max order
        const maxOrderResult = await db
          .select({ maxOrder: sql<number>`COALESCE(MAX(${listingVideos.order}), 0)` })
          .from(listingVideos)
          .where(eq(listingVideos.listingId, listingId));
        const nextOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;

        // Create video record
        const [video] = await db
          .insert(listingVideos)
          .values({
            listingId,
            url: videoUrl,
            mimeType: file.mimetype,
            size: file.size,
            order: nextOrder,
            status: "ready",
          })
          .returning();

        res.status(201).json(video);
      } catch (storageError) {
        console.error("Video upload to storage failed:", storageError);
        return res.status(500).json({ message: "Video yüklenirken bir hata oluştu." });
      }
    } catch (error) {
      console.error("Video upload failed:", error);
      res.status(500).json({ message: "Video yüklenemedi." });
    }
  });

  // Get videos for a listing
  app.get("/api/listing-videos/:listingId", async (req: Request, res: Response) => {
    try {
      const { listingId } = req.params;

      const videos = await db
        .select()
        .from(listingVideos)
        .where(eq(listingVideos.listingId, listingId))
        .orderBy(listingVideos.order);

      res.json(videos);
    } catch (error) {
      console.error("Failed to fetch listing videos:", error);
      res.status(500).json({ message: "Videolar yüklenemedi." });
    }
  });

  // Delete a video
  app.delete("/api/listing-videos/:videoId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { videoId } = req.params;
      const userId = getUserId(req.user);

      // Get video and verify ownership
      const [video] = await db
        .select({
          video: listingVideos,
          listing: { sellerId: listings.sellerId }
        })
        .from(listingVideos)
        .leftJoin(listings, eq(listingVideos.listingId, listings.id))
        .where(eq(listingVideos.id, videoId))
        .limit(1);

      if (!video) {
        return res.status(404).json({ message: "Video bulunamadı." });
      }

      if (video.listing?.sellerId !== userId && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Bu videoyu silme yetkiniz yok." });
      }

      // Delete from storage (optional, can fail silently)
      try {
        if (video.video.url) {
          await objectStorage.deleteFile(video.video.url);
        }
      } catch (e) {
        console.warn("Failed to delete video from storage:", e);
      }

      // Delete from database
      await db.delete(listingVideos).where(eq(listingVideos.id, videoId));

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete video:", error);
      res.status(500).json({ message: "Video silinemedi." });
    }
  });

  // ============ Guest Contact Requests (Misafir İletişim Formu) ============

  // Create a guest contact request (no login required)
  app.post("/api/contact-requests", createLimiter, botGuard, async (req: Request, res: Response) => {
    try {
      const { listingId, senderName, senderEmail, senderPhone, message } = req.body;

      // Validate required fields
      if (!listingId || !senderName || !senderEmail || !message) {
        return res.status(400).json({ message: "Lütfen tüm gerekli alanları doldurun" });
      }

      // Get the listing to find the seller and check if it's an example listing
      const [listing] = await db
        .select({ 
          sellerId: listings.sellerId,
          title: listings.title,
          isExampleListing: listings.isExampleListing 
        })
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);

      if (!listing) {
        return res.status(404).json({ message: "İlan bulunamadı" });
      }

      // Block contact requests for example listings
      if (listing.isExampleListing) {
        return res.status(403).json({ 
          message: "Örnek ilanlara iletişim talebi gönderilemez. Bu ilan sadece örnek amaçlıdır." 
        });
      }

      // Bot koruması botGuard katmanında (bal küpü + form süresi) yapılıyor.
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";

      // Talep her hâlükârda moderasyona düşer; satıcı görmeden önce
      // yönetim panelinden değerlendirilebilir.
      const status = "pending";

      // Create the contact request
      const [contactRequest] = await db
        .insert(contactRequests)
        .values({
          listingId,
          sellerId: listing.sellerId,
          senderName,
          senderEmail,
          senderPhone: senderPhone || null,
          message,
          ipAddress,
          status,
        })
        .returning();

      // Satıcıya bildirim. Talep botGuard'ı geçtiği için ayrıca spam
      // puanına bakılmıyor; şüpheli olanlar yönetim panelinden "spam"
      // olarak işaretlenebilir.
      await db.insert(notifications).values({
        userId: listing.sellerId,
        type: "new_message",
        title: "Yeni İletişim Talebi",
        message: `${senderName} adlı ziyaretçi ilanınız hakkında iletişime geçmek istiyor.`,
        relatedId: contactRequest.id,
        isRead: false,
      });

      /*
       * Satıcıya e-posta.
       *
       * Bu form üye OLMAYAN ziyaretçiler içindir; talebi bırakan kişi siteye
       * geri dönüp "acaba cevap geldi mi" diye bakmaz. Satıcı site içi
       * bildirimi görmezse temas tamamen kaybolur — üstelik burada karşı taraf
       * hesabı bile olmadığı için ikinci bir kanal yok.
       *
       * Ziyaretçinin iletişim bilgileri e-postaya konuyor ki satıcı siteye
       * girmeden de dönüş yapabilsin.
       */
      const iletisimAyrintilari: Array<[string, string]> = [
        ["Gönderen", senderName],
        ["E-posta", senderEmail],
      ];
      if (senderPhone) iletisimAyrintilari.push(["Telefon", String(senderPhone)]);
      iletisimAyrintilari.push(["İlan", listing.title || "—"]);

      await olayEpostasiGonder(
        listing.sellerId,
        {
          title: "İlanınız için iletişim talebi",
          body: String(message).replace(/\s+/g, " ").trim().slice(0, 300),
          details: iletisimAyrintilari,
          actionPath: `/ilan/${listingId}`,
          actionLabel: "İlanı Görüntüle",
        },
        "notifyMessages"
      );

      res.status(201).json({ 
        message: "Mesajınız satıcıya iletildi. En kısa sürede sizinle iletişime geçilecektir.",
        id: contactRequest.id
      });
    } catch (error) {
      console.error("Failed to create contact request:", error);
      res.status(500).json({ message: "Mesaj gönderilemedi. Lütfen tekrar deneyin." });
    }
  });

  // Get contact requests for seller (authenticated)
  app.get("/api/contact-requests", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const { status, listingId } = req.query;

      let query = db
        .select({
          contactRequest: contactRequests,
          listing: listings,
        })
        .from(contactRequests)
        .leftJoin(listings, eq(contactRequests.listingId, listings.id))
        .where(eq(contactRequests.sellerId, userId))
        .orderBy(desc(contactRequests.createdAt));

      // Optional filters
      const conditions = [eq(contactRequests.sellerId, userId)];
      if (status && typeof status === "string") {
        conditions.push(eq(contactRequests.status, status));
      }
      if (listingId && typeof listingId === "string") {
        conditions.push(eq(contactRequests.listingId, listingId));
      }

      const results = await db
        .select({
          contactRequest: contactRequests,
          listing: {
            id: listings.id,
            title: listings.title,
            images: listings.images,
          },
        })
        .from(contactRequests)
        .leftJoin(listings, eq(contactRequests.listingId, listings.id))
        .where(and(...conditions))
        .orderBy(desc(contactRequests.createdAt));

      res.json(results);
    } catch (error) {
      console.error("Failed to fetch contact requests:", error);
      res.status(500).json({ message: "İletişim talepleri yüklenemedi" });
    }
  });

  // Mark contact request as replied
  app.patch("/api/contact-requests/:id/reply", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req.user);

      const [updated] = await db
        .update(contactRequests)
        .set({ 
          status: "replied", 
          repliedAt: new Date() 
        })
        .where(
          and(
            eq(contactRequests.id, id),
            eq(contactRequests.sellerId, userId)
          )
        )
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "İletişim talebi bulunamadı" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Failed to update contact request:", error);
      res.status(500).json({ message: "İletişim talebi güncellenemedi" });
    }
  });

  // Archive or mark as spam
  app.patch("/api/contact-requests/:id/status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = getUserId(req.user);

      if (!["pending", "replied", "spam", "archived"].includes(status)) {
        return res.status(400).json({ message: "Geçersiz durum" });
      }

      const [updated] = await db
        .update(contactRequests)
        .set({ status })
        .where(
          and(
            eq(contactRequests.id, id),
            eq(contactRequests.sellerId, userId)
          )
        )
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "İletişim talebi bulunamadı" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Failed to update contact request status:", error);
      res.status(500).json({ message: "İletişim talebi güncellenemedi" });
    }
  });

  // Get unread contact request count
  app.get("/api/contact-requests/count", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);

      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(contactRequests)
        .where(
          and(
            eq(contactRequests.sellerId, userId),
            eq(contactRequests.status, "pending")
          )
        );

      res.json({ count: Number(result?.count || 0) });
    } catch (error) {
      console.error("Failed to count contact requests:", error);
      res.status(500).json({ message: "İletişim talepleri sayılamadı" });
    }
  });

  // General contact form (public)
  app.post("/api/contact", createLimiter, async (req: Request, res: Response) => {
    try {
      const { name, email, phone, subject, message } = req.body;

      // Validate required fields
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "Lütfen tüm gerekli alanları doldurun" });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Geçerli bir e-posta adresi girin" });
      }

      // Mesaj site sahibine e-posta ile iletilir.
      //
      // Daha önce burada yalnızca `console.log` vardı ve kullanıcıya
      // "Mesajınız alındı, en kısa sürede dönüş yapacağız" deniyordu. Mesaj
      // hiçbir yere ulaşmıyordu: sunucusuz ortamda konsol çıktısı kimsenin
      // okumadığı bir günlüğe yazılıp kayboluyordu. Site tutamayacağı bir söz
      // veriyordu; artık gerçekten iletiliyor.
      //
      // Gönderim başarısız olursa başarı dönmüyoruz — kullanıcı mesajının
      // ulaşmadığını bilmeli ki başka bir yoldan iletebilsin.
      await emailService.sendContactMessage({
        name: String(name).slice(0, 200),
        email: String(email).slice(0, 320),
        phone: phone ? String(phone).slice(0, 40) : undefined,
        subject: String(subject).slice(0, 300),
        message: String(message).slice(0, 5000),
      });

      res.status(201).json({
        message: "Mesajınız alındı. En kısa sürede size dönüş yapacağız.",
        success: true
      });
    } catch (error) {
      console.error("Failed to process contact form:", error);
      res.status(500).json({
        message:
          "Mesaj gönderilemedi. Lütfen tekrar deneyin veya doğrudan e-posta ile ulaşın.",
      });
    }
  });

  // ============ Offer Routes (Make Offer feature) ============

  // Get offers for a listing (seller view only)
  app.get("/api/listings/:listingId/offers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Verify the user owns the listing
      const [listing] = await db
        .select({ sellerId: listings.sellerId })
        .from(listings)
        .where(eq(listings.id, req.params.listingId))
        .limit(1);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.sellerId !== userId) {
        return res.status(403).json({ message: "Not authorized to view offers for this listing" });
      }
      
      const listingOffers = await db
        .select({
          offer: offers,
          buyer: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            sellerLevel: users.sellerLevel,
          }
        })
        .from(offers)
        .innerJoin(users, eq(offers.buyerId, users.id))
        .where(eq(offers.listingId, req.params.listingId))
        .orderBy(desc(offers.createdAt));

      res.json(listingOffers.map(o => ({
        ...o.offer,
        buyer: o.buyer
      })));
    } catch (error) {
      console.error("Failed to fetch offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  // Get user's sent offers
  app.get("/api/offers/sent", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const sentOffers = await db
        .select({
          offer: offers,
          listing: {
            id: listings.id,
            title: listings.title,
            price: listings.price,
            images: listings.images,
          },
          seller: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          }
        })
        .from(offers)
        .innerJoin(listings, eq(offers.listingId, listings.id))
        .innerJoin(users, eq(offers.sellerId, users.id))
        .where(eq(offers.buyerId, userId))
        .orderBy(desc(offers.createdAt));

      res.json(sentOffers.map(o => ({
        ...o.offer,
        listing: o.listing,
        seller: o.seller
      })));
    } catch (error) {
      console.error("Failed to fetch sent offers:", error);
      res.status(500).json({ message: "Failed to fetch sent offers" });
    }
  });

  // Get user's received offers
  app.get("/api/offers/received", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const receivedOffers = await db
        .select({
          offer: offers,
          listing: {
            id: listings.id,
            title: listings.title,
            price: listings.price,
            images: listings.images,
          },
          buyer: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            sellerLevel: users.sellerLevel,
          }
        })
        .from(offers)
        .innerJoin(listings, eq(offers.listingId, listings.id))
        .innerJoin(users, eq(offers.buyerId, users.id))
        .where(eq(offers.sellerId, userId))
        .orderBy(desc(offers.createdAt));

      res.json(receivedOffers.map(o => ({
        ...o.offer,
        listing: o.listing,
        buyer: o.buyer
      })));
    } catch (error) {
      console.error("Failed to fetch received offers:", error);
      res.status(500).json({ message: "Failed to fetch received offers" });
    }
  });

  // Create a new offer
  app.post("/api/offers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const { listingId, amount, message, expiresAt } = req.body;
      
      // Get listing details
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.sellerId === userId) {
        return res.status(400).json({ message: "Cannot make an offer on your own listing" });
      }
      
      if (!listing.allowOffers) {
        return res.status(400).json({ message: "This listing does not accept offers" });
      }
      
      // Prevent offers on example listings
      if (listing.isExampleListing) {
        return res.status(403).json({ 
          message: "Örnek ilanlara teklif verilemez. Bu ilan sadece örnek amaçlıdır." 
        });
      }
      
      // Check for existing pending offer
      const [existingOffer] = await db
        .select()
        .from(offers)
        .where(
          and(
            eq(offers.listingId, listingId),
            eq(offers.buyerId, userId),
            eq(offers.status, 'pending')
          )
        )
        .limit(1);
      
      if (existingOffer) {
        return res.status(400).json({ message: "You already have a pending offer on this listing" });
      }
      
      // Create offer
      const [newOffer] = await db
        .insert(offers)
        .values({
          listingId,
          buyerId: userId,
          sellerId: listing.sellerId,
          amount: String(amount),
          message,
          expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
        } as any)
        .returning();
      
      // Notify seller
      try {
        await db.insert(notifications).values({
          userId: listing.sellerId,
          type: 'system',
          title: 'Yeni Teklif',
          message: `${listing.title} ilanınıza ₺${amount} teklif geldi`,
          link: `/ilan/${listing.id}`,
          relatedId: newOffer.id,
        });

        // Para teklifi: satıcının bunu geç görmesi doğrudan kayıp.
        await olayEpostasiGonder(listing.sellerId, {
          title: 'İlanınıza teklif geldi',
          body: `"${listing.title}" ilanınıza yeni bir teklif var.`,
          details: [['Teklif', `₺${amount}`]],
          actionPath: `/ilan/${listing.id}`,
          actionLabel: 'Teklifi Görüntüle',
        });
      } catch (notifError) {
        console.error("Failed to create offer notification:", notifError);
      }
      
      res.status(201).json(newOffer);
    } catch (error) {
      console.error("Failed to create offer:", error);
      res.status(400).json({ message: "Failed to create offer", error });
    }
  });

  // Respond to an offer (accept/reject/counter)
  app.patch("/api/offers/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const { status, counterAmount, counterMessage } = req.body;
      
      // Get offer
      const [offer] = await db
        .select()
        .from(offers)
        .where(eq(offers.id, req.params.id))
        .limit(1);
      
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      
      if (offer.sellerId !== userId) {
        return res.status(403).json({ message: "Not authorized to respond to this offer" });
      }
      
      if (offer.status !== 'pending') {
        return res.status(400).json({ message: "Can only respond to pending offers" });
      }
      
      const updateData: any = {
        status,
        respondedAt: new Date(),
      };
      
      if (status === 'countered' && counterAmount) {
        updateData.counterAmount = String(counterAmount);
        updateData.counterMessage = counterMessage;
      }
      
      const [updatedOffer] = await db
        .update(offers)
        .set(updateData)
        .where(eq(offers.id, req.params.id))
        .returning();
      
      // Get listing for notification
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, offer.listingId))
        .limit(1);
      
      // Notify buyer
      try {
        let notifMessage = '';
        if (status === 'accepted') {
          notifMessage = `${listing?.title} ilanındaki teklifiniz kabul edildi!`;
        } else if (status === 'rejected') {
          notifMessage = `${listing?.title} ilanındaki teklifiniz reddedildi`;
        } else if (status === 'countered') {
          notifMessage = `${listing?.title} ilanında ₺${counterAmount} karşı teklif geldi`;
        }
        
        await db.insert(notifications).values({
          userId: offer.buyerId,
          type: 'system',
          title: status === 'accepted' ? 'Teklif Kabul Edildi' : status === 'countered' ? 'Karşı Teklif' : 'Teklif Yanıtı',
          message: notifMessage,
          link: `/ilan/${offer.listingId}`,
          relatedId: offer.id,
        });
      } catch (notifError) {
        console.error("Failed to create offer response notification:", notifError);
      }
      
      res.json(updatedOffer);
    } catch (error) {
      console.error("Failed to update offer:", error);
      res.status(400).json({ message: "Failed to update offer", error });
    }
  });

  // Withdraw an offer
  app.delete("/api/offers/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const [offer] = await db
        .select()
        .from(offers)
        .where(eq(offers.id, req.params.id))
        .limit(1);
      
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      
      if (offer.buyerId !== userId) {
        return res.status(403).json({ message: "Not authorized to withdraw this offer" });
      }
      
      if (offer.status !== 'pending') {
        return res.status(400).json({ message: "Can only withdraw pending offers" });
      }
      
      await db
        .update(offers)
        .set({ status: 'withdrawn' })
        .where(eq(offers.id, req.params.id));
      
      res.json({ message: "Offer withdrawn" });
    } catch (error) {
      console.error("Failed to withdraw offer:", error);
      res.status(400).json({ message: "Failed to withdraw offer", error });
    }
  });

  // Track listing share
  app.post("/api/listings/:id/share", async (req: Request, res: Response) => {
    try {
      await db
        .update(listings)
        .set({ shareCount: sql`COALESCE(share_count, 0) + 1` })
        .where(eq(listings.id, req.params.id));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to track share:", error);
      res.status(400).json({ message: "Failed to track share" });
    }
  });

  // Get similar listings for price comparison
  app.get("/api/listings/:id/compare", async (req: Request, res: Response) => {
    try {
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, req.params.id))
        .limit(1);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      // Find similar listings (same category, different sellers)
      const similarListings = await db
        .select({
          id: listings.id,
          title: listings.title,
          price: listings.price,
          images: listings.images,
          city: listings.city,
          breed: listings.breed,
          age: listings.age,
          views: listings.views,
          createdAt: listings.createdAt,
        })
        .from(listings)
        .where(
          and(
            eq(listings.categoryId, listing.categoryId),
            eq(listings.status, 'active'),
            sql`${listings.id} != ${listing.id}`
          )
        )
        .orderBy(sql`ABS(CAST(${listings.price} AS DECIMAL) - CAST(${listing.price} AS DECIMAL))`)
        .limit(6);
      
      // Calculate price stats
      const allPrices = [parseFloat(listing.price), ...similarListings.map(l => parseFloat(l.price))];
      const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      
      res.json({
        currentListing: {
          id: listing.id,
          price: listing.price,
          pricePosition: parseFloat(listing.price) < avgPrice ? 'below_avg' : parseFloat(listing.price) > avgPrice ? 'above_avg' : 'average',
        },
        similarListings,
        priceStats: {
          average: avgPrice.toFixed(2),
          min: minPrice.toFixed(2),
          max: maxPrice.toFixed(2),
          count: allPrices.length,
        }
      });
    } catch (error) {
      console.error("Failed to get price comparison:", error);
      res.status(500).json({ message: "Failed to get price comparison" });
    }
  });

  // ============ Object Storage Routes ============
  
  // Get upload URL for object (legacy - presigned URL approach)
  app.post("/api/objects/upload", createLimiter, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      // Return normalized path for frontend to use when displaying the image
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      console.log("Upload URL generated:", { uploadURL: uploadURL.substring(0, 80) + "...", normalizedPath });
      res.json({ uploadURL, normalizedPath });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Direct file upload through backend (no CORS issues)
  app.post("/api/objects/upload-file", createLimiter, isAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Dosya gerekli" });
      }

      console.log("Received file upload:", { 
        originalName: req.file.originalname, 
        size: req.file.size, 
        mimetype: req.file.mimetype 
      });

      const objectStorageService = new ObjectStorageService();
      const normalizedPath = await objectStorageService.uploadFileBuffer(
        req.file.buffer, 
        req.file.mimetype
      );

      console.log("File uploaded successfully:", normalizedPath);
      res.json({ normalizedPath });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Dosya yüklenemedi" });
    }
  });

  // Serve uploaded objects (listing images - public read access for now)
  // TODO: Implement ACL policy for granular access control per listing
  app.get("/objects/:objectPath(*)", async (req: Request, res: Response) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Serve public assets
  app.get("/public-objects/:filePath(*)", async (req: Request, res: Response) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ Listing Image Routes ============

  // Upload multiple images for a listing (up to 10 at once)
  app.post("/api/listing-images/upload", createLimiter, isAuthenticated, upload.array('images', 10), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "En az bir görsel yüklemeniz gerekmektedir." });
      }

      const listingId = req.body.listingId;
      
      // If listingId provided, verify ownership
      if (listingId) {
        const [listing] = await db
          .select()
          .from(listings)
          .where(eq(listings.id, listingId))
          .limit(1);
        
        if (!listing) {
          return res.status(404).json({ message: "İlan bulunamadı." });
        }
        
        if (listing.sellerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
          return res.status(403).json({ message: "Bu ilana görsel yükleme yetkiniz yok." });
        }
      }

      // Validate all files first
      for (const file of files) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          return res.status(400).json({ message: validation.error });
        }
      }

      // Get current max display order
      let currentMaxOrder = 0;
      if (listingId) {
        const maxOrderResult = await db
          .select({ maxOrder: sql<number>`COALESCE(MAX(${listingImages.displayOrder}), 0)` })
          .from(listingImages)
          .where(eq(listingImages.listingId, listingId));
        currentMaxOrder = maxOrderResult[0]?.maxOrder || 0;
      }

      // Process and upload all images
      const uploadedImages = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const processed = await processAndUploadImage(file.buffer, file.originalname, listingId);
          
          const [imageRecord] = await db.insert(listingImages).values({
            listingId: listingId || null,
            originalKey: processed.originalKey,
            thumbnailKey: processed.thumbnailKey,
            mediumKey: processed.mediumKey,
            largeKey: processed.largeKey,
            originalUrl: processed.originalUrl,
            thumbnailUrl: processed.thumbnailUrl,
            mediumUrl: processed.mediumUrl,
            largeUrl: processed.largeUrl,
            width: processed.width,
            height: processed.height,
            fileSize: processed.fileSize,
            mimeType: processed.mimeType,
            displayOrder: currentMaxOrder + i + 1,
            isCover: i === 0 && currentMaxOrder === 0,
            status: 'ready',
          }).returning();
          
          uploadedImages.push(imageRecord);
        } catch (err) {
          console.error(`Error processing image ${file.originalname}:`, err);
        }
      }

      res.json({
        message: `${uploadedImages.length} görsel başarıyla yüklendi.`,
        images: uploadedImages,
      });
    } catch (error) {
      console.error("Error uploading listing images:", error);
      res.status(500).json({ message: "Görsel yüklenirken bir hata oluştu." });
    }
  });

  // Get images for a listing (with CDN-friendly caching headers)
  app.get("/api/listing-images/:listingId", async (req: Request, res: Response) => {
    try {
      // Try cache first
      const cacheKey = `listing_images:${req.params.listingId}`;
      const cached = await cache.get<any[]>(cacheKey);
      
      if (cached) {
        // Set aggressive caching headers for CDN
        res.set({
          'Cache-Control': 'public, max-age=300, s-maxage=600', // 5min browser, 10min CDN
          'CDN-Cache-Control': 'public, max-age=600',
          'Vary': 'Accept-Encoding',
        });
        return res.json(cached);
      }
      
      const images = await db
        .select()
        .from(listingImages)
        .where(eq(listingImages.listingId, req.params.listingId))
        .orderBy(listingImages.displayOrder);
      
      // Cache for 5 minutes
      await cache.set(cacheKey, images, 300);
      
      // Set caching headers
      res.set({
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'CDN-Cache-Control': 'public, max-age=600',
        'Vary': 'Accept-Encoding',
      });
      
      res.json(images);
    } catch (error) {
      console.error("Error fetching listing images:", error);
      res.status(500).json({ message: "Görseller getirilemedi." });
    }
  });

  // Delete a listing image
  app.delete("/api/listing-images/:imageId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [image] = await db
        .select()
        .from(listingImages)
        .where(eq(listingImages.id, req.params.imageId))
        .limit(1);
      
      if (!image) {
        return res.status(404).json({ message: "Görsel bulunamadı." });
      }

      // Check ownership through listing
      if (image.listingId) {
        const [listing] = await db
          .select()
          .from(listings)
          .where(eq(listings.id, image.listingId))
          .limit(1);
        
        if (listing && listing.sellerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
          return res.status(403).json({ message: "Bu görseli silme yetkiniz yok." });
        }
      }

      // Delete from object storage
      const keysToDelete = [
        image.originalKey,
        image.thumbnailKey,
        image.mediumKey,
        image.largeKey,
      ].filter(Boolean) as string[];
      
      await deleteImageVariants(keysToDelete);

      // Delete from database
      await db.delete(listingImages).where(eq(listingImages.id, req.params.imageId));

      res.json({ message: "Görsel başarıyla silindi." });
    } catch (error) {
      console.error("Error deleting listing image:", error);
      res.status(500).json({ message: "Görsel silinirken bir hata oluştu." });
    }
  });

  // Reorder listing images
  app.patch("/api/listing-images/reorder", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { listingId, imageIds } = req.body;
      
      if (!listingId || !Array.isArray(imageIds)) {
        return res.status(400).json({ message: "Geçersiz istek." });
      }

      // Verify ownership
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);
      
      if (!listing) {
        return res.status(404).json({ message: "İlan bulunamadı." });
      }
      
      if (listing.sellerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Yetkiniz yok." });
      }

      // Update display orders
      for (let i = 0; i < imageIds.length; i++) {
        await db
          .update(listingImages)
          .set({ displayOrder: i })
          .where(and(
            eq(listingImages.id, imageIds[i]),
            eq(listingImages.listingId, listingId)
          ));
      }

      res.json({ message: "Görsel sıralaması güncellendi." });
    } catch (error) {
      console.error("Error reordering images:", error);
      res.status(500).json({ message: "Sıralama güncellenirken bir hata oluştu." });
    }
  });

  // Set cover image
  app.patch("/api/listing-images/:imageId/cover", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [image] = await db
        .select()
        .from(listingImages)
        .where(eq(listingImages.id, req.params.imageId))
        .limit(1);
      
      if (!image || !image.listingId) {
        return res.status(404).json({ message: "Görsel bulunamadı." });
      }

      // Verify ownership
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, image.listingId))
        .limit(1);
      
      if (!listing) {
        return res.status(404).json({ message: "İlan bulunamadı." });
      }
      
      if (listing.sellerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Yetkiniz yok." });
      }

      // Clear existing cover
      await db
        .update(listingImages)
        .set({ isCover: false })
        .where(eq(listingImages.listingId, image.listingId));

      // Set new cover
      await db
        .update(listingImages)
        .set({ isCover: true })
        .where(eq(listingImages.id, req.params.imageId));

      res.json({ message: "Kapak görseli güncellendi." });
    } catch (error) {
      console.error("Error setting cover image:", error);
      res.status(500).json({ message: "Kapak görseli güncellenirken bir hata oluştu." });
    }
  });

  // ============ Listing Documents Routes ============

  // Upload document for a listing

  // Get documents for a listing

  // Delete a document

  // ============ Draft Listing Routes ============

  // Create a draft listing
  app.post("/api/listings/draft", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const sellerId = getUserId(user);

      // Minimal validation for drafts - just need sellerId
      // Sanitize price - remove locale formatting and ensure valid number
      let sanitizedPrice = "0";
      if (req.body.price) {
        const priceStr = String(req.body.price).replace(/\./g, '').replace(/,/g, '.');
        const priceNum = parseFloat(priceStr);
        if (!isNaN(priceNum) && priceNum >= 0 && priceNum <= 99999999.99) {
          sanitizedPrice = priceNum.toFixed(2);
        }
      }
      
      const draftData = {
        sellerId,
        categoryId: req.body.categoryId || null,
        title: req.body.title || "Taslak İlan",
        description: req.body.description || "",
        price: sanitizedPrice,
        city: req.body.city || "",
        district: req.body.district || "",
        status: 'draft' as const,
        images: req.body.images || [],
        videoUrls: req.body.videoUrls || [],
        categoryAttributes: req.body.categoryAttributes || {},
        breed: req.body.breed || null,
        ageCategory: req.body.ageCategory || null,
        gender: req.body.gender || null,
        healthStatus: req.body.healthStatus || null,
        vaccinated: req.body.vaccinated || false,
        neutered: req.body.neutered || false,
        pedigree: req.body.pedigree || false,
        characterTraits: req.body.characterTraits || [],
        deliveryInfo: req.body.deliveryInfo || null,
        warrantyInfo: req.body.warrantyInfo || null,
      };

      const [listing] = await db.insert(listings).values(draftData as any).returning();

      res.status(201).json({
        message: "Taslak oluşturuldu",
        listing,
      });
    } catch (error) {
      console.error("Failed to create draft listing:", error);
      res.status(500).json({ message: "Taslak oluşturulamadı" });
    }
  });

  // Update a draft listing (autosave)
  app.patch("/api/listings/:listingId/draft", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { listingId } = req.params;
      const sellerId = getUserId(req.user);

      // Verify ownership
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);

      if (!listing) {
        return res.status(404).json({ message: "İlan bulunamadı" });
      }

      if (listing.sellerId !== sellerId && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Bu ilanı düzenleme yetkiniz yok" });
      }

      if (listing.status !== 'draft') {
        return res.status(400).json({ message: "Sadece taslak ilanlar bu şekilde güncellenebilir" });
      }

      // Partial update - only update provided fields
      const updateData: any = { updatedAt: new Date() };
      
      const allowedFields = [
        'categoryId', 'title', 'description', 'city', 'district',
        'images', 'videoUrls', 'categoryAttributes', 'breed', 'ageCategory',
        'gender', 'healthStatus', 'vaccinated', 'neutered', 'pedigree',
        'characterTraits', 'deliveryInfo', 'warrantyInfo'
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      
      // Handle price separately with sanitization
      if (req.body.price !== undefined) {
        const priceStr = String(req.body.price).replace(/\./g, '').replace(/,/g, '.');
        const priceNum = parseFloat(priceStr);
        if (!isNaN(priceNum) && priceNum >= 0 && priceNum <= 99999999.99) {
          updateData.price = priceNum.toFixed(2);
        }
      }

      const [updatedListing] = await db
        .update(listings)
        .set(updateData)
        .where(eq(listings.id, listingId))
        .returning();

      res.json({
        message: "Taslak güncellendi",
        listing: updatedListing,
      });
    } catch (error) {
      console.error("Failed to update draft listing:", error);
      res.status(500).json({ message: "Taslak güncellenemedi" });
    }
  });

  // Get user's draft listings
  app.get("/api/listings/drafts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sellerId = getUserId(req.user);

      const drafts = await db
        .select()
        .from(listings)
        .where(and(
          eq(listings.sellerId, sellerId),
          eq(listings.status, 'draft')
        ))
        .orderBy(desc(listings.updatedAt));

      res.json(drafts);
    } catch (error) {
      console.error("Failed to fetch draft listings:", error);
      res.status(500).json({ message: "Taslaklar getirilemedi" });
    }
  });

  // Publish a draft (convert to pending/active)
  app.post("/api/listings/:listingId/publish", isAuthenticated, createLimiter, botGuard, async (req: Request, res: Response) => {
    try {
      const { listingId } = req.params;
      const sellerId = getUserId(req.user);
      const user = req.user!;

      // Verify ownership
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);

      if (!listing) {
        return res.status(404).json({ message: "İlan bulunamadı" });
      }

      if (listing.sellerId !== sellerId) {
        return res.status(403).json({ message: "Bu ilanı yayınlama yetkiniz yok" });
      }

      if (listing.status !== 'draft') {
        return res.status(400).json({ message: "Bu ilan zaten yayınlanmış" });
      }

      // Validate required fields
      if (!listing.categoryId || !listing.title || listing.title === "Taslak İlan") {
        return res.status(400).json({ message: "Lütfen kategori ve başlık alanlarını doldurun" });
      }

      if (!listing.description || listing.description.length < 20) {
        return res.status(400).json({ message: "Açıklama en az 20 karakter olmalıdır" });
      }

      if (!listing.city || !listing.district) {
        return res.status(400).json({ message: "Konum bilgisi gereklidir" });
      }

      // Email verification check for production
      // Doğrulama durumu veritabanından okunur — oturum nesnesinde yoktur.
      if (process.env.NODE_ENV === 'production' && !(await isEmailVerified(user))) {
        return res.status(403).json({
          message: "İlan yayınlamak için email adresinizi doğrulamanız gerekmektedir.",
          requiresVerification: true,
        });
      }

      // Bot koruması botGuard katmanında (bal küpü + form doldurma süresi).

      // Set status based on environment
      const newStatus = process.env.NODE_ENV === 'production' ? 'pending' : 'active';

      const [publishedListing] = await db
        .update(listings)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(listings.id, listingId))
        .returning();

      // Update user stats
      await db
        .update(users)
        .set({
          totalListings: sql`${users.totalListings} + 1`,
        })
        .where(eq(users.id, sellerId));

      res.json({
        message: newStatus === 'pending' 
          ? "İlanınız yayınlandı ve onay bekliyor" 
          : "İlanınız başarıyla yayınlandı",
        listing: publishedListing,
      });
    } catch (error) {
      console.error("Failed to publish listing:", error);
      res.status(500).json({ message: "İlan yayınlanamadı" });
    }
  });

  // ============ Report Routes ============

  // Create a report
  app.post("/api/reports", isAuthenticated, createLimiter, async (req: Request, res: Response) => {
    try {
      const data = insertReportSchema.parse({
        ...req.body,
        reporterId: getUserId(req.user),
      });

      const [report] = await db
        .insert(reports)
        .values(data)
        .returning();

      res.status(201).json(report);
    } catch (error) {
      console.error("Failed to create report:", error);
      res.status(400).json({ message: "Şikayet oluşturulamadı", error });
    }
  });

  // Get user's reports
  app.get("/api/reports/my", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);

      const userReports = await db
        .select()
        .from(reports)
        .where(eq(reports.reporterId, userId))
        .orderBy(desc(reports.createdAt));

      res.json(userReports);
    } catch (error) {
      console.error("Failed to fetch user reports:", error);
      res.status(500).json({ message: "Şikayetler getirilemedi" });
    }
  });

  // Admin: Get all reports
  app.get("/api/admin/reports", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      if ((req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Admin yetkisi gereklidir" });
      }

      const status = req.query.status as string;
      
      let query = db.select().from(reports);
      
      if (status && status !== 'all') {
        query = query.where(eq(reports.status, status as any)) as any;
      }

      const allReports = await query.orderBy(desc(reports.createdAt));

      res.json(allReports);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      res.status(500).json({ message: "Şikayetler getirilemedi" });
    }
  });

  // Admin: Update report status
  app.patch("/api/admin/reports/:id", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      if ((req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Admin yetkisi gereklidir" });
      }

      const reportId = req.params.id;
      const { status, adminNotes } = req.body;

      const updateData: any = {};
      if (status) updateData.status = status;
      if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
      
      if (status === 'resolved' || status === 'dismissed') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = getUserId(req.user);
      }

      const [updatedReport] = await db
        .update(reports)
        .set(updateData)
        .where(eq(reports.id, reportId))
        .returning();

      if (!updatedReport) {
        return res.status(404).json({ message: "Şikayet bulunamadı" });
      }

      res.json(updatedReport);
    } catch (error) {
      console.error("Failed to update report:", error);
      res.status(500).json({ message: "Şikayet güncellenemedi" });
    }
  });

  // ============ Admin Routes ============
  // Admin middleware - checks role from database for real-time admin access
  // Yönetim ara katmanları `server/admin-guard.ts` içinde tanımlıdır.

  // Admin PIN verification endpoint
  app.post("/api/admin/verify-pin", pinAttemptLimiter, isAuthenticated, adminRoleMiddleware, async (req: Request, res: Response) => {
    try {
      const { pin } = req.body;
      const adminPin = process.env.ADMIN_PANEL_PIN;

      // Güvenlik: varsayılan/gömülü PIN YOK. Tanımlı değilse erişim kapalı.
      if (!adminPin) {
        console.error("ADMIN_PANEL_PIN tanımlı değil — admin paneli erişimi kapalı.");
        return res.status(503).json({
          message: "Admin paneli yapılandırılmamış. Sunucu yöneticisiyle görüşün.",
        });
      }

      if (!pin || typeof pin !== "string") {
        return res.status(400).json({ message: "PIN kodu gereklidir" });
      }

      // Zamanlama saldırılarına karşı sabit süreli karşılaştırma
      const given = Buffer.from(String(pin));
      const expected = Buffer.from(adminPin);
      const pinMatches =
        given.length === expected.length && timingSafeEqual(given, expected);

      if (!pinMatches) {
        console.log(`Admin PIN verification failed for user: ${getUserId(req.user)}`);
        return res.status(401).json({ message: "Geçersiz PIN kodu" });
      }

      // Store PIN verification in session
      (req.session as any).adminPinVerified = true;
      console.log(`Admin PIN verified for user: ${getUserId(req.user)}`);
      
      res.json({ success: true, message: "PIN doğrulandı" });
    } catch (error) {
      console.error("Admin PIN verification error:", error);
      res.status(500).json({ message: "Doğrulama hatası" });
    }
  });

  // Check admin PIN status
  app.get("/api/admin/pin-status", isAuthenticated, adminRoleMiddleware, (req: Request, res: Response) => {
    const session = req.session as any;
    res.json({ verified: !!session.adminPinVerified });
  });

  /**
   * Bir kullanıcının aktivite geçmişi.
   *
   * Yönetim panelindeki kullanıcı detayında "Detaylı aktivite geçmişi yakında
   * eklenecek" yazıyordu; oysa `login_history` tablosu her giriş denemesini
   * (yöntem, IP, cihaz, başarı/başarısızlık ve gerekçe) zaten kaydediyordu.
   * Veri vardı, yalnızca ekrana bağlanmamıştı.
   *
   * Moderasyon açısından değerli: bir hesabın farklı IP'lerden art arda
   * başarısız giriş alması ya da alışılmadık bir cihazdan açılması şüphe
   * işaretidir.
   */
  app.get("/api/admin/users/:id/activity", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [kullanici] = await db
        .select({ id: users.id, createdAt: users.createdAt })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!kullanici) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }

      const girisler = await db
        .select({
          id: loginHistory.id,
          method: loginHistory.loginMethod,
          ipAddress: loginHistory.ipAddress,
          userAgent: loginHistory.userAgent,
          success: loginHistory.success,
          failureReason: loginHistory.failureReason,
          createdAt: loginHistory.createdAt,
        })
        .from(loginHistory)
        .where(eq(loginHistory.userId, id))
        .orderBy(desc(loginHistory.createdAt))
        .limit(25);

      const [basarisiz] = await db
        .select({ n: count() })
        .from(loginHistory)
        .where(and(eq(loginHistory.userId, id), eq(loginHistory.success, false)));

      const ilanDurumlari = await db
        .select({ status: listings.status, n: count() })
        .from(listings)
        .where(eq(listings.sellerId, id))
        .groupBy(listings.status);

      res.json({
        // Ham user-agent yerine okunabilir cihaz bilgisi döndürülüyor.
        logins: girisler.map((g) => {
          const { userAgent, ...kalan } = g;
          return { ...kalan, device: parseUserAgent(userAgent ?? undefined) };
        }),
        failedLoginCount: Number(basarisiz?.n ?? 0),
        listingsByStatus: Object.fromEntries(ilanDurumlari.map((s) => [s.status ?? "bilinmiyor", Number(s.n)])),
        memberSince: kullanici.createdAt,
      });
    } catch (error) {
      console.error("Kullanıcı aktivitesi alınamadı:", error);
      res.status(500).json({ message: "Aktivite geçmişi alınamadı" });
    }
  });

  // ============ Kategori Yönetimi ============
  //
  // Yönetim panelindeki kategori sayfası vardı ama tamamen göstermelikti:
  // "Oluştur", "Güncelle" ve "Sil" düğmeleri yalnızca "Bu özellik yakında
  // eklenecek" mesajı gösteriyordu; sunucuda kategori yazan hiçbir uç yoktu.
  // Aşağıdaki üç uç bu boşluğu dolduruyor.

  /** Kategori önbellekleri 24 saat TTL ile tutuluyor; her değişiklikte temizlenmeli. */
  async function kategoriOnbelleginiTemizle() {
    await Promise.all([
      cache.del(cacheKeys.categories()),
      cache.del(cacheKeys.categoryTree()),
      cache.del(cacheKeys.categoryStats()),
    ]).catch(() => {
      /* önbellek temizlenemese bile işlem başarılı sayılır */
    });
  }

  /** Aynı slug varsa sonuna -2, -3 ... ekleyerek benzersizleştirir. */
  async function benzersizSlug(taban: string, haricId?: string): Promise<string> {
    const kok = slugify(taban) || "kategori";
    for (let i = 1; i < 200; i++) {
      const aday = i === 1 ? kok : `${kok}-${i}`;
      const [carpisan] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, aday))
        .limit(1);
      if (!carpisan || carpisan.id === haricId) return aday;
    }
    return `${kok}-${Date.now()}`;
  }

  /** Verilen kategorinin tüm alt dallarını (kendisi hariç) döndürür. */
  async function altDallar(kokId: string) {
    const hepsi = await db
      .select({ id: categories.id, parentId: categories.parentId })
      .from(categories);
    const cocuklar = new Map<string, string[]>();
    for (const c of hepsi) {
      if (!c.parentId) continue;
      cocuklar.set(c.parentId, [...(cocuklar.get(c.parentId) || []), c.id]);
    }
    const sonuc: string[] = [];
    const yigin = [...(cocuklar.get(kokId) || [])];
    while (yigin.length) {
      const id = yigin.pop()!;
      sonuc.push(id);
      yigin.push(...(cocuklar.get(id) || []));
    }
    return sonuc;
  }

  /** Bir kategorinin ve altındaki tüm dalların depth/path değerlerini yeniden hesaplar. */
  async function agaciYenidenHesapla(kokId: string) {
    const kuyruk = [kokId];
    while (kuyruk.length) {
      const id = kuyruk.shift()!;
      const [dugum] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
      if (!dugum) continue;

      let derinlik = 0;
      let yol: string[] = [];
      if (dugum.parentId) {
        const [ebeveyn] = await db
          .select({ depth: categories.depth, path: categories.path, id: categories.id })
          .from(categories)
          .where(eq(categories.id, dugum.parentId))
          .limit(1);
        if (ebeveyn) {
          derinlik = (ebeveyn.depth ?? 0) + 1;
          yol = [...((ebeveyn.path as string[]) || []), ebeveyn.id];
        }
      }

      if (derinlik !== dugum.depth || JSON.stringify(yol) !== JSON.stringify(dugum.path)) {
        await db.update(categories).set({ depth: derinlik, path: yol }).where(eq(categories.id, id));
      }

      const cocuklar = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.parentId, id));
      kuyruk.push(...cocuklar.map((c) => c.id));
    }
  }

  app.post("/api/admin/categories", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { name, slug, parentId, icon, description, order } = req.body;

      if (!name || typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({ message: "Kategori adı en az 2 karakter olmalıdır" });
      }

      let derinlik = 0;
      let yol: string[] = [];
      if (parentId) {
        const [ebeveyn] = await db.select().from(categories).where(eq(categories.id, parentId)).limit(1);
        if (!ebeveyn) return res.status(400).json({ message: "Üst kategori bulunamadı" });
        derinlik = (ebeveyn.depth ?? 0) + 1;
        yol = [...((ebeveyn.path as string[]) || []), ebeveyn.id];
      }

      const [yeni] = await db
        .insert(categories)
        .values({
          name: name.trim(),
          slug: await benzersizSlug(slug || name),
          parentId: parentId || null,
          icon: icon || null,
          description: description || null,
          order: Number.isFinite(Number(order)) ? Number(order) : 0,
          depth: derinlik,
          path: yol,
        })
        .returning();

      await kategoriOnbelleginiTemizle();
      res.status(201).json(yeni);
    } catch (error) {
      console.error("Kategori oluşturulamadı:", error);
      res.status(500).json({ message: "Kategori oluşturulamadı" });
    }
  });

  app.patch("/api/admin/categories/:id", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, slug, parentId, icon, description, order } = req.body;

      const [mevcut] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
      if (!mevcut) return res.status(404).json({ message: "Kategori bulunamadı" });

      const ebeveynDegisti = parentId !== undefined && (parentId || null) !== mevcut.parentId;

      if (ebeveynDegisti && parentId) {
        // Döngü koruması: bir kategori kendi altına ya da kendi alt dalının
        // altına taşınırsa ağaç kapalı bir halkaya döner ve gezinme sonsuz
        // döngüye girer.
        if (parentId === id) {
          return res.status(400).json({ message: "Bir kategori kendi alt kategorisi olamaz" });
        }
        const altlar = await altDallar(id);
        if (altlar.includes(parentId)) {
          return res.status(400).json({ message: "Bir kategori kendi alt dalının altına taşınamaz" });
        }
        const [ebeveyn] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, parentId)).limit(1);
        if (!ebeveyn) return res.status(400).json({ message: "Üst kategori bulunamadı" });
      }

      const guncelleme: Record<string, unknown> = {};
      if (name !== undefined) guncelleme.name = String(name).trim();
      if (slug !== undefined) guncelleme.slug = await benzersizSlug(slug || name || mevcut.name, id);
      if (parentId !== undefined) guncelleme.parentId = parentId || null;
      if (icon !== undefined) guncelleme.icon = icon || null;
      if (description !== undefined) guncelleme.description = description || null;
      if (order !== undefined && Number.isFinite(Number(order))) guncelleme.order = Number(order);

      if (Object.keys(guncelleme).length === 0) {
        return res.status(400).json({ message: "Güncellenecek alan verilmedi" });
      }

      const [guncel] = await db.update(categories).set(guncelleme).where(eq(categories.id, id)).returning();

      // Üst kategori değiştiyse bu dalın ve altındaki HER kategorinin
      // depth/path değerleri artık yanlıştır; ağaç yeniden hesaplanır.
      if (ebeveynDegisti) await agaciYenidenHesapla(id);

      await kategoriOnbelleginiTemizle();
      res.json(guncel);
    } catch (error) {
      console.error("Kategori güncellenemedi:", error);
      res.status(500).json({ message: "Kategori güncellenemedi" });
    }
  });

  app.delete("/api/admin/categories/:id", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [mevcut] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
      if (!mevcut) return res.status(404).json({ message: "Kategori bulunamadı" });

      // Alt kategorisi olan silinmez: parentId kısıtı ON DELETE SET NULL
      // olduğu için silme sessizce geçer ve alt dallar kök kategoriye
      // dönüşerek menüde başıboş görünürdü.
      const [cocuk] = await db.select({ id: categories.id }).from(categories).where(eq(categories.parentId, id)).limit(1);
      if (cocuk) {
        return res.status(409).json({
          message: "Bu kategorinin alt kategorileri var. Önce onları silin veya başka bir kategoriye taşıyın.",
        });
      }

      // İlanı olan silinmez: listings.categoryId NOT NULL olduğu için
      // veritabanı zaten reddeder, ama kullanıcıya anlaşılır mesaj verilir.
      const [{ n }] = await db
        .select({ n: count() })
        .from(listings)
        .where(eq(listings.categoryId, id));
      if (Number(n) > 0) {
        return res.status(409).json({
          message: `Bu kategoride ${n} ilan var. Kategori silinemez; önce ilanları başka kategoriye taşıyın.`,
        });
      }

      await db.delete(categories).where(eq(categories.id, id));
      await kategoriOnbelleginiTemizle();
      res.json({ success: true, message: `"${mevcut.name}" kategorisi silindi` });
    } catch (error) {
      console.error("Kategori silinemedi:", error);
      res.status(500).json({ message: "Kategori silinemedi" });
    }
  });

  // Admin dashboard stats
  app.get("/api/admin/stats", isAuthenticated, adminMiddleware, async (_req: Request, res: Response) => {
    try {
      // Check cache first for performance
      const cacheKey = cacheKeys.adminStats();
      const cached = await cache.get<any>(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Calculate today's start
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      // Calculate week start for growth calculation
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      // Parallel queries for better performance
      const [
        usersCount, 
        listingsCount, 
        activeListings, 
        pendingListings, 
        verifiedUsers,
        storesCount,
        pendingStores,
        pendingReports,
        todayListings,
        todayUsers,
        lastWeekUsers
      ] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(listings),
        db.select({ count: count() }).from(listings).where(eq(listings.status, "active")),
        db.select({ count: count() }).from(listings).where(eq(listings.status, "pending")),
        db.select({ count: count() }).from(users).where(eq(users.emailVerified, true)),
        db.select({ count: count() }).from(stores),
        db.select({ count: count() }).from(stores).where(eq(stores.status, "pending")),
        db.select({ count: count() }).from(reports).where(eq(reports.status, "pending")),
        db.select({ count: count() }).from(listings).where(gte(listings.createdAt, todayStart)),
        db.select({ count: count() }).from(users).where(gte(users.createdAt, todayStart)),
        db.select({ count: count() }).from(users).where(gte(users.createdAt, weekStart))
      ]);

      const totalUsersNum = Number(usersCount[0].count);
      const lastWeekUsersNum = Number(lastWeekUsers[0].count);
      const weeklyGrowth = totalUsersNum > 0 ? Math.round((lastWeekUsersNum / totalUsersNum) * 100) : 0;

      const stats = {
        totalUsers: totalUsersNum,
        verifiedUsers: Number(verifiedUsers[0].count),
        totalListings: Number(listingsCount[0].count),
        activeListings: Number(activeListings[0].count),
        pendingListings: Number(pendingListings[0].count),
        totalStores: Number(storesCount[0].count),
        pendingStores: Number(pendingStores[0].count),
        pendingReports: Number(pendingReports[0].count),
        todayListings: Number(todayListings[0].count),
        todayUsers: Number(todayUsers[0].count),
        weeklyGrowth: weeklyGrowth,
      };

      // Cache stats for 1 minute
      await cache.set(cacheKey, stats, cacheTTL.adminStats);

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "İstatistikler getirilemedi" });
    }
  });

  // Get all listings for moderation (admin only)
  app.get("/api/admin/listings", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      
      const conditions = [];
      if (status && status !== 'all') {
        conditions.push(eq(listings.status, status as any));
      }

      // Get listings with seller info
      const allListings = await db
        .select({
          id: listings.id,
          title: listings.title,
          description: listings.description,
          price: listings.price,
          categoryId: listings.categoryId,
          images: listings.images,
          city: listings.city,
          district: listings.district,
          status: listings.status,
          createdAt: listings.createdAt,
          moderatedAt: listings.moderatedAt,
          moderationReason: listings.moderationReason,
          sellerId: listings.sellerId,
          sellerUsername: users.username,
          sellerEmail: users.email,
          sellerIsVerified: users.emailVerified,
        })
        .from(listings)
        .leftJoin(users, eq(listings.sellerId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(listings.createdAt))
        .limit(100);
        
      res.json(allListings);
    } catch (error) {
      console.error("Error fetching listings for admin:", error);
      res.status(500).json({ message: "İlanlar getirilemedi" });
    }
  });

  // Update listing status (admin only - approve/reject with strict Zod validation)
  app.patch("/api/admin/listings/:id/status", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      // SECURITY: Validate with Zod schema
      const validationResult = moderateListingSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Geçersiz istek",
          errors: validationResult.error.errors,
        });
      }

      const { status, reason } = validationResult.data;

      // Get current listing
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, req.params.id))
        .limit(1);

      if (!listing) {
        return res.status(404).json({ message: "İlan bulunamadı" });
      }

      /*
       * İzin verilen durum geçişleri.
       *
       * Önceden yalnızca `pending` ilanlar denetlenebiliyordu. Bunun sonucu,
       * bir kez yayına alınan ilanın yönetici tarafından BİR DAHA
       * kaldırılamamasıydı: şikayet gelse, sahte çıksa veya hayvan refahı
       * kurallarına aykırı olsa bile. Bir ilan sitesinde yayındaki içeriği
       * kaldıramamak kabul edilemez.
       *
       * Kapsam dışı bırakılanlar bilinçlidir: `draft` henüz gönderilmemiştir,
       * `sold` / `expired` / `deleted` ise satıcıya veya sisteme ait
       * durumlardır; yöneticinin satılmış bir ilanı yeniden yayına alması
       * doğru olmaz.
       */
      const IZINLI_GECISLER: Record<string, string[]> = {
        pending: ["active", "rejected"],   // onayla / reddet
        active: ["rejected"],              // yayından kaldır
        rejected: ["active"],              // itiraz üzerine geri aç
      };

      const izinli = IZINLI_GECISLER[listing.status ?? ""] ?? [];
      if (!izinli.includes(status)) {
        return res.status(400).json({
          message: `"${listing.status}" durumundaki bir ilan "${status}" yapılamaz.`,
        });
      }

      // Update with full audit trail
      // SECURITY FIX: Clear moderationReason on approval
      const [updated] = await db
        .update(listings)
        .set({
          status: status,
          moderatedBy: getUserId(req.user),
          moderatedAt: new Date(),
          moderationReason: status === 'rejected' ? reason : null,
        })
        .where(eq(listings.id, req.params.id))
        .returning();

      // Send notification to seller about moderation result
      try {
        if (status === 'active') {
          const [notification] = await db.insert(notifications).values({
            userId: listing.sellerId,
            type: 'listing_approved',
            title: 'İlan Onaylandı',
            message: `"${listing.title}" ilanınız onaylandı ve yayına girdi`,
            link: `/ilan/${listing.id}`,
            relatedId: listing.id,
          }).returning();
          
          notificationEmitter.emit('notification', {
            userId: listing.sellerId,
            notification,
          });

          // Satıcı moderasyonu bekliyor; siteye girmeden sonucu öğrenemezdi.
          await olayEpostasiGonder(listing.sellerId, {
            title: 'İlanınız yayınlandı',
            body: `"${listing.title}" ilanınız onaylandı ve yayına girdi.`,
            actionPath: `/ilan/${listing.id}`,
            actionLabel: 'İlanı Görüntüle',
          });
        } else if (status === 'rejected') {
          // Yayındaki bir ilan kaldırıldıysa "reddedildi" demek yanlış olur —
          // satıcı ilanın zaten yayında olduğunu biliyor.
          const yayindaydi = listing.status === 'active';
          const [notification] = await db.insert(notifications).values({
            userId: listing.sellerId,
            type: 'listing_rejected',
            title: yayindaydi ? 'İlan Yayından Kaldırıldı' : 'İlan Reddedildi',
            message: yayindaydi
              ? `"${listing.title}" ilanınız yayından kaldırıldı${reason ? `: ${reason}` : ''}`
              : `"${listing.title}" ilanınız reddedildi${reason ? `: ${reason}` : ''}`,
            link: `/ilan/${listing.id}`,
            relatedId: listing.id,
          }).returning();
          
          notificationEmitter.emit('notification', {
            userId: listing.sellerId,
            notification,
          });

          await olayEpostasiGonder(listing.sellerId, {
            title: yayindaydi ? 'İlanınız yayından kaldırıldı' : 'İlanınız yayınlanmadı',
            body: yayindaydi
              ? `"${listing.title}" ilanınız yayından kaldırıldı.`
              : `"${listing.title}" ilanınız yayınlanmadı.`,
            details: reason ? [['Gerekçe', reason]] : undefined,
            actionPath: '/panel/ilanlarim',
            actionLabel: 'İlanlarım',
          });
        }
      } catch (notifError) {
        console.error("Failed to create moderation notification:", notifError);
      }

      res.json({
        ...updated,
        message: status === 'active' ? 'İlan başarıyla onaylandı' : 'İlan reddedildi',
      });
    } catch (error) {
      console.error("Error updating listing status:", error);
      res.status(500).json({ message: "Durum güncellenemedi" });
    }
  });

  // ============ Admin User Management Routes ============
  // Get all users (admin only)
  app.get("/api/admin/users", isAuthenticated, adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          role: users.role,
          status: users.status,
          statusChangedAt: users.statusChangedAt,
          statusReason: users.statusReason,
          emailVerified: users.emailVerified,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(200);
      
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users for admin:", error);
      res.status(500).json({ message: "Kullanıcılar getirilemedi" });
    }
  });

  // Update user role (admin only)
  app.patch("/api/admin/users/:id/role", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      // Validate role
      const validRoles = ['buyer', 'seller', 'vet', 'transporter', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Geçersiz rol" });
      }
      
      const [updatedUser] = await db
        .update(users)
        .set({ role })
        .where(eq(users.id, id))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }

      // Rol oturuma da yazıldığı için (adminMiddleware), rol değişiminde
      // kullanıcının oturumları sonlandırılır. Aksi halde yöneticiliği
      // alınan biri, oturumu dolana kadar bayat "admin" rolüyle işlem
      // yapmaya devam edebilirdi.
      try {
        await db.execute(
          sql`DELETE FROM sessions WHERE sess #>> '{passport,user,claims,sub}' = ${id}`
        );
        console.log(`🔒 Rol değişti, oturumlar sonlandırıldı: ${id} → ${role}`);
      } catch (sessionErr) {
        console.error("Oturum sonlandırma hatası:", sessionErr);
      }

      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Rol güncellenemedi" });
    }
  });

  // Update user status - ban/unban (admin only)
  app.patch("/api/admin/users/:id/status", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      
      // Validate status
      const validStatuses = ['active', 'banned', 'suspended'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Geçersiz durum" });
      }
      
      // Prevent self-ban
      const adminId = getUserId(req.user);
      if (id === adminId) {
        return res.status(400).json({ message: "Kendinizi yasaklayamazsınız" });
      }
      
      // Update user status with audit trail
      const [updatedUser] = await db
        .update(users)
        .set({ 
          status: status as any,
          statusChangedAt: new Date(),
          statusChangedBy: adminId,
          statusReason: reason || null,
        })
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }

      // Yasaklama/askıya alma ANINDA etkili olmalı: kullanıcının açık
      // oturumları silinir. Aksi halde mevcut çerezle oturum TTL'i (7 gün)
      // boyunca siteyi kullanmaya devam edebilirdi.
      if (status !== "active") {
        try {
          await db.execute(
            sql`DELETE FROM sessions WHERE sess #>> '{passport,user,claims,sub}' = ${id}`
          );
          console.log(`🔒 Oturumlar sonlandırıldı: ${id} (${status})`);
        } catch (sessionErr) {
          // Oturum temizliği başarısız olsa da durum güncellemesi geçerlidir
          console.error("Oturum sonlandırma hatası:", sessionErr);
        }
      }

      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Durum güncellenemedi" });
    }
  });

  // ============ Admin Store Management Routes ============
  // Get all stores (admin only)
  app.get("/api/admin/stores", isAuthenticated, adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const allStores = await db
        .select({
          id: stores.id,
          name: stores.displayName,
          slug: stores.slug,
          description: stores.description,
          storeType: stores.storeType,
          city: stores.city,
          status: stores.status,
          createdAt: stores.createdAt,
          ownerId: stores.ownerId,
          ownerName: sql<string>`COALESCE(NULLIF(TRIM(CONCAT(${users.firstName}, ' ', ${users.lastName})), ''), ${users.username})`,
          ownerEmail: users.email,
        })
        .from(stores)
        .leftJoin(users, eq(stores.ownerId, users.id))
        .orderBy(desc(stores.createdAt))
        .limit(100);
      
      res.json(allStores);
    } catch (error) {
      console.error("Error fetching stores for admin:", error);
      res.status(500).json({ message: "Mağazalar getirilemedi" });
    }
  });

  // Update store status (admin only)
  app.patch("/api/admin/stores/:id/status", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      /*
       * store_status enum'u: draft | pending | active | suspended | closed
       *
       * Bu uç eskiden 'approved' ve 'rejected' bekliyordu; ikisi de enum'da
       * yok. Yönetici "Onayla" dediğinde PostgreSQL "invalid input value for
       * enum store_status" hatası veriyordu, yani hiçbir mağaza onaylanamıyordu.
       * Asıl gereken 'active' ise izinli listede bile değildi.
       *
       * Eski arayüzden gelen istekler kırılmasın diye iki eski ad karşılığına
       * eşlenir.
       */
      const ESKI_ADLAR: Record<string, string> = {
        approved: "active",
        rejected: "closed",
      };
      const status = ESKI_ADLAR[req.body?.status] ?? req.body?.status;

      const GECERLI_DURUMLAR = ["pending", "active", "suspended", "closed"];
      if (!GECERLI_DURUMLAR.includes(status)) {
        return res.status(400).json({ message: "Geçersiz durum" });
      }

      const [updatedStore] = await db
        .update(stores)
        .set({
          status,
          // Onay anı kayda geçer; "doğrulanmış mağaza" göstergesi buna bakar.
          ...(status === "active" ? { verifiedAt: new Date() } : {}),
          updatedAt: new Date(),
        } as any)
        .where(eq(stores.id, id))
        .returning();
      
      if (!updatedStore) {
        return res.status(404).json({ message: "Mağaza bulunamadı" });
      }
      
      // Send notification to store owner
      try {
        if (status === 'active') {
          const [notification] = await db.insert(notifications).values({
            userId: updatedStore.ownerId,
            type: 'system',
            title: 'Mağaza Onaylandı',
            message: `"${updatedStore.displayName}" mağazanız onaylandı`,
            link: `/magaza/${updatedStore.slug}`,
            relatedId: updatedStore.id,
          }).returning();
          
          notificationEmitter.emit('notification', {
            userId: updatedStore.ownerId,
            notification,
          });
        } else if (status === 'closed' || status === 'suspended') {
          const [notification] = await db.insert(notifications).values({
            userId: updatedStore.ownerId,
            type: 'system',
            title: status === 'suspended' ? 'Mağaza Askıya Alındı' : 'Mağaza Başvurusu Reddedildi',
            message: status === 'suspended'
              ? `"${updatedStore.displayName}" mağazanız geçici olarak yayından kaldırıldı.`
              : `"${updatedStore.displayName}" mağaza başvurunuz onaylanmadı.`,
            // Rota /panel/magazam; /panel/magaza diye bir sayfa yok, eski
            // bağlantı 404'e düşüyordu.
            link: `/panel/magazam`,
            relatedId: updatedStore.id,
          }).returning();
          
          notificationEmitter.emit('notification', {
            userId: updatedStore.ownerId,
            notification,
          });
        }
      } catch (notifError) {
        console.error("Failed to create store notification:", notifError);
      }
      
      res.json(updatedStore);
    } catch (error) {
      console.error("Error updating store status:", error);
      res.status(500).json({ message: "Durum güncellenemedi" });
    }
  });

  // ============ Admin Blog Management Routes ============
  // SECURITY: All admin blog routes require authentication + admin role
  // Get all blog posts (admin only - includes unpublished)
  app.get("/api/admin/blog", isAuthenticated, adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const allBlogs = await db
        .select({
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          excerpt: blogPosts.excerpt,
          published: blogPosts.published,
          views: blogPosts.views,
          readTime: blogPosts.readTime,
          categoryTags: blogPosts.categoryTags,
          createdAt: blogPosts.createdAt,
          updatedAt: blogPosts.updatedAt,
          authorId: blogPosts.authorId,
          authorName: sql<string>`COALESCE(NULLIF(TRIM(CONCAT(${users.firstName}, ' ', ${users.lastName})), ''), ${users.username})`,
        })
        .from(blogPosts)
        .leftJoin(users, eq(blogPosts.authorId, users.id))
        .orderBy(desc(blogPosts.createdAt));
      
      res.json(allBlogs);
    } catch (error) {
      console.error("Error fetching admin blog posts:", error);
      res.status(500).json({ message: "Blog yazıları getirilemedi" });
    }
  });

  // Create new blog post (admin only)
  app.post("/api/admin/blog", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const validationResult = insertBlogPostSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Geçersiz blog verisi",
          errors: validationResult.error.errors,
        });
      }

      const [newBlog] = await db
        .insert(blogPosts)
        .values({
          ...validationResult.data,
          authorId: getUserId(req.user),
        } as any)
        .returning();
      
      res.status(201).json(newBlog);
    } catch (error: any) {
      console.error("Error creating blog post:", error);
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ message: "Bu slug zaten kullanımda" });
      }
      res.status(500).json({ message: "Blog yazısı oluşturulamadı" });
    }
  });

  // Update blog post (admin only)
  app.put("/api/admin/blog/:id", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const validationResult = insertBlogPostSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Geçersiz blog verisi",
          errors: validationResult.error.errors,
        });
      }

      const [updated] = await db
        .update(blogPosts)
        .set({
          ...(validationResult.data as any),
          updatedAt: new Date(),
        })
        .where(eq(blogPosts.id, req.params.id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ message: "Blog yazısı bulunamadı" });
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating blog post:", error);
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ message: "Bu slug zaten kullanımda" });
      }
      res.status(500).json({ message: "Blog yazısı güncellenemedi" });
    }
  });

  // Delete blog post (admin only)
  app.delete("/api/admin/blog/:id", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const [deleted] = await db
        .delete(blogPosts)
        .where(eq(blogPosts.id, req.params.id))
        .returning();
      
      if (!deleted) {
        return res.status(404).json({ message: "Blog yazısı bulunamadı" });
      }

      res.json({ message: "Blog yazısı başarıyla silindi" });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: "Blog yazısı silinemedi" });
    }
  });

  // ============ Admin Audit Logs ============
  
  // Get audit logs
  app.get("/api/admin/audit-logs", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { level, entity, limit = "100", offset = "0" } = req.query;
      
      let query = db
        .select({
          id: auditLogs.id,
          userId: auditLogs.userId,
          action: auditLogs.action,
          entity: auditLogs.entity,
          entityId: auditLogs.entityId,
          details: auditLogs.details,
          ipAddress: auditLogs.ipAddress,
          level: auditLogs.level,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .$dynamic();
      
      if (level && level !== "all") {
        query = query.where(eq(auditLogs.level, level as string));
      }
      
      if (entity && entity !== "all") {
        query = query.where(eq(auditLogs.entity, entity as string));
      }
      
      const logs = await query
        .orderBy(desc(auditLogs.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));
      
      // Get user names for logs
      const userIds = Array.from(new Set(logs.filter(l => l.userId).map(l => l.userId!))) as string[];
      const userNames = userIds.length > 0 ? await db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(sql`${users.id} IN ${userIds}`) : [];
      
      const userMap = Object.fromEntries(userNames.map(u => [u.id, `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Anonim']));
      
      const logsWithUserNames = logs.map(log => ({
        ...log,
        userName: log.userId ? userMap[log.userId] || 'Bilinmiyor' : 'Sistem',
      }));
      
      res.json(logsWithUserNames);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Log kayıtları getirilemedi" });
    }
  });

  // Get audit log stats
  app.get("/api/admin/audit-logs/stats", isAuthenticated, adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const [totalCount, todayCount, warningCount, errorCount] = await Promise.all([
        db.select({ count: count() }).from(auditLogs),
        db.select({ count: count() }).from(auditLogs).where(gte(auditLogs.createdAt, todayStart)),
        db.select({ count: count() }).from(auditLogs).where(eq(auditLogs.level, "warning")),
        db.select({ count: count() }).from(auditLogs).where(eq(auditLogs.level, "error")),
      ]);
      
      res.json({
        totalActions: Number(totalCount[0].count),
        todayActions: Number(todayCount[0].count),
        warnings: Number(warningCount[0].count),
        errors: Number(errorCount[0].count),
      });
    } catch (error) {
      console.error("Error fetching audit log stats:", error);
      res.status(500).json({ message: "İstatistikler getirilemedi" });
    }
  });

  // ============ Admin System Settings ============
  
  // Get all settings
  app.get("/api/admin/settings", isAuthenticated, adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const settings = await db.select().from(systemSettings).orderBy(systemSettings.category, systemSettings.key);
      
      // Group by category
      const grouped: Record<string, Record<string, string>> = {};
      for (const setting of settings) {
        if (!grouped[setting.category]) {
          grouped[setting.category] = {};
        }
        grouped[setting.category][setting.key] = setting.value || '';
      }
      
      res.json(grouped);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Ayarlar getirilemedi" });
    }
  });

  // Update settings
  app.patch("/api/admin/settings", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const updates: Record<string, string> = req.body;
      
      for (const [key, value] of Object.entries(updates)) {
        await db
          .update(systemSettings)
          .set({ value, updatedBy: userId, updatedAt: new Date() })
          .where(eq(systemSettings.key, key));
      }
      
      // Log the action
      await db.insert(auditLogs).values({
        userId,
        action: "UPDATE",
        entity: "settings",
        details: `Ayarlar güncellendi: ${Object.keys(updates).join(", ")}`,
        ipAddress: req.ip,
        level: "info",
      });
      
      res.json({ message: "Ayarlar güncellendi" });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Ayarlar güncellenemedi" });
    }
  });

  // ============ Admin Broadcasts ============
  
  // Get all broadcasts
  app.get("/api/admin/broadcasts", isAuthenticated, adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const broadcasts = await db
        .select()
        .from(adminBroadcasts)
        .orderBy(desc(adminBroadcasts.createdAt))
        .limit(100);
      
      res.json(broadcasts);
    } catch (error) {
      console.error("Error fetching broadcasts:", error);
      res.status(500).json({ message: "Bildirimler getirilemedi" });
    }
  });

  // Get broadcast stats
  app.get("/api/admin/broadcasts/stats", isAuthenticated, adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const allBroadcasts = await db.select().from(adminBroadcasts);
      
      const totalSent = allBroadcasts.reduce((sum, b) => sum + (b.recipientCount || 0), 0);
      const totalDelivered = allBroadcasts.reduce((sum, b) => sum + (b.deliveredCount || 0), 0);
      const totalOpened = allBroadcasts.reduce((sum, b) => sum + (b.openedCount || 0), 0);
      const pendingCount = allBroadcasts.filter(b => b.status === "pending").length;
      
      res.json({
        totalSent,
        deliveryRate: totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : 0,
        openRate: totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100).toFixed(1) : 0,
        pendingQueue: pendingCount,
      });
    } catch (error) {
      console.error("Error fetching broadcast stats:", error);
      res.status(500).json({ message: "İstatistikler getirilemedi" });
    }
  });

  // Create and send broadcast
  app.post("/api/admin/broadcasts", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const { title, content, type, targetAudience } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ message: "Başlık ve içerik gereklidir" });
      }
      
      // Count recipients based on target audience
      let recipientCount = 0;
      if (targetAudience === "all") {
        const [result] = await db.select({ count: count() }).from(users);
        recipientCount = Number(result.count);
      } else if (targetAudience === "verified") {
        const [result] = await db.select({ count: count() }).from(users).where(eq(users.emailVerified, true));
        recipientCount = Number(result.count);
      } else if (targetAudience === "sellers") {
        const [result] = await db.select({ count: count() }).from(users).where(eq(users.role, "seller"));
        recipientCount = Number(result.count);
      } else {
        const [result] = await db.select({ count: count() }).from(users);
        recipientCount = Number(result.count);
      }
      
      // Create broadcast record
      const [broadcast] = await db.insert(adminBroadcasts).values({
        title,
        content,
        type: type || "push",
        targetAudience: targetAudience || "all",
        sentBy: userId,
        recipientCount,
        deliveredCount: recipientCount, // Simulated
        status: "sent",
        sentAt: new Date(),
      }).returning();
      
      // Create notifications for all target users (in-app notifications)
      const targetUsers = await db.select({ id: users.id }).from(users).limit(1000);
      
      for (const user of targetUsers) {
        await db.insert(notifications).values({
          userId: user.id,
          type: "system",
          title,
          message: content,
          isRead: false,
        });
      }
      
      // Log the action
      await db.insert(auditLogs).values({
        userId,
        action: "CREATE",
        entity: "broadcast",
        entityId: broadcast.id,
        details: `Toplu bildirim gönderildi: "${title}" - ${recipientCount} alıcı`,
        ipAddress: req.ip,
        level: "info",
      });
      
      res.json(broadcast);
    } catch (error) {
      console.error("Error creating broadcast:", error);
      res.status(500).json({ message: "Bildirim gönderilemedi" });
    }
  });

  // ============ Stores (Mağazalar) Routes ============
  
  // Get all stores (public)
  app.get("/api/stores", async (req: Request, res: Response) => {
    try {
      const { type, city, search, limit = "20", offset = "0" } = req.query;
      
      let query = db
        .select({
          id: stores.id,
          slug: stores.slug,
          displayName: stores.displayName,
          storeType: stores.storeType,
          summary: stores.summary,
          logo: stores.logo,
          banner: stores.banner,
          primaryColor: stores.primaryColor,
          city: stores.city,
          rating: stores.rating,
          reviewCount: stores.reviewCount,
          totalListings: stores.totalListings,
          verifiedAt: stores.verifiedAt,
          createdAt: stores.createdAt,
        })
        .from(stores)
        .where(eq(stores.status, "active"))
        .$dynamic();
      
      if (type) {
        query = query.where(eq(stores.storeType, type as any));
      }
      
      if (city) {
        query = query.where(eq(stores.city, city as string));
      }
      
      if (search) {
        query = query.where(
          // Türkçe arama — bkz. ilan aramasındaki açıklama.
          sql`(
            public.tr_normalize(${stores.displayName}) LIKE public.tr_normalize(${`%${search}%`})
            OR public.tr_normalize(coalesce(${stores.summary}, '')) LIKE public.tr_normalize(${`%${search}%`})
          )`
        );
      }
      
      const storesList = await query
        .orderBy(desc(stores.rating), desc(stores.reviewCount))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));
      
      res.json(storesList);
    } catch (error) {
      console.error("Error fetching stores:", error);
      res.status(500).json({ message: "Mağazalar getirilemedi" });
    }
  });

  // Check slug availability (MUST be before :slug route)
  app.get("/api/store/check-slug/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      if (!slug || slug.length < 3) {
        return res.json({ available: false, message: "Slug en az 3 karakter olmalı" });
      }
      
      const existingStore = await db.query.stores.findFirst({
        where: eq(stores.slug, slug.toLowerCase()),
      });
      
      res.json({ 
        available: !existingStore,
        message: existingStore ? "Bu URL zaten kullanılıyor" : "Bu URL kullanılabilir"
      });
    } catch (error) {
      console.error("Error checking slug:", error);
      res.status(500).json({ available: false, message: "Kontrol edilemedi" });
    }
  });

  // Get single store by slug (public)
  app.get("/api/store/:slug", async (req: Request, res: Response) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq(stores.slug, req.params.slug),
        with: {
          owner: {
            columns: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profileImageUrl: true,
            },
          },
        },
      });
      
      if (!store) {
        return res.status(404).json({ message: "Mağaza bulunamadı" });
      }
      
      // Get store listings
      const storeListings = await db
        .select()
        .from(listings)
        .where(and(
          eq(listings.storeId, store.id),
          eq(listings.status, "active")
        ))
        .orderBy(desc(listings.createdAt))
        .limit(20);
      
      // Get store reviews (approved only)
      const storeReviewsList = await db
        .select({
          id: storeReviews.id,
          rating: storeReviews.rating,
          title: storeReviews.title,
          comment: storeReviews.comment,
          createdAt: storeReviews.createdAt,
          reviewerId: users.id,
          reviewerFirstName: users.firstName,
          reviewerLastName: users.lastName,
          reviewerProfileImage: users.profileImageUrl,
        })
        .from(storeReviews)
        .leftJoin(users, eq(storeReviews.reviewerId, users.id))
        .where(and(
          eq(storeReviews.storeId, store.id),
          eq(storeReviews.status, "approved")
        ))
        .orderBy(desc(storeReviews.createdAt))
        .limit(10);
      
      res.json({
        ...store,
        listings: storeListings,
        reviews: storeReviewsList,
      });
    } catch (error) {
      console.error("Error fetching store:", error);
      res.status(500).json({ message: "Mağaza bilgileri getirilemedi" });
    }
  });

  // Create new store (authenticated sellers only)
  /**
   * Mağaza sahibinin kendi düzenleyebileceği alanlar.
   *
   * `insertStoreSchema` sayaçları ve `verifiedAt`'i zaten dışarıda bırakıyor
   * ama `status`'ü bırakmıyordu. Bu yüzden istek gövdesine
   * `{"status":"active"}` yazan biri mağazasını doğrudan yayına alıp
   * yönetici onayını tamamen atlayabiliyordu. Durum artık yalnızca
   * /api/admin/stores/:id/status ucundan değişir; buradan geçen alanlar
   * açıkça sayılır, gövde serbestçe yayılmaz.
   */
  const MAGAZA_SAHIBI_ALANLARI = [
    "slug", "displayName", "storeType", "categoryId", "summary", "description",
    "phone", "email", "website", "address", "city", "district",
    "logo", "banner", "primaryColor", "secondaryColor", "bannerTemplate",
    "workingHours", "services", "specializations",
  ] as const;

  function magazaAlanlariniSuz(veri: Record<string, any>): Record<string, any> {
    const temiz: Record<string, any> = {};
    for (const alan of MAGAZA_SAHIBI_ALANLARI) {
      if (veri[alan] !== undefined) temiz[alan] = veri[alan];
    }
    return temiz;
  }

  app.post("/api/store", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Mağaza herkese açık bir işletme sayfası; ilan vermekten daha büyük bir
      // taahhüt. İlan oluşturmada aranan e-posta doğrulaması burada da aranır.
      if (process.env.NODE_ENV === 'production' && !(await isEmailVerified(req.user))) {
        return res.status(403).json({
          message: "Mağaza açabilmek için önce e-posta adresinizi doğrulamanız gerekiyor.",
          requiresVerification: true,
        });
      }

      // Check if user already has a store
      const existingStore = await db.query.stores.findFirst({
        where: eq(stores.ownerId, getUserId(req.user)),
      });
      
      if (existingStore) {
        return res.status(400).json({ message: "Zaten bir mağazanız var" });
      }
      
      const validationResult = insertStoreSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Geçersiz mağaza verisi",
          errors: validationResult.error.errors,
        });
      }
      
      const [newStore] = await db
        .insert(stores)
        .values({
          ...magazaAlanlariniSuz(validationResult.data as Record<string, any>),
          ownerId: getUserId(req.user),
          // Yeni mağaza her zaman onay sırasına girer. Tablonun varsayılanı
          // 'draft' idi ve taslaktan çıkışın hiçbir yolu yoktu: dürüstçe
          // açılan mağaza listede sonsuza dek görünmüyordu.
          status: "pending",
        } as any)
        .returning();
      
      res.status(201).json(newStore);
    } catch (error: any) {
      console.error("Error creating store:", error);
      if (error.code === '23505') {
        return res.status(400).json({ message: "Bu slug zaten kullanımda" });
      }
      res.status(500).json({ message: "Mağaza oluşturulamadı" });
    }
  });

  // Update store (owner only)
  app.patch("/api/store/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq(stores.id, req.params.id),
      });
      
      if (!store) {
        return res.status(404).json({ message: "Mağaza bulunamadı" });
      }
      
      if (store.ownerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Bu mağazayı düzenleyemezsiniz" });
      }
      
      const validationResult = insertStoreSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Geçersiz mağaza verisi",
          errors: validationResult.error.errors,
        });
      }
      
      // Durum alanı burada da geçmez: aksi halde yönetici tarafından askıya
      // alınan bir mağazanın sahibi kendini yeniden yayına alabilirdi.
      const [updated] = await db
        .update(stores)
        .set({
          ...magazaAlanlariniSuz(validationResult.data as Record<string, any>),
          updatedAt: new Date(),
        } as any)
        .where(eq(stores.id, req.params.id))
        .returning();
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating store:", error);
      if (error.code === '23505') {
        return res.status(400).json({ message: "Bu slug zaten kullanımda" });
      }
      res.status(500).json({ message: "Mağaza güncellenemedi" });
    }
  });

  /**
   * Taslakta kalmış mağazayı onay sırasına gönderir.
   *
   * Durum makinesinde bir çıkmaz vardı: tablo varsayılanı 'draft', mağaza
   * listesi yalnızca 'active' gösteriyor ve arada taslaktan çıkışı sağlayan
   * hiçbir uç yok. Yeni mağazalar artık doğrudan 'pending' ile açılıyor;
   * bu uç ise eski/yarım kalmış taslakların da onaya girebilmesi için var.
   */
  app.post("/api/store/:id/submit", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq(stores.id, req.params.id),
      });

      if (!store) {
        return res.status(404).json({ message: "Mağaza bulunamadı" });
      }

      if (store.ownerId !== getUserId(req.user)) {
        return res.status(403).json({ message: "Bu mağazayı gönderemezsiniz" });
      }

      if (process.env.NODE_ENV === 'production' && !(await isEmailVerified(req.user))) {
        return res.status(403).json({
          message: "Mağazanızı onaya gönderebilmek için önce e-posta adresinizi doğrulamanız gerekiyor.",
          requiresVerification: true,
        });
      }

      if (store.status !== "draft") {
        return res.status(400).json({
          message: store.status === "pending"
            ? "Mağazanız zaten onay bekliyor."
            : "Mağazanız onay sürecinde değil.",
        });
      }

      const [updated] = await db
        .update(stores)
        .set({ status: "pending", updatedAt: new Date() } as any)
        .where(eq(stores.id, store.id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error submitting store for review:", error);
      res.status(500).json({ message: "Mağaza onaya gönderilemedi" });
    }
  });

  // Delete store (owner only)
  app.delete("/api/store/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq(stores.id, req.params.id),
      });
      
      if (!store) {
        return res.status(404).json({ message: "Mağaza bulunamadı" });
      }
      
      if (store.ownerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Bu mağazayı silemezsiniz" });
      }
      
      // Delete store images from Object Storage
      const objectStorage = new ObjectStorageService();
      
      if (store.logo) {
        try {
          await objectStorage.deleteFile(store.logo);
        } catch (e) {
          console.warn("Failed to delete store logo:", e);
        }
      }
      
      if (store.banner) {
        try {
          await objectStorage.deleteFile(store.banner);
        } catch (e) {
          console.warn("Failed to delete store banner:", e);
        }
      }
      
      // Delete store media
      const storeMediaList = await db.query.storeMedia.findMany({
        where: eq(storeMedia.storeId, store.id),
      });
      
      for (const media of storeMediaList) {
        try {
          await objectStorage.deleteFile(media.url);
        } catch (e) {
          console.warn("Failed to delete store media:", e);
        }
      }
      
      // Delete store media records
      await db.delete(storeMedia).where(eq(storeMedia.storeId, store.id));
      
      // Delete store followers
      await db.delete(storeFollowers).where(eq(storeFollowers.storeId, store.id));
      
      // Delete store reviews
      await db.delete(storeReviews).where(eq(storeReviews.storeId, store.id));
      
      // Unlink listings from store (don't delete them)
      await db
        .update(listings)
        .set({ storeId: null })
        .where(eq(listings.storeId, store.id));
      
      // Finally delete the store
      await db.delete(stores).where(eq(stores.id, store.id));
      
      res.json({ message: "Mağaza başarıyla silindi" });
    } catch (error) {
      console.error("Error deleting store:", error);
      res.status(500).json({ message: "Mağaza silinemedi" });
    }
  });

  // Get my store (owner dashboard)
  app.get("/api/store/my/dashboard", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const myStore = await db.query.stores.findFirst({
        where: eq(stores.ownerId, getUserId(req.user)),
      });
      
      if (!myStore) {
        return res.status(404).json({ message: "Mağazanız henüz yok" });
      }
      
      // Get store stats
      const storeListingsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(listings)
        .where(eq(listings.storeId, myStore.id));
      
      res.json({
        ...myStore,
        stats: {
          totalListings: storeListingsCount[0]?.count || 0,
        },
      });
    } catch (error) {
      console.error("Error fetching my store:", error);
      res.status(500).json({ message: "Mağaza bilgileri getirilemedi" });
    }
  });

  // ============ Seller Analytics Routes ============

  // Get seller analytics dashboard data
  app.get("/api/seller/analytics", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      
      // Get all user listings
      const userListings = await db
        .select()
        .from(listings)
        .where(eq(listings.sellerId, userId));
      
      // Calculate basic stats
      const totalListings = userListings.length;
      const activeListings = userListings.filter(l => l.status === 'active').length;
      const pendingListings = userListings.filter(l => l.status === 'pending').length;
      const soldListings = userListings.filter(l => l.status === 'sold').length;
      const totalViews = userListings.reduce((sum, l) => sum + (l.views || 0), 0);
      
      // Get favorites count for user's listings
      const listingIds = userListings.map(l => l.id);
      let totalFavorites = 0;
      if (listingIds.length > 0) {
        const favResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(favorites)
          .where(inArray(favorites.listingId, listingIds));
        totalFavorites = favResult[0]?.count || 0;
      }
      
      // Get message count
      const messagesResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(messages)
        .where(eq(messages.receiverId, userId));
      const totalMessages = messagesResult[0]?.count || 0;
      
      // Get top performing listings (by views)
      const topListings = userListings
        .filter(l => l.status === 'active')
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map(l => ({
          id: l.id,
          title: l.title,
          views: l.views || 0,
          price: l.price,
          images: l.images,
          status: l.status,
        }));
      
      // Get listings by status breakdown
      const statusBreakdown = {
        active: activeListings,
        pending: pendingListings,
        sold: soldListings,
        expired: userListings.filter(l => l.status === 'expired').length,
        draft: userListings.filter(l => l.status === 'draft').length,
      };
      
      // Calculate average views per listing
      const avgViews = totalListings > 0 ? Math.round(totalViews / totalListings) : 0;
      
      // Get recent activity (last 7 days listings)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentListings = userListings.filter(l => 
        new Date(l.createdAt || 0) > sevenDaysAgo
      ).length;
      
      // Calculate view trends (last 30 days vs previous 30 days - simplified)
      const viewTrend = totalViews > 0 ? '+' + Math.round(avgViews * 0.1) + '%' : '0%';
      
      res.json({
        overview: {
          totalListings,
          activeListings,
          pendingListings,
          soldListings,
          totalViews,
          totalFavorites,
          totalMessages,
          avgViews,
          recentListings,
          viewTrend,
        },
        statusBreakdown,
        topListings,
      });
    } catch (error) {
      console.error("Error fetching seller analytics:", error);
      res.status(500).json({ message: "Analiz verileri getirilemedi" });
    }
  });

  // Get listing performance data
  app.get("/api/seller/analytics/listing/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const { id } = req.params;
      
      // Get the listing
      const [listing] = await db
        .select()
        .from(listings)
        .where(and(
          eq(listings.id, id),
          eq(listings.sellerId, userId)
        ))
        .limit(1);
      
      if (!listing) {
        return res.status(404).json({ message: "İlan bulunamadı" });
      }
      
      // Get favorites count
      const favResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(favorites)
        .where(eq(favorites.listingId, id));
      const favoritesCount = favResult[0]?.count || 0;
      
      // Get message count related to this listing
      const msgResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(messages)
        .where(and(
          eq(messages.receiverId, userId),
          sql`${messages.content} LIKE '%' || ${listing.title} || '%'`
        ));
      const messageCount = msgResult[0]?.count || 0;
      
      res.json({
        id: listing.id,
        title: listing.title,
        views: listing.views || 0,
        favoritesCount,
        messageCount,
        status: listing.status,
        createdAt: listing.createdAt,
        price: listing.price,
      });
    } catch (error) {
      console.error("Error fetching listing analytics:", error);
      res.status(500).json({ message: "İlan analizi getirilemedi" });
    }
  });

  // Create store review (authenticated buyers only)
  app.post("/api/store/:id/review", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq(stores.id, req.params.id),
      });
      
      if (!store) {
        return res.status(404).json({ message: "Mağaza bulunamadı" });
      }
      
      // Can't review own store
      if (store.ownerId === getUserId(req.user)) {
        return res.status(400).json({ message: "Kendi mağazanızı değerlendiremezsiniz" });
      }
      
      // Check if already reviewed
      const existingReview = await db.query.storeReviews.findFirst({
        where: and(
          eq(storeReviews.storeId, req.params.id),
          eq(storeReviews.reviewerId, getUserId(req.user))
        ),
      });
      
      if (existingReview) {
        return res.status(400).json({ message: "Bu mağazayı zaten değerlendirdiniz" });
      }
      
      const validationResult = insertStoreReviewSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Geçersiz değerlendirme verisi",
          errors: validationResult.error.errors,
        });
      }
      
      const [newReview] = await db
        .insert(storeReviews)
        .values({
          ...validationResult.data,
          storeId: req.params.id,
          reviewerId: getUserId(req.user),
        } as any)
        .returning();
      
      // Update store rating (calculate average)
      const allReviews = await db
        .select({ rating: storeReviews.rating })
        .from(storeReviews)
        .where(and(
          eq(storeReviews.storeId, req.params.id),
          eq(storeReviews.status, "approved")
        ));
      
      const avgRating = allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;
      
      await db
        .update(stores)
        .set({
          rating: avgRating.toFixed(2),
          reviewCount: allReviews.length,
        })
        .where(eq(stores.id, req.params.id));
      
      // Send notification to store owner
      try {
        const reviewer = req.user as any;
        const reviewerName = reviewer.firstName 
          ? `${reviewer.firstName} ${reviewer.lastName || ''}`.trim() 
          : reviewer.username || 'Birisi';
        
        const stars = "★".repeat(validationResult.data.rating) + "☆".repeat(5 - validationResult.data.rating);
        
        const [notification] = await db.insert(notifications).values({
          userId: store.ownerId,
          type: 'system',
          title: 'Yeni Değerlendirme',
          message: `${reviewerName} "${store.displayName}" mağazanıza ${stars} puan verdi`,
          link: `/magaza/${store.slug}`,
          relatedId: newReview.id,
        }).returning();
        
        notificationEmitter.emit('notification', {
          userId: store.ownerId,
          notification,
        });
      } catch (notifError) {
        console.error("Failed to create store review notification:", notifError);
      }
      
      res.status(201).json(newReview);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Değerlendirme oluşturulamadı" });
    }
  });

  // Get store reviews
  app.get("/api/store/:id/reviews", async (req: Request, res: Response) => {
    try {
      const reviewsList = await db
        .select({
          id: storeReviews.id,
          rating: storeReviews.rating,
          title: storeReviews.title,
          comment: storeReviews.comment,
          createdAt: storeReviews.createdAt,
          reviewerId: users.id,
          reviewerFirstName: users.firstName,
          reviewerLastName: users.lastName,
          reviewerProfileImage: users.profileImageUrl,
        })
        .from(storeReviews)
        .leftJoin(users, eq(storeReviews.reviewerId, users.id))
        .where(and(
          eq(storeReviews.storeId, req.params.id),
          eq(storeReviews.status, "approved")
        ))
        .orderBy(desc(storeReviews.createdAt));
      
      res.json(reviewsList);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Değerlendirmeler getirilemedi" });
    }
  });

  // Upload store media (logo/banner) - Owner only
  app.post("/api/store/:id/media", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq(stores.id, req.params.id),
      });
      
      if (!store) {
        return res.status(404).json({ message: "Mağaza bulunamadı" });
      }
      
      if (store.ownerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Bu mağazaya medya yükleyemezsiniz" });
      }

      const { mediaType, url } = req.body;
      
      if (!mediaType || !url) {
        return res.status(400).json({ message: "mediaType ve url gerekli" });
      }

      // Store media in database
      const [media] = await db
        .insert(storeMedia)
        .values({
          storeId: req.params.id,
          type: mediaType,
          url,
        })
        .returning();

      // Update store logo/banner reference
      if (mediaType === "logo") {
        await db
          .update(stores)
          .set({ logo: url })
          .where(eq(stores.id, req.params.id));
      } else if (mediaType === "banner") {
        await db
          .update(stores)
          .set({ banner: url })
          .where(eq(stores.id, req.params.id));
      }

      res.status(201).json(media);
    } catch (error) {
      console.error("Error uploading store media:", error);
      res.status(500).json({ message: "Medya yüklenemedi" });
    }
  });

  // Professional store image upload with Sharp processing
  app.post("/api/store/:id/upload-image", isAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq(stores.id, req.params.id),
      });
      
      if (!store) {
        return res.status(404).json({ message: "Mağaza bulunamadı" });
      }
      
      if (store.ownerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Bu mağazaya medya yükleyemezsiniz" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Dosya gerekli" });
      }

      const imageType = req.body.type as 'logo' | 'banner';
      if (!imageType || !['logo', 'banner'].includes(imageType)) {
        return res.status(400).json({ message: "Geçerli bir tür (logo/banner) gerekli" });
      }

      const validation = validateImageFile(req.file);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      console.log(`Processing store ${imageType}:`, { 
        storeId: store.id, 
        originalName: req.file.originalname,
        size: req.file.size 
      });

      const result = await processStoreImage(req.file.buffer, {
        type: imageType,
        storeId: store.id,
      });

      // Store media in database
      const [media] = await db
        .insert(storeMedia)
        .values({
          storeId: store.id,
          type: imageType,
          url: result.originalUrl,
        })
        .returning();

      // Update store logo/banner reference
      if (imageType === "logo") {
        await db
          .update(stores)
          .set({ logo: result.originalUrl })
          .where(eq(stores.id, store.id));
      } else if (imageType === "banner") {
        await db
          .update(stores)
          .set({ banner: result.originalUrl })
          .where(eq(stores.id, store.id));
      }

      console.log(`Store ${imageType} uploaded successfully:`, result.originalUrl);

      res.status(201).json({
        media,
        variants: {
          original: result.originalUrl,
          medium: result.mediumUrl,
          thumbnail: result.thumbnailUrl,
        },
        width: result.width,
        height: result.height,
        fileSize: result.fileSize,
      });
    } catch (error) {
      console.error("Error uploading store image:", error);
      res.status(500).json({ message: "Görsel yüklenemedi" });
    }
  });

  // Follow a store
  app.post("/api/store/:id/follow", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const storeId = req.params.id;
      const userId = getUserId(req.user);
      
      const store = await db.query.stores.findFirst({
        where: eq(stores.id, storeId),
      });
      
      if (!store) {
        return res.status(404).json({ message: "Mağaza bulunamadı" });
      }
      
      // Can't follow own store
      if (store.ownerId === userId) {
        return res.status(400).json({ message: "Kendi mağazanızı takip edemezsiniz" });
      }
      
      // Check if already following
      const existingFollow = await db.query.storeFollowers.findFirst({
        where: and(
          eq(storeFollowers.storeId, storeId),
          eq(storeFollowers.userId, userId)
        ),
      });
      
      if (existingFollow) {
        return res.status(400).json({ message: "Bu mağazayı zaten takip ediyorsunuz" });
      }
      
      // Add follow
      await db.insert(storeFollowers).values({
        storeId,
        userId,
      });
      
      // Update follower count
      await db
        .update(stores)
        .set({ followerCount: sql`COALESCE(follower_count, 0) + 1` })
        .where(eq(stores.id, storeId));
      
      // Send notification to store owner
      try {
        const follower = req.user as any;
        const followerName = follower.firstName 
          ? `${follower.firstName} ${follower.lastName || ''}`.trim() 
          : follower.username || 'Birisi';
        
        const [notification] = await db.insert(notifications).values({
          userId: store.ownerId,
          type: 'system',
          title: 'Yeni Takipçi',
          message: `${followerName} "${store.displayName}" mağazanızı takip etmeye başladı`,
          link: `/magazam`,
          relatedId: storeId,
        }).returning();
        
        notificationEmitter.emit('notification', {
          userId: store.ownerId,
          notification,
        });
      } catch (notifError) {
        console.error("Failed to create store follow notification:", notifError);
      }
      
      res.status(201).json({ message: "Mağaza takip edildi", following: true });
    } catch (error) {
      console.error("Error following store:", error);
      res.status(500).json({ message: "Mağaza takip edilemedi" });
    }
  });
  
  // Unfollow a store
  app.delete("/api/store/:id/follow", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const storeId = req.params.id;
      const userId = getUserId(req.user);
      
      const result = await db
        .delete(storeFollowers)
        .where(and(
          eq(storeFollowers.storeId, storeId),
          eq(storeFollowers.userId, userId)
        ))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ message: "Bu mağazayı takip etmiyorsunuz" });
      }
      
      // Update follower count
      await db
        .update(stores)
        .set({ followerCount: sql`GREATEST(COALESCE(follower_count, 0) - 1, 0)` })
        .where(eq(stores.id, storeId));
      
      res.json({ message: "Takipten çıkıldı", following: false });
    } catch (error) {
      console.error("Error unfollowing store:", error);
      res.status(500).json({ message: "Takipten çıkılamadı" });
    }
  });
  
  // Get user's followed stores
  app.get("/api/my/followed-stores", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      
      const followedStores = await db
        .select({
          id: stores.id,
          slug: stores.slug,
          displayName: stores.displayName,
          storeType: stores.storeType,
          summary: stores.summary,
          logo: stores.logo,
          primaryColor: stores.primaryColor,
          city: stores.city,
          rating: stores.rating,
          reviewCount: stores.reviewCount,
          totalListings: stores.totalListings,
          verifiedAt: stores.verifiedAt,
          followerCount: stores.followerCount,
          badges: stores.badges,
          followedAt: storeFollowers.createdAt,
        })
        .from(storeFollowers)
        .innerJoin(stores, eq(storeFollowers.storeId, stores.id))
        .where(eq(storeFollowers.userId, userId))
        .orderBy(desc(storeFollowers.createdAt));
      
      res.json(followedStores);
    } catch (error) {
      console.error("Error fetching followed stores:", error);
      res.status(500).json({ message: "Takip edilen mağazalar getirilemedi" });
    }
  });
  
  // Check if user is following a store
  app.get("/api/store/:id/is-following", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const storeId = req.params.id;
      const userId = getUserId(req.user);
      
      const follow = await db.query.storeFollowers.findFirst({
        where: and(
          eq(storeFollowers.storeId, storeId),
          eq(storeFollowers.userId, userId)
        ),
      });
      
      res.json({ following: !!follow });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Takip durumu kontrol edilemedi" });
    }
  });
  
  // Increment store view count
  app.post("/api/store/:id/view", async (req: Request, res: Response) => {
    try {
      const storeId = req.params.id;
      
      await db
        .update(stores)
        .set({ viewCount: sql`COALESCE(view_count, 0) + 1` })
        .where(eq(stores.id, storeId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error incrementing view count:", error);
      res.status(500).json({ message: "Görüntülenme kaydedilemedi" });
    }
  });

  // Get hierarchical store categories (tree structure)
  app.get("/api/store-categories", async (req: Request, res: Response) => {
    try {
      const allCategories = await db
        .select()
        .from(storeCategories)
        .orderBy(storeCategories.order);
      
      // Build tree: root categories + their children
      const rootCategories = allCategories.filter(c => c.depth === 0);
      const tree = rootCategories.map(root => ({
        ...root,
        children: allCategories.filter(c => c.parentId === root.id),
      }));
      
      res.json(tree);
    } catch (error) {
      console.error("Error fetching store categories:", error);
      res.status(500).json({ message: "Kategoriler getirilemedi" });
    }
  });

  // Get stores by category
  app.get("/api/store-categories/:id/stores", async (req: Request, res: Response) => {
    try {
      const categoryId = req.params.id;
      
      const storesList = await db
        .select({
          id: stores.id,
          slug: stores.slug,
          displayName: stores.displayName,
          storeType: stores.storeType,
          categoryId: stores.categoryId,
          summary: stores.summary,
          logo: stores.logo,
          banner: stores.banner,
          primaryColor: stores.primaryColor,
          city: stores.city,
          rating: stores.rating,
          reviewCount: stores.reviewCount,
          totalListings: stores.totalListings,
          verifiedAt: stores.verifiedAt,
          createdAt: stores.createdAt,
        })
        .from(stores)
        .where(and(
          eq(stores.categoryId, categoryId),
          eq(stores.status, "active")
        ))
        .orderBy(desc(stores.rating), desc(stores.reviewCount));
      
      res.json(storesList);
    } catch (error) {
      console.error("Error fetching stores by category:", error);
      res.status(500).json({ message: "Mağazalar getirilemedi" });
    }
  });

  // ============ Google Search Console Verification ============
  app.get("/google558dc83366fda0c8.html", (_req: Request, res: Response) => {
    res.type('text/html').send('google-site-verification: google558dc83366fda0c8.html');
  });

  // ============ SEO: robots.txt ============
  app.get("/robots.txt", (_req: Request, res: Response) => {
    const robotsTxt = `User-agent: *
Allow: /
Allow: /ilanlar
Allow: /blog
Allow: /kategoriler

Disallow: /panel/
Disallow: /admin/
Disallow: /api/

Sitemap: https://sahibindenhayvan.com/sitemap.xml
`;
    res.type('text/plain').send(robotsTxt);
  });

  // ============ SEO: sitemap.xml ============
  app.get("/sitemap.xml", async (_req: Request, res: Response) => {
    try {
      const baseUrl = "https://sahibindenhayvan.com";
      
      // Get all categories
      const allCategories = await db.select({ slug: categories.slug }).from(categories);
      
      // Get all active listings
      const activeListings = await db
        .select({ id: listings.id })
        .from(listings)
        .where(eq(listings.status, 'active'))
        .limit(1000);
      
      // Get all blog posts
      const allBlogPosts = await db
        .select({ slug: blogPosts.slug })
        .from(blogPosts);
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/ilanlar</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      
      // Add category pages
      for (const cat of allCategories) {
        sitemap += `  <url>
    <loc>${baseUrl}/ilanlar?categoryId=${cat.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
      
      // Add listing pages
      for (const listing of activeListings) {
        sitemap += `  <url>
    <loc>${baseUrl}/ilan/${listing.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
      
      // Add blog posts
      for (const post of allBlogPosts) {
        sitemap += `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;
      }
      
      sitemap += `</urlset>`;
      
      res.type('application/xml').send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Sitemap could not be generated");
    }
  });

  // ============ Register Advanced Feature Routes ============
  // Market Prices, Vet Online, Transport, B2B, Wholesale, Farm TV
  registerAdvancedFeatureRoutes(app);

  return httpServer;
}
