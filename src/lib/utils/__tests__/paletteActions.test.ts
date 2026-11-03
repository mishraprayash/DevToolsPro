import { describe, it, expect } from 'vitest';
import { matchActions, PALETTE_ACTIONS, type MatchableAction } from '../paletteActions';

const labels = (q: string, limit?: number) => matchActions(PALETTE_ACTIONS, q, limit).map((a) => a.id);

describe('PALETTE_ACTIONS', () => {
  it('has unique ids and non-empty labels/keywords', () => {
    expect(new Set(PALETTE_ACTIONS.map((a) => a.id)).size).toBe(PALETTE_ACTIONS.length);
    for (const a of PALETTE_ACTIONS) {
      expect(a.label.trim()).not.toBe('');
      expect(a.keywords.length).toBeGreaterThan(0);
    }
  });
});

describe('matchActions', () => {
  it('returns featured actions in definition order for an empty query', () => {
    const featured = PALETTE_ACTIONS.filter((a) => a.featured).map((a) => a.id);
    expect(labels('')).toEqual(featured.slice(0, 5));
    expect(labels('   ')).toEqual(featured.slice(0, 5));
    expect(labels('', 2)).toEqual(featured.slice(0, 2));
  });

  it('matches by label and keywords, case-insensitively', () => {
    expect(labels('UUID')[0]).toBe('copy-uuid');
    expect(labels('guid')).toEqual(['copy-uuid']);
    expect(labels('epoch')).toEqual(['copy-timestamp']);
    expect(labels('dark')).toEqual(['toggle-theme']);
    expect(labels('hotkeys')).toEqual(['open-shortcuts']);
  });

  it('requires every token to match', () => {
    expect(labels('base64 decode')).toEqual(['decode-base64-clipboard']);
    expect(labels('base64 encode')).toEqual(['encode-base64-clipboard']);
    expect(labels('base64 zebra')).toEqual([]);
  });

  it('ranks label-prefix matches above keyword matches', () => {
    // "hash" is the label prefix of the hash action
    expect(labels('hash')[0]).toBe('hash-clipboard');
    // "clipboard" is a label word for several; ordering is stable by definition order
    const clip = labels('clipboard', 10);
    expect(clip).toContain('format-json-clipboard');
    expect(clip).toContain('decode-base64-clipboard');
    expect(clip.indexOf('format-json-clipboard')).toBeLessThan(clip.indexOf('decode-base64-clipboard'));
  });

  it('matches partial words as you type', () => {
    expect(labels('gen pass')).toEqual(['copy-password']);
    expect(labels('tog')).toEqual(['toggle-theme']);
    expect(labels('sha')).toContain('hash-clipboard');
  });

  it('does not match short substrings in the middle of keywords', () => {
    // "id" is a keyword of the UUID action; "ui" only appears mid-word ("guid", "uuid")
    expect(labels('ui')).not.toContain('copy-password');
  });

  it('returns nothing for unrelated, long or multi-line queries', () => {
    expect(labels('kubernetes')).toEqual([]);
    expect(labels('x'.repeat(60))).toEqual([]);
    expect(labels('json\nformat')).toEqual([]);
  });

  it('respects the limit', () => {
    expect(labels('clipboard', 2)).toHaveLength(2);
  });

  it('works on custom action lists and never throws', () => {
    const custom: MatchableAction[] = [
      { label: 'Alpha', keywords: ['first'] },
      { label: 'Beta', keywords: ['second'], featured: true },
    ];
    expect(matchActions(custom, '')).toEqual([custom[1]]);
    expect(matchActions(custom, 'first')).toEqual([custom[0]]);
    expect(() => matchActions(custom, undefined as unknown as string)).not.toThrow();
    expect(matchActions([{ label: 'x' } as unknown as MatchableAction], 'x')).toEqual([]);
  });
});
