import { useEffect } from "react";

const SITE_ORIGIN = "https://sahibindenhayvan.com";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  structuredData?: Record<string, any>;
  /** Arama motorları bu sayfayı dizine eklemesin (404, arama sonucu, panel vb.) */
  noIndex?: boolean;
  /**
   * Sayfanın kanonik adresi. Verilmezse mevcut yoldan üretilir.
   * Sorgu parametreleri bilinçli olarak atılır: aynı içeriğin
   * ?page=2&sort=... gibi sayısız varyantı ayrı sayfa sayılmamalı.
   */
  canonical?: string;
}

/** Mevcut yoldan kanonik adres üretir (sorgu ve hash atılır, sondaki / sadeleştirilir). */
function buildCanonical(explicit?: string): string {
  if (explicit) {
    return explicit.startsWith("http") ? explicit : `${SITE_ORIGIN}${explicit}`;
  }
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return `${SITE_ORIGIN}${path}`;
}

export function SEOHead({
  title = "sahibindenhayvan.com - Türkiye'nin En Güvenilir Hayvan İlanları Platformu",
  description = "Evcil hayvanlarınızı bulun, satın alın, sahiplenin. Türkiye'nin en güvenilir hayvan ilanları platformunda binlerce ilan arasından aradığınızı bulun.",
  image = "https://sahibindenhayvan.com/og-image.jpg",
  url = window.location.href,
  type = "website",
  structuredData,
  noIndex = false,
  canonical
}: SEOHeadProps) {
  useEffect(() => {
    // Update title
    document.title = title;

    // Update or create meta tags
    const updateMeta = (name: string, content: string, property?: boolean) => {
      const attr = property ? "property" : "name";
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute("content", content);
    };

    // Standard meta tags
    updateMeta("description", description);
    updateMeta("robots", noIndex ? "noindex, nofollow" : "index, follow");
    updateMeta("viewport", "width=device-width, initial-scale=1");

    // Kanonik adres — index.html'deki sabit değeri her sayfada güncelliyoruz.
    // Güncellenmezse tüm sayfalar ana sayfayı işaret eder ve arama motorları
    // iç sayfaları yinelenen içerik sayıp dizine almaz.
    const canonicalHref = buildCanonical(canonical);
    let linkEl = document.querySelector('link[rel="canonical"]');
    if (!linkEl) {
      linkEl = document.createElement("link");
      linkEl.setAttribute("rel", "canonical");
      document.head.appendChild(linkEl);
    }
    linkEl.setAttribute("href", canonicalHref);

    // Open Graph
    updateMeta("og:title", title, true);
    updateMeta("og:description", description, true);
    updateMeta("og:image", image, true);
    updateMeta("og:url", url, true);
    updateMeta("og:type", type, true);
    updateMeta("og:site_name", "sahibindenhayvan.com", true);
    updateMeta("og:locale", "tr_TR", true);

    // Twitter Card
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", title);
    updateMeta("twitter:description", description);
    updateMeta("twitter:image", image);

    // Structured Data
    if (structuredData) {
      let scriptElement = document.querySelector('script[type="application/ld+json"]');
      
      if (!scriptElement) {
        scriptElement = document.createElement("script");
        scriptElement.setAttribute("type", "application/ld+json");
        document.head.appendChild(scriptElement);
      }
      
      scriptElement.textContent = JSON.stringify(structuredData);
    }
  }, [title, description, image, url, type, structuredData, noIndex, canonical]);

  return null;
}

// Helper functions to generate structured data
export function generateListingStructuredData(listing: any) {
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": listing.title,
    "description": listing.description,
    "image": listing.images?.[0] || "",
    "offers": {
      "@type": "Offer",
      "price": listing.price,
      "priceCurrency": "TRY",
      "availability": listing.status === "active" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Person",
        "name": listing.seller ? `${listing.seller.firstName || ''} ${listing.seller.lastName || ''}`.trim() || listing.seller.username || "Anonymous" : "Anonymous"
      }
    }
  };
}

export function generateOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "sahibindenhayvan.com",
    "url": "https://sahibindenhayvan.com",
    "logo": "https://sahibindenhayvan.com/logo.png",
    "sameAs": [
      "https://twitter.com/sahibindenhayvan",
      "https://facebook.com/sahibindenhayvan"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "info@sahibindenhayvan.com"
    }
  };
}

export function generateBlogPostStructuredData(post: any) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || post.content?.substring(0, 160),
    "image": post.thumbnail || "",
    "datePublished": post.publishedAt,
    "dateModified": post.updatedAt,
    "author": {
      "@type": "Person",
      "name": post.author ? `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || post.author.username || "sahibindenhayvan.com Team" : "sahibindenhayvan.com Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "sahibindenhayvan.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://sahibindenhayvan.com/logo.png"
      }
    }
  };
}
