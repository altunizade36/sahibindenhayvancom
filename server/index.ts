import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seed";
import { initializeRedis, cache } from "./cache";
import { setupCluster, setupGracefulShutdown } from "./cluster";

// Extend Express Request type for rawBody
declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Check if we should run in cluster mode (production only)
const isDevelopment = process.env.NODE_ENV === 'development';
const isClusterPrimary = setupCluster(isDevelopment);

// If primary process in cluster mode, keep running to supervise workers
// (Don't initialize server, workers will do that)
if (isClusterPrimary) {
  console.log('🎯 Master process supervising workers...');
  // Keep process alive - don't exit! Workers need master to stay alive.
  // Master handles worker lifecycle (crashes, restarts) in cluster.ts
  process.on('SIGINT', () => {
    console.log('\n🛑 Master received SIGINT, shutting down cluster...');
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    console.log('\n🛑 Master received SIGTERM, shutting down cluster...');
    process.exit(0);
  });
} else {
  // Worker process or development mode - initialize server
  runServer();
}

// Track server readiness for health checks
let isServerReady = false;

async function runServer() {
  const app = express();
  
  // ============ CRITICAL: Health check FIRST - before ANY middleware ============
  // This MUST respond immediately for Replit deployment health checks
  // No middleware, no async operations, just instant response
  app.get("/", (req, res, next) => {
    const acceptHeader = req.headers.accept || '';
    if (!acceptHeader.includes('text/html')) {
      return res.status(200).json({ status: 'ok', uptime: process.uptime() });
    }
    next();
  });
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
  });

  // Enable gzip compression for all responses (bandwidth optimization)
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Balance between compression ratio and speed
  }));
  app.use(express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });

  // Create HTTP server IMMEDIATELY so we can start listening
  const { createServer } = await import("http");
  const httpServer = createServer(app);
  
  // Start listening IMMEDIATELY - health checks will work right away
  const port = parseInt(process.env.PORT || '5000', 10);
  httpServer.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    isServerReady = true;
  });

  // Now do the slow async initialization in the background
  // This won't block health checks since server is already listening
  
  // Initialize Redis cache
  initializeRedis();
  
  // Register all other routes (includes setupAuth which is slow)
  await registerRoutes(app, httpServer);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite or static serving
  if (app.get("env") === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  // Database seeding in background (development only)
  const shouldSeed = process.env.NODE_ENV === 'development' || process.env.ENABLE_AUTO_SEED === 'true';
  if (shouldSeed) {
    seedDatabase()
      .then(() => console.log('✅ Background database seeding complete'))
      .catch(err => console.error('❌ Background seeding error:', err));
  } else {
    console.log('ℹ️  Database seeding skipped (production mode)');
  }

  // Setup graceful shutdown
  setupGracefulShutdown(httpServer);
}

// Export for health checks
export { isServerReady };
