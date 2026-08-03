import { describe, it, expect } from 'vitest';
import {
  parseCsv,
  csvToJson,
  jsonToCsv,
  detectDelimiter,
  formatJson,
} from '../utils';

describe('CSV ↔ JSON Utilities', () => {
  describe('parseCsv', () => {
    it('parses a simple CSV with headers', () => {
      const res = parseCsv('name,age\nAlice,30', ',');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toEqual([
          ['name', 'age'],
          ['Alice', '30'],
        ]);
      }
    });

    it('handles quoted fields containing delimiters', () => {
      const res = parseCsv('a,"b,c",d', ',');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toEqual([['a', 'b,c', 'd']]);
      }
    });

    it('handles escaped quotes inside quoted fields', () => {
      const res = parseCsv('"He said ""hi""",bye', ',');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toEqual([['He said "hi"', 'bye']]);
      }
    });

    it('handles newlines inside quoted fields', () => {
      const res = parseCsv('"line1\nline2",x', ',');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toEqual([['line1\nline2', 'x']]);
      }
    });

    it('returns error for empty input', () => {
      const res = parseCsv('', ',');
      expect(res.success).toBe(false);
    });
  });

  describe('csvToJson', () => {
    it('converts CSV to an array of objects with headers', () => {
      const res = csvToJson('name,age\nAlice,30', { delimiter: ',', hasHeader: true, inferTypes: true });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toEqual([{ name: 'Alice', age: 30 }]);
      }
    });

    it('infers booleans and numbers when enabled', () => {
      const res = csvToJson('active,score\nfalse,3.5', { delimiter: ',', hasHeader: true, inferTypes: true });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toEqual([{ active: false, score: 3.5 }]);
      }
    });

    it('keeps strings when type inference is disabled', () => {
      const res = csvToJson('age\n30', { delimiter: ',', hasHeader: true, inferTypes: false });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toEqual([{ age: '30' }]);
      }
    });

    it('returns arrays of arrays when no header row', () => {
      const res = csvToJson('Alice,30\nBob,25', { delimiter: ',', hasHeader: false, inferTypes: true });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toEqual([
          ['Alice', 30],
          ['Bob', 25],
        ]);
      }
    });

    it('disambiguates duplicate headers', () => {
      const res = csvToJson('a,a\n1,2', { delimiter: ',', hasHeader: true, inferTypes: false });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toEqual([{ a: '1', a_2: '2' }]);
      }
    });

    it('supports alternate delimiters', () => {
      const res = csvToJson('name;city\nAlice;NYC', { delimiter: ';', hasHeader: true, inferTypes: false });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toEqual([{ name: 'Alice', city: 'NYC' }]);
      }
    });
  });

  describe('jsonToCsv', () => {
    it('converts an array of objects to CSV', () => {
      const res = jsonToCsv('[{"name":"Alice","age":30}]', { delimiter: ',', includeHeader: true });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('name,age\nAlice,30');
      }
    });

    it('quotes cells that contain the delimiter', () => {
      const res = jsonToCsv('[{"name":"Smith, Alice"}]', { delimiter: ',', includeHeader: true });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('name\n"Smith, Alice"');
      }
    });

    it('escapes quotes within cells', () => {
      const res = jsonToCsv('[{"name":"He said \\"hi\\""}]', { delimiter: ',', includeHeader: true });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('name\n"He said ""hi"""');
      }
    });

    it('converts an array of arrays without headers', () => {
      const res = jsonToCsv('[["Alice",30],["Bob",25]]', { delimiter: ',', includeHeader: false });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('Alice,30\nBob,25');
      }
    });

    it('returns error for invalid JSON', () => {
      const res = jsonToCsv('{invalid}', { delimiter: ',', includeHeader: true });
      expect(res.success).toBe(false);
    });

    it('returns error for empty array', () => {
      const res = jsonToCsv('[]', { delimiter: ',', includeHeader: true });
      expect(res.success).toBe(false);
    });
  });

  describe('detectDelimiter', () => {
    it('detects commas', () => {
      expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',');
    });

    it('detects semicolons', () => {
      expect(detectDelimiter('a;b;c\n1;2;3')).toBe(';');
    });

    it('detects tabs', () => {
      expect(detectDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t');
    });

    it('ignores delimiters inside quoted fields', () => {
      expect(detectDelimiter('"a;b",c,d\n1,2,3')).toBe(',');
    });
  });

  describe('formatJson', () => {
    it('pretty-prints JSON with indentation', () => {
      expect(formatJson({ a: [1, 2] })).toBe('{\n  "a": [\n    1,\n    2\n  ]\n}');
    });
  });
});
