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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Image as ImageIcon,
  Paperclip,
  FileText,
  Download,
  Loader2,
  Smile,
  Reply,
  Pencil,
  Trash2,
  Copy,
  CornerUpLeft,
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

type Attachment = {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  type: "image" | "file";
};

type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  status?: "sent" | "delivered" | "read";
  readAt?: string | null;
  messageType?: "text" | "image" | "file" | "system" | "offer";
  attachments?: Attachment[];
  listing?: ListingInfo;
  isDeleted?: boolean;
  isEdited?: boolean;
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

// Emoji kategorileri
const EMOJI_CATEGORIES = {
  "Sık Kullanılan": ["👍", "❤️", "😊", "😂", "🙏", "👏", "🔥", "✨", "💯", "🎉"],
  "Yüzler": ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋"],
  "Hayvanlar": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆"],
  "El Hareketleri": ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👍", "👎"],
  "Kalpler": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟"],
};

type EmojiPickerProps = {
  onSelect: (emoji: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

function EmojiPicker({ onSelect, isOpen, onOpenChange }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState("Sık Kullanılan");
  
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="flex-shrink-0"
          data-testid="button-emoji-picker"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="start"
        side="top"
        sideOffset={8}
      >
        <div className="border-b">
          <ScrollArea className="w-full">
            <div className="flex p-1 gap-1">
              {Object.keys(EMOJI_CATEGORIES).map((category) => (
                <Button
                  key={category}
                  size="sm"
                  variant={activeCategory === category ? "secondary" : "ghost"}
                  className="text-xs whitespace-nowrap h-7 px-2"
                  onClick={() => setActiveCategory(category)}
                  data-testid={`button-emoji-category-${category}`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="p-2 h-48 overflow-y-auto">
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, idx) => (
              <button
                key={idx}
                className="w-8 h-8 flex items-center justify-center text-xl hover:bg-muted rounded transition-colors"
                onClick={() => {
                  onSelect(emoji);
                  onOpenChange(false);
                }}
                data-testid={`button-emoji-${idx}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Reply message type
type ReplyMessage = {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
} | null;

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
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [showListingPanel, setShowListingPanel] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<ReplyMessage>(null);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    mutationFn: async ({ content, attachments }: { content: string; attachments?: Attachment[] }) => {
      const selectedConv = conversations?.find((c) => c.partnerId === selectedUserId);
      return apiRequest("POST", "/api/messages", {
        receiverId: selectedUserId,
        content,
        listingId: selectedConv?.lastMessage?.listing?.id || messagesData?.listing?.id || null,
        messageType: attachments?.length ? (attachments[0].type === "image" ? "image" : "file") : "text",
        attachments: attachments || [],
      });
    },
    onSuccess: () => {
      setMessageText("");
      setPendingAttachment(null);
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

  const handleFileUpload = async (file: File) => {
    setUploadingFile(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<Attachment>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(progress);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              reject(new Error("Geçersiz yanıt"));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.message || "Dosya yüklenemedi"));
            } catch {
              reject(new Error("Dosya yüklenemedi"));
            }
          }
        };
        
        xhr.onerror = () => reject(new Error("Ağ hatası"));
        xhr.onabort = () => reject(new Error("Yükleme iptal edildi"));
        
        xhr.open("POST", "/api/messages/upload");
        xhr.withCredentials = true;
        xhr.send(formData);
      });
      
      const attachment = await uploadPromise;
      setPendingAttachment(attachment);
      toast({
        title: "Dosya yüklendi",
        description: "Mesajınıza eklenmeye hazır",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Dosya yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    e.target.value = "";
  };

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

  const handleEmojiSelect = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleReplyToMessage = (message: Message) => {
    const senderName = message.senderId === user?.id 
      ? "Siz" 
      : `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() || "Kullanıcı";
    
    // Fallback content for attachment-only messages
    let replyContent = message.content;
    if (!replyContent || replyContent === "Fotograf" || replyContent === "Dosya") {
      if (message.attachments?.length) {
        const firstAttachment = message.attachments[0];
        replyContent = firstAttachment.type === "image" ? "Fotoğraf gönderisi" : `Dosya: ${firstAttachment.filename}`;
      } else {
        replyContent = "Mesaj";
      }
    }
    
    setReplyToMessage({
      id: message.id,
      content: replyContent,
      senderId: message.senderId,
      senderName,
    });
    inputRef.current?.focus();
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Kopyalandı",
      description: "Mesaj panoya kopyalandı",
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      // Optimistically update UI
      queryClient.setQueryData<MessagesResponse>(
        ["/api/messages", selectedUserId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((m) =>
              m.id === messageId
                ? { ...m, content: "Bu mesaj silindi", isDeleted: true }
                : m
            ),
          };
        }
      );
      
      ws.send(JSON.stringify({
        type: "delete_message",
        messageId,
      }));
      toast({
        title: "Silindi",
        description: "Mesaj silindi",
      });
    }
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
    if ((!messageText.trim() && !pendingAttachment) || !selectedUserId) return;
    sendTypingIndicator(false);
    sendMessageMutation.mutate({
      content: messageText.trim() || (pendingAttachment?.type === "image" ? "📷 Fotoğraf" : "📎 Dosya"),
      attachments: pendingAttachment ? [pendingAttachment] : undefined,
    });
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

  // Filter messages for in-conversation search
  const filteredMessages = messageSearchQuery
    ? messages.filter((m) => 
        m.content.toLowerCase().includes(messageSearchQuery.toLowerCase())
      )
    : messages;

  const filteredConversations = conversations?.filter((conv) => {
    // Unread filter
    if (showUnreadOnly && conv.unreadCount === 0) return false;
    
    // Search filter
    if (!searchQuery) return true;
    const userName = conv.user
      ? `${conv.user.firstName || ""} ${conv.user.lastName || ""}`.toLowerCase()
      : "";
    const lastMessageContent = conv.lastMessage?.content?.toLowerCase() || "";
    return userName.includes(searchQuery.toLowerCase()) || lastMessageContent.includes(searchQuery.toLowerCase());
  });
  
  const unreadConversationsCount = conversations?.filter(c => c.unreadCount > 0).length || 0;

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

          {/* Quick filters */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={showUnreadOnly ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              data-testid="button-filter-unread"
            >
              {unreadConversationsCount > 0 && (
                <Badge variant="destructive" className="h-4 px-1 mr-1.5 text-[10px]">
                  {unreadConversationsCount}
                </Badge>
              )}
              Okunmamış
            </Button>
            <Button
              size="sm"
              variant={showArchived ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setShowArchived(!showArchived)}
              data-testid="button-filter-archived"
            >
              <Archive className="h-3 w-3 mr-1" />
              Arşiv
            </Button>
          </div>
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

            {/* In-conversation Search */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowMessageSearch(!showMessageSearch)}
                  data-testid="button-message-search"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mesajlarda Ara</TooltipContent>
            </Tooltip>

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

          {/* In-conversation Search Input */}
          {showMessageSearch && (
            <div className="p-2 border-b bg-muted/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Mesajlarda ara..."
                  value={messageSearchQuery}
                  onChange={(e) => setMessageSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                  autoFocus
                  data-testid="input-message-search"
                />
                {messageSearchQuery && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setMessageSearchQuery("")}
                    data-testid="button-clear-message-search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {messageSearchQuery && (
                <p className="text-xs text-muted-foreground mt-1 px-1">
                  {filteredMessages.length} sonuç bulundu
                </p>
              )}
            </div>
          )}

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
                {filteredMessages.map((message, index) => {
                  const isOwnMessage = message.senderId === user.id;
                  const showDate =
                    index === 0 ||
                    new Date(message.createdAt).toDateString() !==
                      new Date(filteredMessages[index - 1].createdAt).toDateString();

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
                        className={`group flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        data-testid={`message-${message.id}`}
                      >
                        {/* Message Actions - Left side for own messages */}
                        {isOwnMessage && !message.isDeleted && (
                          <div className="flex items-center gap-0.5 mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => handleDeleteMessage(message.id)}
                                  data-testid={`button-delete-message-${message.id}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Sil</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => handleCopyMessage(message.content)}
                                  data-testid={`button-copy-message-${message.id}`}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Kopyala</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => handleReplyToMessage(message)}
                                  data-testid={`button-reply-message-${message.id}`}
                                >
                                  <Reply className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Yanıtla</TooltipContent>
                            </Tooltip>
                          </div>
                        )}

                        <div
                          className={`max-w-[70%] rounded-2xl transition-all duration-200 hover:shadow-md ${
                            message.attachments?.length ? "p-1" : "px-4 py-2"
                          } ${
                            isOwnMessage
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          }`}
                        >
                          {/* Deleted message styling */}
                          {message.isDeleted ? (
                            <p className={`text-sm italic opacity-60 ${message.attachments?.length ? "px-3 pt-1" : ""}`}>
                              Bu mesaj silindi
                            </p>
                          ) : (
                            <>
                              {message.attachments?.map((attachment, idx) => (
                                <div key={idx} className="mb-1">
                                  {attachment.type === "image" ? (
                                    <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                      <img
                                        src={attachment.url}
                                        alt={attachment.filename}
                                        className="max-w-full rounded-lg max-h-60 object-cover"
                                      />
                                    </a>
                                  ) : (
                                    <a
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 p-2 rounded-lg ${
                                        isOwnMessage ? "bg-primary-foreground/10" : "bg-background"
                                      }`}
                                    >
                                      <FileText className="h-8 w-8 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{attachment.filename}</p>
                                        <p className={`text-xs ${isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                          {(attachment.size / 1024).toFixed(1)} KB
                                        </p>
                                      </div>
                                      <Download className="h-4 w-4 flex-shrink-0" />
                                    </a>
                                  )}
                                </div>
                              ))}
                              {message.content && message.content !== "Fotograf" && message.content !== "Dosya" && (
                                <p className={`text-sm whitespace-pre-wrap break-words ${message.attachments?.length ? "px-3 pt-1" : ""}`}>
                                  {message.content}
                                </p>
                              )}
                            </>
                          )}
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 ${message.attachments?.length ? "px-3 pb-1" : ""} ${
                              isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            <span className="text-[10px]">
                              {format(new Date(message.createdAt), "HH:mm", { locale: tr })}
                            </span>
                            {isOwnMessage && <MessageStatus status={message.status} />}
                          </div>
                        </div>

                        {/* Message Actions - Right side for partner messages */}
                        {!isOwnMessage && !message.isDeleted && (
                          <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => handleReplyToMessage(message)}
                                  data-testid={`button-reply-message-${message.id}`}
                                >
                                  <Reply className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Yanıtla</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => handleCopyMessage(message.content)}
                                  data-testid={`button-copy-message-${message.id}`}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Kopyala</TooltipContent>
                            </Tooltip>
                          </div>
                        )}
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
            {/* Reply Preview */}
            {replyToMessage && (
              <div className="mb-2 p-2 bg-primary/10 border-l-4 border-primary rounded-r-lg flex items-start gap-2">
                <CornerUpLeft className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-primary">{replyToMessage.senderName}</p>
                  <p className="text-sm text-muted-foreground truncate">{replyToMessage.content}</p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => setReplyToMessage(null)}
                  data-testid="button-cancel-reply"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Upload Progress */}
            {uploadingFile && (
              <div className="mb-2 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Dosya yükleniyor...</p>
                    <p className="text-xs text-muted-foreground">%{uploadProgress} tamamlandı</p>
                  </div>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            
            {/* Pending Attachment Preview */}
            {pendingAttachment && !uploadingFile && (
              <div className="mb-2 p-2 bg-muted rounded-lg flex items-center gap-2">
                {pendingAttachment.type === "image" ? (
                  <img
                    src={pendingAttachment.url}
                    alt="Ek"
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-background rounded flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{pendingAttachment.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {(pendingAttachment.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setPendingAttachment(null)}
                  data-testid="button-remove-attachment"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex gap-2 items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                data-testid="input-file"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile || sendMessageMutation.isPending}
                data-testid="button-attach-file"
              >
                {uploadingFile ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
              </Button>
              
              {/* Emoji Picker */}
              <EmojiPicker 
                onSelect={handleEmojiSelect}
                isOpen={emojiPickerOpen}
                onOpenChange={setEmojiPickerOpen}
              />
              
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
                disabled={(!messageText.trim() && !pendingAttachment) || sendMessageMutation.isPending}
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
