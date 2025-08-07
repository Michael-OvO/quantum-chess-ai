/**
 * @file GameStateStore.ts
 * @purpose Main game state store implementation with Redis persistence and caching
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.6
 */

import type {
  GameState,
  SerializedGameState,
  GameStateStore as IGameStateStore,
  GameStateQuery,
  GameStateValidationResult,
  GameMetadata,
} from '../../types/game.types';
import { GAME_STATE_CONFIG } from '../../types/game.types';
import {
  GameStateError,
  GameStateNotFoundError,
  GameStateValidationError,
} from '../../types/game.types';
import {
  redis,
  gameStateKey,
  gameMetadataKey,
  gameHistoryKey,
  gameIndexKey,
  gameCleanupPattern,
  msToSeconds,
} from '../utils/redis';
import { 
  validateSerializedGameState,
  validateOrThrow,
  sanitizeGameState,
} from './validation';
import {
  getGameStateCache,
  GameStateCache,
  invalidateCache,
} from './cache';
import { QChessGame } from '../game-engine/QChessGame';

export class GameStateStore implements IGameStateStore {
  private cache: GameStateCache;
  private compressionEnabled: boolean = false;

  constructor(cache?: GameStateCache, enableCompression = false) {
    this.cache = cache || getGameStateCache();
    this.compressionEnabled = enableCompression;
  }

