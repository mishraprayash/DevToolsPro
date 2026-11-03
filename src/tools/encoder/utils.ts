import type { Result } from '@/types';
import { ok, err } from '@/types';

export type Base64Action = 'encode' | 'decode';
export type Base64Mode = 'utf8' | 'hex' | 'binary';

// --- Internal helpers: replace deprecated escape/unescape with TextEncoder ---

function utf8ToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

// --- Base64 ---

export function encodeBase64Result(input: string, mode: Base64Mode = 'utf8', urlSafe: boolean = false): Result<string> {
  try {
    let bytes: Uint8Array;
    if (mode === 'utf8') {
      bytes = utf8ToBytes(input);
    } else if (mode === 'hex') {
      const cleanHex = input.replace(/[^0-9a-fA-F]/g, '');
      if (cleanHex.length % 2 !== 0) return err('Invalid hex string: odd length');
      if (cleanHex.length === 0 && input.trim().length > 0) return err('Invalid hex string');
      bytes = new Uint8Array(cleanHex.length / 2);
      for (let i = 0; i < cleanHex.length; i += 2) bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
    } else if (mode === 'binary') {
      const cleanBin = input.replace(/[^01\s]/g, '');
      const bits = cleanBin.replace(/\s+/g, '');
      if (bits.length === 0 && input.trim().length > 0) return err('Invalid binary string');
      const groups = bits.match(/.{1,8}/g) ?? [];
      bytes = new Uint8Array(groups.length);
      for (let i = 0; i < groups.length; i++) bytes[i] = parseInt(groups[i].padEnd(8, '0'), 2);
    } else {
      return err(`Unknown mode: ${mode}`);
    }
    let encoded = bytesToBase64(bytes);
    if (urlSafe) encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return ok(encoded);
  } catch (e) {
    return err((e as Error).message || 'Base64 encode failed');
  }
}

export function decodeBase64Result(input: string, mode: Base64Mode = 'utf8', urlSafe: boolean = false): Result<string> {
  try {
    let normalized = input.trim();
    if (!normalized) return ok('');
    if (urlSafe) {
      normalized = normalized.replace(/-/g, '+').replace(/_/g, '/');
      const pad = normalized.length % 4;
      if (pad) normalized += '='.repeat(4 - pad);
    }
    // Validate base64 chars before atob
    if (!/^[A-Za-z0-9+/=]+$/.test(normalized.replace(/\s+/g, ''))) return err('Invalid base64 string');
    const bytes = base64ToBytes(normalized);
    if (mode === 'utf8') return ok(bytesToUtf8(bytes));
    if (mode === 'hex') {
      let hex = '';
      for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
      return ok(hex);
    }
    if (mode === 'binary') {
      let bits = '';
      for (let i = 0; i < bytes.length; i++) bits += bytes[i].toString(2).padStart(8, '0') + ' ';
      return ok(bits.trim());
    }
    return err(`Unknown mode: ${mode}`);
  } catch (e) {
    return err((e as Error).message || 'Base64 decode failed');
  }
}

// Back-compat string wrappers (never throw)
export function encodeBase64(input: string, mode: Base64Mode = 'utf8', urlSafe: boolean = false): string {
  const r = encodeBase64Result(input, mode, urlSafe);
  return r.success ? r.data : '';
}
export function decodeBase64(input: string, mode: Base64Mode = 'utf8', urlSafe: boolean = false): string {
  const r = decodeBase64Result(input, mode, urlSafe);
  return r.success ? r.data : '';
}

