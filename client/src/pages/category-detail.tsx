import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { ListingCard } from "@/components/listing-card";
import { Pagination } from "@/components/pagination";
import { ChevronRight, Package, SlidersHorizontal, X, ArrowUpDown, LayoutGrid, LayoutList } from "lucide-react";
import type { Category, Listing } from "@shared/schema";

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

// Lucide icon adı → emoji eşleştirmesi (kategoriler için)
const ICON_EMOJI: Record<string, string> = {
  // Lucide icon isimleri
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
  // Slug tabanlı (fallback)
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

interface Filters {
  sortBy: string;
  minPrice: string;
  maxPrice: string;
  city: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "En Yeni" },
  { value: "oldest", label: "En Eski" },
  { value: "price_asc", label: "Fiyat (Düşük → Yüksek)" },
  { value: "price_desc", label: "Fiyat (Yüksek → Düşük)" },
];

function buildQueryParams(categoryId: string, page: number, filters: Filters) {
  const params = new URLSearchParams({ categoryId, page: String(page), limit: "20" });
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  if (filters.city) params.set("city", filters.city);
  if (filters.sortBy === "price_asc") { params.set("sortBy", "price"); params.set("sortOrder", "asc"); }
  else if (filters.sortBy === "price_desc") { params.set("sortBy", "price"); params.set("sortOrder", "desc"); }
  else if (filters.sortBy === "oldest") { params.set("sortBy", "createdAt"); params.set("sortOrder", "asc"); }
  else { params.set("sortBy", "createdAt"); params.set("sortOrder", "desc"); }
  return params.toString();
}

