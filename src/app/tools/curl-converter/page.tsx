'use client';

import * as React from 'react';
import { RotateCcw, Settings, Globe, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { GradientBox } from '@/components/ui/GradientBox';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { convertCurl, inspectCurl, type TargetLanguage, type CurlDetails } from '@/tools/curl-converter/utils';
import { HistoryDrawer } from '@/components/tool/HistoryDrawer';
import { useAppStore, type HistoryItem } from '@/lib/store/useStore';

const languageOptions = [
  { value: 'javascript-fetch', label: 'JavaScript (Fetch)' },
  { value: 'javascript-axios', label: 'JavaScript (Axios)' },
  { value: 'javascript-xhr', label: 'JavaScript (Browser XHR)' },
  { value: 'python', label: 'Python (Requests)' },
  { value: 'python-httpx', label: 'Python (HTTPX)' },
  { value: 'go', label: 'Go (net/http)' },
  { value: 'rust', label: 'Rust (reqwest)' },
  { value: 'csharp', label: 'C# (HttpClient)' },
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
  const [curlDetails, setCurlDetails] = React.useState<CurlDetails>({ url: '', method: 'GET', headers: {}, hasBody: false });
  const { addHistoryItem } = useAppStore();

  const handleProcess = React.useCallback(async () => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      setCurlDetails({ url: '', method: 'GET', headers: {}, hasBody: false });
      return;
    }

    try {
      const details = await inspectCurl(input);
      setCurlDetails(details);

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
      description="Convert cURL commands into production-grade code for JavaScript, Python, Go, Rust, C#, PHP, Java, and Ruby." 
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
            className="min-h-[220px]" 
            error={error || undefined}
          />

          {/* Parsed details badge */}
          {curlDetails.url && (
            <div className="p-3.5 rounded-xl border border-border bg-bg-tertiary/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-primary flex items-center gap-1.5 font-outfit">
                  <Globe className="h-3.5 w-3.5 text-blue-400" /> Inspected Request
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-accent/15 text-accent border border-accent/20">
                  {curlDetails.method}
                </span>
              </div>
              <p className="font-mono text-text-secondary truncate">{curlDetails.url}</p>
              {Object.keys(curlDetails.headers).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Object.entries(curlDetails.headers).map(([k, v]) => (
                    <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bg-secondary border border-border text-[11px] font-mono text-text-secondary">
                      <Tag className="h-3 w-3 text-purple-400" />
                      <strong className="text-text-primary">{k}:</strong> {v}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary font-outfit border-b border-border pb-2.5">
              <Settings className="h-4 w-4 text-accent" />
              <span>Conversion Target</span>
            </div>
            <div className="w-full">
              <Select
                label="Target Language & Library"
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

          <GradientBox value={output} placeholder="Generated code will appear here..." className="min-h-[380px]" />
        </div>
      </div>
    </ToolLayout>
  );
}
