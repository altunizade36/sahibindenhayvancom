import { sql, relations } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  integer, 
  timestamp, 
  boolean, 
  decimal,
  pgEnum,
  jsonb,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "buyer",
  "seller",
  "vet",
  "transporter",
  "admin"
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "draft",
  "pending",
  "active",
  "rejected",
  "sold",
  "expired",
  "deleted"
]);

export const auctionStatusEnum = pgEnum("auction_status", [
  "upcoming",
  "live",
  "ended",
  "seller_approval",
  "completed",
  "cancelled"
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "issued",
  "paid",
  "cancelled",
]);

export const streamStatusEnum = pgEnum("stream_status", [
  "scheduled",
  "live",
  "ended"
]);

export const storeTypeEnum = pgEnum("store_type", [
  "petshop",           // Pet shop mağazası
  "feed_producer",     // Yem & Mama Üreticisi
  "farm_equipment",    // Çiftlik Ekipmanı Satıcısı
  "veterinary",        // Veteriner Kliniği
  "transport",         // Nakliye & Lojistik Firması
  "beekeeping",        // Arıcılık Malzeme Mağazası
  "horse_riding",      // At & Binicilik Mağazası
  "exotic",            // Egzotik Hayvan Mağazası
  "grooming",          // Pet Kuaförü
  "other"              // Diğer
]);

export const storeStatusEnum = pgEnum("store_status", [
  "draft",             // Taslak - henüz tamamlanmamış
  "pending",           // Onay bekliyor
  "active",            // Aktif mağaza
  "suspended",         // Askıya alınmış
  "closed"             // Kapatılmış
]);

export const listingSourceEnum = pgEnum("listing_source", [
  "individual",        // Bireysel satıcı (şahıs)
  "store"              // Mağaza ilanı (dükkan)
]);

export const messageStatusEnum = pgEnum("message_status", [
  "sent",
  "delivered",
  "read"
]);

export const messageTypeEnum = pgEnum("message_type", [
  "text",           // Normal metin mesajı
  "image",          // Resim mesajı
  "file",           // Dosya eki
  "system",         // Sistem mesajı (ilan paylaşımı vs)
  "offer"           // Teklif mesajı
]);

export const sellerLevelEnum = pgEnum("seller_level", [
  "bronze",
  "silver", 
  "gold",
  "platinum",
  "diamond"
]);

export const offerStatusEnum = pgEnum("offer_status", [
  "pending",
  "accepted",
  "rejected",
  "countered",
  "expired",
  "withdrawn"
]);

export const locationTypeEnum = pgEnum("location_type", [
  "il",        // Province
  "ilce",      // District
  "mahalle",   // Neighborhood
  "koy"        // Village
]);

// Document verification status
export const documentStatusEnum = pgEnum("document_status", [
  "pending",     // Beklemede - yeni yüklendi
  "verified",    // Onaylandı - admin tarafından doğrulandı
  "rejected",    // Reddedildi - geçersiz belge
  "expired"      // Süresi dolmuş
]);

// Document types for animals
export const documentTypeEnum = pgEnum("document_type", [
  "microchip",           // Mikroçip belgesi
  "passport",            // Evcil hayvan pasaportu
  "vaccination",         // Aşı kartı/belgesi
  "health_certificate",  // Veteriner sağlık raporu
  "pedigree",            // Soy belgesi
  "cites",               // CITES belgesi (egzotik/korumalı türler)
  "turkvet",             // TÜRKVET kayıt belgesi
  "transport",           // Nakil belgesi
  "ear_tag",             // Kulak küpesi belgesi
  "breeding_permit",     // Üretim izni belgesi
  "dkmp_permit",         // DKMP izin belgesi (yabani hayvanlar)
  "import_permit",       // İthalat izni
  "other"                // Diğer belgeler
]);

// Category document requirements - which documents are needed for which category types
export const categoryDocumentRequirementEnum = pgEnum("category_document_requirement", [
  "required",     // Zorunlu - bu belge olmadan ilan verilemez
  "recommended",  // Önerilen - ilanın onaylanma şansını artırır
  "optional"      // İsteğe bağlı
]);

// User account status enum
export const userStatusEnum = pgEnum("user_status", [
  "active",      // Normal aktif kullanıcı
  "banned",      // Yasaklanmış
  "suspended",   // Geçici askıya alınmış
]);

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Users table (Hybrid Auth: Replit Auth + Email/Password)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique(),
  username: varchar("username").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default("buyer"),
  phone: text("phone").unique(),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  city: text("city"),
  district: text("district"),
  bio: text("bio"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  verificationToken: varchar("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  
  // Firebase Authentication
  firebaseUid: varchar("firebase_uid").unique(),
  
  // Seller stats & level system
  sellerLevel: sellerLevelEnum("seller_level").default("bronze"),
  totalListings: integer("total_listings").default(0),
  totalSales: integer("total_sales").default(0),
  totalViews: integer("total_views").default(0),
  responseRate: integer("response_rate").default(100), // Percentage 0-100
  avgResponseTime: integer("avg_response_time"), // Minutes
  positiveReviews: integer("positive_reviews").default(0),
  negativeReviews: integer("negative_reviews").default(0),
  sellerScore: integer("seller_score").default(0), // Computed score for level
  sellerRating: decimal("seller_rating", { precision: 3, scale: 2 }).default("0"), // 0.00 - 5.00 ortalama puan
  sellerReviewCount: integer("seller_review_count").default(0), // Toplam değerlendirme sayısı
  badges: jsonb("badges").$type<string[]>().default(sql`'[]'::jsonb`), // Achievement badges
  
  // Language preference
  preferredLanguage: text("preferred_language").default("tr"), // tr or en
  
  // Account status (for ban/suspend functionality)
  status: userStatusEnum("status").default("active").notNull(),
  statusChangedAt: timestamp("status_changed_at"),
  statusChangedBy: varchar("status_changed_by"),
  statusReason: text("status_reason"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  roleIdx: index("users_role_idx").on(table.role),
  cityIdx: index("users_city_idx").on(table.city),
  createdAtIdx: index("users_created_at_idx").on(table.createdAt),
  statusIdx: index("users_status_idx").on(table.status),
}));

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// Phone Verification OTP table
export const phoneVerifications = pgTable("phone_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  purpose: varchar("purpose", { length: 20 }).notNull().default("login"), // login, register, verify
  attempts: integer("attempts").default(0).notNull(),
  verified: boolean("verified").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPhoneVerificationSchema = createInsertSchema(phoneVerifications).omit({
  id: true,
  createdAt: true,
});

export type InsertPhoneVerification = z.infer<typeof insertPhoneVerificationSchema>;
export type PhoneVerification = typeof phoneVerifications.$inferSelect;

// User Settings table - stores all user preferences
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  
  // Notification preferences
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  smsNotifications: boolean("sms_notifications").default(true).notNull(),
  pushNotifications: boolean("push_notifications").default(true).notNull(),
  notifyMessages: boolean("notify_messages").default(true).notNull(),
  notifyFavorites: boolean("notify_favorites").default(true).notNull(),
  notifyPriceDrops: boolean("notify_price_drops").default(true).notNull(),
  notifyListingUpdates: boolean("notify_listing_updates").default(true).notNull(),
  notifyPromotions: boolean("notify_promotions").default(false).notNull(),
  notifyNewsletter: boolean("notify_newsletter").default(false).notNull(),
  
  // Privacy settings
  showEmail: boolean("show_email").default(false).notNull(),
  showPhone: boolean("show_phone").default(true).notNull(),
  showLocation: boolean("show_location").default(true).notNull(),
  showOnlineStatus: boolean("show_online_status").default(true).notNull(),
  allowMessages: boolean("allow_messages").default(true).notNull(),
  profileVisibility: varchar("profile_visibility", { length: 20 }).default("public").notNull(), // public, private, contacts
  
  // Listing defaults
  defaultCity: text("default_city"),
  defaultDistrict: text("default_district"),
  defaultCategoryId: varchar("default_category_id"),
  autoRenewListings: boolean("auto_renew_listings").default(false).notNull(),
  
  // Display preferences
  theme: varchar("theme", { length: 10 }).default("system").notNull(), // light, dark, system
  language: varchar("language", { length: 5 }).default("tr").notNull(),
  currency: varchar("currency", { length: 3 }).default("TRY").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

// User Devices table - for device management and security
export const userDevices = pgTable("user_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceName: varchar("device_name", { length: 100 }),
  deviceType: varchar("device_type", { length: 50 }), // mobile, desktop, tablet
  browser: varchar("browser", { length: 100 }),
  os: varchar("os", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  location: varchar("location", { length: 200 }),
  lastActive: timestamp("last_active").defaultNow().notNull(),
  isTrusted: boolean("is_trusted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserDeviceSchema = createInsertSchema(userDevices).omit({
  id: true,
  createdAt: true,
});

export type InsertUserDevice = z.infer<typeof insertUserDeviceSchema>;
export type UserDevice = typeof userDevices.$inferSelect;

// Login History table - for security audit
export const loginHistory = pgTable("login_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  loginMethod: varchar("login_method", { length: 30 }).notNull(), // email, phone, google, replit
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  location: varchar("location", { length: 200 }),
  success: boolean("success").default(true).notNull(),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("login_history_user_id_idx").on(table.userId),
  createdAtIdx: index("login_history_created_at_idx").on(table.createdAt),
}));

