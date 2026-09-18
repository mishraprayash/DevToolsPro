import { describe, it, expect } from 'vitest';
import {
  convertNumber,
  toTwosComplement,
  formatLabel,
} from '../utils';

describe('Number Base Utilities', () => {
  describe('convertNumber', () => {
    it('should convert decimal number to hex, binary, octal', () => {
      const result = convertNumber('255', 'decimal');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.decimal).toBe('255');
        expect(result.hex).toBe('0xFF');
        expect(result.binary).toBe('0b11111111');
        expect(result.octal).toBe('0o377');
      }
    });

    it('should convert hex with prefix "0xFF"', () => {
      const result = convertNumber('0xFF', 'hex');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.decimal).toBe('255');
      }
    });

    it('should convert binary with prefix "0b1010"', () => {
      const result = convertNumber('0b1010', 'binary');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.decimal).toBe('10');
      }
    });

    it('should convert octal "0o77"', () => {
      const result = convertNumber('0o77', 'octal');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.decimal).toBe('63');
      }
    });

    it('should convert custom base (e.g., base 36)', () => {
      const result = convertNumber('z', 36, 10);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.decimal).toBe('35');
        expect(result.custom).toBe('35');
      }
    });

    it('should handle large BigInt precision values', () => {
      const largeNum = '9007199254740993'; // 2^53 + 1
      const result = convertNumber(largeNum, 'decimal');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.decimal).toBe('9007199254740993');
      }
    });

    it('should fail on empty input', () => {
      const res = convertNumber('   ', 'decimal');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe('Enter a value');
      }
    });

    it('should fail on invalid digits for selected base', () => {
      const resHex = convertNumber('0xGG', 'hex');
      expect(resHex.success).toBe(false);

      const resBin = convertNumber('102', 'binary');
      expect(resBin.success).toBe(false);

      const resCustomRadix = convertNumber('10', 1); // radix < 2
      expect(resCustomRadix.success).toBe(false);
    });
  });

  describe('toTwosComplement', () => {
    it('should convert positive numbers in 8-bit', () => {
      const res = toTwosComplement('12', 8);
      expect(res.signed).toBe('12');
      expect(res.unsigned).toBe('12');
      expect(res.binary).toBe('0000 1100');
    });

    it('should convert negative numbers in 8-bit', () => {
      const res = toTwosComplement('-5', 8);
      expect(res.signed).toBe('-5');
      expect(res.unsigned).toBe('251');
      expect(res.binary).toBe('1111 1011');
    });

    it('should handle 16-bit, 32-bit, and 64-bit boundaries', () => {
      const res16 = toTwosComplement('-1', 16);
      expect(res16.unsigned).toBe('65535');

      const res32 = toTwosComplement('-1', 32);
      expect(res32.unsigned).toBe('4294967295');

      const res64 = toTwosComplement('-1', 64);
      expect(res64.unsigned).toBe('18446744073709551615');
    });

    it('should fallback on invalid numeric string', () => {
      const res = toTwosComplement('invalid', 8);
      expect(res).toEqual({ signed: '0', unsigned: '0', binary: '00000000' });
    });
  });

  describe('formatLabel', () => {
    it('should format standard base names and numeric bases', () => {
      expect(formatLabel('decimal')).toContain('Decimal');
      expect(formatLabel('hex')).toContain('Hexadecimal');
      expect(formatLabel('binary')).toContain('Binary');
      expect(formatLabel('octal')).toContain('Octal');
      expect(formatLabel(12)).toBe('Base 12');
    });
  });
});
