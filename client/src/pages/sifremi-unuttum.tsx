import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, Lock, Loader2, ArrowRight, RefreshCw, CheckCircle2, Eye, EyeOff, ArrowLeft } from "lucide-react";
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
    .min(10, "Telefon numaranızı yazın")
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 12;
    }, "Geçerli bir telefon numarası girin"),
});

const passwordSchema = z.object({
  password: z.string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .refine((val) => /[a-zA-Z]/.test(val), "Şifrede en az bir harf olmalı")
    .refine((val) => /[0-9]/.test(val), "Şifrede en az bir rakam olmalı"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler aynı değil",
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

  // Setup Firebase reCAPTCHA
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

  // Countdown timer
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

  const formatPhoneDisplay = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
  };

  // Step 1: Send OTP
  const onPhoneSubmit = async (data: PhoneForm) => {
    setIsLoading(true);
    try {
      // Check if phone exists
      const checkRes = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatPhoneNumber(data.phone) }),
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

      // Reinitialize reCAPTCHA
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
        description: error.message || "SMS gönderilemedi.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const verifyOtp = async () => {
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
      await verifyFirebaseOTP(otpCode);
      setStep("password");
      
      toast({
        title: "Telefon Doğrulandı",
        description: "Şimdi yeni şifrenizi belirleyin.",
      });
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

  // Step 3: Set new password
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
        description: error.message || "Şifre güncellenemedi.",
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

  const getStepTitle = () => {
    switch (step) {
      case "phone": return "Şifremi Unuttum";
      case "otp": return "Telefon Doğrulama";
      case "password": return "Yeni Şifre";
      case "complete": return "Şifre Güncellendi";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "phone": return "Kayıtlı telefon numaranızı girin";
      case "otp": return "Telefonunuza gönderilen 6 haneli kodu girin";
      case "password": return "Yeni şifrenizi belirleyin";
      case "complete": return "Şifreniz başarıyla güncellendi!";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div id="recaptcha-container" className="fixed top-0 left-0"></div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <LogoFull />
          </div>
          
          {/* Progress Steps */}
          {step !== "complete" && (
            <div className="flex justify-center gap-2 mb-4">
              <div className={`h-2 w-12 rounded-full ${step === "phone" ? "bg-primary" : "bg-primary/30"}`} />
              <div className={`h-2 w-12 rounded-full ${step === "otp" ? "bg-primary" : step === "password" ? "bg-primary" : "bg-muted"}`} />
              <div className={`h-2 w-12 rounded-full ${step === "password" ? "bg-primary" : "bg-muted"}`} />
            </div>
          )}
          
          <CardTitle className="text-3xl font-bold" data-testid="text-title">
            {getStepTitle()}
          </CardTitle>
          <CardDescription className="text-base mt-2" data-testid="text-description">
            {getStepDescription()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Step 1: Phone */}
          {step === "phone" && (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4" data-testid="form-phone">
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
                            placeholder="0532 123 45 67"
                            className="pl-10 h-11 text-lg tracking-wide"
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d\s]/g, '');
                              const digits = value.replace(/\s/g, '');
                              if (digits.length <= 11) {
                                field.onChange(formatPhoneDisplay(digits));
                              }
                            }}
                            data-testid="input-phone"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11"
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
                  className="w-full"
                  onClick={() => setLocation("/giris")}
                  data-testid="button-back-login"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Giriş Sayfasına Dön
                </Button>
              </form>
            </Form>
          )}

          {/* Step 2: OTP Verification */}
          {step === "otp" && (
            <>
              <div className="text-center mb-4 p-3 bg-muted/50 rounded-lg">
                <Phone className="w-5 h-5 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{phone}</span> numarasına kod gönderildi
                </p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={setOtpCode}
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
                onClick={verifyOtp}
                disabled={isLoading || otpCode.length !== 6}
                className="w-full h-11"
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

              <div className="flex items-center justify-between text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep("phone");
                    setOtpCode("");
                  }}
                  data-testid="button-back"
                >
                  Geri
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resendOtp}
                  disabled={countdown > 0 || isLoading}
                  data-testid="button-resend-otp"
                >
                  {countdown > 0 ? (
                    <span className="text-muted-foreground">{countdown}s</span>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      <span>Tekrar Gönder</span>
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Step 3: New Password */}
          {step === "password" && (
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4" data-testid="form-password">
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yeni Şifre</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="En az 8 karakter"
                            className="pl-10 pr-10"
                            data-testid="input-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şifre Tekrar</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Şifrenizi tekrar girin"
                            className="pl-10 pr-10"
                            data-testid="input-confirm-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isLoading} className="w-full h-11" data-testid="button-reset-password">
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

          {/* Step 4: Complete */}
          {step === "complete" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-muted-foreground mb-4">Şimdi yeni şifrenizle giriş yapabilirsiniz.</p>
              <Button onClick={() => setLocation("/giris")} data-testid="button-go-login">
                Giriş Yap
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
