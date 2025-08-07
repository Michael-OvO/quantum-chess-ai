/**
 * @file game.types.ts
 * @purpose Type definitions for quantum chess game (aligned with engine implementation)
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.6
 */

// Re-export engine types for consistency
export type {
  Color,
  PieceType,
  GameStatus,
  MoveType,
  PieceChar,
  ChessPosition,
  QuantumPiece,
  QuantumBoard,
  QuantumMove,
  GameState,
  QuantumCoeff,
  Complex,
  QuantumOperation,
  MoveValidationResult,
} from '../lib/game-engine/types';

export type {
  PIECE_VALUES,
  INITIAL_BOARD_STATE,
  INITIAL_TAG_LIST,
} from '../lib/game-engine/types';

// Additional types for state management and persistence
export interface GameConfig {
  whitePlayer: string;
  blackPlayer: string;
  timeControl?: TimeControl;
  enableQuantumRules: boolean;
  maxSuperpositions: number;
  measurementThreshold: number;
  seed?: number;
}

export interface TimeControl {
  initial: number; // seconds
  increment: number; // seconds per move
  whiteTime: number; // remaining time in seconds
  blackTime: number; // remaining time in seconds
}

export interface GameMetadata {
  id: string;
  config: GameConfig;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  tags: string[];
}

// State management types
export interface SerializedGameState {
  metadata: GameMetadata;
  gameState: GameState;
  compressed?: boolean;
}

export interface GameStateQuery {
  id?: string;
  status?: GameStatus;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface GameStateValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface GameStateCacheEntry {
  data: SerializedGameState;
  lastAccessed: Date;
  accessCount: number;
  ttl: number;
}

// Persistence layer types
export interface GameStateStore {
  save(gameState: SerializedGameState): Promise<void>;
  load(gameId: string): Promise<SerializedGameState | null>;
  delete(gameId: string): Promise<boolean>;
  exists(gameId: string): Promise<boolean>;
  query(query: GameStateQuery): Promise<SerializedGameState[]>;
  cleanup(olderThan: Date): Promise<number>;
  validate(gameState: SerializedGameState): GameStateValidationResult;
}

// Error types for game state management
export class GameStateError extends Error {
  constructor(
    message: string,
    public gameId?: string,
    public operation?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'GameStateError';
  }
}

export class GameStateValidationError extends GameStateError {
  constructor(
    message: string,
    public validationErrors: string[],
    gameId?: string
  ) {
    super(message, gameId, 'validation');
    this.name = 'GameStateValidationError';
  }
}

export class GameStateNotFoundError extends GameStateError {
  constructor(gameId: string) {
    super(`Game state not found: ${gameId}`, gameId, 'load');
    this.name = 'GameStateNotFoundError';
  }
}

// Constants for state management
export const GAME_STATE_CONFIG = {
  DEFAULT_TTL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  MAX_CACHE_SIZE: 1000, // Maximum number of games to cache in memory
  COMPRESSION_THRESHOLD: 10000, // Compress game states larger than this (bytes)
  MAX_GAME_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  CLEANUP_BATCH_SIZE: 100, // Number of expired games to clean up at once
} as const;