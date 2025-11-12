export const categoriesData = [
  // Ana Kategoriler (parentId: null)
  {
    name: "Evcil Hayvanlar",
    slug: "evcil-hayvanlar",
    description: "Köpek, kedi ve diğer evcil hayvan ilanları",
    icon: "PawPrint",
    parentId: null,
    isActive: true,
    order: 0,
  },
  {
    name: "Büyükbaş Hayvanlar",
    slug: "buyukbas-hayvanlar",
    description: "İnek, manda ve büyükbaş hayvan ilanları",
    icon: "Beef",
    parentId: null,
    isActive: true,
    order: 1,
  },
  {
    name: "Küçükbaş Hayvanlar",
    slug: "kucukbas-hayvanlar",
    description: "Koyun, keçi ve küçükbaş hayvan ilanları",
    icon: "Rabbit",
    parentId: null,
    isActive: true,
    order: 2,
  },
  {
    name: "Kuşlar",
    slug: "kuslar",
    description: "Kafes kuşları, kümes hayvanları ve diğer kuş ilanları",
    icon: "Bird",
    parentId: null,
    isActive: true,
    order: 3,
  },
  {
    name: "Balıklar ve Su Ürünleri",
    slug: "baliklar",
    description: "Süs balıkları, akvaryum ve su ürünleri ilanları",
    icon: "Fish",
    parentId: null,
    isActive: true,
    order: 4,
  },
  {
    name: "Atlar",
    slug: "atlar",
    description: "At, tay ve binicilik ekipmanları ilanları",
    icon: "Horse",
    parentId: null,
    isActive: true,
    order: 5,
  },
  {
    name: "Arıcılık",
    slug: "aricilik",
    description: "Arı kovanı, bal ve arıcılık ekipmanları",
    icon: "Honeycomb",
    parentId: null,
    isActive: true,
    order: 6,
  },
];

export const subCategoriesData = [
  // Evcil Hayvanlar Alt Kategorileri
  {
    name: "Köpekler",
    slug: "kopekler",
    description: "Tüm ırk köpek ilanları",
    icon: "Dog",
    parentSlug: "evcil-hayvanlar",
    isActive: true,
    order: 0,
  },
  {
    name: "Kediler",
    slug: "kediler",
    description: "Tüm ırk kedi ilanları",
    icon: "Cat",
    parentSlug: "evcil-hayvanlar",
    isActive: true,
    order: 1,
  },
  {
    name: "Kemirgenler",
    slug: "kemirgenler",
    description: "Hamster, tavşan, kobay vb.",
    icon: "Squirrel",
    parentSlug: "evcil-hayvanlar",
    isActive: true,
    order: 2,
  },
  {
    name: "Sürüngenler",
    slug: "surungenler",
    description: "Kaplumbağa, iguana, yılan vb.",
    icon: "Turtle",
    parentSlug: "evcil-hayvanlar",
    isActive: true,
    order: 3,
  },
  
  // Büyükbaş Hayvanlar Alt Kategorileri
  {
    name: "İnekler",
    slug: "inekler",
    description: "Süt ve besi inekleri",
    icon: "Milk",
    parentSlug: "buyukbas-hayvanlar",
    isActive: true,
    order: 0,
  },
  {
    name: "Mandalar",
    slug: "mandalar",
    description: "Manda ilanları",
    icon: "Beef",
    parentSlug: "buyukbas-hayvanlar",
    isActive: true,
    order: 1,
  },
  {
    name: "Buzağılar",
    slug: "buzagilar",
    description: "Buzağı ilanları",
    icon: "Baby",
    parentSlug: "buyukbas-hayvanlar",
    isActive: true,
    order: 2,
  },
  
  // Küçükbaş Hayvanlar Alt Kategorileri
  {
    name: "Koyunlar",
    slug: "koyunlar",
    description: "Koç, koyun ve kuzu ilanları",
    icon: "Sheep",
    parentSlug: "kucukbas-hayvanlar",
    isActive: true,
    order: 0,
  },
  {
    name: "Keçiler",
    slug: "keciler",
    description: "Teke, keçi ve oğlak ilanları",
    icon: "Mountain",
    parentSlug: "kucukbas-hayvanlar",
    isActive: true,
    order: 1,
  },
  
  // Kuşlar Alt Kategorileri
  {
    name: "Muhabbet Kuşları",
    slug: "muhabbet-kuslari",
    description: "Muhabbet kuşu ilanları",
    icon: "Bird",
    parentSlug: "kuslar",
    isActive: true,
    order: 0,
  },
  {
    name: "Kanaryalar",
    slug: "kanaryalar",
    description: "Kanarya ilanları",
    icon: "Music",
    parentSlug: "kuslar",
    isActive: true,
    order: 1,
  },
  {
    name: "Papağanlar",
    slug: "papaganlar",
    description: "Papağan türleri",
    icon: "MessageCircle",
    parentSlug: "kuslar",
    isActive: true,
    order: 2,
  },
  {
    name: "Kümes Hayvanları",
    slug: "kumes-hayvanlari",
    description: "Tavuk, horoz, hindi, kaz vb.",
    icon: "Egg",
    parentSlug: "kuslar",
    isActive: true,
    order: 3,
  },
  
  // Balıklar Alt Kategorileri
  {
    name: "Süs Balıkları",
    slug: "sus-baliklari",
    description: "Akvaryum balıkları",
    icon: "Fish",
    parentSlug: "baliklar",
    isActive: true,
    order: 0,
  },
  {
    name: "Akvaryum Malzemeleri",
    slug: "akvaryum-malzemeleri",
    description: "Akvaryum, filtre, ısıtıcı vb.",
    icon: "PackageSearch",
    parentSlug: "baliklar",
    isActive: true,
    order: 1,
  },
  
  // Atlar Alt Kategorileri
  {
    name: "Safkan Atlar",
    slug: "safkan-atlar",
    description: "Safkan at ilanları",
    icon: "Award",
    parentSlug: "atlar",
    isActive: true,
    order: 0,
  },
  {
    name: "Yarış Atları",
    slug: "yaris-atlari",
    description: "Yarış atı ilanları",
    icon: "Zap",
    parentSlug: "atlar",
    isActive: true,
    order: 1,
  },
  {
    name: "Binicilik Ekipmanları",
    slug: "binicilik-ekipmanlari",
    description: "Eyer, gem ve diğer ekipmanlar",
    icon: "Package",
    parentSlug: "atlar",
    isActive: true,
    order: 2,
  },
];

// Helper function to get flattened categories with resolved parentId
export function getFlattenedCategories() {
  const slugToIdMap: Record<string, number> = {};
  const result: Array<any> = [];

  // First pass: add root categories
  categoriesData.forEach((cat, index) => {
    const catWithId = { ...cat, id: index + 1 };
    slugToIdMap[cat.slug] = catWithId.id;
    result.push(catWithId);
  });

  // Second pass: add subcategories with resolved parentId
  let nextId = categoriesData.length + 1;
  subCategoriesData.forEach((subCat) => {
    const parentId = slugToIdMap[subCat.parentSlug];
    if (parentId) {
      const { parentSlug, ...rest } = subCat;
      result.push({
        ...rest,
        id: nextId++,
        parentId,
      });
    }
  });

  return result;
}
