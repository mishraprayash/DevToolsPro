import { describe, it, expect } from 'vitest';
import { validateXml, xmlToJson, jsonToXml } from '../utils';

describe('XML-JSON Utilities', () => {
  const sampleXml = '<root><item id="1">Hello</item><item id="2">World</item></root>';

  it('should validate XML correctly', async () => {
    const valid = await validateXml(sampleXml);
    expect(valid.valid).toBe(true);

    const invalid = await validateXml('<root><item>Unclosed</root>');
    expect(invalid.valid).toBe(false);
  });

  it('should convert XML to JSON string', async () => {
    const jsonStr = await xmlToJson(sampleXml);
    expect(jsonStr).not.toContain('Invalid XML');
    const parsed = JSON.parse(jsonStr);
    expect(parsed.root.item).toBeDefined();
  });

  it('should convert JSON to XML string', async () => {
    const jsonStr = JSON.stringify({ root: { message: 'Hello' } });
    const xml = await jsonToXml(jsonStr);
    expect(xml).toContain('<root>');
    expect(xml).toContain('<message>Hello</message>');
  });

  it('should return error output on malformed inputs', async () => {
    const xmlRes = await xmlToJson('<invalid xml>');
    expect(xmlRes).toContain('Invalid XML:');

    const jsonRes = await jsonToXml('{ invalid json }');
    expect(jsonRes).toContain('Invalid JSON:');
  });
});
