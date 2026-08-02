/**
 * Zamanlanmış görevler (Vercel Cron).
 *
 * SORUN
 * -----
 * Kayıtlı arama bildirimleri `setInterval` ile kuruluyordu ve yalnızca
 * `server/index.ts` (uzun ömürlü sunucu) içinde başlatılıyordu. Üretim ise
 * Vercel'de SUNUCUSUZ çalışıyor: `server/vercel-entry.ts` her istek için
 * çağrılan bir fonksiyondur, istek bitince donar. Orada `setInterval` yaşamaz.
 * Sonuç: kullanıcı "yeni ilan çıkınca haber ver" diyordu ama bildirim
 * ÜRETİMDE HİÇ GÖNDERİLMİYORDU.
 *
 * ÇÖZÜM
 * -----
 * Sunucusuz ortamda zamanlama, dışarıdan tetiklenen bir uçla yapılır.
 * `vercel.json` içindeki `crons` tanımı bu ucu belirlenen saatte çağırır.
 * Uzun ömürlü sunucuda (geliştirme / kendi sunucusuna kurulum) eski
 * `setInterval` yolu çalışmaya devam eder — iki ortam da desteklenir.
 *
 * GÜVENLİK
 * --------
 * Uç herkese açık bir adreste duruyor, dolayısıyla korumasız bırakılamaz:
 * aksi hâlde biri arka arkaya çağırıp e-posta kotasını tüketebilir veya
 * kullanıcılara tekrar tekrar posta gönderilmesine yol açabilir.
 * Vercel, `CRON_SECRET` ortam değişkeni tanımlıysa isteğe
 * `Authorization: Bearer <secret>` başlığını ekler; burada o doğrulanıyor.
 * Sır tanımlı değilse uç ÜRETİMDE tamamen kapalıdır (fail-closed).
 */
import type { Express, Request, Response } from "express";
import { savedSearchNotifier } from "./saved-search-notifier";

function yetkiliMi(req: Request): boolean {
  const sir = process.env.CRON_SECRET;

  // Geliştirmede sır aranmaz; elle tetikleyip deneyebilmek gerekir.
  if (process.env.NODE_ENV !== "production") return true;

  if (!sir) {
    console.error("CRON_SECRET tanımlı değil — zamanlanmış görev ucu kapalı.");
    return false;
  }

  const baslik = req.headers.authorization || "";
  return baslik === `Bearer ${sir}`;
}

export function registerCronRoutes(app: Express) {
  /**
   * Kayıtlı aramalar için yeni ilan kontrolü.
   *
   * Yanıt her zaman hızlı dönmeli: Vercel cron isteklerinin süre sınırı var
   * ve iş uzarsa istek koparılır. Bu yüzden sonuç beklenmeden 202 dönülüyor,
   * iş arka planda tamamlanıyor.
   */
  app.get("/api/cron/saved-searches", async (req: Request, res: Response) => {
    if (!yetkiliMi(req)) {
      return res.status(401).json({ message: "Yetkisiz" });
    }

    console.log("⏰ Zamanlanmış görev: kayıtlı arama bildirimleri başlıyor");

    savedSearchNotifier
      .checkAndNotify()
      .then(() => console.log("⏰ Kayıtlı arama bildirimleri tamamlandı"))
      .catch((err) => console.error("⏰ Kayıtlı arama bildirimleri hata verdi:", err));

    res.status(202).json({ started: true, at: new Date().toISOString() });
  });

  /** Zamanlanmış görevlerin ayakta olup olmadığını görmek için. */
  app.get("/api/cron/health", (req: Request, res: Response) => {
    if (!yetkiliMi(req)) return res.status(401).json({ message: "Yetkisiz" });
    res.json({
      ok: true,
      cronSecretTanimli: !!process.env.CRON_SECRET,
      resendTanimli: !!process.env.RESEND_API_KEY,
    });
  });
}
