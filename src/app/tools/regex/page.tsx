'use client';

import * as React from 'react';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { testRegex, RegexMatch } from '@/tools/regex/utils';
import { cn } from '@/lib/utils';

interface Example { label: string; pattern: string; flags: string; testString: string; }

const examples: Example[] = [
  {
    label: 'Email addresses',
    pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.]+',
    flags: 'g',
    testString: 'Contact alice@example.com or support@devtools.pro for help.',
  },
  {
    label: 'Extract numbers',
    pattern: '\\d+',
    flags: 'g',
    testString: 'Order #1042 has 3 items totalling $49.99 with 2 discounts.',
  },
  {
    label: 'Hex colours',
    pattern: '#[0-9a-fA-F]{3,6}',
    flags: 'gi',
    testString: 'Colors: #fff, #22d3ee, #3f3f46, #A855F7',
  },
  {
    label: 'IPv4 address',
    pattern: '^(\\d{1,3}\\.){3}\\d{1,3}$',
    flags: '',
    testString: '192.168.1.1',
  },
];

export default function Page() {
  const [pattern, setPattern] = React.useState(examples[0].pattern);
  const [testString, setTestString] = React.useState(examples[0].testString);
  const [flags, setFlags] = React.useState(examples[0].flags);
  const [result, setResult] = React.useState<{ matches: RegexMatch[]; isValid: boolean; error?: string }>({ matches: [], isValid: true });
  const [activeExample, setActiveExample] = React.useState(0);

  React.useEffect(() => {
    setResult(testRegex(pattern, flags, testString));
  }, [pattern, flags, testString]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    setPattern(examples[i].pattern);
    setFlags(examples[i].flags);
    setTestString(examples[i].testString);
  };

  const renderMatches = () => {
    if (!result.matches.length) return <span>{testString}</span>;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    result.matches.forEach((m, i) => {
      if (m.index > lastIndex) parts.push(<span key={`t${i}`}>{testString.slice(lastIndex, m.index)}</span>);
      parts.push(<mark key={`m${i}`} className="bg-accent/30 text-accent rounded-sm">{m.text}</mark>);
      lastIndex = m.index + m.text.length;
    });
    if (lastIndex < testString.length) parts.push(<span key="end">{testString.slice(lastIndex)}</span>);
    return <>{parts}</>;
  };

  const toggleFlag = (f: string) => setFlags(flags.includes(f) ? flags.replace(f, '') : flags + f);

  return (
    <ToolLayout name="Regex Tester" description="Test regular expressions with live match highlighting and group capture" category="Text">
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">Pattern</h2>
            <Button variant="ghost" size="sm" onClick={() => { setPattern(''); setTestString(''); setActiveExample(-1); }}
              icon={<RotateCcw className="h-4 w-4" />}>Clear</Button>
          </div>
          <Input value={pattern} onChange={(e) => { setPattern(e.target.value); setActiveExample(-1); }} placeholder="Enter regex pattern..." monospace />
          {!result.isValid && result.error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-error/10 text-error border border-error/30">
              <AlertCircle className="h-5 w-5" /><span className="text-sm">{result.error}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Flags:</span>
            {['g', 'i', 'm', 's'].map(f => (
              <button key={f} onClick={() => toggleFlag(f)}
                className={cn('px-2.5 py-1 text-xs rounded-lg border font-mono transition-all',
                  flags.includes(f) ? 'bg-accent text-bg-primary border-accent' : 'bg-bg-tertiary border-border text-text-secondary hover:border-border-hover'
                )}>
                {f}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Test String</label>
            <Input value={testString} onChange={(e) => { setTestString(e.target.value); setActiveExample(-1); }} placeholder="Enter test string..." monospace />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-medium text-text-secondary">
            Results <span className="text-text-muted font-normal">({result.matches.length} match{result.matches.length !== 1 ? 'es' : ''})</span>
          </h2>
          <div className="p-4 rounded-lg bg-bg-tertiary text-sm font-mono whitespace-pre-wrap min-h-[100px] leading-relaxed">
            {testString ? renderMatches() : <span className="text-text-muted">Enter a test string...</span>}
          </div>
          {result.matches.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {result.matches.map((m, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-tertiary text-sm">
                  <span className="text-text-muted tabular-nums w-5 text-right">{i + 1}</span>
                  <code className="text-accent font-mono">{m.text}</code>
                  <span className="text-text-muted text-xs ml-auto">index {m.index}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
