import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PawPrint, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Şifre en az 8 karakter olmalı"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    setToken(tokenParam);
  }, []);

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Geçersiz şifre sıfırlama linki",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("/api/auth/reset-password", "POST", {
        token,
        newPassword: data.newPassword,
      });

      setResetSuccess(true);
      toast({
        title: "Şifre Güncellendi",
        description: response.message || "Şifreniz başarıyla güncellendi.",
      });

      setTimeout(() => {
        setLocation("/giris");
      }, 3000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Bir hata oluştu. Lütfen tekrar deneyin.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <PawPrint className="w-12 h-12 text-primary" data-testid="icon-logo" />
            </div>
            <CardTitle className="text-2xl text-destructive" data-testid="text-error">
              Geçersiz Link
            </CardTitle>
            <CardDescription data-testid="text-error-description">
              Şifre sıfırlama linki geçersiz veya süresi dolmuş.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full"
              onClick={() => setLocation("/forgot-password")}
              data-testid="button-retry"
            >
              Yeni Link Talep Et
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/giris")}
              data-testid="button-back-login"
            >
              Giriş Sayfasına Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <PawPrint className="w-12 h-12 text-primary" data-testid="icon-logo" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-title">
            Yeni Şifre Belirle
          </CardTitle>
          <CardDescription data-testid="text-description">
            Hesabınız için yeni bir şifre oluşturun
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {resetSuccess ? (
            <Alert className="bg-green-50 border-green-200" data-testid="alert-success">
              <AlertDescription className="text-green-800">
                Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz...
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-reset-password">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yeni Şifre</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="En az 8 karakter"
                            className="pl-10"
                            data-testid="input-new-password"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yeni Şifre Tekrar</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="Şifrenizi tekrar girin"
                            className="pl-10"
                            data-testid="input-confirm-password"
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
                  data-testid="button-submit"
                >
                  {isLoading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
