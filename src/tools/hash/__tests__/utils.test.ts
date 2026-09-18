import { describe, it, expect } from 'vitest';
import { hashString, hashFile, hashAlgorithms } from '../utils';

describe('Hash Utilities', () => {
  const input = 'hello world';

  it('should generate correct MD5 hash', async () => {
    const md5Hash = await hashString('MD5', input);
    expect(md5Hash).toBe('5eb63bbbe01eeed093cb22bb8f5acdc3');
  });

  it('should generate SHA-1, SHA-256, SHA-384, and SHA-512 hashes', async () => {
    const sha1 = await hashString('SHA-1', input);
    expect(sha1).toBe('2aae6c35c94fcfb415dbe95f408b9ce91ee846ed');

    const sha256 = await hashString('SHA-256', input);
    expect(sha256).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');

    const sha384 = await hashString('SHA-384', input);
    expect(sha384).toHaveLength(96);

    const sha512 = await hashString('SHA-512', input);
    expect(sha512).toHaveLength(128);
  });

  it('should hash File objects correctly', async () => {
    const file = new File(['hello world'], 'test.txt', { type: 'text/plain' });
    const md5File = await hashFile('MD5', file);
    expect(md5File).toBe('5eb63bbbe01eeed093cb22bb8f5acdc3');

    const sha256File = await hashFile('SHA-256', file);
    expect(sha256File).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('should expose list of supported hash algorithms', () => {
    expect(hashAlgorithms).toHaveLength(5);
    expect(hashAlgorithms[0].id).toBe('MD5');
  });
});
