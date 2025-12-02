import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  MapPin, 
  Eye, 
  Heart,
  Package
} from "lucide-react";

interface CategoryStatsData {
  categorySlug: string;
  categoryName: string;
  stats: {
    totalListings: number;
    avgPrice: string;
    minPrice: string;
    maxPrice: string;
    medianPrice: string;
    totalViews: number;
    totalFavorites: number;
  };
  cityDistribution: Array<{ city: string; count: number }>;
  priceRanges: Array<{ range: string; count: number }>;
  listingsByDate: Array<{ date: string; count: number }>;
}

interface CategoryStatsProps {
  categorySlug: string;
  compact?: boolean;
}

export function CategoryStats({ categorySlug, compact = false }: CategoryStatsProps) {
  const { data, isLoading } = useQuery<CategoryStatsData>({
    queryKey: [`/api/category-stats/${categorySlug}`],
    enabled: !!categorySlug,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          {!compact && <Skeleton className="h-40 w-full" />}
        </CardContent>
      </Card>
    );
  }

  if (!data || data.stats.totalListings === 0) {
    return null;
  }

  const formatPrice = (price: string | number) => {
    return parseFloat(String(price)).toLocaleString('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          {data.categoryName} - Fiyat İstatistikleri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {formatPrice(data.stats.avgPrice)} ₺
            </div>
            <div className="text-xs text-muted-foreground">Ortalama Fiyat</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(data.stats.minPrice)} ₺
            </div>
            <div className="text-xs text-muted-foreground">En Düşük</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {formatPrice(data.stats.maxPrice)} ₺
            </div>
            <div className="text-xs text-muted-foreground">En Yüksek</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">
              {formatPrice(data.stats.medianPrice)} ₺
            </div>
            <div className="text-xs text-muted-foreground">Medyan</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="font-semibold">{data.stats.totalListings}</div>
              <div className="text-xs text-muted-foreground">İlan</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="font-semibold">{data.stats.totalViews.toLocaleString('tr-TR')}</div>
              <div className="text-xs text-muted-foreground">Görüntüleme</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="font-semibold">{data.stats.totalFavorites.toLocaleString('tr-TR')}</div>
              <div className="text-xs text-muted-foreground">Favori</div>
            </div>
          </div>
        </div>

        {!compact && (
          <>
            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-medium text-sm">Fiyat Dağılımı</h4>
              {data.priceRanges.map((range) => {
                const total = data.priceRanges.reduce((sum, r) => sum + Number(r.count), 0);
                const percentage = total > 0 ? (Number(range.count) / total) * 100 : 0;
                return (
                  <div key={range.range} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{range.range} TL</span>
                      <span className="text-muted-foreground">{range.count} ilan</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>

            {data.cityDistribution.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-medium text-sm flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  En Çok İlan Verilen Şehirler
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.cityDistribution.slice(0, 6).map((city) => (
                    <div
                      key={city.city}
                      className="px-3 py-1 bg-muted rounded-full text-sm"
                    >
                      {city.city} ({city.count})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface MarketOverviewProps {
  className?: string;
}

export function MarketOverview({ className }: MarketOverviewProps) {
  const { data, isLoading } = useQuery<{
    overview: {
      totalListings: number;
      activeListings: number;
      avgPrice: string;
      totalViews: number;
    };
    topCategories: Array<{
      categoryId: string;
      categoryName: string | null;
      categorySlug: string | null;
      count: number;
      avgPrice: string;
    }>;
    recentActivity: Array<{ date: string; count: number }>;
  }>({
    queryKey: ["/api/market-stats"],
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const formatPrice = (price: string | number) => {
    return parseFloat(String(price)).toLocaleString('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Pazar İstatistikleri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{data.overview.totalListings}</div>
            <div className="text-xs text-muted-foreground">Toplam İlan</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{data.overview.activeListings}</div>
            <div className="text-xs text-muted-foreground">Aktif İlan</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {formatPrice(data.overview.avgPrice)} ₺
            </div>
            <div className="text-xs text-muted-foreground">Ort. Fiyat</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{data.overview.totalViews.toLocaleString('tr-TR')}</div>
            <div className="text-xs text-muted-foreground">Görüntüleme</div>
          </div>
        </div>

        {data.topCategories.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium text-sm">En Popüler Kategoriler</h4>
            <div className="space-y-2">
              {data.topCategories.slice(0, 5).map((cat, index) => (
                <div
                  key={cat.categoryId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    {cat.categoryName || "Bilinmeyen"}
                  </span>
                  <span className="text-muted-foreground">
                    {cat.count} ilan • {formatPrice(cat.avgPrice)} ₺
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
