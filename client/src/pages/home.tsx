import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/search-bar";
import { ListingCard } from "@/components/listing-card";
import { CategoryGrid } from "@/components/category-grid";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowRight, Gavel } from "lucide-react";
import type { Category, Listing } from "@shared/schema";

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

  const { data: listingsResponse } = useQuery<ListingsResponse>({
    queryKey: ["/api/listings", { page: currentPage, limit: 50 }],
  });
  
  const featuredListings = listingsResponse?.data || [];

  const { data: activeAuctions = [] } = useQuery<any[]>({
    queryKey: ["/api/auctions", { status: "live" }],
  });

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-hero-title">
              Türkiye'nin En Güvenilir <br />
              <span className="text-primary">Hayvan İlanları Platformu</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8" data-testid="text-hero-subtitle">
              Evcil dostlarınızı bulun, satın alın, sahiplenin. Binlerce ilan arasından aradığınızı bulun.
            </p>
            <SearchBar categories={categories} />
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Popüler Kategoriler</h2>
            <p className="text-muted-foreground">
              En çok aranan hayvan kategorilerine göz atın
            </p>
          </div>
          <CategoryGrid categories={categories.filter(c => c.parentId === null).slice(0, 6)} />
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Tüm İlanlar</h2>
              {listingsResponse && (
                <p className="text-muted-foreground mt-2">
                  {listingsResponse.total} ilan bulundu
                </p>
              )}
            </div>
          </div>
          
          {featuredListings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              
              <Pagination
                currentPage={currentPage}
                totalPages={listingsResponse?.totalPages || 1}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Henüz ilan yok</p>
              <Link href="/ilan-ver">
                <Button className="mt-4">İlk İlanı Siz Verin</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {activeAuctions.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Gavel className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-bold">Aktif Müzayedeler</h2>
              </div>
              <Link href="/muzayedeler">
                <Button variant="ghost" data-testid="link-all-auctions">
                  Tümünü Gör <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeAuctions.slice(0, 3).map((auction: any) => (
                <Link key={auction.id} href={`/muzayede/${auction.id}`}>
                  <div className="p-6 rounded-lg border border-primary/20 bg-primary/5 hover-elevate cursor-pointer">
                    <h3 className="font-semibold mb-2">{auction.listing?.title}</h3>
                    <div className="text-2xl font-bold text-primary mb-2">
                      ₺{parseFloat(auction.currentPrice).toLocaleString("tr-TR")}
                    </div>
                    <p className="text-sm text-muted-foreground">{auction.totalBids || 0} teklif</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Neden sahibindenhayvan.com?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Kolay Arama</h3>
                <p className="text-sm text-muted-foreground">
                  Gelişmiş filtreleme ile aradığınız hayvanı hızla bulun
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gavel className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Güvenli Müzayedeler</h3>
                <p className="text-sm text-muted-foreground">
                  Şeffaf ve adil müzayede sisteminde fırsatları kaçırmayın
                </p>
              </div>
              <div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Güvenilir Platform</h3>
                <p className="text-sm text-muted-foreground">
                  Doğrulanmış satıcılar, güvenli ödeme, veteriner danışmanlık
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