export const insertLoginHistorySchema = createInsertSchema(loginHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertLoginHistory = z.infer<typeof insertLoginHistorySchema>;
export type LoginHistory = typeof loginHistory.$inferSelect;

// Categories table (hierarchical with depth and path support)
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  parentId: varchar("parent_id").references((): any => categories.id, { onDelete: "set null" }), // Self-reference
  icon: text("icon"),
  image: text("image"),
  description: text("description"),
  order: integer("order").default(0),
  depth: integer("depth").default(0).notNull(), // 0 for root categories
  path: jsonb("path").$type<string[]>().notNull().default(sql`'[]'::jsonb`), // Array of ancestor IDs
}, (table) => ({
  parentIdIdx: index("categories_parent_id_idx").on(table.parentId),
  depthOrderIdx: index("categories_depth_order_idx").on(table.depth, table.order),
}));

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Store Categories table (hierarchical professional business classification)
// Example: Petshop Mağazası > Kedi & Köpek Mağazası
export const storeCategories = pgTable("store_categories", {
  id: varchar("id").primaryKey(),
  parentId: varchar("parent_id").references((): any => storeCategories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  depth: integer("depth").default(0).notNull(),
  order: integer("order").default(0),
});

export const insertStoreCategorySchema = createInsertSchema(storeCategories);

export type InsertStoreCategory = z.infer<typeof insertStoreCategorySchema>;
export type StoreCategory = typeof storeCategories.$inferSelect;

// Locations table (hierarchical: il -> ilçe -> mahalle -> köy)
// Must be defined before listings to allow foreign key reference
export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  type: locationTypeEnum("type").notNull(),
  parentId: varchar("parent_id").references((): any => locations.id, { onDelete: "set null" }), // Self-reference
  code: text("code"), // Postal or administrative code
  depth: integer("depth").default(0).notNull(), // 0=il, 1=ilçe, 2=mahalle, 3=köy
  path: jsonb("path").$type<string[]>().notNull().default(sql`'[]'::jsonb`), // Array of ancestor IDs
  order: integer("order").default(0),
}, (table) => ({
  // Composite index for efficient cascading queries (parent → children by type)
  parentTypeIdx: index("locations_parent_type_idx").on(table.parentId, table.type),
  // Index for type-only queries (e.g., get all provinces)
  typeIdx: index("locations_type_idx").on(table.type),
}));

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
});

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

// Listings table
export const listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  storeId: varchar("store_id").references((): any => stores.id, { onDelete: "set null" }), // Optional store association
  listingSource: listingSourceEnum("listing_source").default("individual").notNull(), // NEW: individual vs store
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  breed: text("breed"),
  age: text("age"),
  gender: text("gender"),
  healthStatus: text("health_status"),
  vaccinated: boolean("vaccinated").default(false),
  neutered: boolean("neutered").default(false),
  pedigree: boolean("pedigree").default(false),
  pedigreeDocument: text("pedigree_document"),
  healthDocuments: jsonb("health_documents").$type<string[]>().default([]),
  characterTraits: jsonb("character_traits").$type<string[]>().default([]),
  ageCategory: text("age_category"),
  // Enhanced listing fields
  videoUrls: jsonb("video_urls").$type<string[]>().default([]), // YouTube, Vimeo, etc.
  categoryAttributes: jsonb("category_attributes").$type<Record<string, any>>().default({}), // Category-specific fields
  // Pedigree/lineage info for pets
  microchipNumber: text("microchip_number"), // Mikroçip numarası
  passportNumber: text("passport_number"), // Pasaport numarası
  // Livestock-specific fields  
  earTagNumber: text("ear_tag_number"), // Kulak küpesi numarası
  turkvetNumber: text("turkvet_number"), // TÜRKVET kayıt numarası
  // Seller notes
  deliveryInfo: text("delivery_info"), // Teslimat bilgisi
  warrantyInfo: text("warranty_info"), // Garanti bilgisi
  locationId: varchar("location_id").references(() => locations.id, { onDelete: "set null" }),
  city: text("city").notNull(), // Denormalized for backward compatibility (should sync with locationId)
  district: text("district").notNull(), // Denormalized for backward compatibility
  status: listingStatusEnum("status").default("pending"),
  isPremium: boolean("is_premium").default(false),
  isUrgent: boolean("is_urgent").default(false),
  views: integer("views").default(0),
  favoriteCount: integer("favorite_count").default(0),
  shareCount: integer("share_count").default(0),
  allowOffers: boolean("allow_offers").default(true), // Allow "Make Offer" on this listing
  moderationReason: text("moderation_reason"),
  moderatedBy: varchar("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  categoryStatusCreatedIdx: index("listings_category_status_created_idx").on(table.categoryId, table.status, table.createdAt),
  locationCreatedIdx: index("listings_location_created_idx").on(table.locationId, table.createdAt),
  sellerCreatedIdx: index("listings_seller_created_idx").on(table.sellerId, table.createdAt),
  statusPremiumIdx: index("listings_status_premium_idx").on(table.status, table.isPremium),
}));

export const insertListingSchema = createInsertSchema(listings, {
  price: z.union([z.string(), z.number()]).transform(val => String(val)),
  images: z.array(z.string()).optional().default([]),
  healthDocuments: z.array(z.string()).optional().default([]),
  characterTraits: z.array(z.string()).optional().default([]),
  videoUrls: z.array(z.string()).optional().default([]),
  categoryAttributes: z.record(z.any()).optional().default({}),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
});

// Draft listing schema for partial saves (less strict validation)
export const draftListingSchema = z.object({
  categoryId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  price: z.union([z.string(), z.number()]).optional(),
  breed: z.string().optional(),
  age: z.string().optional(),
  ageCategory: z.string().optional(),
  gender: z.string().optional(),
  healthStatus: z.string().optional(),
  vaccinated: z.boolean().optional(),
  neutered: z.boolean().optional(),
  pedigree: z.boolean().optional(),
  characterTraits: z.array(z.string()).optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  images: z.array(z.string()).optional(),
  videoUrls: z.array(z.string()).optional(),
  categoryAttributes: z.record(z.any()).optional(),
  microchipNumber: z.string().optional(),
  passportNumber: z.string().optional(),
  earTagNumber: z.string().optional(),
  turkvetNumber: z.string().optional(),
  deliveryInfo: z.string().optional(),
  warrantyInfo: z.string().optional(),
});

export type DraftListing = z.infer<typeof draftListingSchema>;

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

