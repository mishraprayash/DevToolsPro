import { describe, it, expect } from 'vitest';
import { searchTools, toolMatchesQuery, tools } from '../../registry';

describe('registry search', () => {
  it('matches by keyword', () => {
    const res = searchTools('prisma');
    expect(res.some((t) => t.id === 'sql-to-orm')).toBe(true);
  });

  it('matches abbreviations and synonyms', () => {
    expect(searchTools('guid').some((t) => t.id === 'uuid')).toBe(true);
    expect(searchTools('base64').some((t) => t.id === 'encoder')).toBe(true);
  });

  it('matches numeric status codes', () => {
    const res = searchTools('404');
    expect(res.some((t) => t.id === 'http-status')).toBe(true);
  });

  it('returns all tools for empty query', () => {
    expect(searchTools('').length).toBe(tools.length);
  });

  it('is case insensitive', () => {
    expect(toolMatchesQuery(tools[0], 'PRISMA')).toBe(false);
    expect(toolMatchesQuery(tools.find((t) => t.id === 'sql-to-orm')!, 'PRISMA')).toBe(true);
  });
});
