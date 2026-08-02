#!/usr/bin/env node
/**
 * Performans indekslerini kurar ve gerçekten kullanıldıklarını doğrular.
 *
 *   npm run setup:indexes
 *
 * `npm run db:push` sonrasında otomatik çalışır — drizzle-kit şema dışında
 * tanımlanan indeksleri bilmez ve silebilir.
 *
 * Betik yalnızca uygulamakla kalmıyor: sorgu planına bakıp indeksin
 * seçildiğini kontrol ediyor. Yoksa "indeks var ama kullanılmıyor" durumu
 * fark edilmeden geçer.
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

/**
 * Planın indeks kullanıp kullanmadığını ölçer.
 *
 * Boş ya da çok küçük tabloda PostgreSQL indeksi bilinçli olarak yok sayar —
 * birkaç satırı taramak indeks okumaktan ucuzdur. Bu yüzden doğrulama
 * `enable_seqscan = off` altında yapılıyor: soru "indeks KULLANILABİLİR mi",
 * "şu an kullanılıyor mu" değil.
 */
async function planKullaniyorMu(client, sorgu, indeksAdi) {
  await client.query("SET LOCAL enable_seqscan = off");
  const { rows } = await client.query(`EXPLAIN (FORMAT JSON) ${sorgu}`);
  const plan = JSON.stringify(rows[0]["QUERY PLAN"]);
  return plan.includes(indeksAdi);
}

async function run() {
  log.title("Performans İndeksleri");

  const sqlPath = path.join(ROOT, "scripts", "sql", "performans-indeksleri.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const client = new pg.Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20_000,
  });
  await client.connect();

  try {
    await client.query(sql);
    log.ok("performans-indeksleri.sql uygulandı");

    const kontroller = [
      [
        "en yeni yayındaki ilanlar",
        "SELECT id FROM public.listings WHERE status='active' ORDER BY created_at DESC LIMIT 20",
        "listings_status_created_idx",
      ],
      [
        "şehre göre ilanlar",
        "SELECT id FROM public.listings WHERE status='active' AND city='İstanbul' ORDER BY created_at DESC LIMIT 20",
        "listings_status_city_created_idx",
      ],
      [
        "okunmamış mesaj sayacı",
        "SELECT count(*) FROM public.messages WHERE receiver_id='x' AND read_at IS NULL",
        "messages_receiver_unread_idx",
      ],
      [
        "bildirim listesi",
        "SELECT id FROM public.notifications WHERE user_id='x' ORDER BY created_at DESC LIMIT 20",
        "notifications_user_created_idx",
      ],
    ];

    let eksik = 0;
    for (const [ad, sorgu, indeks] of kontroller) {
      await client.query("BEGIN");
      const kullanildi = await planKullaniyorMu(client, sorgu, indeks);
      await client.query("ROLLBACK");
      if (kullanildi) log.ok(`${ad} → ${indeks}`);
      else { log.err(`${ad} → ${indeks} KULLANILMIYOR`); eksik++; }
    }

    // Süresi dolmuş oturumları temizle (birikirlerse sessions tablosu şişer).
    const { rowCount } = await client.query("DELETE FROM public.sessions WHERE expire < now()");
    log.ok(`Süresi dolmuş oturum temizliği: ${rowCount} kayıt silindi`);

    if (eksik > 0) process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  log.err(err.message);
  process.exit(1);
});
