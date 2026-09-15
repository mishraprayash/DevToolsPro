import { describe, it, expect } from 'vitest';
import { generateMockData } from '../utils';

describe('mock-data generateUUID & generateMockData', () => {
  it('should generate valid UUID v4 format when using generateMockData with uuid field', () => {
    const result = generateMockData([{ name: 'id', type: 'uuid' }], 5);
    expect(result.success).toBe(true);
    if (result.success) {
      const data = JSON.parse(result.data);
      expect(data).toHaveLength(5);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      data.forEach((item: { id: string }) => {
        expect(item.id).toMatch(uuidRegex);
      });
    }
  });

  it('should fallback to crypto.getRandomValues when crypto.randomUUID is unavailable', () => {
    const originalRandomUUID = crypto.randomUUID;
    // @ts-expect-error override for test
    delete crypto.randomUUID;

    try {
      const result = generateMockData([{ name: 'id', type: 'uuid' }], 3);
      expect(result.success).toBe(true);
      if (result.success) {
        const data = JSON.parse(result.data);
        expect(data).toHaveLength(3);
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        data.forEach((item: { id: string }) => {
          expect(item.id).toMatch(uuidRegex);
        });
      }
    } finally {
      crypto.randomUUID = originalRandomUUID;
    }
  });

  it('should return error when crypto is unavailable', () => {
    const originalCrypto = globalThis.crypto;
    // @ts-expect-error override for test
    delete globalThis.crypto;

    try {
      const result = generateMockData([{ name: 'id', type: 'uuid' }], 1);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Cryptographically secure random number generator unavailable');
      }
    } finally {
      globalThis.crypto = originalCrypto;
    }
  });
});
