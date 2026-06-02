export type Result = { success: true; data: string } | { success: false; error: string };

function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  if (cleanHex.length % 2 !== 0) throw new Error("Invalid hex string length");
  const arr = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    arr[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return arr;
}

function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

function textToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(arr: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return window.btoa(binary);
}

function padOrTruncate(arr: Uint8Array, length: number): Uint8Array {
  const result = new Uint8Array(length);
  result.set(arr.subarray(0, Math.min(arr.length, length)));
  return result;
}

export async function processAES(
  action: 'encrypt' | 'decrypt',
  mode: 'CBC' | 'CTR' | 'GCM',
  input: string,
  key: string,
  keyFormat: 'utf8' | 'hex',
  iv: string,
  ivFormat: 'utf8' | 'hex',
  cipherFormat: 'base64' | 'hex'
): Promise<Result> {
  try {
    if (!input) return { success: false, error: "Input is required." };
    if (!key) return { success: false, error: "Key is required." };
    if (!iv) return { success: false, error: "IV is required." };

    // Prepare Key (must be 16, 24, or 32 bytes)
    let keyBytes: Uint8Array;
    try {
      keyBytes = keyFormat === 'hex' ? hexToUint8Array(key) : textToUint8Array(key);
    } catch (e: any) {
      return { success: false, error: `Invalid key: ${e.message}` };
    }

    if (![16, 24, 32].includes(keyBytes.length)) {
      if (keyBytes.length <= 16) keyBytes = padOrTruncate(keyBytes, 16);
      else if (keyBytes.length <= 24) keyBytes = padOrTruncate(keyBytes, 24);
      else keyBytes = padOrTruncate(keyBytes, 32);
    }

    let cryptoKey: CryptoKey;
    try {
      cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes as unknown as BufferSource,
        { name: `AES-${mode}` },
        false,
        [action]
      );
    } catch (e) {
      return { success: false, error: "Failed to import key. Ensure algorithm is supported." };
    }

    // Prepare IV (must be 16 bytes for CBC/CTR, 12 bytes typically for GCM)
    let ivBytes: Uint8Array;
    try {
      ivBytes = ivFormat === 'hex' ? hexToUint8Array(iv) : textToUint8Array(iv);
    } catch (e: any) {
      return { success: false, error: `Invalid IV: ${e.message}` };
    }

    const requiredIvLength = mode === 'GCM' ? 12 : 16;
    if (ivBytes.length !== requiredIvLength) {
      ivBytes = padOrTruncate(ivBytes, requiredIvLength);
    }

    const algorithm: any = { name: `AES-${mode}` };
    if (mode === 'CBC') {
      algorithm.iv = ivBytes as unknown as BufferSource;
    } else if (mode === 'CTR') {
      algorithm.counter = ivBytes as unknown as BufferSource;
      algorithm.length = 64; 
    } else if (mode === 'GCM') {
      algorithm.iv = ivBytes as unknown as BufferSource;
    }

    if (action === 'encrypt') {
      const inputBytes = textToUint8Array(input);
      const encryptedBuffer = await crypto.subtle.encrypt(algorithm, cryptoKey, inputBytes as unknown as BufferSource);
      const encryptedBytes = new Uint8Array(encryptedBuffer);
      const out = cipherFormat === 'hex' ? uint8ArrayToHex(encryptedBytes) : uint8ArrayToBase64(encryptedBytes);
      return { success: true, data: out };
    } else {
      let inputBytes: Uint8Array;
      try {
        inputBytes = cipherFormat === 'hex' ? hexToUint8Array(input) : base64ToUint8Array(input);
      } catch (e: any) {
        return { success: false, error: `Invalid ciphertext format: ${e.message}` };
      }

      const decryptedBuffer = await crypto.subtle.decrypt(algorithm, cryptoKey, inputBytes as unknown as BufferSource);
      const out = new TextDecoder().decode(decryptedBuffer);
      return { success: true, data: out };
    }
  } catch (e: any) {
    return { success: false, error: "Crypto operation failed. Bad key, IV, or corrupted data." };
  }
}
