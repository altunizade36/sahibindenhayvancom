import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verificationToken = params.get('token');
    
    if (!verificationToken) {
      setStatus('error');
      setMessage('Geçersiz doğrulama linki');
      return;
    }

    setToken(verificationToken);
    verifyEmail(verificationToken);
  }, []);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`);
      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        
        // Save token if provided
        if (data.token) {
          localStorage.setItem('token', data.token);
        }

        toast({
          title: "Başarılı!",
          description: "Email adresiniz doğrulandı. Giriş yapabilirsiniz.",
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          setLocation('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Doğrulama başarısız oldu');
        
        toast({
          variant: "destructive",
          title: "Hata",
          description: data.message,
        });
      }
    } catch (error) {
      setStatus('error');
      setMessage('Doğrulama işlemi sırasında bir hata oluştu');
      
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bir hata oluştu. Lütfen tekrar deneyin.",
      });
    }
  };

  const handleResendVerification = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        toast({
          variant: "destructive",
          description: "Lütfen önce giriş yapın",
        });
        setLocation('/login');
        return;
      }

      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Doğrulama emaili tekrar gönderildi",
        });
      } else {
        toast({
          variant: "destructive",
          description: data.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Email gönderilemedi",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'verifying' && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" data-testid="icon-verifying" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-16 w-16 text-green-600" data-testid="icon-success" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-destructive" data-testid="icon-error" />
            )}
          </div>
          <CardTitle data-testid="text-title">
            {status === 'verifying' && 'Email Doğrulanıyor...'}
            {status === 'success' && 'Email Doğrulandı!'}
            {status === 'error' && 'Doğrulama Başarısız'}
          </CardTitle>
          <CardDescription data-testid="text-message">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'success' && (
            <p className="text-center text-sm text-muted-foreground">
              3 saniye içinde giriş sayfasına yönlendirileceksiniz...
            </p>
          )}
          
          {status === 'error' && (
            <div className="space-y-3">
              <Button
                onClick={handleResendVerification}
                className="w-full"
                variant="outline"
                data-testid="button-resend"
              >
                <Mail className="mr-2 h-4 w-4" />
                Doğrulama Emaili Tekrar Gönder
              </Button>
              
              <Button
                onClick={() => setLocation('/login')}
                className="w-full"
                data-testid="button-login"
              >
                Giriş Sayfasına Dön
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
