/**
 * @file cache.ts
 * @purpose In-memory caching layer for quantum chess game state management
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.6
 */

import type {
  SerializedGameState,
  GameStateCacheEntry,
} from '../../types/game.types';
import { GameStateError, GAME_STATE_CONFIG } from '../../types/game.types';

export interface CacheStats {
  size: number;
  maxSize: number;
  hitCount: number;
  missCount: number;
  evictionCount: number;
  hitRate: number;
}

/**
 * LRU Cache for game states
 */
export class GameStateCache {
  private cache = new Map<string, GameStateCacheEntry>();
  private accessOrder = new Map<string, number>();
  private stats = {
    hitCount: 0,
    missCount: 0,
    evictionCount: 0,
  };
  private accessCounter = 0;

  constructor(
    private maxSize: number = GAME_STATE_CONFIG.MAX_CACHE_SIZE,
    private defaultTTL: number = GAME_STATE_CONFIG.DEFAULT_TTL
  ) {}

  /**
   * Get game state from cache
   */
  get(gameId: string): SerializedGameState | null {
    const entry = this.cache.get(gameId);
    
    if (!entry) {
      this.stats.missCount++;
      return null;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.cache.delete(gameId);
      this.accessOrder.delete(gameId);
      this.stats.missCount++;
      return null;
    }

    // Update access statistics
    entry.lastAccessed = new Date();
    entry.accessCount++;
    this.accessOrder.set(gameId, ++this.accessCounter);
    this.stats.hitCount++;

    return entry.data;
  }

