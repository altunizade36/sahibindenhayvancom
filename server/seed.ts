import { db } from "./db";
import { categories } from "@shared/schema";
import { sql } from "drizzle-orm";

const defaultCategories = [
  {
    name: "Evcil Hayvanlar",
    slug: "evcil-hayvanlar",
    icon: "PawPrint",
    parentId: null,
    order: 0,
  },
  {
    name: "Çiftlik Hayvanları",
    slug: "ciftlik-hayvanlari",
    icon: "Tractor",
    parentId: null,
    order: 1,
  },
  {
    name: "Kuşlar",
    slug: "kuslar",
    icon: "Bird",
    parentId: null,
    order: 2,
  },
  {
    name: "Akvaryum",
    slug: "akvaryum",
    icon: "Fish",
    parentId: null,
    order: 3,
  },
  {
    name: "Atlar",
    slug: "atlar",
    icon: "Horse",
    parentId: null,
    order: 4,
  },
  {
    name: "Arıcılık",
    slug: "aricilik",
    icon: "Honeycomb",
    parentId: null,
    order: 5,
  },
];

export async function seedDatabase() {
  console.log("🌱 Seeding database...");
  
  try {
    // Check if categories already exist to avoid unnecessary inserts
    const existingCategories = await db.query.categories.findMany({
      limit: 1,
    });
    
    if (existingCategories.length > 0) {
      console.log("✅ Database already seeded, skipping");
      return;
    }
    
    // Insert categories with ON CONFLICT DO NOTHING to avoid duplicates
    for (const category of defaultCategories) {
      await db
        .insert(categories)
        .values(category)
        .onConflictDoNothing()
        .execute();
    }
    
    console.log("✅ Database seeded successfully");
  } catch (error) {
    console.error("⚠️  Warning: Error seeding database:", error);
    console.log("Continuing server startup...");
    // Don't throw - allow server to continue even if seeding fails
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
