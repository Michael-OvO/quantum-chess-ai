/**
 * @file BitString.test.ts
 * @purpose Tests for BitString class
 * @author AI Agent
 * @date 2025-08-07
 * @task T1.5
 */

import { BitString } from '../BitString';

describe('BitString', () => {
  describe('construction', () => {
    it('should create from string', () => {
      const bs = new BitString('1010');
      expect(bs.toString()).toBe('0000000000000000000000000000000000000000000000000000000000001010');
    });

    it('should create from bit array', () => {
      const bitArray = new Array(64).fill(0);
      bitArray[0] = 1;
      bitArray[63] = 1;
      
      const bs = new BitString(bitArray);
      expect(bs.getBit(0)).toBe(1);
      expect(bs.getBit(63)).toBe(1);
      expect(bs.getBit(32)).toBe(0);
    });

    it('should create standard chess position', () => {
      const bs = BitString.standardChessPosition();
      expect(bs.popCount()).toBe(32);
      
      // Check white pieces (ranks 1-2)
      for (let i = 0; i < 16; i++) {
        expect(bs.getBit(i)).toBe(1);
      }
      
      // Check empty squares (ranks 3-6)
      for (let i = 16; i < 48; i++) {
        expect(bs.getBit(i)).toBe(0);
      }
      
      // Check black pieces (ranks 7-8)
      for (let i = 48; i < 64; i++) {
        expect(bs.getBit(i)).toBe(1);
      }
    });

    it('should create from hex', () => {
      const bs = BitString.fromHex('ffff00000000ffff');
      expect(bs.popCount()).toBe(32);
      
      // Should match standard chess position
      const standard = BitString.standardChessPosition();
      expect(bs.equals(standard)).toBe(true);
    });
  });

  describe('bit operations', () => {
    let bs: BitString;

    beforeEach(() => {
      bs = new BitString('1100110000000000000000000000000000000000000000000000000000000000');
    });

    it('should get bits correctly', () => {
      expect(bs.getBit(0)).toBe(1);
      expect(bs.getBit(1)).toBe(1);
      expect(bs.getBit(2)).toBe(0);
      expect(bs.getBit(3)).toBe(0);
      expect(bs.getBit(4)).toBe(1);
      expect(bs.getBit(5)).toBe(1);
    });

    it('should set bits correctly', () => {
      const newBs = bs.setBit(2, 1);
      expect(newBs.getBit(2)).toBe(1);
      expect(bs.getBit(2)).toBe(0); // Original unchanged
    });

    it('should flip bits correctly', () => {
      const flipped = bs.flipBit(2);
      expect(flipped.getBit(2)).toBe(1);
      expect(bs.getBit(2)).toBe(0); // Original unchanged
    });

    it('should count ones correctly', () => {
      expect(bs.popCount()).toBe(4);
    });

    it('should get set positions', () => {
      const positions = bs.getSetPositions();
      expect(positions).toEqual([0, 1, 4, 5]);
    });
  });

  describe('bitwise operations', () => {
    it('should perform XOR correctly', () => {
      const bs1 = new BitString('1100');
      const bs2 = new BitString('1010');
      const result = bs1.xor(bs2);
      
      expect(result.getBit(60)).toBe(0); // 1 XOR 1
      expect(result.getBit(61)).toBe(1); // 1 XOR 0
      expect(result.getBit(62)).toBe(1); // 0 XOR 1
      expect(result.getBit(63)).toBe(0); // 0 XOR 0
    });

    it('should perform AND correctly', () => {
      const bs1 = new BitString('1100');
      const bs2 = new BitString('1010');
      const result = bs1.and(bs2);
      
      expect(result.getBit(60)).toBe(1); // 1 AND 1
      expect(result.getBit(61)).toBe(0); // 1 AND 0
      expect(result.getBit(62)).toBe(0); // 0 AND 1
      expect(result.getBit(63)).toBe(0); // 0 AND 0
    });

    it('should perform OR correctly', () => {
      const bs1 = new BitString('1100');
      const bs2 = new BitString('1010');
      const result = bs1.or(bs2);
      
      expect(result.getBit(60)).toBe(1); // 1 OR 1
      expect(result.getBit(61)).toBe(1); // 1 OR 0
      expect(result.getBit(62)).toBe(1); // 0 OR 1
      expect(result.getBit(63)).toBe(0); // 0 OR 0
    });
  });

  describe('string representations', () => {
    it('should convert to hex correctly', () => {
      const bs = BitString.standardChessPosition();
      const hex = bs.toHex();
      expect(hex.toLowerCase()).toBe('0xffff00000000ffff');
    });

    it('should create board string', () => {
      const bs = BitString.standardChessPosition();
      const boardStr = bs.toBoardString();
      
      expect(boardStr).toContain('8 11111111'); // Black pieces
      expect(boardStr).toContain('7 11111111'); // Black pawns
      expect(boardStr).toContain('6 00000000'); // Empty
      expect(boardStr).toContain('2 11111111'); // White pawns
      expect(boardStr).toContain('1 11111111'); // White pieces
      expect(boardStr).toContain('abcdefgh');
    });
  });

  describe('validation', () => {
    it('should validate correct bit strings', () => {
      const bs = new BitString('1010');
      expect(bs.isValid()).toBe(true);
    });

    it('should reject invalid characters', () => {
      expect(() => new BitString('102')).toThrow();
    });

    it('should handle cloning', () => {
      const bs1 = new BitString('1010');
      const bs2 = bs1.clone();
      
      expect(bs1.equals(bs2)).toBe(true);
      expect(bs1 !== bs2).toBe(true); // Different instances
    });
  });

  describe('advanced bit operations', () => {
    it('should handle bit flipping correctly', () => {
      const bs = new BitString('1010');
      const flipped = bs.flipBit(61);
      
      expect(flipped.getBit(61)).toBe(1); // Was 0, now 1
      expect(bs.getBit(61)).toBe(0); // Original unchanged
    });

    it('should get set positions correctly', () => {
      const bs = new BitString('1010');
      const positions = bs.getSetPositions();
      
      expect(positions).toEqual([60, 62]); // Positions of '1' bits
    });

    it('should validate bit strings correctly', () => {
      const bs1 = new BitString('1010');
      expect(bs1.isValid()).toBe(true);
      
      const bs2 = new BitString('0'.repeat(64));
      expect(bs2.isValid()).toBe(true);
    });

    it('should handle cloning correctly', () => {
      const original = new BitString('1010');
      const clone = original.clone();
      
      expect(clone.equals(original)).toBe(true);
      expect(clone !== original).toBe(true); // Different instances
    });
  });

  describe('performance operations', () => {
    it('should handle large bit operations efficiently', () => {
      const bs1 = BitString.standardChessPosition();
      const bs2 = BitString.fromHex('aaaaaaaaaaaaaaaa');
      
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        bs1.xor(bs2);
        bs1.and(bs2);
        bs1.or(bs2);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should efficiently handle population count', () => {
      const bs = BitString.fromHex('ffffffffffffffff');
      expect(bs.popCount()).toBe(64);
      
      const sparse = new BitString('1000100010001000');
      expect(sparse.popCount()).toBe(4);
    });
  });

  describe('edge cases', () => {
    it('should handle empty bit string', () => {
      const empty = new BitString('');
      expect(empty.toString()).toBe('0'.repeat(64));
      expect(empty.popCount()).toBe(0);
    });

    it('should handle very long bit strings', () => {
      const long = new BitString('1'.repeat(100));
      expect(long.toString().length).toBe(64); // Should truncate to 64
      expect(long.popCount()).toBe(64);
    });

    it('should handle bit array with wrong length', () => {
      expect(() => new BitString([1, 0, 1])).toThrow('exactly 64 elements');
      expect(() => new BitString(new Array(100).fill(1))).toThrow('exactly 64 elements');
    });

    it('should handle invalid bit array values', () => {
      const invalidArray = new Array(64).fill(0);
      invalidArray[0] = 2; // Invalid value
      
      expect(() => new BitString(invalidArray)).toThrow('only 0s and 1s');
    });

    it('should handle invalid hex strings', () => {
      expect(() => BitString.fromHex('xyz')).toThrow('Invalid hex string');
      expect(() => BitString.fromHex('123g')).toThrow('Invalid hex string');
    });

    it('should handle hex strings of different lengths', () => {
      const short = BitString.fromHex('ff');
      expect(short.popCount()).toBeGreaterThan(0);
      
      const long = BitString.fromHex('1234567890abcdef1234567890abcdef');
      expect(long.toString().length).toBe(64);
    });
  });

  describe('string conversions', () => {
    it('should convert to binary string correctly', () => {
      const bs = new BitString('1010');
      const binary = bs.toString();
      
      expect(binary).toBe('0000000000000000000000000000000000000000000000000000000000001010');
      expect(binary.length).toBe(64);
    });

    it('should handle board string representation', () => {
      const bs = BitString.standardChessPosition();
      const boardStr = bs.toBoardString();
      
      expect(boardStr).toContain('abcdefgh'); // File labels
      expect(boardStr).toContain('8 ');
      expect(boardStr).toContain('1 ');
    });

    it('should convert to hex correctly', () => {
      const bs = new BitString('1111000011110000');
      const hex = bs.toHex();
      
      expect(hex).toMatch(/^0x[0-9a-f]+$/i); // Valid hex format
      expect(hex.length).toBe(18); // 0x + 16 hex chars for 64 bits
    });
  });

  describe('equality and comparison', () => {
    it('should compare BitStrings correctly', () => {
      const bs1 = new BitString('1010');
      const bs2 = new BitString('1010');
      const bs3 = new BitString('1100');
      
      expect(bs1.equals(bs2)).toBe(true);
      expect(bs1.equals(bs3)).toBe(false);
    });

    it('should handle equality with different construction methods', () => {
      const fromString = new BitString('1010');
      const fromArray = new BitString([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0]);
      
      expect(fromString.equals(fromArray)).toBe(true);
    });

    it('should implement hash-like behavior', () => {
      const bs1 = new BitString('1010');
      const bs2 = new BitString('1010');
      const bs3 = new BitString('1100');
      
      expect(bs1.toString()).toBe(bs2.toString());
      expect(bs1.toString()).not.toBe(bs3.toString());
    });
  });

  describe('immutability', () => {
    it('should not modify original BitString during operations', () => {
      const original = new BitString('1010');
      const originalStr = original.toString();
      
      original.setBit(0, 1);
      original.flipBit(1);
      original.xor(new BitString('1111'));
      
      expect(original.toString()).toBe(originalStr); // Should be unchanged
    });

    it('should return new instances from operations', () => {
      const bs1 = new BitString('1010');
      const bs2 = bs1.setBit(63, 1); // Set the rightmost bit
      
      expect(bs1 !== bs2).toBe(true); // Different instances
      expect(bs1.getBit(63)).toBe(0); // Original unchanged
      expect(bs2.getBit(63)).toBe(1); // New instance modified
    });
  });
});