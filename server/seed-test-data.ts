import { db } from "./db";
import { users, listings, categories } from "@shared/schema";
import bcrypt from "bcryptjs";

async function seedTestData() {
  console.log("🌱 Seeding test data for load testing...");

  // Create 50 test users
  const testUsers = [];
  for (let i = 1; i <= 50; i++) {
    const hashedPassword = await bcrypt.hash("test123", 10);
    const [user] = await db.insert(users).values({
      email: `testuser${i}@example.com`,
      password: hashedPassword,
      fullName: `Test User ${i}`,
      phone: `+905${String(i).padStart(9, '0')}`,
      role: i === 1 ? "admin" : (i <= 5 ? "veterinarian" : "buyer"),
    }).returning();
    testUsers.push(user);
  }
  console.log(`✅ Created ${testUsers.length} test users`);

  // Get all categories
  const allCategories = await db.select().from(categories);
  const leafCategories = allCategories.filter(c => {
    const hasChildren = allCategories.some(child => child.parentId === c.id);
    return !hasChildren;
  });
  console.log(`📁 Found ${leafCategories.length} leaf categories`);

  // Create 200 test listings
  const cities = ["istanbul", "ankara", "izmir", "antalya", "bursa"];
  const genders = ["male", "female"];
  const healthStatuses = ["healthy", "needs_attention", "under_treatment"];
  const breeds = ["Golden Retriever", "Labrador", "German Shepherd", "Husky", "Persian", "British Shorthair", "Angora"];

  for (let i = 1; i <= 200; i++) {
    const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
    const randomCategory = leafCategories[Math.floor(Math.random() * leafCategories.length)];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    
    await db.insert(listings).values({
      title: `Test ${randomCategory.name} - ${i}`,
      description: `Bu bir test ilanıdır. #${i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
      price: (Math.random() * 10000 + 500).toFixed(2),
      categoryId: randomCategory.id,
      sellerId: randomUser.id,
      city: randomCity,
      status: i % 10 === 0 ? "sold" : "active",
      age: Math.floor(Math.random() * 60).toString(),
      gender: genders[Math.floor(Math.random() * genders.length)] as any,
      breed: breeds[Math.floor(Math.random() * breeds.length)],
      healthStatus: healthStatuses[Math.floor(Math.random() * healthStatuses.length)] as any,
      vaccinated: Math.random() > 0.5,
      views: Math.floor(Math.random() * 1000),
      images: [`https://picsum.photos/seed/${i}/400/300`],
    });
  }
  console.log("✅ Created 200 test listings");
  
  console.log("🎉 Test data seeding complete!");
  process.exit(0);
}

seedTestData().catch((error) => {
  console.error("❌ Error seeding test data:", error);
  process.exit(1);
});
