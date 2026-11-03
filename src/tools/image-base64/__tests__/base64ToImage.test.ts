import { describe, it, expect } from 'vitest';
import { parseImageBase64, base64ToImageFile } from '../utils';

// 1x1 transparent PNG
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

describe('parseImageBase64', () => {
  it('should parse a data URL and keep its MIME type', () => {
    expect(parseImageBase64(`data:image/png;base64,${PNG_B64}`)).toEqual({
      success: true,
      data: { mimeType: 'image/png', base64: PNG_B64 },
    });
    const svg = parseImageBase64('data:image/svg+xml;charset=utf-8;base64,PHN2Zz48L3N2Zz4=');
    expect(svg.success && svg.data.mimeType).toBe('image/svg+xml');
  });

  it('should sniff the MIME type of raw base64 from its magic bytes', () => {
    const png = parseImageBase64(`  ${PNG_B64.slice(0, 40)}\n${PNG_B64.slice(40)}  `);
    expect(png).toEqual({ success: true, data: { mimeType: 'image/png', base64: PNG_B64 } });
    const jpeg = parseImageBase64('/9j/4AAQSkZJRgABAQ==');
    expect(jpeg.success && jpeg.data.mimeType).toBe('image/jpeg');
    const gif = parseImageBase64('R0lGODlhAQABAAAAACw=');
    expect(gif.success && gif.data.mimeType).toBe('image/gif');
  });

  it('should reject non-image or non-base64 input', () => {
    expect(parseImageBase64('').success).toBe(false);
    expect(parseImageBase64('hello world!').success).toBe(false);
    expect(parseImageBase64('aGVsbG8=').success).toBe(false); // "hello" — not an image
    expect(parseImageBase64('data:text/plain;base64,aGVsbG8=').success).toBe(false);
    expect(parseImageBase64('data:image/svg+xml,<svg></svg>').success).toBe(false);
  });
});

describe('base64ToImageFile', () => {
  it('should decode a data URL into an image File', async () => {
    const res = base64ToImageFile(`data:image/png;base64,${PNG_B64}`);
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.name).toBe('pasted-image.png');
    expect(res.data.type).toBe('image/png');
    const bytes = new Uint8Array(await res.data.arrayBuffer());
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });

  it('should return an error result instead of throwing', () => {
    expect(base64ToImageFile('not base64 at all')).toMatchObject({ success: false });
  });
});
