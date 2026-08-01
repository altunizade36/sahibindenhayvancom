import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, CheckCircle, Mail, Phone, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useBotTrap } from "@/lib/bot-trap";

const contactFormSchema = z.object({
  senderName: z.string().min(2, "İsim en az 2 karakter olmalı"),
  senderEmail: z.string().email("Geçerli bir e-posta adresi girin"),
  senderPhone: z.string().optional(),
  message: z.string().min(10, "Mesaj en az 10 karakter olmalı").max(1000, "Mesaj en fazla 1000 karakter olabilir"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface GuestContactFormProps {
  listingId: string;
  listingTitle: string;
  sellerName?: string;
}


export function GuestContactForm({ listingId, listingTitle, sellerName }: GuestContactFormProps) {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  // reCAPTCHA kaldırıldı; yerine kullanıcının fark etmediği bal küpü +
  // form doldurma süresi kontrolü kullanılıyor.
  const { BotTrapField, botFields } = useBotTrap();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      senderName: "",
      senderEmail: "",
      senderPhone: "",
      message: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await apiRequest("POST", "/api/contact-requests", {
        ...data,
        listingId,
        ...botFields(),
      });

      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Mesajınız Gönderildi",
        description: "Satıcı en kısa sürede sizinle iletişime geçecektir.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Mesaj gönderilemedi. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    submitMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Mesajınız Gönderildi!</h3>
          <p className="text-muted-foreground">
            Satıcı en kısa sürede sizinle iletişime geçecektir.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setIsSubmitted(false);
              form.reset();
            }}
            data-testid="button-send-another-message"
          >
            Başka Bir Mesaj Gönder
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Satıcıya Mesaj Gönder
        </CardTitle>
        <CardDescription>
          {sellerName ? `${sellerName} ile iletişime geçin` : "Giriş yapmadan satıcıya mesaj gönderin"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <BotTrapField />
            <FormField
              control={form.control}
              name="senderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Adınız
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Adınızı girin" 
                      {...field} 
                      data-testid="input-sender-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="senderEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    E-posta Adresiniz
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="ornek@email.com" 
                      {...field} 
                      data-testid="input-sender-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="senderPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Telefon (İsteğe Bağlı)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="05XX XXX XX XX" 
                      {...field} 
                      data-testid="input-sender-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mesajınız</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`"${listingTitle}" hakkında soru veya teklifinizi yazın...`}
                      className="min-h-[120px] resize-none"
                      {...field}
                      data-testid="input-message"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={submitMutation.isPending}
              data-testid="button-send-contact-message"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Mesaj Gönder
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Bu site reCAPTCHA ile korunmaktadır. Google{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                Gizlilik Politikası
              </a>{" "}
              ve{" "}
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">
                Hizmet Koşulları
              </a>{" "}
              geçerlidir.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
