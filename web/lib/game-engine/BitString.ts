/**
 * @file BitString.ts
 * @purpose Precision-safe bit string operations for quantum chess
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.5
 */

/**
 * BitString class for handling 64-bit operations without precision loss
 */
export class BitString {
  private bits: string;

  constructor(bits: string | number[] | BitString) {
    if (typeof bits === 'string') {
      if (!/^[01]*$/.test(bits)) {
        throw new Error('BitString must contain only 0s and 1s');
      }
      this.bits = bits.padStart(64, '0').substring(0, 64);
    } else if (Array.isArray(bits)) {
      if (bits.length !== 64) {
        throw new Error('Bit array must have exactly 64 elements');
      }
      if (!bits.every(bit => bit === 0 || bit === 1)) {
        throw new Error('Bit array must contain only 0s and 1s');
      }
      this.bits = bits.join('');
    } else if (bits instanceof BitString) {
      this.bits = bits.bits;
    } else {
      throw new Error('Invalid BitString constructor argument');
    }
  }

  /**
   * Create BitString from hex string
   */
  static fromHex(hex: string): BitString {
    const cleaned = hex.replace(/^0x/, '').toLowerCase();
    if (!/^[0-9a-f]+$/.test(cleaned)) {
      throw new Error('Invalid hex string');
    }
    
    const padded = cleaned.padStart(16, '0'); // 64 bits = 16 hex chars
    let binary = '';
    
    for (const hexChar of padded) {
      const value = parseInt(hexChar, 16);
      binary += value.toString(2).padStart(4, '0');
    }
    
    return new BitString(binary);
  }

  /**
   * Create standard chess starting position
   */
  static standardChessPosition(): BitString {
    const bitArray = new Array(64).fill(0);
    
    // White pieces: ranks 1-2 (positions 0-15)
    for (let i = 0; i < 16; i++) {
      bitArray[i] = 1;
    }
    
    // Black pieces: ranks 7-8 (positions 48-63)  
    for (let i = 48; i < 64; i++) {
      bitArray[i] = 1;
    }
    
    return new BitString(bitArray);
  }

  /**
   * Get bit at position (0-63)
   */
  getBit(position: number): 0 | 1 {
    if (position < 0 || position >= 64) {
      throw new Error(`Position ${position} out of range [0, 63]`);
    }
    return this.bits[position] === '1' ? 1 : 0;
  }

  /**
   * Set bit at position
   */
  setBit(position: number, value: 0 | 1): BitString {
    if (position < 0 || position >= 64) {
      throw new Error(`Position ${position} out of range [0, 63]`);
    }
    
    const newBits = this.bits.split('');
    newBits[position] = value.toString();
    return new BitString(newBits.join(''));
  }

  /**
   * Count number of 1s
   */
  popCount(): number {
    return this.bits.split('').filter(bit => bit === '1').length;
  }

  /**
   * Get positions where bits are 1
   */
  getSetPositions(): number[] {
    const positions: number[] = [];
    for (let i = 0; i < 64; i++) {
      if (this.bits[i] === '1') {
        positions.push(i);
      }
    }
    return positions;
  }

  /**
   * Flip bit at position
   */
  flipBit(position: number): BitString {
    const currentBit = this.getBit(position);
    return this.setBit(position, currentBit === 1 ? 0 : 1);
  }

  /**
   * XOR with another BitString
   */
  xor(other: BitString): BitString {
    const result: string[] = [];
    for (let i = 0; i < 64; i++) {
      const bit1 = this.bits[i];
      const bit2 = other.bits[i];
      result.push((bit1 === bit2) ? '0' : '1');
    }
    return new BitString(result.join(''));
  }

  /**
   * AND with another BitString
   */
  and(other: BitString): BitString {
    const result: string[] = [];
    for (let i = 0; i < 64; i++) {
      const bit1 = this.bits[i];
      const bit2 = other.bits[i];
      result.push((bit1 === '1' && bit2 === '1') ? '1' : '0');
    }
    return new BitString(result.join(''));
  }

  /**
   * OR with another BitString
   */
  or(other: BitString): BitString {
    const result: string[] = [];
    for (let i = 0; i < 64; i++) {
      const bit1 = this.bits[i];
      const bit2 = other.bits[i];
      result.push((bit1 === '1' || bit2 === '1') ? '1' : '0');
    }
    return new BitString(result.join(''));
  }

  /**
   * Check if two BitStrings are equal
   */
  equals(other: BitString): boolean {
    return this.bits === other.bits;
  }

  /**
   * Get string representation
   */
  toString(): string {
    return this.bits;
  }

  /**
   * Get hex representation
   */
  toHex(): string {
    let hex = '';
    for (let i = 0; i < 64; i += 4) {
      const nibble = this.bits.substring(i, i + 4);
      const value = parseInt(nibble, 2);
      hex += value.toString(16);
    }
    return '0x' + hex;
  }

  /**
   * Get visual board representation
   */
  toBoardString(): string {
    const rows: string[] = [];
    for (let rank = 7; rank >= 0; rank--) {
      let row = '';
      for (let file = 0; file < 8; file++) {
        const pos = file + rank * 8;
        row += this.getBit(pos) ? '1' : '0';
      }
      rows.push(`${rank + 1} ${row}`);
    }
    rows.push('  abcdefgh');
    return rows.join('\n');
  }

  /**
   * Clone the BitString
   */
  clone(): BitString {
    return new BitString(this.bits);
  }

  /**
   * Check if bit string is valid (all 0s and 1s, length 64)
   */
  isValid(): boolean {
    return this.bits.length === 64 && /^[01]+$/.test(this.bits);
  }
}