import { describe, it, expect, vi } from 'vitest';
import { stripDataUrlPrefix, formatFileSize, fileToBase64, compressImage } from '../utils';

describe('Image Base64 Utilities', () => {
  it('should strip data URL prefix', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    expect(stripDataUrlPrefix(dataUrl)).toBe('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    expect(stripDataUrlPrefix('rawbase64string')).toBe('rawbase64string');
  });

  it('should format file sizes correctly', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(5242880)).toBe('5.00 MB');
  });

  describe('fileToBase64', () => {
    it('should return error for empty files (size === 0)', async () => {
      const emptyFile = new File([], 'empty.png', { type: 'image/png' });
      const result = await fileToBase64(emptyFile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('File is empty');
      }
    });

    it('should read a non-empty file to base64 successfully', async () => {
      const content = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header
      const file = new File([content], 'test.png', { type: 'image/png' });

      // Mock FileReader in Node environment
      class MockFileReader {
        result: string | null = null;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        error: Error | null = null;

        readAsDataURL() {
          setTimeout(() => {
            this.result = 'data:image/png;base64,iVBORw0KGgo=';
            if (this.onload) this.onload();
          }, 0);
        }
      }

      const originalFileReader = globalThis.FileReader;
      // @ts-expect-error mock FileReader
      globalThis.FileReader = MockFileReader;

      try {
        const result = await fileToBase64(file);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.fileName).toBe('test.png');
          expect(result.dataUrl).toContain('data:image/png;base64');
          expect(result.mimeType).toBe('image/png');
        }
      } finally {
        globalThis.FileReader = originalFileReader;
      }
    });

    it('should handle FileReader error gracefully', async () => {
      const file = new File(['data'], 'error.png', { type: 'image/png' });

      class ErrorFileReader {
        result: string | null = null;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        error: Error | null = new Error('Read failed');

        readAsDataURL() {
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 0);
        }
      }

      const originalFileReader = globalThis.FileReader;
      // @ts-expect-error mock FileReader
      globalThis.FileReader = ErrorFileReader;

      try {
        const result = await fileToBase64(file);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Read failed');
        }
      } finally {
        globalThis.FileReader = originalFileReader;
      }
    });
  });

  describe('compressImage', () => {
    it('should return original dataUrl directly for SVG mimeType', async () => {
      const svgDataUrl = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=';
      const result = await compressImage(svgDataUrl, 'image/svg+xml', { maxWidth: 100 });
      expect(result).toBe(svgDataUrl);
    });

    it('should compress non-SVG image using canvas when Image and document.createElement are available', async () => {
      const testDataUrl = 'data:image/png;base64,iVBORw0KGgo=';

      class MockImage {
        width = 800;
        height = 600;
        onload: (() => void) | null = null;
        onerror: ((e: Error) => void) | null = null;
        set src(_val: string) {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      }

      const mockCtx = {
        fillStyle: '',
        fillRect: vi.fn(),
        drawImage: vi.fn(),
      };

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: () => mockCtx,
        toDataURL: (type: string, quality: number) => `data:${type};compressed;q=${quality}`,
      };

      const originalImage = globalThis.Image;
      const originalDocument = globalThis.document;

      // @ts-expect-error mock Image
      globalThis.Image = MockImage;
      // @ts-expect-error mock document
      globalThis.document = {
        createElement: (tag: string) => {
          if (tag === 'canvas') return mockCanvas;
          return {};
        },
      };

      try {
        const compressed = await compressImage(testDataUrl, 'image/png', {
          maxWidth: 400,
          quality: 0.8,
          outputType: 'image/jpeg',
        });

        expect(mockCanvas.width).toBe(400);
        expect(mockCanvas.height).toBe(300); // 600 * (400/800)
        expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 400, 300);
        expect(compressed).toContain('image/jpeg');
      } finally {
        globalThis.Image = originalImage;
        globalThis.document = originalDocument;
      }
    });

    it('should reject when image loading fails', async () => {
      class ErrorImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_val: string) {
          setTimeout(() => {
            if (this.onerror) this.onerror();
          }, 0);
        }
      }

      const originalImage = globalThis.Image;
      // @ts-expect-error mock Image
      globalThis.Image = ErrorImage;

      try {
        await expect(compressImage('bad-data-url', 'image/png', {})).rejects.toThrow(
          'Failed to load image into canvas for compression.'
        );
      } finally {
        globalThis.Image = originalImage;
      }
    });
  });
});
