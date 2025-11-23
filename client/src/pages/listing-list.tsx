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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, ChevronRight, Menu, X } from "lucide-react";
import type { Listing, Category } from "@shared/schema";

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
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true); // Desktop sidebar toggle

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const queryParams = {
    page: currentPage,
    limit: 20,
    search: activeSearch || undefined,
    categoryId: selectedCategoryId || undefined,
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

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleCategorySelect = (categoryId: string, hasChildren: boolean) => {
    if (!categoryId || !hasChildren) {
      // Leaf category or "Tüm Kategoriler" → apply filter and close
      setSelectedCategoryId(categoryId || null);
      setCurrentPage(1);
      setCategoryMenuOpen(false);
    } else {
      // Parent category with children → just select it (don't close)
      setSelectedCategoryId(categoryId);
      setCurrentPage(1);
    }
  };

  const clearAll = () => {
    setSearchQuery("");
    setActiveSearch("");
    setFilters({});
    setSelectedCategoryId(null);
    setCurrentPage(1);
  };

  const hasActiveFilters = activeSearch || selectedCategoryId || Object.keys(filters).length > 0;

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const mainCategories = categories.filter(c => c.parentId === null);

  // Recursive category tree renderer
  const CategoryTreeItem = ({ category, level = 0 }: { category: Category; level?: number }) => {
    const subcategories = categories.filter(c => c.parentId === category.id);
    const isSelected = selectedCategoryId === category.id;
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = subcategories.length > 0;

    return (
      <div>
        <div className="flex gap-1">
          <Button
            variant={isSelected ? "secondary" : "ghost"}
            className={`flex-1 justify-start h-11 text-base ${level > 0 ? 'text-sm h-10' : 'font-medium'}`}
            style={{ paddingLeft: `${level * 1 + 0.75}rem` }}
            onClick={() => handleCategorySelect(category.id, hasChildren)}
            data-testid={`button-category-${category.id}`}
          >
            {category.name}
          </Button>
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className={`${level > 0 ? 'h-10 w-10' : 'h-11 w-11'} shrink-0`}
              onClick={(e) => {
                e.stopPropagation();
                toggleCategoryExpand(category.id);
              }}
              data-testid={`button-expand-${category.id}`}
            >
              <ChevronRight 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </Button>
          )}
        </div>
        
        {/* Recursive subcategories */}
        {isExpanded && subcategories.length > 0 && (
          <div className="space-y-1">
            {subcategories.map((sub) => (
              <CategoryTreeItem key={sub.id} category={sub} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* DESKTOP SIDEBAR - AÇILIR KAPANIR */}
        <aside 
          className={`hidden md:block border-r bg-card transition-all duration-300 ${
            sidebarOpen ? 'w-80' : 'w-0'
          } overflow-hidden`}
        >
          <div className="h-screen sticky top-0">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Kategoriler</h2>
            </div>
            <ScrollArea className="h-[calc(100vh-5rem)]">
              <div className="p-4 space-y-1">
                {/* Tüm Kategoriler */}
                <Button
                  variant={!selectedCategoryId ? "secondary" : "ghost"}
                  className="w-full justify-start h-11 text-base"
                  onClick={() => handleCategorySelect("", false)}
                  data-testid="button-all-categories-desktop"
                >
                  Tüm Kategoriler
                </Button>

                {/* Recursive Category Tree */}
                {mainCategories.map((category) => (
                  <CategoryTreeItem key={category.id} category={category} level={0} />
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0">
          <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
            {/* Header with Toggle Button */}
            <div className="flex items-center gap-4 mb-6 md:mb-8">
              {/* Mobile Hamburger Menu - Opens Categories */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCategoryMenuOpen(true)}
                className="md:hidden h-11 w-11 shrink-0"
                data-testid="button-hamburger-menu"
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Desktop Sidebar Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden md:flex h-11 w-11 shrink-0"
                data-testid="button-toggle-sidebar"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>

              <div className="flex-1 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
            </div>

            {/* Mobile Category Sheet (controlled by hamburger menu) */}
            <Sheet open={categoryMenuOpen} onOpenChange={setCategoryMenuOpen} modal={true}>
              <SheetContent side="left" className="w-full sm:w-96 overflow-y-auto p-0">
                <SheetHeader className="p-6 pb-4">
                  <SheetTitle>Kategoriler</SheetTitle>
                  <SheetDescription className="sr-only">
                    İlanları kategorilere göre filtrele
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-8rem)]">
                  <div className="px-6 pb-6 space-y-1">
                    {/* Tüm Kategoriler */}
                    <Button
                      variant={!selectedCategoryId ? "secondary" : "ghost"}
                      className="w-full justify-start h-11 text-base"
                      onClick={() => handleCategorySelect("", false)}
                      data-testid="button-all-categories"
                    >
                      Tüm Kategoriler
                    </Button>

                    {/* Recursive Category Tree */}
                    {mainCategories.map((category) => (
                      <CategoryTreeItem key={category.id} category={category} level={0} />
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

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
                {selectedCategory && (
                  <Badge variant="secondary" className="text-xs">
                    Kategori: {selectedCategory.name}
                  </Badge>
                )}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-80" />
                ))}
              </div>
            ) : listings.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6" data-testid="grid-listings">
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
        </main>
      </div>
    </div>
  );
}
