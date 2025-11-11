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
const yemMama = createCategory("Yem, Mama ve Tarım Ürünleri", "yem-mama-tarim", "Wheat", 2);
const ekipmanlar = createCategory("Ekipmanlar ve Aksesuarlar", "ekipmanlar-aksesuarlar", "ShoppingBag", 3);
const veterinerlik = createCategory("Veterinerlik & Hizmetler", "veterinerlik-hizmetler", "Stethoscope", 4);
const kayitBelgeler = createCategory("Kayıt & Belgeler", "kayit-belgeler", "FileText", 5);
const magazalar = createCategory("Mağazalar", "magazalar", "Store", 6);

categoriesHierarchy.push(
  evcilHayvanlar,
  ciftlikHayvanlari,
  yemMama,
  ekipmanlar,
  veterinerlik,
  kayitBelgeler,
  magazalar
);

// ========== 1. Evcil Hayvanlar (Pet Animals) ==========

// Köpekler (Dogs)
const kopekler = createCategory("Köpekler", "kopekler", "Dog", 0, evcilHayvanlar.id, 1, [evcilHayvanlar.id]);
categoriesHierarchy.push(kopekler);

// Köpek Irkları (Dog Breeds)
const dogBreeds = [
  "Golden Retriever", "German Shepherd", "Rottweiler", "Pomeranian", 
  "Labrador", "Husky", "Doberman", "Pug", "Terrier", "Cane Corso", 
  "Maltese", "Chihuahua", "Beagle", "Kangal", "Akita", "Shiba Inu"
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

// Kedi Irkları (Cat Breeds)
const catBreeds = [
  "British Shorthair", "Scottish Fold", "Bengal", "Van Kedisi", 
  "Ankara Kedisi", "Maine Coon", "Persian", "Ragdoll", 
  "Exotic Shorthair", "Sphynx"
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

// Kuşlar (Birds)
const kuslar = createCategory("Kuşlar", "kuslar", "Bird", 2, evcilHayvanlar.id, 1, [evcilHayvanlar.id]);
categoriesHierarchy.push(kuslar);

const birdTypes = [
  "Muhabbet Kuşu", "Papağan", "Kanarya", "Sultan Papağanı", 
  "Cennet Papağanı", "Jako", "Amazon Papağanı", "Güvercin", 
  "Kumru", "Saka", "İspinoz"
];
birdTypes.forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-"),
      "Bird",
      i,
      kuslar.id,
      2,
      [evcilHayvanlar.id, kuslar.id]
    )
  );
});

// Kuş Ekipmanları
const kusEkipmanlari = createCategory("Kuş Ekipmanları", "kus-ekipmanlari", "Package", birdTypes.length, kuslar.id, 2, [evcilHayvanlar.id, kuslar.id]);
categoriesHierarchy.push(kusEkipmanlari);

["Kafes", "Yemlik", "Oyuncak", "Üreme Kutusu"].forEach((eq, i) => {
  categoriesHierarchy.push(
    createCategory(
      eq,
      eq.toLowerCase().replace(/ /g, "-"),
      "Package",
      i,
      kusEkipmanlari.id,
      3,
      [evcilHayvanlar.id, kuslar.id, kusEkipmanlari.id]
    )
  );
});

// Balıklar (Fish / Aquarium)
const baliklar = createCategory("Akvaryum", "akvaryum", "Fish", 3, evcilHayvanlar.id, 1, [evcilHayvanlar.id]);
categoriesHierarchy.push(baliklar);

const fishTypes = [
  "Akvaryum Balıkları", "Japon Balığı", "Betta", "Koi", "Discus", 
  "Lepistes", "Tetra", "Ciklet", "Melek Balığı"
];
fishTypes.forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-"),
      "Fish",
      i,
      baliklar.id,
      2,
      [evcilHayvanlar.id, baliklar.id]
    )
  );
});

// Akvaryum Ekipmanları
const akvaryumEkipmanlari = createCategory("Akvaryum Ekipmanları", "akvaryum-ekipmanlari", "Package", fishTypes.length, baliklar.id, 2, [evcilHayvanlar.id, baliklar.id]);
categoriesHierarchy.push(akvaryumEkipmanlari);

["Akvaryum", "Filtre", "Isıtıcı", "Dekor", "Yem"].forEach((eq, i) => {
  categoriesHierarchy.push(
    createCategory(
      eq,
      `akvaryum-${eq.toLowerCase().replace(/ /g, "-")}`,
      "Package",
      i,
      akvaryumEkipmanlari.id,
      3,
      [evcilHayvanlar.id, baliklar.id, akvaryumEkipmanlari.id]
    )
  );
});

// Kemirgenler (Rodents)
const kemirgenler = createCategory("Kemirgenler", "kemirgenler", "Rabbit", 4, evcilHayvanlar.id, 1, [evcilHayvanlar.id]);
categoriesHierarchy.push(kemirgenler);

