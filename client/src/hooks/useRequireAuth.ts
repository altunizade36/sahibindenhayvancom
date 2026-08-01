import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

/**
 * Giriş zorunlu sayfalar için koruma.
 *
 * NEDEN AYRI BİR KANCA
 * --------------------
 * Doğrudan `if (!user) navigate("/giris")` yazmak yaygın ama hatalı: oturum
 * bilgisi `/api/auth/user` isteğiyle geldiği için, sayfa ilk açıldığında istek
 * daha sonuçlanmadan `user` değeri `null` olur. Bu yüzden adres çubuğuna
 * doğrudan yazılarak (veya Google/paylaşılan bağlantıdan) gelen GİRİŞ YAPMIŞ
 * kullanıcı da giriş sayfasına atılır. Uygulama içinden tıklayarak gelindiğinde
 * sorgu önbellekte olduğu için sorun görünmez — bu yüzden gözden kaçar.
 *
 * Çözüm: yönlendirme yalnızca `isLoading` bittikten sonra yapılır.
 *
 * Ayrıca kullanıcının gitmek istediği adres `?redirect=` ile taşınır, giriş
 * sonrası oraya dönebilsin.
 *
 * @returns Sayfanın içeriği çizilmeye hazır mı (oturum doğrulandı mı)
 */
export function useRequireAuth(): { ready: boolean; isLoading: boolean } {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Oturum durumu netleşmeden karar verme
    if (isLoading) return;
    if (isAuthenticated) return;

    const target = `${location}${window.location.search}`;
    setLocation(`/giris?redirect=${encodeURIComponent(target)}`);
  }, [isAuthenticated, isLoading, location, setLocation]);

  return { ready: !isLoading && isAuthenticated, isLoading };
}
