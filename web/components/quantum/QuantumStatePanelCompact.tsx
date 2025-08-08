/**
 * @file QuantumStatePanelCompact.tsx
 * @purpose Compact quantum states panel with tabs and collapsible sections
 * @author AI Agent
 * @date 2025-08-07
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuantumPiece } from '@/lib/quantum/QuantumStateManager';
import { getPieceUnicode } from '@/lib/board/pieceUtils';

interface QuantumStatePanelProps {
  pieces: QuantumPiece[];
  measurementGroups: Map<string, Set<string>>;
  compact?: boolean;
}

export const QuantumStatePanelCompact: React.FC<QuantumStatePanelProps> = ({
  pieces,
  measurementGroups,
  compact = false
}) => {
  const [activeTab, setActiveTab] = useState<'superposition' | 'entanglement'>('superposition');
  const [isExpanded, setIsExpanded] = useState(!compact);
  
  // Filter pieces that are in quantum states
  const superpositionPieces = pieces.filter(p => p.positions.size > 1);
  const entangledPieces = pieces.filter(p => p.measurementGroupId);
  
  // Get piece type display helper
  const getPieceType = (type: string) => {
    const typeMap: Record<string, string> = {
      'K': 'king', 'Q': 'queen', 'R': 'rook',
      'B': 'bishop', 'N': 'knight', 'P': 'pawn'
    };
    return typeMap[type] || type.toLowerCase();
  };
  
  // Count total quantum states
  const quantumCount = superpositionPieces.length + Array.from(measurementGroups.keys()).length;
  
  if (quantumCount === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-quantum-500 flex items-center gap-2">
          <span className="text-2xl">⚛️</span>
          Quantum States
        </h3>
        <p className="text-gray-400 text-sm mt-2">No quantum states active</p>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Header with toggle */}
      <div 
        className="p-4 bg-gray-750 cursor-pointer hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-quantum-500 flex items-center gap-2">
            <span className="text-2xl">⚛️</span>
            Quantum States
            <span className="text-xs bg-quantum-600 text-white px-2 py-1 rounded-full">
              {quantumCount}
            </span>
          </h3>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.div>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'superposition'
                    ? 'bg-quantum-600 text-white'
                    : 'bg-gray-750 text-gray-400 hover:bg-gray-700'
                }`}
                onClick={() => setActiveTab('superposition')}
              >
                Superposition ({superpositionPieces.length})
              </button>
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'entanglement'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-750 text-gray-400 hover:bg-gray-700'
                }`}
                onClick={() => setActiveTab('entanglement')}
              >
                Entanglement ({measurementGroups.size})
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 max-h-64 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'superposition' ? (
                  <motion.div
                    key="superposition"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-2"
                  >
                    {superpositionPieces.length === 0 ? (
                      <p className="text-gray-500 text-sm">No pieces in superposition</p>
                    ) : (
                      superpositionPieces.map(piece => (
                        <div
                          key={piece.id}
                          className="bg-gray-700 rounded-lg p-3 hover:bg-gray-650 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">
                                {getPieceUnicode({
                                  type: getPieceType(piece.type) as any,
                                  color: piece.color
                                })}
                              </span>
                              <span className="text-xs text-gray-400 font-mono">
                                {piece.id.substring(0, 8)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-quantum-500 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 flex-wrap">
                            {Array.from(piece.positions.entries()).map(([square, prob]) => (
                              <div
                                key={square}
                                className="bg-gray-800 rounded px-2 py-1 text-xs flex items-center gap-1"
                              >
                                <span className="font-mono font-bold">{square}</span>
                                <span className="text-quantum-400">{Math.round(prob * 100)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="entanglement"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-2"
                  >
                    {measurementGroups.size === 0 ? (
                      <p className="text-gray-500 text-sm">No entangled pieces</p>
                    ) : (
                      Array.from(measurementGroups.entries()).map(([groupId, pieceIds]) => {
                        const groupPieces = pieces.filter(p => pieceIds.has(p.id));
                        return (
                          <div
                            key={groupId}
                            className="bg-gray-700 rounded-lg p-3 border border-cyan-500/30"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                              <span className="text-xs text-cyan-400">Group {groupId.substring(5, 8)}</span>
                            </div>
                            
                            <div className="flex gap-2 flex-wrap">
                              {groupPieces.map(piece => (
                                <div
                                  key={piece.id}
                                  className="bg-gray-800 rounded px-2 py-1 flex items-center gap-1"
                                >
                                  <span className="text-lg">
                                    {getPieceUnicode({
                                      type: getPieceType(piece.type) as any,
                                      color: piece.color
                                    })}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {Array.from(piece.positions.keys()).join(',')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Quick Actions */}
            <div className="p-3 bg-gray-750 border-t border-gray-700 flex gap-2">
              <button className="text-xs text-gray-400 hover:text-white transition-colors">
                📊 Measure All
              </button>
              <button className="text-xs text-gray-400 hover:text-white transition-colors">
                🔄 Clear States
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuantumStatePanelCompact;