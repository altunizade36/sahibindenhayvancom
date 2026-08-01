import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { ArrowLeft, Shield, AlertCircle, FileCheck, User, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY, companyIdentityRows } from "@/lib/company";

export default function KVKK() {
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
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">KVKK Aydınlatma Metni</h1>
          </div>
          <p className="text-muted-foreground">
            6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında Aydınlatma Metni
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Son güncelleme: {COMPANY.legalLastUpdated}
          </p>
        </div>

        <div className="space-y-6">
          <Card className="border-primary">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Veri Sorumlusu Kimliği
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="mb-4">
                6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, 
                kişisel verileriniz veri sorumlusu olarak sahibindenhayvan.com ("Platform") 
                tarafından aşağıda açıklanan kapsamda işlenecektir.
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <ul className="space-y-2">
                  {companyIdentityRows().map((row) => (
                    <li key={row.label}>
                      <strong>{row.label}:</strong> {row.value}
                    </li>
                  ))}
                  <li><strong>KVKK Başvuru:</strong> {COMPANY.kvkkEmail}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>1. Kişisel Verilerin İşlenme Amaçları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg text-sm">
                  <strong>a)</strong> Üyelik işlemlerinin gerçekleştirilmesi
                </div>
                <div className="p-3 border rounded-lg text-sm">
                  <strong>b)</strong> İlan yayınlama hizmetinin sunulması
                </div>
                <div className="p-3 border rounded-lg text-sm">
                  <strong>c)</strong> Kullanıcılar arası iletişimin sağlanması
                </div>
                <div className="p-3 border rounded-lg text-sm">
                  <strong>d)</strong> Platform güvenliğinin sağlanması
                </div>
                <div className="p-3 border rounded-lg text-sm">
                  <strong>e)</strong> Yasal yükümlülüklerin yerine getirilmesi
                </div>
                <div className="p-3 border rounded-lg text-sm">
                  <strong>f)</strong> Müşteri hizmetleri ve destek
                </div>
                <div className="p-3 border rounded-lg text-sm">
                  <strong>g)</strong> İstatistiksel analizler ve iyileştirmeler
                </div>
                <div className="p-3 border rounded-lg text-sm">
                  <strong>h)</strong> Pazarlama faaliyetleri (açık rıza ile)
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. İşlenen Kişisel Veriler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Kimlik Bilgileri</h4>
                  <p className="text-sm text-muted-foreground">
                    Ad, soyad, T.C. kimlik numarası (gerektiğinde), profil fotoğrafı
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">İletişim Bilgileri</h4>
                  <p className="text-sm text-muted-foreground">
                    E-posta adresi, telefon numarası, adres bilgileri
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Müşteri İşlem Bilgileri</h4>
                  <p className="text-sm text-muted-foreground">
                    İlan geçmişi, mesajlaşma kayıtları, favori listesi, arama geçmişi
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">İşlem Güvenliği Bilgileri</h4>
                  <p className="text-sm text-muted-foreground">
                    IP adresi, oturum bilgileri, cihaz ve tarayıcı bilgileri, log kayıtları
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Görsel Veriler</h4>
                  <p className="text-sm text-muted-foreground">
                    Profil fotoğrafı, ilan görselleri
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Kişisel Verilerin İşlenmesinin Hukuki Sebepleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>KVKK'nın 5. ve 6. maddeleri kapsamında kişisel verileriniz:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 p-3 border rounded-lg">
                  <FileCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium">Açık Rızanıza İstinaden</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pazarlama, promosyon ve ticari elektronik ileti gönderimi için
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 border rounded-lg">
                  <FileCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium">Sözleşmenin Kurulması veya İfasıyla Doğrudan Bağlantılı Olması</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Üyelik sözleşmesi ve hizmet sunumu kapsamında
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 border rounded-lg">
                  <FileCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium">Hukuki Yükümlülüğün Yerine Getirilmesi</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Yasal düzenlemeler ve resmi makam talepleri için
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 border rounded-lg">
                  <FileCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium">Veri Sorumlusunun Meşru Menfaati</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Platform güvenliği, dolandırıcılık önleme ve hizmet iyileştirme için
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Kişisel Verilerin Aktarılması</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Kişisel verileriniz, yukarıda belirtilen amaçlarla sınırlı olarak ve 
                KVKK'nın 8. ve 9. maddelerine uygun şekilde aşağıdaki taraflara aktarılabilir:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li>
                  <strong>Hizmet sağlayıcılar:</strong> SMS, e-posta, bulut depolama, 
                  analitik ve teknik altyapı hizmeti aldığımız iş ortakları
                </li>
                <li>
                  <strong>Yasal merciler:</strong> Mahkemeler, savcılıklar, 
                  kolluk kuvvetleri ve diğer kamu kurumları (yasal zorunluluk halinde)
                </li>
                <li>
                  <strong>Yurt dışı aktarım:</strong> Sunucu ve bulut hizmetleri kapsamında 
                  verileriniz yurt dışında bulunan sunucularda işlenebilir. Bu aktarımlar 
                  KVKK standart sözleşmeleri kapsamında gerçekleştirilmektedir.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                5. Veri Sahibi Olarak Haklarınız (KVKK Madde 11)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                KVKK'nın 11. maddesi uyarınca, veri sahibi olarak aşağıdaki haklara sahipsiniz:
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg text-sm flex items-start gap-2">
                  <span className="font-bold text-primary">a)</span>
                  <span>Kişisel verilerinizin işlenip işlenmediğini öğrenme</span>
                </div>
                <div className="p-3 bg-muted rounded-lg text-sm flex items-start gap-2">
                  <span className="font-bold text-primary">b)</span>
                  <span>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</span>
                </div>
                <div className="p-3 bg-muted rounded-lg text-sm flex items-start gap-2">
                  <span className="font-bold text-primary">c)</span>
                  <span>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</span>
                </div>
                <div className="p-3 bg-muted rounded-lg text-sm flex items-start gap-2">
                  <span className="font-bold text-primary">d)</span>
                  <span>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</span>
                </div>
                <div className="p-3 bg-muted rounded-lg text-sm flex items-start gap-2">
                  <span className="font-bold text-primary">e)</span>
                  <span>Kişisel verilerinizin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme</span>
                </div>
                <div className="p-3 bg-muted rounded-lg text-sm flex items-start gap-2">
                  <span className="font-bold text-primary">f)</span>
                  <span>KVKK Madde 7'deki şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme</span>
                </div>
                <div className="p-3 bg-muted rounded-lg text-sm flex items-start gap-2">
                  <span className="font-bold text-primary">g)</span>
                  <span>Düzeltme, silme veya yok edilme işlemlerinin, kişisel verilerinizin aktarıldığı üçüncü kişilere bildirilmesini isteme</span>
                </div>
                <div className="p-3 bg-muted rounded-lg text-sm flex items-start gap-2">
                  <span className="font-bold text-primary">h)</span>
                  <span>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</span>
                </div>
                <div className="p-3 bg-muted rounded-lg text-sm flex items-start gap-2">
                  <span className="font-bold text-primary">i)</span>
                  <span>Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                6. Başvuru Yöntemi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Yukarıda belirtilen haklarınızı kullanmak için aşağıdaki yöntemlerle bize başvurabilirsiniz:
              </p>
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">E-posta ile Başvuru</p>
                    <p className="text-sm text-muted-foreground">
                      kvkk@sahibindenhayvan.com adresine, "KVKK Bilgi Talebi" konulu e-posta gönderebilirsiniz.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileCheck className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Yazılı Başvuru</p>
                    <p className="text-sm text-muted-foreground">
                      İmzalı dilekçenizi posta yoluyla adresimize gönderebilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>Önemli:</strong> Başvurunuz en geç 30 (otuz) gün içinde ücretsiz olarak 
                  sonuçlandırılacaktır. Ancak, işlemin ayrıca bir maliyet gerektirmesi halinde, 
                  Kişisel Verileri Koruma Kurulu tarafından belirlenen tarifedeki ücret alınabilir.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Veri Güvenliği Tedbirleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Kişisel verilerinizin güvenliğini sağlamak amacıyla aşağıdaki teknik ve 
                idari tedbirler alınmaktadır:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li>SSL/TLS şifreleme ile güvenli veri iletimi</li>
                <li>Verilerin şifreli olarak saklanması</li>
                <li>Güvenlik duvarı (firewall) ve antivirüs sistemleri</li>
                <li>Erişim kontrolü ve yetkilendirme mekanizmaları</li>
                <li>Düzenli güvenlik denetimleri ve sızma testleri</li>
                <li>Personel eğitimi ve gizlilik sözleşmeleri</li>
                <li>Veri ihlali müdahale planı</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Veri Saklama Süreleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Kişisel verileriniz, işlenme amaçlarının gerektirdiği süreler ve yasal 
                yükümlülükler kapsamında belirlenen süreler boyunca saklanmaktadır:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border rounded-lg overflow-hidden">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 border-b">Veri Kategorisi</th>
                      <th className="text-left p-3 border-b">Saklama Süresi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">Üyelik verileri</td>
                      <td className="p-3">Üyelik süresince + silme talebinden 30 gün</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">İlan verileri</td>
                      <td className="p-3">İlan yayında olduğu sürece + 1 yıl</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Mesajlaşma kayıtları</td>
                      <td className="p-3">2 yıl</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Log kayıtları</td>
                      <td className="p-3">5 yıl (5651 sayılı Kanun)</td>
                    </tr>
                    <tr>
                      <td className="p-3">Finansal veriler</td>
                      <td className="p-3">10 yıl (vergi mevzuatı)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Değişiklikler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Bu Aydınlatma Metni, yasal düzenlemeler veya veri işleme süreçlerimizdeki 
                değişiklikler nedeniyle güncellenebilir. Güncellemeler Platform'da yayınlandığı 
                tarihte yürürlüğe girer. Önemli değişiklikler için e-posta ile bilgilendirme yapılır.
              </p>
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
          </div>
        </div>
      </div>
    </div>
  );
}
