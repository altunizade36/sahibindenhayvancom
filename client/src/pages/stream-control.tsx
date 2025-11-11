import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAgoraClient } from "@/hooks/use-agora";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Video, VideoOff, Mic, MicOff, Monitor, Eye, StopCircle, Play, AlertCircle } from "lucide-react";
import type { LiveStream } from "@shared/schema";

interface StreamToken {
  token: string;
  appId: string;
  channelName: string;
  uid: string;
}

export default function StreamControl() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isStreaming, setIsStreaming] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [agoraConfig, setAgoraConfig] = useState<StreamToken | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);

  const { data: stream, isLoading } = useQuery<LiveStream>({
    queryKey: ["/api/streams", id],
    enabled: !!id,
  });

  const {
    localVideoTrack,
    localAudioTrack,
    isJoined,
    isPublishing,
    join,
    createLocalTracks,
    publish,
    unpublish,
    leave,
    error: agoraError,
  } = useAgoraClient(agoraConfig, true);

  // Fetch Agora token
  useEffect(() => {
    if (!stream || !user) return;

    if (stream.streamerId !== user.id) {
      toast({
        variant: "destructive",
        title: "Yetkisiz Erişim",
        description: "Bu yayını sadece sahibi kontrol edebilir",
      });
      navigate("/canli-yayinlar");
      return;
    }

    const fetchToken = async () => {
      try {
        const tokenData = await apiRequest(`/api/streams/${id}/token`, { method: "POST" });
        setAgoraConfig(tokenData as StreamToken);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Token Alınamadı",
          description: "Yayın token'ı alınamadı. Lütfen tekrar deneyin.",
        });
      }
    };

    fetchToken();
  }, [stream, user, id]);

  // Play local video track
  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.play(localVideoRef.current);
    }

    return () => {
      localVideoTrack?.stop();
    };
  }, [localVideoTrack]);

  const startStreamMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/streams/${id}/start`, { method: "POST" });
    },
    onSuccess: () => {
      toast({
        title: "Yayın Başlatıldı!",
        description: "Canlı yayınınız şimdi izlenebilir.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/streams", id] });
    },
  });

  const endStreamMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/streams/${id}/end`, { method: "POST" });
    },
    onSuccess: () => {
      toast({
        title: "Yayın Sonlandırıldı",
        description: "Canlı yayınınız sona erdi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/streams", id] });
      navigate("/canli-yayinlar");
    },
  });

  const handleStartStreaming = async () => {
    try {
      if (!agoraConfig) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Agora yapılandırması hazır değil",
        });
        return;
      }

      // Create local tracks
      await createLocalTracks();
      
      // Join channel
      await join();

      // Publish
      await publish();

      // Update stream status
      await startStreamMutation.mutateAsync();

      setIsStreaming(true);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Yayın Başlatılamadı",
        description: err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu",
      });
    }
  };

  const handleStopStreaming = async () => {
    try {
      await unpublish();
      await leave();
      await endStreamMutation.mutateAsync();
      setIsStreaming(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Yayın durdurulamadı",
      });
    }
  };

  const toggleVideo = () => {
    if (localVideoTrack) {
      localVideoTrack.setEnabled(!videoEnabled);
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleAudio = () => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(!audioEnabled);
      setAudioEnabled(!audioEnabled);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p>Yayın yükleniyor...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Yayın Bulunamadı</h3>
            <Button onClick={() => navigate("/canli-yayinlar")}>
              Geri Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Yayın Kontrol Paneli
          </h1>
          {stream.status === "live" && (
            <Badge className="bg-destructive text-destructive-foreground">
              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
              CANLI
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">{stream.title}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Önizleme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <div 
                  ref={localVideoRef}
                  className="w-full h-full"
                  data-testid="video-preview"
                />
                {!videoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <VideoOff className="h-12 w-12 text-white" />
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="mt-4 flex gap-3 justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleVideo}
                  disabled={!isStreaming}
                  data-testid="button-toggle-video"
                >
                  {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleAudio}
                  disabled={!isStreaming}
                  data-testid="button-toggle-audio"
                >
                  {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>

                {!isStreaming ? (
                  <Button
                    onClick={handleStartStreaming}
                    disabled={startStreamMutation.isPending || !agoraConfig}
                    className="px-8"
                    data-testid="button-start-stream"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Yayını Başlat
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopStreaming}
                    variant="destructive"
                    disabled={endStreamMutation.isPending}
                    className="px-8"
                    data-testid="button-stop-stream"
                  >
                    <StopCircle className="mr-2 h-4 w-4" />
                    Yayını Durdur
                  </Button>
                )}
              </div>

              {agoraError && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-lg">
                  <p className="text-sm text-destructive">{agoraError}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stream Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Yayın Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Durum</span>
                <Badge variant={stream.status === "live" ? "default" : "secondary"}>
                  {stream.status === "live" ? "Canlı" : stream.status === "upcoming" ? "Hazır" : "Zamanlanmış"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  İzleyici
                </span>
                <span className="font-semibold" data-testid="text-viewer-count">
                  {stream.viewerCount}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">En Yüksek</span>
                <span className="font-semibold">{stream.peakViewers}</span>
              </div>

              {stream.startedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Başlangıç</span>
                  <span className="text-sm">
                    {new Date(stream.startedAt).toLocaleTimeString("tr-TR")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yayın Linki</CardTitle>
              <CardDescription>İzleyicilerle paylaşın</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted rounded-lg break-all text-sm">
                {window.location.origin}/yayin/{stream.id}
              </div>
              <Button
                variant="outline"
                className="w-full mt-3"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/yayin/${stream.id}`);
                  toast({ title: "Link kopyalandı!" });
                }}
                data-testid="button-copy-link"
              >
                Linki Kopyala
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
