import { db } from "./db";
import { categories, locations, blogPosts, storeCategories, users, categoryDocumentRequirements } from "@shared/schema";
import { sql, eq, isNull } from "drizzle-orm";
import { turkeyLocations } from "./data/locations-turkey-full";
import { blogPosts as blogPostsData } from "./data/blog-posts";
import { categoriesHierarchy } from "./data/categories-hierarchy";
import { storeCategories as storeCategoriesData } from "./data/store-categories";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  console.log("🌱 Seeding database...");
  
  try {
    // Check what needs to be seeded (individual checks for each entity)
    const existingCategories = await db.query.categories.findMany({ limit: 1 });
    const existingLocations = await db.query.locations.findMany({ limit: 1 });
    const existingBlogPosts = await db.query.blogPosts.findMany({ limit: 1 });
    
    // Seed categories from hierarchical structure (force re-seed to update)
    const allDbCategories = await db.query.categories.findMany({});
    console.log(`📁 Current categories in DB: ${allDbCategories.length}, will sync with ${categoriesHierarchy.length} categories`);
    
    // Always sync categories to ensure:
    // 1. New categories are added
    // 2. Wrong parent relationships are fixed (e.g., Kıl Keçisi in wrong category)
    // 3. Orphaned categories from old hierarchy are removed
    console.log(`📁 Syncing categories (${categoriesHierarchy.length} total)...`);
    
    // Deduplicate categories by slug (keep first occurrence)
    const seenSlugs = new Set<string>();
    const uniqueCategories = categoriesHierarchy.filter(cat => {
      if (seenSlugs.has(cat.slug)) {
        console.log(`  ⚠️ Duplicate slug skipped: ${cat.slug}`);
        return false;
      }
      seenSlugs.add(cat.slug);
      return true;
    });
    
    console.log(`  📁 Unique categories from hierarchy: ${uniqueCategories.length}`);
    
    // Create a map of valid category IDs from hierarchy
    const validCategoryIds = new Set(uniqueCategories.map(c => c.id));
    const validCategorySlugs = new Set(uniqueCategories.map(c => c.slug));
    
    // Find orphaned categories (in DB but not in hierarchy file)
    const orphanedCategories = allDbCategories.filter(dbCat => !validCategorySlugs.has(dbCat.slug));
    
    if (orphanedCategories.length > 0) {
      console.log(`  🗑️ Found ${orphanedCategories.length} orphaned categories to remove:`);
      orphanedCategories.forEach(c => console.log(`     - ${c.name} (${c.slug})`));
      
      // First, check if any listings use these categories
      for (const orphan of orphanedCategories) {
        try {
          // Delete orphaned category (listings should cascade or be handled separately)
          await db.delete(categories).where(eq(categories.id, orphan.id)).execute();
          console.log(`  ✅ Removed: ${orphan.name}`);
        } catch (err: any) {
          console.log(`  ⚠️ Could not remove ${orphan.name}: ${err.message}`);
        }
      }
    }
    
    // Insert/Update categories one by one
    let inserted = 0;
    let updated = 0;
    const existingDbSlugs = new Set(allDbCategories.map(c => c.slug));
    
    for (const cat of uniqueCategories) {
      const isUpdate = existingDbSlugs.has(cat.slug);
      try {
        await db
          .insert(categories)
          .values(cat)
          .onConflictDoUpdate({
            target: categories.slug,
            set: {
              name: cat.name,
              description: cat.description,
              icon: cat.icon,
              order: cat.order,
              parentId: cat.parentId,
              depth: cat.depth,
              path: cat.path,
            },
          })
          .execute();
        if (isUpdate) {
          updated++;
        } else {
          inserted++;
        }
      } catch (err: any) {
        console.log(`  ⚠️ Error syncing ${cat.slug}: ${err.message}`);
      }
      
      if ((inserted + updated) % 100 === 0) {
        console.log(`  - Processed ${inserted + updated} / ${uniqueCategories.length}`);
      }
    }
    console.log(`  - Processed ${inserted + updated} / ${uniqueCategories.length} (${inserted} new, ${updated} updated)`);
    
    // Count by depth for stats
    const depth0 = categoriesHierarchy.filter(c => c.depth === 0).length;
    const depth1 = categoriesHierarchy.filter(c => c.depth === 1).length;
    const depth2 = categoriesHierarchy.filter(c => c.depth === 2).length;
    const depth3 = categoriesHierarchy.filter(c => c.depth === 3).length;
    
    console.log(`✅ Categories synced: ${uniqueCategories.length} total`);
    console.log(`   - Depth 0 (Main): ${depth0}`);
    console.log(`   - Depth 1: ${depth1}`);
    console.log(`   - Depth 2: ${depth2}`);
    console.log(`   - Depth 3: ${depth3}`);
    
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
          firstName: "Veteriner",
          lastName: "Editörü",
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
    
    // Realistic publication dates (June - November 2025, varied distribution)
    const blogPublicationDates = [
      "2025-06-01T15:25:00.000Z", "2025-06-07T09:32:00.000Z", "2025-06-12T12:38:00.000Z",
      "2025-06-16T09:58:00.000Z", "2025-06-18T13:42:00.000Z", "2025-06-23T14:47:00.000Z",
      "2025-06-27T15:09:00.000Z", "2025-07-01T12:23:00.000Z", "2025-07-04T17:12:00.000Z",
      "2025-07-10T10:34:00.000Z", "2025-07-15T11:40:00.000Z", "2025-07-20T11:13:00.000Z",
      "2025-07-25T15:25:00.000Z", "2025-07-29T08:42:00.000Z", "2025-08-01T13:10:00.000Z",
      "2025-08-06T08:36:00.000Z", "2025-08-09T15:45:00.000Z", "2025-08-14T12:26:00.000Z",
      "2025-08-19T09:54:00.000Z", "2025-08-22T09:31:00.000Z", "2025-08-25T14:04:00.000Z",
      "2025-08-27T09:19:00.000Z", "2025-08-31T14:20:00.000Z", "2025-09-03T15:35:00.000Z",
      "2025-09-08T12:24:00.000Z", "2025-09-14T14:33:00.000Z", "2025-09-20T17:26:00.000Z",
      "2025-09-24T16:12:00.000Z", "2025-09-27T11:19:00.000Z", "2025-10-03T10:59:00.000Z",
      "2025-10-06T14:01:00.000Z", "2025-10-12T09:04:00.000Z"
    ];
    
    // Upsert all blog posts (insert new, update existing)
    let addedCount = 0;
    let updatedCount = 0;
    const existingSlugs = new Set(allExistingBlogs.map(b => b.slug));
    
    if (!veterinarianAuthor) {
      console.log("⚠️ Blog author not found, skipping blog posts seeding");
      return;
    }
    
    for (let i = 0; i < blogPostsData.length; i++) {
      const post = blogPostsData[i];
      const isNew = !existingSlugs.has(post.slug);
      
      // Use varied publication dates (cycling through if more posts than dates)
      const publishDate = new Date(blogPublicationDates[i % blogPublicationDates.length]);
      
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
          createdAt: publishDate,
          updatedAt: publishDate,
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
            updatedAt: publishDate,
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

    // ============ Seed Store Categories (Hierarchical) ============
    const existingStoreCategories = await db.query.storeCategories.findMany({ limit: 1 });
    if (existingStoreCategories.length === 0) {
      console.log(`🏬 Seeding store categories (${storeCategoriesData.length} items)...`);
      
      await db.insert(storeCategories)
        .values(storeCategoriesData)
        .onConflictDoNothing()
        .execute();
      
      const depth0Count = storeCategoriesData.filter(c => c.depth === 0).length;
      const depth1Count = storeCategoriesData.filter(c => c.depth === 1).length;
      
      console.log(`✅ Store categories seeded: ${storeCategoriesData.length} total`);
      console.log(`   - Main categories (depth 0): ${depth0Count}`);
      console.log(`   - Subcategories (depth 1): ${depth1Count}`);
    }

    // Mağazalar kullanıcılar tarafından oluşturulacak - demo verisi yok
    console.log("⏭️  Stores will be created by users (no demo data)");

    // ============ Seed Category Document Requirements (Turkish Legal Compliance) ============
    const existingDocRequirements = await db.query.categoryDocumentRequirements.findMany({ limit: 1 });
    if (existingDocRequirements.length === 0) {
      console.log("📋 Seeding category document requirements (Turkish legal compliance)...");
      
      const documentRequirementsData = [
        // ========== KÖPEKLER - 5199 sayılı Kanun (14 Temmuz 2022) ==========
        {
          categorySlug: "kopekler",
          documentType: "microchip" as const,
          requirement: "required" as const,
          description: "Mikroçip zorunludur. 15 haneli ISO standardına uygun mikroçip gereklidir.",
          legalReference: "5199 sayılı Hayvanları Koruma Kanunu - Madde 14",
          penaltyInfo: "Mikroçipsiz satış için 5.043 TL idari para cezası"
        },
        {
          categorySlug: "kopekler",
          documentType: "passport" as const,
          requirement: "required" as const,
          description: "Evcil hayvan pasaportu zorunludur. Veteriner tarafından düzenlenir.",
          legalReference: "5199 sayılı Hayvanları Koruma Kanunu - Madde 14",
          penaltyInfo: "Pasaportsuz satış için 5.043 TL idari para cezası"
        },
        {
          categorySlug: "kopekler",
          documentType: "vaccination" as const,
          requirement: "required" as const,
          description: "Kuduz aşısı zorunludur. En az 1 yaşında ve güncel olmalıdır.",
          legalReference: "5199 sayılı Hayvanları Koruma Kanunu",
          penaltyInfo: "Aşısız hayvan satışı yasaktır"
        },
        {
          categorySlug: "kopekler",
          documentType: "health_certificate" as const,
          requirement: "recommended" as const,
          description: "Veteriner sağlık raporu önerilir. Hastalık taraması yapılmış olmalıdır.",
          legalReference: "Tarım ve Orman Bakanlığı Yönetmeliği"
        },
        {
          categorySlug: "kopekler",
          documentType: "pedigree" as const,
          requirement: "optional" as const,
          description: "Soy belgesi (pedigri) safkan köpekler için önerilir.",
          legalReference: "İsteğe bağlı belge"
        },
        
        // ========== KEDİLER - 5199 sayılı Kanun ==========
        {
          categorySlug: "kediler",
          documentType: "microchip" as const,
          requirement: "required" as const,
          description: "Mikroçip zorunludur. 15 haneli ISO standardına uygun mikroçip gereklidir.",
          legalReference: "5199 sayılı Hayvanları Koruma Kanunu - Madde 14",
          penaltyInfo: "Mikroçipsiz satış için 5.043 TL idari para cezası"
        },
        {
          categorySlug: "kediler",
          documentType: "passport" as const,
          requirement: "required" as const,
          description: "Evcil hayvan pasaportu zorunludur. Veteriner tarafından düzenlenir.",
          legalReference: "5199 sayılı Hayvanları Koruma Kanunu - Madde 14",
          penaltyInfo: "Pasaportsuz satış için 5.043 TL idari para cezası"
        },
        {
          categorySlug: "kediler",
          documentType: "vaccination" as const,
          requirement: "required" as const,
          description: "Kuduz ve karma aşıları zorunludur.",
          legalReference: "5199 sayılı Hayvanları Koruma Kanunu"
        },
        {
          categorySlug: "kediler",
          documentType: "health_certificate" as const,
          requirement: "recommended" as const,
          description: "Veteriner sağlık raporu önerilir.",
          legalReference: "Tarım ve Orman Bakanlığı Yönetmeliği"
        },
        {
          categorySlug: "kediler",
          documentType: "pedigree" as const,
          requirement: "optional" as const,
          description: "Soy belgesi safkan kediler için önerilir.",
          legalReference: "İsteğe bağlı belge"
        },
        
        // ========== BÜYÜKBAŞ HAYVANLAR - 5996 sayılı Kanun ==========
        {
          categorySlug: "buyukbas",
          documentType: "turkvet" as const,
          requirement: "required" as const,
          description: "TÜRKVET kayıt belgesi zorunludur. Tarım İl Müdürlüğü'nden alınır.",
          legalReference: "5996 sayılı Veteriner Hizmetleri Kanunu",
          penaltyInfo: "TÜRKVET kaydı olmayan hayvan satışı yasaktır"
        },
        {
          categorySlug: "buyukbas",
          documentType: "ear_tag" as const,
          requirement: "required" as const,
          description: "Kulak küpesi zorunludur. Her hayvanın bireysel tanımlama numarası olmalıdır.",
          legalReference: "5996 sayılı Veteriner Hizmetleri Kanunu",
          penaltyInfo: "Kulak küpesi olmayan hayvan satışı yasaktır"
        },
        {
          categorySlug: "buyukbas",
          documentType: "transport" as const,
          requirement: "required" as const,
          description: "Nakil belgesi zorunludur. Veteriner tarafından düzenlenir.",
          legalReference: "5996 sayılı Veteriner Hizmetleri Kanunu"
        },
        {
          categorySlug: "buyukbas",
          documentType: "health_certificate" as const,
          requirement: "required" as const,
          description: "Sağlık belgesi zorunludur. Bulaşıcı hastalık taraması yapılmış olmalıdır.",
          legalReference: "5996 sayılı Veteriner Hizmetleri Kanunu"
        },
        
        // ========== KÜÇÜKBAŞ HAYVANLAR - 5996 sayılı Kanun ==========
        {
          categorySlug: "kucukbas",
          documentType: "turkvet" as const,
          requirement: "required" as const,
          description: "TÜRKVET kayıt belgesi zorunludur.",
          legalReference: "5996 sayılı Veteriner Hizmetleri Kanunu",
          penaltyInfo: "TÜRKVET kaydı olmayan hayvan satışı yasaktır"
        },
        {
          categorySlug: "kucukbas",
          documentType: "ear_tag" as const,
          requirement: "required" as const,
          description: "Kulak küpesi zorunludur.",
          legalReference: "5996 sayılı Veteriner Hizmetleri Kanunu"
        },
        {
          categorySlug: "kucukbas",
          documentType: "transport" as const,
          requirement: "required" as const,
          description: "Nakil belgesi zorunludur.",
          legalReference: "5996 sayılı Veteriner Hizmetleri Kanunu"
        },
        {
          categorySlug: "kucukbas",
          documentType: "health_certificate" as const,
          requirement: "recommended" as const,
          description: "Sağlık belgesi önerilir.",
          legalReference: "5996 sayılı Veteriner Hizmetleri Kanunu"
        },
        
        // ========== CITES TÜRLER - Papağanlar (2709 sayılı Kanun) ==========
        {
          categorySlug: "jako",
          documentType: "cites" as const,
          requirement: "required" as const,
          description: "CITES belgesi zorunludur. Afrika Gri Papağanı (Jako) CITES Ek-I türüdür.",
          legalReference: "2709 sayılı CITES Sözleşmesi Onay Kanunu",
          penaltyInfo: "CITES belgesi olmadan satış: 50.000-500.000 TL para cezası + hapis cezası"
        },
        {
          categorySlug: "jako",
          documentType: "health_certificate" as const,
          requirement: "recommended" as const,
          description: "Veteriner sağlık raporu önerilir.",
          legalReference: "CITES düzenlemesi"
        },
        {
          categorySlug: "kakadu",
          documentType: "cites" as const,
          requirement: "required" as const,
          description: "CITES belgesi zorunludur. Kakadu türleri CITES koruması altındadır.",
          legalReference: "2709 sayılı CITES Sözleşmesi Onay Kanunu",
          penaltyInfo: "CITES belgesi olmadan satış: 50.000-500.000 TL para cezası + hapis cezası"
        },
        {
          categorySlug: "macaw",
          documentType: "cites" as const,
          requirement: "required" as const,
          description: "CITES belgesi zorunludur. Macaw türleri CITES koruması altındadır.",
          legalReference: "2709 sayılı CITES Sözleşmesi Onay Kanunu",
          penaltyInfo: "CITES belgesi olmadan satış: 50.000-500.000 TL para cezası + hapis cezası"
        },
        {
          categorySlug: "ara-papagan",
          documentType: "cites" as const,
          requirement: "required" as const,
          description: "CITES belgesi zorunludur. Ara Papağan türleri CITES koruması altındadır.",
          legalReference: "2709 sayılı CITES Sözleşmesi Onay Kanunu",
          penaltyInfo: "CITES belgesi olmadan satış: 50.000-500.000 TL para cezası + hapis cezası"
        },
        {
          categorySlug: "amazon-papagani",
          documentType: "cites" as const,
          requirement: "required" as const,
          description: "CITES belgesi zorunludur. Amazon Papağanı türleri CITES koruması altındadır.",
          legalReference: "2709 sayılı CITES Sözleşmesi Onay Kanunu",
          penaltyInfo: "CITES belgesi olmadan satış: 50.000-500.000 TL para cezası + hapis cezası"
        },
        
        // ========== ATLAR ==========
        {
          categorySlug: "atlar",
          documentType: "passport" as const,
          requirement: "required" as const,
          description: "At pasaportu zorunludur. Türkiye Jokey Kulübü veya bakanlık tarafından düzenlenir.",
          legalReference: "At Yarışları Hakkında Kanun ve Yönetmelikler"
        },
        {
          categorySlug: "atlar",
          documentType: "microchip" as const,
          requirement: "required" as const,
          description: "Mikroçip zorunludur. At pasaportu ile birlikte verilir.",
          legalReference: "At Yarışları Hakkında Kanun ve Yönetmelikler"
        },
        {
          categorySlug: "atlar",
          documentType: "health_certificate" as const,
          requirement: "recommended" as const,
          description: "Veteriner sağlık raporu önerilir.",
          legalReference: "Tarım ve Orman Bakanlığı Yönetmeliği"
        },
        {
          categorySlug: "atlar",
          documentType: "pedigree" as const,
          requirement: "optional" as const,
          description: "Soy belgesi safkan atlar için önerilir.",
          legalReference: "Türkiye Jokey Kulübü"
        }
      ];
      
      for (const req of documentRequirementsData) {
        try {
          await db
            .insert(categoryDocumentRequirements)
            .values(req)
            .onConflictDoNothing()
            .execute();
        } catch (err: any) {
          console.log(`  ⚠️ Error inserting requirement ${req.categorySlug}-${req.documentType}: ${err.message}`);
        }
      }
      
      console.log(`✅ Category document requirements seeded: ${documentRequirementsData.length} requirements`);
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
