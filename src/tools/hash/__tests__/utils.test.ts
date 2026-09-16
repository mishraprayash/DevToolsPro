import { describe, expect, it } from 'vitest';
import { hashFile, hashString } from '../utils';

describe('hash utils', () => {
  describe('hashString', () => {
    it('computes MD5 correctly', async () => {
      // "hello" -> 5d41402abc4b2a76b9719d911017c592
      const res = await hashString('MD5', 'hello');
      expect(res).toBe('5d41402abc4b2a76b9719d911017c592');
    });

    it('computes SHA-1 correctly', async () => {
      // "hello" -> aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d
      const res = await hashString('SHA-1', 'hello');
      expect(res).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
    });

    it('computes SHA-256 correctly', async () => {
      // "hello" -> 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
      const res = await hashString('SHA-256', 'hello');
      expect(res).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });

    it('computes SHA-384 and SHA-512 correctly', async () => {
      const res384 = await hashString('SHA-384', 'hello');
      expect(res384.length).toBe(96);

      const res512 = await hashString('SHA-512', 'hello');
      expect(res512.length).toBe(128);
    });

    it('handles empty string and unicode characters', async () => {
      const emptyMd5 = await hashString('MD5', '');
      expect(emptyMd5).toBe('d41d8cd98f00b204e9800998ecf8427e');

      const unicodeHash = await hashString('SHA-256', 'hello world 🌍');
      expect(typeof unicodeHash).toBe('string');
      expect(unicodeHash.length).toBe(64);
    });
  });

  describe('hashFile', () => {
    it('computes file MD5 and SHA-256 hashes correctly', async () => {
      const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
      const md5Res = await hashFile('MD5', file);
      expect(md5Res).toBe('5d41402abc4b2a76b9719d911017c592');

      const sha256Res = await hashFile('SHA-256', file);
      expect(sha256Res).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });
  });
});
