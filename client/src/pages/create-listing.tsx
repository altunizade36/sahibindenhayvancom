import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useSearch } from "wouter";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { AuthGate } from "@/components/auth-gate";
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
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, ArrowRight, Upload, X, ImagePlus, Loader2, Check, 
  GripVertical, Star, ExternalLink, AlertTriangle, FileText, Video,
  Save, Eye, Trash2, Plus
} from "lucide-react";
import { Link } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import type { Location, Listing } from "@shared/schema";
import { AGE_CATEGORIES, GENDER_OPTIONS, HEALTH_STATUS_OPTIONS, CHARACTER_TRAITS } from "@shared/listing-options";

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children: CategoryNode[];
}

interface UploadedDocument {
  id: string;
  documentType: string;
  documentUrl: string;
  documentNumber?: string;
  status: string;
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
  ageCategory: z.string().optional(),
  gender: z.string().optional(),
  healthStatus: z.string().optional(),
  vaccinated: z.boolean().default(false),
  neutered: z.boolean().default(false),
  pedigree: z.boolean().default(false),
  characterTraits: z.array(z.string()).default([]),
  locationId: z.string().optional(),
  city: z.string().min(1, "İl seçiniz"),
  district: z.string().min(1, "İlçe seçiniz"),
  images: z.array(z.string()).default([]),
  videoUrls: z.array(z.string()).default([]),
  deliveryInfo: z.string().optional(),
  warrantyInfo: z.string().optional(),
  acceptListingRules: z.boolean().refine((val) => val === true, {
    message: "İlan kurallarını kabul etmeniz gerekmektedir",
  }),
  acceptAnimalLaws: z.boolean().refine((val) => val === true, {
    message: "Hayvan hakları beyanını onaylamanız gerekmektedir",
  }),
  hasRequiredDocuments: z.boolean().refine((val) => val === true, {
    message: "Gerekli belgelere sahip olduğunuzu onaylamanız gerekmektedir",
  }),
});

type ListingFormData = z.infer<typeof listingFormSchema>;

const DOCUMENT_TYPES = [
  { value: "microchip", label: "Mikroçip Belgesi" },
  { value: "passport", label: "Hayvan Pasaportu" },
  { value: "vaccination", label: "Aşı Kartı" },
  { value: "health_certificate", label: "Veteriner Sağlık Raporu" },
  { value: "pedigree", label: "Soy Belgesi (Pedigree)" },
  { value: "cites", label: "CITES Belgesi" },
  { value: "turkvet", label: "TÜRKVET Kayıt Belgesi" },
  { value: "ear_tag", label: "Kulak Küpesi Belgesi" },
  { value: "transport", label: "Nakil Belgesi" },
  { value: "breeding_permit", label: "Yetiştiricilik Belgesi" },
  { value: "other", label: "Diğer" },
];

const getCategoryType = (categorySlug: string | null): 'pet' | 'livestock' | 'bird' | 'fish' | 'other' => {
  if (!categorySlug) return 'other';
  if (categorySlug.includes('kopek') || categorySlug.includes('kedi')) return 'pet';
  if (categorySlug.includes('buyukbas') || categorySlug.includes('kucukbas') || categorySlug.includes('ciftlik')) return 'livestock';
  if (categorySlug.includes('kus') || categorySlug.includes('papagan')) return 'bird';
  if (categorySlug.includes('balik') || categorySlug.includes('akvaryum')) return 'fish';
  return 'other';
};

