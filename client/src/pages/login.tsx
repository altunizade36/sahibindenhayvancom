import { useState } from "react";
import { safeRedirectTarget, redirectQuery, redirectReason } from "@/lib/redirect";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, ShieldCheck, PawPrint } from "lucide-react";
import { Link, useLocation } from "wouter";
import { LogoFull } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(1, "Şifrenizi girin"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/login", {
        identifier: data.email,
        password: data.password,
      });

      toast({ title: "Giriş Başarılı!", description: "Hoş geldiniz!" });
      // Oturum bilgisi tazelenmeden yönlendirilirse hedef sayfanın koruması
      // kullanıcıyı tekrar giriş sayfasına atabilir — önce bekliyoruz.
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation(safeRedirectTarget());
    } catch (error: any) {
      let msg = "E-posta veya şifre hatalı.";
      if (error.message?.includes("bulunamadı") || error.message?.includes("not found"))
        msg = "Bu e-posta ile kayıtlı hesap bulunamadı.";
      else if (error.message?.includes("şifre") || error.message?.includes("password") || error.message?.includes("Hatalı"))
        msg = "Şifre yanlış, tekrar deneyin.";
      else if (error.message) msg = error.message;

      toast({ variant: "destructive", title: "Giriş Yapılamadı", description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-primary/5">
      {/* Sol panel — sadece desktop */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent items-center justify-center p-12">
        <div className="max-w-md text-center space-y-8">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <PawPrint className="w-12 h-12 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Türkiye'nin En Büyük<br />
              <span className="text-primary">Hayvan İlanları</span> Platformu
            </h1>
            <p className="text-lg text-muted-foreground">
              Binlerce ilan arasından size en uygun evcil dostunuzu bulun.
              Güvenli, hızlı ve ücretsiz.
            </p>
          </div>
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <span>Güvenli Alışveriş</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              <span>7/24 Destek</span>
            </div>
          </div>
        </div>
      </div>

      {/* Giriş formu */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="flex justify-center">
              <LogoFull />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold" data-testid="text-title">
                Hesabınıza Giriş Yapın
              </CardTitle>
              <CardDescription className="text-base mt-2" data-testid="text-description">
                {redirectReason() ?? "E-posta adresiniz ve şifrenizle giriş yapın"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-login">
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
                            className="pl-11 h-12 text-base"
                            autoComplete="email"
                            data-testid="input-email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Şifre</FormLabel>
                        <Link
                          href="/sifremi-unuttum"
                          className="text-xs text-primary hover:underline font-medium"
                          data-testid="link-forgot-password"
                        >
                          Şifremi Unuttum
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Şifrenizi girin"
                            className="pl-11 pr-11 h-12"
                            autoComplete="current-password"
                            data-testid="input-password"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
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
                  data-testid="button-login"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Giriş Yap</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="pt-4 border-t">
              <p className="text-center text-sm text-muted-foreground">
                Hesabınız yok mu?{" "}
                <Link href={`/kayit${redirectQuery()}`} className="text-primary font-semibold hover:underline" data-testid="link-register">
                  Hemen Kayıt Ol
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
