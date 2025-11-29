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
import { ReportDialog } from "@/components/report-dialog";
import { SocialShare } from "@/components/social-share";
import { ListingStats } from "@/components/listing-stats";
import { MakeOfferModal } from "@/components/make-offer-modal";
import { PriceComparison } from "@/components/price-comparison";
import { SellerLevelBadge } from "@/components/seller-level-badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  MapPin,
  Heart,
  MessageSquare,
  Share2,
  Calendar,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Flag,
  Phone,
  ShieldCheck,
  HandCoins,
} from "lucide-react";
import type { Listing, User, Category, Location } from "@shared/schema";
import { CHARACTER_TRAITS, HEALTH_STATUS_OPTIONS, AGE_CATEGORIES, GENDER_OPTIONS } from "@shared/listing-options";

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
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [makeOfferOpen, setMakeOfferOpen] = useState(false);

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
      } catch {
        // Share cancelled or failed silently
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
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
          <Skeleton className="h-8 w-32 mb-4 md:mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              <Skeleton className="aspect-[4/3] md:aspect-video w-full" />
              <Skeleton className="h-48 md:h-64" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-40 md:h-48" />
              <Skeleton className="h-48 md:h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 md:p-12 text-center">
            <h2 className="text-xl md:text-2xl font-bold mb-2">İlan Bulunamadı</h2>
            <p className="text-muted-foreground mb-6 text-sm md:text-base">
              Aradığınız ilan mevcut değil veya kaldırılmış olabilir
            </p>
            <Link href="/ilanlar">
              <Button className="w-full sm:w-auto" data-testid="button-back-to-listings">İlanlara Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const images = listing.images && listing.images.length > 0 ? listing.images : null;
  const price = parseFloat(listing.price as string);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Back Button */}
        <Link href="/ilanlar">
          <Button variant="ghost" size="sm" className="mb-4 md:mb-6 -ml-2" data-testid="button-back">
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="text-sm">Geri</span>
          </Button>
        </Link>

        {/* Mobile Price Header */}
        <div className="lg:hidden mb-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg font-bold line-clamp-2 flex-1" data-testid="text-listing-title-mobile">
              {listing.title}
            </h1>
            <div className="text-xl font-bold text-primary whitespace-nowrap" data-testid="text-price-mobile">
              {price.toLocaleString("tr-TR")}₺
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {listing.category && (
              <Badge variant="secondary" className="text-xs" data-testid="badge-category-mobile">
                {listing.category.name}
              </Badge>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{listing.city}, {listing.district}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {images ? (
                  <div className="relative aspect-[4/3] md:aspect-video bg-muted">
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
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10"
                          onClick={prevImage}
                          data-testid="button-prev-image"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10"
                          onClick={nextImage}
                          data-testid="button-next-image"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-white text-xs md:text-sm">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[4/3] md:aspect-video bg-muted flex items-center justify-center">
                    <span className="text-5xl md:text-6xl">🐾</span>
                  </div>
                )}
                {images && images.length > 1 && (
                  <div className="p-2 md:p-4 overflow-x-auto">
                    <div className="flex gap-2 min-w-min">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-14 h-14 md:w-16 md:h-16 flex-shrink-0 bg-muted overflow-hidden rounded border-2 ${
                            idx === currentImageIndex ? "border-primary" : "border-transparent"
                          }`}
                          data-testid={`button-thumbnail-${idx}`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mobile Quick Actions */}
            <div className="lg:hidden grid grid-cols-2 gap-2">
              <Button
                className="h-11"
                onClick={handleMessageSeller}
                disabled={listing.sellerId === user?.id}
                data-testid="button-message-seller-mobile"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {listing.sellerId === user?.id ? "Kendi İlanınız" : "Mesaj Gönder"}
              </Button>
              <Button
                variant="outline"
                className="h-11"
                onClick={() => toggleFavoriteMutation.mutate()}
                disabled={!isAuthenticated || toggleFavoriteMutation.isPending}
                data-testid="button-toggle-favorite-mobile"
              >
                <Heart
                  className={`w-4 h-4 mr-2 ${
                    isFavorited ? "fill-red-500 text-red-500" : ""
                  }`}
                />
                {isFavorited ? "Favoride" : "Favorile"}
              </Button>
            </div>

            {/* Details */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                {/* Desktop Title and Price */}
                <div className="hidden lg:flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl md:text-2xl mb-2" data-testid="text-listing-title">
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
                    <div className="mt-2">
                      <ListingStats 
                        views={listing.views || 0} 
                        favoriteCount={(listing as any).favoriteCount || 0}
                        shareCount={(listing as any).shareCount || 0}
                        compact
                        showTrending
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl md:text-3xl font-bold text-primary" data-testid="text-price">
                      {price.toLocaleString("tr-TR")}₺
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 space-y-4 md:space-y-6">
                <div>
                  <h3 className="font-semibold mb-2 text-sm md:text-base">Açıklama</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap text-sm md:text-base" data-testid="text-description">
                    {listing.description}
                  </p>
                </div>

                {(listing.breed || listing.age || listing.gender) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3 text-sm md:text-base">Detaylar</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {listing.breed && (
                          <div>
                            <div className="text-xs md:text-sm text-muted-foreground">Cins</div>
                            <div className="font-medium">{listing.breed}</div>
                          </div>
                        )}
                        {listing.age && (
                          <div>
                            <div className="text-xs md:text-sm text-muted-foreground">Yaş</div>
                            <div className="font-medium">{listing.age}</div>
                          </div>
                        )}
                        {listing.gender && (
                          <div>
                            <div className="text-xs md:text-sm text-muted-foreground">Cinsiyet</div>
                            <div className="font-medium">
                              {GENDER_OPTIONS.find(g => g.value === listing.gender)?.label || listing.gender}
                            </div>
                          </div>
                        )}
                        {listing.healthStatus && (
                          <div>
                            <div className="text-xs md:text-sm text-muted-foreground">Sağlık Durumu</div>
                            <div className="font-medium">
                              {HEALTH_STATUS_OPTIONS.find(h => h.value === listing.healthStatus)?.label || listing.healthStatus}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 text-sm md:text-base">Sağlık Bilgileri</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
                    <div className="flex items-center gap-2">
                      {listing.vaccinated ? (
                        <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground shrink-0" />
                      )}
                      <span className={`text-sm ${listing.vaccinated ? "" : "text-muted-foreground"}`}>
                        Aşılı
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {listing.neutered ? (
                        <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground shrink-0" />
                      )}
                      <span className={`text-sm ${listing.neutered ? "" : "text-muted-foreground"}`}>
                        Kısırlaştırılmış
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {listing.pedigree ? (
                        <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground shrink-0" />
                      )}
                      <span className={`text-sm ${listing.pedigree ? "" : "text-muted-foreground"}`}>
                        Soy Ağacı Var
                      </span>
                    </div>
                  </div>
                </div>

                {/* Character Traits */}
                {listing.characterTraits && Array.isArray(listing.characterTraits) && listing.characterTraits.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3 text-sm md:text-base">Karakter Özellikleri</h3>
                      <div className="flex flex-wrap gap-2">
                        {(listing.characterTraits as string[]).map((trait) => {
                          const traitInfo = CHARACTER_TRAITS.find(t => t.value === trait);
                          return (
                            <Badge 
                              key={trait} 
                              variant="secondary"
                              className="text-xs px-2.5 py-1"
                              data-testid={`badge-trait-${trait}`}
                            >
                              {traitInfo?.label || trait}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Seller Info */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base md:text-lg">Satıcı Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 md:w-12 md:h-12">
                    <AvatarImage src={listing.seller?.profileImageUrl || undefined} />
                    <AvatarFallback>
                      {(listing.seller?.firstName?.[0] || listing.seller?.username?.[0] || "S").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate text-sm md:text-base" data-testid="text-seller-name">
                      {listing.seller ? `${listing.seller.firstName || ''} ${listing.seller.lastName || ''}`.trim() || listing.seller.username || "İsimsiz Satıcı" : "İsimsiz Satıcı"}
                    </div>
                    {listing.seller?.phone && (
                      <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {listing.seller.phone}
                      </div>
                    )}
                  </div>
                </div>
                {(listing.seller as any)?.sellerLevel && (
                  <div className="mt-2">
                    <SellerLevelBadge 
                      level={(listing.seller as any).sellerLevel} 
                      score={(listing.seller as any).sellerScore}
                      size="sm"
                    />
                  </div>
                )}
                <Button
                  className="w-full h-10 md:h-11 hidden lg:flex"
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
              <CardContent className="p-3 md:p-4 space-y-2">
                {listing.sellerId === user?.id && (
                  <Link href={`/ilan-duzenle/${listing.id}`}>
                    <Button
                      className="w-full h-10"
                      data-testid="button-edit-listing"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      İlanı Düzenle
                    </Button>
                  </Link>
                )}
                {isAuthenticated && listing.sellerId !== user?.id && (listing as any).allowOffers && (
                  <Button
                    variant="secondary"
                    className="w-full h-10"
                    onClick={() => setMakeOfferOpen(true)}
                    data-testid="button-make-offer"
                  >
                    <HandCoins className="w-4 h-4 mr-2" />
                    Teklif Ver
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full h-10 hidden lg:flex"
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
                {isAuthenticated && listing.sellerId !== user?.id && (
                  <Button
                    variant="ghost"
                    className="w-full h-10 text-muted-foreground hover:text-destructive"
                    onClick={() => setReportDialogOpen(true)}
                    data-testid="button-report-listing"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Şikayet Et
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Social Share */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Paylaş
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <SocialShare 
                  listingId={id || ""} 
                  title={listing.title}
                />
              </CardContent>
            </Card>

            {/* Price Comparison */}
            <PriceComparison 
              listingId={id || ""} 
              currentPrice={listing.price as string} 
            />

            {/* Safety Tips */}
            <Card className="bg-muted/30">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Güvenlik İpuçları
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 text-xs md:text-sm text-muted-foreground space-y-1.5">
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
          <div className="mt-8 md:mt-12">
            <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6">Benzer İlanlar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {similarListings.slice(0, 4).map((similarListing) => (
                <ListingCard key={similarListing.id} listing={similarListing} />
              ))}
            </div>
          </div>
        )}

        {/* Report Dialog */}
        <ReportDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          reportedType="listing"
          reportedId={id || ""}
          reportedTitle={listing.title}
        />

        {/* Make Offer Modal */}
        <MakeOfferModal
          open={makeOfferOpen}
          onOpenChange={setMakeOfferOpen}
          listingId={id || ""}
          listingTitle={listing.title}
          listingPrice={listing.price as string}
          sellerId={listing.sellerId}
        />
      </div>
    </div>
  );
}
