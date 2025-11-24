import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Building2, Plus, Edit, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function MyStore() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const { data: myStore, isLoading } = useQuery<any>({
    queryKey: ["/api/store/my/dashboard"],
  });

  // Fetch store categories
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

  // Recursively flatten categories for select dropdown
  const flattenCategories = (cats: StoreCategory[]): StoreCategory[] => {
    return cats.flatMap(cat => [
      cat,
      ...(cat.children ? flattenCategories(cat.children) : [])
    ]);
  };
  const flatCategories = flattenCategories(categories);

  // Reset form when store data loads
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
    }
  }, [hasStore, myStore, form]);

  const createMutation = useMutation({
    mutationFn: async (data: StoreFormValues) => {
      return apiRequest("/api/store", "POST", data);
    },
    onSuccess: () => {
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
      return apiRequest(`/api/store/${myStore.id}`, "PATCH", data);
    },
    onSuccess: () => {
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
    return <div className="container mx-auto px-4 py-8">Yükleniyor...</div>;
  }

  if (!hasStore) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Mağazanızı Oluşturun
            </CardTitle>
            <CardDescription>
              Profesyonel bir mağaza profili oluşturarak ürünlerinizi sergileyin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayName">Mağaza Adı *</Label>
                  <Input
                    id="displayName"
                    {...form.register("displayName")}
                    placeholder="Örn: PetShop İstanbul"
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
                  <SelectTrigger>
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
                        {cat.depth > 0 ? '└─ ' : ''}
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
                />
              </div>

              <div>
                <Label htmlFor="description">Detaylı Açıklama</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Mağazanız hakkında detaylı bilgi..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Şehir</Label>
                  <Input id="city" {...form.register("city")} placeholder="İstanbul" />
                </div>
                <div>
                  <Label htmlFor="district">İlçe</Label>
                  <Input id="district" {...form.register("district")} placeholder="Kadıköy" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" {...form.register("phone")} placeholder="0555 123 4567" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...form.register("email")} placeholder="info@magaza.com" />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" {...form.register("website")} placeholder="https://magaza.com" />
                {form.formState.errors.website && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.website.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="address">Adres</Label>
                <Textarea id="address" {...form.register("address")} placeholder="Tam adres..." rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Ana Renk</Label>
                  <Input id="primaryColor" type="color" {...form.register("primaryColor")} />
                </div>
                <div>
                  <Label htmlFor="secondaryColor">İkincil Renk</Label>
                  <Input id="secondaryColor" type="color" {...form.register("secondaryColor")} />
                </div>
              </div>

              <Button type="submit" disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Oluşturuluyor..." : "Mağazayı Oluştur"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Existing store view
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="w-8 h-8" />
          Mağazam
        </h1>
        <div className="flex gap-2">
          <Link href={`/magaza/${myStore.slug}`}>
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Mağazayı Görüntüle
            </Button>
          </Link>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Düzenle
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Mağaza Bilgilerini Düzenle</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayName">Mağaza Adı *</Label>
                  <Input id="displayName" {...form.register("displayName")} />
                  {form.formState.errors.displayName && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.displayName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slug">URL (Slug) *</Label>
                  <Input id="slug" {...form.register("slug")} />
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
                  <SelectTrigger>
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
                  <SelectTrigger data-testid="select-store-category-edit">
                    <SelectValue placeholder="Kategori seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kategori Yok</SelectItem>
                    {flatCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {'  '.repeat(cat.depth)}
                        {cat.depth > 0 ? '└─ ' : ''}
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="summary">Kısa Açıklama</Label>
                <Textarea id="summary" {...form.register("summary")} rows={2} />
              </div>

              <div>
                <Label htmlFor="description">Detaylı Açıklama</Label>
                <Textarea id="description" {...form.register("description")} rows={4} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Şehir</Label>
                  <Input id="city" {...form.register("city")} />
                </div>
                <div>
                  <Label htmlFor="district">İlçe</Label>
                  <Input id="district" {...form.register("district")} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" {...form.register("phone")} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...form.register("email")} />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" {...form.register("website")} />
                {form.formState.errors.website && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.website.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="address">Adres</Label>
                <Textarea id="address" {...form.register("address")} rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Ana Renk</Label>
                  <Input id="primaryColor" type="color" {...form.register("primaryColor")} />
                </div>
                <div>
                  <Label htmlFor="secondaryColor">İkincil Renk</Label>
                  <Input id="secondaryColor" type="color" {...form.register("secondaryColor")} />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending}>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>İstatistikler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Toplam İlan</p>
                <p className="text-3xl font-bold">{myStore.stats?.totalListings || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ortalama Puan</p>
                <p className="text-3xl font-bold">{parseFloat(myStore.rating || "0").toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Değerlendirme</p>
                <p className="text-3xl font-bold">{myStore.reviewCount || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Mağaza Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mağaza Adı</p>
                  <p>{myStore.displayName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Durum</p>
                  <p className="capitalize">{myStore.status}</p>
                </div>
              </div>
              {myStore.summary && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Kısa Açıklama</p>
                  <p className="text-sm">{myStore.summary}</p>
                </div>
              )}
              {myStore.city && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Konum</p>
                  <p className="text-sm">{myStore.city}{myStore.district ? `, ${myStore.district}` : ""}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
