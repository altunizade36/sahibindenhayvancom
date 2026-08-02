/**
 * Service worker kaydı.
 *
 * Bu kod eskiden index.html içinde satır içi <script> olarak duruyordu.
 * Ayrı dosyaya alındı ki içerik güvenlik politikası (CSP) betikler için
 * 'unsafe-inline' izni vermek zorunda kalmasın: o izin verildiğinde sayfaya
 * enjekte edilen herhangi bir betik de çalışabilir hâle gelir ve CSP'nin
 * XSS'e karşı sağladığı korumanın büyük kısmı kaybolur.
 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js").catch(function () {
      /* kayıt başarısız olursa uygulama normal çalışmaya devam eder */
    });
  });
}
