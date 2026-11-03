/**
 * Size thresholds deciding when heavy tool work is moved off the main thread.
 * Small inputs stay synchronous so the UI feels instant.
 */

export const DIFF_OFFLOAD_MAX_LINES = 2_000;
export const DIFF_OFFLOAD_MAX_CHARS = 200_000;
export const MOCK_OFFLOAD_MIN_ROWS = 200;
export const SCHEMA_OFFLOAD_MIN_CHARS = 100_000;

/** Hard limit for a single regex evaluation before its worker is killed. */
export const REGEX_TIMEOUT_MS = 1_500;
export const REGEX_TIMEOUT_MESSAGE = 'Pattern took too long — possible catastrophic backtracking';

/** Counts lines (1 + number of '\n'), stopping early once `limit` is exceeded. */
export function countLinesUpTo(text: string, limit: number): number {
  let lines = 1;
  let idx = text.indexOf('\n');
  while (idx !== -1) {
    lines++;
    if (lines > limit) return lines;
    idx = text.indexOf('\n', idx + 1);
  }
  return lines;
}

export function shouldOffloadDiff(original: string, modified: string): boolean {
  if (original.length + modified.length > DIFF_OFFLOAD_MAX_CHARS) return true;
  const oldLines = countLinesUpTo(original, DIFF_OFFLOAD_MAX_LINES);
  if (oldLines > DIFF_OFFLOAD_MAX_LINES) return true;
  return oldLines + countLinesUpTo(modified, DIFF_OFFLOAD_MAX_LINES - oldLines) > DIFF_OFFLOAD_MAX_LINES;
}

export function shouldOffloadMockData(count: number): boolean {
  return Number.isFinite(count) && count >= MOCK_OFFLOAD_MIN_ROWS;
}

export function shouldOffloadSchema(json: string): boolean {
  return json.length >= SCHEMA_OFFLOAD_MIN_CHARS;
}
