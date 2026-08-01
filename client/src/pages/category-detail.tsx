import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { SEOHead, generateBreadcrumbStructuredData } from "@/components/seo-head";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard } from "@/components/listing-card";
import { Pagination } from "@/components/pagination";
import { AdvancedFilters, FilterSidebar, type FilterValues } from "@/components/advanced-filters";
import { ChevronRight, Package, LayoutGrid, LayoutList } from "lucide-react";
import type { Category, Listing } from "@shared/schema";

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

// Lucide icon name → emoji mapping (for subcategory display)
const ICON_EMOJI: Record<string, string> = {
  PawPrint: "🐾", Dog: "🐕", Cat: "🐈", Fish: "🐟", Bird: "🐦",
  Turtle: "🐢", Squirrel: "🐿️", Rabbit: "🐰", Hamster: "🐹",
  Snake: "🐍", Lizard: "🦎", Frog: "🐸", Bug: "🐛",
  Tractor: "🐄", Cow: "🐄", Pig: "🐷", Sheep: "🐑", Goat: "🐐",
  Chicken: "🐔", Duck: "🦆", Horse: "🐴", Donkey: "🫏",
  Honeycomb: "🍯", Bee: "🐝",
  Wheat: "🌾", Corn: "🌽", Apple: "🍎",
  Stethoscope: "🩺", Syringe: "💉", Hospital: "🏥",
  ShoppingBag: "🛒", ShoppingCart: "🛒", Package: "📦",
  FileText: "📄", File: "📄", ClipboardList: "📋",
  Store: "🏪", Building2: "🏢", Building: "🏗️",
  Home: "🏡", House: "🏠",
  Truck: "🚛", Car: "🚗", Bike: "🚲",
  Factory: "🏭", Wrench: "🔧", Settings: "⚙️",
  "evcil-hayvanlar": "🐾", "ciftlik-hayvanlari": "🐄",
  "baliklar-su-urunleri": "🐟", "atlar-binicilik": "🐴",
  "aricilik": "🍯", "kuslar": "🐦",
  "surungenler-amfibiler": "🦎", "kemirgenler-kucuk-hayvanlar": "🐹",
  "yem-mama-tarim": "🌾", "ekipmanlar-aksesuarlar": "🛒",
  "veterinerlik-hizmetler": "🩺", "kayit-belgeler": "📄",
  "magazalar": "🏪", "tarim-kirsal-emlak": "🏡",
  "araclar-nakliye": "🚛", "uretim-isleme-tesisleri": "🏭",
  "insaat-yapi": "🏗️",
};

function getCatEmoji(cat: Category): string {
  return ICON_EMOJI[cat.icon ?? ""] || ICON_EMOJI[cat.slug] || "📦";
}

interface ListingsResponse {
  data: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// URL parameter keys that map to filter values
const FILTER_URL_PARAMS = [
  'city', 'district', 'minPrice', 'maxPrice', 'minAge', 'maxAge',
  'ageCategory', 'gender', 'breed', 'healthStatus', 'vaccinated',
  'neutered', 'pedigree', 'sortBy', 'sortOrder', 'characterTraits',
] as const;

function parseFiltersFromURL(searchParams: URLSearchParams): FilterValues {
  const filters: FilterValues = {};
  FILTER_URL_PARAMS.forEach(param => {
    const value = searchParams.get(param);
    if (value) {
      if (param === 'characterTraits') {
        filters.characterTraits = value.split(',').filter(Boolean);
      } else {
        (filters as any)[param] = value;
      }
    }
  });
  return filters;
}

function buildURLFromFilters(slug: string, filters: FilterValues, page?: number): string {
  const params = new URLSearchParams();
  if (page && page > 1) params.set('page', page.toString());
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      if (key === 'characterTraits' && Array.isArray(value) && value.length > 0) {
        params.set(key, value.join(','));
      } else if (typeof value === 'string' && value) {
        params.set(key, value);
      }
    }
  });
  const qs = params.toString();
  return `/kategori/${slug}${qs ? `?${qs}` : ''}`;
}

