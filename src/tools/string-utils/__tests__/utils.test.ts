import { describe, expect, it } from 'vitest';
import {
  analyzeText,
  generateParagraphs,
  generateSentences,
  generateWords,
  slugify,
  transformText,
} from '../utils';

describe('string utils', () => {
  describe('lorem generators', () => {
    it('generateWords respects boundaries and counts', () => {
      const words5 = generateWords(5);
      expect(words5.split(' ').length).toBe(5);

      const words1 = generateWords(0); // Min safe bound = 1
      expect(words1.split(' ').length).toBe(1);

      const wordsMax = generateWords(15000); // Max safe bound = 10000
      expect(wordsMax.split(' ').length).toBe(10000);
    });

    it('generateSentences generates requested sentence count', () => {
      const sentences = generateSentences(3);
      const splitSentences = sentences.split('.').filter(Boolean);
      expect(splitSentences.length).toBe(3);
      expect(sentences[0]).toBe(sentences[0].toUpperCase());
    });

    it('generateParagraphs generates requested paragraph count', () => {
      const paras = generateParagraphs(2);
      const splitParas = paras.split('\n\n');
      expect(splitParas.length).toBe(2);
    });
  });

  describe('analyzeText', () => {
    it('analyzes standard text correctly', () => {
      const text = 'Hello world.\nThis is a test paragraph.\n\nAnother paragraph here.';
      const res = analyzeText(text);

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.chars).toBe(text.length);
        expect(res.data.lines).toBe(4);
        expect(res.data.paragraphs).toBe(2);
        expect(res.data.words).toBe(10);
        expect(res.data.readingTimeMinutes).toBe(0.05);
      }
    });

    it('handles empty string safely', () => {
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

    it('handles null / undefined safely', () => {
      // @ts-expect-error testing runtime safety
      const resNull = analyzeText(null);
      expect(resNull.success).toBe(true);

      // @ts-expect-error testing runtime safety
      const resUndefined = analyzeText(undefined);
      expect(resUndefined.success).toBe(true);
    });
  });

  describe('slugify & transformText', () => {
    it('slugifies titles with special characters and diacritics', () => {
      expect(slugify('Hello World! This is a test...')).toBe('hello-world-this-is-a-test');
      expect(slugify('Café & Crème Brûlée')).toBe('cafe-creme-brulee');
      expect(slugify('')).toBe('');
    });

    it('transforms text according to specified transformType', () => {
      const text = 'hello WORLD test';
      expect(transformText(text, 'upper')).toBe('HELLO WORLD TEST');
      expect(transformText(text, 'lower')).toBe('hello world test');
      expect(transformText(text, 'title')).toBe('Hello World Test');
      expect(transformText('  trim me  ', 'trim')).toBe('trim me');
      expect(transformText('Hello World!', 'slug')).toBe('hello-world');
      expect(transformText('', 'upper')).toBe('');
    });
  });
});
