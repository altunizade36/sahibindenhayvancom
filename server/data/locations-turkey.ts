import { Location } from "@shared/schema";
import { slugify, generateLocationId } from "@shared/utils";

// Location cache for building hierarchies
const locationCache: Map<string, Location> = new Map();

// Helper to create location with automatic hierarchy support
const createLocation = (
  name: string,
  type: "il" | "ilce" | "mahalle" | "koy",
  parentId: string | null = null,
  code: string | null = null,
  order: number = 0
): Location => {
  const slug = slugify(name);
  
  // Get parent location if exists
  const parent = parentId ? locationCache.get(parentId) : null;
  
  // Validate parent exists if parentId provided
  if (parentId && !parent) {
    throw new Error(`Parent location not found: ${parentId}`);
  }
  
  // Auto-calculate depth from parent
  const depth = parent ? parent.depth + 1 : 0;
  
  // Auto-build path from parent (slugs, not IDs, for stable hashing)
  const pathSlugs: string[] = parent ? [...(parent as any).pathSlugs || [parent.slug], parent.slug] : [];
  
  // Generate deterministic ID based on full path
  const id = generateLocationId(type, slug + (code ? `-${code}` : ""), pathSlugs);
  
  // Build path array of parent IDs for efficient queries
  const path: string[] = parent ? [...parent.path, parent.id] : [];
  
  const location: Location & { pathSlugs?: string[] } = {
    id,
    name,
    slug,
    type,
    parentId,
    code,
    depth,
    path,
    order,
    pathSlugs, // Internal tracking for ID generation
  };
  
  // Cache for child lookups
  locationCache.set(id, location);
  
  return location;
};

export const turkeyLocations: Location[] = [];

// ========== 81 Provinces (İller) ==========

const provinces = [
  { name: "Adana", code: "01" },
  { name: "Adıyaman", code: "02" },
  { name: "Afyonkarahisar", code: "03" },
  { name: "Ağrı", code: "04" },
  { name: "Amasya", code: "05" },
  { name: "Ankara", code: "06" },
  { name: "Antalya", code: "07" },
  { name: "Artvin", code: "08" },
  { name: "Aydın", code: "09" },
  { name: "Balıkesir", code: "10" },
  { name: "Bilecik", code: "11" },
  { name: "Bingöl", code: "12" },
  { name: "Bitlis", code: "13" },
  { name: "Bolu", code: "14" },
  { name: "Burdur", code: "15" },
  { name: "Bursa", code: "16" },
  { name: "Çanakkale", code: "17" },
  { name: "Çankırı", code: "18" },
  { name: "Çorum", code: "19" },
  { name: "Denizli", code: "20" },
  { name: "Diyarbakır", code: "21" },
  { name: "Edirne", code: "22" },
  { name: "Elazığ", code: "23" },
  { name: "Erzincan", code: "24" },
  { name: "Erzurum", code: "25" },
  { name: "Eskişehir", code: "26" },
  { name: "Gaziantep", code: "27" },
  { name: "Giresun", code: "28" },
  { name: "Gümüşhane", code: "29" },
  { name: "Hakkari", code: "30" },
  { name: "Hatay", code: "31" },
  { name: "Isparta", code: "32" },
  { name: "Mersin", code: "33" },
  { name: "İstanbul", code: "34" },
  { name: "İzmir", code: "35" },
  { name: "Kars", code: "36" },
  { name: "Kastamonu", code: "37" },
  { name: "Kayseri", code: "38" },
  { name: "Kırklareli", code: "39" },
  { name: "Kırşehir", code: "40" },
  { name: "Kocaeli", code: "41" },
  { name: "Konya", code: "42" },
  { name: "Kütahya", code: "43" },
  { name: "Malatya", code: "44" },
  { name: "Manisa", code: "45" },
  { name: "Kahramanmaraş", code: "46" },
  { name: "Mardin", code: "47" },
  { name: "Muğla", code: "48" },
  { name: "Muş", code: "49" },
  { name: "Nevşehir", code: "50" },
  { name: "Niğde", code: "51" },
  { name: "Ordu", code: "52" },
  { name: "Rize", code: "53" },
  { name: "Sakarya", code: "54" },
  { name: "Samsun", code: "55" },
  { name: "Siirt", code: "56" },
  { name: "Sinop", code: "57" },
  { name: "Sivas", code: "58" },
  { name: "Tekirdağ", code: "59" },
  { name: "Tokat", code: "60" },
  { name: "Trabzon", code: "61" },
  { name: "Tunceli", code: "62" },
  { name: "Şanlıurfa", code: "63" },
  { name: "Uşak", code: "64" },
  { name: "Van", code: "65" },
  { name: "Yozgat", code: "66" },
  { name: "Zonguldak", code: "67" },
  { name: "Aksaray", code: "68" },
  { name: "Bayburt", code: "69" },
  { name: "Karaman", code: "70" },
  { name: "Kırıkkale", code: "71" },
  { name: "Batman", code: "72" },
  { name: "Şırnak", code: "73" },
  { name: "Bartın", code: "74" },
  { name: "Ardahan", code: "75" },
  { name: "Iğdır", code: "76" },
  { name: "Yalova", code: "77" },
  { name: "Karabük", code: "78" },
  { name: "Kilis", code: "79" },
  { name: "Osmaniye", code: "80" },
  { name: "Düzce", code: "81" },
];

