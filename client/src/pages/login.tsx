import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { getRecaptchaToken, loadRecaptchaScript } from "@/lib/recaptcha";
import { PawPrint, AlertTriangle } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Kullanıcı adı gerekli"),
  password: z.string().min(1, "Şifre gerekli"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showUnverifiedAlert, setShowUnverifiedAlert] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  useEffect(() => {
    loadRecaptchaScript().catch(console.error);
  }, []);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleResendVerification = async () => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: unverifiedEmail }),
      });

      if (response.ok) {
        toast({
          title: "Email Gönderildi",
          description: "Doğrulama emaili tekrar gönderildi. Lütfen email kutunuzu kontrol edin.",
        });
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          description: error.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Email gönderilemedi",
      });
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setShowUnverifiedAlert(false);
    
    try {
      // Get reCAPTCHA token
      const recaptchaToken = await getRecaptchaToken('login');
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          recaptchaToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Check if email not verified
        if (result.message?.includes('doğrulanmamış') || result.message?.includes('verified')) {
          setShowUnverifiedAlert(true);
          setUnverifiedEmail(result.email || '');
        }
        throw new Error(result.message || "Giriş başarısız");
      }

      const { token, user } = result;
      login(token, user);
      toast({
        title: "Giriş başarılı",
        description: `Hoş geldiniz, ${user.fullName}!`,
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <PawPrint className="w-10 h-10 md:w-12 md:h-12 text-primary" />
          </div>
          <CardTitle className="text-xl md:text-2xl">Giriş Yap</CardTitle>
          <CardDescription className="text-sm md:text-base">
            Hesabınıza giriş yapın ve hayvan ilanlarına erişin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showUnverifiedAlert && (
            <Alert className="mb-4 border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20" data-testid="alert-unverified">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm">
                <p className="font-medium mb-2">Email adresiniz doğrulanmamış</p>
                <p className="text-muted-foreground mb-3">
                  Giriş yapabilmek için email adresinizi doğrulamanız gerekmektedir.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResendVerification}
                  data-testid="button-resend-verification"
                >
                  Doğrulama Emaili Tekrar Gönder
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kullanıcı Adı</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="kullaniciadi"
                        className="h-11"
                        data-testid="input-username"
                      />
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
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        className="h-11"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
                data-testid="button-submit"
              >
                {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-sm text-center text-muted-foreground">
            Hesabınız yok mu?{" "}
            <Link href="/kayit" className="text-primary hover:underline" data-testid="link-register">
              Üye Ol
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
