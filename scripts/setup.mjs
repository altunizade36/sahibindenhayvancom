#!/usr/bin/env node
/**
 * Tek komutluk kurulum sihirbazı.
 *
 *   npm run setup
 *
 * Sırasıyla: .env doldurma → Supabase → Vercel → GoDaddy DNS
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  ROOT,
  ENV_PATH,
  loadEnv,
  readEnvFile,
  updateEnvFile,
  log,
  ask,
  confirm,
  closePrompt,
  projectRefFromUrl,
} from "./lib/env.mjs";

function runScript(file) {
  const r = spawnSync(process.execPath, [path.join(ROOT, "scripts", file)], {
    cwd: ROOT,
    stdio: "inherit",
  });
  return r.status === 0;
}

async function ensureEnvFile() {
  if (!fs.existsSync(ENV_PATH)) {
    const example = path.join(ROOT, ".env.example");
    fs.copyFileSync(example, ENV_PATH);
    log.ok(".env dosyası .env.example'dan oluşturuldu");
  }
}

async function collectSupabase() {
  const env = readEnvFile();
  log.title("1/4 — Supabase Bilgileri");

  if (env.DATABASE_URL && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    const ref = projectRefFromUrl(env.SUPABASE_URL);
    log.ok(`Zaten yapılandırılmış (proje: ${ref})`);
    if (!(await confirm("Değiştirmek ister misiniz?", false))) return;
  }

  log.plain("");
  log.info("Supabase Dashboard → https://supabase.com/dashboard");
  log.info("Proje yoksa: New Project → Bölge: Frankfurt (eu-central-1)");
  log.plain("");
  log.info("Aşağıdaki değerleri  Settings → API  ekranından kopyalayın:");
  log.plain("");

  const supabaseUrl = await ask("SUPABASE_URL (https://xxxx.supabase.co)", { required: true });
  const serviceKey = await ask("SUPABASE_SERVICE_ROLE_KEY (service_role, secret)", { required: true });
  const anonKey = await ask("SUPABASE_ANON_KEY (anon, public)", { required: false });

  log.plain("");
  log.info("Şimdi  Connect  ekranından bağlantı dizelerini alın:");
  log.info("  • 'Transaction pooler' (port 6543) → DATABASE_URL   [Vercel için]");
  log.info("  • 'Session pooler'     (port 5432) → DIRECT_URL     [migration için]");
  log.info("  Not: [YOUR-PASSWORD] kısmını gerçek şifrenizle değiştirin.");
  log.plain("");

  const dbUrl = await ask("DATABASE_URL", { required: true });
  const directUrl = await ask("DIRECT_URL", { default: dbUrl });

  const updates = {
    SUPABASE_URL: supabaseUrl.replace(/\/$/, ""),
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
    DATABASE_URL: dbUrl,
    DIRECT_URL: directUrl,
  };
  if (anonKey) updates.SUPABASE_ANON_KEY = anonKey;

  // SESSION_SECRET yoksa üret
  if (!env.SESSION_SECRET) {
    updates.SESSION_SECRET = crypto.randomBytes(48).toString("base64");
    log.ok("SESSION_SECRET otomatik üretildi");
  }

  updateEnvFile(updates);
  log.ok(".env güncellendi");
}

async function run() {
  log.title("sahibindenhayvan.com — Kurulum Sihirbazı");
  log.info("Replit'ten Vercel + Supabase'e taşınmış sürüm");

  await ensureEnvFile();
  await collectSupabase();
  closePrompt();

  // ── Supabase ─────────────────────────────────────────────────────────────
  log.title("2/4 — Supabase Kurulumu");
  if (!runScript("setup-supabase.mjs")) {
    log.err("Supabase kurulumu başarısız. Düzeltip tekrar deneyin: npm run setup:supabase");
    process.exit(1);
  }

  // ── Vercel ───────────────────────────────────────────────────────────────
  log.title("3/4 — Vercel Kurulumu");
  if (!(await confirm("Vercel kurulumuna geçilsin mi?", true))) {
    log.info("Daha sonra: npm run setup:vercel");
  } else {
    closePrompt();
    runScript("setup-vercel.mjs");
  }

  // ── DNS ──────────────────────────────────────────────────────────────────
  log.title("4/4 — GoDaddy DNS");
  if (!(await confirm("DNS kayıtları ayarlansın mı?", true))) {
    log.info("Daha sonra: npm run setup:dns");
  } else {
    closePrompt();
    runScript("setup-godaddy-dns.mjs");
  }

  log.title("Kurulum Tamamlandı");
  log.plain("");
  log.info("Yerel geliştirme :  npm run dev      → http://localhost:5000");
  log.info("Durum kontrolü   :  npm run doctor");
  log.info("Yeniden deploy   :  npx vercel --prod");
  log.plain("");
  closePrompt();
}

run().catch((err) => {
  log.err(err.stack || err.message);
  closePrompt();
  process.exit(1);
});
