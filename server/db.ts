import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Optimized connection pool for high concurrency
// Neon free tier: ~5 connections, but we optimize usage
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  
  // Pool size - keep small for free tier, connections are reused aggressively
  max: 10, // Maximum connections in pool (Neon handles overflow with queuing)
  min: 2,  // Minimum idle connections
  
  // Connection lifecycle
  maxUses: 7500,           // Retire after 7500 uses (prevent memory leaks)
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Timeout waiting for connection: 10s
  
  // Keep connections alive
  allowExitOnIdle: false,
});

// Connection pool monitoring
pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

pool.on('connect', () => {
  console.log('📊 New PostgreSQL connection established');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔌 Closing PostgreSQL pool...');
  await pool.end();
});

export const db = drizzle({ client: pool, schema });

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Pool stats for monitoring
export function getPoolStats() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };
}
