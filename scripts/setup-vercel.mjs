#!/usr/bin/env node
/**
 * Vercel otomatik kurulumu.
 *
 *   npm run setup:vercel
 *
 * Yaptıkları:
 *   1. Vercel CLI'yi kontrol eder / giriş yapmanızı ister
 *   2. Projeyi bağlar (vercel link)
 *   3. .env içindeki değişkenleri Vercel'e yükler (production + preview)
 *   4. İsteğe bağlı: üretime deploy eder
 */
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { loadEnv, log, ROOT, ask, confirm, closePrompt, updateEnvFile } from "./lib/env.mjs";

const env = loadEnv();

/** Vercel'e gönderilecek değişkenler — deploy otomasyonuna ait olanlar hariç */
const SKIP = new Set([
  "GODADDY_API_KEY",
  "GODADDY_API_SECRET",
  "GODADDY_DOMAIN",
  "VERCEL_DNS_A_RECORD",
  "VERCEL_DNS_CNAME",
  "PORT",
  "NODE_ENV", // Vercel kendisi ayarlar
  "DIRECT_URL", // sadece migration için, yerelde kalır
]);

const TARGETS = ["production", "preview"];

function vercel(args, opts = {}) {
  return spawnSync("npx", ["--yes", "vercel@latest", ...args], {
    cwd: ROOT,
    encoding: "utf8",
    shell: process.platform === "win32",
    ...opts,
  });
}

function ensureCli() {
  log.step("Vercel CLI kontrol ediliyor...");
  const r = vercel(["--version"]);
  if (r.status !== 0) {
    log.err("Vercel CLI çalıştırılamadı. İnternet bağlantınızı kontrol edin.");
    process.exit(1);
  }
  log.ok(`Vercel CLI ${String(r.stdout).trim()}`);
}

function ensureLogin() {
  log.step("Vercel oturumu kontrol ediliyor...");
  const r = vercel(["whoami"]);
  if (r.status !== 0) {
    log.warn("Vercel'e giriş yapılmamış. Tarayıcı açılacak...");
    const login = vercel(["login"], { stdio: "inherit" });
    if (login.status !== 0) {
      log.err("Giriş başarısız.");
      process.exit(1);
    }
  }
  const who = vercel(["whoami"]);
  log.ok(`Giriş yapıldı: ${String(who.stdout).trim()}`);
}

function ensureLinked() {
  const linkFile = path.join(ROOT, ".vercel", "project.json");
  if (fs.existsSync(linkFile)) {
    const info = JSON.parse(fs.readFileSync(linkFile, "utf8"));
    log.ok(`Proje bağlı: ${info.projectName || info.projectId}`);
    return info;
  }
  log.step("Proje Vercel'e bağlanıyor (vercel link)...");
  const r = vercel(["link"], { stdio: "inherit" });
  if (r.status !== 0) {
    log.err("vercel link başarısız.");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(linkFile, "utf8"));
}

/** Bir değişkeni hedef ortama yazar (varsa önce siler). */
function setEnvVar(name, value, target) {
  // Sessizce sil — yoksa hata verir, önemsiz
  vercel(["env", "rm", name, target, "--yes"]);
  const r = vercel(["env", "add", name, target], { input: value });
  return r.status === 0;
}

async function pushEnvVars() {
  const entries = Object.entries(env).filter(
    ([k, v]) =>
      !SKIP.has(k) &&
      v !== "" &&
      v != null &&
      // Sadece .env dosyasında tanımlı olanlar (sistem env'i değil)
      /^(DATABASE_URL|SUPABASE_|SESSION_SECRET|APP_URL|FROM_EMAIL|ADMIN_PANEL_PIN|RESEND_|UPSTASH_|RECAPTCHA_|GOOGLE_|FACEBOOK_|VITE_)/.test(k)
  );

  if (!entries.length) {
    log.warn(".env dosyasında yüklenecek değişken bulunamadı.");
    return;
  }

  log.step(`${entries.length} değişken Vercel'e yükleniyor...`);
  let ok = 0;
  const failed = [];

  for (const [name, value] of entries) {
    let allOk = true;
    for (const target of TARGETS) {
      if (!setEnvVar(name, String(value), target)) allOk = false;
    }
    if (allOk) {
      ok++;
      process.stdout.write(`   ${name}\n`);
    } else {
      failed.push(name);
    }
  }

  log.ok(`${ok} değişken yüklendi`);
  if (failed.length) {
    log.warn(`Yüklenemedi: ${failed.join(", ")}`);
    log.info("Vercel Dashboard → Settings → Environment Variables'dan elle ekleyebilirsiniz.");
  }
}

async function run() {
  log.title("Vercel Kurulumu");

  ensureCli();
  ensureLogin();
  const project = ensureLinked();

  // APP_URL üretim alan adına göre ayarlansın
  const domain = await ask(
    "Üretim alan adınız (cookie/OAuth yönlendirmeleri için)",
    { default: env.GODADDY_DOMAIN || "sahibindenhayvan.com" }
  );
  const appUrl = domain.startsWith("http") ? domain : `https://${domain}`;
  if (env.APP_URL !== appUrl) {
    updateEnvFile({ APP_URL: appUrl });
    env.APP_URL = appUrl;
    log.ok(`APP_URL = ${appUrl}`);
  }

  await pushEnvVars();

  // Alan adını projeye ekle
  if (await confirm(`'${domain}' alan adı Vercel projesine eklensin mi?`, true)) {
    for (const d of [domain, `www.${domain}`]) {
      const r = vercel(["domains", "add", d]);
      const out = `${r.stdout || ""}${r.stderr || ""}`;
      if (r.status === 0) log.ok(`Alan adı eklendi: ${d}`);
      else if (/already|zaten/i.test(out)) log.ok(`Alan adı zaten ekli: ${d}`);
      else log.warn(`${d} eklenemedi: ${out.trim().split("\n").pop()}`);
    }
    log.info("DNS kayıtları için: npm run setup:dns");
  }

  if (await confirm("Şimdi üretime deploy edilsin mi? (vercel --prod)", false)) {
    log.step("Deploy başlıyor...");
    const r = vercel(["--prod"], { stdio: "inherit" });
    if (r.status === 0) log.ok("Deploy tamamlandı");
    else log.err("Deploy başarısız — yukarıdaki çıktıya bakın.");
  }

  log.title("Vercel Hazır");
  log.info(`Proje: ${project.projectName || project.projectId}`);
  log.info("Sonraki adım: npm run setup:dns  (GoDaddy DNS kayıtları)");
  closePrompt();
}

run().catch((err) => {
  log.err(err.stack || err.message);
  closePrompt();
  process.exit(1);
});
