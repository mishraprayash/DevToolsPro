export type ColorFormat = 'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'cmyk';

export interface RgbColor { r: number; g: number; b: number; a: number }
export interface HslColor { h: number; s: number; l: number; a: number }
export interface CmykColor { c: number; m: number; y: number; k: number }

export interface HarmonyColor {
  name: string;
  hex: string;
  hsl: string;
}

export interface ColorInfo {
  hex: string;
  hexa: string;
  rgb: string;
  rgba: string;
  hsl: string;
  hsla: string;
  cmyk: string;
  r: number;
  g: number;
  b: number;
  h: number;
  s: number;
  l: number;
  c: number;
  m: number;
  y: number;
  k: number;
  a: number;
  luminance: number;
  contrastOnWhite: number;
  contrastOnBlack: number;
  harmonies: HarmonyColor[];
}

export type ConvertResult =
  | ({ success: true } & ColorInfo)
  | { success: false; error: string };

const namedColors: Record<string, string> = {
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  orange: '#ffa500',
  purple: '#800080',
  pink: '#ffc0cb',
  teal: '#008080',
  navy: '#000080',
  yellow: '#ffff00',
  black: '#000000',
  white: '#ffffff',
  gray: '#808080',
  silver: '#c0c0c0',
  gold: '#ffd700',
  crimson: '#dc143c',
  hotpink: '#ff69b4',
  lime: '#00ff00',
  fuchsia: '#ff00ff',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  brown: '#a52a2a',
  olive: '#808000',
  maroon: '#800000',
  aquamarine: '#7fffd4',
  chartreuse: '#7fff00',
  coral: '#ff7f50',
  darkorange: '#ff8c00',
  darkslateblue: '#483d8b',
  deeppink: '#ff1493',
  indigo: '#4b0082',
  khaki: '#f0e68c',
  lavender: '#e6e6fa',
  moccasin: '#ffe4b5',
  papayawhip: '#ffefd5',
  plum: '#dda0dd',
  salmon: '#fa8072',
  skyblue: '#87ceeb',
  tomato: '#ff6347',
  violet: '#ee82ee',
  wheat: '#f5deb3',
  papayapink: '#ffefd5'
};

export function parseHex(input: string): RgbColor | null {
  const cleaned = input.trim().replace(/^#/, '');

  if (cleaned.length === 3) {
    const [r, g, b] = cleaned;
    return { r: parseInt(r + r, 16), g: parseInt(g + g, 16), b: parseInt(b + b, 16), a: 1 };
  }
  if (cleaned.length === 4) {
    const [r, g, b, a] = cleaned;
    return {
      r: parseInt(r + r, 16), g: parseInt(g + g, 16), b: parseInt(b + b, 16),
      a: Math.round((parseInt(a + a, 16) / 255) * 100) / 100,
    };
  }
  if (cleaned.length === 6) {
    if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
    return {
      r: parseInt(cleaned.slice(0, 2), 16),
      g: parseInt(cleaned.slice(2, 4), 16),
      b: parseInt(cleaned.slice(4, 6), 16),
      a: 1,
    };
  }
  if (cleaned.length === 8) {
    if (!/^[0-9a-fA-F]{8}$/.test(cleaned)) return null;
    return {
      r: parseInt(cleaned.slice(0, 2), 16),
      g: parseInt(cleaned.slice(2, 4), 16),
      b: parseInt(cleaned.slice(4, 6), 16),
      a: Math.round((parseInt(cleaned.slice(6, 8), 16) / 255) * 100) / 100,
    };
  }
  return null;
}

export function parseRgb(input: string): RgbColor | null {
  const cleaned = input.trim();
  const comma = /^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(cleaned);
  if (comma) {
    const [r, g, b, a] = [parseInt(comma[1]), parseInt(comma[2]), parseInt(comma[3]), comma[4] !== undefined ? parseFloat(comma[4]) : 1];
    if (r > 255 || g > 255 || b > 255 || a > 1 || a < 0) return null;
    return { r, g, b, a };
  }
  const space = /^rgba?\s*\(\s*(\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+))?\s*\)$/i.exec(cleaned);
  if (space) {
    const [r, g, b, a] = [parseInt(space[1]), parseInt(space[2]), parseInt(space[3]), space[4] !== undefined ? parseFloat(space[4]) : 1];
    if (r > 255 || g > 255 || b > 255 || a > 1 || a < 0) return null;
    return { r, g, b, a };
  }
  return null;
}

