import { describe, it, expect } from 'vitest';
import { validateHexColor, escapeXml, buildFaviconSvg, buildFavicon } from '../utils';

describe('Favicon Utilities', () => {
  it('should validate and expand hex colors', () => {
    expect(validateHexColor('#fff')).toEqual({ success: true, data: '#ffffff' });
    expect(validateHexColor('#22d3ee')).toEqual({ success: true, data: '#22d3ee' });
    expect(validateHexColor('invalid').success).toBe(false);
  });

  it('should escape XML special characters', () => {
    expect(escapeXml('<A & B>')).toBe('&lt;A &amp; B&gt;');
  });

  it('should build favicon SVG for different shapes', () => {
    const square = buildFaviconSvg({ text: 'A', textColor: '#ffffff', backgroundColor: '#000000', fontSize: 30, shape: 'square', padding: 6 });
    expect(square.success).toBe(true);
    if (square.success) expect(square.data).toContain('<rect x="6" y="6"');

    const circle = buildFaviconSvg({ text: 'B', textColor: '#ffffff', backgroundColor: '#000000', fontSize: 30, shape: 'circle', padding: 6 });
    expect(circle.success).toBe(true);
    if (circle.success) expect(circle.data).toContain('<circle cx="32"');
  });

  it('should build full favicon payload with data URI and link tag', () => {
    const res = buildFavicon({ text: 'PRO', textColor: '#ffffff', backgroundColor: '#000000', fontSize: 24, shape: 'rounded', padding: 4 });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.dataUri).toContain('data:image/svg+xml;');
      expect(res.data.linkTag).toContain('<link rel="icon"');
    }
  });

  it('should handle invalid text lengths', () => {
    expect(buildFavicon({ text: '', textColor: '#fff', backgroundColor: '#000', fontSize: 20, shape: 'square', padding: 0 }).success).toBe(false);
    expect(buildFavicon({ text: 'TOOLONGTEXT', textColor: '#fff', backgroundColor: '#000', fontSize: 20, shape: 'square', padding: 0 }).success).toBe(false);
  });
});
