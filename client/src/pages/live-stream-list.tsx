import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Radio, Eye, User, Play, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useState } from "react";

type LiveStream = {
  id: string;
  streamerId: string;
  listingId: string | null;
  title: string;
  description: string | null;
  channelName: string;
  status: "scheduled" | "live" | "ended";
  scheduledFor: string | null;
  startedAt: string | null;
  endedAt: string | null;
  viewerCount: number;
  peakViewers: number;
  thumbnailUrl: string | null;
  createdAt: string;
};

function StreamCard({ stream }: { stream: LiveStream }) {
  const statusColors = {
    scheduled: "bg-blue-500",
    live: "bg-red-500 animate-pulse",
    ended: "bg-gray-500",
  };

  const statusLabels = {
    scheduled: "Planlanmış",
    live: "CANLI",
    ended: "Sona Erdi",
  };

  return (
    <Link href={`/canli-yayin/${stream.id}`} data-testid={`card-stream-${stream.id}`}>
      <Card className="hover-elevate active-elevate-2 h-full cursor-pointer transition-all overflow-hidden">
        <div className="relative aspect-video bg-muted">
          {stream.thumbnailUrl ? (
            <img src={stream.thumbnailUrl} alt={stream.title} className="object-cover w-full h-full" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Radio className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge className={`${statusColors[stream.status]} text-white`} data-testid={`badge-status-${stream.status}`}>
              {statusLabels[stream.status]}
            </Badge>
          </div>
          {stream.status === "live" && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded-md text-sm">
              <Eye className="h-3 w-3" />
              <span data-testid={`text-viewer-count-${stream.id}`}>{stream.viewerCount.toLocaleString('tr-TR')}</span>
            </div>
          )}
        </div>

        <CardHeader className="space-y-2">
          <h3 className="font-semibold line-clamp-2" data-testid={`text-stream-title-${stream.id}`}>
            {stream.title}
          </h3>
          {stream.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {stream.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Yayıncı #{stream.streamerId.substring(0, 8)}</span>
          </div>

          {stream.status === "scheduled" && stream.scheduledFor && (
            <div className="text-sm text-muted-foreground">
              Başlangıç: {format(new Date(stream.scheduledFor), "d MMMM HH:mm", { locale: tr })}
            </div>
          )}

          {stream.status === "live" && stream.startedAt && (
            <div className="text-sm text-muted-foreground">
              Başladı: {format(new Date(stream.startedAt), "HH:mm", { locale: tr })}
            </div>
          )}

          {stream.status === "ended" && (
            <div className="text-sm text-muted-foreground">
              En Yüksek İzleyici: {stream.peakViewers.toLocaleString('tr-TR')}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button variant={stream.status === "live" ? "default" : "outline"} className="w-full" data-testid={`button-view-stream-${stream.id}`}>
            <Play className="h-4 w-4 mr-2" />
            {stream.status === "live" ? "İzle" : "Detayları Gör"}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}

export default function LiveStreamListPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<string>("all");

  const { data: streams, isLoading } = useQuery<LiveStream[]>({
    queryKey: ["/api/streams", status !== "all" ? status : undefined],
    enabled: true,
  });

  const filteredStreams = streams?.filter(stream => 
    status === "all" || stream.status === status
  ) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <Alert className="mb-6 bg-blue-500/10 border-blue-500">
        <Sparkles className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-500">
          <strong>Yakında Gelecek!</strong> Canlı yayın özelliği şu anda geliştirme aşamasında. Agora.io entegrasyonu tamamlandığında aktif olacak.
        </AlertDescription>
      </Alert>

      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Canlı Yayınlar</h1>
            <p className="text-muted-foreground">
              Canlı yayınları izleyin veya kendi yayınınızı başlatın
            </p>
          </div>
          <Button onClick={() => setLocation("/yayin-baslat")} data-testid="button-create-stream" disabled>
            <Radio className="h-4 w-4 mr-2" />
            Yayın Başlat
          </Button>
        </div>

        <Tabs defaultValue="all" onValueChange={setStatus}>
          <TabsList data-testid="tabs-status-filter">
            <TabsTrigger value="all" data-testid="tab-all">Tümü</TabsTrigger>
            <TabsTrigger value="live" data-testid="tab-live">Canlı</TabsTrigger>
            <TabsTrigger value="scheduled" data-testid="tab-scheduled">Planlanmış</TabsTrigger>
            <TabsTrigger value="ended" data-testid="tab-ended">Sona Eren</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-video w-full" />
              <CardHeader>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredStreams.length === 0 ? (
        <Card className="p-12 text-center">
          <Radio className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2" data-testid="text-no-streams">Canlı Yayın Bulunamadı</h3>
          <p className="text-muted-foreground mb-4">
            Henüz {status !== "all" ? statusLabels[status as keyof typeof statusLabels] : ""} canlı yayın yok
          </p>
          <Button onClick={() => setLocation("/yayin-baslat")} data-testid="button-create-first-stream">
            İlk Yayını Başlat
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="grid-streams">
          {filteredStreams.map((stream) => (
            <StreamCard key={stream.id} stream={stream} />
          ))}
        </div>
      )}
    </div>
  );
}

const statusLabels = {
  scheduled: "planlanmış",
  live: "canlı",
  ended: "sona eren",
};