// Create all 81 provinces
const provincesMap: Record<string, Location> = {};
provinces.forEach((prov, idx) => {
  const loc = createLocation(prov.name, "il", null, prov.code, idx);
  turkeyLocations.push(loc);
  provincesMap[prov.name] = loc;
});

// ========== Major Districts (İlçeler) for Top Cities ==========

// Istanbul Districts (39 districts)
const istanbulDistricts = [
  "Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler",
  "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü",
  "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt",
  "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane",
  "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer",
  "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla",
  "Ümraniye", "Üsküdar", "Zeytinburnu"
];

istanbulDistricts.forEach((district, idx) => {
  const loc = createLocation(district, "ilce", provincesMap["İstanbul"].id, null, idx);
  turkeyLocations.push(loc);
});

// Ankara Districts (25 districts)
const ankaraDistricts = [
  "Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere", "Çankaya",
  "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana",
  "Kalecik", "Kazan", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan",
  "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"
];

ankaraDistricts.forEach((district, idx) => {
  const loc = createLocation(district, "ilce", provincesMap["Ankara"].id, null, idx);
  turkeyLocations.push(loc);
});

// İzmir Districts (30 districts)
const izmirDistricts = [
  "Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova",
  "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe",
  "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz",
  "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar",
  "Selçuk", "Tire", "Torbalı", "Urla"
];

izmirDistricts.forEach((district, idx) => {
  const loc = createLocation(district, "ilce", provincesMap["İzmir"].id, null, idx);
  turkeyLocations.push(loc);
});

// Bursa Districts (17 districts)
const bursaDistricts = [
  "Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey",
  "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa", "Nilüfer", "Orhaneli",
  "Orhangazi", "Osmangazi", "Yenişehir", "Yıldırım"
];

bursaDistricts.forEach((district, idx) => {
  const loc = createLocation(district, "ilce", provincesMap["Bursa"].id, null, idx);
  turkeyLocations.push(loc);
});

// Antalya Districts (19 districts)
const antalyaDistricts = [
  "Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike",
  "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı",
  "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"
];

antalyaDistricts.forEach((district, idx) => {
  const loc = createLocation(district, "ilce", provincesMap["Antalya"].id, null, idx);
  turkeyLocations.push(loc);
});

// Add a few more major cities with their districts
const otherCityDistricts: Record<string, string[]> = {
  "Adana": ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"],
  "Gaziantep": ["Araban", "İslahiye", "Karkamış", "Nizip", "Nurdağı", "Oğuzeli", "Şahinbey", "Şehitkamil", "Yavuzeli"],
  "Konya": ["Ahırlı", "Akören", "Akşehir", "Altınekin", "Beyşehir", "Bozkır", "Cihanbeyli", "Çeltik", "Çumra", "Derbent", "Derebucak", "Doğanhisar", "Emirgazi", "Ereğli", "Güneysınır", "Hadim", "Halkapınar", "Hüyük", "Ilgın", "Kadınhanı", "Karapınar", "Karatay", "Kulu", "Meram", "Sarayönü", "Selçuklu", "Seydişehir", "Taşkent", "Tuzlukçu", "Yalıhüyük", "Yunak"],
  "Kocaeli": ["Başiskele", "Çayırova", "Darıca", "Derince", "Dilovası", "Gebze", "Gölcük", "İzmit", "Kandıra", "Karamürsel", "Kartepe", "Körfez"],
  "Mersin": ["Akdeniz", "Anamur", "Aydıncık", "Bozyazı", "Çamlıyayla", "Erdemli", "Gülnar", "Mezitli", "Mut", "Silifke", "Tarsus", "Toroslar", "Yenişehir"],
};

