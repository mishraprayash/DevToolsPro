import { describe, it, expect } from 'vitest';
import { jsonToTs } from '../utils';

describe('JSON to TS Utilities', () => {
  it('should generate TypeScript interfaces from JSON', () => {
    const json = JSON.stringify({
      id: 1,
      username: 'johndoe',
      tags: ['dev', 'admin'],
      settings: {
        theme: 'dark'
      }
    });

    const res = jsonToTs(json, { rootName: 'User', useInterface: true });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.code).toContain('export interface UserSettings');
      expect(res.code).toContain('export interface User');
      expect(res.code).toContain('username: string;');
      expect(res.code).toContain('tags: string[];');
    }
  });

  it('should return error for invalid JSON input', () => {
    const res = jsonToTs('{ invalid json }');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain('Invalid JSON');
    }
  });
});
