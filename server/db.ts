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

// Production-grade connection pool configuration
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Connection pool limits (adjust based on Neon plan limits)
  // Free tier: 5 connections max, Paid: 100+ connections
  // Note: Single Node.js process limits to ~10k concurrent requests
  // For 50k+ users: Use cluster mode or multiple instances + load balancer
  maxUses: 7500, // Retire connections after 7500 uses (prevents memory leaks)
});

export const db = drizzle({ client: pool, schema });
