import cluster from 'cluster';
import os from 'os';

const numCPUs = os.cpus().length;

/**
 * Production-grade cluster mode for horizontal scaling
 * Spawns worker processes equal to CPU cores
 * Automatically restarts crashed workers
 * 
 * NOTE: Disabled for Replit Autoscale deployments since Autoscale
 * handles horizontal scaling automatically at the infrastructure level
 */
export function setupCluster(isDevelopment: boolean = false) {
  // Disable clustering in development for easier debugging
  if (isDevelopment) {
    console.log('🔧 Development mode - cluster disabled');
    return false;
  }

  // Disable clustering for Replit Autoscale deployments
  // Autoscale handles horizontal scaling at infrastructure level
  // Multi-process applications conflict with Autoscale's stateless requirement
  const isReplitDeployment = process.env.REPL_ID || process.env.REPLIT_DEPLOYMENT;
  const clusterDisabled = process.env.DISABLE_CLUSTER === 'true';
  
  if (isReplitDeployment || clusterDisabled) {
    console.log('🔧 Cluster disabled (Replit Autoscale handles scaling)');
    return false;
  }

  if (cluster.isPrimary) {
    console.log(`🚀 Master process ${process.pid} is running`);
    console.log(`🔥 Spawning ${numCPUs} worker processes...`);

    // Fork workers for each CPU core
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    // Track worker lifecycle
    cluster.on('online', (worker) => {
      console.log(`✅ Worker ${worker.process.pid} is online`);
    });

    cluster.on('exit', (worker, code, signal) => {
      console.log(`❌ Worker ${worker.process.pid} died (${signal || code})`);
      
      // Auto-restart crashed workers (resilience)
      console.log('🔄 Starting a new worker...');
      cluster.fork();
    });

    return true; // Primary process - don't run server code
  }

  // Worker process - run server
  console.log(`👷 Worker ${process.pid} started`);
  return false;
}

/**
 * Graceful shutdown handler for workers
 */
export function setupGracefulShutdown(server: any) {
  const shutdown = () => {
    console.log(`\n🛑 Worker ${process.pid} shutting down gracefully...`);
    
    server.close(() => {
      console.log(`✅ Worker ${process.pid} closed all connections`);
      process.exit(0);
    });

    // Force shutdown after 10s
    setTimeout(() => {
      console.error(`⚠️  Worker ${process.pid} forced shutdown`);
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
