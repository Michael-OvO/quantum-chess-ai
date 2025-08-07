/**
 * @file ChessSquare.tsx
 * @purpose Individual chess square component with highlighting and interaction
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.7
 */

'use client';

import React from 'react';
import { Square, isLightSquare } from '@/lib/board/boardUtils';
import { Piece } from '@/lib/board/pieceUtils';
import ChessPiece from './ChessPiece';

interface ChessSquareProps {
  square: Square;
  piece: Piece | null;
  size: number;
  isSelected?: boolean;
  isValidMove?: boolean;
  isLastMove?: boolean;
  isCheck?: boolean;
  quantum?: {
    isEntangled?: boolean;
    isSuperposition?: boolean;
    probability?: number;
  };
  onClick?: (square: Square) => void;
  onDragStart?: (square: Square) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (square: Square) => void;
}

export const ChessSquare: React.FC<ChessSquareProps> = ({
  square,
  piece,
  size,
  isSelected = false,
  isValidMove = false,
  isLastMove = false,
  isCheck = false,
  quantum,
  onClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}) => {
  const isLight = isLightSquare(square);
  
  const handleClick = (): void => {
    if (onClick) {
      onClick(square);
    }
  };
  
  const handleDragStart = (e: React.DragEvent): void => {
    if (piece && onDragStart) {
      e.dataTransfer.effectAllowed = 'move';
      onDragStart(square);
    }
  };
  
  const handleDragEnd = (): void => {
    if (onDragEnd) {
      onDragEnd();
    }
  };
  
  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    if (onDragOver) {
      onDragOver(e);
    }
  };
  
  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    if (onDrop) {
      onDrop(square);
    }
  };
  
  return (
    <div
      className={`
        chess-square relative flex items-center justify-center
        transition-colors duration-200 cursor-pointer
        ${isLight ? 'bg-amber-100' : 'bg-amber-700'}
        ${isSelected ? 'ring-4 ring-green-500 ring-opacity-70' : ''}
        ${isLastMove ? 'bg-opacity-80' : ''}
        ${isCheck ? 'bg-red-500 bg-opacity-50' : ''}
      `}
      style={{
        width: size,
        height: size
      }}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Highlight overlays */}
      {isLastMove && (
        <div className="absolute inset-0 bg-yellow-400 opacity-30 pointer-events-none" />
      )}
      
      {isValidMove && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {piece ? (
            <div className="w-full h-full border-4 border-green-500 border-opacity-60 rounded" />
          ) : (
            <div className="w-3 h-3 bg-green-500 rounded-full opacity-60" />
          )}
        </div>
      )}
      
      {/* Quantum state overlay */}
      {quantum?.isSuperposition && (
        <div className="absolute inset-0 bg-quantum-600 opacity-10 pointer-events-none animate-pulse" />
      )}
      
      {quantum?.isEntangled && (
        <div className="absolute inset-0 bg-blue-500 opacity-10 pointer-events-none" />
      )}
      
      {/* Chess piece */}
      {piece && (
        <div
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className="relative z-10"
        >
          <ChessPiece
            piece={piece}
            size={size * 0.8}
            isSelected={isSelected}
            quantum={quantum}
          />
        </div>
      )}
      
      {/* Debug info (can be removed in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-0 right-0 text-xs text-gray-600 opacity-50 p-0.5">
          {String.fromCharCode(97 + square.file)}{square.rank + 1}
        </div>
      )}
    </div>
  );
};

export default ChessSquare;