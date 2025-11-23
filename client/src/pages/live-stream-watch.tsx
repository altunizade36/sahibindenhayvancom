import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Radio, Eye, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useState, useEffect } from "react";

type StreamDetail = {
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
  streamer: {
    id: string;
    username: string;
    fullName: string | null;
  } | null;
  listing: {
    id: string;
    title: string;
    price: string;
  } | null;
};

export default function LiveStreamWatchPage() {
  const [, params] = useRoute("/canli-yayin/:id");
  const streamId = params?.id;
  const [chatMessages, setChatMessages] = useState<Array<{ username: string; message: string }>>([]);

  const { data: stream, isLoading } = useQuery<StreamDetail>({
    queryKey: ["/api/streams", streamId],
    enabled: !!streamId,
  });

  useEffect(() => {
    if (!streamId || !stream || stream.status !== "live") return;

    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token available for WebSocket connection");
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected for live stream chat");
      ws.send(JSON.stringify({ type: "subscribe", streamId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "stream_message" && data.streamId === streamId) {
          setChatMessages((prev) => [...prev, { username: data.username, message: data.message }]);
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
  }, [streamId, stream?.status]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="aspect-video w-full mb-4" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-2" data-testid="text-not-found">Yayın Bulunamadı</h2>
          <p className="text-muted-foreground">Bu canlı yayın mevcut değil veya kaldırılmış.</p>
        </Card>
      </div>
    );
  }

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
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Video Player Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Player */}
          <Card className="overflow-hidden" data-testid="card-player">
            <div className="relative aspect-video bg-black">
              {stream.status === "live" ? (
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <Radio className="h-16 w-16 mb-4 animate-pulse" />
                  <p className="text-xl font-semibold mb-2">Canlı Yayın Oynatıcısı</p>
                  <Alert className="mx-8 bg-blue-500/10 border-blue-500">
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-blue-500">
                      <strong>Yakında Gelecek!</strong> Agora.io entegrasyonu henüz yapılandırılmadı. 
                      Video player altyapısı hazır, AGORA credentials eklendikten sonra aktif olacak.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : stream.thumbnailUrl ? (
                <img src={stream.thumbnailUrl} alt={stream.title} className="object-cover w-full h-full opacity-50" />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <Radio className="h-16 w-16 opacity-50" />
                </div>
              )}
              <div className="absolute top-4 left-4">
                <Badge className={`${statusColors[stream.status]} text-white`} data-testid="badge-status">
                  {statusLabels[stream.status]}
                </Badge>
              </div>
              {stream.status === "live" && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/70 text-white px-3 py-2 rounded-md">
                  <Eye className="h-4 w-4" />
                  <span className="font-semibold" data-testid="text-viewer-count">
                    {stream.viewerCount.toLocaleString('tr-TR')} izleyici
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Stream Info */}
          <Card data-testid="card-stream-info">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl" data-testid="text-stream-title">{stream.title}</CardTitle>
                  {stream.description && (
                    <CardDescription className="mt-2">{stream.description}</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium" data-testid="text-streamer">
                    {stream.streamer?.fullName || stream.streamer?.username || `Yayıncı #${stream.streamerId.substring(0, 8)}`}
                  </span>
                </div>
              </div>

              {stream.status === "scheduled" && stream.scheduledFor && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Yayın {format(new Date(stream.scheduledFor), "d MMMM yyyy HH:mm", { locale: tr })} tarihinde başlayacak
                  </AlertDescription>
                </Alert>
              )}

              {stream.status === "ended" && (
                <Alert>
                  <AlertDescription>
                    Bu yayın sona erdi. En yüksek izleyici sayısı: {stream.peakViewers.toLocaleString('tr-TR')}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Linked Listing */}
          {stream.listing && (
            <Card data-testid="card-listing">
              <CardHeader>
                <CardTitle>Bağlı İlan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold" data-testid="text-listing-title">{stream.listing.title}</h4>
                    <p className="text-sm text-muted-foreground">İlan Fiyatı</p>
                  </div>
                  <p className="text-xl font-bold text-primary">
                    ₺{parseFloat(stream.listing.price).toLocaleString('tr-TR')}
                  </p>
                </div>
                <Button variant="outline" className="w-full" disabled data-testid="button-view-listing">
                  İlanı Görüntüle
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chat Sidebar */}
        <div>
          <Card className="h-[600px] flex flex-col" data-testid="card-chat">
            <CardHeader>
              <CardTitle>Canlı Sohbet</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-4 bg-muted rounded-md">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Sohbet özelliği yakında aktif olacak
                  </AlertDescription>
                </Alert>
              </div>
              {stream.status === "live" && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Mesajınızı yazın..."
                    className="flex-1 px-3 py-2 border rounded-md"
                    disabled
                    data-testid="input-chat-message"
                  />
                  <Button disabled data-testid="button-send-chat">
                    Gönder
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
