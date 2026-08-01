import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useRoute } from "wouter";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { AuthGate } from "@/components/auth-gate";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X, ImagePlus, Loader2, Trash2, Pause, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { Location, Listing } from "@shared/schema";

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children: CategoryNode[];
}

const listingFormSchema = z.object({
  categoryId: z.string().min(1, "Kategori seçiniz"),
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır").max(100, "Başlık en fazla 100 karakter olabilir"),
  description: z.string().min(20, "Açıklama en az 20 karakter olmalıdır").max(2000, "Açıklama en fazla 2000 karakter olabilir"),
  price: z.string().min(1, "Fiyat giriniz").refine(
    (val) => {
      const numVal = parseFloat(val.replace(/\./g, '').replace(/,/g, '.'));
      return !isNaN(numVal) && numVal > 0 && numVal <= 99999999.99;
    },
    { message: "Fiyat 0-99.999.999,99 TL arasında olmalıdır" }
  ),
  breed: z.string().optional(),
  age: z.string().optional(),
  gender: z.string().optional(),
  healthStatus: z.string().optional(),
  vaccinated: z.boolean().default(false),
  neutered: z.boolean().default(false),
  pedigree: z.boolean().default(false),
  city: z.string().min(1, "İl seçiniz"),
  district: z.string().min(1, "İlçe seçiniz"),
  images: z.array(z.string()).default([]),
});

type ListingFormData = z.infer<typeof listingFormSchema>;

