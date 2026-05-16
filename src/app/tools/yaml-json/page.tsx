'use client';

import * as React from 'react';
import { RotateCcw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { GradientBox } from '@/components/ui/GradientBox';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { jsonToYaml, yamlToJson } from '@/tools/yaml-json/utils';
import { cn } from '@/lib/utils';

const examples = [
  {
    label: 'JSON → YAML',
    input: '{"name":"Alice","age":30,"roles":["admin","user"],"active":true,"address":{"city":"NYC","zip":"10001"}}',
    mode: 'json' as const,
  },
  {
    label: 'YAML → JSON',
    input: 'name: Bob\nage: 25\nroles:\n  - editor\n  - viewer\nactive: false\naddress:\n  city: London\n  zip: EC1A',
    mode: 'yaml' as const,
  }
];

export default function Page() {
  const [input, setInput] = React.useState(examples[0].input);
  const [output, setOutput] = React.useState('');
  const [mode, setMode] = React.useState<'json' | 'yaml'>('json');
  const [activeExample, setActiveExample] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const handleProcess = React.useCallback(() => {
    if (!input.trim()) { setOutput(''); setError(null); return; }
    try {
      const result = mode === 'json' ? jsonToYaml(input) : yamlToJson(input);
      setOutput(result);
      setError(result.startsWith('Invalid') ? result : null);
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  }, [input, mode]);

  React.useEffect(() => { const t = setTimeout(handleProcess, 150); return () => clearTimeout(t); }, [handleProcess]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    setMode(examples[i].mode);
    setInput(examples[i].input);
    setError(null);
  };

  const handleClear = () => { setInput(''); setOutput(''); setError(null); };
  const handleSwap = () => {
    if (!output || output.startsWith('Invalid')) return;
    setMode((m) => m === 'json' ? 'yaml' : 'json');
    setInput(output);
    setOutput('');
    setError(null);
  };

  return (
    <ToolLayout name="YAML ↔ JSON Converter" description="Convert between YAML and JSON formats bidirectionally" category="Formatting">
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium text-text-secondary">Input</h2>
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium border',
                mode === 'json' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30'
              )}>{mode === 'json' ? 'JSON' : 'YAML'}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClear} icon={<RotateCcw className="h-4 w-4" />}>Clear</Button>
          </div>
          <Input value={input} onChange={(e) => { setInput(e.target.value); setActiveExample(-1); }} placeholder={mode === 'json' ? '{"key": "value"}' : 'key: value'} monospace className="min-h-[200px]" />
          {error && (
            <div className="px-4 py-3 rounded-lg bg-error/10 text-error border border-error/30 text-sm">{error}</div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium text-text-secondary">Output</h2>
              <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium border',
                mode === 'yaml' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30'
              )}>{mode === 'yaml' ? 'JSON' : 'YAML'}</span>
            </div>
            <CopyButton value={output} label="Copy" disabled={!output} />
          </div>
          <GradientBox value={output} />
          <span className="text-xs text-text-muted">{output.length.toLocaleString()} characters</span>
        </div>
      </div>
    </ToolLayout>
  );
}
