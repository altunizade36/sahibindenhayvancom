import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Building2, MapPin, Star, Phone, Mail, Globe, BadgeCheck, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

export default function StoreDetail() {
  const [, params] = useRoute("/magaza/:slug");
  const slug = params?.slug;
  const { user } = useUser();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: store, isLoading } = useQuery<any>({
    queryKey: [`/api/store/${slug}`],
    enabled: !!slug,
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: { rating: number; comment: string }) => {
      return apiRequest(`/api/store/${store.id}/review`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/store/${slug}`] });
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
            <Button>Mağazalara Dön</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === store.owner?.id;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div 
        className="h-64 relative"
        style={{ 
          backgroundColor: store.banner ? undefined : store.primaryColor,
          backgroundImage: store.banner ? `url(${store.banner})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0">
          <div className="container mx-auto px-4 pb-6">
            <div className="flex items-end gap-6">
              {/* Logo */}
              <div 
                className="w-32 h-32 rounded-lg bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-xl"
              >
                {store.logo ? (
                  <img src={store.logo} alt={store.displayName} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Building2 className="w-16 h-16" style={{ color: store.primaryColor }} />
                )}
              </div>

              {/* Store Info */}
              <div className="flex-1 text-white mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{store.displayName}</h1>
                  {store.verifiedAt && (
                    <Badge className="bg-white/90 text-primary">
                      <BadgeCheck className="w-4 h-4 mr-1" />
                      Onaylı Mağaza
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="secondary">{storeTypeLabels[store.storeType]}</Badge>
                  {store.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {store.city}
                    </div>
                  )}
                  {parseFloat(store.rating) > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {parseFloat(store.rating).toFixed(1)} ({store.reviewCount} değerlendirme)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about">
              <TabsList className="w-full">
                <TabsTrigger value="about" className="flex-1">Hakkında</TabsTrigger>
                <TabsTrigger value="listings" className="flex-1">
                  İlanlar ({store.listings?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1">
                  Değerlendirmeler ({store.reviewCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mağaza Hakkında</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {store.description || store.summary || "Henüz açıklama eklenmemiş."}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="listings" className="mt-6">
                {store.listings && store.listings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {store.listings.map((listing: any) => (
                      <Link key={listing.id} href={`/ilan/${listing.id}`}>
                        <Card className="hover-elevate active-elevate-2 cursor-pointer">
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-2 line-clamp-2">{listing.title}</h3>
                            <p className="text-2xl font-bold text-primary mb-2">
                              {parseFloat(listing.price).toLocaleString('tr-TR')} ₺
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {listing.city}, {listing.district}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Bu mağazada henüz ilan yok
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-6 space-y-4">
                {/* Write Review Form */}
                {user && !isOwner && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Değerlendirme Yaz</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Puanlama</Label>
                        <div className="flex gap-2 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="focus:outline-none"
                            >
                              <Star 
                                className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Yorumunuz</Label>
                        <Textarea
                          placeholder="Deneyiminizi paylaşın..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <Button
                        onClick={() => reviewMutation.mutate({ rating, comment })}
                        disabled={reviewMutation.isPending || !comment.trim()}
                      >
                        {reviewMutation.isPending ? "Gönderiliyor..." : "Değerlendirme Gönder"}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Reviews List */}
                {store.reviews && store.reviews.length > 0 ? (
                  store.reviews.map((review: any) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-semibold">{review.reviewer?.fullName || "Anonim"}</p>
                              <div className="flex">
                                {[...Array(review.rating)].map((_, i) => (
                                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            </div>
                            {review.comment && <p className="text-sm">{review.comment}</p>}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Henüz değerlendirme yok
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>İletişim Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {store.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${store.phone}`} className="hover:underline">{store.phone}</a>
                  </div>
                )}
                {store.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${store.email}`} className="hover:underline">{store.email}</a>
                  </div>
                )}
                {store.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a href={store.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Website
                    </a>
                  </div>
                )}
                {store.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                    <p className="text-sm">{store.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owner Info */}
            {store.owner && (
              <Card>
                <CardHeader>
                  <CardTitle>Mağaza Sahibi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {store.owner.fullName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{store.owner.fullName}</p>
                      <p className="text-sm text-muted-foreground">@{store.owner.username}</p>
                    </div>
                  </div>
                  {!isOwner && user && (
                    <Link href={`/mesajlar?userId=${store.owner.id}`}>
                      <Button className="w-full" variant="outline">
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
