import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Store, Building2, MapPin, Star, BadgeCheck, Filter, ChevronDown, ChevronRight, Plus, Loader2, Package, Users, UserCheck, MailCheck, ClipboardCheck, ShieldCheck, Megaphone, BarChart3, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StoreListItem {
  id: string;
  slug: string;
  displayName: string;
  storeType: string;
  categoryId: string | null;
  summary: string;
  logo: string | null;
  banner: string | null;
  bannerTemplate: string | null;
  primaryColor: string;
  city: string | null;
  rating: string;
  reviewCount: number;
  totalListings: number;
  followerCount?: number;
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
  breeding: "Yetiştiricilik",
  other: "Diğer",
};

const bannerTemplates: Record<string, string> = {
  'gradient-blue': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'gradient-green': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  'gradient-orange': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'gradient-dark': 'linear-gradient(135deg, #232526 0%, #414345 100%)',
  'gradient-sunset': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'gradient-ocean': 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
};

function StoreCard({ store }: { store: StoreListItem }) {
  const getBannerStyle = () => {
    if (store.banner) {
      return { backgroundImage: `url(${store.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    }
    if (store.bannerTemplate && bannerTemplates[store.bannerTemplate]) {
      return { background: bannerTemplates[store.bannerTemplate] };
    }
    return { backgroundColor: store.primaryColor || '#0066CC' };
  };

  return (
    <Link href={`/magaza/${store.slug}`}>
      <Card className="hover-elevate active-elevate-2 cursor-pointer h-full overflow-hidden group">
        <div className="h-28 sm:h-32 relative overflow-hidden" style={getBannerStyle()}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <div className="absolute bottom-3 left-3 z-10">
            <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-[3px] border-background shadow-lg">
              <AvatarImage src={store.logo || undefined} alt={store.displayName} />
              <AvatarFallback 
                style={{ backgroundColor: store.primaryColor || '#0066CC' }}
                className="text-white text-lg font-bold"
              >
                {store.displayName?.[0]?.toUpperCase() || 'M'}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {store.verifiedAt && (
            <Badge className="absolute top-3 right-3 bg-white/95 dark:bg-gray-800/95 text-primary shadow-sm">
              <BadgeCheck className="w-3.5 h-3.5 mr-1" />
              Onaylı
            </Badge>
          )}
        </div>

        <CardContent className="p-4 pt-3">
          <h3 className="font-bold text-base sm:text-lg mb-1 truncate group-hover:text-primary transition-colors" data-testid={`text-store-name-${store.id}`}>
            {store.displayName}
          </h3>
          
          <Badge variant="secondary" className="mb-2 text-xs">
            {storeTypeLabels[store.storeType] || store.storeType}
          </Badge>

          {store.summary ? (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 min-h-[2.5rem]">
              {store.summary}
            </p>
          ) : (
            <div className="mb-3 min-h-[2.5rem]" />
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {store.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {store.city}
              </span>
            )}
            {parseFloat(store.rating) > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                {parseFloat(store.rating).toFixed(1)} ({store.reviewCount})
              </span>
            )}
            {store.followerCount !== undefined && store.followerCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {store.followerCount}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <span className="flex items-center gap-1.5 text-sm">
              <Package className="w-4 h-4 text-primary" />
              <span className="font-medium">{store.totalListings || 0}</span>
              <span className="text-muted-foreground">ilan</span>
            </span>
            <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
              Görüntüle
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function StoreCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <Skeleton className="h-28 sm:h-32 w-full" />
      <CardContent className="p-4 pt-3 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-20" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-4 w-1/2" />
        <div className="pt-3 border-t">
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function StoresList() {
  // useUser() kaldirildi: var olmayan /api/auth/me ucunu cagiriyordu ve
  // giris yapmis kullanici bile "oturum yok" gorunuyordu.
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: categories = [] } = useQuery<StoreCategory[]>({
    queryKey: ["/api/store-categories"],
  });

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (typeFilter !== "all") params.type = typeFilter;
    if (debouncedSearch) params.search = debouncedSearch;
    return params;
  }, [typeFilter, debouncedSearch]);

  const { data: stores = [], isLoading, isFetching } = useQuery<StoreListItem[]>({
    queryKey: selectedCategoryId 
      ? ["/api/store-categories", selectedCategoryId, "stores", queryParams]
      : ["/api/stores", queryParams],
    queryFn: async () => {
      let url: string;
      if (selectedCategoryId) {
        const params = new URLSearchParams();
        if (typeFilter !== "all") params.set("type", typeFilter);
        if (debouncedSearch) params.set("search", debouncedSearch);
        const queryString = params.toString();
        url = `/api/store-categories/${selectedCategoryId}/stores${queryString ? `?${queryString}` : ""}`;
      } else {
        const params = new URLSearchParams();
        if (typeFilter !== "all") params.set("type", typeFilter);
        if (debouncedSearch) params.set("search", debouncedSearch);
        const queryString = params.toString();
        url = `/api/stores${queryString ? `?${queryString}` : ""}`;
      }
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Mağazalar yüklenemedi");
      return response.json();
    },
  });

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      if (cityFilter !== "all" && store.city !== cityFilter) return false;
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesName = store.displayName?.toLowerCase().includes(searchLower) || false;
        const matchesSummary = store.summary?.toLowerCase().includes(searchLower) || false;
        const matchesCity = store.city?.toLowerCase().includes(searchLower) || false;
        if (!matchesName && !matchesSummary && !matchesCity) return false;
      }
      if (typeFilter !== "all" && store.storeType !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [stores, cityFilter, debouncedSearch, typeFilter]);

  const cities = useMemo(() => {
    return Array.from(new Set(stores.map(s => s.city).filter(Boolean))) as string[];
  }, [stores]);

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
      <div key={category.id} className={category.depth === 0 ? "mb-1" : "ml-4"}>
        <Button
          variant={isSelected ? "default" : "ghost"}
          size="sm"
          className="w-full justify-start gap-2 h-9"
          onClick={() => {
            if (hasChildren) toggleCategory(category.id);
            setSelectedCategoryId(category.id);
          }}
          data-testid={`button-category-${category.slug}`}
        >
          {hasChildren && (
            isExpanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />
          )}
          {!hasChildren && <div className="w-4" />}
          <Store className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{category.name}</span>
        </Button>
        {hasChildren && isExpanded && (
          <div className="mt-0.5">
            {category.children!.map(child => renderCategory(child))}
          </div>
        )}
      </div>
    );
  };

  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    const findCategory = (cats: StoreCategory[]): StoreCategory | null => {
      for (const cat of cats) {
        if (cat.id === selectedCategoryId) return cat;
        if (cat.children) {
          const found = findCategory(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findCategory(categories);
  }, [selectedCategoryId, categories]);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-10 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-3">
            <Building2 className="w-8 h-8 sm:w-10 sm:h-10" />
            <h1 className="text-2xl sm:text-4xl font-bold">Mağazalar</h1>
          </div>
          <p className="text-base sm:text-lg opacity-90 max-w-2xl">
            Güvenilir satıcılarımızı keşfedin. Her mağaza profesyonel hizmet sunmak için hazır!
          </p>
          <Link href="/panel/magazam">
            <Button variant="secondary" className="mt-4 w-full sm:w-auto h-11" data-testid="button-open-store-header">
              <Plus className="w-4 h-4 mr-2" />
              {user ? "Mağaza Aç" : "Ücretsiz Mağaza Aç"}
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Kategoriler
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  variant={selectedCategoryId === null ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start gap-2 h-9 mb-1"
                  onClick={() => setSelectedCategoryId(null)}
                  data-testid="button-category-all"
                >
                  <Building2 className="w-4 h-4" />
                  Tüm Mağazalar
                </Button>
                <div className="max-h-64 overflow-y-auto">
                  {categories.map(category => renderCategory(category))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtreler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Ara</label>
                  <div className="relative">
                    <Input
                      placeholder="Mağaza adı..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      data-testid="input-store-search"
                      className="pr-8"
                    />
                    {isFetching && (
                      <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Tip</label>
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
                  <label className="text-sm font-medium mb-1.5 block">Şehir</label>
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger data-testid="select-city">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(debouncedSearch || typeFilter !== 'all' || cityFilter !== 'all' || selectedCategoryId) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setSearch('');
                      setDebouncedSearch('');
                      setTypeFilter('all');
                      setCityFilter('all');
                      setSelectedCategoryId(null);
                    }}
                  >
                    Filtreleri Temizle
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {selectedCategory && (
              <div className="mb-4">
                <h2 className="text-xl font-bold">{selectedCategory.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredStores.length} mağaza bulundu
                </p>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <StoreCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredStores.length === 0 ? (
              <Card className="p-8 sm:p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Mağaza bulunamadı</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {debouncedSearch || typeFilter !== "all" || cityFilter !== "all" || selectedCategoryId
                    ? "Arama kriterlerinize uygun mağaza bulunamadı. Farklı filtreler deneyebilirsiniz."
                    : "Henüz kayıtlı mağaza bulunmuyor."}
                </p>
                <Link href="/panel/magazam">
                  <Button className="w-full sm:w-auto h-11" data-testid="button-open-store">
                    <Plus className="w-4 h-4 mr-2" />
                    İlk Mağazayı Sen Aç
                  </Button>
                </Link>
              </Card>
            ) : (
              <>
                {!selectedCategory && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {filteredStores.length} mağaza bulundu
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {filteredStores.map((store) => (
                    <StoreCard key={store.id} store={store} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <MagazaRehberi />
    </div>
  );
}

/**
 * Mağaza açmanın kurallarını ve adımlarını anlatan bölüm.
 *
 * Sayfada mağaza açmaya davet eden bir düğme vardı ama mağazanın ne olduğunu,
 * kimin açabileceğini ve açtıktan sonra ne olacağını (onay süreci) söyleyen
 * hiçbir şey yoktu. Ziyaretçi düğmeye basıp sihirbazın ortasında kalıyordu.
 */
function MagazaRehberi() {
  const kimler = [
    { ikon: UserCheck, metin: "Sitede ücretsiz hesabı olan herkes — bireysel satıcı, yetiştirici, petshop, veteriner, kuluçka ve ekipman satıcısı." },
    { ikon: MailCheck, metin: "E-posta adresi doğrulanmış olmalı. Doğrulama bağlantısı kayıt sırasında gönderilir." },
    { ikon: Building2, metin: "Her hesap yalnızca bir mağaza açabilir." },
  ];

  const neler = [
    { ikon: Package, metin: "Tüm ilanlarınız tek bir kurumsal sayfada toplanır." },
    { ikon: Megaphone, metin: "Logo, kapak görseli ve mağaza renkleriyle kendi kimliğinizi kurarsınız." },
    { ikon: Users, metin: "Ziyaretçiler mağazanızı takip eder, yeni ilanlarınızdan haberdar olur." },
    { ikon: MessageSquare, metin: "Alıcılar doğrudan mağaza sayfanızdan size ulaşır, yorum ve puan bırakır." },
    { ikon: BarChart3, metin: "Görüntülenme ve takipçi istatistiklerinizi panelden izlersiniz." },
  ];

  const adimlar = [
    { baslik: "Bilgileri doldurun", metin: "Mağaza adı, kategori, şehir ve iletişim bilgilerinizi girin. 3 adımlık sihirbaz birkaç dakika sürer." },
    { baslik: "Onaya gönderin", metin: "Kaydettiğinizde başvurunuz otomatik olarak inceleme sırasına girer." },
    { baslik: "Yayına girin", metin: "Onaylandığında bildirim alırsınız ve mağazanız bu sayfada listelenir." },
  ];

  return (
    <section className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-10 sm:py-14">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Mağaza açmak hakkında</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Mağaza, ilanlarınızı tek bir profesyonel sayfada toplayan ücretsiz satıcı profilidir.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                Kimler açabilir?
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {kimler.map((m, i) => (
                <div key={i} className="flex gap-2.5">
                  <m.ikon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.metin}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                Neler kazanırsınız?
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {neler.map((m, i) => (
                <div key={i} className="flex gap-2.5">
                  <m.ikon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.metin}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                Nasıl açılır?
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {adimlar.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{a.baslik}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{a.metin}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button asChild size="lg" className="w-full sm:w-auto h-12" data-testid="button-open-store-guide">
            <Link href="/panel/magazam">
              <Plus className="w-4 h-4 mr-2" />
              Ücretsiz Mağaza Aç
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Mağaza açmak ve kullanmak ücretsizdir.
          </p>
        </div>
      </div>
    </section>
  );
}
