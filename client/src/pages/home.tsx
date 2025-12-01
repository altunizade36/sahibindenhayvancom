import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/search-bar";
import { ListingCard } from "@/components/listing-card";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Gavel } from "lucide-react";
import type { Category, Listing } from "@shared/schema";
import { SEOHead, generateOrganizationStructuredData } from "@/components/seo-head";
import { Footer } from "@/components/footer";

interface ListingsResponse {
  data: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function Home() {
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: listingsResponse, isLoading } = useQuery<ListingsResponse>({
    queryKey: ["/api/listings", { page: currentPage, limit: 20 }],
  });
  
  const listings = listingsResponse?.data || [];

  const { data: activeAuctions = [] } = useQuery<any[]>({
    queryKey: ["/api/auctions", { status: "live" }],
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-full flex flex-col">
      <SEOHead
        title="sahibindenhayvan.com - Türkiye'nin En Güvenilir Hayvan İlanları Platformu"
        description="Evcil hayvanlarınızı bulun, satın alın, sahiplenin. Köpek, kedi, kuş, balık ve daha fazlası için binlerce ilan. Ücretsiz ilan verin!"
        structuredData={generateOrganizationStructuredData()}
      />
      
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-3 md:py-4">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-xl md:text-2xl font-bold mb-2" data-testid="text-hero-title">
              <span className="text-primary">Hayvan İlanları</span> - Türkiye'nin Hayvan Pazarı
            </h1>
            <SearchBar categories={categories} />
          </div>
        </div>
      </section>

      <section className="py-4 md:py-6 flex-1 min-h-[400px]">
        <div className="container mx-auto px-4 h-full">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-bold">İlanlar</h2>
              {listingsResponse && (
                <span className="text-xs md:text-sm text-muted-foreground">
                  ({listingsResponse.total} ilan)
                </span>
              )}
            </div>
            {listingsResponse && listingsResponse.totalPages > 1 && (
              <span className="text-xs text-muted-foreground">
                Sayfa {currentPage}/{listingsResponse.totalPages}
              </span>
            )}
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : listings.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              
              <Pagination
                currentPage={currentPage}
                totalPages={listingsResponse?.totalPages || 1}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Henüz ilan yok</p>
              <Link href="/ilan-ver">
                <Button className="mt-3">İlk İlanı Siz Verin</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {activeAuctions.length > 0 && (
        <section className="py-4 border-t">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-primary" />
                <h2 className="text-base font-semibold">Aktif Müzayedeler</h2>
              </div>
              <Link href="/muzayedeler">
                <Button variant="ghost" size="sm" data-testid="link-all-auctions">
                  Tümünü Gör
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeAuctions.slice(0, 3).map((auction: any) => (
                <Link key={auction.id} href={`/muzayede/${auction.id}`}>
                  <div className="p-3 rounded-md border border-primary/20 bg-primary/5 hover-elevate cursor-pointer">
                    <h3 className="font-medium text-sm truncate">{auction.listing?.title}</h3>
                    <div className="text-lg font-bold text-primary">
                      ₺{parseFloat(auction.currentPrice).toLocaleString("tr-TR")}
                    </div>
                    <p className="text-xs text-muted-foreground">{auction.totalBids || 0} teklif</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
