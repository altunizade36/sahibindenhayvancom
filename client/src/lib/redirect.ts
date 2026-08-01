/**
 * Giriş/kayıt akışında "nereden gelindiyse oraya dön" mantığı.
 *
 * Kullanıcı üye olmadan "Ücretsiz İlan Ver"e bastığında /ilan-ver sayfası
 * `?redirect=/ilan-ver` ile giriş ekranına yönlendiriyor. Bu parametrenin
 * giriş ⇄ kayıt geçişlerinde de KORUNMASI gerekir; aksi hâlde kullanıcı üye
 * olduktan sonra ana sayfaya düşer ve ilan verme akışına elle geri dönmek
 * zorunda kalır.
 */

/**
 * Dönülecek adresi `?redirect=` parametresinden okur.
 *
 * Güvenlik: yalnızca site içi, tek eğik çizgiyle başlayan yollar kabul edilir.
 * "//baska-site.com" veya "https://..." gibi değerler açık yönlendirme
 * (open redirect) saldırısına yol açar; bunlar yok sayılıp ana sayfaya dönülür.
 */
export function safeRedirectTarget(): string {
  const raw = new URLSearchParams(window.location.search).get("redirect");
  if (!raw) return "/";
  let value: string;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return "/";
  }
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  // Giriş/kayıt sayfalarına geri dönüp döngü oluşturma
  if (/^\/(giris|login|kayit|register)(\/|$|\?)/.test(value)) return "/";
  return value;
}

/**
 * Mevcut `redirect` parametresini başka bir sayfaya taşımak için sorgu dizesi
 * üretir. Dönülecek bir adres yoksa boş dize döner.
 */
export function redirectQuery(): string {
  const hedef = safeRedirectTarget();
  return hedef === "/" ? "" : `?redirect=${encodeURIComponent(hedef)}`;
}

/**
 * Kullanıcı giriş/kayıt ekranına bir işlemin ortasında düştüyse, NEDEN burada
 * olduğunu açıklayan kısa metin.
 *
 * Hiçbir açıklama olmadan giriş ekranıyla karşılaşmak, özellikle "Ücretsiz
 * İlan Ver"e basıp gelen kullanıcıda "yanlış yere mi geldim" hissi yaratıyor
 * ve akışın terk edilmesine yol açıyor.
 */
export function redirectReason(): string | null {
  const hedef = safeRedirectTarget();
  if (hedef === "/") return null;
  if (hedef.startsWith("/ilan-ver")) return "Ücretsiz ilan verebilmek için önce hesabınıza giriş yapın.";
  if (hedef.startsWith("/mesajlar")) return "Mesajlarınızı görmek için giriş yapın.";
  if (hedef.startsWith("/favoriler")) return "Favorilerinizi görmek için giriş yapın.";
  if (hedef.startsWith("/panel")) return "Panelinize erişmek için giriş yapın.";
  return "Devam etmek için giriş yapın.";
}
