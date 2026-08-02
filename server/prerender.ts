/**
 * İçerik sayfaları için sunucu tarafında meta etiketi yerleştirme.
 *
 * SORUN
 * -----
 * Site tamamen istemci tarafında çiziliyor. Sunucunun döndürdüğü HTML her yol
 * için birebir aynı: başlık "Sahibinden Hayvan - Türkiye'nin Ücretsiz Hayvan
 * İlanları Platformu", açıklama da ana sayfanınki. Sayfaya özel etiketler
 * (`client/src/components/seo-head.tsx`) JavaScript çalıştıktan SONRA
 * yazılıyor. Google JavaScript'i çalıştırır ama bu ikinci ve gecikmeli bir
 * aşamadır; yeni bir alan adında sayfaların önemli kısmı o aşamaya hiç
 * gelmeden "ana sayfanın kopyası" olarak değerlendirilir. WhatsApp, X,
 * Facebook gibi bağlantı önizlemesi üreten servisler ise JavaScript'i HİÇ
 * çalıştırmaz — paylaşılan her ilan bağlantısı ana sayfa başlığıyla görünür.
 *
 * ÇÖZÜM
 * -----
 * Yalnızca içerik sayfaları (ilan, kategori, blog, mağaza) sunucudan geçiyor;
 * uygulama kabuğu okunup `<head>` içine o sayfaya ait etiketler yerleştiriliyor.
 * Uygulamanın geri kalanı eskisi gibi doğrudan CDN'den geliyor.
 *
 * TASARIM KARARLARI
 * -----------------
 * - Tam SSR (React'i sunucuda çizmek) YAPILMIYOR. Etiketler arama motorları ve
 *   önizlemeler için yeterli; tam SSR bu uygulamanın yapısını baştan
 *   değiştirmeyi gerektirirdi.
 * - Herhangi bir hata durumunda dokunulmamış kabuk döndürülüyor. En kötü
 *   ihtimalle davranış bugünküyle aynı olur; sayfa asla bozulmaz.
 * - Yanıtlar CDN'de önbellekleniyor (`s-maxage`), yani gerçek kullanıcıların
 *   çoğu sunucusuz fonksiyona hiç uğramıyor.
 * - Enjekte edilen tüm değerler HTML'e göre kaçışlanıyor; ilan başlığı
 *   kullanıcıdan geliyor ve kaçışlanmazsa sayfaya etiket enjekte edilebilirdi.
 */
import fs from "fs";
import path from "path";
import type { Express, Request, Response, NextFunction } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { listings, categories, blogPosts, stores } from "@shared/schema";
import { imageVariant } from "@shared/image-variants";

const SITE = (process.env.APP_URL || "https://sahibindenhayvan.com").replace(/\/$/, "");
const VARSAYILAN_GORSEL = `${SITE}/og-image.png?v=3`;

