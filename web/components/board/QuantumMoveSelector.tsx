/**
 * @file QuantumMoveSelector.tsx
 * @purpose UI component for selecting quantum move mode (normal/split/merge)
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.10
 */

'use client';

import React from 'react';

export type MoveMode = 'normal' | 'split' | 'merge';

interface QuantumMoveSelectorProps {
  currentMode: MoveMode;
  onModeChange: (mode: MoveMode) => void;
  disabled?: boolean;
}

export const QuantumMoveSelector: React.FC<QuantumMoveSelectorProps> = ({
  currentMode,
  onModeChange,
  disabled = false
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">Move Mode</h3>
      
      <div className="flex gap-2">
        <button
          onClick={() => onModeChange('normal')}
          disabled={disabled}
          className={`
            flex-1 px-3 py-2 rounded-lg transition-all text-sm font-medium
            ${currentMode === 'normal' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title="Normal chess moves"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg">♟</span>
            <span>Normal</span>
            <span className="text-xs opacity-75">(N)</span>
          </div>
        </button>
        
        <button
          onClick={() => onModeChange('split')}
          disabled={disabled}
          className={`
            flex-1 px-3 py-2 rounded-lg transition-all text-sm font-medium
            ${currentMode === 'split' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title="Split a piece into superposition (select 1 piece, then 2 destinations)"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg">⚛️</span>
            <span>Split</span>
            <span className="text-xs opacity-75">(S)</span>
          </div>
        </button>
        
        <button
          onClick={() => onModeChange('merge')}
          disabled={disabled}
          className={`
            flex-1 px-3 py-2 rounded-lg transition-all text-sm font-medium
            ${currentMode === 'merge' 
              ? 'bg-green-600 text-white shadow-lg' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title="Merge superposition back to one piece (select 2 source pieces, then 1 destination)"
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg">🔀</span>
            <span>Merge</span>
            <span className="text-xs opacity-75">(M)</span>
          </div>
        </button>
      </div>
      
      <div className="mt-3 text-xs text-gray-400">
        {currentMode === 'normal' && (
          <p>Click a piece, then click destination square to move.</p>
        )}
        {currentMode === 'split' && (
          <p>Click a piece, then click TWO destination squares to create superposition.</p>
        )}
        {currentMode === 'merge' && (
          <p>Click TWO pieces in superposition, then click ONE destination to merge.</p>
        )}
      </div>
    </div>
  );
};

export default QuantumMoveSelector;