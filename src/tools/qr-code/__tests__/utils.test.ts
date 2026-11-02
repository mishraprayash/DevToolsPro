import { describe, it, expect } from 'vitest';
import { generateQrCode } from '../utils';

describe('QR Code Utilities', () => {
  it('should generate QR code data URL from text', async () => {
    const res = await generateQrCode('https://example.com');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.dataUrl).toContain('data:image/png;base64,');
    }
  });

  it('should fail when text is empty', async () => {
    const res = await generateQrCode('   ');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe('Input cannot be empty');
    }
  });
});