// Listing Images table - for storing image variants and metadata
export const listingImages = pgTable("listing_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").references(() => listings.id, { onDelete: "cascade" }),
  originalKey: text("original_key").notNull(),
  thumbnailKey: text("thumbnail_key"),
  mediumKey: text("medium_key"),
  largeKey: text("large_key"),
  originalUrl: text("original_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  mediumUrl: text("medium_url"),
  largeUrl: text("large_url"),
  width: integer("width"),
  height: integer("height"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  displayOrder: integer("display_order").default(0),
  isCover: boolean("is_cover").default(false),
  status: text("status").default("processing"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  listingIdx: index("listing_images_listing_idx").on(table.listingId),
  listingOrderIdx: index("listing_images_listing_order_idx").on(table.listingId, table.displayOrder),
}));

export const insertListingImageSchema = createInsertSchema(listingImages).omit({
  id: true,
  createdAt: true,
});

export type InsertListingImage = z.infer<typeof insertListingImageSchema>;
export type ListingImage = typeof listingImages.$inferSelect;

// Listing Documents table - for legal document verification
export const listingDocuments = pgTable("listing_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").references(() => listings.id, { onDelete: "cascade" }),
  documentType: documentTypeEnum("document_type").notNull(),
  documentUrl: text("document_url").notNull(), // Storage URL
  documentKey: text("document_key").notNull(), // Storage key
  documentNumber: text("document_number"), // Belge numarası (mikroçip no, pasaport no vb.)
  issueDate: timestamp("issue_date"), // Belge düzenlenme tarihi
  expiryDate: timestamp("expiry_date"), // Belge geçerlilik tarihi
  issuingAuthority: text("issuing_authority"), // Düzenleyen kurum
  status: documentStatusEnum("status").default("pending"),
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"), // Admin notları
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  listingIdx: index("listing_documents_listing_idx").on(table.listingId),
  statusIdx: index("listing_documents_status_idx").on(table.status),
  typeIdx: index("listing_documents_type_idx").on(table.documentType),
}));

export const insertListingDocumentSchema = createInsertSchema(listingDocuments).omit({
  id: true,
  createdAt: true,
  verifiedBy: true,
  verifiedAt: true,
});

export type InsertListingDocument = z.infer<typeof insertListingDocumentSchema>;
export type ListingDocument = typeof listingDocuments.$inferSelect;

// Category Document Requirements - defines which documents are required for each category
export const categoryDocumentRequirements = pgTable("category_document_requirements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categorySlug: text("category_slug").notNull(), // Category slug (e.g., "kopekler", "kediler")
  documentType: documentTypeEnum("document_type").notNull(),
  requirement: categoryDocumentRequirementEnum("requirement").notNull().default("optional"),
  description: text("description"), // Açıklama (neden gerekli, nasıl alınır)
  legalReference: text("legal_reference"), // Yasal dayanak
  penaltyInfo: text("penalty_info"), // Ceza bilgisi
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index("category_doc_req_category_idx").on(table.categorySlug),
  uniqueReq: index("category_doc_req_unique_idx").on(table.categorySlug, table.documentType),
}));

export const insertCategoryDocumentRequirementSchema = createInsertSchema(categoryDocumentRequirements).omit({
  id: true,
  createdAt: true,
});

export type InsertCategoryDocumentRequirement = z.infer<typeof insertCategoryDocumentRequirementSchema>;
export type CategoryDocumentRequirement = typeof categoryDocumentRequirements.$inferSelect;

// Banned/Restricted Categories - categories that are completely banned or restricted
export const restrictedCategories = pgTable("restricted_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categorySlug: text("category_slug").notNull().unique(),
  restrictionType: text("restriction_type").notNull(), // "banned", "store_only", "individual_only", "cites_required"
  reason: text("reason").notNull(), // Yasaklama/kısıtlama nedeni
  legalReference: text("legal_reference"), // Yasal dayanak
  penaltyAmount: text("penalty_amount"), // Ceza miktarı
  effectiveDate: timestamp("effective_date"), // Yürürlük tarihi
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RestrictedCategory = typeof restrictedCategories.$inferSelect;

// Auctions table
export const auctions = pgTable("auctions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id),
  startPrice: decimal("start_price", { precision: 10, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  buyNowPrice: decimal("buy_now_price", { precision: 10, scale: 2 }),
  minIncrement: decimal("min_increment", { precision: 10, scale: 2 }).notNull().default("10"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: auctionStatusEnum("status").default("upcoming"),
  winnerId: varchar("winner_id").references(() => users.id),
  totalBids: integer("total_bids").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  statusEndTimeIdx: index("auctions_status_end_time_idx").on(table.status, table.endTime),
  listingIdx: index("auctions_listing_idx").on(table.listingId),
}));

export const insertAuctionSchema = createInsertSchema(auctions, {
  startPrice: z.union([z.string(), z.number()]).transform(val => String(val)),
  buyNowPrice: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  minIncrement: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
}).omit({
  id: true,
  createdAt: true,
  currentPrice: true,
  totalBids: true,
  winnerId: true,
});

export type InsertAuction = z.infer<typeof insertAuctionSchema>;
export type Auction = typeof auctions.$inferSelect;

// Bids table
export const bids = pgTable("bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auctionId: varchar("auction_id").notNull().references(() => auctions.id),
  bidderId: varchar("bidder_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  auctionIdx: index("bids_auction_idx").on(table.auctionId),
  bidderIdx: index("bids_bidder_idx").on(table.bidderId),
  auctionAmountIdx: index("bids_auction_amount_idx").on(table.auctionId, table.amount),
}));

export const insertBidSchema = createInsertSchema(bids, {
  amount: z.union([z.string(), z.number()]).transform(val => String(val)),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bids.$inferSelect;

// Offers table (Make Offer feature for regular listings)
export const offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  message: text("message"), // Optional message with the offer
  status: offerStatusEnum("status").default("pending"),
  counterAmount: decimal("counter_amount", { precision: 10, scale: 2 }), // If seller counters
  counterMessage: text("counter_message"),
  expiresAt: timestamp("expires_at"), // Offer expiration
  respondedAt: timestamp("responded_at"), // When seller responded
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  listingIdx: index("offers_listing_idx").on(table.listingId),
  buyerIdx: index("offers_buyer_idx").on(table.buyerId),
  sellerIdx: index("offers_seller_idx").on(table.sellerId),
  statusIdx: index("offers_status_idx").on(table.status),
}));

export const insertOfferSchema = createInsertSchema(offers, {
  amount: z.union([z.string(), z.number()]).transform(val => String(val)),
}).omit({
  id: true,
  createdAt: true,
  status: true,
  counterAmount: true,
  counterMessage: true,
  respondedAt: true,
});

export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offers.$inferSelect;

// Live Streams table
export const liveStreams = pgTable("live_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamerId: varchar("streamer_id").notNull().references(() => users.id),
  listingId: varchar("listing_id").references(() => listings.id),
  title: text("title").notNull(),
  description: text("description"),
  channelName: text("channel_name").notNull(),
  status: streamStatusEnum("status").default("scheduled"),
  scheduledFor: timestamp("scheduled_for"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  viewerCount: integer("viewer_count").default(0),
  peakViewers: integer("peak_viewers").default(0),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("streams_status_idx").on(table.status),
  streamerIdx: index("streams_streamer_idx").on(table.streamerId),
  scheduledIdx: index("streams_scheduled_idx").on(table.scheduledFor),
}));

export const insertLiveStreamSchema = createInsertSchema(liveStreams).omit({
  id: true,
  createdAt: true,
  viewerCount: true,
  peakViewers: true,
  startedAt: true,
  endedAt: true,
});

export type InsertLiveStream = z.infer<typeof insertLiveStreamSchema>;
export type LiveStream = typeof liveStreams.$inferSelect;

