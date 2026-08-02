import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Building2, Edit, Eye, Upload, X, Users, Star, Calendar, Image, Palette, Loader2, Trash2, MapPin, ExternalLink, Check, ArrowRight, ArrowLeft, AlertCircle, Phone, Mail, Globe, MapPinned, Info, CheckCircle, Clock, ShieldCheck, Ban, LogIn, MailCheck, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { redirectQuery } from "@/lib/redirect";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  slug: z.string().min(3, "En az 3 karakter").max(50, "En fazla 50 karakter").regex(/^[a-z0-9-]+$/, "Sadece küçük harf, rakam ve tire (-)"),
  displayName: z.string().min(3, "En az 3 karakter").max(100, "En fazla 100 karakter"),
  storeType: z.string().min(1, "Mağaza tipi seçin"),
  categoryId: z.string().optional(),
  summary: z.string().max(200, "En fazla 200 karakter").optional(),
  description: z.string().max(2000, "En fazla 2000 karakter").optional(),
  phone: z.string().optional(),
  email: z.string().email("Geçerli email girin").optional().or(z.literal("")),
  website: z.string().url("Geçerli URL girin").optional().or(z.literal("")),
  address: z.string().max(500, "En fazla 500 karakter").optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  primaryColor: z.string().default("#0066CC"),
  secondaryColor: z.string().default("#FFA500"),
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

const storeTypeOptions = [
  { value: "petshop", label: "Pet Shop", description: "Evcil hayvan ürünleri satışı" },
  { value: "feed_producer", label: "Yem & Mama Üreticisi", description: "Hayvan yemi ve mama üretimi" },
  { value: "farm_equipment", label: "Çiftlik Ekipmanı", description: "Tarım ve çiftlik malzemeleri" },
  { value: "veterinary", label: "Veteriner Kliniği", description: "Veterinerlik hizmetleri" },
  { value: "transport", label: "Nakliye & Lojistik", description: "Hayvan taşımacılığı" },
  { value: "beekeeping", label: "Arıcılık Malzemeleri", description: "Arıcılık ürünleri" },
  { value: "horse_riding", label: "At & Binicilik", description: "At malzemeleri ve binicilik" },
  { value: "grooming", label: "Pet Kuaförü", description: "Evcil hayvan bakımı" },
  { value: "breeding", label: "Yetiştiricilik", description: "Profesyonel hayvan yetiştiriciliği" },
  { value: "other", label: "Diğer", description: "Diğer hayvan ürün/hizmetleri" },
];

