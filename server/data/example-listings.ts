// 50+ Gerçekçi Türk Hayvan İlanları - 2024-2025 Güncel Piyasa Fiyatları
// Kaynak: TÜSEDAD, ESK, İl Tarım Müdürlükleri, Hayvan Borsaları

export interface ExampleListing {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  price: number;
  city: string;
  district: string;
  breed?: string;
  age?: string;
  gender?: string;
  healthStatus?: string;
  vaccinated?: boolean;
  neutered?: boolean;
  pedigree?: boolean;
  exampleSource?: string;
}

export const exampleListings: ExampleListing[] = [
  // ==================== BÜYÜKBAŞ HAYVANLAR ====================
  {
    id: "ex-buyukbas-001",
    categoryId: "cat-dana",
    title: "Simental Besi Danası - 380 kg Canlı Ağırlık",
    description: "Saf kan Simental besi danası. 14 aylık, sağlık karnesi mevcut. Günlük 1.4 kg canlı ağırlık artışı. Konya Organize Sanayi bölgesindeki çiftliğimizden. Veteriner kontrolünden geçmiştir. TÜRKVET kayıtlı.",
    price: 140000,
    city: "Konya",
    district: "Selçuklu",
    breed: "Simental",
    age: "14 ay",
    gender: "Erkek",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    exampleSource: "Konya Hayvan Borsası"
  },
  {
    id: "ex-buyukbas-002",
    categoryId: "cat-duve",
    title: "Gebe Holstein Düve - 5 Aylık Gebe",
    description: "Saf kan Holstein düve, 5 aylık gebe. Süt verimi yüksek soydan. Anne günlük 35 litre süt verimine sahip. Aşıları tam, sağlık karnesi mevcut. Suni tohumlama belgesi var.",
    price: 165000,
    city: "Balıkesir",
    district: "Bandırma",
    breed: "Holstein",
    age: "26 ay",
    gender: "Dişi",
    healthStatus: "Gebe - 5 ay",
    vaccinated: true,
    exampleSource: "Balıkesir Tarım İl Müdürlüğü"
  },
  {
    id: "ex-buyukbas-003",
    categoryId: "cat-inek",
    title: "Süt İneği - Günlük 32 Litre Süt Verimi",
    description: "4 yaşında Holstein inek. Günlük ortalama 32 litre süt verimi. 2. laktasyonda. Mastitis ve brucella testleri negatif. TÜRKVET kayıtlı, kulak küpesi mevcut.",
    price: 195000,
    city: "Bursa",
    district: "Karacabey",
    breed: "Holstein",
    age: "4 yıl",
    gender: "Dişi",
    healthStatus: "Sağlıklı - Sağımda",
    vaccinated: true,
    exampleSource: "Bursa Hayvan Borsası"
  },
  {
    id: "ex-buyukbas-004",
    categoryId: "cat-boga",
    title: "Damızlık Simental Boğa - Sertifikalı",
    description: "Sertifikalı damızlık Simental boğa. 3 yaşında, 850 kg canlı ağırlık. Sperm kalitesi test edilmiş. Bakanlık onaylı damızlık belgesi mevcut. Soy ağacı kayıtlı.",
    price: 320000,
    city: "Ankara",
    district: "Polatlı",
    breed: "Simental",
    age: "3 yıl",
    gender: "Erkek",
    healthStatus: "Damızlık Sertifikalı",
    vaccinated: true,
    pedigree: true,
    exampleSource: "Ankara Damızlık Sığır Yetiştiricileri Birliği"
  },

  // ==================== KÜÇÜKBAŞ HAYVANLAR ====================
  {
    id: "ex-kucukbas-001",
    categoryId: "cat-koyun",
    title: "Merinos Koyun Sürüsü - 50 Baş",
    description: "50 baş saf kan Merinos koyunu. Yaşları 2-4 arasında. Tamamı gebe durumda. Aşıları ve ilaçlamaları tam. Sürü halinde toptan satılık. Kulak küpeleri kayıtlı.",
    price: 625000,
    city: "Konya",
    district: "Çumra",
    breed: "Merinos",
    age: "2-4 yaş",
    gender: "Dişi",
    healthStatus: "Gebe",
    vaccinated: true,
    exampleSource: "Konya Koyun Keçi Yetiştiricileri Birliği"
  },
  {
    id: "ex-kucukbas-002",
    categoryId: "cat-koyun",
    title: "İvesi Koyun - Süt Verimi Yüksek",
    description: "İvesi ırkı koyun, günlük 2 litre süt verimi. 3 yaşında, doğum yapmış. Hem süt hem et için ideal. Koç katımına hazır durumda.",
    price: 14500,
    city: "Şanlıurfa",
    district: "Merkez",
    breed: "İvesi",
    age: "3 yıl",
    gender: "Dişi",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    exampleSource: "Şanlıurfa Hayvan Pazarı"
  },
  {
    id: "ex-kucukbas-003",
    categoryId: "cat-keci",
    title: "Saanen Keçi Sürüsü - 30 Baş Süt Keçisi",
    description: "30 baş saf Saanen süt keçisi. Günlük ortalama 3-4 litre süt verimi. Tamamı 2-4 yaş arası. Aşıları tam, sağlık karneleri mevcut. Sürü halinde satılık.",
    price: 315000,
    city: "Muğla",
    district: "Milas",
    breed: "Saanen",
    age: "2-4 yaş",
    gender: "Dişi",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    exampleSource: "Ege Bölgesi Keçi Yetiştiricileri Birliği"
  },
  {
    id: "ex-kucukbas-004",
    categoryId: "cat-keci",
    title: "Ankara (Tiftik) Keçisi - Damızlık",
    description: "Sertifikalı Ankara tiftik keçisi. 2 yaşında, yılda 4-5 kg tiftik verimi. Damızlık belgeli, soy ağacı kayıtlı. Tiftik kalitesi yüksek.",
    price: 12000,
    city: "Ankara",
    district: "Beypazarı",
    breed: "Ankara Keçisi",
    age: "2 yıl",
    gender: "Dişi",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    pedigree: true,
    exampleSource: "Ankara Tiftik Keçisi Yetiştiricileri Birliği"
  },
  {
    id: "ex-kucukbas-005",
    categoryId: "cat-kuzu",
    title: "Besi Kuzusu - 35 kg Canlı",
    description: "Akkaraman x Merinos melezi besi kuzusu. 4 aylık, 35 kg canlı ağırlık. Günlük 350 gram ağırlık artışı. Toptan alıma uygun, minimum 10 adet.",
    price: 7500,
    city: "Afyonkarahisar",
    district: "Merkez",
    breed: "Akkaraman x Merinos",
    age: "4 ay",
    gender: "Erkek",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    exampleSource: "Afyon Hayvan Borsası"
  },

  // ==================== KANATLI HAYVANLAR ====================
  {
    id: "ex-kanatli-001",
    categoryId: "cat-ciftlik-tavuk",
    title: "Yumurtacı Tavuk - Lohmann Brown 100 Adet",
    description: "Lohmann Brown ırkı yumurtacı tavuk. 6 aylık, yumurta verimine yeni başlamış. Günlük %95 yumurta verimi. Kafes sistemi için uygun. Aşıları tam.",
    price: 22000,
    city: "Bolu",
    district: "Merkez",
    breed: "Lohmann Brown",
    age: "6 ay",
    gender: "Dişi",
    healthStatus: "Sağlıklı - Verimde",
    vaccinated: true,
    exampleSource: "Bolu Yumurta Üreticileri Birliği"
  },
  {
    id: "ex-kanatli-002",
    categoryId: "cat-ciftlik-tavuk",
    title: "Köy Tavuğu - Organik Yetiştirme",
    description: "Serbest gezen köy tavuğu. Organik besleme ile büyütülmüş. Hormon ve antibiyotik kullanılmamış. Yumurta ve damızlık için uygun. 20 adet dişi + 2 horoz.",
    price: 5500,
    city: "Kastamonu",
    district: "Taşköprü",
    breed: "Köy Tavuğu",
    age: "1 yıl",
    gender: "Karışık",
    healthStatus: "Organik Sertifikalı",
    vaccinated: true,
    exampleSource: "Kastamonu Organik Üreticiler"
  },
  {
    id: "ex-kanatli-003",
    categoryId: "cat-ciftlik-kaz",
    title: "Toulouse Kazı - Damızlık Takım",
    description: "Toulouse ırkı damızlık kaz takımı. 2 dişi + 1 erkek. 2 yaşında, verimli dönemde. Yılda 40-50 yumurta. Civciv üretimi için ideal.",
    price: 6500,
    city: "Kars",
    district: "Merkez",
    breed: "Toulouse",
    age: "2 yıl",
    gender: "Karışık",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    exampleSource: "Kars Kümes Hayvancılığı Birliği"
  },
  {
    id: "ex-kanatli-004",
    categoryId: "cat-ciftlik-hindi",
    title: "Bronz Hindi - Kasaplık 15 kg",
    description: "Amerikan Bronz hindisi. 8 aylık, 15 kg canlı ağırlık. Doğal besleme ile büyütülmüş. Yılbaşı ve bayram siparişleri için ideal.",
    price: 3500,
    city: "Denizli",
    district: "Merkez",
    breed: "Bronz Hindi",
    age: "8 ay",
    gender: "Erkek",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    exampleSource: "Denizli Hindi Yetiştiricileri"
  },
  {
    id: "ex-kanatli-005",
    categoryId: "cat-ciftlik-ordek",
    title: "Pekin Ördeği - 50 Adet Yetişkin",
    description: "Pekin ırkı yetişkin ördek. 6 aylık, ortalama 3.5 kg. Et ve yumurta için uygun. Toptan satış, minimum 50 adet.",
    price: 7500,
    city: "Edirne",
    district: "Keşan",
    breed: "Pekin",
    age: "6 ay",
    gender: "Karışık",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    exampleSource: "Trakya Kümes Hayvancılığı"
  },

  // ==================== ATLAR VE BİNİCİLİK ====================
  {
    id: "ex-at-001",
    categoryId: "cat-ana-arap-ati",
    title: "Safkan Arap Atı - Yarış Tescilli",
    description: "Safkan Arap atı, 4 yaşında kısrak. TJK tescilli, yarış geçmişi mevcut. Soy ağacı 5 nesil kayıtlı. Damızlık veya spor biniciliği için uygun.",
    price: 850000,
    city: "İstanbul",
    district: "Şile",
    breed: "Safkan Arap",
    age: "4 yıl",
    gender: "Dişi",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    pedigree: true,
    exampleSource: "Türkiye Jokey Kulübü"
  },
  {
    id: "ex-at-002",
    categoryId: "cat-ana-ingiliz-ati",
    title: "İngiliz Atı - Engel Atlama Eğitimli",
    description: "6 yaşında İngiliz atı. Profesyonel engel atlama eğitimi almış. 1.20m engel geçmekte. Binicilik kulübü veya yarışmacı için ideal.",
    price: 420000,
    city: "Ankara",
    district: "Gölbaşı",
    breed: "İngiliz Atı",
    age: "6 yıl",
    gender: "Erkek",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    pedigree: true,
    exampleSource: "Ankara Binicilik Kulübü"
  },
  {
    id: "ex-at-003",
    categoryId: "cat-at-tay",
    title: "Haflinger Tay - 8 Aylık",
    description: "Haflinger ırkı tay, 8 aylık. Sakin mizaçlı, çocuk biniciliği için ideal. Anne-baba her ikisi de sertifikalı damızlık. Temel terbiye eğitimi başlamış.",
    price: 125000,
    city: "Bursa",
    district: "Nilüfer",
    breed: "Haflinger",
    age: "8 ay",
    gender: "Dişi",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    pedigree: true,
    exampleSource: "Bursa At Yetiştiricileri Derneği"
  },

  // ==================== KÖPEKLER ====================
  {
    id: "ex-kopek-001",
    categoryId: "cat-kopek-yavru",
    title: "Golden Retriever Yavrusu - Soy Ağaçlı",
    description: "Saf kan Golden Retriever yavrusu, 3 aylık. FCI soy belgeli. Karma aşısı ve iç-dış parazit yapılmış. Mikroçipli. Ebeveynler şampiyon soyundan.",
    price: 35000,
    city: "İstanbul",
    district: "Beşiktaş",
    breed: "Golden Retriever",
    age: "3 ay",
    gender: "Erkek",
    healthStatus: "Aşılı",
    vaccinated: true,
    pedigree: true,
    exampleSource: "KIF Türkiye"
  },
  {
    id: "ex-kopek-002",
    categoryId: "cat-kopek-yavru",
    title: "Alman Çoban Köpeği Yavrusu",
    description: "Alman Çoban Köpeği yavrusu, 2.5 aylık. Çalışma hattı soyundan. Güçlü kemik yapısı, siyah-kızıl renk. Ev, koruma veya K9 eğitimi için uygun.",
    price: 28000,
    city: "Ankara",
    district: "Çankaya",
    breed: "Alman Çoban Köpeği",
    age: "2.5 ay",
    gender: "Erkek",
    healthStatus: "Aşılı",
    vaccinated: true,
    pedigree: true,
    exampleSource: "Ankara Köpek Severler Derneği"
  },
  {
    id: "ex-kopek-003",
    categoryId: "cat-kopek-yavru",
    title: "Labrador Retriever - Çikolata Renk",
    description: "Çikolata renk Labrador Retriever yavrusu. 2.5 aylık, son derece sosyal ve oyuncu. Aile köpeği olarak ideal. Tam aşılı, veteriner kontrollü.",
    price: 22000,
    city: "İzmir",
    district: "Bornova",
    breed: "Labrador Retriever",
    age: "2.5 ay",
    gender: "Dişi",
    healthStatus: "Aşılı",
    vaccinated: true,
    exampleSource: "İzmir Köpek Kulübü"
  },
  {
    id: "ex-kopek-004",
    categoryId: "cat-kopek-yetiskin",
    title: "Kangal Köpeği - Sertifikalı Damızlık",
    description: "Saf kan Sivas Kangal köpeği. 3 yaşında, 80 kg. Damızlık sertifikası mevcut. Çoban köpeği olarak çalışmış. Sürü koruma içgüdüsü güçlü.",
    price: 75000,
    city: "Sivas",
    district: "Kangal",
    breed: "Kangal",
    age: "3 yıl",
    gender: "Erkek",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    pedigree: true,
    exampleSource: "Sivas Kangal Köpeği Yetiştirici Birliği"
  },
  {
    id: "ex-kopek-005",
    categoryId: "cat-kopek-yavru",
    title: "French Bulldog Yavrusu - Mavi Renk",
    description: "Nadir mavi renk French Bulldog yavrusu. 3 aylık, kompakt vücut yapısı. Aile ortamında büyümüş, çocuklarla uyumlu. Solunum kontrolü yapılmış.",
    price: 65000,
    city: "İstanbul",
    district: "Kadıköy",
    breed: "French Bulldog",
    age: "3 ay",
    gender: "Dişi",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    pedigree: true,
    exampleSource: "İstanbul Bulldog Kulübü"
  },

  // ==================== KEDİLER ====================
  {
    id: "ex-kedi-001",
    categoryId: "cat-kedi-yavru",
    title: "British Shorthair Yavrusu - Gri",
    description: "British Shorthair yavrusu, mavi (gri) renk. 3 aylık, TICA kayıtlı. Bakır göz rengi. Tuvalet eğitimi tamamlanmış. Son derece sakin mizaçlı.",
    price: 25000,
    city: "İstanbul",
    district: "Sarıyer",
    breed: "British Shorthair",
    age: "3 ay",
    gender: "Erkek",
    healthStatus: "Aşılı",
    vaccinated: true,
    pedigree: true,
    exampleSource: "TICA Türkiye"
  },
  {
    id: "ex-kedi-002",
    categoryId: "cat-kedi-yavru",
    title: "Scottish Fold Yavrusu - Krem Tabby",
    description: "Scottish Fold yavrusu, krem tabby desenli. 2.5 aylık. Karakteristik katlı kulaklar. Son derece sevecen ve oyuncu. Veteriner kontrollü.",
    price: 30000,
    city: "Ankara",
    district: "Etimesgut",
    breed: "Scottish Fold",
    age: "2.5 ay",
    gender: "Dişi",
    healthStatus: "Aşılı",
    vaccinated: true,
    pedigree: true,
    exampleSource: "Ankara Kedi Severler"
  },
  {
    id: "ex-kedi-003",
    categoryId: "cat-kedi-yavru",
    title: "Van Kedisi Yavrusu - Tek Göz Mavi",
    description: "Saf Van kedisi yavrusu, klasik beyaz. Bir gözü mavi, bir gözü kehribar (odd-eye). 4 aylık, yüzme yeteneği var. Yüzey Bakanlığı sertifikalı.",
    price: 18000,
    city: "Van",
    district: "Merkez",
    breed: "Van Kedisi",
    age: "4 ay",
    gender: "Dişi",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    pedigree: true,
    exampleSource: "Van Kedisi Araştırma Merkezi"
  },
  {
    id: "ex-kedi-004",
    categoryId: "cat-kedi-yavru",
    title: "Maine Coon Yavrusu - Kahverengi Tabby",
    description: "Maine Coon yavrusu, klasik kahverengi tabby. 3.5 aylık, büyük kemik yapısı. Kedilerin köpeği olarak bilinen uysal mizaç. WCF kayıtlı.",
    price: 45000,
    city: "İzmir",
    district: "Karşıyaka",
    breed: "Maine Coon",
    age: "3.5 ay",
    gender: "Erkek",
    healthStatus: "Aşılı",
    vaccinated: true,
    pedigree: true,
    exampleSource: "WCF Türkiye"
  },
  {
    id: "ex-kedi-005",
    categoryId: "cat-ankara-kedisi",
    title: "Ankara Kedisi - Sertifikalı Damızlık",
    description: "Saf Ankara kedisi, beyaz, çift mavi göz. 2 yaşında, damızlık sertifikalı. Uzun ve ipeksi tüy yapısı. Bakanlık koruması altındaki ırk.",
    price: 22000,
    city: "Ankara",
    district: "Keçiören",
    breed: "Ankara Kedisi",
    age: "2 yıl",
    gender: "Dişi",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    pedigree: true,
    exampleSource: "Ankara Kedisi Koruma Derneği"
  },

  // ==================== KUŞLAR ====================
  {
    id: "ex-kus-001",
    categoryId: "cat-muhabbet-kusu",
    title: "Muhabbet Kuşu - Konuşan Erkek",
    description: "1 yaşında konuşan muhabbet kuşu. 20+ kelime biliyor. Mavi renk, ele alışkın. Kafes ve yem dahil. Çocuklar için ideal.",
    price: 1200,
    city: "İstanbul",
    district: "Üsküdar",
    breed: "Muhabbet Kuşu",
    age: "1 yıl",
    gender: "Erkek",
    healthStatus: "Sağlıklı",
    exampleSource: "İstanbul Kuş Pazarı"
  },
  {
    id: "ex-kus-002",
    categoryId: "cat-sultan-papagani",
    title: "Sultan Papağanı Çifti - Yetişkin Üreme",
    description: "Sultan papağanı çifti, 3 yaşında. Daha önce başarılı üreme yapmış. Kafes ve yuva kutusu dahil. Çift halinde satılık.",
    price: 4500,
    city: "Ankara",
    district: "Yenimahalle",
    breed: "Sultan Papağanı",
    age: "3 yıl",
    gender: "Çift",
    healthStatus: "Sağlıklı",
    exampleSource: "Ankara Kanarya ve Muhabbet Kuşu Derneği"
  },
  {
    id: "ex-kus-003",
    categoryId: "cat-kanarya",
    title: "Ötücü Kanarya - Şampiyon Soyundan",
    description: "Malinois kanarya, ötücü yarışma şampiyonunun yavrusu. 8 aylık erkek, güçlü ses. Halka numarası kayıtlı. Yarışma için uygun.",
    price: 2500,
    city: "Bursa",
    district: "Osmangazi",
    breed: "Malinois Kanarya",
    age: "8 ay",
    gender: "Erkek",
    healthStatus: "Sağlıklı",
    exampleSource: "Bursa Kanarya Sevenler Derneği"
  },
  {
    id: "ex-kus-004",
    categoryId: "cat-gri-papagan",
    title: "Afrika Gri Papağanı - Konuşan",
    description: "Afrika Gri Papağanı, 5 yaşında. 100+ kelime konuşuyor, cümle kuruyor. CITES belgeli, yasal ithalat. Kafes ve aksesuar dahil.",
    price: 85000,
    city: "İstanbul",
    district: "Beykoz",
    breed: "Afrika Gri Papağanı",
    age: "5 yıl",
    gender: "Erkek",
    healthStatus: "Sağlıklı",
    exampleSource: "Egzotik Kuş Derneği"
  },

  // ==================== BALIKLAR ====================
  {
    id: "ex-balik-001",
    categoryId: "cat-akvaryum-balik",
    title: "Japon Balığı Koleksiyonu - 10 Adet",
    description: "Çeşitli renklerde Japon balığı. Oranda, Fantail, Ryukin türleri. 2-3 yaşında, 8-12 cm boyutlarında. Akvaryum balıkçılığına yeni başlayanlar için ideal.",
    price: 850,
    city: "İstanbul",
    district: "Fatih",
    breed: "Japon Balığı Karışık",
    age: "2-3 yıl",
    healthStatus: "Sağlıklı",
    exampleSource: "İstanbul Akvaryum Market"
  },
  {
    id: "ex-balik-002",
    categoryId: "cat-koi",
    title: "Koi Balığı - Kohaku 35 cm",
    description: "Japon Kohaku Koi balığı, 35 cm. 2 yaşında, kırmızı-beyaz desen. Havuz balıkçılığı için ideal. Sağlık garantili teslimat.",
    price: 4500,
    city: "Antalya",
    district: "Kemer",
    breed: "Kohaku Koi",
    age: "2 yıl",
    healthStatus: "Sağlıklı",
    exampleSource: "Antalya Koi Farm"
  },

  // ==================== SÜRÜNGENLER ====================
  {
    id: "ex-suruengen-001",
    categoryId: "cat-ana-kaplumbaga",
    title: "Kara Kaplumbağası - 15 Yaşında",
    description: "Akdeniz kara kaplumbağası (Testudo graeca). 15 yaşında, 18 cm kabuk. CITES belgeli. Bahçe besleme için uygun. Kış uykusuna yatar.",
    price: 3500,
    city: "İzmir",
    district: "Çeşme",
    breed: "Testudo Graeca",
    age: "15 yıl",
    healthStatus: "Sağlıklı",
    exampleSource: "İzmir Sürüngen Severler"
  },
  {
    id: "ex-suruengen-002",
    categoryId: "cat-ana-geko",
    title: "Leopar Gekko - Normal Morph",
    description: "Leopar gekko, normal morph. 1 yaşında, 20 cm. Ele alışkın, sakin mizaçlı. Başlangıç egzotik hayvan için ideal. Teraryum kurulumu tavsiyeleri dahil.",
    price: 1800,
    city: "Ankara",
    district: "Çankaya",
    breed: "Leopar Gekko",
    age: "1 yıl",
    gender: "Erkek",
    healthStatus: "Sağlıklı",
    exampleSource: "Ankara Egzotik Hayvan Merkezi"
  },

  // ==================== KEMİRGENLER ====================
  {
    id: "ex-kemirgen-001",
    categoryId: "cat-tavsan",
    title: "Holland Lop Tavşan - Minyatür",
    description: "Holland Lop tavşanı, karamel renk. 4 aylık, tam yetişkin 1.8 kg. Düşük kulakları ile sevimli görünüm. Apartman için ideal.",
    price: 1500,
    city: "İstanbul",
    district: "Kadıköy",
    breed: "Holland Lop",
    age: "4 ay",
    gender: "Dişi",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    exampleSource: "İstanbul Tavşan Severler"
  },
  {
    id: "ex-kemirgen-002",
    categoryId: "cat-hamster",
    title: "Suriye Hamster - Altın Renk",
    description: "Suriye hamsterı, altın (sarı) renk. 2 aylık, ele alışkın. Kafes, tekerlek ve aksesuar dahil. Çocuklar için ilk evcil hayvan.",
    price: 350,
    city: "Bursa",
    district: "Nilüfer",
    breed: "Suriye Hamster",
    age: "2 ay",
    gender: "Erkek",
    healthStatus: "Sağlıklı",
    exampleSource: "Bursa Pet Shop"
  },
  {
    id: "ex-kemirgen-003",
    categoryId: "cat-gine-domuzu",
    title: "Gine Domuzu Çifti - Teddy",
    description: "Teddy Gine domuzu çifti. 6 aylık, kısa kıvırcık tüy. Çok sosyal ve ses çıkaran. Kafes ve aksesuar dahil.",
    price: 900,
    city: "İzmir",
    district: "Bornova",
    breed: "Teddy Guinea Pig",
    age: "6 ay",
    gender: "Çift",
    healthStatus: "Sağlıklı",
    exampleSource: "İzmir Kemirgen Severler"
  },

  // ==================== ARICILIK ====================
  {
    id: "ex-ari-001",
    categoryId: "cat-arili-kovan",
    title: "Arılı Kovan - Kafkas Arısı 10 Çerçeve",
    description: "10 çerçeveli arılı kovan, Kafkas ana arı. Güçlü koloni, 8 çerçeve yavrulu. Verimli bal üretimi. Yeni arıcılığa başlayanlar için ideal.",
    price: 7500,
    city: "Muğla",
    district: "Fethiye",
    breed: "Kafkas Arısı",
    healthStatus: "Varroa Tedavili",
    exampleSource: "Muğla Arıcılar Birliği"
  },
  {
    id: "ex-ari-002",
    categoryId: "cat-ana-ari",
    title: "Damızlık Ana Arı - Carnica",
    description: "Sertifikalı Carnica damızlık ana arısı. Sakin mizaç, yüksek bal verimi genetiği. Çiftleşmiş, yumurtlama garantili.",
    price: 1200,
    city: "Artvin",
    district: "Merkez",
    breed: "Carnica",
    healthStatus: "Sertifikalı",
    exampleSource: "Artvin Ana Arı Üretim Merkezi"
  },

  // ==================== YEM VE MAMA ====================
  {
    id: "ex-yem-001",
    categoryId: "cat-besi-yemi",
    title: "Büyükbaş Besi Yemi - 1 Ton",
    description: "Fabrika çıkışı büyükbaş besi yemi. %16 protein, 2800 kcal/kg enerji. Besi danası ve genç sığırlar için formülize. Toptan fiyat.",
    price: 18500,
    city: "Konya",
    district: "Selçuklu",
    breed: "Konsantre Yem",
    healthStatus: "TSE Sertifikalı",
    exampleSource: "Konya Yem Sanayi"
  },
  {
    id: "ex-yem-002",
    categoryId: "cat-kopek-mamasi",
    title: "Premium Köpek Maması - 15 kg",
    description: "Yetişkin köpekler için premium kuru mama. Kuzu etli, pirinçli formül. Hassas sindirim için uygun. Türkiye üretimi.",
    price: 1850,
    city: "İstanbul",
    district: "Kartal",
    breed: "Yetişkin Köpek",
    healthStatus: "Veteriner Onaylı",
    exampleSource: "Türk Pet Food"
  },

  // ==================== EKİPMAN ====================
  {
    id: "ex-ekip-001",
    categoryId: "cat-kumes-ekipman",
    title: "Otomatik Tavuk Yemliği - 50 kg",
    description: "Galvaniz çelik otomatik yemlik. 50 kg kapasiteli, 100 tavuk için yeterli. Yem israfını önler. Montaj malzemesi dahil.",
    price: 2800,
    city: "Bolu",
    district: "Merkez",
    healthStatus: "Yeni",
    exampleSource: "Bolu Tarım Market"
  },
  {
    id: "ex-ekip-002",
    categoryId: "cat-akvaryum-malz",
    title: "Akvaryum Seti - 200 Litre Komple",
    description: "200 litre cam akvaryum seti. Dış filtre, ısıtıcı, LED aydınlatma, kum ve dekor dahil. Kuruluma hazır paket.",
    price: 8500,
    city: "İstanbul",
    district: "Fatih",
    healthStatus: "Sıfır",
    exampleSource: "İstanbul Akvaryum Market"
  },

  // ==================== EK İLANLAR ====================
  {
    id: "ex-buyukbas-005",
    categoryId: "cat-manda",
    title: "Anadolu Mandası - Süt Verimi Yüksek",
    description: "Anadolu mandası, 5 yaşında. Günlük 8 litre süt verimi. Manda kaymağı üretimi için ideal. Afyon bölgesi yetiştiricisinden.",
    price: 145000,
    city: "Afyonkarahisar",
    district: "Merkez",
    breed: "Anadolu Mandası",
    age: "5 yıl",
    gender: "Dişi",
    healthStatus: "Sağlıklı - Sağımda",
    vaccinated: true,
    exampleSource: "Afyon Manda Yetiştiricileri"
  },
  {
    id: "ex-kucukbas-006",
    categoryId: "cat-oglak",
    title: "Saanen Oğlak - 3 Aylık",
    description: "Saanen ırkı oğlak, 3 aylık dişi. Süt soyundan, annesi günlük 4 litre. Damızlık veya süt üretimi için yetiştirilecek.",
    price: 5500,
    city: "İzmir",
    district: "Ödemiş",
    breed: "Saanen",
    age: "3 ay",
    gender: "Dişi",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    exampleSource: "İzmir Keçi Yetiştiricileri"
  },
  {
    id: "ex-kopek-006",
    categoryId: "cat-kopek-yavru",
    title: "Akbaş Çoban Köpeği - Yavru",
    description: "Saf Akbaş çoban köpeği yavrusu. 3 aylık, beyaz tüylü. Sürü koruma içgüdüsü güçlü. Çiftlik ve kırsal alan için ideal.",
    price: 15000,
    city: "Afyonkarahisar",
    district: "Sandıklı",
    breed: "Akbaş",
    age: "3 ay",
    gender: "Erkek",
    healthStatus: "Aşılı",
    vaccinated: true,
    exampleSource: "Akbaş Köpeği Yetiştirici Birliği"
  },
  {
    id: "ex-kedi-006",
    categoryId: "cat-kedi-yavru",
    title: "Ragdoll Kedi Yavrusu - Blue Point",
    description: "Ragdoll kedisi, blue point renk. 3 aylık, kucak kedisi karakteri. TICA kayıtlı. Mavi gözlü, ipeksi tüy yapısı.",
    price: 38000,
    city: "İstanbul",
    district: "Bakırköy",
    breed: "Ragdoll",
    age: "3 ay",
    gender: "Dişi",
    healthStatus: "Aşılı",
    vaccinated: true,
    pedigree: true,
    exampleSource: "TICA Türkiye"
  },
  {
    id: "ex-at-004",
    categoryId: "cat-at-pony",
    title: "Shetland Pony - Çocuk Biniciliği",
    description: "Shetland pony, 7 yaşında. 95 cm yükseklik. Çok sakin, çocuk biniciliği için eğitimli. Terapi merkezi veya çocuk parkı için uygun.",
    price: 85000,
    city: "İstanbul",
    district: "Beykoz",
    breed: "Shetland Pony",
    age: "7 yıl",
    gender: "Erkek",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    exampleSource: "İstanbul Pony Kulübü"
  },
  {
    id: "ex-kus-005",
    categoryId: "cat-ana-guvercin",
    title: "Takla Güvercini - Şampiyon Soyundan",
    description: "Adana taklacı güvercin çifti. Yarışma şampiyonunun yavruları. 6 aylık, uçuş eğitimi tamamlanmış. Halkalı ve kayıtlı.",
    price: 3500,
    city: "Adana",
    district: "Seyhan",
    breed: "Adana Taklacı",
    age: "6 ay",
    gender: "Çift",
    healthStatus: "Sağlıklı",
    exampleSource: "Adana Güvercin Sevenler Derneği"
  },
];

