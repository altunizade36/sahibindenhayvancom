import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { db } from "./db";
import { locations, listings } from "@shared/schema";
import { eq, and, isNull, desc, sql, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import {
  insertUserSchema,
  insertListingSchema,
  insertAuctionSchema,
  insertBidSchema,
  insertLiveStreamSchema,
  insertMessageSchema,
  insertBlogPostSchema,
  insertVetServiceSchema,
  insertTransportServiceSchema,
  insertReviewSchema,
  insertFavoriteSchema,
  type User,
} from "@shared/schema";
import agoraToken from "agora-access-token";
import Stripe from "stripe";
const { RtcTokenBuilder, RtcRole } = agoraToken;

// Validate critical environment variables
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required for JWT authentication");
}

const JWT_SECRET = process.env.SESSION_SECRET;
const AGORA_APP_ID = process.env.AGORA_APP_ID || "";
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || "";

// Initialize Stripe (optional - will use Stripe if keys are provided)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
}) : null;

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Auth middleware
function authMiddleware(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    storage.getUser(decoded.userId).then((user) => {
      if (!user) {
        return res.status(401).json({ message: "Invalid token" });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Optional auth middleware (doesn't fail if no token)
function optionalAuthMiddleware(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    storage.getUser(decoded.userId).then((user) => {
      if (user) {
        req.user = user;
      }
      next();
    });
  } catch (error) {
    next();
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // WebSocket connection handling
  const clients = new Map<string, WebSocket>();
  
  wss.on("connection", (ws: WebSocket, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    
    if (!token) {
      ws.close(1008, "No token provided");
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      clients.set(decoded.userId, ws);

      ws.on("message", async (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          // Handle different message types
          if (message.type === "chat") {
            const newMessage = await storage.createMessage({
              senderId: decoded.userId,
              receiverId: message.receiverId,
              listingId: message.listingId || null,
              content: message.content,
            });

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
            // Handle auction bid
            const auction = await storage.getAuction(message.auctionId);
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

            const bid = await storage.createBid({
              auctionId: message.auctionId,
              bidderId: decoded.userId,
              amount: message.amount,
            });

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
          } else if (message.type === "stream_chat") {
            // Handle live stream chat - save to database
            const chatMessage = await storage.createStreamChatMessage({
              streamId: message.streamId,
              senderId: decoded.userId,
              content: message.content,
            });

            // Get sender info
            const sender = await storage.getUser(decoded.userId);
            
            // Broadcast to all connected clients
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: "stream_chat",
                  streamId: message.streamId,
                  message: chatMessage,
                  sender: sender ? { id: sender.id, username: sender.username, avatar: sender.avatar } : null,
                }));
              }
            });
          } else if (message.type === "stream_join") {
            // Handle viewer joining stream
            await storage.addStreamViewer({
              streamId: message.streamId,
              userId: decoded.userId,
            });

            // Broadcast updated viewer count
            const stream = await storage.getLiveStream(message.streamId);
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: "stream_viewer_update",
                  streamId: message.streamId,
                  viewerCount: stream?.viewerCount || 0,
                }));
              }
            });
          } else if (message.type === "stream_leave") {
            // Handle viewer leaving stream
            await storage.removeStreamViewer(message.streamId, decoded.userId);

            // Broadcast updated viewer count
            const stream = await storage.getLiveStream(message.streamId);
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: "stream_viewer_update",
                  streamId: message.streamId,
                  viewerCount: stream?.viewerCount || 0,
                }));
              }
            });
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
        }
      });

      ws.on("close", async () => {
        clients.delete(decoded.userId);
        
        // Cleanup: Remove user from all active stream viewers
        try {
          const activeViewers = await storage.getActiveStreamViewersByUser(decoded.userId);
          
          for (const viewer of activeViewers) {
            await storage.removeStreamViewer(viewer.streamId, decoded.userId);
            
            // Broadcast updated viewer count
            const stream = await storage.getLiveStream(viewer.streamId);
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: "stream_viewer_update",
                  streamId: viewer.streamId,
                  viewerCount: stream?.viewerCount || 0,
                }));
              }
            });
          }
        } catch (error) {
          console.error("Failed to cleanup disconnected viewer:", error);
        }
      });
    } catch (error) {
      ws.close(1008, "Invalid token");
    }
  });

  // ============ Auth Routes ============
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      // Create JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      // Sanitize user object - remove password
      const { password: _, ...sanitizedUser } = user;

      res.json({
        token,
        user: sanitizedUser,
      });
    } catch (error) {
      res.status(400).json({ message: "Registration failed", error });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      const user = await storage.getUserByUsername(username);
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
      
      const updated = await storage.updateUser(req.user!.id, safeUpdates);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      // Sanitize user object - remove password
      const { password: _, ...sanitizedUser } = updated;
      res.json(sanitizedUser);
    } catch (error) {
      res.status(400).json({ message: "Update failed", error });
    }
  });

  // ============ Category Routes ============
  app.get("/api/categories", async (_req: Request, res: Response) => {
    const categories = await storage.getAllCategories();
    res.json(categories);
  });
  
  app.get("/api/categories/tree", async (_req: Request, res: Response) => {
    const tree = await storage.getCategoryTree();
    res.json(tree);
  });

  app.get("/api/categories/:slug", async (req: Request, res: Response) => {
    const category = await storage.getCategoryBySlug(req.params.slug);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
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
        const favorites = await storage.getFavoritesByUser(req.user.id);
        const favoriteIds = new Set(favorites.map(f => f.listingId));
        
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

      // Get seller info
      const seller = await storage.getUser(listing.sellerId);

      // Check if favorited
      let isFavorite = false;
      if (req.user) {
        isFavorite = await storage.isFavorite(req.user.id, listing.id);
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

  app.post("/api/listings", authMiddleware, async (req: Request, res: Response) => {
    try {
      const data = insertListingSchema.parse({
        ...req.body,
        sellerId: req.user!.id,
      });

      const [listing] = await db.insert(listings).values(data).returning();
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
    const auctions = await storage.getAllAuctions(req.query.status as string);
    res.json(auctions);
  });

  app.get("/api/auctions/:id", async (req: Request, res: Response) => {
    const auction = await storage.getAuction(req.params.id);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    const bids = await storage.getBidsByAuction(req.params.id);
    const listing = await storage.getListing(auction.listingId);

    res.json({
      ...auction,
      bids,
      listing,
    });
  });

  app.post("/api/auctions", authMiddleware, async (req: Request, res: Response) => {
    try {
      const data = insertAuctionSchema.parse(req.body);
      
      // Verify listing belongs to user
      const listing = await storage.getListing(data.listingId);
      if (!listing || listing.sellerId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const auction = await storage.createAuction(data);
      res.status(201).json(auction);
    } catch (error) {
      res.status(400).json({ message: "Failed to create auction", error });
    }
  });

  app.get("/api/auctions/:id/bids", async (req: Request, res: Response) => {
    const bids = await storage.getBidsByAuction(req.params.id);
    res.json(bids);
  });

  // ============ Live Stream Routes ============
  app.get("/api/streams", async (req: Request, res: Response) => {
    const streams = await storage.getAllLiveStreams(req.query.status as string);
    res.json(streams);
  });

  app.get("/api/streams/:id", async (req: Request, res: Response) => {
    const stream = await storage.getLiveStream(req.params.id);
    if (!stream) {
      return res.status(404).json({ message: "Stream not found" });
    }

    const streamer = await storage.getUser(stream.streamerId);
    let listing = null;
    if (stream.listingId) {
      listing = await storage.getListing(stream.listingId);
    }

    // Sanitize streamer object
    let sanitizedStreamer = null;
    if (streamer) {
      const { password: _, ...safe } = streamer;
      sanitizedStreamer = safe;
    }

    res.json({
      ...stream,
      streamer: sanitizedStreamer,
      listing,
    });
  });

  app.post("/api/streams", authMiddleware, async (req: Request, res: Response) => {
    try {
      const data = insertLiveStreamSchema.parse({
        ...req.body,
        streamerId: req.user!.id,
      });

      const stream = await storage.createLiveStream(data);
      res.status(201).json(stream);
    } catch (error) {
      res.status(400).json({ message: "Failed to create stream", error });
    }
  });

  app.patch("/api/streams/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const stream = await storage.getLiveStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      if (stream.streamerId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updated = await storage.updateLiveStream(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Update failed", error });
    }
  });

  // Agora token generation
  app.post("/api/streams/:id/token", authMiddleware, async (req: Request, res: Response) => {
    try {
      // Validate Agora credentials are configured
      if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
        return res.status(500).json({
          message: "Live streaming is not configured. Please contact support.",
          error: "Missing AGORA_APP_ID or AGORA_APP_CERTIFICATE configuration",
        });
      }

      const stream = await storage.getLiveStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      const uid = 0; // 0 for string user IDs
      const role = stream.streamerId === req.user!.id ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
      const expirationTimeInSeconds = 3600; // 1 hour
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

      const token = RtcTokenBuilder.buildTokenWithUid(
        AGORA_APP_ID,
        AGORA_APP_CERTIFICATE,
        stream.channelName,
        uid,
        role,
        privilegeExpiredTs
      );

      res.json({
        token,
        appId: AGORA_APP_ID,
        channelName: stream.channelName,
        uid: req.user!.id,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate token", error: String(error) });
    }
  });

  // Start stream
  app.post("/api/streams/:id/start", authMiddleware, async (req: Request, res: Response) => {
    try {
      const stream = await storage.getLiveStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      if (stream.streamerId !== req.user!.id) {
        return res.status(403).json({ message: "Only the streamer can start the stream" });
      }

      const updated = await storage.updateLiveStream(req.params.id, {
        status: "live",
        startedAt: new Date(),
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to start stream", error: String(error) });
    }
  });

  // End stream
  app.post("/api/streams/:id/end", authMiddleware, async (req: Request, res: Response) => {
    try {
      const stream = await storage.getLiveStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      if (stream.streamerId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only the streamer or admin can end the stream" });
      }

      const updated = await storage.updateLiveStream(req.params.id, {
        status: "ended",
        endedAt: new Date(),
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to end stream", error: String(error) });
    }
  });

  // Delete stream
  app.delete("/api/streams/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const stream = await storage.getLiveStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      if (stream.streamerId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deleteLiveStream(req.params.id);
      res.json({ message: "Stream deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete stream", error: String(error) });
    }
  });

  // ============ Stream Chat & Viewers ============
  // Get stream chat history
  app.get("/api/streams/:id/chat", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const messages = await storage.getStreamChatMessages(req.params.id, limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get chat messages", error: String(error) });
    }
  });

  // Get active stream viewers
  app.get("/api/streams/:id/viewers", async (req: Request, res: Response) => {
    try {
      const viewers = await storage.getActiveStreamViewers(req.params.id);
      res.json(viewers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get viewers", error: String(error) });
    }
  });

  // ============ Wallet & Payment Routes ============
  // Get user wallet balance
  app.get("/api/wallet/balance", authMiddleware, async (req: Request, res: Response) => {
    try {
      const balance = await storage.getUserBalance(req.user!.id);
      res.json({ balance });
    } catch (error) {
      res.status(500).json({ message: "Failed to get balance", error: String(error) });
    }
  });

  // Get user transaction history
  app.get("/api/wallet/transactions", authMiddleware, async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getTransactionsByUser(req.user!.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get transactions", error: String(error) });
    }
  });

  // Create Stripe payment intent for wallet topup
  app.post("/api/wallet/deposit", authMiddleware, async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe is not configured. Please contact support." });
      }

      const { amount } = req.body;
      const numAmount = parseFloat(amount);
      
      // Validate amount (min: 10 TRY, max: 10000 TRY)
      if (!amount || isNaN(numAmount) || numAmount < 10 || numAmount > 10000) {
        return res.status(400).json({ 
          message: "Geçersiz tutar. Minimum ₺10, maksimum ₺10,000 yükleyebilirsiniz." 
        });
      }

      // Create Stripe customer if doesn't exist
      let stripeCustomerId = req.user!.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: req.user!.email,
          name: req.user!.username,
          metadata: { userId: req.user!.id },
        });
        stripeCustomerId = customer.id;
        await storage.updateUser(req.user!.id, { stripeCustomerId });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(amount) * 100), // Convert to cents
        currency: "try", // Turkish Lira
        customer: stripeCustomerId,
        metadata: {
          userId: req.user!.id,
          type: "deposit",
        },
      });

      // Create pending transaction
      await storage.createTransaction({
        userId: req.user!.id,
        type: "deposit",
        amount,
        status: "pending",
        stripePaymentId: paymentIntent.id,
        description: "Wallet deposit",
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create payment intent", error: String(error) });
    }
  });

  // Stripe webhook handler
  app.post("/api/webhooks/stripe", async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured" });
      }

      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      // Verify webhook signature for security
      let event;
      try {
        if (webhookSecret && sig) {
          // Use raw body for signature verification
          const rawBody = (req as any).rawBody || req.body;
          event = stripe.webhooks.constructEvent(
            rawBody,
            sig as string,
            webhookSecret
          );
        } else {
          // Development mode: skip signature verification if webhook secret not configured
          event = req.body;
        }
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return res.status(400).json({ message: "Webhook signature verification failed" });
      }

      // Handle payment intent succeeded
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const { userId, type } = paymentIntent.metadata;

        if (type === "deposit") {
          const amount = (paymentIntent.amount / 100).toFixed(2);
          
          // Find transaction by stripePaymentId (not by paymentIntent.id)
          const transactions = await storage.getTransactionsByUser(userId);
          const transaction = transactions.find(t => t.stripePaymentId === paymentIntent.id);
          
          if (transaction) {
            // Update transaction status using correct transaction ID
            await storage.updateTransactionStatus(transaction.id, "completed");
            
            // Add to user balance
            await storage.updateUserBalance(userId, amount);
          }
        }
      }

      res.json({ received: true });
    } catch (error) {
      res.status(500).json({ message: "Webhook error", error: String(error) });
    }
  });

  // ============ Message Routes ============
  app.get("/api/messages/conversations", authMiddleware, async (req: Request, res: Response) => {
    const conversations = await storage.getConversations(req.user!.id);
    res.json(conversations);
  });

  app.get("/api/messages/:userId", authMiddleware, async (req: Request, res: Response) => {
    const messages = await storage.getMessagesBetweenUsers(req.user!.id, req.params.userId);
    res.json(messages);
  });

  app.post("/api/messages", authMiddleware, async (req: Request, res: Response) => {
    try {
      const data = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user!.id,
      });

      const message = await storage.createMessage(data);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: "Failed to send message", error });
    }
  });

  // ============ Blog Routes ============
  app.get("/api/blog", async (req: Request, res: Response) => {
    const published = req.query.published !== "false";
    const posts = await storage.getAllBlogPosts(published);
    res.json(posts);
  });

  app.get("/api/blog/:slug", async (req: Request, res: Response) => {
    const post = await storage.getBlogPostBySlug(req.params.slug);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const author = await storage.getUser(post.authorId);

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

      const post = await storage.createBlogPost(data);
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ message: "Failed to create post", error });
    }
  });

  // ============ Vet Service Routes ============
  app.get("/api/vet-services", async (req: Request, res: Response) => {
    const services = await storage.getAllVetServices(req.query.city as string);
    res.json(services);
  });

  app.get("/api/vet-services/:id", async (req: Request, res: Response) => {
    const service = await storage.getVetService(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const vet = await storage.getUser(service.vetId);
    const reviews = await storage.getReviewsByTarget(req.params.id, "vet_service");

    // Sanitize vet object
    let sanitizedVet = null;
    if (vet) {
      const { password: _, ...safe } = vet;
      sanitizedVet = safe;
    }

    res.json({
      ...service,
      vet: sanitizedVet,
      reviews,
    });
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

      const service = await storage.createVetService(data);
      res.status(201).json(service);
    } catch (error) {
      res.status(400).json({ message: "Failed to create service", error });
    }
  });

  // ============ Transport Service Routes ============
  app.get("/api/transport-services", async (req: Request, res: Response) => {
    const services = await storage.getAllTransportServices(req.query.city as string);
    res.json(services);
  });

  app.get("/api/transport-services/:id", async (req: Request, res: Response) => {
    const service = await storage.getTransportService(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const transporter = await storage.getUser(service.transporterId);
    const reviews = await storage.getReviewsByTarget(req.params.id, "transport_service");

    // Sanitize transporter object
    let sanitizedTransporter = null;
    if (transporter) {
      const { password: _, ...safe } = transporter;
      sanitizedTransporter = safe;
    }

    res.json({
      ...service,
      transporter: sanitizedTransporter,
      reviews,
    });
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

      const service = await storage.createTransportService(data);
      res.status(201).json(service);
    } catch (error) {
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

      const review = await storage.createReview(data);
      res.status(201).json(review);
    } catch (error) {
      res.status(400).json({ message: "Failed to create review", error });
    }
  });

  // ============ Favorite Routes ============
  app.get("/api/favorites", authMiddleware, async (req: Request, res: Response) => {
    const favorites = await storage.getFavoritesByUser(req.user!.id);
    res.json(favorites);
  });

  app.post("/api/favorites", authMiddleware, async (req: Request, res: Response) => {
    try {
      const data = insertFavoriteSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      const favorite = await storage.createFavorite(data);
      res.status(201).json(favorite);
    } catch (error) {
      res.status(400).json({ message: "Failed to add favorite", error });
    }
  });

  app.delete("/api/favorites/:listingId", authMiddleware, async (req: Request, res: Response) => {
    try {
      await storage.deleteFavorite(req.user!.id, req.params.listingId);
      res.json({ message: "Favorite removed" });
    } catch (error) {
      res.status(400).json({ message: "Failed to remove favorite", error });
    }
  });

  return httpServer;
}
