import { describe, it, expect } from 'vitest';
import { computeDiff } from '../utils';

describe('Diff Checker Utilities', () => {
  it('should detect additions, removals, and unchanged lines in unified and split diffs', () => {
    const original = 'line 1\nline 2\nline 3';
    const modified = 'line 1\nline 2 modified\nline 3\nline 4';

    const result = computeDiff(original, modified);

    expect(result.hasChanges).toBe(true);
    expect(result.addedCount).toBeGreaterThan(0);
    expect(result.removedCount).toBeGreaterThan(0);

    // Verify split rows structure
    expect(result.splitRows.length).toBeGreaterThan(0);
    const modifiedRow = result.splitRows.find(r => r.oldLine?.type === 'modified');
    expect(modifiedRow).toBeDefined();
    expect(modifiedRow?.newLine?.type).toBe('modified');
    expect(modifiedRow?.oldLine?.tokens).toBeDefined();
    expect(modifiedRow?.newLine?.tokens).toBeDefined();
  });

  it('should report no changes for identical strings', () => {
    const text = 'const x = 10;\nconsole.log(x);';
    const result = computeDiff(text, text);

    expect(result.hasChanges).toBe(false);
    expect(result.addedCount).toBe(0);
    expect(result.removedCount).toBe(0);
    expect(result.unifiedLines.every(l => l.type === 'unchanged')).toBe(true);
  });

  it('should handle ignoreWhitespace option', () => {
    const original = '  hello   world  ';
    const modified = 'hello world';

    const defaultResult = computeDiff(original, modified, { ignoreWhitespace: false });
    expect(defaultResult.hasChanges).toBe(true);

    const ignoreWsResult = computeDiff(original, modified, { ignoreWhitespace: true });
    expect(ignoreWsResult.hasChanges).toBe(false);
  });

  it('should handle ignoreCase option', () => {
    const original = 'Hello World';
    const modified = 'hello world';

    const caseInsensitiveResult = computeDiff(original, modified, { ignoreCase: true });
    expect(caseInsensitiveResult.hasChanges).toBe(false);
  });

  it('should handle completely empty inputs and edge cases', () => {
    const emptyResult = computeDiff('', '');
    expect(emptyResult.hasChanges).toBe(false);

    const addOnlyResult = computeDiff('', 'new line');
    expect(addOnlyResult.hasChanges).toBe(true);
    expect(addOnlyResult.addedCount).toBe(1);

    const removeOnlyResult = computeDiff('old line', '');
    expect(removeOnlyResult.hasChanges).toBe(true);
    expect(removeOnlyResult.removedCount).toBe(1);
  });
});