// Chat Messages table - Gelişmiş mesajlaşma sistemi
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  listingId: varchar("listing_id").references(() => listings.id),
  conversationId: varchar("conversation_id").notNull(),
  content: text("content").notNull(),
  messageType: messageTypeEnum("message_type").default("text"),
  status: messageStatusEnum("status").default("sent"),
  replyToId: varchar("reply_to_id"),
  attachments: jsonb("attachments").$type<{
    url: string;
    type: "image" | "file";
    name: string;
    size: number;
    thumbnailUrl?: string;
  }[]>().default([]),
  isEdited: boolean("is_edited").default(false),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  editedAt: timestamp("edited_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  senderReceiverCreatedIdx: index("messages_sender_receiver_created_idx").on(table.senderId, table.receiverId, table.createdAt),
  receiverCreatedIdx: index("messages_receiver_created_idx").on(table.receiverId, table.createdAt),
  conversationIdx: index("messages_conversation_idx").on(table.conversationId, table.createdAt),
  replyToIdx: index("messages_reply_to_idx").on(table.replyToId),
}));

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  status: true,
  isEdited: true,
  isDeleted: true,
  deletedAt: true,
  editedAt: true,
  deliveredAt: true,
  readAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Conversations table - Konuşma yönetimi
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participant1Id: varchar("participant1_id").notNull().references(() => users.id),
  participant2Id: varchar("participant2_id").notNull().references(() => users.id),
  listingId: varchar("listing_id").references(() => listings.id),
  lastMessageId: varchar("last_message_id"),
  lastMessageAt: timestamp("last_message_at"),
  participant1Archived: boolean("participant1_archived").default(false),
  participant2Archived: boolean("participant2_archived").default(false),
  participant1Pinned: boolean("participant1_pinned").default(false),
  participant2Pinned: boolean("participant2_pinned").default(false),
  participant1Muted: boolean("participant1_muted").default(false),
  participant2Muted: boolean("participant2_muted").default(false),
  participant1DeletedAt: timestamp("participant1_deleted_at"),
  participant2DeletedAt: timestamp("participant2_deleted_at"),
  participant1UnreadCount: integer("participant1_unread_count").default(0),
  participant2UnreadCount: integer("participant2_unread_count").default(0),
  participant1LastReadAt: timestamp("participant1_last_read_at"),
  participant2LastReadAt: timestamp("participant2_last_read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  participant1Idx: index("conversations_participant1_idx").on(table.participant1Id),
  participant2Idx: index("conversations_participant2_idx").on(table.participant2Id),
  lastMessageIdx: index("conversations_last_message_idx").on(table.lastMessageAt),
  participantsUnique: index("conversations_participants_unique").on(table.participant1Id, table.participant2Id),
}));

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastMessageId: true,
  lastMessageAt: true,
  participant1UnreadCount: true,
  participant2UnreadCount: true,
  participant1LastReadAt: true,
  participant2LastReadAt: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// User presence table - Online durumu ve son görülme
export const userPresence = pgTable("user_presence", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  isOnline: boolean("is_online").default(false),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  currentConversationId: varchar("current_conversation_id"),
  typingInConversationId: varchar("typing_in_conversation_id"),
  typingStartedAt: timestamp("typing_started_at"),
  deviceInfo: text("device_info"),
  socketId: varchar("socket_id"),
});

export type UserPresence = typeof userPresence.$inferSelect;

// Message reactions table - Mesaj tepkileri
export const messageReactions = pgTable("message_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  reaction: varchar("reaction", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  messageUserUnique: index("message_reactions_unique").on(table.messageId, table.userId, table.reaction),
  messageIdx: index("message_reactions_message_idx").on(table.messageId),
}));

export type MessageReaction = typeof messageReactions.$inferSelect;

// Blog Posts table
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  categoryTags: jsonb("category_tags").$type<string[]>().default([]),
  published: boolean("published").default(false),
  views: integer("views").default(0),
  readTime: integer("read_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  publishedCreatedIdx: index("blog_posts_published_created_idx").on(table.published, table.createdAt),
  authorIdx: index("blog_posts_author_idx").on(table.authorId),
}));

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

// Veterinary Services table
export const vetServices = pgTable("vet_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vetId: varchar("vet_id").notNull().references(() => users.id),
  clinicName: text("clinic_name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  district: text("district").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  specializations: jsonb("specializations").$type<string[]>().default([]),
  services: jsonb("services").$type<string[]>().default([]),
  workingHours: text("working_hours"),
  emergencyService: boolean("emergency_service").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: integer("total_reviews").default(0),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  cityIdx: index("vet_services_city_idx").on(table.city),
  cityDistrictIdx: index("vet_services_city_district_idx").on(table.city, table.district),
}));

export const insertVetServiceSchema = createInsertSchema(vetServices).omit({
  id: true,
  createdAt: true,
  rating: true,
  totalReviews: true,
});

export type InsertVetService = z.infer<typeof insertVetServiceSchema>;
export type VetService = typeof vetServices.$inferSelect;

// Transportation Services table
export const transportServices = pgTable("transport_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transporterId: varchar("transporter_id").notNull().references(() => users.id),
  companyName: text("company_name").notNull(),
  serviceAreas: jsonb("service_areas").$type<string[]>().default([]),
  vehicleTypes: jsonb("vehicle_types").$type<string[]>().default([]),
  animalTypes: jsonb("animal_types").$type<string[]>().default([]),
  phone: text("phone").notNull(),
  pricePerKm: decimal("price_per_km", { precision: 10, scale: 2 }),
  minPrice: decimal("min_price", { precision: 10, scale: 2 }),
  insurance: boolean("insurance").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: integer("total_reviews").default(0),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransportServiceSchema = createInsertSchema(transportServices, {
  pricePerKm: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  minPrice: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  serviceAreas: z.array(z.string()).optional().default([]),
  vehicleTypes: z.array(z.string()).optional().default([]),
  animalTypes: z.array(z.string()).optional().default([]),
}).omit({
  id: true,
  createdAt: true,
  rating: true,
  totalReviews: true,
});

export type InsertTransportService = z.infer<typeof insertTransportServiceSchema>;
export type TransportService = typeof transportServices.$inferSelect;

// Reviews table
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id),
  targetId: varchar("target_id").notNull(),
  targetType: text("target_type").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  targetIdx: index("reviews_target_idx").on(table.targetId, table.targetType),
  reviewerIdx: index("reviews_reviewer_idx").on(table.reviewerId),
}));

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Favorites table
export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  listingId: varchar("listing_id").notNull().references(() => listings.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userCreatedIdx: index("favorites_user_created_idx").on(table.userId, table.createdAt),
  userListingUnique: index("favorites_user_listing_unique").on(table.userId, table.listingId),
}));

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

// Saved Searches table (Kayıtlı Aramalar)
export const savedSearches = pgTable("saved_searches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  filters: jsonb("filters").$type<{
    minPrice?: string;
    maxPrice?: string;
    city?: string;
    district?: string;
    categorySlug?: string;
    gender?: string;
    ageCategory?: string;
    breed?: string;
    healthStatus?: string;
    vaccinated?: string;
    neutered?: string;
    pedigree?: string;
    characterTraits?: string[];
    searchQuery?: string;
  }>().notNull(),
  notifyEnabled: boolean("notify_enabled").default(false).notNull(),
  lastNotifiedAt: timestamp("last_notified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("saved_searches_user_idx").on(table.userId),
  notifyIdx: index("saved_searches_notify_idx").on(table.notifyEnabled),
}));

export const insertSavedSearchSchema = createInsertSchema(savedSearches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastNotifiedAt: true,
});

export type InsertSavedSearch = z.infer<typeof insertSavedSearchSchema>;
export type SavedSearch = typeof savedSearches.$inferSelect;

// Notification type enum
export const notificationTypeEnum = pgEnum("notification_type", [
  "new_message",        // Yeni mesaj geldi
  "listing_approved",   // İlan onaylandı
  "listing_rejected",   // İlan reddedildi
  "new_favorite",       // Birisi ilanını favoriledi
  "price_drop",         // Favorideki ilan fiyatı düştü
  "auction_outbid",     // Açık artırmada birisi geçti
  "auction_won",        // Açık artırmayı kazandı
  "auction_ending",     // Açık artırma bitiyor
  "saved_search_match", // Kayıtlı arama eşleşmesi bulundu
  "system",             // Sistem bildirimi
]);

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  relatedId: varchar("related_id"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userReadIdx: index("notifications_user_read_idx").on(table.userId, table.isRead),
  userCreatedIdx: index("notifications_user_created_idx").on(table.userId, table.createdAt),
}));

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Report type enum
export const reportTypeEnum = pgEnum("report_type", [
  "spam",
  "fraud",
  "inappropriate",
  "fake_listing",
  "harassment",
  "copyright",
  "other"
]);

