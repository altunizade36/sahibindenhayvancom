import { useQuery } from "@tanstack/react-query";
import { useCompare } from "@/contexts/compare-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, GitCompare, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import type { Listing } from "@shared/schema";

export function CompareBar() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();

  const { data: listings = [] } = useQuery<Listing[]>({
    queryKey: ["/api/listings/compare", compareItems],
    queryFn: async () => {
      if (compareItems.length === 0) return [];
      const params = new URLSearchParams();
      compareItems.forEach(id => params.append('id', id));
      const response = await fetch(`/api/listings/compare?${params}`);
      if (!response.ok) throw new Error("Failed to fetch listings");
      return response.json();
    },
    enabled: compareItems.length > 0,
  });

  if (compareItems.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg p-4"
        data-testid="compare-bar"
      >
        <div className="container mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <GitCompare className="w-5 h-5 text-primary" />
            <span>Karşılaştırma</span>
            <Badge variant="secondary">{compareItems.length}/4</Badge>
          </div>

          <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center gap-2 bg-muted rounded-lg p-2 min-w-[200px] max-w-[250px]"
              >
                {listing.images && listing.images.length > 0 ? (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted-foreground/20" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{listing.title}</p>
                  <p className="text-xs text-primary font-bold">
                    {Number(listing.price).toLocaleString("tr-TR")} ₺
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={() => removeFromCompare(listing.id)}
                  data-testid={`button-remove-compare-${listing.id}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompare}
              className="text-muted-foreground"
              data-testid="button-clear-compare"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Temizle
            </Button>
            <Link href="/karsilastir">
              <Button 
                size="sm"
                disabled={compareItems.length < 2}
                data-testid="button-go-to-compare"
              >
                <GitCompare className="w-4 h-4 mr-1" />
                Karşılaştır ({compareItems.length})
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
