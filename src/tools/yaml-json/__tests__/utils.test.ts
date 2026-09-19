import { describe, it, expect } from 'vitest';
import { validateYaml, jsonToYaml, yamlToJson } from '../utils';

describe('YAML / JSON Utilities', () => {
  describe('validateYaml', () => {
    it('should return valid true for valid YAML', async () => {
      const yaml = 'name: John\nage: 30\ntags:\n  - dev\n  - qa';
      const res = await validateYaml(yaml);
      expect(res.valid).toBe(true);
    });

    it('should return valid false for malformed YAML', async () => {
      const yaml = 'name: John\n  age: : : invalid';
      const res = await validateYaml(yaml);
      expect(res.valid).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('jsonToYaml', () => {
    it('should convert valid JSON string to YAML', async () => {
      const jsonStr = JSON.stringify({ name: 'Alice', role: 'Engineer' });
      const yamlStr = await jsonToYaml(jsonStr);
      expect(yamlStr).toContain('name: Alice');
      expect(yamlStr).toContain('role: Engineer');
    });

    it('should return error message for invalid JSON string', async () => {
      const res = await jsonToYaml('{ invalid json }');
      expect(res).toContain('Invalid JSON:');
    });
  });

  describe('yamlToJson', () => {
    it('should convert valid single-document YAML to JSON', async () => {
      const yaml = 'title: DevTools\nactive: true';
      const jsonStr = await yamlToJson(yaml);
      const parsed = JSON.parse(jsonStr);
      expect(parsed.title).toBe('DevTools');
      expect(parsed.active).toBe(true);
    });

    it('should convert multi-document YAML to JSON array', async () => {
      const multiYaml = '---\nitem: 1\n---\nitem: 2';
      const jsonStr = await yamlToJson(multiYaml);
      const parsed = JSON.parse(jsonStr);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].item).toBe(1);
      expect(parsed[1].item).toBe(2);
    });

    it('should return empty string for empty YAML input', async () => {
      const res = await yamlToJson('');
      expect(res).toBe('');
    });

    it('should return error message for invalid YAML syntax', async () => {
      const res = await yamlToJson('foo: bar\n  baz: [invalid:');
      expect(res).toContain('Invalid YAML:');
    });
  });
});
