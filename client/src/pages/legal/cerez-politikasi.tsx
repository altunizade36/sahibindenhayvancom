import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { ArrowLeft, Cookie, Settings, BarChart3, Target, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function CerezPolitikasi() {
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
            <Cookie className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Çerez Politikası</h1>
          </div>
          <p className="text-muted-foreground">
            Son güncelleme: 1 Aralık 2024
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Çerez Nedir?</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>
                Çerezler, web sitelerinin cihazınıza (bilgisayar, tablet, telefon) yerleştirdiği 
                küçük metin dosyalarıdır. Bu dosyalar, siteyi ziyaret ettiğinizde deneyiminizi 
                kişiselleştirmek ve iyileştirmek için kullanılır.
              </p>
              <p>
                Çerezler genellikle oturum bilgilerinizi, tercihlerinizi ve site kullanım 
                alışkanlıklarınızı saklar.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Kullandığımız Çerez Türleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold">Zorunlu Çerezler</h4>
                  </div>
                  <Badge variant="secondary">Her Zaman Aktif</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Site'nin düzgün çalışması için gerekli olan çerezlerdir. Bu çerezler olmadan 
                  temel işlevler (oturum açma, form doldurma vb.) çalışmaz.
                </p>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Oturum çerezi:</strong> Giriş durumunuzu korur</li>
                  <li>• <strong>Güvenlik çerezi:</strong> CSRF koruması sağlar</li>
                  <li>• <strong>Dil tercihi:</strong> Seçtiğiniz dili hatırlar</li>
                  <li>• <strong>Çerez onayı:</strong> Çerez tercihlerinizi saklar</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold">İşlevsel Çerezler</h4>
                  </div>
                  <Switch defaultChecked />
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Site deneyiminizi iyileştirmek için kullanılır. Devre dışı bırakırsanız 
                  bazı özellikler düzgün çalışmayabilir.
                </p>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Tema tercihi:</strong> Açık/koyu mod seçiminiz</li>
                  <li>• <strong>Son aramalar:</strong> Arama geçmişiniz</li>
                  <li>• <strong>Görüntüleme tercihleri:</strong> Liste/ızgara görünümü</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold">Analitik Çerezler</h4>
                  </div>
                  <Switch />
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Site kullanımını anlamamıza ve iyileştirmemize yardımcı olur. 
                  Anonim veriler toplar.
                </p>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Google Analytics:</strong> Ziyaretçi istatistikleri</li>
                  <li>• <strong>Sayfa görüntüleme:</strong> Hangi sayfaların ziyaret edildiği</li>
                  <li>• <strong>Hata takibi:</strong> Teknik sorunların tespiti</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold">Pazarlama Çerezleri</h4>
                  </div>
                  <Switch />
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Size özelleştirilmiş reklamlar göstermek için kullanılır. 
                  Tamamen isteğe bağlıdır.
                </p>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Remarketing:</strong> İlgilendiğiniz ilanları hatırlatma</li>
                  <li>• <strong>Sosyal medya:</strong> Paylaşım butonları entegrasyonu</li>
                  <li>• <strong>Reklam ağları:</strong> İlgi alanlarınıza göre reklamlar</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Üçüncü Taraf Çerezleri</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>Sitemizde aşağıdaki üçüncü taraf hizmetlerin çerezleri kullanılabilir:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm">Google Analytics</h4>
                  <p className="text-xs text-muted-foreground">Site trafiği analizi</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm">Google reCAPTCHA</h4>
                  <p className="text-xs text-muted-foreground">Bot koruması</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm">Cloudflare</h4>
                  <p className="text-xs text-muted-foreground">Güvenlik ve performans</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm">Supabase</h4>
                  <p className="text-xs text-muted-foreground">Veritabanı ve dosya depolama</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-semibold text-sm">Resend</h4>
                  <p className="text-xs text-muted-foreground">E-posta gönderimi</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Çerezleri Nasıl Kontrol Edebilirsiniz?</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>Çerezleri kontrol etmenin birkaç yolu vardır:</p>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">1. Tarayıcı Ayarları</h4>
                  <p className="text-sm text-muted-foreground">
                    Çoğu tarayıcı, çerezleri engelleme veya silme seçeneği sunar:
                  </p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• Chrome: Ayarlar → Gizlilik ve Güvenlik → Çerezler</li>
                    <li>• Firefox: Seçenekler → Gizlilik ve Güvenlik</li>
                    <li>• Safari: Tercihler → Gizlilik</li>
                    <li>• Edge: Ayarlar → Gizlilik ve Güvenlik</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">2. Site Çerez Tercihleri</h4>
                  <p className="text-sm text-muted-foreground">
                    Bu sayfadaki ayarları kullanarak çerez tercihlerinizi yönetebilirsiniz.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">3. Opt-out Linkleri</h4>
                  <p className="text-sm text-muted-foreground">
                    Üçüncü taraf çerezlerini devre dışı bırakmak için:
                  </p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener" className="text-primary hover:underline">Google Analytics Opt-out</a></li>
                    <li>• <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener" className="text-primary hover:underline">Digital Advertising Alliance</a></li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>Uyarı:</strong> Zorunlu çerezleri devre dışı bırakırsanız, sitemizin bazı 
                  özellikleri düzgün çalışmayabilir.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Çerez Saklama Süreleri</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Çerez Türü</th>
                      <th className="text-left p-2">Saklama Süresi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">Oturum çerezleri</td>
                      <td className="p-2">Tarayıcı kapatılınca silinir</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Kimlik doğrulama</td>
                      <td className="p-2">7 gün - 30 gün</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Tercihler</td>
                      <td className="p-2">1 yıl</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Analitik</td>
                      <td className="p-2">2 yıl</td>
                    </tr>
                    <tr>
                      <td className="p-2">Pazarlama</td>
                      <td className="p-2">90 gün - 2 yıl</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. İletişim</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>Çerez politikamız hakkında sorularınız için:</p>
              <ul className="list-none space-y-2">
                <li><strong>E-posta:</strong> destek@sahibindenhayvan.com</li>
              </ul>
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/kullanim-kosullari">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Kullanım Koşulları
              </Badge>
            </Link>
            <Link href="/gizlilik-politikasi">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                Gizlilik Politikası
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
