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

export const cache = {
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
  listing: (id: string) => `listing:${id}`,
  listings: (params: string) => `listings:${params}`,
  hotListings: () => 'listings:hot',
  blogPosts: () => 'blog:all',
  blogPost: (slug: string) => `blog:${slug}`,
  vetServices: (city?: string, district?: string) => 
    `vet-services:${city || 'all'}:${district || 'all'}`,
  transportServices: (fromCity?: string, toCity?: string) =>
    `transport-services:${fromCity || 'all'}:${toCity || 'all'}`,
  userListings: (userId: string) => `user:${userId}:listings`,
  userFavorites: (userId: string) => `user:${userId}:favorites`,
};

// Cache TTL constants (in seconds)
export const cacheTTL = {
  categories: 3600 * 24, // 24 hours (rarely changes)
  listings: 300, // 5 minutes (frequently updated)
  hotListings: 180, // 3 minutes (very dynamic)
  blogPosts: 3600, // 1 hour
  services: 600, // 10 minutes
  userContent: 60, // 1 minute (dynamic)
};
