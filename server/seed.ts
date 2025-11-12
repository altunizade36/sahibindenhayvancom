import { db } from "./db";
import { categories, locations, users, blogPosts } from "@shared/schema";
import { sql } from "drizzle-orm";
import { turkeyLocations } from "./data/locations-turkey-full";
import { blogPosts as blogPostsData } from "./data/blog-posts";
import bcrypt from "bcryptjs";

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
    // Check if already seeded
    const existingCategories = await db.query.categories.findMany({ limit: 1 });
    const existingLocations = await db.query.locations.findMany({ limit: 1 });
    const existingBlogPosts = await db.query.blogPosts.findMany({ limit: 1 });
    
    if (existingCategories.length > 0 && existingLocations.length > 0 && existingBlogPosts.length > 0) {
      console.log("✅ Database already seeded, skipping");
      return;
    }
    
    // Seed categories
    if (existingCategories.length === 0) {
      console.log("📁 Seeding categories...");
      for (const category of defaultCategories) {
        await db
          .insert(categories)
          .values(category)
          .onConflictDoNothing()
          .execute();
      }
      console.log("✅ Categories seeded");
    }
    
    // Seed locations (51k+ locations)
    if (existingLocations.length === 0) {
      console.log(`🗺️  Seeding locations (${turkeyLocations.length.toLocaleString()} items)...`);
      console.log("This may take a few minutes...");
      
      // Batch insert for performance
      const batchSize = 500;
      for (let i = 0; i < turkeyLocations.length; i += batchSize) {
        const batch = turkeyLocations.slice(i, i + batchSize);
        await db.insert(locations).values(batch).onConflictDoNothing().execute();
        
        if ((i + batchSize) % 5000 === 0) {
          console.log(`  - Inserted ${Math.min(i + batchSize, turkeyLocations.length).toLocaleString()} / ${turkeyLocations.length.toLocaleString()}`);
        }
      }
      
      console.log("✅ Locations seeded successfully");
      console.log(`   - ${turkeyLocations.filter(l => l.type === 'il').length} provinces`);
      console.log(`   - ${turkeyLocations.filter(l => l.type === 'ilce').length} districts`);
      console.log(`   - ${turkeyLocations.filter(l => l.type === 'mahalle').length.toLocaleString()} neighborhoods`);
      console.log(`   - ${turkeyLocations.filter(l => l.type === 'koy').length.toLocaleString()} villages`);
    }
    
    // Seed blog posts (with veterinarian author)
    if (existingBlogPosts.length === 0) {
      console.log("📝 Seeding blog posts...");
      
      // Create veterinarian author
      const hashedPassword = await bcrypt.hash("veteriner123", 10);
      const [veterinarianAuthor] = await db
        .insert(users)
        .values({
          username: "drayse",
          email: "veteriner@sahibindenhayvan.com",
          password: hashedPassword,
          fullName: "Dr. Ayşe Yılmaz",
          role: "vet",
          phone: "(0532) 123 45 67",
          city: "İstanbul",
          district: "Kadıköy",
          bio: "15 yıllık deneyime sahip veteriner hekim. Hayvan sağlığı ve bakımı konusunda uzmanlaşmış, pek çok hayvansevere danışmanlık vermiştir.",
        })
        .returning()
        .execute();
      
      // Insert blog posts
      for (const post of blogPostsData) {
        await db
          .insert(blogPosts)
          .values({
            authorId: veterinarianAuthor.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            categoryTags: post.categoryTags,
            readTime: post.readTime,
            published: post.published,
          })
          .onConflictDoNothing()
          .execute();
      }
      
      console.log(`✅ Blog posts seeded (${blogPostsData.length} posts)`);
    }
    
    console.log("✅ Database seeded successfully");
  } catch (error) {
    console.error("⚠️  Warning: Error seeding database:", error);
    console.log("Continuing server startup...");
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
