import { describe, it, expect } from 'vitest';
import { generateJsonSchema } from '../utils';

describe('JSON Schema Utilities', () => {
  it('should generate valid JSON Schema from JSON payload', () => {
    const json = JSON.stringify({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      isActive: true,
      roles: ['admin', 'user']
    });

    const res = generateJsonSchema(json, { requireAllFields: true });
    expect(res.success).toBe(true);
    if (res.success) {
      const schema = JSON.parse(res.code);
      expect(schema.type).toBe('object');
      expect(schema.properties.email.format).toBe('email');
      expect(schema.properties.id.type).toBe('integer');
      expect(schema.properties.roles.type).toBe('array');
      expect(schema.required).toContain('email');
    }
  });

  it('should handle invalid JSON input', () => {
    const res = generateJsonSchema('{ invalid json }');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain('Invalid JSON payload');
    }
  });
});
