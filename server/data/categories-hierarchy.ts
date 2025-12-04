import { Category } from "@shared/schema";
import { slugify, generateCategoryId } from "@shared/utils";

// Helper to create category with hierarchy support and deterministic IDs
const createCategory = (
  name: string,
  slug: string,
  icon: string,
  order: number,
  parentId: string | null = null,
  depth: number = 0,
  path: string[] = []
): Category => {
  const normalizedSlug = slugify(slug);
  return {
    id: generateCategoryId(normalizedSlug),
    name,
    slug: normalizedSlug,
    icon,
    parentId,
    order,
    depth,
    path,
    image: null,
    description: null,
  };
};

// Build the complete category hierarchy
export const categoriesHierarchy: Category[] = [];

// Level 0: Root categories
const evcilHayvanlar = createCategory("Evcil Hayvanlar", "evcil-hayvanlar", "PawPrint", 0);
const ciftlikHayvanlari = createCategory("Çiftlik Hayvanları", "ciftlik-hayvanlari", "Tractor", 1);
const baliklar = createCategory("Balıklar ve Su Ürünleri", "baliklar-su-urunleri", "Fish", 2);
const atlar = createCategory("Atlar ve Binicilik", "atlar-binicilik", "Horse", 3);
const aricilik = createCategory("Arıcılık", "aricilik", "Honeycomb", 4);
const kuslar = createCategory("Kümes ve Süs Kuşları", "kuslar", "Bird", 5);
const surungenler = createCategory("Sürüngenler ve Amfibiler", "surungenler-amfibiler", "Turtle", 6);
const kemirgenler = createCategory("Kemirgenler ve Küçük Hayvanlar", "kemirgenler-kucuk-hayvanlar", "Squirrel", 7);
const yemMama = createCategory("Yem, Mama ve Tarım Ürünleri", "yem-mama-tarim", "Wheat", 9);
const ekipmanlar = createCategory("Ekipmanlar ve Aksesuarlar", "ekipmanlar-aksesuarlar", "ShoppingBag", 10);
const veterinerlik = createCategory("Veterinerlik & Hizmetler", "veterinerlik-hizmetler", "Stethoscope", 11);
const kayitBelgeler = createCategory("Kayıt & Belgeler", "kayit-belgeler", "FileText", 12);
const magazalar = createCategory("Mağazalar", "magazalar", "Store", 13);
// NEW: 4 additional main categories
const tarimEmlak = createCategory("Tarım & Kırsal Emlak", "tarim-kirsal-emlak", "Home", 14);
const araclarNakliye = createCategory("Araçlar & Nakliye", "araclar-nakliye", "Truck", 15);
const uretimTesisleri = createCategory("Üretim & İşleme Tesisleri", "uretim-isleme-tesisleri", "Factory", 16);
const insaatYapi = createCategory("İnşaat & Yapı", "insaat-yapi", "Building", 17);

categoriesHierarchy.push(
  evcilHayvanlar,
  ciftlikHayvanlari,
  baliklar,
  atlar,
  aricilik,
  kuslar,
  surungenler,
  kemirgenler,
  yemMama,
  ekipmanlar,
  veterinerlik,
  kayitBelgeler,
  magazalar,
  tarimEmlak,
  araclarNakliye,
  uretimTesisleri,
  insaatYapi
);

// ========== 1. Evcil Hayvanlar (Pet Animals) ==========

// Köpekler (Dogs)
const kopekler = createCategory("Köpekler", "kopekler", "Dog", 0, evcilHayvanlar.id, 1, [evcilHayvanlar.id]);
categoriesHierarchy.push(kopekler);

// Köpek Irkları (Dog Breeds) - Genişletilmiş liste
const dogBreeds = [
  // Popüler Irklar
  "Golden Retriever", "German Shepherd", "Rottweiler", "Pomeranian", 
  "Labrador", "Husky", "Doberman", "Pug", "Terrier", "Cane Corso", 
  "Maltese", "Chihuahua", "Beagle", "Kangal", "Akita", "Shiba Inu",
  "Bulldog", "French Bulldog", "Yorkshire Terrier", "Poodle",
  "Border Collie", "Cavalier King Charles", "Corgi", "Boxer",
  "Samoyed", "Cocker Spaniel", "Dachshund", "Jack Russell",
  // Türk Köpek Irkları
  "Akbaş", "Malaklı", "Sivas Kangalı", "Kars Köpeği", "Çatalburun",
  "Aksaray Malaklısı", "Anadolu Çoban Köpeği", "Türk Tazısı",
  // Ek Popüler Irklar
  "Bichon Frise", "Shih Tzu", "Bernese Mountain Dog", "Great Dane",
  "Dalmatian", "St. Bernard", "Australian Shepherd", "Miniature Schnauzer",
  "Weimaraner", "Vizsla", "Belgian Malinois", "Chow Chow",
  "Newfoundland", "Collie", "Basenji", "Whippet", "Greyhound",
  "American Staffordshire", "Pit Bull", "Bull Terrier"
];
dogBreeds.forEach((breed, i) => {
  categoriesHierarchy.push(
    createCategory(
      breed,
      breed.toLowerCase().replace(/ /g, "-"),
      "Dog",
      i,
      kopekler.id,
      2,
      [evcilHayvanlar.id, kopekler.id]
    )
  );
});

