import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Package,
  Heart,
  MessageSquare,
  Settings,
  Store,
  Plus,
  Eye,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ArrowLeft,
  Bell,
  Filter,
  Grid3X3,
  List,
  Pause,
  Play,
} from "lucide-react";
import type { Listing, Category } from "@shared/schema";

type ListingWithDetails = Listing & {
  category?: Category;
  views?: number;
};

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: "Aktif", color: "default" },
  pending: { label: "Bekliyor", color: "secondary" },
  rejected: { label: "Reddedildi", color: "destructive" },
  sold: { label: "Satıldı", color: "outline" },
  inactive: { label: "Pasif", color: "outline" },
  draft: { label: "Pasif", color: "outline" },
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

export default function PanelIlanlarim() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);

  const { data: myListingsData, isLoading } = useQuery<{
    data: ListingWithDetails[];
    total: number;
  }>({
    queryKey: ["/api/listings", { sellerId: user?.id }],
    enabled: !!user,
  });

  const myListings = myListingsData?.data || [];

  const { data: favorites = [] } = useQuery<any[]>({
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

  const deleteListingMutation = useMutation({
    mutationFn: async (listingId: string) => {
      return apiRequest("DELETE", `/api/listings/${listingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({
        title: "Başarılı",
        description: "İlan silindi",
      });
      setDeleteDialogOpen(false);
      setListingToDelete(null);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "İlan silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const deactivateListingMutation = useMutation({
    mutationFn: async (listingId: string) => {
      return apiRequest("PATCH", `/api/listings/${listingId}/deactivate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({
        title: "Başarılı",
        description: "İlan pasife alındı",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "İlan pasife alınamadı",
        variant: "destructive",
      });
    },
  });

  const activateListingMutation = useMutation({
    mutationFn: async (listingId: string) => {
      return apiRequest("PATCH", `/api/listings/${listingId}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({
        title: "Başarılı",
        description: "İlan aktifleştirildi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "İlan aktifleştirilemedi",
        variant: "destructive",
      });
    },
  });

  const filteredListings = myListings
    .filter((listing) => {
      if (statusFilter !== "all" && listing.status !== statusFilter) {
        return false;
      }
      if (searchQuery) {
        return listing.title.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

  const statusCounts = {
    all: myListings.length,
    active: myListings.filter((l) => l.status === "active").length,
    pending: myListings.filter((l) => l.status === "pending").length,
    sold: myListings.filter((l) => l.status === "sold").length,
    rejected: myListings.filter((l) => l.status === "rejected").length,
    draft: myListings.filter((l) => l.status === "draft").length,
  };

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
                Yeni İlan Ver
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
              <h1 className="text-lg font-semibold flex-1">İlanlarım</h1>
              <Link href="/ilan-ver">
                <Button size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">İlanlarım</h1>
                <p className="text-muted-foreground">
                  Tüm ilanlarınızı yönetin ve düzenleyin
                </p>
              </div>
              <Link href="/ilan-ver">
                <Button data-testid="button-new-listing">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni İlan Ver
                </Button>
              </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="İlan ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-listings"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40" data-testid="select-status-filter">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü ({statusCounts.all})</SelectItem>
                    <SelectItem value="active">Aktif ({statusCounts.active})</SelectItem>
                    <SelectItem value="pending">Bekliyor ({statusCounts.pending})</SelectItem>
                    <SelectItem value="sold">Satıldı ({statusCounts.sold})</SelectItem>
                    <SelectItem value="rejected">Reddedildi ({statusCounts.rejected})</SelectItem>
                  </SelectContent>
                </Select>
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
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { key: "active", icon: CheckCircle2, color: "text-green-600" },
                { key: "pending", icon: Clock, color: "text-orange-600" },
                { key: "sold", icon: ShoppingBag, color: "text-blue-600" },
                { key: "rejected", icon: XCircle, color: "text-red-600" },
              ].map(({ key, icon: Icon, color }) => (
                <Card
                  key={key}
                  className={`cursor-pointer hover-elevate ${
                    statusFilter === key ? "border-primary" : ""
                  }`}
                  onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
                >
                  <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${color}`} />
                    <div>
                      <p className="text-lg sm:text-xl font-bold">
                        {statusCounts[key as keyof typeof statusCounts]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {statusLabels[key].label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Listings */}
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
            ) : filteredListings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">
                    {searchQuery || statusFilter !== "all"
                      ? "Sonuç Bulunamadı"
                      : "Henüz İlan Yok"}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {searchQuery || statusFilter !== "all"
                      ? "Farklı filtreler deneyin"
                      : "İlk ilanınızı oluşturun ve satışa başlayın"}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Link href="/ilan-ver">
                      <Button data-testid="button-create-first-listing">
                        <Plus className="w-4 h-4 mr-2" />
                        İlan Ver
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredListings.map((listing) => (
                  <Card
                    key={listing.id}
                    className="overflow-hidden"
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
                            statusLabels[listing.status || "pending"]?.color as any
                          }
                          className="absolute top-2 left-2"
                        >
                          {statusLabels[listing.status || "pending"]?.label}
                        </Badge>
                      </div>
                    </Link>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/ilan/${listing.id}`}>
                          <h3 className="font-semibold line-clamp-1 hover:text-primary cursor-pointer">
                            {listing.title}
                          </h3>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 -mr-2"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href={`/ilan/${listing.id}`}>
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                Görüntüle
                              </DropdownMenuItem>
                            </Link>
                            <Link href={`/ilan-duzenle/${listing.id}`}>
                              <DropdownMenuItem>
                                <Pencil className="w-4 h-4 mr-2" />
                                Düzenle
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            {listing.status === "active" ? (
                              <DropdownMenuItem
                                onClick={() => deactivateListingMutation.mutate(listing.id)}
                                disabled={deactivateListingMutation.isPending}
                              >
                                <Pause className="w-4 h-4 mr-2" />
                                Pasife Al
                              </DropdownMenuItem>
                            ) : listing.status === "draft" ? (
                              <DropdownMenuItem
                                onClick={() => activateListingMutation.mutate(listing.id)}
                                disabled={activateListingMutation.isPending}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Aktifleştir
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setListingToDelete(listing.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-lg font-bold text-primary mt-2">
                        {parseFloat(listing.price as string).toLocaleString("tr-TR")} TL
                      </p>
                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {listing.views || 0} görüntülenme
                        </div>
                        <span>
                          {new Date(listing.createdAt!).toLocaleDateString("tr-TR")}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Link href={`/ilan-duzenle/${listing.id}`} className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            data-testid={`button-edit-${listing.id}`}
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            Düzenle
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredListings.map((listing) => (
                  <Card key={listing.id} data-testid={`card-listing-${listing.id}`}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <Link href={`/ilan/${listing.id}`}>
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-muted flex-shrink-0 overflow-hidden cursor-pointer">
                          {listing.images && listing.images.length > 0 ? (
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={
                              statusLabels[listing.status || "pending"]?.color as any
                            }
                          >
                            {statusLabels[listing.status || "pending"]?.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(listing.createdAt!).toLocaleDateString("tr-TR")}
                          </span>
                        </div>
                        <Link href={`/ilan/${listing.id}`}>
                          <h3 className="font-semibold line-clamp-1 hover:text-primary cursor-pointer">
                            {listing.title}
                          </h3>
                        </Link>
                        <p className="text-lg font-bold text-primary">
                          {parseFloat(listing.price as string).toLocaleString("tr-TR")} TL
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {listing.views || 0}
                          </span>
                          {listing.category && <span>{listing.category.name}</span>}
                        </div>
                      </div>
                      <div className="hidden sm:flex gap-2">
                        <Link href={`/ilan-duzenle/${listing.id}`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setListingToDelete(listing.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild className="sm:hidden">
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/ilan/${listing.id}`}>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Görüntüle
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/ilan-duzenle/${listing.id}`}>
                            <DropdownMenuItem>
                              <Pencil className="w-4 h-4 mr-2" />
                              Düzenle
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator />
                          {listing.status === "active" ? (
                            <DropdownMenuItem
                              onClick={() => deactivateListingMutation.mutate(listing.id)}
                              disabled={deactivateListingMutation.isPending}
                            >
                              <Pause className="w-4 h-4 mr-2" />
                              Pasife Al
                            </DropdownMenuItem>
                          ) : listing.status === "draft" ? (
                            <DropdownMenuItem
                              onClick={() => activateListingMutation.mutate(listing.id)}
                              disabled={activateListingMutation.isPending}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Aktifleştir
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setListingToDelete(listing.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İlanı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu ilanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => listingToDelete && deleteListingMutation.mutate(listingToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteListingMutation.isPending ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