export default function CategoryDetailPage() {
  const [, params] = useRoute("/kategori/:slug");
  const slug = params?.slug;
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    sortBy: "newest",
    minPrice: "",
    maxPrice: "",
    city: "",
  });
  const [pendingFilters, setPendingFilters] = useState<Filters>(filters);

  const { data: category, isLoading: categoryLoading } = useQuery<CategoryWithChildren>({
    queryKey: [`/api/categories/${slug}`],
    enabled: !!slug,
  });

  const { data: categoryTree = [] } = useQuery<CategoryWithChildren[]>({
    queryKey: ["/api/categories/tree"],
  });

  const { data: categoryStats = [] } = useQuery<{ categoryId: string; count: number }[]>({
    queryKey: ["/api/categories/stats"],
  });

  const queryParams = useMemo(() => {
    if (!category?.id) return null;
    return buildQueryParams(category.id, currentPage, filters);
  }, [category?.id, currentPage, filters]);

  const { data: listingsResponse, isLoading: listingsLoading } = useQuery<ListingsResponse>({
    queryKey: ["/api/listings", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/listings?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch listings");
      return res.json();
    },
    enabled: !!queryParams,
  });

  const getCategoryCount = useCallback((categoryId: string) => {
    const stat = categoryStats.find((s) => s.categoryId === categoryId);
    return stat?.count ?? 0;
  }, [categoryStats]);

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

  const subCategories = category?.children ?? [];

  const activeFilterCount = [
    filters.minPrice, filters.maxPrice, filters.city,
  ].filter(Boolean).length;

  const applyFilters = () => {
    setFilters(pendingFilters);
    setCurrentPage(1);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    const reset = { sortBy: "newest", minPrice: "", maxPrice: "", city: "" };
    setFilters(reset);
    setPendingFilters(reset);
    setCurrentPage(1);
  };

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
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap" data-testid="breadcrumb">
        <Link href="/"><span className="hover:text-foreground cursor-pointer">Ana Sayfa</span></Link>
        {breadcrumb.map((cat, idx) => (
          <div key={cat.id} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            {idx === breadcrumb.length - 1 ? (
              <span className="text-foreground font-medium">{cat.name}</span>
            ) : (
              <Link href={`/kategori/${cat.slug}`}>
                <span className="hover:text-foreground cursor-pointer">{cat.name}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground mt-1 text-sm">{category.description}</p>
        )}
      </div>

      {/* Subcategories */}
      {subCategories.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Alt Kategoriler</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {subCategories.map((sub) => (
              <Link key={sub.id} href={`/kategori/${sub.slug}`}>
                <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg border hover:border-primary hover:bg-accent/50 transition-all cursor-pointer text-center group">
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

      {/* Toolbar: sort + filter + count + view */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* Sort */}
        <Select
          value={filters.sortBy}
          onValueChange={(val) => {
            setFilters((f) => ({ ...f, sortBy: val }));
            setPendingFilters((f) => ({ ...f, sortBy: val }));
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-auto min-w-[160px] text-sm gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter Sheet */}
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-sm">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtrele
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>Filtrele</SheetTitle>
            </SheetHeader>
            <div className="space-y-5 py-5">
              {/* Price */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Fiyat Aralığı (₺)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={pendingFilters.minPrice}
                    onChange={(e) => setPendingFilters((f) => ({ ...f, minPrice: e.target.value }))}
                    className="h-9 text-sm"
                  />
                  <span className="text-muted-foreground">—</span>
                  <Input
                    type="number"
                    placeholder="Maks"
                    value={pendingFilters.maxPrice}
                    onChange={(e) => setPendingFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Şehir</Label>
                <Input
                  placeholder="İstanbul, Ankara..."
                  value={pendingFilters.city}
                  onChange={(e) => setPendingFilters((f) => ({ ...f, city: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <SheetFooter className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const reset = { ...filters, minPrice: "", maxPrice: "", city: "" };
                setPendingFilters(reset);
              }} className="flex-1">
                Temizle
              </Button>
              <Button size="sm" onClick={applyFilters} className="flex-1">
                Uygula
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Active filter chips */}
        {filters.city && (
          <Badge variant="secondary" className="gap-1 text-xs">
            📍 {filters.city}
            <button onClick={() => { setFilters((f) => ({ ...f, city: "" })); setPendingFilters((f) => ({ ...f, city: "" })); }}>
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}
        {(filters.minPrice || filters.maxPrice) && (
          <Badge variant="secondary" className="gap-1 text-xs">
            💰 {filters.minPrice || "0"}₺ – {filters.maxPrice || "∞"}₺
            <button onClick={() => { setFilters((f) => ({ ...f, minPrice: "", maxPrice: "" })); setPendingFilters((f) => ({ ...f, minPrice: "", maxPrice: "" })); }}>
              <X className="w-3 h-3" />
            </button>
          </Badge>
        )}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={clearFilters}>
            Tümünü Temizle
          </Button>
        )}

        {/* Spacer */}
        <div className="ml-auto flex items-center gap-2">
          {listingsResponse && (
            <span className="text-sm text-muted-foreground">
              {listingsResponse.total.toLocaleString("tr-TR")} ilan
            </span>
          )}
          {/* View toggle */}
          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Listings */}
      <section>
        {listingsLoading ? (
          <div className={viewMode === "grid"
            ? "grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            : "flex flex-col gap-3"}>
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className={viewMode === "grid" ? "h-56" : "h-24"} />
            ))}
          </div>
        ) : listingsResponse && listingsResponse.data.length > 0 ? (
          <>
            <div
              className={viewMode === "grid"
                ? "grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                : "flex flex-col gap-3"}
              data-testid="grid-listings"
            >
              {listingsResponse.data.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            {listingsResponse.totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={listingsResponse.totalPages}
                  onPageChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                />
              </div>
            )}
          </>
        ) : (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2" data-testid="text-no-listings">
              {activeFilterCount > 0 ? "Filtrelere Uygun İlan Yok" : "Henüz İlan Yok"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {activeFilterCount > 0
                ? "Farklı filtreler deneyin veya filtreleri temizleyin"
                : "Bu kategoride henüz ilan bulunmuyor"}
            </p>
            {activeFilterCount > 0 ? (
              <Button variant="outline" onClick={clearFilters}>Filtreleri Temizle</Button>
            ) : (
              <Link href="/ilan-ver"><Button data-testid="button-create-listing">İlk İlanı Siz Verin</Button></Link>
            )}
          </Card>
        )}
      </section>
    </div>
  );
}
