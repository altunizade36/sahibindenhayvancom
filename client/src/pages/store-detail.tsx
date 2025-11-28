import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Building2, MapPin, Star, Phone, Mail, Globe, BadgeCheck, MessageCircle, Users, Eye, Calendar, Shield, Zap, Award, Crown, Clock, Heart, HeartOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-user";

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

const badgeConfig: Record<string, { icon: typeof BadgeCheck; label: string; color: string }> = {
  verified: { icon: BadgeCheck, label: "Onaylı Satıcı", color: "bg-blue-500" },
  successful: { icon: Star, label: "Başarılı Satıcı", color: "bg-yellow-500" },
  fast_seller: { icon: Zap, label: "Hızlı Satıcı", color: "bg-green-500" },
  top_rated: { icon: Award, label: "En Çok Beğenilen", color: "bg-purple-500" },
  trusted: { icon: Shield, label: "Güvenilir Satıcı", color: "bg-teal-500" },
  premium: { icon: Crown, label: "Premium Satıcı", color: "bg-amber-500" },
};

export default function StoreDetail() {
  const [, params] = useRoute("/magaza/:slug");
  const slug = params?.slug;
  const { user } = useUser();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: store, isLoading } = useQuery<any>({
    queryKey: ["/api/store", slug],
    enabled: !!slug,
    queryFn: async () => {
      const response = await fetch(`/api/store/${slug}`);
      if (!response.ok) throw new Error("Mağaza bulunamadı");
      return response.json();
    },
  });

  const { data: isFollowing, refetch: refetchFollowStatus } = useQuery<{ following: boolean }>({
    queryKey: ["/api/store", store?.id, "is-following"],
    enabled: !!store?.id && !!user,
    queryFn: async () => {
      const response = await fetch(`/api/store/${store.id}/is-following`);
      if (!response.ok) return { following: false };
      return response.json();
    },
  });

  useEffect(() => {
    if (store?.id) {
      fetch(`/api/store/${store.id}/view`, { method: "POST" }).catch(() => {});
    }
  }, [store?.id]);

  const followMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/store/${store.id}/follow`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store", slug] });
      refetchFollowStatus();
      toast({ title: "Mağaza takip edildi" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Hata", 
        description: error.message || "Takip edilemedi",
        variant: "destructive" 
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/store/${store.id}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store", slug] });
      refetchFollowStatus();
      toast({ title: "Takipten çıkıldı" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Hata", 
        description: error.message || "Takipten çıkılamadı",
        variant: "destructive" 
      });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: { rating: number; comment: string }) => {
      return apiRequest("POST", `/api/store/${store.id}/review`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store", slug] });
      toast({ title: "Değerlendirmeniz alındı" });
      setComment("");
      setRating(5);
    },
    onError: (error: any) => {
      toast({ 
        title: "Hata", 
        description: error.message || "Değerlendirme gönderilemedi",
        variant: "destructive" 
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-64 w-full" />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-4 w-2/3 mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Mağaza bulunamadı</h2>
          <Link href="/magazalar">
            <Button data-testid="button-back-stores">Mağazalara Dön</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === store.owner?.id;
  const storeBadges = Array.isArray(store.badges) ? store.badges : [];
  const memberSince = store.createdAt ? new Date(store.createdAt) : null;
  const memberDays = memberSince ? Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div 
        className="h-48 sm:h-64 relative"
        style={{ 
          backgroundColor: store.banner ? undefined : store.primaryColor,
          backgroundImage: store.banner ? `url(${store.banner})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0">
          <div className="container mx-auto px-3 sm:px-4 pb-4 sm:pb-6">
            <div className="flex items-end gap-3 sm:gap-6">
              <div 
                className="w-20 h-20 sm:w-32 sm:h-32 flex-shrink-0 rounded-lg bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-xl"
              >
                {store.logo ? (
                  <img src={store.logo} alt={store.displayName} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Building2 className="w-10 h-10 sm:w-16 sm:h-16" style={{ color: store.primaryColor }} />
                )}
              </div>

              <div className="flex-1 text-white min-w-0 mb-2 sm:mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1 sm:mb-2">
                  <h1 className="text-xl sm:text-3xl font-bold truncate" data-testid="text-store-name">{store.displayName}</h1>
                  {store.verifiedAt && (
                    <Badge className="bg-white/90 text-primary w-fit">
                      <BadgeCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Onaylı
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  <Badge variant="secondary" className="text-xs">{storeTypeLabels[store.storeType]}</Badge>
                  {store.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="truncate">{store.city}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6 text-sm">
          <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1.5 rounded-md">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-medium" data-testid="text-follower-count">{store.followerCount || 0}</span>
            <span className="text-muted-foreground">Takipçi</span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1.5 rounded-md">
            <Eye className="w-4 h-4 text-primary" />
            <span className="font-medium">{store.viewCount || 0}</span>
            <span className="text-muted-foreground">Görüntülenme</span>
          </div>
          
          {parseFloat(store.rating) > 0 && (
            <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1.5 rounded-md">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{parseFloat(store.rating).toFixed(1)}</span>
              <span className="text-muted-foreground">({store.reviewCount} değerlendirme)</span>
            </div>
          )}
          
          {memberDays > 0 && (
            <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1.5 rounded-md">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-medium">{memberDays}</span>
              <span className="text-muted-foreground">gündür üye</span>
            </div>
          )}
        </div>

        {storeBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
            {storeBadges.map((badge: string) => {
              const config = badgeConfig[badge];
              if (!config) return null;
              const Icon = config.icon;
              return (
                <Badge key={badge} className={`${config.color} text-white`}>
                  <Icon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
              );
            })}
          </div>
        )}

        {!isOwner && user && (
          <div className="mb-4 sm:mb-6">
            {isFollowing?.following ? (
              <Button
                variant="outline"
                onClick={() => unfollowMutation.mutate()}
                disabled={unfollowMutation.isPending}
                data-testid="button-unfollow"
                className="w-full sm:w-auto"
              >
                <HeartOff className="w-4 h-4 mr-2" />
                {unfollowMutation.isPending ? "İşleniyor..." : "Takipten Çık"}
              </Button>
            ) : (
              <Button
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                data-testid="button-follow"
                className="w-full sm:w-auto"
              >
                <Heart className="w-4 h-4 mr-2" />
                {followMutation.isPending ? "İşleniyor..." : "Takip Et"}
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="about">
              <TabsList className="w-full">
                <TabsTrigger value="about" className="flex-1 text-xs sm:text-sm" data-testid="tab-about">Hakkında</TabsTrigger>
                <TabsTrigger value="listings" className="flex-1 text-xs sm:text-sm" data-testid="tab-listings">
                  İlanlar ({store.listings?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1 text-xs sm:text-sm" data-testid="tab-reviews">
                  Değerlendirmeler ({store.reviewCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <Card>
                  <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                    <CardTitle className="text-base sm:text-lg">Mağaza Hakkında</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                    <p className="text-sm sm:text-base whitespace-pre-wrap">
                      {store.description || store.summary || "Henüz açıklama eklenmemiş."}
                    </p>
                  </CardContent>
                </Card>

                {store.storeType === "veterinary" && store.workingHours && (
                  <Card>
                    <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Çalışma Saatleri
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(store.workingHours as any[]).map((hours: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm py-1 border-b last:border-0">
                            <span className="font-medium">{hours.day}</span>
                            <span className="text-muted-foreground">{hours.open} - {hours.close}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {store.services && (store.services as string[]).length > 0 && (
                  <Card>
                    <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                      <CardTitle className="text-base sm:text-lg">Sunulan Hizmetler</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                      <div className="flex flex-wrap gap-2">
                        {(store.services as string[]).map((service: string, idx: number) => (
                          <Badge key={idx} variant="outline">{service}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {store.specializations && (store.specializations as string[]).length > 0 && (
                  <Card>
                    <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                      <CardTitle className="text-base sm:text-lg">Uzmanlık Alanları</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                      <div className="flex flex-wrap gap-2">
                        {(store.specializations as string[]).map((spec: string, idx: number) => (
                          <Badge key={idx} variant="secondary">{spec}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="listings" className="mt-4 sm:mt-6">
                {store.listings && store.listings.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {store.listings.map((listing: any) => (
                      <Link key={listing.id} href={`/ilan/${listing.id}`}>
                        <Card className="hover-elevate active-elevate-2 cursor-pointer">
                          <CardContent className="p-3 sm:p-4">
                            <h3 className="font-semibold mb-2 line-clamp-2 text-sm sm:text-base">{listing.title}</h3>
                            <p className="text-lg sm:text-2xl font-bold text-primary mb-2">
                              {parseFloat(listing.price).toLocaleString('tr-TR')} ₺
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {listing.city}, {listing.district}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Bu mağazada henüz ilan yok
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-4 sm:mt-6 space-y-4">
                {user && !isOwner && (
                  <Card>
                    <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                      <CardTitle className="text-base sm:text-lg">Değerlendirme Yaz</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-4">
                      <div>
                        <Label className="text-sm">Puanlama</Label>
                        <div className="flex gap-1.5 sm:gap-2 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="focus:outline-none"
                              data-testid={`button-rating-${star}`}
                            >
                              <Star 
                                className={`w-6 h-6 sm:w-8 sm:h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">Yorumunuz</Label>
                        <Textarea
                          placeholder="Deneyiminizi paylaşın..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={4}
                          data-testid="input-review-comment"
                        />
                      </div>
                      <Button
                        onClick={() => reviewMutation.mutate({ rating, comment })}
                        disabled={reviewMutation.isPending || !comment.trim()}
                        data-testid="button-submit-review"
                        className="w-full sm:w-auto"
                      >
                        {reviewMutation.isPending ? "Gönderiliyor..." : "Değerlendirme Gönder"}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {store.reviews && store.reviews.length > 0 ? (
                  store.reviews.map((review: any) => (
                    <Card key={review.id}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <p className="font-semibold text-sm sm:text-base">
                                {review.reviewerFirstName || review.reviewerLastName 
                                  ? `${review.reviewerFirstName || ''} ${review.reviewerLastName || ''}`.trim() 
                                  : "Anonim"}
                              </p>
                              <div className="flex">
                                {[...Array(review.rating)].map((_, i) => (
                                  <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            </div>
                            {review.comment && <p className="text-xs sm:text-sm">{review.comment}</p>}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Henüz değerlendirme yok
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                <CardTitle className="text-base sm:text-lg">İletişim Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-3">
                {store.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <a href={`tel:${store.phone}`} className="hover:underline truncate" data-testid="link-phone">{store.phone}</a>
                  </div>
                )}
                {store.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <a href={`mailto:${store.email}`} className="hover:underline truncate" data-testid="link-email">{store.email}</a>
                  </div>
                )}
                {store.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <a href={store.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate" data-testid="link-website">
                      Website
                    </a>
                  </div>
                )}
                {store.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p>{store.address}</p>
                  </div>
                )}
                {!store.phone && !store.email && !store.website && !store.address && (
                  <p className="text-sm text-muted-foreground">İletişim bilgisi eklenmemiş</p>
                )}
              </CardContent>
            </Card>

            {store.owner && (
              <Card>
                <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                  <CardTitle className="text-base sm:text-lg">Mağaza Sahibi</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {store.owner.profileImageUrl ? (
                        <img src={store.owner.profileImageUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-base sm:text-lg font-bold text-primary">
                          {(store.owner.firstName?.[0] || store.owner.username?.[0] || 'M').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate" data-testid="text-owner-name">
                        {`${store.owner.firstName || ''} ${store.owner.lastName || ''}`.trim() || store.owner.username || 'Mağaza Sahibi'}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">@{store.owner.username}</p>
                    </div>
                  </div>
                  {!isOwner && user && (
                    <Link href={`/mesajlar?userId=${store.owner.id}`}>
                      <Button className="w-full" variant="outline" data-testid="button-message-owner">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Mesaj Gönder
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
