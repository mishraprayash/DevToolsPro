import { describe, it, expect } from 'vitest';
import { testRegex, replaceRegex, highlightMatches, REGEX_LIBRARY } from '../utils';

describe('Regex Utilities', () => {
  it('should list regex library presets', () => {
    expect(REGEX_LIBRARY.length).toBeGreaterThan(0);
    expect(REGEX_LIBRARY.some(r => r.id === 'email')).toBe(true);
  });

  it('should test pattern against input text', () => {
    const res = testRegex('\\d+', 'g', 'Item 123 and 456');
    expect(res.isValid).toBe(true);
    expect(res.matches).toHaveLength(2);
    expect(res.matches[0].text).toBe('123');
    expect(res.matches[1].text).toBe('456');
  });

  it('should handle regex replacement', () => {
    const res = replaceRegex('Hello World', 'World', 'g', 'Vitest');
    expect(res.success).toBe(true);
    if (res.success) expect(res.output).toBe('Hello Vitest');
  });

  it('should highlight match indices', () => {
    const matches = [{ index: 0, text: 'Hello', groups: [] }];
    const highlights = highlightMatches('Hello World', matches);
    expect(highlights).toEqual([{ start: 0, end: 5 }]);
  });

  it('should return error for invalid regex pattern', () => {
    const res = testRegex('[unclosed-character-class', 'g', 'sample');
    expect(res.isValid).toBe(false);
    expect(res.error).toBeDefined();
  });
});
