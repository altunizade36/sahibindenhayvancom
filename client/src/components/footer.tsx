import { Link } from "wouter";
import { ShieldCheck, Heart, BadgeCheck } from "lucide-react";
import { CookieSettingsButton } from "@/components/cookie-consent";
import { COMPANY } from "@/lib/company";

/**
 * Alt bilgi.
 *
 * Tasarım ilkesi: Türk pazaryerlerinin (sahibinden, Trendyol) alışılmış
 * düzeni — başlıklı sütunlar hâlinde gruplanmış bağlantılar, üstte kısa bir
 * güven şeridi, altta telif ve mevzuat satırı.
 *
 * Daha önce iki denemeden geçti: önce dört sütunluk çok yüksek bir blok
 * (ekranın büyük kısmını kaplıyordu), sonra sarmalayan tek satırlık bağlantı
 * dizisi (yer kaplamıyordu ama düzensiz görünüyordu). Buradaki sürüm ikisinin
 * arası: gruplama ve hiyerarşi korunuyor, tipografi küçük tutularak yükseklik
 * makul seviyede kalıyor.
 */

const columns: Array<{ title: string; links: { href: string; label: string }[] }> = [
  {
    title: "Keşfet",
    links: [
      { href: "/ilanlar", label: "Tüm İlanlar" },
      { href: "/magazalar", label: "Mağazalar" },
      { href: "/piyasa-fiyatlari", label: "Piyasa Fiyatları" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Hizmetler",
    links: [
      { href: "/veteriner-hizmetleri", label: "Veteriner Hizmetleri" },
      { href: "/nakliye-hizmetleri", label: "Nakliye Hizmetleri" },
      { href: "/ilan-ver", label: "Ücretsiz İlan Ver" },
    ],
  },
  {
    title: "Kurumsal",
    links: [
      { href: "/hakkimizda", label: "Hakkımızda" },
      { href: "/iletisim", label: "İletişim" },
      { href: "/yardim", label: "Yardım Merkezi" },
    ],
  },
  {
    title: "Yasal",
    links: [
      { href: "/kullanim-kosullari", label: "Kullanım Koşulları" },
      { href: "/gizlilik-politikasi", label: "Gizlilik Politikası" },
      { href: "/kvkk", label: "KVKK Aydınlatma Metni" },
      { href: "/cerez-politikasi", label: "Çerez Politikası" },
      { href: "/ilan-kurallari", label: "İlan Kuralları" },
    ],
  },
];

const trustPoints = [
  { icon: BadgeCheck, text: "Ücretsiz ilan" },
  { icon: ShieldCheck, text: "Moderasyonlu ilanlar" },
  { icon: Heart, text: "Hayvan refahı odaklı" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/20">
      {/* Güven şeridi */}
      <div className="border-b bg-background/60">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-2.5">
          {trustPoints.map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="h-3.5 w-3.5 text-primary" />
              {text}
            </span>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-5">
          {/* Marka */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-base font-bold leading-none tracking-tight">
                <span className="text-foreground">sahibinden</span>
                <span className="text-primary">hayvan</span>
              </span>
            </Link>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Evcil hayvanlardan çiftlik hayvanlarına, Türkiye'nin ücretsiz
              hayvan ilanları platformu.
            </p>
            {COMPANY.legalName && (
              <p className="mt-2 text-[11px] text-muted-foreground">{COMPANY.legalName}</p>
            )}
          </div>

          {/* Bağlantı sütunları */}
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">
                {col.title}
              </h3>
              <ul className="space-y-1.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] leading-snug text-muted-foreground transition-colors hover:text-primary"
                      data-testid={`footer-link-${link.href.slice(1)}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* Alt şerit */}
      <div className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-3 text-[11px] text-muted-foreground md:flex-row">
          <p data-testid="footer-copyright">
            © {new Date().getFullYear()} {COMPANY.brand} — Tüm hakları saklıdır.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <CookieSettingsButton />
            <span>5199 sayılı Hayvanları Koruma Kanunu kapsamında faaliyet göstermektedir.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
