/**
 * @file types.ts
 * @purpose Type definitions for quantum chess game engine
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.5
 */

export type Color = 'white' | 'black';
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type GameStatus = 'pending' | 'active' | 'completed' | 'abandoned';
export type MoveType = 'normal' | 'split' | 'merge' | 'blocked' | 'capture';

// Piece character mapping
export type PieceChar = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | 'k' | 'q' | 'r' | 'b' | 'n' | 'p';

export interface ChessPosition {
  file: number; // 0-7 (a-h)
  rank: number; // 0-7 (1-8)
  pos: number; // 0-63 calculated position
  str_: string; // algebraic notation like 'e4'
}

export interface QuantumPiece {
  type: PieceType;
  color: Color;
  char: PieceChar;
  probability: number;
}

export interface QuantumBoard {
  pieces: (QuantumPiece | null)[];
  probabilities: number[];
  correlationMatrix: number[][];
}

export interface QuantumMove {
  from: ChessPosition;
  to: ChessPosition;
  type: MoveType;
  piece: PieceType;
  fromSecond?: ChessPosition; // For merge moves
  toSecond?: ChessPosition;   // For split moves
  promotion?: PieceType;
  capture?: boolean;
  probability?: number;
}

export interface GameState {
  id: string;
  board: QuantumBoard;
  currentPlayer: Color;
  moves: QuantumMove[];
  capturedPieces: QuantumPiece[];
  status: GameStatus;
  winner?: Color;
  moveCount: number;
  canCastle: {
    whiteKingSide: boolean;
    whiteQueenSide: boolean;
    blackKingSide: boolean;
    blackQueenSide: boolean;
  };
  enPassant?: ChessPosition;
  createdAt: Date;
  updatedAt: Date;
}

// Sparse quantum state representation
export interface QuantumCoeff {
  [bitstring: string]: Complex;
}

export interface Complex {
  real: number;
  imag: number;
}

// Quantum operation types
export type QuantumOperation = 
  | { type: 'normal_jump'; src: number; dst: number }
  | { type: 'split_jump'; src: number; dst1: number; dst2: number }
  | { type: 'merge_jump'; src1: number; src2: number; dst: number }
  | { type: 'blocked_slide'; src: number; dst: number; path: number[] }
  | { type: 'measure'; position: number };

// Validation result types
export type MoveValidationResult = 
  | 'valid'
  | 'invalid-no-piece'
  | 'invalid-wrong-color'
  | 'invalid-path-blocked'
  | 'invalid-out-of-bounds'
  | 'invalid-piece-movement'
  | 'invalid-in-check'
  | 'invalid-castle-conditions';

// Chess piece constants
export const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 1000,
};

export const INITIAL_BOARD_STATE = 0xFFFF00000000FFFF; // 64-bit initial position
export const INITIAL_TAG_LIST = 'RNBQKBNRPPPPPPPPpppppppprnbqkbnr';