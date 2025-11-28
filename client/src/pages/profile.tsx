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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  User as UserIcon,
  Heart,
  Package,
  Settings,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Pencil,
  Calendar,
  Shield,
  CheckCircle2,
  Store,
  Plus,
  Eye,
} from "lucide-react";
import type { Listing, Location, Category } from "@shared/schema";

type ListingWithDetails = Listing & {
  category?: Category;
  location?: Location;
};

const roleLabels: Record<string, string> = {
  seller: "Satici",
  buyer: "Alici",
  vet: "Veteriner",
  transporter: "Nakliyeci",
  admin: "Admin",
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

  const { data: myStore } = useQuery<any>({
    queryKey: ["/api/store/my/dashboard"],
    enabled: !!user,
  });

  const hasStore = !!myStore && !('message' in myStore);

  const deleteListingMutation = useMutation({
    mutationFn: async (listingId: string) => {
      return apiRequest("DELETE", `/api/listings/${listingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({
        title: "Basarili",
        description: "Ilan silindi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Ilan silinirken bir hata olustu",
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
        title: "Basarili",
        description: "Favorilerden kaldirildi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Islem sirasinda bir hata olustu",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 sm:p-12 text-center">
            <UserIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Giris Gerekli</h2>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
              Profilinizi goruntulemek icin giris yapmalisiniz
            </p>
            <Link href="/giris">
              <Button data-testid="button-login" className="w-full sm:w-auto">Giris Yap</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const memberSince = user.createdAt ? new Date(user.createdAt) : null;
  const memberDays = memberSince ? Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const isEmailVerified = user.emailVerified;
  const totalListings = myListings.length;
  const activeListings = myListings.filter(l => l.status === 'active').length;
  const soldListings = myListings.filter(l => l.status === 'sold').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="flex items-center gap-4 sm:block">
                <Avatar className="w-16 h-16 sm:w-24 sm:h-24 flex-shrink-0">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="text-xl sm:text-2xl">
                    {user.firstName?.[0] || user.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="sm:hidden flex-1">
                  <h1 className="text-lg font-bold" data-testid="text-user-name">
                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email?.split('@')[0]}
                  </h1>
                  <Badge variant="secondary" className="mt-1">
                    {roleLabels[user.role] || user.role}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="hidden sm:block mb-2">
                  <h1 className="text-2xl font-bold" data-testid="text-user-name-desktop">
                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">
                      {roleLabels[user.role] || user.role}
                    </Badge>
                    {isEmailVerified && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Dogrulanmis
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3 sm:mb-4 text-xs sm:text-sm">
                  {memberDays > 0 && (
                    <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span className="font-medium">{memberDays}</span>
                      <span className="text-muted-foreground">gundur uye</span>
                    </div>
                  )}
                  {totalListings > 0 && (
                    <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                      <Package className="w-3.5 h-3.5 text-primary" />
                      <span className="font-medium">{totalListings}</span>
                      <span className="text-muted-foreground">ilan</span>
                    </div>
                  )}
                  {soldListings > 0 && (
                    <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-md">
                      <Shield className="w-3.5 h-3.5 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-400">{soldListings}</span>
                      <span className="text-green-600 dark:text-green-500">satildi</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {user.email && (
                    <div className="flex items-center gap-2 text-muted-foreground truncate">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {(user.city || user.district) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        {user.city}
                        {user.district && `, ${user.district}`}
                      </span>
                    </div>
                  )}
                </div>
                
                {user.bio && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{user.bio}</p>
                )}
              </div>

              <div className="flex flex-row sm:flex-col gap-2 justify-end">
                <Link href="/ayarlar">
                  <Button variant="outline" size="sm" data-testid="button-settings" className="w-full">
                    <Settings className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Ayarlar</span>
                  </Button>
                </Link>
                <Link href="/ilan-ver">
                  <Button size="sm" data-testid="button-new-listing" className="w-full">
                    <Plus className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Ilan Ver</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasStore && (
          <Card className="mb-4 sm:mb-6 bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {myStore.logo ? (
                    <img src={myStore.logo} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{myStore.displayName}</p>
                    <p className="text-xs text-muted-foreground">Profesyonel Magazaniz</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/magaza/${myStore.slug}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Gor</span>
                    </Button>
                  </Link>
                  <Link href="/magazam">
                    <Button size="sm">
                      <Settings className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Yonet</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!hasStore && (user.role === 'seller' || user.role === 'vet') && (
          <Card className="mb-4 sm:mb-6 border-dashed">
            <CardContent className="p-4 sm:p-6 text-center">
              <Store className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-2">Profesyonel Magaza Acin</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Markali bir magaza sayfasi olusturun, takipci kazanin
              </p>
              <Link href="/magazam">
                <Button data-testid="button-create-store">
                  <Store className="w-4 h-4 mr-2" />
                  Magaza Olustur
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:gap-2">
            <TabsTrigger value="listings" data-testid="tab-my-listings" className="text-xs sm:text-sm">
              <Package className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="truncate">Ilanlarim ({myListings?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" data-testid="tab-favorites" className="text-xs sm:text-sm">
              <Heart className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="truncate">Favoriler ({favorites?.length || 0})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-4 sm:mt-6">
            {isLoadingListings ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 sm:h-80" />
                ))}
              </div>
            ) : !myListings || myListings.length === 0 ? (
              <Card>
                <CardContent className="p-8 sm:p-12 text-center">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Henuz Ilan Yok</h3>
                  <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                    Ilk ilaninizi olusturun ve satisa baslayin
                  </p>
                  <Link href="/ilan-ver">
                    <Button data-testid="button-create-listing">
                      <Plus className="w-4 h-4 mr-2" />
                      Ilan Ver
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {myListings.map((listing) => (
                  <Card key={listing.id} className="overflow-hidden" data-testid={`card-my-listing-${listing.id}`}>
                    <Link href={`/ilan/${listing.id}`}>
                      <div className="aspect-[4/3] bg-muted relative cursor-pointer">
                        {listing.images && listing.images.length > 0 ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Package className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        <Badge
                          variant={listing.status === "active" ? "default" : "secondary"}
                          className="absolute top-2 right-2"
                        >
                          {listing.status === "active" ? "Aktif" : listing.status === "sold" ? "Satildi" : "Askida"}
                        </Badge>
                      </div>
                    </Link>
                    <CardContent className="p-3 sm:p-4">
                      <Link href={`/ilan/${listing.id}`}>
                        <h3 className="font-semibold mb-2 line-clamp-1 cursor-pointer hover:text-primary text-sm sm:text-base">
                          {listing.title}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-base sm:text-lg font-bold text-primary">
                          {parseFloat(listing.price as string).toLocaleString("tr-TR")} TL
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {listing.category?.name || "Kategori Yok"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/ilan-duzenle/${listing.id}`} className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs sm:text-sm"
                            data-testid={`button-edit-${listing.id}`}
                          >
                            <Pencil className="w-3.5 h-3.5 sm:mr-2" />
                            <span className="hidden sm:inline">Duzenle</span>
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteListingMutation.mutate(listing.id)}
                          disabled={deleteListingMutation.isPending}
                          data-testid={`button-delete-${listing.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="mt-4 sm:mt-6">
            {isLoadingFavorites ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 sm:h-80" />
                ))}
              </div>
            ) : !favorites || favorites.length === 0 ? (
              <Card>
                <CardContent className="p-8 sm:p-12 text-center">
                  <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Henuz Favori Yok</h3>
                  <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                    Begendiginiz ilanlari favorilerinize ekleyin
                  </p>
                  <Link href="/ilanlar">
                    <Button variant="outline" data-testid="button-browse-listings">
                      Ilanlari Incele
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {favorites.map((favorite) => (
                  <Card key={favorite.id} className="overflow-hidden" data-testid={`card-favorite-${favorite.listingId}`}>
                    <Link href={`/ilan/${favorite.listingId}`}>
                      <div className="aspect-[4/3] bg-muted relative cursor-pointer">
                        {favorite.listing?.images && favorite.listing.images.length > 0 ? (
                          <img
                            src={favorite.listing.images[0]}
                            alt={favorite.listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </Link>
                    <CardContent className="p-3 sm:p-4">
                      <Link href={`/ilan/${favorite.listingId}`}>
                        <h3 className="font-semibold mb-2 line-clamp-1 cursor-pointer hover:text-primary text-sm sm:text-base">
                          {favorite.listing?.title || "Ilan Yukleniyor..."}
                        </h3>
                      </Link>
                      {favorite.listing && (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-base sm:text-lg font-bold text-primary">
                              {parseFloat(favorite.listing.price as string).toLocaleString("tr-TR")} TL
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs sm:text-sm"
                            onClick={() => removeFavoriteMutation.mutate(favorite.listingId)}
                            disabled={removeFavoriteMutation.isPending}
                            data-testid={`button-remove-favorite-${favorite.listingId}`}
                          >
                            <Heart className="w-3.5 h-3.5 mr-2 fill-red-500 text-red-500" />
                            Favorilerden Cikar
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
