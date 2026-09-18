import { describe, it, expect } from 'vitest';
import { computeDiff } from '../utils';

describe('Diff Checker Utilities', () => {
  it('should report no changes for identical text', () => {
    const text = 'Line 1\nLine 2\nLine 3';
    const res = computeDiff(text, text);
    expect(res.hasChanges).toBe(false);
    expect(res.addedCount).toBe(0);
    expect(res.removedCount).toBe(0);
    expect(res.unifiedLines).toHaveLength(3);
    expect(res.splitRows).toHaveLength(3);
  });

  it('should identify additions and deletions correctly', () => {
    const original = 'Line 1\nLine 2';
    const modified = 'Line 1\nLine 2\nLine 3';
    const res = computeDiff(original, modified);
    expect(res.hasChanges).toBe(true);
    expect(res.addedCount).toBe(1);
    expect(res.removedCount).toBe(0);
    expect(res.unifiedLines).toHaveLength(3);
  });

  it('should identify modified lines with character tokens in split view', () => {
    const original = 'Hello World';
    const modified = 'Hello Vitest';
    const res = computeDiff(original, modified);
    expect(res.hasChanges).toBe(true);
    expect(res.splitRows).toHaveLength(1);
    const row = res.splitRows[0];
    expect(row.oldLine?.type).toBe('modified');
    expect(row.newLine?.type).toBe('modified');
    expect(row.oldLine?.tokens).toBeDefined();
    expect(row.newLine?.tokens).toBeDefined();
  });

  it('should honor ignoreWhitespace and ignoreCase options', () => {
    const original = 'HELLO   WORLD';
    const modified = 'hello world';

    const strictRes = computeDiff(original, modified, { ignoreWhitespace: false, ignoreCase: false });
    expect(strictRes.hasChanges).toBe(true);

    const relaxedRes = computeDiff(original, modified, { ignoreWhitespace: true, ignoreCase: true });
    expect(relaxedRes.hasChanges).toBe(false);
  });

  it('should handle empty input strings gracefully', () => {
    const res = computeDiff('', '');
    expect(res.hasChanges).toBe(false);
    expect(res.unifiedLines).toHaveLength(1);
    expect(res.unifiedLines[0].value).toBe('');
  });

  it('should fallback gracefully when character diff input exceeds 800 chars', () => {
    const long1 = 'a'.repeat(850);
    const long2 = 'b'.repeat(850);
    const res = computeDiff(long1, long2);
    expect(res.hasChanges).toBe(true);
  });
});
