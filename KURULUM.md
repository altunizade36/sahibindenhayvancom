# 🚀 Kurulum Rehberi — Vercel + Supabase + GoDaddy

Bu proje **Replit'ten tamamen kurtarılmıştır**. Artık Replit'e hiçbir bağımlılığı yoktur.

---

## ⚡ Hızlı Kurulum (tek komut)

```bash
npm install
npm run setup
```

Sihirbaz sırasıyla şunları sorar ve otomatik yapar:

1. **Supabase** bilgilerini alır → şemayı kurar, `sessions` tablosunu ve storage bucket'ını oluşturur
2. **Vercel**'e bağlanır → tüm ortam değişkenlerini yükler, alan adını ekler, deploy eder
3. **GoDaddy** DNS kayıtlarını Vercel'e yönlendirir

Her adımı ayrı ayrı da çalıştırabilirsiniz:

```bash
npm run setup:supabase   # veritabanı + storage
npm run setup:vercel     # ortam değişkenleri + deploy
npm run setup:dns        # GoDaddy DNS → Vercel
npm run doctor           # her şey doğru mu? kontrol et
```

---

## 1️⃣ Supabase

### Proje oluştur
1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project**
2. Bölge: **Frankfurt (eu-central-1)** — Türkiye'ye en yakın
3. Veritabanı şifresini bir yere kaydedin

### Bilgileri al
**Settings → API** ekranından:

| Değer | .env karşılığı |
|---|---|
| Project URL | `SUPABASE_URL` |
| `service_role` key (gizli) | `SUPABASE_SERVICE_ROLE_KEY` |
| `anon` / public key | `SUPABASE_ANON_KEY` |

**Connect** ekranından bağlantı dizeleri:

| Mod | Port | .env karşılığı | Neden |
|---|---|---|---|
| Transaction pooler | 6543 | `DATABASE_URL` | Vercel serverless için **zorunlu** |
| Session pooler | 5432 | `DIRECT_URL` | Migration (`db:push`) için |

> ⚠️ Bağlantı dizesindeki `[YOUR-PASSWORD]` kısmını gerçek şifrenizle değiştirin.
> Şifrede `@ : / ?` gibi karakter varsa **URL-encode** edin (`@` → `%40`).

### Kur
```bash
npm run setup:supabase
```
Bu komut şunları yapar:
- Bağlantıyı test eder
- Drizzle şemasını uygular (`drizzle-kit push`)
- `sessions` tablosunu oluşturur (oturumlar için **şart**)
- `uploads` bucket'ını public + 50MB limitle oluşturur
- **Güvenlik sertleştirmesi**: tüm tablolarda RLS'i açar, Supabase Data API
  erişimini kapatır

