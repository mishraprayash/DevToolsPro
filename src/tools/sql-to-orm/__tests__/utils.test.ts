import { describe, it, expect } from 'vitest';
import { parseSqlCreate, generateOrmEntities } from '../utils';

describe('SQL to ORM Utilities', () => {
  const sampleSql = `
    CREATE TABLE users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      email VARCHAR(255) NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  it('should parse CREATE TABLE statement into column definitions', () => {
    const res = parseSqlCreate(sampleSql);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.tableName).toBe('users');
      expect(res.data).toHaveLength(3);
      expect(res.data[0].name).toBe('id');
      expect(res.data[0].isPrimaryKey).toBe(true);
      expect(res.data[1].isUnique).toBe(true);
    }
  });

  it('should generate Prisma, TypeORM, and Mongoose entities from columns', () => {
    const parsed = parseSqlCreate(sampleSql);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      const entities = generateOrmEntities(parsed.tableName, parsed.data);
      expect(entities.prisma).toContain('model Users');
      expect(entities.typeorm).toContain('@Entity(\'users\')');
      expect(entities.mongoose).toContain('UsersSchema = new Schema');
    }
  });

  it('should return failure for invalid SQL syntax', () => {
    const res = parseSqlCreate('INVALID SQL STATEMENT');
    expect(res.success).toBe(false);
  });
});