export function parseHsl(input: string): HslColor | null {
  const cleaned = input.trim();
  const comma = /^hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(cleaned);
  if (comma) {
    const [h, s, l, a] = [parseInt(comma[1]), parseInt(comma[2]), parseInt(comma[3]), comma[4] !== undefined ? parseFloat(comma[4]) : 1];
    if (h > 360 || s > 100 || l > 100 || a > 1 || a < 0) return null;
    return { h, s, l, a };
  }
  const space = /^hsla?\s*\(\s*(\d+)\s+(\d+)%\s+(\d+)%(?:\s*\/\s*([\d.]+))?\s*\)$/i.exec(cleaned);
  if (space) {
    const [h, s, l, a] = [parseInt(space[1]), parseInt(space[2]), parseInt(space[3]), space[4] !== undefined ? parseFloat(space[4]) : 1];
    if (h > 360 || s > 100 || l > 100 || a > 1 || a < 0) return null;
    return { h, s, l, a };
  }
  return null;
}

export function parseNamedColor(input: string): RgbColor | null {
  const clean = input.trim().toLowerCase();
  const hexVal = namedColors[clean];
  if (hexVal) return parseHex(hexVal);
  return null;
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function rgbToHexa({ r, g, b, a }: RgbColor): string {
  const alpha = Math.round(a * 255).toString(16).padStart(2, '0');
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('') + alpha;
}

export function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100), a: 1 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100), a: 1 };
}

export function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255), a: 1 };
}

export function rgbToCmyk({ r, g, b }: RgbColor): CmykColor {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = Math.round(((1 - rn - k) / (1 - k)) * 100);
  const m = Math.round(((1 - gn - k) / (1 - k)) * 100);
  const y = Math.round(((1 - bn - k) / (1 - k)) * 100);
  return { c, m, y, k: Math.round(k * 100) };
}

export function formatRgb({ r, g, b }: RgbColor): string {
  return `rgb(${r}, ${g}, ${b})`;
}

export function formatRgba({ r, g, b, a }: RgbColor): string {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function formatHsl({ h, s, l }: HslColor): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function formatHsla({ h, s, l, a }: HslColor): string {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

export function formatCmyk({ c, m, y, k }: CmykColor): string {
  return `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`;
}

export function calculateLuminance({ r, g, b }: RgbColor): number {
  const toLinear = (v: number): number => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function calculateContrast(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

export function getHarmonies({ h, s, l }: HslColor): HarmonyColor[] {
  const wrap = (v: number) => ((v % 360) + 360) % 360;
  const fromHsl = (hue: number, name: string): HarmonyColor => {
    const hsl = { h: wrap(hue), s, l, a: 1 };
    const rgb = hslToRgb(hsl);
    return { name, hex: rgbToHex(rgb), hsl: formatHsl(hsl) };
  };

  return [
    fromHsl(h + 180, 'Complementary'),
    fromHsl(h + 30, 'Analogous (Left)'),
    fromHsl(h - 30, 'Analogous (Right)'),
    fromHsl(h + 120, 'Triadic (Left)'),
    fromHsl(h + 240, 'Triadic (Right)'),
    fromHsl(h + 150, 'Split Complementary (Left)'),
    fromHsl(h + 210, 'Split Complementary (Right)'),
  ];
}

export function convertColor(input: string): ConvertResult {
  // 1. Try named CSS colors first
  let rgb = parseNamedColor(input);
  
  // 2. Try standard parsers
  if (!rgb) rgb = parseHex(input);
  if (!rgb) rgb = parseRgb(input);
  
  if (!rgb) {
    const hsl = parseHsl(input);
    if (hsl) rgb = hslToRgb(hsl);
  }

  if (rgb) {
    const hsl = rgbToHsl(rgb);
    const cmyk = rgbToCmyk(rgb);
    const { r, g, b, a } = rgb;
    const luminance = calculateLuminance(rgb);
    return {
      success: true,
      hex: rgbToHex(rgb),
      hexa: rgbToHexa(rgb),
      rgb: formatRgb(rgb),
      rgba: formatRgba(rgb),
      hsl: formatHsl(hsl),
      hsla: formatHsla({ ...hsl, a }),
      cmyk: formatCmyk(cmyk),
      r, g, b, h: hsl.h, s: hsl.s, l: hsl.l, 
      c: cmyk.c, m: cmyk.m, y: cmyk.y, k: cmyk.k, a,
      luminance: Math.round(luminance * 1000) / 1000,
      contrastOnWhite: calculateContrast(luminance, 1),
      contrastOnBlack: calculateContrast(luminance, 0),
      harmonies: getHarmonies(hsl),
    };
  }

  return { success: false, error: 'Invalid color format. Try named colors (tomato, lime), hex (#ff6600), rgb(255, 102, 0), hsl(24, 100%, 50%), cmyk, or alpha variants.' };
}
