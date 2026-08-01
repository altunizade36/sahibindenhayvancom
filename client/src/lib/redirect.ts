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
