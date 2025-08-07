/**
 * @file utils.ts
 * @purpose Utility functions for quantum chess game engine
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.5
 */

import type { ChessPosition, PieceChar, PieceType, Color, Complex } from './types';

/**
 * Convert string position like 'e4' to integer (0-63)
 */
export function convertPosToInt(pos: string | ChessPosition): number {
  if (typeof pos === 'object') {
    return pos.pos;
  }
  
  if (pos.length !== 2) {
    throw new Error(`Invalid position: ${pos}`);
  }
  
  const file = pos.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
  const rank = parseInt(pos[1], 10) - 1; // '1' = 0, '2' = 1, etc.
  
  if (file < 0 || file > 7 || rank < 0 || rank > 7) {
    throw new Error(`Invalid position: ${pos}`);
  }
  
  return file + rank * 8;
}

/**
 * Convert integer position (0-63) to ChessPosition object
 */
export function intToPosition(pos: number): ChessPosition {
  if (pos < 0 || pos > 63) {
    throw new Error(`Invalid position: ${pos}`);
  }
  
  const file = pos % 8;
  const rank = Math.floor(pos / 8);
  const str_ = String.fromCharCode(97 + file) + (rank + 1);
  
  return { file, rank, pos, str_ };
}

/**
 * Convert multiple positions to ChessPosition objects
 */
export function strNoneToPosition(...positions: (string | null)[]): (ChessPosition | null)[] {
  return positions.map(pos => pos ? intToPosition(convertPosToInt(pos)) : null);
}

/**
 * Convert integer to bit string representation
 */
export function intToBitStr(value: number, length: number): string {
  return value.toString(2).padStart(length, '0');
}

/**
 * Convert bit array to integer
 */
export function bitArrayToInt(bits: number[]): number {
  let result = 0;
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === 1) {
      result |= (1 << i);
    }
  }
  return result;
}

/**
 * Get path between two positions for sliding pieces
 */
export function getTwoPointPath(from: ChessPosition, to: ChessPosition): number[] {
  const path: number[] = [];
  const fromFile = from.file;
  const fromRank = from.rank;
  const toFile = to.file;
  const toRank = to.rank;
  
  const fileStep = toFile === fromFile ? 0 : (toFile > fromFile ? 1 : -1);
  const rankStep = toRank === fromRank ? 0 : (toRank > fromRank ? 1 : -1);
  
  let currentFile = fromFile + fileStep;
  let currentRank = fromRank + rankStep;
  
  while (currentFile !== toFile || currentRank !== toRank) {
    path.push(currentFile + currentRank * 8);
    currentFile += fileStep;
    currentRank += rankStep;
  }
  
  return path;
}

/**
 * Check if piece character is white
 */
export function isWhitePiece(piece: PieceChar): boolean {
  return piece === piece.toUpperCase();
}

/**
 * Get color from piece character
 */
export function getColorFromPiece(piece: PieceChar): Color {
  return isWhitePiece(piece) ? 'white' : 'black';
}

/**
 * Get piece type from character
 */
export function getPieceTypeFromChar(piece: PieceChar): PieceType {
  const lowerPiece = piece.toLowerCase();
  switch (lowerPiece) {
    case 'k': return 'king';
    case 'q': return 'queen';
    case 'r': return 'rook';
    case 'b': return 'bishop';
    case 'n': return 'knight';
    case 'p': return 'pawn';
    default: throw new Error(`Invalid piece character: ${piece}`);
  }
}

/**
 * Get character from piece type and color
 */
export function getCharFromPiece(type: PieceType, color: Color): PieceChar {
  const baseChar = type === 'king' ? 'k'
    : type === 'queen' ? 'q'
    : type === 'rook' ? 'r'
    : type === 'bishop' ? 'b'
    : type === 'knight' ? 'n'
    : 'p';
  
  return (color === 'white' ? baseChar.toUpperCase() : baseChar) as PieceChar;
}

/**
 * Complex number operations
 */
export const ComplexMath = {
  add: (a: Complex, b: Complex): Complex => ({
    real: a.real + b.real,
    imag: a.imag + b.imag,
  }),
  
  multiply: (a: Complex, b: Complex): Complex => ({
    real: a.real * b.real - a.imag * b.imag,
    imag: a.real * b.imag + a.imag * b.real,
  }),
  
  magnitude: (a: Complex): number => 
    Math.sqrt(a.real * a.real + a.imag * a.imag),
  
  conjugate: (a: Complex): Complex => ({
    real: a.real,
    imag: -a.imag,
  }),
  
  scale: (a: Complex, factor: number): Complex => ({
    real: a.real * factor,
    imag: a.imag * factor,
  }),
  
  zero: (): Complex => ({ real: 0, imag: 0 }),
  one: (): Complex => ({ real: 1, imag: 0 }),
  i: (): Complex => ({ real: 0, imag: 1 }),
};

/**
 * Validate if a move is within board bounds
 */
export function isValidPosition(pos: number): boolean {
  return pos >= 0 && pos < 64;
}

/**
 * Check if path is clear (no pieces blocking)
 */
export function isPathClear(path: number[], board: (PieceChar | null)[]): boolean {
  return path.every(pos => board[pos] === null);
}

/**
 * Generate random seed
 */
export function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

/**
 * Simple pseudo-random number generator with seed
 */
export class SeededRandom {
  private seed: number;
  
  constructor(seed?: number) {
    this.seed = seed ?? generateSeed();
  }
  
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
  
  setSeed(seed: number): void {
    this.seed = seed;
  }
  
  getSeed(): number {
    return this.seed;
  }
}