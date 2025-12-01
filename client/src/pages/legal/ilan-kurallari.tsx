import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { ArrowLeft, ClipboardList, CheckCircle, XCircle, AlertTriangle, FileText, Shield, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function IlanKurallari() {
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
            <ClipboardList className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">İlan Kuralları ve Yasaklı Ürünler</h1>
          </div>
          <p className="text-muted-foreground">
            Son güncelleme: 1 Aralık 2024
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            5199 Sayılı Hayvanları Koruma Kanunu ve 5996 Sayılı Veteriner Hizmetleri Kanunu kapsamında hazırlanmıştır.
          </p>
        </div>

        <div className="space-y-6">
          <Card className="border-primary">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Önemli Yasal Uyarılar
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">
                  Pet Shop'larda Kedi/Köpek Satışı Yasaktır
                </h4>
                <p className="text-sm text-red-700 dark:text-red-400">
                  14 Temmuz 2022 tarihinden itibaren pet shop'larda kedi ve köpek satışı yasaktır. 
                  Yasağa uymayanlar hayvan başına 5.043 TL (2024) idari para cezası ile karşı karşıyadır.
                </p>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                  Mikroçip ve Pasaport Zorunluluğu
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  1 Ocak 2021'den itibaren tüm evcil hayvanlar (kedi, köpek, gelincik) için 
                  mikroçip ve evcil hayvan pasaportu zorunludur.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Hayvan Türüne Göre Gerekli Belgeler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="pets">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Evcil Hayvanlar (Kedi, Köpek, Gelincik)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h5 className="font-medium text-green-800 dark:text-green-300 mb-2">Zorunlu Belgeler:</h5>
                        <ul className="text-sm space-y-1 text-green-700 dark:text-green-400">
                          <li>• Mikroçip numarası (15 haneli)</li>
                          <li>• Evcil Hayvan Pasaportu</li>
                          <li>• Aşı kartı / Sağlık karnesi</li>
                          <li>• Veteriner hekim onaylı sağlık raporu</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Önerilen Belgeler:</h5>
                        <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-400">
                          <li>• Pedigri belgesi (soy ağacı)</li>
                          <li>• Kısırlaştırma belgesi</li>
                          <li>• İç/dış parazit tedavisi belgesi</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="livestock">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      Büyükbaş Hayvanlar (İnek, Boğa, Manda)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h5 className="font-medium text-green-800 dark:text-green-300 mb-2">Zorunlu Belgeler:</h5>
                        <ul className="text-sm space-y-1 text-green-700 dark:text-green-400">
                          <li>• Hayvan Pasaportu (kimlik ve sağlık bilgileri)</li>
                          <li>• TÜRKVET kayıt numarası</li>
                          <li>• Aşı kayıtları (Şap, Brusella vb.)</li>
                          <li>• Nakil için veteriner sağlık raporu</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="smallstock">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      Küçükbaş Hayvanlar (Koyun, Keçi)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h5 className="font-medium text-green-800 dark:text-green-300 mb-2">Zorunlu Belgeler:</h5>
                        <ul className="text-sm space-y-1 text-green-700 dark:text-green-400">
                          <li>• Nakil Belgesi</li>
                          <li>• TÜRKVET kayıt numarası</li>
                          <li>• Kulak küpesi numarası</li>
                          <li>• İl dışı satışlarda veteriner sağlık raporu</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="poultry">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      Kanatlı Hayvanlar (Tavuk, Ördek, Kaz, Hindi)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h5 className="font-medium text-green-800 dark:text-green-300 mb-2">Zorunlu Belgeler:</h5>
                        <ul className="text-sm space-y-1 text-green-700 dark:text-green-400">
                          <li>• Kuluçkahane kayıt belgesi (üretim amaçlı)</li>
                          <li>• Aşı programı kayıtları</li>
                          <li>• Toplu satışlarda veteriner sağlık raporu</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="birds">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      Süs Kuşları (Muhabbet, Papağan, Kanarya)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h5 className="font-medium text-green-800 dark:text-green-300 mb-2">Zorunlu Belgeler:</h5>
                        <ul className="text-sm space-y-1 text-green-700 dark:text-green-400">
                          <li>• Ayak halkası numarası</li>
                          <li>• Sağlık durumu beyanı</li>
                          <li>• CITES türleri için ithalat belgesi</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <h5 className="font-medium text-amber-800 dark:text-amber-300 mb-2">CITES Uyarısı:</h5>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          Afrika gri papağanı, kakadu, amazon papağanı gibi türler CITES 
                          kapsamında koruma altındadır. Satış için yasal belge zorunludur.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="fish">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      Akvaryum Balıkları
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Önerilen Bilgiler:</h5>
                        <ul className="text-sm space-y-1 text-blue-700 dark:text-blue-400">
                          <li>• Türü ve yaşı</li>
                          <li>• Bakım gereksinimleri</li>
                          <li>• Su parametreleri</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="exotic">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      Egzotik Hayvanlar (Kaplumbağa, Yılan, İguana)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <h5 className="font-medium text-red-800 dark:text-red-300 mb-2">Dikkat:</h5>
                        <p className="text-sm text-red-700 dark:text-red-400 mb-2">
                          Birçok egzotik tür Türkiye'de satışı yasak veya CITES kapsamındadır.
                        </p>
                        <ul className="text-sm space-y-1 text-red-700 dark:text-red-400">
                          <li>• CITES belgesi zorunludur</li>
                          <li>• DKMP izin belgesi gerekebilir</li>
                          <li>• Yasal olmayan satışlarda ağır cezalar</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                İlan Oluşturma Kuralları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3 text-green-700 dark:text-green-400">Fotoğraf Kuralları</h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Hayvanın gerçek, güncel fotoğrafları</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Net ve iyi aydınlatılmış görüntüler</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Farklı açılardan çekilmiş fotoğraflar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>En az 3 fotoğraf önerilir</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3 text-green-700 dark:text-green-400">İçerik Kuralları</h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Doğru tür ve ırk bilgisi</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Gerçek yaş ve cinsiyet</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Sağlık durumu açıklaması</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Aşı ve tedavi bilgileri</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Yasaklı İlanlar ve Ürünler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-semibold text-red-800 dark:text-red-300 mb-3">
                  Aşağıdaki ilanlar kesinlikle yasaktır:
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="text-sm space-y-2 text-red-700 dark:text-red-400">
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Nesli tehlike altındaki (CITES) türler (belgesiz)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Vahşi/yabani hayvanlar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Dövüş için yetiştirilen hayvanlar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Kaçak yollarla getirilen hayvanlar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Hastalıklı veya salgın riski taşıyan hayvanlar</span>
                    </li>
                  </ul>
                  <ul className="text-sm space-y-2 text-red-700 dark:text-red-400">
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Sahte belgeli hayvanlar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Çalıntı veya kayıp hayvanlar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Yasadışı üretim çiftliklerinden gelen hayvanlar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Zehirli veya tehlikeli türler</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Av yasağı kapsamındaki türler</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Satıcı Sorumlulukları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-3 p-3 border rounded-lg">
                  <span className="font-bold text-primary">1.</span>
                  <div>
                    <span className="font-medium">Doğru Bilgi Verme:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Hayvanın türü, yaşı, sağlık durumu ve geçmişi hakkında doğru bilgi vermek zorundasınız.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 border rounded-lg">
                  <span className="font-bold text-primary">2.</span>
                  <div>
                    <span className="font-medium">Belge Sunma:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Hayvan türüne göre gerekli yasal belgeleri (pasaport, aşı kartı, CITES vb.) sunmalısınız.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 border rounded-lg">
                  <span className="font-bold text-primary">3.</span>
                  <div>
                    <span className="font-medium">Sağlık Garantisi:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Satış anında hayvanın sağlıklı olduğunu garanti edersiniz. Bilinen sağlık sorunlarını açıklamalısınız.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 border rounded-lg">
                  <span className="font-bold text-primary">4.</span>
                  <div>
                    <span className="font-medium">İletişim:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Alıcılarla dürüst ve açık iletişim kurmalı, sorularını yanıtlamalısınız.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-3 border rounded-lg">
                  <span className="font-bold text-primary">5.</span>
                  <div>
                    <span className="font-medium">Yasal Uyum:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tüm hayvan satış yasalarına ve düzenlemelerine uymakla yükümlüsünüz.
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>İlan Moderasyonu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Tüm ilanlar yayınlanmadan önce moderasyon ekibimiz tarafından incelenir:</p>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li>Kurallara uygun olmayan ilanlar reddedilir</li>
                <li>Eksik bilgi içeren ilanlar için düzeltme talep edilir</li>
                <li>Şüpheli ilanlar detaylı incelemeye alınır</li>
                <li>Tekrarlayan ihlallerde hesap askıya alınır</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Şikayet ve Bildirim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Kurallara aykırı bir ilan gördüğünüzde "Şikayet Et" butonunu kullanarak 
                bize bildirebilirsiniz. Tüm şikayetler 24 saat içinde değerlendirilir.
              </p>
              <p className="text-sm text-muted-foreground">
                Hayvan hakları ihlalleri için: <strong>ALO 174</strong> (Tarım ve Orman Bakanlığı)
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
