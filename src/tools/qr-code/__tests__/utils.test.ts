import { describe, it, expect } from 'vitest';
import { generateQrCode, generateQrToCanvas, QrOptions } from '../utils';

describe('QR Code Utilities', () => {
  describe('generateQrCode', () => {
    it('should generate QR code data URL from text with default options', async () => {
      const res = await generateQrCode('https://example.com');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.dataUrl).toContain('data:image/png;base64,');
      }
    });

    it('should generate QR code with custom options (size, colors, errorCorrectionLevel)', async () => {
      const options: QrOptions = {
        size: 200,
        colorDark: '#123456',
        colorLight: '#ffffff',
        errorCorrectionLevel: 'H',
      };
      const res = await generateQrCode('https://example.com/custom', options);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.dataUrl).toContain('data:image/png;base64,');
      }
    });

    it('should fail when text is empty or whitespace only', async () => {
      const res = await generateQrCode('   ');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe('Input cannot be empty');
      }

      const emptyRes = await generateQrCode('');
      expect(emptyRes.success).toBe(false);
      if (!emptyRes.success) {
        expect(emptyRes.error).toBe('Input cannot be empty');
      }
    });
  });

  describe('generateQrToCanvas', () => {
    it('should fail when text is empty', async () => {
      const mockCanvas = {} as HTMLCanvasElement;
      const res = await generateQrToCanvas(mockCanvas, '');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe('Input cannot be empty');
      }
    });

    it('should handle canvas error when canvas rendering fails', async () => {
      const mockCanvas = {} as HTMLCanvasElement;
      const res = await generateQrToCanvas(mockCanvas, 'https://example.com');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBeDefined();
      }
    });
  });
});
