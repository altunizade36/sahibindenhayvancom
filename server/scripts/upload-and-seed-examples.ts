import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, listings, categories } from "../../shared/schema";
import { exampleListings } from "../data/example-listings";
import { ObjectStorageService } from "../objectStorage";

async function uploadAndSeedExamples() {
  console.log("🖼️ Uploading example images to Object Storage...\n");
  
  const objectStorage = new ObjectStorageService();
  const stockImagesDir = path.join(process.cwd(), "attached_assets/stock_images");
  
  if (!fs.existsSync(stockImagesDir)) {
    console.error("❌ Stock images directory not found:", stockImagesDir);
    process.exit(1);
  }

  // Upload images and track URLs
  const imageUrls: Record<string, string> = {};
  const files = fs.readdirSync(stockImagesDir).filter(f => f.endsWith(".jpg") || f.endsWith(".png"));
  
  console.log(`📁 Found ${files.length} images to upload`);

  for (const file of files) {
    const localPath = path.join(stockImagesDir, file);
    
    try {
      const fileBuffer = fs.readFileSync(localPath);
      const contentType = file.endsWith(".png") ? "image/png" : "image/jpeg";
      
      // Use the ObjectStorageService which uploads to the correct private directory
      const objectUrl = await objectStorage.uploadFileBuffer(fileBuffer, contentType);
      
      imageUrls[file] = objectUrl;
      console.log(`✅ Uploaded: ${file} -> ${objectUrl}`);
    } catch (error) {
      console.error(`❌ Error uploading ${file}:`, error);
    }
  }

  console.log(`\n📋 Uploaded ${Object.keys(imageUrls).length} images\n`);

  // Now seed the listings
  console.log("🌱 Seeding example listings...\n");

  // Get all categories from database
  const allCategories = await db.select().from(categories);
  
  if (allCategories.length === 0) {
    console.error("❌ No categories found in database!");
    process.exit(1);
  }

  console.log(`✅ Found ${allCategories.length} categories in database`);

  // Create or get example seller
  const existingUser = await db.select().from(users).where(eq(users.username, "ornek_satici")).limit(1);
  
  let sellerId: string;
  
  if (existingUser.length === 0) {
    const hashedPassword = await bcrypt.hash("ornek2025", 10);
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
  await db.delete(listings).where(eq(listings.isExampleListing, true));
  console.log(`🗑️ Deleted old example listings`);

  // Create category slug to ID mapping
  const categorySlugToId: Record<string, string> = {};
  for (const cat of allCategories) {
    categorySlugToId[cat.slug] = cat.id;
    // Also add partial matches
    const slugParts = cat.slug.split('-');
    for (const part of slugParts) {
      if (part.length > 3 && !categorySlugToId[part]) {
        categorySlugToId[part] = cat.id;
      }
    }
  }

  // Find best matching category
  function findCategoryId(mainCategory: string, categorySlug: string): string {
    // Try exact slug match first
    if (categorySlugToId[categorySlug]) {
      return categorySlugToId[categorySlug];
    }
    
    // Try main category
    if (categorySlugToId[mainCategory]) {
      return categorySlugToId[mainCategory];
    }

    // Try partial match
    const matching = allCategories.find(c => 
      c.slug.includes(categorySlug) || 
      categorySlug.includes(c.slug.replace(/-/g, '')) ||
      c.name.toLowerCase().includes(categorySlug.replace(/-/g, ' '))
    );
    
    if (matching) {
      return matching.id;
    }

    // Return main category id or first available
    return mainCategory || allCategories[0].id;
  }

  // Prepare listings with images
  const listingsToCreate = exampleListings.map((example, index) => {
    const categoryId = findCategoryId(example.mainCategory, example.categorySlug);
    const imageUrl = imageUrls[example.imageFile] || '';
    
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
      exampleSource: example.exampleSource || "Piyasa Araştırması 2025",
      views: Math.floor(Math.random() * 300) + 50,
      images: imageUrl ? [imageUrl] : [],
    };
  });

  // Insert listings
  let insertedCount = 0;
  for (const listing of listingsToCreate) {
    try {
      await db.insert(listings).values(listing);
      insertedCount++;
      console.log(`✅ Created: ${listing.title.substring(0, 50)}...`);
    } catch (error) {
      console.error(`❌ Error creating listing:`, error);
    }
  }

  console.log(`\n🎉 Successfully seeded ${insertedCount} example listings with images!`);
  console.log(`\n📊 2025 Güncel Piyasa Fiyatları kullanıldı:
  - Büyükbaş: Holstein düve ₺165-195K, Süt ineği ₺185-230K
  - Küçükbaş: Merinos ₺12-15K, Saanen keçi ₺10-13K
  - Atlar: Safkan Arap ₺800K-1.5M
  - Köpekler: Golden ₺25-40K, Kangal ₺60-90K
  - Kediler: British ₺22-35K, Scottish ₺28-45K
  `);
  
  process.exit(0);
}

uploadAndSeedExamples().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