// Köpek Türleri (Dog Types)
const kopekTurleri = createCategory("Köpek Türleri", "kopek-turleri", "Dog", dogBreeds.length, kopekler.id, 2, [evcilHayvanlar.id, kopekler.id]);
categoriesHierarchy.push(kopekTurleri);

["Yavru", "Yetişkin", "Çiftleştirme", "Emekli Damızlık"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      `Köpek - ${type}`,
      `kopek-${type.toLowerCase().replace(/ /g, "-")}`,
      "Dog",
      i,
      kopekTurleri.id,
      3,
      [evcilHayvanlar.id, kopekler.id, kopekTurleri.id]
    )
  );
});

// Kediler (Cats)
const kediler = createCategory("Kediler", "kediler", "Cat", 1, evcilHayvanlar.id, 1, [evcilHayvanlar.id]);
categoriesHierarchy.push(kediler);

// Kedi Irkları (Cat Breeds) - Genişletilmiş liste
const catBreeds = [
  // Popüler Irklar
  "British Shorthair", "Scottish Fold", "Bengal", "Van Kedisi", 
  "Ankara Kedisi", "Maine Coon", "Persian", "Ragdoll", 
  "Exotic Shorthair", "Sphynx", "Siamese", "Russian Blue",
  "Abyssinian", "Birman", "American Shorthair", "Devon Rex",
  "Norwegian Forest", "Munchkin", "Bombay", "Chartreux",
  // Ek Popüler Irklar
  "Turkish Angora", "Himalayan", "Burmese", "Tonkinese",
  "Oriental Shorthair", "Cornish Rex", "Selkirk Rex", "Savannah",
  "Ocicat", "Singapura", "Korat", "Somali", "Japanese Bobtail",
  "Manx", "Egyptian Mau", "Balinese", "Siberian", "Snowshoe"
];
catBreeds.forEach((breed, i) => {
  categoriesHierarchy.push(
    createCategory(
      breed,
      breed.toLowerCase().replace(/ /g, "-"),
      "Cat",
      i,
      kediler.id,
      2,
      [evcilHayvanlar.id, kediler.id]
    )
  );
});

// Kedi Türleri
const kediTurleri = createCategory("Kedi Türleri", "kedi-turleri", "Cat", catBreeds.length, kediler.id, 2, [evcilHayvanlar.id, kediler.id]);
categoriesHierarchy.push(kediTurleri);

["Yavru", "Yetişkin", "Çiftleştirme", "Sahiplendirme"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      `Kedi - ${type}`,
      `kedi-${type.toLowerCase().replace(/ /g, "-")}`,
      "Cat",
      i,
      kediTurleri.id,
      3,
      [evcilHayvanlar.id, kediler.id, kediTurleri.id]
    )
  );
});

// ========== 2. Çiftlik Hayvanları (Farm Animals) ==========

// Büyükbaş Hayvanlar (Cattle)
const buyukbas = createCategory("Büyükbaş Hayvanlar", "buyukbas-hayvanlar", "Beef", 0, ciftlikHayvanlari.id, 1, [ciftlikHayvanlari.id]);
categoriesHierarchy.push(buyukbas);

const cattleTypes = [
  "İnek", "Boğa", "Dana", "Düve", "Tosun", 
  // Irklara Göre
  "Simental", "Holstein", "Montofon", "Jersey", "Angus",
  "Hereford", "Limousin", "Charolais", "Brahman", "Yerli Kara",
  "Boz Irk", "Şarole"
];
cattleTypes.forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase(),
      "Beef",
      i,
      buyukbas.id,
      2,
      [ciftlikHayvanlari.id, buyukbas.id]
    )
  );
});

// Küçükbaş Hayvanlar (Sheep & Goats)
const kucukbas = createCategory("Küçükbaş Hayvanlar", "kucukbas-hayvanlar", "Sheep", 1, ciftlikHayvanlari.id, 1, [ciftlikHayvanlari.id]);
categoriesHierarchy.push(kucukbas);

const smallLivestockTypes = [
  "Koyun", "Koç", "Keçi", "Oğlak", "Kurbanlık",
  // Koyun Irkları
  "Akkaraman", "Sakız", "İvesi", "Merinos", "Morkaraman",
  "Kıvırcık", "Karacabey Merinosu", "Dağlıç", "Tuj",
  // Keçi Irkları
  "Saanen", "Kıl Keçisi", "Ankara Keçisi", "Maltız", "Kilis"
];
smallLivestockTypes.forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase(),
      "Sheep",
      i,
      kucukbas.id,
      2,
      [ciftlikHayvanlari.id, kucukbas.id]
    )
  );
});

// Kümes Hayvanları (Poultry)
const kumes = createCategory("Kümes Hayvanları", "kumes-hayvanlari", "Egg", 3, ciftlikHayvanlari.id, 1, [ciftlikHayvanlari.id]);
categoriesHierarchy.push(kumes);

const poultryTypes = [
  "Tavuk", "Horoz", "Ördek", "Kaz", "Hindi", "Bıldırcın", "Güvercin",
  // Tavuk Irkları
  "Brahma", "Süs Tavuğu", "Yumurta Tavuğu", "Et Tavuğu", "Denizli Horozu",
  "Leghorn", "Rhode Island", "Sussex", "Australorp", "Wyandotte"
];
poultryTypes.forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      `ciftlik-${type.toLowerCase()}`,
      "Egg",
      i,
      kumes.id,
      2,
      [ciftlikHayvanlari.id, kumes.id]
    )
  );
});

