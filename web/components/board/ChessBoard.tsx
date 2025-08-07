/**
 * @file ChessBoard.tsx
 * @purpose Main chess board component with full game interaction
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.7
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { QChessGame } from '@/lib/game-engine';
import { 
  Square, 
  notationToSquare, 
  squareToNotation,
  getValidMovesForSquare 
} from '@/lib/board/boardUtils';
import { Piece, parseBoardState } from '@/lib/board/pieceUtils';
import ChessSquare from './ChessSquare';
import BoardNotation from './BoardNotation';

interface ChessBoardProps {
  game: QChessGame;
  onMove?: (from: string, to: string) => void;
  flipped?: boolean;
  showNotation?: boolean;
  highlightLastMove?: boolean;
  allowMoves?: boolean;
  boardSize?: number;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  game,
  onMove,
  flipped = false,
  showNotation = true,
  highlightLastMove = true,
  allowMoves = true,
  boardSize = 640
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [boardState, setBoardState] = useState<(Piece | null)[][]>([]);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);
  
  const squareSize = boardSize / 8;
  
  // Update board state when game changes
  useEffect(() => {
    const whitePieces = game.getWhitePieces();
    const blackPieces = game.getBlackPieces();
    const newBoardState = parseBoardState(whitePieces, blackPieces);
    setBoardState(newBoardState);
  }, [game]);
  
  // Handle square click
  const handleSquareClick = useCallback((square: Square) => {
    if (!allowMoves) return;
    
    // If a square is already selected
    if (selectedSquare) {
      // Check if this is a valid move
      const isValidMove = validMoves.some(move => 
        move.file === square.file && move.rank === square.rank
      );
      
      if (isValidMove) {
        // Make the move
        const from = squareToNotation(selectedSquare);
        const to = squareToNotation(square);
        
        try {
          game.makeMove(from, to);
          setLastMove({ from: selectedSquare, to: square });
          
          if (onMove) {
            onMove(from, to);
          }
          
          // Update board state
          const whitePieces = game.getWhitePieces();
          const blackPieces = game.getBlackPieces();
          setBoardState(parseBoardState(whitePieces, blackPieces));
        } catch (error) {
          console.error('Invalid move:', error);
        }
        
        // Clear selection
        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        // Select new square if it has a piece
        const piece = boardState[square.rank]?.[square.file];
        if (piece) {
          setSelectedSquare(square);
          const moves = getValidMovesForSquare(game, square);
          setValidMoves(moves);
        } else {
          // Clear selection
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else {
      // Select square if it has a piece
      const piece = boardState[square.rank]?.[square.file];
      if (piece) {
        setSelectedSquare(square);
        const moves = getValidMovesForSquare(game, square);
        setValidMoves(moves);
      }
    }
  }, [selectedSquare, validMoves, boardState, game, allowMoves, onMove]);
  
  // Handle drag start
  const handleDragStart = useCallback((square: Square) => {
    if (!allowMoves) return;
    setDraggedSquare(square);
    setSelectedSquare(square);
    const moves = getValidMovesForSquare(game, square);
    setValidMoves(moves);
  }, [game, allowMoves]);
  
  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedSquare(null);
  }, []);
  
  // Handle drop
  const handleDrop = useCallback((square: Square) => {
    if (!allowMoves || !draggedSquare) return;
    
    // Check if this is a valid move
    const isValidMove = validMoves.some(move => 
      move.file === square.file && move.rank === square.rank
    );
    
    if (isValidMove) {
      const from = squareToNotation(draggedSquare);
      const to = squareToNotation(square);
      
      try {
        game.makeMove(from, to);
        setLastMove({ from: draggedSquare, to: square });
        
        if (onMove) {
          onMove(from, to);
        }
        
        // Update board state
        const whitePieces = game.getWhitePieces();
        const blackPieces = game.getBlackPieces();
        setBoardState(parseBoardState(whitePieces, blackPieces));
      } catch (error) {
        console.error('Invalid move:', error);
      }
    }
    
    // Clear selection
    setSelectedSquare(null);
    setValidMoves([]);
    setDraggedSquare(null);
  }, [draggedSquare, validMoves, game, allowMoves, onMove]);
  
  // Render the board
  const renderBoard = (): React.ReactNode => {
    const rows = [];
    
    for (let rank = 7; rank >= 0; rank--) {
      const squares = [];
      
      for (let file = 0; file < 8; file++) {
        const square: Square = { file, rank };
        const piece = boardState[rank]?.[file] || null;
        const isSelected = selectedSquare?.file === file && selectedSquare?.rank === rank;
        const isValidMove = validMoves.some(move => 
          move.file === file && move.rank === rank
        );
        const isLastMoveSquare = highlightLastMove && lastMove && (
          (lastMove.from.file === file && lastMove.from.rank === rank) ||
          (lastMove.to.file === file && lastMove.to.rank === rank)
        );
        
        squares.push(
          <ChessSquare
            key={`${file}-${rank}`}
            square={square}
            piece={piece}
            size={squareSize}
            isSelected={isSelected}
            isValidMove={isValidMove}
            isLastMove={isLastMoveSquare}
            onClick={handleSquareClick}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
          />
        );
      }
      
      rows.push(
        <div key={rank} className="flex">
          {flipped ? squares.reverse() : squares}
        </div>
      );
    }
    
    return flipped ? rows.reverse() : rows;
  };
  
  return (
    <div 
      className="chess-board relative inline-block bg-gray-800 p-8 rounded-lg shadow-2xl"
      style={{ width: boardSize + 64 }}
    >
      <div className="relative" style={{ width: boardSize, height: boardSize }}>
        {renderBoard()}
        
        {showNotation && (
          <BoardNotation
            size={boardSize}
            showFiles
            showRanks
            position="outside"
            flipped={flipped}
          />
        )}
      </div>
    </div>
  );
};

export default ChessBoard;