/**
 * @file QuantumStatePanel.tsx
 * @purpose Visual panel showing quantum states of pieces
 * @author AI Agent
 * @date 2025-08-07
 * @refactor Clean visualization of superposition and entanglement
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuantumPiece } from '@/lib/quantum/QuantumStateManager';
import { getPieceUnicode } from '@/lib/board/pieceUtils';

interface QuantumStatePanelProps {
  pieces: QuantumPiece[];
  measurementGroups: Map<string, Set<string>>;
}

export const QuantumStatePanel: React.FC<QuantumStatePanelProps> = ({
  pieces,
  measurementGroups
}) => {
  // Filter pieces that are in superposition or entangled
  const quantumPieces = pieces.filter(p => 
    p.positions.size > 1 || p.measurementGroupId
  );
  
  // Group entangled pieces
  const entanglementGroups: Map<string, QuantumPiece[]> = new Map();
  measurementGroups.forEach((pieceIds, groupId) => {
    const groupPieces = pieces.filter(p => pieceIds.has(p.id));
    if (groupPieces.length > 0) {
      entanglementGroups.set(groupId, groupPieces);
    }
  });
  
  if (quantumPieces.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3 text-quantum-500">
          Quantum States
        </h3>
        <p className="text-gray-400 text-sm">
          No pieces in quantum states
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3 text-quantum-500">
        Quantum States
      </h3>
      
      <div className="space-y-3">
        {/* Superposition States */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            Superposition
          </h4>
          <AnimatePresence>
            {quantumPieces
              .filter(p => p.positions.size > 1)
              .map(piece => (
                <motion.div
                  key={piece.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-gray-700 rounded p-2 mb-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {getPieceUnicode({
                          type: (piece.type.toLowerCase() === 'k' ? 'king' :
                                piece.type.toLowerCase() === 'q' ? 'queen' :
                                piece.type.toLowerCase() === 'r' ? 'rook' :
                                piece.type.toLowerCase() === 'b' ? 'bishop' :
                                piece.type.toLowerCase() === 'n' ? 'knight' :
                                piece.type.toLowerCase() === 'p' ? 'pawn' : 'pawn') as any,
                          color: piece.color
                        })}
                      </span>
                      <span className="text-xs text-gray-400">
                        {piece.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-quantum-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-quantum-400">
                        {piece.positions.size} states
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    {Array.from(piece.positions.entries()).map(([square, prob], idx, arr) => (
                      <React.Fragment key={square}>
                        <motion.div
                          className="flex items-center gap-1 bg-gray-600 rounded px-3 py-1"
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="text-sm font-mono font-bold">{square}</span>
                          <span className="text-xs text-quantum-400 bg-quantum-900 px-2 py-0.5 rounded-full">
                            {Math.round(prob * 100)}%
                          </span>
                        </motion.div>
                        {idx < arr.length - 1 && (
                          <span className="text-quantum-500 self-center">⟷</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
        
        {/* Entanglement States */}
        {entanglementGroups.size > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              Entanglement
            </h4>
            <AnimatePresence>
              {Array.from(entanglementGroups.entries()).map(([groupId, groupPieces]) => (
                <motion.div
                  key={groupId}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-gray-700 rounded p-2 mb-2 border border-cyan-500/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                    <span className="text-xs text-cyan-400">
                      Entangled Group
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    {groupPieces.map(piece => (
                      <div
                        key={piece.id}
                        className="flex items-center gap-1 bg-gray-600 rounded px-2 py-1"
                      >
                        <span className="text-lg">
                          {getPieceUnicode({
                            type: (piece.type.toLowerCase() === 'k' ? 'king' :
                                  piece.type.toLowerCase() === 'q' ? 'queen' :
                                  piece.type.toLowerCase() === 'r' ? 'rook' :
                                  piece.type.toLowerCase() === 'b' ? 'bishop' :
                                  piece.type.toLowerCase() === 'n' ? 'knight' :
                                  piece.type.toLowerCase() === 'p' ? 'pawn' : 'pawn') as any,
                            color: piece.color
                          })}
                        </span>
                        <span className="text-xs text-gray-400">
                          {Array.from(piece.positions.keys()).join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Entanglement visualization line */}
                  <svg className="w-full h-4 mt-1">
                    <motion.line
                      x1="0"
                      y1="2"
                      x2="100%"
                      y2="2"
                      stroke="rgba(34, 211, 238, 0.3)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear'
                      }}
                    />
                  </svg>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {/* Measurement Probability */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Click piece to measure (collapse)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Capture triggers automatic measurement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuantumStatePanel;