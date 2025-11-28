import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { getRecaptchaToken, loadRecaptchaScript } from "@/lib/recaptcha";
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
import { ArrowLeft, ArrowRight, Upload, X, ImagePlus, Loader2 } from "lucide-react";
import { Link } from "wouter";
import type { Location } from "@shared/schema";

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
  price: z.string().min(1, "Fiyat giriniz"),
  breed: z.string().optional(),
  age: z.string().optional(),
  gender: z.string().optional(),
  healthStatus: z.string().optional(),
  vaccinated: z.boolean().default(false),
  neutered: z.boolean().default(false),
  pedigree: z.boolean().default(false),
  locationId: z.string().optional(),
  city: z.string().min(1, "İl seçiniz"),
  district: z.string().min(1, "İlçe seçiniz"),
  images: z.array(z.string()).default([]),
});

type ListingFormData = z.infer<typeof listingFormSchema>;

export default function CreateListing() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

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

  // Fetch category tree
  const { data: categoryTree = [] } = useQuery<CategoryNode[]>({
    queryKey: ["/api/categories/tree"],
  });

  // Fetch provinces
  const { data: provinces = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations?type=il"],
  });

  // Fetch districts based on selected province
  const { data: districts = [] } = useQuery<Location[]>({
    queryKey: [`/api/locations?parent=${selectedProvince}&type=ilce`],
    enabled: !!selectedProvince,
  });

  // Get subcategories based on selected main category
  const subCategories = categoryTree.find(cat => cat.id === selectedMainCategory)?.children || [];

  const createListingMutation = useMutation({
    mutationFn: async (data: ListingFormData) => {
      const recaptchaToken = await getRecaptchaToken('create_listing');
      
      return await apiRequest("POST", "/api/listings", {
        ...data,
        images: uploadedImages,
        recaptchaToken,
      });
    },
    onSuccess: (response: any) => {
      toast({
        title: "Başarılı!",
        description: response?.message || "İlanınız oluşturuldu ve yayında!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İlan oluşturulamadı",
        variant: "destructive",
      });
    },
  });

  // Otomatik fotoğraf optimize etme fonksiyonu
  const optimizeImage = useCallback((file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        // Maksimum boyutlar (orantılı küçültme)
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        
        let { width, height } = img;
        
        // Orantılı küçültme
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
        
        // Beyaz arka plan (şeffaf PNG'ler için)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        // Yüksek kaliteli yeniden boyutlandırma
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // JPEG olarak sıkıştır (kalite: 0.85)
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
        // Sadece resim dosyalarını kabul et
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Hata",
            description: `${file.name} bir resim dosyası değil`,
            variant: "destructive",
          });
          continue;
        }

        // Fotoğrafı otomatik optimize et (boyut ve kalite)
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

        // Upload file through backend (no CORS issues)
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
    createListingMutation.mutate({
      ...data,
      images: uploadedImages,
    });
  };

  useEffect(() => {
    if (!user) {
      navigate("/giris");
    }
    if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
      loadRecaptchaScript().catch(() => {});
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const totalSteps = 2;

  const canProceedStep1 = form.watch("categoryId") && form.watch("city") && form.watch("district");
  const canProceedStep2 = form.watch("title") && form.watch("description") && form.watch("price");

  return (
    <div className="container max-w-4xl mx-auto py-4 md:py-8 px-3 md:px-4">
      <div className="mb-4 md:mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="-ml-2"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span className="text-sm">Geri</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl">Ücretsiz İlan Ver</CardTitle>
          <CardDescription className="text-sm">
            Adım {step} / {totalSteps} - {step === 1 ? "Kategori ve Konum" : "İlan Detayları ve Fotoğraflar"}
          </CardDescription>
          <div className="flex gap-2 mt-3 md:mt-4">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 md:h-2 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 md:space-y-6">
              {/* Step 1: Category & Location */}
              {step === 1 && (
                <div className="space-y-5 md:space-y-6">
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-base md:text-lg font-semibold">Kategori Seçimi</h3>
                    
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
                              value={selectedSubCategory}
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

                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-base md:text-lg font-semibold">Konum Bilgisi</h3>
                    
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
                </div>
              )}

              {/* Step 2: Listing Details & Photos */}
              {step === 2 && (
                <div className="space-y-5 md:space-y-6">
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-base md:text-lg font-semibold">İlan Bilgileri</h3>

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
                              placeholder="Hayvanınız hakkında detaylı bilgi verin. Yaşı, sağlık durumu, alışkanlıkları vb..."
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

                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-base md:text-lg font-semibold">Hayvan Özellikleri (Opsiyonel)</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
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
                            <Select onValueChange={field.onChange} value={field.value}>
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

                    <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 md:gap-4">
                      <FormField
                        control={form.control}
                        name="vaccinated"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-2.5 md:p-3">
                            <FormLabel className="cursor-pointer text-sm">Aşılı</FormLabel>
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
                          <FormItem className="flex items-center justify-between rounded-lg border p-2.5 md:p-3">
                            <FormLabel className="cursor-pointer text-sm">Kısır</FormLabel>
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
                          <FormItem className="flex items-center justify-between rounded-lg border p-2.5 md:p-3">
                            <FormLabel className="cursor-pointer text-sm">Pedigree</FormLabel>
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

                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-base md:text-lg font-semibold">Fotoğraflar</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Hayvanınızın fotoğraflarını ekleyin. Sistem otomatik olarak optimize eder.
                    </p>
                    
                    {/* Ana Yükleme Alanı */}
                    {uploadedImages.length === 0 && (
                      <label className="block w-full p-6 md:p-8 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 cursor-pointer transition-all active:scale-[0.99]">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                          disabled={uploadingImages}
                          data-testid="input-image-upload-main"
                        />
                        <div className="flex flex-col items-center justify-center text-center">
                          {uploadingImages ? (
                            <>
                              <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-primary animate-spin mb-2 md:mb-3" />
                              <span className="text-base md:text-lg font-medium text-primary">Yükleniyor...</span>
                              <span className="text-xs md:text-sm text-muted-foreground mt-1">Lütfen bekleyin</span>
                            </>
                          ) : (
                            <>
                              <ImagePlus className="w-10 h-10 md:w-12 md:h-12 text-primary mb-2 md:mb-3" />
                              <span className="text-base md:text-lg font-medium">Fotoğraf Seç</span>
                              <span className="text-xs md:text-sm text-muted-foreground mt-1">Tıklayın veya sürükleyin</span>
                              <span className="text-[10px] md:text-xs text-muted-foreground mt-2 md:mt-3">JPG, PNG - En fazla 10 fotoğraf</span>
                            </>
                          )}
                        </div>
                      </label>
                    )}

                    {/* Yüklenen Fotoğraflar */}
                    {uploadedImages.length > 0 && (
                      <div className="space-y-2 md:space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs md:text-sm font-medium">{uploadedImages.length} fotoğraf</span>
                          {uploadedImages.length < 10 && (
                            <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-medium cursor-pointer hover:bg-primary/90 active:scale-[0.98]">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                                disabled={uploadingImages}
                                data-testid="input-image-upload-more"
                              />
                              {uploadingImages ? (
                                <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                              ) : (
                                <ImagePlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              )}
                              <span className="hidden xs:inline">Daha Fazla</span>
                              <span className="xs:hidden">Ekle</span>
                            </label>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-3">
                          {uploadedImages.map((url, index) => (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-border">
                              <img src={url} alt={`Fotoğraf ${index + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 shadow-lg"
                                data-testid={`button-remove-image-${index}`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                              {index === 0 && (
                                <div className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-xs text-center py-1 font-medium">
                                  Kapak Fotoğrafı
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between gap-3 pt-4 md:pt-6 border-t">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 md:h-11"
                    onClick={() => setStep(step - 1)}
                    data-testid="button-prev-step"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Geri
                  </Button>
                ) : (
                  <div />
                )}
                
                {step < totalSteps ? (
                  <Button
                    type="button"
                    className="h-10 md:h-11"
                    onClick={() => setStep(step + 1)}
                    disabled={!canProceedStep1}
                    data-testid="button-next-step"
                  >
                    Devam
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="h-10 md:h-11 min-w-[140px]"
                    disabled={createListingMutation.isPending || !canProceedStep2}
                    data-testid="button-submit-listing"
                  >
                    {createListingMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span className="hidden xs:inline">Oluşturuluyor...</span>
                        <span className="xs:hidden">Bekleyin</span>
                      </>
                    ) : (
                      "İlanı Yayınla"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
