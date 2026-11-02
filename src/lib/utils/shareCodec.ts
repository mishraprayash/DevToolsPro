/**
 * Encode/decode workspace state for `#share=` links.
 *
 * Formats (the prefix makes them unambiguous; legacy base64 never contains '.'):
 *   z1.<base64url(deflate-raw(utf8 JSON))>  — compressed, preferred
 *   u1.<base64url(utf8 JSON)>               — uncompressed fallback (no CompressionStream)
 *   <btoa(encodeURIComponent(JSON))>        — legacy, decode-only
 *
 * Pure functions: never throw, always resolve to a Result.
 */

export type Result<T> = { success: true; data: T } | { success: false; error: string };

const COMPRESSED_PREFIX = 'z1.';
const UNCOMPRESSED_PREFIX = 'u1.';
/** Guard against decompression bombs in crafted links. */
const MAX_DECODED_BYTES = 10 * 1024 * 1024;

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error && e.message ? e.message : fallback;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(input: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(input)) throw new Error('Invalid base64url characters');
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function hasCompressionStreams(): boolean {
  return typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
}

async function transformBytes(
  bytes: Uint8Array,
  transform: CompressionStream | DecompressionStream,
  maxBytes = Infinity
): Promise<Uint8Array> {
  const writer = transform.writable.getWriter();
  // Write and close without awaiting first: backpressure would deadlock until we read.
  const writing = writer.write(bytes as BufferSource).then(() => writer.close());
  writing.catch(() => {}); // surfaced via the reader below

  const reader = transform.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new Error('Shared payload is too large');
    }
    chunks.push(value);
  }
  await writing;

  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

export async function encodeShareState(state: unknown): Promise<Result<string>> {
  try {
    const json = JSON.stringify(state);
    if (json === undefined) return { success: false, error: 'State is not serializable' };
    const bytes = new TextEncoder().encode(json);

    if (hasCompressionStreams()) {
      try {
        const compressed = await transformBytes(bytes, new CompressionStream('deflate-raw'));
        return { success: true, data: COMPRESSED_PREFIX + bytesToBase64Url(compressed) };
      } catch {
        // fall through to uncompressed
      }
    }
    return { success: true, data: UNCOMPRESSED_PREFIX + bytesToBase64Url(bytes) };
  } catch (e) {
    return { success: false, error: errorMessage(e, 'Failed to encode share state') };
  }
}

export async function decodeShareState(encoded: string): Promise<Result<unknown>> {
  try {
    const input = encoded.trim();
    if (!input) return { success: false, error: 'Empty share payload' };

    let json: string;
    if (input.startsWith(COMPRESSED_PREFIX)) {
      if (!hasCompressionStreams()) {
        return { success: false, error: 'This browser cannot decompress shared links' };
      }
      const bytes = base64UrlToBytes(input.slice(COMPRESSED_PREFIX.length));
      const raw = await transformBytes(bytes, new DecompressionStream('deflate-raw'), MAX_DECODED_BYTES);
      json = new TextDecoder('utf-8', { fatal: true }).decode(raw);
    } else if (input.startsWith(UNCOMPRESSED_PREFIX)) {
      const bytes = base64UrlToBytes(input.slice(UNCOMPRESSED_PREFIX.length));
      json = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } else {
      // Legacy: btoa(encodeURIComponent(JSON.stringify(state)))
      json = decodeURIComponent(atob(input));
    }

    return { success: true, data: JSON.parse(json) as unknown };
  } catch (e) {
    return { success: false, error: errorMessage(e, 'Failed to decode share state') };
  }
}
