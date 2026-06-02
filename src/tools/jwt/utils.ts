export interface JWTPayload {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  raw: { header: string; payload: string; signature: string };
}

export type JWTStatus = 'valid' | 'expired' | 'invalid';

export type JWTAlgorithm = 'HS256' | 'HS384' | 'HS512' | 'RS256';

export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

    return {
      header,
      payload,
      signature: signatureB64,
      raw: {
        header: headerB64,
        payload: payloadB64,
        signature: signatureB64,
      },
    };
  } catch {
    return null;
  }
}

export function getJWTStatus(token: string): JWTStatus {
  const decoded = decodeJWT(token);
  if (!decoded) return 'invalid';

  const exp = decoded.payload.exp;
  if (typeof exp === 'number') {
    return Date.now() / 1000 > exp ? 'expired' : 'valid';
  }
  return 'valid';
}

export function getJWTExpiryDate(token: string): Date | null {
  const decoded = decodeJWT(token);
  if (!decoded) return null;

  const exp = decoded.payload.exp;
  if (typeof exp === 'number') {
    return new Date(exp * 1000);
  }
  return null;
}

export function getJWTIssuedAt(token: string): Date | null {
  const decoded = decodeJWT(token);
  if (!decoded) return null;

  const iat = decoded.payload.iat;
  if (typeof iat === 'number') {
    return new Date(iat * 1000);
  }
  return null;
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function pemToArrayBuffer(pem: string): { success: true; data: ArrayBuffer } | { success: false; error: string } {
  try {
    const sanitized = pem
      .replace(/-----BEGIN [A-Z ]+-----/g, '')
      .replace(/-----END [A-Z ]+-----/g, '')
      .replace(/\s+/g, '');
    const binary = atob(sanitized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { success: true, data: bytes.buffer };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

function base64UrlDecodeToString(input: string): { success: true; data: string } | { success: false; error: string } {
  try {
    const padded = input.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (padded.length % 4)) % 4;
    const base64 = padded + '='.repeat(padLength);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoded = new TextDecoder().decode(bytes);
    return { success: true, data: decoded };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

function base64UrlDecodeToBytes(input: string): { success: true; data: Uint8Array } | { success: false; error: string } {
  try {
    const padded = input.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (padded.length % 4)) % 4;
    const base64 = padded + '='.repeat(padLength);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { success: true, data: bytes };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function signJWT(
  headerObj: Record<string, unknown>,
  payloadObj: Record<string, unknown>,
  secret: string,
  algorithm: JWTAlgorithm = 'HS256'
): Promise<string> {
  try {
    const headerStr = JSON.stringify(headerObj);
    const payloadStr = JSON.stringify(payloadObj);
    
    const headerB64 = base64UrlEncode(headerStr);
    const payloadB64 = base64UrlEncode(payloadStr);
    
    const tokenData = `${headerB64}.${payloadB64}`;
    
    const encoder = new TextEncoder();
    const messageData = encoder.encode(tokenData);

    let signatureBuffer: ArrayBuffer;

    if (algorithm === 'RS256') {
      const keyBytes = pemToArrayBuffer(secret);
      if (!keyBytes.success) {
        throw new Error('Invalid RSA private key');
      }
      const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        keyBytes.data,
        { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
        false,
        ['sign']
      );
      signatureBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, messageData);
    } else {
      const keyData = encoder.encode(secret);
      const hashName = algorithm === 'HS256' ? 'SHA-256' : algorithm === 'HS384' ? 'SHA-384' : 'SHA-512';
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: { name: hashName } },
        false,
        ['sign']
      );
      signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    }
    
    const signatureBytes = new Uint8Array(signatureBuffer);
    let signatureBin = '';
    for (let i = 0; i < signatureBytes.length; i++) {
      signatureBin += String.fromCharCode(signatureBytes[i]);
    }
    
    const signatureB64 = btoa(signatureBin)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
      
    return `${tokenData}.${signatureB64}`;
  } catch (e) {
    throw new Error(`Failed to sign JWT: ${(e as Error).message}`);
  }
}

export async function verifyJwtSignature(
  token: string,
  secret: string,
  algorithm: JWTAlgorithm
): Promise<{ valid: boolean; error?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, error: 'Token does not have 3 parts' };
    const [headerB64, payloadB64, signatureB64] = parts;
    const tokenData = `${headerB64}.${payloadB64}`;

    const encoder = new TextEncoder();
    const data = encoder.encode(tokenData);

    let key: CryptoKey;
    if (algorithm === 'RS256') {
      const keyBytes = pemToArrayBuffer(secret);
      if (!keyBytes.success) {
        return { valid: false, error: 'Invalid RSA public key' };
      }
      key = await crypto.subtle.importKey(
        'spki',
        keyBytes.data,
        { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
        false,
        ['verify']
      );
    } else {
      const keyData = encoder.encode(secret);
      const hashName = algorithm === 'HS256' ? 'SHA-256' : algorithm === 'HS384' ? 'SHA-384' : 'SHA-512';
      key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: { name: hashName } }, false, ['verify']);
    }

    // decode signature
    const signatureBytesResult = base64UrlDecodeToBytes(signatureB64);
    if (!signatureBytesResult.success) {
      return { valid: false, error: 'Invalid base64url signature' };
    }
    const sigBytes = new Uint8Array(signatureBytesResult.data.byteLength);
    sigBytes.set(signatureBytesResult.data);
    const signatureBuffer = sigBytes.buffer as ArrayBuffer;
    const algorithmName = algorithm === 'RS256' ? 'RSASSA-PKCS1-v1_5' : 'HMAC';
    const isValid = await crypto.subtle.verify(algorithmName, key, signatureBuffer, data);
    return { valid: isValid, error: isValid ? undefined : 'Signature mismatch' };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

export function decodeJwtParts(token: string): {
  success: true;
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  raw: { header: string; payload: string; signature: string };
  error?: string;
} | {
  success: false;
  error: string;
} {
  const parts = token.split('.');
  if (parts.length !== 3) return { success: false, error: 'Token does not have 3 parts' };
  const [headerB64, payloadB64, signatureB64] = parts;
  const headerStr = base64UrlDecodeToString(headerB64);
  if (!headerStr.success) return { success: false, error: 'Invalid header base64' };
  const payloadStr = base64UrlDecodeToString(payloadB64);
  if (!payloadStr.success) return { success: false, error: 'Invalid payload base64' };
  try {
    const header = JSON.parse(headerStr.data);
    const payload = JSON.parse(payloadStr.data);
    return {
      success: true,
      header,
      payload,
      signature: signatureB64,
      raw: { header: headerB64, payload: payloadB64, signature: signatureB64 }
    };
  } catch (e) {
    return { success: false, error: 'Unable to parse JSON in header/payload' };
  }
}
