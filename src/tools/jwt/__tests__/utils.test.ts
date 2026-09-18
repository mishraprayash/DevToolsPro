import { describe, it, expect } from 'vitest';
import {
  decodeJWT,
  getJWTStatus,
  getJWTExpiryDate,
  getJWTIssuedAt,
  signJWT,
  verifyJwtSignature,
  decodeJwtParts,
} from '../utils';

describe('JWT Utilities', () => {
  const validHeader = { alg: 'HS256', typ: 'JWT' };
  const validPayload = { sub: '1234567890', name: 'John Doe', iat: 1516239022, exp: 2516239022 };
  const expiredPayload = { sub: '1234567890', name: 'John Doe', iat: 1000000000, exp: 1000000500 };

  it('should sign and decode JWT correctly using HS256', async () => {
    const token = await signJWT(validHeader, validPayload, 'my-super-secret');
    expect(token).toBeTypeOf('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = decodeJWT(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.header).toEqual(validHeader);
    expect(decoded?.payload).toEqual(validPayload);
  });

  it('should check JWT status (valid vs expired)', async () => {
    const activeToken = await signJWT(validHeader, validPayload, 'secret');
    expect(getJWTStatus(activeToken)).toBe('valid');

    const expiredToken = await signJWT(validHeader, expiredPayload, 'secret');
    expect(getJWTStatus(expiredToken)).toBe('expired');

    expect(getJWTStatus('invalid.token.here')).toBe('invalid');
  });

  it('should extract expiry and issued-at dates', async () => {
    const token = await signJWT(validHeader, validPayload, 'secret');
    const expDate = getJWTExpiryDate(token);
    const iatDate = getJWTIssuedAt(token);

    expect(expDate).toBeInstanceOf(Date);
    expect(expDate?.getTime()).toBe(2516239022 * 1000);

    expect(iatDate).toBeInstanceOf(Date);
    expect(iatDate?.getTime()).toBe(1516239022 * 1000);
  });

  it('should verify valid and invalid signatures (HS256)', async () => {
    const token = await signJWT(validHeader, validPayload, 'secret123');

    const validVerification = await verifyJwtSignature(token, 'secret123', 'HS256');
    expect(validVerification.valid).toBe(true);
    expect(validVerification.error).toBeUndefined();

    const invalidVerification = await verifyJwtSignature(token, 'wrong-secret', 'HS256');
    expect(invalidVerification.valid).toBe(false);
    expect(invalidVerification.error).toBe('Signature mismatch');
  });

  it('should support HS384 and HS512 algorithms', async () => {
    const token384 = await signJWT(validHeader, validPayload, 'secret384', 'HS384');
    const verify384 = await verifyJwtSignature(token384, 'secret384', 'HS384');
    expect(verify384.valid).toBe(true);

    const token512 = await signJWT(validHeader, validPayload, 'secret512', 'HS512');
    const verify512 = await verifyJwtSignature(token512, 'secret512', 'HS512');
    expect(verify512.valid).toBe(true);
  });

  it('should handle decodeJwtParts with valid and invalid tokens', async () => {
    const token = await signJWT(validHeader, validPayload, 'secret');
    const partsResult = decodeJwtParts(token);

    expect(partsResult.success).toBe(true);
    if (partsResult.success) {
      expect(partsResult.header).toEqual(validHeader);
      expect(partsResult.payload).toEqual(validPayload);
    }

    const invalidTokenParts = decodeJwtParts('invalid-token');
    expect(invalidTokenParts.success).toBe(false);

    const corruptJsonHeader = 'aW52YWxpZF9qc29u.eyJzdWIiOiIxMjM0NTY3ODkwIn0.sig';
    const corruptParts = decodeJwtParts(corruptJsonHeader);
    expect(corruptParts.success).toBe(false);
  });

  it('should handle malformed RSA keys gracefully in RS256 mode', async () => {
    await expect(
      signJWT(validHeader, validPayload, 'invalid-pem-key', 'RS256')
    ).rejects.toThrow('Invalid RSA private key');

    const verifyRes = await verifyJwtSignature('header.payload.sig', 'invalid-pem-key', 'RS256');
    expect(verifyRes.valid).toBe(false);
    expect(verifyRes.error).toBe('Invalid RSA public key');
  });

  it('should handle null / empty inputs in helper functions', () => {
    expect(decodeJWT('')).toBeNull();
    expect(getJWTExpiryDate('')).toBeNull();
    expect(getJWTIssuedAt('')).toBeNull();
    expect(getJWTStatus('gibberish')).toBe('invalid');
  });
});
