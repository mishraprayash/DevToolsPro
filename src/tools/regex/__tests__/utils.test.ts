import { describe, it, expect } from 'vitest';
import {
  testRegex,
  replaceRegex,
  highlightMatches,
  REGEX_LIBRARY,
} from '../utils';

describe('Regex Tester Utilities', () => {
  describe('testRegex', () => {
    it('should find regex matches for a valid pattern', () => {
      const res = testRegex('\\d+', 'g', 'Item 123 and Item 456');
      expect(res.isValid).toBe(true);
      expect(res.matches).toHaveLength(2);
      expect(res.matches[0].text).toBe('123');
      expect(res.matches[0].index).toBe(5);
      expect(res.matches[1].text).toBe('456');
      expect(res.matches[1].index).toBe(18);
    });

    it('should capture regex groups correctly', () => {
      const res = testRegex('(\\w+)@(\\w+\\.\\w+)', 'g', 'user@test.com');
      expect(res.isValid).toBe(true);
      expect(res.matches).toHaveLength(1);
      expect(res.matches[0].groups).toEqual(['user', 'test.com']);
    });

    it('should return empty matches when pattern is empty', () => {
      const res = testRegex('', 'g', 'Some text input');
      expect(res.isValid).toBe(true);
      expect(res.matches).toEqual([]);
    });

    it('should return isValid false for malformed regex pattern', () => {
      const res = testRegex('[unclosed-bracket', 'g', 'test');
      expect(res.isValid).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('replaceRegex', () => {
    it('should perform regex replacement correctly', () => {
      const res = replaceRegex('Hello World', 'World', 'g', 'Vitest');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.output).toBe('Hello Vitest');
      }
    });

    it('should return original text if pattern is empty', () => {
      const res = replaceRegex('Original Text', '', 'g', 'Replacement');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.output).toBe('Original Text');
      }
    });

    it('should return error for invalid pattern', () => {
      const res = replaceRegex('Input', '(invalid', 'g', 'Sub');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBeDefined();
      }
    });
  });

  describe('highlightMatches', () => {
    it('should calculate start and end indices for matches', () => {
      const matches = [
        { index: 5, text: 'abc', groups: [] },
        { index: 12, text: 'defgh', groups: [] },
      ];
      const ranges = highlightMatches('text', matches);
      expect(ranges).toEqual([
        { start: 5, end: 8 },
        { start: 12, end: 17 },
      ]);
    });
  });

  describe('REGEX_LIBRARY', () => {
    it('should contain valid preset patterns', () => {
      expect(REGEX_LIBRARY.length).toBeGreaterThan(0);
      for (const preset of REGEX_LIBRARY) {
        const res = testRegex(preset.pattern, preset.flags, preset.sample);
        expect(res.isValid).toBe(true);
      }
    });
  });
});
