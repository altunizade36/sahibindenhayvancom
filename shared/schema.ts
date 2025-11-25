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

export const locationTypeEnum = pgEnum("location_type", [
  "il",        // Province
  "ilce",      // District
  "mahalle",   // Neighborhood
  "koy"        // Village
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
  phone: text("phone"),
  city: text("city"),
  district: text("district"),
  bio: text("bio"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  verificationToken: varchar("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;

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
});

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
  locationId: varchar("location_id").references(() => locations.id, { onDelete: "set null" }),
  city: text("city").notNull(), // Denormalized for backward compatibility (should sync with locationId)
  district: text("district").notNull(), // Denormalized for backward compatibility
  status: listingStatusEnum("status").default("pending"),
  isPremium: boolean("is_premium").default(false),
  isUrgent: boolean("is_urgent").default(false),
  views: integer("views").default(0),
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
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
});

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

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

// Chat Messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  listingId: varchar("listing_id").references(() => listings.id),
  content: text("content").notNull(),
  status: messageStatusEnum("status").default("sent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  senderReceiverCreatedIdx: index("messages_sender_receiver_created_idx").on(table.senderId, table.receiverId, table.createdAt),
  receiverCreatedIdx: index("messages_receiver_created_idx").on(table.receiverId, table.createdAt),
}));

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

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
});

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
  
  // Stats
  totalListings: integer("total_listings").default(0),
  totalSales: integer("total_sales").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  
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
  createdAt: true,
  updatedAt: true,
  totalListings: true,
  totalSales: true,
  rating: true,
  reviewCount: true,
  verifiedAt: true,
});

export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;

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
