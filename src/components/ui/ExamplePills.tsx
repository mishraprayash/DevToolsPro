import * as React from 'react';
import { cn } from '@/lib/utils';

interface ExamplePillsProps {
  examples: { label: string; hint?: string }[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export { ExamplePills, type ExamplePillsProps };

function ExamplePills({ examples, activeIndex, onSelect }: ExamplePillsProps) {
  const listRef = React.useRef<HTMLDivElement>(null);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = (activeIndex + dir + examples.length) % examples.length;
    onSelect(next);
    (listRef.current?.children[next + 1] as HTMLElement | undefined)?.focus();
  };

  return (
    <div ref={listRef} onKeyDown={onKeyDown} role="tablist" aria-label="Examples" className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-text-muted">Examples:</span>
      {examples.map((ex, i) => (
        <button
          key={ex.label}
          role="tab"
          aria-selected={activeIndex === i}
          onClick={() => onSelect(i)}
          title={ex.hint ?? ex.label}
          className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-all focus-visible:ring-2 focus-visible:ring-accent/50',
            activeIndex === i
              ? 'bg-accent text-bg-primary border-accent shadow-sm'
              : 'bg-bg-tertiary text-text-secondary border-border hover:border-border-hover hover:text-text-primary'
          )}>
          {ex.label}
          {ex.hint && <span className="ml-1.5 text-[10px] opacity-70 hidden sm:inline">{ex.hint}</span>}
        </button>
      ))}
    </div>
  );
}
