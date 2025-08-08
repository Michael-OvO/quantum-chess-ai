/**
 * @file moveValidation.ts
 * @purpose Chess move validation for quantum chess
 * @author AI Agent
 * @date 2025-08-07
 * @refactor Clean move validation without complex logic
 */

import { QuantumPiece } from './QuantumStateManager';

export interface BoardState {
  getPieceAt: (square: string) => QuantumPiece | null;
  getPiecesAt: (square: string) => { piece: QuantumPiece; probability: number }[];
}

export interface Position {
  file: number; // 0-7 (a-h)
  rank: number; // 0-7 (1-8)
}

/**
 * Convert square notation to position
 */
export function squareToPosition(square: string): Position {
  const file = 'abcdefgh'.indexOf(square[0]);
  const rank = parseInt(square[1]) - 1;
  return { file, rank };
}

/**
 * Convert position to square notation
 */
export function positionToSquare(pos: Position): string {
  return `${'abcdefgh'[pos.file]}${pos.rank + 1}`;
}

/**
 * Check if position is on board
 */
export function isOnBoard(pos: Position): boolean {
  return pos.file >= 0 && pos.file < 8 && pos.rank >= 0 && pos.rank < 8;
}

/**
 * Get all valid moves for a piece
 */
export function getValidMoves(
  piece: QuantumPiece,
  from: string,
  board: BoardState
): string[] {
  const moves: string[] = [];
  const fromPos = squareToPosition(from);
  
  switch (piece.type) {
    case 'P':
      moves.push(...getPawnMoves(piece, fromPos, board));
      break;
    case 'N':
      moves.push(...getKnightMoves(piece, fromPos, board));
      break;
    case 'B':
      moves.push(...getBishopMoves(piece, fromPos, board));
      break;
    case 'R':
      moves.push(...getRookMoves(piece, fromPos, board));
      break;
    case 'Q':
      moves.push(...getQueenMoves(piece, fromPos, board));
      break;
    case 'K':
      moves.push(...getKingMoves(piece, fromPos, board));
      break;
  }
  
  return moves;
}

/**
 * Get pawn moves
 */
function getPawnMoves(piece: QuantumPiece, from: Position, board: BoardState): string[] {
  const moves: string[] = [];
  const direction = piece.color === 'white' ? 1 : -1;
  const startRank = piece.color === 'white' ? 1 : 6;
  
  // Forward move
  const oneForward: Position = { file: from.file, rank: from.rank + direction };
  if (isOnBoard(oneForward)) {
    const oneForwardSquare = positionToSquare(oneForward);
    const pieceAtOneForward = board.getPieceAt(oneForwardSquare);
    if (!pieceAtOneForward) {
      moves.push(oneForwardSquare);
      
      // Two squares forward from starting position
      if (from.rank === startRank) {
        const twoForward: Position = { file: from.file, rank: from.rank + (2 * direction) };
        const twoForwardSquare = positionToSquare(twoForward);
        const pieceAtTwoForward = board.getPieceAt(twoForwardSquare);
        if (!pieceAtTwoForward) {
          moves.push(twoForwardSquare);
        }
      }
    }
  }
  
  // Diagonal captures
  const diagonals = [
    { file: from.file - 1, rank: from.rank + direction },
    { file: from.file + 1, rank: from.rank + direction }
  ];
  
  for (const diag of diagonals) {
    if (isOnBoard(diag)) {
      const diagSquare = positionToSquare(diag);
      const pieceAtDiag = board.getPieceAt(diagSquare);
      if (pieceAtDiag && pieceAtDiag.color !== piece.color) {
        moves.push(diagSquare);
      }
    }
  }
  
  return moves;
}

/**
 * Get knight moves
 */
function getKnightMoves(piece: QuantumPiece, from: Position, board: BoardState): string[] {
  const moves: string[] = [];
  const knightOffsets = [
    [2, 1], [2, -1], [-2, 1], [-2, -1],
    [1, 2], [1, -2], [-1, 2], [-1, -2]
  ];
  
  for (const [df, dr] of knightOffsets) {
    const newPos: Position = { file: from.file + df, rank: from.rank + dr };
    if (isOnBoard(newPos)) {
      const square = positionToSquare(newPos);
      const pieceAt = board.getPieceAt(square);
      if (!pieceAt || pieceAt.color !== piece.color) {
        moves.push(square);
      }
    }
  }
  
  return moves;
}

