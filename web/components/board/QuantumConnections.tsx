/**
 * @file QuantumConnections.tsx
 * @purpose Visual connections between quantum-entangled pieces
 * @author AI Agent
 * @date 2025-08-07
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface QuantumConnectionsProps {
  connections: Array<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    type: 'superposition' | 'entanglement';
  }>;
  boardSize: number;
}

export const QuantumConnections: React.FC<QuantumConnectionsProps> = ({
  connections,
  boardSize
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  if (connections.length === 0) return null;
  
  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none z-20"
      style={{ width: boardSize, height: boardSize }}
    >
      <defs>
        <linearGradient id="superposition-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(147, 51, 234, 0.6)" />
          <stop offset="100%" stopColor="rgba(147, 51, 234, 0.2)" />
        </linearGradient>
        <linearGradient id="entanglement-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(34, 211, 238, 0.6)" />
          <stop offset="100%" stopColor="rgba(34, 211, 238, 0.2)" />
        </linearGradient>
      </defs>
      
      {connections.map((connection, index) => {
        const gradient = connection.type === 'superposition' 
          ? 'url(#superposition-gradient)' 
          : 'url(#entanglement-gradient)';
        
        return (
          <motion.line
            key={index}
            x1={connection.from.x}
            y1={connection.from.y}
            x2={connection.to.x}
            y2={connection.to.y}
            stroke={gradient}
            strokeWidth="2"
            strokeDasharray={connection.type === 'superposition' ? "5 5" : "3 3"}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: 0.7 
            }}
            transition={{
              pathLength: { duration: 0.5, ease: "easeOut" },
              opacity: { duration: 0.3 }
            }}
          />
        );
      })}
      
      {/* Animated particles along connections */}
      {connections.map((connection, index) => (
        <motion.circle
          key={`particle-${index}`}
          r="3"
          fill={connection.type === 'superposition' ? '#9333EA' : '#22D3EE'}
          initial={{ 
            cx: connection.from.x, 
            cy: connection.from.y,
            opacity: 0 
          }}
          animate={{ 
            cx: [connection.from.x, connection.to.x, connection.from.x],
            cy: [connection.from.y, connection.to.y, connection.from.y],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
            delay: index * 0.5
          }}
        />
      ))}
    </svg>
  );
};

export default QuantumConnections;