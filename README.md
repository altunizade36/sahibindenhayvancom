# sahibindenhayvan.com

Türkiye'nin ücretsiz hayvan ilan platformu — evcil hayvanlar, çiftlik hayvanları,
kuşlar, balıklar ve daha fazlası için 643 kategoride ilan sistemi.

[![CI](https://github.com/altunizade36/sahibindenhayvancom/actions/workflows/ci.yml/badge.svg)](https://github.com/altunizade36/sahibindenhayvancom/actions/workflows/ci.yml)

---

## Teknoloji

| Katman | Kullanılan |
|---|---|
| Frontend | React 18 · TypeScript · Vite · Tailwind · Shadcn UI |
| Backend | Node.js · Express · TypeScript |
| Veritabanı | Supabase PostgreSQL · Drizzle ORM |
| Depolama | Supabase Storage |
| Barındırma | Vercel |
| Alan adı | GoDaddy → Vercel |

---

## Hızlı Başlangıç

```bash
npm install
npm run setup     # Supabase + Vercel + DNS kurulum sihirbazı
npm run dev       # http://localhost:5000
```

Ayrıntılı kurulum: **[KURULUM.md](KURULUM.md)**
Proje mimarisi: **[PROJE.md](PROJE.md)**
Güvenlik politikası: **[SECURITY.md](SECURITY.md)**

---

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu (hot reload) |
| `npm run build` | Üretim derlemesi |
| `npm run check` | TypeScript tip kontrolü |
| `npm run doctor` | Yapılandırma tanılaması |
| `npm run db:push` | Şemayı veritabanına uygula |
| `npm run db:studio` | Drizzle Studio |
| `npm run setup:supabase` | Veritabanı + storage kurulumu |
| `npm run setup:vercel` | Ortam değişkenleri + deploy |
| `npm run setup:dns` | GoDaddy DNS → Vercel |

---

## Ortam Değişkenleri

`.env.example` dosyasını `.env` olarak kopyalayıp doldurun.

> ⚠️ **`.env` dosyasını asla commit etmeyin.** Depoya sızan her anahtarı derhal
> iptal edip yenileyin — bkz. [SECURITY.md](SECURITY.md).

Zorunlu: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`

---

## Katkı

Hızlı güncelleme için `main` dalına doğrudan push yapılabilir:

```bash
git add -A && git commit -m "mesaj" && git push
```

Daha büyük değişikliklerde dal açıp PR üzerinden ilerlemek tercih edilir:

1. `git checkout -b ozellik/aciklama`
2. `npm run check` ve `npm run build` temiz olsun
3. Pull request açın — CI otomatik çalışır

`main` dalında **force push ve şube silme kapalıdır** (kaza koruması).

---

## Lisans

MIT
