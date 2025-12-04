import { Storage } from "@google-cloud/storage";
import * as fs from "fs";
import * as path from "path";

const storage = new Storage();

async function uploadExampleImages() {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) {
    console.error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");
    process.exit(1);
  }

  const bucket = storage.bucket(bucketId);
  const stockImagesDir = path.join(process.cwd(), "attached_assets/stock_images");
  
  if (!fs.existsSync(stockImagesDir)) {
    console.error("Stock images directory not found:", stockImagesDir);
    process.exit(1);
  }

  const files = fs.readdirSync(stockImagesDir).filter(f => f.endsWith(".jpg") || f.endsWith(".png"));
  console.log(`Found ${files.length} images to upload`);

  const uploadedUrls: Record<string, string> = {};

  for (const file of files) {
    const localPath = path.join(stockImagesDir, file);
    const destPath = `public/example-listings/${file}`;
    
    try {
      await bucket.upload(localPath, {
        destination: destPath,
        metadata: {
          contentType: file.endsWith(".png") ? "image/png" : "image/jpeg",
        },
      });
      
      const publicUrl = `https://storage.googleapis.com/${bucketId}/${destPath}`;
      uploadedUrls[file] = publicUrl;
      console.log(`✅ Uploaded: ${file}`);
    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error);
    }
  }

  console.log("\n📋 Uploaded URLs:");
  console.log(JSON.stringify(uploadedUrls, null, 2));
  
  return uploadedUrls;
}

uploadExampleImages().catch(console.error);
