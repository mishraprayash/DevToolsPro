import { describe, it, expect } from 'vitest';
import { parseJson, beautifyJson, minifyJson, sortJsonKeys, validateJson } from '../utils';

describe('JSON Utilities', () => {
  it('should parse valid JSON', () => {
    const result = parseJson('{"test": true}');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ test: true });
    }
  });

  it('should fail on invalid JSON', () => {
    const result = parseJson('{"test": true');
    expect(result.success).toBe(false);
  });

  it('should beautify JSON', () => {
    const minified = '{"a":1,"b":2}';
    const r = beautifyJson(minified, 2);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });

  it('should minify JSON', () => {
    const beautified = '{\n  "a": 1,\n  "b": 2\n}';
    const r = minifyJson(beautified);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe('{"a":1,"b":2}');
  });

  it('should sort JSON keys', () => {
    const unsorted = '{"z": 1, "a": 2, "c": 3}';
    const r = sortJsonKeys(unsorted);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).toContain('"a"');
      expect(r.data.indexOf('"a"')).toBeLessThan(r.data.indexOf('"c"'));
      expect(r.data.indexOf('"c"')).toBeLessThan(r.data.indexOf('"z"'));
    }
  });

  it('should validate JSON', () => {
    const validResult = validateJson('{"a": 1}');
    expect(validResult.valid).toBe(true);

    const invalidResult = validateJson('{"a": 1');
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.error).toBeDefined();
  });
});