// Deve, Lama & Alpaka
const develiler = createCategory("Deve, Lama & Alpaka", "deve-lama-alpaka", "Rabbit", 4, ciftlikHayvanlari.id, 1, [ciftlikHayvanlari.id]);
categoriesHierarchy.push(develiler);

["Deve", "Lama", "Alpaka"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase(),
      "Rabbit",
      i,
      develiler.id,
      2,
      [ciftlikHayvanlari.id, develiler.id]
    )
  );
});

// ========== 3. Yem, Mama ve Tarım Ürünleri ==========

// Evcil Hayvan Mamaları
const evcilMama = createCategory("Evcil Hayvan Maması", "evcil-hayvan-mamasi", "UtensilsCrossed", 0, yemMama.id, 1, [yemMama.id]);
categoriesHierarchy.push(evcilMama);

["Kedi Maması", "Köpek Maması", "Kuş Yemi", "Balık Yemi", "Kemirgen Yemi"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-"),
      "UtensilsCrossed",
      i,
      evcilMama.id,
      2,
      [yemMama.id, evcilMama.id]
    )
  );
});

// Çiftlik Hayvanı Yemleri
const ciftlikYemi = createCategory("Çiftlik Hayvanı Yemi", "ciftlik-hayvani-yemi", "Wheat", 1, yemMama.id, 1, [yemMama.id]);
categoriesHierarchy.push(ciftlikYemi);

["Süt Yemi", "Buzağı Yemi", "Besi Yemi", "Kuzu Yemi", "Keçi Yemi", "Tavuk Yemi", "Kanatlı Karışık Yem"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-"),
      "Wheat",
      i,
      ciftlikYemi.id,
      2,
      [yemMama.id, ciftlikYemi.id]
    )
  );
});

// Tarım Ürünleri
const tarimUrunleri = createCategory("Tarım Ürünleri", "tarim-urunleri", "Sprout", 2, yemMama.id, 1, [yemMama.id]);
categoriesHierarchy.push(tarimUrunleri);

["Buğday", "Arpa", "Yulaf", "Mısır", "Soya", "Yonca", "Fiğ", "Silajlık Mısır"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-"),
      "Sprout",
      i,
      tarimUrunleri.id,
      2,
      [yemMama.id, tarimUrunleri.id]
    )
  );
});

// ========== 4. Ekipmanlar ve Aksesuarlar ==========

const evcilEkipman = createCategory("Evcil Hayvan Ekipmanları", "evcil-hayvan-ekipmanlari", "Package", 0, ekipmanlar.id, 1, [ekipmanlar.id]);
categoriesHierarchy.push(evcilEkipman);

["Taşıma Çantası", "Mama Kabı", "Oyuncak", "Tırmalama Tahtası", "Tasma", "Kafes", "Tuvalet Kabı"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      `ekipman-${type.toLowerCase().replace(/ /g, "-")}`,
      "Package",
      i,
      evcilEkipman.id,
      2,
      [ekipmanlar.id, evcilEkipman.id]
    )
  );
});

const ciftlikEkipman = createCategory("Kümes & Çiftlik Ekipmanları", "kumes-ciftlik-ekipmanlari", "Wrench", 1, ekipmanlar.id, 1, [ekipmanlar.id]);
categoriesHierarchy.push(ciftlikEkipman);

["Yemlik", "Suluk", "Kafes", "Isıtma Lambası", "Havalandırma Sistemi", "Kuluçka Makinesi"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      `ciftlik-${type.toLowerCase().replace(/ /g, "-")}`,
      "Wrench",
      i,
      ciftlikEkipman.id,
      2,
      [ekipmanlar.id, ciftlikEkipman.id]
    )
  );
});

// ========== 5. Veterinerlik & Hizmetler ==========

const vetHizmetleri = createCategory("Veteriner Hizmetleri", "veteriner-hizmetleri", "Stethoscope", 0, veterinerlik.id, 1, [veterinerlik.id]);
categoriesHierarchy.push(vetHizmetleri);

["Klinik", "Evde Tedavi", "Aşılama", "Ultrason", "Röntgen", "Çiftlik Kontrolü"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-"),
      "Stethoscope",
      i,
      vetHizmetleri.id,
      2,
      [veterinerlik.id, vetHizmetleri.id]
    )
  );
});

const petKuafor = createCategory("Pet Kuaför / Bakım", "pet-kuafor-bakim", "Scissors", 1, veterinerlik.id, 1, [veterinerlik.id]);
categoriesHierarchy.push(petKuafor);

["Tüy Kesimi", "Banyo", "Diş Temizliği", "Tırnak Kesimi"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-"),
      "Scissors",
      i,
      petKuafor.id,
      2,
      [veterinerlik.id, petKuafor.id]
    )
  );
});

const nakliye = createCategory("Nakliye Hizmetleri", "nakliye-hizmetleri", "Truck", 2, veterinerlik.id, 1, [veterinerlik.id]);
categoriesHierarchy.push(nakliye);

["Evcil Hayvan Taşımacılığı", "Çiftlik Hayvanı Nakliyesi", "Uluslararası Taşıma"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-"),
      "Truck",
      i,
      nakliye.id,
      2,
      [veterinerlik.id, nakliye.id]
    )
  );
});

const egitim = createCategory("Eğitim & Danışmanlık", "egitim-danismanlik", "GraduationCap", 3, veterinerlik.id, 1, [veterinerlik.id]);
categoriesHierarchy.push(egitim);

