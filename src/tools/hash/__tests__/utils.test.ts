import { describe, it, expect } from 'vitest';
import {
  hashString,
  hashFile,
  hashAlgorithms,
} from '../utils';

describe('Hash Utilities', () => {
  describe('hashAlgorithms', () => {
    it('should define supported hash algorithms with security flags', () => {
      expect(hashAlgorithms).toHaveLength(5);
      expect(hashAlgorithms.find((a) => a.id === 'MD5')?.secure).toBe(false);
      expect(hashAlgorithms.find((a) => a.id === 'SHA-256')?.secure).toBe(true);
    });
  });

  describe('hashString', () => {
    it('should compute correct MD5 hash', async () => {
      const hash = await hashString('MD5', 'hello');
      expect(hash).toBe('5d41402abc4b2a76b9719d911017c592');
    });

    it('should compute correct SHA-1 hash', async () => {
      const hash = await hashString('SHA-1', 'hello');
      expect(hash).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
    });

    it('should compute correct SHA-256 hash', async () => {
      const hash = await hashString('SHA-256', 'hello');
      expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });

    it('should compute correct SHA-384 and SHA-512 hashes', async () => {
      const sha384 = await hashString('SHA-384', 'hello');
      expect(sha384).toHaveLength(96);

      const sha512 = await hashString('SHA-512', 'hello');
      expect(sha512).toHaveLength(128);
    });

    it('should handle unicode characters', async () => {
      const hash = await hashString('MD5', '🚀 test');
      expect(hash).toBeDefined();
      expect(hash).toHaveLength(32);
    });
  });

  describe('hashFile', () => {
    it('should hash File content using MD5', async () => {
      const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
      const hash = await hashFile('MD5', file);
      expect(hash).toBe('5d41402abc4b2a76b9719d911017c592');
    });

    it('should hash File content using SHA-256', async () => {
      const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
      const hash = await hashFile('SHA-256', file);
      expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });
  });
});