  /**
   * Save game state to Redis with caching
   */
  async save(gameState: SerializedGameState): Promise<void> {
    try {
      // Validate the game state
      validateOrThrow(gameState);

      const gameId = gameState.metadata.id;
      
      // Update timestamps
      gameState.metadata.updatedAt = new Date();
      gameState.gameState.updatedAt = new Date();
      gameState.metadata.version++;

      // Serialize for storage
      const serializedData = this.serialize(gameState);
      const ttlSeconds = msToSeconds(GAME_STATE_CONFIG.DEFAULT_TTL);

      // Save to Redis with TTL
      await redis.set(gameStateKey(gameId), serializedData, ttlSeconds);
      
      // Save metadata separately for quick queries
      const metadata = {
        id: gameState.metadata.id,
        status: gameState.gameState.status,
        currentPlayer: gameState.gameState.currentPlayer,
        moveCount: gameState.gameState.moveCount,
        createdAt: gameState.metadata.createdAt,
        updatedAt: gameState.metadata.updatedAt,
        whitePlayer: gameState.metadata.config.whitePlayer,
        blackPlayer: gameState.metadata.config.blackPlayer,
      };
      await redis.set(gameMetadataKey(gameId), JSON.stringify(metadata), ttlSeconds);

      // Add to game index for querying
      await redis.sadd(gameIndexKey(), gameId);

      // Cache the game state
      this.cache.set(gameId, gameState);

      console.log(`[T1.6] Game state saved: ${gameId} (version ${gameState.metadata.version})`);

    } catch (error) {
      const gameId = gameState?.metadata?.id || 'unknown';
      throw new GameStateError(
        `Failed to save game state: ${gameId}`,
        gameId,
        'save',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Load game state from cache or Redis
   */
  async load(gameId: string): Promise<SerializedGameState | null> {
    try {
      // Try cache first
      const cached = this.cache.get(gameId);
      if (cached) {
        console.log(`[T1.6] Game state loaded from cache: ${gameId}`);
        return cached;
      }

      // Load from Redis
      const redisResult = await redis.get(gameStateKey(gameId));
      
      if (!redisResult.data) {
        console.log(`[T1.6] Game state not found: ${gameId}`);
        return null;
      }

      // Deserialize
      const gameState = this.deserialize(redisResult.data);

      // Validate loaded data
      const validation = this.validate(gameState);
      if (!validation.valid) {
        console.warn(`[T1.6] Loaded game state has validation warnings: ${gameId}`, validation.warnings);
        
        // Try to sanitize if there are only warnings
        if (validation.errors.length === 0) {
          const sanitized = sanitizeGameState(gameState);
          this.cache.set(gameId, sanitized);
          console.log(`[T1.6] Game state loaded and sanitized: ${gameId}`);
          return sanitized;
        } else {
          throw new GameStateValidationError(
            'Loaded game state failed validation',
            validation.errors,
            gameId
          );
        }
      }

      // Cache the loaded state
      this.cache.set(gameId, gameState);
      
      console.log(`[T1.6] Game state loaded from Redis: ${gameId}`);
      return gameState;

    } catch (error) {
      if (error instanceof GameStateValidationError) {
        throw error;
      }
      
      throw new GameStateError(
        `Failed to load game state: ${gameId}`,
        gameId,
        'load',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Delete game state from Redis and cache
   */
  async delete(gameId: string): Promise<boolean> {
    try {
      // Remove from Redis
      const stateResult = await redis.delete(gameStateKey(gameId));
      const metaResult = await redis.delete(gameMetadataKey(gameId));
      const historyResult = await redis.delete(gameHistoryKey(gameId));
      
      // Remove from game index
      await redis.srem(gameIndexKey(), gameId);

      // Remove from cache
      invalidateCache(gameId, this.cache);

      const deleted = (stateResult.data || 0) + (metaResult.data || 0) + (historyResult.data || 0) > 0;
      
      if (deleted) {
        console.log(`[T1.6] Game state deleted: ${gameId}`);
      }
      
      return deleted;

    } catch (error) {
      throw new GameStateError(
        `Failed to delete game state: ${gameId}`,
        gameId,
        'delete',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Check if game exists in Redis or cache
   */
  async exists(gameId: string): Promise<boolean> {
    try {
      // Check cache first
      if (this.cache.has(gameId)) {
        return true;
      }

      // Check Redis
      const result = await redis.exists(gameStateKey(gameId));
      return result.data || false;

    } catch (error) {
      throw new GameStateError(
        `Failed to check game existence: ${gameId}`,
        gameId,
        'exists',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Query games based on criteria
   */
  async query(query: GameStateQuery): Promise<SerializedGameState[]> {
    try {
      const results: SerializedGameState[] = [];
      const limit = query.limit || 50;
      const offset = query.offset || 0;

      // Get all game IDs from index
      const gameIdsResult = await redis.smembers(gameIndexKey());
      let gameIds = gameIdsResult.data || [];

      // Filter by ID if specified
      if (query.id) {
        gameIds = gameIds.filter(id => id === query.id);
      }

      // Load metadata for filtering
      const metadataKeys = gameIds.map(id => gameMetadataKey(id));
      if (metadataKeys.length === 0) {
        return [];
      }

      const metadataResult = await redis.mget(metadataKeys);
      const metadataList = (metadataResult.data || []).map((data, index) => {
        if (!data) return null;
        try {
          return { gameId: gameIds[index], metadata: JSON.parse(data) };
        } catch {
          return null;
        }
      }).filter(Boolean);

      // Apply filters
      const filteredMetadata = metadataList.filter(item => {
        if (!item) return false;
        
        const meta = item.metadata;
        
        // Status filter
        if (query.status && meta.status !== query.status) {
          return false;
        }

        // Date range filters
        if (query.createdAfter && new Date(meta.createdAt) < query.createdAfter) {
          return false;
        }

        if (query.createdBefore && new Date(meta.createdAt) > query.createdBefore) {
          return false;
        }

        return true;
      });

      // Sort by creation date (newest first)
      filteredMetadata.sort((a, b) => 
        new Date(b!.metadata.createdAt).getTime() - new Date(a!.metadata.createdAt).getTime()
      );

      // Apply pagination
      const paginatedMetadata = filteredMetadata.slice(offset, offset + limit);

      // Load full game states
      for (const item of paginatedMetadata) {
        if (item) {
          const gameState = await this.load(item.gameId);
          if (gameState) {
            results.push(gameState);
          }
        }
      }

      console.log(`[T1.6] Query returned ${results.length} games`);
      return results;

    } catch (error) {
      throw new GameStateError(
        'Failed to query game states',
        undefined,
        'query',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Clean up expired games
   */
  async cleanup(olderThan: Date): Promise<number> {
    try {
      let cleanedCount = 0;
      const batchSize = GAME_STATE_CONFIG.CLEANUP_BATCH_SIZE;

      // Get all game IDs
      const gameIdsResult = await redis.smembers(gameIndexKey());
      const gameIds = gameIdsResult.data || [];

      // Process in batches
      for (let i = 0; i < gameIds.length; i += batchSize) {
        const batch = gameIds.slice(i, i + batchSize);
        
        for (const gameId of batch) {
          try {
            // Load metadata to check creation date
            const metaResult = await redis.get(gameMetadataKey(gameId));
            
            if (!metaResult.data) {
              // Orphaned game ID, remove from index
              await redis.srem(gameIndexKey(), gameId);
              continue;
            }

            const metadata = JSON.parse(metaResult.data);
            const createdAt = new Date(metadata.createdAt);

            if (createdAt < olderThan) {
              const deleted = await this.delete(gameId);
              if (deleted) {
                cleanedCount++;
              }
            }
          } catch (error) {
            console.error(`[T1.6] Error cleaning up game ${gameId}:`, error);
          }
        }
      }

      // Clean up cache
      const cacheCleanedCount = this.cache.cleanupExpired();
      
      console.log(`[T1.6] Cleanup completed: ${cleanedCount} games deleted, ${cacheCleanedCount} cache entries cleaned`);
      return cleanedCount;

    } catch (error) {
      throw new GameStateError(
        'Failed to cleanup expired games',
        undefined,
        'cleanup',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Validate game state
   */
  validate(gameState: SerializedGameState): GameStateValidationResult {
    return validateSerializedGameState(gameState);
  }

  /**
   * Create a new game from QChessGame instance
   */
  async createFromGame(
    game: QChessGame,
    config: {
      whitePlayer: string;
      blackPlayer: string;
      enableQuantumRules?: boolean;
      maxSuperpositions?: number;
      measurementThreshold?: number;
      seed?: number;
      tags?: string[];
    }
  ): Promise<SerializedGameState> {
    try {
      const gameState = game.getGameState();
      const now = new Date();

      const metadata: GameMetadata = {
        id: gameState.id,
        config: {
          whitePlayer: config.whitePlayer,
          blackPlayer: config.blackPlayer,
          enableQuantumRules: config.enableQuantumRules ?? true,
          maxSuperpositions: config.maxSuperpositions ?? 64,
          measurementThreshold: config.measurementThreshold ?? 0.1,
          seed: config.seed,
        },
        createdAt: now,
        updatedAt: now,
        version: 1,
        tags: config.tags || [],
      };

      const serializedGameState: SerializedGameState = {
        metadata,
        gameState,
      };

      // Save to store
      await this.save(serializedGameState);

      console.log(`[T1.6] New game created: ${gameState.id}`);
      return serializedGameState;

    } catch (error) {
      throw new GameStateError(
        'Failed to create game from QChessGame instance',
        undefined,
        'create',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Update existing game with new game state
   */
  async updateFromGame(gameId: string, game: QChessGame): Promise<SerializedGameState> {
    try {
      // Load existing game
      const existingGame = await this.load(gameId);
      if (!existingGame) {
        throw new GameStateNotFoundError(gameId);
      }

      // Get updated game state
      const newGameState = game.getGameState();

      // Create updated serialized game state
      const updatedGame: SerializedGameState = {
        metadata: {
          ...existingGame.metadata,
          updatedAt: new Date(),
          version: existingGame.metadata.version + 1,
        },
        gameState: {
          ...newGameState,
          createdAt: existingGame.gameState.createdAt, // Preserve original creation date
          updatedAt: new Date(),
        },
      };

      // Save updated state
      await this.save(updatedGame);

      console.log(`[T1.6] Game updated: ${gameId} (version ${updatedGame.metadata.version})`);
      return updatedGame;

    } catch (error) {
      if (error instanceof GameStateNotFoundError) {
        throw error;
      }
      
      throw new GameStateError(
        `Failed to update game: ${gameId}`,
        gameId,
        'update',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Serialize game state for storage
   */
  private serialize(gameState: SerializedGameState): string {
    return JSON.stringify(gameState);
  }

  /**
   * Deserialize game state from storage
   */
  private deserialize(data: string): SerializedGameState {
    const parsed = JSON.parse(data);
    
    // Restore Date objects
    parsed.metadata.createdAt = new Date(parsed.metadata.createdAt);
    parsed.metadata.updatedAt = new Date(parsed.metadata.updatedAt);
    parsed.gameState.createdAt = new Date(parsed.gameState.createdAt);
    parsed.gameState.updatedAt = new Date(parsed.gameState.updatedAt);

    return parsed;
  }
}

// Singleton instance
let storeInstance: GameStateStore | null = null;

/**
 * Get the global game state store instance
 */
export function getGameStateStore(): GameStateStore {
  if (!storeInstance) {
    storeInstance = new GameStateStore();
  }
  return storeInstance;
}

/**
 * Create a new store instance (for testing)
 */
export function createGameStateStore(cache?: GameStateCache, enableCompression = false): GameStateStore {
  return new GameStateStore(cache, enableCompression);
}

/**
 * Reset the global store instance
 */
export function resetGameStateStore(): void {
  storeInstance = null;
}