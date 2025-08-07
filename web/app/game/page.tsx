/**
 * @file page.tsx
 * @purpose Game page displaying the interactive chess board
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.7
 */

'use client';

import React, { useState, useEffect } from 'react';
import { QuantumChessBoard } from '@/components/board/QuantumChessBoard';
import { QChessGame } from '@/lib/game-engine';

export default function GamePage(): React.ReactElement {
  const [game, setGame] = useState<QChessGame | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [currentTurn, setCurrentTurn] = useState<'white' | 'black'>('white');
  const [gameStatus, setGameStatus] = useState<string>('active');
  
  // Initialize game on mount
  useEffect(() => {
    const newGame = new QChessGame();
    setGame(newGame);
  }, []);
  
  // Handle move (including quantum moves)
  const handleMove = (from: string, to: string, fromSecond?: string, toSecond?: string): void => {
    let moveNotation = '';
    if (fromSecond && toSecond) {
      // Split move
      moveNotation = `${from} → ${to}+${toSecond}`;
    } else if (fromSecond) {
      // Merge move
      moveNotation = `${from}+${fromSecond} → ${to}`;
    } else {
      // Normal move
      moveNotation = `${from}-${to}`;
    }
    
    setMoveHistory(prev => [...prev, moveNotation]);
    setCurrentTurn(prev => prev === 'white' ? 'black' : 'white');
    
    // Check game status
    if (game) {
      if (game.isCheckmate()) {
        setGameStatus('checkmate');
      } else if (game.isStalemate()) {
        setGameStatus('stalemate');
      } else if (game.isCheck()) {
        setGameStatus('check');
      } else {
        setGameStatus('active');
      }
    }
  };
  
  // Reset game
  const resetGame = (): void => {
    const newGame = new QChessGame();
    setGame(newGame);
    setMoveHistory([]);
    setCurrentTurn('white');
    setGameStatus('active');
  };
  
  if (!game) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }
  
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
            <QuantumChessBoard
              game={game}
              onMove={handleMove}
              showNotation
              highlightLastMove
              allowMoves
              boardSize={Math.min(640, typeof window !== 'undefined' ? window.innerWidth - 100 : 640)}
            />
          </div>
          
          {/* Game Info Panel */}
          <div className="space-y-6">
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
                    <div key={index} className="flex text-sm">
                      <span className="text-gray-500 w-8">{Math.floor(index / 2) + 1}.</span>
                      <span className={index % 2 === 0 ? 'text-white' : 'text-gray-400'}>
                        {move}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            
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
    </div>
  );
}