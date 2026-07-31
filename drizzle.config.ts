import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Migration'lar doğrudan bağlantı ister (transaction pooler prepared statement
// desteklemez). DIRECT_URL varsa onu, yoksa DATABASE_URL'i kullan.
const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL (veya DIRECT_URL) tanımlı değil — .env dosyanızı doldurun."
  );
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url,
    ssl: /supabase|neon|render|railway|amazonaws/.test(url)
      ? { rejectUnauthorized: false }
      : undefined,
  },
});
