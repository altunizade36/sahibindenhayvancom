import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard } from "@/components/listing-card";
import { Pagination } from "@/components/pagination";
import { ChevronRight, Package } from "lucide-react";
import type { Category, Listing } from "@shared/schema";

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

interface ListingsResponse {
  data: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function CategoryDetailPage() {
  const [, params] = useRoute("/kategori/:slug");
  const slug = params?.slug;
  const [currentPage, setCurrentPage] = useState(1);

  const { data: category, isLoading: categoryLoading } = useQuery<CategoryWithChildren>({
    queryKey: ["/api/categories", slug],
    enabled: !!slug,
  });

  const { data: categoryTree = [] } = useQuery<CategoryWithChildren[]>({
    queryKey: ["/api/categories/tree"],
  });

  const { data: listingsResponse, isLoading: listingsLoading } = useQuery<ListingsResponse>({
    queryKey: ["/api/listings", { categoryId: category?.id, page: currentPage, limit: 20 }],
    enabled: !!category?.id,
  });

  const breadcrumb = [];
  if (category) {
    const findPath = (cats: CategoryWithChildren[], targetId: string, path: Category[] = []): Category[] | null => {
      for (const cat of cats) {
        if (cat.id === targetId) {
          return [...path, cat];
        }
        if (cat.children && cat.children.length > 0) {
          const found = findPath(cat.children, targetId, [...path, cat]);
          if (found) return found;
        }
      }
      return null;
    };
    const pathResult = findPath(categoryTree, category.id);
    if (pathResult) breadcrumb.push(...pathResult);
  }

  const subCategories = category?.children || [];

  if (categoryLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 mb-8">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Kategori Bulunamadı</h2>
        <p className="text-muted-foreground mb-4">Aradığınız kategori mevcut değil</p>
        <Link href="/">
          <Button>Ana Sayfaya Dön</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4" data-testid="breadcrumb">
          <Link href="/">
            <Button variant="ghost" className="p-0 h-auto" data-testid="link-home">Ana Sayfa</Button>
          </Link>
          {breadcrumb.map((cat, idx) => (
            <div key={cat.id} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              {idx === breadcrumb.length - 1 ? (
                <span className="font-medium text-foreground" data-testid={`text-category-${cat.slug}`}>{cat.name}</span>
              ) : (
                <Link href={`/kategori/${cat.slug}`}>
                  <Button variant="ghost" className="p-0 h-auto" data-testid={`link-category-${cat.slug}`}>{cat.name}</Button>
                </Link>
              )}
            </div>
          ))}
        </nav>

        <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground text-lg" data-testid="text-category-description">{category.description}</p>
        )}
      </div>

      {subCategories.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Alt Kategoriler</h2>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4" data-testid="grid-subcategories">
            {subCategories.map((subCat) => (
              <Link key={subCat.id} href={`/kategori/${subCat.slug}`}>
                <Card className="hover-elevate active-elevate-2 cursor-pointer h-full" data-testid={`card-subcategory-${subCat.slug}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      {subCat.icon && (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-xl">{subCat.icon}</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{subCat.name}</h3>
                        {subCat.children && subCat.children.length > 0 && (
                          <p className="text-sm text-muted-foreground">{subCat.children.length} alt kategori</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {category.name} İlanları
          </h2>
          {listingsResponse && (
            <Badge variant="secondary" data-testid="text-listing-count">
              {listingsResponse.total} ilan
            </Badge>
          )}
        </div>

        {listingsLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : listingsResponse && listingsResponse.data.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" data-testid="grid-listings">
              {listingsResponse.data.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            
            {listingsResponse.totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={listingsResponse.totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        ) : (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2" data-testid="text-no-listings">Henüz İlan Yok</h3>
            <p className="text-muted-foreground mb-4">
              Bu kategoride henüz ilan bulunmuyor
            </p>
            <Link href="/ilan-ver">
              <Button data-testid="button-create-listing">İlk İlanı Siz Verin</Button>
            </Link>
          </Card>
        )}
      </section>
    </div>
  );
}
