/**
 * Hierarchical Store Categories
 * Based on user-provided structure - professional business classification
 * NOT just store types - this is a complete category tree
 */

export interface StoreCategoryData {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  icon: string;
  depth: number;
  order: number;
}

export const storeCategories: StoreCategoryData[] = [
  // ============ LEVEL 0: MAIN CATEGORIES ============
  
  {
    id: "sc-petshop",
    parentId: null,
    name: "Petshop Mağazası",
    slug: "petshop-magazasi",
    icon: "Store",
    depth: 0,
    order: 1,
  },
  {
    id: "sc-feed-producer",
    parentId: null,
    name: "Yem & Mama Üreticisi",
    slug: "yem-mama-uretici",
    icon: "Package",
    depth: 0,
    order: 2,
  },
  {
    id: "sc-farm-equipment",
    parentId: null,
    name: "Çiftlik Ekipmanı Satıcısı",
    slug: "ciftlik-ekipmani-satici",
    icon: "Tractor",
    depth: 0,
    order: 3,
  },
  {
    id: "sc-veterinary",
    parentId: null,
    name: "Veteriner Kliniği",
    slug: "veteriner-klinik",
    icon: "Cross",
    depth: 0,
    order: 4,
  },
  {
    id: "sc-transport",
    parentId: null,
    name: "Nakliye & Lojistik Firması",
    slug: "nakliye-lojistik",
    icon: "Truck",
    depth: 0,
    order: 5,
  },
  {
    id: "sc-beekeeping",
    parentId: null,
    name: "Arıcılık Malzeme Mağazası",
    slug: "aricilik-malzeme",
    icon: "Flower",
    depth: 0,
    order: 6,
  },
  {
    id: "sc-horse-riding",
    parentId: null,
    name: "At & Binicilik Mağazası",
    slug: "at-binicilik",
    icon: "Horse",
    depth: 0,
    order: 7,
  },

  // ============ LEVEL 1: PETSHOP SUBCATEGORIES ============
  
  {
    id: "sc-petshop-dog-cat",
    parentId: "sc-petshop",
    name: "Kedi & Köpek Mağazası",
    slug: "kedi-kopek-magazasi",
    icon: "PawPrint",
    depth: 1,
    order: 1,
  },
  {
    id: "sc-petshop-aquarium",
    parentId: "sc-petshop",
    name: "Akvaryum Mağazası",
    slug: "akvaryum-magazasi",
    icon: "Fish",
    depth: 1,
    order: 2,
  },
  {
    id: "sc-petshop-bird",
    parentId: "sc-petshop",
    name: "Kuş Mağazası",
    slug: "kus-magazasi",
    icon: "Bird",
    depth: 1,
    order: 3,
  },
  {
    id: "sc-petshop-rodent",
    parentId: "sc-petshop",
    name: "Kemirgen Mağazası",
    slug: "kemirgen-magazasi",
    icon: "Rabbit",
    depth: 1,
    order: 4,
  },
  {
    id: "sc-petshop-reptile",
    parentId: "sc-petshop",
    name: "Sürüngen Mağazası",
    slug: "surungin-magazasi",
    icon: "Bug",
    depth: 1,
    order: 5,
  },

  // ============ LEVEL 1: YEM & MAMA ÜRET İCİSİ SUBCATEGORIES ============
  
  {
    id: "sc-feed-dog",
    parentId: "sc-feed-producer",
    name: "Köpek Maması Üreticisi",
    slug: "kopek-mamasi-uretici",
    icon: "Package",
    depth: 1,
    order: 1,
  },
  {
    id: "sc-feed-cat",
    parentId: "sc-feed-producer",
    name: "Kedi Maması Üreticisi",
    slug: "kedi-mamasi-uretici",
    icon: "Package",
    depth: 1,
    order: 2,
  },
  {
    id: "sc-feed-farm",
    parentId: "sc-feed-producer",
    name: "Çiftlik Hayvanı Yemi Üretici",
    slug: "ciftlik-hayvani-yemi",
    icon: "Wheat",
    depth: 1,
    order: 3,
  },
  {
    id: "sc-feed-bird",
    parentId: "sc-feed-producer",
    name: "Kuş Yemi Üreticisi",
    slug: "kus-yemi-uretici",
    icon: "Bird",
    depth: 1,
    order: 4,
  },
  {
    id: "sc-feed-fish",
    parentId: "sc-feed-producer",
    name: "Balık Yemi Üreticisi",
    slug: "balik-yemi-uretici",
    icon: "Fish",
    depth: 1,
    order: 5,
  },

  // ============ LEVEL 1: ÇİFTLİK EKİPMANI SUBCATEGORIES ============
  
  {
    id: "sc-farm-coop",
    parentId: "sc-farm-equipment",
    name: "Kümes Ekipmanı",
    slug: "kumes-ekipmani",
    icon: "Box",
    depth: 1,
    order: 1,
  },
  {
    id: "sc-farm-barn",
    parentId: "sc-farm-equipment",
    name: "Ahır Ekipmanı",
    slug: "ahir-ekipmani",
    icon: "Home",
    depth: 1,
    order: 2,
  },
  {
    id: "sc-farm-irrigation",
    parentId: "sc-farm-equipment",
    name: "Sulama Sistemleri",
    slug: "sulama-sistemleri",
    icon: "Droplets",
    depth: 1,
    order: 3,
  },
  {
    id: "sc-farm-shelter",
    parentId: "sc-farm-equipment",
    name: "Hayvan Barınağı Yapım",
    slug: "hayvan-barinagi-yapim",
    icon: "Building",
    depth: 1,
    order: 4,
  },

  // ============ LEVEL 1: VETERİNER KLİNİĞİ SUBCATEGORIES ============
  
  {
    id: "sc-vet-24h",
    parentId: "sc-veterinary",
    name: "24 Saat Veteriner Klinik",
    slug: "24-saat-vet-klinik",
    icon: "Clock",
    depth: 1,
    order: 1,
  },
  {
    id: "sc-vet-mobile",
    parentId: "sc-veterinary",
    name: "Mobil Veteriner",
    slug: "mobil-veteriner",
    icon: "Ambulance",
    depth: 1,
    order: 2,
  },
  {
    id: "sc-vet-surgery",
    parentId: "sc-veterinary",
    name: "Cerrahi Klinik",
    slug: "cerrahi-klinik",
    icon: "Cross",
    depth: 1,
    order: 3,
  },

  // ============ LEVEL 1: NAKLİYE & LOJİSTİK SUBCATEGORIES ============
  
  {
    id: "sc-transport-pet",
    parentId: "sc-transport",
    name: "Pet Taşımacılık",
    slug: "pet-tasimacilik",
    icon: "PawPrint",
    depth: 1,
    order: 1,
  },
  {
    id: "sc-transport-farm",
    parentId: "sc-transport",
    name: "Çiftlik Hayvanı Nakliyesi",
    slug: "ciftlik-hayvani-nakliye",
    icon: "Truck",
    depth: 1,
    order: 2,
  },
  {
    id: "sc-transport-international",
    parentId: "sc-transport",
    name: "Uluslararası Pet Kargo",
    slug: "uluslararasi-pet-kargo",
    icon: "Plane",
    depth: 1,
    order: 3,
  },
  {
    id: "sc-transport-emergency",
    parentId: "sc-transport",
    name: "Acil Nakliye",
    slug: "acil-nakliye",
    icon: "Siren",
    depth: 1,
    order: 4,
  },

  // ============ LEVEL 1: ARICILIK SUBCATEGORIES ============
  
  {
    id: "sc-bee-hive",
    parentId: "sc-beekeeping",
    name: "Kovan Satıcısı",
    slug: "kovan-satici",
    icon: "Box",
    depth: 1,
    order: 1,
  },
  {
    id: "sc-bee-harvest",
    parentId: "sc-beekeeping",
    name: "Bal Toplama Ekipman",
    slug: "bal-toplama-ekipman",
    icon: "Package",
    depth: 1,
    order: 2,
  },
  {
    id: "sc-bee-clothing",
    parentId: "sc-beekeeping",
    name: "Arıcılık Kıyafeti",
    slug: "aricilik-kiyafeti",
    icon: "Shirt",
    depth: 1,
    order: 3,
  },
  {
    id: "sc-bee-packaging",
    parentId: "sc-beekeeping",
    name: "Bal Ambalaj Malzemesi",
    slug: "bal-ambalaj",
    icon: "Package",
    depth: 1,
    order: 4,
  },

  // ============ LEVEL 1: AT & BİNİCİLİK SUBCATEGORIES ============
  
  {
    id: "sc-horse-care",
    parentId: "sc-horse-riding",
    name: "At Bakım Ürünleri",
    slug: "at-bakim-urunleri",
    icon: "Sparkles",
    depth: 1,
    order: 1,
  },
  {
    id: "sc-horse-feed",
    parentId: "sc-horse-riding",
    name: "At Maması Satıcısı",
    slug: "at-mamasi-satici",
    icon: "Package",
    depth: 1,
    order: 2,
  },
  {
    id: "sc-horse-clothing",
    parentId: "sc-horse-riding",
    name: "Binicilik Kıyafeti",
    slug: "binicilik-kiyafeti",
    icon: "Shirt",
    depth: 1,
    order: 3,
  },
  {
    id: "sc-horse-supplies",
    parentId: "sc-horse-riding",
    name: "At Bakım Ürünleri",
    slug: "at-bakim-malzeme",
    icon: "Wrench",
    depth: 1,
    order: 4,
  },
];

/**
 * Get category tree (for navigation)
 */
export function getStoreCategoryTree() {
  const rootCategories = storeCategories.filter(c => c.depth === 0);
  return rootCategories.map(root => ({
    ...root,
    children: storeCategories.filter(c => c.parentId === root.id),
  }));
}

/**
 * Get category by ID
 */
export function getStoreCategoryById(id: string) {
  return storeCategories.find(c => c.id === id);
}

/**
 * Get category breadcrumb
 */
export function getStoreCategoryBreadcrumb(id: string): StoreCategoryData[] {
  const category = getStoreCategoryById(id);
  if (!category) return [];
  
  const breadcrumb: StoreCategoryData[] = [category];
  let current = category;
  
  while (current.parentId) {
    const parent = getStoreCategoryById(current.parentId);
    if (!parent) break;
    breadcrumb.unshift(parent);
    current = parent;
  }
  
  return breadcrumb;
}
