/**
 * @file validation.test.ts
 * @purpose Unit tests for game state validation
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.6
 */

import { describe, it, expect } from '@jest/globals';
import type { SerializedGameState, GameMetadata } from '../../types/game.types';
import {
  validateSerializedGameState,
  validateGameMetadata,
  validateGameState,
  validateOrThrow,
  sanitizeGameState,
} from '../../lib/game-state/validation';
import { GameStateValidationError } from '../../types/game.types';

describe('Game State Validation', () => {
  let validGameState: SerializedGameState;

  beforeEach(() => {
    const now = new Date();
    validGameState = {
      metadata: {
        id: 'test-game-001',
        config: {
          whitePlayer: 'Alice',
          blackPlayer: 'Bob',
          enableQuantumRules: true,
          maxSuperpositions: 32,
          measurementThreshold: 0.1,
          seed: 42,
        },
        createdAt: now,
        updatedAt: now,
        version: 1,
        tags: ['test', 'quantum'],
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

  describe('validateSerializedGameState', () => {
    it('should validate a correct game state', () => {
      const result = validateSerializedGameState(validGameState);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect mismatched IDs between metadata and game state', () => {
      const invalidGameState = {
        ...validGameState,
        metadata: {
          ...validGameState.metadata,
          id: 'metadata-id',
        },
        gameState: {
          ...validGameState.gameState,
          id: 'gamestate-id',
        },
      };

      const result = validateSerializedGameState(invalidGameState);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Metadata ID does not match game state ID');
    });

    it('should detect invalid timestamps', () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      const pastDate = new Date(Date.now() - 86400000);   // Yesterday

      const invalidGameState = {
        ...validGameState,
        metadata: {
          ...validGameState.metadata,
          createdAt: futureDate,
          updatedAt: pastDate,
        },
      };

      const result = validateSerializedGameState(invalidGameState);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Created date cannot be after updated date');
    });

    it('should validate version numbers', () => {
      const invalidGameState = {
        ...validGameState,
        metadata: {
          ...validGameState.metadata,
          version: 0, // Invalid version
        },
      };

      const result = validateSerializedGameState(invalidGameState);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Version must be at least 1');
    });
  });

  describe('validateGameMetadata', () => {
    it('should validate correct metadata', () => {
      const result = validateGameMetadata(validGameState.metadata);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty game ID', () => {
      const invalidMetadata = {
        ...validGameState.metadata,
        id: '',
      };

      const result = validateGameMetadata(invalidMetadata);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Game ID is required and must be a string');
    });

    it('should reject invalid characters in game ID', () => {
      const invalidMetadata = {
        ...validGameState.metadata,
        id: 'invalid@id!',
      };

      const result = validateGameMetadata(invalidMetadata);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Game ID contains invalid characters (only alphanumeric, underscore, and dash allowed)');
    });

    it('should warn about game ID length', () => {
      const shortIdMetadata = {
        ...validGameState.metadata,
        id: 'abc', // Too short
      };

      const result = validateGameMetadata(shortIdMetadata);

      expect(result.valid).toBe(true); // Still valid, but with warnings
      expect(result.warnings).toContain('Game ID should be between 6-50 characters for optimal compatibility');
    });

    it('should validate player names', () => {
      const invalidMetadata = {
        ...validGameState.metadata,
        config: {
          ...validGameState.metadata.config,
          whitePlayer: '',
          blackPlayer: '',
        },
      };

      const result = validateGameMetadata(invalidMetadata);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('White player is required and must be a string');
      expect(result.errors).toContain('Black player is required and must be a string');
    });

    it('should validate quantum configuration', () => {
      const invalidMetadata = {
        ...validGameState.metadata,
        config: {
          ...validGameState.metadata.config,
          enableQuantumRules: 'invalid' as any,
          maxSuperpositions: -1,
          measurementThreshold: 1.5, // Out of range
        },
      };

      const result = validateGameMetadata(invalidMetadata);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('enableQuantumRules must be a boolean');
      expect(result.errors).toContain('maxSuperpositions must be a positive integer');
      expect(result.errors).toContain('measurementThreshold must be a number between 0 and 1');
    });

    it('should warn about extreme superposition limits', () => {
      const extremeMetadata = {
        ...validGameState.metadata,
        config: {
          ...validGameState.metadata.config,
          maxSuperpositions: 128, // Exceeds board size
        },
      };

      const result = validateGameMetadata(extremeMetadata);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('maxSuperpositions exceeds board size (64), may cause performance issues');
    });

    it('should validate date objects', () => {
      const invalidMetadata = {
        ...validGameState.metadata,
        createdAt: 'not-a-date' as any,
        updatedAt: new Date('invalid-date'),
      };

      const result = validateGameMetadata(invalidMetadata);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Created date must be a valid Date object');
      expect(result.errors).toContain('Updated date must be a valid Date object');
    });

    it('should validate tags array', () => {
      const invalidMetadata = {
        ...validGameState.metadata,
        tags: 'not-an-array' as any,
      };

      const result = validateGameMetadata(invalidMetadata);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Tags must be an array');
    });

    it('should validate individual tags', () => {
      const invalidMetadata = {
        ...validGameState.metadata,
        tags: [123, 'valid-tag', 'a'.repeat(60)] as any, // Number, valid, too long
      };

      const result = validateGameMetadata(invalidMetadata);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Tag at index 0 must be a string');
      expect(result.warnings).toContain('Tag at index 2 is longer than 50 characters');
    });
  });

  describe('validateGameState', () => {
    it('should validate correct game state', () => {
      const result = validateGameState(validGameState.gameState);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid game state ID', () => {
      const invalidState = {
        ...validGameState.gameState,
        id: '',
      };

      const result = validateGameState(invalidState);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Game state ID is required');
    });

    it('should validate current player', () => {
      const invalidState = {
        ...validGameState.gameState,
        currentPlayer: 'invalid' as any,
      };

      const result = validateGameState(invalidState);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Current player must be either "white" or "black"');
    });

    it('should validate move count', () => {
      const invalidState = {
        ...validGameState.gameState,
        moveCount: -1,
      };

      const result = validateGameState(invalidState);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Move count must be a non-negative integer');
    });

    it('should validate game status', () => {
      const invalidState = {
        ...validGameState.gameState,
        status: 'invalid-status' as any,
      };

      const result = validateGameState(invalidState);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Status must be one of: pending, active, completed, abandoned');
    });

    it('should validate board structure', () => {
      const invalidState = {
        ...validGameState.gameState,
        board: {
          pieces: new Array(32).fill(null), // Wrong size
          probabilities: new Array(64).fill(0),
          correlationMatrix: [],
        },
      };

      const result = validateGameState(invalidState);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Board pieces array must have exactly 64 elements');
    });

    it('should validate probability values', () => {
      const invalidState = {
        ...validGameState.gameState,
        board: {
          ...validGameState.gameState.board,
          probabilities: [1.5, -0.1, 0.5, ...new Array(61).fill(0)], // Invalid values
        },
      };

      const result = validateGameState(invalidState);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Probability at position 0 must be a number between 0 and 1');
      expect(result.errors).toContain('Probability at position 1 must be a number between 0 and 1');
    });

    it('should validate castling rights', () => {
      const invalidState = {
        ...validGameState.gameState,
        canCastle: {
          whiteKingSide: 'invalid' as any,
          whiteQueenSide: true,
          blackKingSide: true,
          blackQueenSide: true,
        },
      };

      const result = validateGameState(invalidState);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Castling right whiteKingSide must be a boolean');
    });
  });

  describe('validateOrThrow', () => {
    it('should not throw for valid game state', () => {
      expect(() => validateOrThrow(validGameState)).not.toThrow();
    });

    it('should throw GameStateValidationError for invalid state', () => {
      const invalidGameState = {
        ...validGameState,
        metadata: {
          ...validGameState.metadata,
          id: '', // Invalid
        },
      };

      expect(() => validateOrThrow(invalidGameState)).toThrow(GameStateValidationError);
    });

    it('should include error details in thrown exception', () => {
      const invalidGameState = {
        ...validGameState,
        gameState: {
          ...validGameState.gameState,
          currentPlayer: 'invalid' as any,
        },
      };

      try {
        validateOrThrow(invalidGameState);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(GameStateValidationError);
        const validationError = error as GameStateValidationError;
        expect(validationError.validationErrors.length).toBeGreaterThan(0);
        expect(validationError.gameId).toBe('test-game-001');
      }
    });
  });

  describe('sanitizeGameState', () => {
    it('should restore Date objects from strings', () => {
      const gameStateWithStringDates = JSON.parse(JSON.stringify(validGameState));
      // At this point, dates are strings

      const sanitized = sanitizeGameState(gameStateWithStringDates);

      expect(sanitized.metadata.createdAt).toBeInstanceOf(Date);
      expect(sanitized.metadata.updatedAt).toBeInstanceOf(Date);
      expect(sanitized.gameState.createdAt).toBeInstanceOf(Date);
      expect(sanitized.gameState.updatedAt).toBeInstanceOf(Date);
    });

    it('should ensure arrays exist', () => {
      const gameStateWithoutArrays = {
        ...validGameState,
        metadata: {
          ...validGameState.metadata,
          tags: undefined as any,
        },
        gameState: {
          ...validGameState.gameState,
          moves: undefined as any,
          capturedPieces: undefined as any,
        },
      };

      const sanitized = sanitizeGameState(gameStateWithoutArrays);

      expect(Array.isArray(sanitized.metadata.tags)).toBe(true);
      expect(Array.isArray(sanitized.gameState.moves)).toBe(true);
      expect(Array.isArray(sanitized.gameState.capturedPieces)).toBe(true);
    });

    it('should clamp numeric values to valid ranges', () => {
      const gameStateWithInvalidNumbers = {
        ...validGameState,
        metadata: {
          ...validGameState.metadata,
          version: -1, // Invalid
        },
        gameState: {
          ...validGameState.gameState,
          moveCount: -5, // Invalid
        },
      };

      const sanitized = sanitizeGameState(gameStateWithInvalidNumbers);

      expect(sanitized.metadata.version).toBe(1);
      expect(sanitized.gameState.moveCount).toBe(0);
    });

    it('should not mutate the original game state', () => {
      const original = { ...validGameState };
      const gameStateWithInvalidNumbers = {
        ...validGameState,
        gameState: {
          ...validGameState.gameState,
          moveCount: -5,
        },
      };

      const sanitized = sanitizeGameState(gameStateWithInvalidNumbers);

      // Original should be unchanged
      expect(gameStateWithInvalidNumbers.gameState.moveCount).toBe(-5);
      // Sanitized should be fixed
      expect(sanitized.gameState.moveCount).toBe(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null/undefined inputs gracefully', () => {
      expect(() => validateSerializedGameState(null as any)).not.toThrow();
      expect(() => validateGameMetadata(undefined as any)).not.toThrow();
    });

    it('should handle circular references in validation', () => {
      const circularState = { ...validGameState };
      (circularState as any).circular = circularState;

      expect(() => validateSerializedGameState(circularState)).not.toThrow();
    });

    it('should validate complex nested structures', () => {
      const stateWithComplexMoves = {
        ...validGameState,
        gameState: {
          ...validGameState.gameState,
          moves: [
            {
              from: { file: 4, rank: 1, pos: 12, str_: 'e2' },
              to: { file: 4, rank: 3, pos: 28, str_: 'e4' },
              type: 'normal' as const,
              piece: 'pawn' as const,
              capture: false,
            },
            {
              from: { file: 4, rank: 6, pos: 52, str_: 'e7' },
              to: { file: 4, rank: 4, pos: 36, str_: 'e5' },
              type: 'normal' as const,
              piece: 'pawn' as const,
              capture: false,
            },
          ],
        },
      };

      const result = validateSerializedGameState(stateWithComplexMoves);

      expect(result.valid).toBe(true);
    });
  });
});