export default function CreateListing() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { user } = useAuth();
  const { ready, isLoading: authLoading } = useRequireAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [coverIndex, setCoverIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const totalSteps = 3;

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      categoryId: "",
      title: "",
      description: "",
      price: "",
      breed: "",
      age: "",
      ageCategory: "",
      gender: "",
      healthStatus: "",
      vaccinated: false,
      neutered: false,
      pedigree: false,
      characterTraits: [],
      city: "",
      district: "",
      images: [],
      videoUrls: [],
      deliveryInfo: "",
      warrantyInfo: "",
      acceptListingRules: false,
      acceptAnimalLaws: false,
      hasRequiredDocuments: false,
    },
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

  const getSelectedCategorySlug = (): string | null => {
    if (!selectedMainCategory) return null;
    const mainCat = categoryTree.find(cat => cat.id === selectedMainCategory);
    if (!mainCat) return null;
    if (selectedSubCategory) {
      const findSubCat = (children: CategoryNode[]): CategoryNode | null => {
        for (const child of children) {
          if (child.id === selectedSubCategory) return child;
          if (child.children?.length > 0) {
            const found = findSubCat(child.children);
            if (found) return found;
          }
        }
        return null;
      };
      const subCat = findSubCat(mainCat.children || []);
      return subCat?.slug || mainCat.slug;
    }
    return mainCat.slug;
  };

  const selectedCategorySlug = getSelectedCategorySlug();
  const categoryType = getCategoryType(selectedCategorySlug);

  interface DocumentRequirement {
    id: string;
    categorySlug: string;
    documentType: string;
    requirement: 'required' | 'recommended' | 'optional';
    description: string | null;
    legalReference: string | null;
    penaltyInfo: string | null;
  }

  interface CategoryRestriction {
    id: string;
    categorySlug: string;
    restrictionType: string;
    reason: string;
    legalReference: string | null;
    penaltyAmount: string | null;
    effectiveDate: string | null;
    isActive: boolean;
  }

  interface DocumentRequirementsResponse {
    requirements: DocumentRequirement[];
    restrictions: CategoryRestriction[];
    categorySlug: string;
  }

  const { data: documentRequirements } = useQuery<DocumentRequirementsResponse>({
    queryKey: ['/api/categories', selectedCategorySlug, 'document-requirements'],
    queryFn: async () => {
      if (!selectedCategorySlug) return null;
      const response = await fetch(`/api/categories/${selectedCategorySlug}/document-requirements`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!selectedCategorySlug && selectedCategorySlug.length > 0,
  });

  const hasBlockingRestriction = documentRequirements?.restrictions.some(
    r => r.restrictionType === 'banned' || r.restrictionType === 'individual_only'
  );

  const requiredDocuments = documentRequirements?.requirements.filter(
    r => r.requirement === 'required'
  ) || [];

  const recommendedDocuments = documentRequirements?.requirements.filter(
    r => r.requirement === 'recommended'
  ) || [];

  const getDocumentTypeName = (type: string): string => {
    const doc = DOCUMENT_TYPES.find(d => d.value === type);
    return doc?.label || type;
  };

  const createDraftMutation = useMutation({
    mutationFn: async (data: Partial<ListingFormData>) => {
      return await apiRequest("POST", "/api/listings/draft", data);
    },
    onSuccess: (response: any) => {
      setDraftId(response.listing.id);
      setLastSaved(new Date());
    },
  });

  const updateDraftMutation = useMutation({
    mutationFn: async (data: Partial<ListingFormData>) => {
      if (!draftId) throw new Error("No draft ID");
      return await apiRequest("PATCH", `/api/listings/${draftId}/draft`, data);
    },
    onSuccess: () => {
      setLastSaved(new Date());
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!draftId) throw new Error("No draft ID");
      const recaptchaToken = await getRecaptchaToken('PUBLISH_LISTING');
      return await apiRequest("POST", `/api/listings/${draftId}/publish`, { recaptchaToken });
    },
    onSuccess: (response: any) => {
      toast({
        title: "Başarılı!",
        description: response?.message || "İlanınız yayınlandı!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "İlan yayınlanamadı",
        variant: "destructive",
      });
    },
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: ListingFormData) => {
      const recaptchaToken = await getRecaptchaToken('CREATE_LISTING');
      const orderedImages = uploadedImages.length > 0 
        ? [uploadedImages[coverIndex], ...uploadedImages.filter((_, i) => i !== coverIndex)]
        : [];
      return await apiRequest("POST", "/api/listings", {
        ...data,
        images: orderedImages,
        videoUrls,
        characterTraits: selectedTraits,
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

  const saveDraft = useCallback(async () => {
    const formData = form.getValues();
    const data = {
      ...formData,
      images: uploadedImages,
      videoUrls,
      characterTraits: selectedTraits,
    };

    setSavingDraft(true);
    try {
      if (draftId) {
        await updateDraftMutation.mutateAsync(data);
      } else {
        await createDraftMutation.mutateAsync(data);
      }
      toast({
        title: "Taslak kaydedildi",
        description: "İlanınız taslak olarak kaydedildi.",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Taslak kaydedilemedi",
        variant: "destructive",
      });
    } finally {
      setSavingDraft(false);
    }
  }, [form, uploadedImages, videoUrls, selectedTraits, draftId, updateDraftMutation, createDraftMutation, toast]);

  const handleImageUpload = useCallback(async (files: FileList) => {
    if (uploadedImages.length + files.length > 10) {
      toast({
        title: "Hata",
        description: "En fazla 10 fotoğraf yükleyebilirsiniz",
        variant: "destructive",
      });
      return;
    }

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Hata", description: `${file.name} bir resim dosyası değil`, variant: "destructive" });
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Hata", description: `${file.name} 10MB'dan büyük olamaz`, variant: "destructive" });
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploadingImages(true);
    try {
      const formData = new FormData();
      validFiles.forEach(file => formData.append('images', file));
      
      const uploadResponse = await fetch('/api/listing-images/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        const newUrls = result.images.map((img: any) => img.thumbnailUrl || img.originalUrl);
        setUploadedImages(prev => [...prev, ...newUrls]);
        toast({ title: "Başarılı", description: result.message });
      } else {
        const error = await uploadResponse.json();
        toast({ title: "Yükleme Hatası", description: error.message || "Fotoğraflar yüklenemedi", variant: "destructive" });
      }
    } catch {
      toast({ title: "Hata", description: "Fotoğraf yüklenirken bir hata oluştu", variant: "destructive" });
    } finally {
      setUploadingImages(false);
    }
  }, [uploadedImages, toast]);

  const handleDocumentUpload = useCallback(async (file: File, documentType: string, documentNumber?: string) => {
    if (!draftId) {
      toast({ title: "Uyarı", description: "Önce ilanınızı taslak olarak kaydedin", variant: "destructive" });
      return;
    }

    setUploadingDocument(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      if (documentNumber) formData.append('documentNumber', documentNumber);

      const response = await fetch(`/api/listings/${draftId}/documents`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setUploadedDocuments(prev => [...prev, result.document]);
        toast({ title: "Başarılı", description: "Belge yüklendi" });
      } else {
        const error = await response.json();
        toast({ title: "Hata", description: error.message || "Belge yüklenemedi", variant: "destructive" });
      }
    } catch {
      toast({ title: "Hata", description: "Belge yüklenirken bir hata oluştu", variant: "destructive" });
    } finally {
      setUploadingDocument(false);
    }
  }, [draftId, toast]);

  const removeImage = (index: number) => {
    setUploadedImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      if (newImages.length === 0) setCoverIndex(0);
      else if (index === coverIndex) setCoverIndex(0);
      else if (index < coverIndex) setCoverIndex(coverIndex - 1);
      return newImages;
    });
  };

  const addVideoUrl = () => {
    if (!videoUrl.trim()) return;
    const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/.+$/;
    if (!urlPattern.test(videoUrl)) {
      toast({ title: "Hata", description: "Geçerli bir YouTube veya Vimeo linki giriniz", variant: "destructive" });
      return;
    }
    if (videoUrls.length >= 3) {
      toast({ title: "Hata", description: "En fazla 3 video ekleyebilirsiniz", variant: "destructive" });
      return;
    }
    setVideoUrls(prev => [...prev, videoUrl]);
    setVideoUrl("");
  };

  const removeVideoUrl = (index: number) => {
    setVideoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      handleImageUpload(e.dataTransfer.files);
    }
  }, [handleImageUpload]);

  const onSubmit = (data: ListingFormData) => {
    if (draftId) {
      publishMutation.mutate();
    } else {
      createListingMutation.mutate({
        ...data,
        images: uploadedImages,
        videoUrls,
      });
    }
  };

  useEffect(() => {
    if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
      loadRecaptchaScript().catch(() => {});
    }
  }, []);

  // Oturum yüklenmeden yönlendirme yapılmaz (bkz. useRequireAuth)
  if (!ready) return <AuthGate isLoading={authLoading} />;
  // ready true iken user daima dolu; bu satır yalnızca TypeScript daraltması için
  if (!user) return null;

  const canProceedStep1 = form.watch("categoryId") && form.watch("city") && form.watch("district");
  const canProceedStep2 = form.watch("title") && form.watch("description") && form.watch("price");
  const canSubmit = form.watch("acceptListingRules") && form.watch("acceptAnimalLaws") && form.watch("hasRequiredDocuments");

  const progressPercent = (step / totalSteps) * 100;

  return (
    <div className="container max-w-4xl mx-auto py-4 md:py-8 px-3 md:px-4">
      <div className="mb-4 md:mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="-ml-2" data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span className="text-sm">Geri</span>
        </Button>
        
        {lastSaved && (
          <span className="text-xs text-muted-foreground">
            Son kayıt: {lastSaved.toLocaleTimeString('tr-TR')}
          </span>
        )}
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg md:text-xl">Ücretsiz İlan Ver</CardTitle>
              <CardDescription className="text-sm">
                Adım {step} / {totalSteps} - {
                  step === 1 ? "Kategori ve Konum" : 
                  step === 2 ? "İlan Detayları ve Medya" : 
                  "Belgeler ve Önizleme"
                }
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={saveDraft}
              disabled={savingDraft}
              data-testid="button-save-draft"
            >
              {savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline ml-1.5">Taslak Kaydet</span>
            </Button>
          </div>
          
          <Progress value={progressPercent} className="mt-3 md:mt-4 h-2" />
          
          <div className="flex gap-2 mt-3">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => s < step && setStep(s)}
                disabled={s > step}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                  s === step 
                    ? "bg-primary text-primary-foreground" 
                    : s < step 
                      ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30" 
                      : "bg-muted text-muted-foreground"
                }`}
                data-testid={`step-indicator-${s}`}
              >
                {s === 1 ? "Kategori" : s === 2 ? "Detaylar" : "Belgeler"}
              </button>
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
                            <SelectTrigger className="h-11" data-testid="select-main-category">
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
                                <SelectTrigger className="h-11" data-testid="select-sub-category">
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

                  {/* Document Requirements Alerts */}
                  {selectedCategorySlug && documentRequirements && (documentRequirements.requirements.length > 0 || documentRequirements.restrictions.length > 0) && (
                    <div className="space-y-3" data-testid="document-requirements-section">
                      {documentRequirements.restrictions.length > 0 && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <p className="font-semibold">Yasal Uyarı</p>
                              {documentRequirements.restrictions.map((restriction, idx) => (
                                <div key={idx} className="text-sm">
                                  <p>{restriction.reason}</p>
                                  {restriction.legalReference && (
                                    <p className="text-xs opacity-80 mt-1">Dayanak: {restriction.legalReference}</p>
                                  )}
                                  {restriction.penaltyAmount && (
                                    <p className="text-xs font-medium mt-1">Ceza: {restriction.penaltyAmount}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {requiredDocuments.length > 0 && (
                        <Alert className="border-primary/50 bg-primary/5">
                          <FileText className="h-4 w-4 text-primary" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <p className="font-semibold text-primary">Zorunlu Belgeler</p>
                              <ul className="list-disc pl-4 space-y-1 text-sm">
                                {requiredDocuments.map((doc, idx) => (
                                  <li key={idx}>
                                    <span className="font-medium">{getDocumentTypeName(doc.documentType)}</span>
                                    {doc.description && <span className="text-muted-foreground"> - {doc.description}</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {recommendedDocuments.length > 0 && (
                        <Alert className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
                          <AlertDescription>
                            <div className="space-y-2">
                              <p className="font-semibold text-yellow-700 dark:text-yellow-400">Önerilen Belgeler</p>
                              <ul className="list-disc pl-4 space-y-1 text-sm">
                                {recommendedDocuments.map((doc, idx) => (
                                  <li key={idx}>
                                    <span className="font-medium">{getDocumentTypeName(doc.documentType)}</span>
                                    {doc.description && <span className="text-muted-foreground"> - {doc.description}</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

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
                                <SelectTrigger className="h-11" data-testid="select-province">
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
                                <SelectTrigger className="h-11" data-testid="select-district">
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

              {/* Step 2: Listing Details & Media */}
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
                            <Input {...field} placeholder="Örn: Satılık Golden Retriever Yavrusu" data-testid="input-title" />
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
                            <Textarea {...field} placeholder="Hayvanınız hakkında detaylı bilgi verin..." rows={5} data-testid="textarea-description" />
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
                            <Input {...field} type="number" min="0" placeholder="0" data-testid="input-price" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>


                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-base md:text-lg font-semibold">Hayvan Özellikleri</h3>
                    
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
                        name="ageCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Yaş Kategorisi</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11" data-testid="select-age-category">
                                  <SelectValue placeholder="Seçiniz" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {AGE_CATEGORIES.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                                <SelectTrigger className="h-11" data-testid="select-gender">
                                  <SelectValue placeholder="Seçiniz" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {GENDER_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
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
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11" data-testid="select-health-status">
                                  <SelectValue placeholder="Seçiniz" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {HEALTH_STATUS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-vaccinated" />
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
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-neutered" />
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
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-pedigree" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <FormLabel>Karakter Özellikleri</FormLabel>
                      <p className="text-xs text-muted-foreground">En fazla 5 özellik seçin</p>
                      <div className="flex flex-wrap gap-2">
                        {CHARACTER_TRAITS.map((trait) => {
                          const isSelected = selectedTraits.includes(trait.value);
                          return (
                            <Badge
                              key={trait.value}
                              variant={isSelected ? "default" : "outline"}
                              className={`cursor-pointer transition-all px-3 py-1.5 text-sm ${isSelected ? "bg-primary" : ""}`}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedTraits(prev => prev.filter(t => t !== trait.value));
                                } else if (selectedTraits.length < 5) {
                                  setSelectedTraits(prev => [...prev, trait.value]);
                                }
                              }}
                              data-testid={`badge-trait-${trait.value}`}
                            >
                              {isSelected && <Check className="w-3 h-3 mr-1" />}
                              {trait.label}
                            </Badge>
                          );
                        })}
                      </div>
                      {selectedTraits.length > 0 && (
                        <p className="text-xs text-muted-foreground">{selectedTraits.length}/5 seçildi</p>
                      )}
                    </div>
                  </div>

                  {/* Photos Section */}
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-base md:text-lg font-semibold">Fotoğraflar</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">En fazla 10 fotoğraf yükleyebilirsiniz.</p>
                    
                    {uploadedImages.length === 0 && (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative block w-full p-6 md:p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                          isDragging ? "border-primary bg-primary/10" : "border-primary/30 hover:border-primary/60 bg-primary/5"
                        }`}
                        data-testid="dropzone-images"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                          disabled={uploadingImages}
                          data-testid="input-image-upload"
                        />
                        <div className="flex flex-col items-center justify-center text-center pointer-events-none">
                          {uploadingImages ? (
                            <>
                              <Loader2 className="w-10 h-10 text-primary animate-spin mb-2" />
                              <span className="text-base font-medium text-primary">Yükleniyor...</span>
                            </>
                          ) : (
                            <>
                              <Upload className={`w-10 h-10 mb-2 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                              <span className="text-base font-medium">Fotoğraf Yükle</span>
                              <span className="text-xs text-muted-foreground mt-1">Sürükleyin veya tıklayın</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {uploadedImages.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{uploadedImages.length}/10 fotoğraf</span>
                          {uploadedImages.length < 10 && (
                            <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                                disabled={uploadingImages}
                              />
                              {uploadingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                              Daha Fazla Ekle
                            </label>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 md:gap-3">
                          {uploadedImages.map((url, index) => (
                            <div 
                              key={index} 
                              className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                index === coverIndex ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                              }`}
                            >
                              <img src={url} alt={`Fotoğraf ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                data-testid={`button-remove-image-${index}`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                              {index === coverIndex ? (
                                <div className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-xs text-center py-1 font-medium flex items-center justify-center gap-1">
                                  <Star className="w-3 h-3 fill-current" />
                                  Kapak
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setCoverIndex(index)}
                                  className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                                  data-testid={`button-set-cover-${index}`}
                                >
                                  <Star className="w-3 h-3 mr-1 inline" />
                                  Kapak Yap
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Video Section */}
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                      <Video className="w-5 h-5" />
                      Video Linkleri (Opsiyonel)
                    </h3>
                    <p className="text-xs text-muted-foreground">YouTube veya Vimeo linklerini ekleyebilirsiniz.</p>
                    
                    <div className="flex gap-2">
                      <Input
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="flex-1"
                        data-testid="input-video-url"
                      />
                      <Button type="button" onClick={addVideoUrl} variant="outline" size="icon" data-testid="button-add-video">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {videoUrls.length > 0 && (
                      <div className="space-y-2">
                        {videoUrls.map((url, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                            <Video className="w-4 h-4 text-muted-foreground" />
                            <span className="flex-1 text-sm truncate">{url}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeVideoUrl(index)}
                              data-testid={`button-remove-video-${index}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Documents & Final Review */}
              {step === 3 && (
                <div className="space-y-5 md:space-y-6">
                  {/* Document Upload Section */}
                  {draftId && (
                    <div className="space-y-3 md:space-y-4">
                      <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Belgeler
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Aşı kartı, sağlık raporu, soy belgesi gibi belgeleri yükleyebilirsiniz.
                      </p>

                      {uploadedDocuments.length > 0 && (
                        <div className="space-y-2">
                          {uploadedDocuments.map((doc) => (
                            <div key={doc.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                              <FileText className="w-5 h-5 text-primary" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{getDocumentTypeName(doc.documentType)}</p>
                                {doc.documentNumber && <p className="text-xs text-muted-foreground">No: {doc.documentNumber}</p>}
                              </div>
                              <Badge variant={doc.status === 'verified' ? 'default' : 'secondary'}>
                                {doc.status === 'verified' ? 'Onaylı' : 'Beklemede'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-4 border-2 border-dashed rounded-lg">
                        <p className="text-sm font-medium mb-3">Yeni Belge Yükle</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Select>
                            <SelectTrigger data-testid="select-document-type">
                              <SelectValue placeholder="Belge türü seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {DOCUMENT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <label className="flex items-center justify-center gap-2 h-10 px-4 border rounded-md cursor-pointer hover:bg-accent">
                            <input type="file" accept=".pdf,image/*" className="hidden" disabled={uploadingDocument} />
                            {uploadingDocument ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            <span className="text-sm">Dosya Seç</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {!draftId && (
                    <Alert>
                      <AlertDescription>
                        Belge yüklemek için önce ilanınızı "Taslak Kaydet" butonu ile kaydedin.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Delivery & Warranty Info */}
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-base md:text-lg font-semibold">Ek Bilgiler (Opsiyonel)</h3>
                    
                    <FormField
                      control={form.control}
                      name="deliveryInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teslimat Bilgisi</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Teslimat şartları, nakliye bilgisi..." rows={3} data-testid="textarea-delivery" />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="warrantyInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Garanti Bilgisi</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Sağlık garantisi, iade şartları..." rows={3} data-testid="textarea-warranty" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Legal Agreements */}
                  <div className="space-y-4 pt-4 border-t">
                    <p className="text-sm font-medium">Yasal Onaylar ve Beyanlar</p>
                    
                    <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                        5199 sayılı Hayvanları Koruma Kanunu ve 5996 sayılı Veteriner Hizmetleri Kanunu gereğince, 
                        satışa sunulan hayvanların sağlık belgesi, aşı kartı ve gerekli belgelere sahip olması zorunludur.
                      </AlertDescription>
                    </Alert>

                    <FormField
                      control={form.control}
                      name="acceptListingRules"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-accept-listing-rules" />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              <Link href="/ilan-kurallari" className="text-primary hover:underline inline-flex items-center gap-1" target="_blank">
                                İlan Kuralları <ExternalLink className="w-3 h-3" />
                              </Link>
                              'nı okudum ve uyacağımı taahhüt ediyorum.
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="acceptAnimalLaws"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-accept-animal-laws" />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              5199 sayılı Hayvanları Koruma Kanunu ve ilgili yönetmeliklere uygun hareket edeceğimi beyan ederim.
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hasRequiredDocuments"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-has-required-documents" />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              İlanladığım hayvanın tüm yasal belgelerine sahip olduğumu ve alıcıya teslim edeceğimi beyan ederim.
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between gap-3 pt-4 md:pt-6 border-t">
                {step > 1 ? (
                  <Button type="button" variant="outline" className="h-10 md:h-11" onClick={() => setStep(step - 1)} data-testid="button-prev-step">
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
                    disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
                    data-testid="button-next-step"
                  >
                    Devam
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="h-10 md:h-11 min-w-[140px]"
                    disabled={createListingMutation.isPending || publishMutation.isPending || !canSubmit}
                    data-testid="button-submit-listing"
                  >
                    {createListingMutation.isPending || publishMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span className="hidden xs:inline">Yayınlanıyor...</span>
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
