import { Redis } from '@upstash/redis';

// Redis client for distributed caching
// Free tier: 10,000 commands/day (https://upstash.com)
let redisClient: Redis | null = null;

export function initializeRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('⚠️  Redis not configured (UPSTASH_REDIS_REST_URL/TOKEN missing) - caching disabled');
    return null;
  }

  try {
    redisClient = new Redis({
      url,
      token,
    });
    console.log('✅ Redis cache initialized');
    return redisClient;
  } catch (error) {
    console.error('❌ Redis initialization failed:', error);
    return null;
  }
}

// Cache abstraction with fallback to in-memory
const memoryCache = new Map<string, { value: any; expires: number }>();

// In-memory rate limit counters (fallback when Redis unavailable)
const rateLimitCounters = new Map<string, { count: number; expires: number }>();

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
// For multi-instance deployments, uses Redis as message broker
// Falls back to in-memory for single-instance deployments

type BroadcastCallback = (channel: string, message: any) => void;
const localSubscribers = new Map<string, Set<BroadcastCallback>>();

export const messageBroker = {
  /**
   * Publish message to all subscribers (local + remote instances)
   */
  async publish(channel: string, message: any): Promise<void> {
    try {
      // Store in Redis for other instances to read (list-based pub/sub simulation)
      if (redisClient) {
        const messageWithTimestamp = {
          ...message,
          _timestamp: Date.now(),
          _instanceId: process.env.REPL_ID || 'local',
        };
        
        // Push to channel list with auto-expire (5 second TTL)
        await redisClient.lpush(`ws:${channel}`, JSON.stringify(messageWithTimestamp));
        await redisClient.ltrim(`ws:${channel}`, 0, 99); // Keep last 100 messages
        await redisClient.expire(`ws:${channel}`, 5); // Expire after 5 seconds
      }
      
      // Notify local subscribers immediately
      const subscribers = localSubscribers.get(channel);
      if (subscribers) {
        for (const callback of subscribers) {
          try {
            callback(channel, message);
          } catch (error) {
            console.error(`Subscriber callback error (${channel}):`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Message publish error (${channel}):`, error);
    }
  },

  /**
   * Subscribe to channel messages
   */
  subscribe(channel: string, callback: BroadcastCallback): () => void {
    if (!localSubscribers.has(channel)) {
      localSubscribers.set(channel, new Set());
    }
    localSubscribers.get(channel)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = localSubscribers.get(channel);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          localSubscribers.delete(channel);
        }
      }
    };
  },

  /**
   * Poll Redis for messages from other instances (for multi-instance sync)
   * Call this periodically in multi-instance deployments
   */
  async pollMessages(channel: string, lastTimestamp: number): Promise<any[]> {
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
   * Get subscriber count
   */
  getSubscriberCount(channel: string): number {
    return localSubscribers.get(channel)?.size || 0;
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