// Report status enum
export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "under_review",
  "resolved",
  "dismissed"
]);

// Reports table
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reportedType: varchar("reported_type").notNull(),
  reportedId: varchar("reported_id").notNull(),
  type: reportTypeEnum("type").notNull(),
  reason: text("reason").notNull(),
  status: reportStatusEnum("status").default("pending").notNull(),
  adminNotes: text("admin_notes"),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  reporterIdx: index("reports_reporter_idx").on(table.reporterId),
  statusIdx: index("reports_status_idx").on(table.status),
  typeIdx: index("reports_type_idx").on(table.type),
}));

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  status: true,
  adminNotes: true,
  resolvedAt: true,
  resolvedBy: true,
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

// Stream Chat Messages table
export const streamChatMessages = pgTable("stream_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").notNull().references(() => liveStreams.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  streamIdx: index("stream_chat_stream_idx").on(table.streamId),
  streamCreatedIdx: index("stream_chat_stream_created_idx").on(table.streamId, table.createdAt),
}));

export const insertStreamChatMessageSchema = createInsertSchema(streamChatMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertStreamChatMessage = z.infer<typeof insertStreamChatMessageSchema>;
export type StreamChatMessage = typeof streamChatMessages.$inferSelect;

// Stream Viewers tracking (for real-time viewer list)
export const streamViewers = pgTable("stream_viewers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").notNull().references(() => liveStreams.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
}, (table) => ({
  streamUserIdx: index("stream_viewer_stream_user_idx").on(table.streamId, table.userId),
  streamUserUnique: index("stream_viewer_unique_active").on(table.streamId, table.userId).where(sql`${table.leftAt} IS NULL`),
}));

export const insertStreamViewerSchema = createInsertSchema(streamViewers).omit({
  id: true,
  joinedAt: true,
});

export type InsertStreamViewer = z.infer<typeof insertStreamViewerSchema>;
export type StreamViewer = typeof streamViewers.$inferSelect;

// Stream Bans table (permanent or temporary bans from stream)
export const streamBans = pgTable("stream_bans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").notNull().references(() => liveStreams.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  bannedBy: varchar("banned_by").notNull().references(() => users.id),
  reason: text("reason"),
  isPermanent: boolean("is_permanent").default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  streamUserUnique: index("stream_ban_stream_user_unique").on(table.streamId, table.userId),
  streamIdx: index("stream_ban_stream_idx").on(table.streamId),
  userIdx: index("stream_ban_user_idx").on(table.userId),
}));

export const insertStreamBanSchema = createInsertSchema(streamBans).omit({
  id: true,
  createdAt: true,
});

export type InsertStreamBan = z.infer<typeof insertStreamBanSchema>;
export type StreamBan = typeof streamBans.$inferSelect;

// Stream Mutes table (mute users from chat)
export const streamMutes = pgTable("stream_mutes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").notNull().references(() => liveStreams.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  mutedBy: varchar("muted_by").notNull().references(() => users.id),
  reason: text("reason"),
  durationMinutes: integer("duration_minutes"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  streamUserUnique: index("stream_mute_stream_user_unique").on(table.streamId, table.userId),
  streamIdx: index("stream_mute_stream_idx").on(table.streamId),
  userIdx: index("stream_mute_user_idx").on(table.userId),
}));

export const insertStreamMuteSchema = createInsertSchema(streamMutes).omit({
  id: true,
  createdAt: true,
});

export type InsertStreamMute = z.infer<typeof insertStreamMuteSchema>;
export type StreamMute = typeof streamMutes.$inferSelect;

// ============ Stores (Mağazalar) System ============

// Store badge enum - Rozet türleri
export const storeBadgeTypeEnum = pgEnum("store_badge_type", [
  "verified",         // ✅ Resmi/Onaylı Satıcı
  "successful",       // ⭐ Başarılı Satıcı (yüksek puan, çok satış)
  "fast_seller",      // 🚀 Hızlı Satıcı (hızlı yanıt)
  "top_rated",        // 🏆 En Çok Beğenilen
  "trusted",          // 🛡️ Güvenilir Satıcı (uzun üyelik)
  "premium",          // 💎 Premium Satıcı
]);

// Stores table - Professional seller/business storefronts
export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(), // URL-friendly store name
  displayName: text("display_name").notNull(), // Store name
  storeType: storeTypeEnum("store_type").notNull(), // Kept for backward compatibility
  categoryId: varchar("category_id").references(() => storeCategories.id), // NEW: Hierarchical category
  summary: text("summary"), // Short description
  description: text("description"), // Full description
  
  // Contact info
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  address: text("address"),
  city: text("city"),
  district: text("district"),
  
  // Branding
  logo: text("logo"), // Object storage key
  banner: text("banner"), // Object storage key
  primaryColor: text("primary_color").default("#0066CC"), // Brand color
  secondaryColor: text("secondary_color").default("#FFA500"),
  bannerTemplate: text("banner_template"), // Hazır şablon ID'si (template-1, template-2, vb.)
  
  // Stats
  totalListings: integer("total_listings").default(0),
  totalSales: integer("total_sales").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  followerCount: integer("follower_count").default(0), // Takipçi sayısı
  viewCount: integer("view_count").default(0), // Görüntülenme sayısı
  responseTime: integer("response_time"), // Ortalama yanıt süresi (dakika)
  
  // Badges - Rozetler (JSON array of badge types)
  badges: jsonb("badges").$type<string[]>().default(sql`'[]'::jsonb`),
  
  // Veteriner/Hizmet profili için ekstra alanlar
  workingHours: jsonb("working_hours").$type<{day: string, open: string, close: string}[]>(),
  services: jsonb("services").$type<string[]>(), // Sunulan hizmetler listesi
  specializations: jsonb("specializations").$type<string[]>(), // Uzmanlık alanları
  
  // Status
  status: storeStatusEnum("status").default("draft").notNull(),
  verifiedAt: timestamp("verified_at"), // Admin verification timestamp
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index("store_owner_idx").on(table.ownerId),
  slugIdx: index("store_slug_idx").on(table.slug),
  typeIdx: index("store_type_idx").on(table.storeType),
  statusIdx: index("store_status_idx").on(table.status),
  cityIdx: index("store_city_idx").on(table.city),
}));

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
  totalListings: true,
  totalSales: true,
  rating: true,
  reviewCount: true,
  followerCount: true,
  viewCount: true,
  responseTime: true,
  badges: true,
  verifiedAt: true,
});

export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;

// Store Followers table - Takipçi sistemi
export const storeFollowers = pgTable("store_followers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  storeIdx: index("store_follower_store_idx").on(table.storeId),
  userIdx: index("store_follower_user_idx").on(table.userId),
  storeUserUnique: index("store_follower_unique").on(table.storeId, table.userId),
}));

export const insertStoreFollowerSchema = createInsertSchema(storeFollowers).omit({
  id: true,
  createdAt: true,
});

export type InsertStoreFollower = z.infer<typeof insertStoreFollowerSchema>;
export type StoreFollower = typeof storeFollowers.$inferSelect;

// Store Media table - Additional images/videos for store gallery
export const storeMedia = pgTable("store_media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'image' | 'video'
  url: text("url").notNull(), // Object storage key
  caption: text("caption"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  storeIdx: index("store_media_store_idx").on(table.storeId),
}));

export const insertStoreMediaSchema = createInsertSchema(storeMedia).omit({
  id: true,
  createdAt: true,
});

export type InsertStoreMedia = z.infer<typeof insertStoreMediaSchema>;
export type StoreMedia = typeof storeMedia.$inferSelect;

