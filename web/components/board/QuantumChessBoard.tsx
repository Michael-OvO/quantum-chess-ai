/**
 * @file QuantumChessBoard.tsx
 * @purpose Enhanced chess board with quantum move support (split/merge)
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.10
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { QChessGame } from '@/lib/game-engine';
import { 
  Square, 
  notationToSquare, 
  squareToNotation,
  getValidMovesForSquare,
  isSameSquare
} from '@/lib/board/boardUtils';
import { Piece, parseBoardState } from '@/lib/board/pieceUtils';
import ChessSquare from './ChessSquare';
import BoardNotation from './BoardNotation';
import QuantumMoveSelector, { MoveMode } from './QuantumMoveSelector';

interface QuantumChessBoardProps {
  game: QChessGame;
  onMove?: (from: string, to: string, fromSecond?: string, toSecond?: string) => void;
  flipped?: boolean;
  showNotation?: boolean;
  highlightLastMove?: boolean;
  allowMoves?: boolean;
  boardSize?: number;
}

interface QuantumMoveState {
  mode: MoveMode;
  selectedSquares: Square[];
  destinationSquares: Square[];
}

export const QuantumChessBoard: React.FC<QuantumChessBoardProps> = ({
  game,
  onMove,
  flipped = false,
  showNotation = true,
  highlightLastMove = true,
  allowMoves = true,
  boardSize = 640
}) => {
  const [boardState, setBoardState] = useState<(Piece | null)[][]>([]);
  const [quantumMove, setQuantumMove] = useState<QuantumMoveState>({
    mode: 'normal',
    selectedSquares: [],
    destinationSquares: []
  });
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  
  const squareSize = boardSize / 8;
  
  // Update board state when game changes
  useEffect(() => {
    const whitePieces = game.getWhitePieces();
    const blackPieces = game.getBlackPieces();
    const newBoardState = parseBoardState(whitePieces, blackPieces);
    setBoardState(newBoardState);
  }, [game]);
  
  // Keyboard shortcuts for mode switching
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!allowMoves) return;
      
      switch(e.key.toLowerCase()) {
        case 'n':
          setQuantumMove(prev => ({ ...prev, mode: 'normal', selectedSquares: [], destinationSquares: [] }));
          break;
        case 's':
          setQuantumMove(prev => ({ ...prev, mode: 'split', selectedSquares: [], destinationSquares: [] }));
          break;
        case 'm':
          setQuantumMove(prev => ({ ...prev, mode: 'merge', selectedSquares: [], destinationSquares: [] }));
          break;
        case 'escape':
          setQuantumMove(prev => ({ ...prev, selectedSquares: [], destinationSquares: [] }));
          setValidMoves([]);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [allowMoves]);
  
  // Execute quantum move when ready
  const executeQuantumMove = useCallback(() => {
    const { mode, selectedSquares, destinationSquares } = quantumMove;
    
    try {
      if (mode === 'normal' && selectedSquares.length === 1 && destinationSquares.length === 1) {
        // Normal move
        const from = squareToNotation(selectedSquares[0]);
        const to = squareToNotation(destinationSquares[0]);
        
        console.log(`Normal move: ${from} → ${to}`);
        game.makeMove(from, to);
        
        if (onMove) {
          onMove(from, to);
        }
      } else if (mode === 'split' && selectedSquares.length === 1 && destinationSquares.length === 2) {
        // Split move: one piece to two destinations
        const from = squareToNotation(selectedSquares[0]);
        const to1 = squareToNotation(destinationSquares[0]);
        const to2 = squareToNotation(destinationSquares[1]);
        
        console.log(`Split move: ${from} → ${to1} + ${to2}`);
        // For split, we need to pass srcSecond and dstSecond
        // The game interprets this as creating superposition
        game.makeMove(from, to1, from, to2);
        
        if (onMove) {
          onMove(from, to1, from, to2);
        }
      } else if (mode === 'merge' && selectedSquares.length === 2 && destinationSquares.length === 1) {
        // Merge move: two pieces in superposition to one destination
        const from1 = squareToNotation(selectedSquares[0]);
        const from2 = squareToNotation(selectedSquares[1]);
        const to = squareToNotation(destinationSquares[0]);
        
        console.log(`Merge move: ${from1} + ${from2} → ${to}`);
        // For merge, srcSecond is the second source piece
        game.makeMove(from1, to, from2);
        
        if (onMove) {
          onMove(from1, to, from2);
        }
      }
      
      // Update board state
      const whitePieces = game.getWhitePieces();
      const blackPieces = game.getBlackPieces();
      setBoardState(parseBoardState(whitePieces, blackPieces));
      
      // Reset selection
      setQuantumMove(prev => ({ ...prev, selectedSquares: [], destinationSquares: [] }));
      setValidMoves([]);
    } catch (error) {
      console.error('Invalid quantum move:', error);
      // Reset on error
      setQuantumMove(prev => ({ ...prev, selectedSquares: [], destinationSquares: [] }));
      setValidMoves([]);
    }
  }, [quantumMove, game, onMove]);
  
  // Handle square click for quantum moves
  const handleSquareClick = useCallback((square: Square) => {
    if (!allowMoves) return;
    
    const { mode, selectedSquares, destinationSquares } = quantumMove;
    const piece = boardState[square.rank]?.[square.file];
    
    if (mode === 'normal') {
      // Normal move logic
      if (selectedSquares.length === 0) {
        // Select piece
        if (piece) {
          setQuantumMove(prev => ({ ...prev, selectedSquares: [square] }));
          const moves = getValidMovesForSquare(game, square);
          setValidMoves(moves);
        }
      } else {
        // Select destination
        const isValidMove = validMoves.some(move => isSameSquare(move, square));
        if (isValidMove) {
          setQuantumMove(prev => ({ ...prev, destinationSquares: [square] }));
          // Execute immediately for normal moves
          setTimeout(() => executeQuantumMove(), 0);
        } else {
          // Reset if invalid
          setQuantumMove(prev => ({ ...prev, selectedSquares: [], destinationSquares: [] }));
          setValidMoves([]);
        }
      }
    } else if (mode === 'split') {
      // Split move logic
      if (selectedSquares.length === 0) {
        // Select source piece
        if (piece) {
          setQuantumMove(prev => ({ ...prev, selectedSquares: [square] }));
          const moves = getValidMovesForSquare(game, square);
          setValidMoves(moves);
        }
      } else if (destinationSquares.length < 2) {
        // Select destinations (need 2)
        const isValidMove = validMoves.some(move => isSameSquare(move, square));
        if (isValidMove) {
          setQuantumMove(prev => ({ 
            ...prev, 
            destinationSquares: [...prev.destinationSquares, square] 
          }));
          
          // Execute when we have 2 destinations
          if (destinationSquares.length === 1) {
            setTimeout(() => executeQuantumMove(), 0);
          }
        }
      }
    } else if (mode === 'merge') {
      // Merge move logic
      if (selectedSquares.length < 2) {
        // Select source pieces (need 2 in superposition)
        if (piece) {
          // TODO: Check if piece is in superposition
          setQuantumMove(prev => ({ 
            ...prev, 
            selectedSquares: [...prev.selectedSquares, square] 
          }));
          
          if (selectedSquares.length === 1) {
            // After selecting 2 sources, show valid destinations
            const moves = getValidMovesForSquare(game, square);
            setValidMoves(moves);
          }
        }
      } else if (destinationSquares.length === 0) {
        // Select destination
        const isValidMove = validMoves.some(move => isSameSquare(move, square));
        if (isValidMove || !piece) {
          setQuantumMove(prev => ({ ...prev, destinationSquares: [square] }));
          setTimeout(() => executeQuantumMove(), 0);
        }
      }
    }
  }, [quantumMove, boardState, validMoves, game, allowMoves, executeQuantumMove]);
  
  // Render the board
  const renderBoard = (): React.ReactNode => {
    const rows = [];
    
    for (let rank = 7; rank >= 0; rank--) {
      const squares = [];
      
      for (let file = 0; file < 8; file++) {
        const square: Square = { file, rank };
        const piece = boardState[rank]?.[file] || null;
        
        // Determine square highlighting
        const isSelected = quantumMove.selectedSquares.some(s => isSameSquare(s, square));
        const isDestination = quantumMove.destinationSquares.some(s => isSameSquare(s, square));
        const isValidMove = validMoves.some(move => isSameSquare(move, square));
        const isLastMoveSquare = highlightLastMove && lastMove && (
          isSameSquare(lastMove.from, square) || isSameSquare(lastMove.to, square)
        );
        
        // Get quantum state for this square
        // TODO: Get actual quantum probabilities from game
        const quantum = piece ? {
          isSuperposition: false,
          isEntangled: false,
          probability: 1.0
        } : undefined;
        
        squares.push(
          <ChessSquare
            key={`${file}-${rank}`}
            square={square}
            piece={piece}
            size={squareSize}
            isSelected={isSelected || isDestination}
            isValidMove={isValidMove}
            isLastMove={isLastMoveSquare}
            quantum={quantum}
            onClick={handleSquareClick}
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
    <div className="flex flex-col gap-4">
      {/* Quantum Move Selector */}
      <QuantumMoveSelector
        currentMode={quantumMove.mode}
        onModeChange={(mode) => {
          setQuantumMove({ mode, selectedSquares: [], destinationSquares: [] });
          setValidMoves([]);
        }}
        disabled={!allowMoves}
      />
      
      {/* Chess Board */}
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
      
      {/* Move Status */}
      {quantumMove.mode !== 'normal' && (
        <div className="bg-gray-800 rounded-lg p-3 text-sm">
          <div className="text-gray-400">
            {quantumMove.mode === 'split' && (
              <>
                Selected: {quantumMove.selectedSquares.map(s => squareToNotation(s)).join(', ') || 'None'} | 
                Destinations: {quantumMove.destinationSquares.map(s => squareToNotation(s)).join(', ') || 'None'} 
                {quantumMove.destinationSquares.length === 1 && ' (select one more)'}
              </>
            )}
            {quantumMove.mode === 'merge' && (
              <>
                Sources: {quantumMove.selectedSquares.map(s => squareToNotation(s)).join(', ') || 'None'} 
                {quantumMove.selectedSquares.length === 1 && ' (select one more)'} | 
                Destination: {quantumMove.destinationSquares.map(s => squareToNotation(s)).join(', ') || 'None'}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuantumChessBoard;