import { describe, it, expect } from 'vitest';
import { validateXml, xmlToJson, jsonToXml } from '../utils';

describe('XML / JSON Utilities', () => {
  describe('validateXml', () => {
    it('should validate valid XML successfully', async () => {
      const xml = '<root><user id="1">John</user></root>';
      const res = await validateXml(xml);
      expect(res.valid).toBe(true);
    });

    it('should return error for invalid or unclosed XML', async () => {
      const xml = '<root><user>John</root>';
      const res = await validateXml(xml);
      expect(res.valid).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('should return error for empty XML string', async () => {
      const res = await validateXml('   ');
      expect(res.valid).toBe(false);
      expect(res.error).toBe('Input is empty');
    });
  });

  describe('xmlToJson', () => {
    it('should convert valid XML to JSON string', async () => {
      const xml = '<note><to>User</to><from>Admin</from></note>';
      const jsonStr = await xmlToJson(xml);
      expect(jsonStr).not.toContain('Invalid XML:');
      const parsed = JSON.parse(jsonStr);
      expect(parsed.note.to).toBe('User');
      expect(parsed.note.from).toBe('Admin');
    });

    it('should handle attributes when converting XML to JSON', async () => {
      const xml = '<item id="123" active="true">Widget</item>';
      const jsonStr = await xmlToJson(xml, { ignoreAttributes: false, attributePrefix: '@_' });
      const parsed = JSON.parse(jsonStr);
      expect(parsed.item['@_id']).toBe(123);
      expect(parsed.item['#text']).toBe('Widget');
    });

    it('should return error string for malformed XML', async () => {
      const xml = '<root><unclosed></root>';
      const jsonStr = await xmlToJson(xml);
      expect(jsonStr).toContain('Invalid XML:');
    });
  });

  describe('jsonToXml', () => {
    it('should convert valid JSON to XML string', async () => {
      const json = JSON.stringify({ person: { name: 'Alice', age: 30 } });
      const xmlStr = await jsonToXml(json);
      expect(xmlStr).toContain('<person>');
      expect(xmlStr).toContain('<name>Alice</name>');
      expect(xmlStr).toContain('<age>30</age>');
    });

    it('should return error string for invalid JSON string', async () => {
      const jsonStr = await jsonToXml('{ malformed json }');
      expect(jsonStr).toContain('Invalid JSON:');
    });
  });
});
