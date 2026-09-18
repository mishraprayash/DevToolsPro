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
    it('should generate words with min/max bounds', () => {
      const words5 = generateWords(5);
      expect(words5.split(' ')).toHaveLength(5);

      const wordsBoundMin = generateWords(0);
      expect(wordsBoundMin.split(' ')).toHaveLength(1); // Capped at min 1
    });

    it('should generate sentences with period endings', () => {
      const sentences = generateSentences(3);
      const list = sentences.split('. ');
      expect(list.length).toBeGreaterThanOrEqual(3);
      expect(sentences.endsWith('.')).toBe(true);
    });

    it('should generate paragraphs separated by double newlines', () => {
      const paras = generateParagraphs(2);
      expect(paras).toContain('\n\n');
    });
  });

  describe('analyzeText', () => {
    it('should analyze text statistics correctly', () => {
      const text = 'Hello world!\n\nThis is line two.';
      const res = analyzeText(text);

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.chars).toBe(text.length);
        expect(res.data.lines).toBe(3);
        expect(res.data.words).toBe(6);
        expect(res.data.paragraphs).toBe(2);
        expect(res.data.readingTimeMinutes).toBeGreaterThan(0);
      }
    });

    it('should handle empty string without errors', () => {
      const res = analyzeText('');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.chars).toBe(0);
        expect(res.data.words).toBe(0);
        expect(res.data.lines).toBe(0);
        expect(res.data.paragraphs).toBe(0);
        expect(res.data.readingTimeMinutes).toBe(0);
      }
    });
  });

  describe('slugify', () => {
    it('should slugify standard strings, removing special characters and accents', () => {
      expect(slugify('Hello World!')).toBe('hello-world');
      expect(slugify('  Crème  Brûlée  ')).toBe('creme-brulee');
      expect(slugify('Foo & Bar -- Test')).toBe('foo-bar-test');
    });

    it('should handle empty input', () => {
      expect(slugify('')).toBe('');
    });
  });

  describe('transformText', () => {
    it('should apply transformations correctly', () => {
      const sample = 'hello WORLD test';
      expect(transformText(sample, 'upper')).toBe('HELLO WORLD TEST');
      expect(transformText(sample, 'lower')).toBe('hello world test');
      expect(transformText(sample, 'title')).toBe('Hello World Test');
      expect(transformText('  trim me  ', 'trim')).toBe('trim me');
      expect(transformText('Hello World!', 'slug')).toBe('hello-world');
    });

    it('should handle empty input in transformText', () => {
      expect(transformText('', 'upper')).toBe('');
      expect(transformText('', 'slug')).toBe('');
    });
  });
});
