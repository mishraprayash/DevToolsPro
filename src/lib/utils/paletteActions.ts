// Command palette quick actions: static definitions + pure query matching.
// The runnable side (icons, clipboard, router) lives in
// src/components/layout/paletteActionRunners.ts.

export type PaletteActionId =
  | 'copy-uuid'
  | 'copy-password'
  | 'copy-timestamp'
  | 'decode-base64-clipboard'
  | 'format-json-clipboard'
  | 'encode-base64-clipboard'
  | 'hash-clipboard'
  | 'toggle-theme'
  | 'open-shortcuts';

export interface PaletteActionDef {
  id: PaletteActionId;
  label: string;
  description: string;
  keywords: string[];
  /** Shown when the palette query is empty. */
  featured?: boolean;
}

export const PALETTE_ACTIONS: PaletteActionDef[] = [
  { id: 'copy-uuid', label: 'Generate UUID v4', description: 'Copy a fresh random UUID to the clipboard', keywords: ['uuid', 'guid', 'v4', 'random', 'id', 'copy', 'new'], featured: true },
  { id: 'copy-password', label: 'Generate strong password', description: 'Copy a 20-character random password', keywords: ['password', 'secret', 'random', 'strong', 'pass', 'copy', 'generate'], featured: true },
  { id: 'copy-timestamp', label: 'Copy current Unix timestamp', description: 'Seconds since epoch, right now', keywords: ['timestamp', 'unix', 'epoch', 'now', 'time', 'date', 'seconds', 'copy'], featured: true },
  { id: 'format-json-clipboard', label: 'Format JSON from clipboard', description: 'Open the JSON Beautifier with your clipboard', keywords: ['json', 'beautify', 'pretty', 'format', 'clipboard', 'paste'], featured: true },
  { id: 'decode-base64-clipboard', label: 'Decode Base64 from clipboard', description: 'Open the encoder in Base64 decode mode', keywords: ['base64', 'b64', 'decode', 'clipboard', 'paste'] },
  { id: 'encode-base64-clipboard', label: 'Encode clipboard to Base64', description: 'Open the encoder in Base64 encode mode', keywords: ['base64', 'b64', 'encode', 'clipboard', 'paste'] },
  { id: 'hash-clipboard', label: 'Hash clipboard (SHA-256)', description: 'Open the Hash Generator with your clipboard', keywords: ['hash', 'sha256', 'sha-256', 'digest', 'checksum', 'clipboard'] },
  { id: 'toggle-theme', label: 'Toggle theme', description: 'Switch between light and dark mode', keywords: ['theme', 'dark', 'light', 'mode', 'appearance', 'color scheme'] },
  { id: 'open-shortcuts', label: 'Show keyboard shortcuts', description: 'Open the shortcuts reference', keywords: ['keyboard', 'shortcuts', 'keys', 'hotkeys', 'help', 'keybindings'] },
];

export interface MatchableAction {
  label: string;
  keywords: string[];
  featured?: boolean;
}

/** Score one query token against an action; 0 = no match. */
function scoreToken(token: string, label: string, labelWords: string[], keywords: string[]): number {
  let best = 0;
  if (label.startsWith(token)) best = Math.max(best, 100);
  if (labelWords.some((w) => w === token)) best = Math.max(best, 90);
  if (labelWords.some((w) => w.startsWith(token))) best = Math.max(best, 80);
  if (keywords.some((k) => k === token)) best = Math.max(best, 70);
  if (label.includes(token)) best = Math.max(best, 60);
  if (keywords.some((k) => k.startsWith(token))) best = Math.max(best, 50);
  if (token.length >= 3 && keywords.some((k) => k.includes(token))) best = Math.max(best, 30);
  return best;
}

/**
 * Filter and rank actions for a palette query. Every whitespace-separated
 * token must match the label or a keyword. Empty query → featured actions
 * in definition order. Stable for equal scores. Never throws.
 */
export function matchActions<T extends MatchableAction>(actions: readonly T[], query: string, limit = 5): T[] {
  try {
    const q = (query ?? '').toLowerCase().trim();
    if (!q) return actions.filter((a) => a.featured).slice(0, limit);
    // Long or multi-line queries are pasted data, not action searches.
    if (q.length > 40 || q.includes('\n')) return [];
    const tokens = q.split(/\s+/).filter(Boolean);
    const scored: { action: T; score: number; index: number }[] = [];
    actions.forEach((action, index) => {
      const label = action.label.toLowerCase();
      const labelWords = label.split(/[^a-z0-9-]+/).filter(Boolean);
      const keywords = action.keywords.map((k) => k.toLowerCase());
      let total = 0;
      for (const token of tokens) {
        const s = scoreToken(token, label, labelWords, keywords);
        if (s === 0) return;
        total += s;
      }
      scored.push({ action, score: total, index });
    });
    scored.sort((a, b) => b.score - a.score || a.index - b.index);
    return scored.slice(0, limit).map((s) => s.action);
  } catch {
    return [];
  }
}
