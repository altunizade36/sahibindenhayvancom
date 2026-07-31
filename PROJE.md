# sahibindenhayvan.com — Proje Dokümantasyonu

> Kurulum ve deploy için: **[KURULUM.md](KURULUM.md)**

## Genel Bakış

sahibindenhayvan.com, evcil hayvanlar, çiftlik hayvanları ve kuşlar dahil geniş bir
yelpazede ilan yayınlanabilen **ücretsiz** Türkçe hayvan ilan platformudur. Öncelikli
hedef ücretsiz ilanlarla kullanıcı kazanımıdır; ileride premium özellikler, reklam ve
satış komisyonu ile gelir modeli planlanmaktadır. Doğrulanmış satıcılar için
profesyonel mağaza sistemi ve hukuki bilgi / hayvan bakımı içerikli blog barındırır.

## Mimari

### Altyapı
| Katman | Teknoloji |
|---|---|
| Barındırma | **Vercel** (serverless) |
| Veritabanı | **Supabase PostgreSQL** + Drizzle ORM |
| Dosya depolama | **Supabase Storage** (`uploads` bucket) |
| Kimlik doğrulama | Kendi oturum katmanı (bcrypt + PostgreSQL oturumları) |
| E-posta | **Resend** (üretim), konsol (geliştirme) |
| Önbellek | Bellek içi cache, Redis (Upstash) yedeği |
| Alan adı / DNS | GoDaddy → Vercel |

> Firebase ve SMS sağlayıcısı kullanılmaz. Veri ve dosya katmanı Supabase,
> tüm bildirim/doğrulama e-postaları Resend üzerinden yürür. Telefon numarası
> yalnızca opsiyonel bir iletişim bilgisidir — doğrulanmaz.

### Uygulama
- **Frontend**: React 18 + TypeScript + Vite, Wouter (yönlendirme), TanStack Query (durum), React Hook Form + Zod (formlar)
- **Backend**: Node.js + Express
- **UI**: Shadcn UI + Tailwind CSS
- **Gerçek zamanlı**: WebSocket (yalnızca kalıcı sunucuda — bkz. KURULUM.md "Vercel Serverless Kısıtı")

### Kimlik Doğrulama
İki yöntem, ikisi de tek oturum modelinde birleşir (`session.user.claims.sub` = kullanıcı id):

1. **E-posta + şifre** — bcrypt ile hash'lenir, `server/routes.ts`.
   Kayıt sonrası Resend ile doğrulama bağlantısı gönderilir; şifre sıfırlama da
   e-posta üzerinden yürür. `RESEND_API_KEY` tanımlı değilse (geliştirme)
   hesaplar otomatik doğrulanmış sayılır.
2. **Google / Facebook OAuth** — `server/auth.ts` (ilgili env değişkenleri tanımlıysa aktif).

Oturumlar PostgreSQL'de `sessions` tablosunda, 7 gün TTL ile saklanır.

> Telefon numarası kayıt sırasında istenmez; profilde opsiyonel iletişim
> bilgisi olarak tutulur ve SMS ile doğrulanmaz. Kullanıcı isterse telefonuyla
> da giriş yapabilir (numara + şifre).

## Tasarım

Modern, duyarlı arayüz; Türk pazaryeri estetiği. Birincil renk mavi, ikincil altın/sarı.
Yazı tipleri: Inter, Poppins, Space Grotesk. Duyarlı ızgara, merkezî arama çubuğu,
yapışkan başlık, mobilde hamburger menü.

## Sistem Tasarımı

- **Çok rollü yapı**: Ziyaretçi, Alıcı, Satıcı, Veteriner, Nakliyeci, Yönetici
- **Ücretsiz model**: Tüm ilan özellikleri ücretsiz
- **Güvenlik**: Rol bazlı erişim, Zod doğrulama, manuel ilan moderasyonu, spam filtresi, reCAPTCHA v3, IP takibi, hız sınırlama
- **Profesyonel mağazalar**: Doğrulanmış satıcılar için markalı vitrin + değerlendirme sistemi (yönetici onaylı)
- **Blog**: 32 profesyonel yazı (hayvan bakımı ve hukuk), yönetici tarafından yönetilir

### Türk Mevzuatına Uyum (KVKK 2024)
Hayvan koruma, veterinerlik hizmetleri, koruma altındaki türler (CITES) ve avcılık
düzenlemelerine uyumludur. Kedi/köpeğin pet shop üzerinden satışı yasaktır; mikroçip
ve pasaport zorunludur, büyükbaş/küçükbaş için TÜRKVET kaydı, koruma altındaki türler
için izin belgesi aranır. Hassas kayıt verileri herkese açık şekilde saklanmaz.

## Temel Özellikler

- **İlanlar**: Çok filtreli gelişmiş arama, görsel galerileri, belge yükleme, moderasyon, Türkçe fiyat biçimlendirme
- **Gezinme**: Ana sayfada sonsuz kaydırma + ilan sayfalarında filtreli sayfalama
- **Kategoriler**: 17 ana alanda 643 hiyerarşik kategori — Evcil Hayvanlar, Çiftlik Hayvanları, Balıklar ve Su Ürünleri, Atlar ve Binicilik, Arıcılık, Kümes ve Süs Kuşları, Sürüngenler ve Amfibiler, Kemirgenler ve Küçük Hayvanlar, Yem/Mama/Tarım, Ekipmanlar, Veterinerlik, Kayıt/Belgeler, Mağazalar, Tarım & Kırsal Emlak, Araçlar & Nakliye, Üretim & İşleme Tesisleri, İnşaat & Yapı
- **Mesajlaşma**: Metin/görsel/dosya/sistem/teklif mesaj tipleri, okundu bilgisi, yazıyor göstergesi, çevrimiçi durum, mesaj arama, arşivleme/sabitleme/sessize alma
- **Kullanıcı paneli**: İlan, favori ve hesap yönetimi
- **Rekabetçi özellikler**: Son görüntülenenler, ilan karşılaştırma, misafir iletişim formu (reCAPTCHA korumalı), satıcı puanlama, kayıtlı arama e-posta bildirimleri, doğrudan video yükleme, kategori/pazar istatistikleri

## Görsel İşleme

Sharp ile sunucu tarafında: WebP dönüşümü, EXIF döndürme düzeltmesi ve çoklu boyut
varyantları (`thumb` 400px, `medium` 1200px, `large` 2000px). Dosyalar uygulama içinde
`/objects/<anahtar>` yolu ile saklanır; istekler Supabase CDN'ine yönlendirilir.

## Dizin Yapısı

```
client/          React uygulaması (Vite root)
  src/
server/          Express API
  auth.ts        Oturum + OAuth (eski replitAuth.ts yerine)
  db.ts          PostgreSQL havuzu (pg + Drizzle)
  objectStorage.ts  Supabase Storage
  routes.ts      Ana API rotaları
  imageProcessor.ts Sharp görsel işleme
shared/          İstemci+sunucu ortak kod (Drizzle şeması, tipler)
api/handler.ts   Vercel serverless giriş noktası
scripts/         Kurulum otomasyonu (setup, doctor, DNS)
```

## İzleme

`/health` (canlılık), `/readiness` (hazırlık), `/metrics` (Prometheus formatı).
