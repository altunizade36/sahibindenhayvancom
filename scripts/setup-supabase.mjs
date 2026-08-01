#!/usr/bin/env node
/**
 * Supabase otomatik kurulumu.
 *
 *   npm run setup:supabase
 *
 * Yaptıkları:
 *   1. Bağlantıyı doğrular
 *   2. Drizzle şemasını veritabanına uygular (db:push)
 *   3. `sessions` tablosunu oluşturur (connect-pg-simple için)
 *   4. Storage bucket'ını oluşturur ve public okuma politikasını ekler
 *   5. Sık kullanılan sorgular için indeksleri kontrol eder
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { loadEnv, log, ROOT, projectRefFromUrl } from "./lib/env.mjs";

const env = loadEnv();

const DB_URL = env.DIRECT_URL || env.DATABASE_URL;
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
const BUCKET = env.SUPABASE_STORAGE_BUCKET || "uploads";

function requireVars() {
  const missing = [];
  if (!DB_URL) missing.push("DATABASE_URL (veya DIRECT_URL)");
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length) {
    log.err(`.env dosyasında eksik değişkenler:\n   - ${missing.join("\n   - ")}`);
    log.info("Supabase Dashboard → Settings → API ve Connect ekranlarından alabilirsiniz.");
    log.info("Ayrıntılı adımlar: KURULUM.md");
    process.exit(1);
  }
}

const SESSIONS_SQL = `
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid"    varchar NOT NULL COLLATE "default",
  "sess"   json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");
`;

// Güvenlik sertleştirmesi ayrı bir dosyada tutulur (scripts/sql/harden-rls.sql):
// public şemasındaki tüm tablolarda RLS'i açar ve Data API erişimini kapatır.
// Supabase projeleri "tüm tabloları otomatik yayınla" ayarıyla oluşturulduğunda
// anon anahtarı tüm veriye erişebilir hale gelir — bu adım onu engeller.
const HARDEN_SQL = fs.readFileSync(
  path.join(ROOT, "scripts", "sql", "harden-rls.sql"),
  "utf8"
);

async function run() {
  log.title("Supabase Kurulumu");
  requireVars();

  const ref = projectRefFromUrl(SUPABASE_URL);
  log.info(`Proje: ${ref || "?"}  •  Bucket: ${BUCKET}`);

  // ── 1. Bağlantı testi ────────────────────────────────────────────────────
  log.step("Veritabanı bağlantısı test ediliyor...");
  const client = new pg.Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
  });

  try {
    await client.connect();
    const { rows } = await client.query("select version()");
    log.ok(`Bağlandı — ${rows[0].version.split(",")[0]}`);
  } catch (err) {
    log.err(`Bağlanılamadı: ${err.message}`);
    log.info("İpucu: şifrede özel karakter varsa URL-encode edin (@ → %40).");
    log.info("Supabase → Connect → 'Session pooler' bağlantı dizesini DIRECT_URL'e koyun.");
    process.exit(1);
  }

  // ── 2. Şemayı uygula ─────────────────────────────────────────────────────
  log.step("Drizzle şeması uygulanıyor (drizzle-kit push)...");
  try {
    execSync("npx drizzle-kit push --force", {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, DIRECT_URL: DB_URL, DATABASE_URL: env.DATABASE_URL || DB_URL },
    });
    log.ok("Şema uygulandı");
  } catch {
    log.warn("drizzle-kit push başarısız — şemayı elle kontrol edin (npm run db:push).");
  }

  // ── 3. sessions tablosu ──────────────────────────────────────────────────
  log.step("`sessions` tablosu oluşturuluyor...");
  try {
    await client.query(SESSIONS_SQL);
    log.ok("sessions tablosu hazır");
  } catch (err) {
    log.err(`sessions tablosu oluşturulamadı: ${err.message}`);
  }

  // ── 4. Storage bucket ────────────────────────────────────────────────────
  log.step(`Storage bucket '${BUCKET}' oluşturuluyor...`);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    log.err(`Bucket listesi alınamadı: ${listErr.message}`);
    log.info("SUPABASE_SERVICE_ROLE_KEY doğru mu? (anon key değil, service_role)");
  } else if (buckets.some((b) => b.name === BUCKET)) {
    log.ok(`Bucket '${BUCKET}' zaten var`);
    const { error: updErr } = await supabase.storage.updateBucket(BUCKET, {
      public: true,
      fileSizeLimit: 52428800, // 50MB — ücretsiz plan üst sınırı
    });
    if (updErr) log.warn(`Bucket güncellenemedi: ${updErr.message}`);
    else log.ok("Bucket public + 50MB limit olarak ayarlandı");
  } else {
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 52428800,
    });
    if (createErr) log.err(`Bucket oluşturulamadı: ${createErr.message}`);
    else log.ok(`Bucket '${BUCKET}' oluşturuldu (public, 50MB)`);
  }

  // ── 5. Güvenlik sertleştirmesi ───────────────────────────────────────────
  log.step("Güvenlik sertleştirmesi (RLS + Data API kapatma)...");
  try {
    await client.query(HARDEN_SQL);
    const { rows } = await client.query(
      "select count(*) filter (where not rowsecurity)::int as kapali from pg_tables where schemaname='public'"
    );
    log.ok(
      rows[0].kapali === 0
        ? "Tüm tablolarda RLS açık, Data API kapatıldı"
        : `UYARI: ${rows[0].kapali} tabloda RLS hâlâ kapalı`
    );
  } catch (err) {
    log.err(`Sertleştirme başarısız: ${err.message}`);
    log.info("Elle çalıştırın: npm run harden");
  }

  // ── 6. Özet ──────────────────────────────────────────────────────────────
  const { rows: tableRows } = await client.query(
    "select count(*)::int as n from information_schema.tables where table_schema = 'public'"
  );
  await client.end();

  log.title("Supabase Hazır");
  log.ok(`public şemasında ${tableRows[0].n} tablo`);
  log.info(`Storage: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/...`);
  log.info("Sonraki adım: npm run setup:vercel");
}

run().catch((err) => {
  log.err(err.stack || err.message);
  process.exit(1);
});
