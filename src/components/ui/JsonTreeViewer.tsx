'use client';

import * as React from 'react';
import { ChevronRight, ChevronDown, Copy, Check, Search, ListCollapse, ListPlus } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

interface JsonTreeViewerProps {
  data: unknown;
  maxHeight?: string;
  minHeight?: string;
}

export function JsonTreeViewer({
  data,
  maxHeight = '500px',
  minHeight = '240px'
}: JsonTreeViewerProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});
  const [copiedPath, setCopiedPath] = React.useState<string | null>(null);
  const [hoveredPath, setHoveredPath] = React.useState<string | null>(null);

  // Parse paths and search matches
  const { allPaths, matchedPaths, ancestorPaths } = React.useMemo(() => {
    const all: string[] = [];
    const matched: string[] = [];
    const ancestors = new Set<string>();

    const traverse = (val: unknown, path: string) => {
      all.push(path);

      if (val === null || val === undefined) {
        if (searchQuery && String(val).toLowerCase().includes(searchQuery.toLowerCase())) {
          matched.push(path);
        }
        return;
      }

      const type = typeof val;
      if (type === 'string' || type === 'number' || type === 'boolean') {
        if (searchQuery && String(val).toLowerCase().includes(searchQuery.toLowerCase())) {
          matched.push(path);
        }
        return;
      }

      if (Array.isArray(val)) {
        val.forEach((item, idx) => {
          const childPath = `${path}[${idx}]`;
          traverse(item, childPath);
        });
        return;
      }

      if (type === 'object') {
        const obj = val as Record<string, unknown>;
        Object.keys(obj).forEach((key) => {
          const safeKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? `.${key}` : `["${key}"]`;
          const childPath = `${path}${safeKey}`;
          if (searchQuery && key.toLowerCase().includes(searchQuery.toLowerCase())) {
            matched.push(childPath);
          }
          traverse(obj[key], childPath);
        });
      }
    };

    traverse(data, '$');

    // Calculate ancestors for matched paths so they auto-expand
    if (searchQuery) {
      matched.forEach((mPath) => {
        let current = mPath;
        while (current.includes('.') || current.includes('[')) {
          // Find last segment
          const lastDot = current.lastIndexOf('.');
          const lastBracket = current.lastIndexOf('[');
          const splitIdx = Math.max(lastDot, lastBracket);
          if (splitIdx <= 0) break;
          current = current.substring(0, splitIdx);
          ancestors.add(current);
        }
        ancestors.add('$');
      });
    }

    return { allPaths: all, matchedPaths: matched, ancestorPaths: ancestors };
  }, [data, searchQuery]);

  // Handle local collapse toggles
  const toggleCollapse = React.useCallback((path: string) => {
    setCollapsed((prev) => ({ ...prev, [path]: !prev[path] }));
  }, []);

  // Collapse / Expand All
  const handleCollapseAll = React.useCallback(() => {
    const nextCollapsed: Record<string, boolean> = {};
    const traverse = (val: unknown, path: string) => {
      if (val !== null && typeof val === 'object') {
        nextCollapsed[path] = true;
        if (Array.isArray(val)) {
          val.forEach((item, idx) => traverse(item, `${path}[${idx}]`));
        } else {
          const obj = val as Record<string, unknown>;
          Object.keys(obj).forEach((key) => {
            const safeKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? `.${key}` : `["${key}"]`;
            traverse(obj[key], `${path}${safeKey}`);
          });
        }
      }
    };
    traverse(data, '$');
    setCollapsed(nextCollapsed);
  }, [data]);

  const handleExpandAll = React.useCallback(() => {
    setCollapsed({});
  }, []);

  const handleCopyPath = React.useCallback((path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    toast({ type: 'success', message: `Copied JSON path: ${path}` });
    setTimeout(() => setCopiedPath(null), 2000);
  }, []);

  // Highlight search string helper
  const highlightText = (text: string, search: string) => {
    if (!search) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={i} className="bg-accent/30 text-accent font-semibold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Recursive Node Renderer
  const renderNode = (val: unknown, path: string, isLast = true): React.ReactNode => {
    const isCollapsed = collapsed[path] ?? (searchQuery ? !ancestorPaths.has(path) : false);

    if (val === null) {
      return (
        <div
          className="flex items-center group/node py-0.5 hover:bg-bg-hover rounded px-1 -mx-1"
          onMouseEnter={() => setHoveredPath(path)}
          onMouseLeave={() => setHoveredPath(null)}
        >
          <span className="w-4 shrink-0" />
          <span className="text-rose-500 font-semibold select-none">null</span>
          {!isLast && <span className="text-text-muted">,</span>}
          {hoveredPath === path && (
            <button
              onClick={() => handleCopyPath(path)}
              className="ml-2 p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-all duration-150"
              title="Copy JSON path"
            >
              {copiedPath === path ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
        </div>
      );
    }

    const type = typeof val;

    if (type === 'string') {
      return (
        <div
          className="flex items-center group/node py-0.5 hover:bg-bg-hover rounded px-1 -mx-1"
          onMouseEnter={() => setHoveredPath(path)}
          onMouseLeave={() => setHoveredPath(null)}
        >
          <span className="w-4 shrink-0" />
          <span className="text-yellow-400 font-mono">
            &quot;{highlightText(val as string, searchQuery)}&quot;
          </span>
          {!isLast && <span className="text-text-muted">,</span>}
          {hoveredPath === path && (
            <button
              onClick={() => handleCopyPath(path)}
              className="ml-2 p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-all duration-150"
              title="Copy JSON path"
            >
              {copiedPath === path ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
        </div>
      );
    }

    if (type === 'number') {
      return (
        <div
          className="flex items-center group/node py-0.5 hover:bg-bg-hover rounded px-1 -mx-1"
          onMouseEnter={() => setHoveredPath(path)}
          onMouseLeave={() => setHoveredPath(null)}
        >
          <span className="w-4 shrink-0" />
          <span className="text-success font-mono">
            {highlightText(String(val), searchQuery)}
          </span>
          {!isLast && <span className="text-text-muted">,</span>}
          {hoveredPath === path && (
            <button
              onClick={() => handleCopyPath(path)}
              className="ml-2 p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-all duration-150"
              title="Copy JSON path"
            >
              {copiedPath === path ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
        </div>
      );
    }

    if (type === 'boolean') {
      return (
        <div
          className="flex items-center group/node py-0.5 hover:bg-bg-hover rounded px-1 -mx-1"
          onMouseEnter={() => setHoveredPath(path)}
          onMouseLeave={() => setHoveredPath(null)}
        >
          <span className="w-4 shrink-0" />
          <span className="text-sky-500 font-semibold font-mono">
            {highlightText(String(val), searchQuery)}
          </span>
          {!isLast && <span className="text-text-muted">,</span>}
          {hoveredPath === path && (
            <button
              onClick={() => handleCopyPath(path)}
              className="ml-2 p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-all duration-150"
              title="Copy JSON path"
            >
              {copiedPath === path ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
        </div>
      );
    }

    if (Array.isArray(val)) {
      const items = val;
      if (items.length === 0) {
        return (
          <div className="flex items-center py-0.5">
            <span className="w-4 shrink-0" />
            <span className="text-text-secondary font-mono">[]</span>
            {!isLast && <span className="text-text-muted">,</span>}
          </div>
        );
      }

      return (
        <div className="flex flex-col">
          <div
            className="flex items-center group/node py-0.5 hover:bg-bg-hover rounded px-1 -mx-1 cursor-pointer"
            onClick={() => toggleCollapse(path)}
            onMouseEnter={() => setHoveredPath(path)}
            onMouseLeave={() => setHoveredPath(null)}
          >
            <button className="p-0.5 text-text-muted hover:text-text-primary mr-0.5 shrink-0 transition-transform">
              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            <span className="text-text-primary font-mono font-medium">Array [{items.length}]</span>
            {isCollapsed && <span className="text-text-muted text-xs ml-2 font-mono">collapsed</span>}
            {hoveredPath === path && (
              <button
                onClick={(e) => { e.stopPropagation(); handleCopyPath(path); }}
                className="ml-2 p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-all duration-150"
                title="Copy JSON path"
              >
                {copiedPath === path ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
              </button>
            )}
          </div>

          {!isCollapsed && (
            <div className="pl-4 border-l border-border/40 ml-2 mt-0.5 space-y-0.5">
              {items.map((item, idx) => {
                const childPath = `${path}[${idx}]`;
                return (
                  <div key={childPath} className="flex items-start">
                    <span className="text-text-muted/60 text-xs font-mono select-none w-6 text-right mr-2 pt-0.5">{idx}:</span>
                    <div className="flex-1">
                      {renderNode(item, childPath, idx === items.length - 1)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (type === 'object') {
      const obj = val as Record<string, unknown>;
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        return (
          <div className="flex items-center py-0.5">
            <span className="w-4 shrink-0" />
            <span className="text-text-secondary font-mono">{"{}"}</span>
            {!isLast && <span className="text-text-muted">,</span>}
          </div>
        );
      }

      return (
        <div className="flex flex-col">
          <div
            className="flex items-center group/node py-0.5 hover:bg-bg-hover rounded px-1 -mx-1 cursor-pointer"
            onClick={() => toggleCollapse(path)}
            onMouseEnter={() => setHoveredPath(path)}
            onMouseLeave={() => setHoveredPath(null)}
          >
            <button className="p-0.5 text-text-muted hover:text-text-primary mr-0.5 shrink-0 transition-transform">
              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            <span className="text-text-primary font-mono font-medium">Object {"{"}{keys.length}{"}"}</span>
            {isCollapsed && <span className="text-text-muted text-xs ml-2 font-mono">collapsed</span>}
            {hoveredPath === path && (
              <button
                onClick={(e) => { e.stopPropagation(); handleCopyPath(path); }}
                className="ml-2 p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-all duration-150"
                title="Copy JSON path"
              >
                {copiedPath === path ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
              </button>
            )}
          </div>

          {!isCollapsed && (
            <div className="pl-4 border-l border-border/40 ml-2 mt-0.5 space-y-0.5">
              {keys.map((key, idx) => {
                const safeKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? `.${key}` : `["${key}"]`;
                const childPath = `${path}${safeKey}`;
                return (
                  <div key={childPath} className="flex items-start">
                    <span className="text-accent font-mono text-sm mr-2 select-none pt-0.5">
                      {highlightText(key, searchQuery)}:
                    </span>
                    <div className="flex-1">
                      {renderNode(obj[key], childPath, idx === keys.length - 1)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-bg-secondary">
      {/* Search and control header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border bg-bg-tertiary">
        <div className="flex items-center gap-2 flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keys or values..."
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-bg-secondary border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExpandAll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border bg-bg-secondary hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title="Expand all nodes"
          >
            <ListPlus className="h-3.5 w-3.5" />
            <span>Expand All</span>
          </button>
          <button
            onClick={handleCollapseAll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border bg-bg-secondary hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title="Collapse all nodes"
          >
            <ListCollapse className="h-3.5 w-3.5" />
            <span>Collapse All</span>
          </button>
        </div>
      </div>

      {/* Tree viewport */}
      <div
        className="p-5 overflow-auto font-mono text-sm text-text-primary leading-relaxed scrollbar-thin"
        style={{ maxHeight, minHeight }}
      >
        <div className="select-text">
          {renderNode(data, '$')}
        </div>
      </div>

      {/* Breadcrumbs or help footer */}
      {hoveredPath && (
        <div className="px-4 py-2 bg-bg-tertiary border-t border-border text-xs text-text-secondary truncate">
          <span className="text-text-muted select-none">Focused Path: </span>
          <span className="font-mono text-accent">{hoveredPath}</span>
        </div>
      )}
    </div>
  );
}
