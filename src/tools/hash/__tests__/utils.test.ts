import { describe, it, expect } from 'vitest';
import {
  hashString,
  hashFile,
  hashAlgorithms,
} from '../utils';

describe('Hash Utilities', () => {
  it('should compute correct MD5 hashes', async () => {
    const md5Hello = await hashString('MD5', 'hello');
    expect(md5Hello).toBe('5d41402abc4b2a76b9719d911017c592');

    const md5Empty = await hashString('MD5', '');
    expect(md5Empty).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('should compute correct SHA-256 hashes', async () => {
    const sha256Hello = await hashString('SHA-256', 'hello');
    expect(sha256Hello).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('should compute SHA-1, SHA-384, SHA-512 hashes', async () => {
    const sha1 = await hashString('SHA-1', 'test');
    expect(sha1).toBe('a94a8fe5ccb19ba61c4c0873d391e987982fbbd3');

    const sha384 = await hashString('SHA-384', 'test');
    expect(sha384).toHaveLength(96);

    const sha512 = await hashString('SHA-512', 'test');
    expect(sha512).toHaveLength(128);
  });

  it('should hash File objects correctly', async () => {
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });

    const md5FileHash = await hashFile('MD5', file);
    expect(md5FileHash).toBe('5d41402abc4b2a76b9719d911017c592');

    const sha256FileHash = await hashFile('SHA-256', file);
    expect(sha256FileHash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('should export list of hash algorithms with security status', () => {
    expect(hashAlgorithms).toBeInstanceOf(Array);
    expect(hashAlgorithms.find(a => a.id === 'MD5')?.secure).toBe(false);
    expect(hashAlgorithms.find(a => a.id === 'SHA-256')?.secure).toBe(true);
  });
});
