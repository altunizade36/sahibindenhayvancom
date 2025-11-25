import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard } from "@/components/listing-card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  MapPin,
  DollarSign,
  Heart,
  MessageSquare,
  Share2,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Listing, User, Category, Location } from "@shared/schema";

type ListingWithDetails = Listing & {
  seller?: User;
  category?: Category;
  location?: Location;
};

export default function ListingDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: listing, isLoading } = useQuery<ListingWithDetails>({
    queryKey: ["/api/listings", id],
    enabled: !!id,
  });

  const { data: favorites } = useQuery<any[]>({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
  });

  const { data: similarListings = [] } = useQuery<Listing[]>({
    queryKey: ["/api/listings", id, "similar"],
    enabled: !!id,
  });

  const isFavorited = favorites?.some((fav) => fav.listingId === id);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        return apiRequest("DELETE", `/api/favorites/${id}`);
      } else {
        return apiRequest("POST", "/api/favorites", { listingId: id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: isFavorited ? "Favorilerden kaldırıldı" : "Favorilere eklendi",
        description: isFavorited
          ? "İlan favorilerinizden çıkarıldı"
          : "İlan favorilerinize eklendi",
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

  const handleMessageSeller = () => {
    if (!isAuthenticated) {
      toast({
        title: "Giriş Gerekli",
        description: "Satıcıyla mesajlaşmak için giriş yapmalısınız",
        variant: "destructive",
      });
      navigate("/giris");
      return;
    }
    navigate(`/mesajlar?userId=${listing?.sellerId}`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.title,
          text: listing?.description,
          url,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Kopyalandı",
        description: "İlan linki panoya kopyalandı",
      });
    }
  };

  const nextImage = () => {
    if (listing?.images && listing.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
    }
  };

  const prevImage = () => {
    if (listing?.images && listing.images.length > 0) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + listing.images.length) % listing.images.length
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-video w-full" />
              <Skeleton className="h-64" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">İlan Bulunamadı</h2>
            <p className="text-muted-foreground mb-6">
              Aradığınız ilan mevcut değil veya kaldırılmış olabilir
            </p>
            <Link href="/ilanlar">
              <Button data-testid="button-back-to-listings">İlanlara Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const images = listing.images && listing.images.length > 0 ? listing.images : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link href="/ilanlar">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ChevronLeft className="w-4 h-4 mr-2" />
            İlanlara Dön
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card>
              <CardContent className="p-0">
                {images ? (
                  <div className="relative aspect-video bg-muted">
                    <img
                      src={images[currentImageIndex]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                      data-testid="img-listing-main"
                    />
                    {images.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2"
                          onClick={prevImage}
                          data-testid="button-prev-image"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={nextImage}
                          data-testid="button-next-image"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <span className="text-6xl">🐾</span>
                  </div>
                )}
                {images && images.length > 1 && (
                  <div className="p-4 grid grid-cols-6 gap-2">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`aspect-square bg-muted overflow-hidden rounded border-2 ${
                          idx === currentImageIndex ? "border-primary" : "border-transparent"
                        }`}
                        data-testid={`button-thumbnail-${idx}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2" data-testid="text-listing-title">
                      {listing.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      {listing.category && (
                        <Badge variant="secondary" data-testid="badge-category">
                          {listing.category.name}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span data-testid="text-location">
                          {listing.location?.name || `${listing.city}, ${listing.district}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(listing.createdAt).toLocaleDateString("tr-TR")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary" data-testid="text-price">
                      {parseFloat(listing.price as string).toLocaleString("tr-TR")}₺
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Açıklama</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap" data-testid="text-description">
                    {listing.description}
                  </p>
                </div>

                {(listing.breed || listing.age || listing.gender) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3">Detaylar</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {listing.breed && (
                          <div>
                            <div className="text-sm text-muted-foreground">Cins</div>
                            <div className="font-medium">{listing.breed}</div>
                          </div>
                        )}
                        {listing.age && (
                          <div>
                            <div className="text-sm text-muted-foreground">Yaş</div>
                            <div className="font-medium">{listing.age}</div>
                          </div>
                        )}
                        {listing.gender && (
                          <div>
                            <div className="text-sm text-muted-foreground">Cinsiyet</div>
                            <div className="font-medium">
                              {listing.gender === "male" ? "Erkek" : "Dişi"}
                            </div>
                          </div>
                        )}
                        {listing.healthStatus && (
                          <div>
                            <div className="text-sm text-muted-foreground">Sağlık Durumu</div>
                            <div className="font-medium">{listing.healthStatus}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Sağlık Bilgileri</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {listing.vaccinated ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className={listing.vaccinated ? "" : "text-muted-foreground"}>
                        Aşılı
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {listing.neutered ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className={listing.neutered ? "" : "text-muted-foreground"}>
                        Kısırlaştırılmış
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {listing.pedigree ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className={listing.pedigree ? "" : "text-muted-foreground"}>
                        Soy Ağacı Var
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Seller Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Satıcı Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={listing.seller?.profileImageUrl || undefined} />
                    <AvatarFallback>
                      {(listing.seller?.firstName?.[0] || listing.seller?.username?.[0] || "S").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold" data-testid="text-seller-name">
                      {listing.seller ? `${listing.seller.firstName || ''} ${listing.seller.lastName || ''}`.trim() || listing.seller.username || "İsimsiz Satıcı" : "İsimsiz Satıcı"}
                    </div>
                    {listing.seller?.phone && (
                      <div className="text-sm text-muted-foreground">
                        {listing.seller.phone}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleMessageSeller}
                  disabled={listing.sellerId === user?.id}
                  data-testid="button-message-seller"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {listing.sellerId === user?.id ? "Kendi İlanınız" : "Mesaj Gönder"}
                </Button>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toggleFavoriteMutation.mutate()}
                  disabled={!isAuthenticated || toggleFavoriteMutation.isPending}
                  data-testid="button-toggle-favorite"
                >
                  <Heart
                    className={`w-4 h-4 mr-2 ${
                      isFavorited ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                  {isFavorited ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleShare}
                  data-testid="button-share"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Paylaş
                </Button>
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Güvenlik İpuçları</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Alışverişinizi güvenli bir yerde yapın</p>
                <p>• Ödeme yapmadan önce hayvanı görün</p>
                <p>• Sağlık belgelerini kontrol edin</p>
                <p>• Şüpheli durumları bildirin</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Similar Listings */}
        {similarListings.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Benzer İlanlar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarListings.slice(0, 4).map((similarListing) => (
                <ListingCard key={similarListing.id} listing={similarListing} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
