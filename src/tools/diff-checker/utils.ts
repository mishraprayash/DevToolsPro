export interface DiffToken {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

export interface SplitDiffRow {
  oldLine?: {
    lineNumber: number;
    value: string;
    type: 'removed' | 'unchanged' | 'modified';
    tokens?: DiffToken[];
  };
  newLine?: {
    lineNumber: number;
    value: string;
    type: 'added' | 'unchanged' | 'modified';
    tokens?: DiffToken[];
  };
}

export interface UnifiedDiffLine {
  type: 'added' | 'removed' | 'unchanged';
  lineNumberOld?: number;
  lineNumberNew?: number;
  value: string;
}

export interface DiffOptions {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
}

export interface DiffResult {
  splitRows: SplitDiffRow[];
  unifiedLines: UnifiedDiffLine[];
  hasChanges: boolean;
  addedCount: number;
  removedCount: number;
  diffLineIndices: number[];
  splitRowIndices: number[];
}

function charDiff(oldStr: string, newStr: string): { oldTokens: DiffToken[]; newTokens: DiffToken[] } {
  const oldChars = Array.from(oldStr);
  const newChars = Array.from(newStr);
  
  const m = oldChars.length;
  const n = newChars.length;
  
  if (m === 0) {
    return {
      oldTokens: [],
      newTokens: [{ type: 'added', value: newStr }]
    };
  }
  if (n === 0) {
    return {
      oldTokens: [{ type: 'removed', value: oldStr }],
      newTokens: []
    };
  }

  // Cap DP size for performance
  if (m > 800 || n > 800) {
    return {
      oldTokens: [{ type: 'removed', value: oldStr }],
      newTokens: [{ type: 'added', value: newStr }]
    };
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldChars[i - 1] === newChars[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = m;
  let j = n;
  const oldTokens: DiffToken[] = [];
  const newTokens: DiffToken[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldChars[i - 1] === newChars[j - 1]) {
      oldTokens.push({ type: 'unchanged', value: oldChars[i - 1] });
      newTokens.push({ type: 'unchanged', value: newChars[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      newTokens.push({ type: 'added', value: newChars[j - 1] });
      j--;
    } else {
      oldTokens.push({ type: 'removed', value: oldChars[i - 1] });
      i--;
    }
  }

  oldTokens.reverse();
  newTokens.reverse();

  const mergeTokens = (tokens: DiffToken[]): DiffToken[] => {
    if (tokens.length === 0) return [];
    const merged: DiffToken[] = [];
    let current = tokens[0];

    for (let k = 1; k < tokens.length; k++) {
      if (tokens[k].type === current.type) {
        current.value += tokens[k].value;
      } else {
        merged.push(current);
        current = tokens[k];
      }
    }
    merged.push(current);
    return merged;
  };

  return {
    oldTokens: mergeTokens(oldTokens),
    newTokens: mergeTokens(newTokens)
  };
}

export function computeDiff(original: string, modified: string, options: Partial<DiffOptions> = {}): DiffResult {
  const opts: DiffOptions = {
    ignoreWhitespace: false,
    ignoreCase: false,
    ...options
  };

  const oldLines = original.split(/\r?\n/);
  const newLines = modified.split(/\r?\n/);

  const clean = (s: string) => {
    let res = s;
    if (opts.ignoreWhitespace) res = res.trim().replace(/\s+/g, ' ');
    if (opts.ignoreCase) res = res.toLowerCase();
    return res;
  };

  const m = oldLines.length;
  const n = newLines.length;

  // LCS Dynamic Programming
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (clean(oldLines[i - 1]) === clean(newLines[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = m;
  let j = n;
  const path: { type: 'added' | 'removed' | 'unchanged'; oldIdx: number; newIdx: number }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && clean(oldLines[i - 1]) === clean(newLines[j - 1])) {
      path.push({ type: 'unchanged', oldIdx: i - 1, newIdx: j - 1 });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      path.push({ type: 'added', oldIdx: -1, newIdx: j - 1 });
      j--;
    } else {
      path.push({ type: 'removed', oldIdx: i - 1, newIdx: -1 });
      i--;
    }
  }

  path.reverse();

  // Build unified lines directly from path
  const unifiedLines: UnifiedDiffLine[] = [];
  const diffLineIndices: number[] = [];
  let addedCount = 0;
  let removedCount = 0;
  let hasChanges = false;

  for (const step of path) {
    if (step.type === 'unchanged') {
      unifiedLines.push({
        type: 'unchanged',
        lineNumberOld: step.oldIdx + 1,
        lineNumberNew: step.newIdx + 1,
        value: oldLines[step.oldIdx]
      });
    } else if (step.type === 'added') {
      hasChanges = true;
      addedCount++;
      unifiedLines.push({
        type: 'added',
        lineNumberNew: step.newIdx + 1,
        value: newLines[step.newIdx]
      });
      diffLineIndices.push(unifiedLines.length - 1);
    } else {
      hasChanges = true;
      removedCount++;
      unifiedLines.push({
        type: 'removed',
        lineNumberOld: step.oldIdx + 1,
        value: oldLines[step.oldIdx]
      });
      diffLineIndices.push(unifiedLines.length - 1);
    }
  }

  // Build split rows
  // To handle character highlighting on "modified" lines, we group adjacent removes & adds
  const splitRows: SplitDiffRow[] = [];
  const splitRowIndices: number[] = [];
  let idx = 0;

  while (idx < path.length) {
    const current = path[idx];

    if (current.type === 'unchanged') {
      splitRows.push({
        oldLine: {
          lineNumber: current.oldIdx + 1,
          value: oldLines[current.oldIdx],
          type: 'unchanged'
        },
        newLine: {
          lineNumber: current.newIdx + 1,
          value: newLines[current.newIdx],
          type: 'unchanged'
        }
      });
      idx++;
    } else {
      // Find contiguous blocks of removals and additions
      const removes: typeof path = [];
      const adds: typeof path = [];

      while (idx < path.length && path[idx].type === 'removed') {
        removes.push(path[idx]);
        idx++;
      }
      while (idx < path.length && path[idx].type === 'added') {
        adds.push(path[idx]);
        idx++;
      }

      // Match them up as modified where possible, otherwise leave as stand-alone additions/removals
      const maxLen = Math.max(removes.length, adds.length);

      for (let k = 0; k < maxLen; k++) {
        const rem = removes[k];
        const add = adds[k];

        if (rem && add) {
          // Both side present -> Treat as modification
          const oldVal = oldLines[rem.oldIdx];
          const newVal = newLines[add.newIdx];
          const { oldTokens, newTokens } = charDiff(oldVal, newVal);

          splitRows.push({
            oldLine: {
              lineNumber: rem.oldIdx + 1,
              value: oldVal,
              type: 'modified',
              tokens: oldTokens
            },
            newLine: {
              lineNumber: add.newIdx + 1,
              value: newVal,
              type: 'modified',
              tokens: newTokens
            }
          });
          splitRowIndices.push(splitRows.length - 1);
        } else if (rem) {
          // Only removal
          splitRows.push({
            oldLine: {
              lineNumber: rem.oldIdx + 1,
              value: oldLines[rem.oldIdx],
              type: 'removed'
            }
          });
          splitRowIndices.push(splitRows.length - 1);
        } else if (add) {
          // Only addition
          splitRows.push({
            newLine: {
              lineNumber: add.newIdx + 1,
              value: newLines[add.newIdx],
              type: 'added'
            }
          });
          splitRowIndices.push(splitRows.length - 1);
        }
      }
    }
  }

  return {
    splitRows,
    unifiedLines,
    hasChanges,
    addedCount,
    removedCount,
    diffLineIndices,
    splitRowIndices
  };
}
