/**
 * Dinamik sitemap üretimi.
 *
 * Statik bir sitemap.xml dosyası yerine sunucudan üretiliyor; ilanlar,
 * kategoriler, mağazalar ve blog yazıları sürekli değiştiği için elle
 * güncellenen bir dosya kısa sürede eskir.
 *
 * Çıktı 10 dakika önbelleklenir (CDN'de de) — arama motorları sık çeker,
 * her istekte veritabanını dolaşmasına gerek yok.
 */
import type { Express, Request, Response } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import { listings, categories, stores, blogPosts } from "@shared/schema";

const SITE = process.env.APP_URL?.replace(/\/$/, "") || "https://sahibindenhayvan.com";

/** Sitemap'e girecek statik sayfalar (giriş/panel gibi özel alanlar hariç) */
const STATIC_PATHS: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/ilanlar", priority: "0.9", changefreq: "hourly" },
  { path: "/magazalar", priority: "0.8", changefreq: "daily" },
  { path: "/blog", priority: "0.7", changefreq: "weekly" },
  { path: "/veteriner-hizmetleri", priority: "0.6", changefreq: "weekly" },
  { path: "/nakliye-hizmetleri", priority: "0.6", changefreq: "weekly" },
  { path: "/piyasa-fiyatlari", priority: "0.6", changefreq: "daily" },
  { path: "/hakkimizda", priority: "0.5", changefreq: "monthly" },
  { path: "/iletisim", priority: "0.5", changefreq: "monthly" },
  { path: "/yardim", priority: "0.5", changefreq: "monthly" },
  { path: "/kullanim-kosullari", priority: "0.3", changefreq: "yearly" },
  { path: "/gizlilik-politikasi", priority: "0.3", changefreq: "yearly" },
  { path: "/kvkk", priority: "0.3", changefreq: "yearly" },
  { path: "/cerez-politikasi", priority: "0.3", changefreq: "yearly" },
  { path: "/ilan-kurallari", priority: "0.3", changefreq: "yearly" },
];

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc: string, lastmod?: Date | null, changefreq?: string, priority?: string) {
  const parts = [`    <loc>${xmlEscape(loc)}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${lastmod.toISOString().split("T")[0]}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`    <priority>${priority}</priority>`);
  return `  <url>\n${parts.join("\n")}\n  </url>`;
}

export function registerSitemapRoutes(app: Express) {
  app.get("/sitemap.xml", async (_req: Request, res: Response) => {
    try {
      const entries: string[] = STATIC_PATHS.map((s) =>
        urlEntry(`${SITE}${s.path}`, null, s.changefreq, s.priority)
      );

      // ── Kategoriler ────────────────────────────────────────────────────────
      // Yalnızca GERÇEKTEN içerik gösteren kategoriler bildirilir.
      //
      // Sitede 524 kategori var; hepsini koşulsuz bildirmek, ilan girilmeden
      // önce Google'a 500+ boş ve birbirinin aynısı sayfa sunmak demek. Yeni
      // bir alan adında bu "zayıf içerik" (thin content) sayılır, tarama
      // bütçesini tüketir ve alan adının güvenilirliğini düşürür.
      //
      // Kural: kök kategoriler her zaman girer (boşken bile gezinilebilir bir
      // alt kategori listesi gösterirler); alt kategoriler ise ancak kendisinde
      // veya altındakilerden birinde yayında ilan varsa girer. Kategori sayfası
      // alt dalları da listelediği için ata zincirinin tamamı işaretlenir.
      // İlk ilan girildiği anda ilgili sayfalar sitemap'e kendiliğinden döner.
      const cats = await db
        .select({ id: categories.id, slug: categories.slug, parentId: categories.parentId })
        .from(categories)
        .limit(2000);

      const withListings = await db
        .selectDistinct({ categoryId: listings.categoryId })
        .from(listings)
        .where(eq(listings.status, "active"));

      const parentOf = new Map(cats.map((c) => [c.id, c.parentId]));
      const dolu = new Set<string>();
      for (const { categoryId } of withListings) {
        // İlanın kategorisinden köke kadar çık; her atayı işaretle.
        let cur: string | null | undefined = categoryId;
        while (cur && !dolu.has(cur)) {
          dolu.add(cur);
          cur = parentOf.get(cur);
        }
      }

      for (const c of cats) {
        if (!c.slug) continue;
        const kok = c.parentId === null;
        if (!kok && !dolu.has(c.id)) continue;
        entries.push(
          urlEntry(`${SITE}/kategori/${c.slug}`, null, "daily", kok ? "0.8" : "0.7")
        );
      }

      // ── Yayındaki ilanlar ──────────────────────────────────────────────────
      const items = await db
        .select({ id: listings.id, updatedAt: listings.updatedAt })
        .from(listings)
        .where(eq(listings.status, "active"))
        .orderBy(desc(listings.createdAt))
        .limit(20000);
      for (const l of items) {
        entries.push(urlEntry(`${SITE}/ilan/${l.id}`, l.updatedAt, "weekly", "0.8"));
      }

      // ── Onaylı mağazalar ───────────────────────────────────────────────────
      const shops = await db
        .select({ slug: stores.slug, updatedAt: stores.updatedAt })
        .from(stores)
        .limit(5000);
      for (const s of shops) {
        if (s.slug) entries.push(urlEntry(`${SITE}/magaza/${s.slug}`, s.updatedAt, "weekly", "0.7"));
      }

      // ── Yayındaki blog yazıları ────────────────────────────────────────────
      const posts = await db
        .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
        .from(blogPosts)
        .where(eq(blogPosts.published, true))
        .limit(5000);
      for (const p of posts) {
        if (p.slug) entries.push(urlEntry(`${SITE}/blog/${p.slug}`, p.updatedAt, "monthly", "0.6"));
      }

      const xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        entries.join("\n") +
        `\n</urlset>`;

      res.set({
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=600, s-maxage=600",
      });
      res.send(xml);
    } catch (error) {
      console.error("Sitemap üretilemedi:", error);
      // Veritabanı erişilemese bile statik sayfalar sunulur
      const fallback =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        STATIC_PATHS.map((s) => urlEntry(`${SITE}${s.path}`, null, s.changefreq, s.priority)).join("\n") +
        `\n</urlset>`;
      res.set("Content-Type", "application/xml; charset=utf-8");
      res.send(fallback);
    }
  });
}
