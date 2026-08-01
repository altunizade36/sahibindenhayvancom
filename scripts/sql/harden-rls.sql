-- ============================================================================
--  Supabase Güvenlik Sertleştirmesi — Data API'yi kapat, RLS'i zorunlu kıl
-- ============================================================================
--
--  NEDEN GEREKLİ
--  -------------
--  Supabase projesi "Enable Data API" + "Automatically expose new tables"
--  seçenekleriyle oluşturulduğunda, public şemasındaki HER tablo PostgREST
--  üzerinden `anon` ve `authenticated` rollerine açılır. `anon` anahtarı
--  tasarımı gereği herkese açıktır (istemci paketine girer). RLS de kapalıysa
--  bu anahtarı bilen herkes tüm tabloları okuyup yazabilir — `users` tablosu
--  ve içindeki bcrypt şifre hash'leri dahil.
--
--  BU UYGULAMA DATA API'Yİ HİÇ KULLANMIYOR
--  ---------------------------------------
--  Sunucu, veritabanına doğrudan `postgres` rolüyle (pg + Drizzle) bağlanır;
--  dosya işlemleri için service_role anahtarını kullanır. İkisi de PostgREST
--  üzerinden geçmez. Dolayısıyla Data API erişimini tamamen kapatmak
--  uygulamanın hiçbir özelliğini bozmaz.
--
--  NEDEN UYGULAMA BOZULMAZ
--  -----------------------
--  RLS, tabloyu oluşturan/sahip olan rol için (burada `postgres`) varsayılan
--  olarak uygulanmaz. Sunucu `postgres` ile bağlandığı için tüm sorguları
--  eskisi gibi çalışır. Kısıtlama yalnızca `anon`/`authenticated` rollerini
--  yani dışarıdan gelen Data API isteklerini etkiler.
--
--  İLERİDE SUPABASE REALTIME KULLANILIRSA
--  --------------------------------------
--  Realtime abonelikleri istemci rolleriyle çalışır. O gün gelirse yalnızca
--  ihtiyaç duyulan tablolar için USAGE + SELECT yetkisi geri verilip uygun
--  RLS politikaları yazılmalıdır. Toptan geri açmayın.
--
--  ⚠️  ŞEMA DEĞİŞİKLİĞİNDEN SONRA MUTLAKA TEKRAR ÇALIŞTIRIN
--  ------------------------------------------------------
--  `drizzle-kit push` RLS durumunu Drizzle şemasına göre yeniden yazar.
--  Şemada RLS tanımlı olmadığı için push işlemi RLS'i SESSİZCE KAPATIR ve
--  bu dosyadaki koruma kaybolur. Bu yüzden `npm run db:push` komutu
--  sertleştirmeyi otomatik olarak tekrar uygular. `drizzle-kit push`'u
--  doğrudan çalıştırdıysanız ardından `npm run harden` demeyi unutmayın.
--  `npm run doctor` durumu her zaman raporlar.
--
--  Çalıştırma:  npm run harden
-- ============================================================================

-- ── 1. public şemasındaki tüm tablolarda RLS'i aç ───────────────────────────
-- Politika yazılmadığı için anon/authenticated hiçbir satıra erişemez.
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

-- ── 2. Data API yetkilerini geri al (savunma derinliği) ─────────────────────
-- RLS tek başına yeterli olurdu; yetkileri de almak "yanlışlıkla politika
-- eklendi" senaryosunda ikinci bir bariyer sağlar.
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL ROUTINES  IN SCHEMA public FROM anon, authenticated;
REVOKE USAGE ON SCHEMA public FROM anon, authenticated;

-- ── 3. Bundan sonra oluşturulacak tablolar da otomatik açılmasın ────────────
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON ROUTINES FROM anon, authenticated;

-- ── 4. Storage: dosya listelemeyi kapat ─────────────────────────────────────
-- Bucket public olduğu için görseller doğrudan CDN adresinden servis edilir;
-- bunun için storage.objects üzerinde SELECT politikası GEREKMEZ. Politika
-- bırakılırsa API üzerinden tüm yüklenen dosyalar listelenebilir hale gelir
-- (Supabase Advisor: "Public Bucket Allows Listing").
-- Sunucu service_role ile çalıştığı ve RLS'i atladığı için yükleme/silme
-- işlemleri etkilenmez.
DROP POLICY IF EXISTS shv_public_read  ON storage.objects;
DROP POLICY IF EXISTS shv_auth_insert  ON storage.objects;
