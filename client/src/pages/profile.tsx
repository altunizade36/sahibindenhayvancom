import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  User as UserIcon,
  Heart,
  Package,
  Settings,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Trash2,
  Pencil,
} from "lucide-react";
import type { Listing, Location, Category } from "@shared/schema";

type ListingWithDetails = Listing & {
  category?: Category;
  location?: Location;
};

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("listings");

  const { data: myListingsData, isLoading: isLoadingListings } = useQuery<{ data: ListingWithDetails[]; total: number }>({
    queryKey: [`/api/listings?sellerId=${user?.id}`],
    enabled: !!user,
  });
  
  const myListings = myListingsData?.data || [];

  const { data: favorites, isLoading: isLoadingFavorites } = useQuery<any[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

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
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "İlan silinirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

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

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Giriş Gerekli</h2>
            <p className="text-muted-foreground mb-6">
              Profilinizi görüntülemek için giriş yapmalısınız
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
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {user.firstName?.[0] || user.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1" data-testid="text-user-name">
                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                </h1>
                <Badge variant="secondary" className="mb-3">
                  {user.role === "seller" ? "Satıcı" : user.role === "buyer" ? "Alıcı" : user.role}
                </Badge>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  {user.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {(user.city || user.district) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {user.city}
                        {user.district && `, ${user.district}`}
                      </span>
                    </div>
                  )}
                </div>
                {user.bio && (
                  <p className="mt-3 text-muted-foreground">{user.bio}</p>
                )}
              </div>
              <Link href="/ayarlar">
                <Button variant="outline" data-testid="button-settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Ayarlar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="listings" data-testid="tab-my-listings">
              <Package className="w-4 h-4 mr-2" />
              İlanlarım ({myListings?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="favorites" data-testid="tab-favorites">
              <Heart className="w-4 h-4 mr-2" />
              Favorilerim ({favorites?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* My Listings Tab */}
          <TabsContent value="listings" className="mt-6">
            {isLoadingListings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-80" />
                ))}
              </div>
            ) : !myListings || myListings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Henüz İlan Yok</h3>
                  <p className="text-muted-foreground mb-6">
                    İlk ilanınızı oluşturun ve satışa başlayın
                  </p>
                  <Link href="/ilan-ver">
                    <Button data-testid="button-create-listing">İlan Ver</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myListings.map((listing) => (
                  <Card key={listing.id} className="overflow-hidden" data-testid={`card-my-listing-${listing.id}`}>
                    <Link href={`/ilan/${listing.id}`}>
                      <div className="aspect-video bg-muted relative cursor-pointer">
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
                        <Badge
                          variant={listing.status === "active" ? "default" : "secondary"}
                          className="absolute top-2 right-2"
                        >
                          {listing.status === "active" ? "Aktif" : listing.status === "sold" ? "Satıldı" : "Askıda"}
                        </Badge>
                      </div>
                    </Link>
                    <CardContent className="p-4">
                      <Link href={`/ilan/${listing.id}`}>
                        <h3 className="font-semibold mb-2 line-clamp-1 cursor-pointer hover:text-primary">
                          {listing.title}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1 text-lg font-bold text-primary">
                          <DollarSign className="w-5 h-5" />
                          {parseFloat(listing.price as string).toLocaleString("tr-TR")}₺
                        </div>
                        <Badge variant="secondary">
                          {listing.category?.name || "Kategori Yok"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/ilan-duzenle/${listing.id}`} className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            data-testid={`button-edit-${listing.id}`}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Düzenle
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteListingMutation.mutate(listing.id)}
                          disabled={deleteListingMutation.isPending}
                          data-testid={`button-delete-${listing.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="mt-6">
            {isLoadingFavorites ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-80" />
                ))}
              </div>
            ) : !favorites || favorites.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Henüz Favori Yok</h3>
                  <p className="text-muted-foreground mb-6">
                    Beğendiğiniz ilanları favorilerinize ekleyin
                  </p>
                  <Link href="/ilanlar">
                    <Button variant="outline" data-testid="button-browse-listings">
                      İlanları İncele
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((favorite) => (
                  <Card key={favorite.id} className="overflow-hidden" data-testid={`card-favorite-${favorite.listingId}`}>
                    <Link href={`/ilan/${favorite.listingId}`}>
                      <div className="aspect-video bg-muted relative cursor-pointer">
                        {favorite.listing?.images && favorite.listing.images.length > 0 ? (
                          <img
                            src={favorite.listing.images[0]}
                            alt={favorite.listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl">🐾</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <CardContent className="p-4">
                      <Link href={`/ilan/${favorite.listingId}`}>
                        <h3 className="font-semibold mb-2 line-clamp-1 cursor-pointer hover:text-primary">
                          {favorite.listing?.title || "İlan Yükleniyor..."}
                        </h3>
                      </Link>
                      {favorite.listing && (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1 text-lg font-bold text-primary">
                              <DollarSign className="w-5 h-5" />
                              {parseFloat(favorite.listing.price as string).toLocaleString("tr-TR")}₺
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => removeFavoriteMutation.mutate(favorite.listingId)}
                            disabled={removeFavoriteMutation.isPending}
                            data-testid={`button-remove-favorite-${favorite.listingId}`}
                          >
                            <Heart className="w-4 h-4 mr-2 fill-red-500 text-red-500" />
                            Favorilerden Çıkar
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
