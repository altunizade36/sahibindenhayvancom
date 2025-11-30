import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User, Phone, ArrowRight, Loader2, CheckCircle2, MessageCircle } from "lucide-react";
import { GiUnicorn } from "react-icons/gi";
import { Progress } from "@/components/ui/progress";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

const registerSchema = z.object({
  firstName: z.string().min(2, "Adınızı yazın (en az 2 harf)"),
  lastName: z.string().min(2, "Soyadınızı yazın (en az 2 harf)"),
  email: z.string().email("Geçerli bir email yazın (örnek: ad@gmail.com)"),
  phone: z.string()
    .min(10, "Telefon numaranızı yazın")
    .max(15)
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 12;
    }, "Telefon numarası 10-12 rakam olmalı")
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.startsWith("05") || digits.startsWith("5");
    }, "Telefon numarası 05 ile başlamalı (örnek: 0532 123 45 67)"),
  password: z.string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .refine((val) => /[a-zA-Z]/.test(val), "Şifrede en az bir harf olmalı")
    .refine((val) => /[0-9]/.test(val), "Şifrede en az bir rakam olmalı"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler aynı değil, tekrar kontrol edin",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

type Step = "form" | "verify-phone" | "verify-email" | "complete";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState<RegisterForm | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number>(0);
  const [countdown, setCountdown] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [smsProgress, setSmsProgress] = useState(0);
  const [smsStatus, setSmsStatus] = useState<"sending" | "waiting" | "ready">("sending");
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    const checkRateLimit = () => {
      if (isRateLimited()) {
        const remaining = getRateLimitRemaining();
        const maxLimit = 5 * 60 * 1000;
        if (remaining > maxLimit) {
          clearRateLimit();
          return;
        }
        setRateLimitedUntil(Date.now() + remaining);
      }
    };
    checkRateLimit();
  }, []);

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

  useEffect(() => {
    if (step === "verify-phone" && smsProgress < 100) {
      setSmsStatus("sending");
      const progressInterval = setInterval(() => {
        setSmsProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setSmsStatus("ready");
            return 100;
          }
          if (prev >= 60) {
            setSmsStatus("waiting");
          }
          return prev + 4;
        });
      }, 200);
      return () => clearInterval(progressInterval);
    }
  }, [step]);

  useEffect(() => {
    if (step === "verify-phone" && resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, resendCountdown]);

  useEffect(() => {
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
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterForm) => {
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
      const res = await apiRequest("POST", "/api/auth/register", {
        email: data.email,
        phone: formatPhoneNumber(data.phone),
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      const response: any = await res.json();
      
      setFormData(data);
      setUserId(response.userId);
      
      await sendFirebaseOTP(data.phone);
      setStep("verify-phone");
      
      toast({
        title: "Kod Gönderildi",
        description: "Telefonunuza SMS ile doğrulama kodu gönderdik.",
      });
    } catch (error: any) {
      if (error.message?.includes("fazla deneme") || error.message?.includes("dakika")) {
        const remaining = getRateLimitRemaining();
        if (remaining > 0) {
          setRateLimitedUntil(Date.now() + remaining);
        }
      }
      
      toast({
        variant: "destructive",
        title: "Kayıt Başarısız",
        description: error.message || "Bir hata oluştu. Lütfen tekrar deneyin.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyPhone = async () => {
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
      const firebaseIdToken = await verifyFirebaseOTP(otpCode);
      
      await apiRequest("POST", "/api/auth/firebase/verify", {
        idToken: firebaseIdToken,
        phone: formatPhoneNumber(formData!.phone),
        purpose: "verify",
        userId: userId,
      });

      toast({
        title: "Telefon Doğrulandı",
        description: "Email adresinize doğrulama linki gönderildi.",
      });
      
      setStep("verify-email");
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

  const resendPhoneOtp = async () => {
    if (isRateLimited()) {
      const remaining = getRateLimitRemaining();
      setRateLimitedUntil(Date.now() + remaining);
      toast({
        variant: "destructive",
        title: "Hata",
        description: `Çok fazla deneme. ${Math.ceil(remaining / 60000)} dakika bekleyin.`,
      });
      return;
    }

    setIsLoading(true);
    try {
      setupRecaptcha('recaptcha-container');
      await sendFirebaseOTP(formData!.phone);
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

  const resendEmailVerification = async () => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/resend-verification", {
        email: formData!.email,
      });
      
      toast({
        title: "Email Gönderildi",
        description: "Doğrulama emaili yeniden gönderildi.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Email gönderilemedi.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const skipEmailVerification = () => {
    toast({
      title: "Kayıt Tamamlandı!",
      description: "Email doğrulamasını daha sonra yapabilirsiniz.",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div id="recaptcha-container"></div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative p-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 shadow-sm">
              <GiUnicorn className="w-16 h-16 text-blue-600 dark:text-blue-400" data-testid="icon-logo" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold" data-testid="text-title">
            {step === "form" && "Hesap Oluştur"}
            {step === "verify-phone" && "Telefon Doğrulama"}
            {step === "verify-email" && "Email Doğrulama"}
            {step === "complete" && "Kayıt Tamamlandı"}
          </CardTitle>
          <CardDescription className="text-base mt-2" data-testid="text-description">
            {step === "form" && (
              <>sahibinden<span className="text-primary">hayvan</span>'a üye olun</>
            )}
            {step === "verify-phone" && "Telefonunuza gönderilen kodu girin"}
            {step === "verify-email" && "Email adresinizi doğrulayın"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {step === "form" && (
            <>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Hem telefon hem email ile giriş yapabileceksiniz</span>
              </div>

              {countdown && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-center">
                  <p className="text-sm text-destructive font-medium">
                    SMS gönderimi için {countdown} bekleyin
                  </p>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-register">
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
                              <Input
                                {...field}
                                placeholder="Adınız"
                                className="pl-10"
                                data-testid="input-firstname"
                              />
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
                            <Input
                              {...field}
                              placeholder="Soyadınız"
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
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Adresi</FormLabel>
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
                    disabled={isLoading || !!countdown}
                    data-testid="button-register"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Kayıt Yapılıyor...
                      </>
                    ) : (
                      <>
                        Kayıt Ol
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </>
          )}

          {step === "verify-phone" && (
            <div className="space-y-5">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    smsStatus === "ready" ? "bg-green-100 dark:bg-green-900/30" : "bg-blue-100 dark:bg-blue-900/30"
                  }`}>
                    {smsStatus === "ready" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {smsStatus === "sending" && "SMS gönderiliyor..."}
                      {smsStatus === "waiting" && "Kod yolda..."}
                      {smsStatus === "ready" && "Kod telefonunuza geldi!"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formData?.phone}
                    </p>
                  </div>
                </div>
                <Progress value={smsProgress} className="h-2" />
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  SMS'teki <span className="font-bold text-foreground">6 haneli kodu</span> buraya yazın
                </p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={(value) => setOtpCode(value)}
                  data-testid="input-otp"
                  autoFocus
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
                size="lg"
                disabled={isLoading || otpCode.length !== 6}
                onClick={onVerifyPhone}
                data-testid="button-verify-phone"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Kontrol ediliyor...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Kodu Doğrula
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground mb-2">
                  Kod gelmedi mi?
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isLoading || resendCountdown > 0 || !!countdown}
                  onClick={() => {
                    resendPhoneOtp();
                    setResendCountdown(60);
                    setSmsProgress(0);
                    setSmsStatus("sending");
                  }}
                  data-testid="button-resend-otp"
                >
                  {countdown ? `Bekleyin (${countdown})` : 
                   resendCountdown > 0 ? `${resendCountdown} saniye bekleyin` : 
                   "Tekrar SMS Gönder"}
                </Button>
              </div>
            </div>
          )}

          {step === "verify-email" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              
              <div className="text-center">
                <p className="font-medium text-green-600 dark:text-green-400 mb-2">
                  Telefon Doğrulandı!
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{formData?.email}</span> adresine doğrulama linki gönderdik.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Spam klasörünü de kontrol edin.
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                  onClick={resendEmailVerification}
                  data-testid="button-resend-email"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Email'i Tekrar Gönder
                </Button>
                
                <Button
                  type="button"
                  className="w-full"
                  onClick={skipEmailVerification}
                  data-testid="button-continue"
                >
                  Devam Et
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Email doğrulamasını daha sonra profilinizden yapabilirsiniz.
              </p>
            </div>
          )}

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
