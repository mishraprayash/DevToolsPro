import { describe, it, expect } from 'vitest';
import {
  convertNumber,
  toTwosComplement,
  formatLabel,
} from '../utils';

describe('Number Base Utilities', () => {
  describe('convertNumber', () => {
    it('should convert standard decimal number to hex, binary, and octal', () => {
      const res = convertNumber('255', 'decimal');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.decimal).toBe('255');
        expect(res.hex).toBe('0xFF');
        expect(res.binary).toBe('0b11111111');
        expect(res.octal).toBe('0o377');
      }
    });

    it('should convert hex input with or without 0x prefix', () => {
      const res1 = convertNumber('0xFF', 'hex');
      const res2 = convertNumber('FF', 'hex');
      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
      if (res1.success && res2.success) {
        expect(res1.decimal).toBe('255');
        expect(res2.decimal).toBe('255');
      }
    });

    it('should convert custom base (radix 2-36)', () => {
      const res = convertNumber('z', 36, 10);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.decimal).toBe('35');
        expect(res.custom).toBe('35');
      }
    });

    it('should handle large numbers beyond MAX_SAFE_INTEGER using BigInt', () => {
      const largeNum = '9007199254740993123456789';
      const res = convertNumber(largeNum, 'decimal');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.decimal).toBe(largeNum);
      }
    });

    it('should return error for empty or invalid inputs', () => {
      expect(convertNumber('', 'decimal').success).toBe(false);
      expect(convertNumber('   ', 'decimal').success).toBe(false);
      expect(convertNumber('invalid', 'decimal').success).toBe(false);
      expect(convertNumber('123', 37).success).toBe(false);
      expect(convertNumber('123', 1).success).toBe(false);
    });
  });

  describe('toTwosComplement', () => {
    it('should calculate 2s complement for positive integer', () => {
      const res = toTwosComplement('5', 8);
      expect(res.signed).toBe('5');
      expect(res.unsigned).toBe('5');
      expect(res.binary).toBe('0000 0101');
    });

    it('should calculate 2s complement for negative integer', () => {
      const res = toTwosComplement('-5', 8);
      expect(res.signed).toBe('-5');
      expect(res.unsigned).toBe('251');
      expect(res.binary).toBe('1111 1011');
    });

    it('should handle 32-bit representations with 8-bit spacing', () => {
      const res = toTwosComplement('255', 32);
      expect(res.binary).toBe('00000000 00000000 00000000 11111111');
    });

    it('should fallback gracefully on invalid string input', () => {
      const res = toTwosComplement('not-a-number', 8);
      expect(res.signed).toBe('0');
      expect(res.unsigned).toBe('0');
      expect(res.binary).toBe('00000000');
    });
  });

  describe('formatLabel', () => {
    it('should return correct labels for standard and custom bases', () => {
      expect(formatLabel('decimal')).toBe('Decimal (0–9)');
      expect(formatLabel('hex')).toBe('Hexadecimal (0–9, A–F)');
      expect(formatLabel(16)).toBe('Base 16');
    });
  });
});
