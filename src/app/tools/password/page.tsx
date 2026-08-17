'use client';

import * as React from 'react';
import { RefreshCw, ShieldCheck, Clock, Key, AlignLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { CopyButton } from '@/components/ui/CopyButton';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { generatePassword, calculateEntropy, type PasswordOptions } from '@/tools/password/utils';
import { cn } from '@/lib/utils';

const examples = [
  { label: 'Standard (16 chars)', mode: 'random' as const, len: 16, upper: true, lower: true, numbers: true, symbols: false, amb: false },
  { label: 'Ultra Secure (32 chars)', mode: 'random' as const, len: 32, upper: true, lower: true, numbers: true, symbols: true, amb: false },
  { label: 'PIN (6 digits)', mode: 'random' as const, len: 6, upper: false, lower: false, numbers: true, symbols: false, amb: false },
  { label: 'Memorable Passphrase', mode: 'passphrase' as const, words: 4, sep: '-', len: 24, upper: false, lower: true, numbers: false, symbols: false, amb: false },
];

export default function Page() {
  const [input, setInput] = React.useState('');
  const [options, setOptions] = React.useState<PasswordOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false,
    excludeAmbiguous: false,
    mode: 'random',
    wordCount: 4,
    separator: '-',
  });
  const [activeExample, setActiveExample] = React.useState(-1);

  const generate = React.useCallback(() => {
    setInput(generatePassword(options));
  }, [options]);

  React.useEffect(() => {
    generate();
  }, [generate]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    const ex = examples[i];
    setOptions((prev) => ({
      ...prev,
      mode: ex.mode,
      length: ex.len,
      uppercase: ex.upper,
      lowercase: ex.lower,
      numbers: ex.numbers,
      symbols: ex.symbols,
      excludeAmbiguous: ex.amb,
      wordCount: ex.words || 4,
      separator: ex.sep || '-',
    }));
  };

  const entropy = React.useMemo(() => calculateEntropy(input), [input]);

  return (
    <ToolLayout
      name="Password & Passphrase Generator"
      description="Generate cryptographically secure random passwords or memorable Diceware passphrases with entropy analysis."
      category="Security"
    >
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="space-y-6 max-w-2xl">
        {/* Output */}
        {input && (
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input value={input} readOnly className="font-mono text-lg tracking-wider pr-24 py-3.5" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={generate}
                  className="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors"
                  title="Regenerate"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <CopyButton value={input} variant="ghost" size="sm" className="p-2" title="Copy" />
              </div>
            </div>
          </div>
        )}

        {/* Strength & Entropy Banner */}
        <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-sm text-text-primary">
              <ShieldCheck className={cn('h-4 w-4', entropy.color)} />
              <span>Security Level:</span>
              <span className={cn('font-bold', entropy.color)}>{entropy.label}</span>
            </div>
            <span className="text-xs font-mono text-text-secondary">{entropy.bits} bits of entropy</span>
          </div>

          <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-300', {
                'bg-red-500': entropy.score <= 0.25,
                'bg-amber-500': entropy.score === 0.5,
                'bg-emerald-500': entropy.score === 0.75,
                'bg-cyan-400': entropy.score === 1.0,
              })}
              style={{ width: `${Math.max(5, entropy.score * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-text-secondary pt-1 border-t border-border/50 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-accent" /> Est. Time to Crack:
            </span>
            <span className="font-semibold text-text-primary">{entropy.timeToCrack}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="p-5 rounded-xl bg-bg-secondary border border-border space-y-5">
          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-bg-tertiary p-1 border border-border/60">
            <button
              onClick={() => {
                setOptions((p) => ({ ...p, mode: 'random' }));
                setActiveExample(-1);
              }}
              className={cn(
                'flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5',
                options.mode === 'random' ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Key className="h-3.5 w-3.5" /> Random Password
            </button>
            <button
              onClick={() => {
                setOptions((p) => ({ ...p, mode: 'passphrase' }));
                setActiveExample(-1);
              }}
              className={cn(
                'flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5',
                options.mode === 'passphrase' ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <AlignLeft className="h-3.5 w-3.5" /> Diceware Passphrase
            </button>
          </div>

          {options.mode === 'random' ? (
            <>
              <div className="flex items-center gap-3">
                <label className="text-sm text-text-secondary w-28">Length ({options.length}):</label>
                <input
                  type="range"
                  min="6"
                  max="64"
                  value={options.length}
                  onChange={(e) => {
                    setOptions((p) => ({ ...p, length: parseInt(e.target.value) }));
                    setActiveExample(-1);
                  }}
                  className="flex-1 accent-accent"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[
                  { key: 'uppercase' as const, label: 'Uppercase (A-Z)' },
                  { key: 'lowercase' as const, label: 'Lowercase (a-z)' },
                  { key: 'numbers' as const, label: 'Numbers (0-9)' },
                  { key: 'symbols' as const, label: 'Symbols (!@#$)' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary">
                    <input
                      type="checkbox"
                      checked={options[key]}
                      onChange={() => {
                        setOptions((p) => ({ ...p, [key]: !p[key] }));
                        setActiveExample(-1);
                      }}
                      className="w-4 h-4 rounded border-border bg-bg-tertiary accent-accent"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <div className="pt-2 border-t border-border/50">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary">
                  <input
                    type="checkbox"
                    checked={options.excludeAmbiguous}
                    onChange={(e) => {
                      setOptions((p) => ({ ...p, excludeAmbiguous: e.target.checked }));
                      setActiveExample(-1);
                    }}
                    className="w-4 h-4 rounded border-border bg-bg-tertiary accent-accent"
                  />
                  <span>Exclude Ambiguous Characters (e.g. 1, l, I, 0, O)</span>
                </label>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm text-text-secondary w-32">Word Count ({options.wordCount}):</label>
                <input
                  type="range"
                  min="3"
                  max="8"
                  value={options.wordCount || 4}
                  onChange={(e) => {
                    setOptions((p) => ({ ...p, wordCount: parseInt(e.target.value) }));
                    setActiveExample(-1);
                  }}
                  className="flex-1 accent-accent"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm text-text-secondary w-32">Separator:</label>
                <div className="flex gap-2">
                  {['-', '.', '_', ' ', '#'].map((sep) => (
                    <button
                      key={sep}
                      onClick={() => {
                        setOptions((p) => ({ ...p, separator: sep }));
                        setActiveExample(-1);
                      }}
                      className={cn(
                        'px-3 py-1 rounded border text-xs font-mono font-bold transition-colors',
                        options.separator === sep
                          ? 'bg-accent/15 border-accent text-accent'
                          : 'border-border text-text-secondary hover:text-text-primary'
                      )}
                    >
                      {sep === ' ' ? 'Space' : sep}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
