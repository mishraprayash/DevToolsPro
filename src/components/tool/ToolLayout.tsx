'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, Star } from 'lucide-react';
import { useAppStore } from '@/lib/store/useStore';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface ToolLayoutProps {
  name: string;
  description: string;
  category: string;
  children: React.ReactNode;
}

export function ToolLayout({ name, description, category, children }: ToolLayoutProps) {
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

        {/* Tool content */}
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
