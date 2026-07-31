/**
 * marketDataService.ts
 * Gerçek zamanlı piyasa verisi servisi.
 * - Döviz: TCMB XML API (ücretsiz, resmi, her iş günü güncellenir)
 * - Hayvancılık: DB cache + periyodik güncelleme
 */

interface TCMBRate {
  code: string;
  name: string;
  buying: number;
  selling: number;
  prevBuying?: number; // Dünkü kur (değişim % için)
}

interface TCMBResult {
  rates: TCMBRate[];
  date: string;
  fetchedAt: Date;
}

// Bellek içi cache (TCMB günde bir günceller, 30 dk TTL yeterli)
let tcmbCache: TCMBResult | null = null;
const TCMB_TTL_MS = 30 * 60 * 1000; // 30 dakika

function parseTCMBXml(xml: string): TCMBResult {
  const dateMatch = xml.match(/Date="(\d{2}\/\d{2}\/\d{4})"/);
  const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString("tr-TR");

  const rates: TCMBRate[] = [];

  // Her <Currency ...> bloğunu ayrıştır
  const currencyRegex = /<Currency[^>]+CurrencyCode="([A-Z]+)"[^>]*>([\s\S]*?)<\/Currency>/g;
  let match: RegExpExecArray | null;

  while ((match = currencyRegex.exec(xml)) !== null) {
    const code = match[1];
    const block = match[2];

    const buyMatch = block.match(/<ForexBuying>([\d.]+)<\/ForexBuying>/);
    const sellMatch = block.match(/<ForexSelling>([\d.]+)<\/ForexSelling>/);
    const nameMatch = block.match(/<CurrencyName>([^<]+)<\/CurrencyName>/);

    if (!buyMatch || !sellMatch) continue;

    const buying = parseFloat(buyMatch[1]);
    const selling = parseFloat(sellMatch[1]);
    if (isNaN(buying) || buying === 0) continue;

    rates.push({
      code,
      name: nameMatch ? nameMatch[1] : code,
      buying,
      selling,
    });
  }

  return { rates, date, fetchedAt: new Date() };
}

/** Önceki güne ait TCMB kurlarını çek (değişim % hesabı için) */
async function fetchPrevTCMBRates(): Promise<Map<string, number>> {
  try {
    // TCMB önceki günler için URL: /kurlar/YYYY/MM/DDMMYYYY.xml
    const today = new Date();
    // Önceki iş günü
    let prev = new Date(today);
    prev.setDate(prev.getDate() - 1);
    if (prev.getDay() === 0) prev.setDate(prev.getDate() - 2); // Pazar → Cuma
    if (prev.getDay() === 6) prev.setDate(prev.getDate() - 1); // Cumartesi → Cuma

    const dd = String(prev.getDate()).padStart(2, "0");
    const mm = String(prev.getMonth() + 1).padStart(2, "0");
    const yyyy = prev.getFullYear();
    const url = `https://www.tcmb.gov.tr/kurlar/${yyyy}/${mm}/${dd}${mm}${yyyy}.xml`;

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return new Map();
    const xml = await res.text();
    const parsed = parseTCMBXml(xml);
    return new Map(parsed.rates.map((r) => [r.code, r.buying]));
  } catch {
    return new Map();
  }
}

/** TCMB'den güncel döviz kurlarını getir (cache'li) */
export async function getTCMBRates(): Promise<TCMBResult> {
  const now = new Date();

  // Cache geçerliyse döndür
  if (tcmbCache && now.getTime() - tcmbCache.fetchedAt.getTime() < TCMB_TTL_MS) {
    return tcmbCache;
  }

  try {
    const [todayRes, prevRates] = await Promise.all([
      fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "Mozilla/5.0 sahibindenhayvan-market-data/1.0" },
      }),
      fetchPrevTCMBRates(),
    ]);

    if (!todayRes.ok) throw new Error(`TCMB HTTP ${todayRes.status}`);
    const xml = await todayRes.text();
    const result = parseTCMBXml(xml);

    // Değişim % hesapla
    for (const rate of result.rates) {
      const prev = prevRates.get(rate.code);
      if (prev && prev > 0) {
        rate.prevBuying = prev;
      }
    }

    tcmbCache = result;
    console.log(`✅ TCMB döviz kurları güncellendi: ${result.rates.length} kur, tarih: ${result.date}`);
    return result;
  } catch (err) {
    console.error("⚠️  TCMB API hatası:", err);
    // Cache varsa stale olarak döndür
    if (tcmbCache) return tcmbCache;
    throw err;
  }
}

/** Ticker'da gösterilecek dövizler */
export const TICKER_CURRENCIES = ["USD", "EUR", "GBP", "CHF"];

/** TCMB sonucundan ticker-uyumlu format */
export function formatCurrencyForTicker(result: TCMBResult) {
  return result.rates
    .filter((r) => TICKER_CURRENCIES.includes(r.code))
    .map((r) => {
      const changePercent =
        r.prevBuying && r.prevBuying > 0
          ? ((r.buying - r.prevBuying) / r.prevBuying) * 100
          : null;

      return {
        id: `tcmb-${r.code.toLowerCase()}-try`,
        type: "doviz" as const,
        category: `${r.code}/TRY`,
        city: "TCMB",
        price: r.buying.toFixed(4),
        unit: "₺",
        change_percent: changePercent !== null ? changePercent.toFixed(2) : "0.00",
        source: "TCMB",
        isLive: true,
        date: new Date().toISOString(),
      };
    });
}
