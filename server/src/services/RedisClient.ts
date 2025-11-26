import { createClient, RedisClientType } from 'redis';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * In-memory fallback storage when Redis is not available
 */
class InMemoryStore {
  private store: Map<string, { value: string; expiry?: number }> = new Map();
  private sortedSets: Map<string, Map<string, number>> = new Map();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    const expiry = options?.EX ? Date.now() + (options.EX * 1000) : undefined;
    this.store.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
    this.sortedSets.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async exists(key: string): Promise<number> {
    return this.store.has(key) || this.sortedSets.has(key) ? 1 : 0;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const item = this.store.get(key);
    if (item) {
      item.expiry = Date.now() + (seconds * 1000);
    }
  }

  // Sorted set operations for matchmaking
  async zAdd(key: string, scoreOrOptions: number | { score: number; value: string } | Array<{ score: number; value: string }>, member?: string): Promise<number> {
    if (!this.sortedSets.has(key)) {
      this.sortedSets.set(key, new Map());
    }
    const set = this.sortedSets.get(key)!;
    
    // Handle different call signatures
    if (typeof scoreOrOptions === 'number' && member) {
      // zAdd(key, score, member)
      const isNew = !set.has(member);
      set.set(member, scoreOrOptions);
      return isNew ? 1 : 0;
    } else if (typeof scoreOrOptions === 'object' && !Array.isArray(scoreOrOptions)) {
      // zAdd(key, { score, value })
      const { score, value } = scoreOrOptions;
      const isNew = !set.has(value);
      set.set(value, score);
      return isNew ? 1 : 0;
    } else if (Array.isArray(scoreOrOptions)) {
      // zAdd(key, [{ score, value }, ...])
      let added = 0;
      for (const item of scoreOrOptions) {
        const isNew = !set.has(item.value);
        set.set(item.value, item.score);
        if (isNew) added++;
      }
      return added;
    }
    return 0;
  }

  async setEx(key: string, seconds: number, value: string): Promise<void> {
    await this.set(key, value, { EX: seconds });
  }

  async zRem(key: string, member: string): Promise<number> {
    const set = this.sortedSets.get(key);
    if (!set) return 0;
    const existed = set.delete(member);
    return existed ? 1 : 0;
  }

  async zRange(key: string, start: number, stop: number): Promise<string[]> {
    const set = this.sortedSets.get(key);
    if (!set) return [];
    
    const sorted = Array.from(set.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([member]) => member);
    
    const end = stop === -1 ? sorted.length : stop + 1;
    return sorted.slice(start, end);
  }

  async zRangeWithScores(key: string, start: number, stop: number): Promise<Array<{ value: string; score: number }>> {
    const set = this.sortedSets.get(key);
    if (!set) return [];
    
    const sorted = Array.from(set.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([member, score]) => ({ value: member, score }));
    
    const end = stop === -1 ? sorted.length : stop + 1;
    return sorted.slice(start, end);
  }

  async zCard(key: string): Promise<number> {
    const set = this.sortedSets.get(key);
    return set ? set.size : 0;
  }

  async zScore(key: string, member: string): Promise<number | null> {
    const set = this.sortedSets.get(key);
    if (!set) return null;
    return set.get(member) ?? null;
  }
}

class RedisClientManager {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private inMemoryStore: InMemoryStore = new InMemoryStore();
  private useInMemory: boolean = false;

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    // Try to connect to Redis with timeout
    try {
      this.client = createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
          connectTimeout: 2000, // 2 second timeout
          reconnectStrategy: () => false, // Don't auto-reconnect
        },
        password: config.redis.password,
      });

      this.client.on('error', (err) => {
        // Suppress repeated connection errors
        if (!this.useInMemory) {
          this.useInMemory = true;
        }
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.useInMemory = false;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
        this.useInMemory = false;
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.isConnected = false;
      });

      // Race between connection and timeout
      await Promise.race([
        this.client.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 2000)
        )
      ]);
    } catch (error) {
      logger.warn('Redis not available, using in-memory storage fallback');
      this.useInMemory = true;
      this.client = null;
      this.isConnected = false;
      // Don't throw - gracefully fallback to in-memory
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  getClient(): RedisClientType | InMemoryStore {
    if (this.useInMemory || !this.client || !this.isConnected) {
      return this.inMemoryStore as any;
    }
    return this.client;
  }

  isReady(): boolean {
    return this.useInMemory || (this.isConnected && this.client !== null);
  }

  isUsingInMemory(): boolean {
    return this.useInMemory;
  }
}

export const redisClient = new RedisClientManager();
