import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gavel, Clock, TrendingUp, Eye, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useState, useEffect } from "react";

type Auction = {
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
};

function CountdownTimer({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft("Sona erdi");
        clearInterval(interval);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}g ${hours}s ${minutes}d`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}s ${minutes}d ${seconds}sn`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}d ${seconds}sn`);
      } else {
        setTimeLeft(`${seconds}sn`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return <span>{timeLeft}</span>;
}

function AuctionCard({ auction }: { auction: Auction }) {
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
      <Card className="h-full opacity-60 cursor-not-allowed" data-testid={`card-auction-${auction.id}`}>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Badge className={`${statusColors[auction.status]} text-white`} data-testid={`badge-status-${auction.status}`}>
              {statusLabels[auction.status]}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span data-testid={`text-bid-count-${auction.id}`}>{auction.totalBids} teklif</span>
            </div>
          </div>
          <h3 className="font-semibold line-clamp-2" data-testid={`text-auction-title-${auction.id}`}>
            Açık Artırma #{auction.id.substring(0, 8)}
          </h3>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Mevcut Fiyat:</span>
              <span className="text-lg font-bold text-primary" data-testid={`text-current-price-${auction.id}`}>
                ₺{parseFloat(auction.currentPrice).toLocaleString('tr-TR')}
              </span>
            </div>
            {auction.buyNowPrice && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Hemen Al:</span>
                <span className="text-sm font-semibold" data-testid={`text-buynow-price-${auction.id}`}>
                  ₺{parseFloat(auction.buyNowPrice).toLocaleString('tr-TR')}
                </span>
              </div>
            )}
          </div>

          {auction.status === "live" && (
            <div className="flex items-center gap-2 text-sm bg-muted rounded-md p-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium" data-testid={`text-countdown-${auction.id}`}>
                <CountdownTimer endTime={auction.endTime} />
              </span>
            </div>
          )}

          {auction.status === "upcoming" && (
            <div className="flex items-center gap-2 text-sm bg-muted rounded-md p-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span data-testid={`text-start-time-${auction.id}`}>
                Başlangıç: {format(new Date(auction.startTime), "d MMMM HH:mm", { locale: tr })}
              </span>
            </div>
          )}

          {auction.status === "completed" && (
            <div className="flex items-center gap-2 text-sm bg-muted rounded-md p-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span data-testid={`text-end-time-${auction.id}`}>
                {format(new Date(auction.endTime), "d MMMM HH:mm", { locale: tr })}
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button variant="outline" className="w-full" disabled data-testid={`button-view-auction-${auction.id}`}>
            <Gavel className="h-4 w-4 mr-2" />
            Detayları Gör
          </Button>
        </CardFooter>
      </Card>
  );
}

export default function AuctionListPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<string>("all");

  const { data: auctions, isLoading } = useQuery<Auction[]>({
    queryKey: ["/api/auctions", status !== "all" ? status : undefined],
    enabled: true,
  });

  const filteredAuctions = auctions?.filter(auction => 
    status === "all" || auction.status === status
  ) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <Alert className="mb-6 bg-blue-500/10 border-blue-500">
        <Sparkles className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-500">
          <strong>Yakında Gelecek!</strong> Açık artırma özelliği şu anda geliştirme aşamasında. Çok yakında kullanıma açılacak.
        </AlertDescription>
      </Alert>

      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Açık Artırmalar</h1>
            <p className="text-muted-foreground">
              Canlı açık artırmalara katılın, teklif verin
            </p>
          </div>
          <Button onClick={() => setLocation("/acik-artirma-olustur")} data-testid="button-create-auction" disabled>
            <Gavel className="h-4 w-4 mr-2" />
            Açık Artırma Oluştur
          </Button>
        </div>

        <Tabs defaultValue="all" onValueChange={setStatus}>
          <TabsList data-testid="tabs-status-filter">
            <TabsTrigger value="all" data-testid="tab-all">Tümü</TabsTrigger>
            <TabsTrigger value="live" data-testid="tab-live">Aktif</TabsTrigger>
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">Yaklaşan</TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">Sona Eren</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-5 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAuctions.length === 0 ? (
        <Card className="p-12 text-center">
          <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2" data-testid="text-no-auctions">Açık Artırma Bulunamadı</h3>
          <p className="text-muted-foreground mb-4">
            Henüz {status !== "all" ? statusLabels[status as keyof typeof statusLabels] : ""} açık artırma yok
          </p>
          <Button onClick={() => setLocation("/acik-artirma-olustur")} data-testid="button-create-first-auction">
            İlk Açık Artırmayı Oluştur
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="grid-auctions">
          {filteredAuctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
}

const statusLabels: Record<string, string> = {
  upcoming: "yaklaşan",
  live: "aktif",
  completed: "sona eren",
  cancelled: "iptal",
};
