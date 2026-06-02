export interface KeypairOptions {
  keySize: 1024 | 2048 | 4096;
  hashAlgorithm: 'SHA-256' | 'SHA-384' | 'SHA-512';
}

export interface GeneratedKeypair {
  publicKey: string;
  privateKey: string;
}

function convertBinaryToPem(binaryBuffer: ArrayBuffer, label: string): string {
  const bytes = new Uint8Array(binaryBuffer);
  let binaryString = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binaryString += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunkSize) as any
    );
  }
  const base64String = btoa(binaryString);
  const lines = base64String.match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

export async function generateRsaKeypair(options: KeypairOptions): Promise<GeneratedKeypair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: options.keySize,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: { name: options.hashAlgorithm }
    },
    true,
    ['sign', 'verify']
  );

  const exportedSpki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const publicKeyPem = convertBinaryToPem(exportedSpki, 'PUBLIC KEY');

  const exportedPkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const privateKeyPem = convertBinaryToPem(exportedPkcs8, 'PRIVATE KEY');

  return {
    publicKey: publicKeyPem,
    privateKey: privateKeyPem
  };
}

function pemToBinary(pem: string, label: string): ArrayBuffer {
  const cleanPem = pem
    .replace(new RegExp(`-----BEGIN ${label}-----`), '')
    .replace(new RegExp(`-----END ${label}-----`), '')
    .replace(/\s+/g, '');
  
  const binaryString = atob(cleanPem);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function signPayloadRsa(
  privateKeyPem: string,
  payload: string,
  hashName: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
): Promise<string> {
  try {
    const pkcs8Buffer = pemToBinary(privateKeyPem.trim(), 'PRIVATE KEY');
    
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      pkcs8Buffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: { name: hashName }
      },
      false,
      ['sign']
    );

    const encoder = new TextEncoder();
    const data = encoder.encode(payload);

    const signatureBuffer = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      data
    );

    const signatureBytes = new Uint8Array(signatureBuffer);
    let binary = '';
    for (let i = 0; i < signatureBytes.length; i++) {
      binary += String.fromCharCode(signatureBytes[i]);
    }
    return btoa(binary);
  } catch (e) {
    throw new Error(`RSA Signature generation failed: ${(e as Error).message}`);
  }
}

export async function verifySignatureRsa(
  publicKeyPem: string,
  payload: string,
  signatureBase64: string,
  hashName: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
): Promise<boolean> {
  try {
    const spkiBuffer = pemToBinary(publicKeyPem.trim(), 'PUBLIC KEY');
    
    const publicKey = await crypto.subtle.importKey(
      'spki',
      spkiBuffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: { name: hashName }
      },
      false,
      ['verify']
    );

    const encoder = new TextEncoder();
    const data = encoder.encode(payload);

    const signatureBinaryString = atob(signatureBase64.trim().replace(/\s+/g, ''));
    const signatureBytes = new Uint8Array(signatureBinaryString.length);
    for (let i = 0; i < signatureBinaryString.length; i++) {
      signatureBytes[i] = signatureBinaryString.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signatureBytes,
      data
    );

    return isValid;
  } catch (e) {
    throw new Error(`RSA Signature verification failed: ${(e as Error).message}`);
  }
}
