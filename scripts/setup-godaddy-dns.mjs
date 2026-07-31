#!/usr/bin/env node
/**
 * GoDaddy DNS otomatik yapılandırması → Vercel.
 *
 *   npm run setup:dns
 *
 * Gerekli .env değişkenleri:
 *   GODADDY_API_KEY      https://developer.godaddy.com/keys adresinden
 *   GODADDY_API_SECRET
 *   GODADDY_DOMAIN       örn. sahibindenhayvan.com
 *
 * Oluşturulan kayıtlar:
 *   A     @     76.76.21.21           (Vercel apex)
 *   CNAME www   cname.vercel-dns.com  (www alt alan adı)
 *
 * NOT: GoDaddy üretim API anahtarları hesap koşullarına bağlıdır. Anahtar
 * alınamıyorsa script size elle girilecek kayıtları gösterir.
 */
import { loadEnv, log, ask, confirm, closePrompt, updateEnvFile } from "./lib/env.mjs";

const env = loadEnv();
const API = "https://api.godaddy.com/v1";

const A_RECORD = env.VERCEL_DNS_A_RECORD || "76.76.21.21";
const CNAME_TARGET = env.VERCEL_DNS_CNAME || "cname.vercel-dns.com";

/** Elle kurulum talimatı — API kullanılamadığında gösterilir. */
function manualInstructions(domain) {
  log.title("Elle DNS Ayarı (GoDaddy)");
  log.plain("GoDaddy → My Products → DNS → Manage DNS ekranında şu kayıtları girin:\n");
  log.plain("  ┌────────┬──────┬────────────────────────┬────────┐");
  log.plain("  │ Tür    │ Ad   │ Değer                  │ TTL    │");
  log.plain("  ├────────┼──────┼────────────────────────┼────────┤");
  log.plain(`  │ A      │ @    │ ${A_RECORD.padEnd(22)} │ 600 sn │`);
  log.plain(`  │ CNAME  │ www  │ ${CNAME_TARGET.padEnd(22)} │ 600 sn │`);
  log.plain("  └────────┴──────┴────────────────────────┴────────┘\n");
  log.info("Varsayılan 'Parked' A kaydı varsa onu SİLİN veya yukarıdaki IP ile değiştirin.");
  log.info(`Yayılma 10 dk – 1 saat sürer. Kontrol:  nslookup ${domain}`);
}

async function godaddy(pathname, { method = "GET", body, key, secret } = {}) {
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      Authorization: `sso-key ${key}:${secret}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

async function run() {
  log.title("GoDaddy DNS → Vercel");

  let key = env.GODADDY_API_KEY;
  let secret = env.GODADDY_API_SECRET;
  const domain = env.GODADDY_DOMAIN || (await ask("Alan adı", { default: "sahibindenhayvan.com" }));

  if (!key || !secret) {
    log.warn("GODADDY_API_KEY / GODADDY_API_SECRET .env dosyasında tanımlı değil.");
    log.info("Anahtar almak için: https://developer.godaddy.com/keys  ('Production' anahtarı)");

    if (await confirm("Anahtarları şimdi girmek ister misiniz?", true)) {
      key = await ask("GODADDY_API_KEY", { required: true });
      secret = await ask("GODADDY_API_SECRET", { required: true });
      updateEnvFile({ GODADDY_API_KEY: key, GODADDY_API_SECRET: secret, GODADDY_DOMAIN: domain });
      log.ok(".env güncellendi");
    } else {
      manualInstructions(domain);
      closePrompt();
      return;
    }
  }

  // ── Alan adı erişimini doğrula ───────────────────────────────────────────
  log.step(`'${domain}' için GoDaddy erişimi doğrulanıyor...`);
  const check = await godaddy(`/domains/${domain}`, { key, secret });

  if (!check.ok) {
    if (check.status === 401 || check.status === 403) {
      log.err("GoDaddy kimlik doğrulaması reddedildi (401/403).");
      log.info("Anahtarın 'Production' (Test/OTE değil) olduğundan ve hesapta");
      log.info("alan adının bu hesaba ait olduğundan emin olun.");
    } else if (check.status === 404) {
      log.err(`'${domain}' bu GoDaddy hesabında bulunamadı.`);
    } else {
      log.err(`GoDaddy API hatası (${check.status}): ${JSON.stringify(check.data)}`);
    }
    manualInstructions(domain);
    closePrompt();
    return;
  }
  log.ok(`Alan adı doğrulandı (durum: ${check.data?.status || "?"})`);

  // ── Mevcut kayıtları göster ──────────────────────────────────────────────
  const existing = await godaddy(`/domains/${domain}/records`, { key, secret });
  if (existing.ok && Array.isArray(existing.data)) {
    const relevant = existing.data.filter(
      (r) => (r.type === "A" && r.name === "@") || (r.type === "CNAME" && r.name === "www")
    );
    if (relevant.length) {
      log.info("Mevcut kayıtlar (değiştirilecek):");
      for (const r of relevant) log.info(`  ${r.type.padEnd(6)} ${r.name.padEnd(5)} → ${r.data}`);
    }
  }

  if (!(await confirm(`Kayıtlar Vercel'e yönlendirilsin mi? (A @ → ${A_RECORD}, CNAME www → ${CNAME_TARGET})`, true))) {
    log.warn("İptal edildi.");
    manualInstructions(domain);
    closePrompt();
    return;
  }

  // ── A kaydı (apex) ───────────────────────────────────────────────────────
  log.step(`A kaydı yazılıyor: @ → ${A_RECORD}`);
  const aRes = await godaddy(`/domains/${domain}/records/A/%40`, {
    method: "PUT",
    key,
    secret,
    body: [{ data: A_RECORD, ttl: 600 }],
  });
  if (aRes.ok) log.ok("A kaydı ayarlandı");
  else log.err(`A kaydı yazılamadı (${aRes.status}): ${JSON.stringify(aRes.data)}`);

  // ── CNAME kaydı (www) ────────────────────────────────────────────────────
  log.step(`CNAME kaydı yazılıyor: www → ${CNAME_TARGET}`);
  const cRes = await godaddy(`/domains/${domain}/records/CNAME/www`, {
    method: "PUT",
    key,
    secret,
    body: [{ data: CNAME_TARGET, ttl: 600 }],
  });
  if (cRes.ok) log.ok("CNAME kaydı ayarlandı");
  else log.err(`CNAME kaydı yazılamadı (${cRes.status}): ${JSON.stringify(cRes.data)}`);

  // ── Özet ─────────────────────────────────────────────────────────────────
  log.title("DNS Ayarlandı");
  log.info(`https://${domain}      → Vercel (A ${A_RECORD})`);
  log.info(`https://www.${domain}  → Vercel (CNAME ${CNAME_TARGET})`);
  log.plain("");
  log.info("• Yayılma 10 dk – 1 saat sürebilir.");
  log.info("• Vercel SSL sertifikasını otomatik üretir (Domains ekranında 'Valid' olmalı).");
  log.info(`• Kontrol:  nslookup ${domain}`);

  if (aRes.ok && cRes.ok) {
    log.info("• Vercel Dashboard → Settings → Domains ekranında doğrulamayı bekleyin.");
  }

  closePrompt();
}

run().catch((err) => {
  log.err(err.stack || err.message);
  closePrompt();
  process.exit(1);
});
