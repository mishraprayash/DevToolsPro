import { describe, it, expect } from 'vitest';
import { jsonToTs } from '../utils';

describe('JSON to TypeScript Converter Utilities', () => {
  it('should convert flat JSON object to TypeScript interface', () => {
    const json = JSON.stringify({ name: 'John Doe', age: 30, isActive: true });
    const res = jsonToTs(json, { rootName: 'User', useInterface: true });
    expect(res.success).toBe(true);
    expect(res.code).toContain('export interface User {');
    expect(res.code).toContain('name: string;');
    expect(res.code).toContain('age: number;');
    expect(res.code).toContain('isActive: boolean;');
  });

  it('should convert JSON with nested objects in extract mode', () => {
    const json = JSON.stringify({
      id: 1,
      address: { street: '123 Main St', city: 'Metropolis' }
    });
    const res = jsonToTs(json, { rootName: 'Person', nestedMode: 'extract' });
    expect(res.success).toBe(true);
    expect(res.code).toContain('export interface PersonAddress {');
    expect(res.code).toContain('export interface Person {');
    expect(res.code).toContain('address: PersonAddress;');
  });

  it('should convert JSON with array of objects and merge item types', () => {
    const json = JSON.stringify({
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2', price: 9.99 }
      ]
    });
    const res = jsonToTs(json, { rootName: 'Inventory' });
    expect(res.success).toBe(true);
    expect(res.code).toContain('export interface InventoryItem {');
    expect(res.code).toContain('items: InventoryItem[];');
  });

  it('should handle type alias mode when useInterface is false', () => {
    const json = JSON.stringify({ title: 'Hello World' });
    const res = jsonToTs(json, { rootName: 'Post', useInterface: false });
    expect(res.success).toBe(true);
    expect(res.code).toContain('export type Post = {');
  });

  it('should handle makeOptional option correctly', () => {
    const json = JSON.stringify({ title: 'DevTools' });
    const res = jsonToTs(json, { rootName: 'App', makeOptional: true });
    expect(res.success).toBe(true);
    expect(res.code).toContain('title?: string;');
  });

  it('should handle malformed JSON input with appropriate error', () => {
    const res = jsonToTs('{ invalid json input }');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid JSON:');
  });

  it('should handle empty JSON string', () => {
    const res = jsonToTs('');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid JSON:');
  });
});
