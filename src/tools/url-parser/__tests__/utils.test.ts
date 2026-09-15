import { describe, it, expect } from 'vitest';
import {
  parseUrlString,
  constructUrl,
  encodeUrlComponentSafe,
  decodeUrlComponentSafe,
  QueryParam,
} from '../utils';

describe('URL Parser Utilities', () => {
  describe('parseUrlString', () => {
    it('should parse full URL correctly', () => {
      const url = 'https://user:pass@example.com:8080/path/to/page?search=vitest&page=1#section';
      const result = parseUrlString(url);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.protocol).toBe('https:');
        expect(result.data.username).toBe('user');
        expect(result.data.password).toBe('pass');
        expect(result.data.hostname).toBe('example.com');
        expect(result.data.port).toBe('8080');
        expect(result.data.pathname).toBe('/path/to/page');
        expect(result.data.search).toBe('?search=vitest&page=1');
        expect(result.data.hash).toBe('#section');
        expect(result.data.queryParams).toHaveLength(2);
        expect(result.data.queryParams[0].key).toBe('search');
        expect(result.data.queryParams[0].value).toBe('vitest');
      }
    });

    it('should auto-prefix https:// if protocol is missing', () => {
      const result = parseUrlString('example.com/test');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.protocol).toBe('https:');
        expect(result.data.hostname).toBe('example.com');
        expect(result.data.pathname).toBe('/test');
      }
    });

    it('should handle empty input', () => {
      const result = parseUrlString('   ');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('URL input cannot be empty.');
      }
    });

    it('should handle malformed URL input', () => {
      const result = parseUrlString('http://');
      expect(result.success).toBe(false);
    });
  });

  describe('constructUrl', () => {
    it('should reconstruct URL with query parameters and auth', () => {
      const queryParams: QueryParam[] = [
        { id: '1', key: 'q', value: 'search term', enabled: true },
        { id: '2', key: 'filter', value: 'active', enabled: false },
        { id: '3', key: 'page', value: '2', enabled: true },
      ];

      const result = constructUrl(
        'https',
        'api.example.com',
        'v1/users',
        queryParams,
        'top',
        { username: 'admin', password: 'secretpassword' }
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('https://admin:secretpassword@api.example.com/v1/users?q=search+term&page=2#top');
      }
    });

    it('should handle protocol without trailing colon and empty path/hash', () => {
      const result = constructUrl('http', 'localhost:3000', '', [], '');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('http://localhost:3000/');
      }
    });
  });

  describe('encodeUrlComponentSafe & decodeUrlComponentSafe', () => {
    it('should safely encode URL components', () => {
      const res = encodeUrlComponentSafe('hello world & test');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('hello%20world%20%26%20test');
      }
    });

    it('should safely decode URL components', () => {
      const res = decodeUrlComponentSafe('hello%20world%20%26%20test');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('hello world & test');
      }
    });

    it('should return error when decoding malformed URL component', () => {
      const res = decodeUrlComponentSafe('%E0%A4%A');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe('Failed to decode value');
      }
    });
  });
});
