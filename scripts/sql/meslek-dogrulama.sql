-- Meslek doğrulama tablosu.
--
-- Bu tablo koda yazılmış ama veritabanında hiç oluşturulmamıştı:
-- server/advancedFeatureRoutes.ts ham SQL ile professional_verifications'a
-- yazıp okuyordu, tablo yoktu. Sonuç: /panel/dogrulama ve /admin/dogrulamalar
-- sayfalarının tamamı 500 dönüyordu ve sitede kimse veteriner/nakliyeci
-- olamıyordu — hizmetler bölümünün boş kalmasının sebebi buydu.
--
-- shared/schema.ts içindeki `professionalVerifications` tanımıyla birebir
-- aynı olmalı; ayrıştıkları anda `drizzle-kit push` tabloyu değiştirmeye
-- kalkar.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'professional_verification_status') THEN
    CREATE TYPE public.professional_verification_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.professional_verifications (
  id                 varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            varchar NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  professional_type  varchar NOT NULL,
  document_type      varchar NOT NULL,
  document_number    text,
  issuing_authority  text,
  document_url       text,
  document_key       text,
  notes              text,
  status             public.professional_verification_status NOT NULL DEFAULT 'pending',
  admin_notes        text,
  reviewed_by        varchar REFERENCES public.users(id),
  reviewed_at        timestamp,
  created_at         timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prof_verif_user_idx   ON public.professional_verifications (user_id);
CREATE INDEX IF NOT EXISTS prof_verif_status_idx ON public.professional_verifications (status);
CREATE INDEX IF NOT EXISTS prof_verif_type_idx   ON public.professional_verifications (professional_type);

-- Aynı meslek türü için birden fazla bekleyen başvuru olmamalı. Uygulama da
-- kontrol ediyor ama iki isteğin aynı anda gelmesi hâlinde tek koruma budur.
CREATE UNIQUE INDEX IF NOT EXISTS prof_verif_bekleyen_tek_idx
  ON public.professional_verifications (user_id, professional_type)
  WHERE status = 'pending';

-- Sunucu tablo sahibi rolüyle bağlanır; anon/authenticated erişimi kapalı
-- kalmalı (scripts/sql/harden-rls.sql aynı deseni tüm tablolara uygular).
ALTER TABLE public.professional_verifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.professional_verifications FROM anon, authenticated;
