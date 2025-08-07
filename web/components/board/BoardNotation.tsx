/**
 * @file BoardNotation.tsx
 * @purpose Chess board notation labels (a-h, 1-8) component
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.7
 */

'use client';

import React from 'react';

interface BoardNotationProps {
  size: number;
  showFiles?: boolean;
  showRanks?: boolean;
  position?: 'inside' | 'outside';
  flipped?: boolean;
}

export const BoardNotation: React.FC<BoardNotationProps> = ({
  size,
  showFiles = true,
  showRanks = true,
  position = 'outside',
  flipped = false
}) => {
  const squareSize = size / 8;
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
  
  if (flipped) {
    files.reverse();
    ranks.reverse();
  }
  
  const notationStyle = position === 'outside' 
    ? 'text-gray-400 text-sm font-medium'
    : 'text-gray-600 text-xs font-normal';
  
  return (
    <>
      {/* File labels (a-h) */}
      {showFiles && (
        <div 
          className={`
            flex absolute
            ${position === 'outside' ? '-bottom-6' : 'bottom-1'}
            left-0 right-0
          `}
        >
          {files.map((file, index) => (
            <div
              key={file}
              className={`
                flex items-center justify-center
                ${notationStyle}
              `}
              style={{ width: squareSize }}
            >
              {file}
            </div>
          ))}
        </div>
      )}
      
      {/* Rank labels (1-8) */}
      {showRanks && (
        <div 
          className={`
            flex flex-col-reverse absolute
            ${position === 'outside' ? '-left-6' : 'left-1'}
            top-0 bottom-0
          `}
        >
          {ranks.map((rank, index) => (
            <div
              key={rank}
              className={`
                flex items-center justify-center
                ${notationStyle}
              `}
              style={{ height: squareSize }}
            >
              {rank}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default BoardNotation;