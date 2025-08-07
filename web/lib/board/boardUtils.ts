/**
 * @file boardUtils.ts
 * @purpose Chess board utility functions for coordinate conversion and board operations
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.7
 */

import { QChessGame } from '@/lib/game-engine';

export type Square = {
  file: number; // 0-7 (a-h)
  rank: number; // 0-7 (1-8)
};

export type SquareNotation = string; // e.g., 'e2', 'a1'

/**
 * Convert algebraic notation to square coordinates
 */
export function notationToSquare(notation: SquareNotation): Square {
  if (notation.length !== 2) {
    throw new Error(`Invalid notation: ${notation}`);
  }
  
  const file = notation.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(notation[1]) - 1;
  
  if (file < 0 || file > 7 || rank < 0 || rank > 7) {
    throw new Error(`Invalid square: ${notation}`);
  }
  
  return { file, rank };
}

/**
 * Convert square coordinates to algebraic notation
 */
export function squareToNotation(square: Square): SquareNotation {
  const file = String.fromCharCode('a'.charCodeAt(0) + square.file);
  const rank = (square.rank + 1).toString();
  return `${file}${rank}`;
}

/**
 * Convert square to BitString index (0-63)
 */
export function squareToIndex(square: Square): number {
  return square.rank * 8 + square.file;
}

/**
 * Convert BitString index to square
 */
export function indexToSquare(index: number): Square {
  if (index < 0 || index > 63) {
    throw new Error(`Invalid index: ${index}`);
  }
  return {
    file: index % 8,
    rank: Math.floor(index / 8)
  };
}

/**
 * Determine if a square should be light or dark
 */
export function isLightSquare(square: Square): boolean {
  return (square.file + square.rank) % 2 === 0;
}

/**
 * Get valid moves for a piece at the given square
 */
export function getValidMovesForSquare(
  game: QChessGame,
  square: Square
): Square[] {
  const notation = squareToNotation(square);
  const validMoves: Square[] = [];
  
  // Check all possible destination squares
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const destSquare = { file, rank };
      const destNotation = squareToNotation(destSquare);
      
      try {
        // Use game engine to validate move
        if (game.isValidMove(notation, destNotation)) {
          validMoves.push(destSquare);
        }
      } catch {
        // Invalid move, skip
      }
    }
  }
  
  return validMoves;
}

/**
 * Check if two squares are the same
 */
export function isSameSquare(a: Square, b: Square): boolean {
  return a.file === b.file && a.rank === b.rank;
}

/**
 * Get all squares between two positions (for move animation)
 */
export function getSquaresBetween(from: Square, to: Square): Square[] {
  const squares: Square[] = [];
  
  const fileDiff = to.file - from.file;
  const rankDiff = to.rank - from.rank;
  
  // Not a straight line
  if (fileDiff !== 0 && rankDiff !== 0 && Math.abs(fileDiff) !== Math.abs(rankDiff)) {
    return squares;
  }
  
  const steps = Math.max(Math.abs(fileDiff), Math.abs(rankDiff));
  const fileStep = fileDiff === 0 ? 0 : fileDiff / Math.abs(fileDiff);
  const rankStep = rankDiff === 0 ? 0 : rankDiff / Math.abs(rankDiff);
  
  for (let i = 1; i < steps; i++) {
    squares.push({
      file: from.file + Math.round(fileStep * i),
      rank: from.rank + Math.round(rankStep * i)
    });
  }
  
  return squares;
}

/**
 * Get board position after move (for animation)
 */
export function calculateSquarePosition(
  square: Square,
  boardSize: number
): { x: number; y: number } {
  const squareSize = boardSize / 8;
  return {
    x: square.file * squareSize,
    y: (7 - square.rank) * squareSize // Flip for white perspective
  };
}