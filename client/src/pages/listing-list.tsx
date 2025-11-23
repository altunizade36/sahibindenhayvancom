import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard } from "@/components/listing-card";
import { Pagination } from "@/components/pagination";
import { AdvancedFilters, type FilterValues } from "@/components/advanced-filters";
import { Search, Plus } from "lucide-react";
import type { Listing } from "@shared/schema";

interface ListingsResponse {
  data: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ListingList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [filters, setFilters] = useState<FilterValues>({});

  const queryParams = {
    page: currentPage,
    limit: 20,
    search: activeSearch || undefined,
    ...filters
  };

  const { data: listingsResponse, isLoading } = useQuery<ListingsResponse>({
    queryKey: ["/api/listings", queryParams],
  });
  
  const listings = listingsResponse?.data || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const clearAll = () => {
    setSearchQuery("");
    setActiveSearch("");
    setFilters({});
    setCurrentPage(1);
  };

  const hasActiveFilters = activeSearch || Object.keys(filters).length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold" data-testid="text-page-title">
              Tüm İlanlar
            </h1>
            {listingsResponse && (
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                {listingsResponse.total} ilan bulundu
              </p>
            )}
          </div>
          <Link href="/ilan-ver">
            <Button className="w-full sm:w-auto h-11" data-testid="button-create-listing">
              <Plus className="w-4 h-4 mr-2" />
              İlan Ver
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-4 md:mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="search"
              placeholder="İlan ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-11"
              data-testid="input-search"
            />
            <Button type="submit" className="h-11" data-testid="button-search">
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

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-6">
            <span className="text-xs md:text-sm text-muted-foreground">Aktif Filtreler:</span>
            {activeSearch && (
              <Badge variant="secondary" className="text-xs">Arama: {activeSearch}</Badge>
            )}
            {Object.entries(filters).map(([key, value]) => 
              value && (
                <Badge key={key} variant="secondary" className="text-xs">
                  {key}: {value}
                </Badge>
              )
            )}
            <Button variant="ghost" size="sm" onClick={clearAll} data-testid="button-clear-all">
              Tümünü Temizle
            </Button>
          </div>
        )}

        {/* Listings Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" data-testid="grid-listings">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            
            {listingsResponse && listingsResponse.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={listingsResponse.totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        ) : (
          <div className="text-center py-12 md:py-16">
            <p className="text-muted-foreground text-base md:text-lg mb-4" data-testid="text-no-results">
              {hasActiveFilters
                ? "Arama kriterlerinize uygun ilan bulunamadı"
                : "Henüz ilan yok"}
            </p>
            {hasActiveFilters ? (
              <Button onClick={clearAll} variant="outline" className="h-11">
                Filtreleri Temizle
              </Button>
            ) : (
              <Link href="/ilan-ver">
                <Button className="h-11">İlk İlanı Siz Verin</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
