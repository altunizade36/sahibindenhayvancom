// 17 Ana Kategori için Gerçekçi Türk Hayvan İlanları - 2025 Güncel Piyasa Fiyatları
// Kaynak: TÜSEDAD, ESK, İl Tarım Müdürlükleri, Hayvan Borsaları, Sahibinden.com

export interface ExampleListing {
  id: string;
  mainCategory: string;
  categorySlug: string;
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
  imageFile: string;
}

// 17 Ana Kategori için Örnek İlanlar - Her Kategoriden 1 Adet
export const exampleListings: ExampleListing[] = [
  // 1. Evcil Hayvanlar - Köpek
  {
    id: "ex-evcil-kopek-001",
    mainCategory: "cat-evcil-hayvanlar",
    categorySlug: "kopek-yavru",
    title: "Golden Retriever Yavrusu - Soy Belgeli, Aşılı",
    description: "3 aylık saf kan Golden Retriever yavrusu. FCI soy belgeli, tüm aşıları yapılmış, mikroçipli. Ebeveynler şampiyon soyundan gelme. Altın sarısı tüy rengi, mükemmel karakter yapısı. Çocuklarla harika uyum sağlar. Veteriner sağlık raporu ve aşı karnesi ile teslim. İstanbul içi ücretsiz teslimat.",
    price: 35000,
    city: "İstanbul",
    district: "Beşiktaş",
    breed: "Golden Retriever",
    age: "3 ay",
    gender: "Erkek",
    healthStatus: "Aşılı - Sağlıklı",
    vaccinated: true,
    pedigree: true,
    exampleSource: "KIF Türkiye 2025",
    imageFile: "golden_retriever_pup_dc119287.jpg"
  },
  
  // 2. Evcil Hayvanlar - Kedi
  {
    id: "ex-evcil-kedi-001",
    mainCategory: "cat-evcil-hayvanlar",
    categorySlug: "kedi-yavru",
    title: "British Shorthair Yavrusu - Mavi Renk, TICA Kayıtlı",
    description: "3 aylık British Shorthair yavrusu, klasik mavi (gri) renk. TICA kayıtlı, bakır göz rengi. Tuvalet eğitimi tamamlanmış, son derece sakin ve sevecen mizaçlı. İlk aşıları ve iç-dış parazit tedavisi yapılmış. Anne-baba her ikisi de şampiyon soyundan. Veteriner kontrolünden geçmiştir.",
    price: 28000,
    city: "Ankara",
    district: "Çankaya",
    breed: "British Shorthair",
    age: "3 ay",
    gender: "Dişi",
    healthStatus: "Aşılı - Sağlıklı",
    vaccinated: true,
    pedigree: true,
    exampleSource: "TICA Türkiye 2025",
    imageFile: "british_shorthair_gr_08fde7cf.jpg"
  },

  // 3. Çiftlik Hayvanları - Büyükbaş (İnek)
  {
    id: "ex-ciftlik-buyukbas-001",
    mainCategory: "cat-ciftlik-hayvanlari",
    categorySlug: "sut-inegi",
    title: "Holstein Süt İneği - Günlük 32 Litre, 2. Laktasyon",
    description: "4 yaşında Holstein inek, günlük ortalama 32 litre süt verimi. 2. laktasyonda, mastitis ve brucella testleri negatif. TÜRKVET kayıtlı, kulak küpesi mevcut. Suni tohumlama belgesi var. Sağlık karnesi düzenli tutulmuş. Ciddi alıcılara veteriner raporu ile teslim.",
    price: 195000,
    city: "Bursa",
    district: "Karacabey",
    breed: "Holstein",
    age: "4 yıl",
    gender: "Dişi",
    healthStatus: "Sağlıklı - Sağımda",
    vaccinated: true,
    exampleSource: "Bursa Hayvan Borsası 2025",
    imageFile: "holstein_dairy_cow_c_cf1f7e48.jpg"
  },

  // 4. Çiftlik Hayvanları - Küçükbaş (Koyun)
  {
    id: "ex-ciftlik-kucukbas-001",
    mainCategory: "cat-ciftlik-hayvanlari",
    categorySlug: "koyun",
    title: "Merinos Koyun Sürüsü - 25 Baş Gebe, Damızlık",
    description: "25 baş saf kan Merinos koyunu, tamamı gebe durumda. Yaşları 2-4 arasında. Aşıları ve ilaçlamaları eksiksiz yapılmış. Sürü halinde toptan satılık. Kulak küpeleri TÜRKVET kayıtlı. Yüksek yapağı verimi. Konya bölgesi damızlık birliğinden alınmıştır.",
    price: 312500,
    city: "Konya",
    district: "Çumra",
    breed: "Merinos",
    age: "2-4 yaş",
    gender: "Dişi",
    healthStatus: "Gebe - Sağlıklı",
    vaccinated: true,
    exampleSource: "Konya Koyun Keçi Yetiştiricileri Birliği 2025",
    imageFile: "merino_sheep_flock_f_3d6bd948.jpg"
  },

  // 5. Çiftlik Hayvanları - Küçükbaş (Keçi)
  {
    id: "ex-ciftlik-keci-001",
    mainCategory: "cat-ciftlik-hayvanlari",
    categorySlug: "keci",
    title: "Saanen Süt Keçisi - Günlük 4 Litre, Damızlık",
    description: "3 yaşında saf Saanen süt keçisi, günlük ortalama 4 litre süt verimi. Damızlık sertifikalı. 2 defa doğum yapmış, sağlıklı yavrular vermiş. Sakin mizaçlı, sağıma alışkın. Aşıları tam. Keçi peyniri üretimi veya damızlık için ideal.",
    price: 11500,
    city: "Muğla",
    district: "Milas",
    breed: "Saanen",
    age: "3 yıl",
    gender: "Dişi",
    healthStatus: "Sağlıklı - Sağımda",
    vaccinated: true,
    pedigree: true,
    exampleSource: "Ege Keçi Yetiştiricileri Birliği 2025",
    imageFile: "saanen_goat_white_fa_1ccff657.jpg"
  },

  // 6. Kümes ve Süs Kuşları - Tavuk
  {
    id: "ex-kumes-tavuk-001",
    mainCategory: "cat-kuslar",
    categorySlug: "ciftlik-tavuk",
    title: "Lohmann Brown Yumurtacı Tavuk - 100 Adet, Verimde",
    description: "Lohmann Brown ırkı yumurtacı tavuk, 100 adet. 8 aylık, yumurta verimine yeni başlamış. Günlük %92 yumurta verimi. Kafes veya serbest gezen sistem için uygun. Tüm aşıları yapılmış. Toptan satış, fabrika çıkışı belgeli. Nakliye organizasyonu yapılabilir.",
    price: 25000,
    city: "Bolu",
    district: "Merkez",
    breed: "Lohmann Brown",
    age: "8 ay",
    gender: "Dişi",
    healthStatus: "Verimde - Sağlıklı",
    vaccinated: true,
    exampleSource: "Bolu Yumurta Üreticileri Birliği 2025",
    imageFile: "brown_chicken_hen_po_a794dde2.jpg"
  },

  // 7. Kümes ve Süs Kuşları - Kaz
  {
    id: "ex-kumes-kaz-001",
    mainCategory: "cat-kuslar",
    categorySlug: "ciftlik-kaz",
    title: "Toulouse Kazı Damızlık Takım - 2 Dişi + 1 Erkek",
    description: "Toulouse ırkı damızlık kaz takımı: 2 dişi + 1 erkek. 2 yaşında, verimli dönemde. Geçen yıl başarılı üreme yapmış. Yılda 40-50 yumurta. Kars bölgesi yetiştiricisinden. Civciv üretimi veya et üretimi için ideal. Kafes ve yuva kutusu dahil.",
    price: 7500,
    city: "Kars",
    district: "Merkez",
    breed: "Toulouse",
    age: "2 yıl",
    gender: "Karışık",
    healthStatus: "Sağlıklı - Üreme Döneminde",
    vaccinated: true,
    exampleSource: "Kars Kümes Hayvancılığı Birliği 2025",
    imageFile: "white_goose_farm_pou_148365d1.jpg"
  },

  // 8. Kümes ve Süs Kuşları - Muhabbet Kuşu
  {
    id: "ex-kus-muhabbet-001",
    mainCategory: "cat-kuslar",
    categorySlug: "muhabbet-kusu",
    title: "Muhabbet Kuşu - Konuşan Erkek, Mavi Renk",
    description: "1 yaşında konuşan muhabbet kuşu, mavi renk. 25+ kelime biliyor, şarkı söylüyor. Ele tamamen alışkın, omuzda duruyor. Çocuklarla harika uyum. Büyük kafes, oyuncaklar, yem stoku dahil. Sağlıklı ve aktif, veteriner kontrolünden geçmiş.",
    price: 1500,
    city: "İzmir",
    district: "Bornova",
    breed: "Muhabbet Kuşu",
    age: "1 yıl",
    gender: "Erkek",
    healthStatus: "Sağlıklı",
    exampleSource: "İzmir Kuş Pazarı 2025",
    imageFile: "budgerigar_parakeet__0e375a89.jpg"
  },

  // 9. Atlar ve Binicilik
  {
    id: "ex-at-001",
    mainCategory: "cat-atlar-binicilik",
    categorySlug: "arap-ati",
    title: "Safkan Arap Atı - TJK Tescilli, Yarış Geçmişli",
    description: "5 yaşında safkan Arap atı kısrak. TJK (Türkiye Jokey Kulübü) tescilli, yarış geçmişi mevcut. Soy ağacı 6 nesil kayıtlı. Damızlık veya spor biniciliği için uygun. Eğitimli, sakin mizaçlı. Veteriner raporu ve tüm belgeler mevcut. İstanbul çevresinde profesyonel binicilik tesisinde bakılmaktadır.",
    price: 950000,
    city: "İstanbul",
    district: "Şile",
    breed: "Safkan Arap",
    age: "5 yıl",
    gender: "Dişi",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    pedigree: true,
    exampleSource: "Türkiye Jokey Kulübü 2025",
    imageFile: "arabian_horse_brown__6a938217.jpg"
  },

  // 10. Balıklar ve Su Ürünleri
  {
    id: "ex-balik-001",
    mainCategory: "cat-baliklar-su-urunleri",
    categorySlug: "akvaryum-baligi",
    title: "Akvaryum Balığı Koleksiyonu - 15 Adet Tropikal",
    description: "Tropik akvaryum balığı koleksiyonu: Guppy, Platy, Molly, Tetra çeşitleri. Toplam 15 adet yetişkin balık. 6-12 aylık, sağlıklı ve aktif. Başlangıç akvaryumcular için ideal set. 100 litre akvaryum için uygun. Su parametreleri ve bakım bilgisi verilecek.",
    price: 950,
    city: "İstanbul",
    district: "Fatih",
    breed: "Karışık Tropikal",
    age: "6-12 ay",
    healthStatus: "Sağlıklı",
    exampleSource: "İstanbul Akvaryum Market 2025",
    imageFile: "aquarium_tropical_fi_8406679e.jpg"
  },

  // 11. Arıcılık
  {
    id: "ex-ari-001",
    mainCategory: "cat-aricilik",
    categorySlug: "arili-kovan",
    title: "Arılı Kovan - Kafkas Arısı, 10 Çerçeve Güçlü Koloni",
    description: "10 çerçeveli arılı kovan, Kafkas ana arı ile güçlü koloni. 8 çerçeve yavrulu, 2 çerçeve ballı. Varroa tedavisi yapılmış. Yeni arıcılığa başlayanlar için ideal. Langstroth tipi kovan, kaliteli ahşap malzeme. Arıcılık ekipmanı tavsiyeleri dahil. Muğla bölgesi çiçek balı verimi yüksek.",
    price: 8500,
    city: "Muğla",
    district: "Fethiye",
    breed: "Kafkas Arısı",
    healthStatus: "Varroa Tedavili - Sağlıklı",
    exampleSource: "Muğla Arıcılar Birliği 2025",
    imageFile: "beehive_honeybee_api_356132e5.jpg"
  },

  // 12. Sürüngenler ve Amfibiler
  {
    id: "ex-surunegen-001",
    mainCategory: "cat-surungenler-amfibiler",
    categorySlug: "kaplumbaga",
    title: "Kara Kaplumbağası - 12 Yaşında, CITES Belgeli",
    description: "Akdeniz kara kaplumbağası (Testudo graeca), 12 yaşında, 16 cm kabuk. CITES belgeli, yasal edinim. Bahçe besleme için uygun, kış uykusuna yatar. Sağlıklı, aktif ve iyi beslenmiş. Bakım bilgisi ve kış uykusu rehberi verilecek. Akdeniz iklimine uygun.",
    price: 4500,
    city: "Antalya",
    district: "Kemer",
    breed: "Testudo Graeca",
    age: "12 yıl",
    healthStatus: "Sağlıklı",
    exampleSource: "Antalya Egzotik Hayvan Merkezi 2025",
    imageFile: "land_turtle_tortoise_31034b5a.jpg"
  },

  // 13. Kemirgenler ve Küçük Hayvanlar
  {
    id: "ex-kemirgen-001",
    mainCategory: "cat-kemirgenler-kucuk-hayvanlar",
    categorySlug: "tavsan",
    title: "Holland Lop Tavşan - Karamel Renk, Minyatür",
    description: "Holland Lop tavşanı, karamel renk. 5 aylık, tam yetişkin 1.6 kg olacak. Düşük kulakları ile çok sevimli görünüm. Apartman için ideal, sessiz ve temiz. Tuvalet eğitimi tamamlanmış. Kafes, su kabı, yemlik ve 1 ay yem stoku dahil.",
    price: 1800,
    city: "Ankara",
    district: "Keçiören",
    breed: "Holland Lop",
    age: "5 ay",
    gender: "Dişi",
    healthStatus: "Sağlıklı",
    vaccinated: true,
    exampleSource: "Ankara Tavşan Severler 2025",
    imageFile: "holland_lop_bunny_ra_bcbdccfc.jpg"
  },

  // 14. Yem, Mama ve Tarım Ürünleri
  {
    id: "ex-yem-001",
    mainCategory: "cat-yem-mama-tarim",
    categorySlug: "besi-yemi",
    title: "Büyükbaş Besi Yemi - 1 Ton, Fabrika Çıkışı",
    description: "Fabrika çıkışı büyükbaş besi yemi, 1 ton (20 çuval x 50 kg). %16 ham protein, 2850 kcal/kg metabolik enerji. Besi danası ve genç sığırlar için formülize. TSE ve Tarım Bakanlığı onaylı. Raf ömrü 6 ay. Konya bölgesinden depo teslim veya nakliye organizasyonu.",
    price: 21500,
    city: "Konya",
    district: "Selçuklu",
    breed: "Konsantre Besi Yemi",
    healthStatus: "TSE Sertifikalı",
    exampleSource: "Konya Yem Sanayi 2025",
    imageFile: "animal_feed_pellets__c4b5990c.jpg"
  },

  // 15. Araçlar ve Nakliye
  {
    id: "ex-arac-001",
    mainCategory: "cat-araclar-nakliye",
    categorySlug: "hayvan-tasima-araci",
    title: "Hayvan Nakliye Aracı - 3.5 Ton, Klimalı",
    description: "2020 model hayvan nakliye aracı, 3.5 ton kapasiteli. Büyükbaş için 4, küçükbaş için 20 hayvan kapasiteli. Havalandırmalı kasa, otomatik suluk sistemi. Klimalı kabin. 85.000 km, bakımları düzenli, muayenesi yeni. Hayvan nakil ruhsatı mevcut.",
    price: 750000,
    city: "Ankara",
    district: "Polatlı",
    breed: "Nakliye Aracı",
    healthStatus: "Bakımlı - Ruhsatlı",
    exampleSource: "Türkiye Nakliyeciler 2025",
    imageFile: "livestock_transport__d946b672.jpg"
  },

  // 16. Tarım ve Kırsal Emlak
  {
    id: "ex-emlak-001",
    mainCategory: "cat-tarim-kirsal-emlak",
    categorySlug: "ciftlik-arazisi",
    title: "Çiftlik Arazisi - 50 Dönüm, Sulama İmkanlı",
    description: "50 dönüm tarım arazisi, çiftlik kurulumuna uygun. Sulama kanalı mevcut, elektrik bağlı. Köy yoluna cepheli, kolay ulaşım. Meyve bahçesi veya hayvancılık için ideal. Tapu temiz, hissesiz satılık. Yatırım fırsatı. Detaylı bilgi ve arazi gezisi için arayınız.",
    price: 4500000,
    city: "Afyonkarahisar",
    district: "Sandıklı",
    breed: "Tarım Arazisi",
    healthStatus: "Tapulu - Temiz",
    exampleSource: "Afyon Emlak 2025",
    imageFile: "farm_land_rural_coun_6074db06.jpg"
  },

  // 17. Mağazalar (Pet Shop)
  {
    id: "ex-magaza-001",
    mainCategory: "cat-magazalar",
    categorySlug: "pet-shop",
    title: "Pet Shop Mağazası - Devren Satılık, Müşteri Portföylü",
    description: "10 yıllık köklü pet shop mağazası, devren satılık. 120 m² kapalı alan, merkezi lokasyon. Akvaryum, kuş, kemirgen, kedi-köpek aksesuar bölümleri. Düzenli müşteri portföyü, online satış altyapısı mevcut. Marka bilinirliği yüksek. Aylık ortalama ciro bilgisi verilecek. Ciddi alıcılara detaylı bilgi.",
    price: 850000,
    city: "İzmir",
    district: "Karşıyaka",
    breed: "Pet Shop",
    healthStatus: "Faal - Ruhsatlı",
    exampleSource: "İzmir Ticaret 2025",
    imageFile: "pet_shop_store_inter_ea45cc01.jpg"
  },

  // 18. Veterinerlik ve Hizmetler
  {
    id: "ex-veteriner-001",
    mainCategory: "cat-veterinerlik-hizmetler",
    categorySlug: "veteriner-klinigi",
    title: "Veteriner Kliniği - Tam Donanımlı, Devren",
    description: "Tam donanımlı veteriner kliniği devren. Ameliyathane, röntgen, ultrason, laboratuvar ekipmanları mevcut. 150 m² kullanım alanı. 2 muayene odası. Düzenli müşteri portföyü ve SGK anlaşmalı. Tüm ruhsatlar güncel. Veteriner hekimlik diploması şartı ile devir yapılacaktır.",
    price: 1250000,
    city: "İstanbul",
    district: "Kadıköy",
    breed: "Veteriner Kliniği",
    healthStatus: "Faal - Ruhsatlı",
    exampleSource: "İstanbul Veteriner Odası 2025",
    imageFile: "veterinary_clinic_do_855b1ed8.jpg"
  },

  // 19. Ekipmanlar ve Aksesuarlar
  {
    id: "ex-ekipman-001",
    mainCategory: "cat-ekipmanlar-aksesuarlar",
    categorySlug: "kumes-ekipmani",
    title: "Otomatik Tavuk Yemliği - 100 kg Kapasiteli",
    description: "Galvaniz çelik otomatik tavuk yemliği, 100 kg kapasite. 200-250 tavuk için yeterli. Yem israfını %30 azaltır. Kolay dolum sistemi, ayarlanabilir yem çıkışı. Montaj malzemeleri ve kullanım kılavuzu dahil. 2 yıl garanti. Kargo ile Türkiye geneli gönderim.",
    price: 3800,
    city: "Bolu",
    district: "Merkez",
    breed: "Kümes Ekipmanı",
    healthStatus: "Sıfır - Garantili",
    exampleSource: "Bolu Tarım Market 2025",
    imageFile: "brown_chicken_hen_po_a794dde2.jpg"
  },
];

