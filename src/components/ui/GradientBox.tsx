'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface GradientBoxProps {
  value: string;
  placeholder?: string;
  className?: string;
}

export function GradientBox({ value, placeholder = 'Output will appear here...', className }: GradientBoxProps) {
  const hasValue = value && value.length > 0;
  
  return (
    <div className={cn(
      'relative min-h-[200px] rounded-lg border transition-all duration-300 flex flex-col overflow-hidden',
      hasValue 
        ? 'bg-gradient-to-br from-bg-tertiary via-bg-secondary to-bg-tertiary border-accent/30 shadow-[0_0_30px_rgba(34,211,238,0.1)]' 
        : 'bg-bg-tertiary border-border',
      className
    )}>
      <div className={cn(
        'absolute inset-0 rounded-lg overflow-hidden pointer-events-none',
        hasValue && 'animate-pulse-glow'
      )}>
        {hasValue && (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-violet-500/5" />
        )}
      </div>
      <pre className={cn(
        'relative z-10 w-full flex-1 px-4 py-3 font-mono text-sm text-text-primary',
        'whitespace-pre-wrap break-words overflow-y-auto',
        !hasValue && 'text-text-muted italic'
      )}>
        {hasValue ? value : placeholder}
      </pre>
    </div>
  );
}