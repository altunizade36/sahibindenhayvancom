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
const egzotikHayvanlar = createCategory("Egzotik Hayvanlar", "egzotik-hayvanlar", "Sparkles", 8);
const yemMama = createCategory("Yem, Mama ve Tarım Ürünleri", "yem-mama-tarim", "Wheat", 9);
const ekipmanlar = createCategory("Ekipmanlar ve Aksesuarlar", "ekipmanlar-aksesuarlar", "ShoppingBag", 10);
const veterinerlik = createCategory("Veterinerlik & Hizmetler", "veterinerlik-hizmetler", "Stethoscope", 11);
const kayitBelgeler = createCategory("Kayıt & Belgeler", "kayit-belgeler", "FileText", 12);
const magazalar = createCategory("Mağazalar", "magazalar", "Store", 13);

categoriesHierarchy.push(
  evcilHayvanlar,
  ciftlikHayvanlari,
  baliklar,
  atlar,
  aricilik,
  kuslar,
  surungenler,
  kemirgenler,
  egzotikHayvanlar,
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
  "Maltese", "Chihuahua", "Beagle", "Kangal", "Akita", "Shiba Inu",
  "Bulldog", "French Bulldog", "Yorkshire Terrier", "Poodle",
  "Border Collie", "Cavalier King Charles", "Corgi", "Boxer",
  "Samoyed", "Cocker Spaniel", "Dachshund", "Jack Russell",
  "Akbaş", "Malaklı", "Sivas Kangalı", "Kars Köpeği"
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
  "Exotic Shorthair", "Sphynx", "Siamese", "Russian Blue",
  "Abyssinian", "Birman", "American Shorthair", "Devon Rex",
  "Norwegian Forest", "Munchkin", "Bombay", "Chartreux"
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

// Kuşlar (Birds) - Evcil kategorisi altında
const evcilKuslar = createCategory("Kuşlar", "evcil-kuslar", "Bird", 2, evcilHayvanlar.id, 1, [evcilHayvanlar.id]);
categoriesHierarchy.push(evcilKuslar);

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
      evcilKuslar.id,
      2,
      [evcilHayvanlar.id, evcilKuslar.id]
    )
  );
});

// Kuş Ekipmanları
const evcilKusEkipmanlari = createCategory("Kuş Ekipmanları", "evcil-kus-ekipmanlari", "Package", birdTypes.length, evcilKuslar.id, 2, [evcilHayvanlar.id, evcilKuslar.id]);
categoriesHierarchy.push(evcilKusEkipmanlari);

["Kafes", "Yemlik", "Oyuncak", "Üreme Kutusu"].forEach((eq, i) => {
  categoriesHierarchy.push(
    createCategory(
      eq,
      `kus-${eq.toLowerCase().replace(/ /g, "-")}`,
      "Package",
      i,
      evcilKusEkipmanlari.id,
      3,
      [evcilHayvanlar.id, evcilKuslar.id, evcilKusEkipmanlari.id]
    )
  );
});

// Balıklar (Fish / Aquarium) - Evcil kategorisi altında
const evcilBaliklar = createCategory("Akvaryum", "evcil-akvaryum", "Fish", 3, evcilHayvanlar.id, 1, [evcilHayvanlar.id]);
categoriesHierarchy.push(evcilBaliklar);

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
      evcilBaliklar.id,
      2,
      [evcilHayvanlar.id, evcilBaliklar.id]
    )
  );
});

// Akvaryum Ekipmanları
const evcilAkvaryumEkipmanlari = createCategory("Akvaryum Ekipmanları", "evcil-akvaryum-ekipmanlari", "Package", fishTypes.length, evcilBaliklar.id, 2, [evcilHayvanlar.id, evcilBaliklar.id]);
categoriesHierarchy.push(evcilAkvaryumEkipmanlari);

