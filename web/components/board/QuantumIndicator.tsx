/**
 * @file QuantumIndicator.tsx
 * @purpose Visual indicators for quantum chess states (superposition, entanglement)
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.7
 */

'use client';

import React from 'react';

interface QuantumIndicatorProps {
  type: 'superposition' | 'entanglement' | 'measurement' | 'probability';
  value?: number; // For probability display (0-1)
  size?: 'small' | 'medium' | 'large';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  animated?: boolean;
}

export const QuantumIndicator: React.FC<QuantumIndicatorProps> = ({
  type,
  value,
  size = 'medium',
  position = 'top-right',
  animated = true
}) => {
  const sizeClasses = {
    small: 'w-4 h-4 text-xs',
    medium: 'w-6 h-6 text-sm',
    large: 'w-8 h-8 text-base'
  };
  
  const positionClasses = {
    'top-left': 'top-1 left-1',
    'top-right': 'top-1 right-1',
    'bottom-left': 'bottom-1 left-1',
    'bottom-right': 'bottom-1 right-1',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  };
  
  const getIndicatorContent = (): React.ReactNode => {
    switch (type) {
      case 'superposition':
        return (
          <>
            <div className={`
              absolute inset-0 rounded-full bg-quantum-600
              ${animated ? 'animate-pulse' : ''}
            `} />
            <div className="relative z-10 text-white font-bold">Ψ</div>
          </>
        );
      
      case 'entanglement':
        return (
          <>
            <div className={`
              absolute inset-0 rounded-full bg-blue-500
              ${animated ? 'animate-ping' : ''}
            `} />
            <div className="relative z-10 text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
                <path d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
              </svg>
            </div>
          </>
        );
      
      case 'measurement':
        return (
          <>
            <div className={`
              absolute inset-0 rounded-full bg-green-500
              ${animated ? 'animate-bounce' : ''}
            `} />
            <div className="relative z-10 text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
            </div>
          </>
        );
      
      case 'probability':
        const percentage = value ? Math.round(value * 100) : 0;
        const color = percentage > 70 ? 'bg-green-500' : 
                     percentage > 30 ? 'bg-yellow-500' : 'bg-red-500';
        return (
          <>
            <div className={`absolute inset-0 rounded-full ${color} opacity-30`} />
            <div className="relative z-10 text-white font-bold">
              {percentage}%
            </div>
          </>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className={`
      absolute flex items-center justify-center
      ${sizeClasses[size]}
      ${positionClasses[position]}
      pointer-events-none
    `}>
      {getIndicatorContent()}
    </div>
  );
};

export default QuantumIndicator;