import { describe, expect, it } from 'vitest';
import {
  decodeBase64,
  decodeEntities,
  decodeUrlStr,
  encodeBase64,
  encodeEntities,
  encodeUrlStr,
} from '../utils';

describe('encoder utils', () => {
  describe('encodeBase64 & decodeBase64', () => {
    it('encodes and decodes UTF-8 strings correctly', () => {
      const text = 'Hello, World! 🚀';
      const encoded = encodeBase64(text, 'utf8');
      expect(encoded).toBe('SGVsbG8sIFdvcmxkISDwn5qA');
      const decoded = decodeBase64(encoded, 'utf8');
      expect(decoded).toBe(text);
    });

    it('handles URL-safe Base64 encoding and decoding', () => {
      const text = 'Hello?World>123';
      const urlSafeEncoded = encodeBase64(text, 'utf8', true);
      expect(urlSafeEncoded).not.toContain('+');
      expect(urlSafeEncoded).not.toContain('/');
      expect(urlSafeEncoded).not.toContain('=');

      const urlSafeDecoded = decodeBase64(urlSafeEncoded, 'utf8', true);
      expect(urlSafeDecoded).toBe(text);
    });

    it('encodes and decodes hex mode', () => {
      const hex = '48656c6c6f'; // "Hello" in hex
      const encoded = encodeBase64(hex, 'hex');
      expect(encoded).toBe('SGVsbG8=');

      const decodedHex = decodeBase64(encoded, 'hex');
      expect(decodedHex).toBe('48656c6c6f');
    });

    it('encodes and decodes binary mode', () => {
      // 01001000 01100101 ('H', 'e')
      const binaryInput = '01001000 01100101';
      const encoded = encodeBase64(binaryInput, 'binary');
      expect(encoded).toBe('SGU=');

      const decodedBin = decodeBase64(encoded, 'binary');
      expect(decodedBin).toBe('01001000 01100101');
    });

    it('handles empty input and edge cases gracefully', () => {
      expect(encodeBase64('')).toBe('');
      expect(decodeBase64('')).toBe('');
      expect(decodeBase64('invalid base64!!!')).toBe('');
    });
  });

  describe('encodeUrlStr & decodeUrlStr', () => {
    it('encodes and decodes using component mode', () => {
      const url = 'https://example.com/search?q=hello world';
      const encoded = encodeUrlStr(url, 'component');
      expect(encoded).toBe('https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world');
      expect(decodeUrlStr(encoded, 'component')).toBe(url);
    });

    it('encodes and decodes using uri mode', () => {
      const url = 'https://example.com/search?q=hello world';
      const encoded = encodeUrlStr(url, 'uri');
      expect(encoded).toBe('https://example.com/search?q=hello%20world');
      expect(decodeUrlStr(encoded, 'uri')).toBe(url);
    });

    it('encodes strict mode (encoding !\'()*)', () => {
      const input = "Hello!* ('world')";
      const encoded = encodeUrlStr(input, 'strict');
      expect(encoded).toContain('%21');
      expect(encoded).toContain('%27');
      expect(encoded).toContain('%28');
      expect(encoded).toContain('%29');
      expect(encoded).toContain('%2A');
      expect(decodeUrlStr(encoded, 'strict')).toBe(input);
    });

    it('handles malformed URI components gracefully', () => {
      const invalidUri = '%E0%A4%A';
      expect(decodeUrlStr(invalidUri)).toBe(invalidUri);
    });
  });

  describe('encodeEntities & decodeEntities', () => {
    it('encodes markup entities with named mode', () => {
      const input = '<script>alert("Hello & World")</script>';
      const encoded = encodeEntities(input, { mode: 'named', scope: 'markup' });
      expect(encoded).toBe('&lt;script&gt;alert(&quot;Hello &amp; World&quot;)&lt;/script&gt;');
    });

    it('encodes all scope with hex and decimal mode', () => {
      const input = 'A & B ©';
      const hexEncoded = encodeEntities(input, { mode: 'hex', scope: 'all' });
      expect(hexEncoded).toContain('&#x26;');
      expect(hexEncoded).toContain('&#xA9;');

      const decEncoded = encodeEntities(input, { mode: 'decimal', scope: 'all' });
      expect(decEncoded).toContain('&#38;');
      expect(decEncoded).toContain('&#169;');
    });

    it('decodes named, hex, and decimal entities', () => {
      const encoded = '&lt;div&gt;&#38; &#x26; &copy;&lt;/div&gt;';
      const decoded = decodeEntities(encoded);
      expect(decoded).toBe('<div>& & ©</div>');
    });

    it('leaves unmapped entity names intact when decoding', () => {
      expect(decodeEntities('&unknownEntity;')).toBe('&unknownEntity;');
    });
  });
});
