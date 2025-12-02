import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Send,
  Users,
  Mail,
  CheckCircle,
  Clock,
  Megaphone,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Broadcast {
  id: string;
  title: string;
  content: string;
  type: string;
  targetAudience: string;
  recipientCount: number;
  deliveredCount: number;
  openedCount: number;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

interface BroadcastStats {
  totalSent: number;
  deliveryRate: string | number;
  openRate: string | number;
  pendingQueue: number;
}

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    content: "",
    type: "push",
    targetAudience: "all",
  });

  const { data: broadcasts = [], isLoading } = useQuery<Broadcast[]>({
    queryKey: ["/api/admin/broadcasts"],
  });

  const { data: stats } = useQuery<BroadcastStats>({
    queryKey: ["/api/admin/broadcasts/stats"],
  });

  const sendMutation = useMutation({
    mutationFn: async (data: typeof notificationForm) => {
      return apiRequest("POST", "/api/admin/broadcasts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcasts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcasts/stats"] });
      toast({ title: "Bildirim başarıyla gönderildi" });
      setIsComposeOpen(false);
      setNotificationForm({
        title: "",
        content: "",
        type: "push",
        targetAudience: "all",
      });
    },
    onError: () => {
      toast({ title: "Bildirim gönderilemedi", variant: "destructive" });
    },
  });

  const handleSendNotification = () => {
    if (!notificationForm.title || !notificationForm.content) {
      toast({ title: "Başlık ve içerik gereklidir", variant: "destructive" });
      return;
    }
    sendMutation.mutate(notificationForm);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge variant="default">Gönderildi</Badge>;
      case "pending":
        return <Badge variant="secondary">Bekliyor</Badge>;
      case "failed":
        return <Badge variant="destructive">Başarısız</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "push":
        return "Uygulama";
      case "email":
        return "E-posta";
      case "sms":
        return "SMS";
      case "all":
        return "Tümü";
      default:
        return type;
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case "all":
        return "Tüm Kullanıcılar";
      case "verified":
        return "Doğrulanmış";
      case "sellers":
        return "Satıcılar";
      case "buyers":
        return "Alıcılar";
      default:
        return audience;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="page-admin-notifications">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Bildirim Yönetimi</h1>
            <p className="text-muted-foreground">
              Toplu bildirim gönderin ve geçmişi görüntüleyin
            </p>
          </div>
          <Button onClick={() => setIsComposeOpen(true)} data-testid="button-new-broadcast">
            <Megaphone className="h-4 w-4 mr-2" />
            Yeni Bildirim
          </Button>
        </div>

        <StatCardGrid columns={4}>
          <StatCard
            title="Toplam Gönderim"
            value={(stats?.totalSent || 0).toLocaleString("tr-TR")}
            icon={<Send className="h-4 w-4" />}
          />
          <StatCard
            title="Teslim Oranı"
            value={`%${stats?.deliveryRate || 0}`}
            icon={<CheckCircle className="h-4 w-4" />}
            variant="success"
          />
          <StatCard
            title="Açılma Oranı"
            value={`%${stats?.openRate || 0}`}
            icon={<Mail className="h-4 w-4" />}
          />
          <StatCard
            title="Bekleyen"
            value={stats?.pendingQueue || 0}
            icon={<Clock className="h-4 w-4" />}
          />
        </StatCardGrid>

        <Card>
          <CardHeader>
            <CardTitle>Gönderim Geçmişi</CardTitle>
            <CardDescription>Gönderilen bildirimlerin listesi</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : broadcasts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Henüz bildirim gönderilmemiş</p>
                <p className="text-sm mt-2">İlk toplu bildirimi göndermek için yukarıdaki butona tıklayın</p>
              </div>
            ) : (
              <div className="space-y-4">
                {broadcasts.map((broadcast) => (
                  <div
                    key={broadcast.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                    data-testid={`broadcast-item-${broadcast.id}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{broadcast.title}</h4>
                        {getStatusBadge(broadcast.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {broadcast.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span>Tip: {getTypeLabel(broadcast.type)}</span>
                        <span>Hedef: {getAudienceLabel(broadcast.targetAudience)}</span>
                        <span>Alıcı: {broadcast.recipientCount.toLocaleString("tr-TR")}</span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {broadcast.sentAt && format(new Date(broadcast.sentAt), "d MMM yyyy HH:mm", { locale: tr })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Yeni Bildirim Gönder</DialogTitle>
              <DialogDescription>
                Tüm kullanıcılara veya belirli gruplara bildirim gönderin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Başlık</Label>
                <Input
                  id="title"
                  placeholder="Bildirim başlığı"
                  value={notificationForm.title}
                  onChange={(e) =>
                    setNotificationForm({ ...notificationForm, title: e.target.value })
                  }
                  data-testid="input-broadcast-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">İçerik</Label>
                <Textarea
                  id="content"
                  placeholder="Bildirim içeriği"
                  rows={4}
                  value={notificationForm.content}
                  onChange={(e) =>
                    setNotificationForm({ ...notificationForm, content: e.target.value })
                  }
                  data-testid="input-broadcast-content"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bildirim Tipi</Label>
                  <Select
                    value={notificationForm.type}
                    onValueChange={(value) =>
                      setNotificationForm({ ...notificationForm, type: value })
                    }
                  >
                    <SelectTrigger data-testid="select-broadcast-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="push">Uygulama İçi</SelectItem>
                      <SelectItem value="email">E-posta</SelectItem>
                      <SelectItem value="all">Tümü</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hedef Kitle</Label>
                  <Select
                    value={notificationForm.targetAudience}
                    onValueChange={(value) =>
                      setNotificationForm({ ...notificationForm, targetAudience: value })
                    }
                  >
                    <SelectTrigger data-testid="select-broadcast-audience">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                      <SelectItem value="verified">Doğrulanmış Kullanıcılar</SelectItem>
                      <SelectItem value="sellers">Satıcılar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                İptal
              </Button>
              <Button 
                onClick={handleSendNotification} 
                disabled={sendMutation.isPending}
                data-testid="button-send-broadcast"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Gönder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
