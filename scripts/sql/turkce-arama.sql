-- ============================================================================
-- Türkçe arama altyapısı
-- ============================================================================
--
-- SORUN
-- -----
-- Arama `title ILIKE '%terim%'` ile yapılıyordu. Türkçe'de bu iki nedenle
-- yetersiz:
--
--   1. Aksan/özel harf eşleşmiyor. Telefon klavyesinde Türkçe karakter
--      kullanmamak çok yaygın; "kopek" yazan kullanıcı "Köpek yavrusu"
--      ilanını BULAMIYORDU. Ölçüldü: 7 gerçekçi aramadan 6'sı sonuçsuzdu
--      (kopek, sirin, sigir, guvercin, inek, coban).
--   2. Baştaki `%` yüzünden hiçbir indeks kullanılamıyor; her arama tüm
--      tabloyu tarıyor. İlan sayısı arttıkça arama giderek yavaşlar.
--
-- ÇÖZÜM
-- -----
-- `unaccent` ile her iki taraf da sadeleştirilip karşılaştırılıyor, `pg_trgm`
-- ile de üçlü-harf (trigram) indeksi kuruluyor. Trigram indeksi baştaki `%`
-- olan aramalarda da kullanılabilir — B-tree'nin yapamadığı şey budur.
--
-- Bu dosya `npm run db:push` sonrasında otomatik çalıştırılır (bkz.
-- package.json), çünkü `drizzle-kit push` şema dışındaki nesneleri bilmez ve
-- burada tanımlananları silebilir.

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ----------------------------------------------------------------------------
-- Metin sadeleştirme
-- ----------------------------------------------------------------------------
-- `unaccent()` varsayılan olarak STABLE'dır ve doğrudan indeks ifadesinde
-- kullanılamaz. IMMUTABLE bir sarmalayıcı gerekiyor. Sözlük adı açıkça
-- veriliyor ki fonksiyonun davranışı `search_path`e bağlı kalmasın —
-- indekslenen değerle sorgudaki değer birebir aynı kuralla üretilmeli.
CREATE OR REPLACE FUNCTION public.tr_normalize(metin text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
AS $$
  SELECT lower(public.unaccent('public.unaccent', metin))
$$;

COMMENT ON FUNCTION public.tr_normalize(text) IS
  'Türkçe arama için metni sadeleştirir: küçük harfe çevirir ve aksanları kaldırır (ö->o, ı->i, ş->s, ğ->g, ç->c, ü->u). Aramada ve arama indekslerinde AYNI fonksiyon kullanılmalıdır.';

-- ----------------------------------------------------------------------------
-- Trigram indeksleri
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS listings_title_tr_trgm_idx
  ON public.listings USING gin (public.tr_normalize(title) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS listings_description_tr_trgm_idx
  ON public.listings USING gin (public.tr_normalize(description) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS listings_breed_tr_trgm_idx
  ON public.listings USING gin (public.tr_normalize(coalesce(breed, '')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS categories_name_tr_trgm_idx
  ON public.categories USING gin (public.tr_normalize(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS stores_name_tr_trgm_idx
  ON public.stores USING gin (public.tr_normalize(display_name) gin_trgm_ops);
