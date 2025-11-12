import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, User, Search, Calendar, TrendingUp, BookOpen, ArrowUpDown } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { BlogPost } from "@shared/schema";

type SortOption = "newest" | "oldest" | "title" | "readTime";

// Extended type with author relation from API
type BlogPostWithAuthor = BlogPost & {
  author?: {
    id: string;
    fullName: string | null;
    avatar: string | null;
    email: string;
  } | null;
};

export default function BlogList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const { data: posts, isLoading } = useQuery<BlogPostWithAuthor[]>({
    queryKey: ["/api/blog"],
  });

  // Get unique categories with counts
  const categoriesWithCount = useMemo(() => {
    if (!posts) return [];
    const categoryMap = new Map<string, number>();
    posts.forEach((post) => {
      post.categoryTags?.forEach((tag) => {
        categoryMap.set(tag, (categoryMap.get(tag) || 0) + 1);
      });
    });
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    if (!posts) return [];

    // Filter
    let filtered = posts.filter((post) => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || 
        post.categoryTags?.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "title":
          return a.title.localeCompare(b.title, "tr");
        case "readTime":
          return (a.readTime || 0) - (b.readTime || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [posts, searchQuery, selectedCategory, sortBy]);

  // Stats
  const stats = useMemo(() => {
    if (!posts || posts.length === 0) return { total: 0, categories: 0, avgReadTime: 0 };
    const total = posts.length;
    const categories = categoriesWithCount.length;
    const avgReadTime = Math.round(
      posts.reduce((sum, post) => sum + (post.readTime || 0), 0) / total
    );
    return { total, categories, avgReadTime };
  }, [posts, categoriesWithCount]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Skeleton */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
          <div className="container mx-auto px-4 py-12">
            <Skeleton className="h-12 w-96 mb-4" />
            <Skeleton className="h-6 w-full max-w-2xl" />
            <Skeleton className="h-6 w-3/4 max-w-xl mt-2" />
            <div className="flex gap-6 mt-8">
              <Skeleton className="h-20 w-32" />
              <Skeleton className="h-20 w-32" />
              <Skeleton className="h-20 w-32" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Filter Skeleton */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-full md:w-48" />
            <Skeleton className="h-10 w-full md:w-48" />
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-full">
                <CardHeader>
                  <div className="flex gap-2 mb-3">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Stats */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-blog-title">
              Hayvan Bakımı Blog
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Köpekler, kediler, küçükbaş hayvanlar ve daha fazlası hakkında uzman veterinerlerden
              bilgilendirici içerikler. Sağlık, beslenme, eğitim ve bakım konularında her şey burada.
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-xs text-muted-foreground">Blog Yazısı</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.categories}</p>
                      <p className="text-xs text-muted-foreground">Kategori</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.avgReadTime} dk</p>
                      <p className="text-xs text-muted-foreground">Ort. Okuma</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tag Cloud */}
            {categoriesWithCount.length > 0 && (
              <div className="mt-8">
                <p className="text-sm font-medium mb-3 text-muted-foreground">Popüler Konular:</p>
                <div className="flex flex-wrap gap-2">
                  {categoriesWithCount.slice(0, 8).map(({ name, count }) => (
                    <Badge
                      key={name}
                      variant={selectedCategory === name ? "default" : "secondary"}
                      className="cursor-pointer hover-elevate transition-all"
                      onClick={() => setSelectedCategory(selectedCategory === name ? "all" : name)}
                      data-testid={`badge-category-${name}`}
                    >
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                      <span className="ml-1.5 text-xs opacity-70">({count})</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search, Filter, and Sort */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Blog yazılarında ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-blog-search"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-blog-category">
                <SelectValue placeholder="Kategori seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {categoriesWithCount.map(({ name }) => (
                  <SelectItem key={name} value={name}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-blog-sort">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">En Yeni</SelectItem>
                <SelectItem value="oldest">En Eski</SelectItem>
                <SelectItem value="title">Başlık (A-Z)</SelectItem>
                <SelectItem value="readTime">Okuma Süresi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground">
            {filteredAndSortedPosts.length} yazı bulundu
            {selectedCategory !== "all" && ` (${selectedCategory})`}
            {searchQuery && ` "${searchQuery}" için`}
          </p>
        </div>

        {/* Blog Posts Grid */}
        {filteredAndSortedPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                data-testid={`card-blog-${post.id}`}
              >
                <Card className="h-full hover-elevate active-elevate-2 transition-all cursor-pointer flex flex-col">
                  <CardHeader className="flex-none">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.categoryTags?.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="text-xl line-clamp-2 hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
                      {post.excerpt}
                    </p>

                    {/* Author and Date */}
                    <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground border-t pt-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={post.author?.avatar || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10">
                            {post.author?.fullName?.split(" ").map((n: string) => n[0]).join("") || "VA"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{post.author?.fullName || "Veteriner Hekim"}</span>
                      </div>
                      <div className="flex items-center gap-1 ml-auto">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(post.createdAt), "d MMM yyyy", { locale: tr })}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{post.readTime} dk okuma</span>
                      </div>
                      <span className="text-primary font-medium">
                        Devamını oku →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-2">
              Sonuç bulunamadı
            </p>
            <p className="text-muted-foreground">
              Arama kriterlerinize uygun blog yazısı bulunamadı.
              {(searchQuery || selectedCategory !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="block mx-auto mt-2 text-primary hover:underline"
                  data-testid="button-reset-filters"
                >
                  Filtreleri temizle
                </button>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
