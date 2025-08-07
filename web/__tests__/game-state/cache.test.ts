/**
 * @file cache.test.ts
 * @purpose Unit tests for game state cache
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.6
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { SerializedGameState } from '../../types/game.types';
import { GameStateCache, createGameStateCache } from '../../lib/game-state/cache';

describe('GameStateCache', () => {
  let cache: GameStateCache;
  let testGameState: SerializedGameState;

  beforeEach(() => {
    cache = createGameStateCache(3, 1000); // Small cache with 1 second TTL for testing
    
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
        },
        createdAt: now,
        updatedAt: now,
        version: 1,
        tags: ['test'],
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
  });

  describe('basic operations', () => {
    it('should store and retrieve game state', () => {
      cache.set('test-game-001', testGameState);
      const retrieved = cache.get('test-game-001');

      expect(retrieved).toEqual(testGameState);
    });

    it('should return null for non-existent game', () => {
      const result = cache.get('non-existent');

      expect(result).toBeNull();
    });

    it('should check existence correctly', () => {
      cache.set('test-game-001', testGameState);

      expect(cache.has('test-game-001')).toBe(true);
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should delete game from cache', () => {
      cache.set('test-game-001', testGameState);
      expect(cache.has('test-game-001')).toBe(true);

      const deleted = cache.delete('test-game-001');

      expect(deleted).toBe(true);
      expect(cache.has('test-game-001')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('game-001', testGameState);
      cache.set('game-002', testGameState);

      expect(cache.size()).toBe(2);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.has('game-001')).toBe(false);
      expect(cache.has('game-002')).toBe(false);
    });
  });

  describe('TTL and expiration', () => {
    it('should expire entries after TTL', async () => {
      // Set with very short TTL
      cache.set('test-game-001', testGameState, 10); // 10ms TTL

      // Should exist immediately
      expect(cache.has('test-game-001')).toBe(true);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));

      // Should be expired
      expect(cache.get('test-game-001')).toBeNull();
      expect(cache.has('test-game-001')).toBe(false);
    });

    it('should update access time on get', async () => {
      cache.set('test-game-001', testGameState);
      
      const entry1 = cache.getEntry('test-game-001');
      const firstAccessTime = entry1!.lastAccessed.getTime();

      // Wait a bit and access again
      await new Promise(resolve => setTimeout(resolve, 10));
      
      cache.get('test-game-001');
      const entry2 = cache.getEntry('test-game-001');
      const secondAccessTime = entry2!.lastAccessed.getTime();

      expect(secondAccessTime).toBeGreaterThanOrEqual(firstAccessTime);
    });

    it('should provide remaining TTL', () => {
      cache.set('test-game-001', testGameState, 1000); // 1 second TTL

      const remainingTTL = cache.getRemainingTTL('test-game-001');

      expect(remainingTTL).toBeGreaterThan(0);
      expect(remainingTTL).toBeLessThanOrEqual(1000);
    });

    it('should return null TTL for non-existent game', () => {
      const remainingTTL = cache.getRemainingTTL('non-existent');

      expect(remainingTTL).toBeNull();
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entries when at capacity', () => {
      // Fill cache to capacity (3 entries)
      cache.set('game-001', { ...testGameState, metadata: { ...testGameState.metadata, id: 'game-001' } });
      cache.set('game-002', { ...testGameState, metadata: { ...testGameState.metadata, id: 'game-002' } });
      cache.set('game-003', { ...testGameState, metadata: { ...testGameState.metadata, id: 'game-003' } });

      expect(cache.size()).toBe(3);

      // Access game-001 to make it more recently used
      cache.get('game-001');

      // Add another game, should evict game-002 (oldest unaccessed)
      cache.set('game-004', { ...testGameState, metadata: { ...testGameState.metadata, id: 'game-004' } });

      expect(cache.size()).toBe(3);
      expect(cache.has('game-001')).toBe(true); // Recently accessed, should remain
      expect(cache.has('game-002')).toBe(false); // Should be evicted
      expect(cache.has('game-003')).toBe(true);
      expect(cache.has('game-004')).toBe(true);
    });

    it('should track eviction count in statistics', () => {
      // Fill cache beyond capacity
      cache.set('game-001', testGameState);
      cache.set('game-002', testGameState);
      cache.set('game-003', testGameState);
      cache.set('game-004', testGameState); // Should trigger eviction

      const stats = cache.getStats();

      expect(stats.evictionCount).toBeGreaterThan(0);
    });
  });

  describe('statistics', () => {
    it('should track hit and miss counts', () => {
      cache.set('test-game-001', testGameState);

      // Hit
      cache.get('test-game-001');
      
      // Miss
      cache.get('non-existent');

      const stats = cache.getStats();

      expect(stats.hitCount).toBe(1);
      expect(stats.missCount).toBe(1);
      expect(stats.hitRate).toBe(0.5); // 50%
    });

    it('should calculate hit rate correctly', () => {
      cache.set('test-game-001', testGameState);

      // 3 hits, 1 miss = 75% hit rate
      cache.get('test-game-001');
      cache.get('test-game-001');
      cache.get('test-game-001');
      cache.get('non-existent');

      const stats = cache.getStats();

      expect(stats.hitRate).toBe(0.75);
    });

    it('should provide comprehensive statistics', () => {
      cache.set('game-001', testGameState);
      cache.set('game-002', testGameState);

      const stats = cache.getStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('hitCount');
      expect(stats).toHaveProperty('missCount');
      expect(stats).toHaveProperty('evictionCount');
      expect(stats).toHaveProperty('hitRate');

      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(3);
    });
  });

  describe('cleanup operations', () => {
    it('should cleanup expired entries', async () => {
      // Add entries with different TTLs
      cache.set('short-lived', testGameState, 10); // 10ms
      cache.set('long-lived', testGameState, 5000); // 5s

      expect(cache.size()).toBe(2);

      // Wait for short-lived to expire
      await new Promise(resolve => setTimeout(resolve, 20));

      const cleanedCount = cache.cleanupExpired();

      expect(cleanedCount).toBe(1);
      expect(cache.size()).toBe(1);
      expect(cache.has('short-lived')).toBe(false);
      expect(cache.has('long-lived')).toBe(true);
    });

    it('should warm up cache with provided games', () => {
      const gameStates = [
        {
          gameId: 'game-001',
          gameState: { ...testGameState, metadata: { ...testGameState.metadata, id: 'game-001' } },
        },
        {
          gameId: 'game-002', 
          gameState: { ...testGameState, metadata: { ...testGameState.metadata, id: 'game-002' } },
        },
      ];

      cache.warmUp(gameStates);

      expect(cache.size()).toBe(2);
      expect(cache.has('game-001')).toBe(true);
      expect(cache.has('game-002')).toBe(true);
    });
  });

  describe('import/export', () => {
    it('should export cache data', () => {
      cache.set('game-001', testGameState);
      cache.set('game-002', testGameState);

      const exported = cache.export();

      expect(exported).toHaveLength(2);
      expect(exported[0]).toHaveProperty('gameId');
      expect(exported[0]).toHaveProperty('entry');
      expect(exported[0].entry).toHaveProperty('data');
      expect(exported[0].entry).toHaveProperty('lastAccessed');
      expect(exported[0].entry).toHaveProperty('accessCount');
      expect(exported[0].entry).toHaveProperty('ttl');
    });

    it('should import cache data', () => {
      const importData = [
        {
          gameId: 'game-001',
          entry: {
            data: testGameState,
            lastAccessed: new Date(),
            accessCount: 1,
            ttl: 60000,
          },
        },
      ];

      cache.import(importData);

      expect(cache.size()).toBe(1);
      expect(cache.has('game-001')).toBe(true);
      
      const retrieved = cache.get('game-001');
      expect(retrieved).toEqual(testGameState);
    });

    it('should clear existing data on import', () => {
      cache.set('existing-game', testGameState);
      expect(cache.size()).toBe(1);

      const importData = [
        {
          gameId: 'imported-game',
          entry: {
            data: testGameState,
            lastAccessed: new Date(),
            accessCount: 1,
            ttl: 60000,
          },
        },
      ];

      cache.import(importData);

      expect(cache.size()).toBe(1);
      expect(cache.has('existing-game')).toBe(false);
      expect(cache.has('imported-game')).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should list all cached game IDs', () => {
      cache.set('game-001', testGameState);
      cache.set('game-002', testGameState);

      const keys = cache.keys();

      expect(keys).toHaveLength(2);
      expect(keys).toContain('game-001');
      expect(keys).toContain('game-002');
    });

    it('should update TTL for existing game', () => {
      cache.set('test-game-001', testGameState, 1000);
      
      const updated = cache.updateTTL('test-game-001', 2000);
      
      expect(updated).toBe(true);
      
      const entry = cache.getEntry('test-game-001');
      expect(entry!.ttl).toBe(2000);
    });

    it('should return false when updating TTL for non-existent game', () => {
      const updated = cache.updateTTL('non-existent', 2000);
      
      expect(updated).toBe(false);
    });
  });
});