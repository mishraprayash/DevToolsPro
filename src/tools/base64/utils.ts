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

    // Decode to standard binary string
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

export function validateBase64(input: string, urlSafe: boolean = false): { valid: boolean; error?: string } {
  const cleanInput = input.trim();
  if (!cleanInput) {
    return { valid: true };
  }

  // Base64 characters validation
  if (urlSafe) {
    const invalidCharMatch = /[^A-Za-z0-9_-]/.exec(cleanInput);
    if (invalidCharMatch) {
      return { 
        valid: false, 
        error: `Invalid URL-safe character "${invalidCharMatch[0]}" detected. URL-safe Base64 supports only A-Z, a-z, 0-9, dash (-), and underscore (_).` 
      };
    }
  } else {
    // Normal base64 (may contain padding = at the end)
    const invalidCharMatch = /[^A-Za-z0-9+/=]/.exec(cleanInput);
    if (invalidCharMatch) {
      return { 
        valid: false, 
        error: `Invalid Base64 character "${invalidCharMatch[0]}" detected. Standard Base64 supports only A-Z, a-z, 0-9, (+), (/), and padding (=).` 
      };
    }

    // Check padding placement
    const paddingIdx = cleanInput.indexOf('=');
    if (paddingIdx !== -1) {
      const lastChars = cleanInput.slice(paddingIdx);
      if (lastChars.length > 2 || /[^=]/.test(lastChars)) {
        return { 
          valid: false, 
          error: `Invalid padding structure. Padding (=) characters must only appear at the very end of the string (max 2 characters).` 
        };
      }
    }

    // Check padding alignment length
    if (cleanInput.length % 4 !== 0) {
      return { 
        valid: false, 
        error: `String length is not a multiple of 4. Standard Base64 strings must have a length divisible by 4 (current length: ${cleanInput.length}).` 
      };
    }
  }

  return { valid: true };
}

export function autofixPadding(input: string): string {
  let clean = input.trim().replace(/=+$/, '');
  const pad = clean.length % 4;
  if (pad) {
    clean += '='.repeat(4 - pad);
  }
  return clean;
}

export function processBase64(
  input: string, 
  action: Base64Action, 
  mode: Base64Mode = 'utf8', 
  urlSafe: boolean = false
): string {
  switch (action) {
    case 'encode':
      return encodeBase64(input, mode, urlSafe);
    case 'decode':
      return decodeBase64(input, mode, urlSafe);
    default:
      return input;
  }
}
