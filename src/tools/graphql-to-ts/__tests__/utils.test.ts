import { describe, it, expect } from 'vitest';
import { gqlToTs } from '../utils';

describe('GraphQL to TS Utilities', () => {
  it('should convert GraphQL types and enums to TypeScript interfaces and enums', () => {
    const gql = `
      enum Role {
        ADMIN
        USER
      }

      type User {
        id: ID!
        name: String!
        age: Int
        roles: [Role!]!
      }
    `;

    const res = gqlToTs(gql);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toContain('export enum Role');
      expect(res.data).toContain("ADMIN = 'ADMIN'");
      expect(res.data).toContain('export interface User');
      expect(res.data).toContain('id: string;');
      expect(res.data).toContain('name: string;');
      expect(res.data).toContain('age?: number;');
      expect(res.data).toContain('roles: Role[];');
    }
  });

  it('should handle empty input', () => {
    const res = gqlToTs('');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toBe('');
    }
  });

  it('should return default comment when no valid GraphQL types are found', () => {
    const res = gqlToTs('# Just a comment');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toContain('No valid GraphQL type');
    }
  });
});
