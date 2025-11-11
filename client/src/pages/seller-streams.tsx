import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Play, Square, Eye, Clock, Calendar, Radio } from "lucide-react";
import { LiveStream } from "@shared/schema";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type StreamWithDetails = LiveStream & {
  streamer?: {
    id: string;
    fullName: string;
    avatar?: string;
  };
  listing?: {
    id: string;
    title: string;
    images: string[];
  };
  viewerCount?: number;
};

export default function SellerStreams() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Role guard - redirect non-sellers (useEffect to avoid navigation during render)
  useEffect(() => {
    if (isAuthenticated && user && user.role !== 'seller' && user.role !== 'admin') {
      setLocation('/');
    }
  }, [isAuthenticated, user, setLocation]);

  // Fetch seller's own streams (backend filters by current user)
  const { data: myStreams, isLoading } = useQuery<StreamWithDetails[]>({
    queryKey: ["/api/my-streams"],
    enabled: isAuthenticated && (user?.role === 'seller' || user?.role === 'admin'),
  });

  // End stream mutation
  const endStreamMutation = useMutation({
    mutationFn: async (streamId: string) => {
      const res = await apiRequest("POST", `/api/live/end`, { liveStreamId: streamId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-streams"] });
      toast({
        title: "Yayın Sonlandırıldı",
        description: "Canlı yayınınız başarıyla sonlandırıldı.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter streams by status
  const liveStreams = myStreams?.filter(s => s.status === 'live') || [];
  const upcomingStreams = myStreams?.filter(s => s.status === 'scheduled') || [];
  const endedStreams = myStreams?.filter(s => s.status === 'ended') || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-title">Canlı Yayınlarım</h1>
          <p className="text-muted-foreground mt-1">
            Aktif ve geçmiş yayınlarınızı yönetin
          </p>
        </div>
        <Link href="/yayin/yeni">
          <Button size="lg" data-testid="button-create-stream">
            <Play className="w-4 h-4 mr-2" />
            Yeni Yayın Başlat
          </Button>
        </Link>
      </div>

      <Separator className="mb-8" />

      {/* Active Streams */}
      {liveStreams.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="w-5 h-5 text-destructive" />
            <h2 className="text-2xl font-semibold">Aktif Yayınlar</h2>
            <Badge variant="destructive" className="ml-2">
              {liveStreams.length} Canlı
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {liveStreams.map((stream) => (
              <Card key={stream.id} className="border-destructive" data-testid={`card-stream-${stream.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {stream.title}
                        <Badge variant="destructive" className="animate-pulse">
                          CANLI
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Kanal: {stream.channelName}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      <span>{stream.viewerCount || 0} izleyici</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        Başlangıç: {format(new Date(stream.startedAt!), "HH:mm", { locale: tr })}
                      </span>
                    </div>
                    {stream.listing && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Bağlı İlan:</span>{" "}
                        <span className="font-medium">{stream.listing.title}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1"
                    data-testid={`button-view-${stream.id}`}
                  >
                    <Link href={`/canli/${stream.channelName}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      İzle
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => endStreamMutation.mutate(stream.id)}
                    disabled={endStreamMutation.isPending}
                    data-testid={`button-end-${stream.id}`}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Yayını Bitir
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Streams */}
      {upcomingStreams.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold">Planlanan Yayınlar</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingStreams.map((stream) => (
              <Card key={stream.id} data-testid={`card-stream-${stream.id}`}>
                <CardHeader>
                  <CardTitle>{stream.title}</CardTitle>
                  <CardDescription>Kanal: {stream.channelName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stream.scheduledFor && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(stream.scheduledFor), "dd MMMM yyyy, HH:mm", { locale: tr })}
                        </span>
                      </div>
                    )}
                    {stream.listing && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Bağlı İlan:</span>{" "}
                        <span className="font-medium">{stream.listing.title}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Ended Streams */}
      {endedStreams.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-2xl font-semibold">Geçmiş Yayınlar</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {endedStreams.map((stream) => (
              <Card key={stream.id} data-testid={`card-stream-${stream.id}`}>
                <CardHeader>
                  <CardTitle className="text-lg">{stream.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {stream.startedAt && format(new Date(stream.startedAt), "dd MMM yyyy", { locale: tr })}
                      </span>
                    </div>
                    {stream.listing && (
                      <div>
                        <span className="text-muted-foreground">İlan:</span>{" "}
                        <span className="font-medium">{stream.listing.title}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!myStreams || myStreams.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Radio className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Henüz Yayın Yok</h3>
            <p className="text-muted-foreground mb-6">
              Hayvanlarınızı canlı yayınla tanıtmaya başlayın
            </p>
            <Link href="/yayin/yeni">
              <Button size="lg" data-testid="button-create-first-stream">
                <Play className="w-4 h-4 mr-2" />
                İlk Yayınınızı Başlatın
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
