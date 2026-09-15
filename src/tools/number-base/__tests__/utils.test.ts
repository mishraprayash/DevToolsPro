import { describe, it, expect } from 'vitest';
import {
  convertNumber,
  toTwosComplement,
  formatLabel,
} from '../utils';

describe('Number Base Utilities', () => {
  describe('convertNumber', () => {
    it('should convert decimal number to hex, binary, octal', () => {
      const res = convertNumber('255', 'decimal');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.decimal).toBe('255');
        expect(res.hex).toBe('0xFF');
        expect(res.binary).toBe('0b11111111');
        expect(res.octal).toBe('0o377');
      }
    });

    it('should convert hex with prefix 0x or without prefix', () => {
      const res1 = convertNumber('0xFF', 'hex');
      const res2 = convertNumber('FF', 'hex');

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
      if (res1.success && res2.success) {
        expect(res1.decimal).toBe('255');
        expect(res2.decimal).toBe('255');
      }
    });

    it('should convert binary and octal prefixed strings', () => {
      const binRes = convertNumber('0b1010', 'binary');
      const octRes = convertNumber('0o77', 'octal');

      expect(binRes.success).toBe(true);
      if (binRes.success) expect(binRes.decimal).toBe('10');

      expect(octRes.success).toBe(true);
      if (octRes.success) expect(octRes.decimal).toBe('63');
    });

    it('should support custom bases from radix 2 to 36', () => {
      // Base 36 "Z" -> 35
      const res = convertNumber('Z', 36, 16);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.decimal).toBe('35');
        expect(res.custom).toBe('23'); // 35 in hex is 23
      }
    });

    it('should return error for empty input or invalid radix/characters', () => {
      expect(convertNumber('  ', 'decimal').success).toBe(false);
      expect(convertNumber('123', 1).success).toBe(false);
      expect(convertNumber('123', 37).success).toBe(false);
      expect(convertNumber('GHI', 'hex').success).toBe(false);
    });
  });

  describe('toTwosComplement', () => {
    it('should convert positive numbers to two\'s complement binary', () => {
      const res = toTwosComplement('15', 8);
      expect(res.signed).toBe('15');
      expect(res.unsigned).toBe('15');
      expect(res.binary).toBe('0000 1111');
    });

    it('should convert negative numbers to two\'s complement binary', () => {
      const res = toTwosComplement('-1', 8);
      expect(res.signed).toBe('-1');
      expect(res.unsigned).toBe('255');
      expect(res.binary).toBe('1111 1111');
    });

    it('should support 16-bit, 32-bit, and 64-bit sizes', () => {
      const res16 = toTwosComplement('-100', 16);
      expect(res16.signed).toBe('-100');

      const res32 = toTwosComplement('65536', 32);
      expect(res32.unsigned).toBe('65536');
    });

    it('should return fallback values on invalid BigInt input', () => {
      const res = toTwosComplement('invalid', 8);
      expect(res).toEqual({ signed: '0', unsigned: '0', binary: '00000000' });
    });
  });

  describe('formatLabel', () => {
    it('should return descriptive labels for known bases and numbers', () => {
      expect(formatLabel('decimal')).toContain('Decimal');
      expect(formatLabel('hex')).toContain('Hexadecimal');
      expect(formatLabel(16)).toBe('Base 16');
    });
  });
});
