import { describe, expect, it } from 'vitest';
import { convertNumber, formatLabel, toTwosComplement } from '../utils';

describe('number-base utils', () => {
  describe('convertNumber', () => {
    it('converts decimal to hex, binary, and octal', () => {
      const res = convertNumber('255', 'decimal');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.decimal).toBe('255');
        expect(res.hex).toBe('0xFF');
        expect(res.binary).toBe('0b11111111');
        expect(res.octal).toBe('0o377');
      }
    });

    it('converts hex with prefix to other bases', () => {
      const res = convertNumber('0x1A', 'hex');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.decimal).toBe('26');
        expect(res.hex).toBe('0x1A');
        expect(res.binary).toBe('0b11010');
        expect(res.octal).toBe('0o32');
      }
    });

    it('converts custom base input (e.g. radix 36)', () => {
      const res = convertNumber('z', 36);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.decimal).toBe('35');
      }
    });

    it('supports custom target base output', () => {
      const res = convertNumber('16', 'decimal', 16);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.custom).toBe('10');
      }
    });

    it('supports arbitrary precision BigInt values', () => {
      const bigVal = '123456789012345678901234567890';
      const res = convertNumber(bigVal, 'decimal');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.decimal).toBe(bigVal);
      }
    });

    it('returns error for empty or whitespace-only input', () => {
      const res = convertNumber('  ', 'decimal');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe('Enter a value');
      }
    });

    it('returns error for invalid digits for chosen base', () => {
      const res = convertNumber('99', 'binary');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain('Invalid number value');
      }
    });

    it('returns error for invalid custom radix', () => {
      const res = convertNumber('10', 40);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe('Radix must be between 2 and 36');
      }
    });
  });

  describe('toTwosComplement', () => {
    it('calculates 8-bit two\'s complement for positive and negative numbers', () => {
      const pos = toTwosComplement('5', 8);
      expect(pos.signed).toBe('5');
      expect(pos.unsigned).toBe('5');
      expect(pos.binary).toBe('0000 0101');

      const neg = toTwosComplement('-5', 8);
      expect(neg.signed).toBe('-5');
      expect(neg.unsigned).toBe('251');
      expect(neg.binary).toBe('1111 1011');
    });

    it('handles 16-bit, 32-bit, and 64-bit sizes', () => {
      const res16 = toTwosComplement('-1', 16);
      expect(res16.binary).toBe('1111 1111 1111 1111');

      const res32 = toTwosComplement('-1', 32);
      expect(res32.unsigned).toBe('4294967295');

      const res64 = toTwosComplement('-1', 64);
      expect(res64.unsigned).toBe('18446744073709551615');
    });

    it('handles invalid number strings safely', () => {
      const res = toTwosComplement('invalid', 8);
      expect(res).toEqual({ signed: '0', unsigned: '0', binary: '00000000' });
    });
  });

  describe('formatLabel', () => {
    it('returns correct label for named bases and numbers', () => {
      expect(formatLabel('decimal')).toBe('Decimal (0–9)');
      expect(formatLabel('hex')).toBe('Hexadecimal (0–9, A–F)');
      expect(formatLabel(16)).toBe('Base 16');
    });
  });
});
