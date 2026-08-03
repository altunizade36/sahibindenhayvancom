import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { SEOHead, generateListingStructuredData, generateBreadcrumbStructuredData, combineStructuredData } from "@/components/seo-head";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ListingCard } from "@/components/listing-card";
import { ReportDialog } from "@/components/report-dialog";
import { SocialShare } from "@/components/social-share";
import { ListingStats } from "@/components/listing-stats";
import { MakeOfferModal } from "@/components/make-offer-modal";
import { PriceComparison } from "@/components/price-comparison";
import { SellerLevelBadge } from "@/components/seller-level-badge";
import { GuestContactForm } from "@/components/guest-contact-form";
import { SellerRatingSummary, SellerReviews } from "@/components/seller-rating";
import { VideoGallery } from "@/components/video-upload";
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
  PhoneCall,
  ZoomIn,
  X,
  FileText,
  Truck,
  ShieldAlert,
  Play,
  Tag,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { imageVariant, imageVariants } from "@shared/image-variants";
import type { Listing, User, Category, Location } from "@shared/schema";
import { CHARACTER_TRAITS, HEALTH_STATUS_OPTIONS, AGE_CATEGORIES, GENDER_OPTIONS } from "@shared/listing-options";

type ListingWithDetails = Listing & {
  seller?: User;
  category?: Category;
  location?: Location;
  deliveryInfo?: string;
  warrantyInfo?: string;
  videoUrls?: string[];
  isExampleListing?: boolean | null;
  exampleSource?: string | null;
  documents?: Array<{
    id: string;
    documentType: string;
    documentUrl: string;
    status: string;
    documentNumber?: string;
  }>;
};