["Köpek Eğitimi", "At Eğitimi", "Çiftlik Danışmanlığı"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-"),
      "GraduationCap",
      i,
      egitim.id,
      2,
      [veterinerlik.id, egitim.id]
    )
  );
});

// ========== 6. Kayıt & Belgeler ==========

["Küpe Belgesi", "Aşı Kartı", "Soy Kütüğü", "CITES Sertifikası", "Veteriner Sağlık Raporu", "Sahiplendirme Sözleşmesi", "Nakil İzin Belgesi", "İthalat/İhracat Evrakı"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-").replace(/\//g, "-"),
      "FileText",
      i,
      kayitBelgeler.id,
      1,
      [kayitBelgeler.id]
    )
  );
});

// ========== 7. Mağazalar ==========

const petshopMagazasi = createCategory("Petshop Mağazası", "petshop-magazasi", "Store", 0, magazalar.id, 1, [magazalar.id]);
categoriesHierarchy.push(petshopMagazasi);

["Kedi & Köpek Mağazası", "Akvaryum Mağazası", "Kuş Mağazası", "Kemirgen Mağazası", "Sürüngen Mağazası"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `petshop-${type.toLowerCase().replace(/ /g, "-").replace(/&/g, "")}`, "Store", i, petshopMagazasi.id, 2, [magazalar.id, petshopMagazasi.id])
  );
});

const yemMamaUretici = createCategory("Yem & Mama Üreticisi", "yem-mama-uretici", "Wheat", 1, magazalar.id, 1, [magazalar.id]);
categoriesHierarchy.push(yemMamaUretici);

["Köpek Maması Üreticisi", "Kedi Maması Üreticisi", "Çiftlik Hayvanı Yemi Üreticisi", "Kuş Yemi Üreticisi", "Balık Yemi Üreticisi"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `yem-${type.toLowerCase().replace(/ /g, "-")}`, "Wheat", i, yemMamaUretici.id, 2, [magazalar.id, yemMamaUretici.id])
  );
});

const ciftlikEkipmanSatici = createCategory("Çiftlik Ekipmanı Satıcısı", "ciftlik-ekipman-satici", "Tractor", 2, magazalar.id, 1, [magazalar.id]);
categoriesHierarchy.push(ciftlikEkipmanSatici);

["Kümes Ekipmanı", "Ahır Ekipmanı", "Sulama Sistemleri", "Hayvan Barınak Yapımı"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `magazalar-${type.toLowerCase().replace(/ /g, "-")}`, "Tractor", i, ciftlikEkipmanSatici.id, 2, [magazalar.id, ciftlikEkipmanSatici.id])
  );
});

const vetKlinik = createCategory("Veteriner Kliniği", "magazalar-vet-klinik", "Stethoscope", 3, magazalar.id, 1, [magazalar.id]);
categoriesHierarchy.push(vetKlinik);

["24 Saat Acil Klinik", "Uzman Veteriner Kliniği", "Mobil Veteriner", "Cerrahi Klinik"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `magazalar-vet-${type.toLowerCase().replace(/ /g, "-")}`, "Stethoscope", i, vetKlinik.id, 2, [magazalar.id, vetKlinik.id])
  );
});

const nakliyeLojistik = createCategory("Nakliye & Lojistik Firması", "nakliye-lojistik-firma", "Truck", 4, magazalar.id, 1, [magazalar.id]);
categoriesHierarchy.push(nakliyeLojistik);

["Pet Taşımacılık", "Çiftlik Hayvanı Nakliyesi", "Uluslararası Pet Kargo", "At Nakliyesi"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `magazalar-nakliye-${type.toLowerCase().replace(/ /g, "-")}`, "Truck", i, nakliyeLojistik.id, 2, [magazalar.id, nakliyeLojistik.id])
  );
});

const aricilikMalzeme = createCategory("Arıcılık Malzeme Mağazası", "aricilik-malzeme-magazasi", "Honeycomb", 5, magazalar.id, 1, [magazalar.id]);
categoriesHierarchy.push(aricilikMalzeme);

["Kovan Satıcısı", "Bal Süzme Ekipmanı", "Arıcılık Kıyafeti", "Bal Ambalaj Malzemesi"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `magazalar-aricilik-${type.toLowerCase().replace(/ /g, "-")}`, "Honeycomb", i, aricilikMalzeme.id, 2, [magazalar.id, aricilikMalzeme.id])
  );
});

const atBinicilikMagazasi = createCategory("At & Binicilik Mağazası", "at-binicilik-magazasi", "Horse", 6, magazalar.id, 1, [magazalar.id]);
categoriesHierarchy.push(atBinicilikMagazasi);

["Eyer Satıcısı", "At Maması Satıcısı", "Binicilik Kıyafeti", "At Bakım Ürünleri"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `magazalar-at-${type.toLowerCase().replace(/ /g, "-")}`, "Horse", i, atBinicilikMagazasi.id, 2, [magazalar.id, atBinicilikMagazasi.id])
  );
});

// ========== NEW MAIN CATEGORIES ==========

// ========== 3. Balıklar ve Su Ürünleri (Ana Kategori) ==========
const tatliSuBaliklari = createCategory("Tatlı Su Balıkları", "tatli-su-baliklari", "Fish", 0, baliklar.id, 1, [baliklar.id]);
categoriesHierarchy.push(tatliSuBaliklari);