const bannerTemplates = [
  { id: "gradient-blue", name: "Mavi Gradient", preview: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { id: "gradient-green", name: "Yeşil Gradient", preview: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
  { id: "gradient-orange", name: "Turuncu Gradient", preview: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { id: "gradient-dark", name: "Koyu Gradient", preview: "linear-gradient(135deg, #232526 0%, #414345 100%)" },
  { id: "gradient-sunset", name: "Günbatımı", preview: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
  { id: "gradient-ocean", name: "Okyanus", preview: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)" },
];

const WIZARD_STEPS = [
  { id: 1, title: "Temel Bilgiler", description: "Mağaza adı ve tipi" },
  { id: 2, title: "Görsel Kimlik", description: "Logo ve kapak görseli" },
  { id: 3, title: "İletişim", description: "Konum ve iletişim bilgileri" },
];

function StoreImageUploader({ 
  label, 
  currentImage, 
  onUpload, 
  aspectRatio = "1/1",
  className = "",
  placeholder,
  storeId,
  imageType,
  onRemove,
  disabled = false,
}: {
  label: string;
  currentImage?: string | null;
  onUpload: (url: string) => void;
  aspectRatio?: string;
  className?: string;
  placeholder?: string;
  storeId?: string | null;
  imageType: 'logo' | 'banner';
  onRemove?: () => void;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  const recommendations = imageType === 'logo' 
    ? { size: '400x400px', format: 'PNG/JPG', tip: 'Kare format önerilir' }
    : { size: '1600x400px', format: 'PNG/JPG', tip: '4:1 geniş format önerilir' };

  const processFile = async (file: File) => {
    if (disabled) return;
    
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
      
      let resultUrl: string;
      
      if (storeId) {
        formData.append('type', imageType);
        const response = await fetch(`/api/store/${storeId}/upload-image`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Yükleme başarısız');

        const data = await response.json();
        resultUrl = data.variants?.original || data.media?.url;
      } else {
        const response = await fetch('/api/objects/upload-file', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Yükleme başarısız');

        const data = await response.json();
        resultUrl = data.normalizedPath;
      }
      
      onUpload(resultUrl);
      toast({ title: "Başarılı", description: `${imageType === 'logo' ? 'Logo' : 'Kapak görseli'} yüklendi` });
    } catch (error) {
      setPreview(currentImage || null);
      toast({ title: "Hata", description: "Resim yüklenemedi", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onRemove?.();
  };

  return (
    <div className={className}>
      <Label className="text-sm font-medium mb-2 block">{label}</Label>
      <div 
        className={`relative border-2 border-dashed rounded-lg overflow-hidden transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${dragActive ? 'border-primary bg-primary/10' : 'hover-elevate border-muted-foreground/25'}`}
        style={{ aspectRatio }}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        data-testid={`uploader-store-${imageType}`}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            {onRemove && !uploading && !disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                data-testid={`button-remove-${imageType}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-muted/30 p-4">
            <Upload className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium text-center">{placeholder || "Resim yükle"}</span>
            <span className="text-xs text-center mt-1 opacity-70">veya sürükleyip bırakın</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white mb-2" />
            <span className="text-white text-sm">Yükleniyor...</span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">
        Önerilen: {recommendations.size} · {recommendations.format}
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled}
        data-testid={`input-file-${imageType}`}
      />
    </div>
  );
}

function StoreCreationWizard({ 
  categories, 
  onSuccess 
}: { 
  categories: StoreCategory[];
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  
  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      displayName: "",
      slug: "",
      storeType: "",
      categoryId: undefined,
      summary: "",
      description: "",
      phone: "",
      email: "",
      website: "",
      address: "",
      city: "",
      district: "",
      primaryColor: "#0066CC",
      secondaryColor: "#FFA500",
    },
  });

  const flattenCategories = (cats: StoreCategory[]): StoreCategory[] => {
    return cats.flatMap(cat => [
      cat,
      ...(cat.children ? flattenCategories(cat.children) : [])
    ]);
  };
  const flatCategories = flattenCategories(categories);

  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (slug.length < 3) {
      setSlugAvailable(null);
      return;
    }
    
    setCheckingSlug(true);
    try {
      const response = await fetch(`/api/store/check-slug/${encodeURIComponent(slug)}`);
      const data = await response.json();
      setSlugAvailable(data.available);
    } catch {
      setSlugAvailable(null);
    } finally {
      setCheckingSlug(false);
    }
  }, []);

  useEffect(() => {
    const slug = form.watch("slug");
    const timer = setTimeout(() => {
      if (slug && slug.length >= 3) {
        checkSlugAvailability(slug);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.watch("slug"), checkSlugAvailability]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("displayName", name);
    if (!form.getValues("slug") || form.getValues("slug") === generateSlug(form.getValues("displayName").slice(0, -1))) {
      form.setValue("slug", generateSlug(name));
    }
  };

  const uploadMediaMutation = useMutation({
    mutationFn: async ({ storeId, mediaType, url }: { storeId: string; mediaType: string; url: string }) => {
      return apiRequest("POST", `/api/store/${storeId}/media`, { mediaType, url });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: StoreFormValues) => {
      return apiRequest("POST", "/api/store", {
        ...data,
        bannerTemplate: selectedTemplate,
      });
    },
    onSuccess: async (newStore: any) => {
      if (logoUrl && newStore.id) {
        await uploadMediaMutation.mutateAsync({ storeId: newStore.id, mediaType: "logo", url: logoUrl });
      }
      if (bannerUrl && newStore.id) {
        await uploadMediaMutation.mutateAsync({ storeId: newStore.id, mediaType: "banner", url: bannerUrl });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/store/my/dashboard"] });
      toast({ title: "Mağaza oluşturuldu!", description: "Mağazanız başarıyla oluşturuldu." });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Mağaza oluşturulamadı",
        variant: "destructive",
      });
    },
  });

  const validateStep = (step: number): boolean => {
    const values = form.getValues();
    switch (step) {
      case 1:
        if (!values.displayName || values.displayName.length < 3) {
          toast({ title: "Hata", description: "Mağaza adı en az 3 karakter olmalı", variant: "destructive" });
          return false;
        }
        if (!values.slug || values.slug.length < 3) {
          toast({ title: "Hata", description: "URL slug en az 3 karakter olmalı", variant: "destructive" });
          return false;
        }
        if (slugAvailable === false) {
          toast({ title: "Hata", description: "Bu URL zaten kullanılıyor", variant: "destructive" });
          return false;
        }
        if (!values.storeType) {
          toast({ title: "Hata", description: "Mağaza tipi seçin", variant: "destructive" });
          return false;
        }
        return true;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = (data: StoreFormValues) => {
    if (!validateStep(3)) return;
    createMutation.mutate(data);
  };

  const progress = (currentStep / 3) * 100;

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Mağazanızı Açın</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          3 adımda profesyonel mağaza profilinizi oluşturun
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {WIZARD_STEPS.map((step, index) => (
            <div 
              key={step.id} 
              className={`flex items-center ${index < WIZARD_STEPS.length - 1 ? 'flex-1' : ''}`}
            >
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep > step.id 
                    ? 'bg-primary text-primary-foreground' 
                    : currentStep === step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
              </div>
              {index < WIZARD_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{WIZARD_STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>{WIZARD_STEPS[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="displayName">Mağaza Adı *</Label>
                  <Input
                    id="displayName"
                    value={form.watch("displayName")}
                    onChange={handleNameChange}
                    placeholder="Örn: Pet Shop İstanbul"
                    className="mt-1.5"
                    data-testid="input-store-name"
                  />
                  {form.formState.errors.displayName && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.displayName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slug">Mağaza URL'si *</Label>
                  <div className="mt-1.5 space-y-1.5 sm:space-y-0 sm:flex sm:items-center sm:gap-1">
                    <span className="block text-xs sm:text-sm text-muted-foreground sm:shrink-0">sahibindenhayvan.com/magaza/</span>
                    <div className="relative sm:flex-1">
                      <Input
                        id="slug"
                        {...form.register("slug")}
                        placeholder="petshop-istanbul"
                        className="pr-10"
                        data-testid="input-store-slug"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingSlug && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                        {!checkingSlug && slugAvailable === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {!checkingSlug && slugAvailable === false && <AlertCircle className="w-4 h-4 text-destructive" />}
                      </div>
                    </div>
                  </div>
                  {slugAvailable === false && (
                    <p className="text-sm text-destructive mt-1">Bu URL zaten kullanılıyor</p>
                  )}
                  {slugAvailable === true && (
                    <p className="text-sm text-green-600 mt-1">Bu URL kullanılabilir</p>
                  )}
                  {form.formState.errors.slug && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.slug.message}</p>
                  )}
                </div>

                <div>
                  <Label>Mağaza Tipi *</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {storeTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => form.setValue("storeType", option.value)}
                        className={`p-3 rounded-lg border-2 text-left transition-all hover-elevate ${
                          form.watch("storeType") === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50'
                        }`}
                        data-testid={`button-store-type-${option.value}`}
                      >
                        <span className="font-medium text-sm block">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="categoryId">Mağaza Kategorisi (Opsiyonel)</Label>
                  <Select
                    value={form.watch("categoryId") || "none"}
                    onValueChange={(value) => form.setValue("categoryId", value === "none" ? undefined : value)}
                  >
                    <SelectTrigger className="mt-1.5" data-testid="select-store-category">
                      <SelectValue placeholder="Kategori seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kategori Yok</SelectItem>
                      {flatCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {'  '.repeat(cat.depth)}{cat.depth > 0 ? '└ ' : ''}{cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="summary">Kısa Tanıtım</Label>
                  <Textarea
                    id="summary"
                    {...form.register("summary")}
                    placeholder="Mağazanızı kısaca tanıtın (max 200 karakter)"
                    rows={2}
                    className="mt-1.5"
                    data-testid="input-store-summary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.watch("summary")?.length || 0}/200 karakter
                  </p>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StoreImageUploader
                    label="Mağaza Logosu"
                    currentImage={logoUrl}
                    onUpload={setLogoUrl}
                    onRemove={() => setLogoUrl(null)}
                    aspectRatio="1/1"
                    placeholder="Logo yükle (kare)"
                    storeId={null}
                    imageType="logo"
                  />
                  <div>
                    <StoreImageUploader
                      label="Kapak Görseli"
                      currentImage={bannerUrl}
                      onUpload={(url) => {
                        setBannerUrl(url);
                        setSelectedTemplate(null);
                      }}
                      onRemove={() => setBannerUrl(null)}
                      aspectRatio="4/1"
                      placeholder="Banner yükle (geniş)"
                      storeId={null}
                      imageType="banner"
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">veya Hazır Şablon Seçin</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {bannerTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setBannerUrl(null);
                        }}
                        className={`h-16 rounded-lg border-2 transition-all ${
                          selectedTemplate === template.id ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-primary/50'
                        }`}
                        style={{ background: template.preview }}
                        title={template.name}
                        data-testid={`button-template-${template.id}`}
                      />
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <Palette className="w-4 h-4" />
                    Marka Renkleri
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Ana Renk</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input 
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
                      <Label className="text-xs text-muted-foreground">İkincil Renk</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input 
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
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Şehir
                    </Label>
                    <Input id="city" {...form.register("city")} placeholder="İstanbul" className="mt-1.5" data-testid="input-store-city" />
                  </div>
                  <div>
                    <Label htmlFor="district">İlçe</Label>
                    <Input id="district" {...form.register("district")} placeholder="Kadıköy" className="mt-1.5" data-testid="input-store-district" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">
                    <MapPinned className="w-4 h-4 inline mr-1" />
                    Açık Adres
                  </Label>
                  <Textarea id="address" {...form.register("address")} placeholder="Tam adresiniz..." rows={2} className="mt-1.5" data-testid="input-store-address" />
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Telefon
                    </Label>
                    <Input id="phone" {...form.register("phone")} placeholder="0555 123 4567" className="mt-1.5" data-testid="input-store-phone" />
                  </div>
                  <div>
                    <Label htmlFor="email">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email
                    </Label>
                    <Input id="email" type="email" {...form.register("email")} placeholder="info@magaza.com" className="mt-1.5" data-testid="input-store-email" />
                    {form.formState.errors.email && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Website
                  </Label>
                  <Input id="website" {...form.register("website")} placeholder="https://magaza.com" className="mt-1.5" data-testid="input-store-website" />
                  {form.formState.errors.website && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.website.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Detaylı Açıklama</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="Mağazanız hakkında detaylı bilgi..."
                    rows={4}
                    className="mt-1.5"
                    data-testid="input-store-description"
                  />
                </div>
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            data-testid="button-prev-step"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
          
          {currentStep < 3 ? (
            <Button type="button" onClick={nextStep} data-testid="button-next-step">
              İleri
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={createMutation.isPending}
              data-testid="button-create-store"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Mağazayı Oluştur
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function StoreDashboard({ store, categories }: { store: any; categories: StoreCategory[] }) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(store.logo || null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(store.banner || null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(store.bannerTemplate || null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [, navigate] = useLocation();

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      slug: store.slug,
      displayName: store.displayName,
      storeType: store.storeType,
      categoryId: store.categoryId || undefined,
      summary: store.summary || "",
      description: store.description || "",
      phone: store.phone || "",
      email: store.email || "",
      website: store.website || "",
      address: store.address || "",
      city: store.city || "",
      district: store.district || "",
      primaryColor: store.primaryColor || "#0066CC",
      secondaryColor: store.secondaryColor || "#FFA500",
    },
  });

  const flattenCategories = (cats: StoreCategory[]): StoreCategory[] => {
    return cats.flatMap(cat => [cat, ...(cat.children ? flattenCategories(cat.children) : [])]);
  };
  const flatCategories = flattenCategories(categories);

  const uploadMediaMutation = useMutation({
    mutationFn: async ({ storeId, mediaType, url }: { storeId: string; mediaType: string; url: string }) => {
      return apiRequest("POST", `/api/store/${storeId}/media`, { mediaType, url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/my/dashboard"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: StoreFormValues) => {
      return apiRequest("PATCH", `/api/store/${store.id}`, { ...data, bannerTemplate: selectedTemplate });
    },
    onSuccess: async () => {
      if (logoUrl && store.id) {
        await uploadMediaMutation.mutateAsync({ storeId: store.id, mediaType: "logo", url: logoUrl });
      }
      if (bannerUrl && store.id) {
        await uploadMediaMutation.mutateAsync({ storeId: store.id, mediaType: "banner", url: bannerUrl });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/store/my/dashboard"] });
      toast({ title: "Güncellendi", description: "Mağaza bilgileri güncellendi" });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ title: "Hata", description: error.message || "Güncelleme başarısız", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/store/${store.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/my/dashboard"] });
      toast({ title: "Silindi", description: "Mağazanız silindi" });
      navigate("/panel");
    },
    onError: (error: any) => {
      toast({ title: "Hata", description: error.message || "Silme başarısız", variant: "destructive" });
    },
  });

  const getBannerStyle = () => {
    if (store.banner) return { backgroundImage: `url(${store.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    if (store.bannerTemplate) {
      const template = bannerTemplates.find(t => t.id === store.bannerTemplate);
      if (template) return { background: template.preview };
    }
    return { backgroundColor: store.primaryColor || '#0066CC' };
  };

  const storeTypeLabel = storeTypeOptions.find(t => t.value === store.storeType)?.label || store.storeType;

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <MagazaDurumBildirimi store={store} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          Mağazam
        </h1>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/magaza/${store.slug}`}>
            <Button variant="outline" size="sm" data-testid="button-view-store">
              <Eye className="w-4 h-4 mr-2" />
              Görüntüle
            </Button>
          </Link>
          <Button 
            onClick={() => setIsEditing(!isEditing)} 
            variant={isEditing ? "secondary" : "default"}
            size="sm" 
            data-testid="button-edit-store"
          >
            <Edit className="w-4 h-4 mr-2" />
            {isEditing ? "İptal" : "Düzenle"}
          </Button>
        </div>
      </div>

      {!isEditing && (
        <>
          <Card className="overflow-hidden mb-6">
            <div className="relative h-32 sm:h-40" style={getBannerStyle()}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-end gap-4">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-background shadow-lg">
                  <AvatarImage src={store.logo || undefined} />
                  <AvatarFallback className="text-2xl" style={{ backgroundColor: store.primaryColor }}>
                    {store.displayName?.[0] || 'M'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white pb-1">
                  <h2 className="text-xl sm:text-2xl font-bold">{store.displayName}</h2>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="text-xs">{storeTypeLabel}</Badge>
                    {store.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{store.city}</span>}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{store.followerCount || 0}</p>
              <p className="text-xs text-muted-foreground">Takipçi</p>
            </Card>
            <Card className="p-4 text-center">
              <Eye className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{store.viewCount || 0}</p>
              <p className="text-xs text-muted-foreground">Görüntülenme</p>
            </Card>
            <Card className="p-4 text-center">
              <Star className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">{store.rating ? parseFloat(store.rating).toFixed(1) : '-'}</p>
              <p className="text-xs text-muted-foreground">Puan</p>
            </Card>
            <Card className="p-4 text-center">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{store.totalListings || 0}</p>
              <p className="text-xs text-muted-foreground">İlan</p>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mağaza Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {store.summary && (
                <div>
                  <Label className="text-muted-foreground text-sm">Özet</Label>
                  <p className="mt-1">{store.summary}</p>
                </div>
              )}
              {store.description && (
                <div>
                  <Label className="text-muted-foreground text-sm">Açıklama</Label>
                  <p className="mt-1 whitespace-pre-wrap">{store.description}</p>
                </div>
              )}
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {store.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{store.phone}</span>
                  </div>
                )}
                {store.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{store.email}</span>
                  </div>
                )}
                {store.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a href={store.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {store.website}
                    </a>
                  </div>
                )}
                {store.address && (
                  <div className="flex items-start gap-2 col-span-full">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span>{store.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6 border-destructive/20">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Tehlikeli Bölge</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Mağazanızı silmek geri alınamaz bir işlemdir. Tüm ilanlarınız mağaza bağlantısını kaybedecektir.</p>
              <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                  data-testid="button-delete-store"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Mağazayı Sil
                </Button>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mağazayı Sil?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bu işlem geri alınamaz. Mağazanız kalıcı olarak silinecektir.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteMutation.isPending ? "Siliniyor..." : "Evet, Sil"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </>
      )}

      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mağaza Bilgilerini Düzenle</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StoreImageUploader
                  label="Logo"
                  currentImage={logoUrl}
                  onUpload={setLogoUrl}
                  onRemove={() => setLogoUrl(null)}
                  aspectRatio="1/1"
                  placeholder="Logo yükle"
                  storeId={store.id}
                  imageType="logo"
                />
                <div>
                  <StoreImageUploader
                    label="Kapak Görseli"
                    currentImage={bannerUrl}
                    onUpload={(url) => { setBannerUrl(url); setSelectedTemplate(null); }}
                    onRemove={() => setBannerUrl(null)}
                    aspectRatio="4/1"
                    placeholder="Banner yükle"
                    storeId={store.id}
                    imageType="banner"
                  />
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {bannerTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => { setSelectedTemplate(template.id); setBannerUrl(null); }}
                        className={`h-10 rounded border-2 transition-all ${selectedTemplate === template.id ? 'border-primary' : 'border-transparent'}`}
                        style={{ background: template.preview }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Mağaza Adı *</Label>
                  <Input {...form.register("displayName")} className="mt-1.5" data-testid="input-edit-store-name" />
                </div>
                <div>
                  <Label>URL Slug *</Label>
                  <Input {...form.register("slug")} className="mt-1.5" data-testid="input-edit-store-slug" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Mağaza Tipi</Label>
                  <Select value={form.watch("storeType")} onValueChange={(v) => form.setValue("storeType", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {storeTypeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kategori</Label>
                  <Select value={form.watch("categoryId") || "none"} onValueChange={(v) => form.setValue("categoryId", v === "none" ? undefined : v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Yok</SelectItem>
                      {flatCategories.map(c => <SelectItem key={c.id} value={c.id}>{'  '.repeat(c.depth)}{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Özet</Label>
                <Textarea {...form.register("summary")} rows={2} className="mt-1.5" />
              </div>

              <div>
                <Label>Açıklama</Label>
                <Textarea {...form.register("description")} rows={4} className="mt-1.5" />
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Şehir</Label><Input {...form.register("city")} className="mt-1.5" /></div>
                <div><Label>İlçe</Label><Input {...form.register("district")} className="mt-1.5" /></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Telefon</Label><Input {...form.register("phone")} className="mt-1.5" /></div>
                <div><Label>Email</Label><Input {...form.register("email")} type="email" className="mt-1.5" /></div>
              </div>

              <div><Label>Website</Label><Input {...form.register("website")} className="mt-1.5" /></div>
              <div><Label>Adres</Label><Textarea {...form.register("address")} rows={2} className="mt-1.5" /></div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Ana Renk</Label>
                  <div className="flex gap-2 mt-1">
                    <Input type="color" {...form.register("primaryColor")} className="w-12 h-10 p-1" />
                    <Input value={form.watch("primaryColor")} onChange={(e) => form.setValue("primaryColor", e.target.value)} className="flex-1 font-mono text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">İkincil Renk</Label>
                  <div className="flex gap-2 mt-1">
                    <Input type="color" {...form.register("secondaryColor")} className="w-12 h-10 p-1" />
                    <Input value={form.watch("secondaryColor")} onChange={(e) => form.setValue("secondaryColor", e.target.value)} className="flex-1 font-mono text-sm" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="flex-1">İptal</Button>
                <Button type="submit" disabled={updateMutation.isPending} className="flex-1" data-testid="button-save-store">
                  {updateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Kaydediliyor...</> : "Kaydet"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Mağaza durumunu sahibine anlatan bildirim şeridi.
 *
 * Mağaza açıldıktan sonra onay sırasına giriyor ama panelde bunu söyleyen
 * hiçbir şey yoktu: kullanıcı "Mağaza oluşturuldu!" mesajını görüyor, sonra
 * mağazasını listede bulamayınca sitede bir aksaklık olduğunu sanıyordu.
 */
function MagazaDurumBildirimi({ store }: { store: any }) {
  const { toast } = useToast();

  const onayaGonder = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/store/${store.id}/submit`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/my/dashboard"] });
      toast({ title: "Onaya gönderildi", description: "Mağazanız inceleme sırasına alındı." });
    },
    onError: (e: any) => {
      toast({ variant: "destructive", title: "Gönderilemedi", description: e?.message || "Bir sorun oluştu." });
    },
  });

  if (store.status === "active") return null;

  if (store.status === "pending") {
    return (
      <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertTitle>Mağazanız onay bekliyor</AlertTitle>
        <AlertDescription className="text-sm">
          Başvurunuz inceleniyor. Onaylandığında e-posta ve bildirim alacaksınız; mağazanız o
          anda <strong>Mağazalar</strong> sayfasında yayına girer. Bu sırada mağaza bilgilerinizi
          düzenlemeye devam edebilirsiniz.
        </AlertDescription>
      </Alert>
    );
  }

  if (store.status === "draft") {
    return (
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Mağazanız henüz taslak</AlertTitle>
        <AlertDescription className="space-y-3 text-sm">
          <p>Yayına girmesi için mağazanızı incelemeye göndermeniz gerekiyor.</p>
          <Button
            size="sm"
            onClick={() => onayaGonder.mutate()}
            disabled={onayaGonder.isPending}
            data-testid="button-submit-store"
          >
            {onayaGonder.isPending
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <Send className="w-4 h-4 mr-2" />}
            Onaya Gönder
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <Ban className="h-4 w-4" />
      <AlertTitle>
        {store.status === "suspended" ? "Mağazanız askıya alındı" : "Mağazanız yayında değil"}
      </AlertTitle>
      <AlertDescription className="text-sm">
        Mağaza sayfanız şu anda ziyaretçilere görünmüyor. Gerekçe ve sonraki adımlar için{" "}
        <Link href="/iletisim" className="underline font-medium">destek ekibimize yazın</Link>.
      </AlertDescription>
    </Alert>
  );
}

export default function MyStore() {
  const { isAuthenticated, user, isLoading: oturumYukleniyor } = useAuth();

  const { data: myStore, isLoading } = useQuery<any>({
    queryKey: ["/api/store/my/dashboard"],
    // Oturum yokken 401 istemeye gerek yok; boş yere hata üretmesin.
    enabled: isAuthenticated,
  });

  const { data: categories = [] } = useQuery<StoreCategory[]>({
    queryKey: ["/api/store-categories"],
  });

  if (oturumYukleniyor || (isAuthenticated && isLoading)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4 max-w-3xl mx-auto">
          <div className="h-8 w-48 bg-muted rounded mx-auto" />
          <div className="h-4 w-64 bg-muted rounded mx-auto" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Oturum yoksa sihirbazı göstermenin anlamı yok: kullanıcı üç adımı
  // doldurup en sonda 401 alıyordu. Girişten sonra buraya geri döner.
  if (!isAuthenticated) {
    return <GirisGerekli />;
  }

  // E-posta doğrulanmadan mağaza açılamıyor (sunucu da reddediyor). Bunu
  // sihirbazın sonunda değil, en başında söylüyoruz.
  if (user && !user.emailVerified) {
    return <EpostaDogrulamaGerekli email={user.email ?? ""} />;
  }

  const hasStore = !!myStore && !('message' in myStore);

  if (!hasStore) {
    return <StoreCreationWizard categories={categories} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/store/my/dashboard"] })} />;
  }

  return <StoreDashboard store={myStore} categories={categories} />;
}

/** Oturumu olmayan ziyaretçiye mağaza açmanın ne olduğunu da anlatan ekran. */
function GirisGerekli() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-lg">
      <Card>
        <CardHeader className="text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <CardTitle>Mağaza açmak için giriş yapın</CardTitle>
          <CardDescription>
            Mağaza; ilanlarınızın tek bir kurumsal sayfada toplandığı, ziyaretçilerin sizi
            takip edebildiği ücretsiz satıcı profilidir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full h-11" data-testid="button-login-for-store">
            <Link href={`/giris${redirectQuery() || "?redirect=%2Fpanel%2Fmagazam"}`}>
              <LogIn className="w-4 h-4 mr-2" />
              Giriş Yap
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full h-11">
            <Link href={`/kayit${redirectQuery() || "?redirect=%2Fpanel%2Fmagazam"}`}>
              Ücretsiz Kayıt Ol
            </Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground pt-1">
            <Link href="/magazalar" className="underline">Mağazalara göz atın</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/** E-postası doğrulanmamış kullanıcı için kapı. */
function EpostaDogrulamaGerekli({ email }: { email: string }) {
  const { toast } = useToast();

  const tekrarGonder = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/auth/resend-verification", {}),
    onSuccess: () => {
      toast({
        title: "E-posta gönderildi",
        description: "Gelen kutunuzu kontrol edin. Bulamazsanız spam klasörüne de bakın.",
      });
    },
    onError: (e: any) => {
      toast({ variant: "destructive", title: "Gönderilemedi", description: e?.message || "Bir sorun oluştu." });
    },
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-lg">
      <Card>
        <CardHeader className="text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <MailCheck className="w-7 h-7 text-primary" />
          </div>
          <CardTitle>Önce e-postanızı doğrulayın</CardTitle>
          <CardDescription>
            Mağaza herkese açık bir işletme sayfasıdır. Alıcıların güvenini korumak için
            mağaza açmadan önce e-posta adresinizi doğrulamanızı istiyoruz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {email && (
            <p className="text-sm text-center text-muted-foreground break-all">
              Doğrulama bağlantısı <strong className="text-foreground">{email}</strong> adresine gönderildi.
            </p>
          )}
          <Button
            className="w-full h-11"
            onClick={() => tekrarGonder.mutate()}
            disabled={tekrarGonder.isPending}
            data-testid="button-resend-verification"
          >
            {tekrarGonder.isPending
              ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              : <Mail className="w-4 h-4 mr-2" />}
            Doğrulama E-postasını Tekrar Gönder
          </Button>
          <Button asChild variant="outline" className="w-full h-11">
            <Link href="/">Ana Sayfaya Dön</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
