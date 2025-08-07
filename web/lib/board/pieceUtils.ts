/**
 * @file pieceUtils.ts
 * @purpose Chess piece rendering utilities and piece-related functions
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.7
 */

export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PieceColor = 'white' | 'black';

export interface Piece {
  type: PieceType;
  color: PieceColor;
  isQuantum?: boolean;
  probability?: number; // 0-1 for quantum pieces
}

/**
 * Unicode chess piece symbols
 */
export const PIECE_UNICODE: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙'
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟'
  }
};

/**
 * Parse piece from FEN character
 */
export function parsePieceFromFEN(char: string): Piece | null {
  const isWhite = char === char.toUpperCase();
  const color: PieceColor = isWhite ? 'white' : 'black';
  
  const pieceMap: Record<string, PieceType> = {
    'k': 'king',
    'q': 'queen',
    'r': 'rook',
    'b': 'bishop',
    'n': 'knight',
    'p': 'pawn'
  };
  
  const type = pieceMap[char.toLowerCase()];
  if (!type) return null;
  
  return { type, color };
}

/**
 * Convert piece to FEN character
 */
export function pieceToFEN(piece: Piece): string {
  const fenMap: Record<PieceType, string> = {
    king: 'k',
    queen: 'q',
    rook: 'r',
    bishop: 'b',
    knight: 'n',
    pawn: 'p'
  };
  
  const char = fenMap[piece.type];
  return piece.color === 'white' ? char.toUpperCase() : char;
}

/**
 * Get Unicode symbol for a piece
 */
export function getPieceUnicode(piece: Piece): string {
  return PIECE_UNICODE[piece.color][piece.type];
}

/**
 * Get piece value for evaluation
 */
export function getPieceValue(type: PieceType): number {
  const values: Record<PieceType, number> = {
    king: 0,    // King is invaluable
    queen: 9,
    rook: 5,
    bishop: 3,
    knight: 3,
    pawn: 1
  };
  return values[type];
}

/**
 * Parse board state from game engine BitString format
 * Returns a 2D array of pieces indexed by [rank][file]
 */
export function parseBoardState(whitePieces: bigint, blackPieces: bigint): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Standard starting position piece types by rank and file
  const startingPosition: (PieceType | null)[][] = [
    ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'], // Rank 1
    ['pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'],         // Rank 2
    [null, null, null, null, null, null, null, null],                          // Rank 3
    [null, null, null, null, null, null, null, null],                          // Rank 4
    [null, null, null, null, null, null, null, null],                          // Rank 5
    [null, null, null, null, null, null, null, null],                          // Rank 6
    ['pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn'],         // Rank 7
    ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']  // Rank 8
  ];
  
  // Check each square
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const index = rank * 8 + file;
      const mask = BigInt(1) << BigInt(index);
      
      if ((whitePieces & mask) !== BigInt(0)) {
        // White piece at this position
        const pieceType = getPieceTypeAtPosition(rank, file, startingPosition);
        if (pieceType) {
          board[rank][file] = { type: pieceType, color: 'white' };
        }
      } else if ((blackPieces & mask) !== BigInt(0)) {
        // Black piece at this position
        const pieceType = getPieceTypeAtPosition(rank, file, startingPosition);
        if (pieceType) {
          board[rank][file] = { type: pieceType, color: 'black' };
        }
      }
    }
  }
  
  return board;
}

/**
 * Determine piece type based on starting position
 * This is a simplified version - in a real game we'd track piece movements
 */
function getPieceTypeAtPosition(
  rank: number,
  file: number,
  startingPosition: (PieceType | null)[][]
): PieceType | null {
  // For now, assume pieces maintain their starting types
  // In a full implementation, we'd track piece movements and promotions
  if (rank === 0 || rank === 7) {
    return startingPosition[rank][file];
  } else if (rank === 1 || rank === 6) {
    return 'pawn';
  }
  
  // For pieces that have moved, default to pawn
  // This would need proper move tracking in production
  return 'pawn';
}

/**
 * Check if a piece can be promoted
 */
export function canPromote(piece: Piece, rank: number): boolean {
  if (piece.type !== 'pawn') return false;
  
  return (piece.color === 'white' && rank === 7) ||
         (piece.color === 'black' && rank === 0);
}

/**
 * Get piece CSS classes for styling
 */
export function getPieceClasses(piece: Piece): string {
  const classes = [
    'chess-piece',
    `piece-${piece.color}`,
    `piece-${piece.type}`
  ];
  
  if (piece.isQuantum) {
    classes.push('piece-quantum');
    if (piece.probability !== undefined) {
      if (piece.probability < 0.3) classes.push('piece-faint');
      else if (piece.probability < 0.7) classes.push('piece-medium');
      else classes.push('piece-solid');
    }
  }
  
  return classes.join(' ');
}