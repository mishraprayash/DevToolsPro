import { describe, expect, it } from 'vitest';
import {
  decodeJWT,
  decodeJwtParts,
  getJWTExpiryDate,
  getJWTIssuedAt,
  getJWTStatus,
  signJWT,
  verifyJwtSignature,
} from '../utils';

describe('jwt utils', () => {
  // Simple test token: {"alg":"HS256","typ":"JWT"}.{"sub":"1234567890","name":"John Doe","iat":1516239022,"exp":2516239022}.signature
  const validHeader = { alg: 'HS256', typ: 'JWT' };
  const futureExp = Math.floor(Date.now() / 1000) + 3600;
  const pastExp = Math.floor(Date.now() / 1000) - 3600;
  const sampleIat = Math.floor(Date.now() / 1000) - 100;

  const validPayload = { sub: '1234567890', name: 'John Doe', iat: sampleIat, exp: futureExp };
  const expiredPayload = { sub: '1234567890', name: 'John Doe', iat: sampleIat, exp: pastExp };

  describe('signJWT & verifyJwtSignature', () => {
    it('signs and verifies HMAC HS256 tokens', async () => {
      const secret = 'super-secret-key-123';
      const token = await signJWT(validHeader, validPayload, secret, 'HS256');

      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const verification = await verifyJwtSignature(token, secret, 'HS256');
      expect(verification.valid).toBe(true);
      expect(verification.error).toBeUndefined();

      const invalidVerification = await verifyJwtSignature(token, 'wrong-secret', 'HS256');
      expect(invalidVerification.valid).toBe(false);
      expect(invalidVerification.error).toBe('Signature mismatch');
    });

    it('signs and verifies HS384 and HS512 tokens', async () => {
      const secret = 'secret-384-512';
      const token384 = await signJWT(validHeader, validPayload, secret, 'HS384');
      const verify384 = await verifyJwtSignature(token384, secret, 'HS384');
      expect(verify384.valid).toBe(true);

      const token512 = await signJWT(validHeader, validPayload, secret, 'HS512');
      const verify512 = await verifyJwtSignature(token512, secret, 'HS512');
      expect(verify512.valid).toBe(true);
    });

    it('handles invalid RS256 private/public key gracefully', async () => {
      await expect(signJWT(validHeader, validPayload, 'invalid-pem-key', 'RS256')).rejects.toThrow();

      const verification = await verifyJwtSignature('header.payload.sig', 'invalid-pem-key', 'RS256');
      expect(verification.valid).toBe(false);
      expect(verification.error).toBe('Invalid RSA public key');
    });
  });

  describe('decodeJWT, getJWTStatus, getJWTExpiryDate, getJWTIssuedAt', () => {
    it('decodes a valid JWT string correctly', async () => {
      const secret = 'test-secret';
      const token = await signJWT(validHeader, validPayload, secret, 'HS256');
      const decoded = decodeJWT(token);

      expect(decoded).not.toBeNull();
      if (decoded) {
        expect(decoded.header).toEqual(validHeader);
        expect(decoded.payload).toEqual(validPayload);
        expect(decoded.signature).toBe(token.split('.')[2]);
      }
    });

    it('evaluates getJWTStatus as valid for future expiration and expired for past', async () => {
      const secret = 'test-secret';
      const validToken = await signJWT(validHeader, validPayload, secret, 'HS256');
      const expiredToken = await signJWT(validHeader, expiredPayload, secret, 'HS256');

      expect(getJWTStatus(validToken)).toBe('valid');
      expect(getJWTStatus(expiredToken)).toBe('expired');
      expect(getJWTStatus('invalid.token.str')).toBe('invalid');
    });

    it('returns correct Date objects for getJWTExpiryDate and getJWTIssuedAt', async () => {
      const secret = 'test-secret';
      const token = await signJWT(validHeader, validPayload, secret, 'HS256');

      const expDate = getJWTExpiryDate(token);
      expect(expDate).toBeInstanceOf(Date);
      expect(expDate?.getTime()).toBe(futureExp * 1000);

      const iatDate = getJWTIssuedAt(token);
      expect(iatDate).toBeInstanceOf(Date);
      expect(iatDate?.getTime()).toBe(sampleIat * 1000);
    });

    it('returns null for missing exp/iat or malformed tokens', () => {
      const noExpToken = 'eyJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9obiJ9.sig';
      expect(getJWTExpiryDate(noExpToken)).toBeNull();
      expect(getJWTIssuedAt(noExpToken)).toBeNull();
      expect(decodeJWT('not-a-jwt')).toBeNull();
    });
  });

  describe('decodeJwtParts', () => {
    it('decodes valid parts into detailed object', async () => {
      const token = await signJWT(validHeader, validPayload, 'sec', 'HS256');
      const result = decodeJwtParts(token);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.header).toEqual(validHeader);
        expect(result.payload).toEqual(validPayload);
      }
    });

    it('returns error when token format or JSON is invalid', () => {
      expect(decodeJwtParts('part1.part2').success).toBe(false);

      // base64 that is not valid JSON
      const invalidJsonToken = 'eyJhbGciOiJIUzI1NiJ9.aW52YWxpZCBqc29u.sig';
      const result = decodeJwtParts(invalidJsonToken);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unable to parse JSON in header/payload');
      }
    });
  });
});
