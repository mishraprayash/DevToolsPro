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
import { useWorkspaces } from '@/lib/hooks/useWorkspaces';
import { WorkspaceTabs } from '@/components/ui/WorkspaceTabs';
import { SplitPanesView } from '@/components/ui/SplitPanesView';

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

interface DiffState {
  originalText: string;
  modifiedText: string;
  viewMode: 'split' | 'unified';
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  activeExample: number;
  splitRows: SplitDiffRow[];
  unifiedLines: UnifiedDiffLine[];
  diffLineIndices: number[];
  splitRowIndices: number[];
  hasChanges: boolean;
  addedCount: number;
  removedCount: number;
}

const defaultState: DiffState = {
  originalText: examples[0].original,
  modifiedText: examples[0].modified,
  viewMode: 'split',
  ignoreWhitespace: false,
  ignoreCase: false,
  activeExample: 0,
  splitRows: [],
  unifiedLines: [],
  diffLineIndices: [],
  splitRowIndices: [],
  hasChanges: false,
  addedCount: 0,
  removedCount: 0
};

export default function Page() {
  const {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    setActiveWorkspaceId,
    addWorkspace,
    removeWorkspace,
    updateActiveWorkspace,
    copyShareLink
  } = useWorkspaces<DiffState>(defaultState, 'Comparison', 'diff-checker');

  const { state } = activeWorkspace;
  const [activeDiffIndex, setActiveDiffIndex] = React.useState(0);
  const diffContainerRef = React.useRef<HTMLDivElement>(null);

  const handleProcess = React.useCallback(() => {
    const result = computeDiff(state.originalText, state.modifiedText, {
      ignoreWhitespace: state.ignoreWhitespace,
      ignoreCase: state.ignoreCase
    });
    
    updateActiveWorkspace({
      splitRows: result.splitRows,
      unifiedLines: result.unifiedLines,
      hasChanges: result.hasChanges,
      addedCount: result.addedCount,
      removedCount: result.removedCount,
      diffLineIndices: result.diffLineIndices,
      splitRowIndices: result.splitRowIndices
    });
    setActiveDiffIndex(0);
  }, [state.originalText, state.modifiedText, state.ignoreWhitespace, state.ignoreCase, updateActiveWorkspace]);

  React.useEffect(() => {
    const t = setTimeout(handleProcess, 150);
    return () => clearTimeout(t);
  }, [handleProcess]);

  const applyExample = (i: number) => {
    updateActiveWorkspace({
      activeExample: i,
      originalText: examples[i].original,
      modifiedText: examples[i].modified
    });
  };

  const handleClear = () => {
    updateActiveWorkspace({
      originalText: '',
      modifiedText: '',
      activeExample: -1
    });
  };

  const handleSwap = () => {
    updateActiveWorkspace({
      originalText: state.modifiedText,
      modifiedText: state.originalText,
      activeExample: -1
    });
    toast({ type: 'success', message: 'Inputs swapped successfully!' });
  };

  const getDiffText = () => {
    return state.unifiedLines
      .map(line => {
        if (line.type === 'added') return `+ ${line.value}`;
        if (line.type === 'removed') return `- ${line.value}`;
        return `  ${line.value}`;
      })
      .join('\n');
  };

  const totalDiffs = state.viewMode === 'split' ? state.splitRowIndices.length : state.diffLineIndices.length;
  const hasDiffs = totalDiffs > 0;

  const scrollToDiff = React.useCallback((index: number) => {
    const container = diffContainerRef.current;
    if (!container || !hasDiffs) return;
    const indices = state.viewMode === 'split' ? state.splitRowIndices : state.diffLineIndices;
    const targetIndex = indices[index] ?? indices[0];
    const selector = state.viewMode === 'split'
      ? `[data-split-index="${targetIndex}"]`
      : `[data-unified-index="${targetIndex}"]`;
    const el = container.querySelector(selector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [hasDiffs, state.viewMode, state.splitRowIndices, state.diffLineIndices]);

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

  const toolbarContent = (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 w-full">
      <div className="flex flex-wrap items-center gap-4 shrink-0">
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={state.ignoreWhitespace}
            onChange={(e) => updateActiveWorkspace({ ignoreWhitespace: e.target.checked })}
            className="w-4 h-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-bg-primary bg-bg-tertiary transition-all cursor-pointer"
          />
          <span>Ignore Whitespace</span>
        </label>

        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
          <input
            type="checkbox"
            checked={state.ignoreCase}
            onChange={(e) => updateActiveWorkspace({ ignoreCase: e.target.checked })}
            className="w-4 h-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-bg-primary bg-bg-tertiary transition-all cursor-pointer"
          />
          <span>Ignore Case</span>
        </label>
      </div>

       <div className="flex items-center gap-3 shrink-0">
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
             onClick={() => updateActiveWorkspace({ viewMode: 'split' })}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
              state.viewMode === 'split'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Columns className="h-3.5 w-3.5" />
            <span>Split View</span>
          </button>
          <button
            onClick={() => updateActiveWorkspace({ viewMode: 'unified' })}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
              state.viewMode === 'unified'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <AlignJustify className="h-3.5 w-3.5" />
            <span>Unified View</span>
          </button>
        </div>

        <CopyButton value={getDiffText()} label="Copy Diff" disabled={!state.hasChanges} />
      </div>
    </div>
  );

  const leftPane = (
    <div className="flex flex-col h-full space-y-4 min-h-0">
      <div className="flex flex-col lg:flex-row gap-6 h-[45%] lg:h-auto min-h-0 shrink-0">
        <div className="space-y-2 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-base font-medium text-text-secondary">Original Text</h2>
            <Button variant="ghost" size="sm" onClick={handleClear} icon={<RotateCcw className="h-4 w-4" />}>
              Clear
            </Button>
          </div>
          <Input
            value={state.originalText}
            onChange={(e) => updateActiveWorkspace({ originalText: e.target.value, activeExample: -1 })}
            onDropText={(text) => updateActiveWorkspace({ originalText: text, activeExample: -1 })}
            placeholder="Paste original text here or drop file..."
            className="w-full h-full"
            wrapperClassName="flex-1 min-h-[150px]"
            monospace
          />
        </div>

        <div className="space-y-2 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-base font-medium text-text-secondary">Modified Text</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleSwap} icon={<ArrowLeftRight className="h-4 w-4" />}>
                Swap
              </Button>
            </div>
          </div>
          <Input
            value={state.modifiedText}
            onChange={(e) => updateActiveWorkspace({ modifiedText: e.target.value, activeExample: -1 })}
            onDropText={(text) => updateActiveWorkspace({ modifiedText: text, activeExample: -1 })}
            placeholder="Paste modified text here or drop file..."
            className="w-full h-full"
            wrapperClassName="flex-1 min-h-[150px]"
            monospace
          />
        </div>
      </div>
      
      {/* We will leave right pane for the result, but since diff checker has a unique top-bottom layout originally, we will adapt SplitPanesView differently. Actually, SplitPanesView assumes left = side 1, right = side 2. But we want inputs on top, and diff on bottom when not full screen. 
      Wait, in SplitPanesView, `lg:grid-cols-2` puts them side-by-side. 
      For Diff Checker, Inputs are usually left/right, and Diff is below them spanning full width. Or, Inputs on left, Diff on right?
      If Inputs are left pane (stacked vertically) and Diff is right pane, it's nice.
      Let's do that: Left Pane = Input 1 & Input 2 (stacked). Right Pane = Diff Viewer.
      */}
    </div>
  );

  const leftPaneStacked = (
    <div className="flex flex-col h-full space-y-6 min-h-0">
      <div className="space-y-2 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-base font-medium text-text-secondary">Original Text</h2>
          <Button variant="ghost" size="sm" onClick={handleClear} icon={<RotateCcw className="h-4 w-4" />}>
            Clear
          </Button>
        </div>
        <Input
          value={state.originalText}
          onChange={(e) => updateActiveWorkspace({ originalText: e.target.value, activeExample: -1 })}
          onDropText={(text) => updateActiveWorkspace({ originalText: text, activeExample: -1 })}
          placeholder="Paste original text here or drop file..."
          className="w-full h-full"
          wrapperClassName="flex-1 min-h-[150px]"
          monospace
        />
      </div>

      <div className="space-y-2 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-base font-medium text-text-secondary">Modified Text</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleSwap} icon={<ArrowLeftRight className="h-4 w-4" />}>
              Swap
            </Button>
          </div>
        </div>
        <Input
          value={state.modifiedText}
          onChange={(e) => updateActiveWorkspace({ modifiedText: e.target.value, activeExample: -1 })}
          onDropText={(text) => updateActiveWorkspace({ modifiedText: text, activeExample: -1 })}
          placeholder="Paste modified text here or drop file..."
          className="w-full h-full"
          wrapperClassName="flex-1 min-h-[150px]"
          monospace
        />
      </div>
    </div>
  );

  const rightPaneDiff = (
    <div className="flex flex-col h-full space-y-4 min-h-0">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-base font-medium text-text-secondary">Comparison Result</h2>
        {state.hasChanges ? (
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="text-error bg-error/10 border border-error/20 px-2.5 py-1 rounded-full">
              -{state.removedCount} lines deleted
            </span>
            <span className="text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-full">
              +{state.addedCount} lines added
            </span>
          </div>
        ) : (
          <span className="text-success text-xs font-semibold flex items-center gap-1 bg-success/10 border border-success/20 px-2.5 py-1 rounded-full">
            <Check className="h-3.5 w-3.5" /> Files are identical
          </span>
        )}
      </div>

       <div ref={diffContainerRef} className="border border-border rounded-xl bg-bg-tertiary overflow-auto flex-1 font-mono text-sm shadow-sm select-text min-h-[300px]">
         {state.viewMode === 'split' ? (
          <div className="w-full min-w-max">
            <table className="w-full border-collapse table-fixed min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-bg-secondary text-text-muted text-xs sticky top-0 z-10">
                  <th className="w-[45px] px-2 py-1.5 border-r border-border text-center font-normal bg-bg-secondary">Line</th>
                  <th className="px-4 py-1.5 text-left font-normal bg-bg-secondary">Original</th>
                  <th className="w-[45px] px-2 py-1.5 border-x border-border text-center font-normal bg-bg-secondary">Line</th>
                  <th className="px-4 py-1.5 text-left font-normal bg-bg-secondary">Modified</th>
                </tr>
              </thead>
              <tbody>
                {state.splitRows.map((row, index) => {
                  const oldType = row.oldLine?.type;
                  const newType = row.newLine?.type;

                  const rowBgClass = cn(
                    oldType === 'removed' && 'bg-error/5',
                    newType === 'added' && 'bg-success/5',
                    (oldType === 'modified' || newType === 'modified') && 'bg-accent/5'
                  );

                  const isDiffRow = (row.oldLine?.type && row.oldLine.type !== 'unchanged') || (row.newLine?.type && row.newLine.type !== 'unchanged');
                  const isActive = hasDiffs && state.splitRowIndices[activeDiffIndex] === index;
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
                      <td className={cn(
                        'px-2 py-1 border-r border-border text-right select-none text-[11px] text-text-muted font-mono leading-relaxed',
                        oldType === 'removed' && 'bg-error/10 text-error/80 border-r-error/30',
                        oldType === 'modified' && 'bg-accent/10 text-accent/80 border-r-accent/30'
                      )}>
                        {row.oldLine?.lineNumber ?? ''}
                      </td>
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
                      <td className={cn(
                        'px-2 py-1 border-r border-border text-right select-none text-[11px] text-text-muted font-mono leading-relaxed',
                        newType === 'added' && 'bg-success/10 text-success/80 border-r-success/30',
                        newType === 'modified' && 'bg-accent/10 text-accent/80 border-r-accent/30'
                      )}>
                        {row.newLine?.lineNumber ?? ''}
                      </td>
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
          <div className="w-full min-w-max">
            <table className="w-full border-collapse table-fixed min-w-[500px]">
              <thead>
                <tr className="border-b border-border bg-bg-secondary text-text-muted text-xs sticky top-0 z-10">
                  <th className="w-[45px] px-2 py-1.5 border-r border-border text-center font-normal bg-bg-secondary">Original</th>
                  <th className="w-[45px] px-2 py-1.5 border-r border-border text-center font-normal bg-bg-secondary">Modified</th>
                  <th className="px-4 py-1.5 text-left font-normal bg-bg-secondary">Content</th>
                </tr>
              </thead>
              <tbody>
                {state.unifiedLines.map((line, index) => {
                  const rowBgClass = cn(
                    line.type === 'added' && 'bg-success/5',
                    line.type === 'removed' && 'bg-error/5'
                  );
                  const isDiffLine = line.type !== 'unchanged';
                  const isActive = hasDiffs && state.diffLineIndices[activeDiffIndex] === index;

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
                      <td className={cn(
                        'px-2 py-1 border-r border-border text-right select-none text-[11px] text-text-muted font-mono leading-relaxed',
                        line.type === 'removed' && 'bg-error/10 text-error/80 border-r-error/30'
                      )}>
                        {line.lineNumberOld ?? ''}
                      </td>
                      <td className={cn(
                        'px-2 py-1 border-r border-border text-right select-none text-[11px] text-text-muted font-mono leading-relaxed',
                        line.type === 'added' && 'bg-success/10 text-success/80 border-r-success/30'
                      )}>
                        {line.lineNumberNew ?? ''}
                      </td>
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
  );

  return (
    <ToolLayout
      name="Diff Checker"
      description="Compare and highlight structural and word-level differences between two files or text snippets"
      category="Text"
    >
      <WorkspaceTabs
        workspaces={workspaces}
        activeId={activeWorkspaceId}
        onChange={setActiveWorkspaceId}
        onAdd={addWorkspace}
        onClose={removeWorkspace}
        onShare={copyShareLink}
      />
      <ExamplePills examples={examples} activeIndex={state.activeExample} onSelect={applyExample} />

      <div className="mt-6">
        <SplitPanesView
          toolbarContent={toolbarContent}
          leftPane={leftPaneStacked}
          rightPane={rightPaneDiff}
        />
      </div>
    </ToolLayout>
  );
}
