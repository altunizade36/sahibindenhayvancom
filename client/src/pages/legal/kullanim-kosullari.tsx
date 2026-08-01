import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COMPANY } from "@/lib/company";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function KullanimKosullari() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ana Sayfa
          </Button>
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Kullanım Koşulları</h1>
          </div>
          <p className="text-muted-foreground">
            Son güncelleme: {COMPANY.legalLastUpdated}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Giriş ve Kabul</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>
                sahibindenhayvan.com ("Platform", "Site", "Biz") Türkiye'de faaliyet gösteren bir hayvan ilanları platformudur. 
                Bu Kullanım Koşulları, Platform'u kullanmanız için geçerli olan şartları belirler.
              </p>
              <p>
                Platform'a kayıt olarak veya Platform'u kullanarak bu Kullanım Koşulları'nı, 
                <Link href="/gizlilik-politikasi" className="text-primary hover:underline mx-1">Gizlilik Politikası</Link>'nı ve 
                <Link href="/ilan-kurallari" className="text-primary hover:underline mx-1">İlan Kuralları</Link>'nı 
                okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan etmiş olursunuz.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Hizmet Tanımı</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>
                Platform, kullanıcıların hayvan alım-satım ilanları yayınlayabileceği, 
                hayvan sahiplerinin ve alıcıların buluşabileceği bir aracı platform hizmetidir.
              </p>
              <p>
                Platform yalnızca bir aracı görevi görmekte olup, kullanıcılar arasındaki 
                işlemlerin tarafı değildir. Satışa sunulan hayvanların mülkiyeti, sağlık durumu 
                ve yasal uygunluğu tamamen satıcının sorumluluğundadır.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Üyelik Koşulları</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>Platform'a üye olmak için:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>18 yaşını doldurmuş olmanız gerekmektedir</li>
                <li>Gerçek ve doğru bilgiler vermeniz zorunludur</li>
                <li>Telefon numaranızı ve e-posta adresinizi doğrulamanız gerekmektedir</li>
                <li>Türkiye Cumhuriyeti vatandaşı olmanız veya Türkiye'de yasal ikamet hakkınız bulunması gerekmektedir</li>
              </ul>
              <p>
                Hesap bilgilerinizin gizliliği sizin sorumluluğunuzdadır. 
                Hesabınız üzerinden gerçekleştirilen tüm işlemlerden siz sorumlusunuz.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Kullanıcı Sorumlulukları</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>Platform'u kullanırken:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-700 dark:text-green-400">Yapmanız Gerekenler</span>
                  </div>
                  <ul className="text-sm space-y-2">
                    <li>• Doğru ve güncel bilgi vermek</li>
                    <li>• Hayvanların sağlık belgelerini sunmak</li>
                    <li>• Yasal düzenlemelere uymak</li>
                    <li>• Diğer kullanıcılara saygılı davranmak</li>
                    <li>• Güvenli iletişim kurallarına uymak</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-700 dark:text-red-400">Yasak Davranışlar</span>
                  </div>
                  <ul className="text-sm space-y-2">
                    <li>• Sahte veya yanıltıcı ilan vermek</li>
                    <li>• Yasadışı hayvan ticareti yapmak</li>
                    <li>• Dolandırıcılık faaliyetleri</li>
                    <li>• Spam veya istenmeyen mesajlar</li>
                    <li>• Platform güvenliğini tehdit etmek</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                5. Hayvan Satışı Yasal Uyarılar
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                  5199 Sayılı Hayvanları Koruma Kanunu ve 5996 Sayılı Veteriner Hizmetleri Kanunu Kapsamında:
                </p>
                <ul className="text-sm space-y-2 text-amber-700 dark:text-amber-400">
                  <li>• Pet shop'larda kedi ve köpek satışı 14 Temmuz 2022 itibarıyla yasaklanmıştır</li>
                  <li>• Evcil hayvanlar için mikroçip ve pasaport zorunludur (1 Ocak 2021)</li>
                  <li>• Büyükbaş hayvanlar için Hayvan Pasaportu zorunludur</li>
                  <li>• Küçükbaş hayvanlar için Nakil Belgesi gereklidir</li>
                  <li>• Yaban hayvanları için CITES belgesi gerekebilir</li>
                </ul>
              </div>
              <p>
                Satıcılar, yukarıdaki yasal düzenlemelere uygun hareket etmekle yükümlüdür. 
                Yasal olmayan satışlardan Platform sorumlu tutulamaz.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. İlan Kuralları</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>İlan verirken aşağıdaki kurallara uymanız zorunludur:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>İlan içeriği doğru ve güncel olmalıdır</li>
                <li>Hayvanın gerçek fotoğrafları kullanılmalıdır</li>
                <li>Fiyat bilgisi gerçeği yansıtmalıdır</li>
                <li>Sağlık durumu açıkça belirtilmelidir</li>
                <li>Aşı ve tedavi bilgileri eksiksiz paylaşılmalıdır</li>
              </ul>
              <p>
                Detaylı kurallar için <Link href="/ilan-kurallari" className="text-primary hover:underline">İlan Kuralları</Link> sayfasını inceleyiniz.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Fikri Mülkiyet Hakları</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>
                Platform'un tasarımı, logosu, yazılımı ve tüm içerikleri fikri mülkiyet hakları 
                kapsamında korunmaktadır. İzinsiz kopyalama, dağıtım veya değiştirme yasaktır.
              </p>
              <p>
                Kullanıcılar, Platform'a yükledikleri içeriklerin (fotoğraf, metin vb.) 
                kullanım hakkını Platform'a vermiş sayılır.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Sorumluluk Sınırlaması</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>Platform:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Kullanıcılar arasındaki işlemlerin tarafı değildir</li>
                <li>Satışa sunulan hayvanların sağlık durumunu garanti etmez</li>
                <li>Kullanıcılar arasındaki anlaşmazlıklardan sorumlu değildir</li>
                <li>İlan içeriklerinin doğruluğunu garanti etmez</li>
                <li>Üçüncü taraf kaynaklı zararlardan sorumlu tutulamaz</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Hesap Askıya Alma ve Kapatma</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>
                Platform, kullanım koşullarını ihlal eden kullanıcıların hesaplarını 
                önceden bildirimde bulunmaksızın askıya alabilir veya kalıcı olarak kapatabilir.
              </p>
              <p>Hesap kapatma sebepleri:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Sahte veya yanıltıcı bilgi vermek</li>
                <li>Dolandırıcılık girişimi</li>
                <li>Yasaklı ürün/hayvan satışı</li>
                <li>Diğer kullanıcılara zarar verici davranışlar</li>
                <li>Tekrarlanan kural ihlalleri</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Uyuşmazlık Çözümü</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>
                Bu sözleşmeden doğan uyuşmazlıklarda Türkiye Cumhuriyeti kanunları uygulanır.
              </p>
              <p>
                Uyuşmazlık halinde İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
              </p>
              <p>
                Tüketici işlemlerinde Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri de yetkilidir.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Değişiklikler</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>
                Platform, bu Kullanım Koşulları'nı herhangi bir zamanda değiştirme hakkını saklı tutar. 
                Değişiklikler Platform'da yayınlandığı andan itibaren geçerli olur.
              </p>
              <p>
                Önemli değişiklikler için kayıtlı e-posta adresinize bildirim gönderilecektir.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. İletişim</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>
                Bu Kullanım Koşulları hakkında sorularınız için:
              </p>
              <ul className="list-none space-y-2">
                <li><strong>E-posta:</strong> destek@sahibindenhayvan.com</li>
                <li><strong>Adres:</strong> İstanbul, Türkiye</li>
              </ul>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/gizlilik-politikasi">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Gizlilik Politikası
              </Badge>
            </Link>
            <Link href="/cerez-politikasi">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Çerez Politikası
              </Badge>
            </Link>
            <Link href="/ilan-kurallari">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                İlan Kuralları
              </Badge>
            </Link>
            <Link href="/kvkk">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                KVKK Aydınlatma Metni
              </Badge>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
