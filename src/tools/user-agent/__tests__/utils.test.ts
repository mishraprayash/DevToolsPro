import { describe, it, expect } from 'vitest';
import { parseUserAgent } from '../utils';

describe('User-Agent Utilities', () => {
  it('should parse Chrome on Windows User-Agent', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
    const parsed = parseUserAgent(ua);
    expect(parsed.browser.name).toBe('Google Chrome');
    expect(parsed.browser.version).toBe('115.0.0.0');
    expect(parsed.os.name).toBe('Windows');
    expect(parsed.os.version).toBe('10 / 11');
    expect(parsed.device.type).toBe('Desktop');
    expect(parsed.engine.name).toBe('WebKit');
  });

  it('should parse Safari on iPhone User-Agent', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';
    const parsed = parseUserAgent(ua);
    expect(parsed.browser.name).toBe('Apple Safari');
    expect(parsed.browser.version).toBe('16.5');
    expect(parsed.os.name).toBe('iOS');
    expect(parsed.os.version).toBe('16.5');
    expect(parsed.device.type).toBe('Mobile');
    expect(parsed.device.brand).toBe('Apple iPhone');
  });

  it('should handle unknown or empty User-Agent strings gracefully', () => {
    const parsed = parseUserAgent('');
    expect(parsed.browser.name).toBe('Unknown Browser');
    expect(parsed.os.name).toBe('Unknown OS');
    expect(parsed.device.type).toBe('Desktop');
    expect(parsed.engine.name).toBe('Unknown Engine');
  });
});
