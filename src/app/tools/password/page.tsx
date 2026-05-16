'use client';

import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { CopyButton } from '@/components/ui/CopyButton';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { generatePassword, estimateStrength, PasswordOptions } from '@/tools/password/utils';
import { cn } from '@/lib/utils';

const examples = [
  { label: 'Standard', len: 16, upper: true, lower: true, numbers: true, symbols: false },
  { label: 'Strong', len: 24, upper: true, lower: true, numbers: true, symbols: true },
  { label: 'PIN', len: 6, upper: false, lower: false, numbers: true, symbols: false },
  { label: 'Passphrase', len: 32, upper: true, lower: true, numbers: true, symbols: true },
];

export default function Page() {
  const [input, setInput] = React.useState('');
  const [options, setOptions] = React.useState<PasswordOptions>({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: false });
  const [activeExample, setActiveExample] = React.useState(-1);

  const generate = React.useCallback(() => {
    setInput(generatePassword(options));
  }, [options]);

  React.useEffect(() => { generate(); }, [generate]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    const ex = examples[i];
    setOptions({ length: ex.len, uppercase: ex.upper, lowercase: ex.lower, numbers: ex.numbers, symbols: ex.symbols });
  };

  const toggle = (key: keyof PasswordOptions) => {
    if (key === 'length') return;
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
    setActiveExample(-1);
  };

  const charsetSize = (() => {
    let size = 0;
    if (options.lowercase) size += 26;
    if (options.uppercase) size += 26;
    if (options.numbers) size += 10;
    if (options.symbols) size += 24;
    return size;
  })();

  const strength = estimateStrength(options.length, charsetSize);

  return (
    <ToolLayout name="Password Generator" description="Generate strong, customisable passwords with configurable length and character sets" category="Security">
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="space-y-6 max-w-xl">
        {/* Generated password */}
        {input && (
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input value={input} readOnly className="font-mono text-lg tracking-wider pr-20" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button onClick={generate} className="p-1.5 text-text-muted hover:text-text-primary transition-colors" title="Regenerate">
                  <RefreshCw className="h-4 w-4" />
                </button>
                <CopyButton value={input} variant="ghost" size="sm" className="p-1.5" title="Copy" />
              </div>
            </div>
          </div>
        )}

        {/* Strength bar */}
        {charsetSize > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Strength:</span>
              <span className={cn('text-xs font-medium', strength.color)}>{strength.label}</span>
            </div>
            <div className="h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300 bg-accent" style={{ width: `${strength.score * 100}%` }} />
            </div>
          </div>
        )}

        {/* Options */}
        <div className="space-y-4 p-5 rounded-xl bg-bg-secondary border border-border">
          <h3 className="text-sm font-medium text-text-secondary">Options</h3>

          <div className="flex items-center gap-3">
            <label className="text-sm text-text-secondary w-24">Length:</label>
            <input type="range" min="4" max="128" value={options.length}
              onChange={(e) => { setOptions((p) => ({ ...p, length: parseInt(e.target.value) })); setActiveExample(-1); }}
              className="flex-1 accent-accent" />
            <span className="text-sm font-mono w-10 text-right text-text-primary">{options.length}</span>
          </div>

          <div className="flex flex-wrap gap-3">
            {([
              { key: 'uppercase' as const, label: 'A–Z' },
              { key: 'lowercase' as const, label: 'a–z' },
              { key: 'numbers' as const, label: '0–9' },
              { key: 'symbols' as const, label: '!@#$%' },
            ]).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={options[key]} onChange={() => toggle(key)}
                  className="w-4 h-4 rounded border-border bg-bg-tertiary accent-accent" />
                <span className="text-sm text-text-secondary">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>{charsetSize} characters in set</span>
          <span>·</span>
          <span>~{Math.round(Math.log2(charsetSize) * options.length)} bits of entropy</span>
        </div>
      </div>
    </ToolLayout>
  );
}
