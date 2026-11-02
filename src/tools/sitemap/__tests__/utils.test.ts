import { describe, it, expect } from 'vitest';
import {
  normalizeBaseUrl,
  parsePaths,
  toAbsolute,
  escapeXml,
  buildSitemap,
  buildRobotsTxt
} from '../utils';

describe('Sitemap Utilities', () => {
  describe('normalizeBaseUrl', () => {
    it('should normalize valid base URL', () => {
      const res = normalizeBaseUrl('https://example.com/  ');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('https://example.com');
      }
    });

    it('should reject missing protocol or empty base URL', () => {
      expect(normalizeBaseUrl('example.com').success).toBe(false);
      expect(normalizeBaseUrl('').success).toBe(false);
    });
  });

  describe('parsePaths & helper functions', () => {
    it('should parse valid paths and full URLs', () => {
      const paths = parsePaths('/about\n/contact\nhttps://example.com/blog');
      expect(paths.success).toBe(true);
      if (paths.success) {
        expect(paths.data).toEqual(['/about', '/contact', 'https://example.com/blog']);
      }
    });

    it('should convert path to absolute URL', () => {
      expect(toAbsolute('https://example.com', '/about')).toBe('https://example.com/about');
      expect(toAbsolute('https://example.com', 'https://other.com/about')).toBe('https://other.com/about');
    });

    it('should escape XML special characters', () => {
      expect(escapeXml('<a href="&"> link \' single </a>')).toBe('&lt;a href=&quot;&amp;&quot;&gt; link &apos; single &lt;/a&gt;');
    });
  });

  describe('buildSitemap & buildRobotsTxt', () => {
    it('should build a valid XML sitemap', () => {
      const res = buildSitemap('https://example.com', '/about\n/services', {
        changefreq: 'weekly',
        priority: 0.8,
        includeLastmod: true,
        lastmodDate: '2023-10-01'
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(res.data).toContain('<loc>https://example.com/about</loc>');
        expect(res.data).toContain('<changefreq>weekly</changefreq>');
        expect(res.data).toContain('<priority>0.8</priority>');
        expect(res.data).toContain('<lastmod>2023-10-01</lastmod>');
      }
    });

    it('should build a valid robots.txt', () => {
      const res = buildRobotsTxt('https://example.com');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toContain('User-agent: *');
        expect(res.data).toContain('Sitemap: https://example.com/sitemap.xml');
      }
    });
  });
});
