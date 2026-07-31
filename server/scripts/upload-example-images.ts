import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { objectStorage, isObjectStorageConfigured } from "../objectStorage";

async function uploadExampleImages() {
  if (!isObjectStorageConfigured()) {
    console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tanımlı değil (.env)");
    process.exit(1);
  }

  const stockImagesDir = path.join(process.cwd(), "attached_assets/stock_images");

  if (!fs.existsSync(stockImagesDir)) {
    console.error("Örnek görsel klasörü bulunamadı:", stockImagesDir);
    process.exit(1);
  }

  const files = fs
    .readdirSync(stockImagesDir)
    .filter((f) => f.endsWith(".jpg") || f.endsWith(".png"));
  console.log(`${files.length} görsel yüklenecek`);

  const uploadedUrls: Record<string, string> = {};

  for (const file of files) {
    const localPath = path.join(stockImagesDir, file);
    const destPath = `public/example-listings/${file}`;

    try {
      const buffer = fs.readFileSync(localPath);
      const objectPath = await objectStorage.uploadBufferAt(
        destPath,
        buffer,
        file.endsWith(".png") ? "image/png" : "image/jpeg"
      );

      uploadedUrls[file] = objectPath;
      console.log(`✅ Yüklendi: ${file}`);
    } catch (error) {
      console.error(`❌ Yüklenemedi ${file}:`, error);
    }
  }

  console.log("\n📋 Yüklenen yollar:");
  console.log(JSON.stringify(uploadedUrls, null, 2));

  return uploadedUrls;
}

uploadExampleImages().catch(console.error);
