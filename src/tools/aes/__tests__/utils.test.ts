import { describe, it, expect } from 'vitest';
import { processAES } from '../utils';

describe('AES Utilities', () => {
  const secretKey = 'mysecretkey12345'; // 16 bytes
  const iv = 'mysecretiv123456'; // 16 bytes
  const plaintext = 'Hello, World!';

  it('should encrypt and decrypt using CBC mode (Base64)', async () => {
    // Encrypt
    const encryptResult = await processAES(
      'encrypt',
      'CBC',
      plaintext,
      secretKey,
      'utf8',
      iv,
      'utf8',
      'base64'
    );
    console.log(encryptResult);
    expect(encryptResult.success).toBe(true);
    if (!encryptResult.success) {
      console.error(encryptResult.error);
      return;
    }
    expect(encryptResult.data).toBeTruthy();

    // Decrypt
    const decryptResult = await processAES(
      'decrypt',
      'CBC',
      encryptResult.data,
      secretKey,
      'utf8',
      iv,
      'utf8',
      'base64'
    );
    expect(decryptResult.success).toBe(true);
    if (!decryptResult.success) return;
    expect(decryptResult.data).toBe(plaintext);
  });

  it('should pad short keys correctly', async () => {
    const shortKey = 'short';
    const encryptResult = await processAES(
      'encrypt',
      'CBC',
      plaintext,
      shortKey,
      'utf8',
      iv,
      'utf8',
      'base64'
    );
    console.log(encryptResult);
    expect(encryptResult.success).toBe(true);
  });

  it('should return error on invalid decryption key', async () => {
    const encryptResult = await processAES(
      'encrypt',
      'CBC',
      plaintext,
      secretKey,
      'utf8',
      iv,
      'utf8',
      'base64'
    );
    
    if (!encryptResult.success) return;

    const decryptResult = await processAES(
      'decrypt',
      'CBC',
      encryptResult.data,
      'wrongkey12345678',
      'utf8',
      iv,
      'utf8',
      'base64'
    );
    expect(decryptResult.success).toBe(false);
  });
});
