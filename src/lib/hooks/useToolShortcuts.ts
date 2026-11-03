'use client';

import * as React from 'react';
import {
  detectPlatform,
  matchShortcut,
  withShortcut,
  type ShortcutPlatform,
  type ToolShortcutAction,
} from '@/lib/utils/toolShortcuts';

export interface ToolShortcutHandlers {
  /** ⌘↵ / Ctrl+Enter — run / process / generate. */
  onRun?: () => void;
  /** ⌘⇧↵ / Ctrl+Shift+Enter — copy the main output. */
  onCopy?: () => void;
  /** ⌘S / Ctrl+S — download the output. */
  onDownload?: () => void;
  /** ⌘⌥⌫ / Ctrl+Alt+Backspace — clear the input. */
  onClear?: () => void;
  /** ⌥T / Alt+T — open a new workspace tab. */
  onNewTab?: () => void;
}

const HANDLER_FOR: Record<ToolShortcutAction, keyof ToolShortcutHandlers> = {
  run: 'onRun',
  copy: 'onCopy',
  download: 'onDownload',
  clear: 'onClear',
  newTab: 'onNewTab',
};

/** Elements marked with this attribute (in-page fullscreen overlays) don't block shortcuts. */
export const FULLSCREEN_OVERLAY_ATTR = 'data-fullscreen-overlay';

function hasForeignModal(): boolean {
  return Array.from(document.querySelectorAll('[aria-modal="true"]')).some(
    (el) => !el.hasAttribute(FULLSCREEN_OVERLAY_ATTR)
  );
}

/**
 * Consistent per-tool keyboard shortcuts. Only actions with a handler are bound, so
 * e.g. ⌘S keeps the browser's "Save page" on tools without a download.
 *
 * Shortcuts work while typing in the tool's own inputs (that's the point of ⌘↵), but
 * are ignored for repeats, IME composition, events another handler already consumed,
 * and while a dialog other than the fullscreen editor overlay is open.
 */
export function useToolShortcuts(handlers: ToolShortcutHandlers) {
  const handlersRef = React.useRef(handlers);

  React.useEffect(() => {
    handlersRef.current = handlers;
  });

  React.useEffect(() => {
    const platform: ShortcutPlatform = detectPlatform();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.isComposing || e.defaultPrevented) return;
      const action = matchShortcut(e, platform);
      if (!action) return;
      const handler = handlersRef.current[HANDLER_FOR[action]];
      if (!handler) return;
      if (hasForeignModal()) return;

      e.preventDefault();
      handler();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

const subscribeNoop = () => () => {};

/**
 * The visitor's platform for rendering shortcut hints. Returns 'other' during SSR and
 * hydration, then the real platform, so server and client markup always match.
 */
export function useShortcutPlatform(): ShortcutPlatform {
  return React.useSyncExternalStore(subscribeNoop, () => detectPlatform(), () => 'other');
}

/**
 * Tooltip helper for buttons that have a tool shortcut:
 * `const hint = useShortcutHint(); <Button title={hint('Download', 'download')}>`.
 */
export function useShortcutHint(): (title: string, action: ToolShortcutAction) => string {
  const platform = useShortcutPlatform();
  return React.useCallback((title: string, action: ToolShortcutAction) => withShortcut(title, action, platform), [platform]);
}