// Güncel piyasa fiyatları - 2024-2025
export const currentMarketPrices = [
  // Büyükbaş
  { type: "buyukbas", category: "Besi Danası (kg canlı)", minPrice: 340, maxPrice: 380, unit: "kg", cities: ["İstanbul", "Ankara", "Konya", "Bursa"] },
  { type: "buyukbas", category: "Düve (gebe)", minPrice: 150000, maxPrice: 180000, unit: "baş", cities: ["Balıkesir", "Konya", "Afyon"] },
  { type: "buyukbas", category: "Süt İneği", minPrice: 180000, maxPrice: 220000, unit: "baş", cities: ["Bursa", "Balıkesir", "Sakarya"] },
  { type: "buyukbas", category: "Damızlık Boğa", minPrice: 280000, maxPrice: 350000, unit: "baş", cities: ["Ankara", "Konya"] },
  
  // Küçükbaş
  { type: "kucukbas", category: "Merinos Koyun", minPrice: 11000, maxPrice: 14000, unit: "baş", cities: ["Konya", "Afyon", "Aksaray"] },
  { type: "kucukbas", category: "İvesi Koyun", minPrice: 12000, maxPrice: 16000, unit: "baş", cities: ["Şanlıurfa", "Diyarbakır"] },
  { type: "kucukbas", category: "Saanen Keçi", minPrice: 9000, maxPrice: 12000, unit: "baş", cities: ["Muğla", "İzmir", "Aydın"] },
  { type: "kucukbas", category: "Besi Kuzusu (35-40kg)", minPrice: 6500, maxPrice: 8000, unit: "baş", cities: ["Afyon", "Konya", "Bolu"] },
  
  // Kanatlı
  { type: "kanatli", category: "Yumurtacı Tavuk", minPrice: 180, maxPrice: 250, unit: "adet", cities: ["Bolu", "Afyon", "Manisa"] },
  { type: "kanatli", category: "Köy Tavuğu", minPrice: 200, maxPrice: 350, unit: "adet", cities: ["Kastamonu", "Çorum"] },
  { type: "kanatli", category: "Kasaplık Hindi", minPrice: 200, maxPrice: 280, unit: "kg", cities: ["Denizli", "Aydın"] },
  { type: "kanatli", category: "Damızlık Kaz", minPrice: 1800, maxPrice: 2500, unit: "çift", cities: ["Kars", "Erzurum"] },
  
  // At
  { type: "at", category: "Safkan Arap Atı", minPrice: 700000, maxPrice: 1200000, unit: "baş", cities: ["İstanbul", "Ankara"] },
  { type: "at", category: "İngiliz Atı (spor)", minPrice: 350000, maxPrice: 500000, unit: "baş", cities: ["Ankara", "İstanbul"] },
  { type: "at", category: "Pony", minPrice: 60000, maxPrice: 100000, unit: "baş", cities: ["İstanbul", "Bursa"] },
  
  // Arıcılık
  { type: "aricilik", category: "Arılı Kovan (10 çerçeve)", minPrice: 6500, maxPrice: 8500, unit: "adet", cities: ["Muğla", "Artvin", "Ordu"] },
  { type: "aricilik", category: "Ana Arı (damızlık)", minPrice: 800, maxPrice: 1500, unit: "adet", cities: ["Artvin", "Muğla"] },
];
