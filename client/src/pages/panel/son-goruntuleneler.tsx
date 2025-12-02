import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { 
  Clock, 
  Trash2, 
  MapPin, 
  Eye, 
  ArrowLeft,
  Calendar,
  Package
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import type { Listing } from "@shared/schema";

interface ViewedListing extends Listing {
  viewedAt: string;
}

export default function SonGoruntulenelerPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: viewedListings = [], isLoading } = useQuery<ViewedListing[]>({
    queryKey: ["/api/viewed-listings"],
    enabled: isAuthenticated,
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/viewed-listings");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/viewed-listings"] });
      localStorage.removeItem('viewedListings');
      toast({
        title: "Geçmiş Temizlendi",
        description: "Görüntüleme geçmişiniz silindi",
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Görüntüleme geçmişinizi görmek için giriş yapın
            </p>
            <Button onClick={() => navigate("/giris")}>Giriş Yap</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/panel">
          <Button variant="ghost" size="icon" data-testid="button-back-to-panel">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Son Görüntülenenler
          </h1>
          <p className="text-sm text-muted-foreground">
            Son 50 görüntülediğiniz ilan
          </p>
        </div>
        {viewedListings.length > 0 && (
          <Button
            variant="outline"
            onClick={() => clearHistoryMutation.mutate()}
            disabled={clearHistoryMutation.isPending}
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            data-testid="button-clear-all-history"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Geçmişi Temizle
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="flex gap-4 p-4">
                <Skeleton className="w-24 h-24 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : viewedListings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Eye className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Henüz hiç ilan görüntülemediniz</p>
            <p className="text-muted-foreground mb-4 text-center">
              Gezindiğiniz ilanlar burada listelenecek
            </p>
            <Link href="/ilanlar">
              <Button data-testid="button-browse-listings">İlanlara Göz At</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {viewedListings.map((listing) => (
            <Link key={listing.id} href={`/ilan/${listing.id}`}>
              <Card 
                className="hover-elevate cursor-pointer transition-shadow"
                data-testid={`card-viewed-listing-${listing.id}`}
              >
                <CardContent className="flex gap-4 p-4">
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-medium truncate">{listing.title}</h3>
                      {listing.status !== 'active' && listing.status && (
                        <Badge variant="secondary" className="flex-shrink-0">
                          {listing.status === 'sold' ? 'Satıldı' : 
                           listing.status === 'pending' ? 'Beklemede' :
                           listing.status === 'rejected' ? 'Reddedildi' :
                           listing.status === 'expired' ? 'Süresi Doldu' :
                           listing.status === 'deleted' ? 'Silindi' :
                           listing.status === 'draft' ? 'Taslak' : listing.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg font-bold text-primary mb-2">
                      {Number(listing.price).toLocaleString("tr-TR")} ₺
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {listing.city}
                        {listing.district && `, ${listing.district}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(listing.createdAt), "dd MMM yyyy", { locale: tr })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Görüntülenme: {formatDistanceToNow(new Date(listing.viewedAt), { 
                        addSuffix: true, 
                        locale: tr 
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
