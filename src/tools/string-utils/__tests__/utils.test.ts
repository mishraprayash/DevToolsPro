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
  describe('Generators', () => {
    it('should generate requested number of words', () => {
      const words = generateWords(5);
      expect(words.split(/\s+/)).toHaveLength(5);
    });

    it('should generate requested number of sentences', () => {
      const sentences = generateSentences(3);
      const splitSentences = sentences.split('.').filter(Boolean);
      expect(splitSentences).toHaveLength(3);
    });

    it('should generate requested number of paragraphs', () => {
      const paragraphs = generateParagraphs(2);
      const splitParas = paragraphs.split('\n\n');
      expect(splitParas).toHaveLength(2);
    });
  });

  describe('analyzeText', () => {
    it('should analyze characters, words, lines, paragraphs, and reading time', () => {
      const text = 'Hello world!\n\nThis is a second paragraph.'; // 7 words: Hello, world!, This, is, a, second, paragraph.
      const res = analyzeText(text);

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.chars).toBe(text.length);
        expect(res.data.words).toBe(7);
        expect(res.data.lines).toBe(3);
        expect(res.data.paragraphs).toBe(2);
        expect(res.data.readingTimeMinutes).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle empty text gracefully', () => {
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
    it('should convert titles into URL-friendly slugs', () => {
      expect(slugify('Hello World! This is a Title')).toBe('hello-world-this-is-a-title');
      expect(slugify('Café & Restaurant')).toBe('cafe-restaurant');
      expect(slugify('Multiple   Spaces')).toBe('multiple-spaces');
    });

    it('should return empty string for empty input', () => {
      expect(slugify('')).toBe('');
    });
  });

  describe('transformText', () => {
    it('should transform text based on selected transformType', () => {
      const input = 'hello world';
      expect(transformText(input, 'upper')).toBe('HELLO WORLD');
      expect(transformText('HELLO WORLD', 'lower')).toBe('hello world');
      expect(transformText(input, 'title')).toBe('Hello World');
      expect(transformText('  padded  ', 'trim')).toBe('padded');
      expect(transformText('Some Title', 'slug')).toBe('some-title');
    });

    it('should return empty string when given empty input', () => {
      expect(transformText('', 'upper')).toBe('');
    });
  });
});
