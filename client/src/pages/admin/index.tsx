import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Users,
  FileText,
  Store,
  Flag,
  TrendingUp,
  Clock,
  Check,
  X,
  Eye,
  ChevronRight,
  AlertCircle,
  Activity,
  Server,
  Database,
  Wifi,
  ShieldCheck,
  RefreshCw,
  FileCheck,
  MessageSquare,
  Bell,
  Heart,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface AdminStats {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  pendingStores: number;
  pendingReports: number;
  pendingDocuments: number;
  totalStores: number;
  totalMessages: number;
  todayListings: number;
  todayUsers: number;
  weeklyGrowth: number;
}

interface PendingListing {
  id: string;
  title: string;
  price: string;
  createdAt: string;
  seller?: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

interface RecentActivity {
  id: string;
  type: "listing" | "user" | "store" | "report" | "message";
  title: string;
  description: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

interface Report {
  id: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  reporter?: {
    firstName: string;
    lastName: string;
  };
  listing?: {
    title: string;
  };
}

export default function AdminDashboardPage() {
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: pendingListings = [], isLoading: listingsLoading } = useQuery<PendingListing[]>({
    queryKey: ["/api/admin/listings"],
    select: (data: any[]) => data.filter((l) => l.status === "pending").slice(0, 5),
  });

  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ["/api/admin/reports"],
    select: (data: any[]) => data.filter((r) => r.status === "pending").slice(0, 5),
  });

  const updateListingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/listings/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "İlan durumu güncellendi" });
    },
    onError: () => {
      toast({ title: "İşlem başarısız", variant: "destructive" });
    },
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "listing":
        return <FileText className="h-4 w-4" />;
      case "user":
        return <Users className="h-4 w-4" />;
      case "store":
        return <Store className="h-4 w-4" />;
      case "report":
        return <Flag className="h-4 w-4" />;
      case "message":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="page-admin-dashboard">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Platform genel bakışı ve hızlı işlemler</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchStats()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>

        {statsLoading ? (
          <StatCardGrid>
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </StatCardGrid>
        ) : (
          <>
            <StatCardGrid>
              <StatCard
                title="Toplam Kullanıcı"
                value={stats?.totalUsers || 0}
                icon={<Users className="h-4 w-4" />}
                trend={stats?.weeklyGrowth ? { value: stats.weeklyGrowth, label: "bu hafta" } : undefined}
              />
              <StatCard
                title="Aktif İlan"
                value={stats?.activeListings || 0}
                icon={<FileText className="h-4 w-4" />}
                variant="success"
              />
              <StatCard
                title="Bekleyen İlan"
                value={stats?.pendingListings || 0}
                icon={<Clock className="h-4 w-4" />}
                variant={stats?.pendingListings ? "warning" : "default"}
              />
              <StatCard
                title="Açık Şikayet"
                value={stats?.pendingReports || 0}
                icon={<Flag className="h-4 w-4" />}
                variant={stats?.pendingReports ? "danger" : "default"}
              />
            </StatCardGrid>

            <StatCardGrid columns={4}>
              <StatCard
                title="Toplam Mağaza"
                value={stats?.totalStores || 0}
                icon={<Store className="h-4 w-4" />}
              />
              <StatCard
                title="Bugün Eklenen"
                value={stats?.todayListings || 0}
                description="ilan"
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <StatCard
                title="Bugün Kayıt"
                value={stats?.todayUsers || 0}
                description="yeni kullanıcı"
                icon={<Users className="h-4 w-4" />}
              />
              <StatCard
                title="Bekleyen Belge"
                value={stats?.pendingDocuments || 0}
                icon={<FileCheck className="h-4 w-4" />}
                variant={stats?.pendingDocuments ? "warning" : "default"}
              />
            </StatCardGrid>
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    Onay Bekleyen İlanlar
                  </CardTitle>
                  <CardDescription>Moderasyon bekleyen son ilanlar</CardDescription>
                </div>
                {pendingListings.length > 0 && (
                  <Badge variant="destructive">{stats?.pendingListings || 0}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {listingsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingListings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Bekleyen ilan yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingListings.map((listing) => (
                    <div
                      key={listing.id}
                      className="flex items-center justify-between p-3 bg-accent/50 rounded-lg hover-elevate"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={listing.seller?.profileImageUrl} />
                          <AvatarFallback>
                            {listing.seller?.firstName?.[0]}
                            {listing.seller?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{listing.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {listing.price} TL •{" "}
                            {formatDistanceToNow(new Date(listing.createdAt), {
                              addSuffix: true,
                              locale: tr,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            updateListingMutation.mutate({ id: listing.id, status: "active" })
                          }
                          disabled={updateListingMutation.isPending}
                          data-testid={`approve-${listing.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            updateListingMutation.mutate({ id: listing.id, status: "rejected" })
                          }
                          disabled={updateListingMutation.isPending}
                          data-testid={`reject-${listing.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/ilan/${listing.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(stats?.pendingListings || 0) > 5 && (
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href="/admin/ilanlar">
                        Tümünü Gör ({stats?.pendingListings} ilan)
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Son Şikayetler
                  </CardTitle>
                  <CardDescription>Çözüm bekleyen şikayetler</CardDescription>
                </div>
                {reports.length > 0 && (
                  <Badge variant="destructive">{stats?.pendingReports || 0}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Açık şikayet yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="p-3 bg-accent/50 rounded-lg hover-elevate"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{report.reason}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {report.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {report.reporter?.firstName} {report.reporter?.lastName} •{" "}
                            {formatDistanceToNow(new Date(report.createdAt), {
                              addSuffix: true,
                              locale: tr,
                            })}
                          </p>
                        </div>
                        <Badge variant="secondary">Bekliyor</Badge>
                      </div>
                    </div>
                  ))}
                  {(stats?.pendingReports || 0) > 5 && (
                    <Button variant="ghost" className="w-full" asChild>
                      <Link href="/admin/sikayetler">
                        Tümünü Gör ({stats?.pendingReports} şikayet)
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Hızlı Erişim</CardTitle>
              <CardDescription>Sık kullanılan yönetim sayfaları</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link href="/admin/ilanlar">
                    <FileText className="h-6 w-6" />
                    <span>İlanlar</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link href="/admin/kullanicilar">
                    <Users className="h-6 w-6" />
                    <span>Kullanıcılar</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link href="/admin/magazalar">
                    <Store className="h-6 w-6" />
                    <span>Mağazalar</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link href="/admin/blog">
                    <FileText className="h-6 w-6" />
                    <span>Blog</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link href="/admin/kategoriler">
                    <FileText className="h-6 w-6" />
                    <span>Kategoriler</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link href="/admin/belgeler">
                    <FileCheck className="h-6 w-6" />
                    <span>Belgeler</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link href="/admin/bildirimler">
                    <Bell className="h-6 w-6" />
                    <span>Bildirimler</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                  <Link href="/admin/ayarlar">
                    <Activity className="h-6 w-6" />
                    <span>Ayarlar</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Sistem Durumu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Veritabanı</span>
                </div>
                <Badge variant="default" className="bg-green-500">Aktif</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">WebSocket</span>
                </div>
                <Badge variant="default" className="bg-green-500">Bağlı</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Cache</span>
                </div>
                <Badge variant="default" className="bg-green-500">Aktif</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Auth</span>
                </div>
                <Badge variant="default" className="bg-green-500">Aktif</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