const freshwaterFish = ["Sazan", "Turna", "Alabalık", "Yayın Balığı", "Gökkuşağı Alabalığı", "Levrek", "Tilapya", "Kadife Balığı"];
freshwaterFish.forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `tatli-${type.toLowerCase().replace(/ /g, "-")}`, "Fish", i, tatliSuBaliklari.id, 2, [baliklar.id, tatliSuBaliklari.id])
  );
});

const denizBaliklari = createCategory("Deniz Balıkları", "deniz-baliklari", "Fish", 1, baliklar.id, 1, [baliklar.id]);
categoriesHierarchy.push(denizBaliklari);

const saltwaterFish = ["Çipura", "Levrek", "Mercan", "Kefal", "Lüfer", "Barbun", "Mezgit", "Sardalye", "Hamsi"];
saltwaterFish.forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `deniz-${type.toLowerCase().replace(/ /g, "-")}`, "Fish", i, denizBaliklari.id, 2, [baliklar.id, denizBaliklari.id])
  );
});

const surunseli = createCategory("Kabuklu ve Yumuşakçalar", "kabuklu-yumusakcalar", "Fish", 2, baliklar.id, 1, [baliklar.id]);
categoriesHierarchy.push(surunseli);

["İstakoz", "Karides", "Kerevit", "İstiridye", "Midye", "Ahtapot"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, type.toLowerCase(), "Fish", i, surunseli.id, 2, [baliklar.id, surunseli.id])
  );
});

// ========== 4. Atlar ve Binicilik (Ana Kategori) ==========
const atIrklari = createCategory("At Irkları", "ana-at-irklari", "Horse", 0, atlar.id, 1, [atlar.id]);
categoriesHierarchy.push(atIrklari);

const horseBreeds = ["Arap Atı", "İngiliz Atı", "Akhal-Teke", "Thoroughbred", "Quarter Horse", "Appaloosa", "Friesian", "Andalusian", "Haflinger", "Clydesdale"];
horseBreeds.forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `ana-${type.toLowerCase().replace(/ /g, "-")}`, "Horse", i, atIrklari.id, 2, [atlar.id, atIrklari.id])
  );
});

const binicilikEkipmanlari = createCategory("Binicilik Ekipmanları", "ana-binicilik-ekipmanlari", "Package", 1, atlar.id, 1, [atlar.id]);
categoriesHierarchy.push(binicilikEkipmanlari);

["Eyer", "Koşum Takımı", "Dizgin", "Başlık", "Nal", "At Battaniyesi", "Binicilik Ayakkabısı", "Kask", "Kamçı", "Üzengi"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `ana-${type.toLowerCase().replace(/ /g, "-")}`, "Package", i, binicilikEkipmanlari.id, 2, [atlar.id, binicilikEkipmanlari.id])
  );
});

const atBakimi = createCategory("At Bakımı", "ana-at-bakimi", "Scissors", 2, atlar.id, 1, [atlar.id]);
categoriesHierarchy.push(atBakimi);

["Tımar Seti", "At Şampuanı", "Tırnak Makası", "At Vitamini", "Yara Bandı"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `ana-${type.toLowerCase().replace(/ /g, "-")}`, "Scissors", i, atBakimi.id, 2, [atlar.id, atBakimi.id])
  );
});

// ========== 5. Arıcılık (Ana Kategori) ==========
const ariIrklari = createCategory("Arı Irkları", "ari-irklari", "Honeycomb", 0, aricilik.id, 1, [aricilik.id]);
categoriesHierarchy.push(ariIrklari);

["Kafkas Arısı", "Anadolu Arısı", "İtalyan Arısı", "Karniyol Arısı", "Buckfast Arısı"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, type.toLowerCase().replace(/ /g, "-"), "Honeycomb", i, ariIrklari.id, 2, [aricilik.id, ariIrklari.id])
  );
});

const ariMalzemeleri = createCategory("Arıcılık Malzemeleri", "aricilik-malzemeleri", "Package", 1, aricilik.id, 1, [aricilik.id]);
categoriesHierarchy.push(ariMalzemeleri);

["Arı Kovanı", "Petek Çerçevesi", "Arı Süzgeci", "Bal Süzme Makinesi", "Arıcılık Tulumu", "Fumigator", "Kraliçe Kafesi", "Polen Tuzağı", "Bal Bidonu"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, type.toLowerCase().replace(/ /g, "-"), "Package", i, ariMalzemeleri.id, 2, [aricilik.id, ariMalzemeleri.id])
  );
});

const balUrunleri = createCategory("Bal ve Arı Ürünleri", "bal-ari-urunleri", "Package", 2, aricilik.id, 1, [aricilik.id]);
categoriesHierarchy.push(balUrunleri);

["Çiçek Balı", "Çam Balı", "Kestane Balı", "Polen", "Propolis", "Arı Sütü", "Bal Mumu", "Arı Ekmeği"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, type.toLowerCase().replace(/ /g, "-"), "Package", i, balUrunleri.id, 2, [aricilik.id, balUrunleri.id])
  );
});

// ========== 6. Kümes ve Süs Kuşları (Ana Kategori) ==========
const kumesHayvanlari = createCategory("Kümes Hayvanları", "ana-kumes-hayvanlari", "Egg", 0, kuslar.id, 1, [kuslar.id]);
categoriesHierarchy.push(kumesHayvanlari);

