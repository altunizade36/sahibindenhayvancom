import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Gavel, Clock, TrendingUp, User, Tag, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type AuctionDetail = {
  id: string;
  listingId: string;
  startPrice: string;
  currentPrice: string;
  buyNowPrice: string | null;
  minIncrement: string;
  startTime: string;
  endTime: string;
  status: "upcoming" | "live" | "completed" | "cancelled";
  winnerId: string | null;
  totalBids: number;
  createdAt: string;
  bids: Array<{
    id: string;
    amount: string;
    bidderId: string;
    createdAt: string;
  }>;
  listing: {
    id: string;
    title: string;
    description: string;
    price: string;
    images: string[];
  } | null;
};

const bidSchema = z.object({
  amount: z.string().min(1, "Teklif tutarı gerekli").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Geçerli bir tutar girin"
  ),
});

type BidForm = z.infer<typeof bidSchema>;

function CountdownTimer({ endTime, onComplete }: { endTime: string; onComplete?: () => void }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft("Sona erdi");
        clearInterval(interval);
        onComplete?.();
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days} gün ${hours} saat ${minutes} dakika`);
      } else if (hours > 0) {
        setTimeLeft(`${hours} saat ${minutes} dakika ${seconds} saniye`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes} dakika ${seconds} saniye`);
      } else {
        setTimeLeft(`${seconds} saniye`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onComplete]);

  return <span data-testid="text-countdown">{timeLeft}</span>;
}

