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

    it('should return error if JSON parsing fails', () => {
      // header: "hello" in base64 -> aGVsbG8
      const result = decodeJwtParts(`aGVsbG8.${validPayloadB64}.${signature}`);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unable to parse JSON in header/payload');
      }
    });
  });

  describe('signJWT & verifyJwtSignature', () => {
    it('should sign and verify JWT using HS256', async () => {
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = { sub: 'user123', role: 'admin' };
      const secret = 'super-secret-key';

      const token = await signJWT(header, payload, secret, 'HS256');
      expect(token).toBeDefined();
      expect(token.split('.').length).toBe(3);

      const verification = await verifyJwtSignature(token, secret, 'HS256');
      expect(verification.valid).toBe(true);

      const invalidVerification = await verifyJwtSignature(token, 'wrong-secret', 'HS256');
      expect(invalidVerification.valid).toBe(false);
      expect(invalidVerification.error).toBe('Signature mismatch');
    });

    it('should sign and verify JWT using HS384 and HS512', async () => {
      const header = { typ: 'JWT' };
      const payload = { test: true };
      const secret = 'secret';

      const token384 = await signJWT(header, payload, secret, 'HS384');
      const verify384 = await verifyJwtSignature(token384, secret, 'HS384');
      expect(verify384.valid).toBe(true);

      const token512 = await signJWT(header, payload, secret, 'HS512');
      const verify512 = await verifyJwtSignature(token512, secret, 'HS512');
      expect(verify512.valid).toBe(true);
    });

    it('should handle invalid RS256 keys gracefully', async () => {
      const header = { alg: 'RS256', typ: 'JWT' };
      const payload = { sub: 'user' };

      await expect(signJWT(header, payload, 'invalid-pem-key', 'RS256')).rejects.toThrow('Invalid RSA private key');

      const verification = await verifyJwtSignature('header.payload.sig', 'invalid-pem-key', 'RS256');
      expect(verification.valid).toBe(false);
      expect(verification.error).toBe('Invalid RSA public key');
    });

    it('should return error when verifying malformed tokens or invalid base64 signature', async () => {
      const res1 = await verifyJwtSignature('part1.part2', 'secret', 'HS256');
      expect(res1.valid).toBe(false);
      expect(res1.error).toBe('Token does not have 3 parts');

      const res2 = await verifyJwtSignature('p1.p2.invalid!@#$b64', 'secret', 'HS256');
      expect(res2.valid).toBe(false);
    });
  });
});
