import { describe, it, expect } from 'vitest';
import { matchShortcut, formatShortcut, withShortcut, detectPlatform, type ShortcutKeyEvent } from '../toolShortcuts';

const ev = (key: string, mods: Partial<ShortcutKeyEvent> = {}, code?: string): ShortcutKeyEvent => ({
  key,
  code,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...mods,
});

describe('toolShortcuts', () => {
  describe('matchShortcut', () => {
    it('maps ⌘↵ on mac and Ctrl+Enter elsewhere to run', () => {
      expect(matchShortcut(ev('Enter', { metaKey: true }), 'mac')).toBe('run');
      expect(matchShortcut(ev('Enter', { ctrlKey: true }), 'other')).toBe('run');
    });

    it('does not accept the other platform modifier', () => {
      expect(matchShortcut(ev('Enter', { ctrlKey: true }), 'mac')).toBeNull();
      expect(matchShortcut(ev('Enter', { metaKey: true }), 'other')).toBeNull();
      expect(matchShortcut(ev('Enter', { metaKey: true, ctrlKey: true }), 'mac')).toBeNull();
    });

    it('maps mod+shift+enter to copy, not run', () => {
      expect(matchShortcut(ev('Enter', { metaKey: true, shiftKey: true }), 'mac')).toBe('copy');
      expect(matchShortcut(ev('Enter', { ctrlKey: true, shiftKey: true }), 'other')).toBe('copy');
    });

    it('accepts numpad enter by code', () => {
      expect(matchShortcut(ev('Enter', { ctrlKey: true }, 'NumpadEnter'), 'other')).toBe('run');
    });

    it('maps mod+s to download (case-insensitive) but not mod+shift+s', () => {
      expect(matchShortcut(ev('s', { metaKey: true }, 'KeyS'), 'mac')).toBe('download');
      expect(matchShortcut(ev('S', { ctrlKey: true }), 'other')).toBe('download');
      expect(matchShortcut(ev('S', { ctrlKey: true, shiftKey: true }, 'KeyS'), 'other')).toBeNull();
    });

    it('maps mod+alt+backspace to clear but leaves word-delete alone', () => {
      expect(matchShortcut(ev('Backspace', { metaKey: true, altKey: true }), 'mac')).toBe('clear');
      expect(matchShortcut(ev('Backspace', { ctrlKey: true, altKey: true }), 'other')).toBe('clear');
      expect(matchShortcut(ev('Backspace', { altKey: true }), 'mac')).toBeNull();
      expect(matchShortcut(ev('Backspace', { ctrlKey: true }), 'other')).toBeNull();
    });

    it('maps alt+t to new tab, using the physical key on mac (⌥T types †)', () => {
      expect(matchShortcut(ev('†', { altKey: true }, 'KeyT'), 'mac')).toBe('newTab');
      expect(matchShortcut(ev('t', { altKey: true }, 'KeyT'), 'other')).toBe('newTab');
      expect(matchShortcut(ev('t', { ctrlKey: true }, 'KeyT'), 'other')).toBeNull();
      expect(matchShortcut(ev('t', { altKey: true, ctrlKey: true }, 'KeyT'), 'other')).toBeNull();
    });

    it('ignores plain typing and unrelated combos', () => {
      expect(matchShortcut(ev('Enter'), 'mac')).toBeNull();
      expect(matchShortcut(ev('c', { metaKey: true, shiftKey: true }, 'KeyC'), 'mac')).toBeNull();
      expect(matchShortcut(ev('a'), 'other')).toBeNull();
    });

    it('never throws on junk input', () => {
      expect(matchShortcut(undefined as unknown as ShortcutKeyEvent, 'mac')).toBeNull();
      expect(matchShortcut({} as ShortcutKeyEvent, 'other')).toBeNull();
    });
  });

  describe('formatShortcut', () => {
    it('renders mac symbols and spelled-out keys elsewhere', () => {
      expect(formatShortcut('copy', 'mac')).toBe('⌘⇧↵');
      expect(formatShortcut('copy', 'other')).toBe('Ctrl+Shift+Enter');
      expect(formatShortcut('newTab', 'mac')).toBe('⌥T');
      expect(formatShortcut('download', 'other')).toBe('Ctrl+S');
    });

    it('appends the combo to a tooltip', () => {
      expect(withShortcut('Copy output', 'copy', 'mac')).toBe('Copy output (⌘⇧↵)');
    });
  });

  describe('detectPlatform', () => {
    it('detects mac-like platforms', () => {
      expect(detectPlatform({ platform: 'MacIntel' })).toBe('mac');
      expect(detectPlatform({ userAgentData: { platform: 'macOS' } })).toBe('mac');
      expect(detectPlatform({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' })).toBe('mac');
    });

    it('defaults to other', () => {
      expect(detectPlatform({ platform: 'Win32' })).toBe('other');
      expect(detectPlatform({})).toBe('other');
    });
  });
});