  /**
   * Set game state in cache
   */
  set(gameId: string, gameState: SerializedGameState, ttl?: number): void {
    try {
      // Check if we need to evict items
      if (this.cache.size >= this.maxSize && !this.cache.has(gameId)) {
        this.evictLRU();
      }

      const entry: GameStateCacheEntry = {
        data: gameState,
        lastAccessed: new Date(),
        accessCount: 1,
        ttl: ttl || this.defaultTTL,
      };

      this.cache.set(gameId, entry);
      this.accessOrder.set(gameId, ++this.accessCounter);

    } catch (error) {
      throw new GameStateError(
        `Failed to cache game state: ${gameId}`,
        gameId,
        'cache-set',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Check if game exists in cache
   */
  has(gameId: string): boolean {
    const entry = this.cache.get(gameId);
    
    if (!entry) {
      return false;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.cache.delete(gameId);
      this.accessOrder.delete(gameId);
      return false;
    }

    return true;
  }

  /**
   * Delete game from cache
   */
  delete(gameId: string): boolean {
    const deleted = this.cache.delete(gameId);
    this.accessOrder.delete(gameId);
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.stats = {
      hitCount: 0,
      missCount: 0,
      evictionCount: 0,
    };
    this.accessCounter = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hitCount + this.stats.missCount;
    const hitRate = totalRequests > 0 ? this.stats.hitCount / totalRequests : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.stats.hitCount,
      missCount: this.stats.missCount,
      evictionCount: this.stats.evictionCount,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Get all cached game IDs
   */
  keys(): string[] {
    // Clean expired entries first
    this.cleanupExpired();
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    this.cleanupExpired();
    return this.cache.size;
  }

  /**
   * Update TTL for specific game
   */
  updateTTL(gameId: string, newTTL: number): boolean {
    const entry = this.cache.get(gameId);
    
    if (!entry) {
      return false;
    }

    entry.ttl = newTTL;
    return true;
  }

  /**
   * Get remaining TTL for game
   */
  getRemainingTTL(gameId: string): number | null {
    const entry = this.cache.get(gameId);
    
    if (!entry) {
      return null;
    }

    const elapsed = Date.now() - entry.lastAccessed.getTime();
    const remaining = entry.ttl - elapsed;
    
    return Math.max(0, remaining);
  }

  /**
   * Prune expired entries
   */
  cleanupExpired(): number {
    let cleanedCount = 0;
    
    for (const [gameId, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(gameId);
        this.accessOrder.delete(gameId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Get cache entry details (for debugging)
   */
  getEntry(gameId: string): GameStateCacheEntry | null {
    const entry = this.cache.get(gameId);
    
    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(gameId);
      this.accessOrder.delete(gameId);
      return null;
    }

    return entry;
  }

  /**
   * Warm up cache with frequently accessed games
   */
  warmUp(gameStates: { gameId: string; gameState: SerializedGameState }[]): void {
    for (const { gameId, gameState } of gameStates) {
      this.set(gameId, gameState);
    }
  }

  /**
   * Export cache data (for persistence or debugging)
   */
  export(): Array<{ gameId: string; entry: GameStateCacheEntry }> {
    this.cleanupExpired();
    
    return Array.from(this.cache.entries()).map(([gameId, entry]) => ({
      gameId,
      entry: {
        ...entry,
        // Deep clone to prevent mutations
        data: JSON.parse(JSON.stringify(entry.data)),
      },
    }));
  }

  /**
   * Import cache data
   */
  import(data: Array<{ gameId: string; entry: GameStateCacheEntry }>): void {
    this.clear();
    
    for (const { gameId, entry } of data) {
      // Restore dates from serialized format
      const restoredEntry: GameStateCacheEntry = {
        ...entry,
        lastAccessed: new Date(entry.lastAccessed),
        data: {
          ...entry.data,
          metadata: {
            ...entry.data.metadata,
            createdAt: new Date(entry.data.metadata.createdAt),
            updatedAt: new Date(entry.data.metadata.updatedAt),
          },
          gameState: {
            ...entry.data.gameState,
            createdAt: new Date(entry.data.gameState.createdAt),
            updatedAt: new Date(entry.data.gameState.updatedAt),
          },
        },
      };

      this.cache.set(gameId, restoredEntry);
      this.accessOrder.set(gameId, ++this.accessCounter);
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: GameStateCacheEntry): boolean {
    const elapsed = Date.now() - entry.lastAccessed.getTime();
    return elapsed > entry.ttl;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.size === 0) {
      return;
    }

    // Find the entry with the smallest access counter value (LRU)
    let lruGameId = '';
    let lruAccessCount = Infinity;

    for (const [gameId, accessCount] of this.accessOrder.entries()) {
      if (accessCount < lruAccessCount) {
        lruAccessCount = accessCount;
        lruGameId = gameId;
      }
    }

    if (lruGameId) {
      this.cache.delete(lruGameId);
      this.accessOrder.delete(lruGameId);
      this.stats.evictionCount++;
    }
  }
}

// Singleton cache instance
let cacheInstance: GameStateCache | null = null;

/**
 * Get the global game state cache instance
 */
export function getGameStateCache(): GameStateCache {
  if (!cacheInstance) {
    cacheInstance = new GameStateCache();
  }
  return cacheInstance;
}

/**
 * Create a new cache instance (for testing)
 */
export function createGameStateCache(maxSize?: number, defaultTTL?: number): GameStateCache {
  return new GameStateCache(maxSize, defaultTTL);
}

/**
 * Reset the global cache instance
 */
export function resetGameStateCache(): void {
  cacheInstance = null;
}

/**
 * Cache middleware function
 */
export function withCache<T extends (...args: any[]) => Promise<SerializedGameState | null>>(
  fn: T,
  cache = getGameStateCache()
): T {
  return (async (...args: any[]) => {
    const gameId = args[0] as string;
    
    // Try cache first
    const cached = cache.get(gameId);
    if (cached) {
      return cached;
    }

    // Call original function
    const result = await fn(...args);
    
    // Cache the result if not null
    if (result) {
      cache.set(gameId, result);
    }

    return result;
  }) as T;
}

/**
 * Cache invalidation helper
 */
export function invalidateCache(gameId: string, cache = getGameStateCache()): void {
  cache.delete(gameId);
}

/**
 * Cache warming helper
 */
export async function warmCache(
  gameIds: string[],
  loadFunction: (gameId: string) => Promise<SerializedGameState | null>,
  cache = getGameStateCache()
): Promise<void> {
  const warmPromises = gameIds.map(async (gameId) => {
    if (!cache.has(gameId)) {
      const gameState = await loadFunction(gameId);
      if (gameState) {
        cache.set(gameId, gameState);
      }
    }
  });

  await Promise.all(warmPromises);
}

/**
 * Periodic cleanup function
 */
export function startPeriodicCleanup(
  intervalMs = 60000, // 1 minute
  cache = getGameStateCache()
): () => void {
  const interval = setInterval(() => {
    const cleanedCount = cache.cleanupExpired();
    if (cleanedCount > 0) {
      console.log(`[T1.6] Cache cleanup: removed ${cleanedCount} expired entries`);
    }
  }, intervalMs);

  return () => clearInterval(interval);
}