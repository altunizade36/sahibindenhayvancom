import {
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
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  
  // Categories
  getAllCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Listings
  getAllListings(filters?: {
    categoryId?: string;
    city?: string;
    minPrice?: string;
    maxPrice?: string;
    status?: string;
    search?: string;
  }): Promise<Listing[]>;
  getListing(id: string): Promise<Listing | undefined>;
  getListingsBySeller(sellerId: string): Promise<Listing[]>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: string, listing: Partial<Listing>): Promise<Listing | undefined>;
  deleteListing(id: string): Promise<boolean>;
  incrementListingViews(id: string): Promise<void>;
  
  // Auctions
  getAllAuctions(status?: string): Promise<Auction[]>;
  getAuction(id: string): Promise<Auction | undefined>;
  getAuctionByListingId(listingId: string): Promise<Auction | undefined>;
  createAuction(auction: InsertAuction): Promise<Auction>;
  updateAuction(id: string, auction: Partial<Auction>): Promise<Auction | undefined>;
  
  // Bids
  getBidsByAuction(auctionId: string): Promise<Bid[]>;
  createBid(bid: InsertBid): Promise<Bid>;
  
  // Live Streams
  getAllLiveStreams(status?: string): Promise<LiveStream[]>;
  getLiveStream(id: string): Promise<LiveStream | undefined>;
  getLiveStreamsByStreamer(streamerId: string): Promise<LiveStream[]>;
  createLiveStream(stream: InsertLiveStream): Promise<LiveStream>;
  updateLiveStream(id: string, stream: Partial<LiveStream>): Promise<LiveStream | undefined>;
  
  // Messages
  getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]>;
  getConversations(userId: string): Promise<Array<{ user: User; lastMessage: Message }>>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessageStatus(id: string, status: string): Promise<void>;
  
  // Blog Posts
  getAllBlogPosts(published?: boolean): Promise<BlogPost[]>;
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, post: Partial<BlogPost>): Promise<BlogPost | undefined>;
  
  // Vet Services
  getAllVetServices(city?: string): Promise<VetService[]>;
  getVetService(id: string): Promise<VetService | undefined>;
  getVetServicesByVet(vetId: string): Promise<VetService[]>;
  createVetService(service: InsertVetService): Promise<VetService>;
  updateVetService(id: string, service: Partial<VetService>): Promise<VetService | undefined>;
  
  // Transport Services
  getAllTransportServices(city?: string): Promise<TransportService[]>;
  getTransportService(id: string): Promise<TransportService | undefined>;
  getTransportServicesByTransporter(transporterId: string): Promise<TransportService[]>;
  createTransportService(service: InsertTransportService): Promise<TransportService>;
  updateTransportService(id: string, service: Partial<TransportService>): Promise<TransportService | undefined>;
  
  // Reviews
  getReviewsByTarget(targetId: string, targetType: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Favorites
  getFavoritesByUser(userId: string): Promise<Favorite[]>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  deleteFavorite(userId: string, listingId: string): Promise<boolean>;
  isFavorite(userId: string, listingId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private categories: Map<string, Category>;
  private listings: Map<string, Listing>;
  private auctions: Map<string, Auction>;
  private bids: Map<string, Bid>;
  private liveStreams: Map<string, LiveStream>;
  private messages: Map<string, Message>;
  private blogPosts: Map<string, BlogPost>;
  private vetServices: Map<string, VetService>;
  private transportServices: Map<string, TransportService>;
  private reviews: Map<string, Review>;
  private favorites: Map<string, Favorite>;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.listings = new Map();
    this.auctions = new Map();
    this.bids = new Map();
    this.liveStreams = new Map();
    this.messages = new Map();
    this.blogPosts = new Map();
    this.vetServices = new Map();
    this.transportServices = new Map();
    this.reviews = new Map();
    this.favorites = new Map();
    
    this.seedData();
  }

  private seedData() {
    // Seed categories
    const mainCategories = [
      { name: "Evcil Hayvanlar", slug: "evcil-hayvanlar", icon: "PawPrint" },
      { name: "Çiftlik Hayvanları", slug: "ciftlik-hayvanlari", icon: "Tractor" },
      { name: "Kuşlar", slug: "kuslar", icon: "Bird" },
      { name: "Akvaryum", slug: "akvaryum", icon: "Fish" },
      { name: "Atlar", slug: "atlar", icon: "Horse" },
      { name: "Arıcılık", slug: "aricilik", icon: "Honeycomb" },
    ];

    mainCategories.forEach((cat, index) => {
      const id = randomUUID();
      this.categories.set(id, {
        id,
        ...cat,
        parentId: null,
        image: null,
        description: null,
        order: index,
      });
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      ...insertUser,
      avatar: insertUser.avatar || null,
      phone: insertUser.phone || null,
      isVerified: insertUser.isVerified || false,
      city: insertUser.city || null,
      district: insertUser.district || null,
      bio: insertUser.bio || null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updateData };
    this.users.set(id, updated);
    return updated;
  }

  // Categories
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).sort((a, b) => a.order - b.order);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (cat) => cat.slug === slug,
    );
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = {
      id,
      ...insertCategory,
      parentId: insertCategory.parentId || null,
      icon: insertCategory.icon || null,
      image: insertCategory.image || null,
      description: insertCategory.description || null,
      order: insertCategory.order || 0,
    };
    this.categories.set(id, category);
    return category;
  }

  // Listings
  async getAllListings(filters?: any): Promise<Listing[]> {
    let listings = Array.from(this.listings.values());
    
    if (filters?.categoryId) {
      listings = listings.filter(l => l.categoryId === filters.categoryId);
    }
    if (filters?.city) {
      listings = listings.filter(l => l.city === filters.city);
    }
    if (filters?.status) {
      listings = listings.filter(l => l.status === filters.status);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      listings = listings.filter(l =>
        l.title.toLowerCase().includes(search) ||
        l.description.toLowerCase().includes(search)
      );
    }
    
    return listings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getListing(id: string): Promise<Listing | undefined> {
    return this.listings.get(id);
  }

  async getListingsBySeller(sellerId: string): Promise<Listing[]> {
    return Array.from(this.listings.values())
      .filter(l => l.sellerId === sellerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createListing(insertListing: InsertListing): Promise<Listing> {
    const id = randomUUID();
    const now = new Date();
    const listing: Listing = {
      id,
      ...insertListing,
      breed: insertListing.breed || null,
      age: insertListing.age || null,
      gender: insertListing.gender || null,
      healthStatus: insertListing.healthStatus || null,
      vaccinated: insertListing.vaccinated || false,
      neutered: insertListing.neutered || false,
      pedigree: insertListing.pedigree || false,
      pedigreeDocument: insertListing.pedigreeDocument || null,
      healthDocuments: insertListing.healthDocuments || [],
      status: insertListing.status || "active",
      isPremium: insertListing.isPremium || false,
      isUrgent: insertListing.isUrgent || false,
      views: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.listings.set(id, listing);
    return listing;
  }

  async updateListing(id: string, updateData: Partial<Listing>): Promise<Listing | undefined> {
    const listing = this.listings.get(id);
    if (!listing) return undefined;
    const updated = { ...listing, ...updateData, updatedAt: new Date() };
    this.listings.set(id, updated);
    return updated;
  }

  async deleteListing(id: string): Promise<boolean> {
    return this.listings.delete(id);
  }

  async incrementListingViews(id: string): Promise<void> {
    const listing = this.listings.get(id);
    if (listing) {
      listing.views = (listing.views || 0) + 1;
      this.listings.set(id, listing);
    }
  }

  // Auctions
  async getAllAuctions(status?: string): Promise<Auction[]> {
    let auctions = Array.from(this.auctions.values());
    if (status) {
      auctions = auctions.filter(a => a.status === status);
    }
    return auctions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAuction(id: string): Promise<Auction | undefined> {
    return this.auctions.get(id);
  }

  async getAuctionByListingId(listingId: string): Promise<Auction | undefined> {
    return Array.from(this.auctions.values()).find(
      (auction) => auction.listingId === listingId,
    );
  }

  async createAuction(insertAuction: InsertAuction): Promise<Auction> {
    const id = randomUUID();
    const auction: Auction = {
      id,
      ...insertAuction,
      currentPrice: insertAuction.startPrice,
      buyNowPrice: insertAuction.buyNowPrice || null,
      minIncrement: insertAuction.minIncrement || "10",
      status: insertAuction.status || "upcoming",
      winnerId: null,
      totalBids: 0,
      createdAt: new Date(),
    };
    this.auctions.set(id, auction);
    return auction;
  }

  async updateAuction(id: string, updateData: Partial<Auction>): Promise<Auction | undefined> {
    const auction = this.auctions.get(id);
    if (!auction) return undefined;
    const updated = { ...auction, ...updateData };
    this.auctions.set(id, updated);
    return updated;
  }

  // Bids
  async getBidsByAuction(auctionId: string): Promise<Bid[]> {
    return Array.from(this.bids.values())
      .filter(b => b.auctionId === auctionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createBid(insertBid: InsertBid): Promise<Bid> {
    const id = randomUUID();
    const bid: Bid = {
      id,
      ...insertBid,
      createdAt: new Date(),
    };
    this.bids.set(id, bid);
    
    // Update auction
    const auction = await this.getAuction(insertBid.auctionId);
    if (auction) {
      await this.updateAuction(auction.id, {
        currentPrice: insertBid.amount,
        totalBids: (auction.totalBids || 0) + 1,
      });
    }
    
    return bid;
  }

  // Live Streams
  async getAllLiveStreams(status?: string): Promise<LiveStream[]> {
    let streams = Array.from(this.liveStreams.values());
    if (status) {
      streams = streams.filter(s => s.status === status);
    }
    return streams.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getLiveStream(id: string): Promise<LiveStream | undefined> {
    return this.liveStreams.get(id);
  }

  async getLiveStreamsByStreamer(streamerId: string): Promise<LiveStream[]> {
    return Array.from(this.liveStreams.values())
      .filter(s => s.streamerId === streamerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createLiveStream(insertStream: InsertLiveStream): Promise<LiveStream> {
    const id = randomUUID();
    const stream: LiveStream = {
      id,
      ...insertStream,
      listingId: insertStream.listingId || null,
      description: insertStream.description || null,
      status: insertStream.status || "scheduled",
      scheduledFor: insertStream.scheduledFor || null,
      startedAt: null,
      endedAt: null,
      viewerCount: 0,
      peakViewers: 0,
      thumbnailUrl: insertStream.thumbnailUrl || null,
      createdAt: new Date(),
    };
    this.liveStreams.set(id, stream);
    return stream;
  }

  async updateLiveStream(id: string, updateData: Partial<LiveStream>): Promise<LiveStream | undefined> {
    const stream = this.liveStreams.get(id);
    if (!stream) return undefined;
    const updated = { ...stream, ...updateData };
    this.liveStreams.set(id, updated);
    return updated;
  }

  // Messages
  async getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(m =>
        (m.senderId === userId1 && m.receiverId === userId2) ||
        (m.senderId === userId2 && m.receiverId === userId1)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getConversations(userId: string): Promise<Array<{ user: User; lastMessage: Message }>> {
    const userMessages = Array.from(this.messages.values())
      .filter(m => m.senderId === userId || m.receiverId === userId);
    
    const conversationMap = new Map<string, Message>();
    userMessages.forEach(msg => {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const existing = conversationMap.get(otherId);
      if (!existing || msg.createdAt > existing.createdAt) {
        conversationMap.set(otherId, msg);
      }
    });

    const conversations = [];
    for (const [otherId, lastMessage] of conversationMap.entries()) {
      const user = await this.getUser(otherId);
      if (user) {
        conversations.push({ user, lastMessage });
      }
    }

    return conversations.sort((a, b) =>
      b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      id,
      ...insertMessage,
      listingId: insertMessage.listingId || null,
      status: "sent",
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async updateMessageStatus(id: string, status: string): Promise<void> {
    const message = this.messages.get(id);
    if (message) {
      message.status = status as any;
      this.messages.set(id, message);
    }
  }

  // Blog Posts
  async getAllBlogPosts(published?: boolean): Promise<BlogPost[]> {
    let posts = Array.from(this.blogPosts.values());
    if (published !== undefined) {
      posts = posts.filter(p => p.published === published);
    }
    return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return Array.from(this.blogPosts.values()).find(
      (post) => post.slug === slug,
    );
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const id = randomUUID();
    const now = new Date();
    const post: BlogPost = {
      id,
      ...insertPost,
      excerpt: insertPost.excerpt || null,
      featuredImage: insertPost.featuredImage || null,
      categoryTags: insertPost.categoryTags || [],
      published: insertPost.published || false,
      views: 0,
      readTime: insertPost.readTime || null,
      createdAt: now,
      updatedAt: now,
    };
    this.blogPosts.set(id, post);
    return post;
  }

  async updateBlogPost(id: string, updateData: Partial<BlogPost>): Promise<BlogPost | undefined> {
    const post = this.blogPosts.get(id);
    if (!post) return undefined;
    const updated = { ...post, ...updateData, updatedAt: new Date() };
    this.blogPosts.set(id, updated);
    return updated;
  }

  // Vet Services
  async getAllVetServices(city?: string): Promise<VetService[]> {
    let services = Array.from(this.vetServices.values());
    if (city) {
      services = services.filter(s => s.city === city);
    }
    return services;
  }

  async getVetService(id: string): Promise<VetService | undefined> {
    return this.vetServices.get(id);
  }

  async getVetServicesByVet(vetId: string): Promise<VetService[]> {
    return Array.from(this.vetServices.values()).filter(s => s.vetId === vetId);
  }

  async createVetService(insertService: InsertVetService): Promise<VetService> {
    const id = randomUUID();
    const service: VetService = {
      id,
      ...insertService,
      email: insertService.email || null,
      specializations: insertService.specializations || [],
      services: insertService.services || [],
      workingHours: insertService.workingHours || null,
      emergencyService: insertService.emergencyService || false,
      rating: "0",
      totalReviews: 0,
      verified: insertService.verified || false,
      createdAt: new Date(),
    };
    this.vetServices.set(id, service);
    return service;
  }

  async updateVetService(id: string, updateData: Partial<VetService>): Promise<VetService | undefined> {
    const service = this.vetServices.get(id);
    if (!service) return undefined;
    const updated = { ...service, ...updateData };
    this.vetServices.set(id, updated);
    return updated;
  }

  // Transport Services
  async getAllTransportServices(city?: string): Promise<TransportService[]> {
    let services = Array.from(this.transportServices.values());
    if (city) {
      services = services.filter(s =>
        s.serviceAreas.includes(city)
      );
    }
    return services;
  }

  async getTransportService(id: string): Promise<TransportService | undefined> {
    return this.transportServices.get(id);
  }

  async getTransportServicesByTransporter(transporterId: string): Promise<TransportService[]> {
    return Array.from(this.transportServices.values())
      .filter(s => s.transporterId === transporterId);
  }

  async createTransportService(insertService: InsertTransportService): Promise<TransportService> {
    const id = randomUUID();
    const service: TransportService = {
      id,
      ...insertService,
      serviceAreas: insertService.serviceAreas || [],
      vehicleTypes: insertService.vehicleTypes || [],
      animalTypes: insertService.animalTypes || [],
      pricePerKm: insertService.pricePerKm || null,
      minPrice: insertService.minPrice || null,
      insurance: insertService.insurance || false,
      rating: "0",
      totalReviews: 0,
      verified: insertService.verified || false,
      createdAt: new Date(),
    };
    this.transportServices.set(id, service);
    return service;
  }

  async updateTransportService(id: string, updateData: Partial<TransportService>): Promise<TransportService | undefined> {
    const service = this.transportServices.get(id);
    if (!service) return undefined;
    const updated = { ...service, ...updateData };
    this.transportServices.set(id, updated);
    return updated;
  }

  // Reviews
  async getReviewsByTarget(targetId: string, targetType: string): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(r => r.targetId === targetId && r.targetType === targetType)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = randomUUID();
    const review: Review = {
      id,
      ...insertReview,
      comment: insertReview.comment || null,
      createdAt: new Date(),
    };
    this.reviews.set(id, review);
    return review;
  }

  // Favorites
  async getFavoritesByUser(userId: string): Promise<Favorite[]> {
    return Array.from(this.favorites.values())
      .filter(f => f.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const id = randomUUID();
    const favorite: Favorite = {
      id,
      ...insertFavorite,
      createdAt: new Date(),
    };
    this.favorites.set(id, favorite);
    return favorite;
  }

  async deleteFavorite(userId: string, listingId: string): Promise<boolean> {
    const favorite = Array.from(this.favorites.values()).find(
      f => f.userId === userId && f.listingId === listingId
    );
    if (favorite) {
      return this.favorites.delete(favorite.id);
    }
    return false;
  }

  async isFavorite(userId: string, listingId: string): Promise<boolean> {
    return Array.from(this.favorites.values()).some(
      f => f.userId === userId && f.listingId === listingId
    );
  }
}

// Temporarily using MemStorage while debugging Drizzle ORM issues
// import { DbStorage } from "./db-storage";
// export const storage = new DbStorage();

export const storage = new MemStorage();
