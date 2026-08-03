import { useState, useEffect, useRef, useCallback } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/search-bar";
import { ListingCard } from "@/components/listing-card";
import { Pagination } from "@/components/pagination";
import { RecentlyViewedListings } from "@/components/recently-viewed-listings";
import { CategoryExplorer } from "@/components/category-explorer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Gavel, Loader2, ChevronUp, ChevronRight } from "lucide-react";
import type { Category, Listing } from "@shared/schema";
import { SEOHead, generateOrganizationStructuredData } from "@/components/seo-head";


interface ListingsResponse {
  data: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LISTINGS_PER_PAGE = 20;

export default function Home() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<ListingsResponse>({
    queryKey: ["/api/listings", { limit: LISTINGS_PER_PAGE }],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(`/api/listings?page=${pageParam}&limit=${LISTINGS_PER_PAGE}`);
      if (!response.ok) throw new Error("Failed to fetch listings");
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const { data: activeAuctions = [] } = useQuery<any[]>({
    queryKey: ["/api/auctions", { status: "live" }],
  });

  const allListings = data?.pages.flatMap(page => page.data) || [];
  const totalListings = data?.pages[0]?.total || 0;
  const totalPages = data?.pages[0]?.totalPages || 1;
  const currentPage = data?.pages.length || 1;

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [handleIntersection]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageChange = (page: number) => {
    window.location.href = `/ilanlar?page=${page}`;
  };

  return (
    <div className="min-h-full flex flex-col">
      <SEOHead
        title="sahibindenhayvan.com - Türkiye'nin En Güvenilir Hayvan İlanları Platformu"
        description="Evcil hayvanlarınızı bulun, satın alın, sahiplenin. Köpek, kedi, kuş, balık ve daha fazlası için binlerce ilan. Ücretsiz ilan verin!"
        structuredData={generateOrganizationStructuredData()}
      />
      
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-2 md:py-3">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-base md:text-lg font-bold mb-1.5" data-testid="text-hero-title">
              <span className="text-primary">Hayvan İlanları</span> - Türkiye'nin Hayvan Pazarı
            </h1>
            <SearchBar categories={categories} />
          </div>
        </div>
      </section>

      {/* Kategori ikon şeridi kaldırıldı: soldaki yan menü zaten aynı 17
          kategoriyi listeliyordu. Aynı bilgiyi iki kez göstermek ekranın
          üst kısmını gereksiz dolduruyor, içerik aşağı itiliyordu. */}

      <section className="py-3 md:py-4 flex-1 min-h-[400px]">
        <div className="container mx-auto px-4 h-full">
          <CategoryExplorer categories={categories} />
          <RecentlyViewedListings />
          
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-bold">İlanlar</h2>
              {totalListings > 0 && (
                <span className="text-xs md:text-sm text-muted-foreground">
                  ({totalListings.toLocaleString("tr-TR")} ilan)
                </span>
              )}
            </div>
            {totalPages > 1 && (
              <span className="text-xs text-muted-foreground">
                {allListings.length} / {totalListings.toLocaleString("tr-TR")} gösteriliyor
              </span>
            )}
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">İlanlar yüklenirken bir hata oluştu</p>
              <Button className="mt-3" onClick={() => window.location.reload()}>
                Tekrar Dene
              </Button>
            </div>
          ) : allListings.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {allListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              
              <div 
                ref={loadMoreRef} 
                className="flex justify-center py-8"
                data-testid="infinite-scroll-trigger"
              >
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Daha fazla ilan yükleniyor...</span>
                  </div>
                ) : hasNextPage ? (
                  <Button 
                    variant="outline" 
                    onClick={() => fetchNextPage()}
                    data-testid="button-load-more"
                  >
                    Daha Fazla Göster
                  </Button>
                ) : allListings.length >= LISTINGS_PER_PAGE ? (
                  <p className="text-sm text-muted-foreground">
                    Tüm ilanlar gösteriliyor
                  </p>
                ) : null}
              </div>
              
              {totalPages > 1 && (
                <div className="border-t pt-6 mt-2">
                  <p className="text-center text-sm text-muted-foreground mb-4">
                    veya sayfa numarası ile gezinin
                  </p>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Henüz ilan yok</p>
              <Link href="/ilan-ver">
                <Button className="mt-3">Ücretsiz İlan Ver</Button>
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

      {showScrollTop && (
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
          onClick={scrollToTop}
          data-testid="button-scroll-top"
        >
          <ChevronUp className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}
