import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../utils';

describe('escapeHtml utility', () => {
  it('should return an empty string when given empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should not alter normal safe text', () => {
    const text = 'Hello world 123! @#';
    expect(escapeHtml(text)).toBe(text);
  });

  it('should escape HTML tags and special characters', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const escaped = escapeHtml(maliciousInput);
    expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('should escape single quotes and ampersands', () => {
    const input = "Tom & Jerry's";
    const escaped = escapeHtml(input);
    expect(escaped).toBe('Tom &amp; Jerry&#39;s');
  });

  it('should prevent HTML injection in email attributes or inline tags', () => {
    const payload = '<a href="https://malicious.com" onmouseover="alert(1)">Click here</a>';
    const escaped = escapeHtml(payload);
    expect(escaped).not.toContain('<a');
    expect(escaped).toContain('&lt;a href=&quot;https://malicious.com&quot;');
  });
});
