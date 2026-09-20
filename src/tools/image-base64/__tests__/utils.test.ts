import { describe, it, expect } from 'vitest';
import { stripDataUrlPrefix, formatFileSize } from '../utils';

describe('Image Base64 Utilities', () => {
  it('should strip data URL prefix', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    expect(stripDataUrlPrefix(dataUrl)).toBe('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    expect(stripDataUrlPrefix('rawbase64string')).toBe('rawbase64string');
  });

  it('should format file sizes correctly', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(5242880)).toBe('5.00 MB');
  });
});
