import { useEffect } from "react";
import { PawPrint } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Register() {
  useEffect(() => {
    window.location.href = "/api/login";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <PawPrint className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            sahibinden<span className="text-primary">hayvan</span>
          </CardTitle>
          <CardDescription>
            Kayıt sayfasına yönlendiriliyorsunuz...
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Birkaç saniye içinde otomatik olarak yönlendirileceksiniz.
        </CardContent>
      </Card>
    </div>
  );
}
