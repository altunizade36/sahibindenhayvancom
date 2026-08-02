/**
 * Yalnızca DEP0169 (`url.parse()`) deprecation uyarısını susturur.
 *
 * Neden: Vercel'in serverless request runtime'ı (ve/veya bir alt bağımlılık)
 * her gelen isteğin URL'sini `url.parse()` ile ayrıştırıyor. Node 20+ bunu
 * DEP0169 ile uyarıyor ve uyarı her invocation'da stderr'e düşüyordu — Vercel
 * bunu "error" seviyesinde gösterdiği için log paneli baştan sona bu tek
 * uyarıyla doluyor, gerçek hatalar kayboluyordu. Bizim kodumuz `url.parse`
 * ÇAĞIRMIYOR (arandı, yok); kaynak bizim düzeltemeyeceğimiz bir katman.
 *
 * Uyarının kendisi düşük risklidir — mesajın kendisi bile "CVEs are not issued
 * for url.parse() vulnerabilities" diyor. Yani bu operasyonel bir gürültü
 * temizliği, güvenlik kararı değil.
 *
 * `--no-deprecation` / `--no-warnings` gibi topyekûn susturma KULLANILMADI:
 * o bayraklar bizim kodumuzdaki gerçek deprecation'ları da gizlerdi. Bu filtre
 * yalnızca `url.parse` / DEP0169'u yutar, geri kalan her uyarıyı olduğu gibi
 * geçirir. Herhangi bir bağımlılık yüklenmeden ÖNCE, giriş noktalarının en üst
 * import'u olarak çalışmalı.
 */
const orijinalEmit = process.emitWarning.bind(process);

function url_parse_uyarisi(mesaj: unknown, args: unknown[]): boolean {
  if (typeof mesaj === "string" && mesaj.includes("url.parse")) return true;
  if (mesaj && typeof mesaj === "object" && "message" in mesaj) {
    const m = (mesaj as { message?: unknown }).message;
    if (typeof m === "string" && m.includes("url.parse")) return true;
  }
  for (const a of args) {
    if (a === "DEP0169") return true;
    if (a && typeof a === "object" && (a as { code?: unknown }).code === "DEP0169") return true;
  }
  return false;
}

(process as unknown as { emitWarning: (...a: unknown[]) => void }).emitWarning = (
  mesaj: unknown,
  ...args: unknown[]
) => {
  if (url_parse_uyarisi(mesaj, args)) return;
  return (orijinalEmit as (...a: unknown[]) => void)(mesaj, ...args);
};

export {};
