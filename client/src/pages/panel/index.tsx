import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard,
  Package,
  Heart,
  MessageSquare,
  Settings,
  Store,
  Plus,
  Eye,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Bell,
  Shield,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import type { Listing } from "@shared/schema";

type ListingWithDetails = Listing & {
  category?: { name: string };
  views?: number;
};

const roleLabels: Record<string, string> = {
  seller: "Satıcı",
  buyer: "Alıcı",
  vet: "Veteriner",
  transporter: "Nakliyeci",
  admin: "Yönetici",
};

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  count?: number;
  active?: boolean;
}

function SidebarLink({ href, icon: Icon, label, count, active }: SidebarLinkProps) {
  return (
    <Link href={href}>
      <div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
          active
            ? "bg-primary text-primary-foreground"
            : "hover-elevate text-muted-foreground hover:text-foreground"
        }`}
        data-testid={`link-panel-${label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <Icon className="w-5 h-5" />
        <span className="flex-1 font-medium">{label}</span>
        {count !== undefined && count > 0 && (
          <Badge variant={active ? "secondary" : "outline"} className="text-xs">
            {count}
          </Badge>
        )}
      </div>
    </Link>
  );
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
  color?: "primary" | "green" | "blue" | "orange";
}) {
  const colorClasses = {
    primary: "text-primary bg-primary/10",
    green: "text-green-600 bg-green-100 dark:bg-green-900/30",
    blue: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    orange: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
  };

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
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
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

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  variant = "default",
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  variant?: "default" | "primary";
}) {
  return (
    <Link href={href}>
      <Card className={`hover-elevate cursor-pointer h-full ${variant === "primary" ? "border-primary/50 bg-primary/5" : ""}`}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className={`p-3 rounded-lg ${variant === "primary" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function PanelDashboard() {
  const { user } = useAuth();
  const [location] = useLocation();

  const { data: myListingsData, isLoading: isLoadingListings } = useQuery<{
    data: ListingWithDetails[];
    total: number;
  }>({
    queryKey: ["/api/listings", { sellerId: user?.id }],
    enabled: !!user,
  });

  const myListings = myListingsData?.data || [];

  const { data: favorites = [], isLoading: isLoadingFavorites } = useQuery<any[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ["/api/messages/conversations"],
    enabled: !!user,
  });

  const { data: notificationCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/count"],
    enabled: !!user,
  });

  const { data: myStore } = useQuery<any>({
    queryKey: ["/api/store/my/dashboard"],
    enabled: !!user,
  });

  const hasStore = !!myStore && !("message" in myStore);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <LayoutDashboard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Giriş Gerekli</h2>
            <p className="text-muted-foreground mb-6">
              Kontrol panelinize erişmek için giriş yapmalısınız
            </p>
            <Link href="/giris">
              <Button data-testid="button-login">Giriş Yap</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeListings = myListings.filter((l) => l.status === "active").length;
  const pendingListings = myListings.filter((l) => l.status === "pending").length;
  const soldListings = myListings.filter((l) => l.status === "sold").length;
  const totalViews = myListings.reduce((sum, l) => sum + (l.views || 0), 0);
  const unreadMessages = conversations.filter((c: any) => c.unreadCount > 0).length;
  const memberSince = user.createdAt ? new Date(user.createdAt) : null;
  const memberDays = memberSince
    ? Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const profileCompleteness = [
    !!user.firstName,
    !!user.lastName,
    !!user.phone,
    !!user.city,
    !!user.bio,
    !!user.profileImageUrl,
  ].filter(Boolean).length;
  const profilePercent = Math.round((profileCompleteness / 6) * 100);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r bg-card min-h-screen sticky top-0">
          {/* User Info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback>
                  {user.firstName?.[0] || user.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" data-testid="text-user-name">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.email?.split("@")[0]}
                </p>
                <Badge variant="secondary" className="text-xs mt-0.5">
                  {roleLabels[user.role] || user.role}
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            <SidebarLink
              href="/panel"
              icon={LayoutDashboard}
              label="Kontrol Paneli"
              active={location === "/panel"}
            />
            <SidebarLink
              href="/panel/ilanlarim"
              icon={Package}
              label="İlanlarım"
              count={myListings.length}
              active={location === "/panel/ilanlarim"}
            />
            <SidebarLink
              href="/panel/favorilerim"
              icon={Heart}
              label="Favorilerim"
              count={favorites.length}
              active={location === "/panel/favorilerim"}
            />
            <SidebarLink
              href="/mesajlar"
              icon={MessageSquare}
              label="Mesajlar"
              count={unreadMessages}
              active={location === "/mesajlar"}
            />
            <SidebarLink
              href="/bildirimler"
              icon={Bell}
              label="Bildirimler"
              count={notificationCount.count}
              active={location === "/bildirimler"}
            />
            <SidebarLink
              href="/panel/analizler"
              icon={TrendingUp}
              label="Analizler"
              active={location === "/panel/analizler"}
            />

            <div className="pt-4 mt-4 border-t">
              <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase">
                Hesap
              </p>
              <SidebarLink
                href="/panel/dogrulama"
                icon={Shield}
                label="Mesleki Doğrulama"
                active={location === "/panel/dogrulama"}
              />
              <SidebarLink
                href="/panel/ayarlar"
                icon={Settings}
                label="Ayarlar"
                active={location === "/panel/ayarlar"}
              />
              {hasStore && (
                <SidebarLink
                  href="/magazam"
                  icon={Store}
                  label="Mağazam"
                  active={location === "/magazam"}
                />
              )}
            </div>
          </nav>

          {/* Quick Action */}
          <div className="p-4 border-t">
            <Link href="/ilan-ver">
              <Button className="w-full" data-testid="button-new-listing-sidebar">
                <Plus className="w-4 h-4 mr-2" />
                Yeni İlan Ver
              </Button>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Mobile Header */}
          <div className="lg:hidden border-b bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {user.firstName?.[0] || user.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {user.firstName || user.email?.split("@")[0]}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {roleLabels[user.role] || user.role}
                  </Badge>
                </div>
              </div>
              <Link href="/ilan-ver">
                <Button size="sm" data-testid="button-new-listing-mobile">
                  <Plus className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile Nav */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              <Link href="/panel">
                <Button
                  variant={location === "/panel" ? "default" : "outline"}
                  size="sm"
                >
                  <LayoutDashboard className="w-4 h-4 mr-1" />
                  Panel
                </Button>
              </Link>
              <Link href="/panel/ilanlarim">
                <Button
                  variant={location === "/panel/ilanlarim" ? "default" : "outline"}
                  size="sm"
                >
                  <Package className="w-4 h-4 mr-1" />
                  İlanlarım
                </Button>
              </Link>
              <Link href="/panel/favorilerim">
                <Button
                  variant={location === "/panel/favorilerim" ? "default" : "outline"}
                  size="sm"
                >
                  <Heart className="w-4 h-4 mr-1" />
                  Favoriler
                </Button>
              </Link>
              <Link href="/panel/analizler">
                <Button
                  variant={location === "/panel/analizler" ? "default" : "outline"}
                  size="sm"
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Analizler
                </Button>
              </Link>
              <Link href="/panel/ayarlar">
                <Button
                  variant={location === "/panel/ayarlar" ? "default" : "outline"}
                  size="sm"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Ayarlar
                </Button>
              </Link>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* Welcome Section */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                Hoş geldiniz, {user.firstName || user.email?.split("@")[0]}
              </h1>
              <p className="text-muted-foreground">
                İşte hesabınızın özeti ve son aktiviteler
              </p>
            </div>

            {/* Profile Completion Alert */}
            {profilePercent < 100 && (
              <Card className="mb-6 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/40">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Profilinizi tamamlayın</p>
                      <p className="text-xs text-muted-foreground">
                        Profil tamamlama oranı: %{profilePercent}
                      </p>
                      <Progress value={profilePercent} className="h-1.5 mt-2" />
                    </div>
                    <Link href="/panel/ayarlar">
                      <Button size="sm" variant="outline">
                        Tamamla
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {isLoadingListings ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28" />
                ))
              ) : (
                <>
                  <StatCard
                    title="Aktif İlanlar"
                    value={activeListings}
                    icon={Package}
                    color="primary"
                  />
                  <StatCard
                    title="Bekleyen"
                    value={pendingListings}
                    icon={Clock}
                    color="orange"
                  />
                  <StatCard
                    title="Toplam Görüntülenme"
                    value={totalViews.toLocaleString("tr-TR")}
                    icon={Eye}
                    color="blue"
                  />
                  <StatCard
                    title="Favorilere Eklenme"
                    value={favorites.length}
                    icon={Heart}
                    color="green"
                  />
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Hızlı İşlemler</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <QuickActionCard
                  title="Yeni İlan Ver"
                  description="Hemen satışa başlayın"
                  icon={Plus}
                  href="/ilan-ver"
                  variant="primary"
                />
                <QuickActionCard
                  title="İlanları İncele"
                  description="Tüm ilanlarınızı görüntüleyin"
                  icon={Package}
                  href="/panel/ilanlarim"
                />
                <QuickActionCard
                  title="Mesajları Görüntüle"
                  description={
                    unreadMessages > 0
                      ? `${unreadMessages} okunmamış mesaj`
                      : "Tüm mesajlarınız"
                  }
                  icon={MessageSquare}
                  href="/mesajlar"
                />
                <QuickActionCard
                  title="Analizleri Görüntüle"
                  description="İlan performansını takip edin"
                  icon={TrendingUp}
                  href="/panel/analizler"
                />
              </div>
            </div>

            {/* Recent Listings */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Son İlanlarınız</h2>
                <Link href="/panel/ilanlarim">
                  <Button variant="ghost" size="sm">
                    Tümünü Gör
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              {isLoadingListings ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-48" />
                  ))}
                </div>
              ) : myListings.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Henüz İlan Yok</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      İlk ilanınızı oluşturun ve satışa başlayın
                    </p>
                    <Link href="/ilan-ver">
                      <Button data-testid="button-create-first-listing">
                        <Plus className="w-4 h-4 mr-2" />
                        İlan Ver
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myListings.slice(0, 3).map((listing) => (
                    <Card
                      key={listing.id}
                      className="overflow-hidden hover-elevate"
                      data-testid={`card-listing-${listing.id}`}
                    >
                      <Link href={`/ilan/${listing.id}`}>
                        <div className="aspect-[4/3] bg-muted relative cursor-pointer">
                          {listing.images && listing.images.length > 0 ? (
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-10 h-10 text-muted-foreground" />
                            </div>
                          )}
                          <Badge
                            variant={
                              listing.status === "active"
                                ? "default"
                                : listing.status === "pending"
                                ? "secondary"
                                : "outline"
                            }
                            className="absolute top-2 right-2"
                          >
                            {listing.status === "active"
                              ? "Aktif"
                              : listing.status === "pending"
                              ? "Bekliyor"
                              : listing.status === "sold"
                              ? "Satıldı"
                              : "Pasif"}
                          </Badge>
                        </div>
                      </Link>
                      <CardContent className="p-3">
                        <Link href={`/ilan/${listing.id}`}>
                          <h3 className="font-semibold text-sm line-clamp-1 hover:text-primary cursor-pointer">
                            {listing.title}
                          </h3>
                        </Link>
                        <div className="flex items-center justify-between mt-2">
                          <p className="font-bold text-primary">
                            {parseFloat(listing.price as string).toLocaleString(
                              "tr-TR"
                            )}{" "}
                            TL
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="w-3 h-3" />
                            {listing.views || 0}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Store Promo */}
            {!hasStore && (user.role === "seller" || user.role === "vet") && (
              <Card className="border-dashed bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Store className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold mb-1">Profesyonel Mağaza Açın</h3>
                    <p className="text-sm text-muted-foreground">
                      Markalı mağaza sayfanızı oluşturun, daha fazla müşteriye ulaşın
                    </p>
                  </div>
                  <Link href="/magazam">
                    <Button data-testid="button-create-store">
                      <Store className="w-4 h-4 mr-2" />
                      Mağaza Oluştur
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Account Info */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Üyelik Bilgisi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Üyelik Süresi</span>
                      <span className="font-medium">{memberDays} gün</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Toplam İlan</span>
                      <span className="font-medium">{myListings.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Satılan</span>
                      <span className="font-medium text-green-600">{soldListings}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Hesap Durumu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">E-posta Doğrulama</span>
                      {user.emailVerified ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Doğrulandı
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Bekliyor
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Telefon</span>
                      {user.phone ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Kayıtlı
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Eklenmedi
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Profil</span>
                      <span className="font-medium">%{profilePercent} tamamlandı</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
