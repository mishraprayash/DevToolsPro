import { describe, it, expect } from 'vitest';
import { generateBcryptHash, compareBcryptHash } from '../utils';

describe('Bcrypt Utilities', () => {
  describe('generateBcryptHash', () => {
    it('should generate a valid bcrypt hash with default salt rounds', async () => {
      const res = await generateBcryptHash('myPassword123');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toMatch(/^\$2[ayb]\$.{56}$/);
      }
    });

    it('should generate a valid bcrypt hash with custom salt rounds', async () => {
      const res = await generateBcryptHash('secret', 4);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toMatch(/^\$2[ayb]\$04\$/);
      }
    });

    it('should handle empty password string', async () => {
      const res = await generateBcryptHash('');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBeDefined();
      }
    });
  });

  describe('compareBcryptHash', () => {
    it('should correctly match password with its hash', async () => {
      const password = 'CorrectPassword!';
      const hashRes = await generateBcryptHash(password, 4);
      expect(hashRes.success).toBe(true);
      if (hashRes.success) {
        const matchRes = await compareBcryptHash(password, hashRes.data);
        expect(matchRes.success).toBe(true);
        if (matchRes.success) {
          expect(matchRes.data).toBe(true);
        }
      }
    });

    it('should return false for mismatched password', async () => {
      const password = 'CorrectPassword!';
      const hashRes = await generateBcryptHash(password, 4);
      expect(hashRes.success).toBe(true);
      if (hashRes.success) {
        const matchRes = await compareBcryptHash('WrongPassword!', hashRes.data);
        expect(matchRes.success).toBe(true);
        if (matchRes.success) {
          expect(matchRes.data).toBe(false);
        }
      }
    });

    it('should return success true and data false for invalid hash format', async () => {
      const res = await compareBcryptHash('password', 'invalid_hash_string');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe(false);
      }
    });
  });
});
