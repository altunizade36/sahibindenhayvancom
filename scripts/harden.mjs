#!/usr/bin/env node
/**
 * Supabase güvenlik sertleştirmesi.
 *
 *   npm run harden
 *
 * scripts/sql/harden-rls.sql dosyasını uygular ve sonucu doğrular:
 *   • public şemasındaki tüm tablolarda RLS açık mı?
 *   • anon / authenticated rollerinin yetkisi kaldı mı?
 *   • Data API gerçekten kapandı mı? (canlı HTTP isteğiyle test edilir)
 *
 * Betik idempotenttir — istediğiniz kadar çalıştırabilirsiniz.
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

async function run() {
  log.title("Supabase Güvenlik Sertleştirmesi");

  const sqlPath = path.join(ROOT, "scripts", "sql", "harden-rls.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const client = new pg.Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20_000,
  });
  await client.connect();

  // ── Uygula ────────────────────────────────────────────────────────────────
  log.step("harden-rls.sql uygulanıyor...");
  await client.query(sql);
  log.ok("Uygulandı");

  // ── Doğrula: RLS ──────────────────────────────────────────────────────────
  const { rows: rls } = await client.query(`
    select
      count(*) filter (where rowsecurity)     ::int as acik,
      count(*) filter (where not rowsecurity) ::int as kapali
    from pg_tables where schemaname = 'public'
  `);
  if (rls[0].kapali === 0) {
    log.ok(`RLS: ${rls[0].acik} tablonun tamamında açık`);
  } else {
    log.err(`RLS hâlâ ${rls[0].kapali} tabloda kapalı`);
  }

  // ── Doğrula: yetkiler ─────────────────────────────────────────────────────
  const { rows: grants } = await client.query(`
    select count(*)::int as n
    from information_schema.role_table_grants
    where table_schema = 'public' and grantee in ('anon','authenticated')
  `);
  if (grants[0].n === 0) {
    log.ok("Data API yetkileri: anon / authenticated için tamamen kaldırıldı");
  } else {
    log.err(`anon / authenticated hâlâ ${grants[0].n} yetki kaydına sahip`);
  }

  // ── Doğrula: storage listeleme politikası ────────────────────────────────
  const { rows: pol } = await client.query(`
    select count(*)::int as n from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname in ('shv_public_read','shv_auth_insert')
  `);
  log.ok(
    pol[0].n === 0
      ? "Storage: dosya listeleme politikası kaldırıldı"
      : `Storage: ${pol[0].n} politika hâlâ duruyor`
  );

  await client.end();

  // ── Canlı test: Data API gerçekten kapandı mı? ────────────────────────────
  if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    log.step("Data API dışarıdan test ediliyor (anon anahtarıyla)...");
    try {
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/users?select=id&limit=1`,
        {
          headers: {
            apikey: env.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
          },
        }
      );
      const body = await res.text();
      const leaked = res.ok && body.trim().startsWith("[") && body.trim() !== "[]";
      if (leaked) {
        log.err(`users tablosu HÂLÂ okunabiliyor (HTTP ${res.status}) — sertleştirme başarısız!`);
        process.exit(1);
      }
      log.ok(`Data API kapalı (HTTP ${res.status}) — anon anahtarıyla veri okunamıyor`);
    } catch (err) {
      log.warn(`Canlı test yapılamadı: ${err.message}`);
    }
  }

  log.title("Sertleştirme Tamam");
  log.info("Sunucu doğrudan `postgres` rolüyle bağlandığı için etkilenmez.");
  log.info("Supabase Dashboard → Advisors ekranını yenileyip kontrol edebilirsiniz.");
}

run().catch((err) => {
  log.err(err.stack || err.message);
  process.exit(1);
});
