/**
 * @file index.ts
 * @purpose Export barrel file for chess board components
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.7
 */

export { ChessBoard } from './ChessBoard';
export { ChessSquare } from './ChessSquare';
export { ChessPiece } from './ChessPiece';
export { BoardNotation } from './BoardNotation';
export { QuantumIndicator } from './QuantumIndicator';

// Re-export types
export type { Square, SquareNotation } from '@/lib/board/boardUtils';
export type { Piece, PieceType, PieceColor } from '@/lib/board/pieceUtils';