export default function EditListing() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/ilan-duzenle/:id");
  const listingId = params?.id;
  const { user } = useAuth();
  const { ready, isLoading: authLoading } = useRequireAuth();
  const { toast } = useToast();
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      categoryId: "",
      title: "",
      description: "",
      price: "",
      breed: "",
      age: "",
      gender: "",
      healthStatus: "",
      vaccinated: false,
      neutered: false,
      pedigree: false,
      city: "",
      district: "",
      images: [],
    },
  });

  const { data: listing, isLoading: listingLoading } = useQuery<Listing & { seller?: any }>({
    queryKey: [`/api/listings/${listingId}`],
    enabled: !!listingId,
  });

  const { data: categoryTree = [] } = useQuery<CategoryNode[]>({
    queryKey: ["/api/categories/tree"],
  });

  const { data: provinces = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations?type=il"],
  });

  const { data: districts = [] } = useQuery<Location[]>({
    queryKey: [`/api/locations?parent=${selectedProvince}&type=ilce`],
    enabled: !!selectedProvince,
  });

  const subCategories = categoryTree.find(cat => cat.id === selectedMainCategory)?.children || [];

  useEffect(() => {
    if (listing && categoryTree.length > 0 && provinces.length > 0 && !isInitialized) {
      form.reset({
        categoryId: listing.categoryId || "",
        title: listing.title || "",
        description: listing.description || "",
        price: listing.price?.toString() || "",
        breed: listing.breed || "",
        age: listing.age || "",
        gender: listing.gender || "",
        healthStatus: listing.healthStatus || "",
        vaccinated: listing.vaccinated || false,
        neutered: listing.neutered || false,
        pedigree: listing.pedigree || false,
        city: listing.city || "",
        district: listing.district || "",
        images: listing.images || [],
      });
      setUploadedImages(listing.images || []);

      const findMainCategory = (catId: string): string | null => {
        for (const mainCat of categoryTree) {
          if (mainCat.id === catId) return mainCat.id;
          const found = mainCat.children?.find(sub => sub.id === catId);
          if (found) return mainCat.id;
        }
        return null;
      };

      const mainCatId = findMainCategory(listing.categoryId);
      if (mainCatId) {
        setSelectedMainCategory(mainCatId);
        if (mainCatId !== listing.categoryId) {
          setSelectedSubCategory(listing.categoryId);
        }
      }

      const province = provinces.find(p => p.name === listing.city);
      if (province) {
        setSelectedProvince(province.id);
      }

      setIsInitialized(true);
    }
  }, [listing, categoryTree, provinces, form, isInitialized]);

  useEffect(() => {
    if (isInitialized && districts.length > 0 && listing?.district) {
      const district = districts.find(d => d.name === listing.district);
      if (district) {
        setSelectedDistrict(district.id);
      }
    }
  }, [districts, listing, isInitialized]);

  const updateListingMutation = useMutation({
    mutationFn: async (data: ListingFormData) => {
      return await apiRequest("PATCH", `/api/listings/${listingId}`, {
        ...data,
        images: uploadedImages,
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "İlanınız güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      queryClient.invalidateQueries({ queryKey: [`/api/listings/${listingId}`] });
      navigate(`/ilan/${listingId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İlan güncellenemedi",
        variant: "destructive",
      });
    },
  });

  const deleteListingMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/listings/${listingId}`);
    },
    onSuccess: () => {
      toast({
        title: "Silindi",
        description: "İlanınız başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      navigate("/profil");
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İlan silinemedi",
        variant: "destructive",
      });
    },
  });

  const deactivateListingMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/listings/${listingId}/deactivate`);
    },
    onSuccess: () => {
      toast({
        title: "Pasife Alındı",
        description: "İlanınız pasife alındı. İstediğiniz zaman tekrar aktifleştirebilirsiniz.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      queryClient.invalidateQueries({ queryKey: [`/api/listings/${listingId}`] });
      navigate("/panel/ilanlarim");
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İlan pasife alınamadı",
        variant: "destructive",
      });
    },
  });

  const activateListingMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/listings/${listingId}/activate`);
    },
    onSuccess: () => {
      toast({
        title: "Aktifleştirildi",
        description: "İlanınız tekrar yayında!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      queryClient.invalidateQueries({ queryKey: [`/api/listings/${listingId}`] });
      navigate(`/ilan/${listingId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İlan aktifleştirilemedi",
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
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        
        let { width, height } = img;
        
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
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

  const handleImageUpload = useCallback(async (files: FileList) => {
    if (uploadedImages.length + files.length > 10) {
      toast({
        title: "Hata",
        description: "En fazla 10 fotoğraf yükleyebilirsiniz",
        variant: "destructive",
      });
      return;
    }

    setUploadingImages(true);
    
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Hata",
            description: `${file.name} bir resim dosyası değil`,
            variant: "destructive",
          });
          continue;
        }

        let optimizedFile: Blob;
        try {
          optimizedFile = await optimizeImage(file);
        } catch {
          toast({
            title: "Hata",
            description: `${file.name} optimize edilemedi`,
            variant: "destructive",
          });
          continue;
        }

        const formData = new FormData();
        formData.append('file', optimizedFile, file.name.replace(/\.[^/.]+$/, '.jpg'));
        
        const uploadResponse = await fetch('/api/objects/upload-file', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (uploadResponse.ok) {
          const { normalizedPath } = await uploadResponse.json();
          setUploadedImages(prev => [...prev, normalizedPath]);
        } else {
          toast({
            title: "Yükleme Hatası",
            description: `${file.name} yüklenemedi`,
            variant: "destructive",
          });
        }
      }
    } catch {
      toast({
        title: "Hata",
        description: "Fotoğraf yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
    }
  }, [uploadedImages, toast, optimizeImage]);

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: ListingFormData) => {
    updateListingMutation.mutate({
      ...data,
      images: uploadedImages,
    });
  };

  // Oturum yüklenmeden yönlendirme yapılmaz (bkz. useRequireAuth)
  if (!ready) return <AuthGate isLoading={authLoading} />;
  // ready true iken user daima dolu; bu satır yalnızca TypeScript daraltması için
  if (!user) return null;

  if (listingLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Skeleton className="h-8 w-32 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-2">İlan Bulunamadı</h2>
          <p className="text-muted-foreground mb-4">Bu ilan mevcut değil veya silinmiş olabilir.</p>
          <Button onClick={() => navigate("/profil")} data-testid="button-back-profile">
            Profilime Dön
          </Button>
        </Card>
      </div>
    );
  }

  if (listing.sellerId !== user.id) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Yetkisiz Erişim</h2>
          <p className="text-muted-foreground mb-4">Bu ilanı düzenleme yetkiniz yok.</p>
          <Button onClick={() => navigate("/")} data-testid="button-back-home">
            Ana Sayfaya Dön
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate(`/ilan/${listingId}`)}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          İlana Geri Dön
        </Button>
        
        <div className="flex items-center gap-2">
          {listing.status === "active" ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" data-testid="button-deactivate-listing">
                  <Pause className="w-4 h-4 mr-2" />
                  Pasife Al
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>İlanı pasife almak istiyor musunuz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    İlanınız geçici olarak yayından kaldırılacaktır. İstediğiniz zaman tekrar aktifleştirebilirsiniz.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-deactivate">İptal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deactivateListingMutation.mutate()}
                    data-testid="button-confirm-deactivate"
                  >
                    {deactivateListingMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Evet, Pasife Al
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : listing.status === "draft" ? (
            <Button 
              variant="default" 
              onClick={() => activateListingMutation.mutate()}
              disabled={activateListingMutation.isPending}
              data-testid="button-activate-listing"
            >
              {activateListingMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Aktifleştir
            </Button>
          ) : null}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" data-testid="button-delete-listing">
                <Trash2 className="w-4 h-4 mr-2" />
                İlanı Sil
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>İlanı silmek istediğinize emin misiniz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem geri alınamaz. İlan kalıcı olarak silinecektir.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">İptal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteListingMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-confirm-delete"
                >
                  {deleteListingMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Evet, Sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>İlanı Düzenle</CardTitle>
          <CardDescription>
            İlan bilgilerinizi güncelleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Kategori</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormItem>
                    <FormLabel>Ana Kategori *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        setSelectedMainCategory(value);
                        setSelectedSubCategory("");
                        form.setValue("categoryId", "");
                      }}
                      value={selectedMainCategory}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 hover:bg-accent/50" data-testid="select-main-category">
                          <SelectValue placeholder="Ana kategori seçiniz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {categoryTree.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alt Kategori *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            setSelectedSubCategory(value);
                            field.onChange(value);
                          }}
                          value={selectedSubCategory || field.value}
                          disabled={!selectedMainCategory || subCategories.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 hover:bg-accent/50" data-testid="select-sub-category">
                              <SelectValue placeholder={subCategories.length === 0 && selectedMainCategory ? "Alt kategori yok" : "Alt kategori seçiniz"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-60">
                            {subCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
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

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Konum</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İl *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const province = provinces.find(p => p.id === value);
                            setSelectedProvince(value);
                            setSelectedDistrict("");
                            field.onChange(province?.name || "");
                            form.setValue("district", "");
                          }}
                          value={selectedProvince}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 hover:bg-accent/50" data-testid="select-province">
                              <SelectValue placeholder="İl seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-60">
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
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İlçe *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            setSelectedDistrict(value);
                            const district = districts.find(d => d.id === value);
                            field.onChange(district?.name || "");
                          }}
                          value={selectedDistrict}
                          disabled={!selectedProvince}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 hover:bg-accent/50" data-testid="select-district">
                              <SelectValue placeholder="İlçe seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-60">
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

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">İlan Bilgileri</h3>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İlan Başlığı *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Örn: Satılık Golden Retriever Yavrusu"
                          data-testid="input-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Açıklama *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Hayvanınız hakkında detaylı bilgi verin..."
                          rows={5}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fiyat (₺) *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          placeholder="0"
                          data-testid="input-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Hayvan Özellikleri</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="breed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Irk / Cins</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Örn: Golden Retriever" data-testid="input-breed" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yaş</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Örn: 3 aylık" data-testid="input-age" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cinsiyet</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="h-11 hover:bg-accent/50" data-testid="select-gender">
                              <SelectValue placeholder="Seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Erkek">Erkek</SelectItem>
                            <SelectItem value="Dişi">Dişi</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="healthStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sağlık Durumu</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Örn: Sağlıklı" data-testid="input-health-status" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="vaccinated"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <FormLabel className="cursor-pointer">Aşılı</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-vaccinated"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="neutered"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <FormLabel className="cursor-pointer">Kısırlaştırılmış</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-neutered"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pedigree"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <FormLabel className="cursor-pointer">Soy Ağacı</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-pedigree"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Fotoğraflar</h3>
                <p className="text-sm text-muted-foreground">
                  En fazla 10 fotoğraf yükleyebilirsiniz. Fotoğraflar otomatik olarak optimize edilir.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {uploadedImages.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img
                        src={url}
                        alt={`Fotoğraf ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                        data-testid={`button-remove-image-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {uploadedImages.length < 10 && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                        disabled={uploadingImages}
                        data-testid="input-images"
                      />
                      {uploadingImages ? (
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <ImagePlus className="w-8 h-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Fotoğraf Ekle</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/ilan/${listingId}`)}
                  data-testid="button-cancel"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={updateListingMutation.isPending}
                  data-testid="button-save"
                >
                  {updateListingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    "Değişiklikleri Kaydet"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
