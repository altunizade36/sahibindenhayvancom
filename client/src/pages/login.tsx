import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Phone, Loader2, User, Link2 } from "lucide-react";
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
import { 
  formatPhoneNumber, 
  signInWithGoogle, 
  handleRedirectResult,
  sendEmailSignInLink
} from "@/lib/firebase";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email veya telefon numaranızı yazın"),
  password: z.string().min(1, "Şifrenizi yazın"),
});

type LoginForm = z.infer<typeof loginSchema>;

function isPhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 12 && /^[0-9+\s()-]+$/.test(value);
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [identifierType, setIdentifierType] = useState<"unknown" | "email" | "phone">("unknown");
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);

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
      identifier: "",
      password: "",
    },
  });

  const handleIdentifierChange = (value: string) => {
    if (value.includes("@")) {
      setIdentifierType("email");
    } else if (isPhoneNumber(value)) {
      setIdentifierType("phone");
    } else {
      setIdentifierType("unknown");
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      let identifier = data.identifier;
      
      if (identifierType === "phone" || isPhoneNumber(data.identifier)) {
        identifier = formatPhoneNumber(data.identifier);
      }

      // Use backend authentication (supports both Firebase and legacy users)
      const res = await apiRequest("POST", "/api/auth/login", {
        identifier: identifier,
        password: data.password,
      });
      const response: any = await res.json();

      toast({
        title: "Giriş Başarılı!",
        description: response.message || "Hoş geldiniz!",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch (error: any) {
      let errorMessage = "Email/telefon veya şifre hatalı.";
      
      if (error.message?.includes("kullanıcı bulunamadı") || error.message?.includes("not found")) {
        errorMessage = "Bu email veya telefon ile kayıtlı hesap bulunamadı.";
      } else if (error.message?.includes("şifre") || error.message?.includes("password")) {
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

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicLinkEmail.trim() || !magicLinkEmail.includes('@')) {
      toast({
        variant: "destructive",
        title: "Geçersiz Email",
        description: "Lütfen geçerli bir email adresi girin.",
      });
      return;
    }

    setMagicLinkLoading(true);
    try {
      await sendEmailSignInLink(magicLinkEmail.trim());
      setMagicLinkSent(true);
      toast({
        title: "Email Gönderildi!",
        description: "Giriş bağlantısı email adresinize gönderildi. Spam klasörünü de kontrol edin.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Email gönderilemedi.",
      });
    } finally {
      setMagicLinkLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google') => {
    setSocialLoading(provider);
    
    try {
      const result = await signInWithGoogle();
      
      if (!result || !result.idToken) {
        throw new Error('Kimlik doğrulama başarısız oldu. Lütfen tekrar deneyin.');
      }
      
      const email = result.user.email || null;
      const displayName = result.user.displayName || null;
      const photoURL = result.user.photoURL || null;
      
      const res = await apiRequest("POST", "/api/auth/firebase/login", {
        idToken: result.idToken,
        email,
        displayName,
        photoURL,
        provider,
      });
      
      const response: any = await res.json();
      
      toast({
        title: "Giriş Başarılı!",
        description: response.message || "Google ile giriş yapıldı.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch (error: any) {
      let errorMessage = "Google ile giriş yapılamadı.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Giriş penceresi kapatıldı. Lütfen tekrar deneyin.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup penceresi engellendi. Tarayıcı ayarlarınızı kontrol edin.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Giriş iptal edildi.';
      } else if (error.code === 'auth/operation-not-supported-in-this-environment') {
        errorMessage = 'Bu giriş yöntemi bu ortamda desteklenmiyor. Farklı bir yöntem deneyin.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'Bu email adresi farklı bir giriş yöntemiyle kayıtlı. O yöntemi deneyin.';
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

  const getIdentifierIcon = () => {
    switch (identifierType) {
      case "email":
        return <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />;
      case "phone":
        return <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />;
      default:
        return <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <LogoFull />
          </div>
          <CardTitle className="text-2xl font-bold" data-testid="text-title">
            Giriş Yap
          </CardTitle>
          <CardDescription className="text-base mt-2" data-testid="text-description">
            Hesabınıza giriş yapın
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Google Login - Full Width */}
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

          {/* Phone Login & Magic Link - Side by Side */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-primary/30 hover:border-primary hover:bg-primary/5"
              disabled={isLoading}
              onClick={() => setLocation("/telefon-giris")}
              data-testid="button-phone-login"
            >
              <Phone className="w-5 h-5 mr-2 text-primary" />
              <span className="text-sm">Telefon ile Giriş</span>
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 border-secondary/30 hover:border-secondary hover:bg-secondary/5"
              disabled={isLoading}
              onClick={() => setShowMagicLink(!showMagicLink)}
              data-testid="button-magic-link-toggle"
            >
              <Link2 className="w-5 h-5 mr-2 text-secondary" />
              <span className="text-sm">Şifresiz Giriş</span>
            </Button>
          </div>

          {/* Magic Link Form (Toggle) */}
          {showMagicLink && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              {magicLinkSent ? (
                <div className="text-center space-y-2">
                  <Mail className="w-8 h-8 mx-auto text-green-500" />
                  <p className="text-sm text-muted-foreground">
                    <strong>{magicLinkEmail}</strong> adresine giriş bağlantısı gönderildi!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Email'inizi kontrol edin. Spam klasörüne de bakın.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs text-primary hover:underline"
                    onClick={() => {
                      setMagicLinkSent(false);
                      setMagicLinkEmail("");
                    }}
                    data-testid="button-magic-link-retry"
                  >
                    Farklı email ile dene
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleMagicLinkSubmit} className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Email adresinize giriş bağlantısı göndereceğiz. Şifre gerekmez!
                  </p>
                  <Input
                    type="email"
                    placeholder="ornek@email.com"
                    value={magicLinkEmail}
                    onChange={(e) => setMagicLinkEmail(e.target.value)}
                    disabled={magicLinkLoading}
                    data-testid="input-magic-link-email"
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={magicLinkLoading || !magicLinkEmail.includes('@')}
                    data-testid="button-magic-link-send"
                  >
                    {magicLinkLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Bağlantı Gönder
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          )}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">veya email ile</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-login">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email veya Telefon</FormLabel>
                    <FormControl>
                      <div className="relative">
                        {getIdentifierIcon()}
                        <Input
                          {...field}
                          placeholder="ornek@email.com veya 05XX XXX XX XX"
                          className="pl-10"
                          data-testid="input-identifier"
                          onChange={(e) => {
                            field.onChange(e);
                            handleIdentifierChange(e.target.value);
                          }}
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
                      <Link href="/sifremi-unuttum">
                        <span className="text-xs text-primary hover:underline cursor-pointer" data-testid="link-forgot-password">
                          Şifremi Unuttum
                        </span>
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="Şifrenizi girin"
                          className="pl-10"
                          data-testid="input-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Giriş Yapılıyor...
                  </>
                ) : (
                  "Giriş Yap"
                )}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-4" data-testid="text-register-link">
            Hesabınız yok mu?{" "}
            <Link href="/kayit" className="text-primary hover:underline" data-testid="link-register">
              Kayıt Ol
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
