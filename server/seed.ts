import { db } from "./db";
import { categories, locations, users, blogPosts } from "@shared/schema";
import { sql, eq, isNull } from "drizzle-orm";
import { turkeyLocations } from "./data/locations-turkey-full";
import { blogPosts as blogPostsData } from "./data/blog-posts";
import { categoriesHierarchy } from "./data/categories-hierarchy";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  console.log("🌱 Seeding database...");
  
  try {
    // Check what needs to be seeded (individual checks for each entity)
    const existingCategories = await db.query.categories.findMany({ limit: 1 });
    const existingLocations = await db.query.locations.findMany({ limit: 1 });
    const existingBlogPosts = await db.query.blogPosts.findMany({ limit: 1 });
    
    // Seed categories from hierarchical structure (force re-seed to update)
    const categoryCount = await db.query.categories.findMany({});
    console.log(`📁 Current categories in DB: ${categoryCount.length}, will seed ${categoriesHierarchy.length} categories`);
    
    // Force re-seed to ensure all 431 categories are loaded
    if (categoryCount.length < categoriesHierarchy.length) {
      console.log(`📁 Seeding/updating categories (${categoriesHierarchy.length} total)...`);
      
      // Insert all categories with their pre-calculated hierarchy info
      // Batch insert for performance
      const batchSize = 100;
      for (let i = 0; i < categoriesHierarchy.length; i += batchSize) {
        const batch = categoriesHierarchy.slice(i, i + batchSize);
        await db
          .insert(categories)
          .values(batch)
          .onConflictDoUpdate({
            target: categories.slug,
            set: {
              name: sql`excluded.name`,
              description: sql`excluded.description`,
              icon: sql`excluded.icon`,
              order: sql`excluded.order`,
              parentId: sql`excluded.parent_id`,
              depth: sql`excluded.depth`,
              path: sql`excluded.path`,
            },
          })
          .execute();
        
        if ((i + batchSize) % 200 === 0 || i + batchSize >= categoriesHierarchy.length) {
          console.log(`  - Inserted ${Math.min(i + batchSize, categoriesHierarchy.length)} / ${categoriesHierarchy.length}`);
        }
      }
      
      // Count by depth for stats
      const depth0 = categoriesHierarchy.filter(c => c.depth === 0).length;
      const depth1 = categoriesHierarchy.filter(c => c.depth === 1).length;
      const depth2 = categoriesHierarchy.filter(c => c.depth === 2).length;
      const depth3 = categoriesHierarchy.filter(c => c.depth === 3).length;
      
      console.log(`✅ Categories seeded: ${categoriesHierarchy.length} total`);
      console.log(`   - Depth 0 (Main): ${depth0}`);
      console.log(`   - Depth 1: ${depth1}`);
      console.log(`   - Depth 2: ${depth2}`);
      console.log(`   - Depth 3: ${depth3}`);
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
    
    // Seed blog posts (with veterinarian author) - Always check and add missing ones
    console.log("📝 Checking blog posts...");
    
    // Check if blog editor author already exists
    let veterinarianAuthor = await db.query.users.findFirst({
      where: eq(users.email, "blog@sahibindenhayvan.com"),
    });
    
    if (!veterinarianAuthor) {
      console.log("Creating blog editor author...");
      const hashedPassword = await bcrypt.hash("blog123secure", 10);
      const [newAuthor] = await db
        .insert(users)
        .values({
          username: "veteriner-editoru",
          email: "blog@sahibindenhayvan.com",
          password: hashedPassword,
          fullName: "Veteriner Editörü",
          role: "vet",
          phone: null,
          city: "İstanbul",
          district: null,
          bio: "Sahibindenhayvan.com blog editör ekibi. İçeriklerimiz veteriner hekimler ve hayvan sağlığı uzmanlarının denetiminde, güncel bilimsel kaynaklardan derlenmiştir.",
        })
        .returning()
        .execute();
      veterinarianAuthor = newAuthor;
      console.log("✅ Blog editor author created");
    } else {
      console.log("✅ Blog editor author already exists");
    }
    
    // Get all existing blog posts
    const allExistingBlogs = await db.query.blogPosts.findMany();
    
    console.log(`Found ${allExistingBlogs.length} existing blog posts in DB, syncing with ${blogPostsData.length} from file...`);
    
    // Upsert all blog posts (insert new, update existing)
    let addedCount = 0;
    let updatedCount = 0;
    const existingSlugs = new Set(allExistingBlogs.map(b => b.slug));
    
    for (const post of blogPostsData) {
      const isNew = !existingSlugs.has(post.slug);
      
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
        .onConflictDoUpdate({
          target: blogPosts.slug,
          set: {
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            categoryTags: post.categoryTags,
            readTime: post.readTime,
            published: post.published,
          },
        })
        .execute();
      
      if (isNew) {
        addedCount++;
        console.log(`  ➕ Added: ${post.title}`);
      } else {
        updatedCount++;
        console.log(`  🔄 Updated: ${post.title}`);
      }
    }
    
    console.log(`✅ Blog posts synced: ${addedCount} new, ${updatedCount} updated, ${blogPostsData.length} total`);
    
    // Clean up any orphaned blog posts not in the file
    const fileSlugs = new Set(blogPostsData.map(p => p.slug));
    const orphanedBlogs = allExistingBlogs.filter(b => !fileSlugs.has(b.slug));
    if (orphanedBlogs.length > 0) {
      console.log(`⚠️  Found ${orphanedBlogs.length} orphaned blog posts in DB (not in file):`, orphanedBlogs.map(b => b.slug).join(", "));
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
