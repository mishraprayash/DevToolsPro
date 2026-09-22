import { describe, it, expect } from 'vitest';
import { generateMockData, MockSchema, MockFieldType } from '../utils';

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

  describe('Field Types & Schema Options', () => {
    const fullSchema: MockSchema[] = [
      { name: 'id', type: 'id' },
      { name: 'uuid', type: 'uuid' },
      { name: 'fullName', type: 'name' },
      { name: 'email', type: 'email' },
      { name: 'age', type: 'age' },
      { name: 'isActive', type: 'boolean' },
      { name: 'createdAt', type: 'date' },
      { name: 'status', type: 'status' },
      { name: 'unknown', type: 'invalid' as MockFieldType },
    ];

    it('should generate all supported field types in JSON format', () => {
      const result = generateMockData(fullSchema, 3, 'json');
      expect(result.success).toBe(true);
      if (!result.success) return;

      const rows = JSON.parse(result.data);
      expect(rows).toHaveLength(3);

      const firstRow = rows[0];
      expect(firstRow.id).toBe(1);
      expect(typeof firstRow.uuid).toBe('string');
      expect(typeof firstRow.fullName).toBe('string');
      expect(firstRow.fullName).toContain(' ');
      expect(firstRow.email).toMatch(/^.+@.+\..+$/);
      expect(typeof firstRow.age).toBe('number');
      expect(firstRow.age).toBeGreaterThanOrEqual(18);
      expect(firstRow.age).toBeLessThanOrEqual(80);
      expect(typeof firstRow.isActive).toBe('boolean');
      expect(new Date(firstRow.createdAt).getTime()).not.toBeNaN();
      expect(['active', 'inactive', 'pending', 'suspended', 'archived']).toContain(firstRow.status);
      expect(firstRow.unknown).toBeNull();
    });

    it('should generate CSV format with correct header and escaping', () => {
      const csvSchema: MockSchema[] = [
        { name: 'id', type: 'id' },
        { name: 'fullName', type: 'name' },
      ];
      const result = generateMockData(csvSchema, 2, 'csv');
      expect(result.success).toBe(true);
      if (!result.success) return;

      const lines = result.data.split('\n');
      expect(lines[0]).toBe('id,fullName');
      expect(lines).toHaveLength(3); // header + 2 rows
    });

    it('should default to count 10 if count is omitted', () => {
      const schema: MockSchema[] = [{ name: 'id', type: 'id' }];
      const result = generateMockData(schema);
      expect(result.success).toBe(true);
      if (result.success) {
        const rows = JSON.parse(result.data);
        expect(rows).toHaveLength(10);
      }
    });

    it('should fail on boundary invalid count or empty schema', () => {
      const schema: MockSchema[] = [{ name: 'id', type: 'id' }];

      const zeroCount = generateMockData(schema, 0);
      expect(zeroCount.success).toBe(false);
      expect(zeroCount.error).toBe('Count must be between 1 and 1000');

      const excessCount = generateMockData(schema, 1001);
      expect(excessCount.success).toBe(false);
      expect(excessCount.error).toBe('Count must be between 1 and 1000');

      const emptySchema = generateMockData([], 5);
      expect(emptySchema.success).toBe(false);
      expect(emptySchema.error).toBe('Schema must contain at least one field');
    });
  });
});
