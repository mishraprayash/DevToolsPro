import { describe, it, expect } from 'vitest';
import { httpStatusCodes, searchHttpStatus } from '../utils';

describe('HTTP Status Utilities', () => {
  it('should contain predefined HTTP status codes across all major categories', () => {
    expect(httpStatusCodes.length).toBeGreaterThan(30);

    const codes = httpStatusCodes.map(s => s.code);
    expect(codes).toContain(200);
    expect(codes).toContain(404);
    expect(codes).toContain(500);
  });

  describe('searchHttpStatus', () => {
    it('should find status code by exact numeric code', () => {
      const results = searchHttpStatus('404');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].code).toBe(404);
      expect(results[0].message).toBe('Not Found');
    });

    it('should find status code by title/message keyword', () => {
      const results = searchHttpStatus('unauthorized');
      expect(results.some(s => s.code === 401)).toBe(true);
    });

    it('should find status code by description keyword', () => {
      const results = searchHttpStatus('teapot');
      expect(results.some(s => s.code === 418)).toBe(true);
    });

    it('should return empty array for non-matching search query', () => {
      const results = searchHttpStatus('nonexistent_status_code_query_9999');
      expect(results).toEqual([]);
    });

    it('should handle empty search query by returning all status codes', () => {
      const results = searchHttpStatus('');
      expect(results).toHaveLength(httpStatusCodes.length);
    });
  });
});
