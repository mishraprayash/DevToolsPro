'use client';

import * as React from 'react';
import { Input } from '@/components/ui/Input';
import { CopyButton } from '@/components/ui/CopyButton';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { convertNumber, formatLabel, NumberBase } from '@/tools/number-base/utils';
import { cn } from '@/lib/utils';

const examples = [
  { label: 'Decimal 255', value: '255', base: 'decimal' as NumberBase },
  { label: 'Hex FF', value: 'FF', base: 'hex' as NumberBase },
  { label: 'Binary 1010', value: '1010', base: 'binary' as NumberBase },
  { label: 'Octal 777', value: '777', base: 'octal' as NumberBase },
];

const bases: { value: NumberBase; label: string }[] = [
  { value: 'decimal', label: 'DEC' },
  { value: 'hex', label: 'HEX' },
  { value: 'binary', label: 'BIN' },
  { value: 'octal', label: 'OCT' },
];

export default function Page() {
  const [input, setInput] = React.useState(examples[0].value);
  const [from, setFrom] = React.useState<NumberBase>('decimal');
  const [activeExample, setActiveExample] = React.useState(0);

  const result = React.useMemo(() => convertNumber(input, from), [input, from]);

  return (
    <ToolLayout name="Number Base Converter" description="Convert between decimal, hexadecimal, binary and octal number systems" category="Encoding">
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={(i) => { setActiveExample(i); setFrom(examples[i].base); setInput(examples[i].value); }} />

      <div className="max-w-xl space-y-6">
        {/* Input */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted">From:</span>
            <span className="text-xs text-text-secondary">{formatLabel(from)}</span>
          </div>
          <div className="flex items-center gap-3">
            <Input value={input} onChange={(e) => { setInput(e.target.value); setActiveExample(-1); }}
              placeholder={from === 'decimal' ? '42' : from === 'hex' ? '2A' : from === 'binary' ? '101010' : '52'}
              monospace />
            <select value={from} onChange={(e) => { setFrom(e.target.value as NumberBase); setActiveExample(-1); }}
              className="h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent">
              {bases.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-2">
          <h2 className="text-base font-medium text-text-secondary">Results</h2>
          {result.error ? (
            <div className="p-4 rounded-xl bg-error/10 text-error border border-error/30 text-sm">{result.error}</div>
          ) : (
            <div className="space-y-2">
              {bases.filter((b) => b.value !== from).map(({ value, label }) => {
                const val = result[value as keyof typeof result] as string;
                return (
                  <CopyButton key={value} value={val} variant="ghost" className="w-full flex items-center justify-between p-4 rounded-xl bg-bg-tertiary border border-border hover:bg-bg-hover transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border',
                        value === 'hex' ? 'text-amber-500 border-amber-500/30 bg-amber-500/10' :
                        value === 'binary' ? 'text-cyan-500 border-cyan-500/30 bg-cyan-500/10' :
                        value === 'octal' ? 'text-purple-500 border-purple-500/30 bg-purple-500/10' :
                        'text-green-500 border-green-500/30 bg-green-500/10'
                      )}>{label}</span>
                      <span className="text-sm font-mono text-text-primary">{val}</span>
                    </div>
                  </CopyButton>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
