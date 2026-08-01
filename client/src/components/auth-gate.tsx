import { Loader2 } from "lucide-react";

/**
 * Giriş zorunlu sayfalarda, oturum durumu netleşene kadar gösterilen ara ekran.
 *
 * `useRequireAuth` ile birlikte kullanılır: oturum yüklenirken bir yükleniyor
 * göstergesi, giriş yapılmamışsa yönlendirme bilgisi gösterir. Boş ekran
 * (`return null`) göstermek yerine bunu kullanmak, kullanıcıya sayfanın
 * çalıştığını belli eder.
 */
export function AuthGate({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">
        {isLoading ? "Yükleniyor..." : "Giriş sayfasına yönlendiriliyorsunuz..."}
      </p>
    </div>
  );
}
