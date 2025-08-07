/**
 * @file validation.ts
 * @purpose State validation utilities for quantum chess game state management
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.6
 */

import type {
  GameState,
  SerializedGameState,
  GameStateValidationResult,
  GameConfig,
  GameMetadata,
  QuantumPiece,
  ChessPosition,
  QuantumMove,
  Color,
  PieceType,
} from '../../types/game.types';
import { GameStateValidationError } from '../../types/game.types';

/**
 * Validate a serialized game state
 */
export function validateSerializedGameState(
  gameState: SerializedGameState
): GameStateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Handle null/undefined game state
  if (!gameState || typeof gameState !== 'object') {
    errors.push('Serialized game state is required and must be an object');
    return { valid: false, errors, warnings };
  }

  try {
    // Validate metadata
    const metadataValidation = validateGameMetadata(gameState.metadata);
    errors.push(...metadataValidation.errors);
    warnings.push(...metadataValidation.warnings);

    // Validate game state
    const stateValidation = validateGameState(gameState.gameState);
    errors.push(...stateValidation.errors);
    warnings.push(...stateValidation.warnings);

    // Cross-validate metadata and state consistency
    if (gameState.metadata.id !== gameState.gameState.id) {
      errors.push('Metadata ID does not match game state ID');
    }

    // Validate timestamps
    if (gameState.metadata.createdAt > gameState.metadata.updatedAt) {
      errors.push('Created date cannot be after updated date');
    }

    if (gameState.gameState.createdAt > gameState.gameState.updatedAt) {
      errors.push('Game state created date cannot be after updated date');
    }

    // Version validation
    if (gameState.metadata.version < 1) {
      errors.push('Version must be at least 1');
    }

  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate game metadata
 */
export function validateGameMetadata(metadata: GameMetadata): GameStateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Handle null/undefined metadata
  if (!metadata || typeof metadata !== 'object') {
    errors.push('Game metadata is required and must be an object');
    return { valid: false, errors, warnings };
  }

  // ID validation
  if (!metadata.id || typeof metadata.id !== 'string') {
    errors.push('Game ID is required and must be a string');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(metadata.id)) {
    errors.push('Game ID contains invalid characters (only alphanumeric, underscore, and dash allowed)');
  } else if (metadata.id.length < 6 || metadata.id.length > 50) {
    warnings.push('Game ID should be between 6-50 characters for optimal compatibility');
  }

  // Config validation
  const configValidation = validateGameConfig(metadata.config);
  errors.push(...configValidation.errors);
  warnings.push(...configValidation.warnings);

  // Date validation
  if (!(metadata.createdAt instanceof Date) || isNaN(metadata.createdAt.getTime())) {
    errors.push('Created date must be a valid Date object');
  }

  if (!(metadata.updatedAt instanceof Date) || isNaN(metadata.updatedAt.getTime())) {
    errors.push('Updated date must be a valid Date object');
  }

  // Version validation
  if (!Number.isInteger(metadata.version) || metadata.version < 1) {
    errors.push('Version must be a positive integer');
  }

  // Tags validation
  if (!Array.isArray(metadata.tags)) {
    errors.push('Tags must be an array');
  } else {
    metadata.tags.forEach((tag, index) => {
      if (typeof tag !== 'string') {
        errors.push(`Tag at index ${index} must be a string`);
      } else if (tag.length > 50) {
        warnings.push(`Tag at index ${index} is longer than 50 characters`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate game configuration
 */
export function validateGameConfig(config: GameConfig): GameStateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Player validation
  if (!config.whitePlayer || typeof config.whitePlayer !== 'string') {
    errors.push('White player is required and must be a string');
  }

  if (!config.blackPlayer || typeof config.blackPlayer !== 'string') {
    errors.push('Black player is required and must be a string');
  }

  // Time control validation
  if (config.timeControl) {
    const timeControlValidation = validateTimeControl(config.timeControl);
    errors.push(...timeControlValidation.errors);
    warnings.push(...timeControlValidation.warnings);
  }

  // Quantum rules validation
  if (typeof config.enableQuantumRules !== 'boolean') {
    errors.push('enableQuantumRules must be a boolean');
  }

  // Superposition limits
  if (!Number.isInteger(config.maxSuperpositions) || config.maxSuperpositions < 1) {
    errors.push('maxSuperpositions must be a positive integer');
  } else if (config.maxSuperpositions > 64) {
    warnings.push('maxSuperpositions exceeds board size (64), may cause performance issues');
  }

  // Measurement threshold
  if (typeof config.measurementThreshold !== 'number' || 
      config.measurementThreshold < 0 || 
      config.measurementThreshold > 1) {
    errors.push('measurementThreshold must be a number between 0 and 1');
  }

  // Seed validation (optional)
  if (config.seed !== undefined && (!Number.isInteger(config.seed) || config.seed < 0)) {
    errors.push('seed must be a non-negative integer if provided');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate time control settings
 */
function validateTimeControl(timeControl: any): GameStateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const requiredFields = ['initial', 'increment', 'whiteTime', 'blackTime'];
  
  for (const field of requiredFields) {
    if (typeof timeControl[field] !== 'number' || timeControl[field] < 0) {
      errors.push(`${field} must be a non-negative number`);
    }
  }

  // Reasonable time limits
  if (timeControl.initial > 7200) { // 2 hours
    warnings.push('Initial time exceeds 2 hours, games may be very long');
  }

  if (timeControl.increment > 60) {
    warnings.push('Increment exceeds 60 seconds per move');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate complete game state
 */
export function validateGameState(gameState: GameState): GameStateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Handle null/undefined game state
  if (!gameState || typeof gameState !== 'object') {
    errors.push('Game state is required and must be an object');
    return { valid: false, errors, warnings };
  }

  try {
    // Basic field validation
    if (!gameState.id || typeof gameState.id !== 'string') {
      errors.push('Game state ID is required');
    }

    // Current player validation
    if (gameState.currentPlayer !== 'white' && gameState.currentPlayer !== 'black') {
      errors.push('Current player must be either "white" or "black"');
    }

    // Move count validation
    if (!Number.isInteger(gameState.moveCount) || gameState.moveCount < 0) {
      errors.push('Move count must be a non-negative integer');
    }

    // Status validation
    const validStatuses = ['pending', 'active', 'completed', 'abandoned'];
    if (!validStatuses.includes(gameState.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    // Board validation
    const boardValidation = validateQuantumBoard(gameState.board);
    errors.push(...boardValidation.errors);
    warnings.push(...boardValidation.warnings);

    // Moves validation
    const movesValidation = validateMoves(gameState.moves, gameState.moveCount);
    errors.push(...movesValidation.errors);
    warnings.push(...movesValidation.warnings);

    // Captured pieces validation
    const capturedValidation = validateCapturedPieces(gameState.capturedPieces);
    errors.push(...capturedValidation.errors);
    warnings.push(...capturedValidation.warnings);

    // Castling rights validation
    const castlingValidation = validateCastlingRights(gameState.canCastle);
    errors.push(...castlingValidation.errors);
    warnings.push(...castlingValidation.warnings);

    // Date validation
    if (!(gameState.createdAt instanceof Date) || isNaN(gameState.createdAt.getTime())) {
      errors.push('createdAt must be a valid Date');
    }

    if (!(gameState.updatedAt instanceof Date) || isNaN(gameState.updatedAt.getTime())) {
      errors.push('updatedAt must be a valid Date');
    }

  } catch (error) {
    errors.push(`Game state validation error: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate quantum board structure
 */
function validateQuantumBoard(board: any): GameStateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!board || typeof board !== 'object') {
    errors.push('Board must be an object');
    return { valid: false, errors, warnings };
  }

  // Validate pieces array
  if (!Array.isArray(board.pieces)) {
    errors.push('Board pieces must be an array');
  } else if (board.pieces.length !== 64) {
    errors.push('Board pieces array must have exactly 64 elements');
  }

  // Validate probabilities array
  if (!Array.isArray(board.probabilities)) {
    errors.push('Board probabilities must be an array');
  } else if (board.probabilities.length !== 64) {
    errors.push('Board probabilities array must have exactly 64 elements');
  } else {
    board.probabilities.forEach((prob: any, index: number) => {
      if (typeof prob !== 'number' || prob < 0 || prob > 1) {
        errors.push(`Probability at position ${index} must be a number between 0 and 1`);
      }
    });
  }

  // Validate correlation matrix
  if (!Array.isArray(board.correlationMatrix)) {
    errors.push('Correlation matrix must be an array');
  } else if (board.correlationMatrix.length !== 64) {
    errors.push('Correlation matrix must be 64x64');
  } else {
    board.correlationMatrix.forEach((row: any, rowIndex: number) => {
      if (!Array.isArray(row) || row.length !== 64) {
        errors.push(`Correlation matrix row ${rowIndex} must have exactly 64 elements`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate moves array
 */
function validateMoves(moves: QuantumMove[], moveCount: number): GameStateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(moves)) {
    errors.push('Moves must be an array');
    return { valid: false, errors, warnings };
  }

  if (moves.length !== moveCount) {
    warnings.push(`Move array length (${moves.length}) does not match move count (${moveCount})`);
  }

  // Validate individual moves
  moves.forEach((move, index) => {
    const moveValidation = validateQuantumMove(move, index);
    errors.push(...moveValidation.errors);
    warnings.push(...moveValidation.warnings);
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate individual quantum move
 */
function validateQuantumMove(move: QuantumMove, index: number): GameStateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Position validation
  if (!isValidPosition(move.from)) {
    errors.push(`Move ${index}: Invalid 'from' position`);
  }

  if (!isValidPosition(move.to)) {
    errors.push(`Move ${index}: Invalid 'to' position`);
  }

  // Move type validation
  const validTypes = ['normal', 'split', 'merge', 'blocked', 'capture'];
  if (!validTypes.includes(move.type)) {
    errors.push(`Move ${index}: Invalid move type "${move.type}"`);
  }

  // Piece type validation
  const validPieces = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
  if (!validPieces.includes(move.piece)) {
    errors.push(`Move ${index}: Invalid piece type "${move.piece}"`);
  }

  // Split/merge specific validation
  if (move.type === 'split' && !move.toSecond) {
    errors.push(`Move ${index}: Split moves require toSecond position`);
  }

  if (move.type === 'merge' && !move.fromSecond) {
    errors.push(`Move ${index}: Merge moves require fromSecond position`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate captured pieces
 */
function validateCapturedPieces(capturedPieces: QuantumPiece[]): GameStateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(capturedPieces)) {
    errors.push('Captured pieces must be an array');
    return { valid: false, errors, warnings };
  }

  capturedPieces.forEach((piece, index) => {
    if (!piece || typeof piece !== 'object') {
      errors.push(`Captured piece ${index} must be an object`);
      return;
    }

    if (typeof piece.probability !== 'number' || piece.probability < 0 || piece.probability > 1) {
      errors.push(`Captured piece ${index} probability must be between 0 and 1`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate castling rights
 */
function validateCastlingRights(canCastle: any): GameStateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!canCastle || typeof canCastle !== 'object') {
    errors.push('Castling rights must be an object');
    return { valid: false, errors, warnings };
  }

  const requiredFields = ['whiteKingSide', 'whiteQueenSide', 'blackKingSide', 'blackQueenSide'];
  
  for (const field of requiredFields) {
    if (typeof canCastle[field] !== 'boolean') {
      errors.push(`Castling right ${field} must be a boolean`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate chess position
 */
function isValidPosition(position: ChessPosition): boolean {
  return (
    position &&
    typeof position.file === 'number' &&
    typeof position.rank === 'number' &&
    typeof position.pos === 'number' &&
    typeof position.str_ === 'string' &&
    position.file >= 0 &&
    position.file <= 7 &&
    position.rank >= 0 &&
    position.rank <= 7 &&
    position.pos >= 0 &&
    position.pos <= 63 &&
    /^[a-h][1-8]$/.test(position.str_)
  );
}

/**
 * Throw validation error if state is invalid
 */
export function validateOrThrow(gameState: SerializedGameState): void {
  const validation = validateSerializedGameState(gameState);
  
  if (!validation.valid) {
    throw new GameStateValidationError(
      `Game state validation failed: ${validation.errors.join(', ')}`,
      validation.errors,
      gameState.metadata.id
    );
  }
}

/**
 * Sanitize game state by removing invalid data
 */
export function sanitizeGameState(gameState: SerializedGameState): SerializedGameState {
  // Create a deep copy to avoid mutating the original
  const sanitized = JSON.parse(JSON.stringify(gameState));

  // Ensure dates are Date objects
  sanitized.metadata.createdAt = new Date(sanitized.metadata.createdAt);
  sanitized.metadata.updatedAt = new Date(sanitized.metadata.updatedAt);
  sanitized.gameState.createdAt = new Date(sanitized.gameState.createdAt);
  sanitized.gameState.updatedAt = new Date(sanitized.gameState.updatedAt);

  // Ensure arrays exist
  if (!Array.isArray(sanitized.metadata.tags)) {
    sanitized.metadata.tags = [];
  }

  if (!Array.isArray(sanitized.gameState.moves)) {
    sanitized.gameState.moves = [];
  }

  if (!Array.isArray(sanitized.gameState.capturedPieces)) {
    sanitized.gameState.capturedPieces = [];
  }

  // Clamp numeric values to valid ranges
  if (sanitized.gameState.moveCount < 0) {
    sanitized.gameState.moveCount = 0;
  }

  if (sanitized.metadata.version < 1) {
    sanitized.metadata.version = 1;
  }

  return sanitized;
}