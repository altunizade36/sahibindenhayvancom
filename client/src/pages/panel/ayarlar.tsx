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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import type { Location as LocationType } from "@shared/schema";

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

const roleLabels: Record<string, string> = {
  seller: "Satıcı",
  buyer: "Alıcı",
  vet: "Veteriner",
  transporter: "Nakliyeci",
  admin: "Yönetici",
};

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

export default function PanelAyarlar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"profile" | "password" | "security">(
    "profile"
  );

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

  const { data: provinces = [] } = useQuery<LocationType[]>({
    queryKey: ["/api/locations?type=il"],
  });

  const { data: districts = [] } = useQuery<LocationType[]>({
    queryKey: ["/api/locations", { parent: selectedProvince, type: "ilce" }],
    enabled: !!selectedProvince,
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
                Profil bilgilerinizi ve güvenlik ayarlarınızı yönetin
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Settings Navigation */}
              <div className="lg:w-64 flex-shrink-0">
                <Card className="sticky top-4">
                  <CardContent className="p-2">
                    <nav className="space-y-1">
                      <Button
                        variant={activeSection === "profile" ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveSection("profile")}
                        data-testid="button-tab-profile"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profil Bilgileri
                      </Button>
                      <Button
                        variant={activeSection === "password" ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveSection("password")}
                        data-testid="button-tab-password"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Şifre Değiştir
                      </Button>
                      <Button
                        variant={activeSection === "security" ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveSection("security")}
                        data-testid="button-tab-security"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Güvenlik
                      </Button>
                    </nav>
                  </CardContent>
                </Card>
              </div>

              {/* Settings Content */}
              <div className="flex-1 min-w-0">
                {activeSection === "profile" && (
                  <Card>
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
                                    >
                                      <FormControl>
                                        <SelectTrigger data-testid="select-city">
                                          <SelectValue placeholder="İl seçiniz" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {provinces.map((province) => (
                                          <SelectItem
                                            key={province.id}
                                            value={province.id}
                                          >
                                            {province.name}
                                          </SelectItem>
                                        ))}
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
                                      disabled={!selectedProvince}
                                    >
                                      <FormControl>
                                        <SelectTrigger data-testid="select-district">
                                          <SelectValue placeholder="İlçe seçiniz" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {districts.map((district) => (
                                          <SelectItem
                                            key={district.id}
                                            value={district.id}
                                          >
                                            {district.name}
                                          </SelectItem>
                                        ))}
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

                {activeSection === "password" && (
                  <Card>
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

                {activeSection === "security" && (
                  <Card data-testid="card-security">
                    <CardHeader>
                      <CardTitle>Güvenlik Durumu</CardTitle>
                      <CardDescription>
                        Hesabınızın güvenlik durumunu kontrol edin
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
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
                      </div>

                      <Separator />

                      <div data-testid="account-type-section">
                        <h4 className="font-medium mb-2">Hesap Türü</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" data-testid="badge-user-role">
                            {roleLabels[user.role] || user.role}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            hesabı olarak kayıtlısınız
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
