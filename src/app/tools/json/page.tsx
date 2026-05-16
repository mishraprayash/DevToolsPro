'use client';

import * as React from 'react';
import { Download, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { JsonViewer } from '@/components/ui/JsonViewer';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { processJson, validateJson, JsonAction } from '@/tools/json/utils';
import { cn } from '@/lib/utils';

const actions: { value: JsonAction; label: string }[] = [
  { value: 'beautify', label: 'Beautify' },
  { value: 'minify', label: 'Minify' },
  { value: 'sort', label: 'Sort Keys' }
];

const indentOptions = [
  { value: '2', label: '2 spaces' },
  { value: '4', label: '4 spaces' },
];

interface Example {
  label: string;
  action: JsonAction;
  input: string;
}

const examples: Example[] = [
  {
    label: 'User object',
    action: 'beautify',
    input: '{"name":"Alice","age":30,"address":{"city":"New York","zip":"10001"},"tags":["admin","user"]}',
  },
  {
    label: 'Sort keys',
    action: 'sort',
    input: '{"zebra":1,"apple":2,"mango":3,"banana":4}',
  },
  {
    label: 'Minify',
    action: 'minify',
    input: '{\n  "id": 1,\n  "product": "Widget",\n  "price": 9.99,\n  "inStock": true\n}',
  }
];

export default function Page() {
  const [input, setInput] = React.useState(examples[0].input);
  const [output, setOutput] = React.useState('');
  const [action, setAction] = React.useState<JsonAction>(examples[0].action);
  const [indent, setIndent] = React.useState('2');
  const [error, setError] = React.useState<string | null>(null);
  const [activeExample, setActiveExample] = React.useState(0);

  const handleProcess = React.useCallback(() => {
    if (!input.trim()) { setOutput(''); setError(null); return; }
    try {
      setOutput(processJson(input, action, parseInt(indent, 10)));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  }, [input, action, indent]);

  React.useEffect(() => {
    const t = setTimeout(handleProcess, 100);
    return () => clearTimeout(t);
  }, [handleProcess]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    setAction(examples[i].action);
    setInput(examples[i].input);
    setError(null);
  };

  const handleClear = () => { setInput(''); setOutput(''); setError(null); };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'formatted.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const validation = input.trim() ? validateJson(input) : null;

  return (
    <ToolLayout name="JSON Beautifier & Validator" description="Format, minify, sort keys, and validate JSON data" category="Formatting">
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">Input</h2>
            <Button variant="ghost" size="sm" onClick={handleClear} icon={<RotateCcw className="h-4 w-4" />}>Clear</Button>
          </div>

          <Input value={input} onChange={(e) => { setInput(e.target.value); setActiveExample(-1); }} placeholder='{"key": "value"}' className='min-h-[280px]' monospace />

          <div className="flex items-center gap-4">
            <Select label="Action" options={actions} value={action} onChange={(e) => setAction(e.target.value as JsonAction)} />
            {action === 'beautify' && (
              <Select label="Indent" options={indentOptions} value={indent} onChange={(e) => setIndent(e.target.value)} />
            )}
          </div>

          {validation && !error && (
            <div className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm',
              validation.valid
                ? 'bg-success/10 text-success border border-success/30'
                : 'bg-error/10 text-error border border-error/30'
            )}>
              {validation.valid
                ? <><CheckCircle className="h-4 w-4" /><span>Valid JSON</span></>
                : <><AlertCircle className="h-4 w-4" /><span>{validation.error}</span></>}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">Output</h2>
            <div className="flex items-center gap-2">
              <CopyButton value={output} label="Copy" disabled={!output} />
              <Button variant="ghost" size="sm" onClick={handleDownload} disabled={!output} icon={<Download className="h-4 w-4" />}>Download</Button>
            </div>
          </div>
          <JsonViewer value={output} maxHeight="480px" minHeight="240px" />
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>{output.length.toLocaleString()} chars</span>
            <span>·</span>
            <span>{output.split('\n').length.toLocaleString()} lines</span>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
