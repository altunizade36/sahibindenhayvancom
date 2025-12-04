import bcrypt from "bcryptjs";
import { eq, and, like, sql } from "drizzle-orm";
import { db } from "./db";
import { users, listings, categories } from "../shared/schema";
import { exampleListings } from "./data/example-listings";

async function seedExampleListings() {
  console.log("🌱 Seeding example listings with realistic Turkish market prices...");

  // Get all categories from database
  const allCategories = await db.select().from(categories);
  
  if (allCategories.length === 0) {
    console.error("❌ No categories found in database! Please run category seed first.");
    process.exit(1);
  }

  console.log(`✅ Found ${allCategories.length} categories in database`);

  // Create example seller user if not exists
  const existingUser = await db.select().from(users).where(eq(users.username, "ornek_satici")).limit(1);
  
  let sellerId: string;
  
  if (existingUser.length === 0) {
    const hashedPassword = await bcrypt.hash("ornek123", 10);
    const [newUser] = await db.insert(users).values({
      username: "ornek_satici",
      email: "ornek@sahibindenhayvan.com",
      password: hashedPassword,
      firstName: "Örnek",
      lastName: "Satıcı",
      phone: "5550001122",
      role: "seller",
      status: "active",
      emailVerified: true,
    }).returning();
    sellerId = newUser.id;
    console.log(`✅ Example seller created: ${newUser.username}`);
  } else {
    sellerId = existingUser[0].id;
    console.log(`✅ Using existing example seller: ${existingUser[0].username}`);
  }

  // Delete old example listings
  const deleted = await db.delete(listings).where(eq(listings.isExampleListing, true));
  console.log(`🗑️ Deleted old example listings`);

  // Map example categories to real database categories
  const categoryMapping: Record<string, string> = {};
  
  // Create mapping based on slug patterns
  const categoryMappings = [
    // Büyükbaş
    { example: "cat-dana", slugPattern: "besi-dana" },
    { example: "cat-duve", slugPattern: "duve" },
    { example: "cat-inek", slugPattern: "sut-inek" },
    { example: "cat-boga", slugPattern: "damizlik-boga" },
    { example: "cat-manda", slugPattern: "manda" },
    // Küçükbaş
    { example: "cat-koyun", slugPattern: "koyun" },
    { example: "cat-keci", slugPattern: "keci" },
    { example: "cat-kuzu", slugPattern: "kuzu" },
    { example: "cat-oglak", slugPattern: "oglak" },
    // Kanatlı
    { example: "cat-ciftlik-tavuk", slugPattern: "tavuk" },
    { example: "cat-ciftlik-kaz", slugPattern: "kaz" },
    { example: "cat-ciftlik-hindi", slugPattern: "hindi" },
    { example: "cat-ciftlik-ordek", slugPattern: "ordek" },
    // Atlar
    { example: "cat-ana-arap-ati", slugPattern: "arap-at" },
    { example: "cat-ana-ingiliz-ati", slugPattern: "ingiliz-at" },
    { example: "cat-at-tay", slugPattern: "tay" },
    { example: "cat-at-pony", slugPattern: "pony" },
    // Köpekler
    { example: "cat-kopek-yavru", slugPattern: "kopek-yavru" },
    { example: "cat-kopek-yetiskin", slugPattern: "kopek-yetiskin" },
    // Kediler
    { example: "cat-kedi-yavru", slugPattern: "kedi-yavru" },
    { example: "cat-ankara-kedisi", slugPattern: "ankara-kedi" },
    // Kuşlar
    { example: "cat-muhabbet-kusu", slugPattern: "muhabbet" },
    { example: "cat-sultan-papagani", slugPattern: "sultan-papagan" },
    { example: "cat-kanarya", slugPattern: "kanarya" },
    { example: "cat-gri-papagan", slugPattern: "gri-papagan" },
    { example: "cat-ana-guvercin", slugPattern: "guvercin" },
    // Balıklar
    { example: "cat-akvaryum-balik", slugPattern: "akvaryum" },
    { example: "cat-koi", slugPattern: "koi" },
    // Sürüngenler
    { example: "cat-ana-kaplumbaga", slugPattern: "kaplumbaga" },
    { example: "cat-ana-geko", slugPattern: "geko" },
    // Kemirgenler
    { example: "cat-tavsan", slugPattern: "tavsan" },
    { example: "cat-hamster", slugPattern: "hamster" },
    { example: "cat-gine-domuzu", slugPattern: "gine" },
    // Arıcılık
    { example: "cat-arili-kovan", slugPattern: "kovan" },
    { example: "cat-ana-ari", slugPattern: "ana-ari" },
    // Yem
    { example: "cat-besi-yemi", slugPattern: "besi-yem" },
    { example: "cat-kopek-mamasi", slugPattern: "kopek-mama" },
    // Ekipman
    { example: "cat-kumes-ekipman", slugPattern: "kumes-ekipman" },
    { example: "cat-akvaryum-malz", slugPattern: "akvaryum-malzeme" },
  ];

  // Find matching categories by slug pattern
  for (const mapping of categoryMappings) {
    const matchingCategory = allCategories.find(c => 
      c.slug.includes(mapping.slugPattern) || 
      c.slug === mapping.slugPattern ||
      c.name.toLowerCase().includes(mapping.slugPattern.replace(/-/g, ' '))
    );
    if (matchingCategory) {
      categoryMapping[mapping.example] = matchingCategory.id;
    }
  }

  // If no specific mapping found, use first available animal-related category
  const fallbackCategories = allCategories.filter(c => 
    !c.slug.includes('yem') && 
    !c.slug.includes('ekipman') && 
    !c.slug.includes('malzeme')
  );
  const defaultCategoryId = fallbackCategories[0]?.id || allCategories[0]?.id;

  console.log(`📋 Category mapping created with ${Object.keys(categoryMapping).length} mappings`);

  // Prepare listings data
  const listingsToCreate = exampleListings.map((example, index) => {
    const categoryId = categoryMapping[example.categoryId] || defaultCategoryId;
    
    return {
      title: example.title,
      description: example.description,
      categoryId: categoryId,
      sellerId: sellerId,
      price: example.price.toString(),
      city: example.city,
      district: example.district,
      breed: example.breed || null,
      age: example.age || null,
      gender: example.gender || null,
      healthStatus: example.healthStatus || null,
      vaccinated: example.vaccinated || false,
      neutered: example.neutered || false,
      pedigree: example.pedigree || false,
      status: "active" as const,
      isExampleListing: true,
      exampleSource: example.exampleSource || "Piyasa Araştırması 2024",
      views: Math.floor(Math.random() * 500) + 50,
      images: [] as string[],
    };
  });

  // Insert in batches
  const batchSize = 20;
  let insertedCount = 0;
  
  for (let i = 0; i < listingsToCreate.length; i += batchSize) {
    const batch = listingsToCreate.slice(i, i + batchSize);
    try {
      await db.insert(listings).values(batch);
      insertedCount += batch.length;
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(listingsToCreate.length / batchSize)} (${insertedCount}/${listingsToCreate.length})`);
    } catch (error) {
      console.error(`❌ Error inserting batch:`, error);
    }
  }

  console.log(`\n🎉 Successfully seeded ${insertedCount} example listings!`);
  console.log(`\n📊 Price ranges used from Turkish market sources:
  - Büyükbaş: Besi danası ₺340-380/kg, Düve ₺150-180K, Süt ineği ₺180-220K
  - Küçükbaş: Merinos ₺11-14K, İvesi ₺12-16K, Besi kuzusu ₺6.5-8K
  - Atlar: Safkan Arap ₺700K-1.2M, İngiliz ₺350-500K
  - Köpekler: Golden ₺25-35K, Kangal ₺60-80K
  - Kediler: British ₺20-30K, Van ₺15-20K
  `);
}

seedExampleListings().catch(console.error);
