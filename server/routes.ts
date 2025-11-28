import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { db } from "./db";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, getSession } from "./replitAuth";
import passport from "passport";
import { cache, cacheKeys, cacheTTL } from "./cache";
import { healthCheck, metricsEndpoint } from "./monitoring";
import { locations, listings, blogPosts, users, messages, favorites, categories, auctions, bids, liveStreams, insertLiveStreamSchema, vetServices, transportServices, reviews, stores, storeReviews, storeMedia, storeCategories, notifications, insertNotificationSchema, reports, insertReportSchema } from "@shared/schema";
import { eq, and, isNull, desc, sql, count, inArray, gte, lte, ilike, or } from "drizzle-orm";
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
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { emailService, generateVerificationToken, shouldAutoVerifyEmail } from "./email";
import { verifyRecaptcha } from "./recaptcha";
import { moderateListingSchema } from "./validation";

// SESSION_SECRET is now used for session management (not JWT)

// ============ Multer Configuration for File Uploads ============
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir'));
    }
  },
});

// ============ Rate Limiting Configuration ============

// Moderate rate limiter for resource creation
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: "Çok fazla istek gönderdiniz. Lütfen bir dakika bekleyin.",
  standardHeaders: true,
  legacyHeaders: false,
});

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

// Note: Express Request.user type is extended via replitAuth.ts

// Legacy JWT middleware removed - now using Replit Auth sessions
// Use isAuthenticated from replitAuth.ts for protected routes