function kacisla(deger: string): string {
  return deger
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Uzun metni önizlemeye uygun tek satıra indirir. */
function ozet(metin: string | null | undefined, uzunluk = 160): string {
  if (!metin) return "";
  const duz = metin
    .replace(/<[^>]*>/g, " ")       // HTML etiketleri
    .replace(/[#*_`>\[\]]/g, " ")   // markdown işaretleri
    .replace(/\s+/g, " ")
    .trim();
  if (duz.length <= uzunluk) return duz;
  return duz.slice(0, uzunluk - 1).replace(/\s+\S*$/, "") + "…";
}

/** Depolama yolunu tam adrese çevirir. */
function tamAdres(yol: string | null | undefined): string {
  if (!yol) return VARSAYILAN_GORSEL;
  if (/^https?:\/\//i.test(yol)) return yol;
  return `${SITE}${yol.startsWith("/") ? "" : "/"}${yol}`;
}

interface SayfaMeta {
  title: string;
  description: string;
  image?: string;
  canonical: string;
  type?: "website" | "article" | "product";
  structuredData?: Record<string, unknown>;
}

// ── Uygulama kabuğu ─────────────────────────────────────────────────────────
// vercel.json'daki `includeFiles` sayesinde bu dosya fonksiyon paketine dahil
// ediliyor. Bir kez okunup bellekte tutuluyor: her istekte diskten okumanın
// anlamı yok, dağıtım başına içerik değişmiyor.
let kabukOnbellek: string | null = null;

/**
 * Kabuğu önce diskten okur, olmazsa CDN'den çeker.
 *
 * Disk yolu `includeFiles` yapılandırmasına bağlı. O yapılandırma bir gün
 * bozulursa (dizin değişir, ayar düşer) diskten okuma başarısız olur; böyle bir
 * durumda içerik sayfalarının tamamen kırılmaması için ikinci bir kaynak var:
 * `/index.html` statik dosyası CDN'den çekiliyor. Bu istek fonksiyona geri
 * dönmez — Vercel yönlendirmesinin hedefi dosya sisteminde bir dosyadır,
 * yeniden değerlendirilmez, dolayısıyla döngü oluşmaz.
 *
 * Sonuç bellekte tutuluyor: dağıtım süresince içerik değişmez.
 */
async function kabuguOku(): Promise<string | null> {
  if (kabukOnbellek !== null) return kabukOnbellek;

  const adaylar = [
    path.join(process.cwd(), "dist/public/index.html"),
    path.join(process.cwd(), "public/index.html"),
  ];
  for (const aday of adaylar) {
    try {
      if (fs.existsSync(aday)) {
        kabukOnbellek = fs.readFileSync(aday, "utf8");
        return kabukOnbellek;
      }
    } catch {
      /* sonraki adaya geç */
    }
  }

  try {
    const yanit = await fetch(`${SITE}/index.html`);
    if (yanit.ok) {
      const html = await yanit.text();
      if (html.includes("</head>")) {
        console.warn("Ön-render: kabuk diskte yok, CDN'den alındı.");
        kabukOnbellek = html;
        return kabukOnbellek;
      }
    }
  } catch (error) {
    console.error("Ön-render: kabuk CDN'den de alınamadı:", error);
  }

  console.warn("Ön-render: uygulama kabuğu bulunamadı, etiket yerleştirme devre dışı.");
  return null;
}

/**
 * Kabuktaki mevcut etiketleri sayfaya özel olanlarla değiştirir.
 *
 * index.html'de zaten bir başlık, açıklama ve OG etiketleri var; yenilerini
 * eklemek yerine ESKİLERİ SİLİP yenilerini koyuyoruz. Aksi hâlde sayfada iki
 * `<title>` ve iki `og:title` olur, hangisinin geçerli sayılacağı tarayıcıya
 * ve tarayıcıya göre değişir.
 */
function etiketleriYerlestir(kabuk: string, meta: SayfaMeta): string {
  let html = kabuk;

  const silinecek = [
    /<title>[\s\S]*?<\/title>\s*/i,
    /<meta\s+name="description"[^>]*>\s*/i,
    /<link\s+rel="canonical"[^>]*>\s*/i,
    /<meta\s+property="og:(?:title|description|image|url|type)"[^>]*>\s*/gi,
    /<meta\s+name="twitter:(?:title|description|image)"[^>]*>\s*/gi,
  ];
  for (const desen of silinecek) html = html.replace(desen, "");

  const yeni = [
    `<title>${kacisla(meta.title)}</title>`,
    `<meta name="description" content="${kacisla(meta.description)}" />`,
    `<link rel="canonical" href="${kacisla(meta.canonical)}" />`,
    `<meta property="og:type" content="${meta.type || "website"}" />`,
    `<meta property="og:title" content="${kacisla(meta.title)}" />`,
    `<meta property="og:description" content="${kacisla(meta.description)}" />`,
    `<meta property="og:image" content="${kacisla(meta.image || VARSAYILAN_GORSEL)}" />`,
    `<meta property="og:url" content="${kacisla(meta.canonical)}" />`,
    `<meta name="twitter:title" content="${kacisla(meta.title)}" />`,
    `<meta name="twitter:description" content="${kacisla(meta.description)}" />`,
    `<meta name="twitter:image" content="${kacisla(meta.image || VARSAYILAN_GORSEL)}" />`,
  ];

  if (meta.structuredData) {
    // JSON-LD içinde `</script>` dizisi sayfayı erkenden kapatabilir.
    const json = JSON.stringify(meta.structuredData).replace(/<\//g, "<\\/");
    yeni.push(`<script type="application/ld+json">${json}</script>`);
  }

  return html.replace("</head>", `    ${yeni.join("\n    ")}\n  </head>`);
}

// ── Sayfa türlerine göre meta üretimi ───────────────────────────────────────

async function ilanMetasi(id: string): Promise<SayfaMeta | null> {
  const [ilan] = await db
    .select({
      id: listings.id,
      title: listings.title,
      description: listings.description,
      price: listings.price,
      images: listings.images,
      city: listings.city,
      district: listings.district,
      status: listings.status,
    })
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);

  // Yayında olmayan ilan için özel etiket üretilmez: taslak/reddedilmiş bir
  // ilanın başlığını arama motoruna ve önizlemelere sunmak doğru olmaz.
  if (!ilan || ilan.status !== "active") return null;

  // Paylasim onizlemesi icin ORTA boyut (1200px): listings.images alaninda
  // kucuk boyut (400x400) saklaniyor ve WhatsApp/Facebook onizlemesinde
  // kucuk goruntuleniyordu.
  const gorsel = tamAdres(imageVariant((ilan.images as string[] | null)?.[0], "medium"));
  const konum = [ilan.city, ilan.district].filter(Boolean).join(", ");
  const canonical = `${SITE}/ilan/${ilan.id}`;

  return {
    title: `${ilan.title}${konum ? ` — ${konum}` : ""} | sahibindenhayvan.com`,
    description: ozet(ilan.description),
    image: gorsel,
    canonical,
    type: "product",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: ilan.title,
      description: ozet(ilan.description, 300),
      image: gorsel,
      offers: {
        "@type": "Offer",
        price: ilan.price,
        priceCurrency: "TRY",
        availability: "https://schema.org/InStock",
        url: canonical,
      },
    },
  };
}

async function kategoriMetasi(slug: string): Promise<SayfaMeta | null> {
  const [kategori] = await db
    .select({ name: categories.name, slug: categories.slug, description: categories.description })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (!kategori) return null;

  return {
    title: `${kategori.name} İlanları | sahibindenhayvan.com`,
    description:
      ozet(kategori.description) ||
      `${kategori.name} kategorisindeki güncel ilanlar. Türkiye genelinde ücretsiz ilan ver, güvenle al ve sat.`,
    canonical: `${SITE}/kategori/${kategori.slug}`,
  };
}

async function blogMetasi(slug: string): Promise<SayfaMeta | null> {
  const [yazi] = await db
    .select({
      title: blogPosts.title,
      slug: blogPosts.slug,
      excerpt: blogPosts.excerpt,
      content: blogPosts.content,
      featuredImage: blogPosts.featuredImage,
      published: blogPosts.published,
      createdAt: blogPosts.createdAt,
      updatedAt: blogPosts.updatedAt,
    })
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)))
    .limit(1);

  if (!yazi) return null;

  const gorsel = tamAdres(yazi.featuredImage);
  const canonical = `${SITE}/blog/${yazi.slug}`;

  return {
    title: `${yazi.title} | sahibindenhayvan.com`,
    description: ozet(yazi.excerpt || yazi.content),
    image: gorsel,
    canonical,
    type: "article",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: yazi.title,
      description: ozet(yazi.excerpt || yazi.content, 300),
      image: gorsel,
      datePublished: yazi.createdAt,
      dateModified: yazi.updatedAt,
      mainEntityOfPage: canonical,
      publisher: {
        "@type": "Organization",
        name: "sahibindenhayvan.com",
        logo: { "@type": "ImageObject", url: `${SITE}/logo.png` },
      },
    },
  };
}

