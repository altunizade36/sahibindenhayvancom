import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Gavel, Calendar, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const auctionSchema = z.object({
  listingId: z.string().min(1, "İlan seçimi gerekli"),
  startPrice: z.string().min(1, "Başlangıç fiyatı gerekli").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Geçerli bir fiyat girin"
  ),
  buyNowPrice: z.string().optional(),
  minIncrement: z.string().min(1, "Minimum artış gerekli").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Geçerli bir tutar girin"
  ),
  startTime: z.string().min(1, "Başlangıç zamanı gerekli"),
  endTime: z.string().min(1, "Bitiş zamanı gerekli"),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: "Bitiş zamanı başlangıç zamanından sonra olmalı",
    path: ["endTime"],
  }
);

type AuctionForm = z.infer<typeof auctionSchema>;

export default function AuctionCreatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch user's listings for selection
  const { data: listings } = useQuery<any[]>({
    queryKey: ["/api/listings/my"],
  });

  const form = useForm<AuctionForm>({
    resolver: zodResolver(auctionSchema),
    defaultValues: {
      listingId: "",
      startPrice: "",
      buyNowPrice: "",
      minIncrement: "10",
      startTime: "",
      endTime: "",
    },
  });

  const createAuctionMutation = useMutation({
    mutationFn: async (data: AuctionForm) => {
      return await apiRequest("POST", "/api/auctions", {
        listingId: data.listingId,
        startPrice: parseFloat(data.startPrice),
        buyNowPrice: data.buyNowPrice ? parseFloat(data.buyNowPrice) : null,
        minIncrement: parseFloat(data.minIncrement),
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
        status: new Date(data.startTime) <= new Date() ? "live" : "upcoming",
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Açık Artırma Oluşturuldu!",
        description: "Açık artırmanız başarıyla oluşturuldu.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      setLocation(`/acik-artirma/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Açık artırma oluşturulamadı",
      });
    },
  });

  const onSubmit = (data: AuctionForm) => {
    createAuctionMutation.mutate(data);
  };

  // Set minimum start time to now
  const minStartTime = new Date().toISOString().slice(0, 16);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
          <Gavel className="inline h-8 w-8 mr-2 text-primary" />
          Açık Artırma Oluştur
        </h1>
        <p className="text-muted-foreground">
          İlanınız için açık artırma başlatın
        </p>
      </div>

      <Card data-testid="card-create-auction">
        <CardHeader>
          <CardTitle>Açık Artırma Detayları</CardTitle>
          <CardDescription>
            Açık artırma bilgilerini doldurun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Listing Selection */}
              <FormField
                control={form.control}
                name="listingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İlan Seçin</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-listing">
                          <SelectValue placeholder="İlanınızı seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {listings && listings.length > 0 ? (
                          listings.map((listing) => (
                            <SelectItem key={listing.id} value={listing.id} data-testid={`option-listing-${listing.id}`}>
                              {listing.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-listings" disabled>
                            İlanınız yok
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Açık artırma için bir ilan seçin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Start Price */}
              <FormField
                control={form.control}
                name="startPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Başlangıç Fiyatı (₺)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1000"
                        {...field}
                        data-testid="input-start-price"
                      />
                    </FormControl>
                    <FormDescription>
                      Açık artırmanın başlangıç fiyatı
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Buy Now Price */}
              <FormField
                control={form.control}
                name="buyNowPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hemen Al Fiyatı (₺) - Opsiyonel</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="5000"
                        {...field}
                        data-testid="input-buynow-price"
                      />
                    </FormControl>
                    <FormDescription>
                      Bu fiyattan hemen satın alınabilir
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Minimum Increment */}
              <FormField
                control={form.control}
                name="minIncrement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Artış Tutarı (₺)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="10"
                        {...field}
                        data-testid="input-min-increment"
                      />
                    </FormControl>
                    <FormDescription>
                      Her teklif en az bu kadar artmalı
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Start Time */}
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Başlangıç Zamanı</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        min={minStartTime}
                        {...field}
                        data-testid="input-start-time"
                      />
                    </FormControl>
                    <FormDescription>
                      Açık artırmanın başlayacağı zaman
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Time */}
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bitiş Zamanı</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        min={minStartTime}
                        {...field}
                        data-testid="input-end-time"
                      />
                    </FormControl>
                    <FormDescription>
                      Açık artırmanın sona ereceği zaman
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/acik-artirmalar")}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createAuctionMutation.isPending}
                  data-testid="button-submit"
                >
                  <Gavel className="h-4 w-4 mr-2" />
                  {createAuctionMutation.isPending ? "Oluşturuluyor..." : "Açık Artırma Oluştur"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
