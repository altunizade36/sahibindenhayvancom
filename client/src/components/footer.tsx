import { Link } from "wouter";
import { CookieSettingsButton } from "@/components/cookie-consent";

/**
 * Alt bilgi — bilinçli olarak kompakt.
 *
 * Önceki hâli dört sütunluk kalın bir bloktu ve ekranın önemli bir kısmını
 * kaplıyordu; içerik az olduğunda sayfanın yarısı alt bilgiye gidiyordu.
 * Burada bağlantılar tek bir sarmalayan satır kümesine indirildi: aynı
 * bağlantılar duruyor, kapladığı dikey alan belirgin şekilde azaldı.
 */

const platformLinks = [
  { href: "/ilanlar", label: "İlanlar" },
  { href: "/magazalar", label: "Mağazalar" },
  { href: "/veteriner-hizmetleri", label: "Veteriner" },
  { href: "/nakliye-hizmetleri", label: "Nakliye" },
  { href: "/piyasa-fiyatlari", label: "Piyasa Fiyatları" },
  { href: "/blog", label: "Blog" },
  { href: "/hakkimizda", label: "Hakkımızda" },
];

const legalLinks = [
  { href: "/kullanim-kosullari", label: "Kullanım Koşulları" },
  { href: "/gizlilik-politikasi", label: "Gizlilik" },
  { href: "/kvkk", label: "KVKK" },
  { href: "/cerez-politikasi", label: "Çerez Politikası" },
  { href: "/ilan-kurallari", label: "İlan Kuralları" },
  { href: "/yardim", label: "Yardım" },
  { href: "/iletisim", label: "İletişim" },
];

function LinkRow({ items }: { items: { href: string; label: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            data-testid={`footer-link-${item.href.slice(1)}`}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          {/* Marka + bağlantılar aynı satırda (geniş ekran) */}
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <Link href="/" className="shrink-0">
              <span className="text-base font-bold tracking-tight leading-none">
                <span className="text-foreground">sahibinden</span>
                <span className="text-primary">hayvan</span>
              </span>
            </Link>

            <div className="flex flex-col gap-1.5 md:items-end">
              <LinkRow items={platformLinks} />
              <LinkRow items={legalLinks} />
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-1.5 border-t pt-3 text-[11px] text-muted-foreground md:flex-row">
            <p data-testid="footer-copyright">
              © {new Date().getFullYear()} sahibindenhayvan.com — Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-3">
              <CookieSettingsButton />
              <span className="hidden sm:inline">
                5199 sayılı Hayvanları Koruma Kanunu kapsamında faaliyet göstermektedir.
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
