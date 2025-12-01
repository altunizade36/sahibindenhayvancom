import { Redis } from '@upstash/redis';
import IORedis from 'ioredis';

// Redis clients for distributed caching and Pub/Sub
// REST API for caching, ioredis TCP for real-time Pub/Sub
let redisClient: Redis | null = null;
let pubClient: IORedis | null = null;
let subClient: IORedis | null = null;
let redisPubSubEnabled = false;

export function initializeRedis() {
  // Initialize REST API client for caching
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      redisClient = new Redis({ url, token });
      console.log('✅ Redis REST cache initialized');
    } catch (error) {
      console.error('❌ Redis REST initialization failed:', error);
    }
  } else {
    console.warn('⚠️  Redis REST not configured - using in-memory cache');
  }

  // Initialize ioredis TCP client for Pub/Sub
  // Note: Upstash Free tier uses REST API only. TCP Pub/Sub requires paid plan.
  // The REST token can be used for TCP on paid plans.
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const tcpPassword = process.env.UPSTASH_REDIS_PASSWORD || restToken; // Try dedicated password or REST token
  
  // Extract host from REST URL
  let host: string | undefined;
  if (restUrl) {
    try {
      const urlObj = new URL(restUrl);
      host = urlObj.hostname;
    } catch (e) {}
  }
  
  // Use TCP password if available
  if (host && tcpPassword) {
    console.log(`📡 Redis TCP attempting connection to: ${host}:6379`);
    
    const redisOptions = {
      host,
      port: 6379,
      password: tcpPassword,
      maxRetriesPerRequest: 1, // Fail fast
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 5000,
      tls: { rejectUnauthorized: false },
      retryStrategy: (times: number) => {
        if (times > 1) {
          console.log('⚠️  Redis TCP connection failed - using REST polling fallback');
          return null; // Stop retrying
        }
        return 1000;
      },
    };
    
    // Suppress ioredis unhandled error events
    const handleRedisError = (err: Error) => {
      // Silently handle connection errors - fallback is already in place
    };
    
    try {
      pubClient = new IORedis(redisOptions);
      subClient = new IORedis(redisOptions);
      
      pubClient.on('error', handleRedisError);
      subClient.on('error', handleRedisError);

      // Connect and setup Pub/Sub
      Promise.all([pubClient.connect(), subClient.connect()])
        .then(() => {
          redisPubSubEnabled = true;
          console.log('✅ Redis Pub/Sub initialized (ioredis TCP)');
          
          // Setup message handler for subscribed channels
          subClient!.on('message', (channel, message) => {
            try {
              const parsed = JSON.parse(message);
              const subscribers = localSubscribers.get(channel);
              if (subscribers) {
                Array.from(subscribers).forEach(callback => {
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
        })
        .catch((error) => {
          console.warn('⚠️  Redis Pub/Sub not available (using polling fallback):', error.message);
          pubClient = null;
          subClient = null;
        });
    } catch (error) {
      console.warn('⚠️  Redis TCP initialization failed - Pub/Sub disabled');
    }
  } else {
    console.warn('⚠️  UPSTASH_REDIS_URL not set - Pub/Sub using polling fallback');
  }

  return redisClient;
}

// Check if real Pub/Sub is available
export function isPubSubEnabled(): boolean {
  return redisPubSubEnabled && pubClient !== null && subClient !== null;
}

// Cache abstraction with fallback to in-memory
const memoryCache = new Map<string, { value: any; expires: number }>();

// In-memory rate limit counters (fallback when Redis unavailable)
const rateLimitCounters = new Map<string, { count: number; expires: number }>();

// Memory cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

function startMemoryCleanup() {
  if (cleanupTimer) return;
  
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    let cleanedCache = 0;
    let cleanedRateLimit = 0;
    
    // Clean expired cache entries
    Array.from(memoryCache.entries()).forEach(([key, entry]) => {
      if (entry.expires < now) {
        memoryCache.delete(key);
        cleanedCache++;
      }
    });
    
    // Clean expired rate limit counters
    Array.from(rateLimitCounters.entries()).forEach(([key, entry]) => {
      if (entry.expires < now) {
        rateLimitCounters.delete(key);
        cleanedRateLimit++;
      }
    });
    
    if (cleanedCache > 0 || cleanedRateLimit > 0) {
      console.log(`🧹 Memory cleanup: removed ${cleanedCache} cache, ${cleanedRateLimit} rate limit entries`);
    }
  }, CLEANUP_INTERVAL);
}

// Start cleanup on module load
startMemoryCleanup();

export const cache = {
  /**
   * Atomic increment with TTL - critical for rate limiting
   * Uses Redis INCR which is atomic across all instances
   */
  async incr(key: string, ttl: number): Promise<number> {
    try {
      if (redisClient) {
        // Atomic increment using Redis INCR
        const count = await redisClient.incr(key);
        // Set expiry only on first increment (when count = 1)
        if (count === 1) {
          await redisClient.expire(key, ttl);
        }
        return count;
      }
      
      // Fallback to in-memory (single-instance only)
      const now = Date.now();
      const existing = rateLimitCounters.get(key);
      
      if (!existing || existing.expires < now) {
        // New window
        rateLimitCounters.set(key, { count: 1, expires: now + ttl * 1000 });
        return 1;
      }
      
      // Increment existing
      existing.count++;
      return existing.count;
    } catch (error) {
      console.error(`Cache incr error (${key}):`, error);
      // Fail open - return 0 to allow request
      return 0;
    }
  },

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (redisClient) {
        const value = await redisClient.get<T>(key);
        return value;
      }
      
      // Fallback to in-memory cache
      const cached = memoryCache.get(key);
      if (!cached) return null;
      
      if (cached.expires < Date.now()) {
        memoryCache.delete(key);
        return null;
      }
      
      return cached.value as T;
    } catch (error) {
      console.error(`Cache get error (${key}):`, error);
      return null;
    }
  },

  /**
   * Set cached value with TTL (seconds)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (redisClient) {
        // Upstash REST API uses { ex: ttl } instead of setex()
        if (ttl) {
          await redisClient.set(key, value, { ex: ttl });
        } else {
          await redisClient.set(key, value);
        }
        return;
      }
      
      // Fallback to in-memory cache
      memoryCache.set(key, {
        value,
        expires: ttl ? Date.now() + ttl * 1000 : Infinity,
      });
    } catch (error) {
      // Silently fallback to in-memory cache on Redis permission errors
      if (error instanceof Error && error.message.includes('NOPERM')) {
        // Disable Redis client to avoid repeated permission errors
        redisClient = null;
      }
      
      // Fallback to in-memory cache
      memoryCache.set(key, {
        value,
        expires: ttl ? Date.now() + ttl * 1000 : Infinity,
      });
    }
  },

  /**
   * Delete cached value
   */
  async del(key: string): Promise<void> {
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
  async delPattern(pattern: string): Promise<void> {
    try {
      if (redisClient) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
        return;
      }
      
      // In-memory fallback: delete matching keys
      const keys = Array.from(memoryCache.keys());
      for (const key of keys) {
        if (key.includes(pattern.replace('*', ''))) {
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
  isAvailable(): boolean {
    return redisClient !== null;
  },

  /**
   * Get cache stats
   */
  async getStats() {
    try {
      if (redisClient) {
        return {
          type: 'redis',
          available: true,
          status: 'connected',
        };
      }
      
      return {
        type: 'memory',
        available: true,
        size: memoryCache.size,
        keys: Array.from(memoryCache.keys()).slice(0, 10), // First 10 keys
      };
    } catch (error) {
      return {
        type: redisClient ? 'redis' : 'memory',
        available: false,
        error: String(error),
      };
    }
  },
};

// Cache key builders
export const cacheKeys = {
  categories: () => 'categories:all',
  categoryTree: () => 'categories:tree',
  categoryStats: () => 'categories:stats',
  listing: (id: string) => `listing:${id}`,
  listings: (params: string) => `listings:${params}`,
  listingsHome: () => 'listings:home',
  hotListings: () => 'listings:hot',
  recentListings: () => 'listings:recent',
  blogPosts: () => 'blog:all',
  blogPost: (slug: string) => `blog:${slug}`,
  vetServices: (city?: string, district?: string) => 
    `vet-services:${city || 'all'}:${district || 'all'}`,
  transportServices: (fromCity?: string, toCity?: string) =>
    `transport-services:${fromCity || 'all'}:${toCity || 'all'}`,
  userListings: (userId: string) => `user:${userId}:listings`,
  userFavorites: (userId: string) => `user:${userId}:favorites`,
  adminStats: () => 'admin:stats',
  locations: () => 'locations:all',
};

// Cache TTL constants (in seconds)
export const cacheTTL = {
  categories: 3600 * 24, // 24 hours (rarely changes)
  categoryStats: 3600, // 1 hour
  listings: 300, // 5 minutes (frequently updated)
  listingsHome: 120, // 2 minutes (homepage listings)
  hotListings: 180, // 3 minutes (very dynamic)
  recentListings: 60, // 1 minute
  blogPosts: 3600, // 1 hour
  services: 600, // 10 minutes
  userContent: 60, // 1 minute (dynamic)
  adminStats: 60, // 1 minute (admin needs fresh data)
  locations: 3600 * 24, // 24 hours (rarely changes)
};

// ============ WebSocket Message Broadcasting ============
// Uses real Redis Pub/Sub when available (ioredis TCP)
// Falls back to list-based polling when only REST API available

type BroadcastCallback = (channel: string, message: any) => void;
const localSubscribers = new Map<string, Set<BroadcastCallback>>();
const subscribedChannels = new Set<string>();

export const messageBroker = {
  /**
   * Publish message to all subscribers (local + remote instances)
   * Uses real Redis Pub/Sub when available, falls back to list-based
   */
  async publish(channel: string, message: any): Promise<void> {
    try {
      const messageWithMeta = {
        ...message,
        _timestamp: Date.now(),
        _instanceId: process.env.REPL_ID || 'local',
      };

      // Use real Redis Pub/Sub if available (ioredis TCP)
      if (redisPubSubEnabled && pubClient) {
        // Redis Pub/Sub will deliver to all subscribers including this instance
        // via the 'message' event handler - no need to notify locally
        await pubClient.publish(channel, JSON.stringify(messageWithMeta));
        return; // Don't notify locally - Redis will handle it
      } 
      
      // Fallback to list-based polling (REST API)
      if (redisClient) {
        await redisClient.lpush(`ws:${channel}`, JSON.stringify(messageWithMeta));
        await redisClient.ltrim(`ws:${channel}`, 0, 99);
        await redisClient.expire(`ws:${channel}`, 5);
      }
      
      // Only notify local subscribers when NOT using real Pub/Sub
      // (Real Pub/Sub delivers via the 'message' event handler)
      const subscribers = localSubscribers.get(channel);
      if (subscribers) {
        Array.from(subscribers).forEach(callback => {
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
  subscribe(channel: string, callback: BroadcastCallback): () => void {
    // Add to local subscribers
    if (!localSubscribers.has(channel)) {
      localSubscribers.set(channel, new Set());
    }
    localSubscribers.get(channel)!.add(callback);

    // Subscribe to Redis channel if real Pub/Sub available and not already subscribed
    if (redisPubSubEnabled && subClient && !subscribedChannels.has(channel)) {
      subClient.subscribe(channel).then(() => {
        subscribedChannels.add(channel);
        console.log(`📡 Subscribed to Redis channel: ${channel}`);
      }).catch(err => {
        console.error(`Failed to subscribe to ${channel}:`, err);
      });
    }

    // Return unsubscribe function
    return () => {
      const subscribers = localSubscribers.get(channel);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          localSubscribers.delete(channel);
          
          // Unsubscribe from Redis if no more local subscribers
          if (redisPubSubEnabled && subClient && subscribedChannels.has(channel)) {
            subClient.unsubscribe(channel).then(() => {
              subscribedChannels.delete(channel);
              console.log(`📡 Unsubscribed from Redis channel: ${channel}`);
            }).catch(() => {});
          }
        }
      }
    };
  },

  /**
   * Poll Redis for messages (fallback for REST API only mode)
   */
  async pollMessages(channel: string, lastTimestamp: number): Promise<any[]> {
    // Skip polling if real Pub/Sub is active
    if (redisPubSubEnabled) return [];
    if (!redisClient) return [];
    
    try {
      const messages = await redisClient.lrange(`ws:${channel}`, 0, 49);
      return messages
        .map(m => typeof m === 'string' ? JSON.parse(m) : m)
        .filter((m: any) => m._timestamp > lastTimestamp && m._instanceId !== (process.env.REPL_ID || 'local'));
    } catch (error) {
      console.error(`Message poll error (${channel}):`, error);
      return [];
    }
  },

  /**
   * Check if real Pub/Sub is enabled
   */
  isRealPubSubEnabled(): boolean {
    return redisPubSubEnabled;
  },

  /**
   * Get subscriber count
   */
  getSubscriberCount(channel: string): number {
    return localSubscribers.get(channel)?.size || 0;
  },

  /**
   * Get subscribed channels count
   */
  getSubscribedChannelsCount(): number {
    return subscribedChannels.size;
  },
};

// WebSocket channel constants
export const wsChannels = {
  chat: (userId: string) => `chat:${userId}`,
  auction: (auctionId: string) => `auction:${auctionId}`,
  stream: (streamId: string) => `stream:${streamId}`,
  presence: () => 'presence:global',
  notifications: (userId: string) => `notifications:${userId}`,
};