export default function CategoryDetailPage() {
  const [, params] = useRoute("/kategori/:slug");
  const slug = params?.slug;
  const [location, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Parse search params from current URL
  const searchParams = useMemo(
    () => new URLSearchParams(location.split('?')[1] || ''),
    [location]
  );

  const [filters, setFilters] = useState<FilterValues>(() => parseFiltersFromURL(searchParams));
  const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));

  // Sync state when URL changes (back/forward navigation)
  useEffect(() => {
    setFilters(parseFiltersFromURL(searchParams));
    setCurrentPage(parseInt(searchParams.get('page') || '1', 10));
  }, [searchParams]);

  const { data: category, isLoading: categoryLoading } = useQuery<CategoryWithChildren>({
    queryKey: [`/api/categories/${slug}`],
    enabled: !!slug,
  });

  const { data: categoryTree = [] } = useQuery<CategoryWithChildren[]>({
    queryKey: ["/api/categories/tree"],
  });

  const queryParams = useMemo(() => ({
    categoryId: category?.id,
    page: currentPage,
    limit: 20,
    ...filters,
  }), [category?.id, currentPage, filters]);

  const { data: listingsResponse, isLoading: listingsLoading } = useQuery<ListingsResponse>({
    queryKey: ["/api/listings", queryParams],
    enabled: !!category?.id,
  });

  const { data: categoryStats = [] } = useQuery<{ categoryId: string; count: number }[]>({
    queryKey: ["/api/categories/stats"],
  });

  const getCategoryCount = useCallback((categoryId: string) => {
    const stat = categoryStats.find(s => s.categoryId === categoryId);
    return stat ? stat.count : 0;
  }, [categoryStats]);

  // Build breadcrumb path
  const breadcrumb = useMemo(() => {
    if (!category) return [];
    const findPath = (cats: CategoryWithChildren[], targetId: string, path: Category[] = []): Category[] | null => {
      for (const cat of cats) {
        if (cat.id === targetId) return [...path, cat];
        if (cat.children?.length) {
          const found = findPath(cat.children, targetId, [...path, cat]);
          if (found) return found;
        }
      }
      return null;
    };
    return findPath(categoryTree, category.id) ?? [];
  }, [categoryTree, category]);

  const subCategories = category?.children || [];

  // Update URL when filters change (resets to page 1)
  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
    if (slug) {
      setLocation(buildURLFromFilters(slug, newFilters, 1), { replace: false });
    }
  }, [slug, setLocation]);

  // Update URL when page changes
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    if (slug) {
      setLocation(buildURLFromFilters(slug, filters, newPage), { replace: false });
    }
  }, [slug, filters, setLocation]);

  const activeFilterCount = Object.keys(filters).filter(k => {
    if (k === 'sortBy' || k === 'sortOrder') return false;
    const v = filters[k as keyof FilterValues];
    if (k === 'characterTraits') return Array.isArray(v) && v.length > 0;
    return v !== undefined && v !== '';
  }).length;

  /**
   * Ne ilanı ne de alt kategorisi olan bir kategori sayfası, arama motoru
   * açısından "zayıf içerik"tir: gösterecek hiçbir şeyi yoktur ve sitedeki
   * yüzlerce benzeriyle birebir aynı görünür. Böyle sayfaları dizine
   * aldırmak yeni bir alan adının tarama bütçesini ve güvenilirliğini boşa
   * harcar. Sayfa kullanıcıya açık kalır, yalnızca dizine girmez.
   *
   * Ölçüt bilinçli olarak dar: yalnızca sorgu tamamlandığında, filtre
   * uygulanmamışken ve gerçekten sıfır sonuç varken devreye girer. "0 ilan"
   * bir filtre yüzündense sayfa dizinlenebilir kalmalı; ilk ilan girildiğinde
   * de kendiliğinden geri döner. Aynı kural sunucu tarafında sitemap'te de
   * uygulanıyor (server/sitemap.ts).
   */
  const bosVeDizinlenmemeli =
    !listingsLoading &&
    listingsResponse?.total === 0 &&
    subCategories.length === 0 &&
    activeFilterCount === 0;

  if (categoryLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-6 w-64 mb-6" />
        <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 mb-8">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Kategori Bulunamadı</h2>
        <p className="text-muted-foreground mb-4">Aradığınız kategori mevcut değil</p>
        <Link href="/"><Button>Ana Sayfaya Dön</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-6">
      {/* Kategori sayfalarının da kendi başlık/açıklaması yoktu; hepsi ana
          sayfa etiketlerini kullanıyordu. Kırıntı navigasyonu ekranda zaten
          vardı, arama motorlarına da bildiriliyor. */}
      {category && (
        <SEOHead
          title={`${category.name} İlanları | sahibindenhayvan.com`}
          description={`${category.name} kategorisindeki güncel ilanlar. Türkiye genelinde ücretsiz ilan ver, güvenle al ve sat.`}
          canonical={`/kategori/${category.slug}`}
          noIndex={bosVeDizinlenmemeli}
          structuredData={generateBreadcrumbStructuredData([
            { name: "Ana Sayfa", url: "/" },
            ...breadcrumb.map((c) => ({ name: c.name, url: `/kategori/${c.slug}` })),
          ])}
        />
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap" data-testid="breadcrumb">
        <Link href="/"><span className="hover:text-foreground cursor-pointer" data-testid="link-home">Ana Sayfa</span></Link>
        {breadcrumb.map((cat, idx) => (
          <div key={cat.id} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            {idx === breadcrumb.length - 1 ? (
              <span className="text-foreground font-medium" data-testid={`text-category-${cat.slug}`}>{cat.name}</span>
            ) : (
              <Link href={`/kategori/${cat.slug}`}>
                <span className="hover:text-foreground cursor-pointer" data-testid={`link-category-${cat.slug}`}>{cat.name}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-page-title">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground mt-1 text-sm" data-testid="text-category-description">{category.description}</p>
        )}
      </div>

      {/* Subcategories — compact emoji grid */}
      {subCategories.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Alt Kategoriler</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2" data-testid="grid-subcategories">
            {subCategories.map((sub) => (
              <Link key={sub.id} href={`/kategori/${sub.slug}`}>
                <div
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg border hover:border-primary hover:bg-accent/50 transition-all cursor-pointer text-center group"
                  data-testid={`card-subcategory-${sub.slug}`}
                >
                  <span className="text-xl">{getCatEmoji(sub)}</span>
                  <span className="text-[11px] font-medium leading-tight group-hover:text-primary line-clamp-2">
                    {sub.name}
                  </span>
                  {getCategoryCount(sub.id) > 0 && (
                    <span className="text-[10px] text-muted-foreground">{getCategoryCount(sub.id)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Listings section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {category.name} İlanları
          </h2>
          <div className="flex items-center gap-2">
            {listingsResponse && (
              <Badge variant="secondary" data-testid="text-listing-count">
                {listingsResponse.total.toLocaleString("tr-TR")} ilan
              </Badge>
            )}
            {/* View mode toggle */}
            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                aria-label="Grid görünümü"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                aria-label="Liste görünümü"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Two-column layout: desktop sidebar + main content */}
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-6 lg:items-start">
          {/* Desktop sidebar — hidden on mobile */}
          <div className="hidden lg:block">
            <FilterSidebar
              currentFilters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>

          {/* Main content: quick filters + sort + mobile filter button + listings */}
          <div className="min-w-0">
            {/* AdvancedFilters: quick filters, sort dropdown, mobile "Filtrele" sheet */}
            <div className="mb-4">
              <AdvancedFilters
                currentFilters={filters}
                onFilterChange={handleFilterChange}
                hideTriggerOnDesktop={true}
              />
            </div>

            {/* Listings grid */}
            {listingsLoading ? (
              <div className={viewMode === "grid"
                ? "grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                : "flex flex-col gap-3"}>
                {[...Array(9)].map((_, i) => (
                  <Skeleton key={i} className={viewMode === "grid" ? "h-56" : "h-24"} />
                ))}
              </div>
            ) : listingsResponse && listingsResponse.data.length > 0 ? (
              <>
                <div
                  className={viewMode === "grid"
                    ? "grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                    : "flex flex-col gap-3"}
                  data-testid="grid-listings"
                >
                  {listingsResponse.data.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} variant={viewMode === "list" ? "horizontal" : "vertical"} />
                  ))}
                </div>

                {listingsResponse.totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={listingsResponse.totalPages}
                      onPageChange={(p) => { handlePageChange(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    />
                  </div>
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2" data-testid="text-no-listings">
                  {activeFilterCount > 0 ? 'Filtreyle Eşleşen İlan Bulunamadı' : 'Henüz İlan Yok'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {activeFilterCount > 0
                    ? 'Farklı filtreler deneyin veya filtreleri temizleyin'
                    : 'Bu kategoride henüz ilan bulunmuyor'}
                </p>
                {activeFilterCount > 0 ? (
                  <Button variant="outline" onClick={() => handleFilterChange({})}>
                    Filtreleri Temizle
                  </Button>
                ) : (
                  <Link href="/ilan-ver">
                    <Button data-testid="button-create-listing">Ücretsiz İlan Ver</Button>
                  </Link>
                )}
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
