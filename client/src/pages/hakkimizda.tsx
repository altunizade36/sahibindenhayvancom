import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import { SEOHead } from "@/components/seo-head";
import { COMPANY, companyIdentityRows } from "@/lib/company";
import {
  PawPrint,
  ShieldCheck,
  HeartHandshake,
  Scale,
  Building2,
  Mail,
  ArrowRight,
} from "lucide-react";

const values = [
  {
    icon: ShieldCheck,
    title: "Güvenli İlan",
    text: "Her ilan yayına girmeden önce moderasyondan geçer. Şüpheli içerik ve sahte hesaplara karşı spam filtresi, hız sınırlama ve bot koruması çalışır.",
  },
  {
    icon: Scale,
    title: "Yasalara Uygunluk",
    text: "5199 sayılı Hayvanları Koruma Kanunu ve ilgili mevzuat gereği yasaklı tür satışı engellenir; mikroçip, pasaport ve TÜRKVET kaydı gereken kategorilerde belge istenir.",
  },
  {
    icon: HeartHandshake,
    title: "Hayvan Refahı Önce Gelir",
    text: "Yavruların annesinden erken ayrılmasına izin vermeyiz. Amacımız ticaret hacmi değil, hayvanın doğru sahibe ulaşmasıdır.",
  },
  {
    icon: PawPrint,
    title: "Ücretsiz",
    text: "İlan vermek tamamen ücretsizdir. Platformun büyümesini kullanıcı sayısı üzerinden planlıyoruz, ilan başına ücret almıyoruz.",
  },
];

export default function Hakkimizda() {
  const identity = companyIdentityRows();

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead
        title="Hakkımızda | sahibindenhayvan.com"
        description="sahibindenhayvan.com; hayvan ilanlarını güvenli, ücretsiz ve yasalara uygun biçimde buluşturan Türkiye merkezli bir platformdur."
        canonical="/hakkimizda"
      />

      <main className="container mx-auto flex-1 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <PawPrint className="mx-auto mb-4 h-14 w-14 text-primary" />
            <h1 className="text-3xl font-bold md:text-4xl">Hakkımızda</h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              {COMPANY.brand}, hayvan alım-satımını ve sahiplendirmeyi tek çatı altında
              toplayan Türkiye merkezli bir ilan platformudur. Evcil hayvanlardan
              çiftlik hayvanlarına, arıcılıktan su ürünlerine kadar geniş bir alanda
              alıcı ile satıcıyı doğrudan buluşturuyoruz.
            </p>
          </div>

          <section className="mb-10 grid gap-4 sm:grid-cols-2">
            {values.map(({ icon: Icon, title, text }) => (
              <Card key={title}>
                <CardHeader className="pb-2">
                  <Icon className="mb-2 h-7 w-7 text-primary" />
                  <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card className="mb-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Kurumsal Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {identity.map((row) => (
                  <li key={row.label}>
                    <strong>{row.label}:</strong> {row.value}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Yasal metinlerimiz için{" "}
                <Link href="/kullanim-kosullari" className="text-primary hover:underline">
                  Kullanım Koşulları
                </Link>
                ,{" "}
                <Link href="/gizlilik-politikasi" className="text-primary hover:underline">
                  Gizlilik Politikası
                </Link>{" "}
                ve{" "}
                <Link href="/kvkk" className="text-primary hover:underline">
                  KVKK Aydınlatma Metni
                </Link>{" "}
                sayfalarını inceleyebilirsiniz.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
              <div className="flex items-center gap-3">
                <Mail className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="font-semibold">Bize ulaşın</h2>
                  <p className="text-sm text-muted-foreground">
                    Soru, öneri veya iş birliği için yazın: {COMPANY.email}
                  </p>
                </div>
              </div>
              <Link href="/iletisim">
                <Button className="gap-2">
                  İletişim <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
