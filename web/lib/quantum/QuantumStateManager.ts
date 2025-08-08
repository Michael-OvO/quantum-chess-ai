/**
 * @file QuantumStateManager.ts
 * @purpose Simplified quantum state management using probabilities
 * @author AI Agent
 * @date 2025-08-07
 * @refactor Simplified from complex amplitudes to probabilities
 */

export interface QuantumPosition {
  square: string; // e.g., "e4"
  probability: number; // 0.0 to 1.0
}

export interface QuantumPiece {
  id: string; // Unique identifier
  type: string; // K, Q, R, B, N, P
  color: 'white' | 'black';
  positions: Map<string, number>; // square -> probability
  measurementGroupId?: string; // For entangled pieces
}

export interface MeasurementResult {
  pieceId: string;
  collapsedPosition: string;
  affectedPieces: string[]; // Other pieces affected by entanglement
}

export class QuantumStateManager {
  private pieces: Map<string, QuantumPiece> = new Map();
  private measurementGroups: Map<string, Set<string>> = new Map(); // groupId -> pieceIds
  private nextPieceId: number = 1;
  private nextGroupId: number = 1;
  
  /**
   * Initialize with classical chess starting position
   */
  initializeClassicalPosition(): void {
    this.pieces.clear();
    this.measurementGroups.clear();
    
    // White pieces
    this.addClassicalPiece('R', 'white', 'a1');
    this.addClassicalPiece('N', 'white', 'b1');
    this.addClassicalPiece('B', 'white', 'c1');
    this.addClassicalPiece('Q', 'white', 'd1');
    this.addClassicalPiece('K', 'white', 'e1');
    this.addClassicalPiece('B', 'white', 'f1');
    this.addClassicalPiece('N', 'white', 'g1');
    this.addClassicalPiece('R', 'white', 'h1');
    for (let file of 'abcdefgh') {
      this.addClassicalPiece('P', 'white', `${file}2`);
    }
    
    // Black pieces
    this.addClassicalPiece('R', 'black', 'a8');
    this.addClassicalPiece('N', 'black', 'b8');
    this.addClassicalPiece('B', 'black', 'c8');
    this.addClassicalPiece('Q', 'black', 'd8');
    this.addClassicalPiece('K', 'black', 'e8');
    this.addClassicalPiece('B', 'black', 'f8');
    this.addClassicalPiece('N', 'black', 'g8');
    this.addClassicalPiece('R', 'black', 'h8');
    for (let file of 'abcdefgh') {
      this.addClassicalPiece('P', 'black', `${file}7`);
    }
  }
  
  /**
   * Add a classical piece (probability 1.0 at single position)
   */
  private addClassicalPiece(type: string, color: 'white' | 'black', square: string): string {
    const id = `${color[0]}${type}${square}${this.nextPieceId++}`;
    const piece: QuantumPiece = {
      id,
      type,
      color,
      positions: new Map([[square, 1.0]])
    };
    this.pieces.set(id, piece);
    return id;
  }
  
  /**
   * Get piece at a specific square (if probability > 0.5)
   */
  getPieceAt(square: string): QuantumPiece | null {
    for (const piece of this.pieces.values()) {
      const prob = piece.positions.get(square) || 0;
      if (prob > 0.5) {
        return piece;
      }
    }
    return null;
  }
  
  /**
   * Get all pieces that have non-zero probability at a square
   */
  getPiecesAt(square: string): { piece: QuantumPiece; probability: number }[] {
    const result: { piece: QuantumPiece; probability: number }[] = [];
    for (const piece of this.pieces.values()) {
      const prob = piece.positions.get(square) || 0;
      if (prob > 0) {
        result.push({ piece, probability: prob });
      }
    }
    return result;
  }
  
  /**
   * Normal move: piece moves from one square to another
   */
  makeNormalMove(fromSquare: string, toSquare: string): boolean {
    const piece = this.getPieceAt(fromSquare);
    if (!piece) return false;
    
    // Check if piece is in superposition
    if (piece.positions.size > 1) {
      // Collapse to the source square first
      this.measurePiece(piece.id, fromSquare);
    }
    
    // Move the piece
    piece.positions.clear();
    piece.positions.set(toSquare, 1.0);
    
    // Handle capture
    const capturedPieces = this.getPiecesAt(toSquare).filter(p => p.piece.id !== piece.id);
    for (const { piece: captured } of capturedPieces) {
      this.pieces.delete(captured.id);
    }
    
    return true;
  }
  
  /**
   * Split move: piece splits into superposition at two squares
   */
  makeSplitMove(fromSquare: string, toSquare1: string, toSquare2: string): boolean {
    const piece = this.getPieceAt(fromSquare);
    if (!piece) return false;
    
    // Check if piece is already in superposition
    if (piece.positions.size > 1) {
      return false; // Can't split a piece already in superposition
    }
    
    // Create superposition
    piece.positions.clear();
    piece.positions.set(toSquare1, 0.5);
    piece.positions.set(toSquare2, 0.5);
    
    // Check for potential entanglement (pieces that could be blocked)
    this.checkEntanglement(piece.id, [toSquare1, toSquare2]);
    
    return true;
  }
  
  /**
   * Merge move: collapse superposition to single position
   */
  makeMergeMove(squares: string[], toSquare: string): boolean {
    // Find piece that exists in superposition at these squares
    let targetPiece: QuantumPiece | null = null;
    
    for (const piece of this.pieces.values()) {
      const hasAllSquares = squares.every(sq => (piece.positions.get(sq) || 0) > 0);
      if (hasAllSquares && piece.positions.size === squares.length) {
        targetPiece = piece;
        break;
      }
    }
    
    if (!targetPiece) return false;
    
    // Collapse to destination
    targetPiece.positions.clear();
    targetPiece.positions.set(toSquare, 1.0);
    
    // Resolve any entanglements
    if (targetPiece.measurementGroupId) {
      this.resolveMeasurementGroup(targetPiece.measurementGroupId);
    }
    
    return true;
  }
  
