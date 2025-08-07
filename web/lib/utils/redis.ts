/**
 * @file redis.ts
 * @purpose Vercel KV (Redis) connection utility with error handling
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.6
 */

import { kv } from '@vercel/kv';
import { GameStateError } from '../../types/game.types';

export interface RedisOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class RedisClient {
  private static instance: RedisClient;

  private constructor() {}

  static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  /**
   * Test Redis connection
   */
  async ping(): Promise<RedisOperationResult<string>> {
    try {
      const result = await kv.ping();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('[T1.6] Redis ping failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Redis error',
      };
    }
  }

  /**
   * Set a key-value pair with optional TTL
   */
  async set(
    key: string,
    value: any,
    ttlSeconds?: number
  ): Promise<RedisOperationResult<string>> {
    try {
      let result: any;
      
      if (ttlSeconds) {
        result = await kv.set(key, value, { ex: ttlSeconds });
      } else {
        result = await kv.set(key, value);
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`[T1.6] Redis set failed for key ${key}:`, error);
      throw new GameStateError(
        `Failed to set Redis key: ${key}`,
        undefined,
        'redis-set',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get a value by key
   */
  async get<T = any>(key: string): Promise<RedisOperationResult<T>> {
    try {
      const result = await kv.get<T>(key);
      return {
        success: true,
        data: result || undefined,
      };
    } catch (error) {
      console.error(`[T1.6] Redis get failed for key ${key}:`, error);
      throw new GameStateError(
        `Failed to get Redis key: ${key}`,
        undefined,
        'redis-get',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<RedisOperationResult<number>> {
    try {
      const result = await kv.del(key);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`[T1.6] Redis delete failed for key ${key}:`, error);
      throw new GameStateError(
        `Failed to delete Redis key: ${key}`,
        undefined,
        'redis-delete',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<RedisOperationResult<boolean>> {
    try {
      const result = await kv.exists(key);
      return {
        success: true,
        data: result > 0,
      };
    } catch (error) {
      console.error(`[T1.6] Redis exists check failed for key ${key}:`, error);
      throw new GameStateError(
        `Failed to check Redis key existence: ${key}`,
        undefined,
        'redis-exists',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Set expiration on key
   */
  async expire(key: string, seconds: number): Promise<RedisOperationResult<number>> {
    try {
      const result = await kv.expire(key, seconds);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`[T1.6] Redis expire failed for key ${key}:`, error);
      throw new GameStateError(
        `Failed to set expiration on Redis key: ${key}`,
        undefined,
        'redis-expire',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get TTL of key
   */
  async ttl(key: string): Promise<RedisOperationResult<number>> {
    try {
      const result = await kv.ttl(key);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`[T1.6] Redis TTL check failed for key ${key}:`, error);
      throw new GameStateError(
        `Failed to get TTL for Redis key: ${key}`,
        undefined,
        'redis-ttl',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get keys matching pattern
   */
  async keys(pattern: string): Promise<RedisOperationResult<string[]>> {
    try {
      const result = await kv.keys(pattern);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`[T1.6] Redis keys search failed for pattern ${pattern}:`, error);
      throw new GameStateError(
        `Failed to search Redis keys with pattern: ${pattern}`,
        undefined,
        'redis-keys',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string): Promise<RedisOperationResult<number>> {
    try {
      const result = await kv.incr(key);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`[T1.6] Redis incr failed for key ${key}:`, error);
      throw new GameStateError(
        `Failed to increment Redis key: ${key}`,
        undefined,
        'redis-incr',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get multiple keys
   */
  async mget<T = any>(keys: string[]): Promise<RedisOperationResult<(T | null)[]>> {
    try {
      const result = await kv.mget<T>(...keys);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`[T1.6] Redis mget failed for keys ${keys.join(', ')}:`, error);
      throw new GameStateError(
        `Failed to get multiple Redis keys: ${keys.join(', ')}`,
        undefined,
        'redis-mget',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Scan keys with pattern and optional count
   */
  async scan(cursor = 0, pattern?: string, count = 10): Promise<RedisOperationResult<{
    cursor: number;
    keys: string[];
  }>> {
    try {
      const options: any = { count };
      if (pattern) {
        options.match = pattern;
      }

      const result = await kv.scan(cursor, options);
      return {
        success: true,
        data: {
          cursor: result[0],
          keys: result[1],
        },
      };
    } catch (error) {
      console.error(`[T1.6] Redis scan failed:`, error);
      throw new GameStateError(
        'Failed to scan Redis keys',
        undefined,
        'redis-scan',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Add member to set
   */
  async sadd(key: string, ...members: string[]): Promise<RedisOperationResult<number>> {
    try {
      const result = await kv.sadd(key, ...members);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`[T1.6] Redis sadd failed for key ${key}:`, error);
      throw new GameStateError(
        `Failed to add to Redis set: ${key}`,
        undefined,
        'redis-sadd',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Remove member from set
   */
  async srem(key: string, ...members: string[]): Promise<RedisOperationResult<number>> {
    try {
      const result = await kv.srem(key, ...members);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`[T1.6] Redis srem failed for key ${key}:`, error);
      throw new GameStateError(
        `Failed to remove from Redis set: ${key}`,
        undefined,
        'redis-srem',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get all members of set
   */
  async smembers(key: string): Promise<RedisOperationResult<string[]>> {
    try {
      const result = await kv.smembers(key);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`[T1.6] Redis smembers failed for key ${key}:`, error);
      throw new GameStateError(
        `Failed to get Redis set members: ${key}`,
        undefined,
        'redis-smembers',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

// Utility functions for common Redis operations
export const redis = RedisClient.getInstance();

/**
 * Generate Redis key for game state
 */
export function gameStateKey(gameId: string): string {
  return `game:state:${gameId}`;
}

/**
 * Generate Redis key for game metadata
 */
export function gameMetadataKey(gameId: string): string {
  return `game:meta:${gameId}`;
}

/**
 * Generate Redis key for game history
 */
export function gameHistoryKey(gameId: string): string {
  return `game:history:${gameId}`;
}

/**
 * Generate Redis key for game index (for queries)
 */
export function gameIndexKey(): string {
  return 'game:index';
}

/**
 * Generate Redis key pattern for game cleanup
 */
export function gameCleanupPattern(): string {
  return 'game:*';
}

/**
 * Test Redis connection and log result
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const result = await redis.ping();
    if (result.success) {
      console.log('[T1.6] Redis connection successful');
      return true;
    } else {
      console.error('[T1.6] Redis connection failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('[T1.6] Redis connection test failed:', error);
    return false;
  }
}

/**
 * Calculate TTL in seconds from milliseconds
 */
export function msToSeconds(ms: number): number {
  return Math.floor(ms / 1000);
}

/**
 * Calculate TTL from Date
 */
export function dateToTTL(date: Date): number {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  return Math.max(0, msToSeconds(diffMs));
}