export default function ListingDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [makeOfferOpen, setMakeOfferOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const viewTrackedRef = useRef(false);

  const { data: listing, isLoading } = useQuery<ListingWithDetails>({
    queryKey: [`/api/listings/${id}`],
    enabled: !!id,
  });

  const { data: favorites } = useQuery<any[]>({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
  });

  const { data: similarListings = [] } = useQuery<Listing[]>({
    queryKey: [`/api/listings/${id}/similar`],
    enabled: !!id,
  });

  // Satıcının diğer aktif ilanları (bu ilan hariç). Herkese açık uç yalnız
  // yayındaki ilanları döndürüyor.
  const { data: sellerListingsRaw = [] } = useQuery<Listing[]>({
    queryKey: [`/api/users/${listing?.sellerId}/listings`],
    enabled: !!listing?.sellerId && !listing?.isExampleListing,
  });
  const sellerOtherListings = sellerListingsRaw.filter((l) => l.id !== id).slice(0, 4);

  const isFavorited = favorites?.some((fav) => fav.listingId === id);

  // Track listing view for recently viewed feature
  const trackViewMutation = useMutation({
    mutationFn: async (listingId: string) => {
      return apiRequest("POST", "/api/viewed-listings", { listingId });
    },
  });

  // Track view when listing loads (only once per page visit)
  useEffect(() => {
    if (listing && isAuthenticated && id && !viewTrackedRef.current) {
      viewTrackedRef.current = true;
      trackViewMutation.mutate(id);
      
      // Also store in localStorage for guest users sync later
      try {
        const viewed = JSON.parse(localStorage.getItem('viewedListings') || '[]');
        const filtered = viewed.filter((v: any) => v.id !== id);
        filtered.unshift({ id, viewedAt: new Date().toISOString() });
        localStorage.setItem('viewedListings', JSON.stringify(filtered.slice(0, 50)));
      } catch (e) {
        // Ignore localStorage errors
      }
    } else if (listing && !isAuthenticated && id) {
      // For guest users, only store in localStorage
      try {
        const viewed = JSON.parse(localStorage.getItem('viewedListings') || '[]');
        const filtered = viewed.filter((v: any) => v.id !== id);
        filtered.unshift({ id, viewedAt: new Date().toISOString() });
        localStorage.setItem('viewedListings', JSON.stringify(filtered.slice(0, 50)));
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, [listing, isAuthenticated, id]);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        throw new Error("Giriş yapmanız gerekiyor");
      }
      if (isFavorited) {
        return apiRequest("DELETE", `/api/favorites/${id}`);
      } else {
        return apiRequest("POST", "/api/favorites", { listingId: id });
      }
    },
    onMutate: async () => {
      // İşlemin niyetini BURADA yakala. onMutate optimistic olarak favori
      // listesini değiştirdiği anda `isFavorited` türetilmiş değeri hemen
      // tersine döner; onSuccess onu okursa toast ters çıkar ("ekledim" ama
      // "kaldırıldı" der). Bu yüzden eklendi/kaldırıldı bilgisini context'e
      // koyup onSuccess'te oradan okuyoruz.
      const ekleniyor = !isFavorited;
      await queryClient.cancelQueries({ queryKey: ["/api/favorites"] });
      const previousFavorites = queryClient.getQueryData<any[]>(["/api/favorites"]);

      queryClient.setQueryData(["/api/favorites"], (old: any[] | undefined) => {
        const current = old || [];
        if (ekleniyor) {
          return [...current, { listingId: id, id: 'temp-' + Date.now() }];
        }
        return current.filter(fav => fav.listingId !== id);
      });

      return { previousFavorites: previousFavorites || [], ekleniyor };
    },
    onSuccess: (_data, _vars, context) => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      const eklendi = context?.ekleniyor;
      toast({
        title: eklendi ? "Favorilere eklendi" : "Favorilerden kaldırıldı",
        description: eklendi
          ? "İlan favorilerinize eklendi"
          : "İlan favorilerinizden çıkarıldı",
      });
    },
    onError: (error: any, _, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(["/api/favorites"], context.previousFavorites);
      }
      toast({
        title: "Hata",
        description: error.message || "İşlem sırasında bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleFavoriteClick = () => {
    if (!isAuthenticated) {
      toast({
        title: "Giriş Gerekli",
        description: "Favorilere eklemek için giriş yapmalısınız",
        variant: "destructive",
      });
      navigate("/giris");
      return;
    }
    toggleFavoriteMutation.mutate();
  };

  const handleMessageSeller = () => {
    // Örnek ilan: buton görünür (ziyaretçi platformun mesajlaşma özelliğini
    // görsün) ama gerçek mesaj gönderilmez — örnek ilanın gerçek sahibi yok.
    if (listing?.isExampleListing) {
      toast({
        title: "Bu bir örnek ilan",
        description:
          "Örnek ilanlar platformu tanıtmak için eklendi. Gerçek bir ilanda alıcılar satıcıya buradan anında mesaj gönderebilir.",
      });
      return;
    }
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

  /*
   * Galeride BUYUK boyut gosteriliyor.
   *
   * listings.images alaninda kucuk boyut (400x400) saklaniyor - ilan kartlari
   * icin dogru, ama detay sayfasindaki buyuk fotograf 400px'lik bir gorselden
   * buyutulunce bulaniklasiyordu. Boyut adresten turetiliyor (bkz.
   * shared/image-variants.ts), ek istek gerekmiyor.
   */
  const images = listing.images && listing.images.length > 0
    ? imageVariants(listing.images as string[], "large")
    : null;
  const price = parseFloat(listing.price as string);

  return (
    <div className="min-h-screen bg-background">
      {/* İlan sayfaları sitenin en değerli SEO varlığı; daha önce hiç meta
          etiketi yoktu ve hepsi ana sayfa başlığını kullanıyordu. */}
      {listing && (
        <SEOHead
          title={`${listing.title} — ${listing.city || "Türkiye"} | sahibindenhayvan.com`}
          description={
            (listing.description || "").slice(0, 155) ||
            `${listing.title} ilanı. ${listing.city || ""} ${listing.district || ""} bölgesinde satılık.`
          }
          // Paylasim onizlemesi icin orta boyut: 400x400 kucuk boyut
          // WhatsApp/Facebook onizlemesinde kucuk goruntuleniyordu.
          image={imageVariant((listing.images as string[] | undefined)?.[0], "medium")}
          type="product"
          canonical={`/ilan/${listing.id}`}
          structuredData={combineStructuredData(
            generateListingStructuredData(listing),
            generateBreadcrumbStructuredData([
              { name: "Ana Sayfa", url: "/" },
              { name: "İlanlar", url: "/ilanlar" },
              { name: listing.title, url: `/ilan/${listing.id}` },
            ])
          )}
        />
      )}

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
                  <div 
                    className="relative aspect-[4/3] md:aspect-video bg-muted cursor-zoom-in group"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <img
                      src={images[currentImageIndex]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                      data-testid="img-listing-main"
                    />
                    {/* Zoom hint */}
                    <div className="absolute top-3 right-3 bg-black/60 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-4 h-4 text-white" />
                    </div>
                    {images.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10"
                          onClick={(e) => { e.stopPropagation(); prevImage(); }}
                          data-testid="button-prev-image"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10"
                          onClick={(e) => { e.stopPropagation(); nextImage(); }}
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

            {/* Lightbox Dialog */}
            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
              <DialogContent className="max-w-[95vw] md:max-w-4xl lg:max-w-6xl p-0 bg-black/95 border-none">
                <DialogTitle className="sr-only">{listing.title} - Resim Galerisi</DialogTitle>
                <div className="relative">
                  {/* Close button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-50 text-white hover:bg-white/20"
                    onClick={() => setLightboxOpen(false)}
                    data-testid="button-close-lightbox"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                  
                  {/* Main image */}
                  {images && (
                    <div className="relative flex items-center justify-center min-h-[50vh] md:min-h-[70vh]">
                      <img
                        src={images[currentImageIndex]}
                        alt={listing.title}
                        className="max-w-full max-h-[85vh] object-contain"
                        data-testid="img-lightbox-main"
                      />
                      
                      {/* Navigation arrows */}
                      {images.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 text-white hover:bg-white/20"
                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                            data-testid="button-lightbox-prev"
                          >
                            <ChevronLeft className="w-8 h-8" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 text-white hover:bg-white/20"
                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                            data-testid="button-lightbox-next"
                          >
                            <ChevronRight className="w-8 h-8" />
                          </Button>
                        </>
                      )}
                      
                      {/* Image counter */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full text-white text-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </div>
                  )}
                  
                  {/* Thumbnails */}
                  {images && images.length > 1 && (
                    <div className="bg-black/80 p-3 overflow-x-auto">
                      <div className="flex gap-2 justify-center min-w-min">
                        {images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-16 h-16 flex-shrink-0 overflow-hidden rounded border-2 transition-all ${
                              idx === currentImageIndex 
                                ? "border-white opacity-100" 
                                : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                            data-testid={`button-lightbox-thumbnail-${idx}`}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Mobile Quick Actions - Enhanced */}
            <div className="lg:hidden space-y-3">
              {/* Example Listing Warning */}
              {listing.isExampleListing && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 text-center">
                  <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 border-yellow-400">
                    ÖRNEK İLANDIR
                  </Badge>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                    Platformu tanıtmak için eklendi. Gerçek ilanlarda satıcıya mesaj gönderebilir,
                    teklif verebilir ve favorilerinize ekleyebilirsiniz.
                  </p>
                </div>
              )}

              {/* Mesaj butonu — örnek ilanda da görünür (özellik tanıtımı);
                  tıklanınca handleMessageSeller örnek ilanı bilgilendirir. */}
              {listing.sellerId !== user?.id && (
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-semibold shadow-lg"
                  onClick={handleMessageSeller}
                  data-testid="button-message-seller-mobile"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Satıcıya Mesaj Gönder
                </Button>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                {listing.sellerId === user?.id ? (
                  <Badge variant="secondary" className="h-11 justify-center col-span-2">
                    Bu sizin ilanınız
                  </Badge>
                ) : listing.isExampleListing ? (
                  null
                ) : (
                  <>
                    {/* Phone and WhatsApp buttons */}
                    {listing.seller?.phone && (
                      <>
                        <Button variant="outline" className="w-full h-11" asChild>
                          <a 
                            href={`tel:${listing.seller?.phone || ''}`}
                            data-testid="link-call-seller-mobile"
                          >
                            <PhoneCall className="w-4 h-4 mr-2" />
                            Ara
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full h-11 text-green-600 border-green-500"
                          asChild
                        >
                          <a 
                            href={`https://wa.me/${(listing.seller?.phone || '').replace(/[^0-9]/g, '').replace(/^0/, '90')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid="link-whatsapp-seller-mobile"
                          >
                            <SiWhatsapp className="w-4 h-4 mr-2" />
                            WhatsApp
                          </a>
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={handleFavoriteClick}
                disabled={toggleFavoriteMutation.isPending}
                data-testid="button-toggle-favorite-mobile"
              >
                <Heart
                  className={`w-4 h-4 mr-2 ${
                    isFavorited ? "fill-red-500 text-red-500" : ""
                  }`}
                />
                {isFavorited ? "Favorilerden Çıkar" : "Favorilere Ekle"}
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

                {/* Video Gallery */}
                <VideoGallery listingId={listing.id} />

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


                {/* Videos */}
                {listing.videoUrls && Array.isArray(listing.videoUrls) && listing.videoUrls.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3 text-sm md:text-base flex items-center gap-2">
                        <Play className="w-4 h-4 text-primary" />
                        Videolar
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {listing.videoUrls.map((url, idx) => {
                          const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
                          const videoId = isYouTube 
                            ? url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/)?.[1]
                            : null;
                          
                          if (videoId) {
                            return (
                              <div key={idx} className="aspect-video rounded-lg overflow-hidden bg-muted" data-testid={`video-embed-${idx}`}>
                                <iframe
                                  src={`https://www.youtube.com/embed/${videoId}`}
                                  title={`Video ${idx + 1}`}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            );
                          }
                          return (
                            <a 
                              key={idx} 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                              data-testid={`video-link-${idx}`}
                            >
                              <Play className="w-5 h-5 text-primary" />
                              <span className="text-sm truncate flex-1">{url}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Delivery Info */}
                {listing.deliveryInfo && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3 text-sm md:text-base flex items-center gap-2">
                        <Truck className="w-4 h-4 text-primary" />
                        Teslimat Bilgisi
                      </h3>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="text-delivery-info">
                          {listing.deliveryInfo}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Warranty Info */}
                {listing.warrantyInfo && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3 text-sm md:text-base flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-primary" />
                        Garanti Bilgisi
                      </h3>
                      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap" data-testid="text-warranty-info">
                          {listing.warrantyInfo}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Documents/Certificates */}
                {listing.documents && Array.isArray(listing.documents) && listing.documents.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3 text-sm md:text-base flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Belgeler ve Sertifikalar
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {listing.documents.map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
                            data-testid={`document-link-${doc.id}`}
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium capitalize">
                                {doc.documentType.replace(/_/g, ' ')}
                              </div>
                              {doc.documentNumber && (
                                <div className="text-xs text-muted-foreground">No: {doc.documentNumber}</div>
                              )}
                              <Badge 
                                variant={doc.status === 'verified' ? 'default' : 'secondary'} 
                                className="mt-1 text-xs"
                              >
                                {doc.status === 'verified' ? 'Onaylı' : 'Beklemede'}
                              </Badge>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Example Listing Warning (Desktop) — mesaj butonu görünür ki
                ziyaretçi platformun özelliğini görsün; tıklanınca bilgilendirir. */}
            {listing.isExampleListing && (
              <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30">
                <CardContent className="p-4 text-center space-y-3">
                  <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 border-yellow-400 text-sm px-4 py-1">
                    ÖRNEK İLANDIR
                  </Badge>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Platformu tanıtmak için eklendi. Gerçek ilanlarda satıcıya mesaj gönderebilir,
                    teklif verebilir ve favorilerinize ekleyebilirsiniz.
                  </p>
                  {listing.exampleSource && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Kaynak: {listing.exampleSource}
                    </p>
                  )}
                  {listing.sellerId !== user?.id && (
                    <Button className="w-full" onClick={handleMessageSeller} data-testid="button-message-seller-example">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Satıcıya Mesaj Gönder
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Primary Contact CTA - Big prominent message button or Guest Contact Form */}
            {listing.sellerId !== user?.id && !listing.isExampleListing && (
              <>
                {isAuthenticated ? (
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 overflow-hidden">
                    <CardContent className="p-4 md:p-5">
                      <div className="text-center space-y-3">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-2">
                          <MessageSquare className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Bu İlanla İlgileniyor musunuz?</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Satıcıyla hemen iletişime geçin
                          </p>
                        </div>
                        <Button
                          size="lg"
                          className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                          onClick={handleMessageSeller}
                          data-testid="button-message-seller-primary"
                        >
                          <MessageSquare className="w-5 h-5 mr-2" />
                          Satıcıya Mesaj Gönder
                        </Button>
                        
                        {listing.seller?.phone && (
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <Button
                              variant="outline"
                              className="h-11 bg-background"
                              asChild
                            >
                              <a 
                                href={`tel:${listing.seller?.phone || ''}`}
                                data-testid="link-call-seller-primary"
                              >
                                <PhoneCall className="w-4 h-4 mr-2" />
                                Ara
                              </a>
                            </Button>
                            <Button
                              variant="outline"
                              className="h-11 bg-background text-green-600 border-green-500 hover:bg-green-50 hover:text-green-700"
                              asChild
                            >
                              <a 
                                href={`https://wa.me/${(listing.seller?.phone || '').replace(/[^0-9]/g, '').replace(/^0/, '90')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-testid="link-whatsapp-seller-primary"
                              >
                                <SiWhatsapp className="w-4 h-4 mr-2" />
                                WhatsApp
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <GuestContactForm
                    listingId={listing.id}
                    listingTitle={listing.title}
                    sellerName={listing.seller ? `${listing.seller.firstName || ''} ${listing.seller.lastName || ''}`.trim() || listing.seller.username || undefined : undefined}
                  />
                )}
              </>
            )}

            {/* Seller Info - Modified for example listings */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base md:text-lg">
                  {listing.isExampleListing ? "Örnek İlan Bilgisi" : "Satıcı Bilgileri"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-4">
                {listing.isExampleListing ? (
                  <div className="text-sm text-muted-foreground">
                    <p>Bu ilan, platformumuzun örnek içeriğidir.</p>
                    <p className="mt-2">Gerçek satıcı bilgileri, gerçek ilanlar için görüntülenir.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12 md:w-14 md:h-14 ring-2 ring-background shadow-md">
                          <AvatarImage src={listing.seller?.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                            {(listing.seller?.firstName?.[0] || listing.seller?.username?.[0] || "S").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate text-base" data-testid="text-seller-name">
                          {listing.seller ? `${listing.seller.firstName || ''} ${listing.seller.lastName || ''}`.trim() || listing.seller.username || "İsimsiz Satıcı" : "İsimsiz Satıcı"}
                        </div>
                        {/* Üyelik tarihi — güven sinyali. Sahte "Çevrimiçi"
                            göstergesinin yerini aldı: gerçek presence verisi
                            herkese açık uçta yok, sabit "Çevrimiçi" yanıltıcıydı. */}
                        {listing.seller?.createdAt && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="text-seller-since">
                            <Calendar className="w-3 h-3" />
                            {new Date(listing.seller.createdAt).toLocaleDateString("tr-TR", { year: "numeric", month: "long" })} tarihinden beri üye
                          </div>
                        )}
                        <SellerRatingSummary sellerId={listing.sellerId} compact />
                        {listing.seller?.city && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {listing.seller.city}
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
                    
                    {/* Compact Contact Buttons for own listing view */}
                    {listing.sellerId === user?.id && (
                      <div className="pt-2">
                        <Badge variant="secondary" className="w-full justify-center py-2">
                          Bu sizin ilanınız
                        </Badge>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Seller Reviews - Hidden for example listings */}
            {!listing.isExampleListing && (
              <SellerReviews
                sellerId={listing.sellerId}
                listingId={listing.id}
                canReview={isAuthenticated && listing.sellerId !== user?.id}
              />
            )}

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
                {isAuthenticated && listing.sellerId !== user?.id && (listing as any).allowOffers && !listing.isExampleListing && (
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
                  onClick={handleFavoriteClick}
                  disabled={toggleFavoriteMutation.isPending}
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
                  title={listing?.title || ""}
                />
              </CardContent>
            </Card>

            {/* Price Comparison */}
            <PriceComparison 
              listingId={id || ""} 
              currentPrice={(listing?.price as string) || "0"} 
            />

            {/* Güvenli Alışveriş — dolandırıcılığa karşı uyarı */}
            <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-900 dark:text-amber-200">
                  <ShieldAlert className="w-4 h-4" />
                  Güvenli Alışveriş
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 text-xs md:text-sm text-amber-900/90 dark:text-amber-100/90 space-y-2">
                <p className="flex gap-2">
                  <span aria-hidden>⚠️</span>
                  <span><strong>Hayvanı görmeden, elden teslim almadan ödeme yapmayın.</strong></span>
                </p>
                <p className="flex gap-2">
                  <span aria-hidden>•</span>
                  <span><strong>Kapora/kaparo</strong> adı altında para isteyenlere <strong>itibar etmeyin.</strong> En sık görülen dolandırıcılık budur.</span>
                </p>
                <p className="flex gap-2">
                  <span aria-hidden>•</span>
                  <span>"Kargoyla gönderirim, önce parayı yatır" diyen satıcılara dikkat edin.</span>
                </p>
                <p className="flex gap-2">
                  <span aria-hidden>•</span>
                  <span>Sizi WhatsApp'a/havaleye yönlendirip site dışına çekmeye çalışanlara güvenmeyin.</span>
                </p>
                <p className="flex gap-2">
                  <span aria-hidden>•</span>
                  <span>Aşı ve sağlık belgelerini teslim anında isteyin.</span>
                </p>
                {isAuthenticated && listing.sellerId !== user?.id && (
                  <button
                    type="button"
                    onClick={() => setReportDialogOpen(true)}
                    className="pt-1 font-medium underline underline-offset-2 hover:opacity-80"
                    data-testid="button-report-from-safety"
                  >
                    Şüpheli bir durum mu var? Bu ilanı bildirin
                  </button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Satıcının diğer ilanları — güven sinyali + site içi gezinme */}
        {sellerOtherListings.length > 0 && (
          <div className="mt-8 md:mt-12">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-lg md:text-2xl font-bold">Satıcının Diğer İlanları</h2>
              {listing?.sellerId && (
                <Link
                  href={`/ilanlar?sellerId=${listing.sellerId}`}
                  className="text-sm text-primary hover:underline font-medium"
                  data-testid="link-all-seller-listings"
                >
                  Tümünü gör
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {sellerOtherListings.map((sellerListing) => (
                <ListingCard key={sellerListing.id} listing={sellerListing} />
              ))}
            </div>
          </div>
        )}

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
          reportedTitle={listing?.title || ""}
        />

        {/* Make Offer Modal */}
        <MakeOfferModal
          open={makeOfferOpen}
          onOpenChange={setMakeOfferOpen}
          listingId={id || ""}
          listingTitle={listing?.title || ""}
          listingPrice={(listing?.price as string) || "0"}
          sellerId={listing?.sellerId || ""}
        />
      </div>

      {/* Sticky Mobile Footer - Always visible contact bar - Hidden for example listings */}
      {listing.sellerId !== user?.id && !listing.isExampleListing && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-40 safe-area-pb">
          <div className="container mx-auto px-3 py-3">
            <div className="flex items-center gap-2">
              {/* Primary: Platform Message */}
              <Button
                size="lg"
                className="flex-1 h-12 text-base font-semibold"
                onClick={handleMessageSeller}
                data-testid="button-message-seller-sticky"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Mesaj Gönder
              </Button>
              
              {/* Secondary: Phone */}
              {listing.seller?.phone && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0"
                  onClick={() => window.location.href = `tel:${listing.seller?.phone || ''}`}
                  data-testid="button-call-seller-sticky"
                >
                  <PhoneCall className="w-5 h-5" />
                </Button>
              )}
              
              {/* Secondary: WhatsApp */}
              {listing.seller?.phone && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0 text-green-600 border-green-500"
                  onClick={() => window.open(`https://wa.me/${(listing.seller?.phone || '').replace(/[^0-9]/g, '').replace(/^0/, '90')}`, '_blank')}
                  data-testid="button-whatsapp-seller-sticky"
                >
                  <SiWhatsapp className="w-5 h-5" />
                </Button>
              )}
              
              {/* Favorite */}
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 shrink-0"
                onClick={handleFavoriteClick}
                disabled={toggleFavoriteMutation.isPending}
                data-testid="button-favorite-sticky"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isFavorited ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Spacer for sticky footer on mobile */}
      {listing.sellerId !== user?.id && !listing.isExampleListing && (
        <div className="lg:hidden h-20" />
      )}
    </div>
  );
}
