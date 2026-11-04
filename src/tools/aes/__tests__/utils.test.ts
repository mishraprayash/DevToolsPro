import { describe, it, expect } from 'vitest';
import { processAES, convertCipherText } from '../utils';

describe('AES Utilities', () => {
  const secretKey = 'mysecretkey12345'; // 16 bytes
  const iv16 = 'mysecretiv123456'; // 16 bytes
  const iv12 = 'mysecretiv12'; // 12 bytes
  const hexKey = '6d797365637265746b65793132333435'; // hex of 'mysecretkey12345'
  const hexIv = '31323334353637383930313233343536';
  const plaintext = 'Hello, World!';

  describe('Modes and Formats', () => {
    it('should encrypt and decrypt using CBC mode (Base64)', async () => {
      const encryptResult = await processAES('encrypt', 'CBC', plaintext, secretKey, 'utf8', iv16, 'utf8', 'base64');
      expect(encryptResult.success).toBe(true);
      if (!encryptResult.success) return;

      const decryptResult = await processAES('decrypt', 'CBC', encryptResult.data, secretKey, 'utf8', iv16, 'utf8', 'base64');
      expect(decryptResult.success).toBe(true);
      if (!decryptResult.success) return;
      expect(decryptResult.data).toBe(plaintext);
    });

    it('should encrypt and decrypt using CTR mode (Hex)', async () => {
      const encryptResult = await processAES('encrypt', 'CTR', plaintext, secretKey, 'utf8', iv16, 'utf8', 'hex');
      expect(encryptResult.success).toBe(true);
      if (!encryptResult.success) return;

      const decryptResult = await processAES('decrypt', 'CTR', encryptResult.data, secretKey, 'utf8', iv16, 'utf8', 'hex');
      expect(decryptResult.success).toBe(true);
      if (!decryptResult.success) return;
      expect(decryptResult.data).toBe(plaintext);
    });

    it('should encrypt and decrypt using GCM mode (Base64 & Hex Key/IV)', async () => {
      const encryptResult = await processAES('encrypt', 'GCM', plaintext, hexKey, 'hex', hexIv, 'hex', 'base64');
      expect(encryptResult.success).toBe(true);
      if (!encryptResult.success) return;

      const decryptResult = await processAES('decrypt', 'GCM', encryptResult.data, hexKey, 'hex', hexIv, 'hex', 'base64');
      expect(decryptResult.success).toBe(true);
      if (!decryptResult.success) return;
      expect(decryptResult.data).toBe(plaintext);
    });
  });

  describe('Key Padding & Truncation', () => {
    it('should handle short (< 16), medium (17-24), long (25-32), and oversized (> 32) keys', async () => {
      const shortKey = 'short'; // < 16
      const medKey = '123456789012345678'; // 18 bytes -> pads to 24
      const longKey = '1234567890123456789012345'; // 25 bytes -> pads to 32
      const hugeKey = 'a'.repeat(50); // > 32 bytes -> truncates to 32

      for (const k of [shortKey, medKey, longKey, hugeKey]) {
        const enc = await processAES('encrypt', 'GCM', plaintext, k, 'utf8', iv12, 'utf8', 'base64');
        expect(enc.success).toBe(true);
        if (!enc.success) continue;

        const dec = await processAES('decrypt', 'GCM', enc.data, k, 'utf8', iv12, 'utf8', 'base64');
        expect(dec.success).toBe(true);
        if (!dec.success) continue;
        expect(dec.data).toBe(plaintext);
      }
    });
  });

  describe('Validation & Error Handling', () => {
    it('should return error when required fields are empty', async () => {
      const noInput = await processAES('encrypt', 'CBC', '', secretKey, 'utf8', iv16, 'utf8', 'base64');
      expect(noInput.success).toBe(false);
      expect(!noInput.success && noInput.error).toBe('Input is required.');

      const noKey = await processAES('encrypt', 'CBC', plaintext, '', 'utf8', iv16, 'utf8', 'base64');
      expect(noKey.success).toBe(false);
      expect(!noKey.success && noKey.error).toBe('Key is required.');

      const noIv = await processAES('encrypt', 'CBC', plaintext, secretKey, 'utf8', '', 'utf8', 'base64');
      expect(noIv.success).toBe(false);
      expect(!noIv.success && noIv.error).toBe('IV is required.');
    });

    it('should handle invalid hex key or IV', async () => {
      const badHexKey = await processAES('encrypt', 'CBC', plaintext, 'XYZ123', 'hex', iv16, 'utf8', 'base64');
      expect(badHexKey.success).toBe(false);
      expect(!badHexKey.success && badHexKey.error).toContain('Invalid key');

      const badHexIv = await processAES('encrypt', 'CBC', plaintext, secretKey, 'utf8', 'INVALID_HEX', 'hex', 'base64');
      expect(badHexIv.success).toBe(false);
      expect(!badHexIv.success && badHexIv.error).toContain('Invalid IV');
    });

    it('should return error on invalid ciphertext or wrong decryption key', async () => {
      const enc = await processAES('encrypt', 'CBC', plaintext, secretKey, 'utf8', iv16, 'utf8', 'base64');
      if (!enc.success) return;

      const decWrongKey = await processAES('decrypt', 'CBC', enc.data, 'wrongkey12345678', 'utf8', iv16, 'utf8', 'base64');
      expect(decWrongKey.success).toBe(false);

      const decBadCipherHex = await processAES('decrypt', 'CBC', 'XYZ123', secretKey, 'utf8', iv16, 'utf8', 'hex');
      expect(decBadCipherHex.success).toBe(false);
      expect(!decBadCipherHex.success && decBadCipherHex.error).toContain('Invalid ciphertext format');
    });
  });
});

describe('convertCipherText', () => {
  it('round-trips between base64 and hex', () => {
    const hex = convertCipherText('SGVsbG8=', 'base64', 'hex');
    expect(hex).toEqual({ success: true, data: '48656c6c6f' });
    expect(convertCipherText('48656c6c6f', 'hex', 'base64')).toEqual({ success: true, data: 'SGVsbG8=' });
  });

  it('leaves input untouched when formats match or input is empty', () => {
    expect(convertCipherText('abc', 'hex', 'hex')).toEqual({ success: true, data: 'abc' });
    expect(convertCipherText('  ', 'hex', 'base64')).toEqual({ success: true, data: '  ' });
  });

  it('returns an error instead of throwing on malformed hex', () => {
    expect(convertCipherText('abc', 'hex', 'base64').success).toBe(false);
  });
});
