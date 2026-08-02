-- ============================================================================
-- Performans indeksleri
-- ============================================================================
--
-- Şemadaki (shared/schema.ts) indeksler kategori, satıcı ve konum bazlı
-- sorguları karşılıyor ama sitenin EN SIK çalışan sorgusu açıkta kalmıştı:
--
--   SELECT ... FROM listings WHERE status = 'active' ORDER BY created_at DESC
--
-- Bu sorgu ana sayfada, ilan listesinde ve aramada her seferinde çalışıyor.
-- Mevcut `listings_category_status_created_idx` yalnızca kategori de
-- verildiğinde işe yarıyor; `listings_status_premium_idx` ise created_at
-- içermediği için sıralamayı karşılamıyor. Sonuç: ilan sayısı arttıkça
-- PostgreSQL tüm tabloyu tarayıp belleğe alıp sıralamak zorunda kalır.
--
-- Bu dosya `npm run db:push` sonrasında otomatik çalıştırılır; drizzle-kit
-- şema dışında tanımlanan indeksleri bilmez ve silebilir.

-- ── Ana akış: en yeni yayındaki ilanlar ─────────────────────────────────────
-- DESC yazılması önemli: sorgu created_at DESC sıralıyor, indeks aynı yönde
-- olursa PostgreSQL ek bir sıralama adımı yapmadan doğrudan okuyabilir.
CREATE INDEX IF NOT EXISTS listings_status_created_idx
  ON public.listings (status, created_at DESC);

-- ── Şehir filtresi ──────────────────────────────────────────────────────────
-- Türkiye'de ilan aramasının neredeyse tamamı şehirle daraltılıyor.
CREATE INDEX IF NOT EXISTS listings_status_city_created_idx
  ON public.listings (status, city, created_at DESC);

-- ── Fiyat sıralaması ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS listings_status_price_idx
  ON public.listings (status, price);

-- ── Kullanıcının okunmamış mesajları ────────────────────────────────────────
-- Okunmamış sayacı her sayfa yüklemesinde çalışıyor.
CREATE INDEX IF NOT EXISTS messages_receiver_unread_idx
  ON public.messages (receiver_id, read_at)
  WHERE read_at IS NULL;

-- ── Bildirim listesi ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

-- ── Oturum temizliği ────────────────────────────────────────────────────────
-- Süresi dolmuş oturumları silen sorgu `expire` üzerinden çalışıyor.
CREATE INDEX IF NOT EXISTS sessions_expire_idx
  ON public.sessions (expire);
