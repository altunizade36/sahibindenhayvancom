// URETILMIS DOSYA - ELLE DUZENLEMEYIN. Kaynak: server/vercel-entry.ts (npm run build:api)
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/quiet-deprecations.ts
var orijinalEmit = process.emitWarning.bind(process);
function url_parse_uyarisi(mesaj, args) {
  if (typeof mesaj === "string" && mesaj.includes("url.parse")) return true;
  if (mesaj && typeof mesaj === "object" && "message" in mesaj) {
    const m = mesaj.message;
    if (typeof m === "string" && m.includes("url.parse")) return true;
  }
  for (const a of args) {
    if (a === "DEP0169") return true;
    if (a && typeof a === "object" && a.code === "DEP0169") return true;
  }
  return false;
}
process.emitWarning = (mesaj, ...args) => {
  if (url_parse_uyarisi(mesaj, args)) return;
  return orijinalEmit(mesaj, ...args);
};

// server/vercel-entry.ts
import "dotenv/config";
import express from "express";
import compression from "compression";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { EventEmitter } from "events";
import { timingSafeEqual } from "crypto";

// server/db.ts
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminBroadcasts: () => adminBroadcasts,
  auctionStatusEnum: () => auctionStatusEnum,
  auctions: () => auctions,
  auditLogs: () => auditLogs,
  b2bListingStatusEnum: () => b2bListingStatusEnum,
  b2bListings: () => b2bListings,
  b2bOrderStatusEnum: () => b2bOrderStatusEnum,
  b2bOrders: () => b2bOrders,
  bids: () => bids,
  blogPosts: () => blogPosts,
  blogPostsRelations: () => blogPostsRelations,
  categories: () => categories,
  categoryDocumentRequirementEnum: () => categoryDocumentRequirementEnum,
  categoryDocumentRequirements: () => categoryDocumentRequirements,
  categoryStats: () => categoryStats,
  contactRequests: () => contactRequests,
  conversations: () => conversations,
  documentStatusEnum: () => documentStatusEnum,
  documentTypeEnum: () => documentTypeEnum,
  draftListingSchema: () => draftListingSchema,
  farmTvGifts: () => farmTvGifts,
  farmTvStreamStatusEnum: () => farmTvStreamStatusEnum,
  farmTvStreams: () => farmTvStreams,
  favorites: () => favorites,
  insertAdminBroadcastSchema: () => insertAdminBroadcastSchema,
  insertAuctionSchema: () => insertAuctionSchema,
  insertB2bListingSchema: () => insertB2bListingSchema,
  insertBidSchema: () => insertBidSchema,
  insertBlogPostSchema: () => insertBlogPostSchema,
  insertCategoryDocumentRequirementSchema: () => insertCategoryDocumentRequirementSchema,
  insertCategorySchema: () => insertCategorySchema,
  insertContactRequestSchema: () => insertContactRequestSchema,
  insertConversationSchema: () => insertConversationSchema,
  insertFavoriteSchema: () => insertFavoriteSchema,
  insertListingDocumentSchema: () => insertListingDocumentSchema,
  insertListingImageSchema: () => insertListingImageSchema,
  insertListingSchema: () => insertListingSchema,
  insertListingVideoSchema: () => insertListingVideoSchema,
  insertLiveStreamSchema: () => insertLiveStreamSchema,
  insertLocationSchema: () => insertLocationSchema,
  insertLoginHistorySchema: () => insertLoginHistorySchema,
  insertMarketPriceSchema: () => insertMarketPriceSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertOfferSchema: () => insertOfferSchema,
  insertProfessionalVerificationSchema: () => insertProfessionalVerificationSchema,
  insertReportSchema: () => insertReportSchema,
  insertReviewSchema: () => insertReviewSchema,
  insertSavedSearchSchema: () => insertSavedSearchSchema,
  insertSellerReviewSchema: () => insertSellerReviewSchema,
  insertStoreCategorySchema: () => insertStoreCategorySchema,
  insertStoreFollowerSchema: () => insertStoreFollowerSchema,
  insertStoreMediaSchema: () => insertStoreMediaSchema,
  insertStoreReviewSchema: () => insertStoreReviewSchema,
  insertStoreSchema: () => insertStoreSchema,
  insertStreamBanSchema: () => insertStreamBanSchema,
  insertStreamChatMessageSchema: () => insertStreamChatMessageSchema,
  insertStreamMuteSchema: () => insertStreamMuteSchema,
  insertStreamViewerSchema: () => insertStreamViewerSchema,
  insertTransportQuoteSchema: () => insertTransportQuoteSchema,
  insertTransportRequestSchema: () => insertTransportRequestSchema,
  insertTransportServiceSchema: () => insertTransportServiceSchema,
  insertUserDeviceSchema: () => insertUserDeviceSchema,
  insertUserSchema: () => insertUserSchema,
  insertUserSettingsSchema: () => insertUserSettingsSchema,
  insertVetOnlineServiceSchema: () => insertVetOnlineServiceSchema,
  insertVetServiceSchema: () => insertVetServiceSchema,
  insertViewedListingSchema: () => insertViewedListingSchema,
  insertWholesaleProductSchema: () => insertWholesaleProductSchema,
  invoiceStatusEnum: () => invoiceStatusEnum,
  listingDocuments: () => listingDocuments,
  listingImages: () => listingImages,
  listingSourceEnum: () => listingSourceEnum,
  listingStatusEnum: () => listingStatusEnum,
  listingVideos: () => listingVideos,
  listings: () => listings,
  liveStreams: () => liveStreams,
  locationTypeEnum: () => locationTypeEnum,
  locations: () => locations,
  loginHistory: () => loginHistory,
  marketPriceTypeEnum: () => marketPriceTypeEnum,
  marketPrices: () => marketPrices,
  messageReactions: () => messageReactions,
  messageStatusEnum: () => messageStatusEnum,
  messageTypeEnum: () => messageTypeEnum,
  messages: () => messages,
  notificationTypeEnum: () => notificationTypeEnum,
  notifications: () => notifications,
  offerStatusEnum: () => offerStatusEnum,
  offers: () => offers,
  professionalVerificationStatusEnum: () => professionalVerificationStatusEnum,
  professionalVerifications: () => professionalVerifications,
  reportStatusEnum: () => reportStatusEnum,
  reportTypeEnum: () => reportTypeEnum,
  reports: () => reports,
  restrictedCategories: () => restrictedCategories,
  reviews: () => reviews,
  savedSearches: () => savedSearches,
  searchNotificationLogs: () => searchNotificationLogs,
  sellerLevelEnum: () => sellerLevelEnum,
  sellerReviews: () => sellerReviews,
  sessions: () => sessions,
  storeBadgeTypeEnum: () => storeBadgeTypeEnum,
  storeCategories: () => storeCategories,
  storeFollowers: () => storeFollowers,
  storeFollowersRelations: () => storeFollowersRelations,
  storeMedia: () => storeMedia,
  storeMediaRelations: () => storeMediaRelations,
  storeReviews: () => storeReviews,
  storeReviewsRelations: () => storeReviewsRelations,
  storeStatusEnum: () => storeStatusEnum,
  storeTypeEnum: () => storeTypeEnum,
  stores: () => stores,
  storesRelations: () => storesRelations,
  streamBans: () => streamBans,
  streamChatMessages: () => streamChatMessages,
  streamMutes: () => streamMutes,
  streamStatusEnum: () => streamStatusEnum,
  streamViewers: () => streamViewers,
  systemSettings: () => systemSettings,
  transportQuotes: () => transportQuotes,
  transportRequestStatusEnum: () => transportRequestStatusEnum,
  transportRequests: () => transportRequests,
  transportServices: () => transportServices,
  userDevices: () => userDevices,
  userPresence: () => userPresence,
  userRoleEnum: () => userRoleEnum,
  userSettings: () => userSettings,
  userStatusEnum: () => userStatusEnum,
  users: () => users,
  vetOnlineServices: () => vetOnlineServices,
  vetServiceStatusEnum: () => vetServiceStatusEnum,
  vetServiceTypeEnum: () => vetServiceTypeEnum,
  vetServices: () => vetServices,
  vetSubscriptions: () => vetSubscriptions,
  viewedListings: () => viewedListings,
  wholesaleOrderStatusEnum: () => wholesaleOrderStatusEnum,
  wholesaleOrders: () => wholesaleOrders,
  wholesaleProductStatusEnum: () => wholesaleProductStatusEnum,
  wholesaleProducts: () => wholesaleProducts
});
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
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var userRoleEnum = pgEnum("user_role", [
  "buyer",
  "seller",
  "vet",
  "transporter",
  "admin"
]);
var listingStatusEnum = pgEnum("listing_status", [
  "draft",
  "pending",
  "active",
  "rejected",
  "sold",
  "expired",
  "deleted"
]);
var auctionStatusEnum = pgEnum("auction_status", [
  "upcoming",
  "live",
  "ended",
  "seller_approval",
  "completed",
  "cancelled"
]);
var invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "issued",
  "paid",
  "cancelled"
]);
var streamStatusEnum = pgEnum("stream_status", [
  "scheduled",
  "live",
  "ended"
]);
var storeTypeEnum = pgEnum("store_type", [
  "petshop",
  // Pet shop mağazası
  "feed_producer",
  // Yem & Mama Üreticisi
  "farm_equipment",
  // Çiftlik Ekipmanı Satıcısı
  "veterinary",
  // Veteriner Kliniği
  "transport",
  // Nakliye & Lojistik Firması
  "beekeeping",
  // Arıcılık Malzeme Mağazası
  "horse_riding",
  // At & Binicilik Mağazası
  "exotic",
  // Egzotik Hayvan Mağazası
  "grooming",
  // Pet Kuaförü
  "other"
  // Diğer
]);
var storeStatusEnum = pgEnum("store_status", [
  "draft",
  // Taslak - henüz tamamlanmamış
  "pending",
  // Onay bekliyor
  "active",
  // Aktif mağaza
  "suspended",
  // Askıya alınmış
  "closed"
  // Kapatılmış
]);
var listingSourceEnum = pgEnum("listing_source", [
  "individual",
  // Bireysel satıcı (şahıs)
  "store"
  // Mağaza ilanı (dükkan)
]);
var messageStatusEnum = pgEnum("message_status", [
  "sent",
  "delivered",
  "read"
]);
var messageTypeEnum = pgEnum("message_type", [
  "text",
  // Normal metin mesajı
  "image",
  // Resim mesajı
  "file",
  // Dosya eki
  "system",
  // Sistem mesajı (ilan paylaşımı vs)
  "offer"
  // Teklif mesajı
]);
var sellerLevelEnum = pgEnum("seller_level", [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond"
]);
var offerStatusEnum = pgEnum("offer_status", [
  "pending",
  "accepted",
  "rejected",
  "countered",
  "expired",
  "withdrawn"
]);
var locationTypeEnum = pgEnum("location_type", [
  "il",
  // Province
  "ilce",
  // District
  "mahalle",
  // Neighborhood
  "koy"
  // Village
]);
var documentStatusEnum = pgEnum("document_status", [
  "pending",
  // Beklemede - yeni yüklendi
  "verified",
  // Onaylandı - admin tarafından doğrulandı
  "rejected",
  // Reddedildi - geçersiz belge
  "expired"
  // Süresi dolmuş
]);
var documentTypeEnum = pgEnum("document_type", [
  "microchip",
  // Mikroçip belgesi
  "passport",
  // Evcil hayvan pasaportu
  "vaccination",
  // Aşı kartı/belgesi
  "health_certificate",
  // Veteriner sağlık raporu
  "pedigree",
  // Soy belgesi
  "cites",
  // CITES belgesi (egzotik/korumalı türler)
  "turkvet",
  // TÜRKVET kayıt belgesi
  "transport",
  // Nakil belgesi
  "ear_tag",
  // Kulak küpesi belgesi
  "breeding_permit",
  // Üretim izni belgesi
  "dkmp_permit",
  // DKMP izin belgesi (yabani hayvanlar)
  "import_permit",
  // İthalat izni
  "other"
  // Diğer belgeler
]);
var categoryDocumentRequirementEnum = pgEnum("category_document_requirement", [
  "required",
  // Zorunlu - bu belge olmadan ilan verilemez
  "recommended",
  // Önerilen - ilanın onaylanma şansını artırır
  "optional"
  // İsteğe bağlı
]);
var userStatusEnum = pgEnum("user_status", [
  "active",
  // Normal aktif kullanıcı
  "banned",
  // Yasaklanmış
  "suspended"
  // Geçici askıya alınmış
]);
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique(),
  username: varchar("username").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default("buyer"),
  phone: text("phone").unique(),
  city: text("city"),
  district: text("district"),
  bio: text("bio"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  verificationToken: varchar("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  // Seller stats & level system
  sellerLevel: sellerLevelEnum("seller_level").default("bronze"),
  totalListings: integer("total_listings").default(0),
  totalSales: integer("total_sales").default(0),
  totalViews: integer("total_views").default(0),
  responseRate: integer("response_rate").default(100),
  // Percentage 0-100
  avgResponseTime: integer("avg_response_time"),
  // Minutes
  positiveReviews: integer("positive_reviews").default(0),
  negativeReviews: integer("negative_reviews").default(0),
  sellerScore: integer("seller_score").default(0),
  // Computed score for level
  sellerRating: decimal("seller_rating", { precision: 3, scale: 2 }).default("0"),
  // 0.00 - 5.00 ortalama puan
  sellerReviewCount: integer("seller_review_count").default(0),
  // Toplam değerlendirme sayısı
  badges: jsonb("badges").$type().default(sql`'[]'::jsonb`),
  // Achievement badges
  // Language preference
  preferredLanguage: text("preferred_language").default("tr"),
  // tr or en
  // Account status (for ban/suspend functionality)
  status: userStatusEnum("status").default("active").notNull(),
  statusChangedAt: timestamp("status_changed_at"),
  statusChangedBy: varchar("status_changed_by"),
  statusReason: text("status_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  roleIdx: index("users_role_idx").on(table.role),
  cityIdx: index("users_city_idx").on(table.city),
  createdAtIdx: index("users_created_at_idx").on(table.createdAt),
  statusIdx: index("users_status_idx").on(table.status)
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  // Notification preferences
  emailNotifications: boolean("email_notifications").default(true).notNull(),
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
  profileVisibility: varchar("profile_visibility", { length: 20 }).default("public").notNull(),
  // public, private, contacts
  // Listing defaults
  defaultCity: text("default_city"),
  defaultDistrict: text("default_district"),
  defaultCategoryId: varchar("default_category_id"),
  autoRenewListings: boolean("auto_renew_listings").default(false).notNull(),
  // Display preferences
  theme: varchar("theme", { length: 10 }).default("system").notNull(),
  // light, dark, system
  language: varchar("language", { length: 5 }).default("tr").notNull(),
  currency: varchar("currency", { length: 3 }).default("TRY").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var userDevices = pgTable("user_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  deviceName: varchar("device_name", { length: 100 }),
  deviceType: varchar("device_type", { length: 50 }),
  // mobile, desktop, tablet
  browser: varchar("browser", { length: 100 }),
  os: varchar("os", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  location: varchar("location", { length: 200 }),
  lastActive: timestamp("last_active").defaultNow().notNull(),
  isTrusted: boolean("is_trusted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserDeviceSchema = createInsertSchema(userDevices).omit({
  id: true,
  createdAt: true
});
var loginHistory = pgTable("login_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  loginMethod: varchar("login_method", { length: 30 }).notNull(),
  // email, phone, google, facebook
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  location: varchar("location", { length: 200 }),
  success: boolean("success").default(true).notNull(),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  userIdIdx: index("login_history_user_id_idx").on(table.userId),
  createdAtIdx: index("login_history_created_at_idx").on(table.createdAt)
}));
var insertLoginHistorySchema = createInsertSchema(loginHistory).omit({
  id: true,
  createdAt: true
});
var categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  parentId: varchar("parent_id").references(() => categories.id, { onDelete: "set null" }),
  // Self-reference
  icon: text("icon"),
  image: text("image"),
  description: text("description"),
  order: integer("order").default(0),
  depth: integer("depth").default(0).notNull(),
  // 0 for root categories
  path: jsonb("path").$type().notNull().default(sql`'[]'::jsonb`)
  // Array of ancestor IDs
}, (table) => ({
  parentIdIdx: index("categories_parent_id_idx").on(table.parentId),
  depthOrderIdx: index("categories_depth_order_idx").on(table.depth, table.order)
}));
var insertCategorySchema = createInsertSchema(categories).omit({
  id: true
});
var storeCategories = pgTable("store_categories", {
  id: varchar("id").primaryKey(),
  parentId: varchar("parent_id").references(() => storeCategories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  depth: integer("depth").default(0).notNull(),
  order: integer("order").default(0)
});
var insertStoreCategorySchema = createInsertSchema(storeCategories);
var locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  type: locationTypeEnum("type").notNull(),
  parentId: varchar("parent_id").references(() => locations.id, { onDelete: "set null" }),
  // Self-reference
  code: text("code"),
  // Postal or administrative code
  depth: integer("depth").default(0).notNull(),
  // 0=il, 1=ilçe, 2=mahalle, 3=köy
  path: jsonb("path").$type().notNull().default(sql`'[]'::jsonb`),
  // Array of ancestor IDs
  order: integer("order").default(0)
}, (table) => ({
  // Composite index for efficient cascading queries (parent → children by type)
  parentTypeIdx: index("locations_parent_type_idx").on(table.parentId, table.type),
  // Index for type-only queries (e.g., get all provinces)
  typeIdx: index("locations_type_idx").on(table.type)
}));
var insertLocationSchema = createInsertSchema(locations).omit({
  id: true
});
var listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "set null" }),
  // Optional store association
  listingSource: listingSourceEnum("listing_source").default("individual").notNull(),
  // NEW: individual vs store
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  images: jsonb("images").$type().notNull().default([]),
  breed: text("breed"),
  age: text("age"),
  gender: text("gender"),
  healthStatus: text("health_status"),
  vaccinated: boolean("vaccinated").default(false),
  neutered: boolean("neutered").default(false),
  pedigree: boolean("pedigree").default(false),
  pedigreeDocument: text("pedigree_document"),
  healthDocuments: jsonb("health_documents").$type().default([]),
  characterTraits: jsonb("character_traits").$type().default([]),
  ageCategory: text("age_category"),
  // Enhanced listing fields
  videoUrls: jsonb("video_urls").$type().default([]),
  // YouTube, Vimeo, etc.
  categoryAttributes: jsonb("category_attributes").$type().default({}),
  // Category-specific fields
  // Pedigree/lineage info for pets
  microchipNumber: text("microchip_number"),
  // Mikroçip numarası
  passportNumber: text("passport_number"),
  // Pasaport numarası
  // Livestock-specific fields  
  earTagNumber: text("ear_tag_number"),
  // Kulak küpesi numarası
  turkvetNumber: text("turkvet_number"),
  // TÜRKVET kayıt numarası
  // Seller notes
  deliveryInfo: text("delivery_info"),
  // Teslimat bilgisi
  warrantyInfo: text("warranty_info"),
  // Garanti bilgisi
  locationId: varchar("location_id").references(() => locations.id, { onDelete: "set null" }),
  city: text("city").notNull(),
  // Denormalized for backward compatibility (should sync with locationId)
  district: text("district").notNull(),
  // Denormalized for backward compatibility
  status: listingStatusEnum("status").default("pending"),
  isPremium: boolean("is_premium").default(false),
  isUrgent: boolean("is_urgent").default(false),
  views: integer("views").default(0),
  favoriteCount: integer("favorite_count").default(0),
  shareCount: integer("share_count").default(0),
  allowOffers: boolean("allow_offers").default(true),
  // Allow "Make Offer" on this listing
  isExampleListing: boolean("is_example_listing").default(false),
  // Mark as example/demo listing
  exampleSource: text("example_source"),
  // Source URL for price verification
  moderationReason: text("moderation_reason"),
  moderatedBy: varchar("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  categoryStatusCreatedIdx: index("listings_category_status_created_idx").on(table.categoryId, table.status, table.createdAt),
  locationCreatedIdx: index("listings_location_created_idx").on(table.locationId, table.createdAt),
  sellerCreatedIdx: index("listings_seller_created_idx").on(table.sellerId, table.createdAt),
  statusPremiumIdx: index("listings_status_premium_idx").on(table.status, table.isPremium)
}));
var insertListingSchema = createInsertSchema(listings, {
  price: z.union([z.string(), z.number()]).transform((val) => String(val)),
  images: z.array(z.string()).optional().default([]),
  healthDocuments: z.array(z.string()).optional().default([]),
  characterTraits: z.array(z.string()).optional().default([]),
  videoUrls: z.array(z.string()).optional().default([]),
  categoryAttributes: z.record(z.any()).optional().default({}),
  // Metin alanı üst sınırları: title/description sınırsız `text` sütunuydu ve
  // yalnızca gövde boyutuyla dolaylı sınırlıydı. Aşırı uzun başlık/açıklama
  // hem arayüzü hem SEO'yu bozar.
  title: z.string().min(3, "Ba\u015Fl\u0131k en az 3 karakter olmal\u0131").max(120, "Ba\u015Fl\u0131k en fazla 120 karakter olabilir"),
  description: z.string().max(1e4, "A\xE7\u0131klama en fazla 10.000 karakter olabilir")
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true
});
var draftListingSchema = z.object({
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
  warrantyInfo: z.string().optional()
});
var listingImages = pgTable("listing_images", {
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
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  listingIdx: index("listing_images_listing_idx").on(table.listingId),
  listingOrderIdx: index("listing_images_listing_order_idx").on(table.listingId, table.displayOrder)
}));
var insertListingImageSchema = createInsertSchema(listingImages).omit({
  id: true,
  createdAt: true
});
var listingDocuments = pgTable("listing_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").references(() => listings.id, { onDelete: "cascade" }),
  documentType: documentTypeEnum("document_type").notNull(),
  documentUrl: text("document_url").notNull(),
  // Storage URL
  documentKey: text("document_key").notNull(),
  // Storage key
  documentNumber: text("document_number"),
  // Belge numarası (mikroçip no, pasaport no vb.)
  issueDate: timestamp("issue_date"),
  // Belge düzenlenme tarihi
  expiryDate: timestamp("expiry_date"),
  // Belge geçerlilik tarihi
  issuingAuthority: text("issuing_authority"),
  // Düzenleyen kurum
  status: documentStatusEnum("status").default("pending"),
  verifiedBy: varchar("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  // Admin notları
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  listingIdx: index("listing_documents_listing_idx").on(table.listingId),
  statusIdx: index("listing_documents_status_idx").on(table.status),
  typeIdx: index("listing_documents_type_idx").on(table.documentType)
}));
var insertListingDocumentSchema = createInsertSchema(listingDocuments).omit({
  id: true,
  createdAt: true,
  verifiedBy: true,
  verifiedAt: true
});
var categoryDocumentRequirements = pgTable("category_document_requirements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categorySlug: text("category_slug").notNull(),
  // Category slug (e.g., "kopekler", "kediler")
  documentType: documentTypeEnum("document_type").notNull(),
  requirement: categoryDocumentRequirementEnum("requirement").notNull().default("optional"),
  description: text("description"),
  // Açıklama (neden gerekli, nasıl alınır)
  legalReference: text("legal_reference"),
  // Yasal dayanak
  penaltyInfo: text("penalty_info"),
  // Ceza bilgisi
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  categoryIdx: index("category_doc_req_category_idx").on(table.categorySlug),
  uniqueReq: index("category_doc_req_unique_idx").on(table.categorySlug, table.documentType)
}));
var insertCategoryDocumentRequirementSchema = createInsertSchema(categoryDocumentRequirements).omit({
  id: true,
  createdAt: true
});
var restrictedCategories = pgTable("restricted_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categorySlug: text("category_slug").notNull().unique(),
  restrictionType: text("restriction_type").notNull(),
  // "banned", "store_only", "individual_only", "cites_required"
  reason: text("reason").notNull(),
  // Yasaklama/kısıtlama nedeni
  legalReference: text("legal_reference"),
  // Yasal dayanak
  penaltyAmount: text("penalty_amount"),
  // Ceza miktarı
  effectiveDate: timestamp("effective_date"),
  // Yürürlük tarihi
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var auctions = pgTable("auctions", {
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
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  statusEndTimeIdx: index("auctions_status_end_time_idx").on(table.status, table.endTime),
  listingIdx: index("auctions_listing_idx").on(table.listingId)
}));
var insertAuctionSchema = createInsertSchema(auctions, {
  startPrice: z.union([z.string(), z.number()]).transform((val) => String(val)),
  buyNowPrice: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
  minIncrement: z.union([z.string(), z.number()]).transform((val) => String(val)).optional()
}).omit({
  id: true,
  createdAt: true,
  currentPrice: true,
  totalBids: true,
  winnerId: true,
  // status sunucuda belirlenir (DB varsayılanı 'upcoming'); kullanıcı gövdeyle
  // açık artırmayı doğrudan 'active' yapıp başlatamamalı.
  status: true
});
var bids = pgTable("bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auctionId: varchar("auction_id").notNull().references(() => auctions.id),
  bidderId: varchar("bidder_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  auctionIdx: index("bids_auction_idx").on(table.auctionId),
  bidderIdx: index("bids_bidder_idx").on(table.bidderId),
  auctionAmountIdx: index("bids_auction_amount_idx").on(table.auctionId, table.amount)
}));
var insertBidSchema = createInsertSchema(bids, {
  amount: z.union([z.string(), z.number()]).transform((val) => String(val))
}).omit({
  id: true,
  createdAt: true
});
var offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  message: text("message"),
  // Optional message with the offer
  status: offerStatusEnum("status").default("pending"),
  counterAmount: decimal("counter_amount", { precision: 10, scale: 2 }),
  // If seller counters
  counterMessage: text("counter_message"),
  expiresAt: timestamp("expires_at"),
  // Offer expiration
  respondedAt: timestamp("responded_at"),
  // When seller responded
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  listingIdx: index("offers_listing_idx").on(table.listingId),
  buyerIdx: index("offers_buyer_idx").on(table.buyerId),
  sellerIdx: index("offers_seller_idx").on(table.sellerId),
  statusIdx: index("offers_status_idx").on(table.status)
}));
var insertOfferSchema = createInsertSchema(offers, {
  amount: z.union([z.string(), z.number()]).transform((val) => String(val))
}).omit({
  id: true,
  createdAt: true,
  status: true,
  counterAmount: true,
  counterMessage: true,
  respondedAt: true
});
var liveStreams = pgTable("live_streams", {
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
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  statusIdx: index("streams_status_idx").on(table.status),
  streamerIdx: index("streams_streamer_idx").on(table.streamerId),
  scheduledIdx: index("streams_scheduled_idx").on(table.scheduledFor)
}));
var insertLiveStreamSchema = createInsertSchema(liveStreams).omit({
  id: true,
  createdAt: true,
  viewerCount: true,
  peakViewers: true,
  startedAt: true,
  endedAt: true,
  // status sunucuda belirlenir (DB varsayılanı 'scheduled'); kullanıcı gövdeyle
  // yayını doğrudan 'live' gösteremmeli.
  status: true
});
var messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  listingId: varchar("listing_id").references(() => listings.id),
  conversationId: varchar("conversation_id").notNull(),
  content: text("content").notNull(),
  messageType: messageTypeEnum("message_type").default("text"),
  status: messageStatusEnum("status").default("sent"),
  replyToId: varchar("reply_to_id"),
  attachments: jsonb("attachments").$type().default([]),
  isEdited: boolean("is_edited").default(false),
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  editedAt: timestamp("edited_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  senderReceiverCreatedIdx: index("messages_sender_receiver_created_idx").on(table.senderId, table.receiverId, table.createdAt),
  receiverCreatedIdx: index("messages_receiver_created_idx").on(table.receiverId, table.createdAt),
  conversationIdx: index("messages_conversation_idx").on(table.conversationId, table.createdAt),
  replyToIdx: index("messages_reply_to_idx").on(table.replyToId)
}));
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  status: true,
  isEdited: true,
  isDeleted: true,
  deletedAt: true,
  editedAt: true,
  deliveredAt: true,
  readAt: true
});
var conversations = pgTable("conversations", {
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
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  participant1Idx: index("conversations_participant1_idx").on(table.participant1Id),
  participant2Idx: index("conversations_participant2_idx").on(table.participant2Id),
  lastMessageIdx: index("conversations_last_message_idx").on(table.lastMessageAt),
  participantsUnique: index("conversations_participants_unique").on(table.participant1Id, table.participant2Id)
}));
var insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastMessageId: true,
  lastMessageAt: true,
  participant1UnreadCount: true,
  participant2UnreadCount: true,
  participant1LastReadAt: true,
  participant2LastReadAt: true
});
var userPresence = pgTable("user_presence", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  isOnline: boolean("is_online").default(false),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  currentConversationId: varchar("current_conversation_id"),
  typingInConversationId: varchar("typing_in_conversation_id"),
  typingStartedAt: timestamp("typing_started_at"),
  deviceInfo: text("device_info"),
  socketId: varchar("socket_id")
});
var messageReactions = pgTable("message_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  reaction: varchar("reaction", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  messageUserUnique: index("message_reactions_unique").on(table.messageId, table.userId, table.reaction),
  messageIdx: index("message_reactions_message_idx").on(table.messageId)
}));
var blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: text("featured_image"),
  categoryTags: jsonb("category_tags").$type().default([]),
  published: boolean("published").default(false),
  views: integer("views").default(0),
  readTime: integer("read_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  publishedCreatedIdx: index("blog_posts_published_created_idx").on(table.published, table.createdAt),
  authorIdx: index("blog_posts_author_idx").on(table.authorId)
}));
var insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true
});
var vetServices = pgTable("vet_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vetId: varchar("vet_id").notNull().references(() => users.id),
  clinicName: text("clinic_name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  district: text("district").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  specializations: jsonb("specializations").$type().default([]),
  services: jsonb("services").$type().default([]),
  workingHours: text("working_hours"),
  emergencyService: boolean("emergency_service").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: integer("total_reviews").default(0),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  cityIdx: index("vet_services_city_idx").on(table.city),
  cityDistrictIdx: index("vet_services_city_district_idx").on(table.city, table.district)
}));
var insertVetServiceSchema = createInsertSchema(vetServices).omit({
  id: true,
  createdAt: true,
  rating: true,
  totalReviews: true
});
var transportServices = pgTable("transport_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transporterId: varchar("transporter_id").notNull().references(() => users.id),
  companyName: text("company_name").notNull(),
  serviceAreas: jsonb("service_areas").$type().default([]),
  vehicleTypes: jsonb("vehicle_types").$type().default([]),
  animalTypes: jsonb("animal_types").$type().default([]),
  phone: text("phone").notNull(),
  pricePerKm: decimal("price_per_km", { precision: 10, scale: 2 }),
  minPrice: decimal("min_price", { precision: 10, scale: 2 }),
  insurance: boolean("insurance").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalReviews: integer("total_reviews").default(0),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertTransportServiceSchema = createInsertSchema(transportServices, {
  pricePerKm: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
  minPrice: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
  serviceAreas: z.array(z.string()).optional().default([]),
  vehicleTypes: z.array(z.string()).optional().default([]),
  animalTypes: z.array(z.string()).optional().default([])
}).omit({
  id: true,
  createdAt: true,
  rating: true,
  totalReviews: true
});
var reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id),
  targetId: varchar("target_id").notNull(),
  targetType: text("target_type").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  targetIdx: index("reviews_target_idx").on(table.targetId, table.targetType),
  reviewerIdx: index("reviews_reviewer_idx").on(table.reviewerId)
}));
var insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true
});
var favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  listingId: varchar("listing_id").notNull().references(() => listings.id),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  userCreatedIdx: index("favorites_user_created_idx").on(table.userId, table.createdAt),
  // Aynı kullanıcı aynı ilanı bir kez favlayabilir. Ad "unique" diyordu ama
  // `index()` idi (unique değil); çift favori veritabanı düzeyinde
  // engellenmiyordu. Sunucu da idempotent kontrol yapıyor ama yarış
  // durumuna karşı asıl güvence bu.
  userListingUnique: uniqueIndex("favorites_user_listing_unique").on(table.userId, table.listingId)
}));
var insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true
});
var savedSearches = pgTable("saved_searches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  filters: jsonb("filters").$type().notNull(),
  notifyEnabled: boolean("notify_enabled").default(false).notNull(),
  lastNotifiedAt: timestamp("last_notified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  userIdx: index("saved_searches_user_idx").on(table.userId),
  notifyIdx: index("saved_searches_notify_idx").on(table.notifyEnabled)
}));
var insertSavedSearchSchema = createInsertSchema(savedSearches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastNotifiedAt: true
});
var notificationTypeEnum = pgEnum("notification_type", [
  "new_message",
  // Yeni mesaj geldi
  "listing_approved",
  // İlan onaylandı
  "listing_rejected",
  // İlan reddedildi
  "new_favorite",
  // Birisi ilanını favoriledi
  "price_drop",
  // Favorideki ilan fiyatı düştü
  "auction_outbid",
  // Açık artırmada birisi geçti
  "auction_won",
  // Açık artırmayı kazandı
  "auction_ending",
  // Açık artırma bitiyor
  "saved_search_match",
  // Kayıtlı arama eşleşmesi bulundu
  "system"
  // Sistem bildirimi
]);
var notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  relatedId: varchar("related_id"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  userReadIdx: index("notifications_user_read_idx").on(table.userId, table.isRead),
  userCreatedIdx: index("notifications_user_created_idx").on(table.userId, table.createdAt)
}));
var insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true
});
var reportTypeEnum = pgEnum("report_type", [
  "spam",
  "fraud",
  "inappropriate",
  "fake_listing",
  "harassment",
  "copyright",
  "other"
]);
var reportStatusEnum = pgEnum("report_status", [
  "pending",
  "under_review",
  "resolved",
  "dismissed"
]);
var reports = pgTable("reports", {
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
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  reporterIdx: index("reports_reporter_idx").on(table.reporterId),
  statusIdx: index("reports_status_idx").on(table.status),
  typeIdx: index("reports_type_idx").on(table.type)
}));
var insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  status: true,
  adminNotes: true,
  resolvedAt: true,
  resolvedBy: true
});
var streamChatMessages = pgTable("stream_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").notNull().references(() => liveStreams.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  streamIdx: index("stream_chat_stream_idx").on(table.streamId),
  streamCreatedIdx: index("stream_chat_stream_created_idx").on(table.streamId, table.createdAt)
}));
var insertStreamChatMessageSchema = createInsertSchema(streamChatMessages).omit({
  id: true,
  createdAt: true
});
var streamViewers = pgTable("stream_viewers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").notNull().references(() => liveStreams.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at")
}, (table) => ({
  streamUserIdx: index("stream_viewer_stream_user_idx").on(table.streamId, table.userId),
  streamUserUnique: index("stream_viewer_unique_active").on(table.streamId, table.userId).where(sql`${table.leftAt} IS NULL`)
}));
var insertStreamViewerSchema = createInsertSchema(streamViewers).omit({
  id: true,
  joinedAt: true
});
var streamBans = pgTable("stream_bans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").notNull().references(() => liveStreams.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  bannedBy: varchar("banned_by").notNull().references(() => users.id),
  reason: text("reason"),
  isPermanent: boolean("is_permanent").default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  streamUserUnique: index("stream_ban_stream_user_unique").on(table.streamId, table.userId),
  streamIdx: index("stream_ban_stream_idx").on(table.streamId),
  userIdx: index("stream_ban_user_idx").on(table.userId)
}));
var insertStreamBanSchema = createInsertSchema(streamBans).omit({
  id: true,
  createdAt: true
});
var streamMutes = pgTable("stream_mutes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").notNull().references(() => liveStreams.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  mutedBy: varchar("muted_by").notNull().references(() => users.id),
  reason: text("reason"),
  durationMinutes: integer("duration_minutes"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  streamUserUnique: index("stream_mute_stream_user_unique").on(table.streamId, table.userId),
  streamIdx: index("stream_mute_stream_idx").on(table.streamId),
  userIdx: index("stream_mute_user_idx").on(table.userId)
}));
var insertStreamMuteSchema = createInsertSchema(streamMutes).omit({
  id: true,
  createdAt: true
});
var storeBadgeTypeEnum = pgEnum("store_badge_type", [
  "verified",
  // ✅ Resmi/Onaylı Satıcı
  "successful",
  // ⭐ Başarılı Satıcı (yüksek puan, çok satış)
  "fast_seller",
  // 🚀 Hızlı Satıcı (hızlı yanıt)
  "top_rated",
  // 🏆 En Çok Beğenilen
  "trusted",
  // 🛡️ Güvenilir Satıcı (uzun üyelik)
  "premium"
  // 💎 Premium Satıcı
]);
var stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  // URL-friendly store name
  displayName: text("display_name").notNull(),
  // Store name
  storeType: storeTypeEnum("store_type").notNull(),
  // Kept for backward compatibility
  categoryId: varchar("category_id").references(() => storeCategories.id),
  // NEW: Hierarchical category
  summary: text("summary"),
  // Short description
  description: text("description"),
  // Full description
  // Contact info
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  address: text("address"),
  city: text("city"),
  district: text("district"),
  // Branding
  logo: text("logo"),
  // Object storage key
  banner: text("banner"),
  // Object storage key
  primaryColor: text("primary_color").default("#0066CC"),
  // Brand color
  secondaryColor: text("secondary_color").default("#FFA500"),
  bannerTemplate: text("banner_template"),
  // Hazır şablon ID'si (template-1, template-2, vb.)
  // Stats
  totalListings: integer("total_listings").default(0),
  totalSales: integer("total_sales").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  followerCount: integer("follower_count").default(0),
  // Takipçi sayısı
  viewCount: integer("view_count").default(0),
  // Görüntülenme sayısı
  responseTime: integer("response_time"),
  // Ortalama yanıt süresi (dakika)
  // Badges - Rozetler (JSON array of badge types)
  badges: jsonb("badges").$type().default(sql`'[]'::jsonb`),
  // Veteriner/Hizmet profili için ekstra alanlar
  workingHours: jsonb("working_hours").$type(),
  services: jsonb("services").$type(),
  // Sunulan hizmetler listesi
  specializations: jsonb("specializations").$type(),
  // Uzmanlık alanları
  // Status
  status: storeStatusEnum("status").default("draft").notNull(),
  verifiedAt: timestamp("verified_at"),
  // Admin verification timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  ownerIdx: index("store_owner_idx").on(table.ownerId),
  slugIdx: index("store_slug_idx").on(table.slug),
  typeIdx: index("store_type_idx").on(table.storeType),
  statusIdx: index("store_status_idx").on(table.status),
  cityIdx: index("store_city_idx").on(table.city)
}));
var insertStoreSchema = createInsertSchema(stores).omit({
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
  verifiedAt: true
});
var storeFollowers = pgTable("store_followers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  storeIdx: index("store_follower_store_idx").on(table.storeId),
  userIdx: index("store_follower_user_idx").on(table.userId),
  storeUserUnique: index("store_follower_unique").on(table.storeId, table.userId)
}));
var insertStoreFollowerSchema = createInsertSchema(storeFollowers).omit({
  id: true,
  createdAt: true
});
var storeMedia = pgTable("store_media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  // 'image' | 'video'
  url: text("url").notNull(),
  // Object storage key
  caption: text("caption"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  storeIdx: index("store_media_store_idx").on(table.storeId)
}));
var insertStoreMediaSchema = createInsertSchema(storeMedia).omit({
  id: true,
  createdAt: true
});
var storeReviews = pgTable("store_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeId: varchar("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  // 1-5 stars
  title: text("title"),
  comment: text("comment"),
  // Moderation
  status: text("status").default("pending").notNull(),
  // pending | approved | rejected
  moderatedBy: varchar("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  storeIdx: index("store_review_store_idx").on(table.storeId),
  reviewerIdx: index("store_review_reviewer_idx").on(table.reviewerId),
  statusIdx: index("store_review_status_idx").on(table.status),
  // Prevent multiple reviews from same user
  storeReviewerUnique: index("store_reviewer_unique").on(table.storeId, table.reviewerId)
}));
var insertStoreReviewSchema = createInsertSchema(storeReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  moderatedBy: true,
  moderatedAt: true
}).extend({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Yorum en az 10 karakter olmal\u0131").optional()
});
var blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id]
  })
}));
var storesRelations = relations(stores, ({ one, many }) => ({
  owner: one(users, {
    fields: [stores.ownerId],
    references: [users.id]
  }),
  listings: many(listings),
  reviews: many(storeReviews),
  media: many(storeMedia),
  followers: many(storeFollowers)
}));
var storeFollowersRelations = relations(storeFollowers, ({ one }) => ({
  store: one(stores, {
    fields: [storeFollowers.storeId],
    references: [stores.id]
  }),
  user: one(users, {
    fields: [storeFollowers.userId],
    references: [users.id]
  })
}));
var storeReviewsRelations = relations(storeReviews, ({ one }) => ({
  store: one(stores, {
    fields: [storeReviews.storeId],
    references: [stores.id]
  }),
  reviewer: one(users, {
    fields: [storeReviews.reviewerId],
    references: [users.id]
  })
}));
var storeMediaRelations = relations(storeMedia, ({ one }) => ({
  store: one(stores, {
    fields: [storeMedia.storeId],
    references: [stores.id]
  })
}));
var auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, BAN, UNBAN, APPROVE, REJECT
  entity: text("entity").notNull(),
  // user, listing, store, report, blog, category, settings
  entityId: varchar("entity_id"),
  details: text("details"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  level: text("level").default("info").notNull(),
  // info, warning, error
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  userIdx: index("audit_logs_user_idx").on(table.userId),
  entityIdx: index("audit_logs_entity_idx").on(table.entity),
  createdIdx: index("audit_logs_created_idx").on(table.createdAt),
  levelIdx: index("audit_logs_level_idx").on(table.level)
}));
var systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: text("value"),
  category: text("category").notNull(),
  // general, email, security, notifications
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var adminBroadcasts = pgTable("admin_broadcasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  type: text("type").default("push").notNull(),
  // push, email, sms, all
  targetAudience: text("target_audience").default("all").notNull(),
  // all, sellers, buyers, verified
  sentBy: varchar("sent_by").references(() => users.id),
  recipientCount: integer("recipient_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  openedCount: integer("opened_count").default(0),
  status: text("status").default("pending").notNull(),
  // pending, sending, sent, failed
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  statusIdx: index("admin_broadcasts_status_idx").on(table.status),
  createdIdx: index("admin_broadcasts_created_idx").on(table.createdAt)
}));
var insertAdminBroadcastSchema = createInsertSchema(adminBroadcasts).omit({
  id: true,
  sentBy: true,
  recipientCount: true,
  deliveredCount: true,
  openedCount: true,
  status: true,
  sentAt: true,
  createdAt: true
});
var viewedListings = pgTable("viewed_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow().notNull()
}, (table) => ({
  userListingIdx: index("viewed_listings_user_listing_idx").on(table.userId, table.listingId),
  userViewedIdx: index("viewed_listings_user_viewed_idx").on(table.userId, table.viewedAt)
}));
var insertViewedListingSchema = createInsertSchema(viewedListings).omit({
  id: true,
  viewedAt: true
});
var sellerReviews = pgTable("seller_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: varchar("listing_id").references(() => listings.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(),
  // 1-5 yıldız
  comment: text("comment"),
  sellerResponse: text("seller_response"),
  // Satıcının yanıtı
  sellerResponseAt: timestamp("seller_response_at"),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false),
  // Gerçek alışveriş yapıldı mı
  helpfulCount: integer("helpful_count").default(0),
  status: text("status").default("active").notNull(),
  // active, hidden, reported
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  sellerIdx: index("seller_reviews_seller_idx").on(table.sellerId),
  reviewerIdx: index("seller_reviews_reviewer_idx").on(table.reviewerId),
  ratingIdx: index("seller_reviews_rating_idx").on(table.rating),
  sellerReviewerUnique: index("seller_reviews_seller_reviewer_unique").on(table.sellerId, table.reviewerId)
}));
var insertSellerReviewSchema = createInsertSchema(sellerReviews).omit({
  id: true,
  sellerResponse: true,
  sellerResponseAt: true,
  helpfulCount: true,
  status: true,
  createdAt: true,
  updatedAt: true
});
var listingVideos = pgTable("listing_videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"),
  // saniye cinsinden
  size: integer("size"),
  // byte cinsinden
  mimeType: text("mime_type"),
  order: integer("order").default(0),
  status: text("status").default("processing").notNull(),
  // processing, ready, failed
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  listingIdx: index("listing_videos_listing_idx").on(table.listingId),
  orderIdx: index("listing_videos_order_idx").on(table.listingId, table.order)
}));
var insertListingVideoSchema = createInsertSchema(listingVideos).omit({
  id: true,
  thumbnailUrl: true,
  duration: true,
  size: true,
  status: true,
  createdAt: true
});
var contactRequests = pgTable("contact_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  senderPhone: text("sender_phone"),
  message: text("message").notNull(),
  ipAddress: varchar("ip_address"),
  recaptchaScore: decimal("recaptcha_score", { precision: 3, scale: 2 }),
  status: text("status").default("pending").notNull(),
  // pending, replied, spam, archived
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  listingIdx: index("contact_requests_listing_idx").on(table.listingId),
  sellerIdx: index("contact_requests_seller_idx").on(table.sellerId),
  statusIdx: index("contact_requests_status_idx").on(table.status),
  emailIdx: index("contact_requests_email_idx").on(table.senderEmail)
}));
var insertContactRequestSchema = createInsertSchema(contactRequests).omit({
  id: true,
  ipAddress: true,
  recaptchaScore: true,
  status: true,
  repliedAt: true,
  createdAt: true
});
var categoryStats = pgTable("category_stats", {
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
  newListings: integer("new_listings").default(0),
  // O gün eklenen ilanlar
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  categoryDateIdx: index("category_stats_category_date_idx").on(table.categorySlug, table.date),
  dateIdx: index("category_stats_date_idx").on(table.date)
}));
var searchNotificationLogs = pgTable("search_notification_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  savedSearchId: varchar("saved_search_id").notNull().references(() => savedSearches.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matchedListingIds: jsonb("matched_listing_ids").$type().default([]),
  emailSent: boolean("email_sent").default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  savedSearchIdx: index("search_notification_logs_saved_search_idx").on(table.savedSearchId),
  userIdx: index("search_notification_logs_user_idx").on(table.userId),
  sentIdx: index("search_notification_logs_sent_idx").on(table.sentAt)
}));
var marketPriceTypeEnum = pgEnum("market_price_type", [
  "buyukbas",
  // Büyükbaş hayvan
  "kucukbas",
  // Küçükbaş hayvan
  "kanatli",
  // Kanatlı hayvan
  "yem",
  // Yem fiyatları
  "sut",
  // Süt fiyatları
  "et",
  // Et fiyatları
  "bal",
  // Bal fiyatları
  "yumurta"
  // Yumurta fiyatları
]);
var marketPrices = pgTable("market_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: marketPriceTypeEnum("type").notNull(),
  category: varchar("category").notNull(),
  // Alt kategori (ör: dana, buzağı, koyun, kıl keçisi)
  city: varchar("city").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  unit: varchar("unit").notNull(),
  // kg, adet, litre, ton
  minPrice: decimal("min_price", { precision: 12, scale: 2 }),
  maxPrice: decimal("max_price", { precision: 12, scale: 2 }),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }),
  // Günlük değişim %
  source: varchar("source"),
  // Kaynak (ör: hal, borsa, manuel)
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  typeCityIdx: index("market_prices_type_city_idx").on(table.type, table.city),
  dateIdx: index("market_prices_date_idx").on(table.date),
  categoryIdx: index("market_prices_category_idx").on(table.category)
}));
var insertMarketPriceSchema = createInsertSchema(marketPrices).omit({
  id: true,
  createdAt: true
});
var vetServiceTypeEnum = pgEnum("vet_service_type", [
  "video_call",
  // Video görüşme
  "photo_diagnosis",
  // Fotoğrafla teşhis
  "chat",
  // Yazılı danışma
  "subscription"
  // Abonelik paketi
]);
var vetServiceStatusEnum = pgEnum("vet_service_status", [
  "pending",
  // Beklemede
  "scheduled",
  // Planlandı
  "in_progress",
  // Devam ediyor
  "completed",
  // Tamamlandı
  "cancelled"
  // İptal edildi
]);
var vetOnlineServices = pgTable("vet_online_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vetId: varchar("vet_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: vetServiceTypeEnum("type").notNull(),
  status: vetServiceStatusEnum("status").default("pending").notNull(),
  animalType: varchar("animal_type"),
  // Hayvan türü
  animalAge: varchar("animal_age"),
  symptoms: text("symptoms"),
  // Belirtiler
  images: jsonb("images").$type().default([]),
  // Yüklenen fotoğraflar
  diagnosis: text("diagnosis"),
  // Teşhis
  prescription: text("prescription"),
  // Reçete
  notes: text("notes"),
  // Notlar
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  price: decimal("price", { precision: 10, scale: 2 }),
  isPaid: boolean("is_paid").default(false),
  rating: integer("rating"),
  // 1-5
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  vetIdx: index("vet_services_vet_idx").on(table.vetId),
  clientIdx: index("vet_services_client_idx").on(table.clientId),
  statusIdx: index("vet_services_status_idx").on(table.status),
  typeIdx: index("vet_services_type_idx").on(table.type)
}));
var insertVetOnlineServiceSchema = createInsertSchema(vetOnlineServices).omit({
  id: true,
  status: true,
  diagnosis: true,
  prescription: true,
  completedAt: true,
  isPaid: true,
  rating: true,
  review: true,
  createdAt: true,
  updatedAt: true
});
var vetSubscriptions = pgTable("vet_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vetId: varchar("vet_id").references(() => users.id, { onDelete: "set null" }),
  planType: varchar("plan_type").notNull(),
  // basic, premium, enterprise
  animalCount: integer("animal_count").default(1),
  // Takip edilen hayvan sayısı
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  autoRenew: boolean("auto_renew").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  userIdx: index("vet_subs_user_idx").on(table.userId),
  vetIdx: index("vet_subs_vet_idx").on(table.vetId),
  activeIdx: index("vet_subs_active_idx").on(table.isActive)
}));
var transportRequestStatusEnum = pgEnum("transport_request_status", [
  "pending",
  // Talep oluşturuldu, teklif bekleniyor
  "quoted",
  // Teklifler geldi
  "accepted",
  // Teklif kabul edildi
  "in_transit",
  // Taşıma devam ediyor
  "delivered",
  // Teslim edildi
  "completed",
  // Tamamlandı ve ödendi
  "cancelled"
  // İptal edildi
]);
var professionalVerificationStatusEnum = pgEnum("professional_verification_status", [
  "pending",
  "approved",
  "rejected"
]);
var professionalVerifications = pgTable("professional_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  professionalType: varchar("professional_type").notNull(),
  // veterinarian | transporter | b2b_seller | dairy_seller
  documentType: varchar("document_type").notNull(),
  documentNumber: text("document_number"),
  issuingAuthority: text("issuing_authority"),
  documentUrl: text("document_url"),
  documentKey: text("document_key"),
  notes: text("notes"),
  status: professionalVerificationStatusEnum("status").default("pending").notNull(),
  adminNotes: text("admin_notes"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  userIdx: index("prof_verif_user_idx").on(table.userId),
  statusIdx: index("prof_verif_status_idx").on(table.status),
  typeIdx: index("prof_verif_type_idx").on(table.professionalType)
}));
var insertProfessionalVerificationSchema = createInsertSchema(professionalVerifications).omit({
  id: true,
  userId: true,
  status: true,
  adminNotes: true,
  reviewedBy: true,
  reviewedAt: true,
  createdAt: true
});
var transportRequests = pgTable("transport_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  animalType: varchar("animal_type").notNull(),
  // Hayvan türü
  animalCount: integer("animal_count").notNull(),
  animalWeight: decimal("animal_weight", { precision: 10, scale: 2 }),
  // Toplam ağırlık (kg)
  originCity: varchar("origin_city").notNull(),
  originDistrict: varchar("origin_district"),
  originAddress: text("origin_address"),
  destinationCity: varchar("destination_city").notNull(),
  destinationDistrict: varchar("destination_district"),
  destinationAddress: text("destination_address"),
  preferredDate: timestamp("preferred_date"),
  flexibleDate: boolean("flexible_date").default(true),
  specialRequirements: text("special_requirements"),
  // Özel gereksinimler
  status: transportRequestStatusEnum("status").default("pending").notNull(),
  acceptedQuoteId: varchar("accepted_quote_id"),
  estimatedDistance: integer("estimated_distance"),
  // km
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  userIdx: index("transport_req_user_idx").on(table.userId),
  statusIdx: index("transport_req_status_idx").on(table.status),
  originIdx: index("transport_req_origin_idx").on(table.originCity),
  destIdx: index("transport_req_dest_idx").on(table.destinationCity)
}));
var insertTransportRequestSchema = createInsertSchema(transportRequests).omit({
  id: true,
  status: true,
  acceptedQuoteId: true,
  estimatedDistance: true,
  createdAt: true,
  updatedAt: true
});
var transportQuotes = pgTable("transport_quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull().references(() => transportRequests.id, { onDelete: "cascade" }),
  transporterId: varchar("transporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  estimatedDuration: integer("estimated_duration"),
  // saat cinsinden
  vehicleType: varchar("vehicle_type"),
  // Araç tipi
  vehicleCapacity: varchar("vehicle_capacity"),
  // Kapasite
  insuranceIncluded: boolean("insurance_included").default(false),
  notes: text("notes"),
  isAccepted: boolean("is_accepted").default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  requestIdx: index("transport_quotes_request_idx").on(table.requestId),
  transporterIdx: index("transport_quotes_transporter_idx").on(table.transporterId)
}));
var insertTransportQuoteSchema = createInsertSchema(transportQuotes).omit({
  id: true,
  isAccepted: true,
  createdAt: true
});
var b2bListingStatusEnum = pgEnum("b2b_listing_status", [
  "active",
  "sold_out",
  "paused",
  "expired"
]);
var b2bListings = pgTable("b2b_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "set null" }),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  // Karma yem, kanatlı yemi, balık yemi, arı keki vb.
  brand: varchar("brand"),
  unit: varchar("unit").notNull(),
  // kg, ton, çuval, paket
  minQuantity: integer("min_quantity").notNull(),
  // Minimum sipariş miktarı
  maxQuantity: integer("max_quantity"),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  bulkDiscounts: jsonb("bulk_discounts").$type().default([]),
  availableStock: integer("available_stock"),
  images: jsonb("images").$type().default([]),
  specifications: jsonb("specifications").$type().default({}),
  deliveryOptions: jsonb("delivery_options").$type().default([]),
  status: b2bListingStatusEnum("status").default("active").notNull(),
  viewCount: integer("view_count").default(0),
  orderCount: integer("order_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  sellerIdx: index("b2b_listings_seller_idx").on(table.sellerId),
  categoryIdx: index("b2b_listings_category_idx").on(table.category),
  statusIdx: index("b2b_listings_status_idx").on(table.status)
}));
var insertB2bListingSchema = createInsertSchema(b2bListings).omit({
  id: true,
  status: true,
  viewCount: true,
  orderCount: true,
  createdAt: true,
  updatedAt: true
});
var b2bOrderStatusEnum = pgEnum("b2b_order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled"
]);
var b2bOrders = pgTable("b2b_orders", {
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
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  buyerIdx: index("b2b_orders_buyer_idx").on(table.buyerId),
  sellerIdx: index("b2b_orders_seller_idx").on(table.sellerId),
  statusIdx: index("b2b_orders_status_idx").on(table.status)
}));
var farmTvStreamStatusEnum = pgEnum("farm_tv_stream_status", [
  "scheduled",
  "live",
  "ended",
  "cancelled"
]);
var farmTvStreams = pgTable("farm_tv_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamerId: varchar("streamer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category"),
  // Çiftlik, arıcılık, kümes vb.
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
  totalGifts: integer("total_gifts").default(0),
  // Hediye sayısı
  totalEarnings: decimal("total_earnings", { precision: 12, scale: 2 }).default("0"),
  isEnabled: boolean("is_enabled").default(false),
  // Platform seviyesinde aktif mi
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  streamerIdx: index("farm_tv_streamer_idx").on(table.streamerId),
  statusIdx: index("farm_tv_status_idx").on(table.status),
  scheduledIdx: index("farm_tv_scheduled_idx").on(table.scheduledAt)
}));
var farmTvGifts = pgTable("farm_tv_gifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").notNull().references(() => farmTvStreams.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  giftType: varchar("gift_type").notNull(),
  // sticker, rozet, jeton
  giftName: varchar("gift_name").notNull(),
  quantity: integer("quantity").default(1),
  tokenValue: integer("token_value").notNull(),
  // Jeton değeri
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
  streamIdx: index("farm_tv_gifts_stream_idx").on(table.streamId),
  senderIdx: index("farm_tv_gifts_sender_idx").on(table.senderId)
}));
var wholesaleProductStatusEnum = pgEnum("wholesale_product_status", [
  "active",
  "out_of_stock",
  "seasonal",
  "discontinued"
]);
var wholesaleProducts = pgTable("wholesale_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "set null" }),
  productType: varchar("product_type").notNull(),
  // süt, yoğurt, peynir, bal, yumurta vb.
  title: varchar("title").notNull(),
  description: text("description"),
  origin: varchar("origin"),
  // Menşei (çiftlik adı, bölge)
  unit: varchar("unit").notNull(),
  // litre, kg, adet, koli
  minOrder: integer("min_order").notNull(),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  bulkPricing: jsonb("bulk_pricing").$type().default([]),
  availableQuantity: integer("available_quantity"),
  images: jsonb("images").$type().default([]),
  certifications: jsonb("certifications").$type().default([]),
  // Organik, çiftlik onaylı vb.
  isCertified: boolean("is_certified").default(false),
  // "Çiftlik Onaylı Ürün" etiketi
  deliveryZones: jsonb("delivery_zones").$type().default([]),
  // Teslimat yapılan iller
  status: wholesaleProductStatusEnum("status").default("active").notNull(),
  orderCount: integer("order_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  sellerIdx: index("wholesale_seller_idx").on(table.sellerId),
  typeIdx: index("wholesale_type_idx").on(table.productType),
  statusIdx: index("wholesale_status_idx").on(table.status),
  certifiedIdx: index("wholesale_certified_idx").on(table.isCertified)
}));
var insertWholesaleProductSchema = createInsertSchema(wholesaleProducts).omit({
  id: true,
  status: true,
  orderCount: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true
});
var wholesaleOrderStatusEnum = pgEnum("wholesale_order_status", [
  "pending",
  "confirmed",
  "preparing",
  "in_delivery",
  "delivered",
  "cancelled"
]);
var wholesaleOrders = pgTable("wholesale_orders", {
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
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
  buyerIdx: index("wholesale_orders_buyer_idx").on(table.buyerId),
  sellerIdx: index("wholesale_orders_seller_idx").on(table.sellerId),
  statusIdx: index("wholesale_orders_status_idx").on(table.status)
}));

// server/db.ts
var { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL tan\u0131ml\u0131 de\u011Fil. .env dosyan\u0131z\u0131 doldurun (bkz. .env.example / KURULUM.md)."
  );
}
var connectionString = process.env.DATABASE_URL;
var isServerless = !!process.env.VERCEL;
var needsSsl = /supabase|neon|render|railway|amazonaws/.test(connectionString) || process.env.PGSSLMODE === "require";
var pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : void 0,
  max: isServerless ? 1 : 10,
  min: isServerless ? 0 : 2,
  idleTimeoutMillis: isServerless ? 1e4 : 3e4,
  connectionTimeoutMillis: 1e4,
  allowExitOnIdle: isServerless
});
pool.on("error", (err) => {
  console.error("PostgreSQL havuz hatas\u0131:", err.message);
});
if (!isServerless) {
  const closePool = async () => {
    console.log("\u{1F50C} PostgreSQL havuzu kapat\u0131l\u0131yor...");
    try {
      await pool.end();
    } catch {
    }
  };
  process.once("SIGTERM", closePool);
  process.once("SIGINT", closePool);
}
var db = drizzle(pool, { schema: schema_exports });
function getPoolStats() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  };
}

// server/db-storage.ts
import { eq, and, gte, lte, or, sql as sql2, inArray } from "drizzle-orm";
var DbStorage = class {
  // ============ Kullanicilar ============
  async getUser(id) {
    return await db.query.users.findFirst({
      where: eq(users.id, id)
    });
  }
  async upsertUser(userData) {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, userData.email)
    });
    if (existingUser) {
      const [updated] = await db.update(users).set({
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, existingUser.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(users).values(userData).returning();
      return created;
    }
  }
  async getUserByEmail(email) {
    return await db.query.users.findFirst({
      where: eq(users.email, email)
    });
  }
  async createUser(user) {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }
  async updateUser(id, update) {
    const [updated] = await db.update(users).set(update).where(eq(users.id, id)).returning();
    return updated;
  }
  // ============ Categories ============
  async getAllCategories() {
    return await db.query.categories.findMany({
      orderBy: (categories2, { asc: asc2 }) => [asc2(categories2.order)]
    });
  }
  async getCategory(id) {
    return await db.query.categories.findFirst({
      where: eq(categories.id, id)
    });
  }
  async getCategoryBySlug(slug) {
    return await db.query.categories.findFirst({
      where: eq(categories.slug, slug)
    });
  }
  async createCategory(category) {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }
  // ============ Listings ============
  async getAllListings(filters) {
    const conditions = [];
    if (filters?.categoryId) {
      conditions.push(eq(listings.categoryId, filters.categoryId));
    }
    if (filters?.city) {
      conditions.push(eq(listings.city, filters.city));
    }
    if (filters?.minPrice) {
      conditions.push(gte(listings.price, filters.minPrice));
    }
    if (filters?.maxPrice) {
      conditions.push(lte(listings.price, filters.maxPrice));
    }
    if (filters?.status) {
      conditions.push(eq(listings.status, filters.status));
    }
    if (filters?.search) {
      conditions.push(
        sql2`(
          public.tr_normalize(${listings.title}) LIKE public.tr_normalize(${`%${filters.search}%`})
          OR public.tr_normalize(${listings.description}) LIKE public.tr_normalize(${`%${filters.search}%`})
        )`
      );
    }
    return await db.query.listings.findMany({
      where: conditions.length > 0 ? and(...conditions) : void 0,
      orderBy: (listings2, { desc: desc6 }) => [desc6(listings2.createdAt)]
    });
  }
  async getListing(id) {
    return await db.query.listings.findFirst({
      where: eq(listings.id, id)
    });
  }
  async getListingsBySeller(sellerId) {
    return await db.query.listings.findMany({
      where: eq(listings.sellerId, sellerId),
      orderBy: (listings2, { desc: desc6 }) => [desc6(listings2.createdAt)]
    });
  }
  async createListing(listing) {
    const [created] = await db.insert(listings).values(listing).returning();
    return created;
  }
  async updateListing(id, update) {
    const [updated] = await db.update(listings).set({ ...update, updatedAt: /* @__PURE__ */ new Date() }).where(eq(listings.id, id)).returning();
    return updated;
  }
  async deleteListing(id) {
    const result = await db.delete(listings).where(eq(listings.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  async incrementListingViews(id) {
    await db.update(listings).set({ views: sql2`${listings.views} + 1` }).where(eq(listings.id, id));
  }
  // ============ Auctions ============
  async getAllAuctions(status) {
    return await db.query.auctions.findMany({
      where: status ? eq(auctions.status, status) : void 0,
      orderBy: (auctions2, { desc: desc6 }) => [desc6(auctions2.createdAt)]
    });
  }
  async getAuction(id) {
    return await db.query.auctions.findFirst({
      where: eq(auctions.id, id)
    });
  }
  async getAuctionByListingId(listingId) {
    return await db.query.auctions.findFirst({
      where: eq(auctions.listingId, listingId)
    });
  }
  async createAuction(auction) {
    const [created] = await db.insert(auctions).values({ ...auction, currentPrice: auction.startPrice }).returning();
    return created;
  }
  async updateAuction(id, update) {
    const [updated] = await db.update(auctions).set(update).where(eq(auctions.id, id)).returning();
    return updated;
  }
  // ============ Bids ============
  async getBidsByAuction(auctionId) {
    return await db.query.bids.findMany({
      where: eq(bids.auctionId, auctionId),
      orderBy: (bids2, { desc: desc6 }) => [desc6(bids2.createdAt)]
    });
  }
  async createBid(bid) {
    return await db.transaction(async (tx) => {
      const [created] = await tx.insert(bids).values(bid).returning();
      await tx.update(auctions).set({
        currentPrice: bid.amount,
        totalBids: sql2`${auctions.totalBids} + 1`
      }).where(eq(auctions.id, bid.auctionId));
      return created;
    });
  }
  // ============ Live Streams ============
  async getAllLiveStreams(status) {
    return await db.query.liveStreams.findMany({
      where: status ? eq(liveStreams.status, status) : void 0,
      orderBy: (liveStreams2, { desc: desc6 }) => [desc6(liveStreams2.createdAt)]
    });
  }
  async getLiveStream(id) {
    return await db.query.liveStreams.findFirst({
      where: eq(liveStreams.id, id)
    });
  }
  async getLiveStreamsByStreamer(streamerId) {
    return await db.query.liveStreams.findMany({
      where: eq(liveStreams.streamerId, streamerId),
      orderBy: (liveStreams2, { desc: desc6 }) => [desc6(liveStreams2.createdAt)]
    });
  }
  async createLiveStream(stream) {
    const [created] = await db.insert(liveStreams).values(stream).returning();
    return created;
  }
  async updateLiveStream(id, update) {
    const [updated] = await db.update(liveStreams).set(update).where(eq(liveStreams.id, id)).returning();
    return updated;
  }
  async deleteLiveStream(id) {
    const result = await db.delete(liveStreams).where(eq(liveStreams.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  // ============ Messages ============
  async getMessagesBetweenUsers(userId1, userId2) {
    return await db.query.messages.findMany({
      where: or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      ),
      orderBy: (messages2, { asc: asc2 }) => [asc2(messages2.createdAt)]
    });
  }
  async getConversations(userId) {
    const userMessages = await db.query.messages.findMany({
      where: or(
        eq(messages.senderId, userId),
        eq(messages.receiverId, userId)
      ),
      orderBy: (messages2, { desc: desc6 }) => [desc6(messages2.createdAt)]
    });
    const conversationMap = /* @__PURE__ */ new Map();
    for (const msg of userMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, msg);
      }
    }
    const partnerIds = Array.from(conversationMap.keys());
    if (partnerIds.length === 0) return [];
    const partners = await db.query.users.findMany({
      where: inArray(users.id, partnerIds)
    });
    const conversations2 = [];
    for (const partner of partners) {
      const lastMessage = conversationMap.get(partner.id);
      if (lastMessage) {
        conversations2.push({ user: partner, lastMessage });
      }
    }
    return conversations2;
  }
  async createMessage(message) {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }
  async updateMessageStatus(id, status) {
    await db.update(messages).set({ status }).where(eq(messages.id, id));
  }
  // ============ Blog Posts ============
  async getAllBlogPosts(published) {
    return await db.query.blogPosts.findMany({
      where: published !== void 0 ? eq(blogPosts.published, published) : void 0,
      orderBy: (blogPosts2, { desc: desc6 }) => [desc6(blogPosts2.createdAt)]
    });
  }
  async getBlogPost(id) {
    return await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id)
    });
  }
  async getBlogPostBySlug(slug) {
    return await db.query.blogPosts.findFirst({
      where: eq(blogPosts.slug, slug)
    });
  }
  async createBlogPost(post) {
    const [created] = await db.insert(blogPosts).values(post).returning();
    return created;
  }
  async updateBlogPost(id, update) {
    const [updated] = await db.update(blogPosts).set(update).where(eq(blogPosts.id, id)).returning();
    return updated;
  }
  // ============ Vet Services ============
  async getAllVetServices(city) {
    return await db.query.vetServices.findMany({
      where: city ? eq(vetServices.city, city) : void 0
    });
  }
  async getVetService(id) {
    return await db.query.vetServices.findFirst({
      where: eq(vetServices.id, id)
    });
  }
  async getVetServicesByVet(vetId) {
    return await db.query.vetServices.findMany({
      where: eq(vetServices.vetId, vetId)
    });
  }
  async createVetService(service) {
    const [created] = await db.insert(vetServices).values(service).returning();
    return created;
  }
  async updateVetService(id, update) {
    const [updated] = await db.update(vetServices).set(update).where(eq(vetServices.id, id)).returning();
    return updated;
  }
  // ============ Transport Services ============
  async getAllTransportServices(city) {
    return await db.query.transportServices.findMany({
      where: city ? sql2`${transportServices.serviceAreas} @> ${JSON.stringify([city])}::jsonb` : void 0
    });
  }
  async getTransportService(id) {
    return await db.query.transportServices.findFirst({
      where: eq(transportServices.id, id)
    });
  }
  async getTransportServicesByTransporter(transporterId) {
    return await db.query.transportServices.findMany({
      where: eq(transportServices.transporterId, transporterId)
    });
  }
  async createTransportService(service) {
    const [created] = await db.insert(transportServices).values(service).returning();
    return created;
  }
  async updateTransportService(id, update) {
    const [updated] = await db.update(transportServices).set(update).where(eq(transportServices.id, id)).returning();
    return updated;
  }
  // ============ Reviews ============
  async getReviewsByTarget(targetId, targetType) {
    return await db.query.reviews.findMany({
      where: and(
        eq(reviews.targetId, targetId),
        eq(reviews.targetType, targetType)
      ),
      orderBy: (reviews2, { desc: desc6 }) => [desc6(reviews2.createdAt)]
    });
  }
  async createReview(review) {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }
  // ============ Favorites ============
  async getFavoritesByUser(userId) {
    return await db.query.favorites.findMany({
      where: eq(favorites.userId, userId),
      orderBy: (favorites2, { desc: desc6 }) => [desc6(favorites2.createdAt)]
    });
  }
  async createFavorite(favorite) {
    const [created] = await db.insert(favorites).values(favorite).returning();
    return created;
  }
  async deleteFavorite(userId, listingId) {
    const result = await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  async isFavorite(userId, listingId) {
    const favorite = await db.query.favorites.findFirst({
      where: and(eq(favorites.userId, userId), eq(favorites.listingId, listingId))
    });
    return !!favorite;
  }
};

// server/storage.ts
var storage = new DbStorage();

// server/auth.ts
import passport from "passport";
import session from "express-session";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
var SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1e3;
var sessionMiddleware = null;
function getSession() {
  if (sessionMiddleware) return sessionMiddleware;
  const isProd = process.env.NODE_ENV === "production";
  if (!process.env.SESSION_SECRET) {
    if (isProd) {
      throw new Error("SESSION_SECRET tan\u0131ml\u0131 de\u011Fil \u2014 \xFCretimde zorunlu.");
    }
    console.warn("\u26A0\uFE0F  SESSION_SECRET yok, geli\u015Ftirme i\xE7in ge\xE7ici anahtar kullan\u0131l\u0131yor.");
  }
  let store;
  if (process.env.DATABASE_URL) {
    const PgStore = connectPg(session);
    store = new PgStore({
      pool,
      createTableIfMissing: false,
      ttl: SESSION_TTL_MS / 1e3,
      tableName: "sessions"
    });
  } else {
    const MemStore = MemoryStore(session);
    store = new MemStore({ checkPeriod: SESSION_TTL_MS });
    console.warn("\u26A0\uFE0F  DATABASE_URL yok \u2014 oturumlar bellekte (yeniden ba\u015Flat\u0131nca silinir).");
  }
  sessionMiddleware = session({
    name: "shv.sid",
    secret: process.env.SESSION_SECRET || "dev-only-insecure-secret",
    store,
    resave: false,
    saveUninitialized: false,
    proxy: isProd,
    // Vercel/proxy arkasında secure cookie için gerekli
    cookie: {
      httpOnly: true,
      // Yerelde http üzerinden çalışıldığı için secure sadece üretimde
      secure: isProd,
      // Aynı alan adından servis ediliyoruz → "lax" hem güvenli hem çalışır
      sameSite: "lax",
      maxAge: SESSION_TTL_MS,
      path: "/"
    }
  });
  return sessionMiddleware;
}
async function upsertOAuthUser(profile) {
  if (!profile.email) {
    throw new Error("Sa\u011Flay\u0131c\u0131dan e-posta al\u0131namad\u0131");
  }
  const dbUser = await storage.upsertUser({
    email: profile.email,
    firstName: profile.firstName ?? null,
    lastName: profile.lastName ?? null,
    profileImageUrl: profile.profileImageUrl ?? null
  });
  return { claims: { sub: dbUser.id }, dbUserId: dbUser.id, role: dbUser.role };
}
function callbackBase() {
  const url = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") || `http://localhost:${process.env.PORT || 5e3}`;
  return url.replace(/\/$/, "");
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  const enabled = [];
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${callbackBase()}/api/auth/google/callback`,
          scope: ["profile", "email"]
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const user = await upsertOAuthUser({
              email: profile.emails?.[0]?.value,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              profileImageUrl: profile.photos?.[0]?.value
            });
            done(null, user);
          } catch (err) {
            done(err);
          }
        }
      )
    );
    app2.get("/api/auth/google", passport.authenticate("google"));
    app2.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/giris?hata=google" }),
      (_req, res) => res.redirect("/")
    );
    enabled.push("Google");
  }
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: `${callbackBase()}/api/auth/facebook/callback`,
          profileFields: ["id", "emails", "name", "picture.type(large)"]
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const user = await upsertOAuthUser({
              email: profile.emails?.[0]?.value,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              profileImageUrl: profile.photos?.[0]?.value
            });
            done(null, user);
          } catch (err) {
            done(err);
          }
        }
      )
    );
    app2.get("/api/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));
    app2.get(
      "/api/auth/facebook/callback",
      passport.authenticate("facebook", { failureRedirect: "/giris?hata=facebook" }),
      (_req, res) => res.redirect("/")
    );
    enabled.push("Facebook");
  }
  app2.get("/api/login", (_req, res) => res.redirect("/giris"));
  app2.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) console.error("Logout error:", err);
      req.session?.destroy(() => {
        res.clearCookie("shv.sid");
        res.redirect("/");
      });
    });
  });
  app2.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) console.error("Logout error:", err);
      req.session?.destroy(() => {
        res.clearCookie("shv.sid");
        res.json({ message: "\xC7\u0131k\u0131\u015F yap\u0131ld\u0131" });
      });
    });
  });
  console.log(
    `\u{1F510} Kimlik do\u011Frulama haz\u0131r (e-posta${enabled.length ? " + " + enabled.join(" + ") : ""})`
  );
}
var isAuthenticated = (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated?.() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!user.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};

// server/admin-guard.ts
import { eq as eq2 } from "drizzle-orm";
function getUserId(user) {
  if (user?.dbUserId) return user.dbUserId;
  if (user?.claims?.sub) return user.claims.sub;
  if (user?.id) return user.id;
  return "";
}
async function adminRoleMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(403).json({ message: "Admin yetkisi gereklidir" });
  }
  const userId = getUserId(req.user);
  const [dbUser] = await db.select({ role: users.role, status: users.status }).from(users).where(eq2(users.id, userId)).limit(1);
  if (!dbUser || dbUser.role !== "admin") {
    return res.status(403).json({ message: "Admin yetkisi gereklidir" });
  }
  if (dbUser.status !== "active") {
    return res.status(403).json({ message: "Hesab\u0131n\u0131z aktif de\u011Fil" });
  }
  req.user.role = dbUser.role;
  next();
}
function adminPinMiddleware(req, res, next) {
  const session2 = req.session;
  if (!session2.adminPinVerified) {
    return res.status(403).json({
      message: "Admin PIN do\u011Frulamas\u0131 gereklidir",
      requirePin: true
    });
  }
  next();
}
async function adminMiddleware(req, res, next) {
  return adminRoleMiddleware(req, res, () => adminPinMiddleware(req, res, next));
}

// server/routes.ts
import passport2 from "passport";

// server/cache.ts
import { Redis } from "@upstash/redis";
import IORedis from "ioredis";
var redisClient = null;
var pubClient = null;
var subClient = null;
var redisPubSubEnabled = false;
function initializeRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      redisClient = new Redis({ url, token });
      console.log("\u2705 Redis REST cache initialized");
    } catch (error) {
      console.error("\u274C Redis REST initialization failed:", error);
    }
  } else {
    console.warn("\u26A0\uFE0F  Redis REST not configured - using in-memory cache");
  }
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    console.log("\u{1F4E1} Production mode: Using REST polling for Pub/Sub (no TCP)");
  } else {
    const restUrl = process.env.UPSTASH_REDIS_REST_URL;
    const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const tcpPassword = process.env.UPSTASH_REDIS_PASSWORD || restToken;
    let host;
    if (restUrl) {
      try {
        const urlObj = new URL(restUrl);
        host = urlObj.hostname;
      } catch (e) {
      }
    }
    if (host && tcpPassword) {
      console.log(`\u{1F4E1} Redis TCP attempting connection to: ${host}:6379`);
      const redisOptions = {
        host,
        port: 6379,
        password: tcpPassword,
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        lazyConnect: true,
        connectTimeout: 5e3,
        tls: { rejectUnauthorized: false },
        retryStrategy: (times) => {
          if (times > 1) {
            console.log("\u26A0\uFE0F  Redis TCP connection failed - using REST polling fallback");
            return null;
          }
          return 1e3;
        }
      };
      const handleRedisError = () => {
      };
      try {
        pubClient = new IORedis(redisOptions);
        subClient = new IORedis(redisOptions);
        pubClient.on("error", handleRedisError);
        subClient.on("error", handleRedisError);
        Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
          redisPubSubEnabled = true;
          console.log("\u2705 Redis Pub/Sub initialized (ioredis TCP)");
          subClient.on("message", (channel, message) => {
            try {
              const parsed = JSON.parse(message);
              const subscribers = localSubscribers.get(channel);
              if (subscribers) {
                Array.from(subscribers).forEach((callback) => {
                  try {
                    callback(channel, parsed);
                  } catch (error) {
                    console.error(`Subscriber callback error (${channel}):`, error);
                  }
                });
              }
            } catch (error) {
              console.error(`Message parse error (${channel}):`, error);
            }
          });
        }).catch((error) => {
          console.warn("\u26A0\uFE0F  Redis Pub/Sub not available (using polling fallback):", error.message);
          try {
            pubClient?.disconnect();
          } catch {
          }
          try {
            subClient?.disconnect();
          } catch {
          }
          pubClient = null;
          subClient = null;
        });
      } catch (error) {
        console.warn("\u26A0\uFE0F  Redis TCP initialization failed - Pub/Sub disabled");
      }
    }
  }
  return redisClient;
}
function isPubSubEnabled() {
  return redisPubSubEnabled && pubClient !== null && subClient !== null;
}
var memoryCache = /* @__PURE__ */ new Map();
var rateLimitCounters = /* @__PURE__ */ new Map();
var CLEANUP_INTERVAL = 5 * 60 * 1e3;
var cleanupTimer = null;
function startMemoryCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    let cleanedCache = 0;
    let cleanedRateLimit = 0;
    Array.from(memoryCache.entries()).forEach(([key, entry]) => {
      if (entry.expires < now) {
        memoryCache.delete(key);
        cleanedCache++;
      }
    });
    Array.from(rateLimitCounters.entries()).forEach(([key, entry]) => {
      if (entry.expires < now) {
        rateLimitCounters.delete(key);
        cleanedRateLimit++;
      }
    });
    if (cleanedCache > 0 || cleanedRateLimit > 0) {
      console.log(`\u{1F9F9} Memory cleanup: removed ${cleanedCache} cache, ${cleanedRateLimit} rate limit entries`);
    }
  }, CLEANUP_INTERVAL);
}
startMemoryCleanup();
var cache = {
  /**
   * Atomic increment with TTL - critical for rate limiting
   * Uses Redis INCR which is atomic across all instances
   */
  async incr(key, ttl) {
    try {
      if (redisClient) {
        const count2 = await redisClient.incr(key);
        if (count2 === 1) {
          await redisClient.expire(key, ttl);
        }
        return count2;
      }
      const now = Date.now();
      const existing = rateLimitCounters.get(key);
      if (!existing || existing.expires < now) {
        rateLimitCounters.set(key, { count: 1, expires: now + ttl * 1e3 });
        return 1;
      }
      existing.count++;
      return existing.count;
    } catch (error) {
      console.error(`Cache incr error (${key}):`, error);
      return 0;
    }
  },
  /**
   * Get cached value
   */
  async get(key) {
    try {
      if (redisClient) {
        const value = await redisClient.get(key);
        return value;
      }
      const cached = memoryCache.get(key);
      if (!cached) return null;
      if (cached.expires < Date.now()) {
        memoryCache.delete(key);
        return null;
      }
      return cached.value;
    } catch (error) {
      console.error(`Cache get error (${key}):`, error);
      return null;
    }
  },
  /**
   * Set cached value with TTL (seconds)
   */
  async set(key, value, ttl) {
    try {
      if (redisClient) {
        if (ttl) {
          await redisClient.set(key, value, { ex: ttl });
        } else {
          await redisClient.set(key, value);
        }
        return;
      }
      memoryCache.set(key, {
        value,
        expires: ttl ? Date.now() + ttl * 1e3 : Infinity
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("NOPERM")) {
        redisClient = null;
      }
      memoryCache.set(key, {
        value,
        expires: ttl ? Date.now() + ttl * 1e3 : Infinity
      });
    }
  },
  /**
   * Delete cached value
   */
  async del(key) {
    try {
      if (redisClient) {
        await redisClient.del(key);
        return;
      }
      memoryCache.delete(key);
    } catch (error) {
      console.error(`Cache delete error (${key}):`, error);
    }
  },
  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern) {
    try {
      if (redisClient) {
        const keys2 = await redisClient.keys(pattern);
        if (keys2.length > 0) {
          await redisClient.del(...keys2);
        }
        return;
      }
      const keys = Array.from(memoryCache.keys());
      for (const key of keys) {
        if (key.includes(pattern.replace("*", ""))) {
          memoryCache.delete(key);
        }
      }
    } catch (error) {
      console.error(`Cache delete pattern error (${pattern}):`, error);
    }
  },
  /**
   * Check if Redis is available
   */
  isAvailable() {
    return redisClient !== null;
  },
  /**
   * Get cache stats
   */
  async getStats() {
    try {
      if (redisClient) {
        return {
          type: "redis",
          available: true,
          status: "connected"
        };
      }
      return {
        type: "memory",
        available: true,
        size: memoryCache.size,
        keys: Array.from(memoryCache.keys()).slice(0, 10)
        // First 10 keys
      };
    } catch (error) {
      return {
        type: redisClient ? "redis" : "memory",
        available: false,
        error: String(error)
      };
    }
  }
};
var cacheKeys = {
  categories: () => "categories:all",
  categoryTree: () => "categories:tree",
  categoryStats: () => "categories:stats",
  listing: (id) => `listing:${id}`,
  listings: (params) => `listings:${params}`,
  listingsHome: () => "listings:home",
  hotListings: () => "listings:hot",
  recentListings: () => "listings:recent",
  blogPosts: () => "blog:all",
  blogPost: (slug) => `blog:${slug}`,
  vetServices: (city, district) => `vet-services:${city || "all"}:${district || "all"}`,
  transportServices: (fromCity, toCity) => `transport-services:${fromCity || "all"}:${toCity || "all"}`,
  userListings: (userId) => `user:${userId}:listings`,
  userFavorites: (userId) => `user:${userId}:favorites`,
  adminStats: () => "admin:stats",
  locations: () => "locations:all"
};
var cacheTTL = {
  categories: 3600 * 24,
  // 24 hours (rarely changes)
  categoryStats: 3600,
  // 1 hour
  listings: 300,
  // 5 minutes (frequently updated)
  listingsHome: 120,
  // 2 minutes (homepage listings)
  hotListings: 180,
  // 3 minutes (very dynamic)
  recentListings: 60,
  // 1 minute
  blogPosts: 3600,
  // 1 hour
  services: 600,
  // 10 minutes
  userContent: 60,
  // 1 minute (dynamic)
  adminStats: 60,
  // 1 minute (admin needs fresh data)
  locations: 3600 * 24
  // 24 hours (rarely changes)
};
var localSubscribers = /* @__PURE__ */ new Map();
var subscribedChannels = /* @__PURE__ */ new Set();
var messageBroker = {
  /**
   * Publish message to all subscribers (local + remote instances)
   * Uses real Redis Pub/Sub when available, falls back to list-based
   */
  async publish(channel, message) {
    try {
      const messageWithMeta = {
        ...message,
        _timestamp: Date.now(),
        _instanceId: process.env.REPL_ID || "local"
      };
      if (redisPubSubEnabled && pubClient) {
        await pubClient.publish(channel, JSON.stringify(messageWithMeta));
        return;
      }
      if (redisClient) {
        await redisClient.lpush(`ws:${channel}`, JSON.stringify(messageWithMeta));
        await redisClient.ltrim(`ws:${channel}`, 0, 99);
        await redisClient.expire(`ws:${channel}`, 5);
      }
      const subscribers = localSubscribers.get(channel);
      if (subscribers) {
        Array.from(subscribers).forEach((callback) => {
          try {
            callback(channel, message);
          } catch (error) {
            console.error(`Subscriber callback error (${channel}):`, error);
          }
        });
      }
    } catch (error) {
      console.error(`Message publish error (${channel}):`, error);
    }
  },
  /**
   * Subscribe to channel messages
   * Uses real Redis Pub/Sub when available
   */
  subscribe(channel, callback) {
    if (!localSubscribers.has(channel)) {
      localSubscribers.set(channel, /* @__PURE__ */ new Set());
    }
    localSubscribers.get(channel).add(callback);
    if (redisPubSubEnabled && subClient && !subscribedChannels.has(channel)) {
      subClient.subscribe(channel).then(() => {
        subscribedChannels.add(channel);
        console.log(`\u{1F4E1} Subscribed to Redis channel: ${channel}`);
      }).catch((err) => {
        console.error(`Failed to subscribe to ${channel}:`, err);
      });
    }
    return () => {
      const subscribers = localSubscribers.get(channel);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          localSubscribers.delete(channel);
          if (redisPubSubEnabled && subClient && subscribedChannels.has(channel)) {
            subClient.unsubscribe(channel).then(() => {
              subscribedChannels.delete(channel);
              console.log(`\u{1F4E1} Unsubscribed from Redis channel: ${channel}`);
            }).catch(() => {
            });
          }
        }
      }
    };
  },
  /**
   * Poll Redis for messages (fallback for REST API only mode)
   */
  async pollMessages(channel, lastTimestamp) {
    if (redisPubSubEnabled) return [];
    if (!redisClient) return [];
    try {
      const messages2 = await redisClient.lrange(`ws:${channel}`, 0, 49);
      return messages2.map((m) => typeof m === "string" ? JSON.parse(m) : m).filter((m) => m._timestamp > lastTimestamp && m._instanceId !== (process.env.REPL_ID || "local"));
    } catch (error) {
      console.error(`Message poll error (${channel}):`, error);
      return [];
    }
  },
  /**
   * Check if real Pub/Sub is enabled
   */
  isRealPubSubEnabled() {
    return redisPubSubEnabled;
  },
  /**
   * Get subscriber count
   */
  getSubscriberCount(channel) {
    return localSubscribers.get(channel)?.size || 0;
  },
  /**
   * Get subscribed channels count
   */
  getSubscribedChannelsCount() {
    return subscribedChannels.size;
  }
};

// shared/utils.ts
function slugify(text2) {
  const turkishMap = {
    "\xE7": "c",
    "\xC7": "C",
    "\u011F": "g",
    "\u011E": "G",
    "\u0131": "i",
    "\u0130": "I",
    "\xF6": "o",
    "\xD6": "O",
    "\u015F": "s",
    "\u015E": "S",
    "\xFC": "u",
    "\xDC": "U"
  };
  return text2.split("").map((char) => turkishMap[char] || char).join("").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-");
}

// server/monitoring.ts
function getSystemMetrics() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  return {
    uptime: process.uptime(),
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      // MB
      percentage: Math.round(memUsage.heapUsed / memUsage.heapTotal * 100)
    },
    cpu: {
      user: Math.round(cpuUsage.user / 1e3),
      // microseconds to ms
      system: Math.round(cpuUsage.system / 1e3)
    },
    process: {
      pid: process.pid,
      nodeVersion: process.version
    }
  };
}
async function readinessCheck(_req, res) {
  const startTime = Date.now();
  try {
    let dbLatency;
    let dbConnected = false;
    try {
      const dbStart = Date.now();
      await db.execute("SELECT 1");
      dbLatency = Date.now() - dbStart;
      dbConnected = true;
    } catch (error) {
      console.error("Database readiness check failed:", error);
    }
    const cacheStats = await cache.getStats();
    const totalLatency = Date.now() - startTime;
    const poolStats = getPoolStats();
    const pubSubEnabled = isPubSubEnabled();
    const health = {
      status: dbConnected ? "healthy" : "degraded",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      system: getSystemMetrics(),
      database: {
        connected: dbConnected,
        latency: dbLatency,
        pool: poolStats
      },
      cache: {
        type: cacheStats.type,
        available: cacheStats.available
      },
      pubsub: {
        enabled: pubSubEnabled,
        type: pubSubEnabled ? "redis-tcp" : cacheStats.available ? "polling" : "local",
        subscribedChannels: messageBroker.getSubscribedChannelsCount()
      }
    };
    const statusCode = health.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error("Readiness check error:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      error: String(error)
    });
  }
}
function metricsEndpoint(_req, res) {
  const metrics = getSystemMetrics();
  const prometheusMetrics = `
# HELP nodejs_heap_size_used_bytes Process heap size used in bytes
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes{pid="${metrics.process.pid}"} ${metrics.memory.used * 1024 * 1024}

# HELP nodejs_heap_size_total_bytes Process heap size total in bytes
# TYPE nodejs_heap_size_total_bytes gauge
nodejs_heap_size_total_bytes{pid="${metrics.process.pid}"} ${metrics.memory.total * 1024 * 1024}

# HELP nodejs_process_uptime_seconds Process uptime in seconds
# TYPE nodejs_process_uptime_seconds gauge
nodejs_process_uptime_seconds{pid="${metrics.process.pid}"} ${metrics.uptime}

# HELP nodejs_process_cpu_user_seconds_total Total user CPU time in seconds
# TYPE nodejs_process_cpu_user_seconds_total counter
nodejs_process_cpu_user_seconds_total{pid="${metrics.process.pid}"} ${metrics.cpu.user / 1e3}

# HELP nodejs_process_cpu_system_seconds_total Total system CPU time in seconds
# TYPE nodejs_process_cpu_system_seconds_total counter
nodejs_process_cpu_system_seconds_total{pid="${metrics.process.pid}"} ${metrics.cpu.system / 1e3}
`.trim();
  res.set("Content-Type", "text/plain; version=0.0.4");
  res.send(prometheusMetrics);
}

// server/sitemap.ts
import { eq as eq3, desc as desc2 } from "drizzle-orm";
var SITE = process.env.APP_URL?.replace(/\/$/, "") || "https://sahibindenhayvan.com";
var STATIC_PATHS = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/ilanlar", priority: "0.9", changefreq: "hourly" },
  { path: "/magazalar", priority: "0.8", changefreq: "daily" },
  { path: "/blog", priority: "0.7", changefreq: "weekly" },
  { path: "/veteriner-hizmetleri", priority: "0.6", changefreq: "weekly" },
  { path: "/nakliye-hizmetleri", priority: "0.6", changefreq: "weekly" },
  { path: "/piyasa-fiyatlari", priority: "0.6", changefreq: "daily" },
  { path: "/hakkimizda", priority: "0.5", changefreq: "monthly" },
  { path: "/iletisim", priority: "0.5", changefreq: "monthly" },
  { path: "/yardim", priority: "0.5", changefreq: "monthly" },
  { path: "/kullanim-kosullari", priority: "0.3", changefreq: "yearly" },
  { path: "/gizlilik-politikasi", priority: "0.3", changefreq: "yearly" },
  { path: "/kvkk", priority: "0.3", changefreq: "yearly" },
  { path: "/cerez-politikasi", priority: "0.3", changefreq: "yearly" },
  { path: "/ilan-kurallari", priority: "0.3", changefreq: "yearly" }
];
function xmlEscape(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function urlEntry(loc, lastmod, changefreq, priority) {
  const parts = [`    <loc>${xmlEscape(loc)}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${lastmod.toISOString().split("T")[0]}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`    <priority>${priority}</priority>`);
  return `  <url>
${parts.join("\n")}
  </url>`;
}
function registerSitemapRoutes(app2) {
  app2.get("/sitemap.xml", async (_req, res) => {
    try {
      const entries = STATIC_PATHS.map(
        (s) => urlEntry(`${SITE}${s.path}`, null, s.changefreq, s.priority)
      );
      const cats = await db.select({ id: categories.id, slug: categories.slug, parentId: categories.parentId }).from(categories).limit(2e3);
      const withListings = await db.selectDistinct({ categoryId: listings.categoryId }).from(listings).where(eq3(listings.status, "active"));
      const parentOf = new Map(cats.map((c) => [c.id, c.parentId]));
      const dolu = /* @__PURE__ */ new Set();
      for (const { categoryId } of withListings) {
        let cur = categoryId;
        while (cur && !dolu.has(cur)) {
          dolu.add(cur);
          cur = parentOf.get(cur);
        }
      }
      for (const c of cats) {
        if (!c.slug) continue;
        const kok = c.parentId === null;
        if (!kok && !dolu.has(c.id)) continue;
        entries.push(
          urlEntry(`${SITE}/kategori/${c.slug}`, null, "daily", kok ? "0.8" : "0.7")
        );
      }
      const items = await db.select({ id: listings.id, updatedAt: listings.updatedAt }).from(listings).where(eq3(listings.status, "active")).orderBy(desc2(listings.createdAt)).limit(2e4);
      for (const l of items) {
        entries.push(urlEntry(`${SITE}/ilan/${l.id}`, l.updatedAt, "weekly", "0.8"));
      }
      const shops = await db.select({ slug: stores.slug, updatedAt: stores.updatedAt }).from(stores).limit(5e3);
      for (const s of shops) {
        if (s.slug) entries.push(urlEntry(`${SITE}/magaza/${s.slug}`, s.updatedAt, "weekly", "0.7"));
      }
      const posts = await db.select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt }).from(blogPosts).where(eq3(blogPosts.published, true)).limit(5e3);
      for (const p of posts) {
        if (p.slug) entries.push(urlEntry(`${SITE}/blog/${p.slug}`, p.updatedAt, "monthly", "0.6"));
      }
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
` + entries.join("\n") + `
</urlset>`;
      res.set({
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=600, s-maxage=600"
      });
      res.send(xml);
    } catch (error) {
      console.error("Sitemap \xFCretilemedi:", error);
      const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
` + STATIC_PATHS.map((s) => urlEntry(`${SITE}${s.path}`, null, s.changefreq, s.priority)).join("\n") + `
</urlset>`;
      res.set("Content-Type", "application/xml; charset=utf-8");
      res.send(fallback);
    }
  });
}

// server/prerender.ts
import fs from "fs";
import path from "path";
import { eq as eq4, and as and3 } from "drizzle-orm";

// shared/image-variants.ts
var BOYUTLAR = ["thumb", "medium", "large", "original"];
function imageVariant(url, boyut) {
  if (!url || typeof url !== "string") return url ?? "";
  for (const mevcut of BOYUTLAR) {
    const ek = `_${mevcut}.webp`;
    if (url.endsWith(ek)) {
      return url.slice(0, -ek.length) + `_${boyut}.webp`;
    }
  }
  return url;
}

// server/prerender.ts
var SITE2 = (process.env.APP_URL || "https://sahibindenhayvan.com").replace(/\/$/, "");
var VARSAYILAN_GORSEL = `${SITE2}/og-image.png?v=3`;
function kacisla(deger) {
  return deger.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function ozet(metin, uzunluk = 160) {
  if (!metin) return "";
  const duz = metin.replace(/<[^>]*>/g, " ").replace(/[#*_`>\[\]]/g, " ").replace(/\s+/g, " ").trim();
  if (duz.length <= uzunluk) return duz;
  return duz.slice(0, uzunluk - 1).replace(/\s+\S*$/, "") + "\u2026";
}
function tamAdres(yol) {
  if (!yol) return VARSAYILAN_GORSEL;
  if (/^https?:\/\//i.test(yol)) return yol;
  return `${SITE2}${yol.startsWith("/") ? "" : "/"}${yol}`;
}
var kabukOnbellek = null;
async function kabuguOku() {
  if (kabukOnbellek !== null) return kabukOnbellek;
  const adaylar = [
    path.join(process.cwd(), "dist/public/index.html"),
    path.join(process.cwd(), "public/index.html")
  ];
  for (const aday of adaylar) {
    try {
      if (fs.existsSync(aday)) {
        kabukOnbellek = fs.readFileSync(aday, "utf8");
        return kabukOnbellek;
      }
    } catch {
    }
  }
  try {
    const yanit = await fetch(`${SITE2}/index.html`);
    if (yanit.ok) {
      const html = await yanit.text();
      if (html.includes("</head>")) {
        console.warn("\xD6n-render: kabuk diskte yok, CDN'den al\u0131nd\u0131.");
        kabukOnbellek = html;
        return kabukOnbellek;
      }
    }
  } catch (error) {
    console.error("\xD6n-render: kabuk CDN'den de al\u0131namad\u0131:", error);
  }
  console.warn("\xD6n-render: uygulama kabu\u011Fu bulunamad\u0131, etiket yerle\u015Ftirme devre d\u0131\u015F\u0131.");
  return null;
}
function etiketleriYerlestir(kabuk, meta) {
  let html = kabuk;
  const silinecek = [
    /<title>[\s\S]*?<\/title>\s*/i,
    /<meta\s+name="description"[^>]*>\s*/i,
    /<link\s+rel="canonical"[^>]*>\s*/i,
    /<meta\s+property="og:(?:title|description|image|url|type)"[^>]*>\s*/gi,
    /<meta\s+name="twitter:(?:title|description|image)"[^>]*>\s*/gi
  ];
  for (const desen of silinecek) html = html.replace(desen, "");
  const yeni = [
    `<title>${kacisla(meta.title)}</title>`,
    `<meta name="description" content="${kacisla(meta.description)}" />`,
    `<link rel="canonical" href="${kacisla(meta.canonical)}" />`,
    `<meta property="og:type" content="${meta.type || "website"}" />`,
    `<meta property="og:title" content="${kacisla(meta.title)}" />`,
    `<meta property="og:description" content="${kacisla(meta.description)}" />`,
    `<meta property="og:image" content="${kacisla(meta.image || VARSAYILAN_GORSEL)}" />`,
    `<meta property="og:url" content="${kacisla(meta.canonical)}" />`,
    `<meta name="twitter:title" content="${kacisla(meta.title)}" />`,
    `<meta name="twitter:description" content="${kacisla(meta.description)}" />`,
    `<meta name="twitter:image" content="${kacisla(meta.image || VARSAYILAN_GORSEL)}" />`
  ];
  if (meta.structuredData) {
    const json = JSON.stringify(meta.structuredData).replace(/<\//g, "<\\/");
    yeni.push(`<script type="application/ld+json">${json}</script>`);
  }
  return html.replace("</head>", `    ${yeni.join("\n    ")}
  </head>`);
}
async function ilanMetasi(id) {
  const [ilan] = await db.select({
    id: listings.id,
    title: listings.title,
    description: listings.description,
    price: listings.price,
    images: listings.images,
    city: listings.city,
    district: listings.district,
    status: listings.status
  }).from(listings).where(eq4(listings.id, id)).limit(1);
  if (!ilan || ilan.status !== "active") return null;
  const gorsel = tamAdres(imageVariant(ilan.images?.[0], "medium"));
  const konum = [ilan.city, ilan.district].filter(Boolean).join(", ");
  const canonical = `${SITE2}/ilan/${ilan.id}`;
  return {
    title: `${ilan.title}${konum ? ` \u2014 ${konum}` : ""} | sahibindenhayvan.com`,
    description: ozet(ilan.description),
    image: gorsel,
    canonical,
    type: "product",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: ilan.title,
      description: ozet(ilan.description, 300),
      image: gorsel,
      offers: {
        "@type": "Offer",
        price: ilan.price,
        priceCurrency: "TRY",
        availability: "https://schema.org/InStock",
        url: canonical
      }
    }
  };
}
async function kategoriMetasi(slug) {
  const [kategori] = await db.select({ name: categories.name, slug: categories.slug, description: categories.description }).from(categories).where(eq4(categories.slug, slug)).limit(1);
  if (!kategori) return null;
  return {
    title: `${kategori.name} \u0130lanlar\u0131 | sahibindenhayvan.com`,
    description: ozet(kategori.description) || `${kategori.name} kategorisindeki g\xFCncel ilanlar. T\xFCrkiye genelinde \xFCcretsiz ilan ver, g\xFCvenle al ve sat.`,
    canonical: `${SITE2}/kategori/${kategori.slug}`
  };
}
async function blogMetasi(slug) {
  const [yazi] = await db.select({
    title: blogPosts.title,
    slug: blogPosts.slug,
    excerpt: blogPosts.excerpt,
    content: blogPosts.content,
    featuredImage: blogPosts.featuredImage,
    published: blogPosts.published,
    createdAt: blogPosts.createdAt,
    updatedAt: blogPosts.updatedAt
  }).from(blogPosts).where(and3(eq4(blogPosts.slug, slug), eq4(blogPosts.published, true))).limit(1);
  if (!yazi) return null;
  const gorsel = tamAdres(yazi.featuredImage);
  const canonical = `${SITE2}/blog/${yazi.slug}`;
  return {
    title: `${yazi.title} | sahibindenhayvan.com`,
    description: ozet(yazi.excerpt || yazi.content),
    image: gorsel,
    canonical,
    type: "article",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: yazi.title,
      description: ozet(yazi.excerpt || yazi.content, 300),
      image: gorsel,
      datePublished: yazi.createdAt,
      dateModified: yazi.updatedAt,
      mainEntityOfPage: canonical,
      publisher: {
        "@type": "Organization",
        name: "sahibindenhayvan.com",
        logo: { "@type": "ImageObject", url: `${SITE2}/logo.png` }
      }
    }
  };
}
async function magazaMetasi(slug) {
  const [magaza] = await db.select({
    slug: stores.slug,
    displayName: stores.displayName,
    summary: stores.summary,
    description: stores.description,
    logo: stores.logo,
    city: stores.city
  }).from(stores).where(eq4(stores.slug, slug)).limit(1);
  if (!magaza) return null;
  const konum = magaza.city ? ` \u2014 ${magaza.city}` : "";
  return {
    title: `${magaza.displayName}${konum} | sahibindenhayvan.com`,
    description: ozet(magaza.summary || magaza.description) || `${magaza.displayName} ma\u011Fazas\u0131n\u0131n ilanlar\u0131 ve ileti\u015Fim bilgileri.`,
    image: tamAdres(magaza.logo),
    canonical: `${SITE2}/magaza/${magaza.slug}`
  };
}
function registerPrerenderRoutes(app2) {
  const isle = (uretici) => async (req, res, next) => {
    const kabuk = await kabuguOku();
    if (!kabuk) return next();
    try {
      const meta = await uretici(req.params[0] ?? Object.values(req.params)[0]);
      const html = meta ? etiketleriYerlestir(kabuk, meta) : kabuk;
      res.set({
        "Content-Type": "text/html; charset=utf-8",
        // Kullanıcıların çoğu CDN önbelleğinden yanıt alır, fonksiyona
        // uğramaz. İçerik güncellenince en geç 5 dakikada yenilenir.
        "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600"
      });
      return res.send(html);
    } catch (error) {
      console.error("\xD6n-render ba\u015Far\u0131s\u0131z, kabuk d\xF6nd\xFCr\xFCl\xFCyor:", error);
      res.set("Content-Type", "text/html; charset=utf-8");
      return res.send(kabuk);
    }
  };
  app2.get("/ilan/:id", isle((id) => ilanMetasi(id)));
  app2.get("/kategori/:slug", isle((slug) => kategoriMetasi(slug)));
  app2.get("/blog/:slug", isle((slug) => blogMetasi(slug)));
  app2.get("/magaza/:slug", isle((slug) => magazaMetasi(slug)));
}

// server/cron.ts
import { sql as sql4 } from "drizzle-orm";

// server/saved-search-notifier.ts
import { Resend } from "resend";
import { eq as eq5, and as and4, gt, desc as desc3, sql as sql3, or as or2, ilike as ilike2, inArray as inArray2 } from "drizzle-orm";
var SavedSearchNotifier = class {
  resend = null;
  fromEmail;
  isProduction;
  checkIntervalMs = 60 * 60 * 1e3;
  // 1 hour
  notificationCooldownMs = 24 * 60 * 60 * 1e3;
  // 24 hours between notifications
  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
    this.fromEmail = process.env.FROM_EMAIL || "noreply@sahibindenhayvan.com";
    this.isProduction = process.env.NODE_ENV === "production" || !!apiKey;
  }
  async start() {
    console.log("\u{1F514} Saved Search Notifier: Starting...");
    await this.checkAndNotify();
    setInterval(() => {
      this.checkAndNotify().catch((error) => {
        console.error("\u274C Saved search notification check failed:", error);
      });
    }, this.checkIntervalMs);
    console.log(`\u{1F514} Saved Search Notifier: Running (check every ${this.checkIntervalMs / 6e4} minutes)`);
  }
  async checkAndNotify() {
    try {
      const cooldownTime = new Date(Date.now() - this.notificationCooldownMs);
      const activeSearches = await db.select({
        search: savedSearches,
        user: {
          id: users.id,
          email: users.email,
          username: users.username,
          firstName: users.firstName
        }
      }).from(savedSearches).innerJoin(users, eq5(savedSearches.userId, users.id)).where(
        and4(
          eq5(savedSearches.notifyEnabled, true),
          or2(
            sql3`${savedSearches.lastNotifiedAt} IS NULL`,
            sql3`${savedSearches.lastNotifiedAt} < ${cooldownTime}`
          )
        )
      );
      console.log(`\u{1F514} Found ${activeSearches.length} saved searches with notifications enabled`);
      for (const { search, user } of activeSearches) {
        try {
          await this.processSearch(search, user);
        } catch (error) {
          console.error(`\u274C Failed to process saved search ${search.id}:`, error);
        }
      }
      return activeSearches.length;
    } catch (error) {
      console.error("\u274C Saved search notification check failed:", error);
      return 0;
    }
  }
  async processSearch(search, user) {
    const filters = search.filters;
    const sinceDate = search.lastNotifiedAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3);
    const conditions = [
      eq5(listings.status, "active"),
      gt(listings.createdAt, sinceDate)
    ];
    if (filters.categorySlug) {
      const matchingCategories = await db.select({ id: categories.id }).from(categories).where(ilike2(categories.slug, `%${filters.categorySlug}%`));
      if (matchingCategories.length > 0) {
        conditions.push(inArray2(listings.categoryId, matchingCategories.map((c) => c.id)));
      }
    }
    if (filters.city) {
      conditions.push(eq5(listings.city, filters.city));
    }
    if (filters.district) {
      conditions.push(eq5(listings.district, filters.district));
    }
    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice);
      if (!isNaN(minPrice)) {
        conditions.push(sql3`CAST(${listings.price} AS DECIMAL) >= ${minPrice}`);
      }
    }
    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      if (!isNaN(maxPrice)) {
        conditions.push(sql3`CAST(${listings.price} AS DECIMAL) <= ${maxPrice}`);
      }
    }
    if (filters.gender) {
      conditions.push(eq5(listings.gender, filters.gender));
    }
    if (filters.breed) {
      conditions.push(
        sql3`public.tr_normalize(coalesce(${listings.breed}, '')) LIKE public.tr_normalize(${`%${filters.breed}%`})`
      );
    }
    if (filters.searchQuery) {
      conditions.push(
        sql3`(
          public.tr_normalize(${listings.title}) LIKE public.tr_normalize(${`%${filters.searchQuery}%`})
          OR public.tr_normalize(${listings.description}) LIKE public.tr_normalize(${`%${filters.searchQuery}%`})
        )`
      );
    }
    const matchingListings = await db.select({
      id: listings.id,
      title: listings.title,
      price: listings.price,
      city: listings.city,
      images: listings.images,
      createdAt: listings.createdAt
    }).from(listings).where(and4(...conditions)).orderBy(desc3(listings.createdAt)).limit(10);
    if (matchingListings.length === 0) {
      console.log(`\u{1F4ED} No new listings for saved search "${search.name}"`);
      return;
    }
    console.log(`\u{1F4EC} Found ${matchingListings.length} new listings for saved search "${search.name}"`);
    const existingLogs = await db.select().from(searchNotificationLogs).where(eq5(searchNotificationLogs.savedSearchId, search.id)).orderBy(desc3(searchNotificationLogs.createdAt)).limit(1);
    const previouslyNotifiedIds = existingLogs[0]?.matchedListingIds || [];
    const newListings = matchingListings.filter((l) => !previouslyNotifiedIds.includes(l.id));
    if (newListings.length === 0) {
      console.log(`\u{1F4ED} No new unique listings for saved search "${search.name}"`);
      return;
    }
    if (user.email) {
      await this.sendNotificationEmail(user, search, newListings);
    }
    await db.insert(notifications).values({
      userId: user.id,
      type: "saved_search_match",
      title: `${newListings.length} Yeni \u0130lan Bulundu`,
      message: `"${search.name}" araman\u0131z i\xE7in ${newListings.length} yeni ilan bulundu.`,
      link: `/ilanlar?${this.buildSearchUrl(filters)}`,
      relatedId: search.id,
      isRead: false
    });
    await db.insert(searchNotificationLogs).values({
      savedSearchId: search.id,
      userId: user.id,
      matchedListingIds: newListings.map((l) => l.id),
      emailSent: !!user.email && !!this.resend,
      sentAt: /* @__PURE__ */ new Date()
    });
    await db.update(savedSearches).set({ lastNotifiedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq5(savedSearches.id, search.id));
  }
  async sendNotificationEmail(user, search, newListings) {
    if (!user.email) return;
    if (!this.resend) {
      console.log("\u{1F4E7} [DEV] Would send saved search notification email:");
      console.log(`   To: ${user.email}`);
      console.log(`   Search: ${search.name}`);
      console.log(`   Listings: ${newListings.length}`);
      return;
    }
    const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || "https://sahibindenhayvan.com";
    const userName = user.firstName || user.username;
    const filters = search.filters;
    const searchUrl = `${appUrl}/ilanlar?${this.buildSearchUrl(filters)}`;
    const listingsHtml = newListings.slice(0, 5).map((listing) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${listing.images?.[0] ? `<img src="${listing.images[0]}" alt="" style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px;">` : ""}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <a href="${appUrl}/ilan/${listing.id}" style="color: #0066CC; text-decoration: none; font-weight: bold;">
            ${listing.title}
          </a>
          <br>
          <span style="color: #666; font-size: 12px;">${listing.city || ""}</span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #0066CC;">
          ${listing.price ? `${parseFloat(listing.price).toLocaleString("tr-TR")} \u20BA` : "Fiyat Belirtilmemi\u015F"}
        </td>
      </tr>
    `).join("");
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: user.email,
        subject: `${newListings.length} Yeni \u0130lan Bulundu - ${search.name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Kay\u0131tl\u0131 Arama Bildirimi</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #0066CC; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Sahibindenhayvan.com</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f5f5f5;">
              <h2 style="color: #333;">Merhaba ${userName},</h2>
              
              <p style="color: #666; line-height: 1.6;">
                <strong>"${search.name}"</strong> kay\u0131tl\u0131 araman\u0131z i\xE7in 
                <strong>${newListings.length}</strong> yeni ilan bulundu!
              </p>
              
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; margin: 20px 0;">
                <tbody>
                  ${listingsHtml}
                </tbody>
              </table>
              
              ${newListings.length > 5 ? `
                <p style="color: #666; text-align: center;">
                  ... ve ${newListings.length - 5} ilan daha
                </p>
              ` : ""}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${searchUrl}" 
                   style="background-color: #0066CC; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                  T\xFCm \u0130lanlar\u0131 G\xF6r
                </a>
              </div>
              
              <p style="color: #999; font-size: 12px; text-align: center;">
                Bu bildirimi kapatmak i\xE7in 
                <a href="${appUrl}/panel/kayitli-aramalar" style="color: #0066CC;">kay\u0131tl\u0131 aramalar</a> 
                sayfas\u0131ndan ayarlar\u0131n\u0131z\u0131 de\u011Fi\u015Ftirebilirsiniz.
              </p>
            </div>
            
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>\xA9 2025 Sahibindenhayvan.com - T\xFCm haklar\u0131 sakl\u0131d\u0131r.</p>
            </div>
          </body>
          </html>
        `
      });
      console.log(`\u2705 Saved search notification email sent to ${user.email}`);
    } catch (error) {
      console.error("\u274C Failed to send saved search notification email:", error);
    }
  }
  buildSearchUrl(filters) {
    const params = new URLSearchParams();
    if (filters.categorySlug) params.set("kategori", filters.categorySlug);
    if (filters.city) params.set("sehir", filters.city);
    if (filters.district) params.set("ilce", filters.district);
    if (filters.minPrice) params.set("minFiyat", filters.minPrice);
    if (filters.maxPrice) params.set("maxFiyat", filters.maxPrice);
    if (filters.gender) params.set("cinsiyet", filters.gender);
    if (filters.breed) params.set("irk", filters.breed);
    if (filters.searchQuery) params.set("ara", filters.searchQuery);
    return params.toString();
  }
};
var savedSearchNotifier = new SavedSearchNotifier();

// server/cron.ts
function yetkiliMi(req) {
  const sir = process.env.CRON_SECRET;
  if (process.env.NODE_ENV !== "production") return true;
  if (!sir) {
    console.error("CRON_SECRET tan\u0131ml\u0131 de\u011Fil \u2014 zamanlanm\u0131\u015F g\xF6rev ucu kapal\u0131.");
    return false;
  }
  const baslik = req.headers.authorization || "";
  return baslik === `Bearer ${sir}`;
}
function registerCronRoutes(app2) {
  app2.get("/api/cron/saved-searches", async (req, res) => {
    if (!yetkiliMi(req)) {
      return res.status(401).json({ message: "Yetkisiz" });
    }
    const baslangic = Date.now();
    console.log("\u23F0 Zamanlanm\u0131\u015F g\xF6rev: kay\u0131tl\u0131 arama bildirimleri ba\u015Fl\u0131yor");
    try {
      const islenen = await savedSearchNotifier.checkAndNotify();
      const sure = Date.now() - baslangic;
      console.log(`\u23F0 Kay\u0131tl\u0131 arama bildirimleri tamamland\u0131 (${sure} ms)`);
      res.json({ ok: true, islenenAramaSayisi: islenen ?? null, sureMs: sure });
    } catch (error) {
      console.error("\u23F0 Kay\u0131tl\u0131 arama bildirimleri hata verdi:", error);
      res.status(500).json({ ok: false, message: "G\xF6rev tamamlanamad\u0131" });
    }
  });
  app2.get("/api/cron/temizlik", async (req, res) => {
    if (!yetkiliMi(req)) return res.status(401).json({ message: "Yetkisiz" });
    try {
      const sonuc = await db.execute(sql4`DELETE FROM sessions WHERE expire < now()`);
      const silinen = sonuc.rowCount ?? 0;
      console.log(`\u{1F9F9} S\xFCresi dolmu\u015F oturum temizli\u011Fi: ${silinen} kay\u0131t silindi`);
      res.json({ ok: true, silinenOturum: silinen });
    } catch (error) {
      console.error("\u{1F9F9} Oturum temizli\u011Fi ba\u015Far\u0131s\u0131z:", error);
      res.status(500).json({ ok: false });
    }
  });
  app2.get("/api/cron/health", (req, res) => {
    if (!yetkiliMi(req)) return res.status(401).json({ message: "Yetkisiz" });
    res.json({
      ok: true,
      cronSecretTanimli: !!process.env.CRON_SECRET,
      resendTanimli: !!process.env.RESEND_API_KEY
    });
  });
}

// server/imageProcessor.ts
import sharp from "sharp";

// server/objectStorage.ts
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
var OBJECT_PREFIX = "/objects/";
var _supabase = null;
function isObjectStorageConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
function getClient() {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tan\u0131ml\u0131 de\u011Fil \u2014 dosya y\xFCkleme devre d\u0131\u015F\u0131."
    );
  }
  _supabase = createClient(url, key, { auth: { persistSession: false } });
  return _supabase;
}
function getBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || "uploads";
}
function isPublicBucket() {
  return process.env.SUPABASE_STORAGE_PUBLIC !== "false";
}
function toStorageKey(objectPath) {
  let key = objectPath;
  if (key.startsWith(OBJECT_PREFIX)) key = key.slice(OBJECT_PREFIX.length);
  else if (key.startsWith("objects/")) key = key.slice("objects/".length);
  else if (key.startsWith("/")) key = key.slice(1);
  return key.replace(/\\/g, "/").split("/").filter((segment) => segment !== "" && segment !== "." && segment !== "..").join("/");
}
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
var ObjectStorageService = class {
  constructor() {
  }
  // ── Yol yardımcıları ─────────────────────────────────────────────────────
  getPublicObjectSearchPaths() {
    return ["public"];
  }
  getPrivateObjectDir() {
    return "";
  }
  // ── Okuma ────────────────────────────────────────────────────────────────
  /** Public klasöründe dosya arar; bulursa storage key döner. */
  async searchPublicObject(filePath) {
    for (const base of this.getPublicObjectSearchPaths()) {
      const key = `${base}/${filePath}`.replace(/\/+/g, "/");
      if (await this.fileExists(key)) return key;
    }
    return null;
  }
  /** "/objects/..." yolunun var olduğunu doğrular, storage key döner. */
  async getObjectEntityFile(objectPath) {
    if (!objectPath.startsWith(OBJECT_PREFIX)) {
      throw new ObjectNotFoundError();
    }
    const key = toStorageKey(objectPath);
    if (!key) throw new ObjectNotFoundError();
    if (!await this.fileExists(key)) {
      throw new ObjectNotFoundError();
    }
    return key;
  }
  /**
   * Dosyayı istemciye gönderir.
   * Public bucket'ta CDN'e 302 yönlendirir (fonksiyon bant genişliği harcamaz),
   * private bucket'ta imzalı URL'e yönlendirir.
   */
  async downloadObject(file, res, cacheTtlSec = 3600) {
    const key = toStorageKey(file);
    try {
      if (isPublicBucket()) {
        res.set("Cache-Control", `public, max-age=${cacheTtlSec}`);
        return res.redirect(302, this.getPublicUrl(key));
      }
      const signed = await this.getSignedUrl(key, cacheTtlSec);
      return res.redirect(302, signed);
    } catch (error) {
      console.error("Dosya indirme hatas\u0131:", error);
      if (!res.headersSent) res.status(500).json({ error: "Error downloading file" });
    }
  }
  getPublicUrl(objectPath) {
    const { data } = getClient().storage.from(getBucket()).getPublicUrl(toStorageKey(objectPath));
    return data.publicUrl;
  }
  async getSignedUrl(objectPath, expiresIn = 900) {
    const { data, error } = await getClient().storage.from(getBucket()).createSignedUrl(toStorageKey(objectPath), expiresIn);
    if (error || !data) {
      throw new Error(`\u0130mzal\u0131 URL olu\u015Fturulamad\u0131: ${error?.message}`);
    }
    return data.signedUrl;
  }
  async fileExists(objectPath) {
    const key = toStorageKey(objectPath);
    const dir = key.split("/").slice(0, -1).join("/");
    const name = key.split("/").pop() || "";
    const { data, error } = await getClient().storage.from(getBucket()).list(dir, { search: name, limit: 100 });
    if (error || !data) return false;
    return data.some((f) => f.name === name);
  }
  // ── Yazma ────────────────────────────────────────────────────────────────
  /** İstemcinin doğrudan yükleme yapabilmesi için imzalı PUT URL'i. */
  async getObjectEntityUploadURL() {
    const key = `uploads/${randomUUID()}`;
    const { data, error } = await getClient().storage.from(getBucket()).createSignedUploadUrl(key);
    if (error || !data) {
      throw new Error(`\u0130mzal\u0131 y\xFCkleme URL'i olu\u015Fturulamad\u0131: ${error?.message}`);
    }
    return data.signedUrl;
  }
  /** Buffer yükler, uygulama içi "/objects/..." yolunu döner. */
  async uploadFileBuffer(buffer, contentType = "image/jpeg") {
    const ext = (contentType.split("/")[1] || "bin").split("+")[0];
    const key = `uploads/${randomUUID()}.${ext}`;
    return this.uploadBufferAt(key, buffer, contentType);
  }
  /** Belirli bir anahtara yükler, uygulama içi "/objects/..." yolunu döner. */
  async uploadBufferAt(key, buffer, contentType) {
    const storageKey = toStorageKey(key);
    const { error } = await getClient().storage.from(getBucket()).upload(storageKey, buffer, { contentType, upsert: true });
    if (error) throw new Error(`Supabase y\xFCkleme hatas\u0131: ${error.message}`);
    return `${OBJECT_PREFIX}${storageKey}`;
  }
  // ── Silme ────────────────────────────────────────────────────────────────
  async deleteFile(objectPath) {
    if (!objectPath) return false;
    try {
      const { error } = await getClient().storage.from(getBucket()).remove([toStorageKey(this.normalizeObjectEntityPath(objectPath))]);
      return !error;
    } catch (error) {
      console.error("Dosya silme hatas\u0131:", error);
      return false;
    }
  }
  async deleteMultipleFiles(objectPaths) {
    const keys = (objectPaths || []).filter(Boolean).map((p) => toStorageKey(this.normalizeObjectEntityPath(p)));
    if (keys.length === 0) return 0;
    try {
      const { data, error } = await getClient().storage.from(getBucket()).remove(keys);
      if (error) return 0;
      return data?.length ?? 0;
    } catch (error) {
      console.error("Toplu silme hatas\u0131:", error);
      return 0;
    }
  }
  // ── Normalizasyon ────────────────────────────────────────────────────────
  /** Tam Supabase URL'i veya imzalı URL'i "/objects/..." biçimine indirger. */
  normalizeObjectEntityPath(rawPath) {
    if (!rawPath) return rawPath;
    if (rawPath.startsWith(OBJECT_PREFIX)) return rawPath;
    if (rawPath.startsWith("https://storage.googleapis.com/")) {
      const parts = new URL(rawPath).pathname.split("/").filter(Boolean);
      return `${OBJECT_PREFIX}${parts.slice(1).join("/")}`;
    }
    if (rawPath.startsWith("http")) {
      try {
        const url = new URL(rawPath);
        const m = url.pathname.match(
          /\/storage\/v1\/object\/(?:public\/|sign\/|upload\/sign\/)?[^/]+\/(.+)$/
        );
        if (m) return `${OBJECT_PREFIX}${decodeURIComponent(m[1])}`;
      } catch {
      }
      return rawPath;
    }
    return `${OBJECT_PREFIX}${toStorageKey(rawPath)}`;
  }
};
var objectStorage = new ObjectStorageService();

// server/imageProcessor.ts
import { randomUUID as randomUUID2 } from "crypto";
var IMAGE_VARIANTS = [
  { suffix: "thumb", width: 400, height: 400, quality: 90 },
  { suffix: "medium", width: 1200, height: 1200, quality: 92 },
  { suffix: "large", width: 2e3, height: 2e3, quality: 95 }
];
async function processAndUploadImage(buffer, originalFilename, listingId) {
  const uuid = randomUUID2();
  const cleanFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const baseName = cleanFilename.replace(/\.[^/.]+$/, "");
  const prefix = listingId ? `listings/${listingId}` : "images";
  const metadata = await sharp(buffer).metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;
  const originalBuffer = await sharp(buffer).rotate().webp({ quality: 90 }).toBuffer();
  const originalObjectName = `${prefix}/${uuid}_${baseName}_original.webp`;
  await objectStorage.uploadBufferAt(originalObjectName, originalBuffer, "image/webp");
  const results = {};
  for (const variant of IMAGE_VARIANTS) {
    const variantBuffer = await sharp(buffer).rotate().resize(variant.width, variant.height, {
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3
    }).sharpen({ sigma: 0.5 }).webp({ quality: variant.quality, effort: 6 }).toBuffer();
    const variantObjectName = `${prefix}/${uuid}_${baseName}_${variant.suffix}.webp`;
    await objectStorage.uploadBufferAt(variantObjectName, variantBuffer, "image/webp");
    results[variant.suffix] = {
      key: `/objects/${variantObjectName}`,
      url: `/objects/${variantObjectName}`
    };
  }
  return {
    originalKey: `/objects/${originalObjectName}`,
    originalUrl: `/objects/${originalObjectName}`,
    thumbnailKey: results.thumb.key,
    thumbnailUrl: results.thumb.url,
    mediumKey: results.medium.key,
    mediumUrl: results.medium.url,
    largeKey: results.large.key,
    largeUrl: results.large.url,
    width: originalWidth,
    height: originalHeight,
    fileSize: originalBuffer.length,
    mimeType: "image/webp"
  };
}
async function deleteImageVariants(keys) {
  await objectStorage.deleteMultipleFiles(keys);
}
function validateImageFile(file) {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const maxSize = 10 * 1024 * 1024;
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: "Sadece JPEG, PNG, WebP ve GIF formatlar\u0131 desteklenmektedir."
    };
  }
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "Dosya boyutu 10MB'dan b\xFCy\xFCk olamaz."
    };
  }
  return { valid: true };
}
var STORE_IMAGE_VARIANTS = {
  logo: [
    { suffix: "thumb", width: 100, height: 100, quality: 92 },
    { suffix: "medium", width: 300, height: 300, quality: 94 },
    { suffix: "original", width: 500, height: 500, quality: 96 }
  ],
  banner: [
    { suffix: "thumb", width: 600, height: 200, quality: 90 },
    { suffix: "medium", width: 1200, height: 400, quality: 92 },
    { suffix: "original", width: 1920, height: 640, quality: 95 }
  ]
};
async function processStoreImage(buffer, config) {
  const uuid = randomUUID2();
  const prefix = `stores/${config.storeId}`;
  const variants = STORE_IMAGE_VARIANTS[config.type];
  const metadata = await sharp(buffer).metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;
  const results = {};
  let finalFileSize = 0;
  for (const variant of variants) {
    const resizeOptions = config.type === "logo" ? { width: variant.width, height: variant.height, fit: "cover" } : { width: variant.width, height: variant.height, fit: "cover" };
    const variantBuffer = await sharp(buffer).rotate().resize(resizeOptions.width, resizeOptions.height, {
      fit: resizeOptions.fit,
      position: "center",
      kernel: sharp.kernel.lanczos3
    }).sharpen({ sigma: 0.5 }).webp({ quality: variant.quality, effort: 6 }).toBuffer();
    if (variant.suffix === "original") {
      finalFileSize = variantBuffer.length;
    }
    const objectName = `${prefix}/${config.type}_${uuid}_${variant.suffix}.webp`;
    await objectStorage.uploadBufferAt(objectName, variantBuffer, "image/webp");
    results[variant.suffix] = `/objects/${objectName}`;
  }
  return {
    originalUrl: results.original,
    thumbnailUrl: results.thumb,
    mediumUrl: results.medium,
    width: originalWidth,
    height: originalHeight,
    fileSize: finalFileSize
  };
}

// server/routes.ts
import { eq as eq7, ne, and as and6, isNull, asc, desc as desc5, sql as sql6, count, inArray as inArray4, gte as gte2, lte as lte2, ilike as ilike3, or as or3 } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import multer from "multer";

// server/email.ts
import crypto2 from "crypto";
import { Resend as Resend2 } from "resend";
function contactRecipient() {
  return process.env.CONTACT_EMAIL || "info@sahibindenhayvan.com";
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function generateVerificationToken() {
  return crypto2.randomBytes(32).toString("hex");
}
var DevelopmentEmailService = class {
  async sendVerificationEmail(to, token, username) {
    const verificationUrl = `${process.env.VITE_APP_URL || "http://localhost:5000"}/verify-email?token=${token}`;
    console.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");
    console.log("\u{1F4E7} EMAIL DO\u011ERULAMA (DEV MODE - AUTO-VERIFIED)");
    console.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");
    console.log(`Al\u0131c\u0131: ${to}`);
    console.log(`Kullan\u0131c\u0131: ${username}`);
    console.log(`\u2139\uFE0F  Development mode: Kullan\u0131c\u0131 otomatik do\u011Fruland\u0131`);
    console.log(`
\u{1F517} Manuel Test Linki (opsiyonel):`);
    console.log(verificationUrl);
    console.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n");
  }
  async sendPasswordResetEmail(to, token, username) {
    const resetUrl = `${process.env.VITE_APP_URL || "http://localhost:5000"}/reset-password?token=${token}`;
    console.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");
    console.log("\u{1F510} \u015E\u0130FRE SIFIRLAMA (DEV MODE)");
    console.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");
    console.log(`Al\u0131c\u0131: ${to}`);
    console.log(`Kullan\u0131c\u0131: ${username}`);
    console.log(`
\u{1F517} S\u0131f\u0131rlama Linki:`);
    console.log(resetUrl);
    console.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n");
  }
  async sendContactMessage(data) {
    console.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");
    console.log("\u2709\uFE0F  \u0130LET\u0130\u015E\u0130M FORMU (DEV MODE)");
    console.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");
    console.log(`Al\u0131c\u0131: ${contactRecipient()}`);
    console.log(`G\xF6nderen: ${data.name} <${data.email}> ${data.phone || ""}`);
    console.log(`Konu: ${data.subject}`);
    console.log(data.message);
    console.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n");
  }
  async sendNewMessageNotice(data) {
    console.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");
    console.log("\u{1F4AC} YEN\u0130 MESAJ B\u0130LD\u0130R\u0130M\u0130 (DEV MODE)");
    console.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");
    console.log(`Al\u0131c\u0131: ${data.to}`);
    console.log(`G\xF6nderen: ${data.senderName}`);
    console.log(`\xD6nizleme: ${data.preview}`);
    console.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n");
  }
  async sendEventNotice(data) {
    console.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");
    console.log(`\u{1F514} ${data.title.toUpperCase()} (DEV MODE)`);
    console.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");
    console.log(`Al\u0131c\u0131: ${data.to}`);
    console.log(data.body);
    (data.details || []).forEach(([k, v]) => console.log(`   ${k}: ${v}`));
    console.log("\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n");
  }
};
var ProductionEmailService = class {
  resend;
  fromEmail;
  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is required for production email service");
    }
    this.resend = new Resend2(apiKey);
    this.fromEmail = process.env.FROM_EMAIL || "noreply@sahibindenhayvan.com";
  }
  async sendVerificationEmail(to, token, username) {
    const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || "https://sahibindenhayvan.com";
    const verificationUrl = `${appUrl}/verify-email?token=${token}`;
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: "Email Adresinizi Do\u011Frulay\u0131n - Sahibindenhayvan.com",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Email Do\u011Frulama</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #0066CC; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Sahibindenhayvan.com</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f5f5f5;">
              <h2 style="color: #333;">Merhaba ${username},</h2>
              
              <p style="color: #666; line-height: 1.6;">
                Sahibindenhayvan.com'a ho\u015F geldiniz! Hesab\u0131n\u0131z\u0131 aktifle\u015Ftirmek i\xE7in 
                email adresinizi do\u011Frulaman\u0131z gerekmektedir.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #0066CC; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                  Email Adresimi Do\u011Frula
                </a>
              </div>
              
              <p style="color: #999; font-size: 12px;">
                Bu link 24 saat ge\xE7erlidir. E\u011Fer bu hesab\u0131 siz olu\u015Fturmad\u0131ysan\u0131z, 
                bu emaili g\xF6rmezden gelebilirsiniz.
              </p>
              
              <p style="color: #999; font-size: 12px;">
                Link \xE7al\u0131\u015Fm\u0131yorsa \u015Fu adresi taray\u0131c\u0131n\u0131za kopyalay\u0131n:<br>
                ${verificationUrl}
              </p>
            </div>
            
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>\xA9 2025 Sahibindenhayvan.com - T\xFCm haklar\u0131 sakl\u0131d\u0131r.</p>
            </div>
          </body>
          </html>
        `
      });
      console.log(`\u2705 Verification email sent to ${to}`);
    } catch (error) {
      console.error("\u274C Failed to send verification email:", error);
      throw new Error("Email g\xF6nderilemedi. L\xFCtfen daha sonra tekrar deneyin.");
    }
  }
  async sendPasswordResetEmail(to, token, username) {
    const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || "https://sahibindenhayvan.com";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: "\u015Eifre S\u0131f\u0131rlama - Sahibindenhayvan.com",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>\u015Eifre S\u0131f\u0131rlama</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #0066CC; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Sahibindenhayvan.com</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f5f5f5;">
              <h2 style="color: #333;">Merhaba ${username},</h2>
              
              <p style="color: #666; line-height: 1.6;">
                \u015Eifre s\u0131f\u0131rlama talebiniz ald\u0131k. Yeni bir \u015Fifre olu\u015Fturmak i\xE7in 
                a\u015Fa\u011F\u0131daki butona t\u0131klay\u0131n.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #0066CC; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                  \u015Eifremi S\u0131f\u0131rla
                </a>
              </div>
              
              <p style="color: #999; font-size: 12px;">
                Bu link 24 saat ge\xE7erlidir. E\u011Fer bu talebi siz yapmad\u0131ysan\u0131z, 
                bu emaili g\xF6rmezden gelebilirsiniz.
              </p>
              
              <p style="color: #999; font-size: 12px;">
                Link \xE7al\u0131\u015Fm\u0131yorsa \u015Fu adresi taray\u0131c\u0131n\u0131za kopyalay\u0131n:<br>
                ${resetUrl}
              </p>
            </div>
            
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>\xA9 2025 Sahibindenhayvan.com - T\xFCm haklar\u0131 sakl\u0131d\u0131r.</p>
            </div>
          </body>
          </html>
        `
      });
      console.log(`\u2705 Password reset email sent to ${to}`);
    } catch (error) {
      console.error("\u274C Failed to send password reset email:", error);
      throw new Error("Email g\xF6nderilemedi. L\xFCtfen daha sonra tekrar deneyin.");
    }
  }
  /**
   * İletişim formu mesajını site sahibine iletir.
   *
   * `replyTo` gönderenin adresine ayarlanır: site sahibi gelen e-postaya
   * doğrudan "yanıtla" diyerek kullanıcıya ulaşabilir. `from` alanı kendi
   * doğrulanmış alan adımız olmalı — gönderenin adresini `from` yapmak
   * SPF/DKIM'i bozar ve e-postanın spam'e düşmesine yol açar.
   */
  async sendContactMessage(data) {
    const alici = contactRecipient();
    const satir = (baslik, deger) => `<tr><td style="padding:6px 12px;color:#666;white-space:nowrap">${baslik}</td><td style="padding:6px 12px"><b>${escapeHtml(deger)}</b></td></tr>`;
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: alici,
        replyTo: data.email,
        subject: `\u0130leti\u015Fim formu: ${data.subject}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#0066CC;padding:16px;text-align:center">
              <h2 style="color:#fff;margin:0">sahibindenhayvan.com \u2014 \u0130leti\u015Fim Formu</h2>
            </div>
            <table style="width:100%;border-collapse:collapse;background:#f5f5f5">
              ${satir("Ad Soyad", data.name)}
              ${satir("E-posta", data.email)}
              ${data.phone ? satir("Telefon", data.phone) : ""}
              ${satir("Konu", data.subject)}
            </table>
            <div style="padding:20px;white-space:pre-wrap;line-height:1.6">${escapeHtml(data.message)}</div>
            <p style="padding:0 20px 20px;color:#999;font-size:12px">
              Bu e-postay\u0131 yan\u0131tlarsan\u0131z do\u011Frudan ${escapeHtml(data.email)} adresine ula\u015F\u0131r.
            </p>
          </div>
        `
      });
      console.log(`\u2705 Contact form message forwarded to ${alici}`);
    } catch (error) {
      console.error("\u274C Failed to forward contact message:", error);
      throw new Error("Mesaj iletilemedi.");
    }
  }
  /**
   * "Size yeni bir mesaj var" bildirimi.
   *
   * Mesajın tamamı DEĞİL, kısa bir önizlemesi gönderiliyor. İki nedeni var:
   * kullanıcıyı siteye çekmek ve pazarlığın e-posta üzerinden yürümesini
   * engellemek; ayrıca alıcının posta kutusuna düşen içerik en aza iniyor.
   */
  async sendNewMessageNotice(data) {
    const appUrl = process.env.APP_URL || "https://sahibindenhayvan.com";
    const link = `${appUrl}/mesajlar?conversationId=${encodeURIComponent(data.conversationId)}`;
    const hitap = data.recipientName ? `Merhaba ${escapeHtml(data.recipientName)},` : "Merhaba,";
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: data.to,
        subject: `${data.senderName} size mesaj g\xF6nderdi`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#0066CC;padding:20px;text-align:center">
              <h2 style="color:#fff;margin:0">sahibindenhayvan.com</h2>
            </div>
            <div style="padding:28px 24px;background:#f5f5f5">
              <p style="margin:0 0 12px">${hitap}</p>
              <p style="margin:0 0 18px">
                <b>${escapeHtml(data.senderName)}</b> size bir mesaj g\xF6nderdi${data.listingTitle ? ` \u2014 <i>${escapeHtml(data.listingTitle)}</i>` : ""}.
              </p>
              <blockquote style="margin:0 0 22px;padding:12px 16px;background:#fff;border-left:3px solid #0066CC;color:#444">
                ${escapeHtml(data.preview)}
              </blockquote>
              <div style="text-align:center;margin:26px 0">
                <a href="${link}" style="background:#0066CC;color:#fff;padding:14px 28px;text-decoration:none;border-radius:5px;display:inline-block">
                  Mesaj\u0131 G\xF6r\xFCnt\xFCle
                </a>
              </div>
              <p style="color:#999;font-size:12px;margin:0">
                Bu bildirimleri istemiyorsan\u0131z hesap ayarlar\u0131n\u0131zdan kapatabilirsiniz.
              </p>
            </div>
          </div>
        `
      });
      console.log(`\u2705 New message notice sent to ${data.to}`);
    } catch (error) {
      console.error("\u274C Failed to send new message notice:", error);
    }
  }
  /**
   * Genel olay bildirimi (ilan onayı, teklif, iletişim talebi...).
   *
   * Tek bir biçim kullanılıyor: başlık, açıklama, isteğe bağlı ayrıntı satırları
   * ve tek bir eylem düğmesi. Böylece yeni bir olay türü eklerken burada
   * değişiklik gerekmiyor.
   */
  async sendEventNotice(data) {
    const appUrl = (process.env.APP_URL || "https://sahibindenhayvan.com").replace(/\/$/, "");
    const link = data.actionPath ? /^https?:\/\//i.test(data.actionPath) ? data.actionPath : `${appUrl}${data.actionPath}` : appUrl;
    const hitap = data.recipientName ? `Merhaba ${escapeHtml(data.recipientName)},` : "Merhaba,";
    const ayrinti = (data.details || []).map(
      ([k, v]) => `<tr><td style="padding:6px 12px;color:#666;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:6px 12px"><b>${escapeHtml(v)}</b></td></tr>`
    ).join("");
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: data.to,
        subject: data.title,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#0066CC;padding:20px;text-align:center">
              <h2 style="color:#fff;margin:0">sahibindenhayvan.com</h2>
            </div>
            <div style="padding:28px 24px;background:#f5f5f5">
              <p style="margin:0 0 12px">${hitap}</p>
              <p style="margin:0 0 18px;font-size:16px">${escapeHtml(data.body)}</p>
              ${ayrinti ? `<table style="width:100%;border-collapse:collapse;background:#fff;margin-bottom:20px">${ayrinti}</table>` : ""}
              <div style="text-align:center;margin:26px 0">
                <a href="${link}" style="background:#0066CC;color:#fff;padding:14px 28px;text-decoration:none;border-radius:5px;display:inline-block">
                  ${escapeHtml(data.actionLabel || "Siteye Git")}
                </a>
              </div>
              <p style="color:#999;font-size:12px;margin:0">
                Bu bildirimleri istemiyorsan\u0131z hesap ayarlar\u0131n\u0131zdan kapatabilirsiniz.
              </p>
            </div>
          </div>
        `
      });
      console.log(`\u2705 Event notice "${data.title}" sent to ${data.to}`);
    } catch (error) {
      console.error("\u274C Failed to send event notice:", error);
    }
  }
};
function createEmailService() {
  const isDevelopment2 = process.env.NODE_ENV === "development";
  const hasResendKey = !!process.env.RESEND_API_KEY;
  if (isDevelopment2 && !hasResendKey) {
    console.log("\u{1F4E7} Email Service: Development Mode (Auto-Verify Enabled)");
    return new DevelopmentEmailService();
  }
  if (hasResendKey) {
    console.log("\u{1F4E7} Email Service: Production Mode (Resend)");
    return new ProductionEmailService();
  }
  console.warn("\u26A0\uFE0F  No email service configured - using development mode");
  return new DevelopmentEmailService();
}
function shouldAutoVerifyEmail() {
  const hasResendKey = !!process.env.RESEND_API_KEY;
  return !hasResendKey;
}
var emailService = createEmailService();

// server/bot-protection.ts
var HONEYPOT_FIELD = "website";
var FORM_ELAPSED_FIELD = "formFillMs";
var MIN_FORM_MS = 2e3;
function detectBot(body) {
  if (!body || typeof body !== "object") return { bot: false };
  const veri = body;
  const balKupu = veri[HONEYPOT_FIELD];
  if (typeof balKupu === "string" && balKupu.trim() !== "") {
    return { bot: true, reason: "honeypot" };
  }
  const gecenMs = Number(veri[FORM_ELAPSED_FIELD]);
  if (Number.isFinite(gecenMs) && gecenMs >= 0 && gecenMs < MIN_FORM_MS) {
    return { bot: true, reason: "too-fast" };
  }
  return { bot: false };
}
function botGuard(req, res, next) {
  const sonuc = detectBot(req.body);
  if (sonuc.bot) {
    console.warn(`Bot korumasi engelledi (${sonuc.reason}): ${req.method} ${req.path}`);
    return res.status(400).json({ message: "\u0130stek do\u011Frulanamad\u0131. L\xFCtfen sayfay\u0131 yenileyip tekrar deneyin." });
  }
  next();
}

// server/validation.ts
import { z as z2 } from "zod";
var moderateListingSchema = z2.object({
  status: z2.enum(["active", "rejected"], {
    errorMap: () => ({ message: "Status must be 'active' or 'rejected'" })
  }),
  reason: z2.string().optional()
}).refine(
  (data) => {
    if (data.status === "rejected" && !data.reason) {
      return false;
    }
    return true;
  },
  {
    message: "Rejection reason is required when rejecting a listing",
    path: ["reason"]
  }
);

// server/advancedFeatureRoutes.ts
import { sql as sql5, eq as eq6, and as and5, desc as desc4, inArray as inArray3 } from "drizzle-orm";
var getUserId2 = (user) => {
  if (user?.dbUserId) return user.dbUserId;
  if (user?.claims?.sub) return user.claims.sub;
  if (user?.id) return user.id;
  return "";
};
function limitDegeri(ham, varsayilan = 50, tavan = 200) {
  const n = parseInt(String(ham ?? ""), 10);
  if (!Number.isFinite(n) || n < 1) return varsayilan;
  return Math.min(n, tavan);
}
function registerMarketPriceRoutes(app2) {
  app2.get("/api/market-prices", async (req, res) => {
    try {
      const { type, city, category, limit } = req.query;
      const kosullar = [sql5`1=1`];
      if (type) kosullar.push(sql5`type = ${type}`);
      if (city) kosullar.push(sql5`city ILIKE ${"%" + city + "%"}`);
      if (category) kosullar.push(sql5`category ILIKE ${"%" + category + "%"}`);
      const result = await db.execute(sql5`
        SELECT * FROM market_prices
        WHERE ${sql5.join(kosullar, sql5` AND `)}
        ORDER BY date DESC
        LIMIT ${limitDegeri(limit)}
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching market prices:", error);
      res.status(500).json({ message: "Piyasa fiyatlar\u0131 getirilemedi" });
    }
  });
  app2.get("/api/market-prices/latest", async (req, res) => {
    try {
      const { type } = req.query;
      const filtre = type ? sql5`WHERE type = ${type}` : sql5``;
      const result = await db.execute(sql5`
        SELECT DISTINCT ON (category, city)
          id, type, category, city, price, unit, min_price, max_price,
          change_percent, source, date, created_at
        FROM market_prices
        ${filtre}
        ORDER BY category, city, date DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching latest prices:", error);
      res.status(500).json({ message: "G\xFCncel fiyatlar getirilemedi" });
    }
  });
  app2.get("/api/market-prices/history/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const { city, days } = req.query;
      const daysAgo = /* @__PURE__ */ new Date();
      daysAgo.setDate(daysAgo.getDate() - limitDegeri(days, 30, 365));
      const kosullar = [sql5`category = ${category}`];
      if (city) kosullar.push(sql5`city = ${city}`);
      kosullar.push(sql5`date >= ${daysAgo.toISOString()}`);
      const result = await db.execute(sql5`
        SELECT * FROM market_prices
        WHERE ${sql5.join(kosullar, sql5` AND `)}
        ORDER BY date ASC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching price history:", error);
      res.status(500).json({ message: "Fiyat ge\xE7mi\u015Fi getirilemedi" });
    }
  });
  app2.post("/api/market-prices", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { type, category, city, price, unit, minPrice, maxPrice, changePercent, source } = req.body ?? {};
      const result = await db.execute(sql5`
        INSERT INTO market_prices (type, category, city, price, unit, min_price, max_price, change_percent, source, date)
        VALUES (${type}, ${category}, ${city}, ${price}, ${unit},
                ${minPrice ?? null}, ${maxPrice ?? null}, ${changePercent ?? null},
                ${source ?? null}, NOW())
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error adding market price:", error);
      res.status(500).json({ message: "Fiyat eklenemedi" });
    }
  });
}
function registerVetOnlineRoutes(app2) {
  app2.get("/api/vet-online/vets", async (_req, res) => {
    try {
      const result = await db.execute(sql5`
        SELECT u.id, u.first_name, u.last_name, u.profile_image_url, u.city,
               vs.specializations, vs.online_consultation_available,
               vs.consultation_fee, vs.rating, vs.review_count
        FROM users u
        INNER JOIN vet_services vs ON u.id = vs.user_id
        WHERE u.role = 'veterinarian'
          AND vs.online_consultation_available = true
          AND vs.verified_at IS NOT NULL
        ORDER BY vs.rating DESC NULLS LAST
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching online vets:", error);
      res.status(500).json({ message: "Veterinerler getirilemedi" });
    }
  });
  app2.post("/api/vet-online/consultations", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const { vetId, type, animalType, animalAge, symptoms, images, scheduledAt } = req.body ?? {};
      const result = await db.execute(sql5`
        INSERT INTO vet_online_services
        (vet_id, client_id, type, animal_type, animal_age, symptoms, images, scheduled_at)
        VALUES (${vetId}, ${userId}, ${type},
                ${animalType ?? null}, ${animalAge ?? null}, ${symptoms ?? null},
                ${JSON.stringify(images || [])}::jsonb,
                ${scheduledAt ?? null})
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating consultation:", error);
      res.status(500).json({ message: "Kons\xFCltasyon olu\u015Fturulamad\u0131" });
    }
  });
  app2.get("/api/vet-online/my-consultations", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const result = await db.execute(sql5`
        SELECT c.*,
               u.first_name as vet_first_name, u.last_name as vet_last_name,
               u.profile_image_url as vet_image
        FROM vet_online_services c
        INNER JOIN users u ON c.vet_id = u.id
        WHERE c.client_id = ${userId}
        ORDER BY c.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching consultations:", error);
      res.status(500).json({ message: "Kons\xFCltasyonlar getirilemedi" });
    }
  });
  app2.get("/api/vet-online/vet-consultations", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const result = await db.execute(sql5`
        SELECT c.*,
               u.first_name as client_first_name, u.last_name as client_last_name,
               u.profile_image_url as client_image, u.phone as client_phone
        FROM vet_online_services c
        INNER JOIN users u ON c.client_id = u.id
        WHERE c.vet_id = ${userId}
        ORDER BY c.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching vet consultations:", error);
      res.status(500).json({ message: "Kons\xFCltasyonlar getirilemedi" });
    }
  });
  app2.patch("/api/vet-online/consultations/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const { id } = req.params;
      const { status, diagnosis, prescription, notes, price } = req.body ?? {};
      const set = [sql5`updated_at = NOW()`];
      if (status) set.push(sql5`status = ${status}`);
      if (diagnosis) set.push(sql5`diagnosis = ${diagnosis}`);
      if (prescription) set.push(sql5`prescription = ${prescription}`);
      if (notes) set.push(sql5`notes = ${notes}`);
      if (price !== void 0) set.push(sql5`price = ${price}`);
      if (status === "completed") set.push(sql5`completed_at = NOW()`);
      const result = await db.execute(sql5`
        UPDATE vet_online_services
        SET ${sql5.join(set, sql5`, `)}
        WHERE id = ${id} AND (vet_id = ${userId} OR client_id = ${userId})
        RETURNING *
      `);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Kons\xFCltasyon bulunamad\u0131" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating consultation:", error);
      res.status(500).json({ message: "Kons\xFCltasyon g\xFCncellenemedi" });
    }
  });
  app2.post("/api/vet-online/consultations/:id/rate", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const { id } = req.params;
      const { rating, review } = req.body ?? {};
      const result = await db.execute(sql5`
        UPDATE vet_online_services
        SET rating = ${rating}, review = ${review ?? null}, updated_at = NOW()
        WHERE id = ${id} AND client_id = ${userId}
        RETURNING *
      `);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Kons\xFCltasyon bulunamad\u0131" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error rating consultation:", error);
      res.status(500).json({ message: "De\u011Ferlendirme kaydedilemedi" });
    }
  });
}
function registerTransportRoutes(app2) {
  app2.post("/api/transport/requests", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const {
        animalType,
        animalCount,
        animalWeight,
        originCity,
        originDistrict,
        originAddress,
        destinationCity,
        destinationDistrict,
        destinationAddress,
        preferredDate,
        flexibleDate,
        specialRequirements
      } = req.body ?? {};
      const result = await db.execute(sql5`
        INSERT INTO transport_requests
        (user_id, animal_type, animal_count, animal_weight,
         origin_city, origin_district, origin_address,
         destination_city, destination_district, destination_address,
         preferred_date, flexible_date, special_requirements)
        VALUES (${userId}, ${animalType}, ${animalCount},
                ${animalWeight ?? null},
                ${originCity}, ${originDistrict ?? null}, ${originAddress ?? null},
                ${destinationCity}, ${destinationDistrict ?? null}, ${destinationAddress ?? null},
                ${preferredDate ?? null},
                ${flexibleDate !== void 0 ? flexibleDate : true},
                ${specialRequirements ?? null})
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating transport request:", error);
      res.status(500).json({ message: "Nakliye talebi olu\u015Fturulamad\u0131" });
    }
  });
  app2.get("/api/transport/requests", async (req, res) => {
    try {
      const { originCity, destinationCity, animalType } = req.query;
      const kosullar = [sql5`r.status = 'pending'`];
      if (originCity) kosullar.push(sql5`r.origin_city ILIKE ${"%" + originCity + "%"}`);
      if (destinationCity) kosullar.push(sql5`r.destination_city ILIKE ${"%" + destinationCity + "%"}`);
      if (animalType) kosullar.push(sql5`r.animal_type ILIKE ${"%" + animalType + "%"}`);
      const result = await db.execute(sql5`
        SELECT r.*, u.first_name, u.last_name, u.city as user_city
        FROM transport_requests r
        INNER JOIN users u ON r.user_id = u.id
        WHERE ${sql5.join(kosullar, sql5` AND `)}
        ORDER BY r.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching transport requests:", error);
      res.status(500).json({ message: "Talepler getirilemedi" });
    }
  });
  app2.get("/api/transport/my-requests", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const result = await db.execute(sql5`
        SELECT r.*,
               (SELECT COUNT(*) FROM transport_quotes WHERE request_id = r.id) as quote_count
        FROM transport_requests r
        WHERE r.user_id = ${userId}
        ORDER BY r.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching my requests:", error);
      res.status(500).json({ message: "Talepler getirilemedi" });
    }
  });
  app2.post("/api/transport/quotes", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const { requestId, price, estimatedDuration, vehicleType, vehicleCapacity, insuranceIncluded, notes, expiresAt } = req.body ?? {};
      const result = await db.execute(sql5`
        INSERT INTO transport_quotes
        (request_id, transporter_id, price, estimated_duration, vehicle_type,
         vehicle_capacity, insurance_included, notes, expires_at)
        VALUES (${requestId}, ${userId}, ${price},
                ${estimatedDuration ?? null},
                ${vehicleType ?? null}, ${vehicleCapacity ?? null},
                ${insuranceIncluded || false},
                ${notes ?? null}, ${expiresAt ?? null})
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error submitting quote:", error);
      res.status(500).json({ message: "Teklif g\xF6nderilemedi" });
    }
  });
  app2.get("/api/transport/requests/:id/quotes", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const { id } = req.params;
      const result = await db.execute(sql5`
        SELECT q.*,
               u.first_name, u.last_name, u.profile_image_url,
               ts.vehicle_types, ts.service_regions, ts.rating, ts.completed_transports
        FROM transport_quotes q
        INNER JOIN users u ON q.transporter_id = u.id
        LEFT JOIN transport_services ts ON u.id = ts.user_id
        WHERE q.request_id = ${id}
        ORDER BY q.price ASC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Teklifler getirilemedi" });
    }
  });
  app2.post("/api/transport/quotes/:id/accept", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const { id } = req.params;
      const quoteResult = await db.execute(sql5`
        UPDATE transport_quotes SET is_accepted = true WHERE id = ${id} RETURNING request_id
      `);
      if (quoteResult.rows.length === 0) {
        return res.status(404).json({ message: "Teklif bulunamad\u0131" });
      }
      const requestId = quoteResult.rows[0].request_id;
      const result = await db.execute(sql5`
        UPDATE transport_requests
        SET status = 'accepted', accepted_quote_id = ${id}, updated_at = NOW()
        WHERE id = ${requestId} AND user_id = ${userId}
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error accepting quote:", error);
      res.status(500).json({ message: "Teklif kabul edilemedi" });
    }
  });
}
function registerB2BRoutes(app2) {
  app2.get("/api/b2b/listings", async (req, res) => {
    try {
      const { category, minQuantity, maxPrice, city } = req.query;
      const kosullar = [sql5`l.status = 'active'`];
      if (category) kosullar.push(sql5`l.category ILIKE ${"%" + category + "%"}`);
      if (minQuantity) kosullar.push(sql5`l.available_stock >= ${minQuantity}`);
      if (maxPrice) kosullar.push(sql5`l.price_per_unit <= ${maxPrice}`);
      if (city) kosullar.push(sql5`u.city ILIKE ${"%" + city + "%"}`);
      const result = await db.execute(sql5`
        SELECT l.*,
               u.first_name, u.last_name, u.city as seller_city,
               s.display_name as store_name, s.logo as store_logo, s.verified_at as store_verified
        FROM b2b_listings l
        INNER JOIN users u ON l.seller_id = u.id
        LEFT JOIN stores s ON l.store_id = s.id
        WHERE ${sql5.join(kosullar, sql5` AND `)}
        ORDER BY l.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching B2B listings:", error);
      res.status(500).json({ message: "\xDCr\xFCnler getirilemedi" });
    }
  });
  app2.get("/api/b2b/listings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.execute(sql5`UPDATE b2b_listings SET view_count = view_count + 1 WHERE id = ${id}`);
      const result = await db.execute(sql5`
        SELECT l.*,
               u.first_name, u.last_name, u.city as seller_city, u.phone as seller_phone,
               s.display_name as store_name, s.logo as store_logo, s.verified_at as store_verified
        FROM b2b_listings l
        INNER JOIN users u ON l.seller_id = u.id
        LEFT JOIN stores s ON l.store_id = s.id
        WHERE l.id = ${id} AND l.status = 'active'
      `);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "\xDCr\xFCn bulunamad\u0131" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching B2B listing:", error);
      res.status(500).json({ message: "\xDCr\xFCn getirilemedi" });
    }
  });
  app2.post("/api/b2b/listings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const {
        storeId,
        title,
        description,
        category,
        brand,
        unit,
        minQuantity,
        maxQuantity,
        pricePerUnit,
        bulkDiscounts,
        availableStock,
        images,
        specifications,
        deliveryOptions
      } = req.body ?? {};
      const result = await db.execute(sql5`
        INSERT INTO b2b_listings
        (seller_id, store_id, title, description, category, brand, unit,
         min_quantity, max_quantity, price_per_unit, bulk_discounts,
         available_stock, images, specifications, delivery_options)
        VALUES (${userId}, ${storeId ?? null},
                ${title}, ${description ?? null},
                ${category}, ${brand ?? null}, ${unit},
                ${minQuantity}, ${maxQuantity ?? null}, ${pricePerUnit},
                ${JSON.stringify(bulkDiscounts || [])}::jsonb,
                ${availableStock ?? null},
                ${JSON.stringify(images || [])}::jsonb,
                ${JSON.stringify(specifications || {})}::jsonb,
                ${JSON.stringify(deliveryOptions || [])}::jsonb)
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating B2B listing:", error);
      res.status(500).json({ message: "\xDCr\xFCn olu\u015Fturulamad\u0131" });
    }
  });
  app2.post("/api/b2b/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const { listingId, quantity, deliveryAddress, deliveryCity, deliveryNotes } = req.body ?? {};
      const listingResult = await db.execute(sql5`
        SELECT * FROM b2b_listings WHERE id = ${listingId} AND status = 'active'
      `);
      if (listingResult.rows.length === 0) {
        return res.status(404).json({ message: "\xDCr\xFCn bulunamad\u0131 veya stokta yok" });
      }
      const listing = listingResult.rows[0];
      if (quantity < listing.min_quantity) {
        return res.status(400).json({ message: `Minimum sipari\u015F miktar\u0131: ${listing.min_quantity}` });
      }
      let unitPrice = parseFloat(listing.price_per_unit);
      const bulkDiscounts = listing.bulk_discounts || [];
      for (const discount of bulkDiscounts) {
        if (quantity >= discount.minQuantity) {
          unitPrice = unitPrice * (1 - discount.discountPercent / 100);
        }
      }
      const totalPrice = unitPrice * quantity;
      const result = await db.execute(sql5`
        INSERT INTO b2b_orders
        (listing_id, buyer_id, seller_id, quantity, unit_price, total_price,
         delivery_address, delivery_city, delivery_notes)
        VALUES (${listingId}, ${userId}, ${listing.seller_id},
                ${quantity}, ${unitPrice}, ${totalPrice},
                ${deliveryAddress ?? null}, ${deliveryCity ?? null}, ${deliveryNotes ?? null})
        RETURNING *
      `);
      await db.execute(sql5`UPDATE b2b_listings SET order_count = order_count + 1 WHERE id = ${listingId}`);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating B2B order:", error);
      res.status(500).json({ message: "Sipari\u015F olu\u015Fturulamad\u0131" });
    }
  });
  app2.get("/api/b2b/my-orders", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const result = await db.execute(sql5`
        SELECT o.*,
               l.title as product_title, l.images as product_images,
               u.first_name as seller_first_name, u.last_name as seller_last_name
        FROM b2b_orders o
        INNER JOIN b2b_listings l ON o.listing_id = l.id
        INNER JOIN users u ON o.seller_id = u.id
        WHERE o.buyer_id = ${userId}
        ORDER BY o.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching my orders:", error);
      res.status(500).json({ message: "Sipari\u015Fler getirilemedi" });
    }
  });
  app2.get("/api/b2b/seller-orders", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const result = await db.execute(sql5`
        SELECT o.*,
               l.title as product_title,
               u.first_name as buyer_first_name, u.last_name as buyer_last_name,
               u.phone as buyer_phone
        FROM b2b_orders o
        INNER JOIN b2b_listings l ON o.listing_id = l.id
        INNER JOIN users u ON o.buyer_id = u.id
        WHERE o.seller_id = ${userId}
        ORDER BY o.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching seller orders:", error);
      res.status(500).json({ message: "Sipari\u015Fler getirilemedi" });
    }
  });
  app2.patch("/api/b2b/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const { id } = req.params;
      const { status, estimatedDelivery } = req.body ?? {};
      const set = [sql5`updated_at = NOW()`];
      if (status) {
        set.push(sql5`status = ${status}`);
        if (status === "delivered") set.push(sql5`delivered_at = NOW()`);
      }
      if (estimatedDelivery) set.push(sql5`estimated_delivery = ${estimatedDelivery}`);
      const result = await db.execute(sql5`
        UPDATE b2b_orders
        SET ${sql5.join(set, sql5`, `)}
        WHERE id = ${id} AND seller_id = ${userId}
        RETURNING *
      `);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Sipari\u015F bulunamad\u0131" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Sipari\u015F g\xFCncellenemedi" });
    }
  });
}
function registerWholesaleRoutes(app2) {
  app2.get("/api/wholesale/products", async (req, res) => {
    try {
      const { type, certified, minQuantity, city } = req.query;
      const kosullar = [sql5`p.status = 'active'`];
      if (type) kosullar.push(sql5`p.product_type ILIKE ${"%" + type + "%"}`);
      if (certified === "true") kosullar.push(sql5`p.is_certified = true`);
      if (minQuantity) kosullar.push(sql5`p.available_quantity >= ${minQuantity}`);
      if (city) kosullar.push(sql5`u.city ILIKE ${"%" + city + "%"}`);
      const result = await db.execute(sql5`
        SELECT p.*,
               u.first_name, u.last_name, u.city as seller_city,
               s.display_name as store_name, s.logo as store_logo
        FROM wholesale_products p
        INNER JOIN users u ON p.seller_id = u.id
        LEFT JOIN stores s ON p.store_id = s.id
        WHERE ${sql5.join(kosullar, sql5` AND `)}
        ORDER BY p.is_certified DESC, p.rating DESC, p.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching wholesale products:", error);
      res.status(500).json({ message: "\xDCr\xFCnler getirilemedi" });
    }
  });
  app2.get("/api/wholesale/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.execute(sql5`
        SELECT p.*,
               u.first_name, u.last_name, u.city as seller_city, u.phone as seller_phone,
               s.display_name as store_name, s.logo as store_logo, s.verified_at as store_verified
        FROM wholesale_products p
        INNER JOIN users u ON p.seller_id = u.id
        LEFT JOIN stores s ON p.store_id = s.id
        WHERE p.id = ${id} AND p.status = 'active'
      `);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "\xDCr\xFCn bulunamad\u0131" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching wholesale product:", error);
      res.status(500).json({ message: "\xDCr\xFCn getirilemedi" });
    }
  });
  app2.post("/api/wholesale/products", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const {
        storeId,
        productType,
        title,
        description,
        origin,
        unit,
        minOrder,
        pricePerUnit,
        bulkPricing,
        availableQuantity,
        images,
        certifications,
        isCertified,
        deliveryZones
      } = req.body ?? {};
      const result = await db.execute(sql5`
        INSERT INTO wholesale_products
        (seller_id, store_id, product_type, title, description, origin, unit,
         min_order, price_per_unit, bulk_pricing, available_quantity,
         images, certifications, is_certified, delivery_zones)
        VALUES (${userId}, ${storeId ?? null},
                ${productType}, ${title}, ${description ?? null},
                ${origin ?? null}, ${unit},
                ${minOrder}, ${pricePerUnit},
                ${JSON.stringify(bulkPricing || [])}::jsonb,
                ${availableQuantity ?? null},
                ${JSON.stringify(images || [])}::jsonb,
                ${JSON.stringify(certifications || [])}::jsonb,
                ${isCertified || false},
                ${JSON.stringify(deliveryZones || [])}::jsonb)
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating wholesale product:", error);
      res.status(500).json({ message: "\xDCr\xFCn olu\u015Fturulamad\u0131" });
    }
  });
  app2.post("/api/wholesale/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const { productId, quantity, deliveryAddress, deliveryCity, deliveryNotes } = req.body ?? {};
      const productResult = await db.execute(sql5`
        SELECT * FROM wholesale_products WHERE id = ${productId} AND status = 'active'
      `);
      if (productResult.rows.length === 0) {
        return res.status(404).json({ message: "\xDCr\xFCn bulunamad\u0131" });
      }
      const product = productResult.rows[0];
      if (quantity < product.min_order) {
        return res.status(400).json({ message: `Minimum sipari\u015F miktar\u0131: ${product.min_order}` });
      }
      let unitPrice = parseFloat(product.price_per_unit);
      const bulkPricing = product.bulk_pricing || [];
      for (const pricing of bulkPricing) {
        if (quantity >= pricing.minQuantity) {
          unitPrice = pricing.pricePerUnit;
        }
      }
      const totalPrice = unitPrice * quantity;
      const result = await db.execute(sql5`
        INSERT INTO wholesale_orders
        (product_id, buyer_id, seller_id, quantity, unit_price, total_price,
         delivery_address, delivery_city, delivery_notes)
        VALUES (${productId}, ${userId}, ${product.seller_id},
                ${quantity}, ${unitPrice}, ${totalPrice},
                ${deliveryAddress ?? null}, ${deliveryCity ?? null}, ${deliveryNotes ?? null})
        RETURNING *
      `);
      await db.execute(sql5`UPDATE wholesale_products SET order_count = order_count + 1 WHERE id = ${productId}`);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating wholesale order:", error);
      res.status(500).json({ message: "Sipari\u015F olu\u015Fturulamad\u0131" });
    }
  });
  app2.get("/api/wholesale/my-orders", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const result = await db.execute(sql5`
        SELECT o.*,
               p.title as product_title, p.product_type, p.images as product_images,
               u.first_name as seller_first_name, u.last_name as seller_last_name
        FROM wholesale_orders o
        INNER JOIN wholesale_products p ON o.product_id = p.id
        INNER JOIN users u ON o.seller_id = u.id
        WHERE o.buyer_id = ${userId}
        ORDER BY o.created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching my orders:", error);
      res.status(500).json({ message: "Sipari\u015Fler getirilemedi" });
    }
  });
  app2.post("/api/wholesale/orders/:id/rate", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const { id } = req.params;
      const { rating, review } = req.body ?? {};
      const result = await db.execute(sql5`
        UPDATE wholesale_orders
        SET buyer_rating = ${rating}, buyer_review = ${review ?? null}, updated_at = NOW()
        WHERE id = ${id} AND buyer_id = ${userId} AND status = 'delivered'
        RETURNING product_id
      `);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Sipari\u015F bulunamad\u0131 veya de\u011Ferlendirilemez" });
      }
      const productId = result.rows[0].product_id;
      await db.execute(sql5`
        UPDATE wholesale_products p
        SET rating = (
          SELECT AVG(buyer_rating) FROM wholesale_orders
          WHERE product_id = ${productId} AND buyer_rating IS NOT NULL
        ),
        review_count = (
          SELECT COUNT(*) FROM wholesale_orders
          WHERE product_id = ${productId} AND buyer_rating IS NOT NULL
        )
        WHERE id = ${productId}
      `);
      res.json({ success: true });
    } catch (error) {
      console.error("Error rating order:", error);
      res.status(500).json({ message: "De\u011Ferlendirme kaydedilemedi" });
    }
  });
}
function registerFarmTVRoutes(app2) {
  app2.get("/api/farm-tv/streams", async (req, res) => {
    try {
      const { status, category } = req.query;
      const kosullar = [sql5`s.is_enabled = true`];
      if (status) kosullar.push(sql5`s.status = ${status}`);
      if (category) kosullar.push(sql5`s.category ILIKE ${"%" + category + "%"}`);
      const result = await db.execute(sql5`
        SELECT s.*,
               u.first_name, u.last_name, u.profile_image_url
        FROM farm_tv_streams s
        INNER JOIN users u ON s.streamer_id = u.id
        WHERE ${sql5.join(kosullar, sql5` AND `)}
        ORDER BY
          CASE s.status
            WHEN 'live' THEN 1
            WHEN 'scheduled' THEN 2
            ELSE 3
          END,
          s.scheduled_at ASC
      `);
      res.json(result.rows.map(({ stream_key, ...r }) => r));
    } catch (error) {
      console.error("Error fetching streams:", error);
      res.status(500).json({ message: "Yay\u0131nlar getirilemedi" });
    }
  });
  app2.get("/api/farm-tv/streams/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.execute(sql5`UPDATE farm_tv_streams SET total_views = total_views + 1 WHERE id = ${id}`);
      const result = await db.execute(sql5`
        SELECT s.*,
               u.first_name, u.last_name, u.profile_image_url
        FROM farm_tv_streams s
        INNER JOIN users u ON s.streamer_id = u.id
        WHERE s.id = ${id}
      `);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Yay\u0131n bulunamad\u0131" });
      }
      const { stream_key, ...yayin } = result.rows[0];
      res.json(yayin);
    } catch (error) {
      console.error("Error fetching stream:", error);
      res.status(500).json({ message: "Yay\u0131n getirilemedi" });
    }
  });
  app2.post("/api/farm-tv/streams", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const { title, description, category, scheduledAt } = req.body ?? {};
      const streamKey = `farm_${userId}_${Math.random().toString(36).slice(2)}`;
      const result = await db.execute(sql5`
        INSERT INTO farm_tv_streams
        (streamer_id, title, description, category, stream_key, scheduled_at, is_enabled)
        VALUES (${userId}, ${title},
                ${description ?? null}, ${category ?? null},
                ${streamKey}, ${scheduledAt ?? null}, false)
        RETURNING *
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating stream:", error);
      res.status(500).json({ message: "Yay\u0131n olu\u015Fturulamad\u0131" });
    }
  });
  app2.post("/api/farm-tv/streams/:id/gift", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const { id } = req.params;
      const { giftType, giftName, quantity, tokenValue, message } = req.body ?? {};
      const adet = Number(quantity) || 1;
      const jeton = Number(tokenValue) || 0;
      const result = await db.execute(sql5`
        INSERT INTO farm_tv_gifts
        (stream_id, sender_id, gift_type, gift_name, quantity, token_value, message)
        VALUES (${id}, ${userId}, ${giftType}, ${giftName},
                ${adet}, ${jeton}, ${message ?? null})
        RETURNING *
      `);
      await db.execute(sql5`
        UPDATE farm_tv_streams
        SET total_gifts = total_gifts + ${adet},
            total_earnings = total_earnings + ${jeton * adet}
        WHERE id = ${id}
      `);
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error sending gift:", error);
      res.status(500).json({ message: "Hediye g\xF6nderilemedi" });
    }
  });
}
var MESLEK_ROLU = {
  veterinarian: "vet",
  transporter: "transporter"
  // b2b_seller ve dairy_seller ayrı bir rol gerektirmiyor; rozet olarak
  // gösteriliyorlar.
};
var GECERLI_MESLEKLER = ["veterinarian", "transporter", "b2b_seller", "dairy_seller"];
function registerVerificationRoutes(app2) {
  app2.post("/api/verify/request", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const { professionalType, documentType, documentNumber, issuingAuthority, documentUrl, documentKey, notes } = req.body ?? {};
      if (!professionalType || !documentType) {
        return res.status(400).json({ message: "Meslek t\xFCr\xFC ve belge t\xFCr\xFC zorunludur" });
      }
      if (!GECERLI_MESLEKLER.includes(professionalType)) {
        return res.status(400).json({ message: "Ge\xE7ersiz meslek t\xFCr\xFC" });
      }
      const [mevcut] = await db.select({ id: professionalVerifications.id, status: professionalVerifications.status }).from(professionalVerifications).where(
        and5(
          eq6(professionalVerifications.userId, userId),
          eq6(professionalVerifications.professionalType, professionalType),
          inArray3(professionalVerifications.status, ["pending", "approved"])
        )
      ).limit(1);
      if (mevcut) {
        return res.status(409).json({
          message: mevcut.status === "approved" ? "Bu meslek t\xFCr\xFC i\xE7in zaten onaylanm\u0131\u015F bir do\u011Frulama var" : "Bu meslek t\xFCr\xFC i\xE7in bekleyen bir do\u011Frulama talebi zaten var"
        });
      }
      const [olusan] = await db.insert(professionalVerifications).values({
        userId,
        professionalType,
        documentType,
        documentNumber: documentNumber || null,
        issuingAuthority: issuingAuthority || null,
        documentUrl: documentUrl || null,
        documentKey: documentKey || null,
        notes: notes || null,
        // Durum istekten ALINMAZ: başvuru her zaman incelemeye girer.
        status: "pending"
      }).returning();
      res.json({ success: true, verification: olusan });
    } catch (error) {
      console.error("Error creating verification request:", error);
      res.status(500).json({ message: "Do\u011Frulama talebi olu\u015Fturulamad\u0131" });
    }
  });
  app2.get("/api/verify/status", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId2(req.user);
      if (!userId) return res.status(401).json({ message: "Giri\u015F yapmal\u0131s\u0131n\u0131z" });
      const kayitlar = await db.select({
        id: professionalVerifications.id,
        professional_type: professionalVerifications.professionalType,
        document_type: professionalVerifications.documentType,
        document_number: professionalVerifications.documentNumber,
        issuing_authority: professionalVerifications.issuingAuthority,
        notes: professionalVerifications.notes,
        status: professionalVerifications.status,
        admin_notes: professionalVerifications.adminNotes,
        reviewed_at: professionalVerifications.reviewedAt,
        created_at: professionalVerifications.createdAt,
        reviewer_first_name: users.firstName,
        reviewer_last_name: users.lastName
      }).from(professionalVerifications).leftJoin(users, eq6(professionalVerifications.reviewedBy, users.id)).where(eq6(professionalVerifications.userId, userId)).orderBy(desc4(professionalVerifications.createdAt));
      res.json(kayitlar);
    } catch (error) {
      console.error("Error fetching verification status:", error);
      res.status(500).json({ message: "Do\u011Frulama durumu getirilemedi" });
    }
  });
  app2.get("/api/admin/verifications", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { status, type } = req.query;
      const kosullar = [];
      if (status && ["pending", "approved", "rejected"].includes(status)) {
        kosullar.push(eq6(professionalVerifications.status, status));
      }
      if (type && GECERLI_MESLEKLER.includes(type)) {
        kosullar.push(eq6(professionalVerifications.professionalType, type));
      }
      const kayitlar = await db.select({
        id: professionalVerifications.id,
        user_id: professionalVerifications.userId,
        professional_type: professionalVerifications.professionalType,
        document_type: professionalVerifications.documentType,
        document_number: professionalVerifications.documentNumber,
        issuing_authority: professionalVerifications.issuingAuthority,
        document_url: professionalVerifications.documentUrl,
        notes: professionalVerifications.notes,
        status: professionalVerifications.status,
        admin_notes: professionalVerifications.adminNotes,
        reviewed_at: professionalVerifications.reviewedAt,
        created_at: professionalVerifications.createdAt,
        first_name: users.firstName,
        last_name: users.lastName,
        email: users.email,
        city: users.city
      }).from(professionalVerifications).innerJoin(users, eq6(professionalVerifications.userId, users.id)).where(kosullar.length ? and5(...kosullar) : void 0).orderBy(
        sql5`CASE ${professionalVerifications.status} WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END`,
        desc4(professionalVerifications.createdAt)
      );
      res.json(kayitlar);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      res.status(500).json({ message: "Do\u011Frulama listesi getirilemedi" });
    }
  });
  app2.patch("/api/admin/verifications/:id", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const adminId = getUserId2(req.user);
      const { id } = req.params;
      const { status, adminNotes } = req.body ?? {};
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Ge\xE7ersiz durum" });
      }
      const [guncel] = await db.update(professionalVerifications).set({
        status,
        adminNotes: adminNotes || null,
        reviewedBy: adminId,
        reviewedAt: /* @__PURE__ */ new Date()
      }).where(eq6(professionalVerifications.id, id)).returning();
      if (!guncel) {
        return res.status(404).json({ message: "Do\u011Frulama talebi bulunamad\u0131" });
      }
      if (status === "approved") {
        const rol = MESLEK_ROLU[guncel.professionalType];
        if (rol) {
          const [hedef] = await db.select({ role: users.role }).from(users).where(eq6(users.id, guncel.userId)).limit(1);
          if (hedef && hedef.role !== "admin" && hedef.role !== rol) {
            await db.update(users).set({ role: rol }).where(eq6(users.id, guncel.userId));
          }
        }
        if (guncel.professionalType === "veterinarian") {
          await db.update(vetServices).set({ verified: true }).where(eq6(vetServices.vetId, guncel.userId));
        } else if (guncel.professionalType === "transporter") {
          await db.update(transportServices).set({ verified: true }).where(eq6(transportServices.transporterId, guncel.userId));
        }
      }
      try {
        await db.insert(notifications).values({
          userId: guncel.userId,
          type: "system",
          title: status === "approved" ? "Meslek Do\u011Frulamas\u0131 Onayland\u0131" : "Meslek Do\u011Frulamas\u0131 Reddedildi",
          message: status === "approved" ? "Belgeleriniz onayland\u0131. Art\u0131k hizmet kayd\u0131 olu\u015Fturabilirsiniz." : `Do\u011Frulama ba\u015Fvurunuz onaylanmad\u0131${guncel.adminNotes ? ": " + guncel.adminNotes : "."}`,
          link: "/panel/dogrulama",
          relatedId: guncel.id
        });
      } catch (bildirimHatasi) {
        console.error("Failed to create verification notification:", bildirimHatasi);
      }
      res.json({ success: true, verification: guncel });
    } catch (error) {
      console.error("Error updating verification:", error);
      res.status(500).json({ message: "Do\u011Frulama g\xFCncellenemedi" });
    }
  });
}
function registerAdvancedFeatureRoutes(app2) {
  registerMarketPriceRoutes(app2);
  registerVetOnlineRoutes(app2);
  registerTransportRoutes(app2);
  registerB2BRoutes(app2);
  registerWholesaleRoutes(app2);
  registerFarmTVRoutes(app2);
  registerVerificationRoutes(app2);
  console.log("Advanced feature routes registered successfully");
}

// server/marketDataService.ts
var tcmbCache = null;
var TCMB_TTL_MS = 30 * 60 * 1e3;
function parseTCMBXml(xml) {
  const dateMatch = xml.match(/Date="(\d{2}\/\d{2}\/\d{4})"/);
  const date = dateMatch ? dateMatch[1] : (/* @__PURE__ */ new Date()).toLocaleDateString("tr-TR");
  const rates = [];
  const currencyRegex = /<Currency[^>]+CurrencyCode="([A-Z]+)"[^>]*>([\s\S]*?)<\/Currency>/g;
  let match;
  while ((match = currencyRegex.exec(xml)) !== null) {
    const code = match[1];
    const block = match[2];
    const buyMatch = block.match(/<ForexBuying>([\d.]+)<\/ForexBuying>/);
    const sellMatch = block.match(/<ForexSelling>([\d.]+)<\/ForexSelling>/);
    const nameMatch = block.match(/<CurrencyName>([^<]+)<\/CurrencyName>/);
    if (!buyMatch || !sellMatch) continue;
    const buying = parseFloat(buyMatch[1]);
    const selling = parseFloat(sellMatch[1]);
    if (isNaN(buying) || buying === 0) continue;
    rates.push({
      code,
      name: nameMatch ? nameMatch[1] : code,
      buying,
      selling
    });
  }
  return { rates, date, fetchedAt: /* @__PURE__ */ new Date() };
}
async function fetchPrevTCMBRates() {
  try {
    const today = /* @__PURE__ */ new Date();
    let prev = new Date(today);
    prev.setDate(prev.getDate() - 1);
    if (prev.getDay() === 0) prev.setDate(prev.getDate() - 2);
    if (prev.getDay() === 6) prev.setDate(prev.getDate() - 1);
    const dd = String(prev.getDate()).padStart(2, "0");
    const mm = String(prev.getMonth() + 1).padStart(2, "0");
    const yyyy = prev.getFullYear();
    const url = `https://www.tcmb.gov.tr/kurlar/${yyyy}/${mm}/${dd}${mm}${yyyy}.xml`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5e3) });
    if (!res.ok) return /* @__PURE__ */ new Map();
    const xml = await res.text();
    const parsed = parseTCMBXml(xml);
    return new Map(parsed.rates.map((r) => [r.code, r.buying]));
  } catch {
    return /* @__PURE__ */ new Map();
  }
}
async function getTCMBRates() {
  const now = /* @__PURE__ */ new Date();
  if (tcmbCache && now.getTime() - tcmbCache.fetchedAt.getTime() < TCMB_TTL_MS) {
    return tcmbCache;
  }
  try {
    const [todayRes, prevRates] = await Promise.all([
      fetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
        signal: AbortSignal.timeout(8e3),
        headers: { "User-Agent": "Mozilla/5.0 sahibindenhayvan-market-data/1.0" }
      }),
      fetchPrevTCMBRates()
    ]);
    if (!todayRes.ok) throw new Error(`TCMB HTTP ${todayRes.status}`);
    const xml = await todayRes.text();
    const result = parseTCMBXml(xml);
    for (const rate of result.rates) {
      const prev = prevRates.get(rate.code);
      if (prev && prev > 0) {
        rate.prevBuying = prev;
      }
    }
    tcmbCache = result;
    console.log(`\u2705 TCMB d\xF6viz kurlar\u0131 g\xFCncellendi: ${result.rates.length} kur, tarih: ${result.date}`);
    return result;
  } catch (err) {
    console.error("\u26A0\uFE0F  TCMB API hatas\u0131:", err);
    if (tcmbCache) return tcmbCache;
    throw err;
  }
}
var TICKER_CURRENCIES = ["USD", "EUR", "GBP", "CHF"];
function formatCurrencyForTicker(result) {
  return result.rates.filter((r) => TICKER_CURRENCIES.includes(r.code)).map((r) => {
    const changePercent = r.prevBuying && r.prevBuying > 0 ? (r.buying - r.prevBuying) / r.prevBuying * 100 : null;
    return {
      id: `tcmb-${r.code.toLowerCase()}-try`,
      type: "doviz",
      category: `${r.code}/TRY`,
      city: "TCMB",
      price: r.buying.toFixed(4),
      unit: "\u20BA",
      change_percent: changePercent !== null ? changePercent.toFixed(2) : "0.00",
      source: "TCMB",
      isLive: true,
      date: (/* @__PURE__ */ new Date()).toISOString()
    };
  });
}

// server/routes.ts
var notificationEmitter = new EventEmitter();
var uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Sadece JPEG, PNG, WebP veya GIF y\xFCklenebilir"));
    }
  }
});
var uploadMessageFiles = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Desteklenmeyen dosya t\xFCr\xFC"));
    }
  }
});
var uploadDocuments = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Sadece PDF, JPEG, PNG veya WebP dosyalar\u0131 y\xFCklenebilir"));
    }
  }
});
var upload = uploadImages;
var isDevelopment = process.env.NODE_ENV !== "production";
var createLimiter = rateLimit({
  windowMs: 60 * 1e3,
  // 1 minute
  max: isDevelopment ? 60 : 20,
  // 60 requests/min in dev, 20 in production
  message: "\xC7ok fazla istek g\xF6nderdiniz. L\xFCtfen bir dakika bekleyin.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDevelopment && req.path === "/api/listings"
  // Skip rate limit for listings in dev
});
async function checkRedisRateLimit(key, limit, windowSeconds) {
  try {
    const now = Math.floor(Date.now() / 1e3);
    const windowKey = `ratelimit:${key}:${Math.floor(now / windowSeconds)}`;
    const count2 = await cache.incr(windowKey, windowSeconds);
    const resetAt = (Math.floor(now / windowSeconds) + 1) * windowSeconds;
    if (count2 > limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt
      };
    }
    return {
      allowed: true,
      remaining: Math.max(0, limit - count2),
      resetAt
    };
  } catch (error) {
    console.warn("Redis rate limit check failed, allowing request:", error);
    return { allowed: true, remaining: limit, resetAt: 0 };
  }
}
var globalApiLimiter = async (req, res, next) => {
  if (isDevelopment) return next();
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const limit = 100;
  const windowSeconds = 60;
  const result = await checkRedisRateLimit(`global:${ip}`, limit, windowSeconds);
  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", result.remaining);
  res.setHeader("X-RateLimit-Reset", result.resetAt);
  if (!result.allowed) {
    return res.status(429).json({
      message: "\xC7ok fazla istek g\xF6nderdiniz. L\xFCtfen biraz bekleyin.",
      retryAfter: result.resetAt - Math.floor(Date.now() / 1e3)
    });
  }
  next();
};
var authIpLimiter = async (req, res, next) => {
  if (isDevelopment) return next();
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const result = await checkRedisRateLimit(`auth-ip:${ip}`, 120, 300);
  if (!result.allowed) {
    return res.status(429).json({
      message: "\xC7ok fazla istek g\xF6nderildi. L\xFCtfen biraz bekleyip tekrar deneyin.",
      retryAfter: result.resetAt - Math.floor(Date.now() / 1e3)
    });
  }
  next();
};
var LOGIN_FAIL_LIMIT = 12;
var LOGIN_FAIL_WINDOW_MS = 15 * 60 * 1e3;
async function recentFailedLogins(userId) {
  try {
    const pencereBasi = new Date(Date.now() - LOGIN_FAIL_WINDOW_MS);
    const [sonBasarili] = await db.select({ at: loginHistory.createdAt }).from(loginHistory).where(and6(eq7(loginHistory.userId, userId), eq7(loginHistory.success, true))).orderBy(desc5(loginHistory.createdAt)).limit(1);
    const baslangic = sonBasarili?.at && sonBasarili.at > pencereBasi ? sonBasarili.at : pencereBasi;
    const [satir] = await db.select({ n: count() }).from(loginHistory).where(
      and6(
        eq7(loginHistory.userId, userId),
        eq7(loginHistory.success, false),
        gte2(loginHistory.createdAt, baslangic)
      )
    );
    return Number(satir?.n ?? 0);
  } catch (error) {
    console.warn("Ba\u015Far\u0131s\u0131z giri\u015F say\u0131s\u0131 okunamad\u0131:", error);
    return 0;
  }
}
var pinAttemptLimiter = async (req, res, next) => {
  const userId = req.user?.claims?.sub;
  if (!userId) return next();
  const result = await checkRedisRateLimit(`admin-pin:${userId}`, 10, 900);
  if (!result.allowed) {
    return res.status(429).json({
      message: "\xC7ok fazla hatal\u0131 PIN denemesi. L\xFCtfen 15 dakika bekleyin.",
      retryAfter: result.resetAt - Math.floor(Date.now() / 1e3)
    });
  }
  next();
};
async function eylemHiziAsildi(tablo, kullaniciSutunu, zamanSutunu, userId, esik, windowMs) {
  try {
    const pencereBasi = new Date(Date.now() - windowMs);
    const [row] = await db.select({ n: count() }).from(tablo).where(and6(eq7(kullaniciSutunu, userId), gte2(zamanSutunu, pencereBasi)));
    return Number(row?.n ?? 0) >= esik;
  } catch (e) {
    console.error("eylemHiziAsildi hatas\u0131:", e);
    return false;
  }
}
function sanitizeUser(user) {
  if (!user) return user;
  const {
    password,
    verificationToken,
    verificationTokenExpiry,
    resetToken,
    resetTokenExpiry,
    ...safe
  } = user;
  return safe;
}
function publicUserFields(user) {
  if (!user) return null;
  const u = user;
  return {
    id: u.id,
    firstName: u.firstName ?? null,
    lastName: u.lastName ?? null,
    username: u.username ?? null,
    profileImageUrl: u.profileImageUrl ?? null,
    phone: u.phone ?? null,
    city: u.city ?? null,
    createdAt: u.createdAt ?? null
  };
}
var ILAN_GIZLI_ALANLARI = [
  "microchipNumber",
  "passportNumber",
  "earTagNumber",
  "turkvetNumber",
  "moderationReason",
  "moderatedBy",
  "moderatedAt"
];
function ilanGizliAlanlariAyikla(listing, sahibiMi) {
  if (sahibiMi || !listing) return listing;
  const kopya = { ...listing };
  for (const alan of ILAN_GIZLI_ALANLARI) delete kopya[alan];
  return kopya;
}
var SATICI_ILAN_ALANLARI = [
  "categoryId",
  "title",
  "description",
  "images",
  "breed",
  "age",
  "ageCategory",
  "gender",
  "healthStatus",
  "vaccinated",
  "neutered",
  "pedigree",
  "characterTraits",
  "videoUrls",
  "categoryAttributes",
  "deliveryInfo",
  "warrantyInfo",
  "allowOffers",
  "locationId",
  "city",
  "district",
  "storeId"
];
function ilanAlanlariniSuz(govde) {
  const temiz = {};
  for (const alan of SATICI_ILAN_ALANLARI) {
    if (govde?.[alan] !== void 0) temiz[alan] = govde[alan];
  }
  return temiz;
}
function getUserId3(user) {
  const id = user?.claims?.sub ?? user?.dbUserId ?? user?.id;
  if (!id) {
    throw new Error("User ID not found in session");
  }
  return id;
}
async function olayEpostasiGonder(userId, icerik, tercih = "notifyListingUpdates") {
  try {
    const [ayar] = await db.select({
      emailNotifications: userSettings.emailNotifications,
      notifyMessages: userSettings.notifyMessages,
      notifyListingUpdates: userSettings.notifyListingUpdates,
      notifyFavorites: userSettings.notifyFavorites
    }).from(userSettings).where(eq7(userSettings.userId, userId)).limit(1);
    if (ayar && (!ayar.emailNotifications || !ayar[tercih])) return;
    const [kullanici] = await db.select({ email: users.email, firstName: users.firstName }).from(users).where(eq7(users.id, userId)).limit(1);
    if (!kullanici?.email) return;
    await emailService.sendEventNotice({
      to: kullanici.email,
      recipientName: kullanici.firstName,
      ...icerik
    });
  } catch (error) {
    console.error("Olay e-postas\u0131 g\xF6nderilemedi:", error);
  }
}
async function isEmailVerified(user) {
  const [row] = await db.select({ emailVerified: users.emailVerified }).from(users).where(eq7(users.id, getUserId3(user))).limit(1);
  return !!row?.emailVerified;
}
function parseUserAgent(userAgent) {
  if (!userAgent) {
    return { deviceType: "unknown", browser: "unknown", os: "unknown" };
  }
  let deviceType = "desktop";
  if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
    deviceType = /ipad|tablet/i.test(userAgent) ? "tablet" : "mobile";
  }
  let browser = "unknown";
  if (/firefox/i.test(userAgent)) browser = "Firefox";
  else if (/edg/i.test(userAgent)) browser = "Edge";
  else if (/chrome/i.test(userAgent)) browser = "Chrome";
  else if (/safari/i.test(userAgent)) browser = "Safari";
  else if (/opera|opr/i.test(userAgent)) browser = "Opera";
  let os = "unknown";
  if (/windows/i.test(userAgent)) os = "Windows";
  else if (/mac os|macos/i.test(userAgent)) os = "macOS";
  else if (/linux/i.test(userAgent)) os = "Linux";
  else if (/android/i.test(userAgent)) os = "Android";
  else if (/iphone|ipad|ios/i.test(userAgent)) os = "iOS";
  return { deviceType, browser, os };
}
async function recordLoginHistory(userId, req, success, loginMethod, failureReason) {
  try {
    const userAgentStr = req.headers["user-agent"] || "";
    const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    await db.insert(loginHistory).values({
      id: crypto.randomUUID(),
      userId,
      loginMethod,
      ipAddress,
      userAgent: userAgentStr,
      location: null,
      success,
      failureReason: failureReason || null
    });
  } catch (error) {
    console.error("Error recording login history:", error);
  }
}
async function registerDevice(userId, req) {
  try {
    const userAgentStr = req.headers["user-agent"] || "";
    const { deviceType, browser, os } = parseUserAgent(userAgentStr);
    const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    const deviceName = `${browser} - ${os}`;
    const deviceId = crypto.randomUUID();
    const existingDevice = await db.query.userDevices.findFirst({
      where: and6(
        eq7(userDevices.userId, userId),
        eq7(userDevices.browser, browser),
        eq7(userDevices.os, os)
      )
    });
    if (existingDevice) {
      await db.update(userDevices).set({ lastActive: /* @__PURE__ */ new Date(), ipAddress }).where(eq7(userDevices.id, existingDevice.id));
    } else {
      await db.insert(userDevices).values({
        id: deviceId,
        userId,
        deviceName,
        deviceType,
        browser,
        os,
        ipAddress,
        location: null,
        lastActive: /* @__PURE__ */ new Date(),
        isTrusted: false
      });
    }
  } catch (error) {
    console.error("Error registering device:", error);
  }
}
async function registerRoutes(app2, existingServer) {
  app2.get("/readiness", readinessCheck);
  registerSitemapRoutes(app2);
  registerCronRoutes(app2);
  if (process.env.NODE_ENV === "production") {
    registerPrerenderRoutes(app2);
  }
  app2.get("/metrics", metricsEndpoint);
  await setupAuth(app2);
  app2.use("/api", globalApiLimiter);
  const httpServer = existingServer || createServer(app2);
  const isServerless2 = process.env.VERCEL === "1" || process.env.DISABLE_WEBSOCKET === "true";
  const wss = isServerless2 ? null : new WebSocketServer({
    server: httpServer,
    path: "/ws",
    maxPayload: 100 * 1024,
    // 100KB max message size
    perMessageDeflate: false
    // Disable compression for better performance
  });
  const clients = /* @__PURE__ */ new Map();
  const MAX_CONNECTIONS = 5e4;
  const HEARTBEAT_INTERVAL = 3e4;
  const CONNECTION_TIMEOUT = 3e5;
  const TYPING_TIMEOUT = 3e3;
  const heartbeats = /* @__PURE__ */ new Map();
  const typingUsers = /* @__PURE__ */ new Map();
  const generateConversationId = (userId1, userId2) => {
    return [userId1, userId2].sort().join("_");
  };
  const updateUserPresence = async (userId, isOnline, socketId) => {
    try {
      await db.insert(userPresence).values({
        userId,
        isOnline,
        lastSeenAt: /* @__PURE__ */ new Date(),
        lastActiveAt: /* @__PURE__ */ new Date(),
        socketId: socketId || null
      }).onConflictDoUpdate({
        target: userPresence.userId,
        set: {
          isOnline,
          lastSeenAt: /* @__PURE__ */ new Date(),
          lastActiveAt: /* @__PURE__ */ new Date(),
          socketId: socketId || null
        }
      });
    } catch (error) {
      console.error("Failed to update user presence:", error);
    }
  };
  const broadcastToUser = (userId, data) => {
    const client = clients.get(userId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  };
  notificationEmitter.on("notification", (event) => {
    broadcastToUser(event.userId, {
      type: "notification",
      notification: event.notification
    });
  });
  const getOrCreateConversation = async (participant1Id, participant2Id, listingId) => {
    const conversationId = generateConversationId(participant1Id, participant2Id);
    const [existing] = await db.select().from(conversations).where(eq7(conversations.id, conversationId)).limit(1);
    if (existing) {
      return existing;
    }
    const [p1, p2] = [participant1Id, participant2Id].sort();
    const [newConversation] = await db.insert(conversations).values({
      id: conversationId,
      participant1Id: p1,
      participant2Id: p2,
      listingId: listingId || null,
      participant1Archived: false,
      participant2Archived: false,
      participant1Pinned: false,
      participant2Pinned: false,
      participant1Muted: false,
      participant2Muted: false
    }).returning();
    return newConversation;
  };
  wss?.on("connection", async (ws, req) => {
    if (clients.size >= MAX_CONNECTIONS) {
      ws.close(1008, "Server at capacity");
      return;
    }
    let userId = null;
    try {
      const sessionMiddleware2 = getSession();
      await new Promise((resolve, reject) => {
        sessionMiddleware2(req, {}, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      await new Promise((resolve, reject) => {
        passport2.initialize()(req, {}, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      await new Promise((resolve, reject) => {
        passport2.session()(req, {}, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      const user = req.user;
      if (req.isAuthenticated && req.isAuthenticated() && user?.claims?.sub) {
        userId = user.claims.sub;
      }
    } catch {
    }
    if (!userId) {
      const authTimeout = setTimeout(() => {
        ws.close(1008, "Authentication timeout");
      }, 1e4);
      ws.once("message", async (data) => {
        clearTimeout(authTimeout);
        try {
          const message = JSON.parse(data.toString());
          if (message.type === "auth" && message.userId) {
            const [dbUser2] = await db.select().from(users).where(eq7(users.id, message.userId)).limit(1);
            if (dbUser2) {
              setupAuthenticatedConnection(ws, message.userId, dbUser2);
              ws.send(JSON.stringify({ type: "auth_success" }));
            } else {
              ws.close(1008, "Invalid user");
            }
          } else {
            ws.close(1008, "Authentication required");
          }
        } catch {
          ws.close(1008, "Invalid auth message");
        }
      });
      return;
    }
    const [dbUser] = await db.select().from(users).where(eq7(users.id, userId)).limit(1);
    if (dbUser) {
      setupAuthenticatedConnection(ws, userId, dbUser);
    } else {
      ws.close(1008, "User not found");
    }
  });
  async function setupAuthenticatedConnection(ws, userId, user) {
    const existingClient = clients.get(userId);
    if (existingClient && existingClient.ws.readyState === WebSocket.OPEN) {
      existingClient.ws.close(1e3, "New connection established");
    }
    const clientInfo = {
      ws,
      userId
    };
    clients.set(userId, clientInfo);
    await updateUserPresence(userId, true, `ws_${Date.now()}`);
    const userConversations = await db.select().from(conversations).where(
      or3(
        eq7(conversations.participant1Id, userId),
        eq7(conversations.participant2Id, userId)
      )
    );
    for (const conv of userConversations) {
      const partnerId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
      broadcastToUser(partnerId, {
        type: "presence",
        userId,
        isOnline: true,
        lastSeenAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(heartbeat);
        heartbeats.delete(userId);
      }
    }, HEARTBEAT_INTERVAL);
    heartbeats.set(userId, heartbeat);
    let idleTimeout = setTimeout(() => {
      ws.close(1e3, "Connection idle timeout");
    }, CONNECTION_TIMEOUT);
    const resetTimeout = () => {
      clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        ws.close(1e3, "Connection idle timeout");
      }, CONNECTION_TIMEOUT);
    };
    ws.on("message", async (data) => {
      resetTimeout();
      try {
        if (data.toString().length > 1e4) {
          ws.send(JSON.stringify({ type: "error", message: "Message too large" }));
          return;
        }
        const message = JSON.parse(data.toString());
        if (message.type === "subscribe") {
          if (message.auctionId) {
            clientInfo.auctionId = message.auctionId;
            ws.send(JSON.stringify({ type: "subscribed", auctionId: message.auctionId }));
          } else if (message.streamId) {
            clientInfo.streamId = message.streamId;
            ws.send(JSON.stringify({ type: "subscribed", streamId: message.streamId }));
          } else if (message.conversationId) {
            clientInfo.currentConversationId = message.conversationId;
            ws.send(JSON.stringify({ type: "subscribed", conversationId: message.conversationId }));
          }
        } else if (message.type === "typing_start") {
          const receiverId = message.receiverId;
          const conversationId = generateConversationId(userId, receiverId);
          const existingTimeout = typingUsers.get(`${userId}_${conversationId}`);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }
          broadcastToUser(receiverId, {
            type: "typing",
            userId,
            conversationId,
            isTyping: true
          });
          const timeout = setTimeout(() => {
            broadcastToUser(receiverId, {
              type: "typing",
              userId,
              conversationId,
              isTyping: false
            });
            typingUsers.delete(`${userId}_${conversationId}`);
          }, TYPING_TIMEOUT);
          typingUsers.set(`${userId}_${conversationId}`, timeout);
        } else if (message.type === "typing_stop") {
          const receiverId = message.receiverId;
          const conversationId = generateConversationId(userId, receiverId);
          const existingTimeout = typingUsers.get(`${userId}_${conversationId}`);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            typingUsers.delete(`${userId}_${conversationId}`);
          }
          broadcastToUser(receiverId, {
            type: "typing",
            userId,
            conversationId,
            isTyping: false
          });
        } else if (message.type === "mark_read") {
          const conversationId = message.conversationId;
          const messageIds = message.messageIds;
          if (messageIds && messageIds.length > 0) {
            await db.update(messages).set({
              status: "read",
              readAt: /* @__PURE__ */ new Date()
            }).where(
              and6(
                inArray4(messages.id, messageIds),
                eq7(messages.receiverId, userId)
              )
            );
            for (const msgId of messageIds) {
              const [msg] = await db.select().from(messages).where(eq7(messages.id, msgId)).limit(1);
              if (msg) {
                broadcastToUser(msg.senderId, {
                  type: "message_read",
                  messageId: msgId,
                  conversationId,
                  readAt: (/* @__PURE__ */ new Date()).toISOString()
                });
              }
            }
          }
          const [conv] = await db.select().from(conversations).where(eq7(conversations.id, conversationId)).limit(1);
          if (conv) {
            const updateData = conv.participant1Id === userId ? { participant1UnreadCount: 0, participant1LastReadAt: /* @__PURE__ */ new Date() } : { participant2UnreadCount: 0, participant2LastReadAt: /* @__PURE__ */ new Date() };
            await db.update(conversations).set(updateData).where(eq7(conversations.id, conversationId));
          }
          ws.send(JSON.stringify({ type: "marked_read", conversationId }));
        } else if (message.type === "chat") {
          const conversation = await getOrCreateConversation(
            userId,
            message.receiverId,
            message.listingId
          );
          const [newMessage] = await db.insert(messages).values({
            senderId: userId,
            receiverId: message.receiverId,
            conversationId: conversation.id,
            listingId: message.listingId || null,
            content: message.content,
            messageType: message.messageType || "text",
            replyToId: message.replyToId || null,
            attachments: message.attachments || []
          }).returning();
          const isParticipant1Receiver = conversation.participant1Id === message.receiverId;
          await db.update(conversations).set({
            lastMessageId: newMessage.id,
            lastMessageAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date(),
            ...isParticipant1Receiver ? { participant1UnreadCount: sql6`${conversations.participant1UnreadCount} + 1` } : { participant2UnreadCount: sql6`${conversations.participant2UnreadCount} + 1` }
          }).where(eq7(conversations.id, conversation.id));
          const receiverOnline = broadcastToUser(message.receiverId, {
            type: "chat",
            message: {
              ...newMessage,
              sender: {
                id: userId,
                firstName: user.firstName,
                lastName: user.lastName,
                profileImageUrl: user.profileImageUrl
              }
            },
            conversationId: conversation.id
          });
          if (receiverOnline) {
            await db.update(messages).set({
              status: "delivered",
              deliveredAt: /* @__PURE__ */ new Date()
            }).where(eq7(messages.id, newMessage.id));
            ws.send(JSON.stringify({
              type: "message_delivered",
              messageId: newMessage.id,
              conversationId: conversation.id,
              deliveredAt: (/* @__PURE__ */ new Date()).toISOString()
            }));
          }
          ws.send(JSON.stringify({
            type: "chat_sent",
            message: newMessage,
            conversationId: conversation.id
          }));
          const existingTimeout = typingUsers.get(`${userId}_${conversation.id}`);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            typingUsers.delete(`${userId}_${conversation.id}`);
          }
          broadcastToUser(message.receiverId, {
            type: "typing",
            userId,
            conversationId: conversation.id,
            isTyping: false
          });
          try {
            const senderName = user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.username || "Birisi";
            const [notification] = await db.insert(notifications).values({
              userId: message.receiverId,
              type: "new_message",
              title: "Yeni Mesaj",
              message: `${senderName}: ${message.content?.substring(0, 100)}${message.content?.length > 100 ? "..." : ""}`,
              link: `/mesajlar`,
              relatedId: conversation.id
            }).returning();
            broadcastToUser(message.receiverId, {
              type: "notification",
              notification: {
                ...notification,
                senderName,
                senderProfileImage: user.profileImageUrl
              }
            });
          } catch (notifError) {
            console.error("Failed to create message notification:", notifError);
          }
        } else if (message.type === "delete_message") {
          const messageId = message.messageId;
          const [msg] = await db.select().from(messages).where(and6(eq7(messages.id, messageId), eq7(messages.senderId, userId))).limit(1);
          if (msg) {
            await db.update(messages).set({
              isDeleted: true,
              deletedAt: /* @__PURE__ */ new Date(),
              content: "Bu mesaj silindi"
            }).where(eq7(messages.id, messageId));
            broadcastToUser(msg.receiverId, {
              type: "message_deleted",
              messageId,
              conversationId: msg.conversationId
            });
            ws.send(JSON.stringify({
              type: "message_deleted",
              messageId,
              conversationId: msg.conversationId
            }));
          }
        } else if (message.type === "edit_message") {
          const messageId = message.messageId;
          const newContent = message.content;
          const [msg] = await db.select().from(messages).where(and6(eq7(messages.id, messageId), eq7(messages.senderId, userId))).limit(1);
          if (msg && !msg.isDeleted) {
            await db.update(messages).set({
              content: newContent,
              isEdited: true,
              editedAt: /* @__PURE__ */ new Date()
            }).where(eq7(messages.id, messageId));
            broadcastToUser(msg.receiverId, {
              type: "message_edited",
              messageId,
              conversationId: msg.conversationId,
              newContent,
              editedAt: (/* @__PURE__ */ new Date()).toISOString()
            });
            ws.send(JSON.stringify({
              type: "message_edited",
              messageId,
              conversationId: msg.conversationId,
              newContent,
              editedAt: (/* @__PURE__ */ new Date()).toISOString()
            }));
          }
        } else if (message.type === "get_presence") {
          const targetUserId = message.userId;
          const [presence] = await db.select().from(userPresence).where(eq7(userPresence.userId, targetUserId)).limit(1);
          ws.send(JSON.stringify({
            type: "presence",
            userId: targetUserId,
            isOnline: presence?.isOnline || false,
            lastSeenAt: presence?.lastSeenAt?.toISOString() || null
          }));
        } else if (message.type === "bid") {
          const [auction] = await db.select().from(auctions).where(eq7(auctions.id, message.auctionId)).limit(1);
          if (!auction) {
            ws.send(JSON.stringify({ type: "error", message: "Auction not found" }));
            return;
          }
          const bidAmount = parseFloat(message.amount);
          const currentPrice = parseFloat(auction.currentPrice);
          const minIncrement = parseFloat(auction.minIncrement);
          if (bidAmount < currentPrice + minIncrement) {
            ws.send(JSON.stringify({
              type: "error",
              message: `Minimum bid is \u20BA${(currentPrice + minIncrement).toFixed(2)}`
            }));
            return;
          }
          const [bid] = await db.insert(bids).values({
            auctionId: message.auctionId,
            bidderId: userId,
            amount: message.amount
          }).returning();
          for (const clientInfo2 of Array.from(clients.values())) {
            if (clientInfo2.ws.readyState === WebSocket.OPEN && clientInfo2.auctionId === message.auctionId) {
              clientInfo2.ws.send(JSON.stringify({
                type: "new_bid",
                bid: {
                  id: bid.id,
                  auctionId: bid.auctionId,
                  bidderId: bid.bidderId,
                  amount: bid.amount,
                  createdAt: bid.createdAt
                },
                auctionId: message.auctionId
              }));
            }
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    ws.on("pong", () => {
      resetTimeout();
    });
    ws.on("close", async () => {
      clients.delete(userId);
      clearInterval(heartbeat);
      heartbeats.delete(userId);
      clearTimeout(idleTimeout);
      await updateUserPresence(userId, false);
      const userConvs = await db.select().from(conversations).where(
        or3(
          eq7(conversations.participant1Id, userId),
          eq7(conversations.participant2Id, userId)
        )
      );
      for (const conv of userConvs) {
        const partnerId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
        broadcastToUser(partnerId, {
          type: "presence",
          userId,
          isOnline: false,
          lastSeenAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      for (const [key, timeout] of Array.from(typingUsers.entries())) {
        if (key.startsWith(`${userId}_`)) {
          clearTimeout(timeout);
          typingUsers.delete(key);
        }
      }
    });
    ws.on("error", (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
      ws.close(1011, "Internal error");
    });
  }
  app2.post("/api/auth/register", authIpLimiter, botGuard, async (req, res) => {
    try {
      const { email, phone, password, firstName, lastName } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "E-posta ve \u015Fifre gereklidir" });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: "\u015Eifre en az 8 karakter olmal\u0131d\u0131r" });
      }
      const normalizedPhone = phone ? String(phone).startsWith("+90") ? String(phone) : String(phone).replace(/^0/, "+90") : null;
      const existingEmailUser = await db.query.users.findFirst({
        where: eq7(users.email, email)
      });
      if (existingEmailUser) {
        return res.status(400).json({ message: "Bu email adresi zaten kay\u0131tl\u0131" });
      }
      if (normalizedPhone) {
        const existingPhoneUser = await db.query.users.findFirst({
          where: eq7(users.phone, normalizedPhone)
        });
        if (existingPhoneUser) {
          return res.status(400).json({ message: "Bu telefon numaras\u0131 zaten kay\u0131tl\u0131" });
        }
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = generateVerificationToken();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      const autoVerify = shouldAutoVerifyEmail();
      const [newUser] = await db.insert(users).values({
        email,
        phone: normalizedPhone,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        emailVerified: autoVerify,
        verificationToken: autoVerify ? null : verificationToken,
        verificationTokenExpiry: autoVerify ? null : verificationTokenExpiry
      }).returning();
      if (!autoVerify) {
        try {
          await emailService.sendVerificationEmail(
            email,
            verificationToken,
            firstName || email.split("@")[0]
          );
        } catch (mailError) {
          console.error("Do\u011Frulama e-postas\u0131 g\xF6nderilemedi:", mailError);
        }
      }
      res.status(201).json({
        message: autoVerify ? "Kay\u0131t ba\u015Far\u0131l\u0131! Giri\u015F yapabilirsiniz." : "Kay\u0131t ba\u015Far\u0131l\u0131! E-posta adresinize do\u011Frulama ba\u011Flant\u0131s\u0131 g\xF6nderdik.",
        userId: newUser.id,
        requiresEmailVerification: !autoVerify
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Kay\u0131t s\u0131ras\u0131nda bir hata olu\u015Ftu" });
    }
  });
  app2.post("/api/auth/login", authIpLimiter, async (req, res) => {
    try {
      const { identifier, emailOrUsername, password } = req.body;
      const loginIdentifier = identifier || emailOrUsername;
      if (!loginIdentifier || !password) {
        return res.status(400).json({ message: "Email/telefon ve \u015Fifre gereklidir" });
      }
      let normalizedIdentifier = loginIdentifier;
      const isPhone = /^[\d\s\+\-\(\)]+$/.test(loginIdentifier.replace(/\s/g, "")) && loginIdentifier.replace(/\D/g, "").length >= 10;
      if (isPhone) {
        const digits = loginIdentifier.replace(/\D/g, "");
        normalizedIdentifier = digits.startsWith("90") ? `+${digits}` : `+90${digits.replace(/^0/, "")}`;
      }
      const user = await db.query.users.findFirst({
        where: or3(
          eq7(users.email, loginIdentifier),
          eq7(users.phone, normalizedIdentifier),
          eq7(users.username, loginIdentifier)
        )
      });
      if (!user || !user.password) {
        return res.status(401).json({ message: "Hatal\u0131 email/kullan\u0131c\u0131 ad\u0131 veya \u015Fifre" });
      }
      if (await recentFailedLogins(user.id) >= LOGIN_FAIL_LIMIT) {
        return res.status(429).json({
          message: "Bu hesap i\xE7in \xE7ok fazla hatal\u0131 giri\u015F denendi. L\xFCtfen 15 dakika sonra tekrar deneyin veya \u015Fifrenizi s\u0131f\u0131rlay\u0131n."
        });
      }
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        await recordLoginHistory(user.id, req, false, isPhone ? "phone" : "email", "Hatal\u0131 \u015Fifre");
        return res.status(401).json({ message: "Hatal\u0131 email/kullan\u0131c\u0131 ad\u0131 veya \u015Fifre" });
      }
      if (user.status === "banned" || user.status === "suspended") {
        await recordLoginHistory(
          user.id,
          req,
          false,
          isPhone ? "phone" : "email",
          `Hesap durumu: ${user.status}`
        );
        return res.status(403).json({
          message: user.status === "banned" ? "Hesab\u0131n\u0131z ask\u0131ya al\u0131nm\u0131\u015Ft\u0131r. \u0130tiraz i\xE7in destek ile ileti\u015Fime ge\xE7in." : "Hesab\u0131n\u0131z ge\xE7ici olarak durdurulmu\u015Ftur. Destek ile ileti\u015Fime ge\xE7in.",
          status: user.status,
          reason: user.statusReason || void 0
        });
      }
      req.login({ claims: { sub: user.id }, role: user.role }, async (err) => {
        if (err) {
          console.error("Session creation error:", err);
          await recordLoginHistory(user.id, req, false, isPhone ? "phone" : "email", "Oturum olu\u015Fturulamad\u0131");
          return res.status(500).json({ message: "Giri\u015F s\u0131ras\u0131nda bir hata olu\u015Ftu" });
        }
        await recordLoginHistory(user.id, req, true, isPhone ? "phone" : "email");
        await registerDevice(user.id, req);
        res.json({
          message: "Giri\u015F ba\u015Far\u0131l\u0131!",
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            emailVerified: user.emailVerified
          }
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Giri\u015F s\u0131ras\u0131nda bir hata olu\u015Ftu" });
    }
  });
  app2.post("/api/auth/forgot-password", createLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email gereklidir" });
      }
      const user = await db.query.users.findFirst({
        where: eq7(users.email, email)
      });
      if (!user) {
        return res.json({ message: "E\u011Fer bu email kay\u0131tl\u0131ysa, \u015Fifre s\u0131f\u0131rlama linki g\xF6nderildi" });
      }
      const resetToken = generateVerificationToken();
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      await db.update(users).set({ resetToken, resetTokenExpiry }).where(eq7(users.id, user.id));
      await emailService.sendPasswordResetEmail(
        email,
        resetToken,
        user.username || user.firstName || email.split("@")[0]
      );
      res.json({ message: "E\u011Fer bu email kay\u0131tl\u0131ysa, \u015Fifre s\u0131f\u0131rlama linki g\xF6nderildi" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Bir hata olu\u015Ftu. L\xFCtfen tekrar deneyin." });
    }
  });
  app2.post("/api/auth/reset-password", createLimiter, async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token ve yeni \u015Fifre gereklidir" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "\u015Eifre en az 8 karakter olmal\u0131d\u0131r" });
      }
      const user = await db.query.users.findFirst({
        where: and6(
          eq7(users.resetToken, token),
          gte2(users.resetTokenExpiry, /* @__PURE__ */ new Date())
        )
      });
      if (!user) {
        return res.status(400).json({ message: "Ge\xE7ersiz veya s\xFCresi dolmu\u015F token" });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.update(users).set({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }).where(eq7(users.id, user.id));
      res.json({ message: "\u015Eifreniz ba\u015Far\u0131yla g\xFCncellendi" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Bir hata olu\u015Ftu. L\xFCtfen tekrar deneyin." });
    }
  });
  app2.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Ge\xE7ersiz do\u011Frulama linki" });
      }
      const user = await db.query.users.findFirst({
        where: and6(
          eq7(users.verificationToken, token),
          gte2(users.verificationTokenExpiry, /* @__PURE__ */ new Date())
        )
      });
      if (!user) {
        return res.status(400).json({ message: "Ge\xE7ersiz veya s\xFCresi dolmu\u015F do\u011Frulama linki" });
      }
      await db.update(users).set({
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null
      }).where(eq7(users.id, user.id));
      res.json({ message: "Email adresiniz ba\u015Far\u0131yla do\u011Fruland\u0131!" });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Bir hata olu\u015Ftu. L\xFCtfen tekrar deneyin." });
    }
  });
  app2.post("/api/auth/resend-verification", isAuthenticated, createLimiter, async (req, res) => {
    try {
      const user = req.user;
      const userId = getUserId3(user);
      const currentUser = await db.query.users.findFirst({
        where: eq7(users.id, userId)
      });
      if (!currentUser) {
        return res.status(404).json({ message: "Kullan\u0131c\u0131 bulunamad\u0131" });
      }
      if (currentUser.emailVerified) {
        return res.status(400).json({ message: "E-posta adresiniz zaten do\u011Frulanm\u0131\u015F" });
      }
      if (!currentUser.email) {
        return res.status(400).json({ message: "Hesab\u0131n\u0131zda e-posta adresi bulunamad\u0131" });
      }
      if (currentUser.verificationTokenExpiry) {
        const expiryTime = new Date(currentUser.verificationTokenExpiry);
        const createdTime = new Date(expiryTime.getTime() - 24 * 60 * 60 * 1e3);
        const timeSinceCreation = Date.now() - createdTime.getTime();
        const oneMinute = 60 * 1e3;
        if (timeSinceCreation < oneMinute) {
          return res.status(429).json({
            message: "L\xFCtfen 1 dakika bekleyip tekrar deneyin",
            retryAfter: Math.ceil((oneMinute - timeSinceCreation) / 1e3)
          });
        }
      }
      const verificationToken = generateVerificationToken();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1e3);
      await db.update(users).set({
        verificationToken,
        verificationTokenExpiry
      }).where(eq7(users.id, userId));
      if (shouldAutoVerifyEmail()) {
        await db.update(users).set({
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null
        }).where(eq7(users.id, userId));
        return res.json({
          message: "Geli\u015Ftirme modunda: E-posta otomatik do\u011Fruland\u0131",
          autoVerified: true
        });
      }
      await emailService.sendVerificationEmail(
        currentUser.email,
        verificationToken,
        currentUser.firstName || currentUser.email.split("@")[0]
      );
      res.json({
        message: "Do\u011Frulama e-postas\u0131 g\xF6nderildi. L\xFCtfen gelen kutunuzu kontrol edin.",
        emailSent: true
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "E-posta g\xF6nderilirken bir hata olu\u015Ftu" });
    }
  });
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      let user;
      if (req.user.dbUserId) {
        user = await storage.getUser(req.user.dbUserId);
      }
      if (!user && req.user.claims?.sub) {
        user = await storage.getUser(req.user.claims.sub);
      }
      if (!user && req.user.claims?.email) {
        user = await storage.getUserByEmail(req.user.claims.email);
      }
      if (!user && req.user.id) {
        user = await storage.getUser(req.user.id);
      }
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      res.json(sanitizeUser(user));
    } catch {
      res.status(401).json({ message: "Unauthorized" });
    }
  });
  app2.patch("/api/auth/profile", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      if (!userId) {
        return res.status(401).json({ message: "Kullan\u0131c\u0131 bulunamad\u0131" });
      }
      const { firstName, lastName, phone, city, district, bio, profileImageUrl } = req.body;
      if (phone && !/^[0-9+\-\s()]{10,20}$/.test(phone)) {
        return res.status(400).json({ message: "Ge\xE7ersiz telefon numaras\u0131 format\u0131" });
      }
      const [updatedUser] = await db.update(users).set({
        firstName: firstName || void 0,
        lastName: lastName || void 0,
        phone: phone || void 0,
        city: city || void 0,
        district: district || void 0,
        bio: bio || void 0,
        profileImageUrl: profileImageUrl || void 0
      }).where(eq7(users.id, userId)).returning();
      if (!updatedUser) {
        return res.status(404).json({ message: "Kullan\u0131c\u0131 bulunamad\u0131" });
      }
      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Profil g\xFCncellenirken bir hata olu\u015Ftu" });
    }
  });
  app2.post("/api/auth/change-password", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      if (!userId) {
        return res.status(401).json({ message: "Kullan\u0131c\u0131 bulunamad\u0131" });
      }
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Mevcut ve yeni \u015Fifre gereklidir" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Yeni \u015Fifre en az 8 karakter olmal\u0131d\u0131r" });
      }
      const [existingUser] = await db.select().from(users).where(eq7(users.id, userId)).limit(1);
      if (!existingUser || !existingUser.password) {
        return res.status(400).json({ message: "Bu hesap i\xE7in \u015Fifre de\u011Fi\u015Ftirilemez" });
      }
      const isValidPassword = await bcrypt.compare(currentPassword, existingUser.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Mevcut \u015Fifre hatal\u0131" });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.update(users).set({ password: hashedPassword }).where(eq7(users.id, userId));
      res.json({ message: "\u015Eifreniz ba\u015Far\u0131yla g\xFCncellendi" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "\u015Eifre de\u011Fi\u015Ftirilirken bir hata olu\u015Ftu" });
    }
  });
  app2.get("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const userId = getUserId3(user);
      const [existingSettings] = await db.select().from(userSettings).where(eq7(userSettings.userId, userId)).limit(1);
      if (existingSettings) {
        return res.json(existingSettings);
      }
      res.json({
        userId,
        emailNotifications: true,
        pushNotifications: true,
        notifyMessages: true,
        notifyFavorites: true,
        notifyPriceDrops: true,
        notifyListingUpdates: true,
        notifyPromotions: false,
        notifyNewsletter: false,
        showEmail: false,
        showPhone: true,
        showLocation: true,
        showOnlineStatus: true,
        allowMessages: true,
        profileVisibility: "public",
        defaultCity: null,
        defaultDistrict: null,
        defaultCategoryId: null,
        autoRenewListings: false,
        theme: "system",
        language: "tr",
        currency: "TRY"
      });
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ message: "Ayarlar y\xFCklenirken bir hata olu\u015Ftu" });
    }
  });
  app2.patch("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const userId = getUserId3(user);
      const AYAR_ALANLARI = [
        "emailNotifications",
        "pushNotifications",
        "notifyMessages",
        "notifyFavorites",
        "notifyPriceDrops",
        "notifyListingUpdates",
        "notifyPromotions",
        "notifyNewsletter",
        "showEmail",
        "showPhone",
        "showLocation",
        "showOnlineStatus",
        "allowMessages",
        "profileVisibility",
        "defaultCity",
        "defaultDistrict",
        "defaultCategoryId",
        "autoRenewListings",
        "theme",
        "language",
        "currency"
      ];
      const settingsData = {};
      for (const alan of AYAR_ALANLARI) {
        if (req.body?.[alan] !== void 0) settingsData[alan] = req.body[alan];
      }
      const [existingSettings] = await db.select().from(userSettings).where(eq7(userSettings.userId, userId)).limit(1);
      let updatedSettings;
      if (existingSettings) {
        [updatedSettings] = await db.update(userSettings).set({
          ...settingsData,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq7(userSettings.userId, userId)).returning();
      } else {
        [updatedSettings] = await db.insert(userSettings).values({
          ...settingsData,
          userId
        }).returning();
      }
      res.json(updatedSettings);
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ message: "Ayarlar g\xFCncellenirken bir hata olu\u015Ftu" });
    }
  });
  app2.get("/api/settings/devices", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const userId = getUserId3(user);
      const devices = await db.select().from(userDevices).where(eq7(userDevices.userId, userId)).orderBy(desc5(userDevices.lastActive));
      res.json(devices);
    } catch (error) {
      console.error("Get devices error:", error);
      res.status(500).json({ message: "Cihazlar y\xFCklenirken bir hata olu\u015Ftu" });
    }
  });
  app2.delete("/api/settings/devices/:deviceId", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const userId = getUserId3(user);
      const { deviceId } = req.params;
      await db.delete(userDevices).where(and6(
        eq7(userDevices.id, deviceId),
        eq7(userDevices.userId, userId)
      ));
      res.json({ message: "Cihaz kald\u0131r\u0131ld\u0131" });
    } catch (error) {
      console.error("Remove device error:", error);
      res.status(500).json({ message: "Cihaz kald\u0131r\u0131l\u0131rken bir hata olu\u015Ftu" });
    }
  });
  app2.get("/api/settings/login-history", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const userId = getUserId3(user);
      const history = await db.select().from(loginHistory).where(eq7(loginHistory.userId, userId)).orderBy(desc5(loginHistory.createdAt)).limit(50);
      res.json(history);
    } catch (error) {
      console.error("Get login history error:", error);
      res.status(500).json({ message: "Giri\u015F ge\xE7mi\u015Fi y\xFCklenirken bir hata olu\u015Ftu" });
    }
  });
  app2.post("/api/settings/delete-account", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const userId = getUserId3(user);
      const { confirmation, password } = req.body;
      if (confirmation !== "DELETE") {
        return res.status(400).json({ message: "Hesap silme onay\u0131 gereklidir" });
      }
      const [existingUser] = await db.select().from(users).where(eq7(users.id, userId)).limit(1);
      if (existingUser?.password) {
        if (!password) {
          return res.status(400).json({ message: "Hesab\u0131n\u0131z\u0131 silmek i\xE7in \u015Fifrenizi girin" });
        }
        const isValidPassword = await bcrypt.compare(password, existingUser.password);
        if (!isValidPassword) {
          return res.status(401).json({ message: "\u015Eifre hatal\u0131" });
        }
      }
      const objectStorage2 = new ObjectStorageService();
      const userListings = await db.select().from(listings).where(eq7(listings.sellerId, userId));
      for (const listing of userListings) {
        const listingImgs = await db.select().from(listingImages).where(eq7(listingImages.listingId, listing.id));
        for (const img of listingImgs) {
          const pathsToDelete = [
            img.originalKey,
            img.thumbnailKey,
            img.mediumKey,
            img.largeKey
          ].filter(Boolean);
          await objectStorage2.deleteMultipleFiles(pathsToDelete);
        }
        if (listing.images && Array.isArray(listing.images)) {
          await objectStorage2.deleteMultipleFiles(listing.images);
        }
      }
      if (existingUser?.profileImageUrl) {
        await objectStorage2.deleteFile(existingUser.profileImageUrl);
      }
      const [userStore] = await db.select().from(stores).where(eq7(stores.ownerId, userId)).limit(1);
      if (userStore) {
        if (userStore.logo) {
          await objectStorage2.deleteFile(userStore.logo);
        }
        if (userStore.banner) {
          await objectStorage2.deleteFile(userStore.banner);
        }
        const storeMediaItems = await db.select().from(storeMedia).where(eq7(storeMedia.storeId, userStore.id));
        for (const media of storeMediaItems) {
          if (media.url) {
            await objectStorage2.deleteFile(media.url);
          }
        }
      }
      const userMessages = await db.select().from(messages).where(eq7(messages.senderId, userId));
      for (const msg of userMessages) {
        if (msg.attachments && Array.isArray(msg.attachments)) {
          for (const attachment of msg.attachments) {
            if (attachment && typeof attachment === "object" && "url" in attachment) {
              await objectStorage2.deleteFile(attachment.url);
            }
          }
        }
      }
      await db.delete(users).where(eq7(users.id, userId));
      req.logout((err) => {
        if (err) {
          console.error("Logout error:", err);
        }
      });
      res.json({ message: "Hesab\u0131n\u0131z ve t\xFCm verileriniz silindi" });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ message: "Hesap silinirken bir hata olu\u015Ftu" });
    }
  });
  app2.get("/api/settings/export-data", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const userId = getUserId3(user);
      const [userData] = await db.select().from(users).where(eq7(users.id, userId)).limit(1);
      const userListings = await db.select().from(listings).where(eq7(listings.sellerId, userId));
      const userFavorites = await db.select().from(favorites).where(eq7(favorites.userId, userId));
      const userMessages = await db.select().from(messages).where(
        or3(eq7(messages.senderId, userId), eq7(messages.receiverId, userId))
      );
      const userSettings_ = await db.select().from(userSettings).where(eq7(userSettings.userId, userId));
      if (userData) {
        delete userData.password;
        delete userData.verificationToken;
        delete userData.resetToken;
      }
      const exportData = {
        user: userData,
        listings: userListings,
        favorites: userFavorites,
        messages: userMessages,
        settings: userSettings_,
        exportedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="user-data-${userId}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error("Export data error:", error);
      res.status(500).json({ message: "Veri d\u0131\u015Fa aktar\u0131l\u0131rken bir hata olu\u015Ftu" });
    }
  });
  app2.get("/api/categories/main", async (_req, res) => {
    try {
      const mainCategories = await db.select().from(categories).where(eq7(categories.depth, 0)).orderBy(categories.order);
      res.json(mainCategories);
    } catch (error) {
      console.error("Error fetching main categories:", error);
      res.status(500).json({ message: "Failed to fetch main categories" });
    }
  });
  app2.get("/api/categories/stats", async (_req, res) => {
    try {
      const stats = await db.select({
        categoryId: listings.categoryId,
        count: count()
      }).from(listings).where(eq7(listings.status, "active")).groupBy(listings.categoryId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching category stats:", error);
      res.status(500).json({ message: "Failed to fetch category stats" });
    }
  });
  app2.get("/api/categories", async (_req, res) => {
    try {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      const cacheKey = cacheKeys.categories();
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      const allCategories = await db.select().from(categories).orderBy(categories.order);
      await cache.set(cacheKey, allCategories, cacheTTL.categories);
      res.json(allCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  app2.get("/api/categories/tree", async (_req, res) => {
    try {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      const cacheKey = cacheKeys.categoryTree();
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      const allCategories = await db.select().from(categories).orderBy(categories.order);
      const categoryMap = /* @__PURE__ */ new Map();
      const rootCategories = [];
      allCategories.forEach((cat) => {
        categoryMap.set(cat.id, { ...cat, children: [] });
      });
      allCategories.forEach((cat) => {
        const categoryNode = categoryMap.get(cat.id);
        if (cat.parentId === null) {
          rootCategories.push(categoryNode);
        } else {
          const parent = categoryMap.get(cat.parentId);
          if (parent) {
            parent.children.push(categoryNode);
          }
        }
      });
      await cache.set(cacheKey, rootCategories, cacheTTL.categories);
      res.json(rootCategories);
    } catch (error) {
      console.error("Failed to fetch category tree:", error);
      res.status(500).json({ message: "Failed to fetch category tree" });
    }
  });
  app2.get("/api/categories/:slug", async (req, res) => {
    try {
      const [category] = await db.select().from(categories).where(eq7(categories.slug, req.params.slug)).limit(1);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      const childCategories = await db.select().from(categories).where(eq7(categories.parentId, category.id)).orderBy(categories.order);
      const categoryWithChildren = {
        ...category,
        children: await Promise.all(
          childCategories.map(async (child) => {
            const grandchildren = await db.select().from(categories).where(eq7(categories.parentId, child.id)).orderBy(categories.order);
            return {
              ...child,
              children: grandchildren
            };
          })
        )
      };
      res.json(categoryWithChildren);
    } catch (error) {
      console.error("Failed to fetch category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });
  app2.get("/api/categories/:slug/restrictions", async (req, res) => {
    try {
      const { slug } = req.params;
      const kisitlamalar = await db.select().from(restrictedCategories).where(and6(
        eq7(restrictedCategories.categorySlug, slug),
        eq7(restrictedCategories.isActive, true)
      ));
      const [kategori] = await db.select({ path: categories.path }).from(categories).where(eq7(categories.slug, slug)).limit(1);
      const atalar = Array.isArray(kategori?.path) ? kategori.path : [];
      let devralinan = [];
      if (atalar.length > 0) {
        const atalarinSluglari = await db.select({ slug: categories.slug }).from(categories).where(inArray4(categories.id, atalar));
        if (atalarinSluglari.length > 0) {
          devralinan = await db.select().from(restrictedCategories).where(and6(
            inArray4(restrictedCategories.categorySlug, atalarinSluglari.map((a) => a.slug)),
            eq7(restrictedCategories.isActive, true)
          ));
        }
      }
      res.json({ restrictions: [...kisitlamalar, ...devralinan], categorySlug: slug });
    } catch (error) {
      console.error("Kategori k\u0131s\u0131tlamalar\u0131 al\u0131namad\u0131:", error);
      res.status(500).json({ message: "Kategori k\u0131s\u0131tlamalar\u0131 al\u0131namad\u0131" });
    }
  });
  app2.get("/api/locations", async (req, res) => {
    try {
      const { type, parent } = req.query;
      let query = db.select().from(locations);
      const conditions = [];
      if (parent !== void 0) {
        if (parent === null || parent === "") {
          conditions.push(isNull(locations.parentId));
        } else {
          conditions.push(eq7(locations.parentId, parent));
        }
      }
      if (type) {
        conditions.push(eq7(locations.type, type));
      }
      const result = await query.where(conditions.length > 0 ? and6(...conditions) : void 0);
      res.json(result);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });
  app2.get("/api/search/suggestions", async (req, res) => {
    try {
      const q = (req.query.q || "").trim();
      if (!q || q.length < 2) return res.json({ listings: [], categories: [] });
      const [listingSuggestions, categorySuggestions] = await Promise.all([
        db.select({ id: listings.id, title: listings.title, price: listings.price, city: listings.city }).from(listings).where(and6(
          sql6`public.tr_normalize(${listings.title}) LIKE public.tr_normalize(${`%${q}%`})`,
          eq7(listings.status, "active")
        )).orderBy(desc5(listings.createdAt)).limit(6),
        db.select({ id: categories.id, name: categories.name, slug: categories.slug }).from(categories).where(sql6`public.tr_normalize(${categories.name}) LIKE public.tr_normalize(${`%${q}%`})`).limit(4)
      ]);
      res.json({ listings: listingSuggestions, categories: categorySuggestions });
    } catch (err) {
      res.json({ listings: [], categories: [] });
    }
  });
  app2.get("/api/listings", async (req, res) => {
    try {
      const {
        page = "1",
        limit = "50",
        categoryId,
        city,
        district,
        minPrice,
        maxPrice,
        status,
        search,
        // Advanced filters
        minAge,
        maxAge,
        ageCategory,
        gender,
        breed,
        healthStatus,
        vaccinated,
        neutered,
        pedigree,
        characterTraits,
        // Sorting
        sortBy,
        sortOrder,
        // Belirli bir satıcının / mağazanın ilanları
        sellerId,
        storeId
      } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
      const offset = (pageNum - 1) * limitNum;
      const conditions = [];
      if (categoryId) {
        const cacheKey = cacheKeys.categories();
        let allCategories = await cache.get(cacheKey);
        if (!allCategories) {
          allCategories = await db.select().from(categories).orderBy(categories.order);
          await cache.set(cacheKey, allCategories, cacheTTL.categories);
        }
        const childMap = /* @__PURE__ */ new Map();
        allCategories.forEach((cat) => {
          if (cat.parentId) {
            const siblings = childMap.get(cat.parentId) || [];
            siblings.push(cat.id);
            childMap.set(cat.parentId, siblings);
          }
        });
        const getAllDescendants = (catId) => {
          const children = childMap.get(catId) || [];
          let descendants = [catId];
          for (const childId of children) {
            descendants = [...descendants, ...getAllDescendants(childId)];
          }
          return descendants;
        };
        const categoryIds = getAllDescendants(categoryId);
        if (categoryIds.length > 1) {
          conditions.push(inArray4(listings.categoryId, categoryIds));
        } else {
          conditions.push(eq7(listings.categoryId, categoryId));
        }
      }
      if (city) {
        conditions.push(eq7(listings.city, city));
      }
      if (district) {
        conditions.push(eq7(listings.district, district));
      }
      if (sellerId) {
        conditions.push(eq7(listings.sellerId, sellerId));
      }
      if (storeId) {
        conditions.push(eq7(listings.storeId, storeId));
      }
      const GORUNUR_ILAN_DURUMLARI = ["active", "sold"];
      if (status && GORUNUR_ILAN_DURUMLARI.includes(status)) {
        conditions.push(eq7(listings.status, status));
      } else {
        conditions.push(eq7(listings.status, "active"));
      }
      if (minPrice) {
        const minPriceNum = parseFloat(minPrice);
        if (!isNaN(minPriceNum)) {
          conditions.push(gte2(listings.price, minPriceNum.toString()));
        }
      }
      if (maxPrice) {
        const maxPriceNum = parseFloat(maxPrice);
        if (!isNaN(maxPriceNum)) {
          conditions.push(lte2(listings.price, maxPriceNum.toString()));
        }
      }
      if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(
          sql6`(
            public.tr_normalize(${listings.title}) LIKE public.tr_normalize(${searchTerm})
            OR public.tr_normalize(${listings.description}) LIKE public.tr_normalize(${searchTerm})
            OR public.tr_normalize(coalesce(${listings.breed}, '')) LIKE public.tr_normalize(${searchTerm})
          )`
        );
      }
      if (minAge) {
        const minAgeNum = parseInt(minAge, 10);
        if (!isNaN(minAgeNum)) {
          conditions.push(sql6`CAST(${listings.age} AS INTEGER) >= ${minAgeNum}`);
        }
      }
      if (maxAge) {
        const maxAgeNum = parseInt(maxAge, 10);
        if (!isNaN(maxAgeNum)) {
          conditions.push(sql6`CAST(${listings.age} AS INTEGER) <= ${maxAgeNum}`);
        }
      }
      if (gender && gender !== "all") {
        conditions.push(eq7(listings.gender, gender));
      }
      if (breed && typeof breed === "string" && breed.trim()) {
        conditions.push(
          sql6`public.tr_normalize(coalesce(${listings.breed}, '')) LIKE public.tr_normalize(${`%${breed}%`})`
        );
      }
      if (healthStatus && healthStatus !== "all") {
        conditions.push(eq7(listings.healthStatus, healthStatus));
      }
      if (vaccinated !== void 0 && vaccinated !== "all") {
        const isVaccinated = vaccinated === "true" || vaccinated === "1";
        conditions.push(eq7(listings.vaccinated, isVaccinated));
      }
      if (neutered !== void 0 && neutered !== "all") {
        const isNeutered = neutered === "true" || neutered === "1";
        conditions.push(eq7(listings.neutered, isNeutered));
      }
      if (pedigree !== void 0 && pedigree !== "all") {
        const hasPedigree = pedigree === "true" || pedigree === "1";
        conditions.push(eq7(listings.pedigree, hasPedigree));
      }
      if (ageCategory && ageCategory !== "all") {
        const ageRanges = {
          "0-3-ay": [0, 3],
          "3-6-ay": [3, 6],
          "6-12-ay": [6, 12],
          "1-3-yas": [12, 36],
          "3-7-yas": [36, 84],
          "7-plus-yas": [84, 999]
        };
        const range = ageRanges[ageCategory];
        if (range) {
          conditions.push(
            sql6`(${listings.age} = ${ageCategory} OR 
                (${listings.age} ~ '^[0-9]+$' AND CAST(${listings.age} AS INTEGER) >= ${range[0]} AND CAST(${listings.age} AS INTEGER) < ${range[1]}))`
          );
        }
      }
      if (characterTraits) {
        let traitsArray = [];
        if (Array.isArray(characterTraits)) {
          traitsArray = characterTraits.filter((t) => typeof t === "string" && !!t.trim());
        } else if (typeof characterTraits === "string" && characterTraits.trim()) {
          traitsArray = characterTraits.split(",").map((t) => t.trim()).filter(Boolean);
        }
        if (traitsArray.length > 0) {
          const traitConditions = traitsArray.map(
            (trait) => sql6`${listings.characterTraits}::jsonb @> ${JSON.stringify([trait])}::jsonb`
          );
          conditions.push(sql6`(${sql6.join(traitConditions, sql6` OR `)})`);
        }
      }
      const validConditions = conditions.filter(Boolean);
      const [{ count: totalCount }] = await db.select({ count: count() }).from(listings).where(validConditions.length > 0 ? and6(...validConditions) : void 0);
      const ALLOWED_SORT_COLUMNS = {
        createdAt: "createdAt",
        price: "price",
        views: "views"
      };
      const ALLOWED_SORT_ORDERS = /* @__PURE__ */ new Set(["asc", "desc"]);
      const sortCol = typeof sortBy === "string" && ALLOWED_SORT_COLUMNS[sortBy] ? ALLOWED_SORT_COLUMNS[sortBy] : "createdAt";
      const sortDir = typeof sortOrder === "string" && ALLOWED_SORT_ORDERS.has(sortOrder) ? sortOrder : "desc";
      const sortExpression = sortCol === "price" ? sortDir === "asc" ? asc(listings.price) : desc5(listings.price) : sortCol === "views" ? sortDir === "asc" ? asc(listings.views) : desc5(listings.views) : sortDir === "asc" ? asc(listings.createdAt) : desc5(listings.createdAt);
      const listingsData = await db.select({
        listing: listings,
        store: {
          id: stores.id,
          slug: stores.slug,
          displayName: stores.displayName,
          logo: stores.logo
        }
      }).from(listings).leftJoin(stores, eq7(listings.storeId, stores.id)).where(validConditions.length > 0 ? and6(...validConditions) : void 0).orderBy(sortExpression).limit(limitNum).offset(offset);
      const flattenedListings = listingsData.map((row) => ({
        ...row.listing,
        store: row.store?.id ? row.store : null
      }));
      let listingsWithFavorites = flattenedListings;
      if (req.user) {
        const userFavorites = await db.select().from(favorites).where(eq7(favorites.userId, getUserId3(req.user)));
        const favoriteIds = new Set(userFavorites.map((f) => f.listingId));
        listingsWithFavorites = flattenedListings.map((listing) => ({
          ...listing,
          isFavorite: favoriteIds.has(listing.id)
        }));
      }
      res.json({
        data: listingsWithFavorites,
        total: Number(totalCount),
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(Number(totalCount) / limitNum)
      });
    } catch (error) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });
  app2.get("/api/listings/hot", async (_req, res) => {
    try {
      const cacheKey = cacheKeys.hotListings();
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      const hotListings = await db.select().from(listings).where(eq7(listings.status, "active")).orderBy(desc5(listings.views)).limit(12);
      await cache.set(cacheKey, hotListings, cacheTTL.hotListings);
      res.json(hotListings);
    } catch (error) {
      console.error("Error fetching hot listings:", error);
      res.status(500).json({ message: "Failed to fetch hot listings" });
    }
  });
  app2.get("/api/listings/:id/similar", async (req, res) => {
    try {
      const [currentListing] = await db.select().from(listings).where(eq7(listings.id, req.params.id)).limit(1);
      if (!currentListing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      const similarListings = await db.select().from(listings).where(
        and6(
          eq7(listings.categoryId, currentListing.categoryId),
          eq7(listings.status, "active"),
          sql6`${listings.id} != ${req.params.id}`
          // Exclude current listing
        )
      ).orderBy(desc5(listings.views)).limit(8);
      res.json(similarListings);
    } catch (error) {
      console.error("Error fetching similar listings:", error);
      res.status(500).json({ message: "Failed to fetch similar listings" });
    }
  });
  const LISTE_SABIT_YOLLARI = /* @__PURE__ */ new Set(["mine", "compare", "drafts", "hot"]);
  app2.get("/api/listings/:id", async (req, res, next) => {
    if (LISTE_SABIT_YOLLARI.has(req.params.id)) return next();
    try {
      const [listing] = await db.select().from(listings).where(eq7(listings.id, req.params.id)).limit(1);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      await db.update(listings).set({ views: sql6`${listings.views} + 1` }).where(eq7(listings.id, req.params.id));
      const [seller] = await db.select().from(users).where(eq7(users.id, listing.sellerId)).limit(1);
      let categoryInfo = null;
      if (listing.categoryId) {
        const [category] = await db.select().from(categories).where(eq7(categories.id, listing.categoryId)).limit(1);
        categoryInfo = category || null;
      }
      let storeInfo = null;
      if (listing.storeId) {
        const [store] = await db.select({
          id: stores.id,
          slug: stores.slug,
          displayName: stores.displayName,
          logo: stores.logo
        }).from(stores).where(eq7(stores.id, listing.storeId)).limit(1);
        storeInfo = store || null;
      }
      let isFavorite = false;
      if (req.user) {
        const [favorite] = await db.select().from(favorites).where(
          and6(
            eq7(favorites.userId, getUserId3(req.user)),
            eq7(favorites.listingId, listing.id)
          )
        ).limit(1);
        isFavorite = !!favorite;
      }
      const sanitizedSeller = seller ? {
        id: seller.id,
        firstName: seller.firstName,
        lastName: seller.lastName,
        username: seller.username,
        profileImageUrl: seller.profileImageUrl,
        phone: seller.phone,
        city: seller.city ?? null,
        createdAt: seller.createdAt
      } : null;
      const izleyiciId = req.user ? getUserId3(req.user) : null;
      const sahibiMi = izleyiciId === listing.sellerId || req.user?.role === "admin";
      const gorunurListing = ilanGizliAlanlariAyikla(listing, sahibiMi);
      res.json({
        ...gorunurListing,
        views: (listing.views || 0) + 1,
        // Return incremented view count
        seller: sanitizedSeller,
        category: categoryInfo,
        store: storeInfo,
        isFavorite
      });
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });
  app2.post("/api/listings", createLimiter, botGuard, isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const sellerId = getUserId3(user);
      if (process.env.NODE_ENV === "production" && !await isEmailVerified(user)) {
        return res.status(403).json({
          message: "\u0130lan olu\u015Fturabilmek i\xE7in email adresinizi do\u011Frulaman\u0131z gerekmektedir.",
          requiresVerification: true
        });
      }
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1e3);
      const normalizedTitle = req.body.title.toLowerCase().trim();
      const duplicates = await db.select().from(listings).where(
        and6(
          eq7(listings.sellerId, sellerId),
          sql6`LOWER(TRIM(${listings.title})) = ${normalizedTitle}`,
          gte2(listings.createdAt, oneHourAgo),
          // Ignore rejected/deleted listings
          sql6`${listings.status} NOT IN ('rejected', 'deleted')`
        )
      ).limit(1);
      if (duplicates.length > 0) {
        return res.status(429).json({
          message: "Ayn\u0131 ba\u015Fl\u0131kla k\u0131sa s\xFCre \xF6nce ilan olu\u015Fturdunuz. L\xFCtfen 1 saat bekleyin.",
          errorCode: "DUPLICATE_LISTING"
        });
      }
      const recentListings = await db.select({ count: count() }).from(listings).where(
        and6(
          eq7(listings.sellerId, sellerId),
          gte2(listings.createdAt, oneHourAgo),
          sql6`${listings.status} NOT IN ('rejected', 'deleted')`
        )
      );
      if (recentListings[0] && Number(recentListings[0].count) >= 5) {
        return res.status(429).json({
          message: "Saatte en fazla 5 ilan olu\u015Fturabilirsiniz. L\xFCtfen daha sonra tekrar deneyin.",
          errorCode: "RATE_LIMIT_EXCEEDED"
        });
      }
      const categoryId = req.body.categoryId;
      if (categoryId) {
        const categoryInfo = await db.select().from(categories).where(eq7(categories.id, categoryId)).limit(1);
        if (categoryInfo.length > 0) {
          const categorySlug = categoryInfo[0].slug;
          const restrictions = await db.select().from(restrictedCategories).where(and6(
            eq7(restrictedCategories.categorySlug, categorySlug),
            eq7(restrictedCategories.isActive, true)
          ));
          if (restrictions.length > 0) {
            const restriction = restrictions[0];
            if (restriction.restrictionType === "banned") {
              return res.status(403).json({
                message: `Bu kategoride ilan vermek yasakt\u0131r. ${restriction.reason}`,
                errorCode: "CATEGORY_BANNED",
                legalReference: restriction.legalReference,
                penaltyInfo: restriction.penaltyAmount
              });
            }
            if (restriction.restrictionType === "individual_only") {
              const storeId = req.body.storeId;
              const listingSource = req.body.storeId ? "store" : "individual";
              if (listingSource === "store" || storeId) {
                return res.status(403).json({
                  message: `Ma\u011Fazalar bu kategoride ilan veremez. ${restriction.reason}`,
                  errorCode: "STORE_NOT_ALLOWED",
                  legalReference: restriction.legalReference,
                  penaltyInfo: restriction.penaltyAmount
                });
              }
            }
            if (restriction.restrictionType === "cites_required") {
              const citesAccepted = req.body.citesDocumentDeclared;
              if (!citesAccepted) {
                return res.status(400).json({
                  message: `Bu t\xFCr CITES kapsam\u0131nda korunan bir hayvand\u0131r. \u0130lan verebilmek i\xE7in yasal belge sahibi oldu\u011Funuzu beyan etmeniz gerekmektedir.`,
                  errorCode: "CITES_REQUIRED",
                  legalReference: restriction.legalReference,
                  penaltyInfo: restriction.penaltyAmount,
                  requiresCitesDeclaration: true
                });
              }
            }
          }
          if (categoryInfo[0].path && Array.isArray(categoryInfo[0].path)) {
            for (const parentId of categoryInfo[0].path) {
              const parentCat = await db.select().from(categories).where(eq7(categories.id, parentId)).limit(1);
              if (parentCat.length > 0) {
                const parentRestrictions = await db.select().from(restrictedCategories).where(and6(
                  eq7(restrictedCategories.categorySlug, parentCat[0].slug),
                  eq7(restrictedCategories.isActive, true)
                ));
                if (parentRestrictions.length > 0) {
                  const restriction = parentRestrictions[0];
                  if (restriction.restrictionType === "individual_only" && req.body.storeId) {
                    return res.status(403).json({
                      message: `Ma\u011Fazalar bu kategoride ilan veremez. ${restriction.reason}`,
                      errorCode: "STORE_NOT_ALLOWED",
                      legalReference: restriction.legalReference,
                      penaltyInfo: restriction.penaltyAmount
                    });
                  }
                }
              }
            }
          }
        }
      }
      const listingStatus = process.env.NODE_ENV === "production" ? "pending" : "active";
      let priceValue = req.body.price;
      if (typeof priceValue === "string") {
        priceValue = priceValue.replace(/\./g, "").replace(/,/g, ".");
      }
      const numericPrice = parseFloat(priceValue);
      if (isNaN(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ message: "Ge\xE7erli bir fiyat giriniz" });
      }
      if (numericPrice > 9999999999e-2) {
        return res.status(400).json({ message: "Fiyat en fazla 99.999.999,99 TL olabilir" });
      }
      const safeBody = ilanAlanlariniSuz(req.body);
      const parsedData = insertListingSchema.parse({
        ...safeBody,
        price: numericPrice.toString(),
        sellerId,
        status: listingStatus,
        // Auto-detect listing source: if storeId provided, it's a store listing
        listingSource: safeBody.storeId ? "store" : "individual"
      });
      const [listing] = await db.insert(listings).values(parsedData).returning();
      const gorselAdresleri = parsedData.images;
      if (Array.isArray(gorselAdresleri) && gorselAdresleri.length > 0) {
        try {
          await db.update(listingImages).set({ listingId: listing.id }).where(
            and6(
              isNull(listingImages.listingId),
              inArray4(listingImages.thumbnailUrl, gorselAdresleri)
            )
          );
        } catch (err) {
          console.error("\u0130lan g\xF6rselleri ilana ba\u011Flanamad\u0131:", err);
        }
      }
      const responseMessage = listingStatus === "active" ? "\u0130lan\u0131n\u0131z ba\u015Far\u0131yla olu\u015Fturuldu ve yay\u0131nda!" : "\u0130lan\u0131n\u0131z ba\u015Far\u0131yla olu\u015Fturuldu. Admin onay\u0131ndan sonra yay\u0131na girecektir.";
      res.status(201).json({
        ...listing,
        message: responseMessage,
        requiresApproval: listingStatus === "pending"
      });
    } catch (error) {
      console.error("Error creating listing:", error);
      res.status(400).json({ message: "\u0130lan olu\u015Fturulamad\u0131", error });
    }
  });
  app2.patch("/api/listings/:id", isAuthenticated, async (req, res) => {
    try {
      const [listing] = await db.select().from(listings).where(eq7(listings.id, req.params.id)).limit(1);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      if (listing.sellerId !== getUserId3(req.user) && req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      let sanitizedPrice;
      if (req.body.price) {
        let priceValue = req.body.price;
        if (typeof priceValue === "string") {
          priceValue = priceValue.replace(/\./g, "").replace(/,/g, ".");
        }
        const numericPrice = parseFloat(priceValue);
        if (isNaN(numericPrice) || numericPrice < 0) {
          return res.status(400).json({ message: "Ge\xE7erli bir fiyat giriniz" });
        }
        if (numericPrice > 9999999999e-2) {
          return res.status(400).json({ message: "Fiyat en fazla 99.999.999,99 TL olabilir" });
        }
        sanitizedPrice = numericPrice.toString();
      }
      const oldPrice = parseFloat(listing.price || "0");
      const newPrice = sanitizedPrice ? parseFloat(sanitizedPrice) : oldPrice;
      const isPriceDrop = newPrice < oldPrice && oldPrice > 0;
      const safeBody = ilanAlanlariniSuz(req.body);
      const updateData = { ...safeBody, updatedAt: /* @__PURE__ */ new Date() };
      if (sanitizedPrice) {
        updateData.price = sanitizedPrice;
      }
      if ("storeId" in safeBody) {
        updateData.listingSource = safeBody.storeId ? "store" : "individual";
      }
      if (listing.status === "rejected" && req.user.role !== "admin") {
        updateData.status = "pending";
        updateData.moderationReason = null;
      }
      const [updated] = await db.update(listings).set(updateData).where(eq7(listings.id, req.params.id)).returning();
      if (isPriceDrop && listing.status === "active") {
        try {
          const favoritedUsers = await db.select({ userId: favorites.userId }).from(favorites).where(eq7(favorites.listingId, req.params.id));
          const discountPercent = Math.round((oldPrice - newPrice) / oldPrice * 100);
          if (favoritedUsers.length > 0) {
            const notificationValues = favoritedUsers.map((fav) => ({
              userId: fav.userId,
              type: "price_drop",
              title: "Fiyat D\xFC\u015Ft\xFC!",
              message: `"${listing.title}" ilan\u0131n\u0131n fiyat\u0131 %${discountPercent} d\xFC\u015Ft\xFC! Yeni fiyat: \u20BA${newPrice.toLocaleString("tr-TR")}`,
              link: `/ilan/${req.params.id}`,
              relatedId: req.params.id
            }));
            await db.insert(notifications).values(notificationValues);
          }
        } catch (notifError) {
          console.error("Failed to send price drop notifications:", notifError);
        }
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(400).json({ message: "Update failed", error });
    }
  });
  app2.delete("/api/listings/:id", isAuthenticated, async (req, res) => {
    try {
      const listingId = req.params.id;
      const [listing] = await db.select().from(listings).where(eq7(listings.id, listingId)).limit(1);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      if (listing.sellerId !== getUserId3(req.user) && req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const objectStorage2 = new ObjectStorageService();
      await db.delete(favorites).where(eq7(favorites.listingId, listingId));
      const imagesToDelete = await db.select().from(listingImages).where(eq7(listingImages.listingId, listingId));
      for (const img of imagesToDelete) {
        const pathsToDelete = [
          img.originalKey,
          img.thumbnailKey,
          img.mediumKey,
          img.largeKey
        ].filter(Boolean);
        await objectStorage2.deleteMultipleFiles(pathsToDelete);
      }
      await db.delete(listingImages).where(eq7(listingImages.listingId, listingId));
      if (listing.images && Array.isArray(listing.images)) {
        await objectStorage2.deleteMultipleFiles(listing.images);
      }
      await db.delete(reports).where(
        and6(eq7(reports.reportedType, "listing"), eq7(reports.reportedId, listingId))
      );
      await db.delete(offers).where(eq7(offers.listingId, listingId));
      await db.update(conversations).set({ listingId: null }).where(eq7(conversations.listingId, listingId));
      const relatedAuctions = await db.select({ id: auctions.id }).from(auctions).where(eq7(auctions.listingId, listingId));
      for (const auction of relatedAuctions) {
        await db.delete(bids).where(eq7(bids.auctionId, auction.id));
      }
      await db.delete(auctions).where(eq7(auctions.listingId, listingId));
      await db.delete(listings).where(eq7(listings.id, listingId));
      res.json({ message: "Listing deleted successfully" });
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(400).json({ message: "Delete failed", error });
    }
  });
  app2.patch("/api/listings/:id/deactivate", isAuthenticated, async (req, res) => {
    try {
      const listingId = req.params.id;
      const [listing] = await db.select().from(listings).where(eq7(listings.id, listingId)).limit(1);
      if (!listing) {
        return res.status(404).json({ message: "\u0130lan bulunamad\u0131" });
      }
      if (listing.sellerId !== getUserId3(req.user) && req.user.role !== "admin") {
        return res.status(403).json({ message: "Bu i\u015Flem i\xE7in yetkiniz yok" });
      }
      const [updated] = await db.update(listings).set({ status: "draft", updatedAt: /* @__PURE__ */ new Date() }).where(eq7(listings.id, listingId)).returning();
      res.json({ message: "\u0130lan pasife al\u0131nd\u0131", listing: updated });
    } catch (error) {
      console.error("Error deactivating listing:", error);
      res.status(400).json({ message: "\u0130lan pasife al\u0131namad\u0131" });
    }
  });
  app2.patch("/api/listings/:id/activate", isAuthenticated, async (req, res) => {
    try {
      const listingId = req.params.id;
      const [listing] = await db.select().from(listings).where(eq7(listings.id, listingId)).limit(1);
      if (!listing) {
        return res.status(404).json({ message: "\u0130lan bulunamad\u0131" });
      }
      if (listing.sellerId !== getUserId3(req.user) && req.user.role !== "admin") {
        return res.status(403).json({ message: "Bu i\u015Flem i\xE7in yetkiniz yok" });
      }
      const [updated] = await db.update(listings).set({ status: "active", updatedAt: /* @__PURE__ */ new Date() }).where(eq7(listings.id, listingId)).returning();
      res.json({ message: "\u0130lan aktifle\u015Ftirildi", listing: updated });
    } catch (error) {
      console.error("Error activating listing:", error);
      res.status(400).json({ message: "\u0130lan aktifle\u015Ftirilemedi" });
    }
  });
  app2.get("/api/listings/mine", isAuthenticated, async (req, res) => {
    try {
      const userListings = await db.select().from(listings).where(eq7(listings.sellerId, getUserId3(req.user))).orderBy(desc5(listings.createdAt));
      res.json(userListings);
    } catch (error) {
      console.error("Error fetching user listings:", error);
      res.status(500).json({ message: "Failed to fetch user listings" });
    }
  });
  app2.get("/api/users/:id/listings", async (req, res) => {
    try {
      const userListings = await db.select().from(listings).where(and6(eq7(listings.sellerId, req.params.id), eq7(listings.status, "active"))).orderBy(desc5(listings.createdAt));
      res.json(userListings.map((l) => ilanGizliAlanlariAyikla(l, false)));
    } catch (error) {
      console.error("Error fetching user listings:", error);
      res.status(500).json({ message: "Failed to fetch user listings" });
    }
  });
  app2.get("/api/auctions", async (req, res) => {
    try {
      const status = req.query.status;
      let query = db.select().from(auctions);
      if (status) {
        query = query.where(eq7(auctions.status, status));
      }
      const allAuctions = await query.orderBy(desc5(auctions.createdAt));
      res.json(allAuctions);
    } catch (error) {
      console.error("Failed to fetch auctions:", error);
      res.status(500).json({ message: "Failed to fetch auctions" });
    }
  });
  app2.get("/api/auctions/:id", async (req, res) => {
    try {
      const [auction] = await db.select().from(auctions).where(eq7(auctions.id, req.params.id)).limit(1);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      const auctionBids = await db.select().from(bids).where(eq7(bids.auctionId, req.params.id)).orderBy(desc5(bids.amount));
      const [hamIlan] = await db.select().from(listings).where(eq7(listings.id, auction.listingId)).limit(1);
      const listing = hamIlan && hamIlan.status === "active" ? ilanGizliAlanlariAyikla(hamIlan, false) : null;
      res.json({
        ...auction,
        bids: auctionBids,
        listing
      });
    } catch (error) {
      console.error("Failed to fetch auction:", error);
      res.status(500).json({ message: "Failed to fetch auction" });
    }
  });
  app2.post("/api/auctions", isAuthenticated, async (req, res) => {
    try {
      const data = insertAuctionSchema.parse(req.body);
      const [listing] = await db.select().from(listings).where(eq7(listings.id, data.listingId)).limit(1);
      if (!listing || listing.sellerId !== getUserId3(req.user)) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const [auction] = await db.insert(auctions).values(data).returning();
      res.status(201).json(auction);
    } catch (error) {
      console.error("Failed to create auction:", error);
      res.status(400).json({ message: "Failed to create auction", error });
    }
  });
  app2.get("/api/auctions/:id/bids", async (req, res) => {
    try {
      const auctionBids = await db.select().from(bids).where(eq7(bids.auctionId, req.params.id)).orderBy(desc5(bids.amount));
      res.json(auctionBids);
    } catch (error) {
      console.error("Failed to fetch bids:", error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });
  app2.post("/api/auctions/:id/bids", isAuthenticated, async (req, res) => {
    try {
      const [auction] = await db.select().from(auctions).where(eq7(auctions.id, req.params.id)).limit(1);
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }
      if (auction.status !== "live") {
        return res.status(400).json({ message: "Auction is not active" });
      }
      const bidAmount = parseFloat(req.body.amount);
      const currentPrice = parseFloat(auction.currentPrice);
      const minIncrement = parseFloat(auction.minIncrement);
      if (bidAmount < currentPrice + minIncrement) {
        return res.status(400).json({
          message: `Bid must be at least \u20BA${(currentPrice + minIncrement).toFixed(2)}`
        });
      }
      const [bid] = await db.insert(bids).values({
        auctionId: req.params.id,
        bidderId: getUserId3(req.user),
        amount: bidAmount.toString()
      }).returning();
      await db.update(auctions).set({
        currentPrice: bidAmount.toString(),
        totalBids: (auction.totalBids || 0) + 1
      }).where(eq7(auctions.id, req.params.id));
      wss?.clients?.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "new_bid",
            auctionId: req.params.id,
            bid: {
              ...bid,
              bidder: {
                id: getUserId3(req.user),
                fullName: `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() || req.user.username
              }
            }
          }));
        }
      });
      res.status(201).json(bid);
    } catch (error) {
      console.error("Failed to place bid:", error);
      res.status(400).json({ message: "Failed to place bid", error });
    }
  });
  app2.get("/api/streams", async (req, res) => {
    try {
      const status = req.query.status;
      let query = db.select().from(liveStreams);
      if (status) {
        query = query.where(eq7(liveStreams.status, status));
      }
      const allStreams = await query.orderBy(desc5(liveStreams.createdAt));
      res.json(allStreams);
    } catch (error) {
      console.error("Failed to fetch streams:", error);
      res.status(500).json({ message: "Failed to fetch streams" });
    }
  });
  app2.get("/api/streams/:id", async (req, res) => {
    try {
      const [stream] = await db.select().from(liveStreams).where(eq7(liveStreams.id, req.params.id)).limit(1);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      const [streamer] = await db.select().from(users).where(eq7(users.id, stream.streamerId)).limit(1);
      let listing = null;
      if (stream.listingId) {
        const [ham] = await db.select().from(listings).where(eq7(listings.id, stream.listingId)).limit(1);
        if (ham && ham.status === "active") {
          listing = ilanGizliAlanlariAyikla(ham, false);
        }
      }
      res.json({
        ...stream,
        streamer: publicUserFields(streamer),
        listing
      });
    } catch (error) {
      console.error("Failed to fetch stream:", error);
      res.status(500).json({ message: "Failed to fetch stream" });
    }
  });
  app2.post("/api/streams", isAuthenticated, async (req, res) => {
    try {
      const data = insertLiveStreamSchema.parse({
        ...req.body,
        streamerId: getUserId3(req.user),
        channelName: `stream_${Date.now()}_${getUserId3(req.user).substring(0, 8)}`
      });
      const [stream] = await db.insert(liveStreams).values(data).returning();
      res.status(201).json(stream);
    } catch (error) {
      console.error("Failed to create stream:", error);
      res.status(400).json({ message: "Failed to create stream", error });
    }
  });
  app2.patch("/api/streams/:id", isAuthenticated, async (req, res) => {
    try {
      const [stream] = await db.select().from(liveStreams).where(eq7(liveStreams.id, req.params.id)).limit(1);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      if (stream.streamerId !== getUserId3(req.user)) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const [updated] = await db.update(liveStreams).set(req.body).where(eq7(liveStreams.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update stream:", error);
      res.status(400).json({ message: "Failed to update stream", error });
    }
  });
  app2.post("/api/streams/:id/join", isAuthenticated, async (req, res) => {
    try {
      const [stream] = await db.select().from(liveStreams).where(eq7(liveStreams.id, req.params.id)).limit(1);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      if (stream.status !== "live") {
        return res.status(400).json({ message: "Stream is not live" });
      }
      const newViewerCount = (stream.viewerCount || 0) + 1;
      const newPeakViewers = Math.max(stream.peakViewers || 0, newViewerCount);
      const [updated] = await db.update(liveStreams).set({
        viewerCount: newViewerCount,
        peakViewers: newPeakViewers
      }).where(eq7(liveStreams.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to join stream:", error);
      res.status(500).json({ message: "Failed to join stream" });
    }
  });
  app2.post("/api/streams/:id/leave", isAuthenticated, async (req, res) => {
    try {
      const [stream] = await db.select().from(liveStreams).where(eq7(liveStreams.id, req.params.id)).limit(1);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      const newViewerCount = Math.max(0, (stream.viewerCount || 0) - 1);
      const [updated] = await db.update(liveStreams).set({
        viewerCount: newViewerCount
      }).where(eq7(liveStreams.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to leave stream:", error);
      res.status(500).json({ message: "Failed to leave stream" });
    }
  });
  app2.get("/api/streams/:id/token", isAuthenticated, async (req, res) => {
    try {
      const [stream] = await db.select().from(liveStreams).where(eq7(liveStreams.id, req.params.id)).limit(1);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      const appId = process.env.AGORA_APP_ID;
      const appCertificate = process.env.AGORA_APP_CERTIFICATE;
      if (!appId || !appCertificate) {
        return res.status(503).json({
          message: "Canl\u0131 yay\u0131n altyap\u0131s\u0131 hen\xFCz aktif de\u011Fil. Entegrasyon tamamland\u0131\u011F\u0131nda kullan\u0131ma a\xE7\u0131lacakt\u0131r.",
          requiresSetup: true
        });
      }
      const { RtcTokenBuilder, RtcRole } = await import("agora-access-token");
      const uid = parseInt(getUserId3(req.user).substring(0, 8), 16);
      const role = stream.streamerId === getUserId3(req.user) ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
      const expirationTimeInSeconds = 3600;
      const currentTimestamp = Math.floor(Date.now() / 1e3);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
      const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        stream.channelName,
        uid,
        role,
        privilegeExpiredTs
      );
      res.json({
        token,
        channelName: stream.channelName,
        uid,
        appId
      });
    } catch (error) {
      console.error("Failed to generate stream token:", error);
      res.status(500).json({ message: "Failed to generate token" });
    }
  });
  app2.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const limit = parseInt(req.query.limit) || 20;
      const unreadOnly = req.query.unreadOnly === "true";
      let query = db.select().from(notifications).where(
        unreadOnly ? and6(eq7(notifications.userId, userId), eq7(notifications.isRead, false)) : eq7(notifications.userId, userId)
      ).orderBy(desc5(notifications.createdAt)).limit(limit);
      const userNotifications = await query;
      res.json(userNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  app2.get("/api/notifications/count", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const [result] = await db.select({ count: count() }).from(notifications).where(and6(eq7(notifications.userId, userId), eq7(notifications.isRead, false)));
      res.json({ count: result?.count || 0 });
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });
  app2.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const notificationId = req.params.id;
      const [notification] = await db.update(notifications).set({ isRead: true }).where(and6(eq7(notifications.id, notificationId), eq7(notifications.userId, userId))).returning();
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });
  app2.post("/api/notifications/read-all", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      await db.update(notifications).set({ isRead: true }).where(and6(eq7(notifications.userId, userId), eq7(notifications.isRead, false)));
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      res.status(500).json({ message: "Failed to update notifications" });
    }
  });
  app2.delete("/api/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const notificationId = req.params.id;
      const [deleted] = await db.delete(notifications).where(and6(eq7(notifications.id, notificationId), eq7(notifications.userId, userId))).returning();
      if (!deleted) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Failed to delete notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });
  app2.get("/api/messages/unread-count", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const userConvs = await db.select().from(conversations).where(
        or3(
          eq7(conversations.participant1Id, userId),
          eq7(conversations.participant2Id, userId)
        )
      );
      let totalUnread = 0;
      for (const conv of userConvs) {
        if (conv.participant1Id === userId) {
          totalUnread += conv.participant1UnreadCount || 0;
        } else {
          totalUnread += conv.participant2UnreadCount || 0;
        }
      }
      res.json({ count: totalUnread });
    } catch (error) {
      console.error("Failed to get unread count:", error);
      res.status(500).json({ message: "Failed to get unread count" });
    }
  });
  app2.get("/api/messages/search", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const query = req.query.q;
      const limit = parseInt(req.query.limit) || 50;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      const results = await db.select({
        message: messages,
        sender: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl
        }
      }).from(messages).leftJoin(users, eq7(messages.senderId, users.id)).where(
        and6(
          or3(
            eq7(messages.senderId, userId),
            eq7(messages.receiverId, userId)
          ),
          ilike3(messages.content, `%${query}%`),
          eq7(messages.isDeleted, false)
        )
      ).orderBy(desc5(messages.createdAt)).limit(limit);
      res.json(results.map((r) => ({
        ...r.message,
        sender: r.sender
      })));
    } catch (error) {
      console.error("Failed to search messages:", error);
      res.status(500).json({ message: "Failed to search messages" });
    }
  });
  app2.get("/api/messages/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const showArchived = req.query.archived === "true";
      const userConvs = await db.select().from(conversations).where(
        and6(
          or3(
            eq7(conversations.participant1Id, userId),
            eq7(conversations.participant2Id, userId)
          ),
          // Filter archived based on query param
          showArchived ? or3(
            and6(eq7(conversations.participant1Id, userId), eq7(conversations.participant1Archived, true)),
            and6(eq7(conversations.participant2Id, userId), eq7(conversations.participant2Archived, true))
          ) : and6(
            or3(
              and6(eq7(conversations.participant1Id, userId), eq7(conversations.participant1Archived, false)),
              and6(eq7(conversations.participant2Id, userId), eq7(conversations.participant2Archived, false))
            )
          )
        )
      ).orderBy(desc5(conversations.lastMessageAt));
      if (userConvs.length === 0) {
        return res.json([]);
      }
      const partnerIds = userConvs.map(
        (c) => c.participant1Id === userId ? c.participant2Id : c.participant1Id
      );
      const messageIds = userConvs.map((c) => c.lastMessageId).filter(Boolean);
      const partners = partnerIds.length > 0 ? await db.select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl
      }).from(users).where(inArray4(users.id, partnerIds)) : [];
      const lastMsgs = messageIds.length > 0 ? await db.select({
        message: messages,
        listing: {
          id: listings.id,
          title: listings.title,
          price: listings.price,
          images: listings.images,
          city: listings.city,
          district: listings.district
        }
      }).from(messages).leftJoin(listings, eq7(messages.listingId, listings.id)).where(inArray4(messages.id, messageIds)) : [];
      const presences = partnerIds.length > 0 ? await db.select().from(userPresence).where(inArray4(userPresence.userId, partnerIds)) : [];
      const partnersMap = new Map(partners.map((p) => [p.id, p]));
      const messagesMap = new Map(lastMsgs.map((m) => [m.message.id, { ...m.message, listing: m.listing }]));
      const presenceMap = new Map(presences.map((p) => [p.userId, p]));
      const result = userConvs.map((conv) => {
        const partnerId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
        const isParticipant1 = conv.participant1Id === userId;
        const partner = partnersMap.get(partnerId);
        const lastMessage = conv.lastMessageId ? messagesMap.get(conv.lastMessageId) : null;
        const presence = presenceMap.get(partnerId);
        return {
          id: conv.id,
          partnerId,
          user: partner ? {
            ...partner,
            isOnline: presence?.isOnline || false,
            lastSeenAt: presence?.lastSeenAt?.toISOString() || null
          } : null,
          lastMessage,
          unreadCount: isParticipant1 ? conv.participant1UnreadCount : conv.participant2UnreadCount,
          isPinned: isParticipant1 ? conv.participant1Pinned : conv.participant2Pinned,
          isArchived: isParticipant1 ? conv.participant1Archived : conv.participant2Archived,
          isMuted: isParticipant1 ? conv.participant1Muted : conv.participant2Muted,
          lastReadAt: isParticipant1 ? conv.participant1LastReadAt : conv.participant2LastReadAt,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt
        };
      });
      result.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const aTime = a.lastMessage?.createdAt?.getTime() || 0;
        const bTime = b.lastMessage?.createdAt?.getTime() || 0;
        return bTime - aTime;
      });
      res.json(result);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });
  app2.patch("/api/conversations/:id/archive", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const conversationId = req.params.id;
      const { archived } = req.body;
      const [conv] = await db.select().from(conversations).where(eq7(conversations.id, conversationId)).limit(1);
      if (!conv) {
        return res.status(404).json({ message: "Konu\u015Fma bulunamad\u0131" });
      }
      if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
        return res.status(403).json({ message: "Bu konu\u015Fmaya eri\u015Fim yetkiniz yok" });
      }
      const updateData = conv.participant1Id === userId ? { participant1Archived: archived } : { participant2Archived: archived };
      await db.update(conversations).set({ ...updateData, updatedAt: /* @__PURE__ */ new Date() }).where(eq7(conversations.id, conversationId));
      res.json({ message: archived ? "Konu\u015Fma ar\u015Fivlendi" : "Konu\u015Fma ar\u015Fivden \xE7\u0131kar\u0131ld\u0131" });
    } catch (error) {
      console.error("Failed to archive conversation:", error);
      res.status(500).json({ message: "Failed to archive conversation" });
    }
  });
  app2.patch("/api/conversations/:id/pin", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const conversationId = req.params.id;
      const { pinned } = req.body;
      const [conv] = await db.select().from(conversations).where(eq7(conversations.id, conversationId)).limit(1);
      if (!conv) {
        return res.status(404).json({ message: "Konu\u015Fma bulunamad\u0131" });
      }
      if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
        return res.status(403).json({ message: "Bu konu\u015Fmaya eri\u015Fim yetkiniz yok" });
      }
      const updateData = conv.participant1Id === userId ? { participant1Pinned: pinned } : { participant2Pinned: pinned };
      await db.update(conversations).set({ ...updateData, updatedAt: /* @__PURE__ */ new Date() }).where(eq7(conversations.id, conversationId));
      res.json({ message: pinned ? "Konu\u015Fma sabitlendi" : "Konu\u015Fma sabitten \xE7\u0131kar\u0131ld\u0131" });
    } catch (error) {
      console.error("Failed to pin conversation:", error);
      res.status(500).json({ message: "Failed to pin conversation" });
    }
  });
  app2.patch("/api/conversations/:id/mute", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const conversationId = req.params.id;
      const { muted } = req.body;
      const [conv] = await db.select().from(conversations).where(eq7(conversations.id, conversationId)).limit(1);
      if (!conv) {
        return res.status(404).json({ message: "Konu\u015Fma bulunamad\u0131" });
      }
      if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
        return res.status(403).json({ message: "Bu konu\u015Fmaya eri\u015Fim yetkiniz yok" });
      }
      const updateData = conv.participant1Id === userId ? { participant1Muted: muted } : { participant2Muted: muted };
      await db.update(conversations).set({ ...updateData, updatedAt: /* @__PURE__ */ new Date() }).where(eq7(conversations.id, conversationId));
      res.json({ message: muted ? "Konu\u015Fma sessize al\u0131nd\u0131" : "Konu\u015Fma sesi a\xE7\u0131ld\u0131" });
    } catch (error) {
      console.error("Failed to mute conversation:", error);
      res.status(500).json({ message: "Failed to mute conversation" });
    }
  });
  app2.post("/api/conversations/:id/read", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const conversationId = req.params.id;
      const [conv] = await db.select().from(conversations).where(eq7(conversations.id, conversationId)).limit(1);
      if (!conv) {
        return res.status(404).json({ message: "Konu\u015Fma bulunamad\u0131" });
      }
      if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
        return res.status(403).json({ message: "Bu konu\u015Fmaya eri\u015Fim yetkiniz yok" });
      }
      const updateData = conv.participant1Id === userId ? { participant1UnreadCount: 0, participant1LastReadAt: /* @__PURE__ */ new Date() } : { participant2UnreadCount: 0, participant2LastReadAt: /* @__PURE__ */ new Date() };
      await db.update(conversations).set({ ...updateData, updatedAt: /* @__PURE__ */ new Date() }).where(eq7(conversations.id, conversationId));
      await db.update(messages).set({
        status: "read",
        readAt: /* @__PURE__ */ new Date()
      }).where(
        and6(
          eq7(messages.conversationId, conversationId),
          eq7(messages.receiverId, userId),
          sql6`${messages.status} != 'read'`
        )
      );
      res.json({ message: "Konu\u015Fma okundu olarak i\u015Faretlendi" });
    } catch (error) {
      console.error("Failed to mark conversation as read:", error);
      res.status(500).json({ message: "Failed to mark conversation as read" });
    }
  });
  app2.post("/api/messages/upload", isAuthenticated, uploadMessageFiles.single("file"), async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "Dosya gerekli" });
      }
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "Dosya boyutu 10MB'\u0131 a\u015Famaz" });
      }
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: "Desteklenmeyen dosya t\xFCr\xFC" });
      }
      const isImage = file.mimetype.startsWith("image/");
      const timestamp2 = Date.now();
      const ext = file.originalname.split(".").pop() || "bin";
      const filename = `message_${userId}_${timestamp2}.${ext}`;
      let fileBuffer = file.buffer;
      let finalFilename = filename;
      if (isImage && file.mimetype !== "image/gif") {
        const sharp2 = (await import("sharp")).default;
        fileBuffer = await sharp2(file.buffer).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
        finalFilename = `message_${userId}_${timestamp2}.webp`;
      }
      const objectStorage2 = new ObjectStorageService();
      const contentType = isImage && file.mimetype !== "image/gif" ? "image/webp" : file.mimetype;
      const objectPath = await objectStorage2.uploadFileBuffer(fileBuffer, contentType);
      const fileUrl = `/api/objects/${objectPath}`;
      res.json({
        url: fileUrl,
        filename: file.originalname,
        mimeType: isImage && file.mimetype !== "image/gif" ? "image/webp" : file.mimetype,
        size: fileBuffer.length,
        type: isImage ? "image" : "file"
      });
    } catch (error) {
      console.error("Failed to upload message file:", error);
      res.status(500).json({ message: "Dosya y\xFCklenemedi" });
    }
  });
  app2.get("/api/messages/:userId", isAuthenticated, async (req, res) => {
    try {
      const currentUserId = getUserId3(req.user);
      const otherUserId = req.params.userId;
      const msgs = await db.select({
        message: messages,
        listing: {
          id: listings.id,
          title: listings.title,
          price: listings.price,
          images: listings.images,
          city: listings.city,
          district: listings.district
        }
      }).from(messages).leftJoin(listings, eq7(messages.listingId, listings.id)).where(
        sql6`(${messages.senderId} = ${currentUserId} AND ${messages.receiverId} = ${otherUserId}) OR (${messages.senderId} = ${otherUserId} AND ${messages.receiverId} = ${currentUserId})`
      ).orderBy(messages.createdAt);
      const result = msgs.map((row) => ({
        ...row.message,
        listing: row.listing
      }));
      const conversationListing = msgs.find((m) => m.listing)?.listing || null;
      res.json({
        messages: result,
        listing: conversationListing
      });
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const senderId = getUserId3(req.user);
      const { receiverId, content, listingId, messageType, replyToId, attachments } = req.body;
      if (!receiverId || !content) {
        return res.status(400).json({ message: "Al\u0131c\u0131 ve mesaj i\xE7eri\u011Fi gereklidir" });
      }
      if (typeof content !== "string" || content.trim().length === 0) {
        return res.status(400).json({ message: "Mesaj i\xE7eri\u011Fi ge\xE7ersiz" });
      }
      if (content.length > 5e3) {
        return res.status(400).json({ message: "Mesaj en fazla 5000 karakter olabilir" });
      }
      if (await eylemHiziAsildi(messages, messages.senderId, messages.createdAt, senderId, 20, 60 * 1e3)) {
        return res.status(429).json({ message: "\xC7ok h\u0131zl\u0131 mesaj g\xF6nderiyorsunuz. L\xFCtfen biraz bekleyin." });
      }
      if (listingId) {
        const [listing] = await db.select({ isExampleListing: listings.isExampleListing }).from(listings).where(eq7(listings.id, listingId)).limit(1);
        if (listing?.isExampleListing) {
          return res.status(403).json({
            message: "\xD6rnek ilanlara mesaj g\xF6nderilemez. Bu ilan sadece \xF6rnek ama\xE7l\u0131d\u0131r."
          });
        }
      }
      const conversationId = [senderId, receiverId].sort().join("_");
      const [existingConv] = await db.select().from(conversations).where(eq7(conversations.id, conversationId)).limit(1);
      if (!existingConv) {
        const [p1, p2] = [senderId, receiverId].sort();
        await db.insert(conversations).values({
          id: conversationId,
          participant1Id: p1,
          participant2Id: p2,
          listingId: listingId || null,
          participant1Archived: false,
          participant2Archived: false,
          participant1Pinned: false,
          participant2Pinned: false,
          participant1Muted: false,
          participant2Muted: false
        });
      }
      const [message] = await db.insert(messages).values({
        senderId,
        receiverId,
        conversationId,
        content,
        listingId: listingId || null,
        messageType: messageType || "text",
        replyToId: replyToId || null,
        attachments: attachments || []
      }).returning();
      const [conv] = await db.select().from(conversations).where(eq7(conversations.id, conversationId)).limit(1);
      if (conv) {
        const isParticipant1Receiver = conv.participant1Id === receiverId;
        await db.update(conversations).set({
          lastMessageId: message.id,
          lastMessageAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date(),
          ...isParticipant1Receiver ? { participant1UnreadCount: sql6`COALESCE(${conversations.participant1UnreadCount}, 0) + 1` } : { participant2UnreadCount: sql6`COALESCE(${conversations.participant2UnreadCount}, 0) + 1` }
        }).where(eq7(conversations.id, conversationId));
      }
      try {
        const [gonderen] = await db.select({ firstName: users.firstName, lastName: users.lastName, username: users.username }).from(users).where(eq7(users.id, senderId)).limit(1);
        const senderName = [gonderen?.firstName, gonderen?.lastName].filter(Boolean).join(" ").trim() || gonderen?.username || "Birisi";
        await db.insert(notifications).values({
          userId: receiverId,
          type: "new_message",
          title: "Yeni Mesaj",
          message: `${senderName} size bir mesaj g\xF6nderdi`,
          link: `/mesajlar?conversationId=${conversationId}`,
          relatedId: message.id
        });
        const [okunmamis] = await db.select({ n: count() }).from(messages).where(
          and6(
            eq7(messages.conversationId, conversationId),
            eq7(messages.receiverId, receiverId),
            isNull(messages.readAt),
            ne(messages.id, message.id)
          )
        );
        if (Number(okunmamis?.n ?? 0) === 0) {
          const [ayar] = await db.select({
            emailNotifications: userSettings.emailNotifications,
            notifyMessages: userSettings.notifyMessages
          }).from(userSettings).where(eq7(userSettings.userId, receiverId)).limit(1);
          const izinVar = !ayar || ayar.emailNotifications && ayar.notifyMessages;
          const [alici] = await db.select({ email: users.email, firstName: users.firstName }).from(users).where(eq7(users.id, receiverId)).limit(1);
          if (izinVar && alici?.email) {
            const onizleme = String(content).replace(/\s+/g, " ").trim().slice(0, 160);
            await emailService.sendNewMessageNotice({
              to: alici.email,
              recipientName: alici.firstName,
              senderName,
              preview: onizleme,
              conversationId,
              listingTitle: null
            });
          }
        }
      } catch (notifError) {
        console.error("Failed to create message notification:", notifError);
      }
      res.status(201).json({ ...message, conversationId });
    } catch (error) {
      console.error("Failed to send message:", error);
      res.status(400).json({ message: "Failed to send message", error });
    }
  });
  app2.get("/api/blog", async (req, res) => {
    try {
      const cacheKey = cacheKeys.blogPosts();
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      const published = req.query.published !== "false";
      const posts = await db.query.blogPosts.findMany({
        where: published ? eq7(blogPosts.published, true) : void 0,
        orderBy: (posts2, { desc: desc6 }) => [desc6(posts2.createdAt)],
        with: {
          author: true
        }
      });
      const sanitizedPosts = posts.map((post) => {
        if (post.author) {
          return {
            ...post,
            author: {
              id: post.author.id,
              fullName: `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || post.author.username,
              avatar: post.author.profileImageUrl
            }
            // Type assertion: intentionally returning partial user object for security
          };
        }
        return post;
      });
      await cache.set(cacheKey, sanitizedPosts, cacheTTL.blogPosts);
      res.json(sanitizedPosts);
    } catch (error) {
      console.error("Blog API error:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });
  app2.get("/api/blog/:slug", async (req, res) => {
    try {
      const post = await db.query.blogPosts.findFirst({
        where: (posts, { eq: eq8 }) => eq8(posts.slug, req.params.slug),
        with: {
          author: true
        }
      });
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      let sanitizedPost = post;
      if (post.author) {
        sanitizedPost = {
          ...post,
          author: {
            id: post.author.id,
            fullName: `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || post.author.username,
            avatar: post.author.profileImageUrl
          }
          // Type assertion: intentionally returning partial user object for security
        };
      }
      res.json(sanitizedPost);
    } catch (error) {
      console.error("Blog detail API error:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });
  app2.post("/api/blog", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "vet") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const data = insertBlogPostSchema.parse({
        ...req.body,
        authorId: getUserId3(req.user)
      });
      const [post] = await db.insert(blogPosts).values(data).returning();
      res.status(201).json(post);
    } catch (error) {
      console.error("Failed to create blog post:", error);
      res.status(400).json({ message: "Failed to create post", error });
    }
  });
  app2.get("/api/vet-services", async (req, res) => {
    try {
      const city = req.query.city;
      let query = db.select().from(vetServices);
      if (city) {
        query = query.where(eq7(vetServices.city, city));
      }
      const services = await query.orderBy(desc5(vetServices.createdAt));
      res.json(services);
    } catch (error) {
      console.error("Failed to fetch vet services:", error);
      res.status(500).json({ message: "Failed to fetch vet services" });
    }
  });
  app2.get("/api/vet-services/:id", async (req, res) => {
    try {
      const [service] = await db.select().from(vetServices).where(eq7(vetServices.id, req.params.id)).limit(1);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      const [vet] = await db.select().from(users).where(eq7(users.id, service.vetId)).limit(1);
      const serviceReviews = await db.select().from(reviews).where(
        and6(
          eq7(reviews.targetId, req.params.id),
          eq7(reviews.targetType, "vet_service")
        )
      );
      const sanitizedVet = publicUserFields(vet);
      res.json({
        ...service,
        vet: sanitizedVet,
        reviews: serviceReviews
      });
    } catch (error) {
      console.error("Failed to fetch vet service:", error);
      res.status(500).json({ message: "Failed to fetch vet service" });
    }
  });
  const VET_HIZMET_ALANLARI = [
    "clinicName",
    "address",
    "city",
    "district",
    "phone",
    "email",
    "specializations",
    "services",
    "workingHours",
    "emergencyService"
  ];
  app2.post("/api/vet-services", isAuthenticated, async (req, res) => {
    try {
      const [kullanici] = await db.select({ role: users.role }).from(users).where(eq7(users.id, getUserId3(req.user))).limit(1);
      if (kullanici?.role !== "vet" && kullanici?.role !== "admin") {
        return res.status(403).json({
          message: "Klinik kayd\u0131 a\xE7mak i\xE7in \xF6nce veteriner hekim do\u011Frulaman\u0131z\u0131 tamamlaman\u0131z gerekiyor.",
          requiresProfessionalVerification: true,
          verificationPath: "/panel/dogrulama"
        });
      }
      const govde = req.body ?? {};
      const temiz = {};
      for (const alan of VET_HIZMET_ALANLARI) {
        if (govde[alan] !== void 0) temiz[alan] = govde[alan];
      }
      const data = insertVetServiceSchema.parse({
        ...temiz,
        vetId: getUserId3(req.user)
      });
      const [service] = await db.insert(vetServices).values({ ...data, verified: kullanici?.role === "vet" }).returning();
      res.status(201).json(service);
    } catch (error) {
      console.error("Failed to create vet service:", error);
      res.status(400).json({ message: "Failed to create service", error });
    }
  });
  app2.get("/api/transport-services", async (req, res) => {
    try {
      const services = await db.select().from(transportServices).orderBy(desc5(transportServices.createdAt));
      res.json(services);
    } catch (error) {
      console.error("Failed to fetch transport services:", error);
      res.status(500).json({ message: "Failed to fetch transport services" });
    }
  });
  app2.get("/api/transport-services/:id", async (req, res) => {
    try {
      const [service] = await db.select().from(transportServices).where(eq7(transportServices.id, req.params.id)).limit(1);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      const [transporter] = await db.select().from(users).where(eq7(users.id, service.transporterId)).limit(1);
      const serviceReviews = await db.select().from(reviews).where(
        and6(
          eq7(reviews.targetId, req.params.id),
          eq7(reviews.targetType, "transport_service")
        )
      );
      const sanitizedTransporter = publicUserFields(transporter);
      res.json({
        ...service,
        transporter: sanitizedTransporter,
        reviews: serviceReviews
      });
    } catch (error) {
      console.error("Failed to fetch transport service:", error);
      res.status(500).json({ message: "Failed to fetch transport service" });
    }
  });
  const NAKLIYE_HIZMET_ALANLARI = [
    "companyName",
    "serviceAreas",
    "vehicleTypes",
    "animalTypes",
    "phone",
    "pricePerKm",
    "minPrice",
    "insurance"
  ];
  app2.post("/api/transport-services", isAuthenticated, async (req, res) => {
    try {
      const [kullanici] = await db.select({ role: users.role }).from(users).where(eq7(users.id, getUserId3(req.user))).limit(1);
      if (kullanici?.role !== "transporter" && kullanici?.role !== "admin") {
        return res.status(403).json({
          message: "Nakliye hizmeti kayd\u0131 a\xE7mak i\xE7in \xF6nce ta\u015F\u0131mac\u0131 do\u011Frulaman\u0131z\u0131 tamamlaman\u0131z gerekiyor.",
          requiresProfessionalVerification: true,
          verificationPath: "/panel/dogrulama"
        });
      }
      const govde = req.body ?? {};
      const temiz = {};
      for (const alan of NAKLIYE_HIZMET_ALANLARI) {
        if (govde[alan] !== void 0) temiz[alan] = govde[alan];
      }
      const data = insertTransportServiceSchema.parse({
        ...temiz,
        transporterId: getUserId3(req.user)
      });
      const [service] = await db.insert(transportServices).values({ ...data, verified: kullanici?.role === "transporter" }).returning();
      res.status(201).json(service);
    } catch (error) {
      console.error("Failed to create transport service:", error);
      res.status(400).json({ message: "Failed to create service", error });
    }
  });
  app2.post("/api/reviews", isAuthenticated, async (req, res) => {
    try {
      const reviewerId = getUserId3(req.user);
      if (await eylemHiziAsildi(reviews, reviews.reviewerId, reviews.createdAt, reviewerId, 10, 60 * 60 * 1e3)) {
        return res.status(429).json({ message: "\xC7ok fazla de\u011Ferlendirme g\xF6nderdiniz. L\xFCtfen biraz bekleyin." });
      }
      const data = insertReviewSchema.parse({
        ...req.body,
        reviewerId
      });
      const [review] = await db.insert(reviews).values(data).returning();
      res.status(201).json(review);
    } catch (error) {
      console.error("Failed to create review:", error);
      res.status(400).json({ message: "Failed to create review", error });
    }
  });
  app2.get("/api/favorites", isAuthenticated, async (req, res) => {
    try {
      const favs = await db.select().from(favorites).where(eq7(favorites.userId, getUserId3(req.user)));
      res.json(favs);
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });
  app2.post("/api/favorites", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const data = insertFavoriteSchema.parse({
        ...req.body,
        userId
      });
      const [mevcut] = await db.select().from(favorites).where(and6(eq7(favorites.userId, userId), eq7(favorites.listingId, data.listingId))).limit(1);
      if (mevcut) {
        return res.status(200).json(mevcut);
      }
      const [favorite] = await db.insert(favorites).values(data).returning();
      try {
        const [listing] = await db.select().from(listings).where(eq7(listings.id, data.listingId)).limit(1);
        if (listing && listing.sellerId !== userId) {
          const [favUser] = await db.select({ firstName: users.firstName, lastName: users.lastName, username: users.username }).from(users).where(eq7(users.id, userId)).limit(1);
          const userName = favUser?.firstName ? `${favUser.firstName} ${favUser.lastName || ""}`.trim() : favUser?.username || "Bir kullan\u0131c\u0131";
          const [notification] = await db.insert(notifications).values({
            userId: listing.sellerId,
            type: "new_favorite",
            title: "Yeni Favori",
            message: `${userName} "${listing.title}" ilan\u0131n\u0131z\u0131 favorilere ekledi`,
            link: `/ilan/${listing.id}`,
            relatedId: listing.id
          }).returning();
          notificationEmitter.emit("notification", {
            userId: listing.sellerId,
            notification
          });
        }
      } catch (notifError) {
        console.error("Failed to create favorite notification:", notifError);
      }
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Failed to add favorite:", error);
      res.status(400).json({ message: "Failed to add favorite", error });
    }
  });
  app2.delete("/api/favorites/:listingId", isAuthenticated, async (req, res) => {
    try {
      await db.delete(favorites).where(
        and6(
          eq7(favorites.userId, getUserId3(req.user)),
          eq7(favorites.listingId, req.params.listingId)
        )
      );
      res.json({ message: "Favorite removed" });
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      res.status(400).json({ message: "Failed to remove favorite", error });
    }
  });
  app2.get("/api/saved-searches", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const userSearches = await db.select().from(savedSearches).where(eq7(savedSearches.userId, userId)).orderBy(desc5(savedSearches.createdAt));
      res.json(userSearches);
    } catch (error) {
      console.error("Failed to fetch saved searches:", error);
      res.status(500).json({ message: "Kay\u0131tl\u0131 aramalar y\xFCklenemedi" });
    }
  });
  app2.post("/api/saved-searches", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const { name, filters, notifyEnabled } = req.body;
      if (!name || !filters) {
        return res.status(400).json({ message: "Arama ad\u0131 ve filtreler gereklidir" });
      }
      const existingSearches = await db.select({ count: sql6`count(*)::int` }).from(savedSearches).where(eq7(savedSearches.userId, userId));
      const searchCount = existingSearches[0]?.count ?? 0;
      if (searchCount >= 10) {
        return res.status(400).json({ message: "En fazla 10 arama kaydedebilirsiniz" });
      }
      const [savedSearch] = await db.insert(savedSearches).values({
        userId,
        name,
        filters,
        notifyEnabled: notifyEnabled || false
      }).returning();
      res.status(201).json(savedSearch);
    } catch (error) {
      console.error("Failed to create saved search:", error);
      res.status(500).json({ message: "Arama kaydedilemedi" });
    }
  });
  app2.patch("/api/saved-searches/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const { id } = req.params;
      const { name, filters, notifyEnabled } = req.body;
      const [existingSearch] = await db.select().from(savedSearches).where(and6(
        eq7(savedSearches.id, id),
        eq7(savedSearches.userId, userId)
      )).limit(1);
      if (!existingSearch) {
        return res.status(404).json({ message: "Kay\u0131tl\u0131 arama bulunamad\u0131" });
      }
      const updateData = { updatedAt: /* @__PURE__ */ new Date() };
      if (name !== void 0) updateData.name = name;
      if (filters !== void 0) updateData.filters = filters;
      if (notifyEnabled !== void 0) updateData.notifyEnabled = notifyEnabled;
      const [updated] = await db.update(savedSearches).set(updateData).where(eq7(savedSearches.id, id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to update saved search:", error);
      res.status(500).json({ message: "Arama g\xFCncellenemedi" });
    }
  });
  app2.delete("/api/saved-searches/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const { id } = req.params;
      await db.delete(savedSearches).where(and6(
        eq7(savedSearches.id, id),
        eq7(savedSearches.userId, userId)
      ));
      res.json({ message: "Kay\u0131tl\u0131 arama silindi" });
    } catch (error) {
      console.error("Failed to delete saved search:", error);
      res.status(500).json({ message: "Arama silinemedi" });
    }
  });
  app2.get("/api/viewed-listings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);
      const viewed = await db.select({
        viewedAt: viewedListings.viewedAt,
        listing: {
          id: listings.id,
          title: listings.title,
          price: listings.price,
          images: listings.images,
          city: listings.city,
          district: listings.district,
          categoryId: listings.categoryId,
          status: listings.status,
          createdAt: listings.createdAt
        }
      }).from(viewedListings).innerJoin(listings, eq7(viewedListings.listingId, listings.id)).where(eq7(viewedListings.userId, userId)).orderBy(desc5(viewedListings.viewedAt)).limit(limit);
      res.json(viewed.map((v) => ({
        ...v.listing,
        viewedAt: v.viewedAt
      })));
    } catch (error) {
      console.error("Failed to fetch viewed listings:", error);
      res.status(500).json({ message: "Son g\xF6r\xFCnt\xFClenen ilanlar y\xFCklenemedi" });
    }
  });
  app2.post("/api/viewed-listings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const { listingId } = req.body;
      if (!listingId) {
        return res.status(400).json({ message: "\u0130lan ID gerekli" });
      }
      const [listing] = await db.select({ id: listings.id }).from(listings).where(eq7(listings.id, listingId)).limit(1);
      if (!listing) {
        return res.status(404).json({ message: "\u0130lan bulunamad\u0131" });
      }
      await db.delete(viewedListings).where(and6(
        eq7(viewedListings.userId, userId),
        eq7(viewedListings.listingId, listingId)
      ));
      await db.insert(viewedListings).values({
        userId,
        listingId
      });
      const userViews = await db.select({ id: viewedListings.id }).from(viewedListings).where(eq7(viewedListings.userId, userId)).orderBy(desc5(viewedListings.viewedAt));
      if (userViews.length > 50) {
        const idsToDelete = userViews.slice(50).map((v) => v.id);
        await db.delete(viewedListings).where(inArray4(viewedListings.id, idsToDelete));
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to add viewed listing:", error);
      res.status(500).json({ message: "G\xF6r\xFCnt\xFCleme kaydedilemedi" });
    }
  });
  app2.delete("/api/viewed-listings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      await db.delete(viewedListings).where(eq7(viewedListings.userId, userId));
      res.json({ message: "G\xF6r\xFCnt\xFCleme ge\xE7mi\u015Fi temizlendi" });
    } catch (error) {
      console.error("Failed to clear viewed listings:", error);
      res.status(500).json({ message: "G\xF6r\xFCnt\xFCleme ge\xE7mi\u015Fi temizlenemedi" });
    }
  });
  app2.get("/api/listings/compare", async (req, res) => {
    try {
      const ids = req.query.id;
      if (!ids) {
        return res.json([]);
      }
      const listingIds = Array.isArray(ids) ? ids : [ids];
      if (listingIds.length === 0 || listingIds.length > 4) {
        return res.status(400).json({ message: "1-4 aras\u0131 ilan se\xE7ebilirsiniz" });
      }
      const compareListings = await db.select().from(listings).where(inArray4(listings.id, listingIds));
      res.json(compareListings);
    } catch (error) {
      console.error("Failed to fetch listings for comparison:", error);
      res.status(500).json({ message: "\u0130lanlar kar\u015F\u0131la\u015Ft\u0131rma i\xE7in y\xFCklenemedi" });
    }
  });
  app2.get("/api/sellers/:sellerId/reviews", async (req, res) => {
    try {
      const { sellerId } = req.params;
      const { page = "1", limit = "10" } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;
      const reviewsData = await db.select({
        review: sellerReviews,
        reviewer: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl
        },
        listing: {
          id: listings.id,
          title: listings.title,
          images: listings.images
        }
      }).from(sellerReviews).leftJoin(users, eq7(sellerReviews.reviewerId, users.id)).leftJoin(listings, eq7(sellerReviews.listingId, listings.id)).where(
        and6(
          eq7(sellerReviews.sellerId, sellerId),
          eq7(sellerReviews.status, "active")
        )
      ).orderBy(desc5(sellerReviews.createdAt)).limit(limitNum).offset(offset);
      const [countResult] = await db.select({ count: sql6`count(*)` }).from(sellerReviews).where(
        and6(
          eq7(sellerReviews.sellerId, sellerId),
          eq7(sellerReviews.status, "active")
        )
      );
      const [avgResult] = await db.select({
        avgRating: sql6`COALESCE(AVG(rating), 0)`,
        totalReviews: sql6`count(*)`
      }).from(sellerReviews).where(
        and6(
          eq7(sellerReviews.sellerId, sellerId),
          eq7(sellerReviews.status, "active")
        )
      );
      const ratingDistribution = await db.select({
        rating: sellerReviews.rating,
        count: sql6`count(*)`
      }).from(sellerReviews).where(
        and6(
          eq7(sellerReviews.sellerId, sellerId),
          eq7(sellerReviews.status, "active")
        )
      ).groupBy(sellerReviews.rating);
      res.json({
        reviews: reviewsData,
        total: Number(countResult?.count || 0),
        page: pageNum,
        limit: limitNum,
        avgRating: Number(avgResult?.avgRating || 0).toFixed(1),
        totalReviews: Number(avgResult?.totalReviews || 0),
        ratingDistribution: ratingDistribution.reduce((acc, r) => {
          acc[r.rating] = Number(r.count);
          return acc;
        }, {})
      });
    } catch (error) {
      console.error("Failed to fetch seller reviews:", error);
      res.status(500).json({ message: "De\u011Ferlendirmeler y\xFCklenemedi" });
    }
  });
  app2.get("/api/sellers/:sellerId/rating", async (req, res) => {
    try {
      const { sellerId } = req.params;
      const [result] = await db.select({
        avgRating: sql6`COALESCE(AVG(rating), 0)`,
        totalReviews: sql6`count(*)`
      }).from(sellerReviews).where(
        and6(
          eq7(sellerReviews.sellerId, sellerId),
          eq7(sellerReviews.status, "active")
        )
      );
      res.json({
        sellerId,
        avgRating: Number(result?.avgRating || 0).toFixed(1),
        totalReviews: Number(result?.totalReviews || 0)
      });
    } catch (error) {
      console.error("Failed to fetch seller rating:", error);
      res.status(500).json({ message: "Sat\u0131c\u0131 puan\u0131 y\xFCklenemedi" });
    }
  });
  app2.post("/api/sellers/:sellerId/reviews", isAuthenticated, async (req, res) => {
    try {
      const { sellerId } = req.params;
      const reviewerId = getUserId3(req.user);
      const { rating, comment, listingId } = req.body;
      if (sellerId === reviewerId) {
        return res.status(400).json({ message: "Kendinizi de\u011Ferlendiremezsiniz" });
      }
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Ge\xE7erli bir puan verin (1-5)" });
      }
      const existingReview = await db.select().from(sellerReviews).where(
        and6(
          eq7(sellerReviews.sellerId, sellerId),
          eq7(sellerReviews.reviewerId, reviewerId),
          listingId ? eq7(sellerReviews.listingId, listingId) : sql6`true`
        )
      ).limit(1);
      if (existingReview.length > 0) {
        return res.status(400).json({ message: "Bu sat\u0131c\u0131y\u0131 zaten de\u011Ferlendirdiniz" });
      }
      let isVerifiedPurchase = false;
      if (listingId) {
        isVerifiedPurchase = false;
      }
      const [review] = await db.insert(sellerReviews).values({
        sellerId,
        reviewerId,
        listingId: listingId || null,
        rating,
        comment: comment || null,
        isVerifiedPurchase
      }).returning();
      const [avgResult] = await db.select({
        avgRating: sql6`COALESCE(AVG(rating), 0)`,
        totalReviews: sql6`count(*)`
      }).from(sellerReviews).where(
        and6(
          eq7(sellerReviews.sellerId, sellerId),
          eq7(sellerReviews.status, "active")
        )
      );
      await db.update(users).set({
        sellerRating: avgResult?.avgRating?.toString() || "0",
        sellerReviewCount: Number(avgResult?.totalReviews || 0)
      }).where(eq7(users.id, sellerId));
      await db.insert(notifications).values({
        userId: sellerId,
        type: "system",
        title: "Yeni De\u011Ferlendirme",
        message: `Bir al\u0131c\u0131 size ${rating} y\u0131ld\u0131z verdi.`,
        relatedId: review.id,
        isRead: false
      });
      res.status(201).json(review);
    } catch (error) {
      console.error("Failed to create seller review:", error);
      res.status(500).json({ message: "De\u011Ferlendirme olu\u015Fturulamad\u0131" });
    }
  });
  app2.patch("/api/seller-reviews/:reviewId/respond", isAuthenticated, async (req, res) => {
    try {
      const { reviewId } = req.params;
      const userId = getUserId3(req.user);
      const { response } = req.body;
      if (!response || response.length < 5) {
        return res.status(400).json({ message: "Yan\u0131t en az 5 karakter olmal\u0131" });
      }
      const [review] = await db.select().from(sellerReviews).where(eq7(sellerReviews.id, reviewId)).limit(1);
      if (!review) {
        return res.status(404).json({ message: "De\u011Ferlendirme bulunamad\u0131" });
      }
      if (review.sellerId !== userId) {
        return res.status(403).json({ message: "Bu de\u011Ferlendirmeye yan\u0131t verme yetkiniz yok" });
      }
      if (review.sellerResponse) {
        return res.status(400).json({ message: "Bu de\u011Ferlendirmeye zaten yan\u0131t verdiniz" });
      }
      const [updated] = await db.update(sellerReviews).set({
        sellerResponse: response,
        sellerResponseAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq7(sellerReviews.id, reviewId)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Failed to respond to review:", error);
      res.status(500).json({ message: "Yan\u0131t verilemedi" });
    }
  });
  app2.post("/api/seller-reviews/:reviewId/helpful", isAuthenticated, async (req, res) => {
    try {
      const { reviewId } = req.params;
      const [updated] = await db.update(sellerReviews).set({
        helpfulCount: sql6`helpful_count + 1`
      }).where(eq7(sellerReviews.id, reviewId)).returning();
      if (!updated) {
        return res.status(404).json({ message: "De\u011Ferlendirme bulunamad\u0131" });
      }
      res.json({ helpfulCount: updated.helpfulCount });
    } catch (error) {
      console.error("Failed to mark review as helpful:", error);
      res.status(500).json({ message: "\u0130\u015Flem ba\u015Far\u0131s\u0131z" });
    }
  });
  app2.get("/api/category-stats/:categorySlug", async (req, res) => {
    try {
      const { categorySlug } = req.params;
      const category = await db.select().from(categories).where(eq7(categories.slug, categorySlug)).limit(1);
      if (!category.length) {
        return res.status(404).json({ message: "Kategori bulunamad\u0131" });
      }
      const allCategories = await db.select({ id: categories.id, slug: categories.slug }).from(categories).where(
        or3(
          eq7(categories.slug, categorySlug),
          ilike3(categories.slug, `${categorySlug}-%`)
        )
      );
      const categoryIds = allCategories.map((c) => c.id);
      const [stats] = await db.select({
        totalListings: sql6`count(*)`,
        avgPrice: sql6`COALESCE(AVG(CAST(${listings.price} AS DECIMAL)), 0)`,
        minPrice: sql6`COALESCE(MIN(CAST(${listings.price} AS DECIMAL)), 0)`,
        maxPrice: sql6`COALESCE(MAX(CAST(${listings.price} AS DECIMAL)), 0)`,
        medianPrice: sql6`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY CAST(${listings.price} AS DECIMAL))`,
        totalViews: sql6`COALESCE(SUM(${listings.views}), 0)`,
        totalFavorites: sql6`COALESCE(SUM(${listings.favoriteCount}), 0)`
      }).from(listings).where(
        and6(
          inArray4(listings.categoryId, categoryIds),
          eq7(listings.status, "active")
        )
      );
      const cityDistribution = await db.select({
        city: listings.city,
        count: sql6`count(*)`
      }).from(listings).where(
        and6(
          inArray4(listings.categoryId, categoryIds),
          eq7(listings.status, "active")
        )
      ).groupBy(listings.city).orderBy(desc5(sql6`count(*)`)).limit(10);
      const priceRanges = await db.select({
        range: sql6`
            CASE 
              WHEN CAST(${listings.price} AS DECIMAL) < 1000 THEN '0-1K'
              WHEN CAST(${listings.price} AS DECIMAL) < 5000 THEN '1K-5K'
              WHEN CAST(${listings.price} AS DECIMAL) < 10000 THEN '5K-10K'
              WHEN CAST(${listings.price} AS DECIMAL) < 25000 THEN '10K-25K'
              WHEN CAST(${listings.price} AS DECIMAL) < 50000 THEN '25K-50K'
              ELSE '50K+'
            END
          `,
        count: sql6`count(*)`
      }).from(listings).where(
        and6(
          inArray4(listings.categoryId, categoryIds),
          eq7(listings.status, "active")
        )
      ).groupBy(sql6`
          CASE 
            WHEN CAST(${listings.price} AS DECIMAL) < 1000 THEN '0-1K'
            WHEN CAST(${listings.price} AS DECIMAL) < 5000 THEN '1K-5K'
            WHEN CAST(${listings.price} AS DECIMAL) < 10000 THEN '5K-10K'
            WHEN CAST(${listings.price} AS DECIMAL) < 25000 THEN '10K-25K'
            WHEN CAST(${listings.price} AS DECIMAL) < 50000 THEN '25K-50K'
            ELSE '50K+'
          END
        `);
      const listingsByDate = await db.select({
        date: sql6`DATE(${listings.createdAt})`,
        count: sql6`count(*)`
      }).from(listings).where(
        and6(
          inArray4(listings.categoryId, categoryIds),
          sql6`${listings.createdAt} >= CURRENT_DATE - INTERVAL '30 days'`
        )
      ).groupBy(sql6`DATE(${listings.createdAt})`).orderBy(sql6`DATE(${listings.createdAt})`);
      res.json({
        categorySlug,
        categoryName: category[0].name,
        stats: {
          totalListings: Number(stats?.totalListings || 0),
          avgPrice: Number(stats?.avgPrice || 0).toFixed(2),
          minPrice: Number(stats?.minPrice || 0).toFixed(2),
          maxPrice: Number(stats?.maxPrice || 0).toFixed(2),
          medianPrice: Number(stats?.medianPrice || 0).toFixed(2),
          totalViews: Number(stats?.totalViews || 0),
          totalFavorites: Number(stats?.totalFavorites || 0)
        },
        cityDistribution,
        priceRanges,
        listingsByDate
      });
    } catch (error) {
      console.error("Failed to fetch category stats:", error);
      res.status(500).json({ message: "\u0130statistikler y\xFCklenemedi" });
    }
  });
  app2.get("/api/category-stats/:categorySlug/trends", async (req, res) => {
    try {
      const { categorySlug } = req.params;
      const { days = "30" } = req.query;
      const daysNum = parseInt(days) || 30;
      const trends = await db.select().from(categoryStats).where(
        and6(
          eq7(categoryStats.categorySlug, categorySlug),
          sql6`${categoryStats.date} >= CURRENT_DATE - INTERVAL '${daysNum} days'`
        )
      ).orderBy(categoryStats.date);
      res.json(trends);
    } catch (error) {
      console.error("Failed to fetch category trends:", error);
      res.status(500).json({ message: "Trend verileri y\xFCklenemedi" });
    }
  });
  app2.get("/api/market-prices/live", async (req, res) => {
    try {
      let currencyItems = [];
      let tcmbDate = "";
      try {
        const tcmb = await getTCMBRates();
        currencyItems = formatCurrencyForTicker(tcmb);
        tcmbDate = tcmb.date;
      } catch (e) {
        console.warn("TCMB fetch failed, skipping currencies:", e);
      }
      const livestockItems = await db.select().from(marketPrices).orderBy(desc5(marketPrices.date)).limit(50);
      const allItems = [
        ...livestockItems.map((p) => ({
          id: p.id,
          type: p.type,
          category: p.category,
          city: p.city,
          price: p.price,
          unit: p.unit,
          change_percent: p.changePercent,
          source: p.source,
          isLive: false,
          date: p.date?.toISOString() ?? (/* @__PURE__ */ new Date()).toISOString()
        })),
        ...currencyItems
      ];
      res.json({
        items: allItems,
        tcmbDate,
        fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("market-prices/live error:", error);
      res.status(500).json({ message: "Piyasa verileri al\u0131namad\u0131" });
    }
  });
  app2.get("/api/market-stats", async (req, res) => {
    try {
      const [overallStats] = await db.select({
        totalListings: sql6`count(*)`,
        activeListings: sql6`count(*) FILTER (WHERE ${listings.status} = 'active')`,
        avgPrice: sql6`COALESCE(AVG(CAST(${listings.price} AS DECIMAL)) FILTER (WHERE ${listings.status} = 'active'), 0)`,
        totalViews: sql6`COALESCE(SUM(${listings.views}), 0)`
      }).from(listings);
      const topCategories = await db.select({
        categoryId: listings.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        count: sql6`count(*)`,
        avgPrice: sql6`COALESCE(AVG(CAST(${listings.price} AS DECIMAL)), 0)`
      }).from(listings).leftJoin(categories, eq7(listings.categoryId, categories.id)).where(eq7(listings.status, "active")).groupBy(listings.categoryId, categories.name, categories.slug).orderBy(desc5(sql6`count(*)`)).limit(10);
      const recentActivity = await db.select({
        date: sql6`DATE(${listings.createdAt})`,
        count: sql6`count(*)`
      }).from(listings).where(sql6`${listings.createdAt} >= CURRENT_DATE - INTERVAL '7 days'`).groupBy(sql6`DATE(${listings.createdAt})`).orderBy(sql6`DATE(${listings.createdAt})`);
      res.json({
        overview: {
          totalListings: Number(overallStats?.totalListings || 0),
          activeListings: Number(overallStats?.activeListings || 0),
          avgPrice: Number(overallStats?.avgPrice || 0).toFixed(2),
          totalViews: Number(overallStats?.totalViews || 0)
        },
        topCategories: topCategories.map((c) => ({
          ...c,
          count: Number(c.count),
          avgPrice: Number(c.avgPrice).toFixed(2)
        })),
        recentActivity
      });
    } catch (error) {
      console.error("Failed to fetch market stats:", error);
      res.status(500).json({ message: "Pazar istatistikleri y\xFCklenemedi" });
    }
  });
  app2.post("/api/listing-videos/upload", createLimiter, isAuthenticated, upload.single("video"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "Video dosyas\u0131 y\xFCklemeniz gerekmektedir." });
      }
      const listingId = req.body.listingId;
      if (!listingId) {
        return res.status(400).json({ message: "\u0130lan ID'si belirtilmemi\u015F." });
      }
      const [listing] = await db.select().from(listings).where(eq7(listings.id, listingId)).limit(1);
      if (!listing) {
        return res.status(404).json({ message: "\u0130lan bulunamad\u0131." });
      }
      if (listing.sellerId !== getUserId3(req.user) && req.user.role !== "admin") {
        return res.status(403).json({ message: "Bu ilana video y\xFCkleme yetkiniz yok." });
      }
      const allowedTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: "Desteklenen video formatlar\u0131: MP4, WebM, MOV, AVI" });
      }
      const maxVideoMb = Number(process.env.MAX_VIDEO_MB || 50);
      const maxSize = maxVideoMb * 1024 * 1024;
      if (file.size > maxSize) {
        return res.status(400).json({ message: `Video boyutu ${maxVideoMb}MB'\u0131 ge\xE7emez.` });
      }
      const existingVideos = await db.select({ count: sql6`count(*)` }).from(listingVideos).where(eq7(listingVideos.listingId, listingId));
      if (Number(existingVideos[0]?.count || 0) >= 3) {
        return res.status(400).json({ message: "Bir ilan i\xE7in en fazla 3 video y\xFCkleyebilirsiniz." });
      }
      if (!isObjectStorageConfigured()) {
        return res.status(500).json({ message: "Object storage yap\u0131land\u0131r\u0131lmam\u0131\u015F." });
      }
      const timestamp2 = Date.now();
      const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      const videoPath = `videos/${listingId}/${timestamp2}-${safeFilename}`;
      try {
        const videoUrl = await objectStorage.uploadBufferAt(
          videoPath,
          file.buffer,
          file.mimetype
        );
        const maxOrderResult = await db.select({ maxOrder: sql6`COALESCE(MAX(${listingVideos.order}), 0)` }).from(listingVideos).where(eq7(listingVideos.listingId, listingId));
        const nextOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;
        const [video] = await db.insert(listingVideos).values({
          listingId,
          url: videoUrl,
          mimeType: file.mimetype,
          size: file.size,
          order: nextOrder,
          status: "ready"
        }).returning();
        res.status(201).json(video);
      } catch (storageError) {
        console.error("Video upload to storage failed:", storageError);
        return res.status(500).json({ message: "Video y\xFCklenirken bir hata olu\u015Ftu." });
      }
    } catch (error) {
      console.error("Video upload failed:", error);
      res.status(500).json({ message: "Video y\xFCklenemedi." });
    }
  });
  app2.get("/api/listing-videos/:listingId", async (req, res) => {
    try {
      const { listingId } = req.params;
      const videos = await db.select().from(listingVideos).where(eq7(listingVideos.listingId, listingId)).orderBy(listingVideos.order);
      res.json(videos);
    } catch (error) {
      console.error("Failed to fetch listing videos:", error);
      res.status(500).json({ message: "Videolar y\xFCklenemedi." });
    }
  });
  app2.delete("/api/listing-videos/:videoId", isAuthenticated, async (req, res) => {
    try {
      const { videoId } = req.params;
      const userId = getUserId3(req.user);
      const [video] = await db.select({
        video: listingVideos,
        listing: { sellerId: listings.sellerId }
      }).from(listingVideos).leftJoin(listings, eq7(listingVideos.listingId, listings.id)).where(eq7(listingVideos.id, videoId)).limit(1);
      if (!video) {
        return res.status(404).json({ message: "Video bulunamad\u0131." });
      }
      if (video.listing?.sellerId !== userId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Bu videoyu silme yetkiniz yok." });
      }
      try {
        if (video.video.url) {
          await objectStorage.deleteFile(video.video.url);
        }
      } catch (e) {
        console.warn("Failed to delete video from storage:", e);
      }
      await db.delete(listingVideos).where(eq7(listingVideos.id, videoId));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete video:", error);
      res.status(500).json({ message: "Video silinemedi." });
    }
  });
  app2.post("/api/contact-requests", createLimiter, botGuard, async (req, res) => {
    try {
      const { listingId, senderName, senderEmail, senderPhone, message } = req.body;
      if (!listingId || !senderName || !senderEmail || !message) {
        return res.status(400).json({ message: "L\xFCtfen t\xFCm gerekli alanlar\u0131 doldurun" });
      }
      const [listing] = await db.select({
        sellerId: listings.sellerId,
        title: listings.title,
        isExampleListing: listings.isExampleListing
      }).from(listings).where(eq7(listings.id, listingId)).limit(1);
      if (!listing) {
        return res.status(404).json({ message: "\u0130lan bulunamad\u0131" });
      }
      if (listing.isExampleListing) {
        return res.status(403).json({
          message: "\xD6rnek ilanlara ileti\u015Fim talebi g\xF6nderilemez. Bu ilan sadece \xF6rnek ama\xE7l\u0131d\u0131r."
        });
      }
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
      const status = "pending";
      const [contactRequest] = await db.insert(contactRequests).values({
        listingId,
        sellerId: listing.sellerId,
        senderName,
        senderEmail,
        senderPhone: senderPhone || null,
        message,
        ipAddress,
        status
      }).returning();
      await db.insert(notifications).values({
        userId: listing.sellerId,
        type: "new_message",
        title: "Yeni \u0130leti\u015Fim Talebi",
        message: `${senderName} adl\u0131 ziyaret\xE7i ilan\u0131n\u0131z hakk\u0131nda ileti\u015Fime ge\xE7mek istiyor.`,
        relatedId: contactRequest.id,
        isRead: false
      });
      const iletisimAyrintilari = [
        ["G\xF6nderen", senderName],
        ["E-posta", senderEmail]
      ];
      if (senderPhone) iletisimAyrintilari.push(["Telefon", String(senderPhone)]);
      iletisimAyrintilari.push(["\u0130lan", listing.title || "\u2014"]);
      await olayEpostasiGonder(
        listing.sellerId,
        {
          title: "\u0130lan\u0131n\u0131z i\xE7in ileti\u015Fim talebi",
          body: String(message).replace(/\s+/g, " ").trim().slice(0, 300),
          details: iletisimAyrintilari,
          actionPath: `/ilan/${listingId}`,
          actionLabel: "\u0130lan\u0131 G\xF6r\xFCnt\xFCle"
        },
        "notifyMessages"
      );
      res.status(201).json({
        message: "Mesaj\u0131n\u0131z sat\u0131c\u0131ya iletildi. En k\u0131sa s\xFCrede sizinle ileti\u015Fime ge\xE7ilecektir.",
        id: contactRequest.id
      });
    } catch (error) {
      console.error("Failed to create contact request:", error);
      res.status(500).json({ message: "Mesaj g\xF6nderilemedi. L\xFCtfen tekrar deneyin." });
    }
  });
  app2.get("/api/contact-requests", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const { status, listingId } = req.query;
      let query = db.select({
        contactRequest: contactRequests,
        listing: listings
      }).from(contactRequests).leftJoin(listings, eq7(contactRequests.listingId, listings.id)).where(eq7(contactRequests.sellerId, userId)).orderBy(desc5(contactRequests.createdAt));
      const conditions = [eq7(contactRequests.sellerId, userId)];
      if (status && typeof status === "string") {
        conditions.push(eq7(contactRequests.status, status));
      }
      if (listingId && typeof listingId === "string") {
        conditions.push(eq7(contactRequests.listingId, listingId));
      }
      const results = await db.select({
        contactRequest: contactRequests,
        listing: {
          id: listings.id,
          title: listings.title,
          images: listings.images
        }
      }).from(contactRequests).leftJoin(listings, eq7(contactRequests.listingId, listings.id)).where(and6(...conditions)).orderBy(desc5(contactRequests.createdAt));
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch contact requests:", error);
      res.status(500).json({ message: "\u0130leti\u015Fim talepleri y\xFCklenemedi" });
    }
  });
  app2.patch("/api/contact-requests/:id/reply", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId3(req.user);
      const [updated] = await db.update(contactRequests).set({
        status: "replied",
        repliedAt: /* @__PURE__ */ new Date()
      }).where(
        and6(
          eq7(contactRequests.id, id),
          eq7(contactRequests.sellerId, userId)
        )
      ).returning();
      if (!updated) {
        return res.status(404).json({ message: "\u0130leti\u015Fim talebi bulunamad\u0131" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Failed to update contact request:", error);
      res.status(500).json({ message: "\u0130leti\u015Fim talebi g\xFCncellenemedi" });
    }
  });
  app2.patch("/api/contact-requests/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = getUserId3(req.user);
      if (!["pending", "replied", "spam", "archived"].includes(status)) {
        return res.status(400).json({ message: "Ge\xE7ersiz durum" });
      }
      const [updated] = await db.update(contactRequests).set({ status }).where(
        and6(
          eq7(contactRequests.id, id),
          eq7(contactRequests.sellerId, userId)
        )
      ).returning();
      if (!updated) {
        return res.status(404).json({ message: "\u0130leti\u015Fim talebi bulunamad\u0131" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Failed to update contact request status:", error);
      res.status(500).json({ message: "\u0130leti\u015Fim talebi g\xFCncellenemedi" });
    }
  });
  app2.get("/api/contact-requests/count", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const [result] = await db.select({ count: sql6`count(*)` }).from(contactRequests).where(
        and6(
          eq7(contactRequests.sellerId, userId),
          eq7(contactRequests.status, "pending")
        )
      );
      res.json({ count: Number(result?.count || 0) });
    } catch (error) {
      console.error("Failed to count contact requests:", error);
      res.status(500).json({ message: "\u0130leti\u015Fim talepleri say\u0131lamad\u0131" });
    }
  });
  app2.post("/api/contact", createLimiter, async (req, res) => {
    try {
      const { name, email, phone, subject, message } = req.body;
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "L\xFCtfen t\xFCm gerekli alanlar\u0131 doldurun" });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Ge\xE7erli bir e-posta adresi girin" });
      }
      if (String(name).length > 100 || String(subject).length > 200 || String(message).length > 5e3) {
        return res.status(400).json({ message: "Girdi\u011Finiz bilgiler \xE7ok uzun" });
      }
      await emailService.sendContactMessage({
        name: String(name).slice(0, 200),
        email: String(email).slice(0, 320),
        phone: phone ? String(phone).slice(0, 40) : void 0,
        subject: String(subject).slice(0, 300),
        message: String(message).slice(0, 5e3)
      });
      res.status(201).json({
        message: "Mesaj\u0131n\u0131z al\u0131nd\u0131. En k\u0131sa s\xFCrede size d\xF6n\xFC\u015F yapaca\u011F\u0131z.",
        success: true
      });
    } catch (error) {
      console.error("Failed to process contact form:", error);
      res.status(500).json({
        message: "Mesaj g\xF6nderilemedi. L\xFCtfen tekrar deneyin veya do\u011Frudan e-posta ile ula\u015F\u0131n."
      });
    }
  });
  app2.get("/api/listings/:listingId/offers", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }
      const [listing] = await db.select({ sellerId: listings.sellerId }).from(listings).where(eq7(listings.id, req.params.listingId)).limit(1);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      if (listing.sellerId !== userId) {
        return res.status(403).json({ message: "Not authorized to view offers for this listing" });
      }
      const listingOffers = await db.select({
        offer: offers,
        buyer: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          sellerLevel: users.sellerLevel
        }
      }).from(offers).innerJoin(users, eq7(offers.buyerId, users.id)).where(eq7(offers.listingId, req.params.listingId)).orderBy(desc5(offers.createdAt));
      res.json(listingOffers.map((o) => ({
        ...o.offer,
        buyer: o.buyer
      })));
    } catch (error) {
      console.error("Failed to fetch offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });
  app2.get("/api/offers/sent", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }
      const sentOffers = await db.select({
        offer: offers,
        listing: {
          id: listings.id,
          title: listings.title,
          price: listings.price,
          images: listings.images
        },
        seller: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName
        }
      }).from(offers).innerJoin(listings, eq7(offers.listingId, listings.id)).innerJoin(users, eq7(offers.sellerId, users.id)).where(eq7(offers.buyerId, userId)).orderBy(desc5(offers.createdAt));
      res.json(sentOffers.map((o) => ({
        ...o.offer,
        listing: o.listing,
        seller: o.seller
      })));
    } catch (error) {
      console.error("Failed to fetch sent offers:", error);
      res.status(500).json({ message: "Failed to fetch sent offers" });
    }
  });
  app2.get("/api/offers/received", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }
      const receivedOffers = await db.select({
        offer: offers,
        listing: {
          id: listings.id,
          title: listings.title,
          price: listings.price,
          images: listings.images
        },
        buyer: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          sellerLevel: users.sellerLevel
        }
      }).from(offers).innerJoin(listings, eq7(offers.listingId, listings.id)).innerJoin(users, eq7(offers.buyerId, users.id)).where(eq7(offers.sellerId, userId)).orderBy(desc5(offers.createdAt));
      res.json(receivedOffers.map((o) => ({
        ...o.offer,
        listing: o.listing,
        buyer: o.buyer
      })));
    } catch (error) {
      console.error("Failed to fetch received offers:", error);
      res.status(500).json({ message: "Failed to fetch received offers" });
    }
  });
  app2.post("/api/offers", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }
      const { listingId, amount, message, expiresAt } = req.body;
      let tutar = amount;
      if (typeof tutar === "string") {
        tutar = tutar.replace(/\./g, "").replace(/,/g, ".");
      }
      const numericAmount = parseFloat(tutar);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ message: "Ge\xE7erli bir teklif tutar\u0131 girin" });
      }
      if (numericAmount > 9999999999e-2) {
        return res.status(400).json({ message: "Teklif tutar\u0131 en fazla 99.999.999,99 TL olabilir" });
      }
      if (message && String(message).length > 1e3) {
        return res.status(400).json({ message: "Teklif mesaj\u0131 en fazla 1000 karakter olabilir" });
      }
      if (await eylemHiziAsildi(offers, offers.buyerId, offers.createdAt, userId, 30, 60 * 60 * 1e3)) {
        return res.status(429).json({ message: "\xC7ok fazla teklif verdiniz. L\xFCtfen biraz bekleyin." });
      }
      const [listing] = await db.select().from(listings).where(eq7(listings.id, listingId)).limit(1);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      if (listing.sellerId === userId) {
        return res.status(400).json({ message: "Cannot make an offer on your own listing" });
      }
      if (!listing.allowOffers) {
        return res.status(400).json({ message: "This listing does not accept offers" });
      }
      if (listing.isExampleListing) {
        return res.status(403).json({
          message: "\xD6rnek ilanlara teklif verilemez. Bu ilan sadece \xF6rnek ama\xE7l\u0131d\u0131r."
        });
      }
      const [existingOffer] = await db.select().from(offers).where(
        and6(
          eq7(offers.listingId, listingId),
          eq7(offers.buyerId, userId),
          eq7(offers.status, "pending")
        )
      ).limit(1);
      if (existingOffer) {
        return res.status(400).json({ message: "You already have a pending offer on this listing" });
      }
      const [newOffer] = await db.insert(offers).values({
        listingId,
        buyerId: userId,
        sellerId: listing.sellerId,
        amount: numericAmount.toString(),
        message,
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
        // 7 days default
      }).returning();
      try {
        await db.insert(notifications).values({
          userId: listing.sellerId,
          type: "system",
          title: "Yeni Teklif",
          message: `${listing.title} ilan\u0131n\u0131za \u20BA${numericAmount.toLocaleString("tr-TR")} teklif geldi`,
          link: `/ilan/${listing.id}`,
          relatedId: newOffer.id
        });
        await olayEpostasiGonder(listing.sellerId, {
          title: "\u0130lan\u0131n\u0131za teklif geldi",
          body: `"${listing.title}" ilan\u0131n\u0131za yeni bir teklif var.`,
          details: [["Teklif", `\u20BA${numericAmount.toLocaleString("tr-TR")}`]],
          actionPath: `/ilan/${listing.id}`,
          actionLabel: "Teklifi G\xF6r\xFCnt\xFCle"
        });
      } catch (notifError) {
        console.error("Failed to create offer notification:", notifError);
      }
      res.status(201).json(newOffer);
    } catch (error) {
      console.error("Failed to create offer:", error);
      res.status(400).json({ message: "Failed to create offer", error });
    }
  });
  app2.patch("/api/offers/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }
      const { status, counterAmount, counterMessage } = req.body;
      if (!["accepted", "rejected", "countered"].includes(status)) {
        return res.status(400).json({ message: "Ge\xE7ersiz yan\u0131t" });
      }
      const [offer] = await db.select().from(offers).where(eq7(offers.id, req.params.id)).limit(1);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      if (offer.sellerId !== userId) {
        return res.status(403).json({ message: "Not authorized to respond to this offer" });
      }
      if (offer.status !== "pending") {
        return res.status(400).json({ message: "Can only respond to pending offers" });
      }
      const updateData = {
        status,
        respondedAt: /* @__PURE__ */ new Date()
      };
      if (status === "countered") {
        let ct = counterAmount;
        if (typeof ct === "string") ct = ct.replace(/\./g, "").replace(/,/g, ".");
        const numericCounter = parseFloat(ct);
        if (!Number.isFinite(numericCounter) || numericCounter <= 0) {
          return res.status(400).json({ message: "Ge\xE7erli bir kar\u015F\u0131 teklif tutar\u0131 girin" });
        }
        if (numericCounter > 9999999999e-2) {
          return res.status(400).json({ message: "Kar\u015F\u0131 teklif en fazla 99.999.999,99 TL olabilir" });
        }
        updateData.counterAmount = numericCounter.toString();
        updateData.counterMessage = counterMessage;
      }
      const [updatedOffer] = await db.update(offers).set(updateData).where(eq7(offers.id, req.params.id)).returning();
      const [listing] = await db.select().from(listings).where(eq7(listings.id, offer.listingId)).limit(1);
      try {
        let notifMessage = "";
        if (status === "accepted") {
          notifMessage = `${listing?.title} ilan\u0131ndaki teklifiniz kabul edildi!`;
        } else if (status === "rejected") {
          notifMessage = `${listing?.title} ilan\u0131ndaki teklifiniz reddedildi`;
        } else if (status === "countered") {
          notifMessage = `${listing?.title} ilan\u0131nda \u20BA${counterAmount} kar\u015F\u0131 teklif geldi`;
        }
        await db.insert(notifications).values({
          userId: offer.buyerId,
          type: "system",
          title: status === "accepted" ? "Teklif Kabul Edildi" : status === "countered" ? "Kar\u015F\u0131 Teklif" : "Teklif Yan\u0131t\u0131",
          message: notifMessage,
          link: `/ilan/${offer.listingId}`,
          relatedId: offer.id
        });
      } catch (notifError) {
        console.error("Failed to create offer response notification:", notifError);
      }
      res.json(updatedOffer);
    } catch (error) {
      console.error("Failed to update offer:", error);
      res.status(400).json({ message: "Failed to update offer", error });
    }
  });
  app2.delete("/api/offers/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }
      const [offer] = await db.select().from(offers).where(eq7(offers.id, req.params.id)).limit(1);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      if (offer.buyerId !== userId) {
        return res.status(403).json({ message: "Not authorized to withdraw this offer" });
      }
      if (offer.status !== "pending") {
        return res.status(400).json({ message: "Can only withdraw pending offers" });
      }
      await db.update(offers).set({ status: "withdrawn" }).where(eq7(offers.id, req.params.id));
      res.json({ message: "Offer withdrawn" });
    } catch (error) {
      console.error("Failed to withdraw offer:", error);
      res.status(400).json({ message: "Failed to withdraw offer", error });
    }
  });
  app2.post("/api/listings/:id/share", async (req, res) => {
    try {
      await db.update(listings).set({ shareCount: sql6`COALESCE(share_count, 0) + 1` }).where(eq7(listings.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to track share:", error);
      res.status(400).json({ message: "Failed to track share" });
    }
  });
  app2.get("/api/listings/:id/compare", async (req, res) => {
    try {
      const [listing] = await db.select().from(listings).where(eq7(listings.id, req.params.id)).limit(1);
      if (!listing || listing.status !== "active") {
        return res.status(404).json({ message: "Listing not found" });
      }
      const similarListings = await db.select({
        id: listings.id,
        title: listings.title,
        price: listings.price,
        images: listings.images,
        city: listings.city,
        breed: listings.breed,
        age: listings.age,
        views: listings.views,
        createdAt: listings.createdAt
      }).from(listings).where(
        and6(
          eq7(listings.categoryId, listing.categoryId),
          eq7(listings.status, "active"),
          sql6`${listings.id} != ${listing.id}`
        )
      ).orderBy(sql6`ABS(CAST(${listings.price} AS DECIMAL) - CAST(${listing.price} AS DECIMAL))`).limit(6);
      const allPrices = [parseFloat(listing.price), ...similarListings.map((l) => parseFloat(l.price))];
      const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      res.json({
        currentListing: {
          id: listing.id,
          price: listing.price,
          pricePosition: parseFloat(listing.price) < avgPrice ? "below_avg" : parseFloat(listing.price) > avgPrice ? "above_avg" : "average"
        },
        similarListings,
        priceStats: {
          average: avgPrice.toFixed(2),
          min: minPrice.toFixed(2),
          max: maxPrice.toFixed(2),
          count: allPrices.length
        }
      });
    } catch (error) {
      console.error("Failed to get price comparison:", error);
      res.status(500).json({ message: "Failed to get price comparison" });
    }
  });
  app2.post("/api/objects/upload", createLimiter, isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      console.log("Upload URL generated:", { uploadURL: uploadURL.substring(0, 80) + "...", normalizedPath });
      res.json({ uploadURL, normalizedPath });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });
  app2.post("/api/objects/upload-file", createLimiter, isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Dosya gerekli" });
      }
      console.log("Received file upload:", {
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = await objectStorageService.uploadFileBuffer(
        req.file.buffer,
        req.file.mimetype
      );
      console.log("File uploaded successfully:", normalizedPath);
      res.json({ normalizedPath });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Dosya y\xFCklenemedi" });
    }
  });
  app2.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });
  app2.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/listing-images/upload", createLimiter, isAuthenticated, upload.array("images", 10), async (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "En az bir g\xF6rsel y\xFCklemeniz gerekmektedir." });
      }
      const listingId = req.body.listingId;
      if (listingId) {
        const [listing] = await db.select().from(listings).where(eq7(listings.id, listingId)).limit(1);
        if (!listing) {
          return res.status(404).json({ message: "\u0130lan bulunamad\u0131." });
        }
        if (listing.sellerId !== getUserId3(req.user) && req.user.role !== "admin") {
          return res.status(403).json({ message: "Bu ilana g\xF6rsel y\xFCkleme yetkiniz yok." });
        }
      }
      for (const file of files) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          return res.status(400).json({ message: validation.error });
        }
      }
      let currentMaxOrder = 0;
      if (listingId) {
        const maxOrderResult = await db.select({ maxOrder: sql6`COALESCE(MAX(${listingImages.displayOrder}), 0)` }).from(listingImages).where(eq7(listingImages.listingId, listingId));
        currentMaxOrder = maxOrderResult[0]?.maxOrder || 0;
      }
      const uploadedImages = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const processed = await processAndUploadImage(file.buffer, file.originalname, listingId);
          const [imageRecord] = await db.insert(listingImages).values({
            listingId: listingId || null,
            originalKey: processed.originalKey,
            thumbnailKey: processed.thumbnailKey,
            mediumKey: processed.mediumKey,
            largeKey: processed.largeKey,
            originalUrl: processed.originalUrl,
            thumbnailUrl: processed.thumbnailUrl,
            mediumUrl: processed.mediumUrl,
            largeUrl: processed.largeUrl,
            width: processed.width,
            height: processed.height,
            fileSize: processed.fileSize,
            mimeType: processed.mimeType,
            displayOrder: currentMaxOrder + i + 1,
            isCover: i === 0 && currentMaxOrder === 0,
            status: "ready"
          }).returning();
          uploadedImages.push(imageRecord);
        } catch (err) {
          console.error(`Error processing image ${file.originalname}:`, err);
        }
      }
      res.json({
        message: `${uploadedImages.length} g\xF6rsel ba\u015Far\u0131yla y\xFCklendi.`,
        images: uploadedImages
      });
    } catch (error) {
      console.error("Error uploading listing images:", error);
      res.status(500).json({ message: "G\xF6rsel y\xFCklenirken bir hata olu\u015Ftu." });
    }
  });
  app2.get("/api/listing-images/:listingId", async (req, res) => {
    try {
      const cacheKey = `listing_images:${req.params.listingId}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        res.set({
          "Cache-Control": "public, max-age=300, s-maxage=600",
          // 5min browser, 10min CDN
          "CDN-Cache-Control": "public, max-age=600",
          "Vary": "Accept-Encoding"
        });
        return res.json(cached);
      }
      const images = await db.select().from(listingImages).where(eq7(listingImages.listingId, req.params.listingId)).orderBy(listingImages.displayOrder);
      await cache.set(cacheKey, images, 300);
      res.set({
        "Cache-Control": "public, max-age=300, s-maxage=600",
        "CDN-Cache-Control": "public, max-age=600",
        "Vary": "Accept-Encoding"
      });
      res.json(images);
    } catch (error) {
      console.error("Error fetching listing images:", error);
      res.status(500).json({ message: "G\xF6rseller getirilemedi." });
    }
  });
  app2.delete("/api/listing-images/:imageId", isAuthenticated, async (req, res) => {
    try {
      const [image] = await db.select().from(listingImages).where(eq7(listingImages.id, req.params.imageId)).limit(1);
      if (!image) {
        return res.status(404).json({ message: "G\xF6rsel bulunamad\u0131." });
      }
      if (image.listingId) {
        const [listing] = await db.select().from(listings).where(eq7(listings.id, image.listingId)).limit(1);
        if (listing && listing.sellerId !== getUserId3(req.user) && req.user.role !== "admin") {
          return res.status(403).json({ message: "Bu g\xF6rseli silme yetkiniz yok." });
        }
      }
      const keysToDelete = [
        image.originalKey,
        image.thumbnailKey,
        image.mediumKey,
        image.largeKey
      ].filter(Boolean);
      await deleteImageVariants(keysToDelete);
      await db.delete(listingImages).where(eq7(listingImages.id, req.params.imageId));
      res.json({ message: "G\xF6rsel ba\u015Far\u0131yla silindi." });
    } catch (error) {
      console.error("Error deleting listing image:", error);
      res.status(500).json({ message: "G\xF6rsel silinirken bir hata olu\u015Ftu." });
    }
  });
  app2.patch("/api/listing-images/reorder", isAuthenticated, async (req, res) => {
    try {
      const { listingId, imageIds } = req.body;
      if (!listingId || !Array.isArray(imageIds)) {
        return res.status(400).json({ message: "Ge\xE7ersiz istek." });
      }
      const [listing] = await db.select().from(listings).where(eq7(listings.id, listingId)).limit(1);
      if (!listing) {
        return res.status(404).json({ message: "\u0130lan bulunamad\u0131." });
      }
      if (listing.sellerId !== getUserId3(req.user) && req.user.role !== "admin") {
        return res.status(403).json({ message: "Yetkiniz yok." });
      }
      for (let i = 0; i < imageIds.length; i++) {
        await db.update(listingImages).set({ displayOrder: i }).where(and6(
          eq7(listingImages.id, imageIds[i]),
          eq7(listingImages.listingId, listingId)
        ));
      }
      res.json({ message: "G\xF6rsel s\u0131ralamas\u0131 g\xFCncellendi." });
    } catch (error) {
      console.error("Error reordering images:", error);
      res.status(500).json({ message: "S\u0131ralama g\xFCncellenirken bir hata olu\u015Ftu." });
    }
  });
  app2.patch("/api/listing-images/:imageId/cover", isAuthenticated, async (req, res) => {
    try {
      const [image] = await db.select().from(listingImages).where(eq7(listingImages.id, req.params.imageId)).limit(1);
      if (!image || !image.listingId) {
        return res.status(404).json({ message: "G\xF6rsel bulunamad\u0131." });
      }
      const [listing] = await db.select().from(listings).where(eq7(listings.id, image.listingId)).limit(1);
      if (!listing) {
        return res.status(404).json({ message: "\u0130lan bulunamad\u0131." });
      }
      if (listing.sellerId !== getUserId3(req.user) && req.user.role !== "admin") {
        return res.status(403).json({ message: "Yetkiniz yok." });
      }
      await db.update(listingImages).set({ isCover: false }).where(eq7(listingImages.listingId, image.listingId));
      await db.update(listingImages).set({ isCover: true }).where(eq7(listingImages.id, req.params.imageId));
      res.json({ message: "Kapak g\xF6rseli g\xFCncellendi." });
    } catch (error) {
      console.error("Error setting cover image:", error);
      res.status(500).json({ message: "Kapak g\xF6rseli g\xFCncellenirken bir hata olu\u015Ftu." });
    }
  });
  app2.post("/api/listings/draft", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      const sellerId = getUserId3(user);
      let sanitizedPrice = "0";
      if (req.body.price) {
        const priceStr = String(req.body.price).replace(/\./g, "").replace(/,/g, ".");
        const priceNum = parseFloat(priceStr);
        if (!isNaN(priceNum) && priceNum >= 0 && priceNum <= 9999999999e-2) {
          sanitizedPrice = priceNum.toFixed(2);
        }
      }
      const draftData = {
        sellerId,
        categoryId: req.body.categoryId || null,
        title: req.body.title || "Taslak \u0130lan",
        description: req.body.description || "",
        price: sanitizedPrice,
        city: req.body.city || "",
        district: req.body.district || "",
        status: "draft",
        images: req.body.images || [],
        videoUrls: req.body.videoUrls || [],
        categoryAttributes: req.body.categoryAttributes || {},
        breed: req.body.breed || null,
        ageCategory: req.body.ageCategory || null,
        gender: req.body.gender || null,
        healthStatus: req.body.healthStatus || null,
        vaccinated: req.body.vaccinated || false,
        neutered: req.body.neutered || false,
        pedigree: req.body.pedigree || false,
        characterTraits: req.body.characterTraits || [],
        deliveryInfo: req.body.deliveryInfo || null,
        warrantyInfo: req.body.warrantyInfo || null
      };
      const [listing] = await db.insert(listings).values(draftData).returning();
      res.status(201).json({
        message: "Taslak olu\u015Fturuldu",
        listing
      });
    } catch (error) {
      console.error("Failed to create draft listing:", error);
      res.status(500).json({ message: "Taslak olu\u015Fturulamad\u0131" });
    }
  });
  app2.patch("/api/listings/:listingId/draft", isAuthenticated, async (req, res) => {
    try {
      const { listingId } = req.params;
      const sellerId = getUserId3(req.user);
      const [listing] = await db.select().from(listings).where(eq7(listings.id, listingId)).limit(1);
      if (!listing) {
        return res.status(404).json({ message: "\u0130lan bulunamad\u0131" });
      }
      if (listing.sellerId !== sellerId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Bu ilan\u0131 d\xFCzenleme yetkiniz yok" });
      }
      if (listing.status !== "draft") {
        return res.status(400).json({ message: "Sadece taslak ilanlar bu \u015Fekilde g\xFCncellenebilir" });
      }
      const updateData = { updatedAt: /* @__PURE__ */ new Date() };
      const allowedFields = [
        "categoryId",
        "title",
        "description",
        "city",
        "district",
        "images",
        "videoUrls",
        "categoryAttributes",
        "breed",
        "ageCategory",
        "gender",
        "healthStatus",
        "vaccinated",
        "neutered",
        "pedigree",
        "characterTraits",
        "deliveryInfo",
        "warrantyInfo"
      ];
      for (const field of allowedFields) {
        if (req.body[field] !== void 0) {
          updateData[field] = req.body[field];
        }
      }
      if (req.body.price !== void 0) {
        const priceStr = String(req.body.price).replace(/\./g, "").replace(/,/g, ".");
        const priceNum = parseFloat(priceStr);
        if (!isNaN(priceNum) && priceNum >= 0 && priceNum <= 9999999999e-2) {
          updateData.price = priceNum.toFixed(2);
        }
      }
      const [updatedListing] = await db.update(listings).set(updateData).where(eq7(listings.id, listingId)).returning();
      res.json({
        message: "Taslak g\xFCncellendi",
        listing: updatedListing
      });
    } catch (error) {
      console.error("Failed to update draft listing:", error);
      res.status(500).json({ message: "Taslak g\xFCncellenemedi" });
    }
  });
  app2.get("/api/listings/drafts", isAuthenticated, async (req, res) => {
    try {
      const sellerId = getUserId3(req.user);
      const drafts = await db.select().from(listings).where(and6(
        eq7(listings.sellerId, sellerId),
        eq7(listings.status, "draft")
      )).orderBy(desc5(listings.updatedAt));
      res.json(drafts);
    } catch (error) {
      console.error("Failed to fetch draft listings:", error);
      res.status(500).json({ message: "Taslaklar getirilemedi" });
    }
  });
  app2.post("/api/listings/:listingId/publish", isAuthenticated, createLimiter, botGuard, async (req, res) => {
    try {
      const { listingId } = req.params;
      const sellerId = getUserId3(req.user);
      const user = req.user;
      const [listing] = await db.select().from(listings).where(eq7(listings.id, listingId)).limit(1);
      if (!listing) {
        return res.status(404).json({ message: "\u0130lan bulunamad\u0131" });
      }
      if (listing.sellerId !== sellerId) {
        return res.status(403).json({ message: "Bu ilan\u0131 yay\u0131nlama yetkiniz yok" });
      }
      if (listing.status !== "draft") {
        return res.status(400).json({ message: "Bu ilan zaten yay\u0131nlanm\u0131\u015F" });
      }
      if (!listing.categoryId || !listing.title || listing.title === "Taslak \u0130lan") {
        return res.status(400).json({ message: "L\xFCtfen kategori ve ba\u015Fl\u0131k alanlar\u0131n\u0131 doldurun" });
      }
      if (!listing.description || listing.description.length < 20) {
        return res.status(400).json({ message: "A\xE7\u0131klama en az 20 karakter olmal\u0131d\u0131r" });
      }
      if (!listing.city || !listing.district) {
        return res.status(400).json({ message: "Konum bilgisi gereklidir" });
      }
      if (process.env.NODE_ENV === "production" && !await isEmailVerified(user)) {
        return res.status(403).json({
          message: "\u0130lan yay\u0131nlamak i\xE7in email adresinizi do\u011Frulaman\u0131z gerekmektedir.",
          requiresVerification: true
        });
      }
      const newStatus = process.env.NODE_ENV === "production" ? "pending" : "active";
      const [publishedListing] = await db.update(listings).set({
        status: newStatus,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq7(listings.id, listingId)).returning();
      await db.update(users).set({
        totalListings: sql6`${users.totalListings} + 1`
      }).where(eq7(users.id, sellerId));
      res.json({
        message: newStatus === "pending" ? "\u0130lan\u0131n\u0131z yay\u0131nland\u0131 ve onay bekliyor" : "\u0130lan\u0131n\u0131z ba\u015Far\u0131yla yay\u0131nland\u0131",
        listing: publishedListing
      });
    } catch (error) {
      console.error("Failed to publish listing:", error);
      res.status(500).json({ message: "\u0130lan yay\u0131nlanamad\u0131" });
    }
  });
  app2.post("/api/reports", isAuthenticated, createLimiter, async (req, res) => {
    try {
      const data = insertReportSchema.parse({
        ...req.body,
        reporterId: getUserId3(req.user)
      });
      const [report] = await db.insert(reports).values(data).returning();
      res.status(201).json(report);
    } catch (error) {
      console.error("Failed to create report:", error);
      res.status(400).json({ message: "\u015Eikayet olu\u015Fturulamad\u0131", error });
    }
  });
  app2.get("/api/reports/my", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const userReports = await db.select().from(reports).where(eq7(reports.reporterId, userId)).orderBy(desc5(reports.createdAt));
      res.json(userReports);
    } catch (error) {
      console.error("Failed to fetch user reports:", error);
      res.status(500).json({ message: "\u015Eikayetler getirilemedi" });
    }
  });
  app2.get("/api/admin/reports", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin yetkisi gereklidir" });
      }
      const status = req.query.status;
      let query = db.select().from(reports);
      if (status && status !== "all") {
        query = query.where(eq7(reports.status, status));
      }
      const allReports = await query.orderBy(desc5(reports.createdAt));
      res.json(allReports);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      res.status(500).json({ message: "\u015Eikayetler getirilemedi" });
    }
  });
  app2.patch("/api/admin/reports/:id", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin yetkisi gereklidir" });
      }
      const reportId = req.params.id;
      const { status, adminNotes } = req.body;
      const updateData = {};
      if (status) updateData.status = status;
      if (adminNotes !== void 0) updateData.adminNotes = adminNotes;
      if (status === "resolved" || status === "dismissed") {
        updateData.resolvedAt = /* @__PURE__ */ new Date();
        updateData.resolvedBy = getUserId3(req.user);
      }
      const [updatedReport] = await db.update(reports).set(updateData).where(eq7(reports.id, reportId)).returning();
      if (!updatedReport) {
        return res.status(404).json({ message: "\u015Eikayet bulunamad\u0131" });
      }
      res.json(updatedReport);
    } catch (error) {
      console.error("Failed to update report:", error);
      res.status(500).json({ message: "\u015Eikayet g\xFCncellenemedi" });
    }
  });
  app2.post("/api/admin/verify-pin", pinAttemptLimiter, isAuthenticated, adminRoleMiddleware, async (req, res) => {
    try {
      const { pin } = req.body;
      const adminPin = process.env.ADMIN_PANEL_PIN;
      if (!adminPin) {
        console.error("ADMIN_PANEL_PIN tan\u0131ml\u0131 de\u011Fil \u2014 admin paneli eri\u015Fimi kapal\u0131.");
        return res.status(503).json({
          message: "Admin paneli yap\u0131land\u0131r\u0131lmam\u0131\u015F. Sunucu y\xF6neticisiyle g\xF6r\xFC\u015F\xFCn."
        });
      }
      if (!pin || typeof pin !== "string") {
        return res.status(400).json({ message: "PIN kodu gereklidir" });
      }
      const given = Buffer.from(String(pin));
      const expected = Buffer.from(adminPin);
      const pinMatches = given.length === expected.length && timingSafeEqual(given, expected);
      if (!pinMatches) {
        console.log(`Admin PIN verification failed for user: ${getUserId3(req.user)}`);
        return res.status(401).json({ message: "Ge\xE7ersiz PIN kodu" });
      }
      req.session.adminPinVerified = true;
      console.log(`Admin PIN verified for user: ${getUserId3(req.user)}`);
      res.json({ success: true, message: "PIN do\u011Fruland\u0131" });
    } catch (error) {
      console.error("Admin PIN verification error:", error);
      res.status(500).json({ message: "Do\u011Frulama hatas\u0131" });
    }
  });
  app2.get("/api/admin/pin-status", isAuthenticated, adminRoleMiddleware, (req, res) => {
    const session2 = req.session;
    res.json({ verified: !!session2.adminPinVerified });
  });
  app2.get("/api/admin/users/:id/activity", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const [kullanici] = await db.select({ id: users.id, createdAt: users.createdAt }).from(users).where(eq7(users.id, id)).limit(1);
      if (!kullanici) {
        return res.status(404).json({ message: "Kullan\u0131c\u0131 bulunamad\u0131" });
      }
      const girisler = await db.select({
        id: loginHistory.id,
        method: loginHistory.loginMethod,
        ipAddress: loginHistory.ipAddress,
        userAgent: loginHistory.userAgent,
        success: loginHistory.success,
        failureReason: loginHistory.failureReason,
        createdAt: loginHistory.createdAt
      }).from(loginHistory).where(eq7(loginHistory.userId, id)).orderBy(desc5(loginHistory.createdAt)).limit(25);
      const [basarisiz] = await db.select({ n: count() }).from(loginHistory).where(and6(eq7(loginHistory.userId, id), eq7(loginHistory.success, false)));
      const ilanDurumlari = await db.select({ status: listings.status, n: count() }).from(listings).where(eq7(listings.sellerId, id)).groupBy(listings.status);
      res.json({
        // Ham user-agent yerine okunabilir cihaz bilgisi döndürülüyor.
        logins: girisler.map((g) => {
          const { userAgent, ...kalan } = g;
          return { ...kalan, device: parseUserAgent(userAgent ?? void 0) };
        }),
        failedLoginCount: Number(basarisiz?.n ?? 0),
        listingsByStatus: Object.fromEntries(ilanDurumlari.map((s) => [s.status ?? "bilinmiyor", Number(s.n)])),
        memberSince: kullanici.createdAt
      });
    } catch (error) {
      console.error("Kullan\u0131c\u0131 aktivitesi al\u0131namad\u0131:", error);
      res.status(500).json({ message: "Aktivite ge\xE7mi\u015Fi al\u0131namad\u0131" });
    }
  });
  async function kategoriOnbelleginiTemizle() {
    await Promise.all([
      cache.del(cacheKeys.categories()),
      cache.del(cacheKeys.categoryTree()),
      cache.del(cacheKeys.categoryStats())
    ]).catch(() => {
    });
  }
  async function benzersizSlug(taban, haricId) {
    const kok = slugify(taban) || "kategori";
    for (let i = 1; i < 200; i++) {
      const aday = i === 1 ? kok : `${kok}-${i}`;
      const [carpisan] = await db.select({ id: categories.id }).from(categories).where(eq7(categories.slug, aday)).limit(1);
      if (!carpisan || carpisan.id === haricId) return aday;
    }
    return `${kok}-${Date.now()}`;
  }
  async function altDallar(kokId) {
    const hepsi = await db.select({ id: categories.id, parentId: categories.parentId }).from(categories);
    const cocuklar = /* @__PURE__ */ new Map();
    for (const c of hepsi) {
      if (!c.parentId) continue;
      cocuklar.set(c.parentId, [...cocuklar.get(c.parentId) || [], c.id]);
    }
    const sonuc = [];
    const yigin = [...cocuklar.get(kokId) || []];
    while (yigin.length) {
      const id = yigin.pop();
      sonuc.push(id);
      yigin.push(...cocuklar.get(id) || []);
    }
    return sonuc;
  }
  async function agaciYenidenHesapla(kokId) {
    const kuyruk = [kokId];
    while (kuyruk.length) {
      const id = kuyruk.shift();
      const [dugum] = await db.select().from(categories).where(eq7(categories.id, id)).limit(1);
      if (!dugum) continue;
      let derinlik = 0;
      let yol = [];
      if (dugum.parentId) {
        const [ebeveyn] = await db.select({ depth: categories.depth, path: categories.path, id: categories.id }).from(categories).where(eq7(categories.id, dugum.parentId)).limit(1);
        if (ebeveyn) {
          derinlik = (ebeveyn.depth ?? 0) + 1;
          yol = [...ebeveyn.path || [], ebeveyn.id];
        }
      }
      if (derinlik !== dugum.depth || JSON.stringify(yol) !== JSON.stringify(dugum.path)) {
        await db.update(categories).set({ depth: derinlik, path: yol }).where(eq7(categories.id, id));
      }
      const cocuklar = await db.select({ id: categories.id }).from(categories).where(eq7(categories.parentId, id));
      kuyruk.push(...cocuklar.map((c) => c.id));
    }
  }
  app2.post("/api/admin/categories", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { name, slug, parentId, icon, description, order } = req.body;
      if (!name || typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({ message: "Kategori ad\u0131 en az 2 karakter olmal\u0131d\u0131r" });
      }
      let derinlik = 0;
      let yol = [];
      if (parentId) {
        const [ebeveyn] = await db.select().from(categories).where(eq7(categories.id, parentId)).limit(1);
        if (!ebeveyn) return res.status(400).json({ message: "\xDCst kategori bulunamad\u0131" });
        derinlik = (ebeveyn.depth ?? 0) + 1;
        yol = [...ebeveyn.path || [], ebeveyn.id];
      }
      const [yeni] = await db.insert(categories).values({
        name: name.trim(),
        slug: await benzersizSlug(slug || name),
        parentId: parentId || null,
        icon: icon || null,
        description: description || null,
        order: Number.isFinite(Number(order)) ? Number(order) : 0,
        depth: derinlik,
        path: yol
      }).returning();
      await kategoriOnbelleginiTemizle();
      res.status(201).json(yeni);
    } catch (error) {
      console.error("Kategori olu\u015Fturulamad\u0131:", error);
      res.status(500).json({ message: "Kategori olu\u015Fturulamad\u0131" });
    }
  });
  app2.patch("/api/admin/categories/:id", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, slug, parentId, icon, description, order } = req.body;
      const [mevcut] = await db.select().from(categories).where(eq7(categories.id, id)).limit(1);
      if (!mevcut) return res.status(404).json({ message: "Kategori bulunamad\u0131" });
      const ebeveynDegisti = parentId !== void 0 && (parentId || null) !== mevcut.parentId;
      if (ebeveynDegisti && parentId) {
        if (parentId === id) {
          return res.status(400).json({ message: "Bir kategori kendi alt kategorisi olamaz" });
        }
        const altlar = await altDallar(id);
        if (altlar.includes(parentId)) {
          return res.status(400).json({ message: "Bir kategori kendi alt dal\u0131n\u0131n alt\u0131na ta\u015F\u0131namaz" });
        }
        const [ebeveyn] = await db.select({ id: categories.id }).from(categories).where(eq7(categories.id, parentId)).limit(1);
        if (!ebeveyn) return res.status(400).json({ message: "\xDCst kategori bulunamad\u0131" });
      }
      const guncelleme = {};
      if (name !== void 0) guncelleme.name = String(name).trim();
      if (slug !== void 0) guncelleme.slug = await benzersizSlug(slug || name || mevcut.name, id);
      if (parentId !== void 0) guncelleme.parentId = parentId || null;
      if (icon !== void 0) guncelleme.icon = icon || null;
      if (description !== void 0) guncelleme.description = description || null;
      if (order !== void 0 && Number.isFinite(Number(order))) guncelleme.order = Number(order);
      if (Object.keys(guncelleme).length === 0) {
        return res.status(400).json({ message: "G\xFCncellenecek alan verilmedi" });
      }
      const [guncel] = await db.update(categories).set(guncelleme).where(eq7(categories.id, id)).returning();
      if (ebeveynDegisti) await agaciYenidenHesapla(id);
      await kategoriOnbelleginiTemizle();
      res.json(guncel);
    } catch (error) {
      console.error("Kategori g\xFCncellenemedi:", error);
      res.status(500).json({ message: "Kategori g\xFCncellenemedi" });
    }
  });
  app2.delete("/api/admin/categories/:id", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const [mevcut] = await db.select().from(categories).where(eq7(categories.id, id)).limit(1);
      if (!mevcut) return res.status(404).json({ message: "Kategori bulunamad\u0131" });
      const [cocuk] = await db.select({ id: categories.id }).from(categories).where(eq7(categories.parentId, id)).limit(1);
      if (cocuk) {
        return res.status(409).json({
          message: "Bu kategorinin alt kategorileri var. \xD6nce onlar\u0131 silin veya ba\u015Fka bir kategoriye ta\u015F\u0131y\u0131n."
        });
      }
      const [{ n }] = await db.select({ n: count() }).from(listings).where(eq7(listings.categoryId, id));
      if (Number(n) > 0) {
        return res.status(409).json({
          message: `Bu kategoride ${n} ilan var. Kategori silinemez; \xF6nce ilanlar\u0131 ba\u015Fka kategoriye ta\u015F\u0131y\u0131n.`
        });
      }
      await db.delete(categories).where(eq7(categories.id, id));
      await kategoriOnbelleginiTemizle();
      res.json({ success: true, message: `"${mevcut.name}" kategorisi silindi` });
    } catch (error) {
      console.error("Kategori silinemedi:", error);
      res.status(500).json({ message: "Kategori silinemedi" });
    }
  });
  app2.get("/api/admin/stats", isAuthenticated, adminMiddleware, async (_req, res) => {
    try {
      const cacheKey = cacheKeys.adminStats();
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      const todayStart = /* @__PURE__ */ new Date();
      todayStart.setHours(0, 0, 0, 0);
      const weekStart = /* @__PURE__ */ new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const [
        usersCount,
        listingsCount,
        activeListings,
        pendingListings,
        verifiedUsers,
        storesCount,
        pendingStores,
        pendingReports,
        todayListings,
        todayUsers,
        lastWeekUsers
      ] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(listings),
        db.select({ count: count() }).from(listings).where(eq7(listings.status, "active")),
        db.select({ count: count() }).from(listings).where(eq7(listings.status, "pending")),
        db.select({ count: count() }).from(users).where(eq7(users.emailVerified, true)),
        db.select({ count: count() }).from(stores),
        db.select({ count: count() }).from(stores).where(eq7(stores.status, "pending")),
        db.select({ count: count() }).from(reports).where(eq7(reports.status, "pending")),
        db.select({ count: count() }).from(listings).where(gte2(listings.createdAt, todayStart)),
        db.select({ count: count() }).from(users).where(gte2(users.createdAt, todayStart)),
        db.select({ count: count() }).from(users).where(gte2(users.createdAt, weekStart))
      ]);
      const totalUsersNum = Number(usersCount[0].count);
      const lastWeekUsersNum = Number(lastWeekUsers[0].count);
      const weeklyGrowth = totalUsersNum > 0 ? Math.round(lastWeekUsersNum / totalUsersNum * 100) : 0;
      const stats = {
        totalUsers: totalUsersNum,
        verifiedUsers: Number(verifiedUsers[0].count),
        totalListings: Number(listingsCount[0].count),
        activeListings: Number(activeListings[0].count),
        pendingListings: Number(pendingListings[0].count),
        totalStores: Number(storesCount[0].count),
        pendingStores: Number(pendingStores[0].count),
        pendingReports: Number(pendingReports[0].count),
        todayListings: Number(todayListings[0].count),
        todayUsers: Number(todayUsers[0].count),
        weeklyGrowth
      };
      await cache.set(cacheKey, stats, cacheTTL.adminStats);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "\u0130statistikler getirilemedi" });
    }
  });
  app2.get("/api/admin/listings", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { status } = req.query;
      const conditions = [];
      if (status && status !== "all") {
        conditions.push(eq7(listings.status, status));
      }
      const allListings = await db.select({
        id: listings.id,
        title: listings.title,
        description: listings.description,
        price: listings.price,
        categoryId: listings.categoryId,
        images: listings.images,
        city: listings.city,
        district: listings.district,
        status: listings.status,
        createdAt: listings.createdAt,
        moderatedAt: listings.moderatedAt,
        moderationReason: listings.moderationReason,
        sellerId: listings.sellerId,
        sellerUsername: users.username,
        sellerEmail: users.email,
        sellerIsVerified: users.emailVerified
      }).from(listings).leftJoin(users, eq7(listings.sellerId, users.id)).where(conditions.length > 0 ? and6(...conditions) : void 0).orderBy(desc5(listings.createdAt)).limit(100);
      res.json(allListings);
    } catch (error) {
      console.error("Error fetching listings for admin:", error);
      res.status(500).json({ message: "\u0130lanlar getirilemedi" });
    }
  });
  app2.patch("/api/admin/listings/:id/status", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const validationResult = moderateListingSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Ge\xE7ersiz istek",
          errors: validationResult.error.errors
        });
      }
      const { status, reason } = validationResult.data;
      const [listing] = await db.select().from(listings).where(eq7(listings.id, req.params.id)).limit(1);
      if (!listing) {
        return res.status(404).json({ message: "\u0130lan bulunamad\u0131" });
      }
      const IZINLI_GECISLER = {
        pending: ["active", "rejected"],
        // onayla / reddet
        active: ["rejected"],
        // yayından kaldır
        rejected: ["active"]
        // itiraz üzerine geri aç
      };
      const izinli = IZINLI_GECISLER[listing.status ?? ""] ?? [];
      if (!izinli.includes(status)) {
        return res.status(400).json({
          message: `"${listing.status}" durumundaki bir ilan "${status}" yap\u0131lamaz.`
        });
      }
      const [updated] = await db.update(listings).set({
        status,
        moderatedBy: getUserId3(req.user),
        moderatedAt: /* @__PURE__ */ new Date(),
        moderationReason: status === "rejected" ? reason : null
      }).where(eq7(listings.id, req.params.id)).returning();
      try {
        if (status === "active") {
          const [notification] = await db.insert(notifications).values({
            userId: listing.sellerId,
            type: "listing_approved",
            title: "\u0130lan Onayland\u0131",
            message: `"${listing.title}" ilan\u0131n\u0131z onayland\u0131 ve yay\u0131na girdi`,
            link: `/ilan/${listing.id}`,
            relatedId: listing.id
          }).returning();
          notificationEmitter.emit("notification", {
            userId: listing.sellerId,
            notification
          });
          await olayEpostasiGonder(listing.sellerId, {
            title: "\u0130lan\u0131n\u0131z yay\u0131nland\u0131",
            body: `"${listing.title}" ilan\u0131n\u0131z onayland\u0131 ve yay\u0131na girdi.`,
            actionPath: `/ilan/${listing.id}`,
            actionLabel: "\u0130lan\u0131 G\xF6r\xFCnt\xFCle"
          });
        } else if (status === "rejected") {
          const yayindaydi = listing.status === "active";
          const [notification] = await db.insert(notifications).values({
            userId: listing.sellerId,
            type: "listing_rejected",
            title: yayindaydi ? "\u0130lan Yay\u0131ndan Kald\u0131r\u0131ld\u0131" : "\u0130lan Reddedildi",
            message: yayindaydi ? `"${listing.title}" ilan\u0131n\u0131z yay\u0131ndan kald\u0131r\u0131ld\u0131${reason ? `: ${reason}` : ""}` : `"${listing.title}" ilan\u0131n\u0131z reddedildi${reason ? `: ${reason}` : ""}`,
            link: `/ilan/${listing.id}`,
            relatedId: listing.id
          }).returning();
          notificationEmitter.emit("notification", {
            userId: listing.sellerId,
            notification
          });
          await olayEpostasiGonder(listing.sellerId, {
            title: yayindaydi ? "\u0130lan\u0131n\u0131z yay\u0131ndan kald\u0131r\u0131ld\u0131" : "\u0130lan\u0131n\u0131z yay\u0131nlanmad\u0131",
            body: yayindaydi ? `"${listing.title}" ilan\u0131n\u0131z yay\u0131ndan kald\u0131r\u0131ld\u0131.` : `"${listing.title}" ilan\u0131n\u0131z yay\u0131nlanmad\u0131.`,
            details: reason ? [["Gerek\xE7e", reason]] : void 0,
            actionPath: "/panel/ilanlarim",
            actionLabel: "\u0130lanlar\u0131m"
          });
        }
      } catch (notifError) {
        console.error("Failed to create moderation notification:", notifError);
      }
      res.json({
        ...updated,
        message: status === "active" ? "\u0130lan ba\u015Far\u0131yla onayland\u0131" : "\u0130lan reddedildi"
      });
    } catch (error) {
      console.error("Error updating listing status:", error);
      res.status(500).json({ message: "Durum g\xFCncellenemedi" });
    }
  });
  app2.get("/api/admin/users", isAuthenticated, adminMiddleware, async (_req, res) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        role: users.role,
        status: users.status,
        statusChangedAt: users.statusChangedAt,
        statusReason: users.statusReason,
        emailVerified: users.emailVerified,
        profileImageUrl: users.profileImageUrl,
        createdAt: users.createdAt
      }).from(users).orderBy(desc5(users.createdAt)).limit(200);
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users for admin:", error);
      res.status(500).json({ message: "Kullan\u0131c\u0131lar getirilemedi" });
    }
  });
  app2.patch("/api/admin/users/:id/role", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const validRoles = ["buyer", "seller", "vet", "transporter", "admin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Ge\xE7ersiz rol" });
      }
      const [updatedUser] = await db.update(users).set({ role }).where(eq7(users.id, id)).returning();
      if (!updatedUser) {
        return res.status(404).json({ message: "Kullan\u0131c\u0131 bulunamad\u0131" });
      }
      try {
        await db.execute(
          sql6`DELETE FROM sessions WHERE sess #>> '{passport,user,claims,sub}' = ${id}`
        );
        console.log(`\u{1F512} Rol de\u011Fi\u015Fti, oturumlar sonland\u0131r\u0131ld\u0131: ${id} \u2192 ${role}`);
      } catch (sessionErr) {
        console.error("Oturum sonland\u0131rma hatas\u0131:", sessionErr);
      }
      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Rol g\xFCncellenemedi" });
    }
  });
  app2.patch("/api/admin/users/:id/status", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const validStatuses = ["active", "banned", "suspended"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Ge\xE7ersiz durum" });
      }
      const adminId = getUserId3(req.user);
      if (id === adminId) {
        return res.status(400).json({ message: "Kendinizi yasaklayamazs\u0131n\u0131z" });
      }
      const [updatedUser] = await db.update(users).set({
        status,
        statusChangedAt: /* @__PURE__ */ new Date(),
        statusChangedBy: adminId,
        statusReason: reason || null
      }).where(eq7(users.id, id)).returning();
      if (!updatedUser) {
        return res.status(404).json({ message: "Kullan\u0131c\u0131 bulunamad\u0131" });
      }
      if (status !== "active") {
        try {
          await db.execute(
            sql6`DELETE FROM sessions WHERE sess #>> '{passport,user,claims,sub}' = ${id}`
          );
          console.log(`\u{1F512} Oturumlar sonland\u0131r\u0131ld\u0131: ${id} (${status})`);
        } catch (sessionErr) {
          console.error("Oturum sonland\u0131rma hatas\u0131:", sessionErr);
        }
      }
      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Durum g\xFCncellenemedi" });
    }
  });
  app2.get("/api/admin/stores", isAuthenticated, adminMiddleware, async (_req, res) => {
    try {
      const allStores = await db.select({
        id: stores.id,
        name: stores.displayName,
        slug: stores.slug,
        description: stores.description,
        storeType: stores.storeType,
        city: stores.city,
        status: stores.status,
        createdAt: stores.createdAt,
        ownerId: stores.ownerId,
        ownerName: sql6`COALESCE(NULLIF(TRIM(CONCAT(${users.firstName}, ' ', ${users.lastName})), ''), ${users.username})`,
        ownerEmail: users.email
      }).from(stores).leftJoin(users, eq7(stores.ownerId, users.id)).orderBy(desc5(stores.createdAt)).limit(100);
      res.json(allStores);
    } catch (error) {
      console.error("Error fetching stores for admin:", error);
      res.status(500).json({ message: "Ma\u011Fazalar getirilemedi" });
    }
  });
  app2.patch("/api/admin/stores/:id/status", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const ESKI_ADLAR = {
        approved: "active",
        rejected: "closed"
      };
      const status = ESKI_ADLAR[req.body?.status] ?? req.body?.status;
      const GECERLI_DURUMLAR = ["pending", "active", "suspended", "closed"];
      if (!GECERLI_DURUMLAR.includes(status)) {
        return res.status(400).json({ message: "Ge\xE7ersiz durum" });
      }
      const [updatedStore] = await db.update(stores).set({
        status,
        // Onay anı kayda geçer; "doğrulanmış mağaza" göstergesi buna bakar.
        ...status === "active" ? { verifiedAt: /* @__PURE__ */ new Date() } : {},
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq7(stores.id, id)).returning();
      if (!updatedStore) {
        return res.status(404).json({ message: "Ma\u011Faza bulunamad\u0131" });
      }
      try {
        if (status === "active") {
          const [notification] = await db.insert(notifications).values({
            userId: updatedStore.ownerId,
            type: "system",
            title: "Ma\u011Faza Onayland\u0131",
            message: `"${updatedStore.displayName}" ma\u011Fazan\u0131z onayland\u0131`,
            link: `/magaza/${updatedStore.slug}`,
            relatedId: updatedStore.id
          }).returning();
          notificationEmitter.emit("notification", {
            userId: updatedStore.ownerId,
            notification
          });
        } else if (status === "closed" || status === "suspended") {
          const [notification] = await db.insert(notifications).values({
            userId: updatedStore.ownerId,
            type: "system",
            title: status === "suspended" ? "Ma\u011Faza Ask\u0131ya Al\u0131nd\u0131" : "Ma\u011Faza Ba\u015Fvurusu Reddedildi",
            message: status === "suspended" ? `"${updatedStore.displayName}" ma\u011Fazan\u0131z ge\xE7ici olarak yay\u0131ndan kald\u0131r\u0131ld\u0131.` : `"${updatedStore.displayName}" ma\u011Faza ba\u015Fvurunuz onaylanmad\u0131.`,
            // Rota /panel/magazam; /panel/magaza diye bir sayfa yok, eski
            // bağlantı 404'e düşüyordu.
            link: `/panel/magazam`,
            relatedId: updatedStore.id
          }).returning();
          notificationEmitter.emit("notification", {
            userId: updatedStore.ownerId,
            notification
          });
        }
      } catch (notifError) {
        console.error("Failed to create store notification:", notifError);
      }
      res.json(updatedStore);
    } catch (error) {
      console.error("Error updating store status:", error);
      res.status(500).json({ message: "Durum g\xFCncellenemedi" });
    }
  });
  app2.get("/api/admin/blog", isAuthenticated, adminMiddleware, async (_req, res) => {
    try {
      const allBlogs = await db.select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        published: blogPosts.published,
        views: blogPosts.views,
        readTime: blogPosts.readTime,
        categoryTags: blogPosts.categoryTags,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        authorId: blogPosts.authorId,
        authorName: sql6`COALESCE(NULLIF(TRIM(CONCAT(${users.firstName}, ' ', ${users.lastName})), ''), ${users.username})`
      }).from(blogPosts).leftJoin(users, eq7(blogPosts.authorId, users.id)).orderBy(desc5(blogPosts.createdAt));
      res.json(allBlogs);
    } catch (error) {
      console.error("Error fetching admin blog posts:", error);
      res.status(500).json({ message: "Blog yaz\u0131lar\u0131 getirilemedi" });
    }
  });
  app2.post("/api/admin/blog", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const validationResult = insertBlogPostSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Ge\xE7ersiz blog verisi",
          errors: validationResult.error.errors
        });
      }
      const [newBlog] = await db.insert(blogPosts).values({
        ...validationResult.data,
        authorId: getUserId3(req.user)
      }).returning();
      res.status(201).json(newBlog);
    } catch (error) {
      console.error("Error creating blog post:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "Bu slug zaten kullan\u0131mda" });
      }
      res.status(500).json({ message: "Blog yaz\u0131s\u0131 olu\u015Fturulamad\u0131" });
    }
  });
  app2.put("/api/admin/blog/:id", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const validationResult = insertBlogPostSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Ge\xE7ersiz blog verisi",
          errors: validationResult.error.errors
        });
      }
      const [updated] = await db.update(blogPosts).set({
        ...validationResult.data,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq7(blogPosts.id, req.params.id)).returning();
      if (!updated) {
        return res.status(404).json({ message: "Blog yaz\u0131s\u0131 bulunamad\u0131" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating blog post:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "Bu slug zaten kullan\u0131mda" });
      }
      res.status(500).json({ message: "Blog yaz\u0131s\u0131 g\xFCncellenemedi" });
    }
  });
  app2.delete("/api/admin/blog/:id", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const [deleted] = await db.delete(blogPosts).where(eq7(blogPosts.id, req.params.id)).returning();
      if (!deleted) {
        return res.status(404).json({ message: "Blog yaz\u0131s\u0131 bulunamad\u0131" });
      }
      res.json({ message: "Blog yaz\u0131s\u0131 ba\u015Far\u0131yla silindi" });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: "Blog yaz\u0131s\u0131 silinemedi" });
    }
  });
  app2.get("/api/admin/audit-logs", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { level, entity, limit = "100", offset = "0" } = req.query;
      let query = db.select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        action: auditLogs.action,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        level: auditLogs.level,
        createdAt: auditLogs.createdAt
      }).from(auditLogs).$dynamic();
      if (level && level !== "all") {
        query = query.where(eq7(auditLogs.level, level));
      }
      if (entity && entity !== "all") {
        query = query.where(eq7(auditLogs.entity, entity));
      }
      const logs = await query.orderBy(desc5(auditLogs.createdAt)).limit(parseInt(limit)).offset(parseInt(offset));
      const userIds = Array.from(new Set(logs.filter((l) => l.userId).map((l) => l.userId)));
      const userNames = userIds.length > 0 ? await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName }).from(users).where(sql6`${users.id} IN ${userIds}`) : [];
      const userMap = Object.fromEntries(userNames.map((u) => [u.id, `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Anonim"]));
      const logsWithUserNames = logs.map((log) => ({
        ...log,
        userName: log.userId ? userMap[log.userId] || "Bilinmiyor" : "Sistem"
      }));
      res.json(logsWithUserNames);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Log kay\u0131tlar\u0131 getirilemedi" });
    }
  });
  app2.get("/api/admin/audit-logs/stats", isAuthenticated, adminMiddleware, async (_req, res) => {
    try {
      const todayStart = /* @__PURE__ */ new Date();
      todayStart.setHours(0, 0, 0, 0);
      const [totalCount, todayCount, warningCount, errorCount] = await Promise.all([
        db.select({ count: count() }).from(auditLogs),
        db.select({ count: count() }).from(auditLogs).where(gte2(auditLogs.createdAt, todayStart)),
        db.select({ count: count() }).from(auditLogs).where(eq7(auditLogs.level, "warning")),
        db.select({ count: count() }).from(auditLogs).where(eq7(auditLogs.level, "error"))
      ]);
      res.json({
        totalActions: Number(totalCount[0].count),
        todayActions: Number(todayCount[0].count),
        warnings: Number(warningCount[0].count),
        errors: Number(errorCount[0].count)
      });
    } catch (error) {
      console.error("Error fetching audit log stats:", error);
      res.status(500).json({ message: "\u0130statistikler getirilemedi" });
    }
  });
  app2.get("/api/admin/settings", isAuthenticated, adminMiddleware, async (_req, res) => {
    try {
      const settings = await db.select().from(systemSettings).orderBy(systemSettings.category, systemSettings.key);
      const grouped = {};
      for (const setting of settings) {
        if (!grouped[setting.category]) {
          grouped[setting.category] = {};
        }
        grouped[setting.category][setting.key] = setting.value || "";
      }
      res.json(grouped);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Ayarlar getirilemedi" });
    }
  });
  app2.patch("/api/admin/settings", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const updates = req.body;
      for (const [key, value] of Object.entries(updates)) {
        await db.update(systemSettings).set({ value, updatedBy: userId, updatedAt: /* @__PURE__ */ new Date() }).where(eq7(systemSettings.key, key));
      }
      await db.insert(auditLogs).values({
        userId,
        action: "UPDATE",
        entity: "settings",
        details: `Ayarlar g\xFCncellendi: ${Object.keys(updates).join(", ")}`,
        ipAddress: req.ip,
        level: "info"
      });
      res.json({ message: "Ayarlar g\xFCncellendi" });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Ayarlar g\xFCncellenemedi" });
    }
  });
  app2.get("/api/admin/broadcasts", isAuthenticated, adminMiddleware, async (_req, res) => {
    try {
      const broadcasts = await db.select().from(adminBroadcasts).orderBy(desc5(adminBroadcasts.createdAt)).limit(100);
      res.json(broadcasts);
    } catch (error) {
      console.error("Error fetching broadcasts:", error);
      res.status(500).json({ message: "Bildirimler getirilemedi" });
    }
  });
  app2.get("/api/admin/broadcasts/stats", isAuthenticated, adminMiddleware, async (_req, res) => {
    try {
      const allBroadcasts = await db.select().from(adminBroadcasts);
      const totalSent = allBroadcasts.reduce((sum, b) => sum + (b.recipientCount || 0), 0);
      const totalDelivered = allBroadcasts.reduce((sum, b) => sum + (b.deliveredCount || 0), 0);
      const totalOpened = allBroadcasts.reduce((sum, b) => sum + (b.openedCount || 0), 0);
      const pendingCount = allBroadcasts.filter((b) => b.status === "pending").length;
      res.json({
        totalSent,
        deliveryRate: totalSent > 0 ? (totalDelivered / totalSent * 100).toFixed(1) : 0,
        openRate: totalDelivered > 0 ? (totalOpened / totalDelivered * 100).toFixed(1) : 0,
        pendingQueue: pendingCount
      });
    } catch (error) {
      console.error("Error fetching broadcast stats:", error);
      res.status(500).json({ message: "\u0130statistikler getirilemedi" });
    }
  });
  app2.post("/api/admin/broadcasts", isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const { title, content, type, targetAudience } = req.body;
      if (!title || !content) {
        return res.status(400).json({ message: "Ba\u015Fl\u0131k ve i\xE7erik gereklidir" });
      }
      let recipientCount = 0;
      if (targetAudience === "all") {
        const [result] = await db.select({ count: count() }).from(users);
        recipientCount = Number(result.count);
      } else if (targetAudience === "verified") {
        const [result] = await db.select({ count: count() }).from(users).where(eq7(users.emailVerified, true));
        recipientCount = Number(result.count);
      } else if (targetAudience === "sellers") {
        const [result] = await db.select({ count: count() }).from(users).where(eq7(users.role, "seller"));
        recipientCount = Number(result.count);
      } else {
        const [result] = await db.select({ count: count() }).from(users);
        recipientCount = Number(result.count);
      }
      const [broadcast] = await db.insert(adminBroadcasts).values({
        title,
        content,
        type: type || "push",
        targetAudience: targetAudience || "all",
        sentBy: userId,
        recipientCount,
        deliveredCount: recipientCount,
        // Simulated
        status: "sent",
        sentAt: /* @__PURE__ */ new Date()
      }).returning();
      const targetUsers = await db.select({ id: users.id }).from(users).limit(1e3);
      for (const user of targetUsers) {
        await db.insert(notifications).values({
          userId: user.id,
          type: "system",
          title,
          message: content,
          isRead: false
        });
      }
      await db.insert(auditLogs).values({
        userId,
        action: "CREATE",
        entity: "broadcast",
        entityId: broadcast.id,
        details: `Toplu bildirim g\xF6nderildi: "${title}" - ${recipientCount} al\u0131c\u0131`,
        ipAddress: req.ip,
        level: "info"
      });
      res.json(broadcast);
    } catch (error) {
      console.error("Error creating broadcast:", error);
      res.status(500).json({ message: "Bildirim g\xF6nderilemedi" });
    }
  });
  app2.get("/api/stores", async (req, res) => {
    try {
      const { type, city, search, limit = "20", offset = "0" } = req.query;
      let query = db.select({
        id: stores.id,
        slug: stores.slug,
        displayName: stores.displayName,
        storeType: stores.storeType,
        summary: stores.summary,
        logo: stores.logo,
        banner: stores.banner,
        primaryColor: stores.primaryColor,
        city: stores.city,
        rating: stores.rating,
        reviewCount: stores.reviewCount,
        totalListings: stores.totalListings,
        verifiedAt: stores.verifiedAt,
        createdAt: stores.createdAt
      }).from(stores).where(eq7(stores.status, "active")).$dynamic();
      if (type) {
        query = query.where(eq7(stores.storeType, type));
      }
      if (city) {
        query = query.where(eq7(stores.city, city));
      }
      if (search) {
        query = query.where(
          // Türkçe arama — bkz. ilan aramasındaki açıklama.
          sql6`(
            public.tr_normalize(${stores.displayName}) LIKE public.tr_normalize(${`%${search}%`})
            OR public.tr_normalize(coalesce(${stores.summary}, '')) LIKE public.tr_normalize(${`%${search}%`})
          )`
        );
      }
      const storesList = await query.orderBy(desc5(stores.rating), desc5(stores.reviewCount)).limit(parseInt(limit)).offset(parseInt(offset));
      res.json(storesList);
    } catch (error) {
      console.error("Error fetching stores:", error);
      res.status(500).json({ message: "Ma\u011Fazalar getirilemedi" });
    }
  });
  app2.get("/api/store/check-slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      if (!slug || slug.length < 3) {
        return res.json({ available: false, message: "Slug en az 3 karakter olmal\u0131" });
      }
      const existingStore = await db.query.stores.findFirst({
        where: eq7(stores.slug, slug.toLowerCase())
      });
      res.json({
        available: !existingStore,
        message: existingStore ? "Bu URL zaten kullan\u0131l\u0131yor" : "Bu URL kullan\u0131labilir"
      });
    } catch (error) {
      console.error("Error checking slug:", error);
      res.status(500).json({ available: false, message: "Kontrol edilemedi" });
    }
  });
  app2.get("/api/store/:slug", async (req, res) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq7(stores.slug, req.params.slug),
        with: {
          owner: {
            columns: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profileImageUrl: true
            }
          }
        }
      });
      if (!store) {
        return res.status(404).json({ message: "Ma\u011Faza bulunamad\u0131" });
      }
      const izleyiciId = req.user ? getUserId3(req.user) : null;
      const magazaSahibiMi = izleyiciId === store.ownerId || req.user?.role === "admin";
      if (store.status !== "active" && !magazaSahibiMi) {
        return res.status(404).json({ message: "Ma\u011Faza bulunamad\u0131" });
      }
      const storeListingsRaw = await db.select().from(listings).where(and6(
        eq7(listings.storeId, store.id),
        eq7(listings.status, "active")
      )).orderBy(desc5(listings.createdAt)).limit(20);
      const storeListings = storeListingsRaw.map((l) => ilanGizliAlanlariAyikla(l, false));
      const storeReviewsList = await db.select({
        id: storeReviews.id,
        rating: storeReviews.rating,
        title: storeReviews.title,
        comment: storeReviews.comment,
        createdAt: storeReviews.createdAt,
        reviewerId: users.id,
        reviewerFirstName: users.firstName,
        reviewerLastName: users.lastName,
        reviewerProfileImage: users.profileImageUrl
      }).from(storeReviews).leftJoin(users, eq7(storeReviews.reviewerId, users.id)).where(and6(
        eq7(storeReviews.storeId, store.id),
        eq7(storeReviews.status, "approved")
      )).orderBy(desc5(storeReviews.createdAt)).limit(10);
      res.json({
        ...store,
        listings: storeListings,
        reviews: storeReviewsList
      });
    } catch (error) {
      console.error("Error fetching store:", error);
      res.status(500).json({ message: "Ma\u011Faza bilgileri getirilemedi" });
    }
  });
  const MAGAZA_SAHIBI_ALANLARI = [
    "slug",
    "displayName",
    "storeType",
    "categoryId",
    "summary",
    "description",
    "phone",
    "email",
    "website",
    "address",
    "city",
    "district",
    "logo",
    "banner",
    "primaryColor",
    "secondaryColor",
    "bannerTemplate",
    "workingHours",
    "services",
    "specializations"
  ];
  function magazaAlanlariniSuz(veri) {
    const temiz = {};
    for (const alan of MAGAZA_SAHIBI_ALANLARI) {
      if (veri[alan] !== void 0) temiz[alan] = veri[alan];
    }
    return temiz;
  }
  app2.post("/api/store", isAuthenticated, async (req, res) => {
    try {
      if (process.env.NODE_ENV === "production" && !await isEmailVerified(req.user)) {
        return res.status(403).json({
          message: "Ma\u011Faza a\xE7abilmek i\xE7in \xF6nce e-posta adresinizi do\u011Frulaman\u0131z gerekiyor.",
          requiresVerification: true
        });
      }
      const existingStore = await db.query.stores.findFirst({
        where: eq7(stores.ownerId, getUserId3(req.user))
      });
      if (existingStore) {
        return res.status(400).json({ message: "Zaten bir ma\u011Fazan\u0131z var" });
      }
      const validationResult = insertStoreSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Ge\xE7ersiz ma\u011Faza verisi",
          errors: validationResult.error.errors
        });
      }
      const [newStore] = await db.insert(stores).values({
        ...magazaAlanlariniSuz(validationResult.data),
        ownerId: getUserId3(req.user),
        // Yeni mağaza her zaman onay sırasına girer. Tablonun varsayılanı
        // 'draft' idi ve taslaktan çıkışın hiçbir yolu yoktu: dürüstçe
        // açılan mağaza listede sonsuza dek görünmüyordu.
        status: "pending"
      }).returning();
      res.status(201).json(newStore);
    } catch (error) {
      console.error("Error creating store:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "Bu slug zaten kullan\u0131mda" });
      }
      res.status(500).json({ message: "Ma\u011Faza olu\u015Fturulamad\u0131" });
    }
  });
  app2.patch("/api/store/:id", isAuthenticated, async (req, res) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq7(stores.id, req.params.id)
      });
      if (!store) {
        return res.status(404).json({ message: "Ma\u011Faza bulunamad\u0131" });
      }
      if (store.ownerId !== getUserId3(req.user) && req.user.role !== "admin") {
        return res.status(403).json({ message: "Bu ma\u011Fazay\u0131 d\xFCzenleyemezsiniz" });
      }
      const validationResult = insertStoreSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Ge\xE7ersiz ma\u011Faza verisi",
          errors: validationResult.error.errors
        });
      }
      const [updated] = await db.update(stores).set({
        ...magazaAlanlariniSuz(validationResult.data),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq7(stores.id, req.params.id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Error updating store:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "Bu slug zaten kullan\u0131mda" });
      }
      res.status(500).json({ message: "Ma\u011Faza g\xFCncellenemedi" });
    }
  });
  app2.post("/api/store/:id/submit", isAuthenticated, async (req, res) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq7(stores.id, req.params.id)
      });
      if (!store) {
        return res.status(404).json({ message: "Ma\u011Faza bulunamad\u0131" });
      }
      if (store.ownerId !== getUserId3(req.user)) {
        return res.status(403).json({ message: "Bu ma\u011Fazay\u0131 g\xF6nderemezsiniz" });
      }
      if (process.env.NODE_ENV === "production" && !await isEmailVerified(req.user)) {
        return res.status(403).json({
          message: "Ma\u011Fazan\u0131z\u0131 onaya g\xF6nderebilmek i\xE7in \xF6nce e-posta adresinizi do\u011Frulaman\u0131z gerekiyor.",
          requiresVerification: true
        });
      }
      if (store.status !== "draft") {
        return res.status(400).json({
          message: store.status === "pending" ? "Ma\u011Fazan\u0131z zaten onay bekliyor." : "Ma\u011Fazan\u0131z onay s\xFCrecinde de\u011Fil."
        });
      }
      const [updated] = await db.update(stores).set({ status: "pending", updatedAt: /* @__PURE__ */ new Date() }).where(eq7(stores.id, store.id)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Error submitting store for review:", error);
      res.status(500).json({ message: "Ma\u011Faza onaya g\xF6nderilemedi" });
    }
  });
  app2.delete("/api/store/:id", isAuthenticated, async (req, res) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq7(stores.id, req.params.id)
      });
      if (!store) {
        return res.status(404).json({ message: "Ma\u011Faza bulunamad\u0131" });
      }
      if (store.ownerId !== getUserId3(req.user) && req.user.role !== "admin") {
        return res.status(403).json({ message: "Bu ma\u011Fazay\u0131 silemezsiniz" });
      }
      const objectStorage2 = new ObjectStorageService();
      if (store.logo) {
        try {
          await objectStorage2.deleteFile(store.logo);
        } catch (e) {
          console.warn("Failed to delete store logo:", e);
        }
      }
      if (store.banner) {
        try {
          await objectStorage2.deleteFile(store.banner);
        } catch (e) {
          console.warn("Failed to delete store banner:", e);
        }
      }
      const storeMediaList = await db.query.storeMedia.findMany({
        where: eq7(storeMedia.storeId, store.id)
      });
      for (const media of storeMediaList) {
        try {
          await objectStorage2.deleteFile(media.url);
        } catch (e) {
          console.warn("Failed to delete store media:", e);
        }
      }
      await db.delete(storeMedia).where(eq7(storeMedia.storeId, store.id));
      await db.delete(storeFollowers).where(eq7(storeFollowers.storeId, store.id));
      await db.delete(storeReviews).where(eq7(storeReviews.storeId, store.id));
      await db.update(listings).set({ storeId: null }).where(eq7(listings.storeId, store.id));
      await db.delete(stores).where(eq7(stores.id, store.id));
      res.json({ message: "Ma\u011Faza ba\u015Far\u0131yla silindi" });
    } catch (error) {
      console.error("Error deleting store:", error);
      res.status(500).json({ message: "Ma\u011Faza silinemedi" });
    }
  });
  app2.get("/api/store/my/dashboard", isAuthenticated, async (req, res) => {
    try {
      const myStore = await db.query.stores.findFirst({
        where: eq7(stores.ownerId, getUserId3(req.user))
      });
      if (!myStore) {
        return res.status(404).json({ message: "Ma\u011Fazan\u0131z hen\xFCz yok" });
      }
      const storeListingsCount = await db.select({ count: sql6`count(*)` }).from(listings).where(eq7(listings.storeId, myStore.id));
      res.json({
        ...myStore,
        stats: {
          totalListings: storeListingsCount[0]?.count || 0
        }
      });
    } catch (error) {
      console.error("Error fetching my store:", error);
      res.status(500).json({ message: "Ma\u011Faza bilgileri getirilemedi" });
    }
  });
  app2.get("/api/seller/analytics", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const userListings = await db.select().from(listings).where(eq7(listings.sellerId, userId));
      const totalListings = userListings.length;
      const activeListings = userListings.filter((l) => l.status === "active").length;
      const pendingListings = userListings.filter((l) => l.status === "pending").length;
      const soldListings = userListings.filter((l) => l.status === "sold").length;
      const totalViews = userListings.reduce((sum, l) => sum + (l.views || 0), 0);
      const listingIds = userListings.map((l) => l.id);
      let totalFavorites = 0;
      if (listingIds.length > 0) {
        const favResult = await db.select({ count: sql6`count(*)::int` }).from(favorites).where(inArray4(favorites.listingId, listingIds));
        totalFavorites = favResult[0]?.count || 0;
      }
      const messagesResult = await db.select({ count: sql6`count(*)::int` }).from(messages).where(eq7(messages.receiverId, userId));
      const totalMessages = messagesResult[0]?.count || 0;
      const topListings = userListings.filter((l) => l.status === "active").sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5).map((l) => ({
        id: l.id,
        title: l.title,
        views: l.views || 0,
        price: l.price,
        images: l.images,
        status: l.status
      }));
      const statusBreakdown = {
        active: activeListings,
        pending: pendingListings,
        sold: soldListings,
        expired: userListings.filter((l) => l.status === "expired").length,
        draft: userListings.filter((l) => l.status === "draft").length
      };
      const avgViews = totalListings > 0 ? Math.round(totalViews / totalListings) : 0;
      const sevenDaysAgo = /* @__PURE__ */ new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentListings = userListings.filter(
        (l) => new Date(l.createdAt || 0) > sevenDaysAgo
      ).length;
      const viewTrend = totalViews > 0 ? "+" + Math.round(avgViews * 0.1) + "%" : "0%";
      res.json({
        overview: {
          totalListings,
          activeListings,
          pendingListings,
          soldListings,
          totalViews,
          totalFavorites,
          totalMessages,
          avgViews,
          recentListings,
          viewTrend
        },
        statusBreakdown,
        topListings
      });
    } catch (error) {
      console.error("Error fetching seller analytics:", error);
      res.status(500).json({ message: "Analiz verileri getirilemedi" });
    }
  });
  app2.get("/api/seller/analytics/listing/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const { id } = req.params;
      const [listing] = await db.select().from(listings).where(and6(
        eq7(listings.id, id),
        eq7(listings.sellerId, userId)
      )).limit(1);
      if (!listing) {
        return res.status(404).json({ message: "\u0130lan bulunamad\u0131" });
      }
      const favResult = await db.select({ count: sql6`count(*)::int` }).from(favorites).where(eq7(favorites.listingId, id));
      const favoritesCount = favResult[0]?.count || 0;
      const msgResult = await db.select({ count: sql6`count(*)::int` }).from(messages).where(and6(
        eq7(messages.receiverId, userId),
        sql6`${messages.content} LIKE '%' || ${listing.title} || '%'`
      ));
      const messageCount = msgResult[0]?.count || 0;
      res.json({
        id: listing.id,
        title: listing.title,
        views: listing.views || 0,
        favoritesCount,
        messageCount,
        status: listing.status,
        createdAt: listing.createdAt,
        price: listing.price
      });
    } catch (error) {
      console.error("Error fetching listing analytics:", error);
      res.status(500).json({ message: "\u0130lan analizi getirilemedi" });
    }
  });
  app2.post("/api/store/:id/review", isAuthenticated, async (req, res) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq7(stores.id, req.params.id)
      });
      if (!store) {
        return res.status(404).json({ message: "Ma\u011Faza bulunamad\u0131" });
      }
      if (store.ownerId === getUserId3(req.user)) {
        return res.status(400).json({ message: "Kendi ma\u011Fazan\u0131z\u0131 de\u011Ferlendiremezsiniz" });
      }
      const existingReview = await db.query.storeReviews.findFirst({
        where: and6(
          eq7(storeReviews.storeId, req.params.id),
          eq7(storeReviews.reviewerId, getUserId3(req.user))
        )
      });
      if (existingReview) {
        return res.status(400).json({ message: "Bu ma\u011Fazay\u0131 zaten de\u011Ferlendirdiniz" });
      }
      const validationResult = insertStoreReviewSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Ge\xE7ersiz de\u011Ferlendirme verisi",
          errors: validationResult.error.errors
        });
      }
      const [newReview] = await db.insert(storeReviews).values({
        ...validationResult.data,
        storeId: req.params.id,
        reviewerId: getUserId3(req.user)
      }).returning();
      const allReviews = await db.select({ rating: storeReviews.rating }).from(storeReviews).where(and6(
        eq7(storeReviews.storeId, req.params.id),
        eq7(storeReviews.status, "approved")
      ));
      const avgRating = allReviews.length > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length : 0;
      await db.update(stores).set({
        rating: avgRating.toFixed(2),
        reviewCount: allReviews.length
      }).where(eq7(stores.id, req.params.id));
      try {
        const reviewer = req.user;
        const reviewerName = reviewer.firstName ? `${reviewer.firstName} ${reviewer.lastName || ""}`.trim() : reviewer.username || "Birisi";
        const stars = "\u2605".repeat(validationResult.data.rating) + "\u2606".repeat(5 - validationResult.data.rating);
        const [notification] = await db.insert(notifications).values({
          userId: store.ownerId,
          type: "system",
          title: "Yeni De\u011Ferlendirme",
          message: `${reviewerName} "${store.displayName}" ma\u011Fazan\u0131za ${stars} puan verdi`,
          link: `/magaza/${store.slug}`,
          relatedId: newReview.id
        }).returning();
        notificationEmitter.emit("notification", {
          userId: store.ownerId,
          notification
        });
      } catch (notifError) {
        console.error("Failed to create store review notification:", notifError);
      }
      res.status(201).json(newReview);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "De\u011Ferlendirme olu\u015Fturulamad\u0131" });
    }
  });
  app2.get("/api/store/:id/reviews", async (req, res) => {
    try {
      const reviewsList = await db.select({
        id: storeReviews.id,
        rating: storeReviews.rating,
        title: storeReviews.title,
        comment: storeReviews.comment,
        createdAt: storeReviews.createdAt,
        reviewerId: users.id,
        reviewerFirstName: users.firstName,
        reviewerLastName: users.lastName,
        reviewerProfileImage: users.profileImageUrl
      }).from(storeReviews).leftJoin(users, eq7(storeReviews.reviewerId, users.id)).where(and6(
        eq7(storeReviews.storeId, req.params.id),
        eq7(storeReviews.status, "approved")
      )).orderBy(desc5(storeReviews.createdAt));
      res.json(reviewsList);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "De\u011Ferlendirmeler getirilemedi" });
    }
  });
  app2.post("/api/store/:id/media", isAuthenticated, async (req, res) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq7(stores.id, req.params.id)
      });
      if (!store) {
        return res.status(404).json({ message: "Ma\u011Faza bulunamad\u0131" });
      }
      if (store.ownerId !== getUserId3(req.user) && req.user.role !== "admin") {
        return res.status(403).json({ message: "Bu ma\u011Fazaya medya y\xFCkleyemezsiniz" });
      }
      const { mediaType, url } = req.body;
      if (!mediaType || !url) {
        return res.status(400).json({ message: "mediaType ve url gerekli" });
      }
      const [media] = await db.insert(storeMedia).values({
        storeId: req.params.id,
        type: mediaType,
        url
      }).returning();
      if (mediaType === "logo") {
        await db.update(stores).set({ logo: url }).where(eq7(stores.id, req.params.id));
      } else if (mediaType === "banner") {
        await db.update(stores).set({ banner: url }).where(eq7(stores.id, req.params.id));
      }
      res.status(201).json(media);
    } catch (error) {
      console.error("Error uploading store media:", error);
      res.status(500).json({ message: "Medya y\xFCklenemedi" });
    }
  });
  app2.post("/api/store/:id/upload-image", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq7(stores.id, req.params.id)
      });
      if (!store) {
        return res.status(404).json({ message: "Ma\u011Faza bulunamad\u0131" });
      }
      if (store.ownerId !== getUserId3(req.user) && req.user.role !== "admin") {
        return res.status(403).json({ message: "Bu ma\u011Fazaya medya y\xFCkleyemezsiniz" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Dosya gerekli" });
      }
      const imageType = req.body.type;
      if (!imageType || !["logo", "banner"].includes(imageType)) {
        return res.status(400).json({ message: "Ge\xE7erli bir t\xFCr (logo/banner) gerekli" });
      }
      const validation = validateImageFile(req.file);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }
      console.log(`Processing store ${imageType}:`, {
        storeId: store.id,
        originalName: req.file.originalname,
        size: req.file.size
      });
      const result = await processStoreImage(req.file.buffer, {
        type: imageType,
        storeId: store.id
      });
      const [media] = await db.insert(storeMedia).values({
        storeId: store.id,
        type: imageType,
        url: result.originalUrl
      }).returning();
      if (imageType === "logo") {
        await db.update(stores).set({ logo: result.originalUrl }).where(eq7(stores.id, store.id));
      } else if (imageType === "banner") {
        await db.update(stores).set({ banner: result.originalUrl }).where(eq7(stores.id, store.id));
      }
      console.log(`Store ${imageType} uploaded successfully:`, result.originalUrl);
      res.status(201).json({
        media,
        variants: {
          original: result.originalUrl,
          medium: result.mediumUrl,
          thumbnail: result.thumbnailUrl
        },
        width: result.width,
        height: result.height,
        fileSize: result.fileSize
      });
    } catch (error) {
      console.error("Error uploading store image:", error);
      res.status(500).json({ message: "G\xF6rsel y\xFCklenemedi" });
    }
  });
  app2.post("/api/store/:id/follow", isAuthenticated, async (req, res) => {
    try {
      const storeId = req.params.id;
      const userId = getUserId3(req.user);
      const store = await db.query.stores.findFirst({
        where: eq7(stores.id, storeId)
      });
      if (!store) {
        return res.status(404).json({ message: "Ma\u011Faza bulunamad\u0131" });
      }
      if (store.ownerId === userId) {
        return res.status(400).json({ message: "Kendi ma\u011Fazan\u0131z\u0131 takip edemezsiniz" });
      }
      const existingFollow = await db.query.storeFollowers.findFirst({
        where: and6(
          eq7(storeFollowers.storeId, storeId),
          eq7(storeFollowers.userId, userId)
        )
      });
      if (existingFollow) {
        return res.status(400).json({ message: "Bu ma\u011Fazay\u0131 zaten takip ediyorsunuz" });
      }
      await db.insert(storeFollowers).values({
        storeId,
        userId
      });
      await db.update(stores).set({ followerCount: sql6`COALESCE(follower_count, 0) + 1` }).where(eq7(stores.id, storeId));
      try {
        const follower = req.user;
        const followerName = follower.firstName ? `${follower.firstName} ${follower.lastName || ""}`.trim() : follower.username || "Birisi";
        const [notification] = await db.insert(notifications).values({
          userId: store.ownerId,
          type: "system",
          title: "Yeni Takip\xE7i",
          message: `${followerName} "${store.displayName}" ma\u011Fazan\u0131z\u0131 takip etmeye ba\u015Flad\u0131`,
          link: `/magazam`,
          relatedId: storeId
        }).returning();
        notificationEmitter.emit("notification", {
          userId: store.ownerId,
          notification
        });
      } catch (notifError) {
        console.error("Failed to create store follow notification:", notifError);
      }
      res.status(201).json({ message: "Ma\u011Faza takip edildi", following: true });
    } catch (error) {
      console.error("Error following store:", error);
      res.status(500).json({ message: "Ma\u011Faza takip edilemedi" });
    }
  });
  app2.delete("/api/store/:id/follow", isAuthenticated, async (req, res) => {
    try {
      const storeId = req.params.id;
      const userId = getUserId3(req.user);
      const result = await db.delete(storeFollowers).where(and6(
        eq7(storeFollowers.storeId, storeId),
        eq7(storeFollowers.userId, userId)
      )).returning();
      if (result.length === 0) {
        return res.status(404).json({ message: "Bu ma\u011Fazay\u0131 takip etmiyorsunuz" });
      }
      await db.update(stores).set({ followerCount: sql6`GREATEST(COALESCE(follower_count, 0) - 1, 0)` }).where(eq7(stores.id, storeId));
      res.json({ message: "Takipten \xE7\u0131k\u0131ld\u0131", following: false });
    } catch (error) {
      console.error("Error unfollowing store:", error);
      res.status(500).json({ message: "Takipten \xE7\u0131k\u0131lamad\u0131" });
    }
  });
  app2.get("/api/my/followed-stores", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId3(req.user);
      const followedStores = await db.select({
        id: stores.id,
        slug: stores.slug,
        displayName: stores.displayName,
        storeType: stores.storeType,
        summary: stores.summary,
        logo: stores.logo,
        primaryColor: stores.primaryColor,
        city: stores.city,
        rating: stores.rating,
        reviewCount: stores.reviewCount,
        totalListings: stores.totalListings,
        verifiedAt: stores.verifiedAt,
        followerCount: stores.followerCount,
        badges: stores.badges,
        followedAt: storeFollowers.createdAt
      }).from(storeFollowers).innerJoin(stores, eq7(storeFollowers.storeId, stores.id)).where(eq7(storeFollowers.userId, userId)).orderBy(desc5(storeFollowers.createdAt));
      res.json(followedStores);
    } catch (error) {
      console.error("Error fetching followed stores:", error);
      res.status(500).json({ message: "Takip edilen ma\u011Fazalar getirilemedi" });
    }
  });
  app2.get("/api/store/:id/is-following", isAuthenticated, async (req, res) => {
    try {
      const storeId = req.params.id;
      const userId = getUserId3(req.user);
      const follow = await db.query.storeFollowers.findFirst({
        where: and6(
          eq7(storeFollowers.storeId, storeId),
          eq7(storeFollowers.userId, userId)
        )
      });
      res.json({ following: !!follow });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Takip durumu kontrol edilemedi" });
    }
  });
  app2.post("/api/store/:id/view", async (req, res) => {
    try {
      const storeId = req.params.id;
      await db.update(stores).set({ viewCount: sql6`COALESCE(view_count, 0) + 1` }).where(eq7(stores.id, storeId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error incrementing view count:", error);
      res.status(500).json({ message: "G\xF6r\xFCnt\xFClenme kaydedilemedi" });
    }
  });
  app2.get("/api/store-categories", async (req, res) => {
    try {
      const allCategories = await db.select().from(storeCategories).orderBy(storeCategories.order);
      const rootCategories = allCategories.filter((c) => c.depth === 0);
      const tree = rootCategories.map((root) => ({
        ...root,
        children: allCategories.filter((c) => c.parentId === root.id)
      }));
      res.json(tree);
    } catch (error) {
      console.error("Error fetching store categories:", error);
      res.status(500).json({ message: "Kategoriler getirilemedi" });
    }
  });
  app2.get("/api/store-categories/:id/stores", async (req, res) => {
    try {
      const categoryId = req.params.id;
      const storesList = await db.select({
        id: stores.id,
        slug: stores.slug,
        displayName: stores.displayName,
        storeType: stores.storeType,
        categoryId: stores.categoryId,
        summary: stores.summary,
        logo: stores.logo,
        banner: stores.banner,
        primaryColor: stores.primaryColor,
        city: stores.city,
        rating: stores.rating,
        reviewCount: stores.reviewCount,
        totalListings: stores.totalListings,
        verifiedAt: stores.verifiedAt,
        createdAt: stores.createdAt
      }).from(stores).where(and6(
        eq7(stores.categoryId, categoryId),
        eq7(stores.status, "active")
      )).orderBy(desc5(stores.rating), desc5(stores.reviewCount));
      res.json(storesList);
    } catch (error) {
      console.error("Error fetching stores by category:", error);
      res.status(500).json({ message: "Ma\u011Fazalar getirilemedi" });
    }
  });
  app2.get("/google558dc83366fda0c8.html", (_req, res) => {
    res.type("text/html").send("google-site-verification: google558dc83366fda0c8.html");
  });
  app2.get("/robots.txt", (_req, res) => {
    const robotsTxt = `User-agent: *
Allow: /
Allow: /ilanlar
Allow: /blog
Allow: /kategoriler

Disallow: /panel/
Disallow: /admin/
Disallow: /api/

Sitemap: https://sahibindenhayvan.com/sitemap.xml
`;
    res.type("text/plain").send(robotsTxt);
  });
  app2.get("/sitemap.xml", async (_req, res) => {
    try {
      const baseUrl = "https://sahibindenhayvan.com";
      const allCategories = await db.select({ slug: categories.slug }).from(categories);
      const activeListings = await db.select({ id: listings.id }).from(listings).where(eq7(listings.status, "active")).limit(1e3);
      const allBlogPosts = await db.select({ slug: blogPosts.slug }).from(blogPosts);
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/ilanlar</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      for (const cat of allCategories) {
        sitemap += `  <url>
    <loc>${baseUrl}/ilanlar?categoryId=${cat.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
      for (const listing of activeListings) {
        sitemap += `  <url>
    <loc>${baseUrl}/ilan/${listing.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
      for (const post of allBlogPosts) {
        sitemap += `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;
      }
      sitemap += `</urlset>`;
      res.type("application/xml").send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Sitemap could not be generated");
    }
  });
  registerAdvancedFeatureRoutes(app2);
  return httpServer;
}

// server/vercel-entry.ts
process.env.VERCEL = process.env.VERCEL || "1";
process.env.DISABLE_CLUSTER = "true";
var app = express();
app.set("trust proxy", 1);
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.use(compression());
app.use(
  express.json({
    limit: "200kb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: false, limit: "200kb" }));
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`);
    }
  });
  next();
});
var bootstrap = null;
function initialize() {
  if (bootstrap) return bootstrap;
  bootstrap = (async () => {
    initializeRedis();
    await registerRoutes(app);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      console.error("Express error:", err);
      const message = status >= 500 && process.env.NODE_ENV === "production" ? "Sunucu hatas\u0131. L\xFCtfen daha sonra tekrar deneyin." : err.message || "Internal Server Error";
      if (!res.headersSent) {
        res.status(status).json({ message });
      }
    });
    console.log("\u2705 Vercel uygulamas\u0131 ba\u015Flat\u0131ld\u0131");
  })().catch((err) => {
    console.error("\u274C Ba\u015Flatma hatas\u0131:", err);
    bootstrap = null;
    throw err;
  });
  return bootstrap;
}
async function handler(req, res) {
  try {
    await initialize();
  } catch {
    if (!res.headersSent) {
      res.status(503).json({ message: "Servis ba\u015Flat\u0131lamad\u0131, tekrar deneyin." });
    }
    return;
  }
  return app(req, res);
}
export {
  handler as default
};
