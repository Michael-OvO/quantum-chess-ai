/**
 * @file page.tsx
 * @purpose Game page displaying the interactive chess board
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.7
 * @refactor Using new simplified QuantumBoard
 */

'use client';

import React, { useState, useEffect } from 'react';
import QuantumBoard from '@/components/board/QuantumBoard';
import QuantumStatePanelCompact from '@/components/quantum/QuantumStatePanelCompact';
import QuantumDrawer from '@/components/quantum/QuantumDrawer';
import { QuantumPiece } from '@/lib/quantum/QuantumStateManager';

interface MoveEvent {
  type: 'normal' | 'split' | 'merge' | 'capture';
  from: string[];
  to: string[];
  piece: string;
  measured?: boolean;
}

export default function GamePage(): React.ReactElement {
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [currentTurn, setCurrentTurn] = useState<'white' | 'black'>('white');
  const [gameStatus, setGameStatus] = useState<string>('active');
  const [quantumStates, setQuantumStates] = useState<Map<string, number>>(new Map());
  const [quantumPieces, setQuantumPieces] = useState<QuantumPiece[]>([]);
  const [measurementGroups, setMeasurementGroups] = useState<Map<string, Set<string>>>(new Map());
  const [isQuantumDrawerOpen, setIsQuantumDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Handle move events from the board
  const handleMove = (move: MoveEvent): void => {
    let moveNotation = '';
    
    switch (move.type) {
      case 'normal':
        moveNotation = `${move.from[0]} → ${move.to[0]}`;
        break;
      case 'split':
        moveNotation = `${move.from[0]} ⟨${move.to[0]}|${move.to[1]}⟩`;
        break;
      case 'merge':
        moveNotation = `⟨${move.from.join('|')}⟩ → ${move.to[0]}`;
        break;
      case 'capture':
        moveNotation = `${move.from[0]} ✕ ${move.to[0]}`;
        if (move.measured) {
          moveNotation += ' (measured)';
        }
        break;
    }
    
    setMoveHistory(prev => [...prev, moveNotation]);
    setCurrentTurn(prev => prev === 'white' ? 'black' : 'white');
    
    // Update quantum states display
    if (move.type === 'split') {
      setQuantumStates(prev => {
        const next = new Map(prev);
        move.to.forEach(sq => next.set(sq, 0.5));
        return next;
      });
    } else if (move.type === 'merge') {
      setQuantumStates(prev => {
        const next = new Map(prev);
        move.from.forEach(sq => next.delete(sq));
        return next;
      });
    }
  };
  
  // Handle quantum state changes from the board
  const handleQuantumStateChange = (
    pieces: QuantumPiece[], 
    groups: Map<string, Set<string>>
  ): void => {
    setQuantumPieces(pieces);
    setMeasurementGroups(groups);
  };
  
  // Reset game
  const resetGame = (): void => {
    setMoveHistory([]);
    setCurrentTurn('white');
    setGameStatus('active');
    setQuantumStates(new Map());
    setQuantumPieces([]);
    setMeasurementGroups(new Map());
    // The board will reset itself when remounted
    window.location.reload();
  };
  
  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-quantum-500 to-quantum-700 bg-clip-text text-transparent">
            Quantum Chess Game
          </h1>
          <p className="text-gray-400">
            Experience chess with quantum mechanics - pieces can exist in superposition and become entangled!
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chess Board */}
          <div className="lg:col-span-2 flex justify-center">
            <QuantumBoard
              size={Math.min(640, typeof window !== 'undefined' ? window.innerWidth - 100 : 640)}
              onMove={handleMove}
              onQuantumStateChange={handleQuantumStateChange}
              allowMoves
            />
          </div>
          
          {/* Game Info Panel */}
          <div className="space-y-6 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
            {/* Game Status */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Game Status</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Turn:</span>
                  <span className={`font-semibold ${currentTurn === 'white' ? 'text-white' : 'text-gray-700 bg-white px-2 rounded'}`}>
                    {currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-semibold ${
                    gameStatus === 'checkmate' ? 'text-red-500' :
                    gameStatus === 'check' ? 'text-yellow-500' :
                    gameStatus === 'stalemate' ? 'text-gray-500' :
                    'text-green-500'
                  }`}>
                    {gameStatus.charAt(0).toUpperCase() + gameStatus.slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Moves:</span>
                  <span>{moveHistory.length}</span>
                </div>
              </div>
            </div>
            
            {/* Move History */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Move History</h2>
              
              <div className="max-h-60 overflow-y-auto space-y-1">
                {moveHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm">No moves yet</p>
                ) : (
                  moveHistory.map((move, index) => (
                    <div key={`move-${index}`} className="flex text-sm">
                      <span className="text-gray-500 w-8">{Math.floor(index / 2) + 1}.</span>
                      <span className={index % 2 === 0 ? 'text-white' : 'text-gray-400'}>
                        {move}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Quantum States Panel - Desktop */}
            <div className="hidden lg:block">
              <QuantumStatePanelCompact
                pieces={quantumPieces}
                measurementGroups={measurementGroups}
              />
            </div>
            
            {/* Mobile Quantum Button */}
            {isMobile && quantumPieces.filter(p => p.positions.size > 1).length > 0 && (
              <button
                onClick={() => setIsQuantumDrawerOpen(true)}
                className="lg:hidden w-full px-4 py-3 bg-quantum-600 hover:bg-quantum-700 
                         text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-xl">⚛️</span>
                View Quantum States
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                  {quantumPieces.filter(p => p.positions.size > 1).length}
                </span>
              </button>
            )}
            
            {/* Controls */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Controls</h2>
              
              <div className="space-y-3">
                <button
                  onClick={resetGame}
                  className="w-full px-4 py-2 bg-quantum-600 hover:bg-quantum-700 rounded-lg transition-colors"
                >
                  New Game
                </button>
                
                <button
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors opacity-50 cursor-not-allowed"
                  disabled
                >
                  Undo Move (Coming Soon)
                </button>
                
                <button
                  className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors opacity-50 cursor-not-allowed"
                  disabled
                >
                  Analyze Position (Coming Soon)
                </button>
              </div>
            </div>
            
            {/* Quantum States Info */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Quantum States</h2>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-quantum-600 rounded-full animate-pulse"></div>
                  <span className="text-gray-400">Superposition - Piece exists in multiple states</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
                  <span className="text-gray-400">Entanglement - Pieces are quantum linked</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-gray-400">Measurement - Quantum state collapsed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Quantum Drawer */}
      <QuantumDrawer
        isOpen={isQuantumDrawerOpen}
        onClose={() => setIsQuantumDrawerOpen(false)}
        pieces={quantumPieces}
        measurementGroups={measurementGroups}
      />
    </div>
  );
}