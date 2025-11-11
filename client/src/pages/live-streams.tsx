import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Eye, Play, Clock, Plus } from "lucide-react";
import type { LiveStream } from "@shared/schema";
import { useAuth } from "@/lib/auth";

interface StreamWithDetails extends LiveStream {
  streamer?: {
    id: string;
    username: string;
    avatar?: string;
  };
  listing?: {
    id: string;
    title: string;
    price: string;
    images: string[];
  };
}

export default function LiveStreams() {
  const { user } = useAuth();

  // Fetch active live streams using new /api/live/active endpoint
  const { data: streams = [], isLoading } = useQuery<StreamWithDetails[]>({
    queryKey: ["/api/live/active"],
  });

  const liveStreams = streams.filter(s => s.status === "live");
  const upcomingStreams = streams.filter(s => s.status === "scheduled");
  const endedStreams = streams.filter(s => s.status === "ended");

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Canlı Yayınlar</h1>
          <p className="text-muted-foreground">Hayvanlar hakkında canlı yayınları izleyin</p>
        </div>
        {user && (
          <Link href="/yayin-baslat">
            <Button data-testid="button-create-stream">
              <Plus className="mr-2 h-4 w-4" />
              Yayın Başlat
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-muted" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {liveStreams.length > 0 && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
                Şimdi Canlı
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveStreams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            </section>
          )}

          {upcomingStreams.length > 0 && (
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Yaklaşan Yayınlar
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingStreams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            </section>
          )}

          {endedStreams.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4">Geçmiş Yayınlar</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {endedStreams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            </section>
          )}

          {streams.length === 0 && (
            <div className="text-center py-12">
              <Play className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Henüz canlı yayın yok</h3>
              <p className="text-muted-foreground mb-4">
                İlk canlı yayını siz başlatın!
              </p>
              {user && (
                <Link href="/yayin-baslat">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Yayın Başlat
                  </Button>
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StreamCard({ stream }: { stream: StreamWithDetails }) {
  const isLive = stream.status === "live";
  const isUpcoming = stream.status === "scheduled";
  const href = isLive || stream.status === "ended" ? `/yayin/${stream.id}` : "#";

  return (
    <Link href={href}>
      <Card 
        className="hover-elevate active-elevate-2 overflow-hidden cursor-pointer"
        data-testid={`card-stream-${stream.id}`}
      >
        <div className="relative aspect-video bg-muted">
          {stream.thumbnailUrl ? (
            <img 
              src={stream.thumbnailUrl} 
              alt={stream.title}
              className="w-full h-full object-cover"
            />
          ) : stream.listing?.images[0] ? (
            <img 
              src={stream.listing.images[0]} 
              alt={stream.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          
          {isLive && (
            <Badge 
              className="absolute top-2 right-2 bg-destructive text-destructive-foreground"
              data-testid="badge-live"
            >
              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
              CANLI
            </Badge>
          )}

          {isUpcoming && stream.scheduledFor && (
            <Badge 
              variant="secondary" 
              className="absolute top-2 right-2"
            >
              <Clock className="h-3 w-3 mr-1" />
              {new Date(stream.scheduledFor).toLocaleString("tr-TR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Badge>
          )}

          {stream.streamer && (
            <div className="absolute bottom-2 left-2">
              <Avatar className="h-10 w-10 border-2 border-background">
                <AvatarImage src={stream.streamer.avatar} />
                <AvatarFallback>
                  {stream.streamer.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          {isLive && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-background/80 px-2 py-1 rounded text-sm">
              <Eye className="h-3 w-3" />
              <span data-testid={`text-viewer-count-${stream.id}`}>
                {stream.viewerCount}
              </span>
            </div>
          )}
        </div>

        <CardHeader className="p-4">
          <CardTitle className="line-clamp-2 text-base" data-testid={`text-title-${stream.id}`}>
            {stream.title}
          </CardTitle>
          {stream.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {stream.description}
            </p>
          )}
        </CardHeader>

        {stream.listing && (
          <CardContent className="p-4 pt-0 border-t">
            <div className="flex items-center gap-2">
              {stream.listing.images[0] && (
                <img 
                  src={stream.listing.images[0]} 
                  alt={stream.listing.title}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">
                  {stream.listing.title}
                </p>
                <p className="text-sm text-primary font-semibold">
                  ₺{Number(stream.listing.price).toLocaleString("tr-TR")}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
