import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock } from "lucide-react";
import { SiGoogle, SiApple, SiGithub } from "react-icons/si";
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
      const response = await apiRequest("/api/auth/login", "POST", {
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

  const handleOAuthLogin = (provider?: string) => {
    const url = provider ? `/api/login/${provider}` : "/api/login";
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative p-4 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <GiUnicorn className="w-16 h-16 text-transparent bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} data-testid="icon-logo" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent" data-testid="text-title">
            Tekrar Hoş Geldiniz
          </CardTitle>
          <CardDescription className="text-base mt-2" data-testid="text-description">
            sahibinden<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">hayvan</span> hesabınıza giriş yapın
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
              veya sosyal hesaplarınızla
            </span>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full gap-3 h-11"
              onClick={() => handleOAuthLogin("google")}
              data-testid="button-google-login"
            >
              <SiGoogle className="w-5 h-5" />
              <span>Google ile Giriş Yap</span>
            </Button>
            
            <Button
              variant="outline"
              className="w-full gap-3 h-11"
              onClick={() => handleOAuthLogin("apple")}
              data-testid="button-apple-login"
            >
              <SiApple className="w-5 h-5" />
              <span>Apple ile Giriş Yap</span>
            </Button>
            
            <Button
              variant="outline"
              className="w-full gap-3 h-11"
              onClick={() => handleOAuthLogin("github")}
              data-testid="button-github-login"
            >
              <SiGithub className="w-5 h-5" />
              <span>GitHub ile Giriş Yap</span>
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground" data-testid="text-register-link">
            Hesabınız yok mu?{" "}
            <Link href="/register">
              <a className="text-primary hover:underline" data-testid="link-register">
                Kayıt Ol
              </a>
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
