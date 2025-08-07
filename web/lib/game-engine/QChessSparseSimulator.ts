/**
 * @file QChessSparseSimulator.ts
 * @purpose Sparse quantum state simulator for quantum chess
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.5
 */

import type { Complex, PieceChar, QuantumCoeff } from './types';
import { SeededRandom, ComplexMath, convertPosToInt } from './utils';
import { BitString } from './BitString';

export class QChessSparseSimulator {
  public pos2tag: (PieceChar | null)[];
  public coeff: QuantumCoeff;
  private rng: SeededRandom;
  private cacheProb: Map<number, number>;
  public lastMeasure: number | null;
  public lastMeasure1Prob: number | null;

  constructor(
    state0?: BitString | number[] | string, // BitString, bit array, or bit string
    tagList: string = 'RNBQKBNRPPPPPPPPpppppppprnbqkbnr',
    seed?: number
  ) {
    let bitString: BitString;
    
    if (state0 instanceof BitString) {
      bitString = state0;
    } else if (Array.isArray(state0)) {
      bitString = new BitString(state0);
    } else if (typeof state0 === 'string') {
      bitString = new BitString(state0);
    } else if (state0 === undefined) {
      // Create standard chess starting position
      bitString = BitString.standardChessPosition();
    } else {
      throw new Error('Invalid state0 parameter type');
    }
    
    const basis0 = bitString.toString();
    const onesCount = bitString.popCount();
    
    if (tagList.length !== onesCount) {
      throw new Error(`Tag list length (${tagList.length}) must match number of pieces (${onesCount})`);
    }

    this.pos2tag = new Array(64).fill(null);
    const positions = basis0.split('')
      .map((bit, index) => bit === '1' ? index : -1)
      .filter(index => index !== -1);

    for (let i = 0; i < positions.length; i++) {
      this.pos2tag[positions[i]] = tagList[i] as PieceChar;
    }

    this.coeff = { [basis0]: ComplexMath.one() };
    this.rng = new SeededRandom(seed);
    this.cacheProb = new Map();
    this.lastMeasure = null;
    this.lastMeasure1Prob = null;
  }

  /**
   * Create simulator from board position
   */
  static fromBoard(posList: Array<[string, PieceChar]>): QChessSparseSimulator {
    if (posList.length === 0) {
      throw new Error('Position list cannot be empty');
    }

    const tagList = posList.map(([_, tag]) => tag).join('');
    const bitArray = new Array(64).fill(0);

    for (const [pos, _] of posList) {
      bitArray[convertPosToInt(pos)] = 1;
    }

    return new QChessSparseSimulator(bitArray, tagList);
  }

  /**
   * Clone from another simulator
   */
  cloneFromSim(other: QChessSparseSimulator): void {
    this.pos2tag = [...other.pos2tag];
    this.rng.setSeed(other.rng.getSeed());
    this.coeff = { ...other.coeff };
    this.lastMeasure = other.lastMeasure;
    this.lastMeasure1Prob = other.lastMeasure1Prob;
    this.cacheProb = new Map(other.cacheProb);
  }

  /**
   * Get probability of piece at position
   */
  private getProbabilityI(index: number): number {
    if (this.cacheProb.has(index)) {
      return this.cacheProb.get(index)!;
    }

    if (index < 0 || index >= 64) {
      throw new Error(`Invalid index: ${index}`);
    }

    let prob = 0;
    if (this.pos2tag[index] !== null) {
      for (const [basis, amplitude] of Object.entries(this.coeff)) {
        if (basis[index] === '1') {
          const mag = ComplexMath.magnitude(amplitude);
          prob += mag * mag;
        }
      }
    }

    this.cacheProb.set(index, prob);
    return prob;
  }

  /**
   * Get marginal probability at position
   */
  getMarginalProbability(index?: number): number | [PieceChar[], number[]] {
    if (index !== undefined) {
      return this.getProbabilityI(index);
    } else {
      const tagList = this.pos2tag.slice();
      const probList = Array.from({ length: 64 }, (_, i) => this.getProbabilityI(i));
      return [tagList as PieceChar[], probList];
    }
  }

