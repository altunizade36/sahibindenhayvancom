/**
 * Kurulum script'leri için ortak yardımcılar.
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export const ROOT = path.resolve(import.meta.dirname, "..", "..");
export const ENV_PATH = path.join(ROOT, ".env");

// ── Konsol ────────────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

export const log = {
  title: (m) => console.log(`\n${c.bold}${c.cyan}${m}${c.reset}\n${"─".repeat(Math.min(m.length, 60))}`),
  step: (m) => console.log(`${c.blue}▸${c.reset} ${m}`),
  ok: (m) => console.log(`${c.green}✅${c.reset} ${m}`),
  warn: (m) => console.log(`${c.yellow}⚠️ ${c.reset} ${m}`),
  err: (m) => console.log(`${c.red}❌${c.reset} ${m}`),
  info: (m) => console.log(`${c.dim}   ${m}${c.reset}`),
  plain: (m) => console.log(m),
};

// ── .env okuma / yazma ────────────────────────────────────────────────────

/** .env dosyasını satır sırasını koruyarak ayrıştırır. */
export function readEnvFile(file = ENV_PATH) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

/**
 * .env dosyasındaki değerleri günceller/ekler.
 * Yorumları ve sıralamayı korur; olmayan anahtarları sona ekler.
 */
export function updateEnvFile(updates, file = ENV_PATH) {
  const lines = fs.existsSync(file)
    ? fs.readFileSync(file, "utf8").split(/\r?\n/)
    : [];
  const remaining = { ...updates };

  const next = lines.map((line) => {
    const m = line.match(/^(\s*)([A-Z0-9_]+)(\s*=\s*)(.*)$/i);
    if (!m) return line;
    const key = m[2];
    if (!(key in remaining)) return line;
    const value = remaining[key];
    delete remaining[key];
    return `${m[1]}${key}=${formatEnvValue(value)}`;
  });

  const extra = Object.entries(remaining);
  if (extra.length) {
    if (next.length && next[next.length - 1].trim() !== "") next.push("");
    for (const [k, v] of extra) next.push(`${k}=${formatEnvValue(v)}`);
  }

  fs.writeFileSync(file, next.join("\n"), "utf8");
}

function formatEnvValue(v) {
  const s = String(v ?? "");
  // Boşluk, # veya satır sonu içeriyorsa tırnakla
  return /[\s#"']/.test(s) ? `"${s.replace(/"/g, '\\"')}"` : s;
}

/** .env + process.env birleşimi (process.env öncelikli değil — .env kaynak kabul edilir) */
export function loadEnv() {
  const fileEnv = readEnvFile();
  return { ...process.env, ...fileEnv };
}

// ── Soru sorma ────────────────────────────────────────────────────────────

let rl;
function getRl() {
  if (!rl) rl = readline.createInterface({ input, output });
  return rl;
}
export function closePrompt() {
  if (rl) {
    rl.close();
    rl = null;
  }
}

export async function ask(question, { default: def = "", required = false } = {}) {
  const suffix = def ? ` ${c.dim}(${def})${c.reset}` : "";
  for (;;) {
    const answer = (await getRl().question(`${c.cyan}?${c.reset} ${question}${suffix}: `)).trim();
    const value = answer || def;
    if (value || !required) return value;
    log.err("Bu alan zorunlu.");
  }
}

export async function confirm(question, def = true) {
  const hint = def ? "E/h" : "e/H";
  const answer = (await getRl().question(`${c.cyan}?${c.reset} ${question} ${c.dim}(${hint})${c.reset}: `))
    .trim()
    .toLowerCase();
  if (!answer) return def;
  return ["e", "evet", "y", "yes"].includes(answer);
}

/** Supabase bağlantı dizesinden proje referansını (proje id) çıkarır. */
export function projectRefFromUrl(url = "") {
  const m =
    url.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i) ||
    url.match(/db\.([a-z0-9]+)\.supabase\.co/i) ||
    url.match(/postgres\.([a-z0-9]+):/i);
  return m ? m[1] : null;
}
