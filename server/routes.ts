import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { db } from "./db";
import { cache, cacheKeys, cacheTTL } from "./cache";
import { healthCheck, metricsEndpoint } from "./monitoring";
import { locations, listings, blogPosts, users, messages, favorites, categories, auctions, bids, vetServices, transportServices, reviews } from "@shared/schema";
import { eq, and, isNull, desc, sql, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import {
  insertUserSchema,
  insertListingSchema,
  insertAuctionSchema,
  insertBidSchema,
  insertMessageSchema,
  insertBlogPostSchema,
  insertVetServiceSchema,
  insertTransportServiceSchema,
  insertReviewSchema,
  insertFavoriteSchema,
  type User,
} from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

// Validate critical environment variables
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required for JWT authentication");
}

const JWT_SECRET = process.env.SESSION_SECRET;

// ============ Rate Limiting Configuration ============
// Strict rate limiter for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: "Çok fazla giriş denemesi yaptınız. Lütfen 15 dakika sonra tekrar deneyin.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count successful requests too
});

// Moderate rate limiter for resource creation
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: "Çok fazla istek gönderdiniz. Lütfen bir dakika bekleyin.",
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: "Çok fazla istek gönderdiniz. Lütfen bekleyin.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Auth middleware (using PostgreSQL)
async function authMiddleware(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Optional auth middleware (doesn't fail if no token) - using PostgreSQL
async function optionalAuthMiddleware(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);
    
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ============ Health & Monitoring Routes ============
  app.get("/health", healthCheck);
  app.get("/metrics", metricsEndpoint);

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: "/ws",
    maxPayload: 100 * 1024, // 100KB max message size
    perMessageDeflate: false, // Disable compression for better performance
  });

  // WebSocket connection handling with limits
  const clients = new Map<string, WebSocket>();
  const MAX_CONNECTIONS = 50000; // Limit concurrent connections
  const HEARTBEAT_INTERVAL = 30000; // 30 seconds
  const CONNECTION_TIMEOUT = 60000; // 60 seconds idle timeout
  
  // Heartbeat tracking
  const heartbeats = new Map<string, NodeJS.Timeout>();
  
  wss.on("connection", (ws: WebSocket, req) => {
    // Check connection limit
    if (clients.size >= MAX_CONNECTIONS) {
      ws.close(1008, "Server at capacity");
      return;
    }

    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    
    if (!token) {
      ws.close(1008, "No token provided");
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const userId = decoded.userId;
      
      // Close existing connection for this user
      const existingWs = clients.get(userId);
      if (existingWs && existingWs.readyState === WebSocket.OPEN) {
        existingWs.close(1000, "New connection established");
      }
      
      clients.set(userId, ws);
      
      // Setup heartbeat for this connection
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(heartbeat);
          heartbeats.delete(userId);
        }
      }, HEARTBEAT_INTERVAL);
      heartbeats.set(userId, heartbeat);
      
      // Setup idle timeout
      let idleTimeout = setTimeout(() => {
        ws.close(1000, "Connection idle timeout");
      }, CONNECTION_TIMEOUT);
      
      // Reset timeout on activity
      const resetTimeout = () => {
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(() => {
          ws.close(1000, "Connection idle timeout");
        }, CONNECTION_TIMEOUT);
      };

      ws.on("message", async (data) => {
        resetTimeout(); // Reset idle timeout on message
        
        try {
          // Validate message size
          if (data.toString().length > 10000) {
            ws.send(JSON.stringify({ type: "error", message: "Message too large" }));
            return;
          }
          
          const message = JSON.parse(data.toString());
          
          // Handle different message types
          if (message.type === "chat") {
            // Create message in PostgreSQL
            const [newMessage] = await db
              .insert(messages)
              .values({
                senderId: decoded.userId,
                receiverId: message.receiverId,
                listingId: message.listingId || null,
                content: message.content,
              })
              .returning();

            // Send to receiver if online
            const receiverWs = clients.get(message.receiverId);
            if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
              receiverWs.send(JSON.stringify({
                type: "chat",
                message: newMessage,
              }));
            }

            // Send confirmation to sender
            ws.send(JSON.stringify({
              type: "chat_sent",
              message: newMessage,
            }));
          } else if (message.type === "bid") {
            // Handle auction bid - Get auction from PostgreSQL
            const [auction] = await db
              .select()
              .from(auctions)
              .where(eq(auctions.id, message.auctionId))
              .limit(1);
            
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
                message: `Minimum bid is ₺${(currentPrice + minIncrement).toFixed(2)}`,
              }));
              return;
            }

            // Create bid in PostgreSQL
            const [bid] = await db
              .insert(bids)
              .values({
                auctionId: message.auctionId,
                bidderId: decoded.userId,
                amount: message.amount,
              })
              .returning();

            // Broadcast bid to all connected clients
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: "new_bid",
                  bid,
                  auctionId: message.auctionId,
                }));
              }
            });
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
        }
      });

      ws.on("pong", () => {
        resetTimeout(); // Reset timeout on pong
      });
      
      ws.on("close", () => {
        clients.delete(userId);
        clearInterval(heartbeat);
        heartbeats.delete(userId);
        clearTimeout(idleTimeout);
      });
      
      ws.on("error", (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
        ws.close(1011, "Internal error");
      });
    } catch (error) {
      ws.close(1008, "Invalid token");
    }
  });

  // ============ Auth Routes ============
  app.post("/api/auth/register", authLimiter, async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if user exists (direct PostgreSQL query)
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, data.username))
        .limit(1);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const [existingEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);
      
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Create user in PostgreSQL
      const [user] = await db
        .insert(users)
        .values({
          ...data,
          password: hashedPassword,
        })
        .returning();

      // Create JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      // Sanitize user object - remove password
      const { password: _, ...sanitizedUser } = user;

      res.json({
        token,
        user: sanitizedUser,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed", error });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      // Direct PostgreSQL query for user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      // Sanitize user object - remove password
      const { password: _, ...sanitizedUser } = user;

      res.json({
        token,
        user: sanitizedUser,
      });
    } catch (error) {
      res.status(400).json({ message: "Login failed", error });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req: Request, res: Response) => {
    // Sanitize user object - remove password
    const { password: _, ...sanitizedUser } = req.user!;
    res.json(sanitizedUser);
  });

  app.patch("/api/auth/profile", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Whitelist allowed profile fields - prevent role/password escalation
      const allowedFields = ['fullName', 'phone', 'city', 'district', 'bio', 'avatar'];
      const safeUpdates: any = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          safeUpdates[field] = req.body[field];
        }
      }
      
      // Update user in PostgreSQL
      const [updated] = await db
        .update(users)
        .set(safeUpdates)
        .where(eq(users.id, req.user!.id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      // Sanitize user object - remove password
      const { password: _, ...sanitizedUser } = updated;
      res.json(sanitizedUser);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(400).json({ message: "Update failed", error });
    }
  });

  // ============ Category Routes ============
  app.get("/api/categories", async (_req: Request, res: Response) => {
    try {
      // Check cache first (24h TTL - categories rarely change)
      const cacheKey = cacheKeys.categories();
      const cached = await cache.get<any[]>(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }
      
      // Get all categories from PostgreSQL, ordered by order
      const allCategories = await db
        .select()
        .from(categories)
        .orderBy(categories.order);
      
      // Cache for 24 hours
      await cache.set(cacheKey, allCategories, cacheTTL.categories);
      
      res.json(allCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  
  app.get("/api/categories/tree", async (_req: Request, res: Response) => {
    try {
      // Check cache first (24h TTL - tree structure rarely changes)
      const cacheKey = cacheKeys.categoryTree();
      const cached = await cache.get<any[]>(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }
      
      // Get all categories from PostgreSQL
      const allCategories = await db
        .select()
        .from(categories)
        .orderBy(categories.order);
      
      // Build tree structure
      const categoryMap = new Map();
      const rootCategories: any[] = [];
      
      // First pass: create map of all categories
      allCategories.forEach(cat => {
        categoryMap.set(cat.id, { ...cat, children: [] });
      });
      
      // Second pass: build tree
      allCategories.forEach(cat => {
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
      
      // Cache for 24 hours
      await cache.set(cacheKey, rootCategories, cacheTTL.categories);
      
      res.json(rootCategories);
    } catch (error) {
      console.error("Failed to fetch category tree:", error);
      res.status(500).json({ message: "Failed to fetch category tree" });
    }
  });

  app.get("/api/categories/:slug", async (req: Request, res: Response) => {
    try {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, req.params.slug))
        .limit(1);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Failed to fetch category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });
  
  // ============ Location Routes ============
  app.get("/api/locations", async (req: Request, res: Response) => {
    try {
      const { type, parent } = req.query;
      
      let query = db.select().from(locations);
      
      const conditions = [];
      
      // Filter by parent - ONLY if parent parameter is explicitly provided
      if (parent !== undefined) {
        if (parent === null || parent === '') {
          conditions.push(isNull(locations.parentId));
        } else {
          conditions.push(eq(locations.parentId, parent as string));
        }
      }
      
      // Filter by type
      if (type) {
        conditions.push(eq(locations.type, type as "il" | "ilce" | "mahalle" | "koy"));
      }
      
      const result = await query.where(conditions.length > 0 ? and(...conditions) : undefined);
      res.json(result);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  // ============ Listing Routes ============
  app.get("/api/listings", optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const { page = '1', limit = '50', categoryId, city, minPrice, maxPrice, status, search } = req.query;
      
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50)); // Max 100
      const offset = (pageNum - 1) * limitNum;
      
      // Build query conditions
      const conditions = [];
      
      if (categoryId) {
        conditions.push(eq(listings.categoryId, categoryId as string));
      }
      
      if (city) {
        conditions.push(eq(listings.city, city as string));
      }
      
      if (status) {
        conditions.push(eq(listings.status, status as any));
      } else {
        // Default: only show active listings
        conditions.push(eq(listings.status, 'active'));
      }
      
      if (minPrice) {
        conditions.push(sql`${listings.price}::numeric >= ${parseFloat(minPrice as string)}`);
      }
      
      if (maxPrice) {
        conditions.push(sql`${listings.price}::numeric <= ${parseFloat(maxPrice as string)}`);
      }
      
      if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(
          sql`(${listings.title} ILIKE ${searchTerm} OR ${listings.description} ILIKE ${searchTerm})`
        );
      }
      
      // Get total count
      const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(listings)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      // Get paginated listings
      const listingsData = await db
        .select()
        .from(listings)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(listings.createdAt))
        .limit(limitNum)
        .offset(offset);
      
      // If user is authenticated, check favorites
      let listingsWithFavorites = listingsData;
      if (req.user) {
        // Get favorites from PostgreSQL
        const userFavorites = await db
          .select()
          .from(favorites)
          .where(eq(favorites.userId, req.user.id));
        
        const favoriteIds = new Set(userFavorites.map(f => f.listingId));
        
        listingsWithFavorites = listingsData.map(listing => ({
          ...listing,
          isFavorite: favoriteIds.has(listing.id),
        }));
      }
      
      res.json({
        data: listingsWithFavorites,
        total: Number(totalCount),
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(Number(totalCount) / limitNum),
      });
    } catch (error) {
      console.error("Error fetching listings:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  app.get("/api/listings/:id", optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, req.params.id))
        .limit(1);
        
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      // Increment views
      await db
        .update(listings)
        .set({ views: sql`${listings.views} + 1` })
        .where(eq(listings.id, req.params.id));

      // Get seller info from PostgreSQL
      const [seller] = await db
        .select()
        .from(users)
        .where(eq(users.id, listing.sellerId))
        .limit(1);

      // Check if favorited
      let isFavorite = false;
      if (req.user) {
        const [favorite] = await db
          .select()
          .from(favorites)
          .where(
            and(
              eq(favorites.userId, req.user.id),
              eq(favorites.listingId, listing.id)
            )
          )
          .limit(1);
        
        isFavorite = !!favorite;
      }

      // Sanitize seller object
      let sanitizedSeller = null;
      if (seller) {
        const { password: _, ...safe } = seller;
        sanitizedSeller = safe;
      }

      res.json({
        ...listing,
        views: (listing.views || 0) + 1, // Return incremented view count
        seller: sanitizedSeller,
        isFavorite,
      });
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  app.post("/api/listings", createLimiter, authMiddleware, async (req: Request, res: Response) => {
    try {
      const parsedData = insertListingSchema.parse({
        ...req.body,
        sellerId: req.user!.id,
      });

      // Create listing - completely free, no fees!
      const [listing] = await db.insert(listings).values(parsedData as any).returning();
      res.status(201).json(listing);
    } catch (error) {
      console.error("Error creating listing:", error);
      res.status(400).json({ message: "Failed to create listing", error });
    }
  });

  app.patch("/api/listings/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, req.params.id))
        .limit(1);
        
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      if (listing.sellerId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const [updated] = await db
        .update(listings)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(listings.id, req.params.id))
        .returning();
        
      res.json(updated);
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(400).json({ message: "Update failed", error });
    }
  });

  app.delete("/api/listings/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, req.params.id))
        .limit(1);
        
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      if (listing.sellerId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await db.delete(listings).where(eq(listings.id, req.params.id));
      res.json({ message: "Listing deleted" });
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(400).json({ message: "Delete failed", error });
    }
  });


  app.get("/api/listings/mine", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userListings = await db
        .select()
        .from(listings)
        .where(eq(listings.sellerId, req.user!.id))
        .orderBy(desc(listings.createdAt));
        
      res.json(userListings);
    } catch (error) {
      console.error("Error fetching user listings:", error);
      res.status(500).json({ message: "Failed to fetch user listings" });
    }
  });

  app.get("/api/users/:id/listings", async (req: Request, res: Response) => {
    try {
      const userListings = await db
        .select()
        .from(listings)
        .where(eq(listings.sellerId, req.params.id))
        .orderBy(desc(listings.createdAt));
        
      res.json(userListings);
    } catch (error) {
      console.error("Error fetching user listings:", error);
      res.status(500).json({ message: "Failed to fetch user listings" });
    }
  });

  // ============ Auction Routes ============
  app.get("/api/auctions", async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      
      // Get auctions from PostgreSQL
      let query = db.select().from(auctions);
      
      if (status) {
        query = query.where(eq(auctions.status, status as any));
      }
      
      const allAuctions = await query.orderBy(desc(auctions.createdAt));
      res.json(allAuctions);
    } catch (error) {
      console.error("Failed to fetch auctions:", error);
      res.status(500).json({ message: "Failed to fetch auctions" });
    }
  });

  app.get("/api/auctions/:id", async (req: Request, res: Response) => {
    try {
      const [auction] = await db
        .select()
        .from(auctions)
        .where(eq(auctions.id, req.params.id))
        .limit(1);
      
      if (!auction) {
        return res.status(404).json({ message: "Auction not found" });
      }

      // Get bids for auction
      const auctionBids = await db
        .select()
        .from(bids)
        .where(eq(bids.auctionId, req.params.id))
        .orderBy(desc(bids.amount));
      
      // Get listing
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, auction.listingId))
        .limit(1);

      res.json({
        ...auction,
        bids: auctionBids,
        listing,
      });
    } catch (error) {
      console.error("Failed to fetch auction:", error);
      res.status(500).json({ message: "Failed to fetch auction" });
    }
  });

  app.post("/api/auctions", authMiddleware, async (req: Request, res: Response) => {
    try {
      const data = insertAuctionSchema.parse(req.body);
      
      // Verify listing belongs to user
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, data.listingId))
        .limit(1);
      
      if (!listing || listing.sellerId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Create auction in PostgreSQL
      const [auction] = await db
        .insert(auctions)
        .values(data as any)
        .returning();
      
      res.status(201).json(auction);
    } catch (error) {
      console.error("Failed to create auction:", error);
      res.status(400).json({ message: "Failed to create auction", error });
    }
  });

  app.get("/api/auctions/:id/bids", async (req: Request, res: Response) => {
    try {
      const auctionBids = await db
        .select()
        .from(bids)
        .where(eq(bids.auctionId, req.params.id))
        .orderBy(desc(bids.amount));
      
      res.json(auctionBids);
    } catch (error) {
      console.error("Failed to fetch bids:", error);
      res.status(500).json({ message: "Failed to fetch bids" });
    }
  });

  // ============ Live Stream Routes (REMOVED - Feature postponed) ============
  // Live streaming and Agora.io integration removed per user request
  // Will be re-added in future versions

  // ============ Message Routes ============
  app.get("/api/messages/conversations", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Get unique conversations from PostgreSQL
      const userId = req.user!.id;
      
      // Get all messages where user is sender or receiver
      const allMessages = await db
        .select()
        .from(messages)
        .where(
          sql`${messages.senderId} = ${userId} OR ${messages.receiverId} = ${userId}`
        )
        .orderBy(desc(messages.createdAt));
      
      // Group by conversation partner
      const conversationsMap = new Map();
      for (const msg of allMessages) {
        const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            userId: partnerId,
            lastMessage: msg.content,
            lastMessageTime: msg.createdAt,
            unreadCount: 0,
          });
        }
      }
      
      res.json(Array.from(conversationsMap.values()));
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/messages/:userId", authMiddleware, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.user!.id;
      const otherUserId = req.params.userId;
      
      // Get messages between two users from PostgreSQL
      const msgs = await db
        .select()
        .from(messages)
        .where(
          sql`(${messages.senderId} = ${currentUserId} AND ${messages.receiverId} = ${otherUserId}) OR (${messages.senderId} = ${otherUserId} AND ${messages.receiverId} = ${currentUserId})`
        )
        .orderBy(messages.createdAt);
      
      res.json(msgs);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", authMiddleware, async (req: Request, res: Response) => {
    try {
      const data = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user!.id,
      });

      // Create message in PostgreSQL
      const [message] = await db
        .insert(messages)
        .values(data)
        .returning();
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Failed to send message:", error);
      res.status(400).json({ message: "Failed to send message", error });
    }
  });

  // ============ Blog Routes ============
  app.get("/api/blog", async (req: Request, res: Response) => {
    try {
      // Check cache first (1h TTL - blog posts don't change frequently)
      const cacheKey = cacheKeys.blogPosts();
      const cached = await cache.get<any[]>(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }
      
      // Read blog posts directly from database (seeded data) with author info
      const published = req.query.published !== "false";
      const posts = await db.query.blogPosts.findMany({
        where: published ? eq(blogPosts.published, true) : undefined,
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
        with: {
          author: true,
        },
      });

      // Sanitize passwords from author objects
      const sanitizedPosts = posts.map((post) => {
        if (post.author) {
          const { password: _, ...safeAuthor } = post.author;
          return { ...post, author: safeAuthor };
        }
        return post;
      });

      // Cache for 1 hour
      await cache.set(cacheKey, sanitizedPosts, cacheTTL.blogPosts);

      res.json(sanitizedPosts);
    } catch (error) {
      console.error("Blog API error:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog/:slug", async (req: Request, res: Response) => {
    try {
      // Read from database directly (seeded data)
      const post = await db.query.blogPosts.findFirst({
        where: (posts, { eq }) => eq(posts.slug, req.params.slug),
      });
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Get author from database
      const author = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, post.authorId),
      });

      // Sanitize author object
      let sanitizedAuthor = null;
      if (author) {
        const { password: _, ...safe } = author;
        sanitizedAuthor = safe;
      }

      res.json({
        ...post,
        author: sanitizedAuthor,
      });
    } catch (error) {
      console.error("Blog detail API error:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.post("/api/blog", authMiddleware, async (req: Request, res: Response) => {
    try {
      if (req.user!.role !== "admin" && req.user!.role !== "vet") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const data = insertBlogPostSchema.parse({
        ...req.body,
        authorId: req.user!.id,
      });

      // Create blog post in PostgreSQL
      const [post] = await db
        .insert(blogPosts)
        .values(data as any)
        .returning();
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Failed to create blog post:", error);
      res.status(400).json({ message: "Failed to create post", error });
    }
  });

  // ============ Vet Service Routes ============
  app.get("/api/vet-services", async (req: Request, res: Response) => {
    try {
      const city = req.query.city as string;
      
      // Get vet services from PostgreSQL
      let query = db.select().from(vetServices);
      
      if (city) {
        query = query.where(eq(vetServices.city, city));
      }
      
      const services = await query.orderBy(desc(vetServices.createdAt));
      res.json(services);
    } catch (error) {
      console.error("Failed to fetch vet services:", error);
      res.status(500).json({ message: "Failed to fetch vet services" });
    }
  });

  app.get("/api/vet-services/:id", async (req: Request, res: Response) => {
    try {
      const [service] = await db
        .select()
        .from(vetServices)
        .where(eq(vetServices.id, req.params.id))
        .limit(1);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Get vet user
      const [vet] = await db
        .select()
        .from(users)
        .where(eq(users.id, service.vetId))
        .limit(1);
      
      // Get reviews
      const serviceReviews = await db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.targetId, req.params.id),
            eq(reviews.targetType, "vet_service")
          )
        );

      // Sanitize vet object
      let sanitizedVet = null;
      if (vet) {
        const { password: _, ...safe } = vet;
        sanitizedVet = safe;
      }

      res.json({
        ...service,
        vet: sanitizedVet,
        reviews: serviceReviews,
      });
    } catch (error) {
      console.error("Failed to fetch vet service:", error);
      res.status(500).json({ message: "Failed to fetch vet service" });
    }
  });

  app.post("/api/vet-services", authMiddleware, async (req: Request, res: Response) => {
    try {
      if (req.user!.role !== "vet") {
        return res.status(403).json({ message: "Only veterinarians can create services" });
      }

      const data = insertVetServiceSchema.parse({
        ...req.body,
        vetId: req.user!.id,
      });

      // Create vet service in PostgreSQL
      const [service] = await db
        .insert(vetServices)
        .values(data as any)
        .returning();
      
      res.status(201).json(service);
    } catch (error) {
      console.error("Failed to create vet service:", error);
      res.status(400).json({ message: "Failed to create service", error });
    }
  });

  // ============ Transport Service Routes ============
  app.get("/api/transport-services", async (req: Request, res: Response) => {
    try {
      // Get transport services from PostgreSQL
      // Note: TransportServices uses serviceAreas (array) not city field
      const services = await db
        .select()
        .from(transportServices)
        .orderBy(desc(transportServices.createdAt));
      
      res.json(services);
    } catch (error) {
      console.error("Failed to fetch transport services:", error);
      res.status(500).json({ message: "Failed to fetch transport services" });
    }
  });

  app.get("/api/transport-services/:id", async (req: Request, res: Response) => {
    try {
      const [service] = await db
        .select()
        .from(transportServices)
        .where(eq(transportServices.id, req.params.id))
        .limit(1);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Get transporter user
      const [transporter] = await db
        .select()
        .from(users)
        .where(eq(users.id, service.transporterId))
        .limit(1);
      
      // Get reviews
      const serviceReviews = await db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.targetId, req.params.id),
            eq(reviews.targetType, "transport_service")
          )
        );

      // Sanitize transporter object
      let sanitizedTransporter = null;
      if (transporter) {
        const { password: _, ...safe } = transporter;
        sanitizedTransporter = safe;
      }

      res.json({
        ...service,
        transporter: sanitizedTransporter,
        reviews: serviceReviews,
      });
    } catch (error) {
      console.error("Failed to fetch transport service:", error);
      res.status(500).json({ message: "Failed to fetch transport service" });
    }
  });

  app.post("/api/transport-services", authMiddleware, async (req: Request, res: Response) => {
    try {
      if (req.user!.role !== "transporter") {
        return res.status(403).json({ message: "Only transporters can create services" });
      }

      const data = insertTransportServiceSchema.parse({
        ...req.body,
        transporterId: req.user!.id,
      });

      // Create transport service in PostgreSQL
      const [service] = await db
        .insert(transportServices)
        .values(data as any)
        .returning();
      
      res.status(201).json(service);
    } catch (error) {
      console.error("Failed to create transport service:", error);
      res.status(400).json({ message: "Failed to create service", error });
    }
  });

  // ============ Review Routes ============
  app.post("/api/reviews", authMiddleware, async (req: Request, res: Response) => {
    try {
      const data = insertReviewSchema.parse({
        ...req.body,
        reviewerId: req.user!.id,
      });

      // Create review in PostgreSQL
      const [review] = await db
        .insert(reviews)
        .values(data)
        .returning();
      
      res.status(201).json(review);
    } catch (error) {
      console.error("Failed to create review:", error);
      res.status(400).json({ message: "Failed to create review", error });
    }
  });

  // ============ Favorite Routes ============
  app.get("/api/favorites", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Get favorites from PostgreSQL
      const favs = await db
        .select()
        .from(favorites)
        .where(eq(favorites.userId, req.user!.id));
      
      res.json(favs);
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", authMiddleware, async (req: Request, res: Response) => {
    try {
      const data = insertFavoriteSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      // Create favorite in PostgreSQL
      const [favorite] = await db
        .insert(favorites)
        .values(data)
        .returning();
      
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Failed to add favorite:", error);
      res.status(400).json({ message: "Failed to add favorite", error });
    }
  });

  app.delete("/api/favorites/:listingId", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Delete favorite from PostgreSQL
      await db
        .delete(favorites)
        .where(
          and(
            eq(favorites.userId, req.user!.id),
            eq(favorites.listingId, req.params.listingId)
          )
        );
      
      res.json({ message: "Favorite removed" });
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      res.status(400).json({ message: "Failed to remove favorite", error });
    }
  });

  // ============ Object Storage Routes ============
  
  // Get upload URL for object
  app.post("/api/objects/upload", createLimiter, authMiddleware, async (req: Request, res: Response) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Serve uploaded objects (listing images - public read access for now)
  // TODO: Implement ACL policy for granular access control per listing
  app.get("/objects/:objectPath(*)", async (req: Request, res: Response) => {
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

  // Serve public assets
  app.get("/public-objects/:filePath(*)", async (req: Request, res: Response) => {
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

  return httpServer;
}
