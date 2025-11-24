import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Store, Building2, MapPin, Star, BadgeCheck, Filter, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface StoreListItem {
  id: string;
  slug: string;
  displayName: string;
  storeType: string;
  categoryId: string | null;
  summary: string;
  logo: string | null;
  banner: string | null;
  primaryColor: string;
  city: string | null;
  rating: string;
  reviewCount: number;
  totalListings: number;
  verifiedAt: string | null;
  createdAt: string;
}

interface StoreCategory {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  icon: string;
  depth: number;
  order: number;
  children?: StoreCategory[];
}

const storeTypeLabels: Record<string, string> = {
  petshop: "Pet Shop",
  feed_producer: "Yem & Mama Üreticisi",
  farm_equipment: "Çiftlik Ekipmanı",
  veterinary: "Veteriner Kliniği",
  transport: "Nakliye & Lojistik",
  beekeeping: "Arıcılık Malzemeleri",
  horse_riding: "At & Binicilik",
  exotic: "Egzotik Hayvanlar",
  grooming: "Pet Kuaförü",
  other: "Diğer",
};

export default function StoresList() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Fetch hierarchical store categories
  const { data: categories = [] } = useQuery<StoreCategory[]>({
    queryKey: ["/api/store-categories"],
  });

  // Fetch stores (either all or by category)
  const { data: stores = [], isLoading } = useQuery<StoreListItem[]>({
    queryKey: selectedCategoryId 
      ? ["/api/store-categories", selectedCategoryId, "stores"]
      : ["/api/stores", { type: typeFilter !== "all" ? typeFilter : undefined, search: search || undefined }],
  });

  const filteredStores = stores.filter(store => {
    if (cityFilter !== "all" && store.city !== cityFilter) return false;
    return true;
  });

  const cities = Array.from(new Set(stores.map(s => s.city).filter(Boolean)));

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategory = (category: StoreCategory) => {
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategoryId === category.id;
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div key={category.id} className={category.depth === 0 ? "mb-2" : "ml-4"}>
        <Button
          variant={isSelected ? "default" : "ghost"}
          className="w-full justify-start gap-2 hover-elevate active-elevate-2"
          onClick={() => {
            if (hasChildren) {
              toggleCategory(category.id);
            }
            setSelectedCategoryId(category.id);
          }}
          data-testid={`button-category-${category.slug}`}
        >
          {hasChildren && (
            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          )}
          <Store className="w-4 h-4" />
          <span className="font-medium">{category.name}</span>
        </Button>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {category.children!.map(child => renderCategory(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Mağazalar</h1>
          </div>
          <p className="text-lg opacity-90">
            Güvenilir satıcılarımızı keşfedin. Her mağaza profesyonel hizmet sunmak için hazır!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Category Navigation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Mağaza Kategorileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Button
                variant={selectedCategoryId === null ? "default" : "ghost"}
                className="w-full justify-start hover-elevate active-elevate-2"
                onClick={() => setSelectedCategoryId(null)}
                data-testid="button-category-all"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Tüm Mağazalar
              </Button>
            </div>
            <div className="space-y-1">
              {categories.map(category => renderCategory(category))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Mağaza Adı</label>
                <Input
                  placeholder="Mağaza ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-store-search"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Mağaza Tipi</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger data-testid="select-store-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {Object.entries(storeTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Şehir</label>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger data-testid="select-city">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Şehirler</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city!}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stores Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <Skeleton className="h-40 w-full rounded-t-lg" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="text-center py-16">
            <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Mağaza bulunamadı</h3>
            <p className="text-muted-foreground">Farklı filtreler deneyebilirsiniz</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => (
              <Link key={store.id} href={`/magaza/${store.slug}`}>
                <Card className="hover-elevate active-elevate-2 cursor-pointer h-full">
                  <CardContent className="p-0">
                    {/* Banner */}
                    <div 
                      className="h-40 rounded-t-lg relative overflow-hidden"
                      style={{ backgroundColor: store.banner ? undefined : store.primaryColor }}
                    >
                      {store.banner && (
                        <img src={store.banner} alt={store.displayName} className="w-full h-full object-cover" />
                      )}
                      {/* Logo Overlay */}
                      <div className="absolute bottom-4 left-4">
                        <div 
                          className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-lg"
                        >
                          {store.logo ? (
                            <img src={store.logo} alt="" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <Building2 className="w-8 h-8" style={{ color: store.primaryColor }} />
                          )}
                        </div>
                      </div>
                      {store.verifiedAt && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-white/90 dark:bg-gray-800/90 text-primary">
                            <BadgeCheck className="w-4 h-4 mr-1" />
                            Onaylı
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-lg">{store.displayName}</h3>
                      </div>
                      
                      <Badge variant="secondary" className="mb-3">
                        {storeTypeLabels[store.storeType]}
                      </Badge>

                      {store.summary && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {store.summary}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {store.city && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {store.city}
                          </div>
                        )}
                        {parseFloat(store.rating) > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {parseFloat(store.rating).toFixed(1)} ({store.reviewCount})
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium">
                          {store.totalListings} aktif ilan
                        </p>
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
  );
}
