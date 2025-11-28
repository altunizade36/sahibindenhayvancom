import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { tr } from "date-fns/locale";

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

const notificationLabels: Record<string, string> = {
  new_message: "Yeni Mesaj",
  listing_approved: "İlan Onaylandı",
  listing_rejected: "İlan Reddedildi",
  new_favorite: "Yeni Favori",
  price_drop: "Fiyat Düştü",
  auction_outbid: "Teklifiniz Geçildi",
  auction_won: "Açık Artırmayı Kazandınız",
  auction_ending: "Açık Artırma Bitiyor",
  system: "Sistem",
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", { limit: 50 }],
    enabled: isAuthenticated,
  });

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
      toast({
        title: "Silindi",
        description: "Bildirim silindi",
      });
    },
  });

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Giriş Yapın</h1>
          <p className="text-muted-foreground mb-6">
            Bildirimlerinizi görmek için giriş yapmanız gerekmektedir.
          </p>
          <Link href="/giris">
            <Button data-testid="button-login">Giriş Yap</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link href="/panel">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Bildirimler</h1>
              {unreadNotifications.length > 0 && (
                <Badge variant="secondary">{unreadNotifications.length} okunmamış</Badge>
              )}
            </div>
            {unreadNotifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                data-testid="button-mark-all-read"
              >
                {markAllAsReadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <CheckCheck className="h-4 w-4 mr-1" />
                )}
                Tümünü Okundu İşaretle
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Bell className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Henüz bildirim yok</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Yeni mesajlar, ilan güncellemeleri ve açık artırma bildirimleri burada
                  görünecek.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {unreadNotifications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      Okunmamış ({unreadNotifications.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y">
                    {unreadNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={() => markAsReadMutation.mutate(notification.id)}
                        onDelete={() => deleteNotificationMutation.mutate(notification.id)}
                        isMarkingRead={markAsReadMutation.isPending}
                        isDeleting={deleteNotificationMutation.isPending}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {readNotifications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                      <Check className="h-5 w-5" />
                      Okunmuş ({readNotifications.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y">
                    {readNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={() => {}}
                        onDelete={() => deleteNotificationMutation.mutate(notification.id)}
                        isMarkingRead={false}
                        isDeleting={deleteNotificationMutation.isPending}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  isMarkingRead,
  isDeleting,
}: {
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
  isMarkingRead: boolean;
  isDeleting: boolean;
}) {
  const Icon = notificationIcons[notification.type] || Bell;
  const iconColor = notificationColors[notification.type] || "text-muted-foreground";
  const label = notificationLabels[notification.type] || "Bildirim";

  const content = (
    <div
      className={`py-4 first:pt-0 last:pb-0 ${!notification.isRead ? "bg-primary/5 -mx-6 px-6" : ""}`}
    >
      <div className="flex gap-4">
        <div className={`mt-1 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              {label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: tr,
              })}
            </span>
          </div>
          <h3 className="font-medium mb-1">{notification.title}</h3>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {format(new Date(notification.createdAt), "d MMMM yyyy, HH:mm", { locale: tr })}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMarkAsRead();
              }}
              disabled={isMarkingRead}
              data-testid={`button-mark-read-${notification.id}`}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            disabled={isDeleting}
            data-testid={`button-delete-${notification.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} className="block hover:bg-muted/30 transition-colors">
        {content}
      </Link>
    );
  }

  return content;
}
