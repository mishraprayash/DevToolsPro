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
  const secret = 'super-secret-key-12345';
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { sub: '1234567890', name: 'John Doe', iat: 1516239022, exp: 2516239022 };

  it('should sign and decode a valid HS256 JWT', async () => {
    const token = await signJWT(header, payload, secret, 'HS256');
    expect(token).toBeTypeOf('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = decodeJWT(token);
    expect(decoded).not.toBeNull();
    if (decoded) {
      expect(decoded.header).toEqual(header);
      expect(decoded.payload).toEqual(payload);
    }
  });

  it('should verify signature successfully for a signed JWT and fail for wrong secret', async () => {
    const token = await signJWT(header, payload, secret, 'HS256');
    const validRes = await verifyJwtSignature(token, secret, 'HS256');
    expect(validRes.valid).toBe(true);

    const invalidRes = await verifyJwtSignature(token, 'wrong-secret', 'HS256');
    expect(invalidRes.valid).toBe(false);
  });

  it('should calculate JWT status (valid vs expired)', async () => {
    const validToken = await signJWT(header, { exp: Math.floor(Date.now() / 1000) + 3600 }, secret, 'HS256');
    expect(getJWTStatus(validToken)).toBe('valid');

    const expiredToken = await signJWT(header, { exp: Math.floor(Date.now() / 1000) - 3600 }, secret, 'HS256');
    expect(getJWTStatus(expiredToken)).toBe('expired');

    expect(getJWTStatus('invalid.token.str')).toBe('invalid');
  });

  it('should extract expiry and issued dates correctly', async () => {
    const iatSec = 1600000000;
    const expSec = 1700000000;
    const token = await signJWT(header, { iat: iatSec, exp: expSec }, secret, 'HS256');

    expect(getJWTIssuedAt(token)).toEqual(new Date(iatSec * 1000));
    expect(getJWTExpiryDate(token)).toEqual(new Date(expSec * 1000));
    expect(getJWTIssuedAt('invalid')).toBeNull();
    expect(getJWTExpiryDate('invalid')).toBeNull();
  });

  it('should handle decodeJwtParts for valid and invalid tokens', () => {
    const headerB64 = btoa(JSON.stringify(header));
    const payloadB64 = btoa(JSON.stringify(payload));
    const token = `${headerB64}.${payloadB64}.sig`;

    const res = decodeJwtParts(token);
    expect(res.success).toBe(true);

    const badPartsRes = decodeJwtParts('invalid-token');
    expect(badPartsRes.success).toBe(false);

    const badJsonRes = decodeJwtParts('bm90LWpzb24.bm90LWpzb24.sig');
    expect(badJsonRes.success).toBe(false);
  });

  it('should return error when signing RS256 with invalid PEM key', async () => {
    await expect(signJWT(header, payload, 'invalid-pem-key', 'RS256')).rejects.toThrow();
  });
});
