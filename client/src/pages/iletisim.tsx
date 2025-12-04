import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/seo-head";

const contactSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Konu seçin"),
  message: z.string().min(10, "Mesaj en az 10 karakter olmalı").max(2000, "Mesaj en fazla 2000 karakter olabilir"),
});

type ContactForm = z.infer<typeof contactSchema>;

const subjects = [
  { value: "general", label: "Genel Soru" },
  { value: "account", label: "Hesap Sorunu" },
  { value: "listing", label: "İlan Sorunu" },
  { value: "report", label: "Şikayet / İhbar" },
  { value: "partnership", label: "İş Birliği Teklifi" },
  { value: "suggestion", label: "Öneri" },
  { value: "other", label: "Diğer" },
];

export default function Iletisim() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const res = await apiRequest("POST", "/api/contact", data);
      return res.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Mesajınız Alındı",
        description: "En kısa sürede size dönüş yapacağız.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Mesaj gönderilemedi. Lütfen tekrar deneyin.",
      });
    },
  });

  const onSubmit = (data: ContactForm) => {
    contactMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="İletişim | sahibindenhayvan.com"
        description="Sorularınız, önerileriniz veya şikayetleriniz için bizimle iletişime geçin."
      />
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <Mail className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold mb-2" data-testid="text-contact-title">İletişim</h1>
            <p className="text-muted-foreground">
              Sorularınız, önerileriniz veya şikayetleriniz için bizimle iletişime geçebilirsiniz.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Bize Yazın</CardTitle>
                  <CardDescription>
                    Formu doldurarak mesajınızı bize iletin. En kısa sürede yanıt vereceğiz.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                      <h3 className="text-xl font-semibold mb-2">Mesajınız Alındı!</h3>
                      <p className="text-muted-foreground mb-4">
                        Talebiniz ekibimize iletildi. En kısa sürede size dönüş yapacağız.
                      </p>
                      <Button onClick={() => setIsSubmitted(false)} variant="outline">
                        Yeni Mesaj Gönder
                      </Button>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ad Soyad *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Adınız Soyadınız" {...field} data-testid="input-contact-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>E-posta *</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="ornek@email.com" {...field} data-testid="input-contact-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefon</FormLabel>
                                <FormControl>
                                  <Input placeholder="0555 123 4567" {...field} data-testid="input-contact-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Konu *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-contact-subject">
                                      <SelectValue placeholder="Konu seçin" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {subjects.map((subject) => (
                                      <SelectItem key={subject.value} value={subject.value}>
                                        {subject.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesajınız *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Mesajınızı buraya yazın..." 
                                  rows={6}
                                  {...field} 
                                  data-testid="input-contact-message"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={contactMutation.isPending}
                          data-testid="button-contact-submit"
                        >
                          {contactMutation.isPending ? (
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
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    E-posta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">destek@sahibindenhayvan.com</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Çalışma Saatleri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Pazartesi - Cuma: 09:00 - 18:00</p>
                  <p className="text-muted-foreground">Cumartesi: 10:00 - 14:00</p>
                  <p className="text-sm text-muted-foreground mt-2">* Resmi tatillerde kapalıyız</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Adres
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Türkiye
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Hızlı Yardım</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sıkça sorulan sorulara göz atarak anında cevap bulabilirsiniz.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/yardim" data-testid="link-help-center">Yardım Merkezi</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
