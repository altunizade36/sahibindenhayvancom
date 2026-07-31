/**
 * Vercel Serverless Entry Point
 *
 * This file is used exclusively for Vercel deployments.
 * It creates the Express app without cluster mode and exports
 * the request handler for Vercel's serverless runtime.
 *
 * Usage: configured via vercel.json → functions → api/vercel-entry.js
 */

// Mark as serverless so routes skip WebSocket setup
process.env.VERCEL = "1";
process.env.DISABLE_CLUSTER = "true";

import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { serveStatic } from "./vite";
import { initializeRedis } from "./cache";

const app = express();

// Health check (immediate response)
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`);
    }
  });
  next();
});

// Bootstrap (runs once on cold start)
let initialized = false;
async function initialize() {
  if (initialized) return;
  initialized = true;
  try {
    initializeRedis();
    await registerRoutes(app);
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      res.status(status).json({ message: err.message || "Internal Server Error" });
    });
    // Serve built static files
    serveStatic(app);
    console.log("✅ Vercel app initialized");
  } catch (err) {
    console.error("❌ Initialization error:", err);
  }
}

// Vercel invokes this handler for every request
const handler = async (req: Request, res: Response) => {
  await initialize();
  app(req, res);
};

export default handler;