> ⚠️ **Data API mutlaka kapatılmalı.** Supabase projeleri varsayılan olarak
> `public` şemasındaki her tabloyu `anon` anahtarına açar. `anon` anahtarı
> herkese açıktır; RLS de kapalıysa tüm veritabanı (şifre hash'leri dahil)
> dışarıdan okunup yazılabilir. Kurulum bunu otomatik kapatır, ayrıca
> `npm run harden` ile istediğiniz zaman uygulayıp doğrulayabilirsiniz.

---

## 2️⃣ Vercel

```bash
npm run setup:vercel
```

Otomatik olarak:
- Vercel CLI ile giriş yaptırır
- Projeyi bağlar (`vercel link`)
- `.env` içindeki tüm değişkenleri **production + preview** ortamlarına yükler
- Alan adını (`sahibindenhayvan.com` + `www`) projeye ekler
- İsterseniz `vercel --prod` ile yayına alır

### Elle yapmak isterseniz
Vercel Dashboard → **New Project** → GitHub reposunu import edin:

| Ayar | Değer |
|---|---|
| Framework | Other |
| Build Command | `npm run build:vercel` |
| Output Directory | `dist/public` |
| Install Command | `npm install` |
| Node.js Version | 20.x veya üzeri |

Sonra **Settings → Environment Variables**'a `.env` içindekileri ekleyin
(`GODADDY_*` ve `DIRECT_URL` hariç — onlar sadece yerelde kullanılır).

---

## 3️⃣ GoDaddy (Alan Adı)

```bash
npm run setup:dns
```

API anahtarı: [developer.godaddy.com/keys](https://developer.godaddy.com/keys) → **Production** anahtarı üretin
(`GODADDY_API_KEY` + `GODADDY_API_SECRET` → `.env`).

Script şu kayıtları yazar:

| Tür | Ad | Değer | TTL |
|---|---|---|---|
| A | `@` | `76.76.21.21` | 600 |
| CNAME | `www` | `cname.vercel-dns.com` | 600 |

> GoDaddy production API anahtarı alamıyorsanız script size kayıtları
> **elle girmeniz için** tablo halinde gösterir — sonuç aynıdır.

Kontrol:
```bash
nslookup sahibindenhayvan.com
```
Yayılma 10 dk – 1 saat sürer. Vercel SSL sertifikasını otomatik üretir.

---

## 4️⃣ Yerel Geliştirme

```bash
npm install
cp .env.example .env    # değerleri doldurun
npm run dev             # http://localhost:5000
```

Faydalı komutlar:

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu (hot reload) |
| `npm run build` | Üretim derlemesi (istemci + sunucu) |
| `npm run check` | TypeScript tip kontrolü |
| `npm run db:push` | Şema değişikliklerini veritabanına uygula |
| `npm run db:studio` | Drizzle Studio (görsel veritabanı editörü) |
| `npm run doctor` | Yapılandırma tanılaması |

---

## 🔑 Ortam Değişkenleri

### Zorunlu
| Değişken | Ne işe yarar |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL (transaction pooler) |
| `SUPABASE_URL` | Supabase proje adresi |
| `SUPABASE_SERVICE_ROLE_KEY` | Dosya yükleme (sunucu tarafı, **gizli**) |
| `SESSION_SECRET` | Oturum çerezi imzalama |

### Opsiyonel (yoksa ilgili özellik kapanır, uygulama çalışır)
| Değişken | Kapanan özellik |
|---|---|
| `RESEND_API_KEY` | E-posta gönderimi |
| `UPSTASH_REDIS_REST_URL/TOKEN` | Redis önbellek (bellek içi cache'e düşer) |
| `RECAPTCHA_SECRET_KEY` | Spam koruması |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google ile giriş |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Facebook ile giriş |

`VITE_` ile başlayanlar tarayıcıya gönderilir — **gizli anahtar koymayın**.

---

## ⚠️ Vercel Serverless Kısıtı: WebSocket

Vercel serverless fonksiyonları kalıcı WebSocket bağlantısı **tutamaz**. Bu yüzden
şu özellikler Vercel'de çalışmaz:

- Anlık mesajlaşma (canlı bildirim — mesajlar yine gönderilir/alınır, sadece anlık push olmaz)
- Canlı müzayede teklif akışı
- Çevrimiçi kullanıcı göstergesi
- Çiftlik TV canlı yayın (Agora)

**Çözüm seçenekleri:**

**A) Supabase Realtime kullan** (önerilen — Vercel'de kalırsınız)
Supabase Realtime, PostgreSQL değişikliklerini dinleyip istemciye iletir; WebSocket
sunucusu gerektirmez.

**B) Sunucuyu Railway'e taşı** (WebSocket tam destekli)
```bash
npm install -g @railway/cli
railway login
railway up
```
Aynı ortam değişkenlerini Railway'e ekleyin. `npm run build` + `npm start` kullanır.

---

## 🩺 Sorun Giderme

| Belirti | Sebep / Çözüm |
|---|---|
| `DATABASE_URL tanımlı değil` | `.env` yok veya boş → `npm run setup` |
| Giriş yapılıyor ama oturum düşüyor | `sessions` tablosu yok → `npm run setup:supabase` |
| Görseller görünmüyor | Bucket public değil → `npm run setup:supabase` |
| `password authentication failed` | Şifrede özel karakter → URL-encode edin (`@` → `%40`) |
| `too many connections` | `DATABASE_URL` doğrudan bağlantı → **transaction pooler** (6543) kullanın |
| Deploy sonrası 404 | `outputDirectory` yanlış → `dist/public` olmalı |
| `npm install` ağ hatası | Lockfile'da Replit URL'i → `package-lock.json`'ı silip yeniden kurun |

Her şeyi tek seferde kontrol et:
```bash
npm run doctor
```

---

## 📦 Replit'ten Neler Değişti?

| Eskiden (Replit) | Şimdi |
|---|---|
| Replit Object Storage (GCS sidecar) | Supabase Storage |
| Replit Auth (OIDC) | Kendi oturum sistemi + Google/Facebook OAuth |
| Neon serverless sürücüsü | Standart `pg` sürücüsü (Supabase uyumlu) |
| `.replit` içinde secret'lar | `.env` (git'e girmez) |
| Replit paket sunucusu | registry.npmjs.org |
| `@replit/vite-plugin-*` | kaldırıldı |
| Replit Autoscale | Vercel serverless |
