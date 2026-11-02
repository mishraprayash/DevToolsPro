import { describe, it, expect } from 'vitest';
import {
  countLinesUpTo,
  shouldOffloadDiff,
  shouldOffloadMockData,
  shouldOffloadSchema,
  DIFF_OFFLOAD_MAX_CHARS,
  DIFF_OFFLOAD_MAX_LINES,
  MOCK_OFFLOAD_MIN_ROWS,
  SCHEMA_OFFLOAD_MIN_CHARS,
} from '@/lib/workers/thresholds';
import { runHeavyTask, runRegexTask, isHeavyTaskName } from '@/lib/workers/heavyTasks';

const lines = (n: number) => Array.from({ length: n }, (_, i) => `l${i}`).join('\n');

describe('countLinesUpTo', () => {
  it('counts lines exactly below the limit', () => {
    expect(countLinesUpTo('', 10)).toBe(1);
    expect(countLinesUpTo('a\nb\nc', 10)).toBe(3);
  });
  it('stops early past the limit', () => {
    expect(countLinesUpTo(lines(1000), 5)).toBe(6);
  });
});

describe('shouldOffloadDiff', () => {
  it('keeps small inputs on the main thread', () => {
    expect(shouldOffloadDiff('a\nb', 'a\nc')).toBe(false);
    expect(shouldOffloadDiff(lines(1000), lines(1000))).toBe(false);
  });
  it('offloads when combined lines exceed the limit', () => {
    expect(shouldOffloadDiff(lines(1000), lines(1001))).toBe(true);
    expect(shouldOffloadDiff(lines(DIFF_OFFLOAD_MAX_LINES + 1), '')).toBe(true);
  });
  it('offloads when combined size exceeds the char limit', () => {
    const big = 'x'.repeat(DIFF_OFFLOAD_MAX_CHARS / 2 + 1);
    expect(shouldOffloadDiff(big, big)).toBe(true);
  });
});

describe('shouldOffloadMockData / shouldOffloadSchema', () => {
  it('uses the row threshold', () => {
    expect(shouldOffloadMockData(10)).toBe(false);
    expect(shouldOffloadMockData(MOCK_OFFLOAD_MIN_ROWS)).toBe(true);
    expect(shouldOffloadMockData(1000)).toBe(true);
    expect(shouldOffloadMockData(NaN)).toBe(false);
  });
  it('uses the char threshold', () => {
    expect(shouldOffloadSchema('{"a":1}')).toBe(false);
    expect(shouldOffloadSchema(' '.repeat(SCHEMA_OFFLOAD_MIN_CHARS))).toBe(true);
  });
});

describe('heavy task dispatch (shared by worker and main-thread fallback)', () => {
  it('dispatches each task to the real util', () => {
    expect(runHeavyTask('diff', { original: 'a', modified: 'b', options: {} }).hasChanges).toBe(true);
    const mock = runHeavyTask('mock', { schema: [{ name: 'id', type: 'id' }], count: 3, format: 'json' });
    expect(mock.success && JSON.parse(mock.data)).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(runHeavyTask('schema', { json: '{"a":1}', options: {} }).success).toBe(true);
  });
  it('regex task returns matches and replacement together', () => {
    expect(runRegexTask({ pattern: '(\\d)', flags: 'g', input: 'a1b2', replacement: '[$1]' })).toEqual({
      matches: [
        { index: 1, text: '1', groups: ['1'] },
        { index: 3, text: '2', groups: ['2'] },
      ],
      isValid: true,
      error: undefined,
      replaced: 'a[1]b[2]',
    });
    const bad = runRegexTask({ pattern: '(', flags: 'g', input: 'x', replacement: '' });
    expect(bad.isValid).toBe(false);
    expect(bad.replaced).toBe('');
  });
  it('validates task names', () => {
    expect(isHeavyTaskName('regex')).toBe(true);
    expect(isHeavyTaskName('toString')).toBe(false);
    expect(isHeavyTaskName(42)).toBe(false);
  });
});
