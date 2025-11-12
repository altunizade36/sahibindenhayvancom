import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, MapPin, DollarSign, SlidersHorizontal, X } from "lucide-react";
import type { Listing, Category, Location } from "@shared/schema";

type ListingWithDetails = Listing & {
  category?: Category;
  location?: Location;
};

export default function ListingList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "price-low" | "price-high">("newest");
  const [showFilters, setShowFilters] = useState(true);

  const { data: listingsResponse, isLoading } = useQuery<{ data: ListingWithDetails[]; total: number }>({
    queryKey: ["/api/listings"],
  });
  
  const listings = listingsResponse?.data || [];

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const filteredAndSortedListings = useMemo(() => {
    if (!listings || listings.length === 0) return [];

    let filtered = [...listings];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (listing) =>
          listing.title.toLowerCase().includes(query) ||
          listing.description.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((listing) => listing.categoryId === selectedCategory);
    }

    if (selectedLocation) {
      filtered = filtered.filter((listing) => listing.locationId === selectedLocation);
    }

    filtered = filtered.filter((listing) => {
      const price = parseFloat(listing.price as string);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "price-low":
          return parseFloat(a.price as string) - parseFloat(b.price as string);
        case "price-high":
          return parseFloat(b.price as string) - parseFloat(a.price as string);
        default:
          return 0;
      }
    });

    return filtered;
  }, [listings, searchQuery, selectedCategory, selectedLocation, priceRange, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedLocation("");
    setPriceRange([0, 100000]);
    setSortBy("newest");
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategory ||
    selectedLocation ||
    priceRange[0] !== 0 ||
    priceRange[1] !== 100000;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="flex gap-6">
            <Skeleton className="w-64 h-[600px]" />
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="h-80" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Tüm İlanlar</h1>
            <p className="text-muted-foreground" data-testid="text-listing-count">
              {filteredAndSortedListings.length} ilan bulundu
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            {showFilters ? "Filtreleri Gizle" : "Filtreleri Göster"}
          </Button>
        </div>

        <div className="flex gap-6">
          {showFilters && (
            <aside className="w-64 flex-shrink-0">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Filtreler</h3>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        data-testid="button-clear-filters"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Temizle
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ara</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="İlan başlığı veya açıklama..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                        data-testid="input-search"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Kategori</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Tüm Kategoriler" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tüm Kategoriler</SelectItem>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Konum</label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger data-testid="select-location">
                        <SelectValue placeholder="Tüm Konumlar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tüm Konumlar</SelectItem>
                        {locations?.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">
                      Fiyat Aralığı: {priceRange[0]}₺ - {priceRange[1] === 100000 ? "100,000₺+" : `${priceRange[1]}₺`}
                    </label>
                    <Slider
                      min={0}
                      max={100000}
                      step={1000}
                      value={priceRange}
                      onValueChange={(value) => setPriceRange(value as [number, number])}
                      data-testid="slider-price"
                    />
                  </div>
                </CardContent>
              </Card>
            </aside>
          )}

          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                {selectedCategory && (
                  <Badge variant="secondary" data-testid="badge-active-category">
                    {categories?.find((c) => c.id === selectedCategory)?.name}
                    <button
                      onClick={() => setSelectedCategory("")}
                      className="ml-2 hover:text-destructive"
                      data-testid="button-remove-category-filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {selectedLocation && (
                  <Badge variant="secondary" data-testid="badge-active-location">
                    <MapPin className="w-3 h-3 mr-1" />
                    {locations?.find((l) => l.id === selectedLocation)?.name}
                    <button
                      onClick={() => setSelectedLocation("")}
                      className="ml-2 hover:text-destructive"
                      data-testid="button-remove-location-filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-48" data-testid="select-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">En Yeni</SelectItem>
                  <SelectItem value="oldest">En Eski</SelectItem>
                  <SelectItem value="price-low">Fiyat (Düşükten Yükseğe)</SelectItem>
                  <SelectItem value="price-high">Fiyat (Yüksekten Düşüğe)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredAndSortedListings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">İlan Bulunamadı</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Arama kriterlerinize uygun ilan bulunamadı
                      </p>
                      {hasActiveFilters && (
                        <Button variant="outline" onClick={clearFilters} data-testid="button-reset-filters">
                          Filtreleri Temizle
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedListings.map((listing) => (
                  <Link key={listing.id} href={`/ilan/${listing.id}`}>
                    <Card className="hover-elevate cursor-pointer overflow-hidden" data-testid={`card-listing-${listing.id}`}>
                      <div className="aspect-video bg-muted relative">
                        {listing.images && listing.images.length > 0 ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl">🐾</span>
                          </div>
                        )}
                        {listing.isPremium && (
                          <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-600">
                            Premium
                          </Badge>
                        )}
                        {listing.isUrgent && (
                          <Badge className="absolute top-2 right-2 bg-red-500 hover:bg-red-600">
                            Acil
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-1" data-testid={`text-title-${listing.id}`}>
                          {listing.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {listing.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-lg font-bold text-primary" data-testid={`text-price-${listing.id}`}>
                            <DollarSign className="w-5 h-5" />
                            {parseFloat(listing.price as string).toLocaleString("tr-TR")}₺
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`text-location-${listing.id}`}>
                            <MapPin className="w-3 h-3" />
                            <span>{listing.location?.name || "Konum belirtilmemiş"}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
