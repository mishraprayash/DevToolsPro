'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, Star, AlertTriangle, RefreshCw, HelpCircle, ArrowRight, Sparkles, FileJson, FileCode, FileSpreadsheet, ListTree, Braces, Code } from 'lucide-react';
import { useAppStore } from '@/lib/store/useStore';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// React 19 Error Boundary class component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ToolErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ToolErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-6 rounded-xl border border-error/20 bg-error/5 flex flex-col items-center justify-center text-center gap-4 animate-fade-in my-6">
          <AlertTriangle className="h-10 w-10 text-error animate-pulse-glow" />
          <div>
            <h3 className="text-base font-semibold text-text-primary font-outfit">Something went wrong inside this tool</h3>
            <p className="text-xs text-text-muted mt-1 max-w-md mx-auto leading-relaxed">
              An unexpected error occurred while executing the tool logic. You can attempt to reset the tool context below.
            </p>
            {this.state.error && (
              <pre className="mt-3 p-3 rounded-lg bg-bg-tertiary border border-border text-left font-mono text-[10px] text-error overflow-auto max-w-full max-h-36">
                {this.state.error.stack || this.state.error.message}
              </pre>
            )}
          </div>
          <Button
            onClick={this.handleReset}
            variant="secondary"
            size="sm"
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Reset Tool Context
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

function slugifyCategory(cat: string) { return cat.toLowerCase().replace(/&/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim(); }

const formattingNext = [
  { id: 'json', label: 'JSON', icon: FileJson },
  { id: 'yaml-json', label: 'YAML ↔ JSON', icon: FileCode },
  { id: 'csv-json', label: 'CSV ↔ JSON', icon: FileSpreadsheet },
  { id: 'json-to-ts', label: 'TS', icon: Braces },
  { id: 'json-schema', label: 'Schema', icon: ListTree },
  { id: 'sql-designer', label: 'SQL', icon: Code },
] as const;

interface ToolLayoutProps {
  name: string;
  description: string;
  category: string;
  children: React.ReactNode;
  historyComponent?: React.ReactNode;
}

export function ToolLayout({ name, description, category, children, historyComponent }: ToolLayoutProps) {
  const pathname = usePathname();
  const { favorites, toggleFavorite } = useAppStore();
  const [helpOpen, setHelpOpen] = React.useState(false);
  
  const toolId = React.useMemo(() => {
    if (!pathname) return '';
    return pathname.split('/').pop() || '';
  }, [pathname]);

  const isFavorite = React.useMemo(() => {
    return favorites.includes(toolId);
  }, [favorites, toolId]);

  const handleToggleFavorite = () => {
    if (!toolId) return;
    toggleFavorite(toolId);
    toast({
      type: 'success',
      message: isFavorite 
        ? `${name} removed from favorites.` 
        : `${name} added to favorites!`,
    });
  };

  const categorySlug = React.useMemo(() => slugifyCategory(category), [category]);
  const isFormatting = category === 'Formatting';

  return (
    <div className="flex-1 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb — category now deep-links */}
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-text-primary transition-colors" aria-label="Home">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/tools/categories/${categorySlug}`} className="text-text-secondary hover:text-accent hover:underline underline-offset-4">
            {category}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-text-primary font-medium">{name}</span>
        </nav>

        {/* Tool header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold font-outfit flex items-center gap-3">
              {name}
              {isFormatting && <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">Formatting</span>}
            </h1>
            <p className="mt-1.5 text-sm text-text-secondary leading-relaxed max-w-3xl">{description}</p>
            {isFormatting && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-text-muted">Chain with:</span>
                {formattingNext.filter(f => f.id !== toolId).slice(0,4).map(f => (
                  <Link key={f.id} href={`/tools/${f.id}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-bg-tertiary border border-border hover:border-accent/30 text-xs">
                    <f.icon className="h-3 w-3" /> {f.label}
                  </Link>
                ))}
                <Link href="/tools/categories/formatting" className="text-accent hover:underline font-semibold">View all →</Link>
              </div>
            )}
          </div>
           
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setHelpOpen(v => !v)}
              aria-expanded={helpOpen}
              aria-controls="tool-help-panel"
              className={cn("p-2.5 rounded-xl border bg-bg-secondary hover:border-border-hover transition-all", helpOpen ? "border-accent/30 bg-accent/5 text-accent" : "border-border text-text-secondary")}
              title="How to use this tool"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            {historyComponent}
            {toolId && (
              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-pressed={isFavorite}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                className={cn(
                  "p-2.5 rounded-xl border border-border bg-bg-secondary cursor-pointer",
                  "hover:border-border-hover transition-all duration-200 active:scale-95 group",
                  isFavorite && "border-accent/30 bg-accent/5"
                )}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Star
                  className={cn(
                    "h-5 w-5 stroke-1.5 transition-all duration-200",
                    isFavorite 
                      ? "fill-accent stroke-accent scale-110" 
                      : "text-text-secondary group-hover:text-text-primary group-hover:scale-105"
                  )}
                />
              </button>
            )}
          </div>
        </div>

        {/* Inline help panel — keyboard + screen reader friendly */}
        {helpOpen && (
          <div id="tool-help-panel" className="mb-6 p-4 rounded-xl border border-accent/20 bg-accent/5 flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><Sparkles className="h-4 w-4 text-accent" /></div>
            <div className="text-sm flex-1 min-w-0">
              <p className="font-semibold">How to use {name}</p>
              <ol className="mt-1.5 list-decimal list-inside text-xs text-text-secondary space-y-1 leading-relaxed">
                <li>Paste or drop input — try an <span className="font-semibold text-text-primary">Example</span> below to see it in action.</li>
                <li>Pick an action (e.g., Beautify / Minify) — output updates instantly. Use <kbd className="px-1.5 py-0.5 bg-bg-tertiary border border-border rounded text-[10px]">⌘+Enter</kbd> to re-run.</li>
                <li>Copy, download, or <span className="font-semibold">Share</span> the tab — works offline, 100% client-side.</li>
              </ol>
              <div className="mt-2 flex gap-2">
                <Link href="/tools/categories/formatting" className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1">Explore Formatting workflows <ArrowRight className="h-3 w-3" /></Link>
                <span className="text-text-muted">•</span>
                <span className="text-xs text-text-muted">Press <kbd className="px-1 py-0.5 bg-bg-tertiary border border-border rounded text-[10px]">?</kbd> for shortcuts</span>
              </div>
            </div>
            <button type="button" onClick={() => setHelpOpen(false)} className="text-text-muted hover:text-text-primary p-1 self-start" aria-label="Close help">✕</button>
          </div>
        )}

        {/* Tool content with Error Boundary */}
        <div className="space-y-6">
          <ToolErrorBoundary>
            {children}
          </ToolErrorBoundary>
        </div>

        {/* Formatting cross-tool footer — only for Formatting */}
        {isFormatting && toolId && (
          <div className="mt-8 p-4 rounded-xl border border-border bg-bg-secondary/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs">
              <span className="font-semibold">Continue your flow:</span>
              <span className="text-text-secondary"> Convert → Generate → Validate.</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {formattingNext.filter(f => f.id !== toolId).slice(0,4).map(f => (
                <Link key={f.id} href={`/tools/${f.id}`} className="px-3 py-1.5 rounded-full bg-bg-tertiary border border-border text-xs font-medium hover:border-accent/30">
                  {f.label} →
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
