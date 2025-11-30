import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Phone, ArrowRight, Loader2, User } from "lucide-react";
import { GiUnicorn } from "react-icons/gi";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatPhoneNumber } from "@/lib/firebase";

const loginSchema = z.object({
  identifier: z.string().min(1, "Email veya telefon numarası gereklidir"),
  password: z.string().min(1, "Şifre gereklidir"),
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
      toast({
        variant: "destructive",
        title: "Giriş Başarısız",
        description: error.message || "Email/telefon veya şifre hatalı.",
      });
    } finally {
      setIsLoading(false);
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
                      <Link href="/forgot-password">
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
