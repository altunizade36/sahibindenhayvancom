# Güvenlik Politikası

## Açık Bildirimi

Bir güvenlik açığı bulduysanız **herkese açık issue açmayın**.
Bunun yerine GitHub → **Security** → *Report a vulnerability* üzerinden özel bildirim
gönderin. 72 saat içinde dönüş yapılır.

---

## Gizli Bilgi Yönetimi

**Hiçbir anahtar depoya girmez.** Tüm sırlar ortam değişkenlerinde tutulur:

| Ortam | Nerede tutulur |
|---|---|
| Yerel | `.env` (`.gitignore`'da) |
| Üretim | Vercel → Settings → Environment Variables |

- `.env.example` sadece **anahtar adlarını** içerir, değerlerini değil.
- Her push ve PR'da `gitleaks` ile geçmiş dahil tarama yapılır (`.github/workflows/secret-scan.yml`).
- `.env`, `*.pem`, `serviceAccount*.json` gibi dosyalar depoya eklenirse CI **başarısız olur**.

### Bir anahtar sızdıysa
1. **Önce iptal edin** — geçmişi temizlemek yetmez, anahtar zaten okunmuş olabilir.
   - Supabase: Settings → API → service_role anahtarını yeniden üret
   - Resend / Upstash / Twilio: ilgili panelden anahtarı sil ve yenisini oluştur
2. Yeni anahtarı `.env` ve Vercel'e ekleyin.
3. Gerekiyorsa geçmişi temizleyin (`git filter-repo`), ardından zorla push edin.

---

## Uygulanan Güvenlik Önlemleri

### Kimlik Doğrulama & Oturum
- Şifreler `bcrypt` ile hash'lenir (asla düz metin saklanmaz)
- Oturumlar PostgreSQL'de, 7 gün TTL ile
- Çerezler: `httpOnly`, üretimde `secure`, `sameSite=lax`
- `SESSION_SECRET` üretimde **zorunlu** — tanımlı değilse uygulama başlamaz
- Admin paneli ayrı bir PIN ile korunur; PIN **sabit süreli** (`timingSafeEqual`)
  karşılaştırılır ve hız sınırlamasına tabidir
- `ADMIN_PANEL_PIN` tanımlı değilse admin paneli **tamamen kapalıdır** (fail closed)

### Girdi & Kötüye Kullanım
- Tüm API girdileri `zod` ile doğrulanır
- Hız sınırlama: genel API + hassas uçlarda (giriş, kayıt, PIN) sıkı limit
- reCAPTCHA v3 — **üretimde yapılandırılmamışsa istek reddedilir** (fail closed)
- İlanlar yayına girmeden önce manuel moderasyondan geçer

### Aktarım & Başlıklar
- HSTS (`max-age=63072000; includeSubDomains; preload`)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN` (clickjacking)
- `Referrer-Policy: strict-origin-when-cross-origin`
- API yanıtlarında `Cache-Control: no-store`
- Joker CORS (`Access-Control-Allow-Origin: *`) **kullanılmaz** — istemci ve API
  aynı alan adından servis edilir

### Veri
- Veritabanı bağlantıları TLS üzerinden
- Drizzle ORM parametreli sorgular kullanır (SQL enjeksiyonu koruması)
- Supabase Storage bucket'ında RLS politikaları tanımlı
- Hassas kayıt belgeleri (mikroçip, TÜRKVET vb.) herkese açık gösterilmez

### Tedarik Zinciri
- Dependabot ile haftalık bağımlılık ve GitHub Actions güncellemesi
- CI'da `npm audit --audit-level=high`
- GitHub Actions izinleri `contents: read` ile sınırlı

---

## Bilinen Sınırlamalar

Aşağıdakiler bilinçli kabul edilmiş risklerdir, gizli değildir:

- **reCAPTCHA site key** tarayıcıya gider ve herkese açıktır — bu tasarım
  gereğidir. Güvenlik, Google reCAPTCHA yönetim panelinde tanımlı alan adı
  kısıtıyla sağlanır; yalnızca kendi alan adınızın kayıtlı olduğundan emin olun.
- **E-posta doğrulama akışında `localStorage`'da token tutuluyor.** XSS durumunda
  okunabilir. Ana oturum akışı httpOnly çerez kullandığı için etki sınırlıdır;
  bu akışın da çereze taşınması planlanmaktadır.
- **WebSocket kimlik doğrulaması** oturum çerezine dayanır; Vercel serverless'ta
  WebSocket zaten devre dışıdır (bkz. KURULUM.md).

---

## Yayına Almadan Önce Kontrol Listesi

- [ ] `SESSION_SECRET` rastgele ve en az 32 karakter
- [ ] `ADMIN_PANEL_PIN` tahmin edilemez (doğum tarihi / 123456 / 252525 değil)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` yalnızca sunucu ortamında (asla `VITE_` önekiyle değil)
- [ ] `RECAPTCHA_SECRET_KEY` üretimde tanımlı
- [ ] reCAPTCHA yönetim panelinde alan adı kısıtı yalnızca kendi alan adınız
- [ ] Resend → gönderim alan adı (SPF/DKIM) doğrulanmış
- [ ] Supabase → Storage bucket politikaları gözden geçirildi
- [ ] GitHub → Settings → Branch protection: `main` dalına doğrudan push kapalı
- [ ] GitHub → Settings → Code security: Secret scanning + Push protection açık
- [ ] `npm run doctor` temiz