  /**
   * Measure a piece, collapsing it to a specific position
   */
  measurePiece(pieceId: string, forcedPosition?: string): MeasurementResult | null {
    const piece = this.pieces.get(pieceId);
    if (!piece) return null;
    
    // If already classical, no measurement needed
    if (piece.positions.size === 1) {
      return null;
    }
    
    // Determine collapsed position
    let collapsedPosition: string;
    if (forcedPosition && piece.positions.has(forcedPosition)) {
      collapsedPosition = forcedPosition;
    } else {
      // Random collapse based on probabilities
      const random = Math.random();
      let cumulative = 0;
      collapsedPosition = '';
      
      for (const [square, prob] of piece.positions) {
        cumulative += prob;
        if (random <= cumulative) {
          collapsedPosition = square;
          break;
        }
      }
    }
    
    // Collapse the piece
    piece.positions.clear();
    piece.positions.set(collapsedPosition, 1.0);
    
    // Handle entangled pieces
    const affectedPieces: string[] = [];
    if (piece.measurementGroupId) {
      const group = this.measurementGroups.get(piece.measurementGroupId);
      if (group) {
        for (const otherId of group) {
          if (otherId !== pieceId) {
            affectedPieces.push(otherId);
            // TODO: Resolve entanglement based on measurement result
          }
        }
      }
    }
    
    return {
      pieceId,
      collapsedPosition,
      affectedPieces
    };
  }
  
  /**
   * Check for entanglement when pieces interact
   */
  private checkEntanglement(pieceId: string, positions: string[]): void {
    // Find pieces whose movement could be affected
    const piece = this.pieces.get(pieceId);
    if (!piece) return;
    
    // For now, create a new measurement group
    const groupId = `group${this.nextGroupId++}`;
    piece.measurementGroupId = groupId;
    
    const group = new Set<string>([pieceId]);
    this.measurementGroups.set(groupId, group);
    
    // TODO: Find other pieces that could be entangled
  }
  
  /**
   * Resolve all pieces in a measurement group
   */
  private resolveMeasurementGroup(groupId: string): void {
    const group = this.measurementGroups.get(groupId);
    if (!group) return;
    
    // Collapse all pieces in the group
    for (const pieceId of group) {
      const piece = this.pieces.get(pieceId);
      if (piece && piece.positions.size > 1) {
        this.measurePiece(pieceId);
      }
      
      // Clear measurement group
      if (piece) {
        piece.measurementGroupId = undefined;
      }
    }
    
    this.measurementGroups.delete(groupId);
  }
  
  /**
   * Get all pieces
   */
  getAllPieces(): QuantumPiece[] {
    return Array.from(this.pieces.values());
  }
  
  /**
   * Get visual representation of board state
   */
  getBoardDisplay(): Map<string, { piece: QuantumPiece; probability: number }[]> {
    const display = new Map<string, { piece: QuantumPiece; probability: number }[]>();
    
    for (const piece of this.pieces.values()) {
      for (const [square, prob] of piece.positions) {
        if (prob > 0) {
          const existing = display.get(square) || [];
          existing.push({ piece, probability: prob });
          display.set(square, existing);
        }
      }
    }
    
    return display;
  }
  
  /**
   * Get measurement groups
   */
  getMeasurementGroups(): Map<string, Set<string>> {
    return new Map(this.measurementGroups);
  }
  
  /**
   * Check if a move would violate no-double-occupancy rule
   */
  wouldViolateDoubleOccupancy(pieceId: string, targetSquare: string): boolean {
    const movingPiece = this.pieces.get(pieceId);
    if (!movingPiece) return false;
    
    const occupants = this.getPiecesAt(targetSquare);
    
    // Check if square has pieces of different values
    for (const { piece } of occupants) {
      if (piece.id !== pieceId && 
          (piece.type !== movingPiece.type || piece.color !== movingPiece.color)) {
        return true; // Would create double occupancy
      }
    }
    
    return false;
  }
  
  /**
   * Export current state for persistence
   */
  exportState(): string {
    const state = {
      pieces: Array.from(this.pieces.entries()).map(([id, piece]) => ({
        id,
        type: piece.type,
        color: piece.color,
        positions: Array.from(piece.positions.entries()),
        measurementGroupId: piece.measurementGroupId
      })),
      measurementGroups: Array.from(this.measurementGroups.entries()).map(([id, group]) => ({
        id,
        pieces: Array.from(group)
      }))
    };
    
    return JSON.stringify(state);
  }
  
  /**
   * Import state from persistence
   */
  importState(stateJson: string): void {
    const state = JSON.parse(stateJson);
    
    this.pieces.clear();
    this.measurementGroups.clear();
    
    // Restore pieces
    for (const pieceData of state.pieces) {
      const piece: QuantumPiece = {
        id: pieceData.id,
        type: pieceData.type,
        color: pieceData.color,
        positions: new Map(pieceData.positions),
        measurementGroupId: pieceData.measurementGroupId
      };
      this.pieces.set(piece.id, piece);
    }
    
    // Restore measurement groups
    for (const groupData of state.measurementGroups) {
      this.measurementGroups.set(groupData.id, new Set(groupData.pieces));
    }
  }
}