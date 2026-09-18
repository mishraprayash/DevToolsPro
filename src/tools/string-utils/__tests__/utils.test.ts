import { describe, it, expect } from 'vitest';
import {
  generateWords,
  generateSentences,
  generateParagraphs,
  analyzeText,
  slugify,
  transformText,
} from '../utils';

describe('String Utilities', () => {
  describe('Generator Functions', () => {
    it('should generate exact word count bounded between 1 and 10000', () => {
      const words5 = generateWords(5).split(' ');
      expect(words5).toHaveLength(5);

      const words0 = generateWords(0).split(' ');
      expect(words0).toHaveLength(1); // Clamped min is 1
    });

    it('should generate sentences with initial capital and period', () => {
      const sentence = generateSentences(1);
      expect(sentence.endsWith('.')).toBe(true);
      expect(sentence.charAt(0)).toBe(sentence.charAt(0).toUpperCase());
    });

    it('should generate paragraphs separated by double line breaks', () => {
      const paras = generateParagraphs(2);
      expect(paras.split('\n\n')).toHaveLength(2);
    });
  });

  describe('analyzeText', () => {
    it('should correctly analyze text statistics', () => {
      const input = 'Hello world!\nSecond line.\n\nParagraph 2.';
      const res = analyzeText(input);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.chars).toBe(input.length);
        expect(res.data.lines).toBe(4);
        expect(res.data.paragraphs).toBe(2);
        expect(res.data.words).toBe(6);
        expect(res.data.readingTimeMinutes).toBe(0.03);
      }
    });

    it('should handle empty string correctly', () => {
      const res = analyzeText('');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.chars).toBe(0);
        expect(res.data.words).toBe(0);
        expect(res.data.lines).toBe(0);
        expect(res.data.paragraphs).toBe(0);
      }
    });
  });

  describe('slugify', () => {
    it('should convert strings to url-friendly slugs and remove diacritical marks', () => {
      expect(slugify('Héllò Wörld & Test!')).toBe('hello-world-test');
      expect(slugify('Multiple   spaces')).toBe('multiple-spaces');
    });

    it('should handle empty or null string', () => {
      expect(slugify('')).toBe('');
    });
  });

  describe('transformText', () => {
    it('should perform upper, lower, title, trim, and slug transformations', () => {
      const input = '  hello WORLD  ';
      expect(transformText(input, 'upper')).toBe('  HELLO WORLD  ');
      expect(transformText(input, 'lower')).toBe('  hello world  ');
      expect(transformText('hello world', 'title')).toBe('Hello World');
      expect(transformText(input, 'trim')).toBe('hello WORLD');
      expect(transformText('Hello World', 'slug')).toBe('hello-world');
    });

    it('should handle empty string in transformText', () => {
      expect(transformText('', 'upper')).toBe('');
    });
  });
});