  /**
   * Apply square root of iSWAP operation
   */
  applySqrtISwap(
    src: number,
    dst: number,
    control?: Set<number>,
    negateControl?: Set<number>,
    tagInverse: boolean = false
  ): void {
    if (src === dst) {
      throw new Error('Source and destination cannot be the same');
    }

    const srcTag = this.pos2tag[src];
    const dstTag = this.pos2tag[dst];

    // Validate quantum operation conditions
    const validConditions = [
      srcTag === null && dstTag !== null,
      srcTag !== null && dstTag === null,
      srcTag === dstTag && srcTag !== null
    ];

    if (!validConditions.some(cond => cond)) {
      throw new Error('Invalid sqrt iSWAP operation conditions');
    }

    const tag = srcTag ?? dstTag;
    const newCoeff: QuantumCoeff = {};

    for (const [basis, amplitude] of Object.entries(this.coeff)) {
      const srcBit = basis[src];
      const dstBit = basis[dst];
      const bitSum = srcBit + dstBit;

      // Check control conditions
      if (control) {
        const controlSatisfied = Array.from(control).every(pos => basis[pos] === '1');
        if (!controlSatisfied) {
          newCoeff[basis] = amplitude;
          continue;
        }
      }

      if (negateControl) {
        const negateControlSatisfied = Array.from(negateControl).every(pos => basis[pos] === '0');
        if (!negateControlSatisfied) {
          newCoeff[basis] = amplitude;
          continue;
        }
      }

      if (bitSum === '10' || bitSum === '01') {
        // Apply sqrt(iSWAP) transformation
        const newBasis1 = basis.split('');
        const newBasis2 = basis.split('');
        
        newBasis1[src] = dstBit;
        newBasis1[dst] = srcBit;
        newBasis2[src] = srcBit;
        newBasis2[dst] = dstBit;

        const newBasisStr1 = newBasis1.join('');
        const newBasisStr2 = newBasis2.join('');

        const factor = 1 / Math.sqrt(2);
        const iFactor = ComplexMath.i();

        newCoeff[newBasisStr1] = ComplexMath.add(
          newCoeff[newBasisStr1] || ComplexMath.zero(),
          ComplexMath.scale(amplitude, factor)
        );

        newCoeff[newBasisStr2] = ComplexMath.add(
          newCoeff[newBasisStr2] || ComplexMath.zero(),
          ComplexMath.multiply(ComplexMath.scale(iFactor, factor), amplitude)
        );
      } else {
        newCoeff[basis] = amplitude;
      }
    }

    this.coeff = newCoeff;
    this.cacheProb.clear();

    // Update tags if needed
    if (tagInverse) {
      if (srcTag && !dstTag) {
        this.pos2tag[src] = null;
        this.pos2tag[dst] = srcTag;
      }
    }
  }

