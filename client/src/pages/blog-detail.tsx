import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, User, ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { BlogPost } from "@shared/schema";
import ReactMarkdown from "react-markdown";

export default function BlogDetail() {
  const params = useParams();
  const slug = params.slug;

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: ["/api/blog", slug],
    enabled: !!slug,
  });

  const { data: allPosts } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
  });

  // Get related posts (same category, different post)
  const relatedPosts = allPosts
    ?.filter((p) => 
      p.id !== post?.id && 
      p.categoryTags?.some((tag) => post?.categoryTags?.includes(tag))
    )
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Blog yazısı yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Blog yazısı bulunamadı</h1>
          <Link href="/blog">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Blog'a Dön
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/blog">
            <Button variant="ghost" size="sm" data-testid="button-back-to-blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Blog'a Dön
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Article Header */}
        <article>
          <header className="mb-8">
            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categoryTags?.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold mb-4" data-testid="text-post-title">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Veteriner Hekim</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{post.readTime} dakika okuma</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(post.createdAt), "d MMMM yyyy", { locale: tr })}
                </span>
              </div>
            </div>
          </header>

          <Separator className="my-8" />

          {/* Content */}
          <div 
            className="prose prose-lg dark:prose-invert max-w-none"
            data-testid="content-blog-post"
          >
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">İlgili Yazılar</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <Link key={related.id} href={`/blog/${related.slug}`}>
                  <Card className="h-full hover-elevate transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {related.categoryTags?.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="font-semibold mb-2 line-clamp-2 hover:text-primary transition-colors">
                        {related.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {related.excerpt}
                      </p>
                      <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{related.readTime} dk</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
