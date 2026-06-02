'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, Star, AlertTriangle, RefreshCw } from 'lucide-react';
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

  return (
    <div className="flex-1 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-6">
          <Link href="/" className="hover:text-text-primary transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-text-secondary">{category}</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-text-primary">{name}</span>
        </nav>

        {/* Tool header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-outfit flex items-center gap-3">
              {name}
            </h1>
            <p className="mt-1.5 text-sm text-text-secondary">{description}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {historyComponent}
            {toolId && (
              <button
                onClick={handleToggleFavorite}
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

        {/* Tool content with Error Boundary */}
        <div className="space-y-6">
          <ToolErrorBoundary>
            {children}
          </ToolErrorBoundary>
        </div>
      </div>
    </div>
  );
}
