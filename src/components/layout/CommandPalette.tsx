'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Star, History } from 'lucide-react';
import { useAppStore } from '@/lib/store/useStore';
import { Modal } from '@/components/ui/Modal';
import { tools } from '@/tools/registry';
import { cn } from '@/lib/utils';

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen, favorites, recentTools, addRecentTool } = useAppStore();
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const filteredTools = React.useMemo(() => {
    if (!query) {
      const favTools = favorites.map(id => tools.find(t => t.id === id)).filter(Boolean) as typeof tools;
      const recTools = recentTools.filter(id => !favorites.includes(id)).map(id => tools.find(t => t.id === id)).filter(Boolean) as typeof tools;
      const rest = tools.filter(t => !favorites.includes(t.id) && !recentTools.includes(t.id));
      return [...favTools, ...recTools, ...rest];
    }
    const lower = query.toLowerCase();
    return tools.filter(
      (t) => t.name.toLowerCase().includes(lower) || t.description.toLowerCase().includes(lower) || t.category.toLowerCase().includes(lower)
    );
  }, [query, favorites, recentTools]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query, commandPaletteOpen]);

  const handleSelect = (toolId: string) => {
    addRecentTool(toolId);
    router.push(`/tools/${toolId}`);
    setCommandPaletteOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => (i + 1) % filteredTools.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => (i - 1 + filteredTools.length) % filteredTools.length); }
    else if (e.key === 'Enter' && filteredTools[selectedIndex]) { handleSelect(filteredTools[selectedIndex].id); }
  };

  return (
    <Modal open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)}>
      <div className="relative" onKeyDown={handleKeyDown}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
        <input type="text" placeholder={`Search ${tools.length} tools...`} value={query} onChange={(e) => setQuery(e.target.value)}
          className="w-full h-14 pl-12 pr-10 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none text-lg" autoFocus />
        <button onClick={() => setCommandPaletteOpen(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 max-h-80 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="wait">
          {filteredTools.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center text-text-muted">No tools found</motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0.5">
              {filteredTools.map((tool, index) => {
                const Icon = tool.icon;
                const isFav = !query && favorites.includes(tool.id);
                const isRecent = !query && !isFav && recentTools.includes(tool.id);

                return (
                  <button key={tool.id} onClick={() => handleSelect(tool.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      index === selectedIndex ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary'
                    }`}>
                    <div className={cn("p-2 rounded-lg bg-gradient-to-br", tool.color)}>
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


