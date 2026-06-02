export type Base64Action = 'encode' | 'decode';
export type Base64Mode = 'utf8' | 'hex' | 'binary';

export function encodeBase64(input: string, mode: Base64Mode = 'utf8', urlSafe: boolean = false): string {
  try {
    let binaryString = '';
    if (mode === 'utf8') {
      binaryString = unescape(encodeURIComponent(input));
    } else if (mode === 'hex') {
      const cleanHex = input.replace(/[^0-9a-fA-F]/g, '');
      const bytes = new Uint8Array(cleanHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
    } else if (mode === 'binary') {
      const cleanBin = input.replace(/[^01]/g, '');
      const bytes = new Uint8Array(cleanBin.match(/.{1,8}/g)?.map(byte => parseInt(byte, 2)) || []);
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
    }
    const encoded = btoa(binaryString);
    if (urlSafe) {
      return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    return encoded;
  } catch {
    return '';
  }
}

export function decodeBase64(input: string, mode: Base64Mode = 'utf8', urlSafe: boolean = false): string {
  try {
    let normalized = input.trim();
    if (urlSafe) {
      normalized = normalized.replace(/-/g, '+').replace(/_/g, '/');
      const pad = normalized.length % 4;
      if (pad) {
        normalized += '='.repeat(4 - pad);
      }
    }
    const binary = atob(normalized);
    if (mode === 'utf8') {
      return decodeURIComponent(escape(binary));
    } else if (mode === 'hex') {
      let hex = '';
      for (let i = 0; i < binary.length; i++) {
        hex += binary.charCodeAt(i).toString(16).padStart(2, '0');
      }
      return hex;
    } else if (mode === 'binary') {
      let bits = '';
      for (let i = 0; i < binary.length; i++) {
        bits += binary.charCodeAt(i).toString(2).padStart(8, '0') + ' ';
      }
      return bits.trim();
    }
    return '';
  } catch {
    return '';
  }
}

export type UrlMode = 'component' | 'uri' | 'strict';

export function encodeUrlStr(input: string, mode: UrlMode = 'component'): string {
  try {
    if (mode === 'uri') return encodeURI(input);
    if (mode === 'strict') {
      return encodeURIComponent(input).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
    }
    return encodeURIComponent(input);
  } catch {
    return input;
  }
}

export function decodeUrlStr(input: string, mode: UrlMode = 'component'): string {
  try {
    if (mode === 'uri') return decodeURI(input);
    return decodeURIComponent(input);
  } catch {
    return input;
  }
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
for (const [key, val] of Object.entries(namedEntities)) {
  inverseEntities[val] = key;
}

export function encodeEntities(input: string, options: { mode: EntityMode; scope: EntityScope }): string {
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
        if (options.mode === 'named' && inverseEntities[char]) {
          result += `&${inverseEntities[char]};`;
        } else if (options.mode === 'hex') {
          result += `&#x${code.toString(16).toUpperCase()};`;
        } else {
          result += `&#${code};`;
        }
      } else {
        result += char;
      }
      if (code > 0xffff) i++;
    }
    return result;
  } catch {
    return input;
  }
}

export function decodeEntities(input: string): string {
  try {
    let result = input;
    result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
    result = result.replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
    result = result.replace(/&([a-zA-Z0-9]+);/g, (match, name) => namedEntities[name] ?? match);
    return result;
  } catch {
    return input;
  }
}
