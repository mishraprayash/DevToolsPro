'use client';

import * as React from 'react';
import { RotateCcw, ArrowRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { GradientBox } from '@/components/ui/GradientBox';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { convertCurl, type TargetLanguage } from '@/tools/curl-converter/utils';
import { cn } from '@/lib/utils';
import { HistoryDrawer } from '@/components/tool/HistoryDrawer';
import { useAppStore, type HistoryItem } from '@/lib/store/useStore';

const languageOptions = [
  { value: 'javascript-fetch', label: 'JavaScript (Fetch)' },
  { value: 'javascript-axios', label: 'JavaScript (Axios)' },
  { value: 'python', label: 'Python (Requests)' },
  { value: 'go', label: 'Go (net/http)' },
  { value: 'rust', label: 'Rust (reqwest)' },
  { value: 'php', label: 'PHP (cURL)' },
  { value: 'java', label: 'Java (HttpClient)' },
  { value: 'ruby', label: 'Ruby (net/http)' },
];

const examples = [
  {
    label: 'Basic GET',
    input: `curl https://api.example.com/users`,
  },
  {
    label: 'POST with JSON',
    input: `curl -X POST https://api.example.com/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@test.com", "password":"123"}'`,
  },
  {
    label: 'Bearer Auth',
    input: `curl -H "Authorization: Bearer my-token" https://api.example.com/secure`,
  }
];

export default function Page() {
  const [input, setInput] = React.useState(examples[1].input);
  const [output, setOutput] = React.useState('');
  const [targetLang, setTargetLang] = React.useState<TargetLanguage>('javascript-fetch');
  const [activeExample, setActiveExample] = React.useState(1);
  const [error, setError] = React.useState<string | null>(null);
  const { addHistoryItem } = useAppStore();

  const handleProcess = React.useCallback(async () => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      const result = await convertCurl(input, targetLang);
      if (result.success && result.code) {
        setOutput(result.code);
        setError(null);
        addHistoryItem('curl-converter', input.slice(0, 1000), result.code.slice(0, 1000), { targetLang });
      } else {
        setOutput('');
        setError(result.error || 'Conversion failed');
      }
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  }, [input, targetLang, addHistoryItem]);

  React.useEffect(() => {
    const t = setTimeout(handleProcess, 150);
    return () => clearTimeout(t);
  }, [handleProcess]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    setInput(examples[i].input);
    setError(null);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
    setActiveExample(-1);
  };

  const handleRestore = (item: HistoryItem) => {
    setInput(item.input);
    if (item.metadata?.targetLang) {
      setTargetLang(item.metadata.targetLang as TargetLanguage);
    }
  };

  return (
    <ToolLayout 
      name="cURL Converter" 
      description="Convert cURL commands into equivalent code for Fetch, Axios, Python, Go, Rust, and more natively in your browser." 
      category="Encoding"
      historyComponent={<HistoryDrawer toolId="curl-converter" onRestore={handleRestore} />}
    >
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side */}
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">cURL Command</h2>
            <Button variant="ghost" size="sm" onClick={handleClear} icon={<RotateCcw className="h-4 w-4" />}>
              Clear
            </Button>
          </div>

          <Input 
            value={input} 
            onChange={(e) => { 
              setInput(e.target.value); 
              setActiveExample(-1); 
            }}
            onDropText={(text) => {
              setInput(text);
              setActiveExample(-1);
            }}
            placeholder={'curl https://api.example.com/'} 
            monospace 
            className="min-h-[260px]" 
            error={error || undefined}
          />

          <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary font-outfit border-b border-border pb-2.5">
              <Settings className="h-4 w-4 text-accent" />
              <span>Conversion Settings</span>
            </div>
            <div className="w-full">
              <Select
                label="Target Language"
                options={languageOptions}
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value as TargetLanguage)}
              />
            </div>
          </div>
        </div>

        {/* Right Side Outputs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent font-bold">
                Generated Code
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <CopyButton value={output} disabled={!output} />
            </div>
          </div>

          <GradientBox value={output} placeholder="Generated code will appear here..." className="min-h-[360px]" />
        </div>
      </div>
    </ToolLayout>
  );
}
