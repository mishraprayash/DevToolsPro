import { describe, it, expect } from 'vitest';
import {
  parseUrlString,
  constructUrl,
  encodeUrlComponentSafe,
  decodeUrlComponentSafe,
} from '../utils';

describe('URL Parser Utility Functions', () => {
  describe('parseUrlString', () => {
    it('returns error when input is empty or whitespace', () => {
      expect(parseUrlString('')).toEqual({
        success: false,
        error: 'URL input cannot be empty.',
      });
      expect(parseUrlString('   ')).toEqual({
        success: false,
        error: 'URL input cannot be empty.',
      });
    });

    it('parses full URLs with scheme', () => {
      const res = parseUrlString('https://example.com:8080/path?key=value#hash');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.protocol).toBe('https:');
        expect(res.data.hostname).toBe('example.com');
        expect(res.data.port).toBe('8080');
        expect(res.data.pathname).toBe('/path');
        expect(res.data.search).toBe('?key=value');
        expect(res.data.hash).toBe('#hash');
        expect(res.data.queryParams).toHaveLength(1);
        expect(res.data.queryParams[0]).toMatchObject({
          key: 'key',
          value: 'value',
          enabled: true,
        });
      }
    });

    it('prefixes https:// for inputs that look like domains', () => {
      const inputs = [
        'example.com',
        'sub.domain.co.uk/path?q=1',
        'localhost:3000',
        'localhost/api',
        '127.0.0.1:8000',
        'user:pass@example.org/test',
        '//cdn.site.com/asset.js',
      ];

      for (const input of inputs) {
        const res = parseUrlString(input);
        expect(res.success).toBe(true);
        if (res.success) {
          expect(res.data.protocol).toBe('https:');
        }
      }
    });

    it('does not prefix https:// when input does not look like a domain', () => {
      const nonDomains = [
        '/api/v1/users',
        './relative/path',
        '../parent/path',
        'just_a_string',
        'not a domain',
      ];

      for (const input of nonDomains) {
        const res = parseUrlString(input);
        expect(res.success).toBe(false);
      }
    });
  });

  describe('constructUrl', () => {
    it('constructs URL correctly from components and query params', () => {
      const res = constructUrl(
        'https:',
        'api.example.com',
        '/v1/users',
        [
          { id: '1', key: 'q', value: 'test', enabled: true },
          { id: '2', key: 'disabledKey', value: 'disabledVal', enabled: false },
        ],
        '#top'
      );

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('https://api.example.com/v1/users?q=test#top');
      }
    });

    it('handles credentials if provided', () => {
      const res = constructUrl(
        'http',
        'example.com',
        'dashboard',
        [],
        '',
        { username: 'admin', password: 'secretpassword' }
      );

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('http://admin:secretpassword@example.com/dashboard');
      }
    });
  });

  describe('encodeUrlComponentSafe & decodeUrlComponentSafe', () => {
    it('encodes and decodes components safely', () => {
      const raw = 'hello world & foo=bar';
      const encodedRes = encodeUrlComponentSafe(raw);
      expect(encodedRes.success).toBe(true);

      if (encodedRes.success) {
        expect(encodedRes.data).toBe('hello%20world%20%26%20foo%3Dbar');

        const decodedRes = decodeUrlComponentSafe(encodedRes.data);
        expect(decodedRes.success).toBe(true);
        if (decodedRes.success) {
          expect(decodedRes.data).toBe(raw);
        }
      }
    });

    it('returns error on malformed decode input', () => {
      const res = decodeUrlComponentSafe('%E0%A4%A');
      expect(res.success).toBe(false);
    });
  });
});
