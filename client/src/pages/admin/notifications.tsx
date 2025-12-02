import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { StatCard, StatCardGrid } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Send,
  Users,
  Mail,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Megaphone,
  Target,
  Smartphone,
} from "lucide-react";

interface NotificationTemplate {
  id: string;
  name: string;
  type: "email" | "push" | "sms";
  subject: string;
  content: string;
  createdAt: string;
}

interface SentNotification {
  id: string;
  title: string;
  content: string;
  type: string;
  recipients: number;
  delivered: number;
  opened: number;
  sentAt: string;
  status: "sent" | "pending" | "failed";
}

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    content: "",
    type: "push",
    targetAudience: "all",
    sendEmail: true,
    sendPush: true,
    sendSms: false,
  });

  const sentNotifications: SentNotification[] = [
    {
      id: "1",
      title: "Yeni Özellik: Canlı Yayın",
      content: "Artık hayvan satıcıları canlı yayın yapabilir!",
      type: "push",
      recipients: 1250,
      delivered: 1180,
      opened: 450,
      sentAt: new Date().toISOString(),
      status: "sent",
    },
    {
      id: "2",
      title: "Güvenlik Güncellemesi",
      content: "Hesap güvenliğiniz için şifrenizi güncelleyin",
      type: "email",
      recipients: 5000,
      delivered: 4850,
      opened: 1200,
      sentAt: new Date(Date.now() - 86400000).toISOString(),
      status: "sent",
    },
  ];

  const stats = {
    totalSent: 25000,
    deliveryRate: 97.5,
    openRate: 42.3,
    pendingQueue: 0,
  };

  const handleSendNotification = () => {
    toast({ title: "Bildirim gönderildi" });
    setIsComposeOpen(false);
    setNotificationForm({
      title: "",
      content: "",
      type: "push",
      targetAudience: "all",
      sendEmail: true,
      sendPush: true,
      sendSms: false,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="page-admin-notifications">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Bildirim Yönetimi</h1>
            <p className="text-muted-foreground">
              Toplu bildirim gönderin ve kampanyaları yönetin
            </p>
          </div>
          <Button onClick={() => setIsComposeOpen(true)}>
            <Megaphone className="h-4 w-4 mr-2" />
            Yeni Bildirim
          </Button>
        </div>

        <StatCardGrid columns={4}>
          <StatCard
            title="Toplam Gönderim"
            value={stats.totalSent.toLocaleString("tr-TR")}
            icon={<Send className="h-4 w-4" />}
          />
          <StatCard
            title="Teslim Oranı"
            value={`%${stats.deliveryRate}`}
            icon={<CheckCircle className="h-4 w-4" />}
            variant="success"
          />
          <StatCard
            title="Açılma Oranı"
            value={`%${stats.openRate}`}
            icon={<Mail className="h-4 w-4" />}
          />
          <StatCard
            title="Bekleyen"
            value={stats.pendingQueue}
            icon={<Clock className="h-4 w-4" />}
          />
        </StatCardGrid>

        <Tabs defaultValue="history" className="space-y-6">
          <TabsList>
            <TabsTrigger value="history">Gönderim Geçmişi</TabsTrigger>
            <TabsTrigger value="templates">Şablonlar</TabsTrigger>
            <TabsTrigger value="segments">Hedef Kitleler</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Son Gönderimler</CardTitle>
                <CardDescription>Gönderilen bildirimlerin listesi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-center justify-between p-4 bg-accent/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            notification.type === "email"
                              ? "bg-blue-100 text-blue-600"
                              : notification.type === "push"
                              ? "bg-green-100 text-green-600"
                              : "bg-yellow-100 text-yellow-600"
                          }`}
                        >
                          {notification.type === "email" ? (
                            <Mail className="h-5 w-5" />
                          ) : notification.type === "push" ? (
                            <Bell className="h-5 w-5" />
                          ) : (
                            <Smartphone className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {notification.content}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right text-sm">
                          <p>
                            <span className="text-muted-foreground">Gönderilen:</span>{" "}
                            {notification.recipients.toLocaleString()}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Açılan:</span>{" "}
                            {notification.opened.toLocaleString()} (
                            {((notification.opened / notification.delivered) * 100).toFixed(1)}%)
                          </p>
                        </div>
                        <Badge
                          variant={
                            notification.status === "sent"
                              ? "default"
                              : notification.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                          className={notification.status === "sent" ? "bg-green-500" : ""}
                        >
                          {notification.status === "sent"
                            ? "Gönderildi"
                            : notification.status === "pending"
                            ? "Bekliyor"
                            : "Başarısız"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Bildirim Şablonları</CardTitle>
                  <CardDescription>Hazır bildirim şablonları</CardDescription>
                </div>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Şablon
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Hoş Geldiniz",
                      type: "email",
                      description: "Yeni kullanıcı kayıt bildirimi",
                    },
                    {
                      name: "İlan Onayı",
                      type: "push",
                      description: "İlan onaylandığında gönderilir",
                    },
                    {
                      name: "Yeni Mesaj",
                      type: "push",
                      description: "Yeni mesaj bildirimi",
                    },
                    {
                      name: "Şikayet Bildirimi",
                      type: "email",
                      description: "Şikayet durumu güncellemesi",
                    },
                  ].map((template, i) => (
                    <Card key={i} className="hover-elevate cursor-pointer">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{template.name}</p>
                          <Badge variant="outline">{template.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="segments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Hedef Kitleler</CardTitle>
                  <CardDescription>Kullanıcı segmentasyonu</CardDescription>
                </div>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Segment
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Tüm Kullanıcılar", count: 5000, description: "Tüm kayıtlı kullanıcılar" },
                    { name: "Aktif Satıcılar", count: 450, description: "Son 30 günde ilan veren satıcılar" },
                    { name: "Yeni Kullanıcılar", count: 120, description: "Son 7 günde kayıt olanlar" },
                    { name: "Mağaza Sahipleri", count: 85, description: "Onaylı mağaza sahipleri" },
                    { name: "Premium Üyeler", count: 200, description: "Premium abonelik sahibi kullanıcılar" },
                  ].map((segment, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-accent/50 rounded-lg hover-elevate cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Target className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{segment.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {segment.description}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{segment.count} kullanıcı</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Yeni Bildirim Gönder</DialogTitle>
            <DialogDescription>
              Hedef kitlenize toplu bildirim gönderin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Başlık</Label>
              <Input
                id="title"
                placeholder="Bildirim başlığı"
                value={notificationForm.title}
                onChange={(e) =>
                  setNotificationForm({ ...notificationForm, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">İçerik</Label>
              <Textarea
                id="content"
                placeholder="Bildirim içeriği..."
                rows={4}
                value={notificationForm.content}
                onChange={(e) =>
                  setNotificationForm({ ...notificationForm, content: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Hedef Kitle</Label>
              <Select
                value={notificationForm.targetAudience}
                onValueChange={(value) =>
                  setNotificationForm({ ...notificationForm, targetAudience: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                  <SelectItem value="sellers">Satıcılar</SelectItem>
                  <SelectItem value="buyers">Alıcılar</SelectItem>
                  <SelectItem value="stores">Mağaza Sahipleri</SelectItem>
                  <SelectItem value="new">Yeni Kullanıcılar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label>Gönderim Kanalları</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    <span>Push Bildirimi</span>
                  </div>
                  <Switch
                    checked={notificationForm.sendPush}
                    onCheckedChange={(checked) =>
                      setNotificationForm({ ...notificationForm, sendPush: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                  <Switch
                    checked={notificationForm.sendEmail}
                    onCheckedChange={(checked) =>
                      setNotificationForm({ ...notificationForm, sendEmail: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span>SMS</span>
                  </div>
                  <Switch
                    checked={notificationForm.sendSms}
                    onCheckedChange={(checked) =>
                      setNotificationForm({ ...notificationForm, sendSms: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSendNotification}>
              <Send className="h-4 w-4 mr-2" />
              Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
