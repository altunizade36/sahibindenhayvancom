import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { db } from "./db";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, getSession } from "./replitAuth";
import passport from "passport";
import { cache, cacheKeys, cacheTTL } from "./cache";
import { healthCheck, metricsEndpoint } from "./monitoring";
import { locations, listings, blogPosts, users, messages, conversations, userPresence, messageReactions, favorites, categories, auctions, bids, liveStreams, insertLiveStreamSchema, vetServices, transportServices, reviews, stores, storeReviews, storeMedia, storeCategories, storeFollowers, notifications, insertNotificationSchema, reports, insertReportSchema, offers, insertOfferSchema, phoneVerifications, listingImages, insertListingImageSchema, userSettings, userDevices, loginHistory, restrictedCategories, categoryDocumentRequirements, listingDocuments } from "@shared/schema";
import { processAndUploadImage, deleteImageVariants, validateImageFile, processStoreImage } from "./imageProcessor";
import { eq, and, isNull, desc, sql, count, inArray, gte, lte, ilike, or } from "drizzle-orm";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import multer from "multer";
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
  insertStoreSchema,
  insertStoreReviewSchema,
  type User,
} from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { emailService, generateVerificationToken, shouldAutoVerifyEmail } from "./email";
import { smsService, generateOtp, validateAndNormalizeTurkishPhone } from "./sms";
import { verifyRecaptcha } from "./recaptcha";
import { moderateListingSchema } from "./validation";
import { verifyFirebaseToken, formatPhoneFromFirebase } from "./firebaseAdmin";

// SESSION_SECRET is now used for session management (not JWT)

// ============ Multer Configuration for File Uploads ============
// Upload config for images only (listings, stores, etc.)
const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir'));
    }
  },
});

// Upload config for messages (images + documents)
const uploadMessageFiles = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya türü'));
    }
  },
});

// Legacy alias for backward compatibility
const upload = uploadImages;

// ============ Rate Limiting Configuration ============

// Moderate rate limiter for resource creation
// More generous limits for development, stricter in production
const isDevelopment = process.env.NODE_ENV !== 'production';
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDevelopment ? 60 : 20, // 60 requests/min in dev, 20 in production
  message: "Çok fazla istek gönderdiniz. Lütfen bir dakika bekleyin.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDevelopment && req.path === '/api/listings', // Skip rate limit for listings in dev
});

// Extended user type for authenticated requests (combines session user with DB user)
interface AuthenticatedUser {
  id: string;
  email: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: 'admin' | 'buyer' | 'seller' | 'vet' | 'transporter';
  phone: string | null;
  city: string | null;
  district: string | null;
  bio: string | null;
  emailVerified: boolean;
  claims?: { sub: string; email?: string; [key: string]: any };
  dbUserId?: string;
}

// Helper function to get user ID from session (handles OIDC and email/phone auth)
// Returns a non-null string for authenticated routes (throws if not found)
function getUserId(user: any): string {
  const id = user?.claims?.sub ?? user?.dbUserId ?? user?.id;
  if (!id) {
    throw new Error('User ID not found in session');
  }
  return id;
}

// Helper function to parse user-agent and extract device info
function parseUserAgent(userAgent: string | undefined): { deviceType: string; browser: string; os: string } {
  if (!userAgent) {
    return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' };
  }

  // Detect device type
  let deviceType = 'desktop';
  if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
    deviceType = /ipad|tablet/i.test(userAgent) ? 'tablet' : 'mobile';
  }

  // Detect browser
  let browser = 'unknown';
  if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/edg/i.test(userAgent)) browser = 'Edge';
  else if (/chrome/i.test(userAgent)) browser = 'Chrome';
  else if (/safari/i.test(userAgent)) browser = 'Safari';
  else if (/opera|opr/i.test(userAgent)) browser = 'Opera';

  // Detect OS
  let os = 'unknown';
  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/mac os|macos/i.test(userAgent)) os = 'macOS';
  else if (/linux/i.test(userAgent)) os = 'Linux';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/iphone|ipad|ios/i.test(userAgent)) os = 'iOS';

  return { deviceType, browser, os };
}

// Helper function to record login history
async function recordLoginHistory(
  userId: string,
  req: Request,
  success: boolean,
  loginMethod: string,
  failureReason?: string
): Promise<void> {
  try {
    const userAgentStr = req.headers['user-agent'] || '';
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                      req.socket.remoteAddress || 
                      'unknown';

    await db.insert(loginHistory).values({
      id: crypto.randomUUID(),
      userId,
      loginMethod,
      ipAddress,
      userAgent: userAgentStr,
      location: null,
      success,
      failureReason: failureReason || null,
    });
  } catch (error) {
    console.error('Error recording login history:', error);
  }
}

// Helper function to register/update device
async function registerDevice(userId: string, req: Request): Promise<void> {
  try {
    const userAgentStr = req.headers['user-agent'] || '';
    const { deviceType, browser, os } = parseUserAgent(userAgentStr);
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                      req.socket.remoteAddress || 
                      'unknown';

    const deviceName = `${browser} - ${os}`;
    const deviceId = crypto.randomUUID();

    // Check if a similar device already exists
    const existingDevice = await db.query.userDevices.findFirst({
      where: and(
        eq(userDevices.userId, userId),
        eq(userDevices.browser, browser),
        eq(userDevices.os, os)
      ),
    });

    if (existingDevice) {
      // Update last active
      await db
        .update(userDevices)
        .set({ lastActive: new Date(), ipAddress })
        .where(eq(userDevices.id, existingDevice.id));
    } else {
      // Create new device record
      await db.insert(userDevices).values({
        id: deviceId,
        userId,
        deviceName,
        deviceType,
        browser,
        os,
        ipAddress,
        location: null,
        lastActive: new Date(),
        isTrusted: false,
      });
    }
  } catch (error) {
    console.error('Error registering device:', error);
  }
}

// Note: Express Request.user type is extended via replitAuth.ts

// Legacy JWT middleware removed - now using Replit Auth sessions
// Use isAuthenticated from replitAuth.ts for protected routes

