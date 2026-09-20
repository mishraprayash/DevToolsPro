import { describe, it, expect } from 'vitest';
import { formatSql, minifySql, analyzeSql } from '../utils';

describe('SQL Prettify Utilities', () => {
  it('should format SQL query string', async () => {
    const sql = 'select * from users where id = 1';
    const res = await formatSql(sql, { language: 'sql', keywordCase: 'upper', tabWidth: 2, useSpaces: true });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toContain('SELECT');
      expect(res.data).toContain('FROM');
    }
  });

  it('should minify SQL query string', () => {
    const sql = 'SELECT * \n FROM users \n WHERE id = 1; -- comment';
    const res = minifySql(sql);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toBe('SELECT * FROM users WHERE id = 1;');
    }
  });

  it('should analyze SQL query stats and detect tables', () => {
    const sql = 'SELECT id, name FROM users JOIN orders ON users.id = orders.user_id';
    const stats = analyzeSql(sql);
    expect(stats.commandType).toBe('SELECT');
    expect(stats.tablesDetected).toContain('users');
    expect(stats.tablesDetected).toContain('orders');
  });
});
