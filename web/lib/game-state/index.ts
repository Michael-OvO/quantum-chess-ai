/**
 * @file index.ts
 * @purpose Game state management module exports
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.6
 */

// Main exports
export { GameStateStore, getGameStateStore, createGameStateStore, resetGameStateStore } from './GameStateStore';
export { GameStateCache, getGameStateCache, createGameStateCache, resetGameStateCache, withCache, invalidateCache, warmCache, startPeriodicCleanup } from './cache';
export {
  validateSerializedGameState,
  validateGameMetadata,
  validateGameState,
  validateOrThrow,
  sanitizeGameState,
} from './validation';

// Re-export types for convenience
export type {
  GameStateStore as IGameStateStore,
  SerializedGameState,
  GameStateQuery,
  GameStateValidationResult,
  GameStateCacheEntry,
  GameMetadata,
  GameConfig,
  TimeControl,
} from '../../types/game.types';

export type { CacheStats } from './cache';