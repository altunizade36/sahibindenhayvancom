import { sql } from "drizzle-orm";
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
  "active",
  "sold",
  "expired",
  "deleted"
]);

export const auctionStatusEnum = pgEnum("auction_status", [
  "upcoming",
  "live",
  "ended",
  "cancelled"
]);

export const streamStatusEnum = pgEnum("stream_status", [
  "scheduled",
  "live",
  "ended"
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

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default("buyer"),
  avatar: text("avatar"),
  isVerified: boolean("is_verified").default(false),
  city: text("city"),
  district: text("district"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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
  status: listingStatusEnum("status").default("active"),
  isPremium: boolean("is_premium").default(false),
  isUrgent: boolean("is_urgent").default(false),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertListingSchema = createInsertSchema(listings).omit({
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
});

export const insertAuctionSchema = createInsertSchema(auctions).omit({
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
});

export const insertBidSchema = createInsertSchema(bids).omit({
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
});

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
});

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
});

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

export const insertTransportServiceSchema = createInsertSchema(transportServices).omit({
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
});

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
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;
