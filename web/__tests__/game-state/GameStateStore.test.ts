/**
 * @file GameStateStore.test.ts
 * @purpose Unit tests for game state store
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.6
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import type {
  SerializedGameState,
  GameMetadata,
  GameState,
} from '../../types/game.types';
import { GameStateStore, createGameStateStore } from '../../lib/game-state/GameStateStore';
import { createGameStateCache } from '../../lib/game-state/cache';
import { QChessGame } from '../../lib/game-engine/QChessGame';

// Mock Redis client
jest.mock('../../lib/utils/redis', () => ({
  redis: {
    set: jest.fn().mockResolvedValue({ success: true, data: 'OK' }),
    get: jest.fn().mockResolvedValue({ success: true, data: null }),
    delete: jest.fn().mockResolvedValue({ success: true, data: 1 }),
    exists: jest.fn().mockResolvedValue({ success: true, data: false }),
    sadd: jest.fn().mockResolvedValue({ success: true, data: 1 }),
    srem: jest.fn().mockResolvedValue({ success: true, data: 1 }),
    smembers: jest.fn().mockResolvedValue({ success: true, data: [] }),
    mget: jest.fn().mockResolvedValue({ success: true, data: [] }),
  },
  gameStateKey: (gameId: string) => `game:state:${gameId}`,
  gameMetadataKey: (gameId: string) => `game:meta:${gameId}`,
  gameHistoryKey: (gameId: string) => `game:history:${gameId}`,
  gameIndexKey: () => 'game:index',
  gameCleanupPattern: () => 'game:*',
  msToSeconds: (ms: number) => Math.floor(ms / 1000),
}));

const mockRedis = jest.requireMock('../../lib/utils/redis').redis;

describe('GameStateStore', () => {
  let store: GameStateStore;
  let testGameState: SerializedGameState;

  beforeEach(() => {
    // Create store with test cache
    const testCache = createGameStateCache(10, 60000); // Small cache for testing
    store = createGameStateStore(testCache);

    // Create test game state
    const now = new Date();
    testGameState = {
      metadata: {
        id: 'test-game-001',
        config: {
          whitePlayer: 'TestPlayerWhite',
          blackPlayer: 'TestPlayerBlack',
          enableQuantumRules: true,
          maxSuperpositions: 32,
          measurementThreshold: 0.1,
          seed: 42,
        },
        createdAt: now,
        updatedAt: now,
        version: 1,
        tags: ['test', 'unit-test'],
      },
      gameState: {
        id: 'test-game-001',
        board: {
          pieces: new Array(64).fill(null),
          probabilities: new Array(64).fill(0),
          correlationMatrix: Array(64).fill(null).map(() => Array(64).fill(0)),
        },
        currentPlayer: 'white',
        moves: [],
        capturedPieces: [],
        status: 'active',
        moveCount: 0,
        canCastle: {
          whiteKingSide: true,
          whiteQueenSide: true,
          blackKingSide: true,
          blackQueenSide: true,
        },
        createdAt: now,
        updatedAt: now,
      },
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save game state to Redis and cache', async () => {
      await store.save(testGameState);

      // Verify Redis calls
      expect(mockRedis.set).toHaveBeenCalledWith(
        'game:state:test-game-001',
        expect.stringContaining('test-game-001'),
        expect.any(Number)
      );
      expect(mockRedis.set).toHaveBeenCalledWith(
        'game:meta:test-game-001',
        expect.stringContaining('test-game-001'),
        expect.any(Number)
      );
      expect(mockRedis.sadd).toHaveBeenCalledWith('game:index', 'test-game-001');
    });

    it('should update version and timestamps on save', async () => {
      const originalVersion = testGameState.metadata.version;
      const originalUpdatedAt = testGameState.metadata.updatedAt;

      await store.save(testGameState);

      expect(testGameState.metadata.version).toBe(originalVersion + 1);
      expect(testGameState.metadata.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should throw error for invalid game state', async () => {
      const invalidGameState = {
        ...testGameState,
        metadata: {
          ...testGameState.metadata,
          id: '', // Invalid empty ID
        },
      };

      await expect(store.save(invalidGameState)).rejects.toThrow();
    });
  });

  describe('load', () => {
    it('should return null for non-existent game', async () => {
      mockRedis.get.mockResolvedValueOnce({ success: true, data: null });

      const result = await store.load('non-existent-game');

      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith('game:state:non-existent-game');
    });

    it('should load and deserialize game state from Redis', async () => {
      const serializedData = JSON.stringify(testGameState);
      mockRedis.get.mockResolvedValueOnce({ success: true, data: serializedData });

      const result = await store.load('test-game-001');

      expect(result).toBeTruthy();
      expect(result!.metadata.id).toBe('test-game-001');
      expect(result!.gameState.currentPlayer).toBe('white');
    });

    it('should return cached result on second call', async () => {
      // First call - should hit Redis
      const serializedData = JSON.stringify(testGameState);
      mockRedis.get.mockResolvedValueOnce({ success: true, data: serializedData });

      const result1 = await store.load('test-game-001');
      
      // Second call - should hit cache
      const result2 = await store.load('test-game-001');

      expect(result1).toEqual(result2);
      expect(mockRedis.get).toHaveBeenCalledTimes(1); // Only called once due to cache
    });
  });

  describe('delete', () => {
    it('should delete game from Redis and cache', async () => {
      mockRedis.delete.mockResolvedValue({ success: true, data: 1 });

      const result = await store.delete('test-game-001');

      expect(result).toBe(true);
      expect(mockRedis.delete).toHaveBeenCalledWith('game:state:test-game-001');
      expect(mockRedis.delete).toHaveBeenCalledWith('game:meta:test-game-001');
      expect(mockRedis.delete).toHaveBeenCalledWith('game:history:test-game-001');
      expect(mockRedis.srem).toHaveBeenCalledWith('game:index', 'test-game-001');
    });

    it('should return false when nothing to delete', async () => {
      mockRedis.delete.mockResolvedValue({ success: true, data: 0 });

      const result = await store.delete('non-existent-game');

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing game', async () => {
      mockRedis.exists.mockResolvedValueOnce({ success: true, data: true });

      const result = await store.exists('test-game-001');

      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('game:state:test-game-001');
    });

    it('should return false for non-existent game', async () => {
      mockRedis.exists.mockResolvedValueOnce({ success: true, data: false });

      const result = await store.exists('non-existent-game');

      expect(result).toBe(false);
    });

    it('should check cache first before Redis', async () => {
      // Add to cache first
      await store.save(testGameState);
      
      // Clear Redis mock to ensure it's not called
      jest.clearAllMocks();

      const result = await store.exists('test-game-001');

      expect(result).toBe(true);
      expect(mockRedis.exists).not.toHaveBeenCalled(); // Should not hit Redis due to cache
    });
  });

  describe('query', () => {
    beforeEach(() => {
      // Mock game index and metadata
      mockRedis.smembers.mockResolvedValue({
        success: true,
        data: ['test-game-001', 'test-game-002', 'test-game-003'],
      });

      const mockMetadata1 = JSON.stringify({
        id: 'test-game-001',
        status: 'active',
        createdAt: new Date('2025-01-01'),
      });
      const mockMetadata2 = JSON.stringify({
        id: 'test-game-002',
        status: 'completed',
        createdAt: new Date('2025-01-02'),
      });
      const mockMetadata3 = JSON.stringify({
        id: 'test-game-003',
        status: 'active',
        createdAt: new Date('2025-01-03'),
      });

      mockRedis.mget.mockResolvedValue({
        success: true,
        data: [mockMetadata1, mockMetadata2, mockMetadata3],
      });
    });

    it('should query games with status filter', async () => {
      // Mock the load method to return test games
      const mockLoad = jest.spyOn(store, 'load').mockImplementation(async (gameId) => {
        if (gameId.startsWith('test-game')) {
          return {
            ...testGameState,
            metadata: { ...testGameState.metadata, id: gameId },
            gameState: { ...testGameState.gameState, id: gameId },
          };
        }
        return null;
      });

      const results = await store.query({ status: 'active' });

      expect(results).toHaveLength(2); // test-game-001 and test-game-003
      expect(results[0].metadata.id).toBe('test-game-003'); // Newest first
      expect(results[1].metadata.id).toBe('test-game-001');

      mockLoad.mockRestore();
    });

    it('should apply pagination', async () => {
      const mockLoad = jest.spyOn(store, 'load').mockImplementation(async (gameId) => {
        if (gameId.startsWith('test-game')) {
          return {
            ...testGameState,
            metadata: { ...testGameState.metadata, id: gameId },
            gameState: { ...testGameState.gameState, id: gameId },
          };
        }
        return null;
      });

      const results = await store.query({ limit: 2, offset: 1 });

      expect(results).toHaveLength(2);

      mockLoad.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should cleanup old games', async () => {
      const cutoffDate = new Date('2025-01-01');
      
      // Mock game index
      mockRedis.smembers.mockResolvedValue({
        success: true,
        data: ['old-game-001', 'new-game-001'],
      });

      // Mock metadata - old game should be cleaned up
      const oldGameMeta = JSON.stringify({
        id: 'old-game-001',
        createdAt: new Date('2024-12-01'), // Old
      });
      const newGameMeta = JSON.stringify({
        id: 'new-game-001',
        createdAt: new Date('2025-01-15'), // New
      });

      mockRedis.get
        .mockResolvedValueOnce({ success: true, data: oldGameMeta })
        .mockResolvedValueOnce({ success: true, data: newGameMeta });

      // Mock delete to return success for old game
      mockRedis.delete.mockResolvedValue({ success: true, data: 1 });

      const cleanedCount = await store.cleanup(cutoffDate);

      expect(cleanedCount).toBe(1);
    });
  });

  describe('createFromGame', () => {
    it('should create serialized game state from QChessGame instance', async () => {
      const game = new QChessGame(42);
      
      const config = {
        whitePlayer: 'Alice',
        blackPlayer: 'Bob',
        tags: ['test', 'quantum'],
      };

      const result = await store.createFromGame(game, config);

      expect(result.metadata.config.whitePlayer).toBe('Alice');
      expect(result.metadata.config.blackPlayer).toBe('Bob');
      expect(result.metadata.tags).toEqual(['test', 'quantum']);
      expect(result.metadata.version).toBe(1);
      expect(result.gameState.currentPlayer).toBe('white');
    });
  });

  describe('validation', () => {
    it('should validate game state correctly', () => {
      const validation = store.validate(testGameState);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect validation errors', () => {
      const invalidGameState = {
        ...testGameState,
        gameState: {
          ...testGameState.gameState,
          currentPlayer: 'invalid' as any, // Invalid player
        },
      };

      const validation = store.validate(invalidGameState);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('cache integration', () => {
    it('should use cache for subsequent loads', async () => {
      // First save should populate cache
      await store.save(testGameState);

      // Clear Redis mocks to ensure cache is used
      jest.clearAllMocks();

      const result = await store.load('test-game-001');

      expect(result).toBeTruthy();
      expect(result!.metadata.id).toBe('test-game-001');
      expect(mockRedis.get).not.toHaveBeenCalled(); // Should not hit Redis
    });

    it('should provide cache statistics', () => {
      const stats = store.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('hitCount');
      expect(stats).toHaveProperty('missCount');
      expect(stats).toHaveProperty('hitRate');
    });
  });
});