import { useState, useEffect } from "react";
import { Phone, ArrowRight, Loader2, CheckCircle2, MessageCircle, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { LogoFull } from "@/components/logo";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Step = "phone" | "verify";

export default function PhoneLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [smsProgress, setSmsProgress] = useState(0);
  const [smsStatus, setSmsStatus] = useState<"sending" | "waiting" | "ready">("sending");
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (step === "verify" && smsProgress < 100) {
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
    if (step === "verify" && resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, resendCountdown]);

  /** Sunucu üzerinden SMS OTP gönderir (server/sms.ts) */
  const sendOtp = async () => {
    const res = await apiRequest("POST", "/api/auth/phone/send-otp", {
      phone,
      purpose: "login",
    });
    return res.json();
  };

  const handleSendOTP = async () => {
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen geçerli bir telefon numarası girin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp();
      setStep("verify");
      setSmsProgress(0);
      setResendCountdown(60);

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

  const handleVerifyOTP = async () => {
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
      const res = await apiRequest("POST", "/api/auth/phone/verify", {
        phone,
        code: otpCode,
        purpose: "login",
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
        description: error.message || "Kod hatalı veya bu numara kayıtlı değil.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    if (resendCountdown > 0) return;

    setIsLoading(true);
    try {
      await sendOtp();
      setOtpCode("");
      setSmsProgress(0);
      setResendCountdown(60);

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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <LogoFull />
          </div>
          <CardTitle className="text-2xl font-bold" data-testid="text-title">
            {step === "phone" ? "Telefon ile Giriş" : "Doğrulama Kodu"}
          </CardTitle>
          <CardDescription className="text-base mt-2" data-testid="text-description">
            {step === "phone"
              ? "Telefon numaranıza SMS ile kod göndereceğiz"
              : "Telefonunuza gönderilen kodu girin"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === "phone" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon Numarası</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    data-testid="input-phone"
                  />
                </div>
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={handleSendOTP}
                disabled={isLoading}
                data-testid="button-send-otp"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    Kod Gönder
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="text-center space-y-2 pt-4">
                <Link href="/giris">
                  <Button variant="ghost" className="w-full" data-testid="button-back-login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Email ile Giriş
                  </Button>
                </Link>

                <p className="text-sm text-muted-foreground">
                  Hesabınız yok mu?{" "}
                  <Link href="/kayit" className="text-primary hover:underline" data-testid="link-register">
                    Kayıt Ol
                  </Link>
                </p>
              </div>
            </>
          )}

          {step === "verify" && (
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
                    <p className="text-xs text-muted-foreground">{phone}</p>
                  </div>
                </div>
                <Progress value={smsProgress} className="h-2" />
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  SMS'teki <span className="font-bold text-foreground">6 haneli kodu</span> buraya yazın
                </p>

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={setOtpCode}
                    data-testid="input-otp"
                    disabled={isLoading}
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
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={handleVerifyOTP}
                disabled={isLoading || otpCode.length !== 6}
                data-testid="button-verify-otp"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Doğrulanıyor...
                  </>
                ) : (
                  <>
                    Giriş Yap
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={resendOTP}
                  disabled={isLoading || resendCountdown > 0}
                  className="w-full"
                  data-testid="button-resend-otp"
                >
                  {resendCountdown > 0
                    ? `Tekrar Gönder (${resendCountdown}s)`
                    : "Kodu Tekrar Gönder"}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep("phone");
                    setOtpCode("");
                    setSmsProgress(0);
                  }}
                  className="w-full"
                  data-testid="button-change-phone"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Numarayı Değiştir
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
