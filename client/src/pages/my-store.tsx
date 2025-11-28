import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Building2, Edit, Eye, Upload, X, Users, Eye as EyeIcon, Star, Calendar, Image, Palette, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface StoreCategory {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  icon: string;
  depth: number;
  order: number;
  children?: StoreCategory[];
}

const storeFormSchema = z.object({
  slug: z.string().min(3, "Slug en az 3 karakter olmalı").regex(/^[a-z0-9-]+$/, "Sadece küçük harf, rakam ve tire"),
  displayName: z.string().min(3, "Mağaza adı en az 3 karakter olmalı"),
  storeType: z.string(),
  categoryId: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Geçerli bir email girin").optional().or(z.literal("")),
  website: z.string().url("Geçerli bir URL girin").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  primaryColor: z.string().default("#0066CC"),
  secondaryColor: z.string().default("#FFA500"),
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

const storeTypeOptions = [
  { value: "petshop", label: "Pet Shop" },
  { value: "feed_producer", label: "Yem & Mama Üreticisi" },
  { value: "farm_equipment", label: "Çiftlik Ekipmanı" },
  { value: "veterinary", label: "Veteriner Kliniği" },
  { value: "transport", label: "Nakliye & Lojistik" },
  { value: "beekeeping", label: "Arıcılık Malzemeleri" },
  { value: "horse_riding", label: "At & Binicilik" },
  { value: "exotic", label: "Egzotik Hayvanlar" },
  { value: "grooming", label: "Pet Kuaförü" },
  { value: "other", label: "Diğer" },
];

const bannerTemplates = [
  { id: "gradient-blue", name: "Mavi Gradient", preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { id: "gradient-green", name: "Yeşil Gradient", preview: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
  { id: "gradient-orange", name: "Turuncu Gradient", preview: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { id: "gradient-dark", name: "Koyu Gradient", preview: "linear-gradient(135deg, #232526 0%, #414345 100%)" },
  { id: "gradient-sunset", name: "Günbatımı", preview: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
  { id: "gradient-ocean", name: "Okyanus", preview: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)" },
];

function ImageUploader({ 
  label, 
  currentImage, 
  onUpload, 
  aspectRatio = "1/1",
  className = "",
  placeholder,
}: {
  label: string;
  currentImage?: string | null;
  onUpload: (url: string) => void;
  aspectRatio?: string;
  className?: string;
  placeholder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Hata", description: "Sadece resim dosyaları yüklenebilir", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Hata", description: "Dosya 10MB'dan küçük olmalı", variant: "destructive" });
      return;
    }

    setUploading(true);
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Yükleme başarısız');

      const data = await response.json();
      onUpload(data.url);
      toast({ title: "Başarılı", description: "Resim yüklendi" });
    } catch (error) {
      setPreview(currentImage || null);
      toast({ title: "Hata", description: "Resim yüklenemedi", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <Label className="text-sm font-medium mb-2 block">{label}</Label>
      <div 
        className="relative border-2 border-dashed rounded-lg overflow-hidden cursor-pointer hover-elevate transition-all"
        style={{ aspectRatio }}
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
            <Image className="w-8 h-8 mb-2" />
            <span className="text-xs text-center px-2">{placeholder || "Resim yükle"}</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

export default function MyStore() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const { data: myStore, isLoading } = useQuery<any>({
    queryKey: ["/api/store/my/dashboard"],
  });

  const { data: categories = [] } = useQuery<StoreCategory[]>({
    queryKey: ["/api/store-categories"],
  });

  const hasStore = !!myStore && !('message' in myStore);

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      primaryColor: "#0066CC",
      secondaryColor: "#FFA500",
      storeType: "petshop",
    },
  });

  const flattenCategories = (cats: StoreCategory[]): StoreCategory[] => {
    return cats.flatMap(cat => [
      cat,
      ...(cat.children ? flattenCategories(cat.children) : [])
    ]);
  };
  const flatCategories = flattenCategories(categories);

  useEffect(() => {
    if (hasStore && myStore) {
      form.reset({
        slug: myStore.slug,
        displayName: myStore.displayName,
        storeType: myStore.storeType,
        categoryId: myStore.categoryId || undefined,
        summary: myStore.summary || "",
        description: myStore.description || "",
        phone: myStore.phone || "",
        email: myStore.email || "",
        website: myStore.website || "",
        address: myStore.address || "",
        city: myStore.city || "",
        district: myStore.district || "",
        primaryColor: myStore.primaryColor || "#0066CC",
        secondaryColor: myStore.secondaryColor || "#FFA500",
      });
      setLogoUrl(myStore.logo || null);
      setBannerUrl(myStore.banner || null);
      setSelectedTemplate(myStore.bannerTemplate || null);
    }
  }, [hasStore, myStore, form]);

  const uploadMediaMutation = useMutation({
    mutationFn: async ({ storeId, mediaType, url }: { storeId: string; mediaType: string; url: string }) => {
      return apiRequest(`/api/store/${storeId}/media`, "POST", { mediaType, url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/my/dashboard"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: StoreFormValues) => {
      return apiRequest("/api/store", "POST", data);
    },
    onSuccess: (newStore: any) => {
      if (logoUrl && newStore.id) {
        uploadMediaMutation.mutate({ storeId: newStore.id, mediaType: "logo", url: logoUrl });
      }
      if (bannerUrl && newStore.id) {
        uploadMediaMutation.mutate({ storeId: newStore.id, mediaType: "banner", url: bannerUrl });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/store/my/dashboard"] });
      toast({ title: "Mağaza oluşturuldu!" });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Mağaza oluşturulamadı",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: StoreFormValues) => {
      return apiRequest(`/api/store/${myStore.id}`, "PATCH", {
        ...data,
        bannerTemplate: selectedTemplate,
      });
    },
    onSuccess: () => {
      if (logoUrl && myStore.id) {
        uploadMediaMutation.mutate({ storeId: myStore.id, mediaType: "logo", url: logoUrl });
      }
      if (bannerUrl && myStore.id) {
        uploadMediaMutation.mutate({ storeId: myStore.id, mediaType: "banner", url: bannerUrl });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/store/my/dashboard"] });
      toast({ title: "Mağaza güncellendi!" });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Mağaza güncellenemedi",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StoreFormValues) => {
    if (hasStore) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!hasStore) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
        <Card>
          <CardHeader className="px-4 py-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              Mağazanızı Oluşturun
            </CardTitle>
            <CardDescription className="text-sm">
              Profesyonel bir mağaza profili oluşturarak ürünlerinizi sergileyin
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageUploader
                  label="Mağaza Logosu"
                  currentImage={logoUrl}
                  onUpload={setLogoUrl}
                  aspectRatio="1/1"
                  placeholder="Logo yükle (1:1)"
                />
                <ImageUploader
                  label="Kapak Görseli"
                  currentImage={bannerUrl}
                  onUpload={setBannerUrl}
                  aspectRatio="3/1"
                  placeholder="Banner yükle (3:1)"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayName">Mağaza Adı *</Label>
                  <Input
                    id="displayName"
                    {...form.register("displayName")}
                    placeholder="Örn: PetShop İstanbul"
                    data-testid="input-store-name"
                  />
                  {form.formState.errors.displayName && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.displayName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slug">URL (Slug) *</Label>
                  <Input
                    id="slug"
                    {...form.register("slug")}
                    placeholder="petshop-istanbul"
                    data-testid="input-store-slug"
                  />
                  {form.formState.errors.slug && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.slug.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="storeType">Mağaza Tipi *</Label>
                <Select
                  value={form.watch("storeType")}
                  onValueChange={(value) => form.setValue("storeType", value)}
                >
                  <SelectTrigger data-testid="select-store-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {storeTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="categoryId">Mağaza Kategorisi</Label>
                <Select
                  value={form.watch("categoryId") || "none"}
                  onValueChange={(value) => form.setValue("categoryId", value === "none" ? undefined : value)}
                >
                  <SelectTrigger data-testid="select-store-category">
                    <SelectValue placeholder="Kategori seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kategori Yok</SelectItem>
                    {flatCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {'  '.repeat(cat.depth)}
                        {cat.depth > 0 ? '└ ' : ''}
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="summary">Kısa Açıklama</Label>
                <Textarea
                  id="summary"
                  {...form.register("summary")}
                  placeholder="Mağazanızı kısaca tanıtın..."
                  rows={2}
                  data-testid="input-store-summary"
                />
              </div>

              <div>
                <Label htmlFor="description">Detaylı Açıklama</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Mağazanız hakkında detaylı bilgi..."
                  rows={4}
                  data-testid="input-store-description"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Şehir</Label>
                  <Input id="city" {...form.register("city")} placeholder="İstanbul" data-testid="input-store-city" />
                </div>
                <div>
                  <Label htmlFor="district">İlçe</Label>
                  <Input id="district" {...form.register("district")} placeholder="Kadıköy" data-testid="input-store-district" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" {...form.register("phone")} placeholder="0555 123 4567" data-testid="input-store-phone" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...form.register("email")} placeholder="info@magaza.com" data-testid="input-store-email" />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" {...form.register("website")} placeholder="https://magaza.com" data-testid="input-store-website" />
                {form.formState.errors.website && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.website.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="address">Adres</Label>
                <Textarea id="address" {...form.register("address")} placeholder="Tam adres..." rows={2} data-testid="input-store-address" />
              </div>

              <Separator />

              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4" />
                  Marka Renkleri
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor" className="text-xs text-muted-foreground">Ana Renk</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        id="primaryColor" 
                        type="color" 
                        {...form.register("primaryColor")} 
                        className="w-12 h-10 p-1 cursor-pointer"
                        data-testid="input-primary-color"
                      />
                      <Input 
                        value={form.watch("primaryColor")} 
                        onChange={(e) => form.setValue("primaryColor", e.target.value)}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor" className="text-xs text-muted-foreground">İkincil Renk</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        id="secondaryColor" 
                        type="color" 
                        {...form.register("secondaryColor")} 
                        className="w-12 h-10 p-1 cursor-pointer"
                        data-testid="input-secondary-color"
                      />
                      <Input 
                        value={form.watch("secondaryColor")} 
                        onChange={(e) => form.setValue("secondaryColor", e.target.value)}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={createMutation.isPending} 
                className="w-full"
                data-testid="button-create-store"
              >
                {createMutation.isPending ? "Oluşturuluyor..." : "Mağazayı Oluştur"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Building2 className="w-6 h-6 sm:w-8 sm:h-8" />
          Mağazam
        </h1>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/magaza/${myStore.slug}`}>
            <Button variant="outline" size="sm" data-testid="button-view-store">
              <Eye className="w-4 h-4 mr-2" />
              Görüntüle
            </Button>
          </Link>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} size="sm" data-testid="button-edit-store">
              <Edit className="w-4 h-4 mr-2" />
              Düzenle
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <Card>
          <CardHeader className="px-4 py-4 sm:px-6">
            <CardTitle className="text-lg">Mağaza Bilgilerini Düzenle</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageUploader
                  label="Mağaza Logosu"
                  currentImage={logoUrl}
                  onUpload={(url) => {
                    setLogoUrl(url);
                  }}
                  aspectRatio="1/1"
                  placeholder="Logo yükle (1:1)"
                />
                <div>
                  <ImageUploader
                    label="Kapak Görseli"
                    currentImage={bannerUrl}
                    onUpload={(url) => {
                      setBannerUrl(url);
                      setSelectedTemplate(null);
                    }}
                    aspectRatio="3/1"
                    placeholder="Banner yükle (3:1)"
                  />
                  <div className="mt-3">
                    <Label className="text-xs text-muted-foreground mb-2 block">veya hazır şablon seçin:</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {bannerTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => {
                            setSelectedTemplate(template.id);
                            setBannerUrl(null);
                          }}
                          className={`h-8 rounded border-2 transition-all ${selectedTemplate === template.id ? 'border-primary' : 'border-transparent'}`}
                          style={{ background: template.preview }}
                          title={template.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayName">Mağaza Adı *</Label>
                  <Input id="displayName" {...form.register("displayName")} data-testid="input-edit-store-name" />
                  {form.formState.errors.displayName && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.displayName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slug">URL (Slug) *</Label>
                  <Input id="slug" {...form.register("slug")} data-testid="input-edit-store-slug" />
                  {form.formState.errors.slug && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.slug.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="storeType">Mağaza Tipi *</Label>
                <Select
                  value={form.watch("storeType")}
                  onValueChange={(value) => form.setValue("storeType", value)}
                >
                  <SelectTrigger data-testid="select-edit-store-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {storeTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="categoryId">Mağaza Kategorisi</Label>
                <Select
                  value={form.watch("categoryId") || "none"}
                  onValueChange={(value) => form.setValue("categoryId", value === "none" ? undefined : value)}
                >
                  <SelectTrigger data-testid="select-edit-store-category">
                    <SelectValue placeholder="Kategori seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kategori Yok</SelectItem>
                    {flatCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {'  '.repeat(cat.depth)}
                        {cat.depth > 0 ? '└ ' : ''}
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="summary">Kısa Açıklama</Label>
                <Textarea id="summary" {...form.register("summary")} rows={2} data-testid="input-edit-store-summary" />
              </div>

              <div>
                <Label htmlFor="description">Detaylı Açıklama</Label>
                <Textarea id="description" {...form.register("description")} rows={4} data-testid="input-edit-store-description" />
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Şehir</Label>
                  <Input id="city" {...form.register("city")} data-testid="input-edit-city" />
                </div>
                <div>
                  <Label htmlFor="district">İlçe</Label>
                  <Input id="district" {...form.register("district")} data-testid="input-edit-district" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" {...form.register("phone")} data-testid="input-edit-phone" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...form.register("email")} data-testid="input-edit-email" />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" {...form.register("website")} data-testid="input-edit-website" />
                {form.formState.errors.website && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.website.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="address">Adres</Label>
                <Textarea id="address" {...form.register("address")} rows={2} data-testid="input-edit-address" />
              </div>

              <Separator />

              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4" />
                  Marka Renkleri
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor" className="text-xs text-muted-foreground">Ana Renk</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        id="primaryColor" 
                        type="color" 
                        {...form.register("primaryColor")} 
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input 
                        value={form.watch("primaryColor")} 
                        onChange={(e) => form.setValue("primaryColor", e.target.value)}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor" className="text-xs text-muted-foreground">İkincil Renk</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        id="secondaryColor" 
                        type="color" 
                        {...form.register("secondaryColor")} 
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input 
                        value={form.watch("secondaryColor")} 
                        onChange={(e) => form.setValue("secondaryColor", e.target.value)}
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-store">
                  {updateMutation.isPending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="px-4 py-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">İstatistikler</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Toplam İlan</p>
                  <p className="text-xl font-bold">{myStore.stats?.totalListings || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ortalama Puan</p>
                  <p className="text-xl font-bold">{parseFloat(myStore.rating || "0").toFixed(1)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Takipçi</p>
                  <p className="text-xl font-bold">{myStore.followerCount || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <EyeIcon className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Görüntülenme</p>
                  <p className="text-xl font-bold">{myStore.viewCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="px-4 py-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Mağaza Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                {myStore.logo ? (
                  <img src={myStore.logo} alt={myStore.displayName} className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: myStore.primaryColor + '20' }}
                  >
                    <Building2 className="w-8 h-8" style={{ color: myStore.primaryColor }} />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{myStore.displayName}</h3>
                  <p className="text-sm text-muted-foreground">/{myStore.slug}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Durum</p>
                  <Badge variant={myStore.status === "active" ? "default" : "secondary"} className="mt-1">
                    {myStore.status === "active" ? "Aktif" : myStore.status === "pending" ? "Beklemede" : myStore.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Mağaza Tipi</p>
                  <p className="text-sm mt-1">{storeTypeOptions.find(t => t.value === myStore.storeType)?.label || myStore.storeType}</p>
                </div>
              </div>

              {myStore.summary && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Kısa Açıklama</p>
                  <p className="text-sm mt-1">{myStore.summary}</p>
                </div>
              )}

              {myStore.city && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Konum</p>
                  <p className="text-sm mt-1">{myStore.city}{myStore.district ? `, ${myStore.district}` : ""}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: myStore.primaryColor }} />
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: myStore.secondaryColor }} />
                <span className="text-xs text-muted-foreground">Marka Renkleri</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
