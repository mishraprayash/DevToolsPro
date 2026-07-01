'use client';

import * as React from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

function highlightMatch(text: string, query: string, className: string): React.ReactNode {
  if (!query) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className={className}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

function getIndent(line: string): number {
  const m = line.match(/^(\s*)/);
  return m ? m[1].length : 0;
}

function syntaxHighlightLine(
  line: string,
  searchQuery: string,
  highlightBg: string,
): React.ReactNode {
  const tokens: React.ReactNode[] = [];
  let remaining = line;

  const keyMatch = remaining.match(/^(\s*)"([^"]+)":\s*/);
  if (keyMatch) {
    tokens.push(
      <span key="ws" className="text-text-muted/30">{keyMatch[1]}</span>,
    );
    tokens.push(
      <span key="key" className="text-accent">
        {highlightMatch(`"${keyMatch[2]}"`, searchQuery, `${highlightBg} text-accent rounded`)}
      </span>,
    );
    tokens.push(<span key="colon">: </span>);
    remaining = remaining.slice(keyMatch[0].length);
  }

  if (remaining) {
    const valueMatch = remaining.match(
      /^(null|true|false|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/,
    );
    if (valueMatch) {
      tokens.push(
        <span key="val" className="text-success">
          {highlightMatch(valueMatch[1], searchQuery, `${highlightBg} text-success rounded`)}
        </span>,
      );
      remaining = remaining.slice(valueMatch[0].length);
    } else {
      const strMatch = remaining.match(/^"(?:[^"\\]|\\.)*"/);
      if (strMatch) {
        tokens.push(
          <span key="val" className="text-yellow-400">
            {highlightMatch(strMatch[0], searchQuery, `rounded ${highlightBg}`)}
          </span>,
        );
        remaining = remaining.slice(strMatch[0].length);
      }
    }
  }

  if (remaining) {
    tokens.push(<span key="rest">{remaining}</span>);
  }

  return <>{tokens}</>;
}

function useHighlightedJson(
  value: string,
  searchQuery: string,
  activeIndex: number,
): { nodes: React.ReactNode[]; matchIndices: number[] } {
  return React.useMemo(() => {
    const lines = value.split('\n');
    const q = searchQuery.toLowerCase().trim();

    if (!q) {
      return {
        nodes: lines.map((line, i) => (
          <div key={i} className="leading-relaxed">
            {syntaxHighlightLine(line, '', '')}
          </div>
        )),
        matchIndices: [],
      };
    }

    const matched = lines.map((line) => line.toLowerCase().includes(q));
    const indents = lines.map(getIndent);

    const parentStack: number[] = [];
    const childOfMatch = new Set<number>();
    for (let i = 0; i < lines.length; i++) {
      while (
        parentStack.length > 0 &&
        indents[i] <= indents[parentStack[parentStack.length - 1]]
      ) {
        parentStack.pop();
      }
      if (parentStack.length > 0 && matched[parentStack[parentStack.length - 1]]) {
        childOfMatch.add(i);
      }
      if (matched[i]) {
        parentStack.push(i);
      }
    }

    const matchIndices = lines.map((_, i) => i).filter((i) => matched[i]);
    const active = matchIndices[activeIndex] ?? -1;

    return {
      matchIndices,
      nodes: lines.map((line, i) => {
        const isMatched = matched[i];
        const isChild = childOfMatch.has(i);
        const show = isMatched || isChild;
        const isActive = i === active;
        const lineBg = isActive
          ? 'bg-accent/15 ring-2 ring-accent ring-inset'
          : isMatched
            ? 'bg-accent/8'
            : isChild
              ? 'bg-accent/4'
              : '';
        const opacity = !show ? 'opacity-30' : '';
        const hlBg = isActive ? 'bg-accent/20' : lineBg;

        return (
          <div
            key={i}
            data-line={i}
            className={cn(
              'leading-relaxed',
              opacity,
              (isMatched || isChild) && 'rounded -mx-1 px-1',
              lineBg,
            )}
          >
            {syntaxHighlightLine(line, q, hlBg)}
          </div>
        );
      }),
    };
  }, [value, searchQuery, activeIndex]);
}

interface JsonViewerProps {
  value: string;
  maxHeight?: string;
  minHeight?: string;
  className?: string;
}

export function JsonViewer({
  value,
  maxHeight = '480px',
  minHeight = '180px',
  className
}: JsonViewerProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { nodes: highlighted, matchIndices } = useHighlightedJson(
    value,
    searchQuery,
    activeIndex,
  );

  const matchCount = matchIndices.length;

  const scrollToActive = React.useCallback(() => {
    if (!scrollRef.current || matchIndices.length === 0) return;
    const activeLine = matchIndices[activeIndex];
    const el = scrollRef.current.querySelector(
      `[data-line="${activeLine}"]`,
    ) as HTMLElement | null;
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeIndex, matchIndices]);

  React.useEffect(() => {
    scrollToActive();
  }, [activeIndex, scrollToActive]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (matchIndices.length === 0) return;
      if (e.shiftKey) {
        setActiveIndex((i) => (i - 1 + matchIndices.length) % matchIndices.length);
      } else {
        setActiveIndex((i) => (i + 1) % matchIndices.length);
      }
    }
  };

  return (
    <div className={cn("flex flex-col border border-border rounded-xl overflow-hidden", className)}>
      <div
        ref={scrollRef}
        className="flex-1 p-4 bg-bg-tertiary overflow-auto font-mono text-sm text-text-primary whitespace-pre"
        style={{ maxHeight: className ? undefined : maxHeight, minHeight: className ? undefined : minHeight }}
      >
        {value ? (
          highlighted
        ) : (
          <span className="text-text-muted">No output</span>
        )}
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border-t border-border">
        <Search className="h-3.5 w-3.5 text-text-muted shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setActiveIndex(0); }}
          onKeyDown={handleKeyDown}
          placeholder="Search keys or values..."
          className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        {matchIndices.length > 0 && (
          <>
            <span className="text-xs text-text-muted whitespace-nowrap tabular-nums">
              {activeIndex + 1}/{matchCount}
            </span>
            <button
              onClick={() =>
                setActiveIndex((i) => (i - 1 < 0 ? matchCount - 1 : i - 1))
              }
              className="p-0.5 text-text-muted hover:text-text-primary transition-colors disabled:opacity-30"
              disabled={matchCount <= 1}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setActiveIndex((i) => (i + 1) % matchCount)}
              className="p-0.5 text-text-muted hover:text-text-primary transition-colors disabled:opacity-30"
              disabled={matchCount <= 1}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {searchQuery && matchIndices.length === 0 && (
          <span className="text-xs text-text-muted">No matches</span>
        )}
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveIndex(0);
            }}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
