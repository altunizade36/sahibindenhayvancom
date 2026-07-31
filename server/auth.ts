/**
 * Kimlik doğrulama — Replit Auth (OIDC) yerine geçer.
 *
 * Oturum modeli değişmedi: passport session içinde `{ claims: { sub: userId } }`
 * saklanır, böylece routes.ts'teki tüm mevcut kodlar aynen çalışır.
 *
 * Sağlanan giriş yöntemleri:
 *   1. E-posta / telefon + şifre   → routes.ts (/api/auth/login)
 *   2. Telefon SMS OTP             → routes.ts (/api/auth/phone/*), server/sms.ts
 *   3. Google ile giriş            → burada (GOOGLE_CLIENT_ID varsa aktif)
 *   4. Facebook ile giriş          → burada (FACEBOOK_APP_ID varsa aktif)
 *
 * E-postalar Resend ile gönderilir (server/email.ts). Firebase kullanılmaz.
 */

import passport from "passport";
import session from "express-session";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { pool } from "./db";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 hafta

let sessionMiddleware: RequestHandler | null = null;

/** Oturum ara katmanı — WebSocket el sıkışmasında da yeniden kullanılır. */
export function getSession(): RequestHandler {
  if (sessionMiddleware) return sessionMiddleware;

  const isProd = process.env.NODE_ENV === "production";

  if (!process.env.SESSION_SECRET) {
    if (isProd) {
      throw new Error("SESSION_SECRET tanımlı değil — üretimde zorunlu.");
    }
    console.warn("⚠️  SESSION_SECRET yok, geliştirme için geçici anahtar kullanılıyor.");
  }

  // Veritabanı varsa oturumlar PostgreSQL'de, yoksa bellekte tutulur
  let store: session.Store;
  if (process.env.DATABASE_URL) {
    const PgStore = connectPg(session);
    store = new PgStore({
      pool: pool as any,
      createTableIfMissing: false,
      ttl: SESSION_TTL_MS / 1000,
      tableName: "sessions",
    });
  } else {
    const MemStore = MemoryStore(session);
    store = new MemStore({ checkPeriod: SESSION_TTL_MS });
    console.warn("⚠️  DATABASE_URL yok — oturumlar bellekte (yeniden başlatınca silinir).");
  }

  sessionMiddleware = session({
    name: "shv.sid",
    secret: process.env.SESSION_SECRET || "dev-only-insecure-secret",
    store,
    resave: false,
    saveUninitialized: false,
    proxy: isProd, // Vercel/proxy arkasında secure cookie için gerekli
    cookie: {
      httpOnly: true,
      // Yerelde http üzerinden çalışıldığı için secure sadece üretimde
      secure: isProd,
      // Aynı alan adından servis ediliyoruz → "lax" hem güvenli hem çalışır
      sameSite: "lax",
      maxAge: SESSION_TTL_MS,
      path: "/",
    },
  });

  return sessionMiddleware;
}

/** OAuth profilinden kullanıcıyı oluşturur/günceller ve session nesnesini döner. */
async function upsertOAuthUser(profile: {
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}) {
  if (!profile.email) {
    throw new Error("Sağlayıcıdan e-posta alınamadı");
  }
  const dbUser = await storage.upsertUser({
    email: profile.email,
    firstName: profile.firstName ?? null,
    lastName: profile.lastName ?? null,
    profileImageUrl: profile.profileImageUrl ?? null,
  } as any);

  // routes.ts getUserId() bu şekli bekliyor
  return { claims: { sub: dbUser.id }, dbUserId: dbUser.id };
}

function callbackBase(): string {
  const url =
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    `http://localhost:${process.env.PORT || 5000}`;
  return url.replace(/\/$/, "");
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user as Express.User));

  const enabled: string[] = [];

  // ── Google ile giriş ─────────────────────────────────────────────────────
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${callbackBase()}/api/auth/google/callback`,
          scope: ["profile", "email"],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const user = await upsertOAuthUser({
              email: profile.emails?.[0]?.value,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              profileImageUrl: profile.photos?.[0]?.value,
            });
            done(null, user);
          } catch (err) {
            done(err as Error);
          }
        }
      )
    );

    app.get("/api/auth/google", passport.authenticate("google"));
    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/giris?hata=google" }),
      (_req, res) => res.redirect("/")
    );
    enabled.push("Google");
  }

  // ── Facebook ile giriş ───────────────────────────────────────────────────
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: `${callbackBase()}/api/auth/facebook/callback`,
          profileFields: ["id", "emails", "name", "picture.type(large)"],
        },
        async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
          try {
            const user = await upsertOAuthUser({
              email: profile.emails?.[0]?.value,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              profileImageUrl: profile.photos?.[0]?.value,
            });
            done(null, user);
          } catch (err) {
            done(err as Error);
          }
        }
      )
    );

    app.get("/api/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));
    app.get(
      "/api/auth/facebook/callback",
      passport.authenticate("facebook", { failureRedirect: "/giris?hata=facebook" }),
      (_req, res) => res.redirect("/")
    );
    enabled.push("Facebook");
  }

  // ── Geriye dönük uyumluluk: /api/login ve /api/logout ─────────────────────
  // Eski Replit Auth uçlarıydı; istemci hâlâ bunlara yönlendiriyor.
  app.get("/api/login", (_req, res) => res.redirect("/giris"));

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) console.error("Logout error:", err);
      req.session?.destroy(() => {
        res.clearCookie("shv.sid");
        res.redirect("/");
      });
    });
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) console.error("Logout error:", err);
      req.session?.destroy(() => {
        res.clearCookie("shv.sid");
        res.json({ message: "Çıkış yapıldı" });
      });
    });
  });

  console.log(
    `🔐 Kimlik doğrulama hazır (e-posta/telefon${enabled.length ? " + " + enabled.join(" + ") : ""})`
  );
}

/** Korumalı uçlar için ara katman. */
export const isAuthenticated: RequestHandler = (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated?.() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!user.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return next();
};
