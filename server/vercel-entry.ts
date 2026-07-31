/**
 * Vercel Serverless giriş noktası.
 *
 * Statik dosyalar (dist/public) Vercel CDN'inden servis edilir — bu fonksiyon
 * yalnızca /api/*, /objects/*, /health gibi dinamik istekleri karşılar.
 */

// Serverless işareti: cluster ve WebSocket kurulumu atlanır
process.env.VERCEL = process.env.VERCEL || "1";
process.env.DISABLE_CLUSTER = "true";

import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { initializeRedis } from "./cache";

const app = express();

app.set("trust proxy", 1);

// Sağlık kontrolü — başlatmayı beklemeden anında yanıt
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(compression());
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`);
    }
  });
  next();
});

// ── Tek seferlik başlatma (cold start) ──────────────────────────────────────
// Promise saklanır: eşzamanlı istekler aynı başlatmayı bekler, yarış olmaz.
// Hata olursa promise sıfırlanır ki sonraki istek yeniden denesin.
let bootstrap: Promise<void> | null = null;

function initialize(): Promise<void> {
  if (bootstrap) return bootstrap;

  bootstrap = (async () => {
    initializeRedis();
    await registerRoutes(app);

    // Hata yakalayıcı — rotalardan sonra gelmeli
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      console.error("Express error:", err);
      if (!res.headersSent) {
        res.status(status).json({ message: err.message || "Internal Server Error" });
      }
    });

    console.log("✅ Vercel uygulaması başlatıldı");
  })().catch((err) => {
    console.error("❌ Başlatma hatası:", err);
    bootstrap = null; // sonraki istekte yeniden dene
    throw err;
  });

  return bootstrap;
}

// Vercel her istek için bu handler'ı çağırır
export default async function handler(req: Request, res: Response) {
  try {
    await initialize();
  } catch {
    if (!res.headersSent) {
      res.status(503).json({ message: "Servis başlatılamadı, tekrar deneyin." });
    }
    return;
  }
  return app(req, res);
}
