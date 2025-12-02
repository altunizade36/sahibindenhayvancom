import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Eye,
  Heart,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ChevronLeft,
  Activity,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

interface SellerAnalytics {
  overview: {
    totalListings: number;
    activeListings: number;
    pendingListings: number;
    soldListings: number;
    totalViews: number;
    totalFavorites: number;
    totalMessages: number;
    avgViews: number;
    recentListings: number;
    viewTrend: string;
  };
  statusBreakdown: {
    active: number;
    pending: number;
    sold: number;
    expired: number;
    draft: number;
  };
  topListings: Array<{
    id: string;
    title: string;
    views: number;
    price: number;
    images: string[];
    status: string;
  }>;
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  color = "primary",
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: string;
  description?: string;
  color?: "primary" | "green" | "blue" | "orange" | "purple";
}) {
  const colorClasses = {
    primary: "text-primary bg-primary/10",
    green: "text-green-600 bg-green-100 dark:bg-green-900/30",
    blue: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    orange: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
    purple: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
  };

  const isPositiveTrend = trend?.startsWith('+');

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${isPositiveTrend ? 'text-green-600' : 'text-red-500'}`}>
                {isPositiveTrend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TopListingCard({ listing }: { listing: SellerAnalytics['topListings'][0] }) {
  const imageUrl = listing.images?.[0] || '/placeholder-animal.jpg';
  
  return (
    <Link href={`/ilan/${listing.id}`}>
      <Card className="hover-elevate cursor-pointer">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img 
                src={imageUrl} 
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate" data-testid={`listing-title-${listing.id}`}>
                {listing.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {listing.price?.toLocaleString('tr-TR')} TL
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span data-testid={`listing-views-${listing.id}`}>{listing.views}</span>
              </div>
              <p className="text-xs text-muted-foreground">görüntülenme</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatusBreakdownChart({ breakdown }: { breakdown: SellerAnalytics['statusBreakdown'] }) {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  
  const statusColors = {
    active: { bg: 'bg-green-500', label: 'Aktif', icon: CheckCircle2 },
    pending: { bg: 'bg-yellow-500', label: 'Beklemede', icon: Clock },
    sold: { bg: 'bg-blue-500', label: 'Satıldı', icon: Target },
    expired: { bg: 'bg-gray-400', label: 'Süresi Doldu', icon: AlertCircle },
    draft: { bg: 'bg-purple-500', label: 'Taslak', icon: Package },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Activity className="w-5 h-5" />
          İlan Durumu Dağılımı
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Henüz ilan bulunmuyor
          </p>
        ) : (
          <>
            <div className="flex h-4 rounded-full overflow-hidden bg-muted">
              {Object.entries(breakdown).map(([status, count]) => {
                if (count === 0) return null;
                const percentage = (count / total) * 100;
                return (
                  <div
                    key={status}
                    className={`${statusColors[status as keyof typeof statusColors].bg}`}
                    style={{ width: `${percentage}%` }}
                    title={`${statusColors[status as keyof typeof statusColors].label}: ${count}`}
                  />
                );
              })}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(breakdown).map(([status, count]) => {
                const config = statusColors[status as keyof typeof statusColors];
                const Icon = config.icon;
                return (
                  <div key={status} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.bg}`} />
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {config.label}: <strong>{count}</strong>
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function SellerAnalytics() {
  const { user } = useAuth();
  
  const { data: analytics, isLoading, error } = useQuery<SellerAnalytics>({
    queryKey: ["/api/seller/analytics"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Giriş Gerekli</h2>
            <p className="text-muted-foreground mb-6">
              Analizlerinizi görmek için giriş yapmalısınız
            </p>
            <Link href="/giris">
              <Button data-testid="button-login">Giriş Yap</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/panel">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-page-title">
              Satıcı Analizleri
            </h1>
            <p className="text-muted-foreground text-sm">
              İlanlarınızın performansını takip edin
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-40" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-40" />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-bold mb-2">Bir Hata Oluştu</h2>
              <p className="text-muted-foreground">
                Analiz verileri yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.
              </p>
            </CardContent>
          </Card>
        ) : analytics ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Toplam Görüntülenme"
                value={analytics.overview.totalViews.toLocaleString('tr-TR')}
                icon={Eye}
                trend={analytics.overview.viewTrend}
                color="blue"
              />
              <StatCard
                title="Favorilere Eklenen"
                value={analytics.overview.totalFavorites}
                icon={Heart}
                description="Kullanıcılar tarafından"
                color="orange"
              />
              <StatCard
                title="Gelen Mesajlar"
                value={analytics.overview.totalMessages}
                icon={MessageSquare}
                description="Toplam mesaj"
                color="green"
              />
              <StatCard
                title="Ortalama Görüntülenme"
                value={analytics.overview.avgViews}
                icon={BarChart3}
                description="İlan başına"
                color="purple"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Package className="w-8 h-8 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold" data-testid="stat-total-listings">
                    {analytics.overview.totalListings}
                  </p>
                  <p className="text-xs text-muted-foreground">Toplam İlan</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-600" data-testid="stat-active-listings">
                    {analytics.overview.activeListings}
                  </p>
                  <p className="text-xs text-muted-foreground">Aktif İlan</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
                  <p className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-listings">
                    {analytics.overview.pendingListings}
                  </p>
                  <p className="text-xs text-muted-foreground">Beklemede</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Target className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-blue-600" data-testid="stat-sold-listings">
                    {analytics.overview.soldListings}
                  </p>
                  <p className="text-xs text-muted-foreground">Satıldı</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <StatusBreakdownChart breakdown={analytics.statusBreakdown} />

              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    En Çok Görüntülenen İlanlar
                  </CardTitle>
                  <CardDescription>
                    Performansı en yüksek 5 ilanınız
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analytics.topListings.length === 0 ? (
                    <div className="text-center py-6">
                      <Package className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Henüz aktif ilanınız bulunmuyor
                      </p>
                      <Link href="/ilan-ver">
                        <Button variant="outline" size="sm" className="mt-3" data-testid="button-create-listing">
                          İlan Oluştur
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    analytics.topListings.map((listing, index) => (
                      <div key={listing.id} className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <TopListingCard listing={listing} />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performans İpuçları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                      <Eye className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Kaliteli Fotoğraflar</p>
                      <p className="text-xs text-muted-foreground">
                        Net, aydınlık fotoğraflar görüntülenmeyi %40 artırır
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Hızlı Yanıt</p>
                      <p className="text-xs text-muted-foreground">
                        Mesajlara hızlı yanıt satış şansını artırır
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40">
                      <Package className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Detaylı Açıklama</p>
                      <p className="text-xs text-muted-foreground">
                        Sağlık durumu ve belgeleri ekleyin
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {analytics.overview.recentListings > 0 && (
              <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/40">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      Son 7 günde {analytics.overview.recentListings} yeni ilan eklediniz
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Aktif olarak ilan paylaşmaya devam edin
                    </p>
                  </div>
                  <Link href="/ilan-ver">
                    <Button size="sm" data-testid="button-new-listing">
                      Yeni İlan
                      <ArrowUpRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
