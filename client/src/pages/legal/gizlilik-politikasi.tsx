import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { ArrowLeft, Shield, Database, Eye, Lock, Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GizlilikPolitikasi() {
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
            <h1 className="text-3xl font-bold">Gizlilik Politikası</h1>
          </div>
          <p className="text-muted-foreground">
            Son güncelleme: 1 Aralık 2024
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında hazırlanmıştır.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                1. Veri Sorumlusu
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>
                sahibindenhayvan.com ("Platform") olarak kişisel verilerinizin güvenliği konusunda 
                azami hassasiyet göstermekteyiz.
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2">Veri Sorumlusu Bilgileri:</p>
                <ul className="text-sm space-y-1">
                  <li><strong>Platform:</strong> sahibindenhayvan.com</li>
                  <li><strong>E-posta:</strong> kvkk@sahibindenhayvan.com</li>
                  <li><strong>Adres:</strong> İstanbul, Türkiye</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                2. Toplanan Kişisel Veriler
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>Platform'u kullanırken aşağıdaki kişisel verileriniz toplanabilir:</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Kimlik Bilgileri</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Ad, Soyad</li>
                    <li>• T.C. Kimlik Numarası (gerektiğinde)</li>
                    <li>• Profil fotoğrafı</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">İletişim Bilgileri</h4>
                  <ul className="text-sm space-y-1">
                    <li>• E-posta adresi</li>
                    <li>• Telefon numarası</li>
                    <li>• Adres bilgileri</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">İşlem Bilgileri</h4>
                  <ul className="text-sm space-y-1">
                    <li>• İlan geçmişi</li>
                    <li>• Mesajlaşma kayıtları</li>
                    <li>• Favori listesi</li>
                    <li>• Arama geçmişi</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Teknik Veriler</h4>
                  <ul className="text-sm space-y-1">
                    <li>• IP adresi</li>
                    <li>• Çerez verileri</li>
                    <li>• Cihaz bilgileri</li>
                    <li>• Tarayıcı bilgileri</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Veri İşleme Amaçları</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Üyelik işlemlerinin gerçekleştirilmesi ve hesap yönetimi</li>
                <li>İlan yayınlama hizmetinin sunulması</li>
                <li>Kullanıcılar arası iletişimin sağlanması</li>
                <li>Platform güvenliğinin sağlanması ve dolandırıcılığın önlenmesi</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                <li>Hizmet kalitesinin artırılması ve analiz çalışmaları</li>
                <li>Pazarlama faaliyetleri (açık rızanız dahilinde)</li>
                <li>Müşteri hizmetleri ve destek sağlanması</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Veri İşlemenin Hukuki Sebepleri</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>KVKK Madde 5 ve 6 kapsamında kişisel verileriniz aşağıdaki hukuki sebeplere dayanılarak işlenmektedir:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Açık Rıza:</strong> Pazarlama ve promosyon amaçlı iletişim</li>
                <li><strong>Sözleşmenin İfası:</strong> Üyelik sözleşmesi kapsamındaki hizmetlerin sunulması</li>
                <li><strong>Hukuki Yükümlülük:</strong> Yasal düzenlemelerden kaynaklanan zorunluluklar</li>
                <li><strong>Meşru Menfaat:</strong> Platform güvenliği ve hizmet iyileştirme</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                5. Veri Aktarımı
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>Kişisel verileriniz aşağıdaki durumlarda üçüncü taraflarla paylaşılabilir:</p>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Hizmet Sağlayıcılar</h4>
                  <ul className="text-sm space-y-1">
                    <li>• SMS ve e-posta gönderim servisleri</li>
                    <li>• Bulut depolama hizmetleri</li>
                    <li>• Analiz ve istatistik araçları</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Yasal Merciler</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Mahkeme kararları üzerine</li>
                    <li>• Savcılık talepleri</li>
                    <li>• Emniyet ve güvenlik birimleri</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <h4 className="font-semibold mb-2 text-amber-800 dark:text-amber-300">Yurt Dışı Aktarım</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Sunucu ve bulut hizmetleri nedeniyle verileriniz yurt dışındaki sunucularda işlenebilir. 
                    Bu aktarımlar KVKK standart sözleşmeleri kapsamında gerçekleştirilir.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                6. Veri Güvenliği
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>Kişisel verilerinizin güvenliği için aşağıdaki önlemler alınmaktadır:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>SSL/TLS şifreleme ile güvenli bağlantı</li>
                <li>Şifreli veri depolama</li>
                <li>Güvenlik duvarı (firewall) koruması</li>
                <li>Düzenli güvenlik taramaları</li>
                <li>Erişim kontrolü ve yetkilendirme</li>
                <li>Çalışan gizlilik eğitimleri</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Veri Saklama Süresi</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>Kişisel verileriniz aşağıdaki sürelerde saklanır:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Üyelik verileri:</strong> Hesap aktif olduğu sürece + silme talebinden sonra 30 gün</li>
                <li><strong>İlan verileri:</strong> İlan yayında olduğu sürece + kaldırıldıktan sonra 1 yıl</li>
                <li><strong>Mesajlaşma kayıtları:</strong> 2 yıl</li>
                <li><strong>Log kayıtları:</strong> 5 yıl (yasal zorunluluk)</li>
                <li><strong>Fatura ve ödeme bilgileri:</strong> 10 yıl (vergi mevzuatı)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                8. KVKK Kapsamındaki Haklarınız
              </CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>KVKK Madde 11 uyarınca aşağıdaki haklara sahipsiniz:</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg text-sm">
                  <strong>1.</strong> Kişisel verilerinizin işlenip işlenmediğini öğrenme
                </div>
                <div className="p-3 border rounded-lg text-sm">
                  <strong>2.</strong> İşlenmişse buna ilişkin bilgi talep etme
                </div>
                <div className="p-3 border rounded-lg text-sm">
                  <strong>3.</strong> İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme
                </div>
                <div className="p-3 border rounded-lg text-sm">
                  <strong>4.</strong> Yurt içi/dışı aktarıldığı 3. kişileri bilme
                </div>
                <div className="p-3 border rounded-lg text-sm">
                  <strong>5.</strong> Eksik/yanlış işlenmişse düzeltilmesini isteme
                </div>
                <div className="p-3 border rounded-lg text-sm">
                  <strong>6.</strong> KVKK Madde 7 şartlarında silinmesini isteme
                </div>
                <div className="p-3 border rounded-lg text-sm">
                  <strong>7.</strong> Düzeltme/silme işlemlerinin 3. kişilere bildirilmesini isteme
                </div>
                <div className="p-3 border rounded-lg text-sm">
                  <strong>8.</strong> Otomatik sistemlerle analiz sonucu olumsuz sonuca itiraz
                </div>
                <div className="p-3 border rounded-lg text-sm md:col-span-2">
                  <strong>9.</strong> Hukuka aykırı işleme nedeniyle zarara uğramanız halinde tazminat talep etme
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Başvuru Yöntemi</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>Haklarınızı kullanmak için aşağıdaki yöntemlerle başvurabilirsiniz:</p>
              <div className="p-4 bg-muted rounded-lg">
                <ul className="space-y-2">
                  <li><strong>E-posta:</strong> kvkk@sahibindenhayvan.com</li>
                  <li><strong>Posta:</strong> [Adres bilgisi]</li>
                </ul>
                <p className="text-sm mt-4 text-muted-foreground">
                  Başvurularınız en geç 30 gün içinde yanıtlanacaktır. 
                  İşlemin ayrıca bir maliyet gerektirmesi halinde, 
                  Kişisel Verileri Koruma Kurulu tarafından belirlenen tarifedeki ücret alınabilir.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Değişiklikler</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none space-y-4">
              <p>
                Bu Gizlilik Politikası gerektiğinde güncellenebilir. 
                Önemli değişiklikler kayıtlı e-posta adresinize bildirilecektir.
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
