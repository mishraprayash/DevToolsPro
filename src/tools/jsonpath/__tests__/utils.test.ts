import { describe, it, expect } from 'vitest';
import { evaluateJsonPath } from '../utils';

describe('JSONPath Utilities', () => {
  const sampleJson = JSON.stringify({
    store: {
      book: [
        { category: 'reference', author: 'Nigel Rees', title: 'Sayings of the Century', price: 8.95 },
        { category: 'fiction', author: 'Evelyn Waugh', title: 'Sword of Honour', price: 12.99 },
      ],
      bicycle: { color: 'red', price: 19.95 }
    }
  });

  it('should evaluate valid JSONPath expression correctly', async () => {
    const res = await evaluateJsonPath(sampleJson, '$.store.book[*].author');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toEqual(['Nigel Rees', 'Evelyn Waugh']);
    }
  });

  it('should return null data for empty input or query string', async () => {
    const res1 = await evaluateJsonPath('', '$.store');
    expect(res1.success).toBe(true);
    if (res1.success) expect(res1.data).toBeNull();

    const res2 = await evaluateJsonPath(sampleJson, '   ');
    expect(res2.success).toBe(true);
    if (res2.success) expect(res2.data).toBeNull();
  });

  it('should return error for invalid JSON string', async () => {
    const res = await evaluateJsonPath('{ invalid json }', '$.store');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe('Invalid JSON input');
    }
  });

  it('should return empty array when path does not match any element', async () => {
    const res = await evaluateJsonPath(sampleJson, '$.store.nonexistent');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toEqual([]);
    }
  });
});