/**
 * Get bishop moves
 */
function getBishopMoves(piece: QuantumPiece, from: Position, board: BoardState): string[] {
  const moves: string[] = [];
  const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  
  for (const [df, dr] of directions) {
    for (let i = 1; i < 8; i++) {
      const newPos: Position = { 
        file: from.file + (df * i), 
        rank: from.rank + (dr * i) 
      };
      
      if (!isOnBoard(newPos)) break;
      
      const square = positionToSquare(newPos);
      const pieceAt = board.getPieceAt(square);
      
      if (!pieceAt) {
        moves.push(square);
      } else {
        if (pieceAt.color !== piece.color) {
          moves.push(square);
        }
        break; // Can't move past any piece
      }
    }
  }
  
  return moves;
}

/**
 * Get rook moves
 */
function getRookMoves(piece: QuantumPiece, from: Position, board: BoardState): string[] {
  const moves: string[] = [];
  const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  
  for (const [df, dr] of directions) {
    for (let i = 1; i < 8; i++) {
      const newPos: Position = { 
        file: from.file + (df * i), 
        rank: from.rank + (dr * i) 
      };
      
      if (!isOnBoard(newPos)) break;
      
      const square = positionToSquare(newPos);
      const pieceAt = board.getPieceAt(square);
      
      if (!pieceAt) {
        moves.push(square);
      } else {
        if (pieceAt.color !== piece.color) {
          moves.push(square);
        }
        break; // Can't move past any piece
      }
    }
  }
  
  return moves;
}

/**
 * Get queen moves (combination of rook and bishop)
 */
function getQueenMoves(piece: QuantumPiece, from: Position, board: BoardState): string[] {
  return [
    ...getRookMoves(piece, from, board),
    ...getBishopMoves(piece, from, board)
  ];
}

/**
 * Get king moves
 */
function getKingMoves(piece: QuantumPiece, from: Position, board: BoardState): string[] {
  const moves: string[] = [];
  const kingOffsets = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];
  
  for (const [df, dr] of kingOffsets) {
    const newPos: Position = { file: from.file + df, rank: from.rank + dr };
    if (isOnBoard(newPos)) {
      const square = positionToSquare(newPos);
      const pieceAt = board.getPieceAt(square);
      if (!pieceAt || pieceAt.color !== piece.color) {
        moves.push(square);
      }
    }
  }
  
  // TODO: Add castling logic
  
  return moves;
}

/**
 * Check if a move would trigger measurement
 */
export function wouldTriggerMeasurement(
  piece: QuantumPiece,
  targetSquare: string,
  board: BoardState
): boolean {
  // Measurement is triggered when:
  // 1. A capture would violate no-double-occupancy
  // 2. Two pieces of different types/colors would occupy same square
  
  const occupants = board.getPiecesAt(targetSquare);
  
  for (const { piece: occupant } of occupants) {
    if (occupant.id !== piece.id) {
      // Different pieces trying to occupy same square
      if (occupant.type !== piece.type || occupant.color !== piece.color) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Validate if a split move is legal
 */
export function isValidSplitMove(
  piece: QuantumPiece,
  from: string,
  to1: string,
  to2: string,
  board: BoardState
): boolean {
  // Piece must be in classical state (not already in superposition)
  if (piece.positions.size > 1) {
    return false;
  }
  
  // Both destinations must be valid moves
  const validMoves = getValidMoves(piece, from, board);
  if (!validMoves.includes(to1) || !validMoves.includes(to2)) {
    return false;
  }
  
  // Destinations must be different
  if (to1 === to2) {
    return false;
  }
  
  return true;
}

/**
 * Validate if a merge move is legal
 */
export function isValidMergeMove(
  piece: QuantumPiece,
  positions: string[],
  to: string,
  board: BoardState
): boolean {
  // Piece must be in superposition
  if (piece.positions.size <= 1) {
    return false;
  }
  
  // All positions must belong to this piece
  for (const pos of positions) {
    if (!piece.positions.has(pos)) {
      return false;
    }
  }
  
  // Destination must be valid from at least one position
  for (const pos of positions) {
    const validMoves = getValidMoves(piece, pos, board);
    if (validMoves.includes(to)) {
      return true;
    }
  }
  
  return false;
}