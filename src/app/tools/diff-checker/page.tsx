'use client';

import * as React from 'react';
import { RotateCcw, Columns, AlignJustify, ArrowLeftRight, Check, Navigation, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { computeDiff, type SplitDiffRow, type UnifiedDiffLine } from '@/tools/diff-checker/utils';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

const examples = [
  {
    label: 'JSON Config',
    original: `{
  "name": "myapp",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "next": "^16.2.0",
    "react": "^19.0.0",
    "zustand": "^4.5.0"
  }
}`,
    modified: `{
  "name": "myapp-pro",
  "version": "1.1.0",
  "private": false,
  "dependencies": {
    "next": "^16.2.6",
    "react": "^19.2.4",
    "zustand": "^5.0.1",
    "framer-motion": "^12.0.0"
  }
}`,
  },
  {
    label: 'JS Refactor',
    original: `function calculateTotal(items, discount) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  if (discount) {
    return total - (total * discount);
  }
  return total;
}`,
    modified: `function calculateTotal(items, discount = 0) {
  // Use reduce for a cleaner accumulation
  const subTotal = items.reduce((acc, item) => acc + item.price, 0);
  
  if (discount > 0) {
    return subTotal * (1 - discount);
  }
  return subTotal;
}`,
  },
  {
    label: 'HTML Tags',
    original: `<div class="card p-4">
  <h3>Hello World</h3>
  <p>This is a paragraph of text.</p>
  <button onclick="alert('click')">Click Me</button>
</div>`,
    modified: `<div className="card p-5 border border-border">
  <h3 className="font-bold">Hello React</h3>
  <p className="text-muted">This is an updated paragraph of text.</p>
  <button onClick={handleClick}>Click Me</button>
</div>`,
  }
];

export default function Page() {
  const [originalText, setOriginalText] = React.useState(examples[0].original);
  const [modifiedText, setModifiedText] = React.useState(examples[0].modified);
  const [viewMode, setViewMode] = React.useState<'split' | 'unified'>('split');
  const [ignoreWhitespace, setIgnoreWhitespace] = React.useState(false);
  const [ignoreCase, setIgnoreCase] = React.useState(false);
  
  const [splitRows, setSplitRows] = React.useState<SplitDiffRow[]>([]);
  const [unifiedLines, setUnifiedLines] = React.useState<UnifiedDiffLine[]>([]);
  const [diffLineIndices, setDiffLineIndices] = React.useState<number[]>([]);
  const [splitRowIndices, setSplitRowIndices] = React.useState<number[]>([]);
  const [activeDiffIndex, setActiveDiffIndex] = React.useState(0);
  const diffContainerRef = React.useRef<HTMLDivElement>(null);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [addedCount, setAddedCount] = React.useState(0);
  const [removedCount, setRemovedCount] = React.useState(0);
  const [activeExample, setActiveExample] = React.useState(0);

  const handleProcess = React.useCallback(() => {
    const result = computeDiff(originalText, modifiedText, {
      ignoreWhitespace,
      ignoreCase
    });
    
    setSplitRows(result.splitRows);
    setUnifiedLines(result.unifiedLines);
    setHasChanges(result.hasChanges);
    setAddedCount(result.addedCount);
    setRemovedCount(result.removedCount);
    setDiffLineIndices(result.diffLineIndices);
    setSplitRowIndices(result.splitRowIndices);
    setActiveDiffIndex(0);
  }, [originalText, modifiedText, ignoreWhitespace, ignoreCase]);

  React.useEffect(() => {
    const t = setTimeout(handleProcess, 150);
    return () => clearTimeout(t);
  }, [handleProcess]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    setOriginalText(examples[i].original);
    setModifiedText(examples[i].modified);
  };

  const handleClear = () => {
    setOriginalText('');
    setModifiedText('');
  };

  const handleSwap = () => {
    const temp = originalText;
    setOriginalText(modifiedText);
    setModifiedText(temp);
    setActiveExample(-1);
    toast({ type: 'success', message: 'Inputs swapped successfully!' });
  };

  // Compile full text diff summary for copy
  const getDiffText = () => {
    return unifiedLines
      .map(line => {
        if (line.type === 'added') return `+ ${line.value}`;
        if (line.type === 'removed') return `- ${line.value}`;
        return `  ${line.value}`;
      })
      .join('\n');
  };

  const totalDiffs = viewMode === 'split' ? splitRowIndices.length : diffLineIndices.length;
  const hasDiffs = totalDiffs > 0;

  const scrollToDiff = React.useCallback((index: number) => {
    const container = diffContainerRef.current;
    if (!container || !hasDiffs) return;
    const indices = viewMode === 'split' ? splitRowIndices : diffLineIndices;
    const targetIndex = indices[index] ?? indices[0];
    const selector = viewMode === 'split'
      ? `[data-split-index="${targetIndex}"]`
      : `[data-unified-index="${targetIndex}"]`;
    const el = container.querySelector(selector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [hasDiffs, viewMode, splitRowIndices, diffLineIndices]);

  const handleNextDiff = React.useCallback(() => {
    if (!hasDiffs) return;
    const next = (activeDiffIndex + 1) % totalDiffs;
    setActiveDiffIndex(next);
    scrollToDiff(next);
  }, [activeDiffIndex, totalDiffs, scrollToDiff, hasDiffs]);

  const handlePrevDiff = React.useCallback(() => {
    if (!hasDiffs) return;
    const prev = (activeDiffIndex - 1 + totalDiffs) % totalDiffs;
    setActiveDiffIndex(prev);
    scrollToDiff(prev);
  }, [activeDiffIndex, totalDiffs, scrollToDiff, hasDiffs]);

  return (
    <ToolLayout
      name="Diff Checker"
      description="Compare and highlight structural and word-level differences between two files or text snippets"
      category="Text"
    >
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      {/* Editor Panel: Input Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">Original Text</h2>
            <Button variant="ghost" size="sm" onClick={handleClear} icon={<RotateCcw className="h-4 w-4" />}>
              Clear
            </Button>
          </div>
          <Input
            value={originalText}
            onChange={(e) => { setOriginalText(e.target.value); setActiveExample(-1); }}
            placeholder="Paste or type original text here..."
            className="min-h-[220px]"
            monospace
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">Modified Text</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleSwap} icon={<ArrowLeftRight className="h-4 w-4" />}>
                Swap
              </Button>
            </div>
          </div>
          <Input
            value={modifiedText}
            onChange={(e) => { setModifiedText(e.target.value); setActiveExample(-1); }}
            placeholder="Paste or type modified text here..."
            className="min-h-[220px]"
            monospace
          />
        </div>
      </div>

      {/* Tool Options & Stats Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-bg-secondary mt-6">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-bg-primary bg-bg-tertiary transition-all cursor-pointer"
            />
            <span>Ignore Whitespace</span>
          </label>

          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={ignoreCase}
              onChange={(e) => setIgnoreCase(e.target.checked)}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-bg-primary bg-bg-tertiary transition-all cursor-pointer"
            />
            <span>Ignore Case</span>
          </label>
        </div>

         <div className="flex items-center gap-3">
           <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border bg-bg-tertiary text-xs text-text-muted">
             <Navigation className="h-3.5 w-3.5" />
             <span>{hasDiffs ? `${activeDiffIndex + 1}/${totalDiffs}` : '0/0'}</span>
             <button
               onClick={handlePrevDiff}
               disabled={!hasDiffs}
               className="p-1 rounded-md text-text-muted hover:text-text-primary disabled:opacity-40"
             >
               <ChevronUp className="h-3.5 w-3.5" />
             </button>
             <button
               onClick={handleNextDiff}
               disabled={!hasDiffs}
               className="p-1 rounded-md text-text-muted hover:text-text-primary disabled:opacity-40"
             >
               <ChevronDown className="h-3.5 w-3.5" />
             </button>
           </div>
           <div className="flex items-center rounded-lg border border-border p-1 bg-bg-tertiary">
             <button
               onClick={() => setViewMode('split')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
                viewMode === 'split'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Split View</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
                viewMode === 'unified'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <AlignJustify className="h-3.5 w-3.5" />
              <span>Unified View</span>
            </button>
          </div>

          <CopyButton value={getDiffText()} label="Copy Diff" disabled={!hasChanges} />
        </div>
      </div>

      {/* Difference Visual Display block */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-text-secondary">Comparison Result</h2>
          {hasChanges ? (
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="text-error bg-error/10 border border-error/20 px-2.5 py-1 rounded-full">
                -{removedCount} lines deleted
              </span>
              <span className="text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-full">
                +{addedCount} lines added
              </span>
            </div>
          ) : (
            <span className="text-success text-xs font-semibold flex items-center gap-1 bg-success/10 border border-success/20 px-2.5 py-1 rounded-full">
              <Check className="h-3.5 w-3.5" /> Files are identical
            </span>
          )}
        </div>

         <div ref={diffContainerRef} className="border border-border rounded-xl bg-bg-tertiary overflow-hidden font-mono text-sm shadow-sm select-text">
           {viewMode === 'split' ? (
            /* Split View Render */
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse table-fixed min-w-[700px]">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary text-text-muted text-xs">
                    <th className="w-[45px] px-2 py-1.5 border-r border-border text-center font-normal">Line</th>
                    <th className="px-4 py-1.5 text-left font-normal">Original</th>
                    <th className="w-[45px] px-2 py-1.5 border-x border-border text-center font-normal">Line</th>
                    <th className="px-4 py-1.5 text-left font-normal">Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {splitRows.map((row, index) => {
                    const oldType = row.oldLine?.type;
                    const newType = row.newLine?.type;

                    const rowBgClass = cn(
                      oldType === 'removed' && 'bg-error/5',
                      newType === 'added' && 'bg-success/5',
                      (oldType === 'modified' || newType === 'modified') && 'bg-accent/5'
                    );

                    const isDiffRow = (row.oldLine?.type && row.oldLine.type !== 'unchanged') || (row.newLine?.type && row.newLine.type !== 'unchanged');
                    const isActive = hasDiffs && splitRowIndices[activeDiffIndex] === index;
                    return (
                      <tr
                        key={index}
                        data-split-index={index}
                        className={cn(
                          'border-b border-border/40 hover:bg-bg-hover/20 transition-colors',
                          rowBgClass,
                          isDiffRow && 'scroll-mt-20',
                          isActive && 'ring-2 ring-accent/40 bg-accent/5'
                        )}
                      >
                        {/* Old Line Number */}
                        <td className={cn(
                          'px-2 py-1 border-r border-border text-right select-none text-[11px] text-text-muted font-mono leading-relaxed',
                          oldType === 'removed' && 'bg-error/10 text-error/80 border-r-error/30',
                          oldType === 'modified' && 'bg-accent/10 text-accent/80 border-r-accent/30'
                        )}>
                          {row.oldLine?.lineNumber ?? ''}
                        </td>
                        
                        {/* Old Content */}
                        <td className={cn(
                          'px-4 py-1 break-all whitespace-pre-wrap leading-relaxed border-r border-border/40',
                          oldType === 'removed' && 'bg-error/5 text-error font-medium',
                          oldType === 'modified' && 'text-text-primary'
                        )}>
                          {row.oldLine ? (
                            row.oldLine.tokens ? (
                              row.oldLine.tokens.map((token, tIdx) => (
                                <span
                                  key={tIdx}
                                  className={cn(
                                    token.type === 'removed' && 'bg-error/30 text-error font-bold px-0.5 rounded'
                                  )}
                                >
                                  {token.value}
                                </span>
                              ))
                            ) : (
                              row.oldLine.value
                            )
                          ) : (
                            <span className="text-text-muted/40 italic block select-none">empty</span>
                          )}
                        </td>

                        {/* New Line Number */}
                        <td className={cn(
                          'px-2 py-1 border-r border-border text-right select-none text-[11px] text-text-muted font-mono leading-relaxed',
                          newType === 'added' && 'bg-success/10 text-success/80 border-r-success/30',
                          newType === 'modified' && 'bg-accent/10 text-accent/80 border-r-accent/30'
                        )}>
                          {row.newLine?.lineNumber ?? ''}
                        </td>

                        {/* New Content */}
                        <td className={cn(
                          'px-4 py-1 break-all whitespace-pre-wrap leading-relaxed',
                          newType === 'added' && 'bg-success/5 text-success font-medium',
                          newType === 'modified' && 'text-text-primary'
                        )}>
                          {row.newLine ? (
                            row.newLine.tokens ? (
                              row.newLine.tokens.map((token, tIdx) => (
                                <span
                                  key={tIdx}
                                  className={cn(
                                    token.type === 'added' && 'bg-success/30 text-success font-bold px-0.5 rounded'
                                  )}
                                >
                                  {token.value}
                                </span>
                              ))
                            ) : (
                              row.newLine.value
                            )
                          ) : (
                            <span className="text-text-muted/40 italic block select-none">empty</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Unified View Render */
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse table-fixed min-w-[500px]">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary text-text-muted text-xs">
                    <th className="w-[45px] px-2 py-1.5 border-r border-border text-center font-normal">Original</th>
                    <th className="w-[45px] px-2 py-1.5 border-r border-border text-center font-normal">Modified</th>
                    <th className="px-4 py-1.5 text-left font-normal">Content</th>
                  </tr>
                </thead>
                <tbody>
                  {unifiedLines.map((line, index) => {
                    const rowBgClass = cn(
                      line.type === 'added' && 'bg-success/5',
                      line.type === 'removed' && 'bg-error/5'
                    );
                    const isDiffLine = line.type !== 'unchanged';
                    const isActive = hasDiffs && diffLineIndices[activeDiffIndex] === index;

                    return (
                      <tr
                        key={index}
                        data-unified-index={index}
                        className={cn(
                          'border-b border-border/40 hover:bg-bg-hover/20 transition-colors',
                          rowBgClass,
                          isDiffLine && 'scroll-mt-20',
                          isActive && 'ring-2 ring-accent/40 bg-accent/5'
                        )}
                      >
                        {/* Old Line Number */}
                        <td className={cn(
                          'px-2 py-1 border-r border-border text-right select-none text-[11px] text-text-muted font-mono leading-relaxed',
                          line.type === 'removed' && 'bg-error/10 text-error/80 border-r-error/30'
                        )}>
                          {line.lineNumberOld ?? ''}
                        </td>

                        {/* New Line Number */}
                        <td className={cn(
                          'px-2 py-1 border-r border-border text-right select-none text-[11px] text-text-muted font-mono leading-relaxed',
                          line.type === 'added' && 'bg-success/10 text-success/80 border-r-success/30'
                        )}>
                          {line.lineNumberNew ?? ''}
                        </td>

                        {/* Line Value */}
                        <td className={cn(
                          'px-4 py-1 break-all whitespace-pre-wrap leading-relaxed font-mono',
                          line.type === 'added' && 'text-success font-medium',
                          line.type === 'removed' && 'text-error line-through font-medium'
                        )}>
                          <span className="inline-block w-4 shrink-0 text-text-muted/60 select-none">
                            {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                          </span>
                          {line.value}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
