import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Video, CalendarClock } from "lucide-react";
import type { Listing } from "@shared/schema";

const streamFormSchema = z.object({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır"),
  description: z.string().optional(),
  listingId: z.string().optional(),
  scheduledFor: z.string().optional(),
});

type StreamFormData = z.infer<typeof streamFormSchema>;

export default function CreateStream() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<StreamFormData>({
    resolver: zodResolver(streamFormSchema),
    defaultValues: {
      title: "",
      description: "",
      listingId: "",
      scheduledFor: "",
    },
  });

  // Fetch user's listings
  const { data: userListings = [] } = useQuery<Listing[]>({
    queryKey: ["/api/listings/mine"],
    enabled: !!user,
  });

  const createStreamMutation = useMutation({
    mutationFn: async (data: StreamFormData) => {
      // Generate a unique channel name
      const channelName = `stream_${user!.id}_${Date.now()}`;
      
      const payload = {
        title: data.title,
        description: data.description || null,
        listingId: data.listingId && data.listingId !== "none" ? data.listingId : null,
        channelName,
        status: data.scheduledFor ? "scheduled" : "upcoming",
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor).toISOString() : null,
      };

      return await apiRequest("/api/streams", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (stream) => {
      toast({
        title: "Canlı yayın oluşturuldu!",
        description: "Yayınınızı başlatmak için kontrol paneline yönlendiriliyorsunuz.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/streams"] });
      navigate(`/yayin/${stream.id}/kontrol`);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error instanceof Error ? error.message : "Yayın oluşturulamadı",
      });
    },
  });

  const onSubmit = (data: StreamFormData) => {
    createStreamMutation.mutate(data);
  };

  if (!user) {
    navigate("/giris");
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Video className="h-8 w-8" />
          Canlı Yayın Başlat
        </h1>
        <p className="text-muted-foreground mt-2">
          Hayvanlarınızı canlı yayınla tanıtın, soru-cevap yapın
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yayın Bilgileri</CardTitle>
          <CardDescription>
            Canlı yayınınız için gerekli bilgileri doldurun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yayın Başlığı *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Örn: Golden Retriever Yavruları Canlı Yayın"
                        data-testid="input-stream-title"
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
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Yayınınız hakkında kısa bir açıklama..."
                        rows={4}
                        data-testid="textarea-stream-description"
                      />
                    </FormControl>
                    <FormDescription>
                      İzleyicilere yayınınızda neler görecekleri hakkında bilgi verin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="listingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bağlantılı İlan (Opsiyonel)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-listing">
                          <SelectValue placeholder="İlan seçiniz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">İlan bağlanmayacak</SelectItem>
                        {userListings.map((listing) => (
                          <SelectItem key={listing.id} value={listing.id}>
                            {listing.title} - ₺{Number(listing.price).toLocaleString("tr-TR")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Yayınınızı bir ilanınıza bağlayarak daha fazla ilgi çekebilirsiniz
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledFor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" />
                      Zamanlama (Opsiyonel)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                        data-testid="input-scheduled-time"
                      />
                    </FormControl>
                    <FormDescription>
                      Yayınınızı ileri bir tarihe planlayabilirsiniz
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/canli-yayinlar")}
                  data-testid="button-cancel"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={createStreamMutation.isPending}
                  data-testid="button-create-stream"
                >
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