export default function AuctionDetailPage() {
  const [, params] = useRoute("/acik-artirma/:id");
  const { toast } = useToast();
  const auctionId = params?.id;

  const { data: auction, isLoading, refetch } = useQuery<AuctionDetail>({
    queryKey: ["/api/auctions", auctionId],
    enabled: !!auctionId,
  });

  useEffect(() => {
    if (!auctionId || !auction || auction.status !== "live") return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected for auction bids");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_bid" && data.auctionId === auctionId) {
          refetch();
          toast({
            title: "Yeni Teklif!",
            description: `Yeni teklif: ₺${parseFloat(data.amount).toLocaleString('tr-TR')}`,
          });
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [auctionId, auction?.status, refetch, toast]);

  const form = useForm<BidForm>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      amount: "",
    },
  });

  const placeBidMutation = useMutation({
    mutationFn: async (data: { amount: number }) => {
      return await apiRequest("POST", `/api/auctions/${auctionId}/bids`, {
        auctionId,
        amount: data.amount,
      });
    },
    onSuccess: () => {
      toast({
        title: "Teklif verildi!",
        description: "Teklifiniz başarıyla kaydedildi.",
      });
      form.reset();
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Teklif verilemedi",
      });
    },
  });

  const onSubmit = (data: BidForm) => {
    const amount = parseFloat(data.amount);
    const currentPrice = parseFloat(auction?.currentPrice || "0");
    const minIncrement = parseFloat(auction?.minIncrement || "10");

    if (amount <= currentPrice) {
      form.setError("amount", {
        message: `Teklif mevcut fiyattan (₺${currentPrice.toLocaleString('tr-TR')}) yüksek olmalı`,
      });
      return;
    }

    if (amount < currentPrice + minIncrement) {
      form.setError("amount", {
        message: `Minimum artış: ₺${minIncrement.toLocaleString('tr-TR')}`,
      });
      return;
    }

    placeBidMutation.mutate({ amount });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-2" data-testid="text-not-found">Açık Artırma Bulunamadı</h2>
          <p className="text-muted-foreground">Bu açık artırma mevcut değil veya kaldırılmış.</p>
        </Card>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    upcoming: "bg-blue-500",
    live: "bg-green-500",
    completed: "bg-gray-500",
    cancelled: "bg-red-500",
  };

  const statusLabels: Record<string, string> = {
    upcoming: "Yaklaşan",
    live: "Aktif",
    completed: "Sona Erdi",
    cancelled: "İptal",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Alert className="mb-6 bg-blue-500/10 border-blue-500">
        <Sparkles className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-500">
          <strong>Yakında Gelecek!</strong> Açık artırma özelliği şu anda geliştirme aşamasında. Teklif verme yakında aktif olacak.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Auction Header */}
          <Card data-testid="card-auction-header">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Gavel className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle data-testid="text-auction-title">
                      Açık Artırma #{auction.id.substring(0, 8)}
                    </CardTitle>
                    <CardDescription>
                      Başlangıç: {format(new Date(auction.startTime), "d MMMM yyyy HH:mm", { locale: tr })}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={`${statusColors[auction.status]} text-white`} data-testid="badge-status">
                  {statusLabels[auction.status]}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {auction.status === "live" && (
                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" />
                    <span>Kalan Süre</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    <CountdownTimer endTime={auction.endTime} onComplete={refetch} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Başlangıç Fiyatı</p>
                  <p className="text-lg font-semibold" data-testid="text-start-price">
                    ₺{parseFloat(auction.startPrice).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mevcut Fiyat</p>
                  <p className="text-2xl font-bold text-primary" data-testid="text-current-price">
                    ₺{parseFloat(auction.currentPrice).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>

              {auction.buyNowPrice && (
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Hemen Al Fiyatı</p>
                      <p className="text-xl font-bold" data-testid="text-buynow-price">
                        ₺{parseFloat(auction.buyNowPrice).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    {auction.status === "live" && (
                      <Button variant="default" disabled data-testid="button-buy-now">
                        <Tag className="h-4 w-4 mr-2" />
                        Hemen Al
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span data-testid="text-total-bids">{auction.totalBids} teklif verildi</span>
                <span className="mx-2">•</span>
                <span>Minimum artış: ₺{parseFloat(auction.minIncrement).toLocaleString('tr-TR')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Bid History */}
          <Card data-testid="card-bid-history">
            <CardHeader>
              <CardTitle>Teklif Geçmişi</CardTitle>
              <CardDescription>Son verilen teklifler</CardDescription>
            </CardHeader>
            <CardContent>
              {auction.bids && auction.bids.length > 0 ? (
                <div className="space-y-3">
                  {auction.bids.slice(0, 10).map((bid, index) => (
                    <div
                      key={bid.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0 ? 'bg-primary/10 border border-primary' : 'bg-muted'
                      }`}
                      data-testid={`bid-item-${bid.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium" data-testid={`text-bid-amount-${bid.id}`}>
                            ₺{parseFloat(bid.amount).toLocaleString('tr-TR')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(bid.createdAt), "d MMM HH:mm", { locale: tr })}
                          </p>
                        </div>
                      </div>
                      {index === 0 && (
                        <Badge variant="default">En Yüksek Teklif</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8" data-testid="text-no-bids">
                  Henüz teklif verilmedi. İlk teklifi siz verin!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Place Bid Form */}
          {auction.status === "live" && (
            <Card data-testid="card-place-bid">
              <CardHeader>
                <CardTitle>Teklif Ver</CardTitle>
                <CardDescription>
                  Minimum artış: ₺{parseFloat(auction.minIncrement).toLocaleString('tr-TR')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teklif Tutarı (₺)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder={`Min: ${(parseFloat(auction.currentPrice) + parseFloat(auction.minIncrement)).toLocaleString('tr-TR')}`}
                              {...field}
                              data-testid="input-bid-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled
                      data-testid="button-submit-bid"
                    >
                      <Gavel className="h-4 w-4 mr-2" />
                      Teklif Ver (Yakında)
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Linked Listing */}
          {auction.listing && (
            <Card data-testid="card-listing">
              <CardHeader>
                <CardTitle>Bağlı İlan</CardTitle>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2" data-testid="text-listing-title">{auction.listing.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {auction.listing.description}
                </p>
                <Separator className="my-4" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">İlan Fiyatı</span>
                  <span className="font-semibold">₺{parseFloat(auction.listing.price).toLocaleString('tr-TR')}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" disabled data-testid="button-view-listing">
                  İlanı Görüntüle
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
