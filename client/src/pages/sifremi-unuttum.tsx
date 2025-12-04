import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, Lock, Loader2, ArrowRight, RefreshCw, CheckCircle2, Eye, EyeOff, ArrowLeft, KeyRound, Check, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { LogoFull } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  formatPhoneNumber, 
  sendFirebaseOTP,
  verifyFirebaseOTP,
  setupRecaptcha,
  cleanupRecaptcha
} from "@/lib/firebase";

const phoneSchema = z.object({
  phone: z.string()
    .min(10, "Telefon numaranızı girin")
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 11;
    }, "Geçerli bir telefon numarası girin"),
});

const passwordSchema = z.object({
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler uyuşmuyor",
  path: ["confirmPassword"],
});

type PhoneForm = z.infer<typeof phoneSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type Step = "phone" | "otp" | "password" | "complete";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const recaptchaInitialized = useRef(false);

  useEffect(() => {
    const initRecaptcha = () => {
      const container = document.getElementById('recaptcha-container');
      if (container && !recaptchaInitialized.current) {
        setupRecaptcha('recaptcha-container');
        recaptchaInitialized.current = true;
      }
    };

    const timeoutId = setTimeout(initRecaptcha, 200);
    
    return () => {
      clearTimeout(timeoutId);
      cleanupRecaptcha();
      recaptchaInitialized.current = false;
    };
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const formatTurkishPhone = (value: string) => {
    let digits = value.replace(/\D/g, '');
    
    if (digits.startsWith('90')) {
      digits = digits.substring(2);
    }
    
    if (digits.length > 11) {
      digits = digits.slice(0, 11);
    }
    
    if (digits.length === 0) return '';
    
    if (digits.startsWith('0')) {
      if (digits.length <= 4) return digits;
      if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
      if (digits.length <= 9) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
    } else {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
    }
  };

  const password = passwordForm.watch("password");
  const passwordChecks = {
    length: password.length >= 6,
    hasLetter: /[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };

  const onPhoneSubmit = async (data: PhoneForm) => {
    setIsLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(data.phone);
      
      const checkRes = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (!checkData.exists) {
          toast({
            variant: "destructive",
            title: "Numara Bulunamadı",
            description: "Bu telefon numarasıyla kayıtlı hesap bulunamadı.",
          });
          setIsLoading(false);
          return;
        }
      }

      cleanupRecaptcha();
      recaptchaInitialized.current = false;
      await new Promise(resolve => setTimeout(resolve, 100));
      setupRecaptcha('recaptcha-container');
      recaptchaInitialized.current = true;
      await new Promise(resolve => setTimeout(resolve, 100));

      await sendFirebaseOTP(data.phone);
      setPhone(data.phone);
      setStep("otp");
      setCountdown(60);
      
      toast({
        title: "Kod Gönderildi",
        description: "Telefonunuza SMS ile doğrulama kodu gönderdik.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "SMS gönderilemedi. Tekrar deneyin.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "6 haneli kodu eksiksiz girin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await verifyFirebaseOTP(otpCode);
      setStep("password");
      
      toast({
        title: "Telefon Doğrulandı",
        description: "Şimdi yeni şifrenizi belirleyin.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kod Hatalı",
        description: "Kod yanlış veya süresi dolmuş. Tekrar deneyin.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/reset-password-phone", {
        phone: formatPhoneNumber(phone),
        newPassword: data.password,
      });
      
      setStep("complete");
      
      toast({
        title: "Şifre Güncellendi",
        description: "Yeni şifreniz kaydedildi.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Şifre güncellenemedi. Tekrar deneyin.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    try {
      cleanupRecaptcha();
      recaptchaInitialized.current = false;
      await new Promise(resolve => setTimeout(resolve, 100));
      setupRecaptcha('recaptcha-container');
      recaptchaInitialized.current = true;
      await new Promise(resolve => setTimeout(resolve, 100));

      await sendFirebaseOTP(phone);
      setCountdown(60);
      setOtpCode("");
      toast({
        title: "Kod Tekrar Gönderildi",
        description: "Yeni kod telefonunuza gönderildi.",
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

  const getStepInfo = () => {
    switch (step) {
      case "phone":
        return { title: "Şifremi Unuttum", description: "Kayıtlı telefon numaranızı girin", stepNumber: 1 };
      case "otp":
        return { title: "Telefon Doğrulama", description: `${phone} numarasına gönderilen kodu girin`, stepNumber: 2 };
      case "password":
        return { title: "Yeni Şifre", description: "Yeni şifrenizi belirleyin", stepNumber: 3 };
      case "complete":
        return { title: "Şifre Güncellendi", description: "Yeni şifrenizle giriş yapabilirsiniz", stepNumber: 4 };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div id="recaptcha-container" className="fixed top-0 left-0 z-50"></div>
      
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <LogoFull />
          </div>
          
          {step !== "complete" && (
            <div className="flex justify-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 w-16 rounded-full transition-all duration-300 ${
                    s < stepInfo.stepNumber 
                      ? "bg-primary" 
                      : s === stepInfo.stepNumber 
                        ? "bg-primary" 
                        : "bg-muted"
                  }`}
                />
              ))}
            </div>
          )}
          
          <div>
            <CardTitle className="text-2xl font-bold" data-testid="text-title">
              {stepInfo.title}
            </CardTitle>
            <CardDescription className="text-base mt-2" data-testid="text-description">
              {stepInfo.description}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-5 pt-4">
          {step === "phone" && (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4" data-testid="form-phone">
                <div className="flex justify-center py-4">
                  <div className="bg-primary/10 rounded-full p-4">
                    <KeyRound className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <FormField
                  control={phoneForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Telefon Numarası</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            {...field}
                            type="tel"
                            placeholder="0533 123 45 67 veya 533 123 45 67"
                            className="pl-11 h-12 text-base"
                            onChange={(e) => {
                              const formatted = formatTurkishPhone(e.target.value);
                              field.onChange(formatted);
                            }}
                            data-testid="input-phone"
                          />
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground">Başında 0 olsa da olmasa da yazabilirsiniz</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base font-semibold"
                  data-testid="button-send-otp"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Doğrulama Kodu Gönder</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full gap-2"
                  onClick={() => setLocation("/giris")}
                  data-testid="button-back-login"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Giriş Sayfasına Dön
                </Button>
              </form>
            </Form>
          )}

          {step === "otp" && (
            <>
              <div className="flex justify-center py-4">
                <div className="bg-primary/10 rounded-full p-4">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={setOtpCode}
                  data-testid="input-otp"
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot 
                        key={index} 
                        index={index} 
                        className="w-11 h-13 text-xl font-bold border-2 rounded-lg"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={verifyOtp}
                disabled={isLoading || otpCode.length !== 6}
                className="w-full h-12 text-base font-semibold"
                data-testid="button-verify-otp"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Doğrula</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setStep("phone"); setOtpCode(""); }}
                  className="gap-1"
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Geri
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resendOtp}
                  disabled={countdown > 0 || isLoading}
                  className="gap-1"
                  data-testid="button-resend-otp"
                >
                  {countdown > 0 ? (
                    <span className="text-muted-foreground">{countdown}s</span>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      <span>Tekrar Gönder</span>
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {step === "password" && (
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4" data-testid="form-password">
                <div className="flex justify-center py-4">
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
                    <Lock className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Yeni Şifre</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="En az 6 karakter"
                            className="pl-11 pr-11 h-12"
                            data-testid="input-password"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <div className="flex gap-3 text-xs mt-1">
                        <span className={`flex items-center gap-1 ${passwordChecks.length ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {passwordChecks.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          6+ karakter
                        </span>
                        <span className={`flex items-center gap-1 ${passwordChecks.hasLetter ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {passwordChecks.hasLetter ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          Harf
                        </span>
                        <span className={`flex items-center gap-1 ${passwordChecks.hasNumber ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {passwordChecks.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          Rakam
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Şifre Tekrar</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Şifrenizi tekrar girin"
                            className="pl-11 pr-11 h-12"
                            data-testid="input-confirm-password"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-12 text-base font-semibold" 
                  data-testid="button-reset-password"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Şifreyi Güncelle</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          {step === "complete" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Şifreniz Güncellendi!</h3>
              <p className="text-muted-foreground mb-6">Yeni şifrenizle giriş yapabilirsiniz.</p>
              <Button 
                onClick={() => setLocation("/giris")} 
                data-testid="button-go-login"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Giriş Yap
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
