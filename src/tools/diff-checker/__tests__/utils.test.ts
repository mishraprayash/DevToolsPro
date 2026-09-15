import { describe, it, expect } from 'vitest';
import { computeDiff } from '../utils';

describe('Diff Checker Utilities', () => {
  it('should detect no changes for identical text', () => {
    const original = 'line 1\nline 2\nline 3';
    const modified = 'line 1\nline 2\nline 3';

    const result = computeDiff(original, modified);
    expect(result.hasChanges).toBe(false);
    expect(result.addedCount).toBe(0);
    expect(result.removedCount).toBe(0);
    expect(result.unifiedLines).toHaveLength(3);
    expect(result.splitRows).toHaveLength(3);
  });

  it('should detect added lines', () => {
    const original = 'line 1\nline 2';
    const modified = 'line 1\nline 1.5\nline 2';

    const result = computeDiff(original, modified);
    expect(result.hasChanges).toBe(true);
    expect(result.addedCount).toBe(1);
    expect(result.removedCount).toBe(0);
    expect(result.unifiedLines.some((l) => l.type === 'added' && l.value === 'line 1.5')).toBe(true);
  });

  it('should detect removed lines', () => {
    const original = 'line 1\nline 2\nline 3';
    const modified = 'line 1\nline 3';

    const result = computeDiff(original, modified);
    expect(result.hasChanges).toBe(true);
    expect(result.addedCount).toBe(0);
    expect(result.removedCount).toBe(1);
    expect(result.unifiedLines.some((l) => l.type === 'removed' && l.value === 'line 2')).toBe(true);
  });

  it('should detect modified lines and generate char tokens', () => {
    const original = 'const foo = "hello";';
    const modified = 'const foo = "world";';

    const result = computeDiff(original, modified);
    expect(result.hasChanges).toBe(true);
    expect(result.splitRows).toHaveLength(1);

    const row = result.splitRows[0];
    expect(row.oldLine?.type).toBe('modified');
    expect(row.newLine?.type).toBe('modified');
    expect(row.oldLine?.tokens).toBeDefined();
    expect(row.newLine?.tokens).toBeDefined();
  });

  it('should respect ignoreWhitespace option', () => {
    const original = 'hello   world';
    const modified = 'hello world';

    const diffDefault = computeDiff(original, modified, { ignoreWhitespace: false });
    expect(diffDefault.hasChanges).toBe(true);

    const diffIgnored = computeDiff(original, modified, { ignoreWhitespace: true });
    expect(diffIgnored.hasChanges).toBe(false);
  });

  it('should respect ignoreCase option', () => {
    const original = 'HELLO WORLD';
    const modified = 'hello world';

    const diffDefault = computeDiff(original, modified, { ignoreCase: false });
    expect(diffDefault.hasChanges).toBe(true);

    const diffIgnored = computeDiff(original, modified, { ignoreCase: true });
    expect(diffIgnored.hasChanges).toBe(false);
  });
});
