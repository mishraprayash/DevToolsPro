import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sendToTool, readToolHandoff, clearToolHandoff } from '../toolHandoff';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() { return store.size; },
    clear: () => store.clear(),
    getItem: (k: string) => store.get(k) ?? null,
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    removeItem: (k: string) => { store.delete(k); },
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
  };
}

describe('toolHandoff', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should round-trip a handoff payload for the target tool', () => {
    expect(sendToTool('json', { input: '{"a":1}' }, 'From Base64')).toBe(true);
    expect(readToolHandoff('json')).toEqual({ name: 'From Base64', state: { input: '{"a":1}' } });
    expect(readToolHandoff('encoder')).toBeNull();
  });

  it('should clear a handoff once consumed', () => {
    sendToTool('json', { input: 'x' }, 'Tab');
    clearToolHandoff('json');
    expect(readToolHandoff('json')).toBeNull();
  });

  it('should ignore malformed payloads', () => {
    sessionStorage.setItem('devtools-handoff-json', 'not json');
    expect(readToolHandoff('json')).toBeNull();
    sessionStorage.setItem('devtools-handoff-json', JSON.stringify({ name: 'x', state: 'nope' }));
    expect(readToolHandoff('json')).toBeNull();
  });

  it('should never throw when storage is unavailable', () => {
    vi.stubGlobal('sessionStorage', undefined);
    expect(sendToTool('json', { input: 'x' }, 'Tab')).toBe(false);
    expect(readToolHandoff('json')).toBeNull();
    expect(() => clearToolHandoff('json')).not.toThrow();
  });
});