["Tavuk", "Horoz", "Hindi", "Ördek", "Kaz", "Bıldırcın", "Emu", "Devekuşu"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `ana-${type.toLowerCase()}`, "Egg", i, kumesHayvanlari.id, 2, [kuslar.id, kumesHayvanlari.id])
  );
});

const susKuslari = createCategory("Süs Kuşları", "ana-sus-kuslari", "Bird", 1, kuslar.id, 1, [kuslar.id]);
categoriesHierarchy.push(susKuslari);

["Muhabbet Kuşu", "Papağan", "Kanarya", "Cennet Papağanı", "Kakadu", "Jako", "Amazon Papağanı", "Ara Papağan", "Sultan Papağanı", "Güvercin", "Kumru"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `ana-${type.toLowerCase().replace(/ /g, "-")}`, "Bird", i, susKuslari.id, 2, [kuslar.id, susKuslari.id])
  );
});

// ========== 7. Sürüngenler ve Amfibiler (Ana Kategori) ==========
// NOT: Türkiye'de yasaklı/tehlikeli türler (yılanlar, zehirli hayvanlar vb.) kaldırıldı

const kaplumbagalar = createCategory("Kaplumbağalar", "ana-kaplumbagalar", "Turtle", 0, surungenler.id, 1, [surungenler.id]);
categoriesHierarchy.push(kaplumbagalar);

// Sadece yasal, evcil kaplumbağa türleri
["Kara Kaplumbağası", "Su Kaplumbağası", "Misk Kaplumbağası"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `ana-${type.toLowerCase().replace(/ /g, "-")}`, "Turtle", i, kaplumbagalar.id, 2, [surungenler.id, kaplumbagalar.id])
  );
});

const kertenkeleler = createCategory("Kertenkeleler", "ana-kertenkeleler", "Bug", 1, surungenler.id, 1, [surungenler.id]);
categoriesHierarchy.push(kertenkeleler);

// Sadece yasal evcil türler (İguana, Tegu gibi büyük/egzotik türler kaldırıldı)
["Geko", "Leopar Gekko", "Bearded Dragon"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `ana-${type.toLowerCase().replace(/ /g, "-")}`, "Bug", i, kertenkeleler.id, 2, [surungenler.id, kertenkeleler.id])
  );
});

const amfibiAna = createCategory("Amfibiler", "ana-amfibi", "Fish", 2, surungenler.id, 1, [surungenler.id]);
categoriesHierarchy.push(amfibiAna);

// Zehirli ve egzotik türler kaldırıldı
["Aksolotl", "Semender"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `ana-${type.toLowerCase().replace(/ /g, "-")}`, "Fish", i, amfibiAna.id, 2, [surungenler.id, amfibiAna.id])
  );
});

// ========== 8. Kemirgenler ve Küçük Hayvanlar (Ana Kategori) ==========
const hamsterlar = createCategory("Hamsterlar", "ana-hamsterlar", "Rabbit", 0, kemirgenler.id, 1, [kemirgenler.id]);
categoriesHierarchy.push(hamsterlar);

["Syrian Hamster", "Dwarf Hamster", "Roborovski", "Campbell", "Winter White"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `ana-${type.toLowerCase().replace(/ /g, "-")}`, "Rabbit", i, hamsterlar.id, 2, [kemirgenler.id, hamsterlar.id])
  );
});

const tavsan = createCategory("Tavşanlar", "ana-tavsanlar", "Rabbit", 1, kemirgenler.id, 1, [kemirgenler.id]);
categoriesHierarchy.push(tavsan);

["Lop Tavşan", "Rex Tavşan", "Angora Tavşan", "Hollanda Tavşanı", "Himalaya Tavşanı", "Cüce Tavşan", "New Zealand Tavşanı"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `ana-${type.toLowerCase().replace(/ /g, "-")}`, "Rabbit", i, tavsan.id, 2, [kemirgenler.id, tavsan.id])
  );
});

const diger = createCategory("Diğer Kemirgenler", "ana-diger-kemirgenler", "Rabbit", 2, kemirgenler.id, 1, [kemirgenler.id]);
categoriesHierarchy.push(diger);

["Ginepig", "Çinçilla", "Gerbil", "Fare", "Sincap", "Huron", "Degu"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `ana-${type.toLowerCase().replace(/ /g, "-")}`, "Rabbit", i, diger.id, 2, [kemirgenler.id, diger.id])
  );
});

// ========== 14. Tarım & Kırsal Emlak ==========
const ciftlikSatisi = createCategory("Çiftlik Satışı", "ciftlik-satisi", "Home", 0, tarimEmlak.id, 1, [tarimEmlak.id]);
const tarimArazisi = createCategory("Tarım Arazisi", "tarim-arazisi", "MapPin", 1, tarimEmlak.id, 1, [tarimEmlak.id]);
const kirsalKonut = createCategory("Kırsal Konut & Arazi", "kirsal-konut-arazi", "House", 2, tarimEmlak.id, 1, [tarimEmlak.id]);
const yatirimArazi = createCategory("Yatırım Amaçlı Arazi", "yatirim-amacli-arazi", "TrendingUp", 3, tarimEmlak.id, 1, [tarimEmlak.id]);
const tesisliEmlak = createCategory("Özel Tesisli Emlak", "ozel-tesisli-emlak", "Building2", 4, tarimEmlak.id, 1, [tarimEmlak.id]);
categoriesHierarchy.push(ciftlikSatisi, tarimArazisi, kirsalKonut, yatirimArazi, tesisliEmlak);