  /**
   * Apply iSWAP operation with capture handling
   */
  applyISwap(
    src: number,
    dst: number,
    control?: Set<number>,
    negateControl?: Set<number>
  ): void {
    if (src === dst) {
      throw new Error('Source and destination cannot be the same');
    }

    const srcTag = this.pos2tag[src];
    const dstTag = this.pos2tag[dst];
    
    // Check if this is a capture (different pieces at src and dst)
    const isCapture = srcTag && dstTag && srcTag !== dstTag && 
                     srcTag.toUpperCase() !== dstTag.toUpperCase();
    
    if (isCapture) {
      // Capture triggers measurement at destination
      const measureResult = this.measure(dst);
      
      if (measureResult === 1) {
        // Piece exists at destination - capture it
        // Remove the captured piece from all quantum states
        this.pos2tag[dst] = null;
        
        // Now move the capturing piece
        const moveCoeff: QuantumCoeff = {};
        
        for (const [basis, amplitude] of Object.entries(this.coeff)) {
          // Only keep states where src has a piece
          if (basis[src] === '1') {
            const newBasis = basis.split('');
            newBasis[src] = '0';
            newBasis[dst] = '1';
            moveCoeff[newBasis.join('')] = amplitude;
          } else {
            moveCoeff[basis] = amplitude;
          }
        }
        
        this.coeff = moveCoeff;
        this.pos2tag[dst] = srcTag;
        this.pos2tag[src] = null;
      } else {
        // No piece at destination after measurement - normal move
        this.pos2tag[dst] = srcTag;
        this.pos2tag[src] = null;
      }
      
      this.cacheProb.clear();
      return;
    }

    // Normal iSWAP operation (no capture)
    const newCoeff: QuantumCoeff = {};

    for (const [basis, amplitude] of Object.entries(this.coeff)) {
      // Check control conditions
      if (control) {
        const controlSatisfied = Array.from(control).every(pos => basis[pos] === '1');
        if (!controlSatisfied) {
          newCoeff[basis] = amplitude;
          continue;
        }
      }

      if (negateControl) {
        const negateControlSatisfied = Array.from(negateControl).every(pos => basis[pos] === '0');
        if (!negateControlSatisfied) {
          newCoeff[basis] = amplitude;
          continue;
        }
      }

      const srcBit = basis[src];
      const dstBit = basis[dst];

      if ((srcBit === '1' && dstBit === '0') || (srcBit === '0' && dstBit === '1')) {
        const newBasis = basis.split('');
        newBasis[src] = dstBit;
        newBasis[dst] = srcBit;
        const newBasisStr = newBasis.join('');

        // Apply iSWAP phase factor (multiply by i)
        const iAmplitude = ComplexMath.multiply(amplitude, ComplexMath.i());
        
        newCoeff[newBasisStr] = ComplexMath.add(
          newCoeff[newBasisStr] || ComplexMath.zero(),
          iAmplitude
        );
      } else {
        newCoeff[basis] = amplitude;
      }
    }

    this.coeff = newCoeff;
    this.cacheProb.clear();

    // Swap tags for normal moves
    const temp = this.pos2tag[src];
    this.pos2tag[src] = this.pos2tag[dst];
    this.pos2tag[dst] = temp;
  }

  /**
   * Measure position
   */
  measure(pos: number): 0 | 1 {
    if (pos < 0 || pos >= 64) {
      throw new Error(`Invalid position: ${pos}`);
    }

    const prob1 = this.getProbabilityI(pos);
    const result = this.rng.next() < prob1 ? 1 : 0;

    // Collapse wavefunction
    const newCoeff: QuantumCoeff = {};
    let norm = 0;

    for (const [basis, amplitude] of Object.entries(this.coeff)) {
      if (basis[pos] === result.toString()) {
        newCoeff[basis] = amplitude;
        const mag = ComplexMath.magnitude(amplitude);
        norm += mag * mag;
      }
    }

    // Normalize
    if (norm > 0) {
      const normFactor = 1 / Math.sqrt(norm);
      for (const [basis, amplitude] of Object.entries(newCoeff)) {
        newCoeff[basis] = ComplexMath.scale(amplitude, normFactor);
      }
    }

    this.coeff = newCoeff;
    this.cacheProb.clear();
    this.lastMeasure = result;
    this.lastMeasure1Prob = prob1;

    return result;
  }

  /**
   * Get board representation for display
   */
  getPrintStr(space: number = 4): string {
    const rows: string[] = [];
    
    for (let rank = 7; rank >= 0; rank--) {
      const row: string[] = [];
      for (let file = 0; file < 8; file++) {
        const pos = file + rank * 8;
        const piece = this.pos2tag[pos];
        const prob = this.getProbabilityI(pos);
        
        if (piece === null) {
          row.push('·'.padEnd(space));
        } else {
          const display = prob < 1.0 ? `${piece}${prob.toFixed(2).substring(1)}` : piece;
          row.push(display.padEnd(space));
        }
      }
      rows.push(`${rank + 1} ${row.join('')}`);
    }
    
    rows.push('  ' + 'abcdefgh'.split('').map(f => f.padEnd(space)).join(''));
    return rows.join('\n');
  }

  /**
   * Change piece tag at position
   */
  changeTag(pos: number, newTag: PieceChar): void {
    this.pos2tag[pos] = newTag;
  }

  /**
   * Get total probability (should be 1.0)
   */
  getTotalProbability(): number {
    let total = 0;
    for (const amplitude of Object.values(this.coeff)) {
      const mag = ComplexMath.magnitude(amplitude);
      total += mag * mag;
    }
    return total;
  }
}