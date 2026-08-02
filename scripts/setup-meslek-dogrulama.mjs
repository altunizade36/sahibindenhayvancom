#!/usr/bin/env node
/**
 * Meslek doğrulama tablosunu kurar.
 *
 *   npm run setup:dogrulama
 *
 * Tablo bir dönem yalnızca kodda vardı, veritabanında hiç oluşturulmamıştı;
 * /panel/dogrulama ve /admin/dogrulamalar sayfaları bu yüzden 500 dönüyordu
 * ve sitede kimse veteriner/nakliyeci olamıyordu. Artık şemada tanımlı
 * (`shared/schema.ts`) ama bu betik kısmi benzersiz indeks ve RLS/yetki
 * satırlarını da uyguluyor — drizzle-kit bunları bilmez ve siler.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { loadEnv, log, ROOT } from "./lib/env.mjs";

const env = loadEnv();
const DB_URL = env.DIRECT_URL || env.DATABASE_URL;

if (!DB_URL) {
  log.err("DIRECT_URL / DATABASE_URL tanımlı değil (.env)");
  process.exit(1);
}

const sqlYolu = path.join(ROOT, "scripts", "sql", "meslek-dogrulama.sql");
const betik = fs.readFileSync(sqlYolu, "utf8");

const pool = new pg.Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

try {
  await pool.query(betik);

  const { rows } = await pool.query(
    `SELECT count(*)::int AS n
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'professional_verifications'`,
  );

  if (!rows[0]?.n) {
    log.err("professional_verifications tablosu oluşturulamadı");
    process.exit(1);
  }

  log.ok(`professional_verifications hazır (${rows[0].n} sütun)`);
} catch (e) {
  log.err(`Meslek doğrulama kurulumu başarısız: ${e.message}`);
  process.exit(1);
} finally {
  await pool.end();
}
