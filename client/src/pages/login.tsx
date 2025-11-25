import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, LogIn } from "lucide-react";
import { GiUnicorn } from "react-icons/gi";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email veya kullanıcı adı gereklidir"),
  password: z.string().min(1, "Şifre gereklidir"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response: any = await apiRequest("/api/auth/login", "POST", {
        emailOrUsername: data.emailOrUsername,
        password: data.password,
      });

      toast({
        title: "Giriş Başarılı!",
        description: response.message || "Hoş geldiniz!",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Giriş Başarısız",
        description: error.message || "Email/kullanıcı adı veya şifre hatalı.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative p-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 shadow-sm">
              <GiUnicorn className="w-16 h-16 text-blue-600 dark:text-blue-400" data-testid="icon-logo" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold" data-testid="text-title">
            Tekrar Hoş Geldiniz
          </CardTitle>
          <CardDescription className="text-base mt-2" data-testid="text-description">
            sahibinden<span className="text-primary">hayvan</span> hesabınıza giriş yapın
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-login">
              <FormField
                control={form.control}
                name="emailOrUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email veya Kullanıcı Adı</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="ornek@email.com veya kullanici123"
                          className="pl-10"
                          data-testid="input-email-username"
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
                      <Link href="/forgot-password">
                        <a className="text-xs text-primary hover:underline" data-testid="link-forgot-password">
                          Şifremi Unuttum
                        </a>
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
                {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
              </Button>
            </form>
          </Form>

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground font-medium">
              veya
            </span>
          </div>

          <Button
            variant="outline"
            className="w-full gap-3 h-12 text-base"
            onClick={handleOAuthLogin}
            data-testid="button-oauth-login"
          >
            <LogIn className="w-5 h-5" />
            <span>Sosyal Hesapla Giriş Yap</span>
          </Button>
          
          <p className="text-xs text-center text-muted-foreground mt-2">
            Google, Apple veya GitHub hesabınızla giriş yapabilirsiniz
          </p>

          <p className="text-center text-sm text-muted-foreground" data-testid="text-register-link">
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
