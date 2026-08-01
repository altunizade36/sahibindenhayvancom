import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard } from "@/components/listing-card";
import { Pagination } from "@/components/pagination";
import { AdvancedFilters, type FilterValues } from "@/components/advanced-filters";
import { Search, Plus, X, Grid3X3, LayoutList, SlidersHorizontal } from "lucide-react";
import type { Listing, Category } from "@shared/schema";

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
  'neutered', 'pedigree', 'sortBy', 'sortOrder', 'characterTraits'
] as const;

// Parse filters from URL search params
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

// Build URL search params from filters
function buildURLFromFilters(
  filters: FilterValues, 
  categoryId?: string, 
  search?: string,
  page?: number
): string {
  const params = new URLSearchParams();
  
  if (categoryId) params.set('categoryId', categoryId);
  if (search) params.set('search', search);
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
  
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export default function ListingList() {
  const [location, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Parse URL parameters
  const searchParams = useMemo(() => new URLSearchParams(location.split('?')[1] || ''), [location]);
  const urlCategoryId = searchParams.get("categoryId");
  const urlSearch = searchParams.get("search");
  
  // Initialize filters from URL
  const [filters, setFilters] = useState<FilterValues>(() => parseFiltersFromURL(searchParams));
  const [activeSearch, setActiveSearch] = useState(urlSearch || "");

  // Parse page from URL
  const urlPage = parseInt(searchParams.get("page") || "1", 10);

  // Sync URL changes to state (for back/forward navigation)
  useEffect(() => {
    const newFilters = parseFiltersFromURL(searchParams);
    setFilters(newFilters);
    
    const newSearch = searchParams.get("search") || "";
    setSearchQuery(newSearch);
    setActiveSearch(newSearch);
    
    // Sync page from URL
    const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);
    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl);
    }
  }, [searchParams]);
  
  // Update URL when filters change (resets page to 1)
  const updateURL = useCallback((newFilters: FilterValues, newSearch?: string, page: number = 1) => {
    const url = `/ilanlar${buildURLFromFilters(newFilters, urlCategoryId || undefined, newSearch, page)}`;
    setLocation(url, { replace: false });
  }, [urlCategoryId, setLocation]);
  
  // Update URL when page changes
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    const url = `/ilanlar${buildURLFromFilters(filters, urlCategoryId || undefined, activeSearch || undefined, newPage)}`;
    setLocation(url, { replace: false });
  }, [filters, urlCategoryId, activeSearch, setLocation]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const queryParams = {
    page: currentPage,
    limit: viewMode === "list" ? 10 : 20,
    search: activeSearch || undefined,
    categoryId: urlCategoryId || undefined,
    ...filters
  };

  const { data: listingsResponse, isLoading } = useQuery<ListingsResponse>({
    queryKey: ["/api/listings", queryParams],
  });
  
  const listings = listingsResponse?.data || [];

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    setCurrentPage(1);
    updateURL(filters, searchQuery || undefined);
  }, [searchQuery, filters, updateURL]);

  const handleFilterChange = useCallback((newFilters: FilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters, activeSearch || undefined);
  }, [activeSearch, updateURL]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setActiveSearch("");
    updateURL(filters, undefined);
  }, [filters, updateURL]);

  const clearCategory = useCallback(() => {
    // Remove categoryId and navigate
    const url = `/ilanlar${buildURLFromFilters(filters, undefined, activeSearch || undefined)}`;
    setLocation(url);
  }, [filters, activeSearch, setLocation]);

  const clearAll = useCallback(() => {
    setSearchQuery("");
    setActiveSearch("");
    setFilters({});
    setCurrentPage(1);
    setLocation("/ilanlar");
  }, [setLocation]);

  const hasActiveFilters = activeSearch || urlCategoryId || Object.keys(filters).filter(k => k !== 'sortBy' && k !== 'sortOrder').length > 0;

  const selectedCategory = categories.find(c => c.id === urlCategoryId);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col gap-3 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate" data-testid="text-page-title">
                {selectedCategory ? selectedCategory.name : 'Tüm İlanlar'}
              </h1>
              {listingsResponse && (
                <p className="text-sm text-muted-foreground mt-1">
                  {listingsResponse.total.toLocaleString('tr-TR')} ilan bulundu
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {/* View Mode Toggle - Hidden on very small screens */}
              <div className="hidden sm:flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-r-none"
                  onClick={() => setViewMode("grid")}
                  data-testid="button-view-grid"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-l-none"
                  onClick={() => setViewMode("list")}
                  data-testid="button-view-list"
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
              </div>
              <Link href="/ilan-ver">
                <Button className="h-9 sm:h-10" data-testid="button-create-listing">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Ücretsiz İlan Ver</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Active Category Badge */}
          {selectedCategory && (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs gap-1 py-1">
                {selectedCategory.name}
                <X 
                  className="w-3 h-3 cursor-pointer ml-1" 
                  onClick={clearCategory}
                />
              </Badge>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Hayvan, ırk veya konum ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 sm:h-11"
                data-testid="input-search"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Button type="submit" className="h-10 sm:h-11 px-4 sm:px-6" data-testid="button-search">
              <Search className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Ara</span>
            </Button>
          </form>
        </div>

        {/* Advanced Filters */}
        <div className="mb-4 md:mb-6">
          <AdvancedFilters 
            onFilterChange={handleFilterChange} 
            currentFilters={filters}
          />
        </div>

        {/* Active Search Display */}
        {activeSearch && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Arama:</span>
            <Badge variant="outline" className="gap-1">
              "{activeSearch}"
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={clearSearch}
              />
            </Badge>
          </div>
        )}

        {/* Results Summary + Clear All */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Yükleniyor...' : `${listingsResponse?.total || 0} sonuç`}
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAll}
              className="text-xs h-8"
              data-testid="button-clear-all"
            >
              <X className="w-3 h-3 mr-1" />
              Tümünü Temizle
            </Button>
          </div>
        )}

        {/* Listings Grid/List */}
        {isLoading ? (
          <div className={
            viewMode === "grid" 
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
              : "space-y-3"
          }>
            {[...Array(viewMode === "grid" ? 10 : 5)].map((_, i) => (
              <Skeleton key={i} className={viewMode === "grid" ? "h-64 sm:h-72" : "h-32"} />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <>
            <div 
              className={
                viewMode === "grid" 
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
                  : "space-y-3"
              } 
              data-testid="grid-listings"
            >
              {listings.map((listing) => (
                <ListingCard 
                  key={listing.id} 
                  listing={listing} 
                  variant={viewMode === "list" ? "horizontal" : "vertical"}
                />
              ))}
            </div>
            
            {listingsResponse && listingsResponse.totalPages > 1 && (
              <div className="mt-6 md:mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={listingsResponse.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 md:py-16 px-4">
            <div className="max-w-md mx-auto">
              <SlidersHorizontal className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {hasActiveFilters ? "Sonuç Bulunamadı" : "Henüz İlan Yok"}
              </h3>
              <p className="text-muted-foreground text-sm mb-4" data-testid="text-no-results">
                {hasActiveFilters
                  ? "Arama kriterlerinize uygun ilan bulunamadı. Filtreleri değiştirmeyi deneyin."
                  : "Bu kategoride henüz ilan bulunmuyor."}
              </p>
              {hasActiveFilters ? (
                <Button onClick={clearAll} variant="outline" className="h-10">
                  <X className="w-4 h-4 mr-2" />
                  Filtreleri Temizle
                </Button>
              ) : (
                <Link href="/ilan-ver">
                  <Button className="h-10">
                    <Plus className="w-4 h-4 mr-2" />
                    İlk İlanı Siz Verin
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
