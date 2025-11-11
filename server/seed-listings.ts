import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, listings, categories } from "../shared/schema";
import { turkeyLocations } from "./data/locations-turkey-full";

// Sample titles per category type
const animalTitles = [
  "Sağlıklı", "Sevimli", "Aşılı", "Eğitimli", "Güzel", "Tatlı", "Uysal", "Oyuncu",
  "Muhteşem", "Satılık", "Safkan", "Pedigri", "Champion", "Show", "Damızlık"
];

const animalTypes = [
  "Kedi", "Köpek", "Kuş", "Balık", "Hamster", "Tavşan", "Kobay", "Muhabbet Kuşu",
  "Papağan", "Hint Bülbülü", "Japon Balığı", "Beta Balığı", "Arowana", "Gouldian Finch"
];

async function seedListings() {
  console.log("🌱 Seeding test user and listings...");

  // Get all categories from database
  const allCategories = await db.select().from(categories);
  const categoryIds = allCategories.map(c => c.id);
  
  if (categoryIds.length === 0) {
    console.error("❌ No categories found in database! Please run seed first.");
    process.exit(1);
  }

  console.log(`✅ Found ${categoryIds.length} categories in database`);

  // Check if user exists
  const existingUser = await db.select().from(users).where(eq(users.username, "testuser")).limit(1);
  
  let userId: number;
  
  if (existingUser.length === 0) {
    // Create test user
    const hashedPassword = await bcrypt.hash("test123", 10);
    const [newUser] = await db.insert(users).values({
      username: "testuser",
      email: "test@example.com",
      password: hashedPassword,
      fullName: "Test Kullanıcı",
      phone: "5551234567",
      role: "buyer",
      status: "active",
    }).returning();
    userId = newUser.id;
    console.log(`✅ Test user created: ${newUser.username}`);
  } else {
    userId = existingUser[0].id;
    console.log(`✅ Using existing test user: ${existingUser[0].username}`);
  }

  // Get province locations (İl level)
  const provinces = turkeyLocations.filter(loc => loc.type === "il");
  
  // Get district locations (İlçe level)
  const districts = turkeyLocations.filter(loc => loc.type === "ilce");
  
  // Create 120 listings for pagination testing
  const listingsToCreate = 120;
  const listingsData = [];

  for (let i = 0; i < listingsToCreate; i++) {
    const randomCategory = categoryIds[Math.floor(Math.random() * categoryIds.length)];
    const randomProvince = provinces[Math.floor(Math.random() * provinces.length)];
    const randomDistrict = districts.filter(d => d.parentId === randomProvince.id)[0] || districts[0];
    
    const titlePart1 = animalTitles[Math.floor(Math.random() * animalTitles.length)];
    const titlePart2 = animalTypes[Math.floor(Math.random() * animalTypes.length)];
    const title = `${titlePart1} ${titlePart2} #${i + 1}`;
    
    const price = Math.floor(Math.random() * 50000) + 500; // 500-50000 TL
    const age = Math.floor(Math.random() * 60) + 1; // 1-60 months
    const gender = Math.random() > 0.5 ? "male" : "female";
    
    listingsData.push({
      title,
      description: `${title} için detaylı açıklama. Sağlıklı, aşılı, bakımlı. Ciddi alıcılar arayabilir.`,
      categoryId: randomCategory,
      sellerId: userId,
      price: price.toString(),
      locationId: randomDistrict.id,
      city: randomProvince.name,
      district: randomDistrict.name,
      age: age.toString(),
      gender,
      status: "active",
      views: Math.floor(Math.random() * 1000),
    });
  }

  // Insert in batches
  const batchSize = 50;
  for (let i = 0; i < listingsData.length; i += batchSize) {
    const batch = listingsData.slice(i, i + batchSize);
    await db.insert(listings).values(batch);
    console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(listingsData.length / batchSize)}`);
  }

  console.log(`✅ Successfully seeded ${listingsToCreate} listings!`);
}

seedListings().catch(console.error);