export async function registerRoutes(app: Express): Promise<Server> {
  // ============ Replit Auth Setup ============
  await setupAuth(app);

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
  type ClientInfo = {
    ws: WebSocket;
    userId: string;
    auctionId?: string;
    streamId?: string;
    currentConversationId?: string;
  };
  
  const clients = new Map<string, ClientInfo>();
  const MAX_CONNECTIONS = 50000; // Limit concurrent connections
  const HEARTBEAT_INTERVAL = 30000; // 30 seconds
  const CONNECTION_TIMEOUT = 300000; // 5 minutes idle timeout for chat
  const TYPING_TIMEOUT = 3000; // 3 seconds typing indicator timeout
  
  // Heartbeat tracking
  const heartbeats = new Map<string, NodeJS.Timeout>();
  
  // Typing indicator tracking
  const typingUsers = new Map<string, NodeJS.Timeout>();
  
  // Helper: Generate conversation ID (sorted user IDs)
  const generateConversationId = (userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join('_');
  };
  
  // Helper: Update user presence
  const updateUserPresence = async (userId: string, isOnline: boolean, socketId?: string) => {
    try {
      await db
        .insert(userPresence)
        .values({
          userId,
          isOnline,
          lastSeenAt: new Date(),
          lastActiveAt: new Date(),
          socketId: socketId || null,
        })
        .onConflictDoUpdate({
          target: userPresence.userId,
          set: {
            isOnline,
            lastSeenAt: new Date(),
            lastActiveAt: new Date(),
            socketId: socketId || null,
          },
        });
    } catch (error) {
      console.error("Failed to update user presence:", error);
    }
  };
  
  // Helper: Broadcast to specific user
  const broadcastToUser = (userId: string, data: any) => {
    const client = clients.get(userId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  };
  
  // Helper: Get or create conversation
  const getOrCreateConversation = async (participant1Id: string, participant2Id: string, listingId?: string) => {
    const conversationId = generateConversationId(participant1Id, participant2Id);
    
    // Check if conversation exists
    const [existing] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    
    if (existing) {
      return existing;
    }
    
    // Create new conversation - ensure participant1 is always the smaller ID
    const [p1, p2] = [participant1Id, participant2Id].sort();
    const [newConversation] = await db
      .insert(conversations)
      .values({
        id: conversationId,
        participant1Id: p1,
        participant2Id: p2,
        listingId: listingId || null,
        participant1Archived: false,
        participant2Archived: false,
        participant1Pinned: false,
        participant2Pinned: false,
        participant1Muted: false,
        participant2Muted: false,
      })
      .returning();
    
    return newConversation;
  };
  
  wss.on("connection", async (ws: WebSocket, req) => {
    // Check connection limit
    if (clients.size >= MAX_CONNECTIONS) {
      ws.close(1008, "Server at capacity");
      return;
    }

    try {
      // Run session middleware to populate req.session and req.user
      const sessionMiddleware = getSession();
      await new Promise<void>((resolve, reject) => {
        sessionMiddleware(req, {} as any, (err?: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Run passport middleware to deserialize user
      await new Promise<void>((resolve, reject) => {
        passport.initialize()(req as any, {} as any, (err?: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      await new Promise<void>((resolve, reject) => {
        passport.session()(req as any, {} as any, (err?: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Check if user is authenticated
      const user = (req as any).user;
      if (!(req as any).isAuthenticated || !(req as any).isAuthenticated() || !user?.claims?.sub) {
        ws.close(1008, "Unauthorized - Please log in");
        return;
      }

      const userId = user.claims.sub;
      
      // Close existing connection for this user
      const existingClient = clients.get(userId);
      if (existingClient && existingClient.ws.readyState === WebSocket.OPEN) {
        existingClient.ws.close(1000, "New connection established");
      }
      
      // Create client info
      const clientInfo: ClientInfo = {
        ws,
        userId,
      };
      
      clients.set(userId, clientInfo);
      
      // Update user presence to online
      await updateUserPresence(userId, true, `ws_${Date.now()}`);
      
      // Notify contacts that user is online
      const userConversations = await db
        .select()
        .from(conversations)
        .where(
          or(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, userId)
          )
        );
      
      for (const conv of userConversations) {
        const partnerId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
        broadcastToUser(partnerId, {
          type: "presence",
          userId,
          isOnline: true,
          lastSeenAt: new Date().toISOString(),
        });
      }
      
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
          if (message.type === "subscribe") {
            // Subscribe to auction or stream
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
            // Handle typing indicator start
            const receiverId = message.receiverId;
            const conversationId = generateConversationId(userId, receiverId);
            
            // Clear existing typing timeout
            const existingTimeout = typingUsers.get(`${userId}_${conversationId}`);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }
            
            // Notify receiver that user is typing
            broadcastToUser(receiverId, {
              type: "typing",
              userId,
              conversationId,
              isTyping: true,
            });
            
            // Auto-stop typing after timeout
            const timeout = setTimeout(() => {
              broadcastToUser(receiverId, {
                type: "typing",
                userId,
                conversationId,
                isTyping: false,
              });
              typingUsers.delete(`${userId}_${conversationId}`);
            }, TYPING_TIMEOUT);
            
            typingUsers.set(`${userId}_${conversationId}`, timeout);
          } else if (message.type === "typing_stop") {
            // Handle typing indicator stop
            const receiverId = message.receiverId;
            const conversationId = generateConversationId(userId, receiverId);
            
            // Clear existing typing timeout
            const existingTimeout = typingUsers.get(`${userId}_${conversationId}`);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
              typingUsers.delete(`${userId}_${conversationId}`);
            }
            
            // Notify receiver that user stopped typing
            broadcastToUser(receiverId, {
              type: "typing",
              userId,
              conversationId,
              isTyping: false,
            });
          } else if (message.type === "mark_read") {
            // Mark messages as read
            const conversationId = message.conversationId;
            const messageIds = message.messageIds;
            
            if (messageIds && messageIds.length > 0) {
              // Update specific messages
              await db
                .update(messages)
                .set({
                  status: "read",
                  readAt: new Date(),
                })
                .where(
                  and(
                    inArray(messages.id, messageIds),
                    eq(messages.receiverId, userId)
                  )
                );
              
              // Notify sender about read receipt
              for (const msgId of messageIds) {
                const [msg] = await db
                  .select()
                  .from(messages)
                  .where(eq(messages.id, msgId))
                  .limit(1);
                
                if (msg) {
                  broadcastToUser(msg.senderId, {
                    type: "message_read",
                    messageId: msgId,
                    conversationId,
                    readAt: new Date().toISOString(),
                  });
                }
              }
            }
            
            // Update conversation unread count
            const [conv] = await db
              .select()
              .from(conversations)
              .where(eq(conversations.id, conversationId))
              .limit(1);
            
            if (conv) {
              const updateData = conv.participant1Id === userId
                ? { participant1UnreadCount: 0, participant1LastReadAt: new Date() }
                : { participant2UnreadCount: 0, participant2LastReadAt: new Date() };
              
              await db
                .update(conversations)
                .set(updateData)
                .where(eq(conversations.id, conversationId));
            }
            
            ws.send(JSON.stringify({ type: "marked_read", conversationId }));
          } else if (message.type === "chat") {
            // Get or create conversation
            const conversation = await getOrCreateConversation(
              userId,
              message.receiverId,
              message.listingId
            );
            
            // Create message in PostgreSQL
            const [newMessage] = await db
              .insert(messages)
              .values({
                senderId: userId,
                receiverId: message.receiverId,
                conversationId: conversation.id,
                listingId: message.listingId || null,
                content: message.content,
                messageType: message.messageType || "text",
                replyToId: message.replyToId || null,
                attachments: message.attachments || [],
              })
              .returning();
            
            // Update conversation
            const isParticipant1Receiver = conversation.participant1Id === message.receiverId;
            await db
              .update(conversations)
              .set({
                lastMessageId: newMessage.id,
                lastMessageAt: new Date(),
                updatedAt: new Date(),
                ...(isParticipant1Receiver
                  ? { participant1UnreadCount: sql`${conversations.participant1UnreadCount} + 1` }
                  : { participant2UnreadCount: sql`${conversations.participant2UnreadCount} + 1` }),
              })
              .where(eq(conversations.id, conversation.id));

            // Send to receiver if online
            const receiverOnline = broadcastToUser(message.receiverId, {
              type: "chat",
              message: {
                ...newMessage,
                sender: {
                  id: userId,
                  firstName: (user as any).firstName,
                  lastName: (user as any).lastName,
                  profileImageUrl: (user as any).profileImageUrl,
                },
              },
              conversationId: conversation.id,
            });
            
            // If receiver is online, mark as delivered
            if (receiverOnline) {
              await db
                .update(messages)
                .set({
                  status: "delivered",
                  deliveredAt: new Date(),
                })
                .where(eq(messages.id, newMessage.id));
              
              // Notify sender about delivery
              ws.send(JSON.stringify({
                type: "message_delivered",
                messageId: newMessage.id,
                conversationId: conversation.id,
                deliveredAt: new Date().toISOString(),
              }));
            }

            // Send confirmation to sender
            ws.send(JSON.stringify({
              type: "chat_sent",
              message: newMessage,
              conversationId: conversation.id,
            }));
            
            // Clear typing indicator
            const existingTimeout = typingUsers.get(`${userId}_${conversation.id}`);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
              typingUsers.delete(`${userId}_${conversation.id}`);
            }
            broadcastToUser(message.receiverId, {
              type: "typing",
              userId,
              conversationId: conversation.id,
              isTyping: false,
            });
          } else if (message.type === "delete_message") {
            // Soft delete a message
            const messageId = message.messageId;
            
            const [msg] = await db
              .select()
              .from(messages)
              .where(and(eq(messages.id, messageId), eq(messages.senderId, userId)))
              .limit(1);
            
            if (msg) {
              await db
                .update(messages)
                .set({
                  isDeleted: true,
                  deletedAt: new Date(),
                  content: "Bu mesaj silindi",
                })
                .where(eq(messages.id, messageId));
              
              // Notify receiver
              broadcastToUser(msg.receiverId, {
                type: "message_deleted",
                messageId,
                conversationId: msg.conversationId,
              });
              
              ws.send(JSON.stringify({
                type: "message_deleted",
                messageId,
                conversationId: msg.conversationId,
              }));
            }
          } else if (message.type === "edit_message") {
            // Edit a message
            const messageId = message.messageId;
            const newContent = message.content;
            
            const [msg] = await db
              .select()
              .from(messages)
              .where(and(eq(messages.id, messageId), eq(messages.senderId, userId)))
              .limit(1);
            
            if (msg && !msg.isDeleted) {
              await db
                .update(messages)
                .set({
                  content: newContent,
                  isEdited: true,
                  editedAt: new Date(),
                })
                .where(eq(messages.id, messageId));
              
              // Notify receiver
              broadcastToUser(msg.receiverId, {
                type: "message_edited",
                messageId,
                conversationId: msg.conversationId,
                newContent,
                editedAt: new Date().toISOString(),
              });
              
              ws.send(JSON.stringify({
                type: "message_edited",
                messageId,
                conversationId: msg.conversationId,
                newContent,
                editedAt: new Date().toISOString(),
              }));
            }
          } else if (message.type === "get_presence") {
            // Get presence status for a user
            const targetUserId = message.userId;
            const [presence] = await db
              .select()
              .from(userPresence)
              .where(eq(userPresence.userId, targetUserId))
              .limit(1);
            
            ws.send(JSON.stringify({
              type: "presence",
              userId: targetUserId,
              isOnline: presence?.isOnline || false,
              lastSeenAt: presence?.lastSeenAt?.toISOString() || null,
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
                bidderId: userId,
                amount: message.amount,
              })
              .returning();

            // Broadcast bid only to clients subscribed to this auction
            for (const clientInfo of Array.from(clients.values())) {
              if (clientInfo.ws.readyState === WebSocket.OPEN && clientInfo.auctionId === message.auctionId) {
                clientInfo.ws.send(JSON.stringify({
                  type: "new_bid",
                  bid: {
                    id: bid.id,
                    auctionId: bid.auctionId,
                    bidderId: bid.bidderId,
                    amount: bid.amount,
                    createdAt: bid.createdAt,
                  },
                  auctionId: message.auctionId,
                }));
              }
            }
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
        }
      });

      ws.on("pong", () => {
        resetTimeout(); // Reset timeout on pong
      });
      
      ws.on("close", async () => {
        clients.delete(userId);
        clearInterval(heartbeat);
        heartbeats.delete(userId);
        clearTimeout(idleTimeout);
        
        // Update user presence to offline
        await updateUserPresence(userId, false);
        
        // Notify contacts that user is offline
        const userConvs = await db
          .select()
          .from(conversations)
          .where(
            or(
              eq(conversations.participant1Id, userId),
              eq(conversations.participant2Id, userId)
            )
          );
        
        for (const conv of userConvs) {
          const partnerId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
          broadcastToUser(partnerId, {
            type: "presence",
            userId,
            isOnline: false,
            lastSeenAt: new Date().toISOString(),
          });
        }
        
        // Clear any typing indicators for this user
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
    } catch (error) {
      console.error("WebSocket authentication error:", error);
      ws.close(1008, "Authentication failed - Please log in");
    }
  });

  // ============ Auth Routes (Hybrid: Replit Auth + Email/Password) ============
  
  // Unified Registration (Email + Phone)
  app.post('/api/auth/register', createLimiter, async (req: Request, res: Response) => {
    try {
      const { email, phone, password, firstName, lastName } = req.body;

      // Validation - require both email and phone
      if (!email || !phone || !password) {
        return res.status(400).json({ message: "Email, telefon ve şifre gereklidir" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Şifre en az 8 karakter olmalıdır" });
      }

      // Normalize phone number
      const normalizedPhone = phone.startsWith('+90') ? phone : phone.replace(/^0/, '+90');

      // Check if user already exists with email
      const existingEmailUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingEmailUser) {
        return res.status(400).json({ message: "Bu email adresi zaten kayıtlı" });
      }

      // Check if user already exists with phone
      const existingPhoneUser = await db.query.users.findFirst({
        where: eq(users.phone, normalizedPhone),
      });

      if (existingPhoneUser) {
        return res.status(400).json({ message: "Bu telefon numarası zaten kayıtlı" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate verification token for email
      const verificationToken = generateVerificationToken();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create user with both email and phone (both unverified initially)
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          phone: normalizedPhone,
          password: hashedPassword,
          firstName: firstName || null,
          lastName: lastName || null,
          emailVerified: false,
          phoneVerified: false,
          verificationToken,
          verificationTokenExpiry,
        })
        .returning();

      // Don't auto-login yet - wait for phone verification
      res.status(201).json({
        message: "Kayıt başarılı! Telefon doğrulaması bekleniyor.",
        userId: newUser.id,
        requiresPhoneVerification: true,
        requiresEmailVerification: true,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Kayıt sırasında bir hata oluştu" });
    }
  });

  // Unified Login (Email or Phone + Password)
  app.post('/api/auth/login', createLimiter, async (req: Request, res: Response) => {
    try {
      const { identifier, emailOrUsername, password } = req.body;
      
      // Support both old and new field names
      const loginIdentifier = identifier || emailOrUsername;

      if (!loginIdentifier || !password) {
        return res.status(400).json({ message: "Email/telefon ve şifre gereklidir" });
      }

      // Normalize identifier - check if it looks like a phone number
      let normalizedIdentifier = loginIdentifier;
      const isPhone = /^[\d\s\+\-\(\)]+$/.test(loginIdentifier.replace(/\s/g, '')) && 
                     loginIdentifier.replace(/\D/g, '').length >= 10;
      
      if (isPhone) {
        // Normalize phone number
        const digits = loginIdentifier.replace(/\D/g, '');
        normalizedIdentifier = digits.startsWith('90') ? `+${digits}` : `+90${digits.replace(/^0/, '')}`;
      }

      // Find user by email, phone, or username
      const user = await db.query.users.findFirst({
        where: or(
          eq(users.email, loginIdentifier),
          eq(users.phone, normalizedIdentifier),
          eq(users.username, loginIdentifier)
        ),
      });

      if (!user || !user.password) {
        // Record failed login attempt (user not found - but we still track by identifier)
        return res.status(401).json({ message: "Hatalı email/kullanıcı adı veya şifre" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        // Record failed login attempt
        await recordLoginHistory(user.id, req, false, isPhone ? 'phone' : 'email', 'Hatalı şifre');
        return res.status(401).json({ message: "Hatalı email/kullanıcı adı veya şifre" });
      }

      // Log user in by creating session
      (req as any).login({ claims: { sub: user.id } }, async (err: any) => {
        if (err) {
          console.error("Session creation error:", err);
          await recordLoginHistory(user.id, req, false, isPhone ? 'phone' : 'email', 'Oturum oluşturulamadı');
          return res.status(500).json({ message: "Giriş sırasında bir hata oluştu" });
        }

        // Record successful login and register device
        await recordLoginHistory(user.id, req, true, isPhone ? 'phone' : 'email');
        await registerDevice(user.id, req);

        res.json({
          message: "Giriş başarılı!",
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
          },
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Giriş sırasında bir hata oluştu" });
    }
  });

  // Forgot Password
  app.post('/api/auth/forgot-password', createLimiter, async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email gereklidir" });
      }

      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ message: "Eğer bu email kayıtlıysa, şifre sıfırlama linki gönderildi" });
      }

      // Generate reset token
      const resetToken = generateVerificationToken();
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Save reset token
      await db
        .update(users)
        .set({ resetToken, resetTokenExpiry })
        .where(eq(users.id, user.id));

      // Send password reset email
      await emailService.sendPasswordResetEmail(
        email,
        resetToken,
        user.username || user.firstName || email.split('@')[0]
      );

      res.json({ message: "Eğer bu email kayıtlıysa, şifre sıfırlama linki gönderildi" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Bir hata oluştu. Lütfen tekrar deneyin." });
    }
  });

  // Reset Password
  app.post('/api/auth/reset-password', createLimiter, async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token ve yeni şifre gereklidir" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Şifre en az 8 karakter olmalıdır" });
      }

      // Find user with valid reset token
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.resetToken, token),
          gte(users.resetTokenExpiry!, new Date())
        ),
      });

      if (!user) {
        return res.status(400).json({ message: "Geçersiz veya süresi dolmuş token" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      await db
        .update(users)
        .set({
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        })
        .where(eq(users.id, user.id));

      res.json({ message: "Şifreniz başarıyla güncellendi" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Bir hata oluştu. Lütfen tekrar deneyin." });
    }
  });

  // Verify Email
  app.get('/api/auth/verify-email', async (req: Request, res: Response) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Geçersiz doğrulama linki" });
      }

      // Find user with valid verification token
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.verificationToken, token),
          gte(users.verificationTokenExpiry!, new Date())
        ),
      });

      if (!user) {
        return res.status(400).json({ message: "Geçersiz veya süresi dolmuş doğrulama linki" });
      }

      // Verify email
      await db
        .update(users)
        .set({
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        })
        .where(eq(users.id, user.id));

      res.json({ message: "Email adresiniz başarıyla doğrulandı!" });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Bir hata oluştu. Lütfen tekrar deneyin." });
    }
  });

  // Resend Email Verification
  app.post('/api/auth/resend-verification', isAuthenticated, createLimiter, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);

      // Get current user
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!currentUser) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }

      if (currentUser.emailVerified) {
        return res.status(400).json({ message: "E-posta adresiniz zaten doğrulanmış" });
      }

      if (!currentUser.email) {
        return res.status(400).json({ message: "Hesabınızda e-posta adresi bulunamadı" });
      }

      // Check if we recently sent a verification email (rate limit)
      if (currentUser.verificationTokenExpiry) {
        const expiryTime = new Date(currentUser.verificationTokenExpiry);
        const createdTime = new Date(expiryTime.getTime() - 24 * 60 * 60 * 1000); // Token was created 24 hours before expiry
        const timeSinceCreation = Date.now() - createdTime.getTime();
        const oneMinute = 60 * 1000;
        
        if (timeSinceCreation < oneMinute) {
          return res.status(429).json({ 
            message: "Lütfen 1 dakika bekleyip tekrar deneyin",
            retryAfter: Math.ceil((oneMinute - timeSinceCreation) / 1000)
          });
        }
      }

      // Generate new verification token
      const verificationToken = generateVerificationToken();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with new token
      await db
        .update(users)
        .set({
          verificationToken,
          verificationTokenExpiry,
        })
        .where(eq(users.id, userId));

      // Check if auto-verify is enabled (development mode)
      if (shouldAutoVerifyEmail()) {
        // In development, auto-verify the email
        await db
          .update(users)
          .set({
            emailVerified: true,
            verificationToken: null,
            verificationTokenExpiry: null,
          })
          .where(eq(users.id, userId));

        return res.json({ 
          message: "Geliştirme modunda: E-posta otomatik doğrulandı",
          autoVerified: true
        });
      }

      // Send verification email
      const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email?token=${verificationToken}`;
      
      await emailService.sendVerificationEmail(
        currentUser.email,
        currentUser.firstName || 'Kullanıcı',
        verificationUrl
      );

      res.json({ 
        message: "Doğrulama e-postası gönderildi. Lütfen gelen kutunuzu kontrol edin.",
        emailSent: true
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "E-posta gönderilirken bir hata oluştu" });
    }
  });

  // ============ Phone Authentication Routes ============

  // Send OTP to phone number (for login or registration)
  app.post('/api/auth/phone/send-otp', createLimiter, async (req: Request, res: Response) => {
    try {
      const { phone, purpose = 'login' } = req.body;

      if (!phone) {
        return res.status(400).json({ message: "Telefon numarası gereklidir" });
      }

      // Validate and normalize Turkish phone format
      const phoneValidation = validateAndNormalizeTurkishPhone(phone);
      if (!phoneValidation.valid) {
        return res.status(400).json({ message: phoneValidation.error });
      }
      
      const normalizedPhone = phoneValidation.normalized;

      // Check if user exists (for login) or doesn't exist (for register)
      const existingUser = await db.query.users.findFirst({
        where: eq(users.phone, normalizedPhone),
      });

      if (purpose === 'login' && !existingUser) {
        return res.status(404).json({ message: "Bu telefon numarası ile kayıtlı kullanıcı bulunamadı" });
      }

      if (purpose === 'register' && existingUser) {
        return res.status(400).json({ message: "Bu telefon numarası zaten kayıtlı" });
      }

      // Rate limit: max 3 OTPs per phone per 15 minutes
      const recentOtps = await db.query.phoneVerifications.findMany({
        where: and(
          eq(phoneVerifications.phone, normalizedPhone),
          gte(phoneVerifications.createdAt, new Date(Date.now() - 15 * 60 * 1000))
        ),
      });

      if (recentOtps.length >= 3) {
        return res.status(429).json({ message: "Çok fazla kod isteği. 15 dakika sonra tekrar deneyin." });
      }

      // Generate and save OTP
      const code = generateOtp();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await db.insert(phoneVerifications).values({
        phone: normalizedPhone,
        code,
        purpose,
        expiresAt,
      });

      // Send SMS
      const sent = await smsService.sendOtp(normalizedPhone, code);
      
      if (!sent) {
        return res.status(500).json({ message: "SMS gönderilemedi. Lütfen daha sonra tekrar deneyin." });
      }

      res.json({ 
        message: "Doğrulama kodu gönderildi",
        expiresIn: 300 // 5 minutes in seconds
      });
    } catch (error) {
      console.error("Send OTP error:", error);
      res.status(500).json({ message: "Bir hata oluştu. Lütfen tekrar deneyin." });
    }
  });

  // Verify OTP and login/register with phone
  app.post('/api/auth/phone/verify', createLimiter, async (req: Request, res: Response) => {
    try {
      const { phone, code, purpose = 'login', firstName, lastName } = req.body;

      if (!phone || !code) {
        return res.status(400).json({ message: "Telefon numarası ve doğrulama kodu gereklidir" });
      }

      // Validate and normalize phone format
      const phoneValidation = validateAndNormalizeTurkishPhone(phone);
      if (!phoneValidation.valid) {
        return res.status(400).json({ message: phoneValidation.error });
      }
      
      const normalizedPhone = phoneValidation.normalized;

      // First find any pending verification for this phone
      const latestVerification = await db.query.phoneVerifications.findFirst({
        where: and(
          eq(phoneVerifications.phone, normalizedPhone),
          eq(phoneVerifications.purpose, purpose),
          eq(phoneVerifications.verified, false),
          gte(phoneVerifications.expiresAt, new Date())
        ),
        orderBy: desc(phoneVerifications.createdAt),
      });

      // Check if max attempts reached
      if (latestVerification && latestVerification.attempts >= 5) {
        return res.status(400).json({ message: "Çok fazla hatalı deneme. Yeni kod isteyin." });
      }

      // Find valid OTP with matching code
      const verification = await db.query.phoneVerifications.findFirst({
        where: and(
          eq(phoneVerifications.phone, normalizedPhone),
          eq(phoneVerifications.code, code),
          eq(phoneVerifications.purpose, purpose),
          eq(phoneVerifications.verified, false),
          gte(phoneVerifications.expiresAt, new Date())
        ),
        orderBy: desc(phoneVerifications.createdAt),
      });

      if (!verification) {
        // Increment attempts on the latest verification record
        if (latestVerification) {
          await db
            .update(phoneVerifications)
            .set({ attempts: latestVerification.attempts + 1 })
            .where(eq(phoneVerifications.id, latestVerification.id));
          
          const remainingAttempts = 5 - latestVerification.attempts - 1;
          if (remainingAttempts <= 0) {
            return res.status(400).json({ message: "Çok fazla hatalı deneme. Yeni kod isteyin." });
          }
          return res.status(400).json({ message: `Geçersiz doğrulama kodu. ${remainingAttempts} deneme hakkınız kaldı.` });
        }

        // Check if code exists but expired or already used
        const expiredOrUsed = await db.query.phoneVerifications.findFirst({
          where: and(
            eq(phoneVerifications.phone, normalizedPhone),
            eq(phoneVerifications.code, code)
          ),
        });

        if (expiredOrUsed) {
          if (expiredOrUsed.verified) {
            return res.status(400).json({ message: "Bu kod zaten kullanılmış" });
          }
          return res.status(400).json({ message: "Doğrulama kodunun süresi dolmuş" });
        }

        return res.status(400).json({ message: "Geçersiz doğrulama kodu" });
      }

      // Mark as verified
      await db
        .update(phoneVerifications)
        .set({ verified: true })
        .where(eq(phoneVerifications.id, verification.id));

      let user;

      if (purpose === 'register') {
        // Create new user with phone
        const [newUser] = await db
          .insert(users)
          .values({
            phone: normalizedPhone,
            phoneVerified: true,
            firstName: firstName || null,
            lastName: lastName || null,
            emailVerified: false,
          })
          .returning();
        user = newUser;
      } else {
        // Find existing user
        user = await db.query.users.findFirst({
          where: eq(users.phone, normalizedPhone),
        });

        if (!user) {
          return res.status(404).json({ message: "Kullanıcı bulunamadı" });
        }

        // Update phone verified status if not already
        if (!user.phoneVerified) {
          await db
            .update(users)
            .set({ phoneVerified: true })
            .where(eq(users.id, user.id));
        }
      }

      // Create session
      (req as any).login({ claims: { sub: user.id } }, (err: any) => {
        if (err) {
          console.error("Session creation error:", err);
          return res.status(500).json({ message: "Oturum oluşturulamadı" });
        }

        res.json({
          message: purpose === 'register' ? "Kayıt başarılı! Hoş geldiniz." : "Giriş başarılı!",
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phoneVerified: true,
            emailVerified: user.emailVerified,
          },
        });
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ message: "Bir hata oluştu. Lütfen tekrar deneyin." });
    }
  });

  // Firebase Phone Authentication - Verify Firebase ID Token and create/login user
  app.post('/api/auth/firebase/verify', createLimiter, async (req: Request, res: Response) => {
    try {
      const { idToken, phone, firstName, lastName, purpose = 'login', userId } = req.body;

      if (!idToken) {
        return res.status(400).json({ message: "Firebase token gereklidir" });
      }

      // Verify Firebase ID token
      const decodedToken = await verifyFirebaseToken(idToken);
      
      if (!decodedToken) {
        return res.status(401).json({ message: "Geçersiz veya süresi dolmuş token" });
      }

      // Get phone from Firebase token or request
      const firebasePhone = decodedToken.phone_number;
      const normalizedPhone = firebasePhone ? formatPhoneFromFirebase(firebasePhone) : (phone || null);

      if (!normalizedPhone) {
        return res.status(400).json({ message: "Telefon numarası bulunamadı" });
      }

      let user;

      // Check if user exists with this phone
      const existingUser = await db.query.users.findFirst({
        where: eq(users.phone, normalizedPhone),
      });

      if (purpose === 'verify' && userId) {
        // Verify phone for existing user (unified registration flow)
        const userToVerify = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });

        if (!userToVerify) {
          return res.status(404).json({ message: "Kullanıcı bulunamadı" });
        }

        // Update phone verification status and Firebase UID
        await db
          .update(users)
          .set({ 
            phoneVerified: true,
            firebaseUid: decodedToken.uid 
          })
          .where(eq(users.id, userId));

        // Send email verification
        if (userToVerify.email && userToVerify.verificationToken) {
          try {
            await emailService.sendVerificationEmail(
              userToVerify.email,
              userToVerify.verificationToken,
              userToVerify.firstName || userToVerify.email.split('@')[0]
            );
          } catch (emailError) {
            console.error("Email sending error:", emailError);
          }
        }

        // Create session
        (req as any).login({ claims: { sub: userId } }, (err: any) => {
          if (err) {
            console.error("Session creation error:", err);
            return res.status(500).json({ message: "Oturum oluşturulamadı" });
          }

          res.json({
            message: "Telefon doğrulandı! Email doğrulama linki gönderildi.",
            user: {
              id: userToVerify.id,
              email: userToVerify.email,
              phone: userToVerify.phone,
              firstName: userToVerify.firstName,
              lastName: userToVerify.lastName,
              role: userToVerify.role,
              phoneVerified: true,
              emailVerified: userToVerify.emailVerified,
            },
          });
        });
        return;
      }

      if (purpose === 'register') {
        if (existingUser) {
          return res.status(400).json({ message: "Bu telefon numarası zaten kayıtlı. Giriş yapmayı deneyin." });
        }

        // Create new user
        const [newUser] = await db
          .insert(users)
          .values({
            phone: normalizedPhone,
            phoneVerified: true,
            firstName: firstName || null,
            lastName: lastName || null,
            emailVerified: false,
            firebaseUid: decodedToken.uid,
          })
          .returning();
        user = newUser;
      } else {
        // Login - find existing user or error
        if (existingUser) {
          user = existingUser;
          
          // Update Firebase UID if not set
          if (!existingUser.firebaseUid) {
            await db
              .update(users)
              .set({ 
                firebaseUid: decodedToken.uid,
                phoneVerified: true 
              })
              .where(eq(users.id, existingUser.id));
          }
        } else {
          return res.status(404).json({ message: "Bu telefon numarasıyla kayıtlı kullanıcı bulunamadı. Lütfen önce kayıt olun." });
        }
      }

      // Create session
      (req as any).login({ claims: { sub: user.id } }, (err: any) => {
        if (err) {
          console.error("Session creation error:", err);
          return res.status(500).json({ message: "Oturum oluşturulamadı" });
        }

        res.json({
          message: purpose === 'register' ? "Kayıt başarılı! Hoş geldiniz." : "Giriş başarılı!",
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phoneVerified: true,
            emailVerified: user.emailVerified,
          },
        });
      });
    } catch (error) {
      console.error("Firebase verify error:", error);
      res.status(500).json({ message: "Bir hata oluştu. Lütfen tekrar deneyin." });
    }
  });

  // Verify phone for existing user (add phone to account)
  app.post('/api/auth/phone/add', isAuthenticated, createLimiter, async (req: Request, res: Response) => {
    try {
      const sessionUser = req.user as any;
      const userId = sessionUser.dbUserId || sessionUser.claims?.sub || sessionUser.id;
      const { phone, code } = req.body;

      if (!phone || !code) {
        return res.status(400).json({ message: "Telefon numarası ve doğrulama kodu gereklidir" });
      }

      // Check if phone already used by another user
      const phoneInUse = await db.query.users.findFirst({
        where: and(
          eq(users.phone, phone),
          sql`${users.id} != ${userId}`
        ),
      });

      if (phoneInUse) {
        return res.status(400).json({ message: "Bu telefon numarası başka bir hesapta kullanılıyor" });
      }

      // Verify OTP
      const verification = await db.query.phoneVerifications.findFirst({
        where: and(
          eq(phoneVerifications.phone, phone),
          eq(phoneVerifications.code, code),
          eq(phoneVerifications.purpose, 'verify'),
          eq(phoneVerifications.verified, false),
          gte(phoneVerifications.expiresAt, new Date())
        ),
        orderBy: desc(phoneVerifications.createdAt),
      });

      if (!verification) {
        return res.status(400).json({ message: "Geçersiz veya süresi dolmuş doğrulama kodu" });
      }

      // Mark as verified
      await db
        .update(phoneVerifications)
        .set({ verified: true })
        .where(eq(phoneVerifications.id, verification.id));

      // Update user's phone
      await db
        .update(users)
        .set({ phone, phoneVerified: true })
        .where(eq(users.id, userId));

      res.json({ message: "Telefon numarası başarıyla doğrulandı ve hesabınıza eklendi" });
    } catch (error) {
      console.error("Add phone error:", error);
      res.status(500).json({ message: "Bir hata oluştu. Lütfen tekrar deneyin." });
    }
  });

  // Get current user (works for both auth methods)
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      let user;
      
      // Priority 1: dbUserId (OAuth with dbUserId)
      if (req.user.dbUserId) {
        user = await storage.getUser(req.user.dbUserId);
      }
      
      // Priority 2: Traditional auth (claims.sub)
      if (!user && req.user.claims?.sub) {
        user = await storage.getUser(req.user.claims.sub);
      }
      
      // Priority 3: OAuth fallback - find by email
      if (!user && req.user.claims?.email) {
        user = await storage.getUserByEmail(req.user.claims.email);
      }
      
      // Priority 4: Direct id field
      if (!user && req.user.id) {
        user = await storage.getUser(req.user.id);
      }
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      res.json(user);
    } catch {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Update user profile
  app.patch('/api/auth/profile', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Kullanıcı bulunamadı" });
      }

      const { firstName, lastName, phone, city, district, bio, profileImageUrl } = req.body;

      // Validate phone format if provided
      if (phone && !/^[0-9+\-\s()]{10,20}$/.test(phone)) {
        return res.status(400).json({ message: "Geçersiz telefon numarası formatı" });
      }

      // Update user profile
      const [updatedUser] = await db
        .update(users)
        .set({
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          phone: phone || undefined,
          city: city || undefined,
          district: district || undefined,
          bio: bio || undefined,
          profileImageUrl: profileImageUrl || undefined,
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }

      // Return sanitized user (without password)
      const { password: _, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Profil güncellenirken bir hata oluştu" });
    }
  });

  // Change password
  app.post('/api/auth/change-password', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Kullanıcı bulunamadı" });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Mevcut ve yeni şifre gereklidir" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Yeni şifre en az 8 karakter olmalıdır" });
      }

      // Get current user
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!existingUser || !existingUser.password) {
        return res.status(400).json({ message: "Bu hesap için şifre değiştirilemez" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, existingUser.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Mevcut şifre hatalı" });
      }

      // Hash and save new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId));

      res.json({ message: "Şifreniz başarıyla güncellendi" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Şifre değiştirilirken bir hata oluştu" });
    }
  });

  // ============ User Settings Routes ============
  
  // Get user settings
  app.get('/api/settings', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      
      // Get existing settings or return defaults
      const [existingSettings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);
      
      if (existingSettings) {
        return res.json(existingSettings);
      }
      
      // Return default settings if none exist
      res.json({
        userId,
        emailNotifications: true,
        smsNotifications: true,
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
        profileVisibility: 'public',
        defaultCity: null,
        defaultDistrict: null,
        defaultCategoryId: null,
        autoRenewListings: false,
        theme: 'system',
        language: 'tr',
        currency: 'TRY',
      });
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ message: "Ayarlar yüklenirken bir hata oluştu" });
    }
  });
  
  // Update user settings (partial update)
  app.patch('/api/settings', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      
      const settingsData = req.body;
      
      // Check if settings exist
      const [existingSettings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);
      
      let updatedSettings;
      
      if (existingSettings) {
        // Update existing settings
        [updatedSettings] = await db
          .update(userSettings)
          .set({
            ...settingsData,
            updatedAt: new Date(),
          })
          .where(eq(userSettings.userId, userId))
          .returning();
      } else {
        // Create new settings
        [updatedSettings] = await db
          .insert(userSettings)
          .values({
            userId,
            ...settingsData,
          })
          .returning();
      }
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ message: "Ayarlar güncellenirken bir hata oluştu" });
    }
  });
  
  // Get user devices
  app.get('/api/settings/devices', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      
      const devices = await db
        .select()
        .from(userDevices)
        .where(eq(userDevices.userId, userId))
        .orderBy(desc(userDevices.lastActive));
      
      res.json(devices);
    } catch (error) {
      console.error("Get devices error:", error);
      res.status(500).json({ message: "Cihazlar yüklenirken bir hata oluştu" });
    }
  });
  
  // Remove a device
  app.delete('/api/settings/devices/:deviceId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      const { deviceId } = req.params;
      
      await db
        .delete(userDevices)
        .where(and(
          eq(userDevices.id, deviceId),
          eq(userDevices.userId, userId)
        ));
      
      res.json({ message: "Cihaz kaldırıldı" });
    } catch (error) {
      console.error("Remove device error:", error);
      res.status(500).json({ message: "Cihaz kaldırılırken bir hata oluştu" });
    }
  });
  
  // Get login history
  app.get('/api/settings/login-history', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      
      const history = await db
        .select()
        .from(loginHistory)
        .where(eq(loginHistory.userId, userId))
        .orderBy(desc(loginHistory.createdAt))
        .limit(50);
      
      res.json(history);
    } catch (error) {
      console.error("Get login history error:", error);
      res.status(500).json({ message: "Giriş geçmişi yüklenirken bir hata oluştu" });
    }
  });
  
  // Delete account (soft delete - requires confirmation)
  app.post('/api/settings/delete-account', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      const { confirmation, password } = req.body;
      
      if (confirmation !== 'DELETE') {
        return res.status(400).json({ message: "Hesap silme onayı gereklidir" });
      }
      
      // If user has password-based auth, verify password
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (existingUser?.password && password) {
        const isValidPassword = await bcrypt.compare(password, existingUser.password);
        if (!isValidPassword) {
          return res.status(401).json({ message: "Şifre hatalı" });
        }
      }
      
      // Initialize object storage for file deletion
      const objectStorage = new ObjectStorageService();
      
      // 1. Get all user's listings and delete their images from Object Storage
      const userListings = await db.select()
        .from(listings)
        .where(eq(listings.sellerId, userId));
      
      for (const listing of userListings) {
        // Delete listing images from Object Storage
        const listingImgs = await db.select()
          .from(listingImages)
          .where(eq(listingImages.listingId, listing.id));
        
        for (const img of listingImgs) {
          const pathsToDelete = [
            img.originalKey,
            img.thumbnailKey,
            img.mediumKey,
            img.largeKey
          ].filter(Boolean) as string[];
          await objectStorage.deleteMultipleFiles(pathsToDelete);
        }
        
        // Delete images from listing.images array if any
        if (listing.images && Array.isArray(listing.images)) {
          await objectStorage.deleteMultipleFiles(listing.images as string[]);
        }
      }
      
      // 2. Delete user profile image from Object Storage if exists
      if (existingUser?.profileImageUrl) {
        await objectStorage.deleteFile(existingUser.profileImageUrl);
      }
      
      // 3. Delete store images if user has a store
      const [userStore] = await db.select()
        .from(stores)
        .where(eq(stores.ownerId, userId))
        .limit(1);
      
      if (userStore) {
        // Delete store logo and banner
        if (userStore.logo) {
          await objectStorage.deleteFile(userStore.logo);
        }
        if (userStore.banner) {
          await objectStorage.deleteFile(userStore.banner);
        }
        
        // Delete store media
        const storeMediaItems = await db.select()
          .from(storeMedia)
          .where(eq(storeMedia.storeId, userStore.id));
        
        for (const media of storeMediaItems) {
          if (media.url) {
            await objectStorage.deleteFile(media.url);
          }
        }
      }
      
      // 4. Delete message attachments sent by this user
      const userMessages = await db.select()
        .from(messages)
        .where(eq(messages.senderId, userId));
      
      for (const msg of userMessages) {
        if (msg.attachments && Array.isArray(msg.attachments)) {
          for (const attachment of msg.attachments) {
            if (attachment && typeof attachment === 'object' && 'url' in attachment) {
              await objectStorage.deleteFile(attachment.url as string);
            }
          }
        }
      }
      
      // 5. Now delete user and related data (cascades will handle DB records)
      await db.delete(users).where(eq(users.id, userId));
      
      // Logout
      req.logout((err) => {
        if (err) {
          console.error("Logout error:", err);
        }
      });
      
      res.json({ message: "Hesabınız ve tüm verileriniz silindi" });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ message: "Hesap silinirken bir hata oluştu" });
    }
  });
  
  // Export user data
  app.get('/api/settings/export-data', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = getUserId(user);
      
      // Get all user data
      const [userData] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const userListings = await db.select().from(listings).where(eq(listings.sellerId, userId));
      const userFavorites = await db.select().from(favorites).where(eq(favorites.userId, userId));
      const userMessages = await db.select().from(messages).where(
        or(eq(messages.senderId, userId), eq(messages.receiverId, userId))
      );
      const userSettings_ = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
      
      // Remove sensitive data
      if (userData) {
        delete (userData as any).password;
        delete (userData as any).verificationToken;
        delete (userData as any).resetToken;
      }
      
      const exportData = {
        user: userData,
        listings: userListings,
        favorites: userFavorites,
        messages: userMessages,
        settings: userSettings_,
        exportedAt: new Date().toISOString(),
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error("Export data error:", error);
      res.status(500).json({ message: "Veri dışa aktarılırken bir hata oluştu" });
    }
  });

  // ============ Category Routes ============
  // Get category statistics (listing count per category) - BEFORE parametric routes
  app.get("/api/categories/stats", async (_req: Request, res: Response) => {
    try {
      // Get listing counts per category
      const stats = await db
        .select({
          categoryId: listings.categoryId,
          count: count(),
        })
        .from(listings)
        .where(eq(listings.status, 'active'))
        .groupBy(listings.categoryId);

      res.json(stats);
    } catch (error) {
      console.error("Error fetching category stats:", error);
      res.status(500).json({ message: "Failed to fetch category stats" });
    }
  });

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

      // Fetch child categories
      const childCategories = await db
        .select()
        .from(categories)
        .where(eq(categories.parentId, category.id))
        .orderBy(categories.order);

      // Recursively fetch grandchildren for each child
      const categoryWithChildren = {
        ...category,
        children: await Promise.all(
          childCategories.map(async (child) => {
            const grandchildren = await db
              .select()
              .from(categories)
              .where(eq(categories.parentId, child.id))
              .orderBy(categories.order);
            
            return {
              ...child,
              children: grandchildren,
            };
          })
        ),
      };

      res.json(categoryWithChildren);
    } catch (error) {
      console.error("Failed to fetch category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // ============ Legal Compliance: Document Requirements ============
  // Get document requirements for a category
  app.get("/api/categories/:slug/document-requirements", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      // Get direct document requirements for this category
      const requirements = await db
        .select()
        .from(categoryDocumentRequirements)
        .where(eq(categoryDocumentRequirements.categorySlug, slug));
      
      // Get category restrictions
      const restrictions = await db
        .select()
        .from(restrictedCategories)
        .where(and(
          eq(restrictedCategories.categorySlug, slug),
          eq(restrictedCategories.isActive, true)
        ));
      
      // Get category info to check parent categories
      const categoryInfo = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);
      
      let parentRequirements: typeof requirements = [];
      let parentRestrictions: typeof restrictions = [];
      
      // Check parent categories for inherited requirements
      if (categoryInfo.length > 0 && categoryInfo[0].path && Array.isArray(categoryInfo[0].path)) {
        for (const parentId of categoryInfo[0].path) {
          const parentCat = await db.select().from(categories).where(eq(categories.id, parentId)).limit(1);
          if (parentCat.length > 0) {
            const parentReqs = await db
              .select()
              .from(categoryDocumentRequirements)
              .where(eq(categoryDocumentRequirements.categorySlug, parentCat[0].slug));
            parentRequirements.push(...parentReqs);
            
            const parentRestr = await db
              .select()
              .from(restrictedCategories)
              .where(and(
                eq(restrictedCategories.categorySlug, parentCat[0].slug),
                eq(restrictedCategories.isActive, true)
              ));
            parentRestrictions.push(...parentRestr);
          }
        }
      }
      
      res.json({
        requirements: [...requirements, ...parentRequirements],
        restrictions: [...restrictions, ...parentRestrictions],
        categorySlug: slug,
      });
    } catch (error) {
      console.error("Failed to fetch document requirements:", error);
      res.status(500).json({ message: "Belge gereksinimleri alınamadı" });
    }
  });

  // Get all document requirements (for admin)
  app.get("/api/admin/document-requirements", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Sadece adminler erişebilir" });
      }
      
      const allRequirements = await db.select().from(categoryDocumentRequirements);
      const allRestrictions = await db.select().from(restrictedCategories);
      
      res.json({
        requirements: allRequirements,
        restrictions: allRestrictions,
      });
    } catch (error) {
      console.error("Failed to fetch all document requirements:", error);
      res.status(500).json({ message: "Belge gereksinimleri alınamadı" });
    }
  });

  // Get pending documents for admin verification
  app.get("/api/admin/listing-documents", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Sadece adminler erişebilir" });
      }
      
      const { status = 'pending' } = req.query;
      
      const documents = await db
        .select({
          document: listingDocuments,
          listing: listings,
          seller: users,
        })
        .from(listingDocuments)
        .leftJoin(listings, eq(listingDocuments.listingId, listings.id))
        .leftJoin(users, eq(listings.sellerId, users.id))
        .where(sql`${listingDocuments.status} = ${status}`)
        .orderBy(desc(listingDocuments.createdAt));
      
      res.json(documents);
    } catch (error) {
      console.error("Failed to fetch listing documents:", error);
      res.status(500).json({ message: "Belgeler alınamadı" });
    }
  });

  // Verify or reject a document (admin only)
  app.patch("/api/admin/listing-documents/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Sadece adminler erişebilir" });
      }
      
      const { id } = req.params;
      const { status, rejectionReason } = req.body;
      
      if (!['verified', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Geçersiz durum" });
      }
      
      const updateData: any = {
        status,
        verifiedBy: user.id,
        verifiedAt: new Date(),
      };
      
      if (status === 'rejected' && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
      
      const [updated] = await db
        .update(listingDocuments)
        .set(updateData)
        .where(eq(listingDocuments.id, id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ message: "Belge bulunamadı" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update document status:", error);
      res.status(500).json({ message: "Belge durumu güncellenemedi" });
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
  // Note: No auth required for browsing listings (guest access)
  // req.user will be populated if user is logged in (via Replit Auth session)
  app.get("/api/listings", async (req: Request, res: Response) => {
    try {
      const { 
        page = '1', 
        limit = '50', 
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
        characterTraits
      } = req.query;
      
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50)); // Max 100
      const offset = (pageNum - 1) * limitNum;
      
      // Build query conditions
      const conditions = [];
      
      if (categoryId) {
        // Get all categories from cache or DB (single query)
        const cacheKey = cacheKeys.categories();
        let allCategories = await cache.get<any[]>(cacheKey);
        
        if (!allCategories) {
          allCategories = await db
            .select()
            .from(categories)
            .orderBy(categories.order);
          await cache.set(cacheKey, allCategories, cacheTTL.categories);
        }
        
        // Build in-memory parent-child map
        const childMap = new Map<string, string[]>();
        allCategories.forEach(cat => {
          if (cat.parentId) {
            const siblings = childMap.get(cat.parentId) || [];
            siblings.push(cat.id);
            childMap.set(cat.parentId, siblings);
          }
        });
        
        // Get all descendant IDs (in-memory recursive traversal)
        const getAllDescendants = (catId: string): string[] => {
          const children = childMap.get(catId) || [];
          let descendants = [catId]; // Include the category itself
          for (const childId of children) {
            descendants = [...descendants, ...getAllDescendants(childId)];
          }
          return descendants;
        };
        
        const categoryIds = getAllDescendants(categoryId as string);
        
        // Filter by category OR any of its descendants
        if (categoryIds.length > 1) {
          conditions.push(inArray(listings.categoryId, categoryIds));
        } else {
          conditions.push(eq(listings.categoryId, categoryId as string));
        }
      }
      
      if (city) {
        conditions.push(eq(listings.city, city as string));
      }
      
      if (district) {
        conditions.push(eq(listings.district, district as string));
      }
      
      if (status) {
        conditions.push(eq(listings.status, status as any));
      } else {
        // Default: only show active listings
        conditions.push(eq(listings.status, 'active'));
      }
      
      if (minPrice) {
        const minPriceNum = parseFloat(minPrice as string);
        if (!isNaN(minPriceNum)) {
          conditions.push(gte(listings.price, minPriceNum.toString()));
        }
      }
      
      if (maxPrice) {
        const maxPriceNum = parseFloat(maxPrice as string);
        if (!isNaN(maxPriceNum)) {
          conditions.push(lte(listings.price, maxPriceNum.toString()));
        }
      }
      
      if (search) {
        const searchTerm = `%${search}%`;
        conditions.push(
          sql`(${listings.title} ILIKE ${searchTerm} OR ${listings.description} ILIKE ${searchTerm})`
        );
      }
      
      // Advanced filters (with sanitization)
      if (minAge) {
        const minAgeNum = parseInt(minAge as string, 10);
        if (!isNaN(minAgeNum)) {
          conditions.push(sql`CAST(${listings.age} AS INTEGER) >= ${minAgeNum}`);
        }
      }
      
      if (maxAge) {
        const maxAgeNum = parseInt(maxAge as string, 10);
        if (!isNaN(maxAgeNum)) {
          conditions.push(sql`CAST(${listings.age} AS INTEGER) <= ${maxAgeNum}`);
        }
      }
      
      if (gender && gender !== 'all') {
        conditions.push(eq(listings.gender, gender as any));
      }
      
      if (breed && typeof breed === 'string' && breed.trim()) {
        conditions.push(ilike(listings.breed, `%${breed}%`));
      }
      
      if (healthStatus && healthStatus !== 'all') {
        conditions.push(eq(listings.healthStatus, healthStatus as any));
      }
      
      if (vaccinated !== undefined && vaccinated !== 'all') {
        const isVaccinated = vaccinated === 'true' || vaccinated === '1';
        conditions.push(eq(listings.vaccinated, isVaccinated));
      }
      
      if (neutered !== undefined && neutered !== 'all') {
        const isNeutered = neutered === 'true' || neutered === '1';
        conditions.push(eq(listings.neutered, isNeutered));
      }
      
      if (pedigree !== undefined && pedigree !== 'all') {
        const hasPedigree = pedigree === 'true' || pedigree === '1';
        conditions.push(eq(listings.pedigree, hasPedigree));
      }
      
      // Age category filtering (maps to age ranges)
      if (ageCategory && ageCategory !== 'all') {
        const ageRanges: Record<string, [number, number]> = {
          '0-3-ay': [0, 3],
          '3-6-ay': [3, 6],
          '6-12-ay': [6, 12],
          '1-3-yas': [12, 36],
          '3-7-yas': [36, 84],
          '7-plus-yas': [84, 999],
        };
        const range = ageRanges[ageCategory as string];
        if (range) {
          // Check if age field contains the category value or falls in the range
          conditions.push(
            sql`(${listings.age} = ${ageCategory} OR 
                (${listings.age} ~ '^[0-9]+$' AND CAST(${listings.age} AS INTEGER) >= ${range[0]} AND CAST(${listings.age} AS INTEGER) < ${range[1]}))`
          );
        }
      }
      
      // Character traits filtering (JSONB array contains)
      if (characterTraits) {
        // Parse traits from query - handle both array format and comma-separated string
        let traitsArray: string[] = [];
        if (Array.isArray(characterTraits)) {
          traitsArray = characterTraits.filter((t): t is string => typeof t === 'string' && !!t.trim());
        } else if (typeof characterTraits === 'string' && characterTraits.trim()) {
          traitsArray = characterTraits.split(',').map(t => t.trim()).filter(Boolean);
        }
        
        // Filter listings that have ANY of the selected traits using JSONB @> operator
        // Check if the characterTraits column contains any of the selected traits
        if (traitsArray.length > 0) {
          const traitConditions = traitsArray.map(trait => 
            sql`${listings.characterTraits}::jsonb @> ${JSON.stringify([trait])}::jsonb`
          );
          conditions.push(sql`(${sql.join(traitConditions, sql` OR `)})`);
        }
      }
      
      // Filter out undefined conditions before applying
      const validConditions = conditions.filter(Boolean);
      
      // Get total count
      const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(listings)
        .where(validConditions.length > 0 ? and(...validConditions) : undefined);
      
      // Get paginated listings
      const listingsData = await db
        .select({
          listing: listings,
          store: {
            id: stores.id,
            slug: stores.slug,
            displayName: stores.displayName,
            logo: stores.logo,
          },
        })
        .from(listings)
        .leftJoin(stores, eq(listings.storeId, stores.id))
        .where(validConditions.length > 0 ? and(...validConditions) : undefined)
        .orderBy(desc(listings.createdAt))
        .limit(limitNum)
        .offset(offset);
      
      // Flatten the results to match expected shape
      const flattenedListings = listingsData.map(row => ({
        ...row.listing,
        store: row.store?.id ? row.store : null,
      }));
      
      // If user is authenticated, check favorites
      let listingsWithFavorites = flattenedListings;
      if (req.user) {
        // Get favorites from PostgreSQL
        const userFavorites = await db
          .select()
          .from(favorites)
          .where(eq(favorites.userId, getUserId(req.user)));
        
        const favoriteIds = new Set(userFavorites.map(f => f.listingId));
        
        listingsWithFavorites = flattenedListings.map(listing => ({
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

  // Get hot/trending listings (most viewed/favorited in last 7 days)
  app.get("/api/listings/hot", async (_req: Request, res: Response) => {
    try {
      const cacheKey = cacheKeys.hotListings();
      const cached = await cache.get<any[]>(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      // Get listings sorted by views (last 7 days would need createdAt filter)
      const hotListings = await db
        .select()
        .from(listings)
        .where(eq(listings.status, 'active'))
        .orderBy(desc(listings.views))
        .limit(12);

      await cache.set(cacheKey, hotListings, cacheTTL.hotListings);
      res.json(hotListings);
    } catch (error) {
      console.error("Error fetching hot listings:", error);
      res.status(500).json({ message: "Failed to fetch hot listings" });
    }
  });

  // Get similar listings (same category, excluding current listing)
  app.get("/api/listings/:id/similar", async (req: Request, res: Response) => {
    try {
      const [currentListing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, req.params.id))
        .limit(1);

      if (!currentListing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      // Get similar listings from same category
      const similarListings = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.categoryId, currentListing.categoryId),
            eq(listings.status, 'active'),
            sql`${listings.id} != ${req.params.id}` // Exclude current listing
          )
        )
        .orderBy(desc(listings.views))
        .limit(8);

      res.json(similarListings);
    } catch (error) {
      console.error("Error fetching similar listings:", error);
      res.status(500).json({ message: "Failed to fetch similar listings" });
    }
  });

  // Note: No auth required for viewing listing details (guest access)
  // req.user will be populated if user is logged in (via Replit Auth session)
  app.get("/api/listings/:id", async (req: Request, res: Response) => {
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

      // Get category info
      let categoryInfo = null;
      if (listing.categoryId) {
        const [category] = await db
          .select()
          .from(categories)
          .where(eq(categories.id, listing.categoryId))
          .limit(1);
        categoryInfo = category || null;
      }

      // Get store info if listing is from a store
      let storeInfo = null;
      if (listing.storeId) {
        const [store] = await db
          .select({
            id: stores.id,
            slug: stores.slug,
            displayName: stores.displayName,
            logo: stores.logo,
          })
          .from(stores)
          .where(eq(stores.id, listing.storeId))
          .limit(1);
        storeInfo = store || null;
      }

      // Check if favorited
      let isFavorite = false;
      if (req.user) {
        const [favorite] = await db
          .select()
          .from(favorites)
          .where(
            and(
              eq(favorites.userId, getUserId(req.user)),
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
        category: categoryInfo,
        store: storeInfo,
        isFavorite,
      });
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  app.post("/api/listings", createLimiter, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const sellerId = getUserId(user);

      // SECURITY: Email verification required to create listings (skip in development)
      if (!(user as any).emailVerified && process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          message: "İlan oluşturabilmek için email adresinizi doğrulamanız gerekmektedir.",
          requiresVerification: true,
        });
      }

      // SECURITY: Validate reCAPTCHA for listing creation (skip in development)
      const recaptchaToken = req.body.recaptchaToken;
      if (process.env.RECAPTCHA_SECRET_KEY && process.env.NODE_ENV === 'production') {
        if (!recaptchaToken) {
          return res.status(400).json({
            message: "Bot koruması doğrulaması gereklidir",
            errorCode: "RECAPTCHA_REQUIRED",
          });
        }
        const isValid = await verifyRecaptcha(recaptchaToken, 0.5);
        if (!isValid) {
          return res.status(400).json({
            message: "Bot koruması doğrulaması başarısız",
            errorCode: "RECAPTCHA_FAILED",
          });
        }
      }

      // SPAM FILTER: Check BEFORE counting toward hourly limit
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const normalizedTitle = req.body.title.toLowerCase().trim();
      
      const duplicates = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.sellerId, sellerId),
            sql`LOWER(TRIM(${listings.title})) = ${normalizedTitle}`,
            gte(listings.createdAt, oneHourAgo),
            // Ignore rejected/deleted listings
            sql`${listings.status} NOT IN ('rejected', 'deleted')`
          )
        )
        .limit(1);

      if (duplicates.length > 0) {
        return res.status(429).json({
          message: "Aynı başlıkla kısa süre önce ilan oluşturdunuz. Lütfen 1 saat bekleyin.",
          errorCode: "DUPLICATE_LISTING",
        });
      }

      // SPAM FILTER: Max 5 ACTIVE/PENDING listings per hour per user
      const recentListings = await db
        .select({ count: count() })
        .from(listings)
        .where(
          and(
            eq(listings.sellerId, sellerId),
            gte(listings.createdAt, oneHourAgo),
            sql`${listings.status} NOT IN ('rejected', 'deleted')`
          )
        );

      if (recentListings[0] && Number(recentListings[0].count) >= 5) {
        return res.status(429).json({
          message: "Saatte en fazla 5 ilan oluşturabilirsiniz. Lütfen daha sonra tekrar deneyin.",
          errorCode: "RATE_LIMIT_EXCEEDED",
        });
      }

      // LEGAL COMPLIANCE: Check category restrictions
      const categoryId = req.body.categoryId;
      if (categoryId) {
        // Get category info to check slug
        const categoryInfo = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
        
        if (categoryInfo.length > 0) {
          const categorySlug = categoryInfo[0].slug;
          
          // Check if category is restricted
          const restrictions = await db.select().from(restrictedCategories)
            .where(and(
              eq(restrictedCategories.categorySlug, categorySlug),
              eq(restrictedCategories.isActive, true)
            ));
          
          if (restrictions.length > 0) {
            const restriction = restrictions[0];
            
            // Check restriction type
            if (restriction.restrictionType === 'banned') {
              return res.status(403).json({
                message: `Bu kategoride ilan vermek yasaktır. ${restriction.reason}`,
                errorCode: "CATEGORY_BANNED",
                legalReference: restriction.legalReference,
                penaltyInfo: restriction.penaltyAmount,
              });
            }
            
            // Pet shop/store cannot sell cats and dogs
            if (restriction.restrictionType === 'individual_only') {
              const storeId = req.body.storeId;
              const listingSource = req.body.storeId ? 'store' : 'individual';
              
              if (listingSource === 'store' || storeId) {
                return res.status(403).json({
                  message: `Mağazalar bu kategoride ilan veremez. ${restriction.reason}`,
                  errorCode: "STORE_NOT_ALLOWED",
                  legalReference: restriction.legalReference,
                  penaltyInfo: restriction.penaltyAmount,
                });
              }
            }
            
            // CITES required categories - check if user declared CITES document
            if (restriction.restrictionType === 'cites_required') {
              const citesAccepted = req.body.citesDocumentDeclared;
              if (!citesAccepted) {
                return res.status(400).json({
                  message: `Bu tür CITES kapsamında korunan bir hayvandır. İlan verebilmek için yasal belge sahibi olduğunuzu beyan etmeniz gerekmektedir.`,
                  errorCode: "CITES_REQUIRED",
                  legalReference: restriction.legalReference,
                  penaltyInfo: restriction.penaltyAmount,
                  requiresCitesDeclaration: true,
                });
              }
            }
          }
          
          // Also check parent categories for restrictions
          if (categoryInfo[0].path && Array.isArray(categoryInfo[0].path)) {
            for (const parentId of categoryInfo[0].path) {
              const parentCat = await db.select().from(categories).where(eq(categories.id, parentId)).limit(1);
              if (parentCat.length > 0) {
                const parentRestrictions = await db.select().from(restrictedCategories)
                  .where(and(
                    eq(restrictedCategories.categorySlug, parentCat[0].slug),
                    eq(restrictedCategories.isActive, true)
                  ));
                
                if (parentRestrictions.length > 0) {
                  const restriction = parentRestrictions[0];
                  
                  if (restriction.restrictionType === 'individual_only' && req.body.storeId) {
                    return res.status(403).json({
                      message: `Mağazalar bu kategoride ilan veremez. ${restriction.reason}`,
                      errorCode: "STORE_NOT_ALLOWED",
                      legalReference: restriction.legalReference,
                      penaltyInfo: restriction.penaltyAmount,
                    });
                  }
                }
              }
            }
          }
        }
      }

      // Development: auto-approve listings for testing
      // Production: require admin moderation
      const listingStatus = process.env.NODE_ENV === 'production' ? 'pending' : 'active';
      
      // Validate and sanitize price
      let priceValue = req.body.price;
      if (typeof priceValue === 'string') {
        // Remove thousand separators (dots in Turkish format, commas in English)
        priceValue = priceValue.replace(/\./g, '').replace(/,/g, '.');
      }
      const numericPrice = parseFloat(priceValue);
      if (isNaN(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ message: "Geçerli bir fiyat giriniz" });
      }
      if (numericPrice > 99999999.99) {
        return res.status(400).json({ message: "Fiyat en fazla 99.999.999,99 TL olabilir" });
      }

      const parsedData = insertListingSchema.parse({
        ...req.body,
        price: numericPrice.toString(),
        sellerId: sellerId,
        status: listingStatus,
        // Auto-detect listing source: if storeId provided, it's a store listing
        listingSource: req.body.storeId ? 'store' : 'individual',
      });

      // Create listing - completely free, but requires admin approval
      const [listing] = await db.insert(listings).values(parsedData as any).returning();

      const responseMessage = listingStatus === 'active' 
        ? "İlanınız başarıyla oluşturuldu ve yayında!"
        : "İlanınız başarıyla oluşturuldu. Admin onayından sonra yayına girecektir.";
      
      res.status(201).json({
        ...listing,
        message: responseMessage,
        requiresApproval: listingStatus === 'pending',
      });
    } catch (error) {
      console.error("Error creating listing:", error);
      res.status(400).json({ message: "İlan oluşturulamadı", error });
    }
  });

  app.patch("/api/listings/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, req.params.id))
        .limit(1);
        
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      if (listing.sellerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Validate and sanitize price if provided
      let sanitizedPrice: string | undefined;
      if (req.body.price) {
        let priceValue = req.body.price;
        if (typeof priceValue === 'string') {
          // Remove thousand separators (dots in Turkish format, commas in English)
          priceValue = priceValue.replace(/\./g, '').replace(/,/g, '.');
        }
        const numericPrice = parseFloat(priceValue);
        if (isNaN(numericPrice) || numericPrice < 0) {
          return res.status(400).json({ message: "Geçerli bir fiyat giriniz" });
        }
        if (numericPrice > 99999999.99) {
          return res.status(400).json({ message: "Fiyat en fazla 99.999.999,99 TL olabilir" });
        }
        sanitizedPrice = numericPrice.toString();
      }

      // Check for price drop to notify favorites
      const oldPrice = parseFloat(listing.price || '0');
      const newPrice = sanitizedPrice ? parseFloat(sanitizedPrice) : oldPrice;
      const isPriceDrop = newPrice < oldPrice && oldPrice > 0;

      // Auto-detect listing source when storeId changes
      const updateData: any = { ...req.body, updatedAt: new Date() };
      if (sanitizedPrice) {
        updateData.price = sanitizedPrice;
      }
      if ('storeId' in req.body) {
        updateData.listingSource = req.body.storeId ? 'store' : 'individual';
      }

      const [updated] = await db
        .update(listings)
        .set(updateData)
        .where(eq(listings.id, req.params.id))
        .returning();

      // Send price drop notifications to users who favorited this listing
      if (isPriceDrop && listing.status === 'active') {
        try {
          const favoritedUsers = await db
            .select({ userId: favorites.userId })
            .from(favorites)
            .where(eq(favorites.listingId, req.params.id));

          const discountPercent = Math.round(((oldPrice - newPrice) / oldPrice) * 100);

          // Create notifications for all users who favorited
          if (favoritedUsers.length > 0) {
            const notificationValues = favoritedUsers.map(fav => ({
              userId: fav.userId,
              type: 'price_drop' as const,
              title: 'Fiyat Düştü!',
              message: `"${listing.title}" ilanının fiyatı %${discountPercent} düştü! Yeni fiyat: ₺${newPrice.toLocaleString('tr-TR')}`,
              data: {
                listingId: req.params.id,
                oldPrice: oldPrice,
                newPrice: newPrice,
                discountPercent: discountPercent,
              },
            }));

            await db.insert(notifications).values(notificationValues);
          }
        } catch (notifError) {
          // Don't fail the update if notification fails
          console.error("Failed to send price drop notifications:", notifError);
        }
      }
        
      res.json(updated);
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(400).json({ message: "Update failed", error });
    }
  });

  app.delete("/api/listings/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const listingId = req.params.id;
      
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);
        
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      if (listing.sellerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Initialize object storage for file deletion
      const objectStorage = new ObjectStorageService();

      // Delete all related records before deleting the listing
      // 1. Delete favorites
      await db.delete(favorites).where(eq(favorites.listingId, listingId));
      
      // 2. Get listing images and delete from Object Storage, then from DB
      const imagesToDelete = await db.select()
        .from(listingImages)
        .where(eq(listingImages.listingId, listingId));
      
      // Delete images from Object Storage
      for (const img of imagesToDelete) {
        const pathsToDelete = [
          img.originalKey,
          img.thumbnailKey,
          img.mediumKey,
          img.largeKey
        ].filter(Boolean) as string[];
        
        await objectStorage.deleteMultipleFiles(pathsToDelete);
      }
      
      // Delete from DB
      await db.delete(listingImages).where(eq(listingImages.listingId, listingId));
      
      // Also delete images from listing.images array if any
      if (listing.images && Array.isArray(listing.images)) {
        await objectStorage.deleteMultipleFiles(listing.images as string[]);
      }
      
      // 3. Delete reports related to this listing
      await db.delete(reports).where(
        and(eq(reports.reportedType, 'listing'), eq(reports.reportedId, listingId))
      );
      
      // 4. Delete offers related to this listing
      await db.delete(offers).where(eq(offers.listingId, listingId));
      
      // 5. Clear listing reference from conversations (don't delete conversations)
      await db.update(conversations)
        .set({ listingId: null })
        .where(eq(conversations.listingId, listingId));
      
      // 6. Delete auctions and their bids
      const relatedAuctions = await db.select({ id: auctions.id })
        .from(auctions)
        .where(eq(auctions.listingId, listingId));
      
      for (const auction of relatedAuctions) {
        await db.delete(bids).where(eq(bids.auctionId, auction.id));
      }
      await db.delete(auctions).where(eq(auctions.listingId, listingId));

      // 7. Finally delete the listing
      await db.delete(listings).where(eq(listings.id, listingId));
      
      res.json({ message: "Listing deleted successfully" });
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(400).json({ message: "Delete failed", error });
    }
  });

  // Deactivate listing (set to draft/inactive)
  app.patch("/api/listings/:id/deactivate", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const listingId = req.params.id;
      
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);
        
      if (!listing) {
        return res.status(404).json({ message: "İlan bulunamadı" });
      }

      if (listing.sellerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
      }

      const [updated] = await db
        .update(listings)
        .set({ status: "draft", updatedAt: new Date() })
        .where(eq(listings.id, listingId))
        .returning();
      
      res.json({ message: "İlan pasife alındı", listing: updated });
    } catch (error) {
      console.error("Error deactivating listing:", error);
      res.status(400).json({ message: "İlan pasife alınamadı" });
    }
  });

  // Activate listing (set to active)
  app.patch("/api/listings/:id/activate", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const listingId = req.params.id;
      
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);
        
      if (!listing) {
        return res.status(404).json({ message: "İlan bulunamadı" });
      }

      if (listing.sellerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
      }

      const [updated] = await db
        .update(listings)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(listings.id, listingId))
        .returning();
      
      res.json({ message: "İlan aktifleştirildi", listing: updated });
    } catch (error) {
      console.error("Error activating listing:", error);
      res.status(400).json({ message: "İlan aktifleştirilemedi" });
    }
  });

  app.get("/api/listings/mine", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userListings = await db
        .select()
        .from(listings)
        .where(eq(listings.sellerId, getUserId(req.user)))
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
        query = query.where(eq(auctions.status, status as any)) as any;
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

  app.post("/api/auctions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const data = insertAuctionSchema.parse(req.body);
      
      // Verify listing belongs to user
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, data.listingId))
        .limit(1);
      
      if (!listing || listing.sellerId !== getUserId(req.user)) {
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

  app.post("/api/auctions/:id/bids", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [auction] = await db
        .select()
        .from(auctions)
        .where(eq(auctions.id, req.params.id))
        .limit(1);
      
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
          message: `Bid must be at least ₺${(currentPrice + minIncrement).toFixed(2)}` 
        });
      }

      const [bid] = await db
        .insert(bids)
        .values({
          auctionId: req.params.id,
          bidderId: getUserId(req.user),
          amount: bidAmount.toString(),
        } as any)
        .returning();

      await db
        .update(auctions)
        .set({
          currentPrice: bidAmount.toString(),
          totalBids: (auction.totalBids || 0) + 1,
        })
        .where(eq(auctions.id, req.params.id));

      wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'new_bid',
            auctionId: req.params.id,
            bid: {
              ...bid,
              bidder: {
                id: getUserId(req.user),
                fullName: `${(req.user as any).firstName || ''} ${(req.user as any).lastName || ''}`.trim() || (req.user as any).username,
              },
            },
          }));
        }
      });

      res.status(201).json(bid);
    } catch (error) {
      console.error("Failed to place bid:", error);
      res.status(400).json({ message: "Failed to place bid", error });
    }
  });

  // ============ Live Stream Routes ============
  app.get("/api/streams", async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      
      // Get live streams from PostgreSQL
      let query = db.select().from(liveStreams);
      
      if (status) {
        query = query.where(eq(liveStreams.status, status as any)) as any;
      }
      
      const allStreams = await query.orderBy(desc(liveStreams.createdAt));
      res.json(allStreams);
    } catch (error) {
      console.error("Failed to fetch streams:", error);
      res.status(500).json({ message: "Failed to fetch streams" });
    }
  });

  app.get("/api/streams/:id", async (req: Request, res: Response) => {
    try {
      const [stream] = await db
        .select()
        .from(liveStreams)
        .where(eq(liveStreams.id, req.params.id))
        .limit(1);
      
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      // Get streamer info
      const [streamer] = await db
        .select()
        .from(users)
        .where(eq(users.id, stream.streamerId))
        .limit(1);
      
      // Get linked listing if exists
      let listing = null;
      if (stream.listingId) {
        [listing] = await db
          .select()
          .from(listings)
          .where(eq(listings.id, stream.listingId))
          .limit(1);
      }

      res.json({
        ...stream,
        streamer,
        listing,
      });
    } catch (error) {
      console.error("Failed to fetch stream:", error);
      res.status(500).json({ message: "Failed to fetch stream" });
    }
  });

  app.post("/api/streams", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const data = insertLiveStreamSchema.parse({
        ...req.body,
        streamerId: getUserId(req.user),
        channelName: `stream_${Date.now()}_${getUserId(req.user).substring(0, 8)}`,
      });

      // Create stream in PostgreSQL
      const [stream] = await db
        .insert(liveStreams)
        .values(data as any)
        .returning();
      
      res.status(201).json(stream);
    } catch (error) {
      console.error("Failed to create stream:", error);
      res.status(400).json({ message: "Failed to create stream", error });
    }
  });

  app.patch("/api/streams/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [stream] = await db
        .select()
        .from(liveStreams)
        .where(eq(liveStreams.id, req.params.id))
        .limit(1);
      
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      if (stream.streamerId !== getUserId(req.user)) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const [updated] = await db
        .update(liveStreams)
        .set(req.body)
        .where(eq(liveStreams.id, req.params.id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update stream:", error);
      res.status(400).json({ message: "Failed to update stream", error });
    }
  });

  app.post("/api/streams/:id/join", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [stream] = await db
        .select()
        .from(liveStreams)
        .where(eq(liveStreams.id, req.params.id))
        .limit(1);
      
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      if (stream.status !== "live") {
        return res.status(400).json({ message: "Stream is not live" });
      }

      const newViewerCount = (stream.viewerCount || 0) + 1;
      const newPeakViewers = Math.max(stream.peakViewers || 0, newViewerCount);

      const [updated] = await db
        .update(liveStreams)
        .set({
          viewerCount: newViewerCount,
          peakViewers: newPeakViewers,
        })
        .where(eq(liveStreams.id, req.params.id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Failed to join stream:", error);
      res.status(500).json({ message: "Failed to join stream" });
    }
  });

  app.post("/api/streams/:id/leave", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [stream] = await db
        .select()
        .from(liveStreams)
        .where(eq(liveStreams.id, req.params.id))
        .limit(1);
      
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      const newViewerCount = Math.max(0, (stream.viewerCount || 0) - 1);

      const [updated] = await db
        .update(liveStreams)
        .set({
          viewerCount: newViewerCount,
        })
        .where(eq(liveStreams.id, req.params.id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Failed to leave stream:", error);
      res.status(500).json({ message: "Failed to leave stream" });
    }
  });

  // Live Streaming RTC Token Generation (requires AGORA_APP_ID and AGORA_APP_CERTIFICATE)
  app.get("/api/streams/:id/token", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [stream] = await db
        .select()
        .from(liveStreams)
        .where(eq(liveStreams.id, req.params.id))
        .limit(1);
      
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      // Check if live streaming credentials are configured
      const appId = process.env.AGORA_APP_ID;
      const appCertificate = process.env.AGORA_APP_CERTIFICATE;
      
      if (!appId || !appCertificate) {
        return res.status(503).json({ 
          message: "Canlı yayın altyapısı henüz aktif değil. Entegrasyon tamamlandığında kullanıma açılacaktır.",
          requiresSetup: true 
        });
      }

      // Generate RTC token
      const { RtcTokenBuilder, RtcRole } = await import('agora-access-token');
      
      const uid = parseInt(getUserId(req.user).substring(0, 8), 16); // Convert user ID to number
      const role = stream.streamerId === getUserId(req.user) ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
      const expirationTimeInSeconds = 3600; // 1 hour
      const currentTimestamp = Math.floor(Date.now() / 1000);
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
        appId,
      });
    } catch (error) {
      console.error("Failed to generate stream token:", error);
      res.status(500).json({ message: "Failed to generate token" });
    }
  });

  // ============ Notification Routes ============
  
  // Get user notifications
  app.get("/api/notifications", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const limit = parseInt(req.query.limit as string) || 20;
      const unreadOnly = req.query.unreadOnly === 'true';

      let query = db
        .select()
        .from(notifications)
        .where(
          unreadOnly 
            ? and(eq(notifications.userId, userId), eq(notifications.isRead, false))
            : eq(notifications.userId, userId)
        )
        .orderBy(desc(notifications.createdAt))
        .limit(limit);

      const userNotifications = await query;
      res.json(userNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/count", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);

      const [result] = await db
        .select({ count: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

      res.json({ count: result?.count || 0 });
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const notificationId = req.params.id;

      const [notification] = await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
        .returning();

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json(notification);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  // Mark all notifications as read
  app.post("/api/notifications/read-all", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      res.status(500).json({ message: "Failed to update notifications" });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const notificationId = req.params.id;

      const [deleted] = await db
        .delete(notifications)
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
        .returning();

      if (!deleted) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Failed to delete notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // ============ Message Routes ============
  
  // Get total unread message count
  app.get("/api/messages/unread-count", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      
      // Get unread count from conversations table
      const userConvs = await db
        .select()
        .from(conversations)
        .where(
          or(
            eq(conversations.participant1Id, userId),
            eq(conversations.participant2Id, userId)
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
  
  // Search messages
  app.get("/api/messages/search", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (!query || query.length < 2) {
        return res.json([]);
      }
      
      const results = await db
        .select({
          message: messages,
          sender: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderId, users.id))
        .where(
          and(
            or(
              eq(messages.senderId, userId),
              eq(messages.receiverId, userId)
            ),
            ilike(messages.content, `%${query}%`),
            eq(messages.isDeleted, false)
          )
        )
        .orderBy(desc(messages.createdAt))
        .limit(limit);
      
      res.json(results.map(r => ({
        ...r.message,
        sender: r.sender,
      })));
    } catch (error) {
      console.error("Failed to search messages:", error);
      res.status(500).json({ message: "Failed to search messages" });
    }
  });
  
  // Get conversations with advanced features
  app.get("/api/messages/conversations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const showArchived = req.query.archived === "true";
      
      // Get conversations from the new conversations table
      const userConvs = await db
        .select()
        .from(conversations)
        .where(
          and(
            or(
              eq(conversations.participant1Id, userId),
              eq(conversations.participant2Id, userId)
            ),
            // Filter archived based on query param
            showArchived 
              ? or(
                  and(eq(conversations.participant1Id, userId), eq(conversations.participant1Archived, true)),
                  and(eq(conversations.participant2Id, userId), eq(conversations.participant2Archived, true))
                )
              : and(
                  or(
                    and(eq(conversations.participant1Id, userId), eq(conversations.participant1Archived, false)),
                    and(eq(conversations.participant2Id, userId), eq(conversations.participant2Archived, false))
                  )
                )
          )
        )
        .orderBy(desc(conversations.lastMessageAt));
      
      if (userConvs.length === 0) {
        return res.json([]);
      }
      
      // Get partner IDs and last messages
      const partnerIds = userConvs.map(c => 
        c.participant1Id === userId ? c.participant2Id : c.participant1Id
      );
      const messageIds = userConvs.map(c => c.lastMessageId).filter(Boolean) as string[];
      
      // Batch fetch partners
      const partners = partnerIds.length > 0 ? await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        })
        .from(users)
        .where(sql`${users.id} = ANY(${partnerIds})`) : [];
      
      // Batch fetch last messages with listing info
      const lastMsgs = messageIds.length > 0 ? await db
        .select({
          message: messages,
          listing: {
            id: listings.id,
            title: listings.title,
            price: listings.price,
            images: listings.images,
            city: listings.city,
            district: listings.district,
          },
        })
        .from(messages)
        .leftJoin(listings, eq(messages.listingId, listings.id))
        .where(sql`${messages.id} = ANY(${messageIds})`) : [];
      
      // Batch fetch presence
      const presences = partnerIds.length > 0 ? await db
        .select()
        .from(userPresence)
        .where(sql`${userPresence.userId} = ANY(${partnerIds})`) : [];
      
      // Create maps
      const partnersMap = new Map(partners.map(p => [p.id, p]));
      const messagesMap = new Map(lastMsgs.map(m => [m.message.id, { ...m.message, listing: m.listing }]));
      const presenceMap = new Map(presences.map(p => [p.userId, p]));
      
      // Build response
      const result = userConvs.map(conv => {
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
            lastSeenAt: presence?.lastSeenAt?.toISOString() || null,
          } : null,
          lastMessage,
          unreadCount: isParticipant1 ? conv.participant1UnreadCount : conv.participant2UnreadCount,
          isPinned: isParticipant1 ? conv.participant1Pinned : conv.participant2Pinned,
          isArchived: isParticipant1 ? conv.participant1Archived : conv.participant2Archived,
          isMuted: isParticipant1 ? conv.participant1Muted : conv.participant2Muted,
          lastReadAt: isParticipant1 ? conv.participant1LastReadAt : conv.participant2LastReadAt,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        };
      });
      
      // Sort: pinned first, then by lastMessageAt
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
  
  // Archive/unarchive conversation
  app.patch("/api/conversations/:id/archive", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const conversationId = req.params.id;
      const { archived } = req.body;
      
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);
      
      if (!conv) {
        return res.status(404).json({ message: "Konuşma bulunamadı" });
      }
      
      // Check if user is participant
      if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
        return res.status(403).json({ message: "Bu konuşmaya erişim yetkiniz yok" });
      }
      
      const updateData = conv.participant1Id === userId
        ? { participant1Archived: archived }
        : { participant2Archived: archived };
      
      await db
        .update(conversations)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
      
      res.json({ message: archived ? "Konuşma arşivlendi" : "Konuşma arşivden çıkarıldı" });
    } catch (error) {
      console.error("Failed to archive conversation:", error);
      res.status(500).json({ message: "Failed to archive conversation" });
    }
  });
  
  // Pin/unpin conversation
  app.patch("/api/conversations/:id/pin", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const conversationId = req.params.id;
      const { pinned } = req.body;
      
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);
      
      if (!conv) {
        return res.status(404).json({ message: "Konuşma bulunamadı" });
      }
      
      if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
        return res.status(403).json({ message: "Bu konuşmaya erişim yetkiniz yok" });
      }
      
      const updateData = conv.participant1Id === userId
        ? { participant1Pinned: pinned }
        : { participant2Pinned: pinned };
      
      await db
        .update(conversations)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
      
      res.json({ message: pinned ? "Konuşma sabitlendi" : "Konuşma sabitten çıkarıldı" });
    } catch (error) {
      console.error("Failed to pin conversation:", error);
      res.status(500).json({ message: "Failed to pin conversation" });
    }
  });
  
  // Mute/unmute conversation
  app.patch("/api/conversations/:id/mute", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const conversationId = req.params.id;
      const { muted } = req.body;
      
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);
      
      if (!conv) {
        return res.status(404).json({ message: "Konuşma bulunamadı" });
      }
      
      if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
        return res.status(403).json({ message: "Bu konuşmaya erişim yetkiniz yok" });
      }
      
      const updateData = conv.participant1Id === userId
        ? { participant1Muted: muted }
        : { participant2Muted: muted };
      
      await db
        .update(conversations)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
      
      res.json({ message: muted ? "Konuşma sessize alındı" : "Konuşma sesi açıldı" });
    } catch (error) {
      console.error("Failed to mute conversation:", error);
      res.status(500).json({ message: "Failed to mute conversation" });
    }
  });
  
  // Mark conversation as read
  app.post("/api/conversations/:id/read", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const conversationId = req.params.id;
      
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);
      
      if (!conv) {
        return res.status(404).json({ message: "Konuşma bulunamadı" });
      }
      
      if (conv.participant1Id !== userId && conv.participant2Id !== userId) {
        return res.status(403).json({ message: "Bu konuşmaya erişim yetkiniz yok" });
      }
      
      // Update unread count and last read time
      const updateData = conv.participant1Id === userId
        ? { participant1UnreadCount: 0, participant1LastReadAt: new Date() }
        : { participant2UnreadCount: 0, participant2LastReadAt: new Date() };
      
      await db
        .update(conversations)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));
      
      // Mark all messages as read
      await db
        .update(messages)
        .set({
          status: "read",
          readAt: new Date(),
        })
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(messages.receiverId, userId),
            sql`${messages.status} != 'read'`
          )
        );
      
      res.json({ message: "Konuşma okundu olarak işaretlendi" });
    } catch (error) {
      console.error("Failed to mark conversation as read:", error);
      res.status(500).json({ message: "Failed to mark conversation as read" });
    }
  });
  
  // Upload file/image for messages
  app.post("/api/messages/upload", isAuthenticated, uploadMessageFiles.single('file'), async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "Dosya gerekli" });
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "Dosya boyutu 10MB'ı aşamaz" });
      }
      
      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: "Desteklenmeyen dosya türü" });
      }
      
      const isImage = file.mimetype.startsWith('image/');
      const timestamp = Date.now();
      const ext = file.originalname.split('.').pop() || 'bin';
      const filename = `message_${userId}_${timestamp}.${ext}`;
      
      let fileBuffer = file.buffer;
      let finalFilename = filename;
      
      // Process images with Sharp
      if (isImage && file.mimetype !== 'image/gif') {
        const sharp = (await import('sharp')).default;
        
        // Resize large images and convert to WebP
        fileBuffer = await sharp(file.buffer)
          .rotate() // Auto-rotate based on EXIF
          .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();
        
        finalFilename = `message_${userId}_${timestamp}.webp`;
      }
      
      // Upload to object storage
      const objectStorage = new ObjectStorageService();
      const contentType = isImage && file.mimetype !== 'image/gif' ? 'image/webp' : file.mimetype;
      const objectPath = await objectStorage.uploadFileBuffer(fileBuffer, contentType);
      
      const fileUrl = `/api/objects/${objectPath}`;
      
      res.json({
        url: fileUrl,
        filename: file.originalname,
        mimeType: isImage && file.mimetype !== 'image/gif' ? 'image/webp' : file.mimetype,
        size: fileBuffer.length,
        type: isImage ? 'image' : 'file',
      });
    } catch (error) {
      console.error("Failed to upload message file:", error);
      res.status(500).json({ message: "Dosya yüklenemedi" });
    }
  });

  app.get("/api/messages/:userId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUserId = getUserId(req.user);
      const otherUserId = req.params.userId;
      
      // Get messages between two users with listing info
      const msgs = await db
        .select({
          message: messages,
          listing: {
            id: listings.id,
            title: listings.title,
            price: listings.price,
            images: listings.images,
            city: listings.city,
            district: listings.district,
          },
        })
        .from(messages)
        .leftJoin(listings, eq(messages.listingId, listings.id))
        .where(
          sql`(${messages.senderId} = ${currentUserId} AND ${messages.receiverId} = ${otherUserId}) OR (${messages.senderId} = ${otherUserId} AND ${messages.receiverId} = ${currentUserId})`
        )
        .orderBy(messages.createdAt);
      
      // Flatten and return messages with listing info attached
      const result = msgs.map(row => ({
        ...row.message,
        listing: row.listing,
      }));
      
      // Also get the conversation listing (most recent one with a listing)
      const conversationListing = msgs.find(m => m.listing)?.listing || null;
      
      res.json({
        messages: result,
        listing: conversationListing,
      });
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const senderId = getUserId(req.user);
      const { receiverId, content, listingId, messageType, replyToId, attachments } = req.body;
      
      if (!receiverId || !content) {
        return res.status(400).json({ message: "Alıcı ve mesaj içeriği gereklidir" });
      }
      
      // Get or create conversation
      const conversationId = [senderId, receiverId].sort().join('_');
      
      // Check if conversation exists
      const [existingConv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);
      
      if (!existingConv) {
        // Create new conversation
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
          participant2Muted: false,
        });
      }

      // Create message in PostgreSQL
      const [message] = await db
        .insert(messages)
        .values({
          senderId,
          receiverId,
          conversationId,
          content,
          listingId: listingId || null,
          messageType: messageType || "text",
          replyToId: replyToId || null,
          attachments: attachments || [],
        })
        .returning();
      
      // Update conversation
      const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);
      
      if (conv) {
        const isParticipant1Receiver = conv.participant1Id === receiverId;
        await db
          .update(conversations)
          .set({
            lastMessageId: message.id,
            lastMessageAt: new Date(),
            updatedAt: new Date(),
            ...(isParticipant1Receiver
              ? { participant1UnreadCount: sql`COALESCE(${conversations.participant1UnreadCount}, 0) + 1` }
              : { participant2UnreadCount: sql`COALESCE(${conversations.participant2UnreadCount}, 0) + 1` }),
          })
          .where(eq(conversations.id, conversationId));
      }

      // Send notification to receiver
      try {
        const sender = req.user as any;
        const senderName = sender.firstName 
          ? `${sender.firstName} ${sender.lastName || ''}`.trim() 
          : sender.username || 'Birisi';
        
        await db.insert(notifications).values({
          userId: receiverId,
          type: 'new_message',
          title: 'Yeni Mesaj',
          message: `${senderName} size bir mesaj gönderdi`,
          link: `/mesajlar?conversationId=${conversationId}`,
          relatedId: message.id,
        });
      } catch (notifError) {
        console.error("Failed to create message notification:", notifError);
      }
      
      res.status(201).json({ ...message, conversationId });
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

      // Sanitize author - only expose safe fields (intentionally partial to avoid PII leak)
      const sanitizedPosts = posts.map((post) => {
        if (post.author) {
          return {
            ...post,
            author: {
              id: post.author.id,
              fullName: `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || post.author.username,
              avatar: post.author.profileImageUrl,
            } as any, // Type assertion: intentionally returning partial user object for security
          };
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
      // Read from database directly (seeded data) with author info
      const post = await db.query.blogPosts.findFirst({
        where: (posts, { eq }) => eq(posts.slug, req.params.slug),
        with: {
          author: true,
        },
      });
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Sanitize author - only expose safe fields (intentionally partial to avoid PII leak)
      let sanitizedPost = post;
      if (post.author) {
        sanitizedPost = {
          ...post,
          author: {
            id: post.author.id,
            fullName: `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || post.author.username,
            avatar: post.author.profileImageUrl,
          } as any, // Type assertion: intentionally returning partial user object for security
        };
      }

      res.json(sanitizedPost);
    } catch (error) {
      console.error("Blog detail API error:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.post("/api/blog", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if ((req.user as any).role !== "admin" && (req.user as any).role !== "vet") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const data = insertBlogPostSchema.parse({
        ...req.body,
        authorId: getUserId(req.user),
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
        query = query.where(eq(vetServices.city, city)) as any;
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

  app.post("/api/vet-services", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if ((req.user as any).role !== "vet") {
        return res.status(403).json({ message: "Only veterinarians can create services" });
      }

      const data = insertVetServiceSchema.parse({
        ...req.body,
        vetId: getUserId(req.user),
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

  app.post("/api/transport-services", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if ((req.user as any).role !== "transporter") {
        return res.status(403).json({ message: "Only transporters can create services" });
      }

      const data = insertTransportServiceSchema.parse({
        ...req.body,
        transporterId: getUserId(req.user),
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
  app.post("/api/reviews", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const data = insertReviewSchema.parse({
        ...req.body,
        reviewerId: getUserId(req.user),
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
  app.get("/api/favorites", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Get favorites from PostgreSQL
      const favs = await db
        .select()
        .from(favorites)
        .where(eq(favorites.userId, getUserId(req.user)));
      
      res.json(favs);
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const data = insertFavoriteSchema.parse({
        ...req.body,
        userId: getUserId(req.user),
      });

      // Create favorite in PostgreSQL
      const [favorite] = await db
        .insert(favorites)
        .values(data)
        .returning();

      // Send notification to listing owner
      try {
        const [listing] = await db
          .select()
          .from(listings)
          .where(eq(listings.id, data.listingId))
          .limit(1);
        
        if (listing && listing.sellerId !== getUserId(req.user)) {
          const favUser = req.user as any;
          const userName = favUser.firstName 
            ? `${favUser.firstName} ${favUser.lastName || ''}`.trim() 
            : favUser.username || 'Birisi';
          
          await db.insert(notifications).values({
            userId: listing.sellerId,
            type: 'new_favorite',
            title: 'Yeni Favori',
            message: `${userName} "${listing.title}" ilanınızı favorilere ekledi`,
            link: `/ilanlar/${listing.id}`,
            relatedId: listing.id,
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

  app.delete("/api/favorites/:listingId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Delete favorite from PostgreSQL
      await db
        .delete(favorites)
        .where(
          and(
            eq(favorites.userId, getUserId(req.user)),
            eq(favorites.listingId, req.params.listingId)
          )
        );
      
      res.json({ message: "Favorite removed" });
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      res.status(400).json({ message: "Failed to remove favorite", error });
    }
  });

  // ============ Offer Routes (Make Offer feature) ============

  // Get offers for a listing (seller view only)
  app.get("/api/listings/:listingId/offers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Verify the user owns the listing
      const [listing] = await db
        .select({ sellerId: listings.sellerId })
        .from(listings)
        .where(eq(listings.id, req.params.listingId))
        .limit(1);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.sellerId !== userId) {
        return res.status(403).json({ message: "Not authorized to view offers for this listing" });
      }
      
      const listingOffers = await db
        .select({
          offer: offers,
          buyer: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            sellerLevel: users.sellerLevel,
          }
        })
        .from(offers)
        .innerJoin(users, eq(offers.buyerId, users.id))
        .where(eq(offers.listingId, req.params.listingId))
        .orderBy(desc(offers.createdAt));

      res.json(listingOffers.map(o => ({
        ...o.offer,
        buyer: o.buyer
      })));
    } catch (error) {
      console.error("Failed to fetch offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  // Get user's sent offers
  app.get("/api/offers/sent", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const sentOffers = await db
        .select({
          offer: offers,
          listing: {
            id: listings.id,
            title: listings.title,
            price: listings.price,
            images: listings.images,
          },
          seller: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          }
        })
        .from(offers)
        .innerJoin(listings, eq(offers.listingId, listings.id))
        .innerJoin(users, eq(offers.sellerId, users.id))
        .where(eq(offers.buyerId, userId))
        .orderBy(desc(offers.createdAt));

      res.json(sentOffers.map(o => ({
        ...o.offer,
        listing: o.listing,
        seller: o.seller
      })));
    } catch (error) {
      console.error("Failed to fetch sent offers:", error);
      res.status(500).json({ message: "Failed to fetch sent offers" });
    }
  });

  // Get user's received offers
  app.get("/api/offers/received", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const receivedOffers = await db
        .select({
          offer: offers,
          listing: {
            id: listings.id,
            title: listings.title,
            price: listings.price,
            images: listings.images,
          },
          buyer: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
            sellerLevel: users.sellerLevel,
          }
        })
        .from(offers)
        .innerJoin(listings, eq(offers.listingId, listings.id))
        .innerJoin(users, eq(offers.buyerId, users.id))
        .where(eq(offers.sellerId, userId))
        .orderBy(desc(offers.createdAt));

      res.json(receivedOffers.map(o => ({
        ...o.offer,
        listing: o.listing,
        buyer: o.buyer
      })));
    } catch (error) {
      console.error("Failed to fetch received offers:", error);
      res.status(500).json({ message: "Failed to fetch received offers" });
    }
  });

  // Create a new offer
  app.post("/api/offers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const { listingId, amount, message, expiresAt } = req.body;
      
      // Get listing details
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.sellerId === userId) {
        return res.status(400).json({ message: "Cannot make an offer on your own listing" });
      }
      
      if (!listing.allowOffers) {
        return res.status(400).json({ message: "This listing does not accept offers" });
      }
      
      // Check for existing pending offer
      const [existingOffer] = await db
        .select()
        .from(offers)
        .where(
          and(
            eq(offers.listingId, listingId),
            eq(offers.buyerId, userId),
            eq(offers.status, 'pending')
          )
        )
        .limit(1);
      
      if (existingOffer) {
        return res.status(400).json({ message: "You already have a pending offer on this listing" });
      }
      
      // Create offer
      const [newOffer] = await db
        .insert(offers)
        .values({
          listingId,
          buyerId: userId,
          sellerId: listing.sellerId,
          amount: String(amount),
          message,
          expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
        } as any)
        .returning();
      
      // Notify seller
      try {
        await db.insert(notifications).values({
          userId: listing.sellerId,
          type: 'system',
          title: 'Yeni Teklif',
          message: `${listing.title} ilanınıza ₺${amount} teklif geldi`,
          link: `/ilan/${listing.id}`,
          relatedId: newOffer.id,
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

  // Respond to an offer (accept/reject/counter)
  app.patch("/api/offers/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const { status, counterAmount, counterMessage } = req.body;
      
      // Get offer
      const [offer] = await db
        .select()
        .from(offers)
        .where(eq(offers.id, req.params.id))
        .limit(1);
      
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      
      if (offer.sellerId !== userId) {
        return res.status(403).json({ message: "Not authorized to respond to this offer" });
      }
      
      if (offer.status !== 'pending') {
        return res.status(400).json({ message: "Can only respond to pending offers" });
      }
      
      const updateData: any = {
        status,
        respondedAt: new Date(),
      };
      
      if (status === 'countered' && counterAmount) {
        updateData.counterAmount = String(counterAmount);
        updateData.counterMessage = counterMessage;
      }
      
      const [updatedOffer] = await db
        .update(offers)
        .set(updateData)
        .where(eq(offers.id, req.params.id))
        .returning();
      
      // Get listing for notification
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, offer.listingId))
        .limit(1);
      
      // Notify buyer
      try {
        let notifMessage = '';
        if (status === 'accepted') {
          notifMessage = `${listing?.title} ilanındaki teklifiniz kabul edildi!`;
        } else if (status === 'rejected') {
          notifMessage = `${listing?.title} ilanındaki teklifiniz reddedildi`;
        } else if (status === 'countered') {
          notifMessage = `${listing?.title} ilanında ₺${counterAmount} karşı teklif geldi`;
        }
        
        await db.insert(notifications).values({
          userId: offer.buyerId,
          type: 'system',
          title: status === 'accepted' ? 'Teklif Kabul Edildi' : status === 'countered' ? 'Karşı Teklif' : 'Teklif Yanıtı',
          message: notifMessage,
          link: `/ilan/${offer.listingId}`,
          relatedId: offer.id,
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

  // Withdraw an offer
  app.delete("/api/offers/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const userId = user.dbUserId || user.claims?.sub || user.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const [offer] = await db
        .select()
        .from(offers)
        .where(eq(offers.id, req.params.id))
        .limit(1);
      
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      
      if (offer.buyerId !== userId) {
        return res.status(403).json({ message: "Not authorized to withdraw this offer" });
      }
      
      if (offer.status !== 'pending') {
        return res.status(400).json({ message: "Can only withdraw pending offers" });
      }
      
      await db
        .update(offers)
        .set({ status: 'withdrawn' })
        .where(eq(offers.id, req.params.id));
      
      res.json({ message: "Offer withdrawn" });
    } catch (error) {
      console.error("Failed to withdraw offer:", error);
      res.status(400).json({ message: "Failed to withdraw offer", error });
    }
  });

  // Track listing share
  app.post("/api/listings/:id/share", async (req: Request, res: Response) => {
    try {
      await db
        .update(listings)
        .set({ shareCount: sql`COALESCE(share_count, 0) + 1` })
        .where(eq(listings.id, req.params.id));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to track share:", error);
      res.status(400).json({ message: "Failed to track share" });
    }
  });

  // Get similar listings for price comparison
  app.get("/api/listings/:id/compare", async (req: Request, res: Response) => {
    try {
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, req.params.id))
        .limit(1);
      
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      // Find similar listings (same category, different sellers)
      const similarListings = await db
        .select({
          id: listings.id,
          title: listings.title,
          price: listings.price,
          images: listings.images,
          city: listings.city,
          breed: listings.breed,
          age: listings.age,
          views: listings.views,
          createdAt: listings.createdAt,
        })
        .from(listings)
        .where(
          and(
            eq(listings.categoryId, listing.categoryId),
            eq(listings.status, 'active'),
            sql`${listings.id} != ${listing.id}`
          )
        )
        .orderBy(sql`ABS(CAST(${listings.price} AS DECIMAL) - CAST(${listing.price} AS DECIMAL))`)
        .limit(6);
      
      // Calculate price stats
      const allPrices = [parseFloat(listing.price), ...similarListings.map(l => parseFloat(l.price))];
      const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      
      res.json({
        currentListing: {
          id: listing.id,
          price: listing.price,
          pricePosition: parseFloat(listing.price) < avgPrice ? 'below_avg' : parseFloat(listing.price) > avgPrice ? 'above_avg' : 'average',
        },
        similarListings,
        priceStats: {
          average: avgPrice.toFixed(2),
          min: minPrice.toFixed(2),
          max: maxPrice.toFixed(2),
          count: allPrices.length,
        }
      });
    } catch (error) {
      console.error("Failed to get price comparison:", error);
      res.status(500).json({ message: "Failed to get price comparison" });
    }
  });

  // ============ Object Storage Routes ============
  
  // Get upload URL for object (legacy - presigned URL approach)
  app.post("/api/objects/upload", createLimiter, isAuthenticated, async (req: Request, res: Response) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      // Return normalized path for frontend to use when displaying the image
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      console.log("Upload URL generated:", { uploadURL: uploadURL.substring(0, 80) + "...", normalizedPath });
      res.json({ uploadURL, normalizedPath });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Direct file upload through backend (no CORS issues)
  app.post("/api/objects/upload-file", createLimiter, isAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
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
      res.status(500).json({ message: "Dosya yüklenemedi" });
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

  // ============ Listing Image Routes ============

  // Upload multiple images for a listing (up to 10 at once)
  app.post("/api/listing-images/upload", createLimiter, isAuthenticated, upload.array('images', 10), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "En az bir görsel yüklemeniz gerekmektedir." });
      }

      const listingId = req.body.listingId;
      
      // If listingId provided, verify ownership
      if (listingId) {
        const [listing] = await db
          .select()
          .from(listings)
          .where(eq(listings.id, listingId))
          .limit(1);
        
        if (!listing) {
          return res.status(404).json({ message: "İlan bulunamadı." });
        }
        
        if (listing.sellerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
          return res.status(403).json({ message: "Bu ilana görsel yükleme yetkiniz yok." });
        }
      }

      // Validate all files first
      for (const file of files) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          return res.status(400).json({ message: validation.error });
        }
      }

      // Get current max display order
      let currentMaxOrder = 0;
      if (listingId) {
        const maxOrderResult = await db
          .select({ maxOrder: sql<number>`COALESCE(MAX(${listingImages.displayOrder}), 0)` })
          .from(listingImages)
          .where(eq(listingImages.listingId, listingId));
        currentMaxOrder = maxOrderResult[0]?.maxOrder || 0;
      }

      // Process and upload all images
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
            status: 'ready',
          }).returning();
          
          uploadedImages.push(imageRecord);
        } catch (err) {
          console.error(`Error processing image ${file.originalname}:`, err);
        }
      }

      res.json({
        message: `${uploadedImages.length} görsel başarıyla yüklendi.`,
        images: uploadedImages,
      });
    } catch (error) {
      console.error("Error uploading listing images:", error);
      res.status(500).json({ message: "Görsel yüklenirken bir hata oluştu." });
    }
  });

  // Get images for a listing
  app.get("/api/listing-images/:listingId", async (req: Request, res: Response) => {
    try {
      const images = await db
        .select()
        .from(listingImages)
        .where(eq(listingImages.listingId, req.params.listingId))
        .orderBy(listingImages.displayOrder);
      
      res.json(images);
    } catch (error) {
      console.error("Error fetching listing images:", error);
      res.status(500).json({ message: "Görseller getirilemedi." });
    }
  });

  // Delete a listing image
  app.delete("/api/listing-images/:imageId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [image] = await db
        .select()
        .from(listingImages)
        .where(eq(listingImages.id, req.params.imageId))
        .limit(1);
      
      if (!image) {
        return res.status(404).json({ message: "Görsel bulunamadı." });
      }

      // Check ownership through listing
      if (image.listingId) {
        const [listing] = await db
          .select()
          .from(listings)
          .where(eq(listings.id, image.listingId))
          .limit(1);
        
        if (listing && listing.sellerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
          return res.status(403).json({ message: "Bu görseli silme yetkiniz yok." });
        }
      }

      // Delete from object storage
      const keysToDelete = [
        image.originalKey,
        image.thumbnailKey,
        image.mediumKey,
        image.largeKey,
      ].filter(Boolean) as string[];
      
      await deleteImageVariants(keysToDelete);

      // Delete from database
      await db.delete(listingImages).where(eq(listingImages.id, req.params.imageId));

      res.json({ message: "Görsel başarıyla silindi." });
    } catch (error) {
      console.error("Error deleting listing image:", error);
      res.status(500).json({ message: "Görsel silinirken bir hata oluştu." });
    }
  });

  // Reorder listing images
  app.patch("/api/listing-images/reorder", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { listingId, imageIds } = req.body;
      
      if (!listingId || !Array.isArray(imageIds)) {
        return res.status(400).json({ message: "Geçersiz istek." });
      }

      // Verify ownership
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, listingId))
        .limit(1);
      
      if (!listing) {
        return res.status(404).json({ message: "İlan bulunamadı." });
      }
      
      if (listing.sellerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Yetkiniz yok." });
      }

      // Update display orders
      for (let i = 0; i < imageIds.length; i++) {
        await db
          .update(listingImages)
          .set({ displayOrder: i })
          .where(and(
            eq(listingImages.id, imageIds[i]),
            eq(listingImages.listingId, listingId)
          ));
      }

      res.json({ message: "Görsel sıralaması güncellendi." });
    } catch (error) {
      console.error("Error reordering images:", error);
      res.status(500).json({ message: "Sıralama güncellenirken bir hata oluştu." });
    }
  });

  // Set cover image
  app.patch("/api/listing-images/:imageId/cover", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [image] = await db
        .select()
        .from(listingImages)
        .where(eq(listingImages.id, req.params.imageId))
        .limit(1);
      
      if (!image || !image.listingId) {
        return res.status(404).json({ message: "Görsel bulunamadı." });
      }

      // Verify ownership
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, image.listingId))
        .limit(1);
      
      if (!listing) {
        return res.status(404).json({ message: "İlan bulunamadı." });
      }
      
      if (listing.sellerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Yetkiniz yok." });
      }

      // Clear existing cover
      await db
        .update(listingImages)
        .set({ isCover: false })
        .where(eq(listingImages.listingId, image.listingId));

      // Set new cover
      await db
        .update(listingImages)
        .set({ isCover: true })
        .where(eq(listingImages.id, req.params.imageId));

      res.json({ message: "Kapak görseli güncellendi." });
    } catch (error) {
      console.error("Error setting cover image:", error);
      res.status(500).json({ message: "Kapak görseli güncellenirken bir hata oluştu." });
    }
  });

  // ============ Report Routes ============

  // Create a report
  app.post("/api/reports", isAuthenticated, createLimiter, async (req: Request, res: Response) => {
    try {
      const data = insertReportSchema.parse({
        ...req.body,
        reporterId: getUserId(req.user),
      });

      const [report] = await db
        .insert(reports)
        .values(data)
        .returning();

      res.status(201).json(report);
    } catch (error) {
      console.error("Failed to create report:", error);
      res.status(400).json({ message: "Şikayet oluşturulamadı", error });
    }
  });

  // Get user's reports
  app.get("/api/reports/my", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);

      const userReports = await db
        .select()
        .from(reports)
        .where(eq(reports.reporterId, userId))
        .orderBy(desc(reports.createdAt));

      res.json(userReports);
    } catch (error) {
      console.error("Failed to fetch user reports:", error);
      res.status(500).json({ message: "Şikayetler getirilemedi" });
    }
  });

  // Admin: Get all reports
  app.get("/api/admin/reports", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if ((req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Admin yetkisi gereklidir" });
      }

      const status = req.query.status as string;
      
      let query = db.select().from(reports);
      
      if (status && status !== 'all') {
        query = query.where(eq(reports.status, status as any)) as any;
      }

      const allReports = await query.orderBy(desc(reports.createdAt));

      res.json(allReports);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      res.status(500).json({ message: "Şikayetler getirilemedi" });
    }
  });

  // Admin: Update report status
  app.patch("/api/admin/reports/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if ((req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Admin yetkisi gereklidir" });
      }

      const reportId = req.params.id;
      const { status, adminNotes } = req.body;

      const updateData: any = {};
      if (status) updateData.status = status;
      if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
      
      if (status === 'resolved' || status === 'dismissed') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = getUserId(req.user);
      }

      const [updatedReport] = await db
        .update(reports)
        .set(updateData)
        .where(eq(reports.id, reportId))
        .returning();

      if (!updatedReport) {
        return res.status(404).json({ message: "Şikayet bulunamadı" });
      }

      res.json(updatedReport);
    } catch (error) {
      console.error("Failed to update report:", error);
      res.status(500).json({ message: "Şikayet güncellenemedi" });
    }
  });

  // ============ Admin Routes ============
  // Admin middleware - checks role from database for real-time admin access
  async function adminMiddleware(req: Request, res: Response, next: Function) {
    if (!req.user) {
      return res.status(403).json({ message: "Admin yetkisi gereklidir" });
    }
    
    // Check role from database (not session) for real-time admin access
    const userId = getUserId(req.user);
    const [dbUser] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    
    if (!dbUser || dbUser.role !== "admin") {
      return res.status(403).json({ message: "Admin yetkisi gereklidir" });
    }
    
    // Update session with current role
    (req.user as any).role = dbUser.role;
    next();
  }

  // Admin dashboard stats
  app.get("/api/admin/stats", isAuthenticated, adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const [usersCount] = await db.select({ count: count() }).from(users);
      const [listingsCount] = await db.select({ count: count() }).from(listings);
      const [activeListings] = await db.select({ count: count() }).from(listings).where(eq(listings.status, "active"));
      const [pendingListings] = await db.select({ count: count() }).from(listings).where(eq(listings.status, "pending"));
      const [verifiedUsers] = await db.select({ count: count() }).from(users).where(eq(users.emailVerified, true));

      res.json({
        totalUsers: Number(usersCount.count),
        verifiedUsers: Number(verifiedUsers.count),
        totalListings: Number(listingsCount.count),
        activeListings: Number(activeListings.count),
        pendingListings: Number(pendingListings.count),
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "İstatistikler getirilemedi" });
    }
  });

  // Get all listings for moderation (admin only)
  app.get("/api/admin/listings", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      
      const conditions = [];
      if (status && status !== 'all') {
        conditions.push(eq(listings.status, status as any));
      }

      // Get listings with seller info
      const allListings = await db
        .select({
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
          sellerIsVerified: users.emailVerified,
        })
        .from(listings)
        .leftJoin(users, eq(listings.sellerId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(listings.createdAt))
        .limit(100);
        
      res.json(allListings);
    } catch (error) {
      console.error("Error fetching listings for admin:", error);
      res.status(500).json({ message: "İlanlar getirilemedi" });
    }
  });

  // Update listing status (admin only - approve/reject with strict Zod validation)
  app.patch("/api/admin/listings/:id/status", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      // SECURITY: Validate with Zod schema
      const validationResult = moderateListingSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Geçersiz istek",
          errors: validationResult.error.errors,
        });
      }

      const { status, reason } = validationResult.data;

      // Get current listing
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, req.params.id))
        .limit(1);

      if (!listing) {
        return res.status(404).json({ message: "İlan bulunamadı" });
      }

      // SECURITY: Only allow moderation on pending listings
      if (listing.status !== 'pending') {
        return res.status(400).json({
          message: `Bu işlem sadece bekleyen ilanlar için yapılabilir. Mevcut durum: ${listing.status}`,
        });
      }

      // Update with full audit trail
      // SECURITY FIX: Clear moderationReason on approval
      const [updated] = await db
        .update(listings)
        .set({
          status: status,
          moderatedBy: getUserId(req.user),
          moderatedAt: new Date(),
          moderationReason: status === 'rejected' ? reason : null,
        })
        .where(eq(listings.id, req.params.id))
        .returning();

      // Send notification to seller about moderation result
      try {
        if (status === 'active') {
          await db.insert(notifications).values({
            userId: listing.sellerId,
            type: 'listing_approved',
            title: 'İlan Onaylandı',
            message: `"${listing.title}" ilanınız onaylandı ve yayına girdi`,
            link: `/ilanlar/${listing.id}`,
            relatedId: listing.id,
          });
        } else if (status === 'rejected') {
          await db.insert(notifications).values({
            userId: listing.sellerId,
            type: 'listing_rejected',
            title: 'İlan Reddedildi',
            message: `"${listing.title}" ilanınız reddedildi${reason ? `: ${reason}` : ''}`,
            link: `/ilanlar/${listing.id}`,
            relatedId: listing.id,
          });
        }
      } catch (notifError) {
        console.error("Failed to create moderation notification:", notifError);
      }

      res.json({
        ...updated,
        message: status === 'active' ? 'İlan başarıyla onaylandı' : 'İlan reddedildi',
      });
    } catch (error) {
      console.error("Error updating listing status:", error);
      res.status(500).json({ message: "Durum güncellenemedi" });
    }
  });

  // ============ Admin User Management Routes ============
  // Get all users (admin only)
  app.get("/api/admin/users", isAuthenticated, adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          role: users.role,
          emailVerified: users.emailVerified,
          phoneVerified: users.phoneVerified,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(200);
      
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users for admin:", error);
      res.status(500).json({ message: "Kullanıcılar getirilemedi" });
    }
  });

  // Update user role (admin only)
  app.patch("/api/admin/users/:id/role", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      // Validate role
      const validRoles = ['buyer', 'seller', 'vet', 'transporter', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Geçersiz rol" });
      }
      
      const [updatedUser] = await db
        .update(users)
        .set({ role })
        .where(eq(users.id, id))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Rol güncellenemedi" });
    }
  });

  // ============ Admin Store Management Routes ============
  // Get all stores (admin only)
  app.get("/api/admin/stores", isAuthenticated, adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const allStores = await db
        .select({
          id: stores.id,
          name: stores.displayName,
          slug: stores.slug,
          description: stores.description,
          storeType: stores.storeType,
          city: stores.city,
          status: stores.status,
          createdAt: stores.createdAt,
          ownerId: stores.ownerId,
          ownerName: sql<string>`COALESCE(NULLIF(TRIM(CONCAT(${users.firstName}, ' ', ${users.lastName})), ''), ${users.username})`,
          ownerEmail: users.email,
        })
        .from(stores)
        .leftJoin(users, eq(stores.ownerId, users.id))
        .orderBy(desc(stores.createdAt))
        .limit(100);
      
      res.json(allStores);
    } catch (error) {
      console.error("Error fetching stores for admin:", error);
      res.status(500).json({ message: "Mağazalar getirilemedi" });
    }
  });

  // Update store status (admin only)
  app.patch("/api/admin/stores/:id/status", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Geçersiz durum" });
      }
      
      const [updatedStore] = await db
        .update(stores)
        .set({ status })
        .where(eq(stores.id, id))
        .returning();
      
      if (!updatedStore) {
        return res.status(404).json({ message: "Mağaza bulunamadı" });
      }
      
      // Send notification to store owner
      try {
        if (status === 'approved') {
          await db.insert(notifications).values({
            userId: updatedStore.ownerId,
            type: 'system',
            title: 'Mağaza Onaylandı',
            message: `"${updatedStore.displayName}" mağazanız onaylandı`,
            link: `/magaza/${updatedStore.slug}`,
            relatedId: updatedStore.id,
          });
        } else if (status === 'rejected') {
          await db.insert(notifications).values({
            userId: updatedStore.ownerId,
            type: 'system',
            title: 'Mağaza Reddedildi',
            message: `"${updatedStore.displayName}" mağaza başvurunuz reddedildi`,
            link: `/panel/magaza`,
            relatedId: updatedStore.id,
          });
        }
      } catch (notifError) {
        console.error("Failed to create store notification:", notifError);
      }
      
      res.json(updatedStore);
    } catch (error) {
      console.error("Error updating store status:", error);
      res.status(500).json({ message: "Durum güncellenemedi" });
    }
  });

  // ============ Admin Blog Management Routes ============
  // SECURITY: All admin blog routes require authentication + admin role
  // Get all blog posts (admin only - includes unpublished)
  app.get("/api/admin/blog", isAuthenticated, adminMiddleware, async (_req: Request, res: Response) => {
    try {
      const allBlogs = await db
        .select({
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
          authorName: sql<string>`COALESCE(NULLIF(TRIM(CONCAT(${users.firstName}, ' ', ${users.lastName})), ''), ${users.username})`,
        })
        .from(blogPosts)
        .leftJoin(users, eq(blogPosts.authorId, users.id))
        .orderBy(desc(blogPosts.createdAt));
      
      res.json(allBlogs);
    } catch (error) {
      console.error("Error fetching admin blog posts:", error);
      res.status(500).json({ message: "Blog yazıları getirilemedi" });
    }
  });

  // Create new blog post (admin only)
  app.post("/api/admin/blog", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const validationResult = insertBlogPostSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Geçersiz blog verisi",
          errors: validationResult.error.errors,
        });
      }

      const [newBlog] = await db
        .insert(blogPosts)
        .values({
          ...validationResult.data,
          authorId: getUserId(req.user),
        } as any)
        .returning();
      
      res.status(201).json(newBlog);
    } catch (error: any) {
      console.error("Error creating blog post:", error);
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ message: "Bu slug zaten kullanımda" });
      }
      res.status(500).json({ message: "Blog yazısı oluşturulamadı" });
    }
  });

  // Update blog post (admin only)
  app.put("/api/admin/blog/:id", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const validationResult = insertBlogPostSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Geçersiz blog verisi",
          errors: validationResult.error.errors,
        });
      }

      const [updated] = await db
        .update(blogPosts)
        .set({
          ...(validationResult.data as any),
          updatedAt: new Date(),
        })
        .where(eq(blogPosts.id, req.params.id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ message: "Blog yazısı bulunamadı" });
      }

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating blog post:", error);
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ message: "Bu slug zaten kullanımda" });
      }
      res.status(500).json({ message: "Blog yazısı güncellenemedi" });
    }
  });

  // Delete blog post (admin only)
  app.delete("/api/admin/blog/:id", isAuthenticated, adminMiddleware, async (req: Request, res: Response) => {
    try {
      const [deleted] = await db
        .delete(blogPosts)
        .where(eq(blogPosts.id, req.params.id))
        .returning();
      
      if (!deleted) {
        return res.status(404).json({ message: "Blog yazısı bulunamadı" });
      }

      res.json({ message: "Blog yazısı başarıyla silindi" });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: "Blog yazısı silinemedi" });
    }
  });

  // ============ Stores (Mağazalar) Routes ============
  
  // Get all stores (public)
  app.get("/api/stores", async (req: Request, res: Response) => {
    try {
      const { type, city, search, limit = "20", offset = "0" } = req.query;
      
      let query = db
        .select({
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
          createdAt: stores.createdAt,
        })
        .from(stores)
        .where(eq(stores.status, "active"))
        .$dynamic();
      
      if (type) {
        query = query.where(eq(stores.storeType, type as any));
      }
      
      if (city) {
        query = query.where(eq(stores.city, city as string));
      }
      
      if (search) {
        query = query.where(
          sql`${stores.displayName} ILIKE ${`%${search}%`} OR ${stores.summary} ILIKE ${`%${search}%`}`
        );
      }
      
      const storesList = await query
        .orderBy(desc(stores.rating), desc(stores.reviewCount))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));
      
      res.json(storesList);
    } catch (error) {
      console.error("Error fetching stores:", error);
      res.status(500).json({ message: "Mağazalar getirilemedi" });
    }
  });

  // Get single store by slug (public)
  app.get("/api/store/:slug", async (req: Request, res: Response) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq(stores.slug, req.params.slug),
        with: {
          owner: {
            columns: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profileImageUrl: true,
            },
          },
        },
      });
      
      if (!store) {
        return res.status(404).json({ message: "Mağaza bulunamadı" });
      }
      
      // Get store listings
      const storeListings = await db
        .select()
        .from(listings)
        .where(and(
          eq(listings.storeId, store.id),
          eq(listings.status, "active")
        ))
        .orderBy(desc(listings.createdAt))
        .limit(20);
      
      // Get store reviews (approved only)
      const storeReviewsList = await db
        .select({
          id: storeReviews.id,
          rating: storeReviews.rating,
          title: storeReviews.title,
          comment: storeReviews.comment,
          createdAt: storeReviews.createdAt,
          reviewerId: users.id,
          reviewerFirstName: users.firstName,
          reviewerLastName: users.lastName,
          reviewerProfileImage: users.profileImageUrl,
        })
        .from(storeReviews)
        .leftJoin(users, eq(storeReviews.reviewerId, users.id))
        .where(and(
          eq(storeReviews.storeId, store.id),
          eq(storeReviews.status, "approved")
        ))
        .orderBy(desc(storeReviews.createdAt))
        .limit(10);
      
      res.json({
        ...store,
        listings: storeListings,
        reviews: storeReviewsList,
      });
    } catch (error) {
      console.error("Error fetching store:", error);
      res.status(500).json({ message: "Mağaza bilgileri getirilemedi" });
    }
  });

  // Create new store (authenticated sellers only)
  app.post("/api/store", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check if user already has a store
      const existingStore = await db.query.stores.findFirst({
        where: eq(stores.ownerId, getUserId(req.user)),
      });
      
      if (existingStore) {
        return res.status(400).json({ message: "Zaten bir mağazanız var" });
      }
      
      const validationResult = insertStoreSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Geçersiz mağaza verisi",
          errors: validationResult.error.errors,
        });
      }
      
      const [newStore] = await db
        .insert(stores)
        .values({
          ...validationResult.data,
          ownerId: getUserId(req.user),
        } as any)
        .returning();
      
      res.status(201).json(newStore);
    } catch (error: any) {
      console.error("Error creating store:", error);
      if (error.code === '23505') {
        return res.status(400).json({ message: "Bu slug zaten kullanımda" });
      }
      res.status(500).json({ message: "Mağaza oluşturulamadı" });
    }
  });

  // Update store (owner only)
  app.patch("/api/store/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq(stores.id, req.params.id),
      });
      
      if (!store) {
        return res.status(404).json({ message: "Mağaza bulunamadı" });
      }
      
      if (store.ownerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Bu mağazayı düzenleyemezsiniz" });
      }
      
      const validationResult = insertStoreSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Geçersiz mağaza verisi",
          errors: validationResult.error.errors,
        });
      }
      
      const [updated] = await db
        .update(stores)
        .set({
          ...validationResult.data as any,
          updatedAt: new Date(),
        })
        .where(eq(stores.id, req.params.id))
        .returning();
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating store:", error);
      if (error.code === '23505') {
        return res.status(400).json({ message: "Bu slug zaten kullanımda" });
      }
      res.status(500).json({ message: "Mağaza güncellenemedi" });
    }
  });

  // Delete store (owner only)
  app.delete("/api/store/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq(stores.id, req.params.id),
      });
      
      if (!store) {
        return res.status(404).json({ message: "Mağaza bulunamadı" });
      }
      
      if (store.ownerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Bu mağazayı silemezsiniz" });
      }
      
      // Delete store images from Object Storage
      const objectStorage = new ObjectStorageService();
      
      if (store.logo) {
        try {
          await objectStorage.deleteFile(store.logo);
        } catch (e) {
          console.warn("Failed to delete store logo:", e);
        }
      }
      
      if (store.banner) {
        try {
          await objectStorage.deleteFile(store.banner);
        } catch (e) {
          console.warn("Failed to delete store banner:", e);
        }
      }
      
      // Delete store media
      const storeMediaList = await db.query.storeMedia.findMany({
        where: eq(storeMedia.storeId, store.id),
      });
      
      for (const media of storeMediaList) {
        try {
          await objectStorage.deleteFile(media.url);
        } catch (e) {
          console.warn("Failed to delete store media:", e);
        }
      }
      
      // Delete store media records
      await db.delete(storeMedia).where(eq(storeMedia.storeId, store.id));
      
      // Delete store followers
      await db.delete(storeFollowers).where(eq(storeFollowers.storeId, store.id));
      
      // Delete store reviews
      await db.delete(storeReviews).where(eq(storeReviews.storeId, store.id));
      
      // Unlink listings from store (don't delete them)
      await db
        .update(listings)
        .set({ storeId: null })
        .where(eq(listings.storeId, store.id));
      
      // Finally delete the store
      await db.delete(stores).where(eq(stores.id, store.id));
      
      res.json({ message: "Mağaza başarıyla silindi" });
    } catch (error) {
      console.error("Error deleting store:", error);
      res.status(500).json({ message: "Mağaza silinemedi" });
    }
  });

  // Get my store (owner dashboard)
  app.get("/api/store/my/dashboard", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const myStore = await db.query.stores.findFirst({
        where: eq(stores.ownerId, getUserId(req.user)),
      });
      
      if (!myStore) {
        return res.status(404).json({ message: "Mağazanız henüz yok" });
      }
      
      // Get store stats
      const storeListingsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(listings)
        .where(eq(listings.storeId, myStore.id));
      
      res.json({
        ...myStore,
        stats: {
          totalListings: storeListingsCount[0]?.count || 0,
        },
      });
    } catch (error) {
      console.error("Error fetching my store:", error);
      res.status(500).json({ message: "Mağaza bilgileri getirilemedi" });
    }
  });

  // Create store review (authenticated buyers only)
  app.post("/api/store/:id/review", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq(stores.id, req.params.id),
      });
      
      if (!store) {
        return res.status(404).json({ message: "Mağaza bulunamadı" });
      }
      
      // Can't review own store
      if (store.ownerId === getUserId(req.user)) {
        return res.status(400).json({ message: "Kendi mağazanızı değerlendiremezsiniz" });
      }
      
      // Check if already reviewed
      const existingReview = await db.query.storeReviews.findFirst({
        where: and(
          eq(storeReviews.storeId, req.params.id),
          eq(storeReviews.reviewerId, getUserId(req.user))
        ),
      });
      
      if (existingReview) {
        return res.status(400).json({ message: "Bu mağazayı zaten değerlendirdiniz" });
      }
      
      const validationResult = insertStoreReviewSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Geçersiz değerlendirme verisi",
          errors: validationResult.error.errors,
        });
      }
      
      const [newReview] = await db
        .insert(storeReviews)
        .values({
          ...validationResult.data,
          storeId: req.params.id,
          reviewerId: getUserId(req.user),
        } as any)
        .returning();
      
      // Update store rating (calculate average)
      const allReviews = await db
        .select({ rating: storeReviews.rating })
        .from(storeReviews)
        .where(and(
          eq(storeReviews.storeId, req.params.id),
          eq(storeReviews.status, "approved")
        ));
      
      const avgRating = allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;
      
      await db
        .update(stores)
        .set({
          rating: avgRating.toFixed(2),
          reviewCount: allReviews.length,
        })
        .where(eq(stores.id, req.params.id));
      
      res.status(201).json(newReview);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Değerlendirme oluşturulamadı" });
    }
  });

  // Get store reviews
  app.get("/api/store/:id/reviews", async (req: Request, res: Response) => {
    try {
      const reviewsList = await db
        .select({
          id: storeReviews.id,
          rating: storeReviews.rating,
          title: storeReviews.title,
          comment: storeReviews.comment,
          createdAt: storeReviews.createdAt,
          reviewerId: users.id,
          reviewerFirstName: users.firstName,
          reviewerLastName: users.lastName,
          reviewerProfileImage: users.profileImageUrl,
        })
        .from(storeReviews)
        .leftJoin(users, eq(storeReviews.reviewerId, users.id))
        .where(and(
          eq(storeReviews.storeId, req.params.id),
          eq(storeReviews.status, "approved")
        ))
        .orderBy(desc(storeReviews.createdAt));
      
      res.json(reviewsList);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Değerlendirmeler getirilemedi" });
    }
  });

  // Upload store media (logo/banner) - Owner only
  app.post("/api/store/:id/media", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq(stores.id, req.params.id),
      });
      
      if (!store) {
        return res.status(404).json({ message: "Mağaza bulunamadı" });
      }
      
      if (store.ownerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Bu mağazaya medya yükleyemezsiniz" });
      }

      const { mediaType, url } = req.body;
      
      if (!mediaType || !url) {
        return res.status(400).json({ message: "mediaType ve url gerekli" });
      }

      // Store media in database
      const [media] = await db
        .insert(storeMedia)
        .values({
          storeId: req.params.id,
          type: mediaType,
          url,
        })
        .returning();

      // Update store logo/banner reference
      if (mediaType === "logo") {
        await db
          .update(stores)
          .set({ logo: url })
          .where(eq(stores.id, req.params.id));
      } else if (mediaType === "banner") {
        await db
          .update(stores)
          .set({ banner: url })
          .where(eq(stores.id, req.params.id));
      }

      res.status(201).json(media);
    } catch (error) {
      console.error("Error uploading store media:", error);
      res.status(500).json({ message: "Medya yüklenemedi" });
    }
  });

  // Professional store image upload with Sharp processing
  app.post("/api/store/:id/upload-image", isAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
    try {
      const store = await db.query.stores.findFirst({
        where: eq(stores.id, req.params.id),
      });
      
      if (!store) {
        return res.status(404).json({ message: "Mağaza bulunamadı" });
      }
      
      if (store.ownerId !== getUserId(req.user) && (req.user as any).role !== "admin") {
        return res.status(403).json({ message: "Bu mağazaya medya yükleyemezsiniz" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Dosya gerekli" });
      }

      const imageType = req.body.type as 'logo' | 'banner';
      if (!imageType || !['logo', 'banner'].includes(imageType)) {
        return res.status(400).json({ message: "Geçerli bir tür (logo/banner) gerekli" });
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
        storeId: store.id,
      });

      // Store media in database
      const [media] = await db
        .insert(storeMedia)
        .values({
          storeId: store.id,
          type: imageType,
          url: result.originalUrl,
        })
        .returning();

      // Update store logo/banner reference
      if (imageType === "logo") {
        await db
          .update(stores)
          .set({ logo: result.originalUrl })
          .where(eq(stores.id, store.id));
      } else if (imageType === "banner") {
        await db
          .update(stores)
          .set({ banner: result.originalUrl })
          .where(eq(stores.id, store.id));
      }

      console.log(`Store ${imageType} uploaded successfully:`, result.originalUrl);

      res.status(201).json({
        media,
        variants: {
          original: result.originalUrl,
          medium: result.mediumUrl,
          thumbnail: result.thumbnailUrl,
        },
        width: result.width,
        height: result.height,
        fileSize: result.fileSize,
      });
    } catch (error) {
      console.error("Error uploading store image:", error);
      res.status(500).json({ message: "Görsel yüklenemedi" });
    }
  });

  // Follow a store
  app.post("/api/store/:id/follow", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const storeId = req.params.id;
      const userId = getUserId(req.user);
      
      const store = await db.query.stores.findFirst({
        where: eq(stores.id, storeId),
      });
      
      if (!store) {
        return res.status(404).json({ message: "Mağaza bulunamadı" });
      }
      
      // Can't follow own store
      if (store.ownerId === userId) {
        return res.status(400).json({ message: "Kendi mağazanızı takip edemezsiniz" });
      }
      
      // Check if already following
      const existingFollow = await db.query.storeFollowers.findFirst({
        where: and(
          eq(storeFollowers.storeId, storeId),
          eq(storeFollowers.userId, userId)
        ),
      });
      
      if (existingFollow) {
        return res.status(400).json({ message: "Bu mağazayı zaten takip ediyorsunuz" });
      }
      
      // Add follow
      await db.insert(storeFollowers).values({
        storeId,
        userId,
      });
      
      // Update follower count
      await db
        .update(stores)
        .set({ followerCount: sql`COALESCE(follower_count, 0) + 1` })
        .where(eq(stores.id, storeId));
      
      res.status(201).json({ message: "Mağaza takip edildi", following: true });
    } catch (error) {
      console.error("Error following store:", error);
      res.status(500).json({ message: "Mağaza takip edilemedi" });
    }
  });
  
  // Unfollow a store
  app.delete("/api/store/:id/follow", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const storeId = req.params.id;
      const userId = getUserId(req.user);
      
      const result = await db
        .delete(storeFollowers)
        .where(and(
          eq(storeFollowers.storeId, storeId),
          eq(storeFollowers.userId, userId)
        ))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ message: "Bu mağazayı takip etmiyorsunuz" });
      }
      
      // Update follower count
      await db
        .update(stores)
        .set({ followerCount: sql`GREATEST(COALESCE(follower_count, 0) - 1, 0)` })
        .where(eq(stores.id, storeId));
      
      res.json({ message: "Takipten çıkıldı", following: false });
    } catch (error) {
      console.error("Error unfollowing store:", error);
      res.status(500).json({ message: "Takipten çıkılamadı" });
    }
  });
  
  // Get user's followed stores
  app.get("/api/my/followed-stores", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req.user);
      
      const followedStores = await db
        .select({
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
          followedAt: storeFollowers.createdAt,
        })
        .from(storeFollowers)
        .innerJoin(stores, eq(storeFollowers.storeId, stores.id))
        .where(eq(storeFollowers.userId, userId))
        .orderBy(desc(storeFollowers.createdAt));
      
      res.json(followedStores);
    } catch (error) {
      console.error("Error fetching followed stores:", error);
      res.status(500).json({ message: "Takip edilen mağazalar getirilemedi" });
    }
  });
  
  // Check if user is following a store
  app.get("/api/store/:id/is-following", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const storeId = req.params.id;
      const userId = getUserId(req.user);
      
      const follow = await db.query.storeFollowers.findFirst({
        where: and(
          eq(storeFollowers.storeId, storeId),
          eq(storeFollowers.userId, userId)
        ),
      });
      
      res.json({ following: !!follow });
    } catch (error) {
      console.error("Error checking follow status:", error);
      res.status(500).json({ message: "Takip durumu kontrol edilemedi" });
    }
  });
  
  // Increment store view count
  app.post("/api/store/:id/view", async (req: Request, res: Response) => {
    try {
      const storeId = req.params.id;
      
      await db
        .update(stores)
        .set({ viewCount: sql`COALESCE(view_count, 0) + 1` })
        .where(eq(stores.id, storeId));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error incrementing view count:", error);
      res.status(500).json({ message: "Görüntülenme kaydedilemedi" });
    }
  });

  // Get hierarchical store categories (tree structure)
  app.get("/api/store-categories", async (req: Request, res: Response) => {
    try {
      const allCategories = await db
        .select()
        .from(storeCategories)
        .orderBy(storeCategories.order);
      
      // Build tree: root categories + their children
      const rootCategories = allCategories.filter(c => c.depth === 0);
      const tree = rootCategories.map(root => ({
        ...root,
        children: allCategories.filter(c => c.parentId === root.id),
      }));
      
      res.json(tree);
    } catch (error) {
      console.error("Error fetching store categories:", error);
      res.status(500).json({ message: "Kategoriler getirilemedi" });
    }
  });

  // Get stores by category
  app.get("/api/store-categories/:id/stores", async (req: Request, res: Response) => {
    try {
      const categoryId = req.params.id;
      
      const storesList = await db
        .select({
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
          createdAt: stores.createdAt,
        })
        .from(stores)
        .where(and(
          eq(stores.categoryId, categoryId),
          eq(stores.status, "active")
        ))
        .orderBy(desc(stores.rating), desc(stores.reviewCount));
      
      res.json(storesList);
    } catch (error) {
      console.error("Error fetching stores by category:", error);
      res.status(500).json({ message: "Mağazalar getirilemedi" });
    }
  });

  return httpServer;
}

