export const marketPricesSeed = [
  // Büyükbaş - Canlı Hayvan
  { type: "buyukbas", category: "Büyükbaş Canlı", city: "Türkiye", price: 300.38, unit: "₺/kg", changePercent: 21.0, source: "TZOB" },
  { type: "buyukbas", category: "Dana Karkas", city: "Türkiye", price: 425.00, unit: "₺/kg", changePercent: 11.8, source: "ESK" },
  { type: "buyukbas", category: "Dana Kıyma", city: "Türkiye", price: 675.00, unit: "₺/kg", changePercent: 8.9, source: "ESK" },
  
  // Küçükbaş - Canlı Hayvan
  { type: "kucukbas", category: "Küçükbaş Canlı", city: "Türkiye", price: 307.52, unit: "₺/kg", changePercent: 25.9, source: "TZOB" },
  { type: "kucukbas", category: "Kuzu Karkas", city: "Türkiye", price: 525.00, unit: "₺/kg", changePercent: 16.7, source: "ESK" },
  { type: "kucukbas", category: "Kuzu Pirzola", city: "Türkiye", price: 940.00, unit: "₺/kg", changePercent: 12.5, source: "ESK" },
  
  // Kanatlı
  { type: "kanatli", category: "Tavuk Canlı", city: "Türkiye", price: 92.50, unit: "₺/kg", changePercent: 15.6, source: "Borsa" },
  { type: "kanatli", category: "Bütün Tavuk", city: "Türkiye", price: 92.50, unit: "₺/kg", changePercent: 10.1, source: "Market" },
  { type: "kanatli", category: "Tavuk Göğüs", city: "Türkiye", price: 215.00, unit: "₺/kg", changePercent: 8.4, source: "Market" },
  
  // Et Fiyatları
  { type: "et", category: "Dana Antrikot", city: "Türkiye", price: 1050.00, unit: "₺/kg", changePercent: 14.2, source: "ESK" },
  { type: "et", category: "Dana Bonfile", city: "Türkiye", price: 1025.00, unit: "₺/kg", changePercent: 12.8, source: "ESK" },
  { type: "et", category: "Kuzu Kuşbaşı", city: "Türkiye", price: 960.00, unit: "₺/kg", changePercent: 18.3, source: "ESK" },
  
  // Süt Ürünleri
  { type: "sut", category: "Çiğ Süt", city: "Türkiye", price: 23.52, unit: "₺/lt", changePercent: 1.8, source: "USK" },
  { type: "sut", category: "Tereyağı", city: "Türkiye", price: 435.00, unit: "₺/kg", changePercent: 24.6, source: "Market" },
  { type: "sut", category: "Beyaz Peynir", city: "Türkiye", price: 285.00, unit: "₺/kg", changePercent: 12.4, source: "Market" },
  { type: "sut", category: "Kaşar Peynir", city: "Türkiye", price: 420.00, unit: "₺/kg", changePercent: 15.8, source: "Market" },
  
  // Yem Fiyatları
  { type: "yem", category: "Arpa", city: "Türkiye", price: 12.50, unit: "₺/kg", changePercent: 10.6, source: "Borsa" },
  { type: "yem", category: "Mısır", city: "Türkiye", price: 13.80, unit: "₺/kg", changePercent: 7.4, source: "Borsa" },
  { type: "yem", category: "Soya Küspesi", city: "Türkiye", price: 22.40, unit: "₺/kg", changePercent: 10.3, source: "Borsa" },
  { type: "yem", category: "Yonca", city: "Türkiye", price: 8.50, unit: "₺/kg", changePercent: 5.2, source: "Borsa" },
  { type: "yem", category: "Saman", city: "Türkiye", price: 6.20, unit: "₺/kg", changePercent: 8.1, source: "Borsa" },
  
  // Yumurta
  { type: "yumurta", category: "Yumurta (30'lu)", city: "Türkiye", price: 135.00, unit: "₺/koli", changePercent: 6.8, source: "Borsa" },
  { type: "yumurta", category: "Organik Yumurta", city: "Türkiye", price: 185.00, unit: "₺/koli", changePercent: 4.2, source: "Market" },
  
  // Bal
  { type: "bal", category: "Çiçek Balı", city: "Türkiye", price: 450.00, unit: "₺/kg", changePercent: 8.5, source: "Üretici" },
  { type: "bal", category: "Süzme Bal", city: "Türkiye", price: 520.00, unit: "₺/kg", changePercent: 9.2, source: "Üretici" },
];

export const currencyRates = [
  { name: "USD/TRY", price: 42.43, changePercent: 0.43 },
  { name: "EUR/TRY", price: 49.66, changePercent: 0.49 },
];