export async function registerRoutes(app: Express): Promise<Server> {
  // ============ Replit Auth Setup ============
  await setupAuth(app);

  // ============ Health & Monitoring Routes ============
  app.get("/health", healthCheck);
  app.get("/metrics", metricsEndpoint);

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ 
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
  };
  
  const clients = new Map<string, ClientInfo>();
  const MAX_CONNECTIONS = 50000; // Limit concurrent connections
  const HEARTBEAT_INTERVAL = 30000; // 30 seconds
  const CONNECTION_TIMEOUT = 60000; // 60 seconds idle timeout
  
  // Heartbeat tracking
  const heartbeats = new Map<string, NodeJS.Timeout>();
  
  wss.on("connection", async (ws: WebSocket, req) => {
    // Check connection limit
    if (clients.size >= MAX_CONNECTIONS) {
      ws.close(1008, "Server at capacity");
      return;
    }

    try {
      // Run session middleware to populate req.session and req.user
      const sessionMiddleware = getSession();
      await new Promise<void>((resolve, reject) => {
        sessionMiddleware(req, {} as any, (err?: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Run passport middleware to deserialize user
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

      // Check if user is authenticated
      const user = (req as any).user;
      if (!(req as any).isAuthenticated || !(req as any).isAuthenticated() || !user?.claims?.sub) {
        ws.close(1008, "Unauthorized - Please log in");
        return;
      }

      const userId = user.claims.sub;
      
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
            }
          } else if (message.type === "chat") {
            // Create message in PostgreSQL
            const [newMessage] = await db
              .insert(messages)
              .values({
                senderId: userId,
                receiverId: message.receiverId,
                listingId: message.listingId || null,
                content: message.content,
              })
              .returning();

            // Send to receiver if online
            const receiverClient = clients.get(message.receiverId);
            if (receiverClient && receiverClient.ws.readyState === WebSocket.OPEN) {
              receiverClient.ws.send(JSON.stringify({
                type: "chat",
                message: newMessage,
              }));
            }

            // Send confirmation to sender
            ws.send(JSON.stringify({
              type: "chat_sent",
              message: newMessage,
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
      
      ws.on("close", () => {
        clients.delete(userId);
        clearInterval(heartbeat);
        heartbeats.delete(userId);
        clearTimeout(idleTimeout);
      });
      
      ws.on("error", (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
        ws.close(1011, "Internal error");
      });
    } catch (error) {
      console.error("WebSocket authentication error:", error);
      ws.close(1008, "Authentication failed - Please log in");
    }
  });

  // ============ Auth Routes (Hybrid: Replit Auth + Email/Password) ============
  
  // Email/Password Registration
  app.post('/api/auth/register', createLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password, username, firstName, lastName } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({ message: "Email ve şifre gereklidir" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Şifre en az 8 karakter olmalıdır" });
      }

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: or(eq(users.email, email), username ? eq(users.username, username) : undefined),
      });

      if (existingUser) {
        return res.status(400).json({ message: "Bu email veya kullanıcı adı zaten kayıtlı" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate verification token
      const verificationToken = generateVerificationToken();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          username: username || null,
          password: hashedPassword,
          firstName: firstName || null,
          lastName: lastName || null,
          emailVerified: shouldAutoVerifyEmail(), // Auto-verify in dev mode
          verificationToken: shouldAutoVerifyEmail() ? null : verificationToken,
          verificationTokenExpiry: shouldAutoVerifyEmail() ? null : verificationTokenExpiry,
        })
        .returning();

      // Send verification email (unless auto-verified)
      if (!shouldAutoVerifyEmail()) {
        await emailService.sendVerificationEmail(
          email,
          verificationToken,
          username || firstName || email.split('@')[0]
        );
      }

      // Log user in by creating session
      (req as any).login({ claims: { sub: newUser.id } }, (err: any) => {
        if (err) {
          console.error("Session creation error:", err);
          return res.status(500).json({ message: "Kayıt başarılı ama oturum açılamadı" });
        }

        res.status(201).json({
          message: shouldAutoVerifyEmail() 
            ? "Kayıt başarılı! Hoş geldiniz." 
            : "Kayıt başarılı! Email adresinize doğrulama linki gönderdik.",
          user: {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
            emailVerified: newUser.emailVerified,
          },
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Kayıt sırasında bir hata oluştu" });
    }
  });

  // Email/Password Login
  app.post('/api/auth/login', createLimiter, async (req: Request, res: Response) => {
    try {
      const { emailOrUsername, password } = req.body;

      if (!emailOrUsername || !password) {
        return res.status(400).json({ message: "Email/kullanıcı adı ve şifre gereklidir" });
      }

      // Find user by email or username
      const user = await db.query.users.findFirst({
        where: or(
          eq(users.email, emailOrUsername),
          eq(users.username, emailOrUsername)
        ),
      });

      if (!user || !user.password) {
        return res.status(401).json({ message: "Hatalı email/kullanıcı adı veya şifre" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Hatalı email/kullanıcı adı veya şifre" });
      }

      // Log user in by creating session
      (req as any).login({ claims: { sub: user.id } }, (err: any) => {
        if (err) {
          console.error("Session creation error:", err);
          return res.status(500).json({ message: "Giriş sırasında bir hata oluştu" });
        }

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
        console.error("User not found. User object:", req.user);
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

      // Return sanitized user (without password)
      const { password: _, ...safeUser } = updatedUser;
      res.json(safeUser);
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

  // ============ Category Routes ============
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
  // req.user will be populated if user is logged in (via Replit Auth session)
  app.get("/api/listings", async (req: Request, res: Response) => {
    try {
      const { 
        page = '1', 
        limit = '50', 
        categoryId, 
        city, 
        minPrice, 
        maxPrice, 
        status, 
        search,
        // Advanced filters
        minAge,
        maxAge,
        gender,
        breed,
        healthStatus,
        vaccinated
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
        const searchTerm = `%${search}%`;
        conditions.push(
          sql`(${listings.title} ILIKE ${searchTerm} OR ${listings.description} ILIKE ${searchTerm})`
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
        conditions.push(ilike(listings.breed, `%${breed}%`));
      }
      
      if (healthStatus && healthStatus !== 'all') {
        conditions.push(eq(listings.healthStatus, healthStatus as any));
      }
      
      if (vaccinated !== undefined && vaccinated !== 'all') {
        const isVaccinated = vaccinated === 'true' || vaccinated === '1';
        conditions.push(eq(listings.vaccinated, isVaccinated));
      }
      
      // Filter out undefined conditions before applying
      const validConditions = conditions.filter(Boolean);
      
      // Get total count
      const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(listings)
        .where(validConditions.length > 0 ? and(...validConditions) : undefined);
      
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
        .orderBy(desc(listings.createdAt))
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
          .where(eq(favorites.userId, (req.user as any).id));
        
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
  // req.user will be populated if user is logged in (via Replit Auth session)
  app.get("/api/listings/:id", async (req: Request, res: Response) => {
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
              eq(favorites.userId, (req.user as any).id),
              eq(favorites.listingId, listing.id)
            )
          )
          .limit(1);
        
        isFavorite = !!favorite;
      }

      // Sanitize seller object
      let sanitizedSeller = null;
      if (seller) {
        const { password: _, ...safe } = seller;
        sanitizedSeller = safe;
      }

      res.json({
        ...listing,
        views: (listing.views || 0) + 1, // Return incremented view count
        seller: sanitizedSeller,
        store: storeInfo,
        isFavorite,
      });
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  app.post("/api/listings", createLimiter, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user!;

      // SECURITY: Email verification required to create listings
      if (!(user as any).emailVerified) {
        return res.status(403).json({
          message: "İlan oluşturabilmek için email adresinizi doğrulamanız gerekmektedir.",
          requiresVerification: true,
        });
      }

      // SECURITY: Validate reCAPTCHA for listing creation (optional in dev)
      const recaptchaToken = req.body.recaptchaToken;
      if (process.env.RECAPTCHA_SECRET_KEY) {
        if (!recaptchaToken) {
          return res.status(400).json({
            message: "Bot koruması doğrulaması gereklidir",
            errorCode: "RECAPTCHA_REQUIRED",
          });
        }
        const isValid = await verifyRecaptcha(recaptchaToken, 0.5);
        if (!isValid) {
          return res.status(400).json({
            message: "Bot koruması doğrulaması başarısız",
            errorCode: "RECAPTCHA_FAILED",
          });
        }
      }

      // SPAM FILTER: Check BEFORE counting toward hourly limit
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const normalizedTitle = req.body.title.toLowerCase().trim();
      
      const duplicates = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.sellerId, (user as any).id),
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
            eq(listings.sellerId, (user as any).id),
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

      const parsedData = insertListingSchema.parse({
        ...req.body,
        sellerId: (user as any).id,
        status: 'pending', // Always pending for moderation
        // Auto-detect listing source: if storeId provided, it's a store listing
        listingSource: req.body.storeId ? 'store' : 'individual',
      });

      // Create listing - completely free, but requires admin approval
      const [listing] = await db.insert(listings).values(parsedData as any).returning();

      res.status(201).json({
        ...listing,
        message: "İlanınız başarıyla oluşturuldu. Admin onayından sonra yayına girecektir.",
        requiresApproval: true,
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

      if (listing.sellerId !== (req.user as any).id && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Auto-detect listing source when storeId changes
      const updateData: any = { ...req.body, updatedAt: new Date() };
      if ('storeId' in req.body) {
        updateData.listingSource = req.body.storeId ? 'store' : 'individual';
      }

      const [updated] = await db
        .update(listings)
        .set(updateData)
        .where(eq(listings.id, req.params.id))
        .returning();
        
      res.json(updated);
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(400).json({ message: "Update failed", error });
    }
  });

  app.delete("/api/listings/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, req.params.id))
        .limit(1);
        
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      if (listing.sellerId !== (req.user as any).id && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await db.delete(listings).where(eq(listings.id, req.params.id));
      res.json({ message: "Listing deleted" });
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(400).json({ message: "Delete failed", error });
    }
  });


  app.get("/api/listings/mine", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userListings = await db
        .select()
        .from(listings)
        .where(eq(listings.sellerId, (req.user as any).id))
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
      
      if (!listing || listing.sellerId !== (req.user as any).id) {
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
          bidderId: (req.user as any).id,
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

      wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'new_bid',
            auctionId: req.params.id,
            bid: {
              ...bid,
              bidder: {
                id: (req.user as any).id,
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
        streamerId: (req.user as any).id,
        channelName: `stream_${Date.now()}_${(req.user as any).id.substring(0, 8)}`,
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

      if (stream.streamerId !== (req.user as any).id) {
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
      
      const uid = parseInt((req.user as any).id.substring(0, 8), 16); // Convert user ID to number
      const role = stream.streamerId === (req.user as any).id ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
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
      const userId = (req.user as any).id;
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
      const userId = (req.user as any).id;

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
      const userId = (req.user as any).id;
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
      const userId = (req.user as any).id;

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
      const userId = (req.user as any).id;
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
  app.get("/api/messages/conversations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get unique conversations from PostgreSQL
      const userId = (req.user as any).id;
      
      // Get all messages where user is sender or receiver
      const allMessages = await db
        .select()
        .from(messages)
        .where(
          sql`${messages.senderId} = ${userId} OR ${messages.receiverId} = ${userId}`
        )
        .orderBy(desc(messages.createdAt));
      
      // Group by conversation partner
      const conversationsMap = new Map();
      for (const msg of allMessages) {
        const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            userId: partnerId,
            lastMessage: msg.content,
            lastMessageTime: msg.createdAt,
            unreadCount: 0,
          });
        }
      }
      
      res.json(Array.from(conversationsMap.values()));
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/messages/:userId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUserId = (req.user as any).id;
      const otherUserId = req.params.userId;
      
      // Get messages between two users from PostgreSQL
      const msgs = await db
        .select()
        .from(messages)
        .where(
          sql`(${messages.senderId} = ${currentUserId} AND ${messages.receiverId} = ${otherUserId}) OR (${messages.senderId} = ${otherUserId} AND ${messages.receiverId} = ${currentUserId})`
        )
        .orderBy(messages.createdAt);
      
      res.json(msgs);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const data = insertMessageSchema.parse({
        ...req.body,
        senderId: (req.user as any).id,
      });

      // Create message in PostgreSQL
      const [message] = await db
        .insert(messages)
        .values(data)
        .returning();

      // Send notification to receiver
      try {
        const sender = req.user as any;
        const senderName = sender.firstName 
          ? `${sender.firstName} ${sender.lastName || ''}`.trim() 
          : sender.username || 'Birisi';
        
        await db.insert(notifications).values({
          userId: data.receiverId,
          type: 'new_message',
          title: 'Yeni Mesaj',
          message: `${senderName} size bir mesaj gönderdi`,
          link: `/mesajlar?userId=${sender.id}`,
          relatedId: message.id,
        });
      } catch (notifError) {
        console.error("Failed to create message notification:", notifError);
      }
      
      res.status(201).json(message);
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
        authorId: (req.user as any).id,
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

      // Sanitize vet object
      let sanitizedVet = null;
      if (vet) {
        const { password: _, ...safe } = vet;
        sanitizedVet = safe;
      }

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

  app.post("/api/vet-services", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if ((req.user as any).role !== "vet") {
        return res.status(403).json({ message: "Only veterinarians can create services" });
      }

      const data = insertVetServiceSchema.parse({
        ...req.body,
        vetId: (req.user as any).id,
      });

      // Create vet service in PostgreSQL
      const [service] = await db
        .insert(vetServices)
        .values(data as any)
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

      // Sanitize transporter object
      let sanitizedTransporter = null;
      if (transporter) {
        const { password: _, ...safe } = transporter;
        sanitizedTransporter = safe;
      }

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

  app.post("/api/transport-services", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if ((req.user as any).role !== "transporter") {
        return res.status(403).json({ message: "Only transporters can create services" });
      }

      const data = insertTransportServiceSchema.parse({
        ...req.body,
        transporterId: (req.user as any).id,
      });

      // Create transport service in PostgreSQL
      const [service] = await db
        .insert(transportServices)
        .values(data as any)
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
        reviewerId: (req.user as any).id,
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
        .where(eq(favorites.userId, (req.user as any).id));
      
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
        userId: (req.user as any).id,
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
        
        if (listing && listing.sellerId !== (req.user as any).id) {
          const favUser = req.user as any;
          const userName = favUser.firstName 
            ? `${favUser.firstName} ${favUser.lastName || ''}`.trim() 
            : favUser.username || 'Birisi';
          
          await db.insert(notifications).values({
            userId: listing.sellerId,
            type: 'new_favorite',
            title: 'Yeni Favori',
            message: `${userName} "${listing.title}" ilanınızı favorilere ekledi`,
            link: `/ilanlar/${listing.id}`,
            relatedId: listing.id,
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
            eq(favorites.userId, (req.user as any).id),
            eq(favorites.listingId, req.params.listingId)
          )
        );
      
      res.json({ message: "Favorite removed" });
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      res.status(400).json({ message: "Failed to remove favorite", error });
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

  // ============ Report Routes ============

  // Create a report
  app.post("/api/reports", isAuthenticated, createLimiter, async (req: Request, res: Response) => {
    try {
      const data = insertReportSchema.parse({
        ...req.body,
        reporterId: (req.user as any).id,
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
      const userId = (req.user as any).id;

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
  app.get("/api/admin/reports", isAuthenticated, async (req: Request, res: Response) => {
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
  app.patch("/api/admin/reports/:id", isAuthenticated, async (req: Request, res: Response) => {
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
        updateData.resolvedBy = (req.user as any).id;
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
  // Admin middleware
  async function adminMiddleware(req: Request, res: Response, next: Function) {
    if (!req.user || (req.user as any).role !== "admin") {
      return res.status(403).json({ message: "Admin yetkisi gereklidir" });
    }
    next();
  }

  // Admin dashboard stats
  app.get("/api/admin/stats", isAuthenticated, adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const [usersCount] = await db.select({ count: count() }).from(users);
      const [listingsCount] = await db.select({ count: count() }).from(listings);
      const [activeListings] = await db.select({ count: count() }).from(listings).where(eq(listings.status, "active"));
      const [pendingListings] = await db.select({ count: count() }).from(listings).where(eq(listings.status, "pending"));
      const [verifiedUsers] = await db.select({ count: count() }).from(users).where(eq(users.emailVerified, true));

      res.json({
        totalUsers: Number(usersCount.count),
        verifiedUsers: Number(verifiedUsers.count),
        totalListings: Number(listingsCount.count),
        activeListings: Number(activeListings.count),
        pendingListings: Number(pendingListings.count),
      });
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

      // SECURITY: Only allow moderation on pending listings
      if (listing.status !== 'pending') {
        return res.status(400).json({
          message: `Bu işlem sadece bekleyen ilanlar için yapılabilir. Mevcut durum: ${listing.status}`,
        });
      }

      // Update with full audit trail
      // SECURITY FIX: Clear moderationReason on approval
      const [updated] = await db
        .update(listings)
        .set({
          status: status,
          moderatedBy: (req.user as any).id,
          moderatedAt: new Date(),
          moderationReason: status === 'rejected' ? reason : null,
        })
        .where(eq(listings.id, req.params.id))
        .returning();

      // Send notification to seller about moderation result
      try {
        if (status === 'active') {
          await db.insert(notifications).values({
            userId: listing.sellerId,
            type: 'listing_approved',
            title: 'İlan Onaylandı',
            message: `"${listing.title}" ilanınız onaylandı ve yayına girdi`,
            link: `/ilanlar/${listing.id}`,
            relatedId: listing.id,
          });
        } else if (status === 'rejected') {
          await db.insert(notifications).values({
            userId: listing.sellerId,
            type: 'listing_rejected',
            title: 'İlan Reddedildi',
            message: `"${listing.title}" ilanınız reddedildi${reason ? `: ${reason}` : ''}`,
            link: `/ilanlar/${listing.id}`,
            relatedId: listing.id,
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
          authorId: (req.user as any).id,
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
          sql`${stores.displayName} ILIKE ${`%${search}%`} OR ${stores.summary} ILIKE ${`%${search}%`}`
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
  app.post("/api/store", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check if user already has a store
      const existingStore = await db.query.stores.findFirst({
        where: eq(stores.ownerId, (req.user as any).id),
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
          ...validationResult.data,
          ownerId: (req.user as any).id,
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
      
      if (store.ownerId !== (req.user as any).id && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Bu mağazayı düzenleyemezsiniz" });
      }
      
      const validationResult = insertStoreSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Geçersiz mağaza verisi",
          errors: validationResult.error.errors,
        });
      }
      
      const [updated] = await db
        .update(stores)
        .set({
          ...validationResult.data,
          updatedAt: new Date(),
        })
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

  // Get my store (owner dashboard)
  app.get("/api/store/my/dashboard", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const myStore = await db.query.stores.findFirst({
        where: eq(stores.ownerId, (req.user as any).id),
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
      if (store.ownerId === (req.user as any).id) {
        return res.status(400).json({ message: "Kendi mağazanızı değerlendiremezsiniz" });
      }
      
      // Check if already reviewed
      const existingReview = await db.query.storeReviews.findFirst({
        where: and(
          eq(storeReviews.storeId, req.params.id),
          eq(storeReviews.reviewerId, (req.user as any).id)
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
          reviewerId: (req.user as any).id,
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
      
      if (store.ownerId !== (req.user as any).id && (req.user as any).role !== "admin") {
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

  return httpServer;
}

