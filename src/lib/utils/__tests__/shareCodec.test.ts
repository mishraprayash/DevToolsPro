import { describe, it, expect, afterEach, vi } from 'vitest';
import { encodeShareState, decodeShareState } from '../shareCodec';

function legacyEncode(state: unknown): string {
  return btoa(encodeURIComponent(JSON.stringify(state)));
}

async function roundTrip(state: unknown): Promise<unknown> {
  const enc = await encodeShareState(state);
  if (!enc.success) throw new Error(enc.error);
  const dec = await decodeShareState(enc.data);
  if (!dec.success) throw new Error(dec.error);
  return dec.data;
}

describe('shareCodec', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('has CompressionStream available in the test environment', () => {
    expect(typeof CompressionStream).toBe('function');
    expect(typeof DecompressionStream).toBe('function');
  });

  it('produces a compressed, URL-safe payload with a version prefix', async () => {
    const enc = await encodeShareState({ input: 'hello', n: 1 });
    expect(enc.success).toBe(true);
    if (!enc.success) return;
    expect(enc.data.startsWith('z1.')).toBe(true);
    expect(enc.data.slice(3)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('round-trips unicode, emoji and nested structures', async () => {
    const state = {
      input: 'héllo wörld — 你好 — नमस्ते 👋🏽🚀 \u0000 "quotes" \\ backslash',
      nested: { arr: [1, 2.5, null, true, 'x'], empty: {} },
      indent: '2',
    };
    expect(await roundTrip(state)).toEqual(state);
  });

  it('round-trips a large JSON payload', async () => {
    const state = {
      input: JSON.stringify(
        Array.from({ length: 2000 }, (_, i) => ({ id: i, name: `item-${i}`, tags: ['a', 'b', String(i % 7)] }))
      ),
    };
    expect(await roundTrip(state)).toEqual(state);
  });

  it('compresses a repetitive 10KB payload substantially', async () => {
    const input = '{"user":"alice","role":"admin","active":true}\n'.repeat(220); // ~10KB
    const state = { input };
    const enc = await encodeShareState(state);
    expect(enc.success).toBe(true);
    if (!enc.success) return;
    const legacy = legacyEncode(state);
    expect(legacy.length).toBeGreaterThan(10_000);
    // Expect well over a 10x reduction vs the legacy format.
    expect(enc.data.length).toBeLessThan(legacy.length / 10);
  });

  it('decodes the legacy (unprefixed) format', async () => {
    const state = { input: 'legacy 👍 link', mode: 'json' };
    const dec = await decodeShareState(legacyEncode(state));
    expect(dec).toEqual({ success: true, data: state });
  });

  it('returns an error result for garbage input instead of throwing', async () => {
    for (const bad of ['', '   ', '!!!not-base64!!!', 'z1.@@@', 'z1.AAAA', 'u1.%%%', 'u1.bm90IGpzb24', 'Zm9v']) {
      const dec = await decodeShareState(bad);
      expect(dec.success).toBe(false);
      if (!dec.success) expect(typeof dec.error).toBe('string');
    }
  });

  it('returns an error result for unserializable state', async () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const enc = await encodeShareState(circular);
    expect(enc.success).toBe(false);
    expect((await encodeShareState(undefined)).success).toBe(false);
  });

  it('falls back to the uncompressed u1 format when CompressionStream is unavailable', async () => {
    vi.stubGlobal('CompressionStream', undefined);
    vi.stubGlobal('DecompressionStream', undefined);
    const state = { input: 'fallback ✨ path', list: [1, 2, 3] };
    const enc = await encodeShareState(state);
    expect(enc.success).toBe(true);
    if (!enc.success) return;
    expect(enc.data.startsWith('u1.')).toBe(true);
    expect(enc.data.slice(3)).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await decodeShareState(enc.data)).toEqual({ success: true, data: state });
    // A compressed link can't be decoded without DecompressionStream, but must not throw.
    const z = await decodeShareState('z1.AAAA');
    expect(z.success).toBe(false);
  });

  it('decodes a u1 payload even when compression is available', async () => {
    const state = { a: 'ü' };
    const u1 = 'u1.' + Buffer.from(JSON.stringify(state), 'utf8').toString('base64url');
    expect(await decodeShareState(u1)).toEqual({ success: true, data: state });
  });
});
