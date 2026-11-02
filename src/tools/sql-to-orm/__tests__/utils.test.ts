import { describe, it, expect } from 'vitest';
import { parseSqlCreate, generateOrmEntities } from '../utils';

describe('SQL to ORM Converter Utilities', () => {
  const sampleSql = `
    CREATE TABLE users (
      id INT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  describe('parseSqlCreate', () => {
    it('should parse valid CREATE TABLE statement into column definitions', () => {
      const res = parseSqlCreate(sampleSql);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.tableName).toBe('users');
        expect(res.data).toHaveLength(5);

        const idCol = res.data.find(c => c.name === 'id');
        expect(idCol).toBeDefined();
        expect(idCol?.isPrimaryKey).toBe(true);
        expect(idCol?.type).toBe('INT');

        const activeCol = res.data.find(c => c.name === 'is_active');
        expect(activeCol?.defaultValue).toBe('TRUE');
      }
    });

    it('should handle table-level PRIMARY KEY constraint syntax', () => {
      const sqlWithConstraint = `
        CREATE TABLE products (
          product_id INT NOT NULL,
          product_name VARCHAR(100),
          PRIMARY KEY (product_id)
        );
      `;
      const res = parseSqlCreate(sqlWithConstraint);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.tableName).toBe('products');
        const pkCol = res.data.find(c => c.name === 'product_id');
        expect(pkCol?.isPrimaryKey).toBe(true);
      }
    });

    it('should return error for empty SQL input', () => {
      const res = parseSqlCreate('   ');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toBe('Empty SQL input');
      }
    });

    it('should return error for invalid non-CREATE TABLE statement', () => {
      const res = parseSqlCreate('SELECT * FROM users;');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain('Could not parse CREATE TABLE statement');
      }
    });
  });

  describe('generateOrmEntities', () => {
    it('should generate Prisma, TypeORM, and Mongoose entities from columns', () => {
      const parseRes = parseSqlCreate(sampleSql);
      expect(parseRes.success).toBe(true);
      if (parseRes.success) {
        const entities = generateOrmEntities(parseRes.tableName, parseRes.data);

        // Prisma
        expect(entities.prisma).toContain('model Users');
        expect(entities.prisma).toContain('id Int @id');
        expect(entities.prisma).toContain('username String @unique');

        // TypeORM
        expect(entities.typeorm).toContain("@Entity('users')");
        expect(entities.typeorm).toContain('export class Users');
        expect(entities.typeorm).toContain('@PrimaryGeneratedColumn()');

        // Mongoose
        expect(entities.mongoose).toContain('const UsersSchema = new Schema');
        expect(entities.mongoose).toContain("export const Users = model('Users', UsersSchema)");
      }
    });
  });
});
