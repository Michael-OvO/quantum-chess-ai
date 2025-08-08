/**
 * @file QuantumPiece.tsx
 * @purpose Animated chess piece component with quantum effects
 * @author AI Agent
 * @date 2025-08-07
 * @refactor Enhanced with probability visualization and animations
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Piece, getPieceUnicode } from '@/lib/board/pieceUtils';

interface QuantumPieceProps {
  piece: Piece;
  probability: number; // 0.0 to 1.0
  isSelected?: boolean;
  isSuperposition?: boolean;
  isEntangled?: boolean;
  isMeasuring?: boolean;
  size: number;
  onClick?: () => void;
  onDragStart?: () => void;
  onDragEnd?: (dropSquare: string | null) => void;
}

export const QuantumPiece: React.FC<QuantumPieceProps> = ({
  piece,
  probability = 1.0,
  isSelected = false,
  isSuperposition = false,
  isEntangled = false,
  isMeasuring = false,
  size,
  onClick,
  onDragStart,
  onDragEnd
}) => {
  const [showProbability, setShowProbability] = useState(false);
  const pieceChar = getPieceUnicode(piece);
  
  // Calculate visual properties based on quantum state
  const opacity = 0.5 + (probability * 0.5); // Min 50%, max 100% for better visibility
  const scale = 1.0; // Keep consistent size
  const glowIntensity = isSuperposition ? 12 : 0; // Subtle glow
  
  // Animation variants
  const pieceVariants = {
    normal: {
      scale: 1,
      opacity: opacity,
      filter: `drop-shadow(0 0 ${glowIntensity}px rgba(147, 51, 234, 0.8))`,
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    },
    selected: {
      scale: 1.1,
      opacity: 1,
      filter: `drop-shadow(0 0 25px rgba(59, 130, 246, 0.9))`,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    },
    superposition: {
      scale: 1,
      opacity: opacity,
      filter: `drop-shadow(0 0 ${glowIntensity}px rgba(147, 51, 234, 0.6))`,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    },
    entangled: {
      scale: 1,
      opacity: opacity,
      filter: `drop-shadow(0 0 15px rgba(34, 211, 238, 0.9))`,
      transition: {
        duration: 0.3
      }
    },
    measuring: {
      scale: [1, 1.2, 0.8, 1],
      opacity: [opacity, 1, 1, 1],
      rotate: [0, 180, 360, 360],
      filter: [
        `drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))`,
        `drop-shadow(0 0 30px rgba(255, 255, 255, 1))`,
        `drop-shadow(0 0 20px rgba(255, 255, 255, 0.8))`,
        `drop-shadow(0 0 0px rgba(255, 255, 255, 0))`
      ],
      transition: {
        duration: 0.8,
        ease: 'easeOut'
      }
    },
    dragging: {
      scale: 1.2,
      opacity: 0.8,
      cursor: 'grabbing',
      zIndex: 1000,
      transition: {
        duration: 0.1
      }
    }
  };
  
  // Determine current animation state
  const getCurrentVariant = () => {
    if (isMeasuring) return 'measuring';
    if (isSelected) return 'selected';
    if (isEntangled) return 'entangled';
    if (isSuperposition) return 'superposition';
    return 'normal';
  };
  
  // Particle effect for measurement
  const MeasurementParticles = () => (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: '50%',
            top: '50%',
          }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{
            x: Math.cos(i * Math.PI / 4) * 40,
            y: Math.sin(i * Math.PI / 4) * 40,
            opacity: 0,
          }}
          transition={{
            duration: 0.6,
            ease: 'easeOut',
            delay: i * 0.05
          }}
        />
      ))}
    </div>
  );
  
  // Entanglement connection line (rendered separately)
  const EntanglementLine = () => (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: size, height: size }}
    >
      <motion.line
        x1={size / 2}
        y1={size / 2}
        x2={size / 2}
        y2={size / 2}
        stroke="rgba(34, 211, 238, 0.5)"
        strokeWidth="2"
        strokeDasharray="5 5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    </svg>
  );
  
  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      onMouseEnter={() => isSuperposition && setShowProbability(true)}
      onMouseLeave={() => setShowProbability(false)}
    >
      <AnimatePresence>
        {/* Main piece */}
        <motion.div
          className="absolute cursor-pointer select-none"
          style={{
            fontSize: size * 0.8,
            lineHeight: 1,
            color: piece.color === 'white' ? '#ffffff' : '#000000',
            textShadow: piece.color === 'white' 
              ? '0 0 2px rgba(0,0,0,0.5)' 
              : '0 0 2px rgba(255,255,255,0.5)',
          }}
          variants={pieceVariants}
          initial="normal"
          animate={getCurrentVariant()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          drag={onDragStart ? true : false}
          dragElastic={0.2}
          dragMomentum={false}
          onDragStart={onDragStart}
          onDragEnd={(_, info) => {
            if (onDragEnd) {
              // Calculate drop square from drag position
              // This would need integration with board component
              onDragEnd(null);
            }
          }}
          onClick={onClick}
        >
          {pieceChar}
        </motion.div>
        
        {/* Superposition indicator ring */}
        {isSuperposition && (
          <motion.div
            className="absolute rounded-full border-2 border-quantum-500 opacity-60"
            style={{
              width: size,
              height: size,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 0.6,
            }}
            transition={{
              duration: 0.3,
              ease: 'easeOut'
            }}
          />
        )}
        
        {/* Entanglement indicator */}
        {isEntangled && <EntanglementLine />}
        
        {/* Measurement particles */}
        {isMeasuring && <MeasurementParticles />}
        
        {/* Probability badge - always visible for quantum pieces */}
        {isSuperposition && (
          <motion.div
            className="absolute -top-2 -right-2 bg-quantum-600 text-white text-xs 
                       w-8 h-8 rounded-full flex items-center justify-center
                       font-bold shadow-lg border-2 border-white pointer-events-none z-50"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {Math.round(probability * 100)}%
          </motion.div>
        )}
        
      </AnimatePresence>
    </div>
  );
};

export default QuantumPiece;