["Akvaryum", "Filtre", "Isıtıcı", "Dekor", "Yem"].forEach((eq, i) => {
  categoriesHierarchy.push(
    createCategory(
      eq,
      `akvaryum-${eq.toLowerCase().replace(/ /g, "-")}`,
      "Package",
      i,
      evcilAkvaryumEkipmanlari.id,
      3,
      [evcilHayvanlar.id, evcilBaliklar.id, evcilAkvaryumEkipmanlari.id]
    )
  );
});

// Kemirgenler (Rodents) - Evcil kategorisi altında
const evcilKemirgenler = createCategory("Kemirgenler", "evcil-kemirgenler", "Rabbit", 4, evcilHayvanlar.id, 1, [evcilHayvanlar.id]);
categoriesHierarchy.push(evcilKemirgenler);

const rodentTypes = ["Hamster", "Ginepig", "Tavşan", "Sincap", "Fare", "Gerbil", "Çinçilla"];
rodentTypes.forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-"),
      "Rabbit",
      i,
      evcilKemirgenler.id,
      2,
      [evcilHayvanlar.id, evcilKemirgenler.id]
    )
  );
});

// Sürüngenler (Reptiles) - Evcil kategorisi altında
const evcilSurungenler = createCategory("Sürüngenler", "evcil-surungenler", "Bug", 5, evcilHayvanlar.id, 1, [evcilHayvanlar.id]);
categoriesHierarchy.push(evcilSurungenler);

const reptileTypes = ["Yılan", "Bukalemun", "Geko", "İguana", "Kaplumbağa", "Ejder"];
reptileTypes.forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-"),
      "Bug",
      i,
      evcilSurungenler.id,
      2,
      [evcilHayvanlar.id, evcilSurungenler.id]
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

// Egzotik Hayvanlar (Exotic Animals) - Evcil kategorisi altında
const evcilEgzotikHayvanlar = createCategory("Egzotik Hayvanlar", "evcil-egzotik-hayvanlar", "Sparkles", 7, evcilHayvanlar.id, 1, [evcilHayvanlar.id]);
categoriesHierarchy.push(evcilEgzotikHayvanlar);

const exoticTypes = ["Kirpi", "Rakun", "Tilki", "Lemur", "Maymun", "Marmoset", "Koati"];
exoticTypes.forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      `evcil-${type.toLowerCase()}`,
      "Sparkles",
      i,
      evcilEgzotikHayvanlar.id,
      2,
      [evcilHayvanlar.id, evcilEgzotikHayvanlar.id]
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

// At & Binicilik (Horses) - Çiftlik hayvanları altında
const ciftlikAtlari = createCategory("Atlar", "ciftlik-atlari", "Horse", 2, ciftlikHayvanlari.id, 1, [ciftlikHayvanlari.id]);
categoriesHierarchy.push(ciftlikAtlari);

const horseTypes = ["Arap Atı", "İngiliz Atı", "Midilli", "Pony"];
horseTypes.forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-"),
      "Horse",
      i,
      ciftlikAtlari.id,
      2,
      [ciftlikHayvanlari.id, ciftlikAtlari.id]
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

// Arıcılık (Beekeeping) - Çiftlik hayvanları altında
const ciftlikAricilik = createCategory("Arıcılık", "ciftlik-aricilik", "Honeycomb", 5, ciftlikHayvanlari.id, 1, [ciftlikHayvanlari.id]);
categoriesHierarchy.push(ciftlikAricilik);