// 2025 Güncel Piyasa Fiyatları - Türkiye Hayvan Pazarları
export const currentMarketPrices2025 = {
  buyukbas: {
    "Besi Danası (kg canlı)": { min: 360, max: 410, unit: "₺/kg" },
    "Holstein Düve (gebe)": { min: 165000, max: 195000, unit: "₺/baş" },
    "Simental Düve (gebe)": { min: 175000, max: 210000, unit: "₺/baş" },
    "Süt İneği (sağımda)": { min: 185000, max: 230000, unit: "₺/baş" },
    "Damızlık Boğa": { min: 300000, max: 380000, unit: "₺/baş" },
  },
  kucukbas: {
    "Merinos Koyun": { min: 12000, max: 15000, unit: "₺/baş" },
    "İvesi Koyun": { min: 13000, max: 17000, unit: "₺/baş" },
    "Saanen Keçi": { min: 10000, max: 13000, unit: "₺/baş" },
    "Besi Kuzusu (35-40kg)": { min: 7000, max: 9000, unit: "₺/baş" },
  },
  kanatli: {
    "Yumurtacı Tavuk": { min: 200, max: 280, unit: "₺/adet" },
    "Köy Tavuğu": { min: 250, max: 400, unit: "₺/adet" },
    "Kasaplık Hindi (kg)": { min: 220, max: 300, unit: "₺/kg" },
    "Damızlık Kaz (çift)": { min: 2000, max: 3000, unit: "₺/çift" },
  },
  at: {
    "Safkan Arap Atı": { min: 800000, max: 1500000, unit: "₺/baş" },
    "İngiliz Atı (spor)": { min: 400000, max: 600000, unit: "₺/baş" },
    "Shetland Pony": { min: 80000, max: 120000, unit: "₺/baş" },
  },
  kopek: {
    "Golden Retriever (yavru)": { min: 25000, max: 40000, unit: "₺/yavru" },
    "Alman Çoban (yavru)": { min: 20000, max: 35000, unit: "₺/yavru" },
    "Kangal (yetişkin)": { min: 60000, max: 90000, unit: "₺/baş" },
    "French Bulldog (yavru)": { min: 55000, max: 85000, unit: "₺/yavru" },
  },
  kedi: {
    "British Shorthair (yavru)": { min: 22000, max: 35000, unit: "₺/yavru" },
    "Scottish Fold (yavru)": { min: 28000, max: 45000, unit: "₺/yavru" },
    "Van Kedisi (yavru)": { min: 15000, max: 22000, unit: "₺/yavru" },
    "Maine Coon (yavru)": { min: 40000, max: 60000, unit: "₺/yavru" },
  },
  aricilik: {
    "Arılı Kovan (10 çerçeve)": { min: 7500, max: 10000, unit: "₺/kovan" },
    "Ana Arı (damızlık)": { min: 900, max: 1800, unit: "₺/adet" },
  },
};
