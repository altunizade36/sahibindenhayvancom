import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Phone, ArrowRight, Loader2, User } from "lucide-react";
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
import { formatPhoneNumber, signInWithGoogle } from "@/lib/firebase";

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [identifierType, setIdentifierType] = useState<"unknown" | "email" | "phone">("unknown");

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

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { idToken, user } = await signInWithGoogle();
      
      // Send to our backend to create/update session
      const res = await apiRequest("POST", "/api/auth/firebase/login", {
        idToken,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: "google",
      });
      
      const response: any = await res.json();
      
      toast({
        title: "Giriş Başarılı!",
        description: response.message || "Google ile giriş yapıldı.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Giriş Başarısız",
        description: error.message || "Google ile giriş yapılamadı.",
      });
    } finally {
      setIsGoogleLoading(false);
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
          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            data-testid="button-google-login"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <SiGoogle className="w-4 h-4 mr-2" />
            )}
            Google ile Giriş Yap
          </Button>

          {/* Phone Login Link */}
          <Link href="/telefon-giris">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isLoading}
              data-testid="button-phone-login"
            >
              <Phone className="w-4 h-4 mr-2" />
              Telefon ile Giriş Yap
            </Button>
          </Link>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">veya email ile</span>
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
                  <>
                    Giriş Yap
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
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
