import { useState, useEffect } from "react";
import { Loader2, Mail, CheckCircle2, XCircle } from "lucide-react";
import { LogoFull } from "@/components/logo";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  isEmailSignInLink, 
  completeEmailSignIn, 
  getSavedEmailForSignIn 
} from "@/lib/firebase";

type Status = "checking" | "need-email" | "processing" | "success" | "error";

export default function EmailVerifyLink() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>("checking");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleEmailLink = async () => {
      if (!isEmailSignInLink()) {
        setStatus("error");
        setErrorMessage("Bu geçerli bir email giriş bağlantısı değil.");
        return;
      }

      const savedEmail = getSavedEmailForSignIn();
      
      if (savedEmail) {
        setEmail(savedEmail);
        await processSignIn(savedEmail);
      } else {
        setStatus("need-email");
      }
    };

    handleEmailLink();
  }, []);

  const processSignIn = async (emailToUse: string) => {
    setStatus("processing");
    try {
      const { idToken, user } = await completeEmailSignIn(emailToUse);
      
      const res = await apiRequest("POST", "/api/auth/firebase/login", {
        idToken,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: "email-link",
      });

      const response: any = await res.json();

      setStatus("success");
      toast({
        title: "Giriş Başarılı!",
        description: response.message || "Email ile giriş yapıldı.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      setTimeout(() => {
        setLocation("/");
      }, 1500);
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "Giriş yapılamadı.");
      toast({
        variant: "destructive",
        title: "Giriş Başarısız",
        description: error.message || "Email ile giriş yapılamadı.",
      });
    }
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await processSignIn(email.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <LogoFull />
          </div>
          <CardTitle className="text-2xl font-bold" data-testid="text-title">
            Email ile Giriş
          </CardTitle>
          <CardDescription className="text-base mt-2" data-testid="text-description">
            {status === "checking" && "Bağlantı kontrol ediliyor..."}
            {status === "need-email" && "Devam etmek için email adresinizi girin"}
            {status === "processing" && "Giriş yapılıyor..."}
            {status === "success" && "Giriş başarılı! Yönlendiriliyorsunuz..."}
            {status === "error" && "Bir sorun oluştu"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === "checking" && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {status === "need-email" && (
            <form onSubmit={handleSubmitEmail} className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <Mail className="w-4 h-4 inline mr-2" />
                Bu linki farklı bir cihazda açtınız. Güvenlik için email adresinizi doğrulayın.
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Adresi</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                data-testid="button-submit"
              >
                Giriş Yap
              </Button>
            </form>
          )}

          {status === "processing" && (
            <div className="flex flex-col items-center py-8 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Hesabınıza giriş yapılıyor...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center py-8 gap-4">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p className="text-center text-muted-foreground">
                Giriş başarılı! Ana sayfaya yönlendiriliyorsunuz...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center py-8 gap-4">
              <XCircle className="w-12 h-12 text-destructive" />
              <p className="text-center text-muted-foreground">
                {errorMessage}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/giris" data-testid="link-login">
                    Giriş Sayfasına Dön
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
