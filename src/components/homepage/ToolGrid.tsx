'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ArrowRight, Command, Star, LayoutGrid, List as ListIcon,
  History, Sparkles, X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/useStore';
import { toast } from '@/components/ui/Toast';
import { tools, categories, type ToolDef } from '@/tools/registry';

const categoryPills = ['All', 'New', ...categories] as const;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

interface ToolItemProps { tool: ToolDef; viewMode: 'grid' | 'list' }

const ToolItem = React.memo(function ToolItem({ tool, viewMode }: ToolItemProps) {
  const Icon = tool.icon;
  const { favorites, toggleFavorite, addRecentTool } = useAppStore();
  const isFavorite = React.useMemo(() => favorites.includes(tool.id), [favorites, tool.id]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(tool.id);
    toast({
      type: 'success',
      message: isFavorite
        ? `${tool.name} removed from favorites.`
        : `${tool.name} added to favorites!`,
    });
  };

  if (viewMode === 'list') {
    return (
      <motion.div variants={cardVariant}>
        <Link href={`/tools/${tool.id}`} onClick={() => addRecentTool(tool.id)} className="block">
          <Card hover className="p-3 group cursor-pointer flex items-center gap-4 transition-all hover:bg-bg-hover">
            <div className={cn('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105', tool.color)}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold font-outfit text-sm text-text-primary group-hover:text-accent transition-colors duration-150 truncate">
                  {tool.name}
                </h3>
                <span className="text-[10px] text-text-muted bg-bg-tertiary border border-border px-2 py-0.5 rounded-full whitespace-nowrap hidden sm:inline-block">
                  {tool.category}
                </span>
                {tool.isNew && (
                  <span className="text-[9px] font-bold text-white bg-accent px-1.5 py-0.5 rounded-full whitespace-nowrap">NEW</span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-text-secondary truncate">{tool.description}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleFavoriteClick}
                className={cn(
                  "p-1.5 rounded-lg border border-transparent bg-transparent cursor-pointer",
                  "hover:border-border hover:bg-bg-tertiary transition-all duration-150 active:scale-95",
                  isFavorite && "text-accent"
                )}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star className={cn("h-4 w-4 stroke-1.5 transition-all duration-150", isFavorite ? "fill-accent stroke-accent scale-110" : "text-text-secondary hover:text-text-primary")} />
              </button>
              <div className="text-[11px] text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex items-center gap-1 w-20 justify-end">
                Open <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </Card>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div variants={cardVariant} className="h-full">
      <Link href={`/tools/${tool.id}`} onClick={() => addRecentTool(tool.id)} className="block h-full">
        <Card hover className="h-full p-5 group cursor-pointer flex flex-col relative overflow-hidden card-highlight">
          <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br opacity-0 group-hover:opacity-[0.06] transition-opacity duration-300 blur-xl pointer-events-none", tool.color)} />
          <div className="flex items-start justify-between gap-2">
            <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3 shadow-md', tool.color)}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleFavoriteClick}
                className={cn(
                  "p-1.5 rounded-lg border border-transparent bg-transparent cursor-pointer",
                  "hover:border-border hover:bg-bg-hover transition-all duration-150 active:scale-95 shrink-0",
                  isFavorite && "border-border bg-bg-hover"
                )}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star className={cn("h-4 w-4 stroke-1.5 transition-all duration-150", isFavorite ? "fill-accent stroke-accent scale-110" : "text-text-secondary hover:text-text-primary")} />
              </button>
              <span className="text-[10px] text-text-muted bg-bg-hover border border-border px-2 py-0.5 rounded-full whitespace-nowrap leading-relaxed">
                {tool.category}
              </span>
              {tool.isNew && (
                <span className="text-[9px] font-bold text-white bg-accent px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">NEW</span>
              )}
            </div>
          </div>
          <div className="mt-3 flex-1">
            <h3 className="font-semibold font-outfit text-sm text-text-primary group-hover:text-accent transition-colors duration-150 leading-snug">
              {tool.name}
            </h3>
            <p className="mt-1 text-xs text-text-secondary leading-relaxed">{tool.description}</p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Open tool <ArrowRight className="h-3 w-3" />
          </div>
        </Card>
      </Link>
    </motion.div>
  );
});

export function ToolGrid() {
  const [query, setQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<string>('All');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const { setCommandPaletteOpen, favorites, recentTools } = useAppStore();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem('devtools-viewmode');
    if (saved === 'list' || saved === 'grid') setViewMode(saved);
  }, []);

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('devtools-viewmode', mode);
  };

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    return tools.filter((t) => {
      const matchesCat = activeCategory === 'All'
        ? true
        : activeCategory === 'New'
          ? t.isNew
          : t.category === activeCategory;
      const matchesQ = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [query, activeCategory]);

  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { All: tools.length, New: tools.filter(t => t.isNew).length };
    for (const t of tools) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    return counts;
  }, []);

  const favoriteTools = React.useMemo(() => tools.filter((t) => favorites.includes(t.id)), [favorites]);
  const recentToolsData = React.useMemo(() => recentTools.map(id => tools.find(t => t.id === id)).filter(Boolean) as ToolDef[], [recentTools]);

  const renderToolGroup = (title: string, groupTools: ToolDef[], icon?: React.ReactNode) => {
    if (groupTools.length === 0) return null;
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h2 className="text-sm font-bold font-outfit text-text-primary uppercase tracking-wider">{title}</h2>
          <span className="ml-auto text-[10px] text-text-muted font-mono bg-bg-hover px-2 py-0.5 rounded-md border border-border">
            {groupTools.length}
          </span>
        </div>
        <div className={viewMode === 'grid'
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "flex flex-col gap-2"}>
          {groupTools.map((tool) => (
            <ToolItem key={`${title}-${tool.id}`} tool={tool} viewMode={viewMode} />
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <section className="min-h-[50vh]">
      <div className="border-y border-border bg-bg-primary/95 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
              <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools by name, category, or description…"
                className="w-full h-9 pl-9 pr-10 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-200" />
              {!query && (
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-text-muted bg-bg-hover border border-border rounded">/</kbd>
              )}
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors text-xs" aria-label="Clear search">✕</button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-bg-tertiary border border-border rounded-lg p-0.5 h-9">
                <button
                  onClick={() => handleSetViewMode('grid')}
                  className={cn("p-1.5 rounded-md transition-colors", viewMode === 'grid' ? "bg-bg-elevated shadow-sm text-text-primary" : "text-text-muted hover:text-text-primary")}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleSetViewMode('list')}
                  className={cn("p-1.5 rounded-md transition-colors", viewMode === 'list' ? "bg-bg-elevated shadow-sm text-text-primary" : "text-text-muted hover:text-text-primary")}
                  aria-label="List view"
                >
                  <ListIcon className="h-4 w-4" />
                </button>
              </div>

              <button onClick={() => setCommandPaletteOpen(true)}
                className="hidden lg:flex items-center gap-1.5 px-3 h-9 shrink-0 rounded-lg border border-border bg-bg-tertiary text-xs text-text-muted hover:text-text-primary hover:border-border-hover transition-all duration-200">
                <Command className="h-3 w-3" /><span>K</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide">
            {categoryPills.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150',
                  activeCategory === cat
                    ? 'bg-accent text-bg-primary shadow-sm'
                    : 'bg-bg-tertiary text-text-secondary border border-border hover:border-border-hover hover:text-text-primary'
                )}>
                {cat}
                <span className={cn('text-[10px] px-1.5 py-0 rounded-full leading-5',
                  activeCategory === cat ? 'bg-white/25 text-bg-primary' : 'bg-bg-hover text-text-muted')}>
                  {categoryCounts[cat] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center">
              <Search className="h-8 w-8 text-text-muted mb-3" />
              <p className="text-text-secondary text-sm">No tools match &ldquo;{query}&rdquo;</p>
              <button onClick={() => { setQuery(''); setActiveCategory('All'); }} className="mt-3 text-sm text-accent hover:underline">Clear filters</button>
            </motion.div>
          ) : (
            <motion.div key={activeCategory + query + viewMode} className="w-full">
              {activeCategory === 'All' && !query ? (
                <div className="space-y-6">
                  {recentToolsData.length > 0 && renderToolGroup("Jump Back In", recentToolsData.slice(0, 4), <History className="h-4.5 w-4.5 text-blue-500" />)}
                  {favoriteTools.length > 0 && renderToolGroup("Favorites", favoriteTools, <Star className="h-4.5 w-4.5 text-amber-500 fill-amber-500" />)}
                  {renderToolGroup("Recently Added", tools.filter(t => t.isNew).slice(0, 8), <Sparkles className="h-4.5 w-4.5 text-fuchsia-500" />)}
                  {categories.map(cat => {
                    const catTools = tools.filter(t => t.category === cat);
                    return <React.Fragment key={cat}>{renderToolGroup(cat, catTools)}</React.Fragment>;
                  })}
                </div>
              ) : (
                <motion.div variants={container} initial="hidden" animate="show"
                  className={viewMode === 'grid'
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    : "flex flex-col gap-2"}>
                  {filtered.map((tool) => <ToolItem key={tool.id} tool={tool} viewMode={viewMode} />)}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {filtered.length > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-12 text-center text-xs text-text-muted">
            Press <kbd className="px-1.5 py-0.5 bg-bg-tertiary border border-border rounded text-[10px]">⌘K</kbd> to jump to any tool instantly
          </motion.p>
        )}
      </div>
    </section>
  );
}
