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

  it('should parse Firefox on Linux User-Agent', () => {
    const ua = 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0';
    const parsed = parseUserAgent(ua);
    expect(parsed.browser.name).toBe('Mozilla Firefox');
    expect(parsed.browser.version).toBe('115.0');
    expect(parsed.os.name).toBe('Linux');
    expect(parsed.engine.name).toBe('Gecko');
    expect(parsed.engine.version).toBe('109.0');
  });

  it('should parse Edge on Windows User-Agent', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.188';
    const parsed = parseUserAgent(ua);
    expect(parsed.browser.name).toBe('Microsoft Edge');
    expect(parsed.browser.version).toBe('115.0.1901.188');
  });

  it('should parse Opera and Vivaldi User-Agents', () => {
    const operaUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 OPR/101.0.0.0';
    const parsedOpera = parseUserAgent(operaUa);
    expect(parsedOpera.browser.name).toBe('Opera');
    expect(parsedOpera.browser.version).toBe('101.0.0.0');

    const vivaldiUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Vivaldi/6.1.3035.111';
    const parsedVivaldi = parseUserAgent(vivaldiUa);
    expect(parsedVivaldi.browser.name).toBe('Vivaldi');
    expect(parsedVivaldi.browser.version).toBe('6.1.3035.111');
  });

  it('should parse Internet Explorer and Trident engine', () => {
    const ieUa = 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0)';
    const parsed = parseUserAgent(ieUa);
    expect(parsed.browser.name).toBe('Internet Explorer');
    expect(parsed.browser.version).toBe('11.0');
    expect(parsed.os.name).toBe('Windows');
    expect(parsed.os.version).toBe('7');
    expect(parsed.engine.name).toBe('Trident');
    expect(parsed.engine.version).toBe('7.0');
  });

  it('should parse Android Mobile and Android Tablet User-Agents', () => {
    const mobileUa = 'Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A.230705.001) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36';
    const parsedMobile = parseUserAgent(mobileUa);
    expect(parsedMobile.os.name).toBe('Android');
    expect(parsedMobile.os.version).toBe('13');
    expect(parsedMobile.device.type).toBe('Mobile');
    expect(parsedMobile.device.brand).toBe('Pixel 7 Build/TQ3A.230705.001');

    const tabletUa = 'Mozilla/5.0 (Linux; Android 12; SM-X900) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
    const parsedTablet = parseUserAgent(tabletUa);
    expect(parsedTablet.device.type).toBe('Tablet');
    expect(parsedTablet.device.brand).toBe('SM-X900');
  });

  it('should parse iPad, macOS, and Windows OS version mappings (8.1, 8, etc.)', () => {
    const iPadUa = 'Mozilla/5.0 (iPad; CPU OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1';
    const parsedIPad = parseUserAgent(iPadUa);
    expect(parsedIPad.device.type).toBe('Tablet');
    expect(parsedIPad.device.brand).toBe('Apple iPad');

    const macUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
    const parsedMac = parseUserAgent(macUa);
    expect(parsedMac.os.name).toBe('macOS');
    expect(parsedMac.os.version).toBe('10.15.7');

    const win81Ua = 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
    expect(parseUserAgent(win81Ua).os.version).toBe('8.1');

    const win8Ua = 'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';
    expect(parseUserAgent(win8Ua).os.version).toBe('8');

    const winPhoneUa = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 920)';
    const parsedWinPhone = parseUserAgent(winPhoneUa);
    expect(parsedWinPhone.device.type).toBe('Mobile');
    expect(parsedWinPhone.device.brand).toBe('Windows Phone');
  });
});
