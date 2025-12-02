import { useState } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Globe,
  Mail,
  Shield,
  Bell,
  Database,
  Zap,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Server,
  Lock,
  Eye,
  Palette,
} from "lucide-react";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [siteSettings, setSiteSettings] = useState({
    siteName: "SahibindenHayvan",
    siteDescription: "Türkiye'nin en büyük hayvan ilanları platformu",
    contactEmail: "info@sahibindenhayvan.com",
    supportEmail: "destek@sahibindenhayvan.com",
    phone: "+90 212 123 4567",
    address: "İstanbul, Türkiye",
    maintenanceMode: false,
    registrationEnabled: true,
    listingApprovalRequired: true,
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "smtp.resend.com",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "noreply@sahibindenhayvan.com",
    fromName: "SahibindenHayvan",
  });

  const [securitySettings, setSecuritySettings] = useState({
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    sessionTimeout: 30,
    requireEmailVerification: true,
    requirePhoneVerification: false,
    enableTwoFactor: false,
    enableRecaptcha: true,
    recaptchaThreshold: 0.5,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    newListingNotify: true,
    newMessageNotify: true,
    reportNotify: true,
    systemAlerts: true,
  });

  const handleSave = async (section: string) => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({ title: `${section} ayarları kaydedildi` });
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="page-admin-settings">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Sistem Ayarları</h1>
          <p className="text-muted-foreground">
            Platform ayarlarını yapılandırın ve yönetin
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full lg:w-auto">
            <TabsTrigger value="general" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Genel</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Güvenlik</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Bildirimler</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Server className="h-4 w-4" />
              <span className="hidden sm:inline">Sistem</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Genel Ayarlar</CardTitle>
                <CardDescription>Site bilgileri ve temel yapılandırma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Adı</Label>
                    <Input
                      id="siteName"
                      value={siteSettings.siteName}
                      onChange={(e) =>
                        setSiteSettings({ ...siteSettings, siteName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">İletişim Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={siteSettings.contactEmail}
                      onChange={(e) =>
                        setSiteSettings({ ...siteSettings, contactEmail: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Açıklaması</Label>
                  <Textarea
                    id="siteDescription"
                    value={siteSettings.siteDescription}
                    onChange={(e) =>
                      setSiteSettings({ ...siteSettings, siteDescription: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Site Durumu</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Bakım Modu</Label>
                      <p className="text-sm text-muted-foreground">
                        Site geçici olarak bakıma alınır
                      </p>
                    </div>
                    <Switch
                      checked={siteSettings.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setSiteSettings({ ...siteSettings, maintenanceMode: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Kayıt Açık</Label>
                      <p className="text-sm text-muted-foreground">
                        Yeni kullanıcı kayıtlarına izin ver
                      </p>
                    </div>
                    <Switch
                      checked={siteSettings.registrationEnabled}
                      onCheckedChange={(checked) =>
                        setSiteSettings({ ...siteSettings, registrationEnabled: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>İlan Onayı Gerekli</Label>
                      <p className="text-sm text-muted-foreground">
                        İlanlar yayınlanmadan önce onay bekler
                      </p>
                    </div>
                    <Switch
                      checked={siteSettings.listingApprovalRequired}
                      onCheckedChange={(checked) =>
                        setSiteSettings({ ...siteSettings, listingApprovalRequired: checked })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave("Genel")} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Ayarları</CardTitle>
                <CardDescription>SMTP yapılandırması ve email gönderim ayarları</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Sunucu</Label>
                    <Input
                      id="smtpHost"
                      value={emailSettings.smtpHost}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, smtpHost: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">Port</Label>
                    <Input
                      id="smtpPort"
                      value={emailSettings.smtpPort}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, smtpPort: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">Gönderen Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, fromEmail: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromName">Gönderen Adı</Label>
                    <Input
                      id="fromName"
                      value={emailSettings.fromName}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, fromName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-400">
                    Resend API entegrasyonu aktif
                  </span>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave("Email")} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Güvenlik Ayarları</CardTitle>
                <CardDescription>Oturum, kimlik doğrulama ve güvenlik yapılandırması</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Giriş Denemesi</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          maxLoginAttempts: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lockoutDuration">Kilit Süresi (dk)</Label>
                    <Input
                      id="lockoutDuration"
                      type="number"
                      value={securitySettings.lockoutDuration}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          lockoutDuration: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Oturum Süresi (dk)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          sessionTimeout: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Doğrulama Gereksinimleri</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Doğrulama Zorunlu</Label>
                      <p className="text-sm text-muted-foreground">
                        Kullanıcıların email adreslerini doğrulaması gerekir
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.requireEmailVerification}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          requireEmailVerification: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Telefon Doğrulama Zorunlu</Label>
                      <p className="text-sm text-muted-foreground">
                        Kullanıcıların telefon numaralarını doğrulaması gerekir
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.requirePhoneVerification}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          requirePhoneVerification: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>reCAPTCHA Aktif</Label>
                      <p className="text-sm text-muted-foreground">
                        Form gönderimlerinde bot koruması
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings.enableRecaptcha}
                      onCheckedChange={(checked) =>
                        setSecuritySettings({
                          ...securitySettings,
                          enableRecaptcha: checked,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave("Güvenlik")} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Bildirim Ayarları</CardTitle>
                <CardDescription>Email, push ve SMS bildirim yapılandırması</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Bildirim Kanalları</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Bildirimleri</Label>
                      <p className="text-sm text-muted-foreground">
                        Email ile bildirim gönder
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Bildirimleri</Label>
                      <p className="text-sm text-muted-foreground">
                        Tarayıcı bildirimleri gönder
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          pushNotifications: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Bildirimleri</Label>
                      <p className="text-sm text-muted-foreground">
                        SMS ile bildirim gönder
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          smsNotifications: checked,
                        })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Admin Bildirimleri</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Yeni İlan Bildirimi</Label>
                    </div>
                    <Switch
                      checked={notificationSettings.newListingNotify}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          newListingNotify: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Yeni Mesaj Bildirimi</Label>
                    </div>
                    <Switch
                      checked={notificationSettings.newMessageNotify}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          newMessageNotify: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Şikayet Bildirimi</Label>
                    </div>
                    <Switch
                      checked={notificationSettings.reportNotify}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          reportNotify: checked,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => handleSave("Bildirim")} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <div className="grid gap-6">
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
                        <span>Firebase Auth</span>
                      </div>
                      <Badge variant="default" className="bg-green-500">Aktif</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bakım İşlemleri</CardTitle>
                  <CardDescription>Sistem bakım ve optimizasyon işlemleri</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                      <RefreshCw className="h-6 w-6" />
                      <span>Önbelleği Temizle</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                      <Database className="h-6 w-6" />
                      <span>Veritabanı Optimize Et</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
