import { useState } from "react";
import { redirectQuery, redirectReason } from "@/lib/redirect";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail, User, Lock, Loader2, ArrowRight, Eye, EyeOff,
  CheckCircle2, Check, X, PawPrint, MailCheck,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { LogoFull } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useBotTrap } from "@/lib/bot-trap";

const registerSchema = z.object({
  firstName: z.string().min(2, "Adınızı girin (en az 2 karakter)"),
  lastName: z.string().min(2, "Soyadınızı girin (en az 2 karakter)"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((v) => v === true, { message: "Kullanım koşullarını kabul etmelisiniz" }),
  acceptKvkk: z.boolean().refine((v) => v === true, { message: "KVKK metnini onaylamalısınız" }),
  isOver18: z.boolean().refine((v) => v === true, { message: "18 yaşından büyük olmalısınız" }),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Şifreler uyuşmuyor",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { ok: password.length >= 8, label: "En az 8 karakter" },
    { ok: /[A-Za-zçğıöşüÇĞİÖŞÜ]/.test(password), label: "En az bir harf" },
    { ok: /[0-9]/.test(password), label: "En az bir rakam" },
  ];
  if (!password) return null;
  return (
    <div className="space-y-1 mt-1">
      {checks.map((c) => (
        <div key={c.label} className={`flex items-center gap-2 text-xs ${c.ok ? "text-green-600" : "text-muted-foreground"}`}>
          {c.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          {c.label}
        </div>
      ))}
    </div>
  );
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { BotTrapField, botFields } = useBotTrap();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "", lastName: "", email: "",
      password: "", confirmPassword: "",
      acceptTerms: false, acceptKvkk: false, isOver18: false,
    },
  });

  const password = form.watch("password");

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/register", {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        ...botFields(),
      });
      setRegisteredEmail(data.email);
    } catch (error: any) {
      let msg = "Kayıt sırasında bir hata oluştu.";
      if (error.message?.includes("kayıtlı")) msg = "Bu e-posta adresi zaten kayıtlı.";
      else if (error.message) msg = error.message;
      toast({ variant: "destructive", title: "Kayıt Başarısız", description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  /* ── E-posta gönderildi ekranı ── */
  if (registeredEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md shadow-xl border-0 bg-card/80 backdrop-blur-sm text-center">
          <CardHeader className="space-y-4 pt-8">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MailCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">E-postanızı Doğrulayın</CardTitle>
            <CardDescription className="text-base">
              <strong>{registeredEmail}</strong> adresine doğrulama linki gönderdik.
              Lütfen e-postanızı kontrol edin ve linke tıklayın.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-8">
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2 text-left">
              <p className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Spam/Junk klasörünüzü kontrol edin</p>
              <p className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Link 24 saat geçerlidir</p>
              <p className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Doğruladıktan sonra giriş yapabilirsiniz</p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setLocation(`/giris${redirectQuery()}`)}>
              Giriş Sayfasına Git
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-primary/5">
      {/* Sol panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent items-center justify-center p-12">
        <div className="max-w-md text-center space-y-8">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <PawPrint className="w-12 h-12 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Hayvan Dostlarınız<br />
              <span className="text-primary">Bir Tık Uzağınızda</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Ücretsiz kayıt olun, binlerce ilan arasından size en uygun evcil dostunuzu bulun.
            </p>
          </div>
        </div>
      </div>

      {/* Kayıt formu */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="flex justify-center">
              <LogoFull />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold" data-testid="text-title">Hesap Oluştur</CardTitle>
              <CardDescription className="text-base mt-2">{redirectReason() ? "Ücretsiz ilan vermek için hemen üye olun" : "E-posta ile ücretsiz kayıt olun"}</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-register">
                <BotTrapField />
                {/* Ad & Soyad */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ad</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input {...field} placeholder="Adınız" className="pl-9 h-11" data-testid="input-first-name" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Soyad</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Soyadınız" className="h-11" data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* E-posta */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-posta Adresi</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="ornek@eposta.com"
                            className="pl-11 h-12"
                            autoComplete="email"
                            data-testid="input-email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Şifre */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şifre</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="En az 8 karakter"
                            className="pl-11 pr-11 h-12"
                            autoComplete="new-password"
                            data-testid="input-password"
                          />
                          <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <PasswordStrength password={password} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Şifre Tekrar */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şifre Tekrar</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showConfirm ? "text" : "password"}
                            placeholder="Şifrenizi tekrar girin"
                            className="pl-11 pr-11 h-12"
                            autoComplete="new-password"
                            data-testid="input-confirm-password"
                          />
                          <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Onay kutuları */}
                <div className="space-y-2 pt-1">
                  {[
                    { name: "acceptTerms" as const, label: <span>
                        <Link href="/kullanim-kosullari" className="text-primary hover:underline">Kullanım Koşulları</Link>'nı okudum ve kabul ediyorum
                      </span> },
                    { name: "acceptKvkk" as const, label: <span>
                        <Link href="/kvkk" className="text-primary hover:underline">KVKK Aydınlatma Metni</Link>'ni okudum ve onaylıyorum
                      </span> },
                    { name: "isOver18" as const, label: "18 yaşından büyük olduğumu beyan ediyorum" },
                  ].map((item) => (
                    <FormField
                      key={item.name}
                      control={form.control}
                      name={item.name}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value as boolean}
                              onCheckedChange={field.onChange}
                              data-testid={`checkbox-${item.name}`}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-xs font-normal cursor-pointer">{item.label}</FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-semibold"
                  data-testid="button-register"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Hesap Oluştur</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="pt-3 border-t">
              <p className="text-center text-sm text-muted-foreground">
                Zaten hesabınız var mı?{" "}
                <Link href="/giris" className="text-primary font-semibold hover:underline" data-testid="link-login">
                  Giriş Yap
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
