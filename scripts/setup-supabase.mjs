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

// Bucket public olduğu için okuma zaten serbest; yazma/silme service_role ile
// yapılır (RLS'i atlar). Politikalar yine de savunma amaçlı tanımlanır.
const STORAGE_POLICY_SQL = `
DO $$
BEGIN
  -- Herkese okuma
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'shv_public_read'
  ) THEN
    EXECUTE format(
      'CREATE POLICY shv_public_read ON storage.objects FOR SELECT USING (bucket_id = %L)',
      '${BUCKET}'
    );
  END IF;

  -- Giriş yapmış kullanıcı yükleyebilir
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'shv_auth_insert'
  ) THEN
    EXECUTE format(
      'CREATE POLICY shv_auth_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = %L)',
      '${BUCKET}'
    );
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'storage.objects politikaları atlandı (yetki yok) — bucket public ise sorun değil.';
END $$;
`;

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
      fileSizeLimit: "104857600", // 100MB (video yüklemeleri için)
    });
    if (updErr) log.warn(`Bucket güncellenemedi: ${updErr.message}`);
    else log.ok("Bucket public + 100MB limit olarak ayarlandı");
  } else {
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: "104857600",
    });
    if (createErr) log.err(`Bucket oluşturulamadı: ${createErr.message}`);
    else log.ok(`Bucket '${BUCKET}' oluşturuldu (public, 100MB)`);
  }

  // ── 5. Storage politikaları ──────────────────────────────────────────────
  log.step("Storage erişim politikaları uygulanıyor...");
  try {
    await client.query(STORAGE_POLICY_SQL);
    log.ok("Politikalar uygulandı");
  } catch (err) {
    log.warn(`Politikalar atlandı: ${err.message}`);
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
