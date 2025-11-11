import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Upload, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import type { Category, Location } from "@shared/schema";

const listingFormSchema = z.object({
  categoryId: z.string().min(1, "Kategori seçiniz"),
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır"),
  description: z.string().min(20, "Açıklama en az 20 karakter olmalıdır"),
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
  isPremium: z.boolean().default(false),
  isUrgent: z.boolean().default(false),
});

type ListingFormData = z.infer<typeof listingFormSchema>;

export default function CreateListing() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");

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
      isPremium: false,
      isUrgent: false,
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch provinces
  const { data: provinces = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations", { type: "il" }],
  });

  // Fetch districts based on selected province
  const { data: districts = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations", { parent: selectedProvince, type: "ilce" }],
    enabled: !!selectedProvince,
  });

  // Fetch neighborhoods based on selected district
  const { data: neighborhoods = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations", { parent: selectedDistrict, type: "mahalle" }],
    enabled: !!selectedDistrict,
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: ListingFormData) => {
      return await apiRequest("POST", "/api/listings", data);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "İlanınız oluşturuldu",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      navigate("/");
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "İlan oluşturulamadı",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ListingFormData) => {
    createListingMutation.mutate(data);
  };

  useEffect(() => {
    if (!user) {
      navigate("/giris");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const totalSteps = 3;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Ana Sayfaya Dön
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>İlan Ver</CardTitle>
          <CardDescription>
            Adım {step} / {totalSteps}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Category & Location */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kategori ve Konum</h3>
                  
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Kategori seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem>
                      <FormLabel>İl *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          setSelectedProvince(value);
                          setSelectedDistrict("");
                          const province = provinces.find(p => p.id === value);
                          form.setValue("city", province?.name || "");
                          form.setValue("district", "");
                        }}
                        value={selectedProvince}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-province">
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
                    </FormItem>

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

                  {neighborhoods.length > 0 && (
                    <FormField
                      control={form.control}
                      name="locationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mahalle (Opsiyonel)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-neighborhood">
                                <SelectValue placeholder="Mahalle seçiniz" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {neighborhoods.map((neighborhood) => (
                                <SelectItem key={neighborhood.id} value={neighborhood.id}>
                                  {neighborhood.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {/* Step 2: Listing Details */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">İlan Detayları</h3>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Başlık *</FormLabel>
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
                            placeholder="İlanınız hakkında detaylı bilgi verin..."
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
                            placeholder="0"
                            data-testid="input-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                          <FormMessage />
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
                          <FormMessage />
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
                              <SelectTrigger data-testid="select-gender">
                                <SelectValue placeholder="Seçiniz" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Erkek">Erkek</SelectItem>
                              <SelectItem value="Dişi">Dişi</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="vaccinated"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <FormLabel>Aşılı</FormLabel>
                          </div>
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
                          <div>
                            <FormLabel>Kısırlaştırılmış</FormLabel>
                          </div>
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
                          <div>
                            <FormLabel>Pedigree</FormLabel>
                          </div>
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
              )}

              {/* Step 3: Options */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Ek Seçenekler</h3>

                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="isPremium"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <FormLabel className="text-base">Premium İlan</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              İlanınız öne çıkacak ve daha fazla görüntülenecek
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-premium"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isUrgent"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <FormLabel className="text-base">Acil İlan</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              İlanınız acil olarak işaretlenecek
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-urgent"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Fotoğraf yükleme özelliği yakında eklenecek
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    data-testid="button-prev-step"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Geri
                  </Button>
                )}
                {step < totalSteps ? (
                  <Button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className="ml-auto"
                    data-testid="button-next-step"
                  >
                    İleri
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={createListingMutation.isPending}
                    className="ml-auto"
                    data-testid="button-submit-listing"
                  >
                    {createListingMutation.isPending ? "Oluşturuluyor..." : "İlan Ver"}
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
