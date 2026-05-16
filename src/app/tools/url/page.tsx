'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { toast } from '@/components/ui/Toast';
const examples = [
  { label: 'URL w/ spaces', value: 'https://example.com/search?q=hello world&lang=en' },
  { label: 'Encoded URL', value: 'https%3A%2F%2Fexample.com%2Fpath%3Fkey%3Dhello%20world' },
  { label: 'Special chars', value: 'user@host:8080/path?a=1&b=2#section' },
];

export default function Page() {
  const [input, setInput] = React.useState(examples[0].value);
  const [output, setOutput] = React.useState('');
  const [activeExample, setActiveExample] = React.useState(0);

  const handleEncode = () => setOutput(encodeURIComponent(input));
  const handleDecode = () => {
    try { setOutput(decodeURIComponent(input)); }
    catch { toast({ type: 'error', message: 'Invalid URL encoding' }); }
  };

  React.useEffect(() => { if (input) handleEncode(); else setOutput(''); }, [input]);

  const applyExample = (i: number) => { setActiveExample(i); setInput(examples[i].value); };

  return (
    <ToolLayout name="URL Encoder / Decoder" description="Encode and decode URL components and query strings" category="Encoding">
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-base font-medium text-text-secondary">Input</h2>
          <Input value={input} onChange={(e) => { setInput(e.target.value); setActiveExample(-1); }} placeholder="Enter URL..." />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleEncode}>Encode</Button>
            <Button variant="secondary" onClick={handleDecode}>Decode</Button>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-base font-medium text-text-secondary">Output</h2>
          <Input value={output} readOnly />
          <CopyButton value={output} label="Copy" />
        </div>
      </div>
    </ToolLayout>
  );
}
