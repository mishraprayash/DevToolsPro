// Pure helpers for workspace (tab) names. Never throw.

export const MAX_TAB_NAME_LENGTH = 40;

// Collapse whitespace and cap length; an empty result keeps the previous name.
export function normalizeTabName(input: string, fallback: string): string {
  const cleaned = input.replace(/\s+/g, ' ').trim().slice(0, MAX_TAB_NAME_LENGTH).trim();
  return cleaned || fallback;
}

// Next default name like "JSON 3" that isn't already taken, so closing a tab
// and opening a new one doesn't produce duplicate names.
export function nextTabName(prefix: string, existingNames: string[]): string {
  const taken = new Set(existingNames);
  let n = existingNames.length + 1;
  while (taken.has(`${prefix} ${n}`)) n++;
  return `${prefix} ${n}`;
}
