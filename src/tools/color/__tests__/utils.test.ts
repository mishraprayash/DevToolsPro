import { describe, it, expect } from 'vitest';
import {
  parseHex,
  parseRgb,
  parseHsl,
  parseNamedColor,
  rgbToHex,
  rgbToHexa,
  rgbToHsl,
  hslToRgb,
  rgbToCmyk,
  formatRgb,
  formatRgba,
  formatHsl,
  formatHsla,
  formatCmyk,
  calculateLuminance,
  calculateContrast,
  getHarmonies,
  convertColor,
} from '../utils';

describe('Color Utilities', () => {
  describe('Hex Parsing', () => {
    it('should parse 3-digit, 4-digit, 6-digit, and 8-digit hex colors', () => {
      expect(parseHex('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
      expect(parseHex('#f008')).toEqual({ r: 255, g: 0, b: 0, a: 0.53 });
      expect(parseHex('#00ff00')).toEqual({ r: 0, g: 255, b: 0, a: 1 });
      expect(parseHex('0000ff80')).toEqual({ r: 0, g: 0, b: 255, a: 0.5 });
    });

    it('should return null or NaN object for invalid length/character hex strings', () => {
      expect(parseHex('#12')).toBeNull();
      expect(parseHex('#12345')).toBeNull();
      const parsedXyz = parseHex('#xyz');
      expect(Number.isNaN(parsedXyz?.r)).toBe(true);
    });
  });

  describe('RGB Parsing', () => {
    it('should parse comma-separated and space-separated RGB/RGBA strings', () => {
      expect(parseRgb('rgb(255, 128, 0)')).toEqual({ r: 255, g: 128, b: 0, a: 1 });
      expect(parseRgb('rgba(255, 128, 0, 0.5)')).toEqual({ r: 255, g: 128, b: 0, a: 0.5 });
      expect(parseRgb('rgb(255 128 0 / 0.8)')).toEqual({ r: 255, g: 128, b: 0, a: 0.8 });
    });

    it('should return null for invalid RGB values', () => {
      expect(parseRgb('rgb(300, 0, 0)')).toBeNull();
      expect(parseRgb('rgba(0, 0, 0, 1.5)')).toBeNull();
      expect(parseRgb('invalid rgb')).toBeNull();
    });
  });

  describe('HSL Parsing', () => {
    it('should parse HSL and HSLA strings', () => {
      expect(parseHsl('hsl(120, 100%, 50%)')).toEqual({ h: 120, s: 100, l: 50, a: 1 });
      expect(parseHsl('hsla(240, 50%, 25%, 0.3)')).toEqual({ h: 240, s: 50, l: 25, a: 0.3 });
    });

    it('should return null for out-of-range HSL values', () => {
      expect(parseHsl('hsl(400, 50%, 50%)')).toBeNull();
      expect(parseHsl('hsl(100, 150%, 50%)')).toBeNull();
    });
  });

  describe('Named Colors Parsing', () => {
    it('should parse CSS named colors', () => {
      expect(parseNamedColor('tomato')).toEqual({ r: 255, g: 99, b: 71, a: 1 });
      expect(parseNamedColor('WHITE')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    });

    it('should return null for unrecognised color names', () => {
      expect(parseNamedColor('notacolor')).toBeNull();
    });
  });

  describe('Conversions & Formatting', () => {
    it('should convert RGB to HEX, HEXA, HSL, and CMYK', () => {
      const rgb = { r: 255, g: 0, b: 0, a: 1 };
      expect(rgbToHex(rgb)).toBe('#ff0000');
      expect(rgbToHexa(rgb)).toBe('#ff0000ff');
      expect(rgbToHsl(rgb)).toEqual({ h: 0, s: 100, l: 50, a: 1 });
      expect(rgbToCmyk(rgb)).toEqual({ c: 0, m: 100, y: 100, k: 0 });
    });

    it('should convert HSL to RGB', () => {
      expect(hslToRgb({ h: 120, s: 100, l: 50, a: 1 })).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    });

    it('should format colors into CSS strings', () => {
      expect(formatRgb({ r: 10, g: 20, b: 30, a: 1 })).toBe('rgb(10, 20, 30)');
      expect(formatRgba({ r: 10, g: 20, b: 30, a: 0.5 })).toBe('rgba(10, 20, 30, 0.5)');
      expect(formatHsl({ h: 180, s: 50, l: 50, a: 1 })).toBe('hsl(180, 50%, 50%)');
      expect(formatHsla({ h: 180, s: 50, l: 50, a: 0.2 })).toBe('hsla(180, 50%, 50%, 0.2)');
      expect(formatCmyk({ c: 10, m: 20, y: 30, k: 40 })).toBe('cmyk(10%, 20%, 30%, 40%)');
    });
  });

  describe('Luminance, Contrast & Harmonies', () => {
    it('should calculate luminance and contrast correctly', () => {
      const whiteLuminance = calculateLuminance({ r: 255, g: 255, b: 255, a: 1 });
      const blackLuminance = calculateLuminance({ r: 0, g: 0, b: 0, a: 1 });

      expect(whiteLuminance).toBeCloseTo(1);
      expect(blackLuminance).toBe(0);

      const contrast = calculateContrast(whiteLuminance, blackLuminance);
      expect(contrast).toBe(21);
    });

    it('should generate color harmonies', () => {
      const harmonies = getHarmonies({ h: 0, s: 100, l: 50, a: 1 });
      expect(harmonies).toHaveLength(7);
      expect(harmonies[0].name).toBe('Complementary');
      expect(harmonies[0].hex).toBe('#00ffff');
    });
  });

  describe('convertColor', () => {
    it('should convert any valid color string into comprehensive ColorInfo', () => {
      const res = convertColor('blue');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.hex).toBe('#0000ff');
        expect(res.rgb).toBe('rgb(0, 0, 255)');
        expect(res.hsl).toBe('hsl(240, 100%, 50%)');
        expect(res.contrastOnWhite).toBeGreaterThan(1);
        expect(res.harmonies).toHaveLength(7);
      }
    });

    it('should return error for invalid input string', () => {
      const res = convertColor('not-a-valid-color');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain('Invalid color format');
      }
    });
  });
});
