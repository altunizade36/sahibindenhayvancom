# 🚀 Vercel + Supabase Deployment Rehberi

Bu kılavuz uygulamayı **tamamen Replit'ten bağımsız** olarak Vercel + Supabase üzerinde çalıştırmanız için gereken tüm adımları içerir.

---

## 1. Supabase Kurulumu

### 1.1 Proje Oluştur
1. [supabase.com](https://supabase.com) → "New Project"
2. Bir şifre belirleyin (veritabanı şifresi olarak kullanılacak)
3. Bölge seçin: **Frankfurt (EU)** (Türkiye'ye en yakın)

### 1.2 Veritabanı Şemasını Aktar
Proje oluşturulduktan sonra şemayı içe aktarın:

```bash
# .env dosyanızı doldurun (bkz. .env.example)
cp .env.example .env

# Şemayı Supabase'e push edin
npm run db:push
```

Alternatif olarak Supabase Dashboard → SQL Editor'dan `schema.sql` dosyasını çalıştırabilirsiniz.

### 1.3 Storage Bucket Oluştur
1. Supabase Dashboard → **Storage** → New Bucket
2. Bucket adı: `uploads`
3. **Public bucket** olarak işaretleyin (ilan görselleri herkese açık olmalı)
4. İzin politikası: Okuma herkese açık, yazma sadece authenticated

### 1.4 Storage RLS Politikası (SQL Editor'da çalıştırın)
```sql
-- Herkese okuma izni
CREATE POLICY "Public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

-- Giriş yapmış kullanıcılar yükleyebilir
CREATE POLICY "Auth upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');

-- Kendi dosyalarını silebilir
CREATE POLICY "Auth delete own" ON storage.objects
  FOR DELETE USING (bucket_id = 'uploads');
```

### 1.5 Bağlantı Bilgilerini Al
Supabase Dashboard → **Settings** → **API**:
- `Project URL` → `SUPABASE_URL`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`  
- `anon` key → `SUPABASE_ANON_KEY`

Supabase Dashboard → **Settings** → **Database** → Connection string (URI):
- URI mode → `DATABASE_URL`

---

## 2. Vercel Kurulumu

### 2.1 Vercel CLI ile Deploy
```bash
# Vercel CLI kurun
npm install -g vercel

# Giriş yapın
vercel login

# Deploy edin
vercel --prod
```

### 2.2 Vercel Dashboard'dan Deploy
1. [vercel.com](https://vercel.com) → "New Project"
2. GitHub reponuzu import edin
3. **Framework**: diğer (Other)
4. **Build Command**: `npm run build:vercel`
5. **Output Directory**: `dist/public`
6. **Root Directory**: `/` (varsayılan)

### 2.3 Environment Variables Ekle
Vercel Dashboard → Project → **Settings** → **Environment Variables**

Aşağıdaki değişkenleri ekleyin (`.env.example` dosyasına bakın):

| Değişken | Değer |
|----------|-------|
| `DATABASE_URL` | Supabase PostgreSQL URI |
| `SUPABASE_URL` | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
| `SUPABASE_STORAGE_BUCKET` | `uploads` |
| `SESSION_SECRET` | Rastgele 32+ karakter string |
| `RESEND_API_KEY` | Resend API anahtarı |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase private key |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA secret |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (opsiyonel) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token (opsiyonel) |
| `NODE_ENV` | `production` |

### 2.4 Domain Ayarla (opsiyonel)
Vercel Dashboard → Project → **Settings** → **Domains**
→ `sahibindenhayvan.com` ekleyin ve DNS ayarlarını yapın.

---

## 3. Veritabanı Sessions Tablosu

`connect-pg-simple` için sessions tablosunu oluşturun (eğer yoksa):

```sql
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");
```

Supabase SQL Editor'da çalıştırın.

---

## 4. Opsiyonel Servisler

### Redis (Upstash) — Caching için
- [console.upstash.com](https://console.upstash.com) → New Database → Region: EU-West
- REST URL ve Token'ı kopyalayın
- Redis olmadan uygulama çalışır, sadece cache devre dışı kalır

### Firebase — Push Notification için
- [console.firebase.google.com](https://console.firebase.google.com)
- Proje Ayarları → Hizmet Hesapları → Yeni özel anahtar oluştur
- İndirilen JSON dosyasından `client_email` ve `private_key` alın

---

## 5. Özellik Kısıtlamaları (Vercel Serverless)

Vercel'de aşağıdaki özellikler **çalışmaz** (WebSocket gerektirir):
- ❌ Canlı müzayede (real-time bid updates via WebSocket)
- ❌ Anlık mesajlaşma WebSocket bağlantısı  
- ❌ Çiftlik TV canlı yayın (Agora tabanlı)
- ❌ Kullanıcı çevrimiçi durumu göstergesi

Bu özellikler için iki seçenek:

**Seçenek A:** Backend'i Railway'e deploy edin (WebSocket destekler)
```bash
# Railway CLI
npm install -g @railway/cli
railway login
railway up
```

**Seçenek B:** Supabase Realtime kullanın (WebSocket'i değiştirir)
→ Supabase Realtime PostgreSQL değişikliklerini dinler

---

## 6. Railway Alternatifi (WebSocket dahil tam çalışma)

Eğer WebSocket özellikleri gerekiyorsa Vercel yerine Railway kullanın:

```bash
npm install -g @railway/cli
railway login
railway link  # mevcut projeye bağlan veya new project
railway up    # deploy et
```

Railway'de aynı environment variable'ları ekleyin.  
Railway Node.js sunucularını ve WebSocket bağlantılarını tam destekler.

---

## 7. Hızlı Kontrol

Deploy sonrası kontrol edin:

```bash
# Health check
curl https://sizin-alan-adiniz.com/health

# API çalışıyor mu?
curl https://sizin-alan-adiniz.com/api/categories
```

---

## 8. Yerel Geliştirme (Replit'siz)

```bash
# Bağımlılıkları yükle
npm install

# .env dosyasını doldurun
cp .env.example .env

# Geliştirme sunucusunu başlat
npm run dev
```

Artık `http://localhost:5000` adresinden erişebilirsiniz.
