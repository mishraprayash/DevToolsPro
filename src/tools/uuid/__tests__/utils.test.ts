import { describe, it, expect } from 'vitest';
import {
  generateV1,
  generateV4,
  generateV7,
  formatUuid,
  generateBulkUuids,
  UuidOptions,
} from '../utils';

describe('UUID Utilities', () => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  describe('Generators (v1, v4, v7)', () => {
    it('should generate valid UUID v1 string with version digit 1', () => {
      const v1 = generateV1();
      expect(v1).toMatch(uuidRegex);
      expect(v1.charAt(14)).toBe('1');
    });

    it('should generate valid UUID v4 string with version digit 4', () => {
      const v4 = generateV4();
      expect(v4).toMatch(uuidRegex);
      expect(v4.charAt(14)).toBe('4');
    });

    it('should generate valid UUID v7 string with version digit 7', () => {
      const v7 = generateV7();
      expect(v7).toMatch(uuidRegex);
      expect(v7.charAt(14)).toBe('7');
    });
  });

  describe('formatUuid', () => {
    const sampleUuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const defaultOptions: UuidOptions = {
      version: 4,
      casing: 'lower',
      brackets: 'none',
      noHyphens: false,
    };

    it('should convert casing to uppercase when requested', () => {
      const formatted = formatUuid(sampleUuid, { ...defaultOptions, casing: 'upper' });
      expect(formatted).toBe('F47AC10B-58CC-4372-A567-0E02B2C3D479');
    });

    it('should remove hyphens when noHyphens is true', () => {
      const formatted = formatUuid(sampleUuid, { ...defaultOptions, noHyphens: true });
      expect(formatted).toBe('f47ac10b58cc4372a5670e02b2c3d479');
    });

    it('should wrap UUID in curly brackets or parentheses', () => {
      const curly = formatUuid(sampleUuid, { ...defaultOptions, brackets: 'curly' });
      expect(curly).toBe(`{${sampleUuid}}`);

      const parens = formatUuid(sampleUuid, { ...defaultOptions, brackets: 'parentheses' });
      expect(parens).toBe(`(${sampleUuid})`);
    });
  });

  describe('generateBulkUuids', () => {
    const defaultOptions: UuidOptions = {
      version: 4,
      casing: 'lower',
      brackets: 'none',
      noHyphens: false,
    };

    it('should generate requested count of formatted UUIDs', () => {
      const list = generateBulkUuids(5, defaultOptions);
      expect(list).toHaveLength(5);
      list.forEach((uuid) => expect(uuid).toMatch(uuidRegex));
    });

    it('should clamp bulk count between 1 and 500', () => {
      expect(generateBulkUuids(0, defaultOptions)).toHaveLength(1);
      expect(generateBulkUuids(1000, defaultOptions)).toHaveLength(500);
    });
  });
});
