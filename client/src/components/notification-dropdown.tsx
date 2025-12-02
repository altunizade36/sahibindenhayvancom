import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  Bell,
  MessageSquare,
  Check,
  CheckCheck,
  Heart,
  AlertCircle,
  Gavel,
  Trophy,
  Clock,
  Settings,
  Loader2,
  X,
  Volume2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

let audioContextInstance: AudioContext | null = null;
let userHasInteracted = false;

function initAudioContext() {
  if (!audioContextInstance) {
    try {
      audioContextInstance = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      // Audio not supported
    }
  }
  return audioContextInstance;
}

function handleUserInteraction() {
  if (!userHasInteracted) {
    userHasInteracted = true;
    const ctx = initAudioContext();
    if (ctx?.state === "suspended") {
      ctx.resume();
    }
  }
}

if (typeof window !== "undefined") {
  document.addEventListener("click", handleUserInteraction, { once: true });
  document.addEventListener("keydown", handleUserInteraction, { once: true });
}

function playNotificationSound() {
  if (!userHasInteracted) return;
  
  try {
    const audioContext = initAudioContext();
    if (!audioContext || audioContext.state !== "running") return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = "sine";
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    // Audio not supported or blocked
  }
}

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  relatedId: string | null;
  isRead: boolean;
  createdAt: string;
}

const notificationIcons: Record<string, any> = {
  new_message: MessageSquare,
  listing_approved: Check,
  listing_rejected: AlertCircle,
  new_favorite: Heart,
  price_drop: AlertCircle,
  auction_outbid: Gavel,
  auction_won: Trophy,
  auction_ending: Clock,
  system: Settings,
};

const notificationColors: Record<string, string> = {
  new_message: "text-blue-500",
  listing_approved: "text-green-500",
  listing_rejected: "text-red-500",
  new_favorite: "text-pink-500",
  price_drop: "text-orange-500",
  auction_outbid: "text-yellow-500",
  auction_won: "text-green-500",
  auction_ending: "text-amber-500",
  system: "text-muted-foreground",
};

export function NotificationDropdown() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: notificationCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/count"],
    refetchInterval: 30000,
  });

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isOpen,
  });

  const handleWebSocketNotification = useCallback((notification: Notification & { senderName?: string }) => {
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    
    playNotificationSound();
    
    toast({
      title: notification.title,
      description: notification.message,
      duration: 5000,
    });
  }, [toast]);

  useEffect(() => {
    if (!user) return;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      
      ws.onopen = () => {
        // Send auth message to register this socket for notifications
        ws.send(JSON.stringify({ type: "auth", userId: user.id }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "notification") {
            handleWebSocketNotification(data.notification);
          } else if (data.type === "auth_success") {
            console.log("WebSocket authenticated for notifications");
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };
      
      ws.onerror = () => {
        // WebSocket connection failed - will retry
      };
      
      ws.onclose = (event) => {
        wsRef.current = null;
        // Always try to reconnect after a delay (except intentional unmount)
        if (event.code !== 1000 || event.reason !== "Component unmounted") {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
        }
      };
      
      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
      }
    };
  }, [user, handleWebSocketNotification]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
      toast({
        title: "Tümü okundu",
        description: "Tüm bildirimler okundu olarak işaretlendi",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest("DELETE", `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      setIsOpen(false);
    }
  };

  const unreadCount = notificationCount.count;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Bildirimler</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-1" />
              )}
              Tümünü Okundu İşaretle
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Henüz bildirim yok</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell;
                const iconColor = notificationColors[notification.type] || "text-muted-foreground";

                return (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-muted/50 transition-colors ${
                      !notification.isRead ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-1 ${iconColor}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {notification.link ? (
                          <Link
                            href={notification.link}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <p className="text-sm font-medium hover:underline cursor-pointer">
                              {notification.title}
                            </p>
                          </Link>
                        ) : (
                          <p className="text-sm font-medium">{notification.title}</p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                            data-testid={`button-mark-read-${notification.id}`}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteNotificationMutation.mutate(notification.id)}
                          data-testid={`button-delete-notification-${notification.id}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <Separator />
        <div className="p-2">
          <Link href="/bildirimler">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => setIsOpen(false)}
              data-testid="link-all-notifications"
            >
              Tüm Bildirimleri Gör
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
