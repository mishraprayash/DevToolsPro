import { describe, it, expect } from 'vitest';
import { stripDataUrlPrefix, formatFileSize } from '../utils';

describe('Image Base64 Utilities', () => {
  it('should strip data URL prefix', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    expect(stripDataUrlPrefix(dataUrl)).toBe('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    expect(stripDataUrlPrefix('rawbase64string')).toBe('rawbase64string');
  });

  it('should format file sizes correctly', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(1023)).toBe('1023 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1048575)).toBe('1024.0 KB');
    expect(formatFileSize(1048576)).toBe('1.00 MB');
    expect(formatFileSize(5242880)).toBe('5.00 MB');
  });

  it('should handle edge cases for stripDataUrlPrefix', () => {
    expect(stripDataUrlPrefix('')).toBe('');
    expect(stripDataUrlPrefix('data:text/plain,hello')).toBe('hello');
    expect(stripDataUrlPrefix('data:image/jpeg;base64,12345')).toBe('12345');
    expect(stripDataUrlPrefix('no-comma-prefix')).toBe('no-comma-prefix');
  });
});