["Büyükbaş Çiftliği", "Küçükbaş Çiftliği", "Kümes Çiftliği", "At & Binicilik Tesisi", "Balık Çiftliği / Havuz", "Arıcılık Tesisi"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/[& /]/g, "-"), "Home", i, ciftlikSatisi.id, 2, [tarimEmlak.id, ciftlikSatisi.id]));
});
["Sulu Tarla", "Susuz Tarla", "Bağ & Bahçe", "Meyve Bahçesi", "Yayla Arazisi"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/[& /]/g, "-"), "MapPin", i, tarimArazisi.id, 2, [tarimEmlak.id, tarimArazisi.id]));
});
["Bağ Evi", "Dağ Evi", "Köy Evi", "Yayla Evi", "Prefabrik Ev + Arazi"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/[& +/]/g, "-"), "House", i, kirsalKonut.id, 2, [tarimEmlak.id, kirsalKonut.id]));
});
["Hayvancılık Bölgesi Arazi", "Çiftlik Kurulumuna Uygun Arazi", "Tarımsal Yatırım Parseli"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/ /g, "-"), "TrendingUp", i, yatirimArazi.id, 2, [tarimEmlak.id, yatirimArazi.id]));
});
["Sera Arazisi + Sistemli", "Ahır + Samanlık Arsa", "İçinde Kesim Tesisi Olan", "İçinde Sağım Merkezi Olan"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/[+ /]/g, "-"), "Building", i, tesisliEmlak.id, 2, [tarimEmlak.id, tesisliEmlak.id]));
});

// ========== 15. Araçlar & Nakliye ==========
const traktorler = createCategory("Traktörler", "traktorler", "Tractor", 0, araclarNakliye.id, 1, [araclarNakliye.id]);
const hayvanTasima = createCategory("Hayvan Taşıma Araçları", "hayvan-tasima-araclari", "Truck", 1, araclarNakliye.id, 1, [araclarNakliye.id]);
const tarimRomork = createCategory("Tarım Römorkları", "tarim-romorklari", "Container", 2, araclarNakliye.id, 1, [araclarNakliye.id]);
const sutNakliye = createCategory("Süt Toplama & Nakliye", "sut-toplama-nakliye", "Milk", 3, araclarNakliye.id, 1, [araclarNakliye.id]);
const tarimIsMakine = createCategory("Tarım İş Makineleri", "tarim-is-makineleri", "Settings", 4, araclarNakliye.id, 1, [araclarNakliye.id]);
categoriesHierarchy.push(traktorler, hayvanTasima, tarimRomork, sutNakliye, tarimIsMakine);

["Büyük Traktör", "Küçük Traktör", "Bahçe Traktörü"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/ /g, "-"), "Tractor", i, traktorler.id, 2, [araclarNakliye.id, traktorler.id]));
});
["Hayvan Taşıma Kamyonet", "Hayvan Taşıma Kamyon", "Hayvan Taşıma TIR"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/ /g, "-"), "Truck", i, hayvanTasima.id, 2, [araclarNakliye.id, hayvanTasima.id]));
});
["Yem Römorkları", "Gübre Römorkları", "Saman Römorkları"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/ /g, "-"), "Container", i, tarimRomork.id, 2, [araclarNakliye.id, tarimRomork.id]));
});
["Süt Toplama Araçları", "Soğutmalı Nakliye Araçları"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/ /g, "-"), "Milk", i, sutNakliye.id, 2, [araclarNakliye.id, sutNakliye.id]));
});
["Silaj Makinesi", "Biçme Makinesi", "Yem Karma Makinesi", "Kümes Yıkama / Dezenfekte Aracı"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/[/ ]/g, "-"), "Settings", i, tarimIsMakine.id, 2, [araclarNakliye.id, tarimIsMakine.id]));
});

// ========== 16. Üretim & İşleme Tesisleri ==========
const sutIsleme = createCategory("Süt İşleme Tesisleri", "sut-isleme-tesisleri", "Factory", 0, uretimTesisleri.id, 1, [uretimTesisleri.id]);
const etIsleme = createCategory("Et İşleme Tesisleri", "et-isleme-tesisleri", "Factory", 1, uretimTesisleri.id, 1, [uretimTesisleri.id]);
const aricilikUretim = createCategory("Arıcılık Üretim Tesisleri", "aricilik-uretim-tesisleri", "Honeycomb", 2, uretimTesisleri.id, 1, [uretimTesisleri.id]);
const yumurtaUretim = createCategory("Yumurta İşleme Tesisleri", "yumurta-isleme-tesisleri", "Egg", 3, uretimTesisleri.id, 1, [uretimTesisleri.id]);
categoriesHierarchy.push(sutIsleme, etIsleme, aricilikUretim, yumurtaUretim);

["Süt İşleme Tesisi", "Peynir & Yoğurt Üretim Tesisi", "Süt Toplama Merkezi", "Süt Pastörizasyon Makinesi"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/[& /]/g, "-"), "Factory", i, sutIsleme.id, 2, [uretimTesisleri.id, sutIsleme.id]));
});
["Kesimhane", "Et Üretim Tesisi"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/ /g, "-"), "Factory", i, etIsleme.id, 2, [uretimTesisleri.id, etIsleme.id]));
});
["Arıcılık Dolum Tesisi", "Bal Paketleme"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/ /g, "-"), "Honeycomb", i, aricilikUretim.id, 2, [uretimTesisleri.id, aricilikUretim.id]));
});
categoriesHierarchy.push(createCategory("Yumurta Paketleme Bandı", "yumurta-paketleme-bandi", "Egg", 0, yumurtaUretim.id, 2, [uretimTesisleri.id, yumurtaUretim.id]));

