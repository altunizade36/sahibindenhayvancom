import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Package,
  Heart,
  MessageSquare,
  Settings,
  Store,
  Plus,
  ArrowLeft,
  Camera,
  Loader2,
  User,
  Lock,
  MapPin,
  Bell,
  Shield,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  Tablet,
  Trash2,
  Download,
  Clock,
  Globe,
  ListChecks,
  AlertTriangle,
  X,
} from "lucide-react";
import type { Location as LocationType } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

const profileFormSchema = z.object({
  firstName: z
    .string()
    .min(2, "Ad en az 2 karakter olmalıdır")
    .max(50, "Ad en fazla 50 karakter olabilir"),
  lastName: z
    .string()
    .min(2, "Soyad en az 2 karakter olmalıdır")
    .max(50, "Soyad en fazla 50 karakter olabilir"),
  phone: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  bio: z.string().max(500, "Biyografi en fazla 500 karakter olabilir").optional(),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifre gereklidir"),
    newPassword: z.string().min(8, "Yeni şifre en az 8 karakter olmalıdır"),
    confirmPassword: z.string().min(1, "Şifre tekrarı gereklidir"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

type ProfileFormData = z.infer<typeof profileFormSchema>;
type PasswordFormData = z.infer<typeof passwordFormSchema>;

interface UserSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notifyMessages: boolean;
  notifyFavorites: boolean;
  notifyPriceDrops: boolean;
  notifyListingUpdates: boolean;
  notifyPromotions: boolean;
  notifyNewsletter: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  showOnlineStatus: boolean;
  allowMessages: boolean;
  profileVisibility: string;
  defaultCity: string | null;
  defaultDistrict: string | null;
  defaultCategoryId: string | null;
  autoRenewListings: boolean;
  theme: string;
  language: string;
  currency: string;
}

interface UserDevice {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  location: string | null;
  lastActive: string;
  isTrusted: boolean;
  createdAt: string;
}

interface LoginHistoryEntry {
  id: string;
  loginMethod: string;
  ipAddress: string | null;
  userAgent: string | null;
  location: string | null;
  success: boolean;
  failureReason: string | null;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  seller: "Satıcı",
  buyer: "Alıcı",
  vet: "Veteriner",
  transporter: "Nakliyeci",
  admin: "Yönetici",
};

type ActiveSection = 
  | "profile" 
  | "password" 
  | "security" 
  | "notifications" 
  | "privacy" 
  | "defaults" 
  | "account";

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  count?: number;
  active?: boolean;
}

function SidebarLink({ href, icon: Icon, label, count, active }: SidebarLinkProps) {
  return (
    <Link href={href}>
      <div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
          active
            ? "bg-primary text-primary-foreground"
            : "hover-elevate text-muted-foreground hover:text-foreground"
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="flex-1 font-medium">{label}</span>
        {count !== undefined && count > 0 && (
          <Badge variant={active ? "secondary" : "outline"} className="text-xs">
            {count}
          </Badge>
        )}
      </div>
    </Link>
  );
}

function SettingsNav({ activeSection, onSectionChange }: { activeSection: ActiveSection; onSectionChange: (s: ActiveSection) => void }) {
  const sections = [
    { id: "profile" as const, icon: User, label: "Profil Bilgileri" },
    { id: "password" as const, icon: Lock, label: "Şifre Değiştir" },
    { id: "security" as const, icon: Shield, label: "Güvenlik" },
    { id: "notifications" as const, icon: Bell, label: "Bildirimler" },
    { id: "privacy" as const, icon: EyeOff, label: "Gizlilik" },
    { id: "defaults" as const, icon: ListChecks, label: "İlan Varsayılanları" },
    { id: "account" as const, icon: AlertTriangle, label: "Hesap Yönetimi" },
  ];

  return (
    <nav className="space-y-1">
      {sections.map((section) => (
        <Button
          key={section.id}
          variant={activeSection === section.id ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onSectionChange(section.id)}
          data-testid={`button-tab-${section.id}`}
        >
          <section.icon className="w-4 h-4 mr-2" />
          {section.label}
        </Button>
      ))}
    </nav>
  );
}

function getDeviceIcon(deviceType: string | null) {
  switch (deviceType?.toLowerCase()) {
    case "mobile":
    case "phone":
      return <Smartphone className="w-5 h-5" />;
    case "tablet":
      return <Tablet className="w-5 h-5" />;
    default:
      return <Monitor className="w-5 h-5" />;
  }
}

export default function PanelAyarlar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDefaultProvince, setSelectedDefaultProvince] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>("profile");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      city: "",
      district: "",
      bio: "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { data: myListingsData } = useQuery<{ data: any[]; total: number }>({
    queryKey: ["/api/listings", { sellerId: user?.id }],
    enabled: !!user,
  });

  const myListings = myListingsData?.data || [];

  const { data: favorites = [] } = useQuery<any[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ["/api/messages/conversations"],
    enabled: !!user,
  });

  const { data: notificationCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/count"],
    enabled: !!user,
  });

  const { data: myStore } = useQuery<any>({
    queryKey: ["/api/store/my/dashboard"],
    enabled: !!user,
  });

  const { data: provinces = [], isLoading: provincesLoading } = useQuery<LocationType[]>({
    queryKey: ["/api/locations", { type: "il" }],
  });

  const { data: districts = [], isLoading: districtsLoading } = useQuery<LocationType[]>({
    queryKey: ["/api/locations", { parent: selectedProvince, type: "ilce" }],
    enabled: !!selectedProvince,
  });

  const { data: defaultDistricts = [] } = useQuery<LocationType[]>({
    queryKey: ["/api/locations", { parent: selectedDefaultProvince, type: "ilce" }],
    enabled: !!selectedDefaultProvince,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
    enabled: !!user,
  });

  const { data: devices = [], isLoading: devicesLoading } = useQuery<UserDevice[]>({
    queryKey: ["/api/settings/devices"],
    enabled: !!user && activeSection === "security",
  });

  const { data: loginHistory = [], isLoading: historyLoading } = useQuery<LoginHistoryEntry[]>({
    queryKey: ["/api/settings/login-history"],
    enabled: !!user && activeSection === "security",
  });

  const { data: allCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const hasStore = !!myStore && !("message" in myStore);
  const unreadMessages = conversations.filter((c: any) => c.unreadCount > 0).length;

  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        city: user.city || "",
        district: user.district || "",
        bio: user.bio || "",
      });
      setProfileImage(user.profileImageUrl || null);
    }
  }, [user, profileForm]);

  useEffect(() => {
    if (user?.city && provinces.length > 0) {
      const province = provinces.find((p) => p.name === user.city);
      if (province && selectedProvince !== province.id) {
        setSelectedProvince(province.id);
      }
    }
  }, [user?.city, provinces, selectedProvince]);

  useEffect(() => {
    if (settings?.defaultCity && provinces.length > 0) {
      const province = provinces.find((p) => p.name === settings.defaultCity);
      if (province && selectedDefaultProvince !== province.id) {
        setSelectedDefaultProvince(province.id);
      }
    }
  }, [settings?.defaultCity, provinces, selectedDefaultProvince]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return await apiRequest("PATCH", "/api/auth/profile", {
        ...data,
        profileImageUrl: profileImage,
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "Profiliniz güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Profil güncellenemedi",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      return await apiRequest("POST", "/api/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "Şifreniz güncellendi.",
      });
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Şifre değiştirilemedi",
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      return await apiRequest("PATCH", "/api/settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Kaydedildi",
        description: "Ayarlarınız güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Ayarlar kaydedilemedi",
        variant: "destructive",
      });
    },
  });

  const removeDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      return await apiRequest("DELETE", `/api/settings/devices/${deviceId}`);
    },
    onSuccess: () => {
      toast({
        title: "Cihaz kaldırıldı",
        description: "Cihaz oturumu sonlandırıldı.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/devices"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Cihaz kaldırılamadı",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/settings/delete-account", {
        confirmation: deleteConfirmation,
        password: deletePassword,
      });
    },
    onSuccess: () => {
      toast({
        title: "Hesap silindi",
        description: "Hesabınız başarıyla silindi.",
      });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Hesap silinemedi",
        variant: "destructive",
      });
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/settings/export-data", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Veri dışa aktarılamadı");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kullanici-verileri-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Verileriniz indirildi",
        description: "Tüm verileriniz JSON dosyası olarak indirildi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Veriler indirilemedi",
        variant: "destructive",
      });
    },
  });

  const optimizeImage = useCallback((file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        const MAX_SIZE = 400;
        let { width, height } = img;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          reject(new Error("Canvas context error"));
          return;
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Blob oluşturulamadı"));
            }
          },
          "image/jpeg",
          0.85
        );
      };

      img.onerror = () => reject(new Error("Fotoğraf yüklenemedi"));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Hata",
          description: "Lütfen bir resim dosyası seçin",
          variant: "destructive",
        });
        return;
      }

      setUploadingImage(true);

      try {
        const optimizedFile = await optimizeImage(file);

        const formData = new FormData();
        formData.append("file", optimizedFile, file.name.replace(/\.[^/.]+$/, ".jpg"));

        const uploadResponse = await fetch("/api/objects/upload-file", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (uploadResponse.ok) {
          const { normalizedPath } = await uploadResponse.json();
          setProfileImage(normalizedPath);
          toast({
            title: "Başarılı",
            description: "Profil fotoğrafı yüklendi",
          });
        } else {
          throw new Error("Upload failed");
        }
      } catch {
        toast({
          title: "Hata",
          description: "Fotoğraf yüklenirken bir hata oluştu",
          variant: "destructive",
        });
      } finally {
        setUploadingImage(false);
      }
    },
    [toast, optimizeImage]
  );

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r bg-card min-h-screen sticky top-0">
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback>
                  {user.firstName?.[0] || user.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.email?.split("@")[0]}
                </p>
                <Badge variant="secondary" className="text-xs mt-0.5">
                  {roleLabels[user.role] || user.role}
                </Badge>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            <SidebarLink
              href="/panel"
              icon={LayoutDashboard}
              label="Kontrol Paneli"
              active={location === "/panel"}
            />
            <SidebarLink
              href="/panel/ilanlarim"
              icon={Package}
              label="İlanlarım"
              count={myListings.length}
              active={location === "/panel/ilanlarim"}
            />
            <SidebarLink
              href="/panel/favorilerim"
              icon={Heart}
              label="Favorilerim"
              count={favorites.length}
              active={location === "/panel/favorilerim"}
            />
            <SidebarLink
              href="/mesajlar"
              icon={MessageSquare}
              label="Mesajlar"
              count={unreadMessages}
              active={location === "/mesajlar"}
            />
            <SidebarLink
              href="/bildirimler"
              icon={Bell}
              label="Bildirimler"
              count={notificationCount.count}
              active={location === "/bildirimler"}
            />

            <div className="pt-4 mt-4 border-t">
              <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase">
                Hesap
              </p>
              <SidebarLink
                href="/panel/ayarlar"
                icon={Settings}
                label="Ayarlar"
                active={location === "/panel/ayarlar"}
              />
              {hasStore && (
                <SidebarLink
                  href="/magazam"
                  icon={Store}
                  label="Mağazam"
                  active={location === "/magazam"}
                />
              )}
            </div>
          </nav>

          <div className="p-4 border-t">
            <Link href="/ilan-ver">
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Yeni İlan Ver
              </Button>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Mobile Header */}
          <div className="lg:hidden border-b bg-card p-4">
            <div className="flex items-center gap-3">
              <Link href="/panel">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-lg font-semibold flex-1">Ayarlar</h1>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-bold">Hesap Ayarları</h1>
              <p className="text-muted-foreground">
                Profil bilgilerinizi, güvenlik ve bildirim ayarlarınızı yönetin
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Settings Navigation */}
              <div className="lg:w-64 flex-shrink-0">
                <Card className="sticky top-4">
                  <CardContent className="p-2">
                    <SettingsNav 
                      activeSection={activeSection} 
                      onSectionChange={setActiveSection} 
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Settings Content */}
              <div className="flex-1 min-w-0">
                {/* Profile Section */}
                {activeSection === "profile" && (
                  <Card data-testid="section-profile">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="w-20 h-20">
                            <AvatarImage src={profileImage || undefined} />
                            <AvatarFallback className="text-2xl">
                              {user.firstName?.[0] || user.email?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                              data-testid="input-profile-image"
                            />
                            {uploadingImage ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Camera className="w-4 h-4" />
                            )}
                          </label>
                        </div>
                        <div>
                          <CardTitle>Profil Bilgileri</CardTitle>
                          <CardDescription>
                            Ad, soyad ve iletişim bilgilerinizi güncelleyin
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Form {...profileForm}>
                        <form
                          onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                          className="space-y-6"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={profileForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Ad *</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Adınız"
                                      data-testid="input-first-name"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Soyad *</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Soyadınız"
                                      data-testid="input-last-name"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefon</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="0555 123 4567"
                                    data-testid="input-phone"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <MapPin className="w-4 h-4" />
                              Konum
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={profileForm.control}
                                name="city"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>İl</FormLabel>
                                    <Select
                                      onValueChange={(value) => {
                                        const province = provinces.find(
                                          (p) => p.id === value
                                        );
                                        setSelectedProvince(value);
                                        field.onChange(province?.name || "");
                                        profileForm.setValue("district", "");
                                      }}
                                      value={selectedProvince}
                                      disabled={provincesLoading}
                                    >
                                      <FormControl>
                                        <SelectTrigger data-testid="select-city">
                                          <SelectValue placeholder={provincesLoading ? "Yükleniyor..." : "İl seçiniz"} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {provinces.length === 0 && !provincesLoading ? (
                                          <div className="py-2 px-3 text-sm text-muted-foreground">
                                            İl bulunamadı
                                          </div>
                                        ) : (
                                          provinces.map((province) => (
                                            <SelectItem
                                              key={province.id}
                                              value={province.id}
                                            >
                                              {province.name}
                                            </SelectItem>
                                          ))
                                        )}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={profileForm.control}
                                name="district"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>İlçe</FormLabel>
                                    <Select
                                      onValueChange={(value) => {
                                        const district = districts.find(
                                          (d) => d.id === value
                                        );
                                        field.onChange(district?.name || "");
                                      }}
                                      value={
                                        districts.find((d) => d.name === field.value)
                                          ?.id || ""
                                      }
                                      disabled={!selectedProvince || districtsLoading}
                                    >
                                      <FormControl>
                                        <SelectTrigger data-testid="select-district">
                                          <SelectValue placeholder={districtsLoading ? "Yükleniyor..." : "İlçe seçiniz"} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {districts.length === 0 && selectedProvince && !districtsLoading ? (
                                          <div className="py-2 px-3 text-sm text-muted-foreground">
                                            İlçe bulunamadı
                                          </div>
                                        ) : (
                                          districts.map((district) => (
                                            <SelectItem
                                              key={district.id}
                                              value={district.id}
                                            >
                                              {district.name}
                                            </SelectItem>
                                          ))
                                        )}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <FormField
                            control={profileForm.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hakkınızda</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    placeholder="Kendinizi kısaca tanıtın..."
                                    rows={4}
                                    data-testid="textarea-bio"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="submit"
                            disabled={updateProfileMutation.isPending}
                            data-testid="button-save-profile"
                          >
                            {updateProfileMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Kaydediliyor...
                              </>
                            ) : (
                              "Değişiklikleri Kaydet"
                            )}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                )}

                {/* Password Section */}
                {activeSection === "password" && (
                  <Card data-testid="section-password">
                    <CardHeader>
                      <CardTitle>Şifre Değiştir</CardTitle>
                      <CardDescription>
                        Hesap güvenliğiniz için şifrenizi düzenli olarak güncelleyin
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...passwordForm}>
                        <form
                          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                          className="space-y-6"
                        >
                          <FormField
                            control={passwordForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mevcut Şifre *</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="password"
                                    placeholder="Mevcut şifrenizi girin"
                                    data-testid="input-current-password"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Yeni Şifre *</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="password"
                                    placeholder="En az 8 karakter"
                                    data-testid="input-new-password"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Yeni Şifre Tekrar *</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="password"
                                    placeholder="Yeni şifrenizi tekrar girin"
                                    data-testid="input-confirm-password"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="submit"
                            disabled={changePasswordMutation.isPending}
                            data-testid="button-change-password"
                          >
                            {changePasswordMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Değiştiriliyor...
                              </>
                            ) : (
                              "Şifreyi Değiştir"
                            )}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                )}

                {/* Security Section */}
                {activeSection === "security" && (
                  <div className="space-y-6" data-testid="section-security">
                    <Card>
                      <CardHeader>
                        <CardTitle>Güvenlik Durumu</CardTitle>
                        <CardDescription>
                          Hesabınızın güvenlik durumunu kontrol edin
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg border" data-testid="security-email-row">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-muted">
                              <Mail className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium">E-posta Doğrulama</p>
                              <p className="text-sm text-muted-foreground" data-testid="text-user-email">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          {user.emailVerified ? (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-600"
                              data-testid="badge-email-verified"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Doğrulandı
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-orange-600 border-orange-600"
                              data-testid="badge-email-pending"
                            >
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Bekliyor
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg border" data-testid="security-phone-row">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-muted">
                              <Phone className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium">Telefon</p>
                              <p className="text-sm text-muted-foreground" data-testid="text-user-phone">
                                {user.phone || "Henüz eklenmedi"}
                              </p>
                            </div>
                          </div>
                          {user.phone ? (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-600"
                              data-testid="badge-phone-registered"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Kayıtlı
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveSection("profile")}
                              data-testid="button-add-phone"
                            >
                              Ekle
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg border" data-testid="security-password-row">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-muted">
                              <Lock className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium">Şifre</p>
                              <p className="text-sm text-muted-foreground">
                                Güçlü bir şifre kullanın
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveSection("password")}
                            data-testid="button-change-password-link"
                          >
                            Değiştir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Devices Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Smartphone className="w-5 h-5" />
                          Bağlı Cihazlar
                        </CardTitle>
                        <CardDescription>
                          Hesabınıza bağlı cihazları yönetin
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {devicesLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                          </div>
                        ) : devices.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Henüz kayıtlı cihaz yok
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {devices.map((device) => (
                              <div
                                key={device.id}
                                className="flex items-center justify-between p-3 rounded-lg border"
                                data-testid={`device-row-${device.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-full bg-muted">
                                    {getDeviceIcon(device.deviceType)}
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {device.deviceName || device.browser || "Bilinmeyen Cihaz"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {device.os} {device.location && `- ${device.location}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Son aktif: {formatDistanceToNow(new Date(device.lastActive), { addSuffix: true, locale: tr })}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeDeviceMutation.mutate(device.id)}
                                  disabled={removeDeviceMutation.isPending}
                                  data-testid={`button-remove-device-${device.id}`}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Login History Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Giriş Geçmişi
                        </CardTitle>
                        <CardDescription>
                          Son 50 giriş işleminizi görüntüleyin
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {historyLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                          </div>
                        ) : loginHistory.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Giriş geçmişi bulunamadı
                          </p>
                        ) : (
                          <ScrollArea className="h-[300px]">
                            <div className="space-y-2">
                              {loginHistory.map((entry) => (
                                <div
                                  key={entry.id}
                                  className={`flex items-center justify-between p-3 rounded-lg border ${
                                    !entry.success ? "border-destructive/50 bg-destructive/5" : ""
                                  }`}
                                  data-testid={`login-history-${entry.id}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${entry.success ? "bg-green-100" : "bg-red-100"}`}>
                                      {entry.success ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">
                                        {entry.loginMethod === "email" ? "E-posta" : 
                                         entry.loginMethod === "phone" ? "Telefon" : 
                                         entry.loginMethod === "oauth" ? "OAuth" : entry.loginMethod}
                                        {!entry.success && entry.failureReason && (
                                          <span className="text-destructive ml-2">
                                            ({entry.failureReason})
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {entry.ipAddress} {entry.location && `- ${entry.location}`}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true, locale: tr })}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Notifications Section */}
                {activeSection === "notifications" && (
                  <Card data-testid="section-notifications">
                    <CardHeader>
                      <CardTitle>Bildirim Tercihleri</CardTitle>
                      <CardDescription>
                        Hangi bildirimleri almak istediğinizi seçin
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {settingsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : (
                        <>
                          {/* Channels */}
                          <div className="space-y-4">
                            <h4 className="font-medium">Bildirim Kanalları</h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                  <Mail className="w-5 h-5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">E-posta Bildirimleri</p>
                                    <p className="text-sm text-muted-foreground">
                                      Önemli güncellemeleri e-posta ile alın
                                    </p>
                                  </div>
                                </div>
                                <Switch
                                  checked={settings?.emailNotifications ?? true}
                                  onCheckedChange={(v) => handleSettingChange("emailNotifications", v)}
                                  data-testid="switch-email-notifications"
                                />
                              </div>

                              <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                  <Phone className="w-5 h-5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">SMS Bildirimleri</p>
                                    <p className="text-sm text-muted-foreground">
                                      Kritik bildirimleri SMS ile alın
                                    </p>
                                  </div>
                                </div>
                                <Switch
                                  checked={settings?.smsNotifications ?? true}
                                  onCheckedChange={(v) => handleSettingChange("smsNotifications", v)}
                                  data-testid="switch-sms-notifications"
                                />
                              </div>

                              <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                  <Bell className="w-5 h-5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">Anlık Bildirimler</p>
                                    <p className="text-sm text-muted-foreground">
                                      Tarayıcı bildirimleri alın
                                    </p>
                                  </div>
                                </div>
                                <Switch
                                  checked={settings?.pushNotifications ?? true}
                                  onCheckedChange={(v) => handleSettingChange("pushNotifications", v)}
                                  data-testid="switch-push-notifications"
                                />
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {/* Topics */}
                          <div className="space-y-4">
                            <h4 className="font-medium">Bildirim Konuları</h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div>
                                  <p className="font-medium">Mesajlar</p>
                                  <p className="text-sm text-muted-foreground">
                                    Yeni mesaj bildirimleri
                                  </p>
                                </div>
                                <Switch
                                  checked={settings?.notifyMessages ?? true}
                                  onCheckedChange={(v) => handleSettingChange("notifyMessages", v)}
                                  data-testid="switch-notify-messages"
                                />
                              </div>

                              <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div>
                                  <p className="font-medium">Favori Güncellemeleri</p>
                                  <p className="text-sm text-muted-foreground">
                                    Favori ilanlarınızdaki değişiklikler
                                  </p>
                                </div>
                                <Switch
                                  checked={settings?.notifyFavorites ?? true}
                                  onCheckedChange={(v) => handleSettingChange("notifyFavorites", v)}
                                  data-testid="switch-notify-favorites"
                                />
                              </div>

                              <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div>
                                  <p className="font-medium">Fiyat Düşüşleri</p>
                                  <p className="text-sm text-muted-foreground">
                                    Takip ettiğiniz ilanlarda fiyat düşüşleri
                                  </p>
                                </div>
                                <Switch
                                  checked={settings?.notifyPriceDrops ?? true}
                                  onCheckedChange={(v) => handleSettingChange("notifyPriceDrops", v)}
                                  data-testid="switch-notify-price-drops"
                                />
                              </div>

                              <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div>
                                  <p className="font-medium">İlan Güncellemeleri</p>
                                  <p className="text-sm text-muted-foreground">
                                    İlanlarınız hakkında güncellemeler
                                  </p>
                                </div>
                                <Switch
                                  checked={settings?.notifyListingUpdates ?? true}
                                  onCheckedChange={(v) => handleSettingChange("notifyListingUpdates", v)}
                                  data-testid="switch-notify-listing-updates"
                                />
                              </div>

                              <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div>
                                  <p className="font-medium">Promosyonlar</p>
                                  <p className="text-sm text-muted-foreground">
                                    Kampanya ve fırsat bildirimleri
                                  </p>
                                </div>
                                <Switch
                                  checked={settings?.notifyPromotions ?? false}
                                  onCheckedChange={(v) => handleSettingChange("notifyPromotions", v)}
                                  data-testid="switch-notify-promotions"
                                />
                              </div>

                              <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div>
                                  <p className="font-medium">Bülten</p>
                                  <p className="text-sm text-muted-foreground">
                                    Haftalık haber bülteni
                                  </p>
                                </div>
                                <Switch
                                  checked={settings?.notifyNewsletter ?? false}
                                  onCheckedChange={(v) => handleSettingChange("notifyNewsletter", v)}
                                  data-testid="switch-notify-newsletter"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Privacy Section */}
                {activeSection === "privacy" && (
                  <Card data-testid="section-privacy">
                    <CardHeader>
                      <CardTitle>Gizlilik Ayarları</CardTitle>
                      <CardDescription>
                        Profilinizin görünürlüğünü ve iletişim tercihlerinizi yönetin
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {settingsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : (
                        <>
                          {/* Profile Visibility */}
                          <div className="space-y-4">
                            <h4 className="font-medium">Profil Görünürlüğü</h4>
                            <div className="p-4 rounded-lg border space-y-3">
                              <div className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-muted-foreground" />
                                <span className="font-medium">Profil Durumu</span>
                              </div>
                              <Select
                                value={settings?.profileVisibility ?? "public"}
                                onValueChange={(v) => handleSettingChange("profileVisibility", v)}
                              >
                                <SelectTrigger data-testid="select-profile-visibility">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="public">Herkese Açık</SelectItem>
                                  <SelectItem value="members">Sadece Üyeler</SelectItem>
                                  <SelectItem value="private">Gizli</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <Separator />

                          {/* Contact Info Visibility */}
                          <div className="space-y-4">
                            <h4 className="font-medium">İletişim Bilgileri</h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                  <Mail className="w-5 h-5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">E-posta Göster</p>
                                    <p className="text-sm text-muted-foreground">
                                      E-posta adresinizi diğer kullanıcılara göster
                                    </p>
                                  </div>
                                </div>
                                <Switch
                                  checked={settings?.showEmail ?? false}
                                  onCheckedChange={(v) => handleSettingChange("showEmail", v)}
                                  data-testid="switch-show-email"
                                />
                              </div>

                              <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                  <Phone className="w-5 h-5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">Telefon Göster</p>
                                    <p className="text-sm text-muted-foreground">
                                      Telefon numaranızı diğer kullanıcılara göster
                                    </p>
                                  </div>
                                </div>
                                <Switch
                                  checked={settings?.showPhone ?? true}
                                  onCheckedChange={(v) => handleSettingChange("showPhone", v)}
                                  data-testid="switch-show-phone"
                                />
                              </div>

                              <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                  <MapPin className="w-5 h-5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">Konum Göster</p>
                                    <p className="text-sm text-muted-foreground">
                                      Şehir bilginizi diğer kullanıcılara göster
                                    </p>
                                  </div>
                                </div>
                                <Switch
                                  checked={settings?.showLocation ?? true}
                                  onCheckedChange={(v) => handleSettingChange("showLocation", v)}
                                  data-testid="switch-show-location"
                                />
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {/* Other Privacy Settings */}
                          <div className="space-y-4">
                            <h4 className="font-medium">Diğer</h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                  <Eye className="w-5 h-5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">Çevrimiçi Durumu</p>
                                    <p className="text-sm text-muted-foreground">
                                      Çevrimiçi olduğunuzda göster
                                    </p>
                                  </div>
                                </div>
                                <Switch
                                  checked={settings?.showOnlineStatus ?? true}
                                  onCheckedChange={(v) => handleSettingChange("showOnlineStatus", v)}
                                  data-testid="switch-show-online-status"
                                />
                              </div>

                              <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">Mesaj Almaya İzin Ver</p>
                                    <p className="text-sm text-muted-foreground">
                                      Diğer kullanıcıların size mesaj göndermesine izin ver
                                    </p>
                                  </div>
                                </div>
                                <Switch
                                  checked={settings?.allowMessages ?? true}
                                  onCheckedChange={(v) => handleSettingChange("allowMessages", v)}
                                  data-testid="switch-allow-messages"
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Listing Defaults Section */}
                {activeSection === "defaults" && (
                  <Card data-testid="section-defaults">
                    <CardHeader>
                      <CardTitle>İlan Varsayılanları</CardTitle>
                      <CardDescription>
                        Yeni ilan oluştururken kullanılacak varsayılan değerleri belirleyin
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {settingsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : (
                        <>
                          <div className="space-y-4">
                            <h4 className="font-medium">Varsayılan Konum</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block">İl</label>
                                <Select
                                  value={selectedDefaultProvince || ""}
                                  onValueChange={(value) => {
                                    const province = provinces.find((p) => p.id === value);
                                    setSelectedDefaultProvince(value);
                                    handleSettingChange("defaultCity", province?.name || null);
                                    handleSettingChange("defaultDistrict", null);
                                  }}
                                  disabled={provincesLoading}
                                >
                                  <SelectTrigger data-testid="select-default-city">
                                    <SelectValue placeholder={provincesLoading ? "Yükleniyor..." : "İl seçiniz"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">Seçilmedi</SelectItem>
                                    {provinces.map((province) => (
                                      <SelectItem key={province.id} value={province.id}>
                                        {province.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-2 block">İlçe</label>
                                <Select
                                  value={defaultDistricts.find((d) => d.name === settings?.defaultDistrict)?.id || ""}
                                  onValueChange={(value) => {
                                    const district = defaultDistricts.find((d) => d.id === value);
                                    handleSettingChange("defaultDistrict", district?.name || null);
                                  }}
                                  disabled={!selectedDefaultProvince}
                                >
                                  <SelectTrigger data-testid="select-default-district">
                                    <SelectValue placeholder="İlçe seçiniz" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">Seçilmedi</SelectItem>
                                    {defaultDistricts.map((district) => (
                                      <SelectItem key={district.id} value={district.id}>
                                        {district.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-4">
                            <h4 className="font-medium">Otomasyon</h4>
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                              <div>
                                <p className="font-medium">Otomatik Yenileme</p>
                                <p className="text-sm text-muted-foreground">
                                  Süresi dolan ilanları otomatik olarak yenile
                                </p>
                              </div>
                              <Switch
                                checked={settings?.autoRenewListings ?? false}
                                onCheckedChange={(v) => handleSettingChange("autoRenewListings", v)}
                                data-testid="switch-auto-renew"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Account Management Section */}
                {activeSection === "account" && (
                  <div className="space-y-6" data-testid="section-account">
                    <Card>
                      <CardHeader>
                        <CardTitle>Hesap Türü</CardTitle>
                        <CardDescription>
                          Mevcut hesap bilgileriniz
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3 p-4 rounded-lg border">
                          <div className="p-3 rounded-full bg-primary/10">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">
                                {roleLabels[user.role] || user.role}
                              </Badge>
                              {user.emailVerified && (
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Doğrulanmış
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Verilerinizi İndirin</CardTitle>
                        <CardDescription>
                          Tüm kişisel verilerinizin bir kopyasını indirin
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="outline"
                          onClick={() => exportDataMutation.mutate()}
                          disabled={exportDataMutation.isPending}
                          data-testid="button-export-data"
                        >
                          {exportDataMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Hazırlanıyor...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Verilerimi İndir
                            </>
                          )}
                        </Button>
                        <p className="text-sm text-muted-foreground mt-2">
                          Profil bilgileriniz, ilanlarınız, mesajlarınız ve favori listeleriniz JSON formatında indirilecektir.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-destructive/50">
                      <CardHeader>
                        <CardTitle className="text-destructive">Hesabı Sil</CardTitle>
                        <CardDescription>
                          Hesabınızı kalıcı olarak silin. Bu işlem geri alınamaz.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" data-testid="button-delete-account">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hesabımı Sil
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hesabınızı silmek istediğinizden emin misiniz?</AlertDialogTitle>
                              <AlertDialogDescription className="space-y-4">
                                <p>
                                  Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz (ilanlar, mesajlar, favoriler) kalıcı olarak silinecektir.
                                </p>
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-sm font-medium">
                                      Onaylamak için "DELETE" yazın
                                    </label>
                                    <Input
                                      value={deleteConfirmation}
                                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                                      placeholder="DELETE"
                                      className="mt-1"
                                      data-testid="input-delete-confirmation"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">
                                      Şifreniz (varsa)
                                    </label>
                                    <Input
                                      type="password"
                                      value={deletePassword}
                                      onChange={(e) => setDeletePassword(e.target.value)}
                                      placeholder="Şifrenizi girin"
                                      className="mt-1"
                                      data-testid="input-delete-password"
                                    />
                                  </div>
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteAccountMutation.mutate()}
                                disabled={deleteConfirmation !== "DELETE" || deleteAccountMutation.isPending}
                                data-testid="button-confirm-delete"
                              >
                                {deleteAccountMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Siliniyor...
                                  </>
                                ) : (
                                  "Evet, Hesabımı Sil"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <p className="text-sm text-muted-foreground mt-3">
                          Hesabınızı silmeden önce verilerinizi indirmenizi öneririz.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
