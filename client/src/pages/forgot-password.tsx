import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { LogoFull } from "@/components/logo";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { sendPasswordReset } from "@/lib/firebase";

const forgotPasswordSchema = z.object({
  email: z.string().email("Geçerli bir email adresi girin"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      // Use Firebase password reset
      await sendPasswordReset(data.email);

      setEmailSent(true);
      toast({
        title: "Email Gönderildi",
        description: "Şifre sıfırlama linki email adresinize gönderildi.",
      });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <LogoFull />
          </div>
          <CardTitle className="text-2xl font-bold" data-testid="text-title">
            Şifremi Unuttum
          </CardTitle>
          <CardDescription className="text-base mt-2" data-testid="text-description">
            Email adresinize şifre sıfırlama linki göndereceğiz
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {emailSent ? (
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" data-testid="alert-success">
              <AlertDescription className="text-green-800 dark:text-green-200">
                Şifre sıfırlama linki email adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.
                <br /><br />
                <span className="text-sm text-muted-foreground">
                  Email gelmedi mi? Spam klasörünüzü de kontrol edin.
                </span>
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-forgot-password">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="ornek@email.com"
                            className="pl-10"
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
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-submit"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    "Şifre Sıfırlama Linki Gönder"
                  )}
                </Button>
              </form>
            </Form>
          )}

          <div className="flex items-center justify-center gap-2">
            <Link href="/giris">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-login">
                <ArrowLeft className="w-4 h-4" />
                Giriş Sayfasına Dön
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
