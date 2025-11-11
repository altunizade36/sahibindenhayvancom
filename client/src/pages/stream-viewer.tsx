import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useAgoraClient } from "@/hooks/use-agora";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Eye, AlertCircle, ChevronRight, Video, Send, Users } from "lucide-react";
import type { LiveStream, Listing, User } from "@shared/schema";

interface ChatMessage {
  id: string;
  message: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
  };
  createdAt: Date;
}

interface StreamToken {
  token: string;
  appId: string;
  channelName: string;
  uid: number;
}

interface AgoraConfig {
  appId: string;
  channel: string;
  token: string | null;
  uid?: number;
}

interface StreamDetails extends LiveStream {
  streamer?: User;
  listing?: Listing;
}

export default function StreamViewer() {
  const params = useParams<{ id?: string; channelName?: string }>();
  const { id, channelName } = params;
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [agoraConfig, setAgoraConfig] = useState<AgoraConfig | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [streamId, setStreamId] = useState<string | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Determine if we're using channelName or ID route
  const isChannelRoute = location.startsWith('/canli/');
  const routeParam = channelName || id;

  // For channel route, manually build URL to ensure query params are sent
  // For ID route, use default fetcher with path parameter
  const { data: stream, isLoading } = useQuery<StreamDetails>({
    queryKey: isChannelRoute 
      ? ["/api/live/join", channelName] // Use channel as cache key
      : ["/api/streams", id],
    queryFn: isChannelRoute && channelName
      ? async () => {
          // Manually build URL with query string for channel route
          const url = `/api/live/join?channel=${encodeURIComponent(channelName)}`;
          const res = await fetch(url, { credentials: "include" });
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`${res.status}: ${text}`);
          }
          return await res.json();
        }
      : undefined, // Use default fetcher for ID route
    enabled: !!routeParam,
  });

  const {
    remoteUsers,
    isJoined,
    join,
    leave,
    error: agoraError,
  } = useAgoraClient(agoraConfig, false);

  // Set stream ID once we have stream data
  useEffect(() => {
    if (stream && 'liveStreamId' in stream) {
      setStreamId(stream.liveStreamId as string);
    } else if (stream && 'id' in stream) {
      setStreamId(stream.id);
    }
  }, [stream]);

  // Fetch/Setup Agora token
  useEffect(() => {
    if (!stream) return;
    
    // For /canli/:channelName route, /api/live/join already returns token
    if (isChannelRoute && 'rtcToken' in stream && 'appId' in stream) {
      setAgoraConfig({
        appId: (stream as any).appId,
        channel: (stream as any).channelName,
        token: (stream as any).rtcToken,
        uid: undefined,
      });
      return;
    }

    // For /yayin/:id route, we need to fetch token separately
    if (!isChannelRoute && user && stream.status === "live" && id) {
      const fetchToken = async () => {
        try {
          const res = await apiRequest("POST", `/api/streams/${id}/token`);
          const tokenData = await res.json() as StreamToken;
          setAgoraConfig({
            appId: tokenData.appId,
            channel: tokenData.channelName,
            token: tokenData.token,
            uid: tokenData.uid,
          });
        } catch (err) {
          toast({
            variant: "destructive",
            title: "Token Alınamadı",
            description: "Yayın izlenemiyor. Lütfen tekrar deneyin.",
          });
        }
      };

      fetchToken();
    }
  }, [stream, user, id, isChannelRoute]);

  // Auto-join when config is ready
  useEffect(() => {
    if (agoraConfig && !isJoined) {
      join();
    }

    return () => {
      if (isJoined) {
        leave();
      }
    };
  }, [agoraConfig, isJoined]);

  // WebSocket connection + Join/Leave tracking
  useEffect(() => {
    if (!user || !streamId || stream?.status !== "live") return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      // Send stream_join to track this viewer
      ws.send(JSON.stringify({
        type: "stream_join",
        streamId,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "stream_chat" && data.streamId === streamId) {
          setChatMessages(prev => [...prev, {
            id: data.message.id,
            message: data.message.message,
            senderId: data.message.senderId,
            sender: data.sender,
            createdAt: new Date(data.message.createdAt),
          }]);
          
          // Auto-scroll to bottom
          setTimeout(() => {
            lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }

        if (data.type === "stream_viewer_update" && data.streamId === streamId) {
          setViewerCount(data.viewerCount);
        }
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      // Send stream_leave when viewer leaves
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "stream_leave",
          streamId,
        }));
      }
      ws.close();
    };
  }, [user, streamId, stream?.status]);

  // Fetch chat history on mount
  useEffect(() => {
    if (!streamId) return;

    const fetchChatHistory = async () => {
      try {
        const res = await apiRequest("GET", `/api/streams/${streamId}/chat`);
        const messages = await res.json() as ChatMessage[];
        setChatMessages(messages.map((msg) => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
        })));
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      }
    };

    fetchChatHistory();
  }, [streamId]);

  // Update viewer count from stream data
  useEffect(() => {
    if (stream && stream.viewerCount != null) {
      setViewerCount(stream.viewerCount);
    }
  }, [stream]);

  // Play remote video track
  useEffect(() => {
    if (remoteUsers.length > 0 && remoteUsers[0].videoTrack && remoteVideoRef.current) {
      remoteUsers[0].videoTrack.play(remoteVideoRef.current);
    }
  }, [remoteUsers]);

  const handleSendChat = () => {
    if (!chatInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: "stream_chat",
      streamId,
      message: chatInput.trim(),
    }));

    setChatInput("");
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
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
            <Button onClick={() => navigate("/canli-yayin")}>
              Canlı Yayınlara Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stream.status !== "live" && stream.status !== "ended") {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Yayın Henüz Başlamadı</h3>
            <p className="text-muted-foreground mb-4">
              Bu yayın {stream.scheduledFor 
                ? new Date(stream.scheduledFor).toLocaleString("tr-TR")
                : "yakında"} başlayacak
            </p>
            <Button onClick={() => navigate("/canli-yayinlar")}>
              Canlı Yayınlara Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stream.status === "ended") {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Yayın Sona Erdi</h3>
            <p className="text-muted-foreground mb-2">{stream.title}</p>
            <p className="text-sm text-muted-foreground mb-4">
              Bu yayın {stream.endedAt && new Date(stream.endedAt).toLocaleString("tr-TR")} tarihinde sona erdi
            </p>
            <Button onClick={() => navigate("/canli-yayinlar")}>
              Diğer Yayınlara Göz At
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
                <div 
                  ref={remoteVideoRef}
                  className="w-full h-full"
                  data-testid="video-player"
                />
                {remoteUsers.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
                      <p>Yayıncı bağlanıyor...</p>
                    </div>
                  </div>
                )}

                <div className="absolute top-4 left-4">
                  <Badge className="bg-destructive text-destructive-foreground">
                    <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                    CANLI
                  </Badge>
                </div>

                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded">
                  <Eye className="h-4 w-4" />
                  <span className="font-semibold" data-testid="text-viewer-count">
                    {viewerCount}
                  </span>
                  <span className="text-sm text-muted-foreground">izleyici</span>
                </div>
              </div>

              <div className="p-4">
                <h2 className="text-2xl font-bold mb-2" data-testid="text-stream-title">
                  {stream.title}
                </h2>
                {stream.description && (
                  <p className="text-muted-foreground">{stream.description}</p>
                )}

                {stream.streamer && (
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                    <Avatar>
                      <AvatarImage src={stream.streamer.avatar || undefined} />
                      <AvatarFallback>
                        {stream.streamer.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{stream.streamer.username}</p>
                      {stream.streamer.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {stream.streamer.bio}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {agoraError && (
                <div className="p-4 bg-destructive/10 border-t border-destructive">
                  <p className="text-sm text-destructive">{agoraError}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {stream.listing && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bağlantılı İlan</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/ilan/${stream.listing.id}`}>
                  <div className="hover-elevate active-elevate-2 rounded-lg overflow-hidden border cursor-pointer">
                    {stream.listing.images[0] && (
                      <img 
                        src={stream.listing.images[0]} 
                        alt={stream.listing.title}
                        className="w-full aspect-video object-cover"
                      />
                    )}
                    <div className="p-3">
                      <h4 className="font-semibold line-clamp-2 mb-1">
                        {stream.listing.title}
                      </h4>
                      <p className="text-lg font-bold text-primary">
                        ₺{Number(stream.listing.price).toLocaleString("tr-TR")}
                      </p>
                      <div className="flex items-center justify-end mt-2 text-sm text-primary">
                        İlanı Görüntüle
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Stream Chat */}
          <Card data-testid="card-stream-chat">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Canlı Sohbet
                </span>
                <Badge variant="secondary" data-testid="text-chat-message-count">
                  {chatMessages.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Chat Messages */}
              <ScrollArea className="h-[300px] px-4 py-2">
                <div className="space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Henüz mesaj yok</p>
                      <p className="text-sm mt-1">İlk mesajı siz gönderin!</p>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className="flex gap-2"
                          data-testid={`chat-message-${msg.id}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-semibold" data-testid={`chat-sender-${msg.id}`}>
                                {msg.sender.username}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.createdAt).toLocaleTimeString("tr-TR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-sm mt-0.5" data-testid={`chat-text-${msg.id}`}>
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      ))}
                      {/* Invisible anchor for auto-scroll */}
                      <div ref={lastMessageRef} />
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Bir mesaj yazın..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleChatKeyPress}
                    data-testid="input-chat-message"
                  />
                  <Button 
                    size="icon" 
                    onClick={handleSendChat}
                    disabled={!chatInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN}
                    data-testid="button-send-chat"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
