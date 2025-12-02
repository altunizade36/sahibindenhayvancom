import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Star, ThumbsUp, MessageSquare, CheckCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface SellerRatingData {
  avgRating: string;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  reviews: Array<{
    review: {
      id: string;
      rating: number;
      comment: string | null;
      sellerResponse: string | null;
      sellerResponseAt: Date | null;
      isVerifiedPurchase: boolean;
      helpfulCount: number;
      createdAt: Date;
    };
    reviewer: {
      id: string;
      username: string;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
    } | null;
    listing: {
      id: string;
      title: string;
      images: string[] | null;
    } | null;
  }>;
}

const reviewFormSchema = z.object({
  rating: z.number().min(1, "Puan gerekli").max(5),
  comment: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

interface SellerRatingSummaryProps {
  sellerId: string;
  compact?: boolean;
}

export function SellerRatingSummary({ sellerId, compact = false }: SellerRatingSummaryProps) {
  const { data, isLoading } = useQuery<{ avgRating: string; totalReviews: number }>({
    queryKey: ["/api/sellers", sellerId, "rating"],
  });

  if (isLoading) {
    return compact ? (
      <Skeleton className="h-4 w-20" />
    ) : (
      <Skeleton className="h-6 w-32" />
    );
  }

  if (!data || data.totalReviews === 0) {
    return compact ? null : (
      <span className="text-sm text-muted-foreground">Henüz değerlendirme yok</span>
    );
  }

  const rating = parseFloat(data.avgRating);

  return (
    <div className={`flex items-center gap-1 ${compact ? "text-xs" : "text-sm"}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${compact ? "w-3 h-3" : "w-4 h-4"} ${
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <span className="font-medium">{data.avgRating}</span>
      <span className="text-muted-foreground">({data.totalReviews})</span>
    </div>
  );
}

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
}

function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="p-0.5 focus:outline-none focus:ring-2 focus:ring-primary rounded"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          data-testid={`star-rating-${star}`}
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

interface SellerReviewsProps {
  sellerId: string;
  listingId?: string;
  canReview?: boolean;
}

export function SellerReviews({ sellerId, listingId, canReview = false }: SellerReviewsProps) {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery<SellerRatingData>({
    queryKey: ["/api/sellers", sellerId, "reviews"],
  });

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (formData: ReviewFormData) => {
      const response = await apiRequest("POST", `/api/sellers/${sellerId}/reviews`, {
        ...formData,
        listingId,
      });
      return response.json();
    },
    onSuccess: () => {
      setDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/sellers", sellerId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sellers", sellerId, "rating"] });
      toast({
        title: "Değerlendirme Gönderildi",
        description: "Değerlendirmeniz için teşekkürler!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Değerlendirme gönderilemedi",
        variant: "destructive",
      });
    },
  });

  const helpfulMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await apiRequest("POST", `/api/seller-reviews/${reviewId}/helpful`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sellers", sellerId, "reviews"] });
      toast({
        title: "Teşekkürler",
        description: "Geri bildiriminiz kaydedildi",
      });
    },
  });

  const onSubmit = (formData: ReviewFormData) => {
    submitMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const rating = parseFloat(data?.avgRating || "0");
  const totalReviews = data?.totalReviews || 0;
  const distribution = data?.ratingDistribution || {};
  const reviews = data?.reviews || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Satıcı Değerlendirmeleri
          </CardTitle>
          {canReview && isAuthenticated && user?.id !== sellerId && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-write-review">
                  Değerlendir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Satıcıyı Değerlendir</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Puanınız</FormLabel>
                          <FormControl>
                            <StarRatingInput
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yorumunuz (İsteğe Bağlı)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Deneyiminizi paylaşın..."
                              className="min-h-[100px] resize-none"
                              {...field}
                              data-testid="input-review-comment"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitMutation.isPending || form.watch("rating") === 0}
                      data-testid="button-submit-review"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gönderiliyor...
                        </>
                      ) : (
                        "Değerlendirmeyi Gönder"
                      )}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalReviews > 0 ? (
          <>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="text-center px-4">
                <div className="text-4xl font-bold">{rating.toFixed(1)}</div>
                <div className="flex items-center justify-center mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {totalReviews} değerlendirme
                </div>
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribution[star] || 0;
                  const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-3">{star}</span>
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <Progress value={percentage} className="h-2 flex-1" />
                      <span className="w-8 text-right text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              {reviews.map(({ review, reviewer, listing }) => (
                <div key={review.id} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={reviewer?.profileImageUrl || undefined} />
                      <AvatarFallback>
                        {(reviewer?.firstName?.[0] || reviewer?.username?.[0] || "K").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {reviewer ? `${reviewer.firstName || ""} ${reviewer.lastName || ""}`.trim() || reviewer.username : "Anonim"}
                        </span>
                        {review.isVerifiedPurchase && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Doğrulanmış Alıcı
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                        <span>
                          {formatDistanceToNow(new Date(review.createdAt), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground pl-13">{review.comment}</p>
                  )}
                  {review.sellerResponse && (
                    <div className="ml-13 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-1 text-xs font-medium mb-1">
                        <MessageSquare className="w-3 h-3" />
                        Satıcı Yanıtı
                      </div>
                      <p className="text-sm">{review.sellerResponse}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pl-13">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => helpfulMutation.mutate(review.id)}
                      disabled={helpfulMutation.isPending}
                      data-testid={`button-helpful-${review.id}`}
                    >
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      Faydalı ({review.helpfulCount})
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Star className="w-12 h-12 mx-auto mb-2 text-muted-foreground/30" />
            <p>Bu satıcı için henüz değerlendirme yok</p>
            {canReview && isAuthenticated && user?.id !== sellerId && (
              <p className="text-sm mt-1">İlk değerlendirmeyi siz yapın!</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
