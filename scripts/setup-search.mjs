#!/usr/bin/env node
/**
 * Türkçe arama altyapısını kurar ve doğrular.
 *
 *   npm run setup:search
 *
 * scripts/sql/turkce-arama.sql dosyasını uygular, ardından gerçekten
 * çalıştığını ölçer: aksansız yazılan aramalar Türkçe karakterli kayıtları
 * bulabiliyor mu?
 *
 * `npm run db:push` sonrasında otomatik çalışır — `drizzle-kit push` şema
 * dışındaki nesneleri (fonksiyon, indeks) bilmez ve silebilir.
 *
 * Betik idempotenttir.
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

// Aksansız yazılan arama, Türkçe karakterli metni bulmalı.
const ORNEKLER = [
  ["kopek", "Köpek yavrusu satılık"],
  ["sirin", "Şirin kedi yavrusu"],
  ["sigir", "Sığır satılık"],
  ["guvercin", "Güvercin çifti"],
  ["inek", "İnek satılık"],
  ["coban", "Çoban köpeği"],
  ["KÖPEK", "köpek yavrusu"],
];

async function run() {
  log.title("Türkçe Arama Altyapısı");

  const sqlPath = path.join(ROOT, "scripts", "sql", "turkce-arama.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const client = new pg.Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20_000,
  });
  await client.connect();

  try {
    await client.query(sql);
    log.ok("turkce-arama.sql uygulandı (unaccent, pg_trgm, tr_normalize, indeksler)");

    // ── Doğrulama: aksansız arama eşleşiyor mu ──────────────────────────────
    let basarisiz = 0;
    for (const [aranan, icerik] of ORNEKLER) {
      const { rows } = await client.query(
        "SELECT public.tr_normalize($1) LIKE public.tr_normalize($2) AS eslesti",
        [icerik, `%${aranan}%`]
      );
      if (rows[0].eslesti) {
        log.ok(`"${aranan}" → "${icerik}"`);
      } else {
        log.err(`"${aranan}" → "${icerik}" EŞLEŞMEDİ`);
        basarisiz++;
      }
    }

    // ── Doğrulama: indeksler yerinde mi ─────────────────────────────────────
    const { rows: idx } = await client.query(
      `SELECT indexname FROM pg_indexes
       WHERE schemaname = 'public' AND indexname LIKE '%_tr_trgm_idx'
       ORDER BY indexname`
    );
    log.ok(`${idx.length} trigram indeksi kurulu: ${idx.map((i) => i.indexname).join(", ")}`);

    if (basarisiz > 0) {
      log.err(`${basarisiz} örnek eşleşmedi — arama beklendiği gibi çalışmıyor.`);
      process.exitCode = 1;
    }
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  log.err(err.message);
  process.exit(1);
});
