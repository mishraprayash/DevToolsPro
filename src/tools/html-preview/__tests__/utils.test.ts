import { describe, it, expect } from 'vitest';
import { sanitizeHtml, wrapHtmlDocument, formatHtml } from '../utils';

describe('HTML Preview Utilities', () => {
  it('should sanitize HTML tags', () => {
    expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('should wrap HTML content in document boilerplates', () => {
    const wrapped = wrapHtmlDocument('<h1>Hello World</h1>', { tailwind: true, bootstrap: false, fontawesome: false });
    expect(wrapped).toContain('<!DOCTYPE html>');
    expect(wrapped).toContain('tailwindcss.com');
    expect(wrapped).toContain('<h1>Hello World</h1>');
  });

  it('should format HTML string with proper indents', () => {
    const formatted = formatHtml('<div><p>Test</p></div>');
    expect(formatted).toContain('<div>');
    expect(formatted).toContain('  <p>Test');
    expect(formatted).toContain('  </p>');
    expect(formatted).toContain('</div>');
  });
});