async function magazaMetasi(slug: string): Promise<SayfaMeta | null> {
  const [magaza] = await db
    .select({
      slug: stores.slug,
      displayName: stores.displayName,
      summary: stores.summary,
      description: stores.description,
      logo: stores.logo,
      city: stores.city,
    })
    .from(stores)
    .where(eq(stores.slug, slug))
    .limit(1);

  if (!magaza) return null;

  const konum = magaza.city ? ` — ${magaza.city}` : "";
  return {
    title: `${magaza.displayName}${konum} | sahibindenhayvan.com`,
    description:
      ozet(magaza.summary || magaza.description) ||
      `${magaza.displayName} mağazasının ilanları ve iletişim bilgileri.`,
    image: tamAdres(magaza.logo),
    canonical: `${SITE}/magaza/${magaza.slug}`,
  };
}

// ── Rotalar ─────────────────────────────────────────────────────────────────

export function registerPrerenderRoutes(app: Express) {
  const isle = (
    uretici: (parametre: string) => Promise<SayfaMeta | null>
  ) => async (req: Request, res: Response, next: NextFunction) => {
    const kabuk = await kabuguOku();
    // Kabuk hiçbir kaynaktan alınamadıysa isteği devret; sonraki katman
    // ne yapıyorsa o geçerli olsun — burada yarım bir sayfa üretmek yerine
    // hiç karışmamak daha güvenli.
    if (!kabuk) return next();

    try {
      const meta = await uretici(req.params[0] ?? Object.values(req.params)[0]);

      // Kayıt bulunamadıysa kabuk olduğu gibi döndürülür; uygulama kendi
      // "bulunamadı" ekranını gösterir. Burada 404 dönmek, istemci tarafı
      // yönlendirmesini bozardı.
      const html = meta ? etiketleriYerlestir(kabuk, meta) : kabuk;

      res.set({
        "Content-Type": "text/html; charset=utf-8",
        // Kullanıcıların çoğu CDN önbelleğinden yanıt alır, fonksiyona
        // uğramaz. İçerik güncellenince en geç 5 dakikada yenilenir.
        "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
      });
      return res.send(html);
    } catch (error) {
      console.error("Ön-render başarısız, kabuk döndürülüyor:", error);
      res.set("Content-Type", "text/html; charset=utf-8");
      return res.send(kabuk);
    }
  };

  app.get("/ilan/:id", isle((id) => ilanMetasi(id)));
  app.get("/kategori/:slug", isle((slug) => kategoriMetasi(slug)));
  app.get("/blog/:slug", isle((slug) => blogMetasi(slug)));
  app.get("/magaza/:slug", isle((slug) => magazaMetasi(slug)));
}
