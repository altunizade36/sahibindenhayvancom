#!/usr/bin/env node
/**
 * Yapılandırma tanılaması.
 *
 *   npm run doctor
 *
 * Her şeyin bağlı olup olmadığını kontrol eder ve eksikleri raporlar.
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { loadEnv, log, ROOT } from "./lib/env.mjs";

const env = loadEnv();
const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (ok === true) log.ok(`${name}${detail ? ` — ${detail}` : ""}`);
  else if (ok === "warn") log.warn(`${name}${detail ? ` — ${detail}` : ""}`);
  else log.err(`${name}${detail ? ` — ${detail}` : ""}`);
}

// ── 1. Replit kalıntıları ───────────────────────────────────────────────────
function checkReplitFree() {
  log.title("Replit Bağımsızlığı");

  const leftovers = [".replit", "replit.nix", "server/replitAuth.ts", ".upm"].filter((f) =>
    fs.existsSync(path.join(ROOT, f))
  );
  record("Replit dosyaları temiz", leftovers.length === 0, leftovers.join(", ") || "kalıntı yok");

  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const replitDeps = Object.keys(deps).filter((d) => d.startsWith("@replit/"));
  record("Replit npm paketleri temiz", replitDeps.length === 0, replitDeps.join(", ") || "yok");

  const lockPath = path.join(ROOT, "package-lock.json");
  if (fs.existsSync(lockPath)) {
    const hasReplitRegistry = fs.readFileSync(lockPath, "utf8").includes("replit.local");
    record(
      "package-lock.json temiz kayıt sunucusu kullanıyor",
      !hasReplitRegistry,
      hasReplitRegistry ? "replit.local URL'leri var — lockfile'ı yeniden üretin" : "registry.npmjs.org"
    );
  }

  const neon = "@neondatabase/serverless" in deps;
  record("Veritabanı sürücüsü Supabase uyumlu", !neon, neon ? "@neondatabase/serverless hâlâ var" : "pg");
}

// ── 2. Ortam değişkenleri ───────────────────────────────────────────────────
function checkEnv() {
  log.title("Ortam Değişkenleri");

  const required = [
    ["DATABASE_URL", "Supabase PostgreSQL bağlantısı"],
    ["SUPABASE_URL", "Supabase proje URL'i"],
    ["SUPABASE_SERVICE_ROLE_KEY", "Storage için service_role anahtarı"],
    ["SESSION_SECRET", "Oturum imzalama anahtarı"],
  ];
  const optional = [
    ["RESEND_API_KEY", "E-posta gönderimi (doğrulama, şifre sıfırlama)"],
    ["UPSTASH_REDIS_REST_URL", "Redis önbellek"],
    ["GOOGLE_CLIENT_ID", "Google ile giriş"],
    ["FACEBOOK_APP_ID", "Facebook ile giriş"],
  ];

  for (const [key, desc] of required) {
    record(key, !!env[key], env[key] ? desc : `EKSİK — ${desc}`);
  }
  for (const [key, desc] of optional) {
    record(key, env[key] ? true : "warn", env[key] ? desc : `tanımsız — ${desc} devre dışı`);
  }

  if (env.SESSION_SECRET && env.SESSION_SECRET.length < 32) {
    record("SESSION_SECRET uzunluğu", "warn", "32 karakterden kısa — güçlendirin");
  }

  if (env.DATABASE_URL?.includes(":5432") && !env.DATABASE_URL.includes("pooler")) {
    record(
      "DATABASE_URL havuz tipi",
      "warn",
      "Doğrudan bağlantı (5432) — Vercel için 'Transaction pooler' (6543) önerilir"
    );
  }
}

// ── 3. Veritabanı ───────────────────────────────────────────────────────────
async function checkDatabase() {
  log.title("Veritabanı");

  if (!env.DATABASE_URL) {
    record("Bağlantı", false, "DATABASE_URL yok, atlanıyor");
    return;
  }

  const client = new pg.Client({
    connectionString: env.DIRECT_URL || env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
  });

  try {
    await client.connect();
    record("Bağlantı", true, "başarılı");

    const { rows: t } = await client.query(
      "select count(*)::int n from information_schema.tables where table_schema='public'"
    );
    record("Tablolar", t[0].n > 0, `${t[0].n} tablo` + (t[0].n === 0 ? " — npm run db:push çalıştırın" : ""));

    const { rows: s } = await client.query(
      "select count(*)::int n from information_schema.tables where table_schema='public' and table_name='sessions'"
    );
    record("sessions tablosu", s[0].n === 1, s[0].n ? "var" : "YOK — girişler çalışmaz");

    const { rows: u } = await client.query(
      "select count(*)::int n from information_schema.tables where table_schema='public' and table_name='users'"
    );
    if (u[0].n) {
      const { rows: cnt } = await client.query("select count(*)::int n from users");
      record("Kullanıcı kaydı", true, `${cnt[0].n} kullanıcı`);
    }

    // ── Güvenlik: RLS ve Data API ───────────────────────────────────────────
    const { rows: rls } = await client.query(
      "select count(*) filter (where not rowsecurity)::int as kapali from pg_tables where schemaname='public'"
    );
    record(
      "RLS tüm tablolarda açık",
      rls[0].kapali === 0,
      rls[0].kapali === 0
        ? "korumalı"
        : `${rls[0].kapali} tabloda KAPALI — 'npm run harden' çalıştırın`
    );

    const { rows: grants } = await client.query(
      "select count(*)::int n from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','authenticated')"
    );
    record(
      "Data API kapalı (anon erişimi yok)",
      grants[0].n === 0,
      grants[0].n === 0
        ? "anon/authenticated yetkisiz"
        : `anon/authenticated ${grants[0].n} yetkiye sahip — 'npm run harden' çalıştırın`
    );

    await client.end();
  } catch (err) {
    record("Bağlantı", false, err.message);
    try {
      await client.end();
    } catch {
      /* zaten kapalı */
    }
  }
}