Object.entries(otherCityDistricts).forEach(([city, districts]) => {
  const province = provincesMap[city];
  if (province) {
    districts.forEach((district, idx) => {
      turkeyLocations.push(createLocation(district, "ilce", province.id, null, idx));
    });
  }
});

// ========== Sample Neighborhoods (Mahalleler) for Major Districts ==========

// Note: For the prototype, we're adding a small sample of neighborhoods
// In production, this would be loaded from an external database or API

// Istanbul - Kadıköy neighborhoods (sample)
const kadikoy = turkeyLocations.find(l => l.name === "Kadıköy" && l.parentId === provincesMap["İstanbul"].id);
if (!kadikoy) throw new Error("Kadıköy district not found");
const kadikoyNeighborhoods = [
  "Acıbadem", "Bostancı", "Caddebostan", "Caferağa", "Erenköy", "Fenerbahçe",
  "Göztepe", "Hasanpaşa", "Koşuyolu", "Kozyatağı", "Moda", "Osmanağa",
  "Rasimpaşa", "Suadiye", "Zühtüpaşa"
];

kadikoyNeighborhoods.forEach((neighborhood, idx) => {
  turkeyLocations.push(createLocation(neighborhood, "mahalle", kadikoy.id, null, idx));
});

// Istanbul - Beşiktaş neighborhoods (sample)
const besiktas = turkeyLocations.find(l => l.name === "Beşiktaş" && l.parentId === provincesMap["İstanbul"].id);
if (!besiktas) throw new Error("Beşiktaş district not found");
const besiktasNeighborhoods = [
  "Abbasağa", "Arnavutköy", "Bebek", "Etiler", "Konaklar", "Levent",
  "Levazım", "Mecidiye", "Nisbetiye", "Ortaköy", "Sinanpaşa", "Türkali",
  "Ulus", "Yıldız"
];

besiktasNeighborhoods.forEach((neighborhood, idx) => {
  turkeyLocations.push(createLocation(neighborhood, "mahalle", besiktas.id, null, idx));
});

// Ankara - Çankaya neighborhoods (sample)
const cankaya = turkeyLocations.find(l => l.name === "Çankaya" && l.parentId === provincesMap["Ankara"].id);
if (!cankaya) throw new Error("Çankaya district not found");
const cankayaNeighborhoods = [
  "Ahlatlıbel", "Aşağı Öveçler", "Aydınlıkevler", "Balgat", "Barbaros",
  "Birlik", "Çiğdem", "Dikimevi", "Esat", "Gaziosmanpaşa", "Kavaklıdere",
  "Kızılay", "Kolej", "Maltepe", "Öveçler", "Yukarı Bahçelievler"
];

cankayaNeighborhoods.forEach((neighborhood, idx) => {
  turkeyLocations.push(createLocation(neighborhood, "mahalle", cankaya.id, null, idx));
});

// İzmir - Konak neighborhoods (sample)
const konak = turkeyLocations.find(l => l.name === "Konak" && l.parentId === provincesMap["İzmir"].id);
if (!konak) throw new Error("Konak district not found");
const konakNeighborhoods = [
  "Akdeniz", "Alsancak", "Basmane", "Çankaya", "Eşrefpaşa", "Göztepe",
  "Güzelyalı", "Hatay", "Kahramanlar", "Konak", "Tuzlar", "Umurbey",
  "Yalı", "Yenigün"
];

konakNeighborhoods.forEach((neighborhood, idx) => {
  turkeyLocations.push(createLocation(neighborhood, "mahalle", konak.id, null, idx));
});

// ========== Sample Villages (Köyler) ==========

// Add a few sample villages under selected neighborhoods
// Note: In production, this would come from external data

const moda = turkeyLocations.find(l => l.name === "Moda" && l.parentId === kadikoy.id);
if (moda) {
  const sampleVillages = ["Köy 1", "Köy 2", "Köy 3"];
  sampleVillages.forEach((village, idx) => {
    turkeyLocations.push(createLocation(village, "koy", moda.id, null, idx));
  });
}

console.log(`Generated ${turkeyLocations.length} locations:`);
console.log(`- ${provinces.length} provinces`);
console.log(`- Districts for major cities`);
console.log(`- Sample neighborhoods and villages`);