// Store Reviews table - Buyer ratings and reviews
export const storeReviews = pgTable("store_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"),
  comment: text("comment"),
  
  // Moderation
  status: text("status").default("pending").notNull(), // pending | approved | rejected
  moderatedBy: varchar("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  storeIdx: index("store_review_store_idx").on(table.storeId),
  reviewerIdx: index("store_review_reviewer_idx").on(table.reviewerId),
  statusIdx: index("store_review_status_idx").on(table.status),
  // Prevent multiple reviews from same user
  storeReviewerUnique: index("store_reviewer_unique").on(table.storeId, table.reviewerId),
}));

export const insertStoreReviewSchema = createInsertSchema(storeReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  moderatedBy: true,
  moderatedAt: true,
}).extend({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Yorum en az 10 karakter olmalı").optional(),
});

export type InsertStoreReview = z.infer<typeof insertStoreReviewSchema>;
export type StoreReview = typeof storeReviews.$inferSelect;

// ============ Relations ============

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  owner: one(users, {
    fields: [stores.ownerId],
    references: [users.id],
  }),
  listings: many(listings),
  reviews: many(storeReviews),
  media: many(storeMedia),
  followers: many(storeFollowers),
}));

export const storeFollowersRelations = relations(storeFollowers, ({ one }) => ({
  store: one(stores, {
    fields: [storeFollowers.storeId],
    references: [stores.id],
  }),
  user: one(users, {
    fields: [storeFollowers.userId],
    references: [users.id],
  }),
}));

export const storeReviewsRelations = relations(storeReviews, ({ one }) => ({
  store: one(stores, {
    fields: [storeReviews.storeId],
    references: [stores.id],
  }),
  reviewer: one(users, {
    fields: [storeReviews.reviewerId],
    references: [users.id],
  }),
}));

export const storeMediaRelations = relations(storeMedia, ({ one }) => ({
  store: one(stores, {
    fields: [storeMedia.storeId],
    references: [stores.id],
  }),
}));

// ============ Audit Logs ============
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, BAN, UNBAN, APPROVE, REJECT
  entity: text("entity").notNull(), // user, listing, store, report, blog, category, settings
  entityId: varchar("entity_id"),
  details: text("details"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  level: text("level").default("info").notNull(), // info, warning, error
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("audit_logs_user_idx").on(table.userId),
  entityIdx: index("audit_logs_entity_idx").on(table.entity),
  createdIdx: index("audit_logs_created_idx").on(table.createdAt),
  levelIdx: index("audit_logs_level_idx").on(table.level),
}));

export type AuditLog = typeof auditLogs.$inferSelect;

// ============ System Settings ============
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: text("value"),
  category: text("category").notNull(), // general, email, security, notifications
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;

// ============ Admin Broadcasts ============
export const adminBroadcasts = pgTable("admin_broadcasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  type: text("type").default("push").notNull(), // push, email, sms, all
  targetAudience: text("target_audience").default("all").notNull(), // all, sellers, buyers, verified
  sentBy: varchar("sent_by").references(() => users.id),
  recipientCount: integer("recipient_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  openedCount: integer("opened_count").default(0),
  status: text("status").default("pending").notNull(), // pending, sending, sent, failed
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("admin_broadcasts_status_idx").on(table.status),
  createdIdx: index("admin_broadcasts_created_idx").on(table.createdAt),
}));

export type AdminBroadcast = typeof adminBroadcasts.$inferSelect;

export const insertAdminBroadcastSchema = createInsertSchema(adminBroadcasts).omit({
  id: true,
  sentBy: true,
  recipientCount: true,
  deliveredCount: true,
  openedCount: true,
  status: true,
  sentAt: true,
  createdAt: true,
});

export type InsertAdminBroadcast = z.infer<typeof insertAdminBroadcastSchema>;

// ============ Viewed Listings (Son Görüntülenen İlanlar) ============
export const viewedListings = pgTable("viewed_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
}, (table) => ({
  userListingIdx: index("viewed_listings_user_listing_idx").on(table.userId, table.listingId),
  userViewedIdx: index("viewed_listings_user_viewed_idx").on(table.userId, table.viewedAt),
}));

export const insertViewedListingSchema = createInsertSchema(viewedListings).omit({
  id: true,
  viewedAt: true,
});

export type InsertViewedListing = z.infer<typeof insertViewedListingSchema>;
export type ViewedListing = typeof viewedListings.$inferSelect;

// ============ Seller Reviews (Bireysel Satıcı Değerlendirmeleri) ============
export const sellerReviews = pgTable("seller_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: varchar("listing_id").references(() => listings.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(), // 1-5 yıldız
  comment: text("comment"),
  sellerResponse: text("seller_response"), // Satıcının yanıtı
  sellerResponseAt: timestamp("seller_response_at"),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false), // Gerçek alışveriş yapıldı mı
  helpfulCount: integer("helpful_count").default(0),
  status: text("status").default("active").notNull(), // active, hidden, reported
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  sellerIdx: index("seller_reviews_seller_idx").on(table.sellerId),
  reviewerIdx: index("seller_reviews_reviewer_idx").on(table.reviewerId),
  ratingIdx: index("seller_reviews_rating_idx").on(table.rating),
  sellerReviewerUnique: index("seller_reviews_seller_reviewer_unique").on(table.sellerId, table.reviewerId),
}));

export const insertSellerReviewSchema = createInsertSchema(sellerReviews).omit({
  id: true,
  sellerResponse: true,
  sellerResponseAt: true,
  helpfulCount: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSellerReview = z.infer<typeof insertSellerReviewSchema>;
export type SellerReview = typeof sellerReviews.$inferSelect;

// ============ Listing Videos (İlan Videoları) ============
export const listingVideos = pgTable("listing_videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // saniye cinsinden
  size: integer("size"), // byte cinsinden
  mimeType: text("mime_type"),
  order: integer("order").default(0),
  status: text("status").default("processing").notNull(), // processing, ready, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  listingIdx: index("listing_videos_listing_idx").on(table.listingId),
  orderIdx: index("listing_videos_order_idx").on(table.listingId, table.order),
}));

export const insertListingVideoSchema = createInsertSchema(listingVideos).omit({
  id: true,
  thumbnailUrl: true,
  duration: true,
  size: true,
  status: true,
  createdAt: true,
});

export type InsertListingVideo = z.infer<typeof insertListingVideoSchema>;
export type ListingVideo = typeof listingVideos.$inferSelect;

// ============ Contact Requests (Misafir İletişim Talepleri) ============
export const contactRequests = pgTable("contact_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  senderPhone: text("sender_phone"),
  message: text("message").notNull(),
  ipAddress: varchar("ip_address"),
  recaptchaScore: decimal("recaptcha_score", { precision: 3, scale: 2 }),
  status: text("status").default("pending").notNull(), // pending, replied, spam, archived
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  listingIdx: index("contact_requests_listing_idx").on(table.listingId),
  sellerIdx: index("contact_requests_seller_idx").on(table.sellerId),
  statusIdx: index("contact_requests_status_idx").on(table.status),
  emailIdx: index("contact_requests_email_idx").on(table.senderEmail),
}));

export const insertContactRequestSchema = createInsertSchema(contactRequests).omit({
  id: true,
  ipAddress: true,
  recaptchaScore: true,
  status: true,
  repliedAt: true,
  createdAt: true,
});

export type InsertContactRequest = z.infer<typeof insertContactRequestSchema>;
export type ContactRequest = typeof contactRequests.$inferSelect;

// ============ Category Statistics (Kategori İstatistikleri) ============
export const categoryStats = pgTable("category_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categorySlug: varchar("category_slug").notNull(),
  date: timestamp("date").notNull(),
  totalListings: integer("total_listings").default(0),
  activeListings: integer("active_listings").default(0),
  avgPrice: decimal("avg_price", { precision: 12, scale: 2 }),
  minPrice: decimal("min_price", { precision: 12, scale: 2 }),
  maxPrice: decimal("max_price", { precision: 12, scale: 2 }),
  totalViews: integer("total_views").default(0),
  totalFavorites: integer("total_favorites").default(0),
  newListings: integer("new_listings").default(0), // O gün eklenen ilanlar
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  categoryDateIdx: index("category_stats_category_date_idx").on(table.categorySlug, table.date),
  dateIdx: index("category_stats_date_idx").on(table.date),
}));

