/**
 * PostgreSQL bağlantısı — Supabase (veya herhangi bir standart PostgreSQL).
 *
 * Not: Eskiden @neondatabase/serverless kullanılıyordu; o sürücü yalnızca
 * Neon'un WebSocket proxy'siyle çalışır ve Supabase'e bağlanamaz.
 * Standart `pg` sürücüsüne geçildi.
 *
 * DATABASE_URL için Supabase → Connect ekranından:
 *   • Serverless/Vercel  → "Transaction pooler"  (port 6543)  ✅ önerilen
 *   • Uzun ömürlü sunucu → "Session pooler"      (port 5432)
 */

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL tanımlı değil. .env dosyanızı doldurun (bkz. .env.example / KURULUM.md)."
  );
}

const connectionString = process.env.DATABASE_URL;

// Serverless'ta her fonksiyon örneği kendi havuzunu açar → havuzu küçük tut.
const isServerless = !!process.env.VERCEL;

// Supabase TLS zorunlu kılar; sertifika zinciri yönetilen olduğu için doğrulama kapalı.
const needsSsl =
  /supabase|neon|render|railway|amazonaws/.test(connectionString) ||
  process.env.PGSSLMODE === "require";

export const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,

  max: isServerless ? 1 : 10,
  min: isServerless ? 0 : 2,

  idleTimeoutMillis: isServerless ? 10_000 : 30_000,
  connectionTimeoutMillis: 10_000,
  allowExitOnIdle: isServerless,
});

pool.on("error", (err) => {
  console.error("PostgreSQL havuz hatası:", err.message);
});

// Uygulama kapanırken havuzu düzgün kapat (serverless'ta gereksiz)
if (!isServerless) {
  const closePool = async () => {
    console.log("🔌 PostgreSQL havuzu kapatılıyor...");
    try {
      await pool.end();
    } catch {
      /* zaten kapalı */
    }
  };
  process.once("SIGTERM", closePool);
  process.once("SIGINT", closePool);
}

export const db = drizzle(pool, { schema });

/** Sağlık kontrolü */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
    } finally {
      client.release();
    }
    return true;
  } catch (error) {
    console.error("Veritabanı sağlık kontrolü başarısız:", error);
    return false;
  }
}

/** İzleme için havuz istatistikleri */
export function getPoolStats() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };
}
