import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "tr" | "en";

interface TranslationContext {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<TranslationContext | null>(null);

const translations: Record<Language, Record<string, string>> = {
  tr: {
    "nav.home": "Ana Sayfa",
    "nav.listings": "Ilanlar",
    "nav.categories": "Kategoriler",
    "nav.blog": "Blog",
    "nav.stores": "Magazalar",
    "nav.login": "Giris Yap",
    "nav.register": "Kayit Ol",
    "nav.profile": "Profilim",
    "nav.myListings": "Ilanlarim",
    "nav.favorites": "Favorilerim",
    "nav.messages": "Mesajlar",
    "nav.notifications": "Bildirimler",
    "nav.logout": "Cikis Yap",
    "nav.createListing": "Ilan Ver",
    
    "home.hero.title": "Hayvan Ilanlarinda Guvenilir Adres",
    "home.hero.subtitle": "Binlerce ilan arasinda aradaginizi bulun",
    "home.search.placeholder": "Ara... (ornegin: Golden Retriever)",
    "home.categories": "Kategoriler",
    "home.featured": "One Cikan Ilanlar",
    "home.recent": "Son Eklenen Ilanlar",
    "home.viewAll": "Tumunu Gor",
    
    "listing.price": "Fiyat",
    "listing.location": "Konum",
    "listing.breed": "Irk",
    "listing.age": "Yas",
    "listing.gender": "Cinsiyet",
    "listing.health": "Saglik Durumu",
    "listing.vaccinated": "Asilanmis",
    "listing.neutered": "Kisir",
    "listing.pedigree": "Soy Kagidi",
    "listing.description": "Aciklama",
    "listing.contact": "Iletisim",
    "listing.sendMessage": "Mesaj Gonder",
    "listing.makeOffer": "Teklif Ver",
    "listing.addFavorite": "Favorilere Ekle",
    "listing.removeFavorite": "Favorilerden Cikar",
    "listing.share": "Paylas",
    "listing.report": "Sikayet Et",
    "listing.views": "goruntulenme",
    "listing.favorites": "favori",
    "listing.similar": "Benzer Ilanlar",
    "listing.priceComparison": "Fiyat Karsilastirmasi",
    
    "offer.title": "Teklif Ver",
    "offer.amount": "Teklif Tutari",
    "offer.message": "Mesaj",
    "offer.send": "Teklif Gonder",
    "offer.cancel": "Iptal",
    "offer.accept": "Kabul Et",
    "offer.reject": "Reddet",
    "offer.counter": "Karsi Teklif",
    "offer.pending": "Beklemede",
    "offer.accepted": "Kabul Edildi",
    "offer.rejected": "Reddedildi",
    
    "share.whatsapp": "WhatsApp",
    "share.facebook": "Facebook",
    "share.twitter": "X (Twitter)",
    "share.copy": "Link Kopyala",
    "share.copied": "Kopyalandi",
    
    "filter.all": "Tumu",
    "filter.category": "Kategori",
    "filter.city": "Sehir",
    "filter.district": "Ilce",
    "filter.priceRange": "Fiyat Araligi",
    "filter.min": "En Az",
    "filter.max": "En Fazla",
    "filter.apply": "Uygula",
    "filter.clear": "Temizle",
    
    "auth.email": "E-posta",
    "auth.password": "Sifre",
    "auth.confirmPassword": "Sifre Tekrar",
    "auth.login": "Giris Yap",
    "auth.register": "Kayit Ol",
    "auth.forgotPassword": "Sifremi Unuttum",
    "auth.noAccount": "Hesabiniz yok mu?",
    "auth.hasAccount": "Zaten hesabiniz var mi?",
    
    "common.loading": "Yukleniyor...",
    "common.error": "Hata",
    "common.success": "Basarili",
    "common.save": "Kaydet",
    "common.cancel": "Iptal",
    "common.delete": "Sil",
    "common.edit": "Duzenle",
    "common.back": "Geri",
    "common.next": "Ileri",
    "common.search": "Ara",
    "common.noResults": "Sonuc bulunamadi",
    "common.tryAgain": "Tekrar Dene",
    
    "seller.level.bronze": "Bronz Satici",
    "seller.level.silver": "Gumus Satici",
    "seller.level.gold": "Altin Satici",
    "seller.level.platinum": "Platin Satici",
    "seller.level.diamond": "Elmas Satici",
    
    "pwa.install": "Uygulamayi Yukle",
    "pwa.installPrompt": "Daha iyi deneyim icin uygulamayi yukleyin",
    
    "offline.title": "Cevrimdisi",
    "offline.message": "Internet baglantiniz yok",
    "offline.retry": "Tekrar Dene",
  },
  en: {
    "nav.home": "Home",
    "nav.listings": "Listings",
    "nav.categories": "Categories",
    "nav.blog": "Blog",
    "nav.stores": "Stores",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.profile": "My Profile",
    "nav.myListings": "My Listings",
    "nav.favorites": "Favorites",
    "nav.messages": "Messages",
    "nav.notifications": "Notifications",
    "nav.logout": "Logout",
    "nav.createListing": "Create Listing",
    
    "home.hero.title": "Trusted Platform for Animal Listings",
    "home.hero.subtitle": "Find what you're looking for among thousands of listings",
    "home.search.placeholder": "Search... (e.g., Golden Retriever)",
    "home.categories": "Categories",
    "home.featured": "Featured Listings",
    "home.recent": "Recently Added",
    "home.viewAll": "View All",
    
    "listing.price": "Price",
    "listing.location": "Location",
    "listing.breed": "Breed",
    "listing.age": "Age",
    "listing.gender": "Gender",
    "listing.health": "Health Status",
    "listing.vaccinated": "Vaccinated",
    "listing.neutered": "Neutered",
    "listing.pedigree": "Pedigree",
    "listing.description": "Description",
    "listing.contact": "Contact",
    "listing.sendMessage": "Send Message",
    "listing.makeOffer": "Make Offer",
    "listing.addFavorite": "Add to Favorites",
    "listing.removeFavorite": "Remove from Favorites",
    "listing.share": "Share",
    "listing.report": "Report",
    "listing.views": "views",
    "listing.favorites": "favorites",
    "listing.similar": "Similar Listings",
    "listing.priceComparison": "Price Comparison",
    
    "offer.title": "Make an Offer",
    "offer.amount": "Offer Amount",
    "offer.message": "Message",
    "offer.send": "Send Offer",
    "offer.cancel": "Cancel",
    "offer.accept": "Accept",
    "offer.reject": "Reject",
    "offer.counter": "Counter Offer",
    "offer.pending": "Pending",
    "offer.accepted": "Accepted",
    "offer.rejected": "Rejected",
    
    "share.whatsapp": "WhatsApp",
    "share.facebook": "Facebook",
    "share.twitter": "X (Twitter)",
    "share.copy": "Copy Link",
    "share.copied": "Copied",
    
    "filter.all": "All",
    "filter.category": "Category",
    "filter.city": "City",
    "filter.district": "District",
    "filter.priceRange": "Price Range",
    "filter.min": "Min",
    "filter.max": "Max",
    "filter.apply": "Apply",
    "filter.clear": "Clear",
    
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm Password",
    "auth.login": "Login",
    "auth.register": "Register",
    "auth.forgotPassword": "Forgot Password",
    "auth.noAccount": "Don't have an account?",
    "auth.hasAccount": "Already have an account?",
    
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.back": "Back",
    "common.next": "Next",
    "common.search": "Search",
    "common.noResults": "No results found",
    "common.tryAgain": "Try Again",
    
    "seller.level.bronze": "Bronze Seller",
    "seller.level.silver": "Silver Seller",
    "seller.level.gold": "Gold Seller",
    "seller.level.platinum": "Platinum Seller",
    "seller.level.diamond": "Diamond Seller",
    
    "pwa.install": "Install App",
    "pwa.installPrompt": "Install the app for a better experience",
    
    "offline.title": "Offline",
    "offline.message": "No internet connection",
    "offline.retry": "Retry",
  },
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("language") as Language;
      if (saved && (saved === "tr" || saved === "en")) {
        return saved;
      }
      const browserLang = navigator.language.split("-")[0];
      return browserLang === "en" ? "en" : "tr";
    }
    return "tr";
  });
  
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    document.documentElement.lang = lang;
  };
  
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  
  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[language][key] || translations.tr[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, String(value));
      });
    }
    
    return text;
  };
  
  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

export function useTranslation() {
  return useI18n();
}
