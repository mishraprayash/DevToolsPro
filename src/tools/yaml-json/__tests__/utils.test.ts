import { describe, it, expect } from 'vitest';
import { validateYaml, jsonToYaml, yamlToJson } from '../utils';

describe('YAML-JSON Utilities', () => {
  const sampleYaml = 'name: DevTools\nversion: 1.0\nfeatures:\n  - fast\n  - reliable';

  it('should validate YAML correctly', async () => {
    const valid = await validateYaml(sampleYaml);
    expect(valid.valid).toBe(true);
  });

  it('should convert YAML to JSON', async () => {
    const jsonStr = await yamlToJson(sampleYaml);
    expect(jsonStr).not.toContain('Invalid YAML');
    const parsed = JSON.parse(jsonStr);
    expect(parsed.name).toBe('DevTools');
    expect(parsed.features).toHaveLength(2);
  });

  it('should convert JSON to YAML', async () => {
    const jsonStr = JSON.stringify({ title: 'Test', count: 42 });
    const yamlStr = await jsonToYaml(jsonStr);
    expect(yamlStr).toContain('title: Test');
    expect(yamlStr).toContain('count: 42');
  });

  it('should return error message for invalid inputs', async () => {
    const yamlRes = await yamlToJson(':\n  invalid: [');
    expect(yamlRes).toContain('Invalid YAML:');

    const jsonRes = await jsonToYaml('{ bad json }');
    expect(jsonRes).toContain('Invalid JSON:');
  });
});