["Arı Kolonisi", "Ana Arı", "Oğul", "Arıcılık Ekipmanları"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(
      type,
      type.toLowerCase().replace(/ /g, "-"),
      "Honeycomb",
      i,
      ciftlikAricilik.id,
      2,
      [ciftlikHayvanlari.id, ciftlikAricilik.id]
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

["Tavuk", "Horoz", "Hindi", "Ördek", "Kaz", "Bıldırcın", "Sülün", "Keklik", "Emu", "Devekuşu"].forEach((type, i) => {
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
const yilanlar = createCategory("Yılanlar", "ana-yilanlar", "Bug", 0, surungenler.id, 1, [surungenler.id]);
categoriesHierarchy.push(yilanlar);

["Python", "Boa", "Mısır Yılanı", "Kral Yılanı", "Anaconda", "Boa Constrictor"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `ana-${type.toLowerCase().replace(/ /g, "-")}`, "Bug", i, yilanlar.id, 2, [surungenler.id, yilanlar.id])
  );
});

const kaplumbagalar = createCategory("Kaplumbağalar", "ana-kaplumbagalar", "Turtle", 1, surungenler.id, 1, [surungenler.id]);
categoriesHierarchy.push(kaplumbagalar);

["Kara Kaplumbağası", "Su Kaplumbağası", "Hermann Kaplumbağası", "İbrikçi Kaplumbağası", "Rus Kaplumbağası", "Leopar Kaplumbağası"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `ana-${type.toLowerCase().replace(/ /g, "-")}`, "Turtle", i, kaplumbagalar.id, 2, [surungenler.id, kaplumbagalar.id])
  );
});

const kertenkeleler = createCategory("Kertenkeleler", "ana-kertenkeleler", "Bug", 2, surungenler.id, 1, [surungenler.id]);
categoriesHierarchy.push(kertenkeleler);

["İguana", "Geko", "Bukalemun", "Kertenkele", "Bearded Dragon", "Tegu", "Skink", "Ejder Kertenkele"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `ana-${type.toLowerCase().replace(/ /g, "-")}`, "Bug", i, kertenkeleler.id, 2, [surungenler.id, kertenkeleler.id])
  );
});

const amfibiAna = createCategory("Amfibiler", "ana-amfibi", "Fish", 3, surungenler.id, 1, [surungenler.id]);
categoriesHierarchy.push(amfibiAna);

["Kurbağa", "Aksolotl", "Semender", "Triton", "Ağaç Kurbağası", "Zehirli Ok Kurbağası"].forEach((type, i) => {
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

["Ginepig", "Çinçilla", "Gerbil", "Fare", "Sincap", "Huron", "Degu", "Prairie Dog"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `ana-${type.toLowerCase().replace(/ /g, "-")}`, "Rabbit", i, diger.id, 2, [kemirgenler.id, diger.id])
  );
});

// ========== 9. Egzotik Hayvanlar (Ana Kategori) ==========
const egzotikMemeli = createCategory("Egzotik Memeliler", "ana-egzotik-memeliler", "Sparkles", 0, egzotikHayvanlar.id, 1, [egzotikHayvanlar.id]);
categoriesHierarchy.push(egzotikMemeli);

["Kirpi", "Rakun", "Tilki", "Lemur", "Marmoset", "Koati", "Kinkajou", "Kapibara", "Şinşilla"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `ana-${type.toLowerCase().replace(/ /g, "-")}`, "Sparkles", i, egzotikMemeli.id, 2, [egzotikHayvanlar.id, egzotikMemeli.id])
  );
});

const egzotikKus = createCategory("Egzotik Kuşlar", "ana-egzotik-kuslar", "Bird", 1, egzotikHayvanlar.id, 1, [egzotikHayvanlar.id]);
categoriesHierarchy.push(egzotikKus);

["Tavuskuşu", "Flamingo", "Tukan", "Kakapo", "Kiwi Kuşu"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `ana-${type.toLowerCase().replace(/ /g, "-")}`, "Bird", i, egzotikKus.id, 2, [egzotikHayvanlar.id, egzotikKus.id])
  );
});

const egzotikBocek = createCategory("Egzotik Böcekler ve Akrepler", "ana-egzotik-bocekler", "Bug", 2, egzotikHayvanlar.id, 1, [egzotikHayvanlar.id]);
categoriesHierarchy.push(egzotikBocek);

["Tarantula", "Akrep", "Solucan", "Mantis", "At Böceği", "Dev Afrika Sümüklüböceği"].forEach((type, i) => {
  categoriesHierarchy.push(
    createCategory(type, `ana-${type.toLowerCase().replace(/ /g, "-")}`, "Bug", i, egzotikBocek.id, 2, [egzotikHayvanlar.id, egzotikBocek.id])
  );
});

console.log(`Generated ${categoriesHierarchy.length} categories`);