// ── 4. Storage ──────────────────────────────────────────────────────────────
async function checkStorage() {
  log.title("Dosya Depolama (Supabase Storage)");

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    record("Yapılandırma", false, "SUPABASE_URL / SERVICE_ROLE_KEY yok");
    return;
  }

  const bucket = env.SUPABASE_STORAGE_BUCKET || "uploads";
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    record("Bucket listesi", false, error.message);
    return;
  }

  const found = data.find((b) => b.name === bucket);
  record(`Bucket '${bucket}'`, !!found, found ? "var" : "YOK — npm run setup:supabase çalıştırın");
  if (found) {
    record("Bucket public", found.public ? true : "warn", found.public ? "evet" : "hayır — görseller görünmeyebilir");
  }
}

// ── 5. Vercel ───────────────────────────────────────────────────────────────
function checkVercel() {
  log.title("Vercel");

  const linkFile = path.join(ROOT, ".vercel", "project.json");
  if (fs.existsSync(linkFile)) {
    const info = JSON.parse(fs.readFileSync(linkFile, "utf8"));
    record("Proje bağlantısı", true, info.projectName || info.projectId);
  } else {
    record("Proje bağlantısı", "warn", "bağlı değil — npm run setup:vercel");
  }

  record("vercel.json", fs.existsSync(path.join(ROOT, "vercel.json")), "yapılandırma dosyası");
  record(
    "Derlenmiş istemci",
    fs.existsSync(path.join(ROOT, "dist", "public", "index.html")),
    fs.existsSync(path.join(ROOT, "dist", "public", "index.html")) ? "dist/public hazır" : "npm run build çalıştırın"
  );
}

// ── Çalıştır ────────────────────────────────────────────────────────────────
async function run() {
  log.title("sahibindenhayvan.com — Sistem Tanılaması");

  checkReplitFree();
  checkEnv();
  await checkDatabase();
  await checkStorage();
  checkVercel();

  const fails = results.filter((r) => r.ok === false);
  const warns = results.filter((r) => r.ok === "warn");

  log.title("Özet");
  log.plain(`   Başarılı : ${results.filter((r) => r.ok === true).length}`);
  log.plain(`   Uyarı    : ${warns.length}`);
  log.plain(`   Hata     : ${fails.length}`);
  log.plain("");

  if (fails.length) {
    log.err("Düzeltilmesi gerekenler:");
    for (const f of fails) log.info(`• ${f.name} — ${f.detail}`);
    process.exit(1);
  }

  log.ok("Sistem yayına hazır 🚀");
}

run().catch((err) => {
  log.err(err.stack || err.message);
  process.exit(1);
});
