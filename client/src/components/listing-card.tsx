import { Link } from "wouter";
import { MapPin, Eye, Heart, Clock, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Listing, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface ListingCardProps {
  listing: Listing & { seller?: User; isFavorite?: boolean };
  onFavoriteToggle?: () => void;
}

export function ListingCard({ listing, onFavoriteToggle }: ListingCardProps) {
  const mainImage = listing.images[0] || "/placeholder-animal.jpg";
  const price = parseFloat(listing.price);

  return (
    <Card className="hover-elevate overflow-hidden">
      <Link href={`/ilanlar/${listing.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={mainImage}
            alt={listing.title}
            className="object-cover w-full h-full"
            data-testid={`img-listing-${listing.id}`}
          />
          <div className="absolute top-2 right-2 flex gap-1 flex-wrap justify-end">
            {listing.listingSource === "store" && (
              <Badge variant="default" className="bg-secondary text-secondary-foreground" data-testid={`badge-store-${listing.id}`}>
                <Store className="w-3 h-3 mr-1" />
                Mağaza İlanı
              </Badge>
            )}
            {listing.isPremium && (
              <Badge variant="default" className="bg-primary text-primary-foreground" data-testid={`badge-premium-${listing.id}`}>
                Premium
              </Badge>
            )}
            {listing.isUrgent && (
              <Badge variant="destructive" data-testid={`badge-urgent-${listing.id}`}>
                Acil
              </Badge>
            )}
          </div>
        </div>
      </Link>

      <CardContent className="p-3 md:p-4">
        <Link href={`/ilanlar/${listing.id}`}>
          <h3 className="font-semibold text-base md:text-lg line-clamp-2 mb-2" data-testid={`text-listing-title-${listing.id}`}>
            {listing.title}
          </h3>
        </Link>

        <div className="text-xl md:text-2xl font-bold text-primary mb-2 md:mb-3" data-testid={`text-price-${listing.id}`}>
          ₺{price.toLocaleString("tr-TR")}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
          <div className="flex items-center gap-1" data-testid={`text-location-${listing.id}`}>
            <MapPin className="w-3 h-3 md:w-4 md:h-4" />
            <span>{listing.city}, {listing.district}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 md:w-4 md:h-4" />
            <span>{listing.views || 0}</span>
          </div>
        </div>

        {listing.seller && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Avatar className="w-5 h-5 md:w-6 md:h-6">
              <AvatarImage src={listing.seller.avatar || undefined} />
              <AvatarFallback>{listing.seller.fullName[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs md:text-sm text-muted-foreground" data-testid={`text-seller-${listing.id}`}>
              {listing.seller.fullName}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 md:p-4 pt-0 flex justify-between items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>
            {formatDistanceToNow(new Date(listing.createdAt), {
              addSuffix: true,
              locale: tr,
            })}
          </span>
        </div>
        {onFavoriteToggle && (
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              onFavoriteToggle();
            }}
            data-testid={`button-favorite-${listing.id}`}
          >
            <Heart
              className={`w-5 h-5 ${listing.isFavorite ? "fill-destructive text-destructive" : ""}`}
            />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
