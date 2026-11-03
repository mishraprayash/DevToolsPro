import { describe, it, expect } from 'vitest';
import { detectImageMime, detectBase64ImageMime, base64ToImageDataUrl } from '../utils';

// 1x1 transparent PNG
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
// Minimal GIF89a
const GIF_B64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const toB64 = (bytes: number[]) => btoa(String.fromCharCode(...bytes));

describe('detectImageMime', () => {
  it('recognises PNG, JPEG, GIF and WebP signatures', () => {
    expect(detectImageMime([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])).toBe('image/png');
    expect(detectImageMime([0xff, 0xd8, 0xff, 0xe0])).toBe('image/jpeg');
    expect(detectImageMime([0x47, 0x49, 0x46, 0x38, 0x37, 0x61])).toBe('image/gif');
    expect(detectImageMime([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])).toBe('image/webp');
  });

  it('rejects other bytes and short input', () => {
    expect(detectImageMime([0x25, 0x50, 0x44, 0x46])).toBeNull(); // %PDF
    expect(detectImageMime([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45])).toBeNull(); // WAVE
    expect(detectImageMime([])).toBeNull();
    expect(detectImageMime([0x89, 0x50])).toBeNull();
  });
});

describe('detectBase64ImageMime', () => {
  it('detects real images', () => {
    expect(detectBase64ImageMime(PNG_B64)).toBe('image/png');
    expect(detectBase64ImageMime(GIF_B64)).toBe('image/gif');
    expect(detectBase64ImageMime(toB64([0xff, 0xd8, 0xff, 0xdb, 1, 2, 3, 4]))).toBe('image/jpeg');
  });

  it('accepts data URLs, whitespace and URL-safe alphabet', () => {
    expect(detectBase64ImageMime(`data:image/png;base64,${PNG_B64}`)).toBe('image/png');
    expect(detectBase64ImageMime(`  ${PNG_B64.slice(0, 20)}\n${PNG_B64.slice(20)}  `)).toBe('image/png');
    const jpegUrlSafe = toB64([0xff, 0xd8, 0xff, 0xfb, 0xfe, 0xff]).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(detectBase64ImageMime(jpegUrlSafe)).toBe('image/jpeg');
  });

  it('returns null for text and invalid input', () => {
    expect(detectBase64ImageMime(btoa('hello world'))).toBeNull();
    expect(detectBase64ImageMime('not base64 !!')).toBeNull();
    expect(detectBase64ImageMime('')).toBeNull();
  });
});

describe('base64ToImageDataUrl', () => {
  it('builds a data URL for images', () => {
    expect(base64ToImageDataUrl(PNG_B64)).toBe(`data:image/png;base64,${PNG_B64}`);
  });

  it('re-labels a data URL with the sniffed MIME type', () => {
    expect(base64ToImageDataUrl(`data:application/octet-stream;base64,${GIF_B64}`)).toBe(`data:image/gif;base64,${GIF_B64}`);
  });

  it('returns null for non-images', () => {
    expect(base64ToImageDataUrl(btoa('{"a":1}'))).toBeNull();
  });
});
