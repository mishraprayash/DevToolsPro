import { describe, it, expect } from 'vitest';
import { hasCreateTable } from '../utils';

describe('hasCreateTable', () => {
  it('detects CREATE TABLE variants', () => {
    expect(hasCreateTable('CREATE TABLE users (id INT);')).toBe(true);
    expect(hasCreateTable('create   table\n"orders" (id int)')).toBe(true);
    expect(hasCreateTable('CREATE TEMPORARY TABLE t (a int)')).toBe(true);
    expect(hasCreateTable('CREATE GLOBAL TEMP TABLE t (a int)')).toBe(true);
    expect(hasCreateTable('CREATE UNLOGGED TABLE t (a int)')).toBe(true);
    expect(hasCreateTable('SELECT 1;\nCREATE TABLE IF NOT EXISTS t (a int);')).toBe(true);
  });

  it('ignores other statements and comments', () => {
    expect(hasCreateTable('SELECT * FROM create_table_log')).toBe(false);
    expect(hasCreateTable('CREATE INDEX idx ON t (a)')).toBe(false);
    expect(hasCreateTable('-- CREATE TABLE old (a int)\nSELECT 1')).toBe(false);
    expect(hasCreateTable('/* CREATE TABLE x (a int) */ DROP TABLE y')).toBe(false);
    expect(hasCreateTable('')).toBe(false);
    expect(hasCreateTable(undefined as unknown as string)).toBe(false);
  });
});
