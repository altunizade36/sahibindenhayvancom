import { db } from "./db";
import { users, listings, categories } from "@shared/schema";
import bcrypt from "bcryptjs";

async function seedTestData() {
  console.log("🌱 Seeding enhanced test data for comprehensive testing...");

  // Create 100 test users (increased from 50)
  const testUsers = [];
  for (let i = 1; i <= 100; i++) {
    const hashedPassword = await bcrypt.hash("test123", 10);
    const roles = i === 1 ? "admin" : (i <= 10 ? "vet" : (i <= 20 ? "seller" : "buyer"));
    const [user] = await db.insert(users).values({
      username: `testuser${i}`,
      email: `testuser${i}@example.com`,
      password: hashedPassword,
      fullName: `Test User ${i}`,
      phone: `+905${String(i).padStart(9, '0')}`,
      role: roles,
    }).returning();
    testUsers.push(user);
  }
  console.log(`✅ Created ${testUsers.length} test users (1 admin, 9 vets, 10 sellers, 80 buyers)`);

  // Get all categories
  const allCategories = await db.select().from(categories);
  const leafCategories = allCategories.filter(c => {
    const hasChildren = allCategories.some(child => child.parentId === c.id);
    return !hasChildren;
  });
  console.log(`📁 Found ${leafCategories.length} leaf categories`);

  // Enhanced test data with better distribution
  const cities = ["istanbul", "ankara", "izmir", "antalya", "bursa", "adana", "gaziantep", "konya", "mersin", "diyarbakır"];
  const districts = ["Merkez", "Kadıköy", "Beşiktaş", "Çankaya", "Karşıyaka", "Bornova", "Keçiören", "Bahçelievler"];
  const genders = ["male", "female"];
  const healthStatuses = ["healthy", "needs_attention", "under_treatment"];
  const breeds = [
    "Golden Retriever", "Labrador", "German Shepherd", "Husky", "Poodle",
    "Persian", "British Shorthair", "Angora", "Scottish Fold", "Sphynx",
    "Parakeet", "Canary", "Cockatiel", "African Grey",
    "Holstein", "Simmental", "Jersey", "Angus",
    "Merino", "Karakaçan", "Akkaraman", "İvesi"
  ];

  // Create 500 test listings (increased from 200)
  // Distribute across all leaf categories for better coverage
  console.log("Creating 500 test listings with balanced category distribution...");
  
  // First pass: ensure each category gets at least one listing
  const categoryListingCount = new Map<string, number>();
  for (let i = 0; i < leafCategories.length && i < 390; i++) {
    const category = leafCategories[i];
    const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomDistrict = districts[Math.floor(Math.random() * districts.length)];
    
    await db.insert(listings).values({
      title: `${category.name} - Premium`,
      description: `Kaliteli ${category.name} ilanı. Detaylı bilgi için iletişime geçiniz. Sağlık kontrolü yapılmış, aşıları tam.`,
      price: (Math.random() * 15000 + 1000).toFixed(2),
      categoryId: category.id,
      sellerId: randomUser.id,
      city: randomCity,
      district: randomDistrict,
      status: "active",
      age: Math.floor(Math.random() * 60).toString(),
      gender: genders[Math.floor(Math.random() * genders.length)] as any,
      breed: breeds[Math.floor(Math.random() * breeds.length)],
      healthStatus: healthStatuses[Math.floor(Math.random() * healthStatuses.length)] as any,
      vaccinated: Math.random() > 0.3,
      views: Math.floor(Math.random() * 2000),
      images: [
        `https://picsum.photos/seed/${i * 2}/400/300`,
        `https://picsum.photos/seed/${i * 2 + 1}/400/300`
      ],
    });
    categoryListingCount.set(category.id, 1);
  }
  console.log(`✅ Created base listings for ${categoryListingCount.size} categories`);

  // Second pass: fill remaining slots randomly
  const remainingListings = 500 - categoryListingCount.size;
  for (let i = 0; i < remainingListings; i++) {
    const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
    const randomCategory = leafCategories[Math.floor(Math.random() * leafCategories.length)];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomDistrict = districts[Math.floor(Math.random() * districts.length)];
    
    // Test different price formats (string, number, decimal)
    let price: string;
    if (i % 3 === 0) {
      price = String(Math.floor(Math.random() * 10000 + 500)); // Integer as string
    } else if (i % 3 === 1) {
      price = (Math.random() * 10000 + 500).toFixed(2); // Decimal string
    } else {
      price = String(Math.random() * 10000 + 500); // Number to string
    }
    
    const currentCount = categoryListingCount.get(randomCategory.id) || 0;
    categoryListingCount.set(randomCategory.id, currentCount + 1);
    
    await db.insert(listings).values({
      title: `${randomCategory.name} - ${i + 1}`,
      description: `Test ilanı #${i + 1}. ${randomCategory.name} kategorisinde kaliteli ilan. Detaylı bilgi için lütfen iletişime geçiniz.`,
      price: price,
      categoryId: randomCategory.id,
      sellerId: randomUser.id,
      city: randomCity,
      district: randomDistrict,
      status: i % 15 === 0 ? "sold" : (i % 20 === 0 ? "pending" : "active"),
      age: Math.floor(Math.random() * 60).toString(),
      gender: genders[Math.floor(Math.random() * genders.length)] as any,
      breed: breeds[Math.floor(Math.random() * breeds.length)],
      healthStatus: healthStatuses[Math.floor(Math.random() * healthStatuses.length)] as any,
      vaccinated: Math.random() > 0.4,
      views: Math.floor(Math.random() * 1500),
      images: i % 2 === 0 
        ? [`https://picsum.photos/seed/${i}/400/300`]
        : [
            `https://picsum.photos/seed/${i * 2}/400/300`,
            `https://picsum.photos/seed/${i * 2 + 1}/400/300`,
            `https://picsum.photos/seed/${i * 2 + 2}/400/300`
          ],
    });
    
    if ((i + 1) % 100 === 0) {
      console.log(`   Progress: ${i + 1}/${remainingListings} additional listings created`);
    }
  }
  
  console.log(`✅ Created 500 total test listings`);
  console.log(`📊 Category distribution: ${categoryListingCount.size} categories have listings`);
  
  console.log("🎉 Test data seeding complete!");
  process.exit(0);
}

seedTestData().catch((error) => {
  console.error("❌ Error seeding test data:", error);
  process.exit(1);
});
