'use client';

import * as React from 'react';
import { RotateCcw, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { generateBulkUuids, type UuidOptions } from '@/tools/uuid/utils';
import { cn } from '@/lib/utils';

const versionOptions = [
  { value: '4', label: 'UUID v4 (Cryptographically Random)' },
  { value: '7', label: 'UUID v7 (Time-Ordered / Sortable)' },
  { value: '1', label: 'UUID v1 (Gregorian Timestamp)' },
];

const bracketOptions = [
  { value: 'none', label: 'None (Standard)' },
  { value: 'curly', label: 'Curly Braces {...}' },
  { value: 'parentheses', label: 'Parentheses (...)' },
];

export default function Page() {
  const [count, setCount] = React.useState<number>(10);
  const [version, setVersion] = React.useState<'1' | '4' | '7'>('4');
  const [casing, setCasing] = React.useState<'lower' | 'upper'>('lower');
  const [brackets, setBrackets] = React.useState<'none' | 'curly' | 'parentheses'>('none');
  const [noHyphens, setNoHyphens] = React.useState<boolean>(false);
  
  const [uuids, setUuids] = React.useState<string[]>([]);

  const handleGenerate = React.useCallback(() => {
    const options: UuidOptions = {
      version: parseInt(version, 10) as 1 | 4 | 7,
      casing,
      brackets,
      noHyphens,
    };
    const list = generateBulkUuids(count, options);
    setUuids(list);
  }, [count, version, casing, brackets, noHyphens]);

  React.useEffect(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleClear = () => {
    setCount(10);
    setVersion('4');
    setCasing('lower');
    setBrackets('none');
    setNoHyphens(false);
  };

  const handleCopyAll = () => {
    if (uuids.length === 0) return;
    navigator.clipboard.writeText(uuids.join('\n'));
  };


  return (
    <ToolLayout
      name="UUID / GUID Generator"
      description="Bulk generate cryptographically secure UUID v4, v7, or v1 identifiers with advanced casing, hyphen, and bracket formatting"
      category="Text"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Configurations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">Generator Options</h2>
            <Button variant="ghost" size="sm" onClick={handleClear} icon={<RotateCcw className="h-4 w-4" />}>
              Reset
            </Button>
          </div>

          <div className="p-5 rounded-xl border border-border bg-bg-secondary space-y-4">
            <Select
              label="UUID Specification Version"
              options={versionOptions}
              value={version}
              onChange={(e) => setVersion(e.target.value as any)}
            />

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Generation Count (1 - 500)</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={count}
                  onChange={(e) => setCount(Math.min(500, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                  className="w-24 h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-text-primary text-center font-semibold focus:outline-none focus:border-accent text-sm"
                />
                
                <div className="flex flex-wrap gap-1.5 flex-1 select-none">
                  {[1, 5, 20, 100, 500].map((n) => (
                    <button
                      key={n}
                      onClick={() => setCount(n)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200',
                        count === n
                          ? 'bg-accent text-white border-accent shadow-sm'
                          : 'bg-bg-tertiary text-text-secondary border-border hover:border-border-hover hover:text-text-primary'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Select
              label="Brackets Wrap"
              options={bracketOptions}
              value={brackets}
              onChange={(e) => setBrackets(e.target.value as any)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">Casing</label>
                <div className="flex gap-2">
                  {(['lower', 'upper'] as const).map((caseType) => (
                    <button
                      key={caseType}
                      onClick={() => setCasing(caseType)}
                      className={cn(
                        'flex-1 h-9 rounded-lg border text-xs font-semibold capitalize transition-all duration-200',
                        casing === caseType
                          ? 'border-accent bg-accent/10 text-accent font-bold'
                          : 'border-border bg-bg-tertiary text-text-secondary hover:text-text-primary'
                      )}
                    >
                      {caseType}case
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-end pb-1.5 select-none">
                <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noHyphens}
                    onChange={(e) => setNoHyphens(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-bg-tertiary cursor-pointer transition-all"
                  />
                  <span>Strip hyphens (Raw)</span>
                </label>
              </div>
            </div>
          </div>

          <Button onClick={handleGenerate} className="w-full h-12 text-sm font-semibold" icon={<RefreshCw className="h-4 w-4" />}>
            Generate Brand New Bulk UUIDs
          </Button>
        </div>

        {/* Right Output list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">
              Generated Identifiers <span className="text-xs text-text-muted font-mono">({uuids.length})</span>
            </h2>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopyAll} icon={<Copy className="h-4 w-4" />}>
                Copy All
              </Button>
            </div>
          </div>

          <div className="border border-border rounded-xl bg-bg-tertiary overflow-hidden shadow-sm">
            <div className="max-h-[460px] overflow-y-auto divide-y divide-border/60 font-mono text-sm leading-relaxed p-1.5 space-y-1.5">
              {uuids.map((uuid, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-bg-secondary hover:bg-bg-hover border border-border/40 group transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <span className="text-xs text-text-muted select-none shrink-0 w-8 text-right font-semibold">
                      {i + 1}
                    </span>
                    <span className="tabular-nums truncate font-bold text-text-primary select-all">
                      {uuid}
                    </span>
                  </div>
                  
                  <CopyButton value={uuid} size="sm" className="opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
