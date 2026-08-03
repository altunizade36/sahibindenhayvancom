import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Building2, MapPin, Star, Phone, Mail, Globe, BadgeCheck, MessageCircle, Users, Eye, Calendar, Shield, Zap, Award, Crown, Clock, Heart, HeartOff, ExternalLink, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

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

const badgeConfig: Record<string, { icon: typeof BadgeCheck; label: string; color: string }> = {
  verified: { icon: BadgeCheck, label: "Onaylı Satıcı", color: "bg-blue-500" },
  successful: { icon: Star, label: "Başarılı Satıcı", color: "bg-yellow-500" },
  fast_seller: { icon: Zap, label: "Hızlı Satıcı", color: "bg-green-500" },
  top_rated: { icon: Award, label: "En Çok Beğenilen", color: "bg-purple-500" },
  trusted: { icon: Shield, label: "Güvenilir Satıcı", color: "bg-teal-500" },
  premium: { icon: Crown, label: "Premium Satıcı", color: "bg-amber-500" },
};

function StoreHero({ store }: { store: any }) {
  const bannerStyle = store.banner 
    ? { backgroundImage: `url(${store.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : store.bannerTemplate 
      ? { background: getBannerTemplateStyle(store.bannerTemplate) }
      : { backgroundColor: store.primaryColor || '#0066CC' };

  return (
    <div className="relative">
      <div className="h-32 sm:h-40 md:h-48 lg:h-56 w-full" style={bannerStyle}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>
      
      <div className="container mx-auto px-4">
        <div className="relative -mt-12 sm:-mt-16 md:-mt-20 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-shrink-0">
              <Avatar className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 border-4 border-background shadow-xl bg-background">
                <AvatarImage src={store.logo || undefined} alt={store.displayName} />
                <AvatarFallback 
                  className="text-3xl sm:text-4xl font-bold"
                  style={{ backgroundColor: store.primaryColor || '#0066CC', color: '#fff' }}
                >
                  {store.displayName?.[0]?.toUpperCase() || 'M'}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1 min-w-0 sm:pb-2">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate" data-testid="text-store-name">
                  {store.displayName}
                </h1>
                {store.verifiedAt && (
                  <Badge className="bg-primary text-primary-foreground flex-shrink-0">
                    <BadgeCheck className="w-3.5 h-3.5 mr-1" />
                    Onaylı
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="flex-shrink-0">
                  {storeTypeLabels[store.storeType] || store.storeType}
                </Badge>
                {store.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{store.city}{store.district ? `, ${store.district}` : ''}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getBannerTemplateStyle(templateId: string): string {
  const templates: Record<string, string> = {
    'gradient-blue': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'gradient-green': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    'gradient-orange': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'gradient-dark': 'linear-gradient(135deg, #232526 0%, #414345 100%)',
    'gradient-sunset': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'gradient-ocean': 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
  };
  return templates[templateId] || templates['gradient-blue'];
}

function StoreStats({ store, memberDays }: { store: any; memberDays: number }) {
  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      <div className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-md">
        <Users className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="font-semibold" data-testid="text-follower-count">{store.followerCount || 0}</span>
        <span className="text-muted-foreground text-sm hidden sm:inline">Takipçi</span>
      </div>
      
      <div className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-md">
        <Eye className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="font-semibold">{store.viewCount || 0}</span>
        <span className="text-muted-foreground text-sm hidden sm:inline">Görüntülenme</span>
      </div>
      
      {parseFloat(store.rating) > 0 && (
        <div className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-md">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
          <span className="font-semibold">{parseFloat(store.rating).toFixed(1)}</span>
          <span className="text-muted-foreground text-sm hidden sm:inline">({store.reviewCount})</span>
        </div>
      )}
      
      {memberDays > 0 && (
        <div className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-md">
          <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="font-semibold">{memberDays}</span>
          <span className="text-muted-foreground text-sm hidden sm:inline">gün</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-md">
        <Package className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="font-semibold">{store.listings?.length || store.totalListings || 0}</span>
        <span className="text-muted-foreground text-sm hidden sm:inline">İlan</span>
      </div>
    </div>
  );
}

function ListingCard({ listing }: { listing: any }) {
  const imageUrl = listing.images?.[0] || null;
  
  return (
    <Link href={`/ilan/${listing.id}`}>
      <Card className="hover-elevate active-elevate-2 cursor-pointer h-full overflow-hidden">
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={listing.title} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <CardContent className="p-3 sm:p-4">
          <h3 className="font-semibold mb-2 line-clamp-2 text-sm sm:text-base min-h-[2.5rem]">{listing.title}</h3>
          <p className="text-lg sm:text-xl font-bold text-primary mb-1">
            {parseFloat(listing.price).toLocaleString('tr-TR')} ₺
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {listing.city}{listing.district ? `, ${listing.district}` : ''}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function StoreDetail() {
  const [, params] = useRoute("/magaza/:slug");
  const slug = params?.slug;
  // useUser() kaldirildi: var olmayan /api/auth/me ucunu cagiriyordu ve
  // giris yapmis kullanici bile "oturum yok" gorunuyordu.
  const { user } = useAuth();
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
      toast({ title: "Hata", description: error.message || "Takip edilemedi", variant: "destructive" });
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
      toast({ title: "Hata", description: error.message || "Takipten çıkılamadı", variant: "destructive" });
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
      toast({ title: "Hata", description: error.message || "Değerlendirme gönderilemedi", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-40 sm:h-48 w-full" />
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-4 mb-6">
            <Skeleton className="w-28 h-28 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Mağaza bulunamadı</h2>
          <p className="text-muted-foreground mb-6">Bu mağaza mevcut değil veya kaldırılmış olabilir.</p>
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
      <StoreHero store={store} />

      <div className="container mx-auto px-4 py-4 sm:py-6">
        <StoreStats store={store} memberDays={memberDays} />

        {storeBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
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
          <div className="mt-4">
            {isFollowing?.following ? (
              <Button
                variant="outline"
                onClick={() => unfollowMutation.mutate()}
                disabled={unfollowMutation.isPending}
                data-testid="button-unfollow"
              >
                <HeartOff className="w-4 h-4 mr-2" />
                {unfollowMutation.isPending ? "İşleniyor..." : "Takipten Çık"}
              </Button>
            ) : (
              <Button
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                data-testid="button-follow"
              >
                <Heart className="w-4 h-4 mr-2" />
                {followMutation.isPending ? "İşleniyor..." : "Takip Et"}
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="about">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="about" className="text-xs sm:text-sm" data-testid="tab-about">Hakkında</TabsTrigger>
                <TabsTrigger value="listings" className="text-xs sm:text-sm" data-testid="tab-listings">
                  İlanlar ({store.listings?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="reviews" className="text-xs sm:text-sm" data-testid="tab-reviews">
                  Yorumlar ({store.reviewCount || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Mağaza Hakkında</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                      {store.description || store.summary || "Henüz açıklama eklenmemiş."}
                    </p>
                  </CardContent>
                </Card>

                {store.storeType === "veterinary" && store.workingHours && Array.isArray(store.workingHours) && store.workingHours.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Çalışma Saatleri
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {store.workingHours.map((hours: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                            <span className="font-medium">{hours.day}</span>
                            <span className="text-muted-foreground">{hours.open} - {hours.close}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {store.services && Array.isArray(store.services) && store.services.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Sunulan Hizmetler</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {store.services.map((service: string, idx: number) => (
                          <Badge key={idx} variant="outline">{service}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {store.specializations && Array.isArray(store.specializations) && store.specializations.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Uzmanlık Alanları</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {store.specializations.map((spec: string, idx: number) => (
                          <Badge key={idx} variant="secondary">{spec}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="listings" className="mt-4">
                {store.listings && store.listings.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {store.listings.map((listing: any) => (
                        <ListingCard key={listing.id} listing={listing} />
                      ))}
                    </div>
                    {/* Vitrinde ilk 20 ilan gösteriliyor; tümü için arama/
                        filtre/sayfalama sunan mağaza ürünleri sayfasına git. */}
                    {(store.totalListings || store.listings.length) >= 20 && (
                      <div className="mt-6 text-center">
                        <Button asChild variant="outline" size="lg" data-testid="button-all-store-listings">
                          <Link href={`/ilanlar?storeId=${store.id}`}>
                            Bu mağazadaki tüm ilanları gör
                          </Link>
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <Card className="p-8 text-center">
                    <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-muted-foreground">Bu mağazada henüz ilan yok</p>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-4 space-y-4">
                {user && !isOwner && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Değerlendirme Yaz</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm">Puanlama</Label>
                        <div className="flex gap-1.5 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="focus:outline-none hover:scale-110 transition-transform"
                              data-testid={`button-rating-${star}`}
                            >
                              <Star className={`w-7 h-7 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
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
                          className="mt-1.5"
                          data-testid="input-review-comment"
                        />
                      </div>
                      <Button
                        onClick={() => reviewMutation.mutate({ rating, comment })}
                        disabled={reviewMutation.isPending || !comment.trim()}
                        data-testid="button-submit-review"
                      >
                        {reviewMutation.isPending ? "Gönderiliyor..." : "Değerlendirme Gönder"}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {store.reviews && store.reviews.length > 0 ? (
                  store.reviews.map((review: any) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarImage src={review.reviewerProfileImage} />
                            <AvatarFallback>{(review.reviewerFirstName?.[0] || 'A').toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm">
                                {review.reviewerFirstName || review.reviewerLastName 
                                  ? `${review.reviewerFirstName || ''} ${review.reviewerLastName || ''}`.trim() 
                                  : "Anonim"}
                              </p>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                  />
                                ))}
                              </div>
                            </div>
                            {review.comment && <p className="text-sm mt-2 leading-relaxed">{review.comment}</p>}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(review.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="p-8 text-center">
                    <Star className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-muted-foreground">Henüz değerlendirme yok</p>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">İletişim Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {store.phone && (
                  <a href={`tel:${store.phone}`} className="flex items-center gap-3 p-2 rounded-md hover-elevate">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm truncate" data-testid="link-phone">{store.phone}</span>
                  </a>
                )}
                {store.email && (
                  <a href={`mailto:${store.email}`} className="flex items-center gap-3 p-2 rounded-md hover-elevate">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm truncate" data-testid="link-email">{store.email}</span>
                  </a>
                )}
                {store.website && (
                  <a href={store.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-md hover-elevate">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm truncate" data-testid="link-website">Website</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto flex-shrink-0" />
                  </a>
                )}
                {store.address && (
                  <div className="flex items-start gap-3 p-2">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm">{store.address}</p>
                  </div>
                )}
                {!store.phone && !store.email && !store.website && !store.address && (
                  <p className="text-sm text-muted-foreground text-center py-4">İletişim bilgisi eklenmemiş</p>
                )}
              </CardContent>
            </Card>

            {store.owner && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Mağaza Sahibi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={store.owner.profileImageUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {(store.owner.firstName?.[0] || store.owner.username?.[0] || 'M').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate" data-testid="text-owner-name">
                        {`${store.owner.firstName || ''} ${store.owner.lastName || ''}`.trim() || store.owner.username || 'Mağaza Sahibi'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">@{store.owner.username}</p>
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
