'use client';

import * as React from 'react';
import { RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { Input } from '@/components/ui/Input';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { hashString, hashAlgorithms, HashAlgorithm } from '@/tools/hash/utils';
interface Example { label: string; algo: HashAlgorithm; input: string; }

const examples: Example[] = [
  { label: 'Password', algo: 'SHA-256', input: 'password123' },
  { label: 'Quick brown fox', algo: 'SHA-256', input: 'The quick brown fox jumps over the lazy dog' },
  { label: 'API secret (SHA-512)', algo: 'SHA-512', input: 'my-super-secret-api-key-2024' },
];

export default function Page() {
  const [input, setInput] = React.useState(examples[0].input);
  const [hash, setHash] = React.useState('');
  const [algorithm, setAlgorithm] = React.useState<HashAlgorithm>(examples[0].algo);
  const [error, setError] = React.useState<string | null>(null);
  const [activeExample, setActiveExample] = React.useState(0);

  React.useEffect(() => {
    if (!input.trim()) { setHash(''); setError(null); return; }
    hashString(algorithm, input)
      .then(result => { setHash(result); setError(null); })
      .catch(err => { setError((err as Error).message); setHash(''); });
  }, [input, algorithm]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    setAlgorithm(examples[i].algo);
    setInput(examples[i].input);
  };

  return (
    <ToolLayout name="Hash Generator" description="Generate SHA-256 & SHA-512 hashes securely via the Web Crypto API" category="Security">
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-text-secondary">Input Text</h2>
          <Button variant="ghost" size="sm" onClick={() => { setInput(''); setHash(''); setError(null); setActiveExample(-1); }}
            icon={<RotateCcw className="h-4 w-4" />}>Clear</Button>
        </div>

        <Input value={input} onChange={(e) => { setInput(e.target.value); setActiveExample(-1); }}
          placeholder="Enter text to hash..." className="min-h-[120px]" />

        <div className="space-y-3">
          <label className="text-sm text-text-secondary">Algorithm</label>
          <div className="flex flex-wrap gap-2">
            {hashAlgorithms.slice(2).map(a => (
              <Button key={a.id} variant={algorithm === a.id ? 'primary' : 'secondary'} size="sm"
                onClick={() => setAlgorithm(a.id)}>
                {a.name}
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-error/10 text-error border border-error/30">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {hash && (
          <div className="space-y-3">
            <h2 className="text-base font-medium text-text-secondary">Hash Output</h2>
            <div className="relative">
              <Input value={hash} readOnly className="font-mono text-sm pr-20" />
              <CopyButton value={hash} label="Copy" className="absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" />
              <span className="text-xs text-text-muted">{hash.length} characters · {algorithm}</span>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
