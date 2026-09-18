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
  describe('Base64 encoding/decoding', () => {
    it('should encode and decode UTF-8 strings', () => {
      const text = 'Hello, World! 🚀';
      const encoded = encodeBase64(text, 'utf8');
      expect(encoded).toBe('SGVsbG8sIFdvcmxkISDwn5qA');
      const decoded = decodeBase64(encoded, 'utf8');
      expect(decoded).toBe(text);
    });

    it('should handle URL-safe base64', () => {
      const text = 'Subject?';
      const encoded = encodeBase64(text, 'utf8', true);
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');

      const decoded = decodeBase64(encoded, 'utf8', true);
      expect(decoded).toBe(text);
    });

    it('should encode and decode hex mode', () => {
      const hexInput = '48656c6c6f'; // 'Hello' in hex
      const encoded = encodeBase64(hexInput, 'hex');
      expect(encoded).toBe('SGVsbG8=');

      const decoded = decodeBase64('SGVsbG8=', 'hex');
      expect(decoded).toBe(hexInput);
    });

    it('should encode and decode binary mode', () => {
      const binInput = '01001000 01100101'; // 'He' in binary
      const encoded = encodeBase64(binInput, 'binary');
      expect(encoded).toBe('SGU=');

      const decoded = decodeBase64('SGU=', 'binary');
      expect(decoded).toBe('01001000 01100101');
    });

    it('should return empty string on invalid base64 decode input', () => {
      expect(decodeBase64('!!!invalid-base64!!!')).toBe('');
    });
  });

  describe('URL encoding/decoding', () => {
    it('should encode/decode URL component', () => {
      const text = 'hello world & foo=bar';
      const encoded = encodeUrlStr(text, 'component');
      expect(encoded).toBe('hello%20world%20%26%20foo%3Dbar');

      const decoded = decodeUrlStr(encoded, 'component');
      expect(decoded).toBe(text);
    });

    it('should handle URI mode', () => {
      const url = 'https://example.com/path with spaces?a=1&b=2';
      const encoded = encodeUrlStr(url, 'uri');
      expect(encoded).toBe('https://example.com/path%20with%20spaces?a=1&b=2');

      const decoded = decodeUrlStr(encoded, 'uri');
      expect(decoded).toBe(url);
    });

    it('should handle strict mode (encoding special characters !\'()*)', () => {
      const text = "Hello!(World)*'~";
      const encoded = encodeUrlStr(text, 'strict');
      expect(encoded).toContain('%21');
      expect(encoded).toContain('%27');
      expect(encoded).toContain('%28');
      expect(encoded).toContain('%29');
      expect(encoded).toContain('%2A');
    });

    it('should return raw input on malformed URL decode', () => {
      const malformed = '%E0%A4%A';
      expect(decodeUrlStr(malformed, 'component')).toBe(malformed);
    });
  });

  describe('HTML Entity encoding/decoding', () => {
    it('should encode named entities in markup scope', () => {
      const input = '<div class="test">& \'hello\'</div>';
      const encoded = encodeEntities(input, { mode: 'named', scope: 'markup' });
      expect(encoded).toBe('&lt;div class=&quot;test&quot;&gt;&amp; &apos;hello&apos;&lt;/div&gt;');
    });

    it('should encode all characters in decimal and hex modes', () => {
      const input = '<a href="#">€</a>';
      const decimalScopeAll = encodeEntities(input, { mode: 'decimal', scope: 'all' });
      expect(decimalScopeAll).toContain('&#8364;');

      const hexScopeAll = encodeEntities(input, { mode: 'hex', scope: 'all' });
      expect(hexScopeAll).toContain('&#x20AC;');
    });

    it('should decode named, decimal, and hex entities', () => {
      const input = '&lt;hello&gt; &#8364; &#x20AC; &copy; &unknown;';
      const decoded = decodeEntities(input);
      expect(decoded).toBe('<hello> € € © &unknown;');
    });
  });
});
