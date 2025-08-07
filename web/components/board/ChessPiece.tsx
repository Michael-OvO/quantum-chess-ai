/**
 * @file ChessPiece.tsx
 * @purpose Chess piece rendering component with quantum state visualization
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.7
 */

'use client';

import React from 'react';
import { Piece, getPieceUnicode } from '@/lib/board/pieceUtils';

interface ChessPieceProps {
  piece: Piece;
  size?: number;
  isSelected?: boolean;
  isDragging?: boolean;
  quantum?: {
    isEntangled?: boolean;
    isSuperposition?: boolean;
    probability?: number;
  };
}

export const ChessPiece: React.FC<ChessPieceProps> = ({
  piece,
  size = 48,
  isSelected = false,
  isDragging = false,
  quantum
}) => {
  const unicode = getPieceUnicode(piece);
  
  // Calculate opacity based on quantum probability
  const opacity = quantum?.probability !== undefined 
    ? Math.max(0.3, quantum.probability)
    : 1;
  
  return (
    <div
      className={`
        chess-piece relative flex items-center justify-center
        transition-all duration-300 select-none cursor-pointer
        ${isDragging ? 'opacity-50 scale-110' : ''}
        ${isSelected ? 'scale-105' : 'hover:scale-105'}
      `}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.85,
        opacity: opacity
      }}
    >
      {/* Quantum state indicators */}
      {quantum?.isSuperposition && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 rounded-full bg-quantum-600 opacity-30 animate-pulse" />
          <div className="absolute inset-1 rounded-full border-2 border-quantum-500 opacity-60" />
        </div>
      )}
      
      {quantum?.isEntangled && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping" />
          <div className="absolute inset-2 rounded-full border border-blue-400 opacity-40" />
        </div>
      )}
      
      {/* Piece unicode symbol */}
      <span
        className={`
          relative z-10 leading-none
          ${piece.color === 'white' ? 'text-white drop-shadow-lg' : 'text-gray-900'}
          ${isSelected ? 'drop-shadow-xl' : ''}
        `}
        style={{
          filter: piece.color === 'white' 
            ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' 
            : 'drop-shadow(0 1px 2px rgba(255,255,255,0.3))'
        }}
      >
        {unicode}
      </span>
      
      {/* Probability indicator */}
      {quantum?.probability !== undefined && quantum.probability < 1 && (
        <div className="absolute -bottom-1 -right-1 bg-quantum-700 text-white text-xs px-1 rounded">
          {Math.round(quantum.probability * 100)}%
        </div>
      )}
    </div>
  );
};

export default ChessPiece;