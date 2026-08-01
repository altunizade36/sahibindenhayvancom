import { Link } from "wouter";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  FileText, 
  MessageSquare, 
  Shield, 
  CreditCard, 
  User, 
  PawPrint,
  Search,
  Mail
} from "lucide-react";
import { SEOHead } from "@/components/seo-head";

const helpCategories = [
  {
    icon: User,
    title: "Hesap ve Üyelik",
    description: "Kayıt, giriş ve hesap ayarları",
    questions: [
      {
        q: "Nasıl üye olabilirim?",
        a: "Kayıt sayfasından e-posta adresiniz ve bir şifre belirleyerek üye olabilirsiniz. Ardından e-posta adresinize gelen doğrulama bağlantısına tıklamanız yeterlidir."
      },
      {
        q: "Şifremi unuttum, ne yapmalıyım?",
        a: "'Şifremi Unuttum' sayfasından e-posta adresinizi girin. Şifre sıfırlama bağlantısını e-posta ile göndeririz; bağlantı 24 saat geçerlidir."
      },
      {
        q: "Hesabımı nasıl silebilirim?",
        a: "Hesabınızı silmek için Ayarlar sayfasından 'Hesabı Sil' seçeneğini kullanabilirsiniz. Bu işlem geri alınamaz."
      }
    ]
  },
  {
    icon: FileText,
    title: "İlan Verme",
    description: "İlan oluşturma ve yönetme",
    questions: [
      {
        q: "İlan vermek ücretli mi?",
        a: "Hayır! sahibindenhayvan.com'da ilan vermek tamamen ücretsizdir. Dilediğiniz kadar ilan verebilirsiniz."
      },
      {
        q: "İlanım neden onaylanmadı?",
        a: "İlanlar moderatörlerimiz tarafından kontrol edilir. İlan kurallarına uymayan, eksik bilgi içeren veya şüpheli görülen ilanlar reddedilebilir. Red sebebi bildirimlerinizde belirtilir."
      },
      {
        q: "İlanımı nasıl düzenleyebilirim?",
        a: "Panelim > İlanlarım sayfasından ilgili ilanın yanındaki 'Düzenle' butonuna tıklayarak ilanınızı güncelleyebilirsiniz."
      },
      {
        q: "İlanıma fotoğraf nasıl eklerim?",
        a: "İlan oluştururken veya düzenlerken fotoğraf yükleme alanından en fazla 10 adet fotoğraf ekleyebilirsiniz. İlk fotoğraf kapak fotoğrafı olarak kullanılır."
      }
    ]
  },
  {
    icon: PawPrint,
    title: "Hayvan Kategorileri",
    description: "Kategoriler ve kurallar",
    questions: [
      {
        q: "Hangi hayvanların ilanını verebilirim?",
        a: "Evcil hayvanlar (kedi, köpek, kuş, balık vb.), çiftlik hayvanları (büyükbaş, küçükbaş), egzotik hayvanlar ve arıcılık ürünleri için ilan verebilirsiniz."
      },
      {
        q: "Tehlikeli hayvan ilanı verebilir miyim?",
        a: "5199 sayılı Hayvanları Koruma Kanunu kapsamında yasaklı türlerin satışı yasaktır. Bu türlerin ilanları yayınlanmaz ve yasal işlem başlatılabilir."
      },
      {
        q: "Yavru hayvan satışında yaş sınırı var mı?",
        a: "Kedi ve köpek yavrularının annesinden ayrılması için en az 8 haftalık olması gerekir. Daha küçük yavrular için ilan verilmemelidir."
      }
    ]
  },
  {
    icon: Shield,
    title: "Güvenlik",
    description: "Güvenli alışveriş ipuçları",
    questions: [
      {
        q: "Güvenli alışveriş için nelere dikkat etmeliyim?",
        a: "Hayvanı almadan önce mutlaka yüz yüze görün. Sağlık belgelerini isteyin. Kapıda ödeme veya güvenilir ödeme yöntemlerini tercih edin. Şüpheli durumlarda bize bildirin."
      },
      {
        q: "Dolandırıcılık şüphesi durumunda ne yapmalıyım?",
        a: "İlan detay sayfasındaki 'Şikayet Et' butonunu kullanarak bize bildirebilirsiniz. Ekibimiz en kısa sürede inceleme yapacaktır."
      },
      {
        q: "Kişisel bilgilerim güvende mi?",
        a: "Evet. KVKK kapsamında kişisel verileriniz koruma altındadır. Detaylar için Gizlilik Politikamızı inceleyebilirsiniz."
      }
    ]
  },
  {
    icon: MessageSquare,
    title: "Mesajlaşma",
    description: "İletişim ve mesajlar",
    questions: [
      {
        q: "Satıcıyla nasıl iletişime geçebilirim?",
        a: "İlan detay sayfasındaki 'Mesaj Gönder' butonuna tıklayarak satıcıyla mesajlaşmaya başlayabilirsiniz. Bunun için üye girişi yapmanız gerekir."
      },
      {
        q: "Mesajlarımı nereden görebilirim?",
        a: "Sağ üst köşedeki mesaj ikonuna veya Panelim > Mesajlar sayfasına giderek tüm mesajlarınızı görebilirsiniz."
      },
      {
        q: "Bir kullanıcıyı nasıl engellerim?",
        a: "Mesaj ekranında ilgili kullanıcının sohbetini açarak menüden 'Engelle' seçeneğini kullanabilirsiniz."
      }
    ]
  }
];

export default function Yardim() {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Yardım Merkezi | sahibindenhayvan.com"
        description="Sıkça sorulan sorular, hesap ayarları, ilan verme ve güvenlik konularında yardım alın."
      />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <HelpCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-3xl font-bold mb-2" data-testid="text-help-title">Yardım Merkezi</h1>
            <p className="text-muted-foreground">
              Size nasıl yardımcı olabiliriz? Aşağıdaki konulardan birini seçin veya sıkça sorulan sorulara göz atın.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {helpCategories.map((category, index) => (
              <Card key={index} className="hover-elevate cursor-pointer">
                <CardHeader className="pb-2">
                  <category.icon className="w-8 h-8 text-primary mb-2" />
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <h2 className="text-2xl font-bold mb-4" data-testid="text-faq-title">Sıkça Sorulan Sorular</h2>
          
          {helpCategories.map((category, catIndex) => (
            <div key={catIndex} className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <category.icon className="w-5 h-5 text-primary" />
                {category.title}
              </h3>
              <Accordion type="single" collapsible className="mb-4">
                {category.questions.map((item, qIndex) => (
                  <AccordionItem key={qIndex} value={`${catIndex}-${qIndex}`}>
                    <AccordionTrigger className="text-left" data-testid={`accordion-q-${catIndex}-${qIndex}`}>
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}

          <Card className="mt-8 bg-muted/30">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
              <div className="flex items-center gap-3">
                <Mail className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Sorununuz çözülmedi mi?</h3>
                  <p className="text-sm text-muted-foreground">Bizimle iletişime geçin, size yardımcı olalım.</p>
                </div>
              </div>
              <Link href="/iletisim">
                <Button data-testid="button-contact">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  İletişime Geç
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
