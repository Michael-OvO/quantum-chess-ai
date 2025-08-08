/**
 * @file QuantumDrawer.tsx
 * @purpose Mobile-friendly slide-out drawer for quantum states
 * @author AI Agent
 * @date 2025-08-07
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuantumPiece } from '@/lib/quantum/QuantumStateManager';
import QuantumStatePanelCompact from './QuantumStatePanelCompact';

interface QuantumDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pieces: QuantumPiece[];
  measurementGroups: Map<string, Set<string>>;
}

export const QuantumDrawer: React.FC<QuantumDrawerProps> = ({
  isOpen,
  onClose,
  pieces,
  measurementGroups
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 bg-gray-900 shadow-xl z-50 lg:hidden overflow-y-auto"
          >
            {/* Header */}
            <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Quantum States</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ✕
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4">
              <QuantumStatePanelCompact
                pieces={pieces}
                measurementGroups={measurementGroups}
                compact={false}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuantumDrawer;