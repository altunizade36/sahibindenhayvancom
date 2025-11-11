import { eq, and, gte, lte, ilike, desc, or, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users, categories, listings, auctions, bids, liveStreams,
  messages, blogPosts, vetServices, transportServices, reviews, favorites,
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Listing, type InsertListing,
  type Auction, type InsertAuction,
  type Bid, type InsertBid,
  type LiveStream, type InsertLiveStream,
  type Message, type InsertMessage,
  type BlogPost, type InsertBlogPost,
  type VetService, type InsertVetService,
  type TransportService, type InsertTransportService,
  type Review, type InsertReview,
  type Favorite, type InsertFavorite,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DbStorage implements IStorage {
  // ============ Users ============
  async getUser(id: string): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: eq(users.username, username),
    });
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUser(id: string, update: Partial<User>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(update)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // ============ Categories ============
  async getAllCategories(): Promise<Category[]> {
    return await db.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.order)],
    });
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  // ============ Listings ============
  async getAllListings(filters?: {
    categoryId?: string;
    city?: string;
    minPrice?: string;
    maxPrice?: string;
    status?: string;
    search?: string;
  }): Promise<Listing[]> {
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
      conditions.push(eq(listings.status, filters.status as any));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(listings.title, `%${filters.search}%`),
          ilike(listings.description, `%${filters.search}%`)
        )
      );
    }

    return await db.query.listings.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: (listings, { desc }) => [desc(listings.createdAt)],
    });
  }

  async getListing(id: string): Promise<Listing | undefined> {
    return await db.query.listings.findFirst({
      where: eq(listings.id, id),
    });
  }

  async getListingsBySeller(sellerId: string): Promise<Listing[]> {
    return await db.query.listings.findMany({
      where: eq(listings.sellerId, sellerId),
      orderBy: (listings, { desc }) => [desc(listings.createdAt)],
    });
  }

  async createListing(listing: InsertListing): Promise<Listing> {
    const [created] = await db.insert(listings).values(listing).returning();
    return created;
  }

  async updateListing(id: string, update: Partial<Listing>): Promise<Listing | undefined> {
    const [updated] = await db
      .update(listings)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(listings.id, id))
      .returning();
    return updated;
  }

  async deleteListing(id: string): Promise<boolean> {
    const result = await db.delete(listings).where(eq(listings.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async incrementListingViews(id: string): Promise<void> {
    await db
      .update(listings)
      .set({ views: sql`${listings.views} + 1` })
      .where(eq(listings.id, id));
  }

  // ============ Auctions ============
  async getAllAuctions(status?: string): Promise<Auction[]> {
    return await db.query.auctions.findMany({
      where: status ? eq(auctions.status, status as any) : undefined,
      orderBy: (auctions, { desc }) => [desc(auctions.createdAt)],
    });
  }

  async getAuction(id: string): Promise<Auction | undefined> {
    return await db.query.auctions.findFirst({
      where: eq(auctions.id, id),
    });
  }

  async getAuctionByListingId(listingId: string): Promise<Auction | undefined> {
    return await db.query.auctions.findFirst({
      where: eq(auctions.listingId, listingId),
    });
  }

  async createAuction(auction: InsertAuction): Promise<Auction> {
    const [created] = await db.insert(auctions).values(auction).returning();
    return created;
  }

  async updateAuction(id: string, update: Partial<Auction>): Promise<Auction | undefined> {
    const [updated] = await db
      .update(auctions)
      .set(update)
      .where(eq(auctions.id, id))
      .returning();
    return updated;
  }

  // ============ Bids ============
  async getBidsByAuction(auctionId: string): Promise<Bid[]> {
    return await db.query.bids.findMany({
      where: eq(bids.auctionId, auctionId),
      orderBy: (bids, { desc }) => [desc(bids.createdAt)],
    });
  }

  async createBid(bid: InsertBid): Promise<Bid> {
    return await db.transaction(async (tx) => {
      const [created] = await tx.insert(bids).values(bid).returning();
      
      // Update auction with highest bid
      await tx
        .update(auctions)
        .set({ currentBid: bid.amount })
        .where(eq(auctions.id, bid.auctionId));
      
      return created;
    });
  }

  // ============ Live Streams ============
  async getAllLiveStreams(status?: string): Promise<LiveStream[]> {
    return await db.query.liveStreams.findMany({
      where: status ? eq(liveStreams.status, status as any) : undefined,
      orderBy: (liveStreams, { desc }) => [desc(liveStreams.startTime)],
    });
  }

  async getLiveStream(id: string): Promise<LiveStream | undefined> {
    return await db.query.liveStreams.findFirst({
      where: eq(liveStreams.id, id),
    });
  }

  async getLiveStreamsByStreamer(streamerId: string): Promise<LiveStream[]> {
    return await db.query.liveStreams.findMany({
      where: eq(liveStreams.streamerId, streamerId),
      orderBy: (liveStreams, { desc }) => [desc(liveStreams.startTime)],
    });
  }

  async createLiveStream(stream: InsertLiveStream): Promise<LiveStream> {
    const [created] = await db.insert(liveStreams).values(stream).returning();
    return created;
  }

  async updateLiveStream(id: string, update: Partial<LiveStream>): Promise<LiveStream | undefined> {
    const [updated] = await db
      .update(liveStreams)
      .set(update)
      .where(eq(liveStreams.id, id))
      .returning();
    return updated;
  }

  async deleteLiveStream(id: string): Promise<boolean> {
    const result = await db
      .delete(liveStreams)
      .where(eq(liveStreams.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ============ Messages ============
  async getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
    return await db.query.messages.findMany({
      where: or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      ),
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    });
  }

  async getConversations(userId: string): Promise<Array<{ user: User; lastMessage: Message }>> {
    // Get all messages where user is sender or receiver
    const userMessages = await db.query.messages.findMany({
      where: or(
        eq(messages.senderId, userId),
        eq(messages.receiverId, userId)
      ),
      orderBy: (messages, { desc }) => [desc(messages.createdAt)],
    });

    // Group by conversation partner
    const conversationMap = new Map<string, Message>();
    for (const msg of userMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, msg);
      }
    }

    // Batch fetch all partner users to avoid N+1
    const partnerIds = Array.from(conversationMap.keys());
    if (partnerIds.length === 0) return [];
    
    const partners = await db.query.users.findMany({
      where: sql`${users.id} = ANY(${partnerIds})`,
    });

    // Map conversations with user details
    const conversations = [];
    for (const partner of partners) {
      const lastMessage = conversationMap.get(partner.id);
      if (lastMessage) {
        conversations.push({ user: partner, lastMessage });
      }
    }

    return conversations;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }

  async updateMessageStatus(id: string, status: string): Promise<void> {
    await db
      .update(messages)
      .set({ status: status as any })
      .where(eq(messages.id, id));
  }

  // ============ Blog Posts ============
  async getAllBlogPosts(published?: boolean): Promise<BlogPost[]> {
    return await db.query.blogPosts.findMany({
      where: published !== undefined ? eq(blogPosts.published, published) : undefined,
      orderBy: (blogPosts, { desc }) => [desc(blogPosts.publishedAt)],
    });
  }

  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    return await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id),
    });
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return await db.query.blogPosts.findFirst({
      where: eq(blogPosts.slug, slug),
    });
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [created] = await db.insert(blogPosts).values(post).returning();
    return created;
  }

  async updateBlogPost(id: string, update: Partial<BlogPost>): Promise<BlogPost | undefined> {
    const [updated] = await db
      .update(blogPosts)
      .set(update)
      .where(eq(blogPosts.id, id))
      .returning();
    return updated;
  }

  // ============ Vet Services ============
  async getAllVetServices(city?: string): Promise<VetService[]> {
    return await db.query.vetServices.findMany({
      where: city ? eq(vetServices.city, city) : undefined,
    });
  }

  async getVetService(id: string): Promise<VetService | undefined> {
    return await db.query.vetServices.findFirst({
      where: eq(vetServices.id, id),
    });
  }

  async getVetServicesByVet(vetId: string): Promise<VetService[]> {
    return await db.query.vetServices.findMany({
      where: eq(vetServices.vetId, vetId),
    });
  }

  async createVetService(service: InsertVetService): Promise<VetService> {
    const [created] = await db.insert(vetServices).values(service).returning();
    return created;
  }

  async updateVetService(id: string, update: Partial<VetService>): Promise<VetService | undefined> {
    const [updated] = await db
      .update(vetServices)
      .set(update)
      .where(eq(vetServices.id, id))
      .returning();
    return updated;
  }

  // ============ Transport Services ============
  async getAllTransportServices(city?: string): Promise<TransportService[]> {
    return await db.query.transportServices.findMany({
      where: city ? eq(transportServices.city, city) : undefined,
    });
  }

  async getTransportService(id: string): Promise<TransportService | undefined> {
    return await db.query.transportServices.findFirst({
      where: eq(transportServices.id, id),
    });
  }

  async getTransportServicesByTransporter(transporterId: string): Promise<TransportService[]> {
    return await db.query.transportServices.findMany({
      where: eq(transportServices.transporterId, transporterId),
    });
  }

  async createTransportService(service: InsertTransportService): Promise<TransportService> {
    const [created] = await db.insert(transportServices).values(service).returning();
    return created;
  }

  async updateTransportService(id: string, update: Partial<TransportService>): Promise<TransportService | undefined> {
    const [updated] = await db
      .update(transportServices)
      .set(update)
      .where(eq(transportServices.id, id))
      .returning();
    return updated;
  }

  // ============ Reviews ============
  async getReviewsByTarget(targetId: string, targetType: string): Promise<Review[]> {
    return await db.query.reviews.findMany({
      where: and(
        eq(reviews.targetId, targetId),
        eq(reviews.targetType, targetType as any)
      ),
      orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
    });
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }

  // ============ Favorites ============
  async getFavoritesByUser(userId: string): Promise<Favorite[]> {
    return await db.query.favorites.findMany({
      where: eq(favorites.userId, userId),
      orderBy: (favorites, { desc }) => [desc(favorites.createdAt)],
    });
  }

  async createFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [created] = await db.insert(favorites).values(favorite).returning();
    return created;
  }

  async deleteFavorite(userId: string, listingId: string): Promise<boolean> {
    const result = await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async isFavorite(userId: string, listingId: string): Promise<boolean> {
    const favorite = await db.query.favorites.findFirst({
      where: and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)),
    });
    return !!favorite;
  }
}
