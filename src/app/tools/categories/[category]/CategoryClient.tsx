'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Star, ArrowRight, LayoutGrid, List as ListIcon, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/useStore';
import { toast } from '@/components/ui/Toast';
import { tools, toolMatchesQuery, type ToolCategory, type ToolDef } from '@/tools/registry';

type ViewMode = 'grid' | 'list';

interface Props { category: ToolCategory; }

const ToolRow = React.memo(function ToolRow({ tool, viewMode, isFavorite, onToggle, onAddRecent }: { tool: ToolDef; viewMode: ViewMode; isFavorite: boolean; onToggle: (id: string) => void; onAddRecent: (id: string) => void }) {
  const Icon = tool.icon;
  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    onToggle(tool.id);
    toast({ type: 'success', message: isFavorite ? `${tool.name} removed from favorites.` : `${tool.name} added to favorites!` });
  };
  if (viewMode === 'list') {
    return (
      <Link href={`/tools/${tool.id}`} onClick={() => onAddRecent(tool.id)} className="block">
        <Card hover className="p-3.5 flex items-center gap-4 hover:bg-bg-hover/80">
          <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-md', tool.color)}><Icon className="h-5 w-5 text-white" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold font-outfit text-sm truncate">{tool.name}</h3>
              {tool.isNew && <span className="text-[9px] font-bold text-white bg-accent px-1.5 py-0.5 rounded-full">NEW</span>}
            </div>
            <p className="text-xs text-text-secondary truncate">{tool.description}</p>
          </div>
          <button type="button" onClick={handleFav} aria-label={isFavorite ? 'Remove favorite' : 'Add favorite'} aria-pressed={isFavorite} className={cn('p-1.5 rounded-lg border border-transparent hover:border-border hover:bg-bg-tertiary', isFavorite && 'text-accent')}>
            <Star className={cn('h-4 w-4', isFavorite ? 'fill-accent stroke-accent' : 'text-text-secondary')} />
          </button>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-accent opacity-0 group-hover:opacity-100">Open <ArrowRight className="h-3 w-3" /></span>
        </Card>
      </Link>
    );
  }
  return (
    <Link href={`/tools/${tool.id}`} onClick={() => onAddRecent(tool.id)} className="block h-full">
      <Card hover className="h-full p-5 flex flex-col justify-between card-highlight">
        <div className="flex items-start justify-between gap-2">
          <div className={cn('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md group-hover:scale-110 transition-transform', tool.color)}><Icon className="h-5.5 w-5.5 text-white" /></div>
          <button type="button" onClick={handleFav} aria-label={isFavorite ? 'Remove favorite' : 'Add favorite'} aria-pressed={isFavorite} className="p-1.5 rounded-lg hover:bg-bg-hover"><Star className={cn('h-4 w-4', isFavorite ? 'fill-accent stroke-accent' : 'text-text-muted')} /></button>
        </div>
        <div className="mt-4">
          <h3 className="font-bold font-outfit text-base group-hover:text-accent leading-snug">{tool.name}</h3>
          <p className="mt-1.5 text-xs text-text-secondary line-clamp-2 leading-relaxed">{tool.description}</p>
          {tool.isNew && <span className="mt-2 inline-block text-[9px] font-bold text-white bg-accent px-1.5 py-0.5 rounded-full">NEW</span>}
        </div>
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
          <span className="text-[11px] text-text-muted">Offline</span>
          <span className="flex items-center gap-1 text-accent font-semibold">Launch <ArrowRight className="h-3.5 w-3.5" /></span>
        </div>
      </Card>
    </Link>
  );
});

