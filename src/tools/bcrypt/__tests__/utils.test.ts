import { describe, it, expect } from 'vitest';
import { generateBcryptHash, compareBcryptHash } from '../utils';

describe('Bcrypt Utilities', () => {
  it('should generate and verify bcrypt hash successfully', async () => {
    const res = await generateBcryptHash('mySecretPassword123', 8);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toMatch(/^\$2[ayb]\$/);

      const compareRes = await compareBcryptHash('mySecretPassword123', res.data);
      expect(compareRes.success).toBe(true);
      if (compareRes.success) {
        expect(compareRes.data).toBe(true);
      }

      const wrongCompare = await compareBcryptHash('wrongPassword', res.data);
      expect(wrongCompare.success).toBe(true);
      if (wrongCompare.success) {
        expect(wrongCompare.data).toBe(false);
      }
    }
  });

  it('should handle empty password input', async () => {
    const res = await generateBcryptHash('', 8);
    expect(res.success).toBe(true);
    if (res.success) {
      const compareRes = await compareBcryptHash('', res.data);
      expect(compareRes.success).toBe(true);
      if (compareRes.success) {
        expect(compareRes.data).toBe(true);
      }
    }
  });

  it('should return data false for unmatched invalid hash on compare', async () => {
    const res = await compareBcryptHash('password', '$2a$10$invalidhashstringhere123456789012345678901234567890');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toBe(false);
    }
  });
});
