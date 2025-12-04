import { Link, useLocation } from "wouter";
import { MapPin, Eye, Heart, Clock, Store, GitCompare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCompare } from "@/contexts/compare-context";
import type { Listing, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface ListingCardProps {
  listing: Listing & { 
    seller?: User; 
    isFavorite?: boolean;
    store?: { id: string; slug: string; displayName: string; logo?: string | null };
    isExampleListing?: boolean;
  };
  onFavoriteToggle?: () => void;
  variant?: "vertical" | "horizontal";
}

// Yellow diagonal stripe component for example listings
function ExampleListingBadge() {
  return (
    <div 
      className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
      data-testid="example-listing-overlay"
    >
      <div 
        className="absolute -right-8 top-4 rotate-45 bg-yellow-500 text-black text-[10px] font-bold py-0.5 px-8 shadow-md"
        style={{ 
          transform: 'rotate(45deg)',
          transformOrigin: 'center'
        }}
      >
        ÖRNEK İLAN
      </div>
    </div>
  );
}

export function ListingCard({ listing, onFavoriteToggle, variant = "vertical" }: ListingCardProps) {
  const [, setLocation] = useLocation();
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } = useCompare();
  const mainImage = listing.images?.[0] || "/placeholder-animal.jpg";
  const price = parseFloat(listing.price || "0");
  const inCompare = isInCompare(listing.id);
  
  const sellerName = listing.seller 
    ? `${listing.seller.firstName || ''} ${listing.seller.lastName || ''}`.trim() || listing.seller.username || 'Anonim'
    : 'Anonim';
  const sellerInitial = sellerName.charAt(0).toUpperCase();

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(listing.id);
    } else if (canAddMore) {
      addToCompare(listing.id);
    }
  };

  // Horizontal/List View
  if (variant === "horizontal") {
    return (
      <Card className="hover-elevate overflow-hidden w-full relative">
        {listing.isExampleListing && <ExampleListingBadge />}
        <Link href={`/ilan/${listing.id}`}>
          <div className="flex flex-row relative w-full">
            {/* Image - smaller on very small screens */}
            <div className="relative w-[72px] min-[360px]:w-20 min-[400px]:w-28 sm:w-36 shrink-0">
              <div className="aspect-square overflow-hidden">
                <img
                  src={mainImage}
                  alt={listing.title}
                  className="object-cover w-full h-full"
                  data-testid={`img-listing-${listing.id}`}
                />
              </div>
              {listing.listingSource === "store" && listing.store && (
                <Badge 
                  variant="default" 
                  className="absolute top-1 left-1 bg-secondary text-secondary-foreground text-[10px] px-1.5 py-0.5" 
                  data-testid={`badge-store-${listing.id}`}
                >
                  <Store className="w-2.5 h-2.5 mr-0.5" />
                  <span className="hidden min-[400px]:inline">Mağaza</span>
                </Badge>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-1.5 min-[360px]:p-2 min-[400px]:p-3 flex flex-col justify-between min-w-0 overflow-hidden">
              <div>
                <h3 className="font-semibold text-xs min-[400px]:text-sm sm:text-base line-clamp-2 mb-0.5 min-[400px]:mb-1" data-testid={`text-listing-title-${listing.id}`}>
                  {listing.title}
                </h3>
                <div className="text-sm min-[400px]:text-base sm:text-lg font-bold text-primary mb-1 min-[400px]:mb-2" data-testid={`text-price-${listing.id}`}>
                  ₺{price.toLocaleString("tr-TR")}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 min-[400px]:gap-2 text-[10px] min-[400px]:text-xs text-muted-foreground">
                  <div className="flex items-center gap-0.5" data-testid={`text-location-${listing.id}`}>
                    <MapPin className="w-2.5 h-2.5 min-[400px]:w-3 min-[400px]:h-3" />
                    <span className="truncate max-w-[60px] min-[400px]:max-w-none">{listing.city}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Eye className="w-2.5 h-2.5 min-[400px]:w-3 min-[400px]:h-3" />
                    <span>{listing.views || 0}</span>
                  </div>
                  <div className="hidden min-[400px]:flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(new Date(listing.createdAt), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seller - hidden on very small screens */}
              {listing.seller && (
                <div className="hidden min-[400px]:flex items-center gap-1.5 mt-1.5 pt-1.5 border-t">
                  <Avatar className="w-4 h-4">
                    <AvatarImage src={listing.seller.profileImageUrl || undefined} />
                    <AvatarFallback className="text-[10px]">{sellerInitial}</AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] text-muted-foreground truncate" data-testid={`text-seller-${listing.id}`}>
                    {sellerName}
                  </span>
                </div>
              )}
            </div>

            {/* Actions - absolute positioned on very small screens */}
            <div className="absolute top-1 right-1 min-[360px]:static min-[360px]:p-1 min-[400px]:p-2 flex items-start gap-0.5">
              <Button
                size="icon"
                variant="ghost"
                className={`h-6 w-6 min-[360px]:h-7 min-[360px]:w-7 min-[400px]:h-8 min-[400px]:w-8 bg-background/80 min-[360px]:bg-transparent ${inCompare ? "text-primary" : ""}`}
                onClick={handleCompareClick}
                disabled={!inCompare && !canAddMore}
                data-testid={`button-compare-${listing.id}`}
              >
                <GitCompare
                  className={`w-3.5 h-3.5 min-[400px]:w-4 min-[400px]:h-4 ${inCompare ? "text-primary" : ""}`}
                />
              </Button>
              {onFavoriteToggle && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 min-[360px]:h-7 min-[360px]:w-7 min-[400px]:h-8 min-[400px]:w-8 bg-background/80 min-[360px]:bg-transparent"
                  onClick={(e) => {
                    e.preventDefault();
                    onFavoriteToggle();
                  }}
                  data-testid={`button-favorite-${listing.id}`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 min-[400px]:w-4 min-[400px]:h-4 ${listing.isFavorite ? "fill-destructive text-destructive" : ""}`}
                  />
                </Button>
              )}
            </div>
          </div>
        </Link>
      </Card>
    );
  }

  // Vertical/Grid View (Default)
  return (
    <Card className="hover-elevate overflow-hidden relative">
      {listing.isExampleListing && <ExampleListingBadge />}
      <Link href={`/ilan/${listing.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={mainImage}
            alt={listing.title}
            className="object-cover w-full h-full"
            data-testid={`img-listing-${listing.id}`}
          />
          <div className="absolute top-2 right-2 flex gap-1 flex-wrap justify-end">
            {listing.listingSource === "store" && listing.store && (
              <Badge 
                variant="default" 
                className="bg-secondary text-secondary-foreground cursor-pointer" 
                data-testid={`badge-store-${listing.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLocation(`/magazalar/${listing.store!.slug}`);
                }}
              >
                <Store className="w-3 h-3 mr-1" />
                Mağaza
              </Badge>
            )}
          </div>
        </div>
      </Link>

      <CardContent className="p-2.5 sm:p-3 md:p-4">
        <Link href={`/ilan/${listing.id}`}>
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2 mb-1.5 sm:mb-2" data-testid={`text-listing-title-${listing.id}`}>
            {listing.title}
          </h3>
        </Link>

        <div className="text-base sm:text-lg md:text-xl font-bold text-primary mb-1.5 sm:mb-2" data-testid={`text-price-${listing.id}`}>
          ₺{price.toLocaleString("tr-TR")}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground mb-1.5 sm:mb-2">
          <div className="flex items-center gap-1 truncate" data-testid={`text-location-${listing.id}`}>
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{listing.city}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Eye className="w-3 h-3" />
            <span>{listing.views || 0}</span>
          </div>
        </div>

        {listing.seller && (
          <div className="flex items-center gap-2 pt-1.5 sm:pt-2 border-t">
            <Avatar className="w-4 h-4 sm:w-5 sm:h-5">
              <AvatarImage src={listing.seller.profileImageUrl || undefined} />
              <AvatarFallback className="text-xs">{sellerInitial}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate" data-testid={`text-seller-${listing.id}`}>
              {sellerName}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-2.5 sm:p-3 md:p-4 pt-0 flex justify-between items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="truncate">
            {formatDistanceToNow(new Date(listing.createdAt), {
              addSuffix: true,
              locale: tr,
            })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={`h-7 w-7 sm:h-8 sm:w-8 ${inCompare ? "text-primary" : ""}`}
                onClick={handleCompareClick}
                disabled={!inCompare && !canAddMore}
                data-testid={`button-compare-${listing.id}`}
              >
                <GitCompare className={`w-4 h-4 sm:w-5 sm:h-5 ${inCompare ? "text-primary" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {inCompare ? "Karşılaştırmadan Çıkar" : canAddMore ? "Karşılaştır" : "Maksimum 4 ilan"}
            </TooltipContent>
          </Tooltip>
          {onFavoriteToggle && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={(e) => {
                e.preventDefault();
                onFavoriteToggle();
              }}
              data-testid={`button-favorite-${listing.id}`}
            >
              <Heart
                className={`w-4 h-4 sm:w-5 sm:h-5 ${listing.isFavorite ? "fill-destructive text-destructive" : ""}`}
              />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
