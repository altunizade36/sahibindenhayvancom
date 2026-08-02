/**
 * Yüklenmiş bir görselin farklı boyutları arasında geçiş.
 *
 * NEDEN
 * -----
 * Görseller yüklenirken üç boyutta üretiliyor (server/imageProcessor.ts):
 *   _thumb.webp   400x400
 *   _medium.webp  1200x1200
 *   _large.webp   2000x2000
 *
 * Ancak `listings.images` alanına yalnızca KÜÇÜK boyutun adresi yazılıyor.
 * Bu ilan kartları için doğru — kart 400px, gereksiz veri inmiyor. Sorun,
 * aynı dizinin ilan DETAY sayfasında da kullanılmasıydı: hayvanın büyük
 * fotoğrafı 400px'lik bir görselden büyütülerek gösteriliyor ve bulanık
 * çıkıyordu. Fotoğrafın satışı belirlediği bir sitede bu ciddi bir kayıp.
 * Aynı sorun paylaşım önizlemelerinde de vardı: WhatsApp/Facebook'a 400x400
 * bir görsel gidiyordu.
 *
 * Dosya adları kendi kodumuzun ürettiği belirli bir kalıba uyduğu için boyut
 * adresten türetilebiliyor; ek istek veya veritabanı değişikliği gerekmiyor.
 *
 * Kalıba uymayan bir adres (dışarıdan gelen görsel, eski kayıt, yer tutucu)
 * OLDUĞU GİBİ döner — dönüştürülemeyen adres bozulmaz.
 */

export type GorselBoyutu = "thumb" | "medium" | "large" | "original";

const BOYUTLAR: GorselBoyutu[] = ["thumb", "medium", "large", "original"];

/** Adresin sonundaki `_<boyut>.webp` ekini hedef boyutla değiştirir. */
export function imageVariant(url: string | null | undefined, boyut: GorselBoyutu): string {
  if (!url || typeof url !== "string") return url ?? "";

  for (const mevcut of BOYUTLAR) {
    const ek = `_${mevcut}.webp`;
    if (url.endsWith(ek)) {
      return url.slice(0, -ek.length) + `_${boyut}.webp`;
    }
  }

  // Bilinen kalıba uymuyor — dokunma.
  return url;
}

/** Bir adres dizisinin tamamını istenen boyuta çevirir. */
export function imageVariants(
  urls: readonly (string | null | undefined)[] | null | undefined,
  boyut: GorselBoyutu
): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.filter(Boolean).map((u) => imageVariant(u as string, boyut));
}