export type CategoryStat = typeof categoryStats.$inferSelect;

// ============ Search Notification Log (Arama Bildirim Geçmişi) ============
export const searchNotificationLogs = pgTable("search_notification_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  savedSearchId: varchar("saved_search_id").notNull().references(() => savedSearches.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matchedListingIds: jsonb("matched_listing_ids").$type<string[]>().default([]),
  emailSent: boolean("email_sent").default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  savedSearchIdx: index("search_notification_logs_saved_search_idx").on(table.savedSearchId),
  userIdx: index("search_notification_logs_user_idx").on(table.userId),
  sentIdx: index("search_notification_logs_sent_idx").on(table.sentAt),
}));

export type SearchNotificationLog = typeof searchNotificationLogs.$inferSelect;

// ============ YENI ÖZELLİKLER ============

// ============ 1. Piyasa Fiyatları (Canlı Hayvan Fiyat Takibi) ============
export const marketPriceTypeEnum = pgEnum("market_price_type", [
  "buyukbas",       // Büyükbaş hayvan
  "kucukbas",       // Küçükbaş hayvan
  "kanatli",        // Kanatlı hayvan
  "yem",            // Yem fiyatları
  "sut",            // Süt fiyatları
  "et",             // Et fiyatları
  "bal",            // Bal fiyatları
  "yumurta"         // Yumurta fiyatları
]);

export const marketPrices = pgTable("market_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: marketPriceTypeEnum("type").notNull(),
  category: varchar("category").notNull(), // Alt kategori (ör: dana, buzağı, koyun, kıl keçisi)
  city: varchar("city").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  unit: varchar("unit").notNull(), // kg, adet, litre, ton
  minPrice: decimal("min_price", { precision: 12, scale: 2 }),
  maxPrice: decimal("max_price", { precision: 12, scale: 2 }),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }), // Günlük değişim %
  source: varchar("source"), // Kaynak (ör: hal, borsa, manuel)
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  typeCityIdx: index("market_prices_type_city_idx").on(table.type, table.city),
  dateIdx: index("market_prices_date_idx").on(table.date),
  categoryIdx: index("market_prices_category_idx").on(table.category),
}));

export const insertMarketPriceSchema = createInsertSchema(marketPrices).omit({
  id: true,
  createdAt: true,
});

export type InsertMarketPrice = z.infer<typeof insertMarketPriceSchema>;
export type MarketPrice = typeof marketPrices.$inferSelect;

// ============ 2. Veteriner Online Hizmetler ============
export const vetServiceTypeEnum = pgEnum("vet_service_type", [
  "video_call",      // Video görüşme
  "photo_diagnosis", // Fotoğrafla teşhis
  "chat",            // Yazılı danışma
  "subscription"     // Abonelik paketi
]);

export const vetServiceStatusEnum = pgEnum("vet_service_status", [
  "pending",         // Beklemede
  "scheduled",       // Planlandı
  "in_progress",     // Devam ediyor
  "completed",       // Tamamlandı
  "cancelled"        // İptal edildi
]);

export const vetOnlineServices = pgTable("vet_online_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vetId: varchar("vet_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: vetServiceTypeEnum("type").notNull(),
  status: vetServiceStatusEnum("status").default("pending").notNull(),
  animalType: varchar("animal_type"), // Hayvan türü
  animalAge: varchar("animal_age"),
  symptoms: text("symptoms"), // Belirtiler
  images: jsonb("images").$type<string[]>().default([]), // Yüklenen fotoğraflar
  diagnosis: text("diagnosis"), // Teşhis
  prescription: text("prescription"), // Reçete
  notes: text("notes"), // Notlar
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  price: decimal("price", { precision: 10, scale: 2 }),
  isPaid: boolean("is_paid").default(false),
  rating: integer("rating"), // 1-5
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  vetIdx: index("vet_services_vet_idx").on(table.vetId),
  clientIdx: index("vet_services_client_idx").on(table.clientId),
  statusIdx: index("vet_services_status_idx").on(table.status),
  typeIdx: index("vet_services_type_idx").on(table.type),
}));

export const insertVetOnlineServiceSchema = createInsertSchema(vetOnlineServices).omit({
  id: true,
  status: true,
  diagnosis: true,
  prescription: true,
  completedAt: true,
  isPaid: true,
  rating: true,
  review: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertVetOnlineService = z.infer<typeof insertVetOnlineServiceSchema>;
export type VetOnlineService = typeof vetOnlineServices.$inferSelect;

// Veteriner Abonelik Paketleri
export const vetSubscriptions = pgTable("vet_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vetId: varchar("vet_id").references(() => users.id, { onDelete: "set null" }),
  planType: varchar("plan_type").notNull(), // basic, premium, enterprise
  animalCount: integer("animal_count").default(1), // Takip edilen hayvan sayısı
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  autoRenew: boolean("auto_renew").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("vet_subs_user_idx").on(table.userId),
  vetIdx: index("vet_subs_vet_idx").on(table.vetId),
  activeIdx: index("vet_subs_active_idx").on(table.isActive),
}));

export type VetSubscription = typeof vetSubscriptions.$inferSelect;

// ============ 3. Nakliye Eşleştirme (Uber-tarzı) ============
export const transportRequestStatusEnum = pgEnum("transport_request_status", [
  "pending",         // Talep oluşturuldu, teklif bekleniyor
  "quoted",          // Teklifler geldi
  "accepted",        // Teklif kabul edildi
  "in_transit",      // Taşıma devam ediyor
  "delivered",       // Teslim edildi
  "completed",       // Tamamlandı ve ödendi
  "cancelled"        // İptal edildi
]);

export const transportRequests = pgTable("transport_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  animalType: varchar("animal_type").notNull(), // Hayvan türü
  animalCount: integer("animal_count").notNull(),
  animalWeight: decimal("animal_weight", { precision: 10, scale: 2 }), // Toplam ağırlık (kg)
  originCity: varchar("origin_city").notNull(),
  originDistrict: varchar("origin_district"),
  originAddress: text("origin_address"),
  destinationCity: varchar("destination_city").notNull(),
  destinationDistrict: varchar("destination_district"),
  destinationAddress: text("destination_address"),
  preferredDate: timestamp("preferred_date"),
  flexibleDate: boolean("flexible_date").default(true),
  specialRequirements: text("special_requirements"), // Özel gereksinimler
  status: transportRequestStatusEnum("status").default("pending").notNull(),
  acceptedQuoteId: varchar("accepted_quote_id"),
  estimatedDistance: integer("estimated_distance"), // km
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("transport_req_user_idx").on(table.userId),
  statusIdx: index("transport_req_status_idx").on(table.status),
  originIdx: index("transport_req_origin_idx").on(table.originCity),
  destIdx: index("transport_req_dest_idx").on(table.destinationCity),
}));

