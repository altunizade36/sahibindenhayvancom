import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, User, Lock, Loader2, ArrowRight, RefreshCw, CheckCircle2, Eye, EyeOff, ShieldCheck, Sparkles, ArrowLeft } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { Link, useLocation } from "wouter";
import { LogoFull } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  formatPhoneNumber, 
  signInWithGoogle,
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
    }, "Geçerli telefon numarası girin"),
});

const profileSchema = z.object({
  firstName: z.string().min(2, "Adınızı yazın (en az 2 harf)"),
  lastName: z.string().min(2, "Soyadınızı yazın (en az 2 harf)"),
  password: z.string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .refine((val) => /[a-zA-Z]/.test(val), "Şifrede en az bir harf olmalı")
    .refine((val) => /[0-9]/.test(val), "Şifrede en az bir rakam olmalı"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Kullanım koşullarını kabul etmeniz gerekiyor",
  }),
  acceptKvkk: z.boolean().refine((val) => val === true, {
    message: "KVKK metnini onaylamanız gerekiyor",
  }),
  isOver18: z.boolean().refine((val) => val === true, {
    message: "18 yaşından büyük olmalısınız",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

type PhoneForm = z.infer<typeof phoneSchema>;
type ProfileForm = z.infer<typeof profileSchema>;
type Step = "phone" | "otp" | "profile" | "complete";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
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

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
      acceptKvkk: false,
      isOver18: false,
    },
  });

  const onPhoneSubmit = async (data: PhoneForm) => {
    setIsLoading(true);
    try {
      const checkRes = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatPhoneNumber(data.phone) }),
      });
      
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists) {
          toast({
            variant: "destructive",
            title: "Numara Kayıtlı",
            description: "Bu telefon numarası zaten kayıtlı. Giriş yapmayı deneyin.",
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
        description: error.message || "SMS gönderilemedi. Lütfen tekrar deneyin.",
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
        description: "Lütfen 6 haneli kodu eksiksiz girin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await verifyFirebaseOTP(otpCode);
      setStep("profile");
      
      toast({
        title: "Telefon Doğrulandı",
        description: "Harika! Şimdi bilgilerinizi girin.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Doğrulama Başarısız",
        description: error.message || "Kod hatalı veya süresi dolmuş. Tekrar deneyin.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onProfileSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/register-phone", {
        phone: formatPhoneNumber(phone),
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      
      const response: any = await res.json();
      setStep("complete");
      
      toast({
        title: "Kayıt Başarılı!",
        description: "Hesabınız oluşturuldu. Hoş geldiniz!",
      });
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setLocation("/");
      }, 2000);
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
        description: "Yeni doğrulama kodu telefonunuza gönderildi.",
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

  const handleSocialSignUp = async (provider: 'google') => {
    setSocialLoading(provider);
    
    try {
      const result = await signInWithGoogle();
      
      if (!result || !result.idToken) {
        throw new Error('Kimlik doğrulama başarısız oldu.');
      }
      
      const res = await apiRequest("POST", "/api/auth/firebase/login", {
        idToken: result.idToken,
        email: result.user.email || null,
        displayName: result.user.displayName || null,
        photoURL: result.user.photoURL || null,
        provider,
      });
      
      const response: any = await res.json();
      
      toast({
        title: "Kayıt Başarılı!",
        description: "Google ile kayıt yapıldı.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    } catch (error: any) {
      let errorMessage = "Google ile kayıt yapılamadı.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Kayıt penceresi kapatıldı.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Kayıt Başarısız",
        description: errorMessage,
      });
    } finally {
      setSocialLoading(null);
    }
  };

  const getStepInfo = () => {
    switch (step) {
      case "phone":
        return { 
          title: "Hesap Oluştur", 
          description: "Telefon numaranızla hızlıca kayıt olun",
          stepNumber: 1
        };
      case "otp":
        return { 
          title: "Telefon Doğrulama", 
          description: `${phone} numarasına gönderilen 6 haneli kodu girin`,
          stepNumber: 2
        };
      case "profile":
        return { 
          title: "Bilgilerinizi Girin", 
          description: "Son adım! Adınızı ve şifrenizi belirleyin",
          stepNumber: 3
        };
      case "complete":
        return { 
          title: "Tebrikler!", 
          description: "Hesabınız başarıyla oluşturuldu",
          stepNumber: 4
        };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-primary/5">
      <div id="recaptcha-container" className="fixed top-0 left-0 z-50"></div>
      
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent items-center justify-center p-12">
        <div className="max-w-md text-center space-y-8">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-primary" />
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
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <span>%100 Ücretsiz</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              <span>Güvenli Kayıt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
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
                          ? "bg-primary animate-pulse" 
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
            {/* Step 1: Phone */}
            {step === "phone" && (
              <>
                <Form {...phoneForm}>
                  <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4" data-testid="form-phone">
                    <FormField
                      control={phoneForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Telefon Numarası</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <div className="absolute left-0 top-0 bottom-0 w-16 bg-muted/50 rounded-l-md flex items-center justify-center border-r">
                                <span className="text-sm font-medium text-muted-foreground">+90</span>
                              </div>
                              <Input
                                {...field}
                                type="tel"
                                placeholder="532 123 45 67"
                                className="pl-20 h-12 text-base tracking-wide transition-all focus:ring-2 focus:ring-primary/20"
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^\d\s]/g, '');
                                  const digits = value.replace(/\s/g, '');
                                  if (digits.length <= 10) {
                                    const formatted = digits.length <= 3 
                                      ? digits 
                                      : digits.length <= 6 
                                        ? `${digits.slice(0, 3)} ${digits.slice(3)}`
                                        : `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
                                    field.onChange(formatted);
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
                      className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                      data-testid="button-send-otp"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <span>Devam Et</span>
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="relative py-3">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-4 text-xs uppercase text-muted-foreground tracking-wider">
                      veya
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 gap-3 hover:bg-muted/50 transition-all"
                  onClick={() => handleSocialSignUp('google')}
                  disabled={socialLoading !== null || isLoading}
                  data-testid="button-google-signup"
                >
                  {socialLoading === 'google' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <SiGoogle className="w-5 h-5 text-[#4285F4]" />
                      <span className="font-medium">Google ile Kayıt Ol</span>
                    </>
                  )}
                </Button>
              </>
            )}

            {/* Step 2: OTP Verification */}
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
                    className="gap-2"
                    data-testid="input-otp"
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot 
                          key={index} 
                          index={index} 
                          className="w-12 h-14 text-xl font-bold border-2 rounded-lg"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={verifyOtp}
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  data-testid="button-verify-otp"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Doğrula ve Devam Et</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep("phone");
                      setOtpCode("");
                    }}
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
                      <span className="text-muted-foreground font-mono">{countdown}s bekleyin</span>
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

            {/* Step 3: Profile & Password */}
            {step === "profile" && (
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4" data-testid="form-profile">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Ad</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                {...field} 
                                placeholder="Adınız" 
                                className="pl-10 h-11" 
                                data-testid="input-firstname" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Soyad</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Soyadınız" 
                              className="h-11" 
                              data-testid="input-lastname" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Şifre</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="En az 8 karakter, 1 harf, 1 rakam"
                              className="pl-10 pr-10 h-11"
                              data-testid="input-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
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
                    control={profileForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Şifre Tekrar</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Şifrenizi tekrar girin"
                              className="pl-10 pr-10 h-11"
                              data-testid="input-confirm-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
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

                  <div className="space-y-3 pt-2 bg-muted/30 rounded-lg p-4">
                    <FormField
                      control={profileForm.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
                              className="mt-0.5"
                              data-testid="checkbox-terms" 
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              <Link href="/kullanim-kosullari" className="text-primary hover:underline">Kullanım Koşulları</Link>'nı kabul ediyorum
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="acceptKvkk"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
                              className="mt-0.5"
                              data-testid="checkbox-kvkk" 
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              <Link href="/kvkk-aydinlatma-metni" className="text-primary hover:underline">KVKK Aydınlatma Metni</Link>'ni okudum
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="isOver18"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
                              className="mt-0.5"
                              data-testid="checkbox-age" 
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-normal cursor-pointer">18 yaşından büyüğüm</FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all" 
                    data-testid="button-register"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Hesabımı Oluştur</span>
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
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Hoş Geldiniz!</h3>
                <p className="text-muted-foreground mb-6">Ana sayfaya yönlendiriliyorsunuz...</p>
                <Button 
                  onClick={() => { 
                    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] }); 
                    setLocation("/"); 
                  }} 
                  className="shadow-lg"
                  data-testid="button-go-home"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  İlanlara Göz At
                </Button>
              </div>
            )}

            {step !== "complete" && (
              <div className="pt-4 border-t">
                <p className="text-center text-sm text-muted-foreground">
                  Zaten hesabınız var mı?{" "}
                  <Link href="/giris" className="text-primary font-semibold hover:underline" data-testid="link-login">
                    Giriş Yap
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
