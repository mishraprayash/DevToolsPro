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
    it('should encode and decode utf8 string in standard base64', () => {
      const input = 'Hello World! 🚀';
      const encoded = encodeBase64(input, 'utf8', false);
      expect(encoded).toBe(btoa(unescape(encodeURIComponent(input))));
      const decoded = decodeBase64(encoded, 'utf8', false);
      expect(decoded).toBe(input);
    });

    it('should handle URL-safe base64 encoding and decoding', () => {
      const input = 'Subject?&Name=Test+1';
      const urlSafe = encodeBase64(input, 'utf8', true);
      expect(urlSafe).not.toContain('+');
      expect(urlSafe).not.toContain('/');
      expect(urlSafe).not.toContain('=');

      const decoded = decodeBase64(urlSafe, 'utf8', true);
      expect(decoded).toBe(input);
    });

    it('should encode and decode hex mode', () => {
      const hexInput = '48656c6c6f'; // "Hello" in hex
      const encoded = encodeBase64(hexInput, 'hex', false);
      expect(encoded).toBe('SGVsbG8=');

      const decodedHex = decodeBase64(encoded, 'hex', false);
      expect(decodedHex).toBe('48656c6c6f');
    });

    it('should encode and decode binary mode', () => {
      const binInput = '0100100001100101'; // 'He' in binary
      const encoded = encodeBase64(binInput, 'binary', false);
      expect(encoded).toBe('SGU=');

      const decodedBin = decodeBase64(encoded, 'binary', false);
      expect(decodedBin).toBe('01001000 01100101');
    });

    it('should handle empty strings and malformed inputs gracefully', () => {
      expect(encodeBase64('', 'utf8')).toBe('');
      expect(decodeBase64('', 'utf8')).toBe('');
      expect(decodeBase64('!!!invalid base64!!!', 'utf8')).toBe('');
    });
  });

  describe('encodeUrlStr & decodeUrlStr', () => {
    it('should encode and decode URI components', () => {
      const input = 'https://example.com/search?q=hello world & test';
      const encoded = encodeUrlStr(input, 'component');
      expect(encoded).toBe('https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world%20%26%20test');
      expect(decodeUrlStr(encoded, 'component')).toBe(input);
    });

    it('should handle uri mode', () => {
      const input = 'https://example.com/search?q=hello world';
      const encoded = encodeUrlStr(input, 'uri');
      expect(encoded).toBe('https://example.com/search?q=hello%20world');
      expect(decodeUrlStr(encoded, 'uri')).toBe(input);
    });

    it('should handle strict mode encoding', () => {
      const input = 'hello!(*)\'';
      const encoded = encodeUrlStr(input, 'strict');
      expect(encoded).toBe('hello%21%28%2A%29%27');
      expect(decodeUrlStr(encoded, 'strict')).toBe(input);
    });

    it('should return input on malformed URI decoding error', () => {
      const badUri = '%E0%A4%A';
      expect(decodeUrlStr(badUri, 'component')).toBe(badUri);
    });
  });

  describe('encodeEntities & decodeEntities', () => {
    it('should encode markup characters into named entities', () => {
      const input = '<div class="test">& \'hello\'</div>';
      const encoded = encodeEntities(input, { mode: 'named', scope: 'markup' });
      expect(encoded).toBe('&lt;div class=&quot;test&quot;&gt;&amp; &apos;hello&apos;&lt;/div&gt;');
    });

    it('should encode all non-ascii characters when scope is all', () => {
      const input = 'Price €10 & 50¢';
      const encodedNamed = encodeEntities(input, { mode: 'named', scope: 'all' });
      expect(encodedNamed).toBe('Price &euro;10 &amp; 50&cent;');

      const encodedHex = encodeEntities(input, { mode: 'hex', scope: 'all' });
      expect(encodedHex).toBe('Price &#x20AC;10 &#x26; 50&#xA2;');

      const encodedDec = encodeEntities(input, { mode: 'decimal', scope: 'all' });
      expect(encodedDec).toBe('Price &#8364;10 &#38; 50&#162;');
    });

    it('should decode named, hex, and decimal HTML entities', () => {
      const input = '&lt;div&gt;&euro; &#8364; &#x20AC;&lt;/div&gt;';
      const decoded = decodeEntities(input);
      expect(decoded).toBe('<div>€ € €</div>');
    });

    it('should leave unmapped or unknown entities intact', () => {
      const input = '&unknownEntity; &amp;';
      expect(decodeEntities(input)).toBe('&unknownEntity; &');
    });
  });
});
