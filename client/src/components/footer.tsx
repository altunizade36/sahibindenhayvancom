import { Link } from "wouter";
import { LogoFull } from "@/components/logo";
import { CookieSettingsButton } from "@/components/cookie-consent";

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t mt-auto">
      <div className="container mx-auto px-4 py-5 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <LogoFull className="h-auto w-auto max-w-[200px] sm:max-w-none mb-3" />
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Türkiye'nin en güvenilir hayvan ilanları platformu. Evcil hayvanlarınızı güvenle alın, satın, sahiplenin.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2" data-testid="footer-section-platform">Platform</h4>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-home">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link href="/ilanlar" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-listings">
                  İlanlar
                </Link>
              </li>
              <li>
                <Link href="/magazalar" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-stores">
                  Mağazalar
                </Link>
              </li>
              <li>
                <Link href="/veteriner-hizmetleri" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-vet">
                  Veteriner Hizmetleri
                </Link>
              </li>
              <li>
                <Link href="/nakliye-hizmetleri" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-transport">
                  Nakliye Hizmetleri
                </Link>
              </li>
              <li>
                <Link href="/piyasa-fiyatlari" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-prices">
                  Piyasa Fiyatları
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-blog">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/hakkimizda" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-about">
                  Hakkımızda
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2" data-testid="footer-section-legal">Yasal</h4>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link href="/kullanim-kosullari" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-terms">
                  Kullanım Koşulları
                </Link>
              </li>
              <li>
                <Link href="/gizlilik-politikasi" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-privacy">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link href="/kvkk" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-kvkk">
                  KVKK Aydınlatma Metni
                </Link>
              </li>
              <li>
                <Link href="/cerez-politikasi" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-cookies">
                  Çerez Politikası
                </Link>
              </li>
              <li>
                <Link href="/ilan-kurallari" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-listing-rules">
                  İlan Kuralları
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2" data-testid="footer-section-support">Destek</h4>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link href="/yardim" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-help">
                  Yardım Merkezi
                </Link>
              </li>
              <li>
                <Link href="/iletisim" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-contact">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-4 pt-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground text-center md:text-left" data-testid="footer-copyright">
            © {new Date().getFullYear()} sahibindenhayvan.com - Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <CookieSettingsButton />
            <p className="text-muted-foreground text-center md:text-right">
              5199 sayılı Hayvanları Koruma Kanunu kapsamında faaliyet göstermektedir.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
