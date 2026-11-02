'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Star, History, Wand2, Zap } from 'lucide-react';
import { useAppStore } from '@/lib/store/useStore';
import { Modal } from '@/components/ui/Modal';
import { tools, toolsMap, searchTools, type ToolDef } from '@/tools/registry';
import { detectInput, type Detection } from '@/lib/utils/detectInput';
import { openDetection, ToolIcon } from '@/components/homepage/SmartPaste';
import { matchActions } from '@/lib/utils/paletteActions';
import { paletteActions, type PaletteAction, type PaletteActionContext } from '@/components/layout/paletteActionRunners';
import { cn } from '@/lib/utils';

/** Minimum top-detection confidence before a short query is treated as data. */
const DETECT_THRESHOLD = 0.7;
/** Queries at least this long (or multi-line) are treated as pasted data. */
const LONG_QUERY = 60;

type PaletteEntry =
  | { kind: 'detect'; id: string; detection: Detection }
  | { kind: 'action'; id: string; action: PaletteAction }
  | { kind: 'tool'; id: string; tool: ToolDef };

function getDetections(text: string): Detection[] {
  const trimmed = text.trim();
  if (trimmed.length < 3) return [];
  const all = detectInput(trimmed);
  if (all.length === 0) return [];
  const looksLikeData = trimmed.includes('\n') || trimmed.length >= LONG_QUERY;
  if (all[0].confidence >= DETECT_THRESHOLD) return all.filter((d) => d.confidence >= 0.45);
  return looksLikeData ? all : [];
}

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen, favorites, recentTools, addRecentTool, toggleTheme, setShortcutsOpen } = useAppStore();
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  // <input> flattens newlines on paste; keep the original text so YAML/CSV/etc. survive.
  const [pasted, setPasted] = React.useState<{ raw: string; flat: string } | null>(null);
  const dataText = pasted && pasted.flat === query ? pasted.raw : query;

  const filteredTools = React.useMemo(() => {
    if (!query) {
      const favTools = favorites.map(id => toolsMap.get(id)).filter(Boolean) as typeof tools;
      const recTools = recentTools.filter(id => !favorites.includes(id)).map(id => toolsMap.get(id)).filter(Boolean) as typeof tools;
      const rest = tools.filter(t => !favorites.includes(t.id) && !recentTools.includes(t.id));
      return [...favTools, ...recTools, ...rest];
    }
    return searchTools(query);
  }, [query, favorites, recentTools]);

  const detections = React.useMemo(() => getDetections(dataText), [dataText]);

  const matchedActions = React.useMemo(
    () => (detections.length > 0 ? [] : matchActions(paletteActions, query, query.trim() ? 5 : 4)),
    [detections.length, query],
  );

  // Section order: detected data first; quick actions lead on an empty query,
  // otherwise tool-name matches keep priority and actions follow them.
  const sections = React.useMemo(() => {
    const detect: PaletteEntry[] = detections.map((d) => ({ kind: 'detect', id: `cmd-opt-detect-${d.toolId}`, detection: d }));
    const actions: PaletteEntry[] = matchedActions.map((a) => ({ kind: 'action', id: `cmd-opt-action-${a.id}`, action: a }));
    const toolEntries: PaletteEntry[] = filteredTools.map((t) => ({ kind: 'tool', id: `cmd-opt-${t.id}`, tool: t }));
    const actionSection = { key: 'actions', entries: actions };
    const toolSection = { key: 'tools', entries: toolEntries };
    return [
      { key: 'detect', entries: detect },
      ...(query.trim() ? [toolSection, actionSection] : [actionSection, toolSection]),
    ].filter((sec) => sec.entries.length > 0);
  }, [detections, matchedActions, filteredTools, query]);

  const entries = React.useMemo(() => sections.flatMap((sec) => sec.entries), [sections]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query, commandPaletteOpen]);

  const close = () => {
    setCommandPaletteOpen(false);
    setQuery('');
    setPasted(null);
  };

  const handleSelect = (toolId: string) => {
    addRecentTool(toolId);
    router.push(`/tools/${toolId}`);
    close();
  };

  const actionContext: PaletteActionContext = {
    navigate: (href) => router.push(href),
    toggleTheme,
    openShortcuts: () => setShortcutsOpen(true),
  };

  const runAction = async (action: PaletteAction) => {
    // Shortcuts open their own modal; close ours first so they don't stack.
    if (action.id === 'open-shortcuts') close();
    try {
      await action.run(actionContext);
    } finally {
      close();
    }
  };

  const handleSelectEntry = (entry: PaletteEntry) => {
    if (entry.kind === 'tool') {
      handleSelect(entry.tool.id);
    } else if (entry.kind === 'action') {
      void runAction(entry.action);
    } else {
      openDetection(entry.detection, router, addRecentTool);
      close();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const raw = e.clipboardData.getData('text/plain');
    if (!raw || !/[\r\n]/.test(raw)) {
      setPasted(null);
      return;
    }
    e.preventDefault();
    const flat = raw.replace(/\r\n?|\n/g, ' ');
    setPasted({ raw, flat });
    setQuery(flat);
  };

  const listRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (entries.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => (i + 1) % entries.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => (i - 1 + entries.length) % entries.length); }
    else if (e.key === 'Enter' && entries[selectedIndex]) { e.preventDefault(); handleSelectEntry(entries[selectedIndex]); }
  };

  React.useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const rowClass = (index: number) => cn(
    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
    index === selectedIndex ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary'
  );

  const renderEntry = (entry: PaletteEntry, index: number) => {
    const common = {
      id: entry.id,
      'data-index': index,
      role: 'option',
      'aria-selected': index === selectedIndex,
      onClick: () => handleSelectEntry(entry),
      onMouseMove: () => { if (index !== selectedIndex) setSelectedIndex(index); },
      className: rowClass(index),
    } as const;

    if (entry.kind === 'detect') {
      const d = entry.detection;
      const tool = toolsMap.get(d.toolId);
      return (
        <button key={entry.id} type="button" {...common}>
          <ToolIcon toolId={d.toolId} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{tool?.name ?? d.toolId}</p>
            <p className="text-xs text-text-muted truncate">{d.reason}</p>
          </div>
          <span className="text-[10px] font-semibold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full shrink-0">{d.label}</span>
        </button>
      );
    }

    if (entry.kind === 'action') {
      const a = entry.action;
      const Icon = a.icon;
      return (
        <button key={entry.id} type="button" {...common}>
          <div className={cn('p-2 rounded-lg bg-gradient-to-br', a.color)}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{a.label}</p>
            <p className="text-xs text-text-muted truncate">{a.description}</p>
          </div>
          <span className="text-[10px] text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full">Action</span>
        </button>
      );
    }

    const tool = entry.tool;
    const Icon = tool.icon;
    const isFav = !query && favorites.includes(tool.id);
    const isRecent = !query && !isFav && recentTools.includes(tool.id);
    return (
      <button key={entry.id} type="button" {...common}>
        <div className={cn('p-2 rounded-lg bg-gradient-to-br', tool.color)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{tool.name}</p>
            {isFav && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
            {isRecent && <History className="h-3 w-3 text-blue-500 shrink-0" />}
          </div>
          <p className="text-xs text-text-muted truncate">{tool.description}</p>
        </div>
        <span className="text-[10px] text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-full">{tool.category}</span>
      </button>
    );
  };

  return (
    <Modal open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)}>
      <div className="relative border-b border-border/80 pb-3" onKeyDown={handleKeyDown}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted pointer-events-none" />
        <input
          type="text"
          role="combobox"
          aria-expanded={entries.length > 0}
          aria-controls="command-palette-listbox"
          aria-activedescendant={entries[selectedIndex]?.id}
          aria-label="Search tools, actions, or paste data"
          placeholder={`Search ${tools.length} tools, run an action, or paste data…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onPaste={handlePaste}
          className="w-full h-12 pl-11 pr-10 bg-transparent text-text-primary placeholder:text-text-muted text-base font-medium border-0 outline-none focus:outline-none focus:ring-0 focus:border-0 focus-visible:outline-none focus-visible:ring-0 shadow-none"
          autoFocus
        />
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(false)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors cursor-pointer"
          aria-label="Close command palette"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={listRef} id="command-palette-listbox" role="listbox" aria-label="Results" className="mt-4 max-h-80 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="wait">
          {entries.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center text-text-muted">No tools or actions found</motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0.5">
              {sections.map((section, sectionIndex) => {
                const offset = sections.slice(0, sectionIndex).reduce((n, sec) => n + sec.entries.length, 0);
                const isLast = sectionIndex === sections.length - 1;
                const heading = section.key === 'detect'
                  ? { icon: Wand2, text: 'Detected: open in…' }
                  : section.key === 'actions'
                    ? { icon: Zap, text: 'Quick actions' }
                    : sections.length > 1 ? { icon: Search, text: 'Tools' } : null;
                const HeadingIcon = heading?.icon;
                return (
                  <div
                    key={section.key}
                    role="group"
                    aria-labelledby={heading ? `cmd-group-${section.key}` : undefined}
                    className={cn(!isLast && 'pb-2 mb-2 border-b border-border/60')}
                  >
                    {heading && HeadingIcon && (
                      <p id={`cmd-group-${section.key}`} className="px-3 pb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        <HeadingIcon className="h-3 w-3 text-accent" aria-hidden />
                        {heading.text}
                      </p>
                    )}
                    {section.entries.map((entry, i) => renderEntry(entry, offset + i))}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px]">↑↓</kbd> navigate</span>
        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px]">↵</kbd> select</span>
        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-[10px]">esc</kbd> close</span>
      </div>
    </Modal>
  );
}
