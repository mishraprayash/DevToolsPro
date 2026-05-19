export interface JWTPayload {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  raw: { header: string; payload: string; signature: string };
}

export type JWTStatus = 'valid' | 'expired' | 'invalid';

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

export async function signJWT(
  headerObj: Record<string, unknown>,
  payloadObj: Record<string, unknown>,
  secret: string,
  algorithm: 'HS256' | 'HS384' | 'HS512' = 'HS256'
): Promise<string> {
  try {
    const headerStr = JSON.stringify(headerObj);
    const payloadStr = JSON.stringify(payloadObj);
    
    const headerB64 = base64UrlEncode(headerStr);
    const payloadB64 = base64UrlEncode(payloadStr);
    
    const tokenData = `${headerB64}.${payloadB64}`;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(tokenData);
    
    const hashName = algorithm === 'HS256' ? 'SHA-256' : algorithm === 'HS384' ? 'SHA-384' : 'SHA-512';
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: { name: hashName } },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    );
    
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
