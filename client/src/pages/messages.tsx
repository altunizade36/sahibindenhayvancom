import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  MessageSquare,
  ArrowLeft,
  MapPin,
  Phone,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Search,
  MoreVertical,
  Pin,
  Archive,
  BellOff,
  Bell,
  Check,
  CheckCheck,
  Circle,
  X,
} from "lucide-react";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

type ListingInfo = {
  id: string;
  title: string;
  price: string;
  images: string[];
  city: string;
  district: string;
} | null;

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  status?: "sent" | "delivered" | "read";
  readAt?: string | null;
  messageType?: "text" | "image" | "file" | "system" | "offer";
  listing?: ListingInfo;
};

type PartnerUser = {
  id: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  isOnline?: boolean;
  lastSeenAt?: string | null;
};

type Conversation = {
  id: string;
  partnerId: string;
  user: PartnerUser | null;
  lastMessage: Message | null;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  isMuted: boolean;
  lastReadAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type MessagesResponse = {
  messages: Message[];
  listing: ListingInfo;
};

function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return format(date, "HH:mm", { locale: tr });
  }
  if (isYesterday(date)) {
    return "Dün";
  }
  return format(date, "dd.MM.yyyy", { locale: tr });
}

function formatLastSeen(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isToday(date)) {
    return `bugün ${format(date, "HH:mm", { locale: tr })}`;
  }
  if (isYesterday(date)) {
    return `dün ${format(date, "HH:mm", { locale: tr })}`;
  }
  return formatDistanceToNow(date, { addSuffix: true, locale: tr });
}

function MessageStatus({ status }: { status?: string }) {
  if (!status || status === "sent") {
    return <Check className="h-3 w-3 text-muted-foreground" />;
  }
  if (status === "delivered") {
    return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
  }
  if (status === "read") {
    return <CheckCheck className="h-3 w-3 text-blue-500" />;
  }
  return null;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <div className="flex gap-1">
        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span className="text-xs text-muted-foreground ml-1">yazıyor...</span>
    </div>
  );
}

