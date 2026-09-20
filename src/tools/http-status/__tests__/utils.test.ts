import { describe, it, expect } from 'vitest';
import { httpStatusCodes, searchHttpStatus } from '../utils';

describe('HTTP Status Utilities', () => {
  it('should list all http status codes correctly', () => {
    expect(Array.isArray(httpStatusCodes)).toBe(true);
    expect(httpStatusCodes.length).toBeGreaterThan(40);
    const ok200 = httpStatusCodes.find(s => s.code === 200);
    expect(ok200?.message).toBe('OK');
  });

  it('should search http status codes by code', () => {
    const results = searchHttpStatus('404');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].code).toBe(404);
    expect(results[0].message).toBe('Not Found');
  });

  it('should search http status codes by message / keyword', () => {
    const results = searchHttpStatus('unauthorized');
    expect(results.some(s => s.code === 401)).toBe(true);
  });

  it('should return empty array for non-matching queries', () => {
    const results = searchHttpStatus('nonexistent_status_code_xyz');
    expect(results).toHaveLength(0);
  });
});
