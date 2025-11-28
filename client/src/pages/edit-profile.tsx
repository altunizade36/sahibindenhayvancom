import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Loader2, User, Lock, MapPin } from "lucide-react";
import type { Location as LocationType } from "@shared/schema";

const profileFormSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır").max(50, "Ad en fazla 50 karakter olabilir"),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır").max(50, "Soyad en fazla 50 karakter olabilir"),
  phone: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  bio: z.string().max(500, "Biyografi en fazla 500 karakter olabilir").optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre gereklidir"),
  newPassword: z.string().min(8, "Yeni şifre en az 8 karakter olmalıdır"),
  confirmPassword: z.string().min(1, "Şifre tekrarı gereklidir"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileFormSchema>;
type PasswordFormData = z.infer<typeof passwordFormSchema>;

export default function EditProfile() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

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

  const { data: provinces = [] } = useQuery<LocationType[]>({
    queryKey: ["/api/locations?type=il"],
  });

  const { data: districts = [] } = useQuery<LocationType[]>({
    queryKey: [`/api/locations?parent=${selectedProvince}&type=ilce`],
    enabled: !!selectedProvince,
  });

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
      
      if (user.city) {
        const province = provinces.find(p => p.name === user.city);
        if (province) {
          setSelectedProvince(province.id);
        }
      }
    }
  }, [user, provinces, profileForm]);

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
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
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
          reject(new Error('Canvas context error'));
          return;
        }
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Blob oluşturulamadı'));
            }
          },
          'image/jpeg',
          0.85
        );
      };
      
      img.onerror = () => reject(new Error('Fotoğraf yüklenemedi'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
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
      formData.append('file', optimizedFile, file.name.replace(/\.[^/.]+$/, '.jpg'));
      
      const uploadResponse = await fetch('/api/objects/upload-file', {
        method: 'POST',
        body: formData,
        credentials: 'include',
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
  }, [toast, optimizeImage]);

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  useEffect(() => {
    if (!user) {
      navigate("/giris");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/profil")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Profile Dön
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileImage || undefined} />
                <AvatarFallback className="text-2xl">
                  {user.firstName?.[0] || user.email?.[0] || 'U'}
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
          </div>
          <CardTitle>Profili Düzenle</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" data-testid="tab-profile-info">
            <User className="w-4 h-4 mr-2" />
            Bilgiler
          </TabsTrigger>
          <TabsTrigger value="password" data-testid="tab-password">
            <Lock className="w-4 h-4 mr-2" />
            Şifre
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kişisel Bilgiler</CardTitle>
              <CardDescription>Ad, soyad, telefon ve konum bilgilerinizi güncelleyin</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Adınız" data-testid="input-first-name" />
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
                            <Input {...field} placeholder="Soyadınız" data-testid="input-last-name" />
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
                          <Input {...field} placeholder="0555 123 4567" data-testid="input-phone" />
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
                                const province = provinces.find(p => p.id === value);
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
                                  <SelectItem key={province.id} value={province.id}>
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
                                const district = districts.find(d => d.id === value);
                                field.onChange(district?.name || "");
                              }}
                              value={districts.find(d => d.name === field.value)?.id || ""}
                              disabled={!selectedProvince}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-district">
                                  <SelectValue placeholder="İlçe seçiniz" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {districts.map((district) => (
                                  <SelectItem key={district.id} value={district.id}>
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
                    className="w-full"
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
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Şifre Değiştir</CardTitle>
              <CardDescription>Hesap güvenliğiniz için şifrenizi düzenli olarak güncelleyin</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
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
                    className="w-full"
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