export const insertTransportRequestSchema = createInsertSchema(transportRequests).omit({
  id: true,
  status: true,
  acceptedQuoteId: true,
  estimatedDistance: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTransportRequest = z.infer<typeof insertTransportRequestSchema>;
export type TransportRequest = typeof transportRequests.$inferSelect;

// Nakliye Teklifleri
export const transportQuotes = pgTable("transport_quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => transportRequests.id, { onDelete: "cascade" }),
  transporterId: varchar("transporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  estimatedDuration: integer("estimated_duration"), // saat cinsinden
  vehicleType: varchar("vehicle_type"), // Araç tipi
  vehicleCapacity: varchar("vehicle_capacity"), // Kapasite
  insuranceIncluded: boolean("insurance_included").default(false),
  notes: text("notes"),
  isAccepted: boolean("is_accepted").default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  requestIdx: index("transport_quotes_request_idx").on(table.requestId),
  transporterIdx: index("transport_quotes_transporter_idx").on(table.transporterId),
}));

export const insertTransportQuoteSchema = createInsertSchema(transportQuotes).omit({
  id: true,
  isAccepted: true,
  createdAt: true,
});

export type InsertTransportQuote = z.infer<typeof insertTransportQuoteSchema>;
export type TransportQuote = typeof transportQuotes.$inferSelect;

// ============ 4. B2B Yem & Mama Pazaryeri ============
export const b2bListingStatusEnum = pgEnum("b2b_listing_status", [
  "active",
  "sold_out",
  "paused",
  "expired"
]);

export const b2bListings = pgTable("b2b_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "set null" }),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // Karma yem, kanatlı yemi, balık yemi, arı keki vb.
  brand: varchar("brand"),
  unit: varchar("unit").notNull(), // kg, ton, çuval, paket
  minQuantity: integer("min_quantity").notNull(), // Minimum sipariş miktarı
  maxQuantity: integer("max_quantity"),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  bulkDiscounts: jsonb("bulk_discounts").$type<{quantity: number, discount: number}[]>().default([]),
  availableStock: integer("available_stock"),
  images: jsonb("images").$type<string[]>().default([]),
  specifications: jsonb("specifications").$type<Record<string, string>>().default({}),
  deliveryOptions: jsonb("delivery_options").$type<string[]>().default([]),
  status: b2bListingStatusEnum("status").default("active").notNull(),
  viewCount: integer("view_count").default(0),
  orderCount: integer("order_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  sellerIdx: index("b2b_listings_seller_idx").on(table.sellerId),
  categoryIdx: index("b2b_listings_category_idx").on(table.category),
  statusIdx: index("b2b_listings_status_idx").on(table.status),
}));

export const insertB2bListingSchema = createInsertSchema(b2bListings).omit({
  id: true,
  status: true,
  viewCount: true,
  orderCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertB2bListing = z.infer<typeof insertB2bListingSchema>;
export type B2bListing = typeof b2bListings.$inferSelect;

// B2B Siparişler
export const b2bOrderStatusEnum = pgEnum("b2b_order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled"
]);

export const b2bOrders = pgTable("b2b_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => b2bListings.id, { onDelete: "cascade" }),
  buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  discountApplied: decimal("discount_applied", { precision: 10, scale: 2 }).default("0"),
  deliveryAddress: text("delivery_address"),
  deliveryCity: varchar("delivery_city"),
  deliveryNotes: text("delivery_notes"),
  status: b2bOrderStatusEnum("status").default("pending").notNull(),
  estimatedDelivery: timestamp("estimated_delivery"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  buyerIdx: index("b2b_orders_buyer_idx").on(table.buyerId),
  sellerIdx: index("b2b_orders_seller_idx").on(table.sellerId),
  statusIdx: index("b2b_orders_status_idx").on(table.status),
}));

export type B2bOrder = typeof b2bOrders.$inferSelect;

// ============ 5. Canlı Çiftlik TV (Altyapı - Aktif Değil) ============
export const farmTvStreamStatusEnum = pgEnum("farm_tv_stream_status", [
  "scheduled",
  "live",
  "ended",
  "cancelled"
]);

export const farmTvStreams = pgTable("farm_tv_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamerId: varchar("streamer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category"), // Çiftlik, arıcılık, kümes vb.
  thumbnailUrl: text("thumbnail_url"),
  streamKey: varchar("stream_key").unique(),
  streamUrl: text("stream_url"),
  status: farmTvStreamStatusEnum("status").default("scheduled").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  viewerCount: integer("viewer_count").default(0),
  peakViewers: integer("peak_viewers").default(0),
  totalViews: integer("total_views").default(0),
  totalGifts: integer("total_gifts").default(0), // Hediye sayısı
  totalEarnings: decimal("total_earnings", { precision: 12, scale: 2 }).default("0"),
  isEnabled: boolean("is_enabled").default(false), // Platform seviyesinde aktif mi
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  streamerIdx: index("farm_tv_streamer_idx").on(table.streamerId),
  statusIdx: index("farm_tv_status_idx").on(table.status),
  scheduledIdx: index("farm_tv_scheduled_idx").on(table.scheduledAt),
}));

export type FarmTvStream = typeof farmTvStreams.$inferSelect;

// Canlı Yayın Hediyeleri
export const farmTvGifts = pgTable("farm_tv_gifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").notNull().references(() => farmTvStreams.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  giftType: varchar("gift_type").notNull(), // sticker, rozet, jeton
  giftName: varchar("gift_name").notNull(),
  quantity: integer("quantity").default(1),
  tokenValue: integer("token_value").notNull(), // Jeton değeri
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  streamIdx: index("farm_tv_gifts_stream_idx").on(table.streamId),
  senderIdx: index("farm_tv_gifts_sender_idx").on(table.senderId),
}));

export type FarmTvGift = typeof farmTvGifts.$inferSelect;

// ============ 6. Online Süt & Ürün Pazarı (Toptan Satış) ============
export const wholesaleProductStatusEnum = pgEnum("wholesale_product_status", [
  "active",
  "out_of_stock",
  "seasonal",
  "discontinued"
]);

export const wholesaleProducts = pgTable("wholesale_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "set null" }),
  productType: varchar("product_type").notNull(), // süt, yoğurt, peynir, bal, yumurta vb.
  title: varchar("title").notNull(),
  description: text("description"),
  origin: varchar("origin"), // Menşei (çiftlik adı, bölge)
  unit: varchar("unit").notNull(), // litre, kg, adet, koli
  minOrder: integer("min_order").notNull(),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  bulkPricing: jsonb("bulk_pricing").$type<{minQty: number, price: number}[]>().default([]),
  availableQuantity: integer("available_quantity"),
  images: jsonb("images").$type<string[]>().default([]),
  certifications: jsonb("certifications").$type<string[]>().default([]), // Organik, çiftlik onaylı vb.
  isCertified: boolean("is_certified").default(false), // "Çiftlik Onaylı Ürün" etiketi
  deliveryZones: jsonb("delivery_zones").$type<string[]>().default([]), // Teslimat yapılan iller
  status: wholesaleProductStatusEnum("status").default("active").notNull(),
  orderCount: integer("order_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  sellerIdx: index("wholesale_seller_idx").on(table.sellerId),
  typeIdx: index("wholesale_type_idx").on(table.productType),
  statusIdx: index("wholesale_status_idx").on(table.status),
  certifiedIdx: index("wholesale_certified_idx").on(table.isCertified),
}));

export const insertWholesaleProductSchema = createInsertSchema(wholesaleProducts).omit({
  id: true,
  status: true,
  orderCount: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWholesaleProduct = z.infer<typeof insertWholesaleProductSchema>;
export type WholesaleProduct = typeof wholesaleProducts.$inferSelect;

// Toptan Siparişler
export const wholesaleOrderStatusEnum = pgEnum("wholesale_order_status", [
  "pending",
  "confirmed",
  "preparing",
  "in_delivery",
  "delivered",
  "cancelled"
]);

export const wholesaleOrders = pgTable("wholesale_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => wholesaleProducts.id, { onDelete: "cascade" }),
  buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryCity: varchar("delivery_city").notNull(),
  deliveryNotes: text("delivery_notes"),
  status: wholesaleOrderStatusEnum("status").default("pending").notNull(),
  estimatedDelivery: timestamp("estimated_delivery"),
  deliveredAt: timestamp("delivered_at"),
  buyerRating: integer("buyer_rating"),
  buyerReview: text("buyer_review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  buyerIdx: index("wholesale_orders_buyer_idx").on(table.buyerId),
  sellerIdx: index("wholesale_orders_seller_idx").on(table.sellerId),
  statusIdx: index("wholesale_orders_status_idx").on(table.status),
}));

export type WholesaleOrder = typeof wholesaleOrders.$inferSelect;
