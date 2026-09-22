import { describe, it, expect } from 'vitest';
import {
  decodeJWT,
  getJWTStatus,
  getJWTExpiryDate,
  getJWTIssuedAt,
  decodeJwtParts,
  signJWT,
  verifyJwtSignature,
} from '../utils';

describe('JWT Utilities', () => {
  // Mock JWT header: {"alg":"HS256","typ":"JWT"} -> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
  const headerB64 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

  // Mock valid payload: {"sub":"1234567890","name":"John Doe","iat":1516239022,"exp":2516239022}
  // exp = year 2049
  const validPayloadB64 = 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1MTYyMzkwMjJ9';

  // Mock expired payload: {"sub":"1234567890","name":"John Doe","iat":1516239022,"exp":1516239022}
  // exp = year 2018
  const expiredPayloadB64 = 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9';

  const signature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  const validToken = `${headerB64}.${validPayloadB64}.${signature}`;
  const expiredToken = `${headerB64}.${expiredPayloadB64}.${signature}`;

  describe('decodeJWT', () => {
    it('should decode a valid JWT token', () => {
      const decoded = decodeJWT(validToken);
      expect(decoded).not.toBeNull();
      expect(decoded?.header).toEqual({ alg: 'HS256', typ: 'JWT' });
      expect(decoded?.payload).toEqual({
        sub: '1234567890',
        name: 'John Doe',
        iat: 1516239022,
        exp: 2516239022,
      });
      expect(decoded?.signature).toBe(signature);
    });

    it('should return null for malformed tokens', () => {
      expect(decodeJWT('invalid.token')).toBeNull();
      expect(decodeJWT('invalid.token.parts.extra')).toBeNull();
      expect(decodeJWT('not-base64.not-json.sig')).toBeNull();
    });
  });

  describe('getJWTStatus', () => {
    it('should identify valid non-expired token', () => {
      expect(getJWTStatus(validToken)).toBe('valid');
    });

    it('should identify expired token', () => {
      expect(getJWTStatus(expiredToken)).toBe('expired');
    });

    it('should return invalid for malformed token', () => {
      expect(getJWTStatus('bad-token')).toBe('invalid');
    });

    it('should return valid if exp claim is not present', () => {
      // payload: {"sub":"123"} -> eyJzdWIiOiIxMjMifQ
      const tokenWithoutExp = `${headerB64}.eyJzdWIiOiIxMjMifQ.${signature}`;
      expect(getJWTStatus(tokenWithoutExp)).toBe('valid');
    });
  });

  describe('getJWTExpiryDate & getJWTIssuedAt', () => {
    it('should parse expiry date correctly', () => {
      const expiry = getJWTExpiryDate(validToken);
      expect(expiry).toBeInstanceOf(Date);
      expect(expiry?.getTime()).toBe(2516239022 * 1000);
    });

    it('should parse issued-at date correctly', () => {
      const iat = getJWTIssuedAt(validToken);
      expect(iat).toBeInstanceOf(Date);
      expect(iat?.getTime()).toBe(1516239022 * 1000);
    });

    it('should return null when claim is missing or token is invalid', () => {
      expect(getJWTExpiryDate('bad.token.here')).toBeNull();
      expect(getJWTIssuedAt('bad.token.here')).toBeNull();

      const tokenNoClaims = `${headerB64}.eyJzdWIiOiIxMjMifQ.${signature}`;
      expect(getJWTExpiryDate(tokenNoClaims)).toBeNull();
      expect(getJWTIssuedAt(tokenNoClaims)).toBeNull();
    });
  });

  describe('decodeJwtParts', () => {
    it('should return success true and parsed parts for valid token', () => {
      const result = decodeJwtParts(validToken);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.header.alg).toBe('HS256');
        expect(result.payload.name).toBe('John Doe');
        expect(result.signature).toBe(signature);
      }
    });

    it('should return error if token does not have 3 parts', () => {
      const result = decodeJwtParts('part1.part2');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Token does not have 3 parts');
      }
    });

    it('should return error if header/payload base64 decoding fails or JSON parsing fails', () => {
      // invalid base64 character in header
      const result = decodeJwtParts(`aGVsbG8.${validPayloadB64}.${signature}`);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unable to parse JSON in header/payload');
      }
    });
  });

  describe('signJWT & verifyJwtSignature (HMAC)', () => {
    const secret = 'my-super-secret-key-123';
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { sub: 'user_1', role: 'admin' };

    it('should sign and verify HS256 JWT correctly', async () => {
      const token = await signJWT(header, payload, secret, 'HS256');
      expect(token).toBeDefined();
      expect(token.split('.').length).toBe(3);

      const verification = await verifyJwtSignature(token, secret, 'HS256');
      expect(verification.valid).toBe(true);
      expect(verification.error).toBeUndefined();
    });

    it('should sign and verify HS384 JWT correctly', async () => {
      const token = await signJWT({ alg: 'HS384', typ: 'JWT' }, payload, secret, 'HS384');
      const verification = await verifyJwtSignature(token, secret, 'HS384');
      expect(verification.valid).toBe(true);
    });

    it('should sign and verify HS512 JWT correctly', async () => {
      const token = await signJWT({ alg: 'HS512', typ: 'JWT' }, payload, secret, 'HS512');
      const verification = await verifyJwtSignature(token, secret, 'HS512');
      expect(verification.valid).toBe(true);
    });

    it('should fail verification if secret is incorrect', async () => {
      const token = await signJWT(header, payload, secret, 'HS256');
      const verification = await verifyJwtSignature(token, 'wrong-secret', 'HS256');
      expect(verification.valid).toBe(false);
      expect(verification.error).toBe('Signature mismatch');
    });

    it('should fail verification if token format is invalid or signature is corrupted', async () => {
      const invalidTokenFormat = 'part1.part2';
      const result1 = await verifyJwtSignature(invalidTokenFormat, secret, 'HS256');
      expect(result1.valid).toBe(false);
      expect(result1.error).toBe('Token does not have 3 parts');

      const corruptedSig = `${headerB64}.${validPayloadB64}.!!!invalid_base64!!!`;
      const result2 = await verifyJwtSignature(corruptedSig, secret, 'HS256');
      expect(result2.valid).toBe(false);
    });
  });

  describe('signJWT & verifyJwtSignature (RS256)', () => {
    it('should fail when given invalid RSA PEM key', async () => {
      const invalidPem = '-----BEGIN PRIVATE KEY-----\nNOT_A_KEY\n-----END PRIVATE KEY-----';
      await expect(signJWT({ alg: 'RS256' }, { sub: '123' }, invalidPem, 'RS256')).rejects.toThrow('Failed to sign JWT');

      const verifyResult = await verifyJwtSignature('header.payload.sig', invalidPem, 'RS256');
      expect(verifyResult.valid).toBe(false);
      expect(verifyResult.error).toBe('Invalid RSA public key');
    });
  });
});
