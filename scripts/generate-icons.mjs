#!/usr/bin/env node
/**
 * Marka ikonlarını üretir.
 *
 *   node scripts/generate-icons.mjs
 *
 * NEDEN VAR
 * ---------
 * Proje Replit'ten devralındığında `client/public/favicon.png` hâlâ Replit'in
 * turuncu logosuydu; tarayıcı sekmesinde başkasının markası görünüyordu.
 * Ayrıca manifest.json sekiz farklı boyutta ikon istiyordu ama `icons/`
 * klasörü hiç yoktu — hepsi 404 veriyor, PWA kurulumu ikonsuz kalıyordu.
 *
 * Bu betik tek bir SVG kaynağından (üst menüdeki pati işaretiyle aynı) tüm
 * boyutları üretir. Marka rengi veya işaret değişirse yalnızca aşağıdaki
 * SVG'yi güncelleyip betiği tekrar çalıştırmak yeterlidir.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "client", "public");
const ICONS_DIR = path.join(PUBLIC_DIR, "icons");

const BRAND = "#0066CC";

/** Yuvarlatılmış kare zemin üzerinde beyaz pati — navbar'daki işaretle aynı dil */
function markSvg(size) {
  const r = Math.round(size * 0.22); // köşe yuvarlaklığı
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="${(r / size) * 100}" fill="${BRAND}"/>
  <g fill="#ffffff">
    <ellipse cx="32" cy="34" rx="9"  ry="11"/>
    <ellipse cx="50" cy="28" rx="9"  ry="12"/>
    <ellipse cx="68" cy="34" rx="9"  ry="11"/>
    <ellipse cx="78" cy="52" rx="8"  ry="10"/>
    <path d="M50 46c11 0 20 8 20 17 0 7-6 12-13 12-3 0-5-1-7-1s-4 1-7 1c-7 0-13-5-13-12 0-9 9-17 20-17z"/>
  </g>
</svg>`;
}

/** Açık zeminli, geniş OG görseli (sosyal medya paylaşımları için 1200x630) */
function ogSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F5F9FF"/>
      <stop offset="100%" stop-color="#E3EEFF"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g transform="translate(470 150) scale(2.6)">
    <rect width="100" height="100" rx="22" fill="${BRAND}"/>
    <g fill="#ffffff">
      <ellipse cx="32" cy="34" rx="9"  ry="11"/>
      <ellipse cx="50" cy="28" rx="9"  ry="12"/>
      <ellipse cx="68" cy="34" rx="9"  ry="11"/>
      <ellipse cx="78" cy="52" rx="8"  ry="10"/>
      <path d="M50 46c11 0 20 8 20 17 0 7-6 12-13 12-3 0-5-1-7-1s-4 1-7 1c-7 0-13-5-13-12 0-9 9-17 20-17z"/>
    </g>
  </g>
  <text x="600" y="480" font-family="Inter, Arial, sans-serif" font-size="54" font-weight="700" text-anchor="middle" fill="#0F172A">sahibinden<tspan fill="${BRAND}">hayvan</tspan></text>
  <text x="600" y="535" font-family="Inter, Arial, sans-serif" font-size="26" text-anchor="middle" fill="#475569">Türkiye'nin ücretsiz hayvan ilanları platformu</text>
</svg>`;
}

const MANIFEST_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function run() {
  fs.mkdirSync(ICONS_DIR, { recursive: true });

  // ── PWA ikonları ──────────────────────────────────────────────────────────
  for (const size of MANIFEST_SIZES) {
    const out = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    await sharp(Buffer.from(markSvg(size))).resize(size, size).png().toFile(out);
    console.log(`  icons/icon-${size}x${size}.png`);
  }

  // ── Favicon (Replit logosunun yerine) ─────────────────────────────────────
  await sharp(Buffer.from(markSvg(64))).resize(64, 64).png()
    .toFile(path.join(PUBLIC_DIR, "favicon.png"));
  console.log("  favicon.png  (Replit logosu değiştirildi)");

  // ── Apple dokunmatik ikonu ────────────────────────────────────────────────
  await sharp(Buffer.from(markSvg(180))).resize(180, 180).png()
    .toFile(path.join(PUBLIC_DIR, "apple-touch-icon.png"));
  console.log("  apple-touch-icon.png");

  // ── index.html'in atıf yaptığı logo ve OG görseli ─────────────────────────
  await sharp(Buffer.from(markSvg(512))).resize(512, 512).png()
    .toFile(path.join(PUBLIC_DIR, "logo.png"));
  console.log("  logo.png");

  await sharp(Buffer.from(ogSvg())).png()
    .toFile(path.join(PUBLIC_DIR, "og-image.png"));
  console.log("  og-image.png (1200x630)");

  console.log("\nTamamlandı.");
}

run().catch((err) => {
  console.error("İkon üretimi başarısız:", err);
  process.exit(1);
});
