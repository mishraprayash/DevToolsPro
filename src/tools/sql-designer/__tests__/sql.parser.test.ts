import { describe, it, expect } from 'vitest';
import { parseSqlToNodes } from '../parsers/sql.parser';

describe('parseSqlToNodes', () => {
  it('should parse basic CREATE TABLE statements', () => {
    const sql = `
      CREATE TABLE users (
        id INT PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      );
      CREATE TABLE posts (
        id INT PRIMARY KEY,
        user_id INT,
        title VARCHAR(200),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `;

    const { nodes, edges } = parseSqlToNodes(sql);

    expect(nodes).toHaveLength(2);
    expect(nodes[0].data.tableName).toBe('users');
    expect(nodes[1].data.tableName).toBe('posts');

    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('tbl-users');
    expect(edges[0].sourceHandle).toBe('col-users-id');
    expect(edges[0].target).toBe('tbl-posts');
    expect(edges[0].targetHandle).toBe('col-posts-user_id');
  });

  it('should parse ALTER TABLE FOREIGN KEY statements', () => {
    const sql = `
      CREATE TABLE users (
        id INT PRIMARY KEY
      );
      CREATE TABLE orders (
        id INT PRIMARY KEY,
        user_id INT
      );
      ALTER TABLE orders ADD CONSTRAINT fk_orders_users FOREIGN KEY (user_id) REFERENCES users(id);
    `;

    const { nodes, edges } = parseSqlToNodes(sql);

    expect(nodes).toHaveLength(2);
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('tbl-users');
    expect(edges[0].sourceHandle).toBe('col-users-id');
    expect(edges[0].target).toBe('tbl-orders');
    expect(edges[0].targetHandle).toBe('col-orders-user_id');
  });

  it('should preserve column IDs from existingNodes when matching', () => {
    const existingNodes = [
      {
        id: 'tbl-users',
        type: 'tableNode',
        position: { x: 100, y: 100 },
        data: {
          tableName: 'users',
          columns: [
            {
              id: 'custom-user-id-123',
              name: 'id',
              type: 'INT',
              isPrimary: true,
              isNullable: false,
              isUnique: false,
              defaultValue: '',
            },
          ],
        },
      },
    ];

    const sql = `
      CREATE TABLE users (
        id INT PRIMARY KEY,
        email VARCHAR(255)
      );
    `;

    const { nodes } = parseSqlToNodes(sql, existingNodes);

    expect(nodes[0].position).toEqual({ x: 100, y: 100 });
    expect(nodes[0].data.columns[0].id).toBe('custom-user-id-123');
  });
});
