import { useQuery } from "@tanstack/react-query";
import { ListingCard } from "./listing-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { Clock, ChevronRight, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Listing } from "@shared/schema";

interface ViewedListing extends Listing {
  viewedAt: string;
}

export function RecentlyViewedListings() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

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
    return null;
  }

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Son Görüntülenenler</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="aspect-square rounded-t-lg" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (viewedListings.length === 0) {
    return null;
  }

  return (
    <section className="mb-8" data-testid="section-recently-viewed">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Son Görüntülenenler</h2>
          <span className="text-sm text-muted-foreground">({viewedListings.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearHistoryMutation.mutate()}
            disabled={clearHistoryMutation.isPending}
            className="text-muted-foreground hover:text-destructive"
            data-testid="button-clear-viewed-history"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Temizle
          </Button>
          <Link href="/panel/son-goruntuleneler">
            <Button variant="ghost" size="sm" className="text-primary" data-testid="link-view-all-viewed">
              Tümünü Gör
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {viewedListings.slice(0, 5).map((listing) => (
          <ListingCard 
            key={listing.id} 
            listing={listing}
          />
        ))}
      </div>
    </section>
  );
}
