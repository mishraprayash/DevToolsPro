import { describe, it, expect } from 'vitest';
import {
  encodeBase64,
  decodeBase64,
  encodeUrlStr,
  decodeUrlStr,
  encodeEntities,
  decodeEntities,
} from '../utils';

describe('Encoder Utilities', () => {
  describe('encodeBase64 & decodeBase64', () => {
    it('should encode and decode UTF-8 text in default mode', () => {
      const original = 'Hello World 🚀';
      const encoded = encodeBase64(original, 'utf8');
      expect(encoded).toBe('SGVsbG8gV29ybGQg8J+agA==');
      const decoded = decodeBase64(encoded, 'utf8');
      expect(decoded).toBe(original);
    });

    it('should encode and decode in hex mode', () => {
      const hexInput = '48656c6c6f'; // "Hello"
      const encoded = encodeBase64(hexInput, 'hex');
      expect(encoded).toBe('SGVsbG8=');
      const decoded = decodeBase64(encoded, 'hex');
      expect(decoded).toBe('48656c6c6f');
    });

    it('should encode and decode in binary mode', () => {
      const binInput = '01001000 01100101'; // "He"
      const encoded = encodeBase64(binInput, 'binary');
      expect(encoded).toBe('SGU=');
      const decoded = decodeBase64(encoded, 'binary');
      expect(decoded).toBe('01001000 01100101');
    });

    it('should handle urlSafe option correctly', () => {
      const text = '>?~';
      const urlSafeEncoded = encodeBase64(text, 'utf8', true);

      expect(urlSafeEncoded).not.toContain('+');
      expect(urlSafeEncoded).not.toContain('/');
      expect(urlSafeEncoded).not.toContain('=');

      const decodedFromUrlSafe = decodeBase64(urlSafeEncoded, 'utf8', true);
      expect(decodedFromUrlSafe).toBe(text);
    });

    it('should handle edge cases and malformed inputs gracefully', () => {
      expect(encodeBase64('')).toBe('');
      expect(decodeBase64('')).toBe('');
      // Malformed Base64 string for decode should return empty string via try/catch
      expect(decodeBase64('!!!InvalidBase64!!!')).toBe('');
    });
  });

  describe('encodeUrlStr & decodeUrlStr', () => {
    it('should handle component mode', () => {
      const raw = 'https://example.com/search?q=hello world&tag=#test';
      const encoded = encodeUrlStr(raw, 'component');
      expect(encoded).toBe('https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world%26tag%3D%23test');
      expect(decodeUrlStr(encoded, 'component')).toBe(raw);
    });

    it('should handle uri mode', () => {
      const raw = 'https://example.com/search?q=hello world';
      const encoded = encodeUrlStr(raw, 'uri');
      expect(encoded).toBe('https://example.com/search?q=hello%20world');
      expect(decodeUrlStr(encoded, 'uri')).toBe(raw);
    });

    it('should handle strict mode (encoding RFC 3986 reserved chars)', () => {
      const raw = "hello!'()*";
      const encoded = encodeUrlStr(raw, 'strict');
      expect(encoded).toContain('%21');
      expect(encoded).toContain('%27');
      expect(encoded).toContain('%28');
      expect(encoded).toContain('%29');
      expect(encoded).toContain('%2A');
      expect(decodeUrlStr(encoded, 'strict')).toBe(raw);
    });

    it('should handle malformed URL encoding gracefully', () => {
      // Malformed URL escape sequence
      expect(decodeUrlStr('%E0%A4%A', 'component')).toBe('%E0%A4%A');
    });
  });

  describe('encodeEntities & decodeEntities', () => {
    it('should encode and decode HTML entities with named mode', () => {
      const raw = '<script>alert("Hello & welcome!")</script>';
      const encoded = encodeEntities(raw, { mode: 'named', scope: 'markup' });
      expect(encoded).toBe('&lt;script&gt;alert(&quot;Hello &amp; welcome!&quot;)&lt;/script&gt;');
      expect(decodeEntities(encoded)).toBe(raw);
    });

    it('should handle decimal mode and all scope', () => {
      const raw = '<div>© €</div>';
      const encoded = encodeEntities(raw, { mode: 'decimal', scope: 'all' });
      expect(encoded).toContain('&#169;');
      expect(encoded).toContain('&#8364;');
      expect(decodeEntities(encoded)).toBe(raw);
    });

    it('should handle hex mode', () => {
      const raw = '<h1>Test</h1>';
      const encoded = encodeEntities(raw, { mode: 'hex', scope: 'markup' });
      expect(encoded).toBe('&#x3C;h1&#x3E;Test&#x3C;/h1&#x3E;');
      expect(decodeEntities(encoded)).toBe(raw);
    });

    it('should decode mixed numeric and named entities', () => {
      const input = '&lt;div&gt; &#169; &#x20AC; &unknown; &gt;';
      const decoded = decodeEntities(input);
      expect(decoded).toBe('<div> © € &unknown; >');
    });
  });
});