const rodentTypes = ["Hamster", "Ginepig", "Tavşan", "Sincap", "Fare", "Gerbil", "Çinçilla"];
rodentTypes.forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-"),
      "Rabbit",
      i,
      kemirgenler.id,
      2,
      [evcilHayvanlar.id, kemirgenler.id]
    )
  );
});

// Sürüngenler (Reptiles)
const surungenler = createCategory("Sürüngenler", "surungenler", "Bug", 5, evcilHayvanlar.id, 1, [evcilHayvanlar.id]);
categoriesHierarchy.push(surungenler);

const reptileTypes = ["Yılan", "Bukalemun", "Geko", "İguana", "Kaplumbağa", "Ejder"];
reptileTypes.forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-"),
      "Bug",
      i,
      surungenler.id,
      2,
      [evcilHayvanlar.id, surungenler.id]
    )
  );
});

// Amfibiler (Amphibians)
const amfibiler = createCategory("Amfibiler", "amfibiler", "Fish", 6, evcilHayvanlar.id, 1, [evcilHayvanlar.id]);
categoriesHierarchy.push(amfibiler);

["Kurbağa", "Aksolotl", "Semender"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase(),
      "Fish",
      i,
      amfibiler.id,
      2,
      [evcilHayvanlar.id, amfibiler.id]
    )
  );
});

// Egzotik Hayvanlar (Exotic Animals)
const egzotikHayvanlar = createCategory("Egzotik Hayvanlar", "egzotik-hayvanlar", "Sparkles", 7, evcilHayvanlar.id, 1, [evcilHayvanlar.id]);
categoriesHierarchy.push(egzotikHayvanlar);

const exoticTypes = ["Kirpi", "Rakun", "Tilki", "Lemur", "Maymun", "Kakadu", "Marmoset", "Sülün", "Koati"];
exoticTypes.forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase(),
      "Sparkles",
      i,
      egzotikHayvanlar.id,
      2,
      [evcilHayvanlar.id, egzotikHayvanlar.id]
    )
  );
});

// ========== 2. Çiftlik Hayvanları (Farm Animals) ==========

// Büyükbaş Hayvanlar (Cattle)
const buyukbas = createCategory("Büyükbaş Hayvanlar", "buyukbas-hayvanlar", "Beef", 0, ciftlikHayvanlari.id, 1, [ciftlikHayvanlari.id]);
categoriesHierarchy.push(buyukbas);

const cattleTypes = ["İnek", "Boğa", "Dana", "Düve", "Tosun", "Simental", "Holstein", "Montofon", "Jersey"];
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

const smallLivestockTypes = ["Koyun", "Koç", "Keçi", "Oğlak", "Kurbanlık"];
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

// At & Binicilik (Horses)
const atlar = createCategory("Atlar", "atlar", "Horse", 2, ciftlikHayvanlari.id, 1, [ciftlikHayvanlari.id]);
categoriesHierarchy.push(atlar);

const horseTypes = ["Arap Atı", "İngiliz Atı", "Midilli", "Pony"];
horseTypes.forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-"),
      "Horse",
      i,
      atlar.id,
      2,
      [ciftlikHayvanlari.id, atlar.id]
    )
  );
});

// Kümes Hayvanları (Poultry)
const kumes = createCategory("Kümes Hayvanları", "kumes-hayvanlari", "Egg", 3, ciftlikHayvanlari.id, 1, [ciftlikHayvanlari.id]);
categoriesHierarchy.push(kumes);

const poultryTypes = ["Tavuk", "Horoz", "Ördek", "Kaz", "Hindi", "Bıldırcın", "Sülün", "Keklik", "Güvercin"];
poultryTypes.forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase(),
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

// Arıcılık (Beekeeping)
const aricilik = createCategory("Arıcılık", "aricilik", "Honeycomb", 5, ciftlikHayvanlari.id, 1, [ciftlikHayvanlari.id]);
categoriesHierarchy.push(aricilik);

["Arı Kolonisi", "Ana Arı", "Oğul", "Arıcılık Ekipmanları"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-"),
      "Honeycomb",
      i,
      aricilik.id,
      2,
      [ciftlikHayvanlari.id, aricilik.id]
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
      type.toLowerCase().replace(/ /g, "-"),
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
      type.toLowerCase().replace(/ /g, "-"),
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

["Petshop Mağazası", "Yem & Mama Üreticisi", "Çiftlik Ekipmanı Satıcısı", "Veteriner Kliniği", "Nakliye & Lojistik Firması"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-").replace(/&/g, ""),
      "Store",
      i,
      magazalar.id,
      1,
      [magazalar.id]
    )
  );
});

console.log(`Generated ${categoriesHierarchy.length} categories`);
