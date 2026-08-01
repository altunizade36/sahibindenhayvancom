import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Globe,
  Shield,
  Bell,
  Save,
  RefreshCw,
  Loader2,
  Mail,
  Phone,
  Building,
  Lock,
  Timer,
  CheckCircle,
  Server,
  Database,
  Zap,
} from "lucide-react";

interface SettingsData {
  general: Record<string, string>;
  security: Record<string, string>;
  notifications: Record<string, string>;
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [localSettings, setLocalSettings] = useState<SettingsData>({
    general: {},
    security: {},
    notifications: {},
  });

  const { data: settings, isLoading, refetch } = useQuery<SettingsData>({
    queryKey: ["/api/admin/settings"],
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      return apiRequest("PATCH", "/api/admin/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Ayarlar başarıyla kaydedildi" });
      setHasChanges(false);
    },
    onError: () => {
      toast({ title: "Ayarlar kaydedilemedi", variant: "destructive" });
    },
  });

  const updateSetting = (category: keyof SettingsData, key: string, value: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const allSettings = {
      ...localSettings.general,
      ...localSettings.security,
      ...localSettings.notifications,
    };
    saveMutation.mutate(allSettings);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="page-admin-settings">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Sistem Ayarları</h1>
            <p className="text-muted-foreground">
              Platform ayarlarını yapılandırın
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={saveMutation.isPending}
              data-testid="button-refresh-settings"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending}
              data-testid="button-save-settings"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Kaydet
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full lg:w-auto">
            <TabsTrigger value="general" className="gap-2" data-testid="tab-general">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Genel</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2" data-testid="tab-security">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Güvenlik</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2" data-testid="tab-notifications">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Bildirimler</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2" data-testid="tab-system">
              <Server className="h-4 w-4" />
              <span className="hidden sm:inline">Sistem</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Genel Ayarlar</CardTitle>
                <CardDescription>
                  Sitenin temel bilgilerini ve genel ayarlarını yönetin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="site_name" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Site Adı
                    </Label>
                    <Input
                      id="site_name"
                      value={localSettings.general.site_name || ""}
                      onChange={(e) => updateSetting("general", "site_name", e.target.value)}
                      data-testid="input-site-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site_description" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Site Açıklaması
                    </Label>
                    <Input
                      id="site_description"
                      value={localSettings.general.site_description || ""}
                      onChange={(e) => updateSetting("general", "site_description", e.target.value)}
                      data-testid="input-site-description"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      İletişim E-posta
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={localSettings.general.contact_email || ""}
                      onChange={(e) => updateSetting("general", "contact_email", e.target.value)}
                      data-testid="input-contact-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support_email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Destek E-posta
                    </Label>
                    <Input
                      id="support_email"
                      type="email"
                      value={localSettings.general.support_email || ""}
                      onChange={(e) => updateSetting("general", "support_email", e.target.value)}
                      data-testid="input-support-email"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefon
                    </Label>
                    <Input
                      id="phone"
                      value={localSettings.general.phone || ""}
                      onChange={(e) => updateSetting("general", "phone", e.target.value)}
                      data-testid="input-phone"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Site Durumu</h4>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Bakım Modu</Label>
                      <p className="text-sm text-muted-foreground">
                        Siteyi geçici olarak bakım moduna alın
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.general.maintenance_mode === "true"}
                      onCheckedChange={(checked) =>
                        updateSetting("general", "maintenance_mode", checked ? "true" : "false")
                      }
                      data-testid="switch-maintenance-mode"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Kayıt İzni</Label>
                      <p className="text-sm text-muted-foreground">
                        Yeni kullanıcı kayıtlarına izin ver
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.general.registration_enabled === "true"}
                      onCheckedChange={(checked) =>
                        updateSetting("general", "registration_enabled", checked ? "true" : "false")
                      }
                      data-testid="switch-registration-enabled"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>İlan Onayı</Label>
                      <p className="text-sm text-muted-foreground">
                        İlanlar yayınlanmadan önce admin onayı gereksin
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.general.listing_approval_required === "true"}
                      onCheckedChange={(checked) =>
                        updateSetting("general", "listing_approval_required", checked ? "true" : "false")
                      }
                      data-testid="switch-listing-approval"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Güvenlik Ayarları</CardTitle>
                <CardDescription>
                  Hesap güvenliği ve erişim kontrol ayarları
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="max_login_attempts" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Maks. Giriş Denemesi
                    </Label>
                    <Input
                      id="max_login_attempts"
                      type="number"
                      min="1"
                      max="10"
                      value={localSettings.security.max_login_attempts || "5"}
                      onChange={(e) => updateSetting("security", "max_login_attempts", e.target.value)}
                      data-testid="input-max-login-attempts"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lockout_duration" className="flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      Kilitleme Süresi (dk)
                    </Label>
                    <Input
                      id="lockout_duration"
                      type="number"
                      min="1"
                      max="60"
                      value={localSettings.security.lockout_duration || "15"}
                      onChange={(e) => updateSetting("security", "lockout_duration", e.target.value)}
                      data-testid="input-lockout-duration"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session_timeout" className="flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      Oturum Süresi (dk)
                    </Label>
                    <Input
                      id="session_timeout"
                      type="number"
                      min="5"
                      max="120"
                      value={localSettings.security.session_timeout || "30"}
                      onChange={(e) => updateSetting("security", "session_timeout", e.target.value)}
                      data-testid="input-session-timeout"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Güvenlik Özellikleri</h4>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        E-posta Doğrulaması
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Kayıt sonrası e-posta doğrulaması zorunlu olsun
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.security.require_email_verification === "true"}
                      onCheckedChange={(checked) =>
                        updateSetting("security", "require_email_verification", checked ? "true" : "false")
                      }
                      data-testid="switch-email-verification"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Bot Koruması
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Formlarda gizli tuzak alan ve doldurma süresi kontrolü
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.security.enable_bot_protection !== "false"}
                      onCheckedChange={(checked) =>
                        updateSetting("security", "enable_bot_protection", checked ? "true" : "false")
                      }
                      data-testid="switch-bot-protection"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Bildirim Ayarları</CardTitle>
                <CardDescription>
                  Kullanıcı bildirim kanallarını yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        E-posta Bildirimleri
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Önemli olaylar için e-posta gönder
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.notifications.email_notifications === "true"}
                      onCheckedChange={(checked) =>
                        updateSetting("notifications", "email_notifications", checked ? "true" : "false")
                      }
                      data-testid="switch-email-notifications"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Push Bildirimleri
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Tarayıcı push bildirimleri gönder
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.notifications.push_notifications === "true"}
                      onCheckedChange={(checked) =>
                        updateSetting("notifications", "push_notifications", checked ? "true" : "false")
                      }
                      data-testid="switch-push-notifications"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        SMS Bildirimleri
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Kritik olaylar için SMS gönder
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.notifications.sms_notifications === "true"}
                      onCheckedChange={(checked) =>
                        updateSetting("notifications", "sms_notifications", checked ? "true" : "false")
                      }
                      data-testid="switch-sms-notifications"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>Sistem Durumu</CardTitle>
                <CardDescription>Sunucu ve servis durumları</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5" />
                      <span>PostgreSQL Veritabanı</span>
                    </div>
                    <Badge variant="default" className="bg-green-500">Aktif</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5" />
                      <span>Redis Cache</span>
                    </div>
                    <Badge variant="default" className="bg-green-500">Aktif</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5" />
                      <span>Email Servisi (Resend)</span>
                    </div>
                    <Badge variant="default" className="bg-green-500">Aktif</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5" />
                      <span>Oturum Kimlik Doğrulama (Supabase)</span>
                    </div>
                    <Badge variant="default" className="bg-green-500">Aktif</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
