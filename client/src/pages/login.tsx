import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, Lock, Loader2, ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Link, useLocation } from "wouter";
import { LogoFull } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatPhoneNumber, signInWithGoogle, handleRedirectResult } from "@/lib/firebase";

const loginSchema = z.object({
  phone: z.string()
    .min(10, "Telefon numaranızı yazın")
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 12;
    }, "Geçerli bir telefon numarası girin"),
  password: z.string().min(1, "Şifrenizi yazın"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await handleRedirectResult();
        if (result) {
          const res = await apiRequest("POST", "/api/auth/firebase/login", {
            idToken: result.idToken,
            email: result.user.email || null,
            displayName: result.user.displayName || null,
            photoURL: result.user.photoURL || null,
            provider: "redirect",
          });
          const response: any = await res.json();
          toast({
            title: "Giriş Başarılı!",
            description: response.message || "Giriş yapıldı.",
          });
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          setLocation("/");
        }
      } catch (error) {
        console.error('Redirect check error:', error);
      }
    };
    checkRedirect();
  }, []);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", {
        identifier: formatPhoneNumber(data.phone),
        password: data.password,
      });
      const response: any = await res.json();

      toast({
        title: "Giriş Başarılı!",
        description: "Hoş geldiniz!",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch (error: any) {
      let errorMessage = "Telefon veya şifre hatalı.";
      
      if (error.message?.includes("bulunamadı") || error.message?.includes("not found")) {
        errorMessage = "Bu telefon numarası ile kayıtlı hesap bulunamadı.";
      } else if (error.message?.includes("şifre") || error.message?.includes("password") || error.message?.includes("Hatalı")) {
        errorMessage = "Şifre yanlış, tekrar deneyin.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Giriş Yapılamadı",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google') => {
    setSocialLoading(provider);
    
    try {
      const result = await signInWithGoogle();
      
      if (!result || !result.idToken) {
        throw new Error('Kimlik doğrulama başarısız oldu.');
      }
      
      const res = await apiRequest("POST", "/api/auth/firebase/login", {
        idToken: result.idToken,
        email: result.user.email || null,
        displayName: result.user.displayName || null,
        photoURL: result.user.photoURL || null,
        provider,
      });
      
      const response: any = await res.json();
      
      toast({
        title: "Giriş Başarılı!",
        description: "Google ile giriş yapıldı.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch (error: any) {
      let errorMessage = "Google ile giriş yapılamadı.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Giriş penceresi kapatıldı.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup engellendi. Tarayıcı ayarlarını kontrol edin.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Giriş Başarısız",
        description: errorMessage,
      });
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-primary/5">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent items-center justify-center p-12">
        <div className="max-w-md text-center space-y-8">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-primary" />
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
              <Phone className="w-5 h-5 text-primary" />
              <span>7/24 Destek</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
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
                Telefon numaranız ve şifrenizle giriş yapın
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-5 pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-login">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Telefon Numarası</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <div className="absolute left-0 top-0 bottom-0 w-16 bg-muted/50 rounded-l-md flex items-center justify-center border-r">
                            <span className="text-sm font-medium text-muted-foreground">+90</span>
                          </div>
                          <Input
                            {...field}
                            type="tel"
                            placeholder="532 123 45 67"
                            className="pl-20 h-12 text-base tracking-wide transition-all focus:ring-2 focus:ring-primary/20"
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d\s]/g, '');
                              const digits = value.replace(/\s/g, '');
                              if (digits.length <= 10) {
                                const formatted = digits.length <= 3 
                                  ? digits 
                                  : digits.length <= 6 
                                    ? `${digits.slice(0, 3)} ${digits.slice(3)}`
                                    : `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
                                field.onChange(formatted);
                              }
                            }}
                            data-testid="input-phone"
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
                        <FormLabel className="text-sm font-medium">Şifre</FormLabel>
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
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Şifrenizi girin"
                            className="pl-10 pr-10 h-12 transition-all focus:ring-2 focus:ring-primary/20"
                            data-testid="input-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
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

            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 text-xs uppercase text-muted-foreground tracking-wider">
                  veya
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 gap-3 hover:bg-muted/50 transition-all"
              onClick={() => handleSocialSignIn('google')}
              disabled={socialLoading !== null || isLoading}
              data-testid="button-google-login"
            >
              {socialLoading === 'google' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <SiGoogle className="w-5 h-5 text-[#4285F4]" />
                  <span className="font-medium">Google ile Giriş Yap</span>
                </>
              )}
            </Button>

            <div className="pt-4 border-t">
              <p className="text-center text-sm text-muted-foreground">
                Hesabınız yok mu?{" "}
                <Link href="/kayit" className="text-primary font-semibold hover:underline" data-testid="link-register">
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
