import { describe, it, expect } from 'vitest';
import { jsonToTs } from '../utils';

describe('JSON to TS Utilities', () => {
  it('should generate TypeScript interfaces from JSON in extract mode', () => {
    const json = JSON.stringify({
      id: 1,
      username: 'johndoe',
      tags: ['dev', 'admin'],
      settings: {
        theme: 'dark'
      }
    });

    const res = jsonToTs(json, { rootName: 'User', useInterface: true });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.code).toContain('export interface UserSettings');
      expect(res.code).toContain('export interface User');
      expect(res.code).toContain('username: string;');
      expect(res.code).toContain('tags: string[];');
    }
  });

  it('should generate TypeScript types instead of interfaces when useInterface is false', () => {
    const json = JSON.stringify({ name: 'Alice', age: 30 });
    const res = jsonToTs(json, { rootName: 'Person', useInterface: false, addExport: false });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.code).toContain('type Person = {');
      expect(res.code).not.toContain('export interface');
    }
  });

  it('should generate inline nested types when nestedMode is inline', () => {
    const json = JSON.stringify({
      user: {
        id: 123,
        details: { active: true }
      }
    });

    const res = jsonToTs(json, { rootName: 'Root', nestedMode: 'inline' });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.code).toContain('export interface Root');
      expect(res.code).toContain('user: {');
      expect(res.code).not.toContain('export interface RootUser');
    }
  });

  it('should quote invalid property identifiers and handle optional fields', () => {
    const json = JSON.stringify({
      'content-type': 'application/json',
      'user-id': 42,
      nullableVal: null
    });

    const res = jsonToTs(json, { makeOptional: true });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.code).toContain('"content-type"?: string;');
      expect(res.code).toContain('"user-id"?: number;');
      expect(res.code).toContain('nullableVal?: any;');
    }
  });

  it('should handle array of objects with merged properties and singular naming', () => {
    const json = JSON.stringify({
      usersList: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob', email: 'bob@example.com' }
      ]
    });

    const res = jsonToTs(json, { rootName: 'Data' });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.code).toContain('export interface DataUsers');
      expect(res.code).toContain('email: string;');
    }
  });

  it('should handle top-level primitives and empty arrays', () => {
    const strRes = jsonToTs('"hello world"', { rootName: 'MyString' });
    expect(strRes.success).toBe(true);
    if (strRes.success) {
      expect(strRes.code).toBe('export type MyString = string;');
    }

    const arrRes = jsonToTs('[]', { rootName: 'EmptyList', nestedMode: 'inline' });
    expect(arrRes.success).toBe(true);
    if (arrRes.success) {
      expect(arrRes.code).toBe('export type EmptyList = any[];');
    }
  });

  it('should return error for invalid JSON input', () => {
    const res = jsonToTs('{ invalid json }');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain('Invalid JSON');
    }
  });
});
