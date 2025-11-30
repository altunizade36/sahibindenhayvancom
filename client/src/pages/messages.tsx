import { useState, useEffect, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare, ArrowLeft, MapPin, Phone, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { format } from "date-fns";
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
  listing?: ListingInfo;
};

type PartnerUser = {
  id: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
};

type Conversation = {
  partnerId: string;
  user: PartnerUser | null;
  lastMessage: Message;
  listing: ListingInfo;
  unreadCount: number;
};

type MessagesResponse = {
  messages: Message[];
  listing: ListingInfo;
};

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
      {/* İlan Resmi */}
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

      {/* Küçük Resimler */}
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

      {/* İlan Detayları */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {/* Fiyat */}
          <div className="text-2xl font-bold text-primary" data-testid="text-listing-price">
            {parseFloat(listing.price).toLocaleString("tr-TR")} ₺
          </div>

          {/* Başlık */}
          <h3 className="font-semibold text-lg leading-tight" data-testid="text-listing-title">
            {listing.title}
          </h3>

          {/* Konum */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span data-testid="text-listing-location">
              {listing.district}, {listing.city}
            </span>
          </div>

          {/* İlana Git Butonu */}
          <Link href={`/ilan/${listing.id}`}>
            <Button variant="outline" className="w-full gap-2" data-testid="button-view-listing">
              <ExternalLink className="h-4 w-4" />
              İlanı Görüntüle
            </Button>
          </Link>

          {/* Satıcı Bilgileri */}
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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [showListingPanel, setShowListingPanel] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Parse query params for initial conversation
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const userId = params.get("userId");
    if (userId) {
      setSelectedUserId(userId);
    }
  }, [location]);

  // Fetch conversations
  const { data: conversations, isLoading: isLoadingConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
    enabled: !!user,
  });

  // Fetch messages for selected user
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery<MessagesResponse>({
    queryKey: ["/api/messages", selectedUserId],
    enabled: !!user && !!selectedUserId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const selectedConv = conversations?.find((c) => c.partnerId === selectedUserId);
      return apiRequest("POST", "/api/messages", {
        receiverId: selectedUserId,
        content,
        listingId: selectedConv?.listing?.id || messagesData?.listing?.id || null,
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

  // WebSocket connection
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const websocket = new WebSocket(wsUrl);

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chat" || data.type === "chat_sent") {
          queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
          queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
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

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUserId) return;
    sendMessageMutation.mutate(messageText);
  };

  const selectedConversation = conversations?.find((c) => c.partnerId === selectedUserId);
  const currentListing = messagesData?.listing || selectedConversation?.listing;
  const currentUser = selectedConversation?.user;
  const messages = messagesData?.messages || [];

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
      {/* Sol Panel - Sohbetler (Desktop) veya Tam Ekran (Mobil seçim yapılmamışsa) */}
      <div
        className={`${
          selectedUserId ? "hidden lg:flex" : "flex"
        } w-full lg:w-80 border-r flex-col flex-shrink-0`}
      >
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Mesajlar</h2>
        </div>
        <ScrollArea className="flex-1">
          {isLoadingConversations ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : !conversations || conversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium mb-1">Henüz mesajınız yok</p>
              <p className="text-sm text-muted-foreground">
                İlanlardan satıcılara mesaj göndererek başlayın
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.partnerId}
                  onClick={() => setSelectedUserId(conversation.partnerId)}
                  className={`w-full p-3 rounded-lg hover-elevate text-left transition-colors ${
                    selectedUserId === conversation.partnerId ? "bg-accent" : ""
                  }`}
                  data-testid={`button-conversation-${conversation.partnerId}`}
                >
                  <div className="flex gap-3">
                    {/* İlan Küçük Resmi */}
                    <div className="w-14 h-14 rounded bg-muted overflow-hidden flex-shrink-0">
                      {conversation.listing?.images?.[0] ? (
                        <img
                          src={conversation.listing.images[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Kullanıcı Adı */}
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold truncate text-sm">
                          {conversation.user?.firstName && conversation.user?.lastName
                            ? `${conversation.user.firstName} ${conversation.user.lastName}`
                            : conversation.user?.email?.split("@")[0] || "Kullanıcı"}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      {/* İlan Başlığı */}
                      {conversation.listing?.title && (
                        <p className="text-xs text-muted-foreground truncate mb-0.5">
                          {conversation.listing.title}
                        </p>
                      )}
                      {/* Son Mesaj */}
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage?.content}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Orta Panel - Sohbet Alanı */}
      {selectedUserId ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Sohbet Başlığı */}
          <div className="p-3 border-b flex items-center gap-3 flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="lg:hidden"
              onClick={() => setSelectedUserId(null)}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* Küçük İlan Önizleme */}
            {currentListing && (
              <div
                className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer lg:cursor-default"
                onClick={() => setShowListingPanel(!showListingPanel)}
              >
                <div className="w-10 h-10 rounded bg-muted overflow-hidden flex-shrink-0">
                  {currentListing.images?.[0] ? (
                    <img
                      src={currentListing.images[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate" data-testid="text-chat-listing-title">
                    {currentListing.title}
                  </p>
                  <p className="text-xs text-primary font-semibold">
                    {parseFloat(currentListing.price).toLocaleString("tr-TR")} ₺
                  </p>
                </div>
              </div>
            )}

            {!currentListing && currentUser && (
              <div className="flex items-center gap-2 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={currentUser.profileImageUrl || undefined} />
                  <AvatarFallback>
                    {(currentUser.firstName || currentUser.email)?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-sm" data-testid="text-chat-user-name">
                    {currentUser.firstName && currentUser.lastName
                      ? `${currentUser.firstName} ${currentUser.lastName}`
                      : currentUser.email?.split("@")[0]}
                  </div>
                </div>
              </div>
            )}

            {/* Mobilde İlan Paneli Toggle */}
            {currentListing && (
              <Button
                size="sm"
                variant="outline"
                className="lg:hidden"
                onClick={() => setShowListingPanel(!showListingPanel)}
                data-testid="button-toggle-listing"
              >
                {showListingPanel ? "Gizle" : "İlan"}
              </Button>
            )}
          </div>

          {/* Mobil İlan Paneli */}
          {showListingPanel && currentListing && (
            <div className="lg:hidden border-b max-h-80 overflow-auto">
              <ListingPanel listing={currentListing} user={currentUser || null} />
            </div>
          )}

          {/* Mesajlar */}
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
                {messages.map((message) => {
                  const isOwnMessage = message.senderId === user.id;
                  return (
                    <div
                      key={message.id}
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
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {format(new Date(message.createdAt), "HH:mm", { locale: tr })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Mesaj Gönderme */}
          <form onSubmit={handleSendMessage} className="p-3 border-t flex-shrink-0">
            <div className="flex gap-2">
              <Input
                placeholder="Mesajınızı yazın..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
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
        // Desktop - Sohbet seçilmemişse
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-semibold mb-2">Mesajlaşmaya Başlayın</p>
            <p className="text-sm text-muted-foreground">
              Soldaki listeden bir konuşma seçin
            </p>
          </div>
        </div>
      )}

      {/* Sağ Panel - İlan Detayları (Sadece Desktop) */}
      {selectedUserId && currentListing && (
        <div className="hidden lg:flex w-80 xl:w-96 border-l flex-col flex-shrink-0">
          <ListingPanel listing={currentListing} user={currentUser || null} />
        </div>
      )}
    </div>
  );
}
