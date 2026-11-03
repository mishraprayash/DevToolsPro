// Pure key-matching for the per-tool keyboard shortcuts (see useToolShortcuts). Never throws.
//
// Bindings were picked to avoid browser / OS essentials:
//   run       ⌘↵  / Ctrl+Enter         — not bound by browsers inside a page
//   copy      ⌘⇧↵ / Ctrl+Shift+Enter   — ⌘⇧C / Ctrl+Shift+C opens the DevTools inspector
//   download  ⌘S  / Ctrl+S             — "Save page" is overridable with preventDefault
//   clear     ⌘⌥⌫ / Ctrl+Alt+Backspace — ⌥⌫ / Ctrl+⌫ delete a word; ⌘⇧⌫ opens "Clear browsing data"
//   new tab   ⌥T  / Alt+T              — ⌘T / Ctrl+T can't be intercepted by pages

export type ToolShortcutAction = 'run' | 'copy' | 'download' | 'clear' | 'newTab';

export type ShortcutPlatform = 'mac' | 'other';

/** The subset of KeyboardEvent the matcher reads (so it can be unit-tested without a DOM). */
export interface ShortcutKeyEvent {
  key: string;
  code?: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

interface Binding {
  action: ToolShortcutAction;
  /** ⌘ on macOS, Ctrl elsewhere. */
  mod: boolean;
  shift: boolean;
  alt: boolean;
  /** Matches KeyboardEvent.key (case-insensitive) or KeyboardEvent.code. */
  keys: string[];
  codes: string[];
}

const BINDINGS: Binding[] = [
  { action: 'run', mod: true, shift: false, alt: false, keys: ['enter'], codes: ['Enter', 'NumpadEnter'] },
  { action: 'copy', mod: true, shift: true, alt: false, keys: ['enter'], codes: ['Enter', 'NumpadEnter'] },
  { action: 'download', mod: true, shift: false, alt: false, keys: ['s'], codes: ['KeyS'] },
  { action: 'clear', mod: true, shift: false, alt: true, keys: ['backspace'], codes: ['Backspace'] },
  // ⌥T types "†" on macOS, so e.key is unreliable here — the physical code is what matters
  { action: 'newTab', mod: false, shift: false, alt: true, keys: ['t'], codes: ['KeyT'] },
];

export const TOOL_SHORTCUT_ACTIONS: ToolShortcutAction[] = BINDINGS.map((b) => b.action);

/** Best-effort platform sniff; 'other' when unknown (e.g. on the server). */
interface NavigatorLike {
  platform?: string;
  userAgent?: string;
  userAgentData?: { platform?: string };
}

export function detectPlatform(nav?: NavigatorLike): ShortcutPlatform {
  try {
    const n: NavigatorLike | undefined = nav ?? (typeof navigator !== 'undefined' ? (navigator as NavigatorLike) : undefined);
    if (!n) return 'other';
    const p = n.userAgentData?.platform || n.platform || n.userAgent || '';
    return /mac|iphone|ipad|ipod/i.test(p) ? 'mac' : 'other';
  } catch {
    return 'other';
  }
}

/** Returns the tool action an event triggers on the given platform, or null. */
export function matchShortcut(e: ShortcutKeyEvent, platform: ShortcutPlatform): ToolShortcutAction | null {
  if (!e || typeof e.key !== 'string') return null;
  const mod = platform === 'mac' ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
  const noMod = !e.metaKey && !e.ctrlKey;
  const key = e.key.toLowerCase();

  for (const b of BINDINGS) {
    if (b.mod ? !mod : !noMod) continue;
    if (b.shift !== e.shiftKey || b.alt !== e.altKey) continue;
    if (b.keys.includes(key) || (e.code !== undefined && b.codes.includes(e.code))) return b.action;
  }
  return null;
}

const LABELS: Record<ToolShortcutAction, { mac: string; other: string }> = {
  run: { mac: '⌘↵', other: 'Ctrl+Enter' },
  copy: { mac: '⌘⇧↵', other: 'Ctrl+Shift+Enter' },
  download: { mac: '⌘S', other: 'Ctrl+S' },
  clear: { mac: '⌘⌥⌫', other: 'Ctrl+Alt+Backspace' },
  newTab: { mac: '⌥T', other: 'Alt+T' },
};

/** Human-readable key combo, e.g. "⌘⇧↵" on macOS or "Ctrl+Shift+Enter" elsewhere. */
export function formatShortcut(action: ToolShortcutAction, platform: ShortcutPlatform): string {
  const label = LABELS[action];
  if (!label) return '';
  return platform === 'mac' ? label.mac : label.other;
}

/** Appends the shortcut to a tooltip: "Copy output (⌘⇧↵)". */
export function withShortcut(title: string, action: ToolShortcutAction, platform: ShortcutPlatform): string {
  const combo = formatShortcut(action, platform);
  return combo ? `${title} (${combo})` : title;
}
