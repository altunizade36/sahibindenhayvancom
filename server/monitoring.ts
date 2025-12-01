import { Request, Response } from 'express';
import { db, getPoolStats } from './db';
import { cache } from './cache';

interface SystemMetrics {
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  process: {
    pid: number;
    nodeVersion: string;
  };
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  system: SystemMetrics;
  database: {
    connected: boolean;
    latency?: number;
    pool: {
      total: number;
      idle: number;
      waiting: number;
    };
  };
  cache: {
    type: string;
    available: boolean;
  };
}

/**
 * Get system metrics
 */
export function getSystemMetrics(): SystemMetrics {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    uptime: process.uptime(),
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    },
    cpu: {
      user: Math.round(cpuUsage.user / 1000), // microseconds to ms
      system: Math.round(cpuUsage.system / 1000),
    },
    process: {
      pid: process.pid,
      nodeVersion: process.version,
    },
  };
}

/**
 * Health check endpoint handler
 */
export async function healthCheck(_req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    let dbLatency: number | undefined;
    let dbConnected = false;
    
    try {
      const dbStart = Date.now();
      await db.execute('SELECT 1');
      dbLatency = Date.now() - dbStart;
      dbConnected = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Check cache status
    const cacheStats = await cache.getStats();

    const totalLatency = Date.now() - startTime;

    const poolStats = getPoolStats();
    
    const health: HealthStatus = {
      status: dbConnected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      system: getSystemMetrics(),
      database: {
        connected: dbConnected,
        latency: dbLatency,
        pool: poolStats,
      },
      cache: {
        type: cacheStats.type,
        available: cacheStats.available,
      },
    };

    // Return 200 for healthy, 503 for unhealthy
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: String(error),
    });
  }
}

/**
 * Metrics endpoint handler (Prometheus-compatible format)
 */
export function metricsEndpoint(_req: Request, res: Response) {
  const metrics = getSystemMetrics();
  
  // Prometheus text format
  const prometheusMetrics = `
# HELP nodejs_heap_size_used_bytes Process heap size used in bytes
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes{pid="${metrics.process.pid}"} ${metrics.memory.used * 1024 * 1024}

# HELP nodejs_heap_size_total_bytes Process heap size total in bytes
# TYPE nodejs_heap_size_total_bytes gauge
nodejs_heap_size_total_bytes{pid="${metrics.process.pid}"} ${metrics.memory.total * 1024 * 1024}

# HELP nodejs_process_uptime_seconds Process uptime in seconds
# TYPE nodejs_process_uptime_seconds gauge
nodejs_process_uptime_seconds{pid="${metrics.process.pid}"} ${metrics.uptime}

# HELP nodejs_process_cpu_user_seconds_total Total user CPU time in seconds
# TYPE nodejs_process_cpu_user_seconds_total counter
nodejs_process_cpu_user_seconds_total{pid="${metrics.process.pid}"} ${metrics.cpu.user / 1000}

# HELP nodejs_process_cpu_system_seconds_total Total system CPU time in seconds
# TYPE nodejs_process_cpu_system_seconds_total counter
nodejs_process_cpu_system_seconds_total{pid="${metrics.process.pid}"} ${metrics.cpu.system / 1000}
`.trim();

  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(prometheusMetrics);
}

/**
 * Request logging middleware with performance tracking
 */
export function performanceLogger(req: Request, res: Response, next: Function) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests (>1s)
    if (duration > 1000) {
      console.warn(`⚠️  SLOW REQUEST: ${req.method} ${req.path} took ${duration}ms`);
    }
    
    // Log errors
    if (res.statusCode >= 500) {
      console.error(`❌ ERROR: ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  
  next();
}
