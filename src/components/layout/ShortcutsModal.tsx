'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store/useStore';
import { Keyboard, Command, SunMoon, Search, CornerDownLeft, Sparkles, X } from 'lucide-react';

export function ShortcutsModal() {
  const { shortcutsOpen, setShortcutsOpen, toggleTheme } = useAppStore();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input or textarea or monaco editor
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.getAttribute('contenteditable') === 'true' ||
        activeEl?.classList.contains('input');

      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShortcutsOpen(!shortcutsOpen);
      } else if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShortcutsOpen(!shortcutsOpen);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutsOpen, setShortcutsOpen, toggleTheme]);

  const shortcutGroups = [
    {
      title: 'Global Navigation & Actions',
      shortcuts: [
        { key: '⌘ K / Ctrl K', desc: 'Open Command Palette & search tools', icon: Command },
        { key: '⌘ J / Ctrl J', desc: 'Toggle Dark / Light theme instantly', icon: SunMoon },
        { key: '⌘ / or ?', desc: 'Show this keyboard shortcuts cheat sheet', icon: Keyboard },
        { key: '/', desc: 'Focus home search bar (when not typing)', icon: Search },
        { key: 'Esc', desc: 'Close open modal, palette, or drawer', icon: X },
      ],
    },
    {
      title: 'Command Palette Hotkeys',
      shortcuts: [
        { key: '↑ / ↓', desc: 'Navigate up and down the tool list', icon: CornerDownLeft },
        { key: 'Enter ↵', desc: 'Launch the selected tool immediately', icon: Sparkles },
        { key: 'Esc', desc: 'Dismiss command palette', icon: X },
      ],
    },
  ];

  return (
    <Modal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} title="Keyboard Shortcuts">
      <div className="space-y-6 pt-1">
        {shortcutGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h4 className="text-xs font-bold font-outfit uppercase tracking-wider text-text-muted">
              {group.title}
            </h4>
            <div className="rounded-xl border border-border/80 bg-bg-tertiary/60 divide-y divide-border/60 overflow-hidden">
              {group.shortcuts.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between px-3.5 py-2.5 text-xs text-text-secondary hover:bg-bg-hover/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>{item.desc}</span>
                  </div>
                  <kbd className="px-2 py-1 rounded bg-bg-primary border border-border text-[11px] font-mono text-text-primary shadow-xs">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
          <span>Tip: Press <kbd className="px-1 py-0.5 rounded bg-bg-tertiary border border-border font-mono">?</kbd> anywhere to open</span>
          <button
            onClick={() => setShortcutsOpen(false)}
            className="px-3 py-1.5 rounded-lg bg-bg-tertiary text-xs font-semibold text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </Modal>
  );
}
