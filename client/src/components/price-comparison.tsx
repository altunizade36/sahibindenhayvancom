import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, Minus, BarChart3 } from "lucide-react";
import { Link } from "wouter";

interface PriceComparisonProps {
  listingId: string;
  currentPrice: string;
}

interface ComparisonData {
  currentListing: {
    id: string;
    price: string;
    pricePosition: 'below_avg' | 'above_avg' | 'average';
  };
  similarListings: Array<{
    id: string;
    title: string;
    price: string;
    images: string[];
    city: string;
    breed: string;
    age: string;
    views: number;
    createdAt: string;
  }>;
  priceStats: {
    average: string;
    min: string;
    max: string;
    count: number;
  };
}

export function PriceComparison({ listingId, currentPrice }: PriceComparisonProps) {
  const { data, isLoading, error } = useQuery<ComparisonData>({
    queryKey: ["/api/listings", listingId, "compare"],
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Fiyat Karsilastirmasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (error || !data || data.similarListings.length === 0) {
    return null;
  }
  
  const price = parseFloat(currentPrice);
  const avgPrice = parseFloat(data.priceStats.average);
  const minPrice = parseFloat(data.priceStats.min);
  const maxPrice = parseFloat(data.priceStats.max);
  
  const position = data.currentListing.pricePosition;
  const priceDiff = price - avgPrice;
  const priceDiffPercent = ((priceDiff / avgPrice) * 100).toFixed(1);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5" />
          Fiyat Karsilastirmasi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">En Dusuk</div>
            <div className="font-semibold text-green-600">
              {minPrice.toLocaleString("tr-TR")} TL
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Ortalama</div>
            <div className="font-semibold">
              {avgPrice.toLocaleString("tr-TR")} TL
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">En Yuksek</div>
            <div className="font-semibold text-red-600">
              {maxPrice.toLocaleString("tr-TR")} TL
            </div>
          </div>
        </div>
        
        <div className="relative pt-2">
          <div className="h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full" />
          <div 
            className="absolute top-0 w-3 h-3 bg-primary rounded-full border-2 border-white shadow transform -translate-x-1/2"
            style={{ 
              left: `${Math.min(100, Math.max(0, ((price - minPrice) / (maxPrice - minPrice)) * 100))}%` 
            }}
          />
        </div>
        
        <div className="flex items-center justify-center gap-2">
          {position === 'below_avg' ? (
            <>
              <TrendingDown className="h-4 w-4 text-green-500" />
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Ortalamanin %{Math.abs(parseFloat(priceDiffPercent))} altinda
              </Badge>
            </>
          ) : position === 'above_avg' ? (
            <>
              <TrendingUp className="h-4 w-4 text-red-500" />
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Ortalamanin %{priceDiffPercent} ustunde
              </Badge>
            </>
          ) : (
            <>
              <Minus className="h-4 w-4 text-gray-500" />
              <Badge variant="outline">Ortalama fiyat</Badge>
            </>
          )}
        </div>
        
        {data.similarListings.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="text-sm font-medium text-muted-foreground">
              Benzer Ilanlar ({data.priceStats.count} ilan)
            </div>
            <div className="grid gap-2">
              {data.similarListings.slice(0, 3).map((listing) => (
                <Link 
                  key={listing.id} 
                  href={`/ilan/${listing.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  data-testid={`link-similar-${listing.id}`}
                >
                  {listing.images[0] && (
                    <img 
                      src={listing.images[0]} 
                      alt={listing.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{listing.title}</div>
                    <div className="text-xs text-muted-foreground">{listing.city}</div>
                  </div>
                  <div className="text-sm font-semibold">
                    {parseFloat(listing.price).toLocaleString("tr-TR")} TL
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
