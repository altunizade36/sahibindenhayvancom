/**
 * Bot koruması — reCAPTCHA olmadan.
 *
 * reCAPTCHA kaldırıldı: Google'a bağımlılık, ek anahtar yönetimi ve kullanıcı
 * tarafında görünür bir engel getiriyordu. Yerine kullanıcının hiç fark
 * etmediği iki yöntem kullanılıyor. İkisi de tek başına kusursuz değildir ama
 * birlikte, sıradan form-doldurucu botların neredeyse tamamını eler; asıl
 * ağır koruma zaten e-posta doğrulaması ve moderasyondadır.
 *
 * 1) Bal küpü (honeypot): forma ekranda görünmeyen bir alan konur. İnsan
 *    göremediği için boş bırakır; formu otomatik dolduran bot "doldurulmamış
 *    alan kalmasın" diye doldurur. Dolu gelirse istek bottur.
 *
 * 2) Süre kontrolü: form açıldığı an istemcide damgalanır. İnsan bir formu
 *    saniyeler içinde dolduramaz; bot anında gönderir. Belirlenen eşikten hızlı
 *    gelen istek bottur.
 *
 * Önemli tasarım kararı: alanlar YOKSA istek reddedilmez, geçirilir. Böylece
 * eski bir sekme, önbellekten gelen eski arayüz veya doğrudan API kullanan
 * meşru bir istemci kilitlenmez. Yalnızca "bal küpü dolu" veya "insan için
 * imkânsız hız" gibi POZİTİF bot kanıtı varsa reddedilir — yanlış pozitif
 * vermemek, birkaç botu kaçırmaktan daha önemlidir.
 */
import type { Request, Response, NextFunction } from "express";

/** Ekranda gizlenen alanın adı. Sıradan bir form alanı gibi görünmeli. */
export const HONEYPOT_FIELD = "website";

/**
 * Formun açılmasıyla gönderilmesi arasında geçen süreyi (ms) taşıyan alan.
 *
 * Bilinçli olarak MUTLAK bir zaman damgası değil, İSTEMCİDE ÖLÇÜLEN SÜRE
 * gönderiliyor. Mutlak damga sunucu saatiyle karşılaştırılmak zorundadır ve
 * iki saat arasındaki fark (kullanıcının saati birkaç saniye ileri olabilir,
 * ki bu çok yaygındır) hesabı negatife düşürüp kontrolü işlevsiz bırakır.
 * Süre farkı aynı saatin iki okumasından çıktığı için saat kaymasından
 * etkilenmez.
 */
export const FORM_ELAPSED_FIELD = "formFillMs";

/** Bir insanın formu doldurabileceği en kısa süre (ms). */
const MIN_FORM_MS = 2000;

export interface BotCheckResult {
  bot: boolean;
  reason?: "honeypot" | "too-fast";
}

export function detectBot(body: unknown): BotCheckResult {
  if (!body || typeof body !== "object") return { bot: false };
  const veri = body as Record<string, unknown>;

  const balKupu = veri[HONEYPOT_FIELD];
  if (typeof balKupu === "string" && balKupu.trim() !== "") {
    return { bot: true, reason: "honeypot" };
  }

  const gecenMs = Number(veri[FORM_ELAPSED_FIELD]);
  if (Number.isFinite(gecenMs) && gecenMs >= 0 && gecenMs < MIN_FORM_MS) {
    return { bot: true, reason: "too-fast" };
  }

  return { bot: false };
}

/**
 * Form uçlarına takılan koruma.
 *
 * Bot yakalandığında bilinçli olarak 400 dönülüyor ve neden açıklanmıyor —
 * "bal küpüne düştün" demek, bot yazana neyi düzeltmesi gerektiğini
 * söylemek olur.
 */
export function botGuard(req: Request, res: Response, next: NextFunction) {
  const sonuc = detectBot(req.body);
  if (sonuc.bot) {
    console.warn(`Bot korumasi engelledi (${sonuc.reason}): ${req.method} ${req.path}`);
    return res.status(400).json({ message: "İstek doğrulanamadı. Lütfen sayfayı yenileyip tekrar deneyin." });
  }
  next();
}

/**
 * Bot alanlarını gövdeden ayıklar.
 *
 * Doğrulama şemaları fazladan alan geldiğinde hata verebilir; ayrıca bu
 * alanların veritabanına yazılmasının bir anlamı yok.
 */
export function stripBotFields<T extends Record<string, any>>(body: T): T {
  const { [HONEYPOT_FIELD]: _h, [FORM_ELAPSED_FIELD]: _t, ...kalan } = body || ({} as T);
  return kalan as T;
}