function ListingPanel({ listing, user }: { listing: ListingInfo; user: PartnerUser | null }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!listing) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-muted-foreground">
        <p>İlan bilgisi bulunamadı</p>
      </div>
    );
  }

  const images = listing.images || [];
  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="relative bg-muted aspect-video flex-shrink-0">
        {images.length > 0 ? (
          <>
            <img
              src={images[currentImageIndex]}
              alt={listing.title}
              className="w-full h-full object-cover"
              data-testid="img-listing-main"
            />
            {hasMultipleImages && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 h-8 w-8"
                  onClick={prevImage}
                  data-testid="button-prev-image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 h-8 w-8"
                  onClick={nextImage}
                  data-testid="button-next-image"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <MessageSquare className="w-12 h-12" />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-1 p-2 overflow-x-auto flex-shrink-0 bg-muted/30">
          {images.slice(0, 6).map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              className={`flex-shrink-0 w-14 h-14 rounded border-2 overflow-hidden ${
                idx === currentImageIndex ? "border-primary" : "border-transparent"
              }`}
              data-testid={`button-thumbnail-${idx}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
          {images.length > 6 && (
            <div className="flex-shrink-0 w-14 h-14 rounded bg-muted flex items-center justify-center text-sm font-medium">
              +{images.length - 6}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          <div className="text-2xl font-bold text-primary" data-testid="text-listing-price">
            {parseFloat(listing.price).toLocaleString("tr-TR")} ₺
          </div>

          <h3 className="font-semibold text-lg leading-tight" data-testid="text-listing-title">
            {listing.title}
          </h3>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span data-testid="text-listing-location">
              {listing.district}, {listing.city}
            </span>
          </div>

          <Link href={`/ilan/${listing.id}`}>
            <Button variant="outline" className="w-full gap-2" data-testid="button-view-listing">
              <ExternalLink className="h-4 w-4" />
              İlanı Görüntüle
            </Button>
          </Link>

          {user && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Satıcı Bilgileri</h4>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {(user.firstName || user.email)?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium" data-testid="text-seller-name">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.email?.split("@")[0]}
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span data-testid="text-seller-phone">{user.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [showListingPanel, setShowListingPanel] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const conversationId = params.get("conversationId");
    const userId = params.get("userId");
    if (conversationId) {
      setSelectedConversationId(conversationId);
      const parts = conversationId.split("_");
      if (parts.length === 2 && user) {
        const partnerId = parts[0] === user.id ? parts[1] : parts[0];
        setSelectedUserId(partnerId);
      }
    } else if (userId) {
      setSelectedUserId(userId);
    }
  }, [location, user]);

  const { data: conversations, isLoading: isLoadingConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations", showArchived ? "archived=true" : ""],
    enabled: !!user,
  });

  const { data: messagesData, isLoading: isLoadingMessages } = useQuery<MessagesResponse>({
    queryKey: ["/api/messages", selectedUserId],
    enabled: !!user && !!selectedUserId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const selectedConv = conversations?.find((c) => c.partnerId === selectedUserId);
      return apiRequest("POST", "/api/messages", {
        receiverId: selectedUserId,
        content,
        listingId: selectedConv?.lastMessage?.listing?.id || messagesData?.listing?.id || null,
      });
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Mesaj gönderilemedi",
        variant: "destructive",
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ conversationId, archived }: { conversationId: string; archived: boolean }) => {
      return apiRequest("PATCH", `/api/conversations/${conversationId}/archive`, { archived });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      toast({ title: "Başarılı", description: "Konuşma güncellendi" });
    },
  });

  const pinMutation = useMutation({
    mutationFn: async ({ conversationId, pinned }: { conversationId: string; pinned: boolean }) => {
      return apiRequest("PATCH", `/api/conversations/${conversationId}/pin`, { pinned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
  });

  const muteMutation = useMutation({
    mutationFn: async ({ conversationId, muted }: { conversationId: string; muted: boolean }) => {
      return apiRequest("PATCH", `/api/conversations/${conversationId}/mute`, { muted });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return apiRequest("POST", `/api/conversations/${conversationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
  });

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("WebSocket connected");
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "chat":
          case "chat_sent":
            queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
            queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
            break;

          case "typing":
            if (data.userId && data.conversationId) {
              setTypingUsers((prev) => ({ ...prev, [data.userId]: data.isTyping }));
              if (data.isTyping) {
                setTimeout(() => {
                  setTypingUsers((prev) => ({ ...prev, [data.userId]: false }));
                }, 5000);
              }
            }
            break;

          case "presence":
            if (data.userId) {
              setOnlineUsers((prev) => ({ ...prev, [data.userId]: data.isOnline }));
            }
            break;

          case "read_receipt":
            queryClient.invalidateQueries({ queryKey: ["/api/messages", data.conversationId] });
            break;
        }
      } catch {
        // Silent parse error
      }
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [user]);

  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      if (ws && ws.readyState === WebSocket.OPEN && selectedConversationId && selectedUserId) {
        ws.send(
          JSON.stringify({
            type: "typing",
            conversationId: selectedConversationId,
            receiverId: selectedUserId,
            isTyping,
          })
        );
      }
    },
    [ws, selectedConversationId, selectedUserId]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    sendTypingIndicator(true);

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false);
    }, 2000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData?.messages]);

  useEffect(() => {
    if (selectedConversationId) {
      markReadMutation.mutate(selectedConversationId);
    }
  }, [selectedConversationId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUserId) return;
    sendTypingIndicator(false);
    sendMessageMutation.mutate(messageText);
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversationId(conv.id);
    setSelectedUserId(conv.partnerId);
    navigate(`/mesajlar?conversationId=${conv.id}`);
  };

  const selectedConversation = conversations?.find(
    (c) => c.id === selectedConversationId || c.partnerId === selectedUserId
  );
  const currentListing = messagesData?.listing || selectedConversation?.lastMessage?.listing;
  const currentUser = selectedConversation?.user;
  const messages = messagesData?.messages || [];

  const filteredConversations = conversations?.filter((conv) => {
    if (!searchQuery) return true;
    const userName = conv.user
      ? `${conv.user.firstName || ""} ${conv.user.lastName || ""}`.toLowerCase()
      : "";
    const lastMessageContent = conv.lastMessage?.content?.toLowerCase() || "";
    return userName.includes(searchQuery.toLowerCase()) || lastMessageContent.includes(searchQuery.toLowerCase());
  });

  const isPartnerTyping = selectedUserId && typingUsers[selectedUserId];
  const isPartnerOnline = selectedUserId && (onlineUsers[selectedUserId] || currentUser?.isOnline);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Giriş Gerekli</h2>
            <p className="text-muted-foreground mb-6">
              Mesajlarınızı görüntülemek için giriş yapmalısınız
            </p>
            <Button data-testid="button-login" onClick={() => navigate("/giris")}>
              Giriş Yap
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-background flex flex-col lg:flex-row">
      <div
        className={`${
          selectedUserId ? "hidden lg:flex" : "flex"
        } w-full lg:w-80 border-r flex-col flex-shrink-0`}
      >
        <div className="p-3 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Mesajlar</h2>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowSearch(!showSearch)}
                data-testid="button-toggle-search"
              >
                <Search className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" data-testid="button-messages-menu">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowArchived(!showArchived)}>
                    <Archive className="h-4 w-4 mr-2" />
                    {showArchived ? "Aktif Konuşmalar" : "Arşivlenmiş Konuşmalar"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Konuşmalarda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8"
                data-testid="input-search-conversations"
              />
              {searchQuery && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {showArchived && (
            <Badge variant="secondary" className="text-xs">
              <Archive className="h-3 w-3 mr-1" />
              Arşivlenmiş konuşmalar gösteriliyor
            </Badge>
          )}
        </div>

        <ScrollArea className="flex-1">
          {isLoadingConversations ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : !filteredConversations || filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium mb-1">
                {showArchived ? "Arşivlenmiş konuşma yok" : "Henüz mesajınız yok"}
              </p>
              <p className="text-sm text-muted-foreground">
                {showArchived
                  ? "Arşivlediğiniz konuşmalar burada görünecek"
                  : "İlanlardan satıcılara mesaj göndererek başlayın"}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredConversations.map((conversation) => {
                const isOnline = onlineUsers[conversation.partnerId] || conversation.user?.isOnline;
                const isTyping = typingUsers[conversation.partnerId];

                return (
                  <div
                    key={conversation.id}
                    className={`relative group rounded-lg ${
                      selectedConversationId === conversation.id || selectedUserId === conversation.partnerId
                        ? "bg-accent"
                        : "hover-elevate"
                    }`}
                  >
                    <button
                      onClick={() => handleSelectConversation(conversation)}
                      className="w-full p-3 text-left transition-colors"
                      data-testid={`button-conversation-${conversation.partnerId}`}
                    >
                      <div className="flex gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={conversation.user?.profileImageUrl || undefined} />
                            <AvatarFallback>
                              {(conversation.user?.firstName || conversation.user?.email)?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                          )}
                          {conversation.isPinned && (
                            <Pin className="absolute -top-1 -right-1 h-3 w-3 text-primary" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-semibold truncate text-sm flex items-center gap-1">
                              {conversation.user?.firstName && conversation.user?.lastName
                                ? `${conversation.user.firstName} ${conversation.user.lastName}`
                                : conversation.user?.email?.split("@")[0] || "Kullanıcı"}
                              {conversation.isMuted && <BellOff className="h-3 w-3 text-muted-foreground" />}
                            </span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {conversation.lastMessage?.createdAt &&
                                formatMessageTime(conversation.lastMessage.createdAt)}
                            </span>
                          </div>

                          {isTyping ? (
                            <p className="text-sm text-primary font-medium">yazıyor...</p>
                          ) : (
                            <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                              {conversation.lastMessage?.senderId === user.id && (
                                <MessageStatus status={conversation.lastMessage?.status} />
                              )}
                              {conversation.lastMessage?.content || "Henüz mesaj yok"}
                            </p>
                          )}
                        </div>

                        {conversation.unreadCount > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full self-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`button-conversation-menu-${conversation.id}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => pinMutation.mutate({ conversationId: conversation.id, pinned: !conversation.isPinned })}
                        >
                          <Pin className="h-4 w-4 mr-2" />
                          {conversation.isPinned ? "Sabiti Kaldır" : "Sabitle"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => muteMutation.mutate({ conversationId: conversation.id, muted: !conversation.isMuted })}
                        >
                          {conversation.isMuted ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
                          {conversation.isMuted ? "Bildirimleri Aç" : "Sessize Al"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            archiveMutation.mutate({ conversationId: conversation.id, archived: !conversation.isArchived })
                          }
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          {conversation.isArchived ? "Arşivden Çıkar" : "Arşivle"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {selectedUserId ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-3 border-b flex items-center gap-3 flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="lg:hidden"
              onClick={() => {
                setSelectedUserId(null);
                setSelectedConversationId(null);
                navigate("/mesajlar");
              }}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {currentUser && (
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUser.profileImageUrl || undefined} />
                    <AvatarFallback>
                      {(currentUser.firstName || currentUser.email)?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isPartnerOnline && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate" data-testid="text-chat-user-name">
                    {currentUser.firstName && currentUser.lastName
                      ? `${currentUser.firstName} ${currentUser.lastName}`
                      : currentUser.email?.split("@")[0]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isPartnerTyping ? (
                      <span className="text-primary">yazıyor...</span>
                    ) : isPartnerOnline ? (
                      <span className="text-green-600">Çevrimiçi</span>
                    ) : currentUser.lastSeenAt ? (
                      <span>Son görülme: {formatLastSeen(currentUser.lastSeenAt)}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {currentListing && (
              <Button
                size="sm"
                variant="outline"
                className="gap-2 hidden sm:flex"
                onClick={() => setShowListingPanel(!showListingPanel)}
                data-testid="button-toggle-listing"
              >
                {currentListing.images?.[0] && (
                  <img src={currentListing.images[0]} alt="" className="w-5 h-5 rounded object-cover" />
                )}
                <span className="max-w-[100px] truncate">{currentListing.title}</span>
              </Button>
            )}

            {selectedConversation && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" data-testid="button-chat-menu">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      pinMutation.mutate({
                        conversationId: selectedConversation.id,
                        pinned: !selectedConversation.isPinned,
                      })
                    }
                  >
                    <Pin className="h-4 w-4 mr-2" />
                    {selectedConversation.isPinned ? "Sabiti Kaldır" : "Sabitle"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      muteMutation.mutate({
                        conversationId: selectedConversation.id,
                        muted: !selectedConversation.isMuted,
                      })
                    }
                  >
                    {selectedConversation.isMuted ? (
                      <Bell className="h-4 w-4 mr-2" />
                    ) : (
                      <BellOff className="h-4 w-4 mr-2" />
                    )}
                    {selectedConversation.isMuted ? "Bildirimleri Aç" : "Sessize Al"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      archiveMutation.mutate({
                        conversationId: selectedConversation.id,
                        archived: !selectedConversation.isArchived,
                      })
                    }
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    {selectedConversation.isArchived ? "Arşivden Çıkar" : "Arşivle"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {showListingPanel && currentListing && (
            <div className="lg:hidden border-b max-h-80 overflow-auto">
              <ListingPanel listing={currentListing} user={currentUser || null} />
            </div>
          )}

          <ScrollArea className="flex-1 p-4">
            {isLoadingMessages ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className={`h-14 ${i % 2 === 0 ? "ml-auto" : ""} w-3/4`} />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Henüz mesaj yok</p>
                  <p className="text-sm text-muted-foreground">İlk mesajı gönderin</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => {
                  const isOwnMessage = message.senderId === user.id;
                  const showDate =
                    index === 0 ||
                    new Date(message.createdAt).toDateString() !==
                      new Date(messages[index - 1].createdAt).toDateString();

                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="text-center my-4">
                          <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                            {isToday(new Date(message.createdAt))
                              ? "Bugün"
                              : isYesterday(new Date(message.createdAt))
                              ? "Dün"
                              : format(new Date(message.createdAt), "d MMMM yyyy", { locale: tr })}
                          </span>
                        </div>
                      )}
                      <div
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        data-testid={`message-${message.id}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            isOwnMessage
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 ${
                              isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            <span className="text-[10px]">
                              {format(new Date(message.createdAt), "HH:mm", { locale: tr })}
                            </span>
                            {isOwnMessage && <MessageStatus status={message.status} />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isPartnerTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-md">
                      <TypingIndicator />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="p-3 border-t flex-shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Mesajınızı yazın..."
                value={messageText}
                onChange={handleInputChange}
                disabled={sendMessageMutation.isPending}
                className="flex-1"
                data-testid="input-message"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!messageText.trim() || sendMessageMutation.isPending}
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-semibold mb-2">Mesajlaşmaya Başlayın</p>
            <p className="text-sm text-muted-foreground">Soldaki listeden bir konuşma seçin</p>
          </div>
        </div>
      )}

      {selectedUserId && currentListing && (
        <div className="hidden lg:flex w-80 xl:w-96 border-l flex-col flex-shrink-0">
          <ListingPanel listing={currentListing} user={currentUser || null} />
        </div>
      )}
    </div>
  );
}
