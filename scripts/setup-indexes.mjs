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

/** İndeks veritabanında var mı? */
async function indeksVarMi(client, indeksAdi) {
  const { rowCount } = await client.query(
    "SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname=$1",
    [indeksAdi]
  );
  return rowCount > 0;
}

/** Tablodaki tahmini canlı satır sayısı. */
async function satirSayisi(client, tablo) {
  const { rows } = await client.query(
    "SELECT n_live_tup::int n FROM pg_stat_user_tables WHERE schemaname='public' AND relname=$1",
    [tablo]
  );
  return rows[0]?.n ?? 0;
}

/**
 * Planlayıcının BU indeksi seçip seçmediğini ölçer.
 *
 * Yalnızca tabloda yeterli veri varken anlamlıdır. Boş ya da çok küçük tabloda
 * PostgreSQL maliyet hesabına göre başka (yine geçerli) bir indeksi seçebilir
 * — örneğin `status` koşulunu karşılayan farklı bir bileşik indeksi. Bu bir
 * kusur değildir; o yüzden az veride bu kontrol ATLANIR, yoksa asılsız uyarı
 * üretir.
 */
async function planBuIndeksiSeciyorMu(client, sorgu, indeksAdi) {
  const { rows } = await client.query(`EXPLAIN (FORMAT JSON) ${sorgu}`);
  return JSON.stringify(rows[0]["QUERY PLAN"]).includes(indeksAdi);
}

/** Plan verinin tamamını tarıyor mu? */
async function planTumTabloyuTariyorMu(client, sorgu) {
  const { rows } = await client.query(`EXPLAIN (FORMAT JSON) ${sorgu}`);
  return JSON.stringify(rows[0]["QUERY PLAN"]).includes('"Node Type":"Seq Scan"');
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
      {
        ad: "en yeni yayındaki ilanlar",
        tablo: "listings",
        indeks: "listings_status_created_idx",
        sorgu: "SELECT id FROM public.listings WHERE status='active' ORDER BY created_at DESC LIMIT 20",
      },
      {
        ad: "şehre göre ilanlar",
        tablo: "listings",
        indeks: "listings_status_city_created_idx",
        sorgu: "SELECT id FROM public.listings WHERE status='active' AND city='İstanbul' ORDER BY created_at DESC LIMIT 20",
      },
      {
        ad: "fiyata göre sıralama",
        tablo: "listings",
        indeks: "listings_status_price_idx",
        sorgu: "SELECT id FROM public.listings WHERE status='active' ORDER BY price ASC LIMIT 20",
      },
      {
        ad: "okunmamış mesaj sayacı",
        tablo: "messages",
        indeks: "messages_receiver_unread_idx",
        sorgu: "SELECT count(*) FROM public.messages WHERE receiver_id='x' AND read_at IS NULL",
      },
      {
        ad: "bildirim listesi",
        tablo: "notifications",
        indeks: "notifications_user_created_idx",
        sorgu: "SELECT id FROM public.notifications WHERE user_id='x' ORDER BY created_at DESC LIMIT 20",
      },
    ];

    // Plan kontrolü ancak yeterli veri varken anlamlı. Altında kalırsa
    // PostgreSQL maliyet hesabına göre başka (yine geçerli) bir indeksi
    // seçebilir ve asılsız uyarı üretiriz.
    const PLAN_ESIGI = 500;

    let eksik = 0;
    for (const k of kontroller) {
      if (!(await indeksVarMi(client, k.indeks))) {
        log.err(`${k.ad} → ${k.indeks} OLUŞTURULAMADI`);
        eksik++;
        continue;
      }

      const satir = await satirSayisi(client, k.tablo);
      if (satir < PLAN_ESIGI) {
        log.ok(`${k.ad} → ${k.indeks} kurulu (plan kontrolü atlandı: ${k.tablo} tablosunda ${satir} satır)`);
        continue;
      }

      const seciliyor = await planBuIndeksiSeciyorMu(client, k.sorgu, k.indeks);
      const tumTablo = await planTumTabloyuTariyorMu(client, k.sorgu);
      if (seciliyor) {
        log.ok(`${k.ad} → ${k.indeks} kullanılıyor`);
      } else if (!tumTablo) {
        // Başka bir indeks seçilmiş; tablo taranmıyorsa sorun yok.
        log.ok(`${k.ad} → başka bir indeks seçildi (tam tarama yok)`);
      } else {
        log.err(`${k.ad} → TÜM TABLO TARANIYOR, indeks kullanılmıyor`);
        eksik++;
      }
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
