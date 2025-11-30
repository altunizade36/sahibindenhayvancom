import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User, Phone, ArrowRight, Loader2 } from "lucide-react";
import { GiUnicorn } from "react-icons/gi";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  sendFirebaseOTP, 
  verifyFirebaseOTP, 
  setupRecaptcha, 
  cleanupRecaptcha,
  formatPhoneNumber,
  isRateLimited,
  getRateLimitRemaining,
  clearRateLimit
} from "@/lib/firebase";
import type { ConfirmationResult } from "@/lib/firebase";

const registerSchema = z.object({
  email: z.string().email("Geçerli bir email adresi girin"),
  username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalı").optional(),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
  confirmPassword: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

const phoneRegisterSchema = z.object({
  phone: z.string()
    .min(10, "Geçerli bir telefon numarası girin")
    .max(15)
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 12;
    }, "Geçerli bir Türk telefon numarası girin (05XX XXX XX XX)"),
  firstName: z.string().min(1, "Ad gereklidir"),
  lastName: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;
type PhoneRegisterForm = z.infer<typeof phoneRegisterSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [phoneStep, setPhoneStep] = useState<"info" | "otp">("info");
  const [phoneData, setPhoneData] = useState<{ phone: string; firstName: string; lastName?: string }>({ phone: "", firstName: "" });
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number>(0);
  const [countdown, setCountdown] = useState<string>("");

  // Check rate limit on mount and setup countdown
  useEffect(() => {
    const checkRateLimit = () => {
      if (isRateLimited()) {
        const remaining = getRateLimitRemaining();
        setRateLimitedUntil(Date.now() + remaining);
      }
    };
    checkRateLimit();
  }, []);

  // Countdown timer for rate limit
  useEffect(() => {
    if (rateLimitedUntil <= Date.now()) {
      setCountdown("");
      return;
    }

    const interval = setInterval(() => {
      const remaining = rateLimitedUntil - Date.now();
      if (remaining <= 0) {
        setCountdown("");
        setRateLimitedUntil(0);
        clearRateLimit();
        clearInterval(interval);
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitedUntil]);

  // Setup reCAPTCHA after component mount (with delay to ensure DOM is ready)
  useEffect(() => {
    // Small delay to ensure DOM container is ready
    const timeoutId = setTimeout(() => {
      setupRecaptcha('recaptcha-container');
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      cleanupRecaptcha();
    };
  }, []);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const phoneForm = useForm<PhoneRegisterForm>({
    resolver: zodResolver(phoneRegisterSchema),
    defaultValues: {
      phone: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/register", {
        email: data.email,
        username: data.username || undefined,
        password: data.password,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
      });
      const response: any = await res.json();

      toast({
        title: "Kayıt Başarılı!",
        description: response?.message || "Hoş geldiniz!",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kayıt Başarısız",
        description: error.message || "Bir hata oluştu. Lütfen tekrar deneyin.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onPhoneSubmit = async (data: PhoneRegisterForm) => {
    // Check rate limit before attempting
    if (isRateLimited()) {
      const remaining = getRateLimitRemaining();
      setRateLimitedUntil(Date.now() + remaining);
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Çok fazla deneme yaptınız. Lütfen ${Math.ceil(remaining / 60000)} dakika bekleyin.`,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Use Firebase Phone Auth
      const result = await sendFirebaseOTP(data.phone);
      setConfirmationResult(result);
      setPhoneData({ phone: data.phone, firstName: data.firstName, lastName: data.lastName });
      setPhoneStep("otp");
      
      toast({
        title: "Kod Gönderildi",
        description: "Telefonunuza SMS ile doğrulama kodu gönderdik.",
      });
    } catch (error: any) {
      // Check if it's a rate limit error
      if (error.message?.includes("fazla deneme") || error.message?.includes("dakika")) {
        const remaining = getRateLimitRemaining();
        if (remaining > 0) {
          setRateLimitedUntil(Date.now() + remaining);
        }
      }
      
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Kod gönderilemedi.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen 6 haneli kodu girin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Verify with Firebase and get ID token
      const firebaseIdToken = await verifyFirebaseOTP(otpCode);
      
      // Send to backend for user creation/login
      const res = await apiRequest("POST", "/api/auth/firebase/verify", {
        idToken: firebaseIdToken,
        phone: formatPhoneNumber(phoneData.phone),
        firstName: phoneData.firstName,
        lastName: phoneData.lastName,
        purpose: "register",
      });
      const response: any = await res.json();

      toast({
        title: "Kayıt Başarılı!",
        description: response.message || "Hoş geldiniz!",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Doğrulama Başarısız",
        description: error.message || "Kod hatalı veya süresi dolmuş.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    setIsLoading(true);
    try {
      // Re-setup recaptcha and send new OTP
      setupRecaptcha('recaptcha-container');
      const result = await sendFirebaseOTP(phoneData.phone);
      setConfirmationResult(result);
      setOtpCode("");
      
      toast({
        title: "Kod Yeniden Gönderildi",
        description: "Yeni doğrulama kodu gönderildi.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Kod gönderilemedi.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative p-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 shadow-sm">
              <GiUnicorn className="w-16 h-16 text-blue-600 dark:text-blue-400" data-testid="icon-logo" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold" data-testid="text-title">
            sahibinden<span className="text-primary">hayvan</span>
          </CardTitle>
          <CardDescription className="text-base mt-2" data-testid="text-description">
            Hesap oluştur ve Türkiye'nin en büyük hayvan pazaryerine katıl
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" data-testid="tab-email">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone" data-testid="tab-phone">
                <Phone className="w-4 h-4 mr-2" />
                Telefon
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-register">
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

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kullanıcı Adı (Opsiyonel)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              placeholder="kullanici123"
                              className="pl-10"
                              data-testid="input-username"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad (Opsiyonel)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ahmet"
                              data-testid="input-firstname"
                            />
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
                          <FormLabel>Soyad (Opsiyonel)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Yılmaz"
                              data-testid="input-lastname"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                              type="password"
                              placeholder="En az 8 karakter"
                              className="pl-10"
                              data-testid="input-password"
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
                        <FormLabel>Şifre Tekrar</FormLabel>
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
                    data-testid="button-register"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Kayıt Olunuyor...
                      </>
                    ) : "Kayıt Ol"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="phone" className="mt-4">
              {phoneStep === "info" ? (
                <Form {...phoneForm}>
                  <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4" data-testid="form-phone-register">
                    <FormField
                      control={phoneForm.control}
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
                                placeholder="05XX XXX XX XX"
                                className="pl-10"
                                data-testid="input-phone"
                                disabled={!!countdown}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={phoneForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ad</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ahmet"
                                data-testid="input-phone-firstname"
                                disabled={!!countdown}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={phoneForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Soyad (Opsiyonel)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Yılmaz"
                                data-testid="input-phone-lastname"
                                disabled={!!countdown}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {countdown && (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-center space-y-3">
                        <div>
                          <p className="text-sm text-destructive font-medium">
                            Çok fazla deneme yaptınız
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Tekrar deneyebilmek için <span className="font-mono font-bold text-foreground">{countdown}</span> bekleyin
                          </p>
                        </div>
                        <div className="pt-2 border-t border-destructive/20">
                          <p className="text-xs text-muted-foreground mb-2">
                            Beklemek istemiyor musunuz?
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              const emailTab = document.querySelector('[data-testid="tab-email"]') as HTMLButtonElement;
                              if (emailTab) emailTab.click();
                            }}
                            data-testid="button-switch-to-email"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Email ile Kayıt Ol
                          </Button>
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || !!countdown}
                      data-testid="button-send-otp"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gönderiliyor...
                        </>
                      ) : countdown ? (
                        <>Bekleyin ({countdown})</>
                      ) : (
                        <>
                          Doğrulama Kodu Gönder
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      <span className="font-medium text-foreground">{phoneData.phone}</span> numarasına gönderilen 6 haneli kodu girin
                    </p>
                    <p className="text-xs text-muted-foreground">
                      SMS ile gönderilen kodu 5 dakika içinde girin
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={(value) => setOtpCode(value)}
                      data-testid="input-otp"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    type="button"
                    className="w-full"
                    disabled={isLoading || otpCode.length !== 6}
                    onClick={onVerifyOtp}
                    data-testid="button-verify-otp"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Kayıt Olunuyor...
                      </>
                    ) : "Kayıt Ol"}
                  </Button>

                  <div className="flex flex-col gap-2 items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isLoading}
                      onClick={resendOtp}
                      data-testid="button-resend-otp"
                    >
                      Kodu Tekrar Gönder
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-primary"
                      onClick={() => {
                        setPhoneStep("info");
                        setOtpCode("");
                        setConfirmationResult(null);
                      }}
                      data-testid="button-change-phone"
                    >
                      Bilgileri Değiştir
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground mt-4" data-testid="text-login-link">
            Zaten hesabınız var mı?{" "}
            <Link href="/giris" className="text-primary hover:underline" data-testid="link-login">
              Giriş Yap
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
