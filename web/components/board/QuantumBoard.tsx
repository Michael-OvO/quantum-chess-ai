/**
 * @file QuantumBoard.tsx
 * @purpose Quantum chess board with simplified mechanics and animations
 * @author AI Agent
 * @date 2025-08-07
 * @refactor Complete rewrite with probability-based quantum states
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuantumStateManager, QuantumPiece as QPiece } from '@/lib/quantum/QuantumStateManager';
import { getValidMoves as getValidMovesForPiece, BoardState } from '@/lib/quantum/moveValidation';
import QuantumPiece from './QuantumPiece';
import QuantumConnections from './QuantumConnections';
import { Piece } from '@/lib/board/pieceUtils';

interface QuantumBoardProps {
  size?: number;
  onMove?: (move: MoveEvent) => void;
  onQuantumStateChange?: (pieces: QPiece[], measurementGroups: Map<string, Set<string>>) => void;
  allowMoves?: boolean;
}

interface MoveEvent {
  type: 'normal' | 'split' | 'merge' | 'capture';
  from: string[];
  to: string[];
  piece: string;
  measured?: boolean;
}

interface DragState {
  pieceId: string;
  startSquare: string;
  currentSquare: string | null;
}

interface MoveMode {
  type: 'normal' | 'split' | 'merge';
  selectedSquares: string[];
  targetSquares: string[];
  selectedPiece: QPiece | null;
}

export const QuantumBoard: React.FC<QuantumBoardProps> = ({
  size = 640,
  onMove,
  onQuantumStateChange,
  allowMoves = true
}) => {
  const [quantum] = useState(() => new QuantumStateManager());
  const [boardDisplay, setBoardDisplay] = useState<Map<string, { piece: QPiece; probability: number }[]>>(new Map());
  const [quantumPieces, setQuantumPieces] = useState<QPiece[]>([]);
  const [moveMode, setMoveMode] = useState<MoveMode>({
    type: 'normal',
    selectedSquares: [],
    targetSquares: [],
    selectedPiece: null
  });
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [highlightedSquares, setHighlightedSquares] = useState<Set<string>>(new Set());
  const [measuringPieces, setMeasuringPieces] = useState<Set<string>>(new Set());
  const [quantumConnections, setQuantumConnections] = useState<any[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  
  const squareSize = size / 8;
  
  // Update board display
  const updateBoardDisplay = useCallback(() => {
    const display = quantum.getBoardDisplay();
    setBoardDisplay(display);
    const allPieces = quantum.getAllPieces();
    setQuantumPieces(allPieces);
    
    // Calculate quantum connections for visualization
    const connections: any[] = [];
    allPieces.forEach(piece => {
      if (piece.positions.size > 1) {
        const positions = Array.from(piece.positions.keys());
        for (let i = 0; i < positions.length - 1; i++) {
          const fromSquare = positions[i];
          const toSquare = positions[i + 1];
          const fromFile = 'abcdefgh'.indexOf(fromSquare[0]);
          const fromRank = parseInt(fromSquare[1]) - 1;
          const toFile = 'abcdefgh'.indexOf(toSquare[0]);
          const toRank = parseInt(toSquare[1]) - 1;
          
          connections.push({
            from: { 
              x: (fromFile * squareSize) + squareSize / 2, 
              y: ((7 - fromRank) * squareSize) + squareSize / 2 
            },
            to: { 
              x: (toFile * squareSize) + squareSize / 2, 
              y: ((7 - toRank) * squareSize) + squareSize / 2 
            },
            type: 'superposition'
          });
        }
      }
    });
    setQuantumConnections(connections);
    
    // Notify parent of quantum state changes
    if (onQuantumStateChange) {
      onQuantumStateChange(allPieces, quantum.getMeasurementGroups());
    }
  }, [quantum, squareSize, onQuantumStateChange]);
  
  // Initialize board only once on mount
  useEffect(() => {
    quantum.initializeClassicalPosition();
    const display = quantum.getBoardDisplay();
    setBoardDisplay(display);
    const allPieces = quantum.getAllPieces();
    setQuantumPieces(allPieces);
    
    // Notify parent of initial state
    if (onQuantumStateChange) {
      onQuantumStateChange(allPieces, quantum.getMeasurementGroups());
    }
  }, []); // Empty dependency array - only run once on mount
  
  // Get square notation from coordinates
  const getSquareFromCoords = (x: number, y: number): string | null => {
    if (!boardRef.current) return null;
    
    const rect = boardRef.current.getBoundingClientRect();
    const relX = x - rect.left;
    const relY = y - rect.top;
    
    if (relX < 0 || relX >= size || relY < 0 || relY >= size) return null;
    
    const file = Math.floor(relX / squareSize);
    const rank = 7 - Math.floor(relY / squareSize);
    
    return `${'abcdefgh'[file]}${rank + 1}`;
  };
  
  // Handle square click
  const handleSquareClick = useCallback((square: string) => {
    if (!allowMoves) return;
    
    const pieces = boardDisplay.get(square) || [];
    const piece = pieces.find(p => p.probability > 0.5)?.piece;
    
    if (moveMode.type === 'normal') {
      if (moveMode.selectedSquares.length === 0) {
        // Select piece
        if (piece) {
          setMoveMode({
            ...moveMode,
            selectedSquares: [square],
            selectedPiece: piece
          });
          
          // Highlight valid moves
          const validMoves = getValidMoves(piece, square);
          setHighlightedSquares(new Set(validMoves));
        }
      } else {
        // Make move
        const from = moveMode.selectedSquares[0];
        
        if (highlightedSquares.has(square)) {
          // Execute normal move
          quantum.makeNormalMove(from, square);
          updateBoardDisplay();
          
          if (onMove) {
            onMove({
              type: 'normal',
              from: [from],
              to: [square],
              piece: moveMode.selectedPiece?.id || ''
            });
          }
        }
        
        // Reset selection
        setMoveMode({
          type: 'normal',
          selectedSquares: [],
          targetSquares: [],
          selectedPiece: null
        });
        setHighlightedSquares(new Set());
      }
    } else if (moveMode.type === 'split') {
      if (moveMode.selectedSquares.length === 0) {
        // Select piece to split
        if (piece && piece.positions.size === 1) {
          setMoveMode({
            ...moveMode,
            selectedSquares: [square],
            selectedPiece: piece
          });
          
          // Highlight valid split destinations
          const validMoves = getValidMoves(piece, square);
          setHighlightedSquares(new Set(validMoves));
        }
      } else if (moveMode.targetSquares.length < 2) {
        // Select split destinations
        if (highlightedSquares.has(square)) {
          const newTargets = [...moveMode.targetSquares, square];
          setMoveMode({
            ...moveMode,
            targetSquares: newTargets
          });
          
          if (newTargets.length === 2) {
            // Execute split move
            const from = moveMode.selectedSquares[0];
            animateSplit(from, newTargets[0], newTargets[1]);
            
            quantum.makeSplitMove(from, newTargets[0], newTargets[1]);
            updateBoardDisplay();
            
            if (onMove) {
              onMove({
                type: 'split',
                from: [from],
                to: newTargets,
                piece: moveMode.selectedPiece?.id || ''
              });
            }
            
            // Reset
            setMoveMode({
              type: 'split',
              selectedSquares: [],
              targetSquares: [],
              selectedPiece: null
            });
            setHighlightedSquares(new Set());
          }
        }
      }
    } else if (moveMode.type === 'merge') {
      // Select pieces in superposition
      const superpositionPieces = Array.from(boardDisplay.entries())
        .filter(([_, pieces]) => pieces.some(p => p.piece.positions.size > 1))
        .map(([sq, pieces]) => ({ square: sq, piece: pieces[0].piece }));
      
      if (moveMode.selectedPiece === null) {
        // Find piece in superposition at this square
        const spPiece = superpositionPieces.find(p => p.square === square);
        if (spPiece) {
          const positions = Array.from(spPiece.piece.positions.keys());
          setMoveMode({
            ...moveMode,
            selectedSquares: positions,
            selectedPiece: spPiece.piece
          });
          
          // Highlight valid merge destinations
          const validMoves = new Set<string>();
          positions.forEach(pos => {
            getValidMoves(spPiece.piece, pos).forEach(move => validMoves.add(move));
          });
          setHighlightedSquares(validMoves);
        }
      } else if (moveMode.targetSquares.length === 0) {
        // Select merge destination
        if (highlightedSquares.has(square)) {
          animateMerge(moveMode.selectedSquares, square);
          
          quantum.makeMergeMove(moveMode.selectedSquares, square);
          updateBoardDisplay();
          
          if (onMove) {
            onMove({
              type: 'merge',
              from: moveMode.selectedSquares,
              to: [square],
              piece: moveMode.selectedPiece.id
            });
          }
          
          // Reset
          setMoveMode({
            type: 'merge',
            selectedSquares: [],
            targetSquares: [],
            selectedPiece: null
          });
          setHighlightedSquares(new Set());
        }
      }
    }
  }, [moveMode, highlightedSquares, boardDisplay, allowMoves, quantum, onMove]);
  
  // Create BoardState adapter for moveValidation
  const boardStateAdapter: BoardState = {
    getPieceAt: (square: string) => {
      const pieces = boardDisplay.get(square) || [];
      const piece = pieces.find(p => p.probability > 0.5);
      return piece ? piece.piece : null;
    },
    getPiecesAt: (square: string) => {
      return boardDisplay.get(square) || [];
    }
  };
  
  // Get valid moves for a piece
  const getValidMoves = (piece: QPiece, from: string): string[] => {
    return getValidMovesForPiece(piece, from, boardStateAdapter);
  };
  
  // Animate split move
  const animateSplit = (from: string, to1: string, to2: string) => {
    // Visual effect will be handled by the QuantumPiece component
    console.log(`Animating split: ${from} → ${to1} + ${to2}`);
  };
  
  // Animate merge move
  const animateMerge = (from: string[], to: string) => {
    // Visual effect will be handled by the QuantumPiece component
    console.log(`Animating merge: ${from.join(' + ')} → ${to}`);
  };
  
  // Animate measurement collapse
  const animateMeasurement = async (pieceId: string, finalSquare: string) => {
    setMeasuringPieces(new Set([pieceId]));
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setMeasuringPieces(new Set());
    updateBoardDisplay();
  };
  
  // Render square
  const renderSquare = (file: number, rank: number) => {
    const square = `${'abcdefgh'[file]}${rank + 1}`;
    const pieces = boardDisplay.get(square) || [];
    const isLight = (file + rank) % 2 === 0;
    const isSelected = moveMode.selectedSquares.includes(square);
    const isTarget = moveMode.targetSquares.includes(square);
    const isHighlighted = highlightedSquares.has(square);
    
    return (
      <motion.div
        key={square}
        className={`
          relative cursor-pointer overflow-hidden
          ${isLight ? 'bg-amber-100' : 'bg-amber-700'}
          ${isSelected ? 'ring-4 ring-blue-500' : ''}
          ${isTarget ? 'ring-4 ring-quantum-500' : ''}
          ${isHighlighted ? 'ring-2 ring-green-400' : ''}
        `}
        style={{ width: squareSize, height: squareSize }}
        onClick={() => handleSquareClick(square)}
        whileHover={{ scale: pieces.length === 0 ? 1.02 : 1 }}
        whileTap={{ scale: pieces.length === 0 ? 0.98 : 1 }}
      >
        {/* Render pieces at this square */}
        <div className="absolute inset-0 flex items-center justify-center">
          {pieces.length > 0 && (
            <div className={`
              ${pieces.length > 1 ? 'grid grid-cols-2 gap-1 p-1' : 'flex items-center justify-center'}
              w-full h-full
            `}>
              {pieces.map(({ piece, probability }, index) => {
                // Map piece types to correct format
                const pieceTypeMap: Record<string, any> = {
                  'K': 'king', 'Q': 'queen', 'R': 'rook', 
                  'B': 'bishop', 'N': 'knight', 'P': 'pawn'
                };
                
                const pieceObj: Piece = {
                  type: pieceTypeMap[piece.type] || piece.type.toLowerCase(),
                  color: piece.color
                };
                
                // Ensure we have a valid key (never empty string)
                const pieceKey = (piece.id && piece.id !== '') ? piece.id : `piece-${square}-${index}`;
                
                // Adjust size based on number of pieces
                const pieceSize = pieces.length > 1 ? squareSize * 0.4 : squareSize * 0.8;
                
                return (
                  <div
                    key={pieceKey}
                    className="flex items-center justify-center"
                    style={{ zIndex: 10 + index }}
                  >
                    <QuantumPiece
                      piece={pieceObj}
                      probability={probability}
                      isSelected={isSelected && moveMode.selectedPiece?.id === piece.id}
                      isSuperposition={piece.positions.size > 1}
                      isEntangled={!!piece.measurementGroupId}
                      isMeasuring={measuringPieces.has(piece.id)}
                      size={pieceSize}
                      onClick={() => handleSquareClick(square)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Square notation */}
        {file === 0 && (
          <div className="absolute bottom-1 left-1 text-xs opacity-50">
            {rank + 1}
          </div>
        )}
        {rank === 0 && (
          <div className="absolute bottom-1 right-1 text-xs opacity-50">
            {'abcdefgh'[file]}
          </div>
        )}
      </motion.div>
    );
  };
  
  return (
    <div className="flex flex-col gap-4">
        {/* Mode selector */}
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded ${moveMode.type === 'normal' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            onClick={() => {
              setMoveMode({ type: 'normal', selectedSquares: [], targetSquares: [], selectedPiece: null });
              setHighlightedSquares(new Set());
            }}
          >
            Normal Move
          </button>
          <button
            className={`px-4 py-2 rounded ${moveMode.type === 'split' ? 'bg-quantum-600 text-white' : 'bg-gray-200'}`}
            onClick={() => {
              setMoveMode({ type: 'split', selectedSquares: [], targetSquares: [], selectedPiece: null });
              setHighlightedSquares(new Set());
            }}
          >
            Split (Superposition)
          </button>
          <button
            className={`px-4 py-2 rounded ${moveMode.type === 'merge' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
            onClick={() => {
              setMoveMode({ type: 'merge', selectedSquares: [], targetSquares: [], selectedPiece: null });
              setHighlightedSquares(new Set());
            }}
          >
            Merge (Collapse)
          </button>
        </div>
        
        {/* Instructions */}
        <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
          {moveMode.type === 'normal' && 'Click a piece, then click destination to move'}
          {moveMode.type === 'split' && 'Click a piece, then select TWO destinations to create superposition'}
          {moveMode.type === 'merge' && 'Click a piece in superposition, then select destination to collapse'}
        </div>
        
        {/* Chess board with quantum connections */}
        <div className="relative inline-block">
          <div
            ref={boardRef}
            className="border-4 border-gray-800 shadow-2xl relative"
            style={{ width: size, height: size }}
          >
            {[7, 6, 5, 4, 3, 2, 1, 0].map(rank => (
              <div key={`row-${rank}`} className="flex">
                {[0, 1, 2, 3, 4, 5, 6, 7].map(file => renderSquare(file, rank))}
              </div>
            ))}
            {/* Quantum connections overlay */}
            <QuantumConnections 
              connections={quantumConnections} 
              boardSize={size}
            />
          </div>
        </div>
        
        {/* Quantum state info */}
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-quantum-500 rounded-full animate-pulse"></div>
            <span>Superposition - Piece exists in multiple positions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
            <span>Entanglement - Pieces are quantum linked</span>
          </div>
        </div>
    </div>
  );
};

export default QuantumBoard;