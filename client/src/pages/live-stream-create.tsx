import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Radio, AlertCircle, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

const streamSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalı").max(100, "Başlık en fazla 100 karakter olabilir"),
  description: z.string().max(500, "Açıklama en fazla 500 karakter olabilir").optional(),
  listingId: z.string().optional(),
  scheduledFor: z.string().optional(),
});

type StreamForm = z.infer<typeof streamSchema>;

export default function LiveStreamCreatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch user's listings for optional linking
  const { data: listings } = useQuery<any[]>({
    queryKey: ["/api/listings/my"],
  });

  const form = useForm<StreamForm>({
    resolver: zodResolver(streamSchema),
    defaultValues: {
      title: "",
      description: "",
      listingId: "",
      scheduledFor: "",
    },
  });

  const createStreamMutation = useMutation({
    mutationFn: async (data: StreamForm) => {
      return await apiRequest("POST", "/api/streams", {
        title: data.title,
        description: data.description || null,
        listingId: data.listingId || null,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor).toISOString() : null,
        status: data.scheduledFor ? "scheduled" : "live",
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Yayın Oluşturuldu!",
        description: "Canlı yayınınız başarıyla oluşturuldu.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/streams"] });
      setLocation(`/canli-yayin/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Yayın oluşturulamadı",
      });
    },
  });

  const onSubmit = (data: StreamForm) => {
    createStreamMutation.mutate(data);
  };

  const minScheduledTime = new Date().toISOString().slice(0, 16);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
          <Radio className="inline h-8 w-8 mr-2 text-primary" />
          Canlı Yayın Başlat
        </h1>
        <p className="text-muted-foreground">
          Yeni bir canlı yayın oluşturun
        </p>
      </div>

      <Alert className="mb-6 bg-blue-500/10 border-blue-500">
        <Sparkles className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-500">
          <strong>Yakında Gelecek!</strong> Canlı yayın oluşturma özelliği şu anda geliştirme aşamasında. 
          Entegrasyon tamamlandığında aktif olacak.
        </AlertDescription>
      </Alert>

      <Card data-testid="card-create-stream">
        <CardHeader>
          <CardTitle>Yayın Detayları</CardTitle>
          <CardDescription>
            Canlı yayın bilgilerini doldurun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yayın Başlığı</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ör: Kedilerle İlgili Canlı Soru-Cevap"
                        {...field}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormDescription>
                      Yayınınız için çekici bir başlık seçin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama (Opsiyonel)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Yayınınız hakkında kısa bir açıklama..."
                        {...field}
                        data-testid="input-description"
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription>
                      Yayınınızda ne yapacağınızı açıklayın
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Listing Selection */}
              <FormField
                control={form.control}
                name="listingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İlan Bağlantısı (Opsiyonel)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-listing">
                          <SelectValue placeholder="İlan seçin (opsiyonel)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">İlan bağlama</SelectItem>
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
                      Yayınınızı bir ilanınızla ilişkilendirin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Scheduled Time */}
              <FormField
                control={form.control}
                name="scheduledFor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planlanan Başlangıç (Opsiyonel)</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        min={minScheduledTime}
                        {...field}
                        data-testid="input-scheduled-time"
                      />
                    </FormControl>
                    <FormDescription>
                      Boş bırakırsanız yayın hemen başlar
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/canli-yayinlar")}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createStreamMutation.isPending}
                  data-testid="button-submit"
                >
                  <Radio className="h-4 w-4 mr-2" />
                  {createStreamMutation.isPending ? "Oluşturuluyor..." : "Yayın Oluştur"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