export function CategoryFormattingClient({ category }: Props) {
  const catTools = React.useMemo(() => tools.filter(t => t.category === category), [category]);
  const [query, setQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [sort, setSort] = React.useState<'default' | 'name' | 'new'>('default');
  const { favorites, addRecentTool } = useAppStore();
  const toggleFavorite = useAppStore(s => s.toggleFavorite);
  const favoriteSet = React.useMemo(() => new Set(favorites), [favorites]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem('devtools-category-view');
    if (saved === 'list' || saved === 'grid') setViewMode(saved);
  }, []);
  const setView = (m: ViewMode) => { setViewMode(m); try { localStorage.setItem('devtools-category-view', m); } catch {} };

  // URL sync for shareable filter — lightweight, no router push to avoid RSC trip
  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get('q'); if (q) setQuery(q);
    const v = sp.get('view'); if (v === 'list' || v === 'grid') setViewMode(v);
  }, []);
  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (query) sp.set('q', query); else sp.delete('q');
    if (viewMode !== 'grid') sp.set('view', viewMode); else sp.delete('view');
    const s = sp.toString();
    window.history.replaceState(null, '', s ? `?${s}` : window.location.pathname);
  }, [query, viewMode]);

  const filtered = React.useMemo(() => {
    let list = catTools.filter(t => toolMatchesQuery(t, query));
    if (sort === 'name') list = [...list].sort((a,b) => a.name.localeCompare(b.name));
    if (sort === 'new') list = [...list].sort((a,b) => (b.isNew?1:0)-(a.isNew?1:0));
    return list;
  }, [catTools, query, sort]);

  const handleToggle = React.useCallback((id: string) => toggleFavorite(id), [toggleFavorite]);
  const handleAddRecent = React.useCallback((id: string) => addRecentTool(id), [addRecentTool]);

  return (
    <section id="tool-grid" className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Filter bar */}
      <div className="sticky top-16 z-10 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-bg-primary/90 backdrop-blur border-y sm:border sm:rounded-xl border-border/80 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex-1 relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search in ${category}… (e.g. JSON, SQL, CSV)`}
            aria-label={`Search ${category} tools`}
            className="w-full h-10 pl-10 pr-10 rounded-xl bg-bg-tertiary border border-border text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {query && <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-bg-hover border border-border">Clear</button>}
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="cat-sort">Sort</label>
          <select id="cat-sort" value={sort} onChange={e => setSort(e.target.value as never)} className="h-10 px-3 rounded-xl bg-bg-tertiary border border-border text-xs font-semibold">
            <option value="default">Sort: Default</option>
            <option value="name">Sort: A → Z</option>
            <option value="new">Sort: New first</option>
          </select>
          <div className="flex bg-bg-tertiary border border-border rounded-xl p-0.5 h-10" role="group" aria-label="View mode">
            <button type="button" onClick={() => setView('grid')} aria-pressed={viewMode==='grid'} aria-label="Grid view" className={cn('p-2 rounded-lg', viewMode==='grid' ? 'bg-bg-elevated shadow-sm' : 'text-text-muted')}><LayoutGrid className="h-4 w-4" /></button>
            <button type="button" onClick={() => setView('list')} aria-pressed={viewMode==='list'} aria-label="List view" className={cn('p-2 rounded-lg', viewMode==='list' ? 'bg-bg-elevated shadow-sm' : 'text-text-muted')}><ListIcon className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-6">
        {filtered.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-border rounded-2xl">
            <Search className="h-8 w-8 mx-auto text-text-muted" />
            <p className="mt-2 text-sm font-medium">No {category} tools match “{query}”</p>
            <p className="text-xs text-text-muted mt-1">Try “json”, “sql”, or “csv”.</p>
            <button type="button" onClick={() => setQuery('')} className="mt-3 px-4 py-2 rounded-xl bg-bg-tertiary border border-border text-xs font-semibold">Clear search</button>
          </div>
        ) : (
          <div className={viewMode==='grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'flex flex-col gap-2.5'}>
            {filtered.map(t => <ToolRow key={t.id} tool={t} viewMode={viewMode} isFavorite={favoriteSet.has(t.id)} onToggle={handleToggle} onAddRecent={handleAddRecent} />)}
          </div>
        )}
        <p className="mt-8 text-center text-xs text-text-muted">
          <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3 text-accent" /> {filtered.length} of {catTools.length} tools</span> • Press <kbd className="px-1.5 py-0.5 bg-bg-tertiary border border-border rounded text-[10px]">⌘K</kbd> to jump to any tool
        </p>
      </div>
    </section>
  );
}
