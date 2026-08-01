import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Package,
  Heart,
  MessageSquare,
  Settings,
  Store,
  Plus,
  Search,
  ArrowLeft,
  Bell,
  Trash2,
  MapPin,
  Grid3X3,
  List,
} from "lucide-react";

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

export default function PanelFavorilerim() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: myListingsData } = useQuery<{ data: any[]; total: number }>({
    queryKey: ["/api/listings", { sellerId: user?.id }],
    enabled: !!user,
  });

  const myListings = myListingsData?.data || [];

  const { data: favorites = [], isLoading } = useQuery<any[]>({
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
  const unreadMessages = conversations.filter((c: any) => c.unreadCount > 0).length;

  const removeFavoriteMutation = useMutation({
    mutationFn: async (listingId: string) => {
      return apiRequest("DELETE", `/api/favorites/${listingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: "Başarılı",
        description: "Favorilerden kaldırıldı",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "İşlem sırasında bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const filteredFavorites = favorites.filter((favorite) => {
    if (!searchQuery) return true;
    return favorite.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r bg-card min-h-screen sticky top-0">
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback>
                  {user.firstName?.[0] || user.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
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

            <div className="pt-4 mt-4 border-t">
              <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase">
                Hesap
              </p>
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

          <div className="p-4 border-t">
            <Link href="/ilan-ver">
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Ücretsiz İlan Ver
              </Button>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Mobile Header */}
          <div className="lg:hidden border-b bg-card p-4">
            <div className="flex items-center gap-3">
              <Link href="/panel">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-lg font-semibold flex-1">Favorilerim</h1>
              <Badge variant="secondary">{favorites.length}</Badge>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-bold">Favorilerim</h1>
              <p className="text-muted-foreground">
                Beğendiğiniz ilanları buradan takip edin
              </p>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Favorilerde ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-favorites"
                />
              </div>
              <div className="hidden sm:flex border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  data-testid="button-view-grid"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  data-testid="button-view-list"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Favorites */}
            {isLoading ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    : "space-y-3"
                }
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className={viewMode === "grid" ? "h-64" : "h-24"}
                  />
                ))}
              </div>
            ) : filteredFavorites.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">
                    {searchQuery ? "Sonuç Bulunamadı" : "Henüz Favori Yok"}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {searchQuery
                      ? "Farklı bir arama deneyin"
                      : "Beğendiğiniz ilanları favorilerinize ekleyin"}
                  </p>
                  {!searchQuery && (
                    <Link href="/ilanlar">
                      <Button variant="outline" data-testid="button-browse-listings">
                        İlanları İncele
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFavorites.map((favorite) => (
                  <Card
                    key={favorite.id}
                    className="overflow-hidden group"
                    data-testid={`card-favorite-${favorite.listingId}`}
                  >
                    <Link href={`/ilan/${favorite.listingId}`}>
                      <div className="aspect-[4/3] bg-muted relative cursor-pointer">
                        {favorite.listing?.images &&
                        favorite.listing.images.length > 0 ? (
                          <img
                            src={favorite.listing.images[0]}
                            alt={favorite.listing.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-10 h-10 text-muted-foreground" />
                          </div>
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeFavoriteMutation.mutate(favorite.listingId);
                          }}
                          disabled={removeFavoriteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Link>
                    <CardContent className="p-4">
                      <Link href={`/ilan/${favorite.listingId}`}>
                        <h3 className="font-semibold line-clamp-1 hover:text-primary cursor-pointer">
                          {favorite.listing?.title || "İlan Yükleniyor..."}
                        </h3>
                      </Link>
                      {favorite.listing && (
                        <>
                          <p className="text-lg font-bold text-primary mt-2">
                            {parseFloat(
                              favorite.listing.price as string
                            ).toLocaleString("tr-TR")}{" "}
                            TL
                          </p>
                          {(favorite.listing.city || favorite.listing.district) && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {favorite.listing.city}
                              {favorite.listing.district &&
                                `, ${favorite.listing.district}`}
                            </p>
                          )}
                          <div className="flex gap-2 mt-3">
                            <Link href={`/ilan/${favorite.listingId}`} className="flex-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                              >
                                Görüntüle
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                removeFavoriteMutation.mutate(favorite.listingId)
                              }
                              disabled={removeFavoriteMutation.isPending}
                              data-testid={`button-remove-favorite-${favorite.listingId}`}
                            >
                              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFavorites.map((favorite) => (
                  <Card key={favorite.id} data-testid={`card-favorite-${favorite.listingId}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <Link href={`/ilan/${favorite.listingId}`}>
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-muted flex-shrink-0 overflow-hidden cursor-pointer">
                          {favorite.listing?.images &&
                          favorite.listing.images.length > 0 ? (
                            <img
                              src={favorite.listing.images[0]}
                              alt={favorite.listing.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/ilan/${favorite.listingId}`}>
                          <h3 className="font-semibold line-clamp-1 hover:text-primary cursor-pointer">
                            {favorite.listing?.title || "İlan Yükleniyor..."}
                          </h3>
                        </Link>
                        {favorite.listing && (
                          <>
                            <p className="text-lg font-bold text-primary">
                              {parseFloat(
                                favorite.listing.price as string
                              ).toLocaleString("tr-TR")}{" "}
                              TL
                            </p>
                            {(favorite.listing.city ||
                              favorite.listing.district) && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {favorite.listing.city}
                                {favorite.listing.district &&
                                  `, ${favorite.listing.district}`}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/ilan/${favorite.listingId}`}>
                          <Button variant="outline" size="sm">
                            Görüntüle
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            removeFavoriteMutation.mutate(favorite.listingId)
                          }
                          disabled={removeFavoriteMutation.isPending}
                        >
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
