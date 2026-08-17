'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowRight,
  Command,
  Star,
  LayoutGrid,
  List as ListIcon,
  History,
  Sparkles,
  Eye,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/useStore';
import { toast } from '@/components/ui/Toast';
import { tools, categories, toolMatchesQuery, type ToolDef } from '@/tools/registry';

const categoryPills = ['All', 'Favorites', 'New', ...categories] as const;

type SortOption = 'default' | 'name' | 'category' | 'newest';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

interface ToolItemProps {
  tool: ToolDef;
  viewMode: 'grid' | 'list';
  onQuickPreview: (tool: ToolDef) => void;
}

const ToolItem = React.memo(function ToolItem({ tool, viewMode, onQuickPreview }: ToolItemProps) {
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

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickPreview(tool);
  };

  if (viewMode === 'list') {
    return (
      <motion.div variants={cardVariant}>
        <div className="group relative">
          <Link href={`/tools/${tool.id}`} onClick={() => addRecentTool(tool.id)} className="block">
            <Card hover className="p-3.5 group cursor-pointer flex items-center gap-4 transition-all hover:bg-bg-hover/80 border-border/80">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-md',
                  tool.color
                )}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold font-outfit text-sm text-text-primary group-hover:text-accent transition-colors duration-150 truncate">
                    {tool.name}
                  </h3>
                  <span className="text-[10px] text-text-muted bg-bg-tertiary border border-border px-2 py-0.5 rounded-full whitespace-nowrap hidden sm:inline-block">
                    {tool.category}
                  </span>
                  {tool.isNew && (
                    <span className="text-[9px] font-bold text-white bg-accent px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                      NEW
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-text-secondary truncate">{tool.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handlePreviewClick}
                  className="p-1.5 rounded-lg border border-border/50 bg-bg-tertiary/60 text-text-secondary hover:text-text-primary hover:border-accent/40 transition-all duration-150 cursor-pointer hidden md:flex items-center gap-1 text-[11px]"
                  title="Quick Inspect Tool Info"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                <button
                  onClick={handleFavoriteClick}
                  className={cn(
                    'p-1.5 rounded-lg border border-transparent bg-transparent cursor-pointer',
                    'hover:border-border hover:bg-bg-tertiary transition-all duration-150 active:scale-95',
                    isFavorite && 'text-accent'
                  )}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star
                    className={cn(
                      'h-4 w-4 stroke-1.5 transition-all duration-150',
                      isFavorite
                        ? 'fill-accent stroke-accent scale-110'
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                  />
                </button>
                <div className="text-[11px] text-accent font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex items-center gap-1 w-16 justify-end">
                  Open <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={cardVariant} className="h-full">
      <div className="h-full group relative">
        <Link href={`/tools/${tool.id}`} onClick={() => addRecentTool(tool.id)} className="block h-full">
          <Card
            hover
            className="h-full p-5 group cursor-pointer flex flex-col justify-between relative overflow-hidden card-highlight border-border/80 hover:border-accent/40 transition-all duration-300"
          >
            <div
              className={cn(
                'absolute top-0 right-0 w-28 h-28 rounded-full bg-gradient-to-br opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300 blur-2xl pointer-events-none',
                tool.color
              )}
            />

            <div>
              <div className="flex items-start justify-between gap-2">
                <div
                  className={cn(
                    'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-2 shadow-md',
                    tool.color
                  )}
                >
                  <Icon className="h-5.5 w-5.5 text-white" />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePreviewClick}
                    className="p-1.5 rounded-lg border border-border/40 bg-bg-hover/60 text-text-muted hover:text-text-primary hover:border-accent/40 transition-all duration-150 cursor-pointer"
                    title="Quick Inspect"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleFavoriteClick}
                    className={cn(
                      'p-1.5 rounded-lg border border-transparent bg-transparent cursor-pointer',
                      'hover:border-border hover:bg-bg-hover transition-all duration-150 active:scale-95 shrink-0',
                      isFavorite && 'border-border bg-bg-hover'
                    )}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star
                      className={cn(
                        'h-4 w-4 stroke-1.5 transition-all duration-150',
                        isFavorite
                          ? 'fill-accent stroke-accent scale-110'
                          : 'text-text-secondary hover:text-text-primary'
                      )}
                    />
                  </button>
                  {tool.isNew && (
                    <span className="text-[9px] font-extrabold text-white bg-accent px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                      NEW
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <span className="text-[10px] font-semibold text-text-muted bg-bg-hover border border-border/60 px-2 py-0.5 rounded-full inline-block mb-1.5">
                  {tool.category}
                </span>
                <h3 className="font-bold font-outfit text-base text-text-primary group-hover:text-accent transition-colors duration-150 leading-snug">
                  {tool.name}
                </h3>
                <p className="mt-1.5 text-xs text-text-secondary leading-relaxed line-clamp-2">
                  {tool.description}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
              <span className="text-[11px] text-text-muted">100% Client-side</span>
              <div className="flex items-center gap-1 text-accent font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Launch <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </motion.div>
  );
});

export function ToolGrid() {
  const [query, setQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<string>('All');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = React.useState<SortOption>('default');
  const [previewTool, setPreviewTool] = React.useState<ToolDef | null>(null);

  const { setCommandPaletteOpen, favorites, recentTools, addRecentTool } = useAppStore();
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
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  const filtered = React.useMemo(() => {
    let list = tools.filter((t) => {
      const matchesCat =
        activeCategory === 'All'
          ? true
          : activeCategory === 'New'
          ? t.isNew
          : activeCategory === 'Favorites'
          ? favorites.includes(t.id)
          : t.category === activeCategory;
      const matchesQ = toolMatchesQuery(t, query);
      return matchesCat && matchesQ;
    });

    if (sortBy === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'category') {
      list = [...list].sort((a, b) => a.category.localeCompare(b.category));
    } else if (sortBy === 'newest') {
      list = [...list].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    return list;
  }, [query, activeCategory, favorites, sortBy]);

  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      All: tools.length,
      New: tools.filter((t) => t.isNew).length,
      Favorites: tools.filter((t) => favorites.includes(t.id)).length,
    };
    for (const t of tools) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    return counts;
  }, [favorites]);

  const favoriteTools = React.useMemo(
    () => tools.filter((t) => favorites.includes(t.id)),
    [favorites]
  );
  const recentToolsData = React.useMemo(
    () =>
      recentTools
        .map((id) => tools.find((t) => t.id === id))
        .filter(Boolean) as ToolDef[],
    [recentTools]
  );

  const renderToolGroup = (title: string, groupTools: ToolDef[], icon?: React.ReactNode) => {
    if (groupTools.length === 0) return null;
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h2 className="text-sm font-bold font-outfit text-text-primary uppercase tracking-wider">
            {title}
          </h2>
          <span className="ml-auto text-[10px] text-text-muted font-mono bg-bg-hover px-2 py-0.5 rounded-md border border-border">
            {groupTools.length}
          </span>
        </div>
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'flex flex-col gap-2.5'
          }
        >
          {groupTools.map((tool) => (
            <ToolItem
              key={`${title}-${tool.id}`}
              tool={tool}
              viewMode={viewMode}
              onQuickPreview={setPreviewTool}
            />
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <section className="min-h-[60vh] pb-16">
      {/* Sticky Search Control Palette */}
      <div className="border-y border-border/80 bg-bg-primary/90 backdrop-blur-2xl sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            
            {/* Search Input Box */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 59+ tools by name, category, or description…"
                className="w-full h-10 pl-10 pr-10 rounded-xl bg-bg-tertiary/90 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 shadow-inner"
              />
              {!query && (
                <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-bg-hover border border-border rounded">
                  /
                </kbd>
              )}
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors text-xs cursor-pointer"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort & View Mode Controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="h-10 px-3 pr-8 rounded-xl bg-bg-tertiary border border-border text-xs font-semibold text-text-secondary focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="default">Sort: Default</option>
                  <option value="name">Sort: Name (A-Z)</option>
                  <option value="category">Sort: Category</option>
                  <option value="newest">Sort: Newest First</option>
                </select>
              </div>

              <div className="flex items-center bg-bg-tertiary border border-border rounded-xl p-0.5 h-10">
                <button
                  onClick={() => handleSetViewMode('grid')}
                  className={cn(
                    'p-2 rounded-lg transition-colors cursor-pointer',
                    viewMode === 'grid'
                      ? 'bg-bg-elevated shadow-sm text-text-primary font-bold'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleSetViewMode('list')}
                  className={cn(
                    'p-2 rounded-lg transition-colors cursor-pointer',
                    viewMode === 'list'
                      ? 'bg-bg-elevated shadow-sm text-text-primary font-bold'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                  aria-label="List view"
                >
                  <ListIcon className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="hidden lg:flex items-center gap-1.5 px-3.5 h-10 shrink-0 rounded-xl border border-border bg-bg-tertiary text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-border-hover transition-all duration-200 cursor-pointer"
              >
                <Command className="h-3.5 w-3.5 text-accent" />
                <span>Command Menu</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 mt-3.5 overflow-x-auto scrollbar-hide">
            {categoryPills.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer',
                  activeCategory === cat
                    ? 'bg-accent text-bg-primary shadow-md shadow-accent/20'
                    : 'bg-bg-tertiary text-text-secondary border border-border hover:border-border-hover hover:text-text-primary'
                )}
              >
                {cat === 'Favorites' && (
                  <Star className={cn('h-3.5 w-3.5', activeCategory === cat && 'fill-current')} />
                )}
                {cat}
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full leading-5 font-mono',
                    activeCategory === cat
                      ? 'bg-white/30 text-bg-primary font-bold'
                      : 'bg-bg-hover text-text-muted'
                  )}
                >
                  {categoryCounts[cat] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid / Tool Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              {activeCategory === 'Favorites' && favorites.length === 0 && !query ? (
                <>
                  <Star className="h-10 w-10 text-text-muted mb-3" />
                  <p className="text-text-secondary text-sm font-medium">
                    No favorite tools saved yet. Click the star icon on any tool card to save it here!
                  </p>
                </>
              ) : (
                <>
                  <Search className="h-10 w-10 text-text-muted mb-3" />
                  <p className="text-text-secondary text-sm font-medium">
                    No tools match &ldquo;{query}&rdquo;
                  </p>
                </>
              )}
              <button
                onClick={() => {
                  setQuery('');
                  setActiveCategory('All');
                  setSortBy('default');
                }}
                className="mt-4 px-4 py-2 rounded-lg bg-bg-tertiary border border-border text-xs text-accent font-semibold hover:bg-bg-hover transition-all"
              >
                Reset filters
              </button>
            </motion.div>
          ) : (
            <motion.div key={activeCategory + query + viewMode + sortBy} className="w-full">
              {activeCategory === 'All' && !query && sortBy === 'default' ? (
                <div className="space-y-6">
                  {recentToolsData.length > 0 &&
                    renderToolGroup(
                      'Jump Back In',
                      recentToolsData.slice(0, 4),
                      <History className="h-4.5 w-4.5 text-blue-400" />
                    )}
                  {favoriteTools.length > 0 &&
                    renderToolGroup(
                      'Favorites',
                      favoriteTools,
                      <Star className="h-4.5 w-4.5 text-amber-400 fill-amber-400" />
                    )}
                  {renderToolGroup(
                    'Recently Added',
                    tools.filter((t) => t.isNew).slice(0, 8),
                    <Sparkles className="h-4.5 w-4.5 text-fuchsia-400" />
                  )}
                  {categories.map((cat) => {
                    const catTools = tools.filter((t) => t.category === cat);
                    return (
                      <React.Fragment key={cat}>
                        {renderToolGroup(cat, catTools)}
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                      : 'flex flex-col gap-2.5'
                  }
                >
                  {filtered.map((tool) => (
                    <ToolItem
                      key={tool.id}
                      tool={tool}
                      viewMode={viewMode}
                      onQuickPreview={setPreviewTool}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {filtered.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-14 text-center text-xs text-text-muted"
          >
            Press <kbd className="px-1.5 py-0.5 bg-bg-tertiary border border-border rounded text-[10px] font-mono">⌘K</kbd> or <kbd className="px-1.5 py-0.5 bg-bg-tertiary border border-border rounded text-[10px] font-mono">/</kbd> anytime to navigate micro-apps
          </motion.p>
        )}
      </div>

      {/* Quick Preview Modal */}
      {previewTool && (
        <Modal
          open={!!previewTool}
          onClose={() => setPreviewTool(null)}
          title={previewTool.name}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-lg', previewTool.color)}>
                {React.createElement(previewTool.icon, { className: 'h-6 w-6 text-white' })}
              </div>
              <div>
                <span className="text-xs text-text-muted bg-bg-tertiary border border-border px-2.5 py-0.5 rounded-full font-semibold">
                  {previewTool.category}
                </span>
                <p className="mt-1 text-sm text-text-secondary">{previewTool.description}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-bg-tertiary border border-border space-y-2 text-xs">
              <div className="flex items-center justify-between text-text-muted">
                <span>Execution Mode</span>
                <span className="font-semibold text-success flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Offline Client-Side
                </span>
              </div>


            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <button
                onClick={() => setPreviewTool(null)}
                className="px-4 py-2 rounded-lg bg-bg-tertiary text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Close
              </button>
              <Link
                href={`/tools/${previewTool.id}`}
                onClick={() => {
                  addRecentTool(previewTool.id);
                  setPreviewTool(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-bg-primary text-xs font-bold hover:bg-accent-hover transition-colors shadow-md shadow-accent/20"
              >
                Launch App <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