// True when decoded text is a JSON object or array worth opening in the JSON tool.
// Bare primitives ("abc", 42, true) are valid JSON but not useful to load, so they're excluded.
export function isJsonCompatible(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if (!((first === '{' && last === '}') || (first === '[' && last === ']'))) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

export type UrlMode = 'component' | 'uri' | 'strict';

export function encodeUrlStrResult(input: string, mode: UrlMode = 'component'): Result<string> {
  try {
    if (mode === 'uri') return ok(encodeURI(input));
    if (mode === 'strict') return ok(encodeURIComponent(input).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`));
    return ok(encodeURIComponent(input));
  } catch (e) {
    return err((e as Error).message || 'URL encode failed');
  }
}

export function decodeUrlStrResult(input: string, mode: UrlMode = 'component'): Result<string> {
  try {
    if (mode === 'uri') return ok(decodeURI(input));
    return ok(decodeURIComponent(input));
  } catch (e) {
    return err((e as Error).message || 'URL decode failed');
  }
}

export function encodeUrlStr(input: string, mode: UrlMode = 'component'): string {
  const r = encodeUrlStrResult(input, mode);
  return r.success ? r.data : input;
}
export function decodeUrlStr(input: string, mode: UrlMode = 'component'): string {
  const r = decodeUrlStrResult(input, mode);
  return r.success ? r.data : input;
}

export type EntityMode = 'named' | 'decimal' | 'hex';
export type EntityScope = 'markup' | 'all';

const namedEntities: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", copy: '©', reg: '®', trade: '™', deg: '°',
  plusmn: '±', times: '×', divide: '÷', frac12: '½', frac14: '¼', frac34: '¾', cent: '¢', pound: '£',
  yen: '¥', euro: '€', sect: '§', para: '¶', middot: '·', bull: '•', hellip: '…', ldquo: '“', rdquo: '”',
  lsquo: '‘', rsquo: '’', mdash: '—', ndash: '–', micro: 'µ'
};

const inverseEntities: Record<string, string> = {};
for (const [key, val] of Object.entries(namedEntities)) inverseEntities[val] = key;

export function encodeEntitiesResult(input: string, options: { mode: EntityMode; scope: EntityScope }): Result<string> {
  try {
    let result = '';
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const code = char.codePointAt(0);
      if (code === undefined) continue;
      const isMarkup = ['&', '<', '>', '"', "'"].includes(char);
      const isNonAscii = code > 127;
      const shouldEncode = options.scope === 'all' ? (isMarkup || isNonAscii) : isMarkup;
      if (shouldEncode) {
        if (options.mode === 'named' && inverseEntities[char]) result += `&${inverseEntities[char]};`;
        else if (options.mode === 'hex') result += `&#x${code.toString(16).toUpperCase()};`;
        else result += `&#${code};`;
      } else result += char;
      if (code > 0xffff) i++;
    }
    return ok(result);
  } catch (e) {
    return err((e as Error).message || 'Entity encode failed');
  }
}

export function decodeEntitiesResult(input: string): Result<string> {
  try {
    let result = input;
    result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
    result = result.replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
    result = result.replace(/&([a-zA-Z0-9]+);/g, (match, name) => namedEntities[name] ?? match);
    return ok(result);
  } catch (e) {
    return err((e as Error).message || 'Entity decode failed');
  }
}

export function encodeEntities(input: string, options: { mode: EntityMode; scope: EntityScope }): string {
  const r = encodeEntitiesResult(input, options);
  return r.success ? r.data : input;
}
export function decodeEntities(input: string): string {
  const r = decodeEntitiesResult(input);
  return r.success ? r.data : input;
}

// ── Image detection (Base64 → Image tool handoff) ───────────────

export type ImageMime = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';

// Sniff an image MIME type from leading magic bytes. Returns null for anything else.
export function detectImageMime(bytes: ArrayLike<number>): ImageMime | null {
  const at = (i: number) => (i < bytes.length ? bytes[i] : -1);
  if (at(0) === 0x89 && at(1) === 0x50 && at(2) === 0x4e && at(3) === 0x47 && at(4) === 0x0d && at(5) === 0x0a && at(6) === 0x1a && at(7) === 0x0a) {
    return 'image/png';
  }
  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return 'image/jpeg';
  if (at(0) === 0x47 && at(1) === 0x49 && at(2) === 0x46 && at(3) === 0x38 && (at(4) === 0x37 || at(4) === 0x39) && at(5) === 0x61) {
    return 'image/gif';
  }
  if (
    at(0) === 0x52 && at(1) === 0x49 && at(2) === 0x46 && at(3) === 0x46 &&
    at(8) === 0x57 && at(9) === 0x45 && at(10) === 0x42 && at(11) === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

// Normalise Base64 / Base64URL text (optionally a data: URL) to a standard, padded Base64 body.
function normalizeBase64Body(input: string): string | null {
  if (typeof input !== 'string') return null;
  let body = input.trim();
  const dataUrl = /^data:[^,]*;base64,/i.exec(body);
  if (dataUrl) body = body.slice(dataUrl[0].length);
  body = body.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  if (!body || !/^[A-Za-z0-9+/]+$/.test(body) || body.length % 4 === 1) return null;
  return body + '='.repeat((4 - (body.length % 4)) % 4);
}

// MIME type of the image encoded in a Base64 string, or null if it isn't a PNG/JPEG/GIF/WebP.
export function detectBase64ImageMime(input: string): ImageMime | null {
  const body = normalizeBase64Body(input);
  if (!body) return null;
  try {
    // 16 Base64 chars decode to 12 bytes: enough for every signature above.
    const head = atob(body.slice(0, 16));
    return detectImageMime(Array.from(head, (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
}

// data: URL for a Base64-encoded image, or null when the bytes aren't a recognised image.
export function base64ToImageDataUrl(input: string): string | null {
  const mime = detectBase64ImageMime(input);
  const body = mime ? normalizeBase64Body(input) : null;
  if (!mime || !body) return null;
  try {
    atob(body); // the whole payload must decode, not just the header
  } catch {
    return null;
  }
  return `data:${mime};base64,${body}`;
}
