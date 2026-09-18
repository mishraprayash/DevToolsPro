import { describe, it, expect } from 'vitest';
import { repairJsonString } from '../repair/json.repair';
import {
  jsonToYaml,
  jsonToXml,
  jsonToCsv,
  jsonToQueryParams,
} from '../converters/json.converters';

describe('JSON Repair and Converters', () => {
  describe('repairJsonString', () => {
    it('should strip markdown code block wrapping', () => {
      const markdown = '```json\n{\n  "name": "test"\n}\n```';
      const result = repairJsonString(markdown);
      expect(JSON.parse(result.repaired)).toEqual({ name: 'test' });
      expect(result.changes).toContain('Stripped Markdown code block wrapping');
    });

    it('should strip JavaScript assignment prefix', () => {
      const jsCode = 'const data = { "key": "value" };';
      const result = repairJsonString(jsCode);
      expect(JSON.parse(result.repaired)).toEqual({ key: 'value' });
      expect(result.changes).toContain('Stripped JavaScript variable assignment');
    });

    it('should convert single quotes to double quotes and unquoted keys', () => {
      const invalidJson = "{ name: 'John', 'age': 30 }";
      const result = repairJsonString(invalidJson);
      expect(JSON.parse(result.repaired)).toEqual({ name: 'John', age: 30 });
    });

    it('should remove comments (// and /* */)', () => {
      const jsonWithComments = `
        {
          // This is a line comment
          "active": true /* block comment */
        }
      `;
      const result = repairJsonString(jsonWithComments);
      expect(JSON.parse(result.repaired)).toEqual({ active: true });
      expect(result.changes).toContain('Removed comments');
    });

    it('should fix trailing commas and Python literals (True, False, None)', () => {
      const pythonJson = '{\n  "is_admin": True,\n  "is_banned": False,\n  "data": None,\n}';
      const result = repairJsonString(pythonJson);
      expect(JSON.parse(result.repaired)).toEqual({
        is_admin: true,
        is_banned: false,
        data: null,
      });
    });
  });

  describe('jsonToYaml', () => {
    it('should convert objects and arrays to YAML', () => {
      const data = {
        name: 'John',
        skills: ['JavaScript', 'TypeScript'],
        nested: { count: 42 },
      };
      const yaml = jsonToYaml(data);
      expect(yaml).toContain('name: John');
      expect(yaml).toContain('- JavaScript');
      expect(yaml).toContain('count: 42');
    });

    it('should handle primitives and nulls', () => {
      expect(jsonToYaml(null)).toBe('null');
      expect(jsonToYaml('hello\nworld')).toContain('|\n');
      expect(jsonToYaml([])).toBe('[]');
      expect(jsonToYaml({})).toBe('{}');
    });
  });

  describe('jsonToXml', () => {
    it('should convert JSON object to XML structure', () => {
      const data = { title: 'Test & Code', count: 5 };
      const xml = jsonToXml(data, 'root');
      expect(xml).toContain('<root>');
      expect(xml).toContain('<title>Test &amp; Code</title>');
      expect(xml).toContain('<count>5</count>');
      expect(xml).toContain('</root>');
    });

    it('should handle empty objects and arrays in XML', () => {
      expect(jsonToXml({}, 'empty')).toBe('<empty />');
      expect(jsonToXml(null, 'nil')).toBe('<nil />');
    });
  });

  describe('jsonToCsv', () => {
    it('should convert array of objects to CSV', () => {
      const records = [
        { id: 1, name: 'Alice', city: 'NYC' },
        { id: 2, name: 'Bob', city: 'LA' },
      ];
      const csv = jsonToCsv(records);
      const lines = csv.split('\n');
      expect(lines[0]).toBe('id,name,city');
      expect(lines[1]).toBe('1,Alice,NYC');
      expect(lines[2]).toBe('2,Bob,LA');
    });

    it('should flatten nested objects and escape quotes/commas', () => {
      const data = [
        { user: { name: 'Doe, Jane' }, bio: 'Hello "World"' },
      ];
      const csv = jsonToCsv(data);
      expect(csv).toContain('user.name');
      expect(csv).toContain('"Doe, Jane"');
      expect(csv).toContain('"Hello ""World"""');
    });

    it('should handle empty datasets gracefully', () => {
      expect(jsonToCsv([])).toBe('Empty dataset');
    });
  });

  describe('jsonToQueryParams', () => {
    it('should convert flat and nested objects to query parameters', () => {
      const data = {
        search: 'web tools',
        filter: { category: 'dev', limit: 10 },
      };
      const queryParams = jsonToQueryParams(data);
      expect(queryParams).toContain('search=web%20tools');
      expect(queryParams).toContain('filter%5Bcategory%5D=dev');
      expect(queryParams).toContain('filter%5Blimit%5D=10');
    });

    it('should handle primitives and null values', () => {
      expect(jsonToQueryParams(null)).toBe('');
      expect(jsonToQueryParams({ empty: null })).toBe('empty=');
      expect(jsonToQueryParams('simple')).toBe('value=simple');
    });
  });
});
