'use client';

import React, { useEffect, useState } from 'react';
import { QuantumStateManager } from '@/lib/quantum/QuantumStateManager';

export default function TestBoard() {
  const [boardDisplay, setBoardDisplay] = useState<Map<string, any>>(new Map());
  
  useEffect(() => {
    const quantum = new QuantumStateManager();
    quantum.initializeClassicalPosition();
    const display = quantum.getBoardDisplay();
    setBoardDisplay(display);
    console.log('Display:', display);
    console.log('All pieces:', quantum.getAllPieces());
  }, []);
  
  const renderSquare = (file: number, rank: number) => {
    const square = `${'abcdefgh'[file]}${rank + 1}`;
    const pieces = boardDisplay.get(square) || [];
    const isLight = (file + rank) % 2 === 0;
    
    const pieceSymbols: Record<string, string> = {
      'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
      'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
    };
    
    return (
      <div
        key={square}
        className={`w-20 h-20 flex items-center justify-center text-5xl ${
          isLight ? 'bg-amber-200' : 'bg-amber-600'
        }`}
      >
        {pieces.length > 0 && (
          <span>
            {pieceSymbols[pieces[0].piece.color === 'white' 
              ? pieces[0].piece.type.toUpperCase() 
              : pieces[0].piece.type.toLowerCase()]}
          </span>
        )}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-white text-2xl mb-4">Test Board</h1>
      <div className="inline-block bg-white p-2">
        {[7, 6, 5, 4, 3, 2, 1, 0].map(rank => (
          <div key={rank} className="flex">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(file => renderSquare(file, rank))}
          </div>
        ))}
      </div>
      <div className="text-white mt-4">
        <p>Total squares with pieces: {boardDisplay.size}</p>
        <ul>
          {Array.from(boardDisplay.entries()).map(([square, pieces]) => (
            <li key={square}>
              {square}: {pieces.map((p: any) => `${p.piece.color} ${p.piece.type}`).join(', ')}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}