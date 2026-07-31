import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Loader2, ArrowRight, ArrowLeft, MailCheck, KeyRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import { LogoFull } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const schema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email: data.email });
      setSentEmail(data.email);
      setSent(true);
    } catch (error: any) {
      // Always show success to prevent email enumeration
      setSentEmail(data.email);
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Link href="/giris"><LogoFull /></Link>
        </div>

        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          {!sent ? (
            <>
              <CardHeader className="text-center space-y-3 pb-2">
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <KeyRound className="w-7 h-7 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold" data-testid="text-title">Şifremi Unuttum</CardTitle>
                <CardDescription className="text-base">
                  Kayıtlı e-posta adresinizi girin. Şifre sıfırlama linki göndereceğiz.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-posta Adresi</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input
                                {...field}
                                type="email"
                                placeholder="ornek@eposta.com"
                                className="pl-11 h-12"
                                autoComplete="email"
                                data-testid="input-email"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 text-base font-semibold"
                      data-testid="button-send"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span>Sıfırlama Linki Gönder</span>
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="pt-3 border-t text-center">
                  <Link href="/giris" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Giriş sayfasına dön
                  </Link>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center space-y-3 pb-2">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <MailCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold" data-testid="text-success-title">E-posta Gönderildi!</CardTitle>
                <CardDescription className="text-base">
                  <strong>{sentEmail}</strong> adresine şifre sıfırlama linki gönderdik.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pb-6">
                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                  <p>• Spam / Junk klasörünüzü kontrol edin</p>
                  <p>• Link 24 saat geçerlidir</p>
                  <p>• E-posta gelmezse birkaç dakika bekleyin</p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { setSent(false); form.reset(); }}
                    data-testid="button-try-again"
                  >
                    Farklı E-posta Dene
                  </Button>
                  <Button className="w-full" onClick={() => setLocation("/giris")} data-testid="button-go-login">
                    Giriş Sayfasına Git
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
