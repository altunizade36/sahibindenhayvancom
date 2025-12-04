import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, Lock, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
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

  // Handle redirect result (for mobile social logins)
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <LogoFull />
          </div>
          <CardTitle className="text-3xl font-bold" data-testid="text-title">
            Giriş Yap
          </CardTitle>
          <CardDescription className="text-base mt-2" data-testid="text-description">
            sahibinden<span className="text-primary">hayvan</span>'a hoş geldiniz
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={() => handleSocialSignIn('google')}
            disabled={socialLoading !== null || isLoading}
            data-testid="button-google-login"
          >
            {socialLoading === 'google' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <SiGoogle className="w-5 h-5 mr-2 text-[#4285F4]" />
                <span className="text-sm">Google ile Giriş Yap</span>
              </>
            )}
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">veya</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-login">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon Numarası</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="tel"
                          placeholder="0532 123 45 67"
                          className="pl-10 h-11 text-lg tracking-wide"
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d\s]/g, '');
                            const digits = value.replace(/\s/g, '');
                            if (digits.length <= 11) {
                              field.onChange(formatPhoneDisplay(digits));
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
                    <FormLabel>Şifre</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-10 h-11"
                          data-testid="input-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
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

              <div className="flex justify-end">
                <Link 
                  href="/sifremi-unuttum" 
                  className="text-sm text-primary hover:underline"
                  data-testid="link-forgot-password"
                >
                  Şifremi Unuttum
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11"
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

          <Separator />

          <p className="text-center text-sm text-muted-foreground">
            Hesabınız yok mu?{" "}
            <Link href="/kayit" className="text-primary font-medium hover:underline" data-testid="link-register">
              Kayıt Ol
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