// ========== 17. İnşaat & Yapı ==========
const ahirYapimi = createCategory("Ahır Yapımı", "ahir-yapimi", "Warehouse", 0, insaatYapi.id, 1, [insaatYapi.id]);
const kumesYapimi = createCategory("Kümes Yapımı", "kumes-yapimi", "Building", 1, insaatYapi.id, 1, [insaatYapi.id]);
const siloKurulumu = createCategory("Silo Kurulumu", "silo-kurulumu", "Container", 2, insaatYapi.id, 1, [insaatYapi.id]);
const citSistemleri = createCategory("Çit ve Tel Sistemleri", "cit-tel-sistemleri", "Grid", 3, insaatYapi.id, 1, [insaatYapi.id]);
const gubreSistemleri = createCategory("Gübre Sistemi / EKBAN", "gubre-sistemi-ekban", "Recycle", 4, insaatYapi.id, 1, [insaatYapi.id]);
const kantarMontaj = createCategory("Hayvan Tartı Kantarı Montaj", "hayvan-tarti-kantari-montaj", "Scale", 5, insaatYapi.id, 1, [insaatYapi.id]);
categoriesHierarchy.push(ahirYapimi, kumesYapimi, siloKurulumu, citSistemleri, gubreSistemleri, kantarMontaj);

["Prefabrik Ahır", "Çelik Ahır", "Beton Ahır"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/ /g, "-"), "Warehouse", i, ahirYapimi.id, 2, [insaatYapi.id, ahirYapimi.id]));
});
["Etlik Kümes Tesisi", "Yumurtacı Kümes Tesisi"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/ /g, "-"), "Building", i, kumesYapimi.id, 2, [insaatYapi.id, kumesYapimi.id]));
});
["Yem Silosu", "Tahıl Silosu"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/ /g, "-"), "Container", i, siloKurulumu.id, 2, [insaatYapi.id, siloKurulumu.id]));
});

// ========== Ekipmanlar Altında: Tarım & Çiftlik Makineleri ==========
const tarimCiftlikMakine = createCategory("Tarım & Çiftlik Makineleri", "tarim-ciftlik-makineleri", "Settings", 10, ekipmanlar.id, 1, [ekipmanlar.id]);
categoriesHierarchy.push(tarimCiftlikMakine);
["Sağım Makineleri", "Süt Tankı / Süt Soğutucu", "Gübre Sıyırma Sistemleri", "Yem Ezme / Kırma Makinesi", "Kuluçka Makinesi", "Yemleme Bandı", "Yumurtlama Kafes Sistemi"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/[/ ]/g, "-"), "Settings", i, tarimCiftlikMakine.id, 2, [ekipmanlar.id, tarimCiftlikMakine.id]));
});

// ========== Veterinerlik Altında: Danışmanlık, Uzman Çağır, Laboratuvar ==========
const danismanlik = createCategory("Danışmanlık Hizmetleri", "danismanlik-hizmetleri", "Users", 10, veterinerlik.id, 1, [veterinerlik.id]);
const uzmanCagir = createCategory("Uzman Çağır", "uzman-cagir", "Phone", 11, veterinerlik.id, 1, [veterinerlik.id]);
const laboratuvarSaglik = createCategory("Laboratuvar & Sağlık", "laboratuvar-saglik", "Microscope", 12, veterinerlik.id, 1, [veterinerlik.id]);
categoriesHierarchy.push(danismanlik, uzmanCagir, laboratuvarSaglik);

["Çiftlik Kurulum Danışmanlığı", "Yem Formül Danışmanlığı", "Hayvan Alım Danışmanlığı", "Süt Üretimi Optimizasyonu"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/ /g, "-"), "Users", i, danismanlik.id, 2, [veterinerlik.id, danismanlik.id]));
});
["Veteriner Çağır", "Nalbant Çağır", "Sürü Yönetimi Eğitmeni", "Süt Sağım Teknisyeni"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/ /g, "-"), "Phone", i, uzmanCagir.id, 2, [veterinerlik.id, uzmanCagir.id]));
});
["Süt Analiz Cihazları", "Hayvan Sağlığı Test Cihazları", "Veteriner Laboratuvarı Kurulumu", "Mikroskop", "Aşı Depolama Dolapları"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/ /g, "-"), "Microscope", i, laboratuvarSaglik.id, 2, [veterinerlik.id, laboratuvarSaglik.id]));
});

// ========== Mağazalar Altında: Yeni Mağaza Tipleri ==========
["Yem Mağazaları", "Süt Ekipmanları Satıcıları", "Kuluçka & Kümes Sistemleri Satıcıları", "At & Binicilik Mağazası", "Arıcılık Mağazası", "Çiftlik Makine Bayileri", "Tarım Makine Bayileri", "İnşaat / Ahır Kurulum Firmaları"].forEach((type, i) => {
  categoriesHierarchy.push(createCategory(type, type.toLowerCase().replace(/[& /]/g, "-"), "Store", 10 + i, magazalar.id, 1, [magazalar.id]));
});

console.log(`Generated ${categoriesHierarchy.length} categories`);
