'use client';

import * as React from 'react';
import { RotateCcw, ArrowRight, Settings, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { GradientBox } from '@/components/ui/GradientBox';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import {
  jsonToYaml,
  yamlToJson,
  validateYaml
} from '@/tools/yaml-json/utils';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

import { HistoryDrawer } from '@/components/tool/HistoryDrawer';
import { useAppStore, type HistoryItem } from '@/lib/store/useStore';

const indentOptions = [
  { value: '2', label: '2 Spaces' },
  { value: '4', label: '4 Spaces' },
];

const examples = [
  {
    label: 'JSON → YAML (User Config)',
    input: `{
  "name": "Alice Smith",
  "age": 30,
  "roles": ["admin", "developer"],
  "active": true,
  "address": {
    "city": "New York",
    "zip": "10001"
  },
  "metadata": null
}`,
    mode: 'json' as const,
  },
  {
    label: 'YAML → JSON (K8s Service)',
    input: `apiVersion: v1
kind: Service
metadata:
  name: my-app-service
  labels:
    app: my-app
spec:
  type: ClusterIP
  selector:
    app: my-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 9376`,
    mode: 'yaml' as const,
  }
];

export default function Page() {
  const [input, setInput] = React.useState(examples[0].input);
  const [output, setOutput] = React.useState('');
  const [mode, setMode] = React.useState<'json' | 'yaml'>('json');
  const [indent, setIndent] = React.useState('2');
  const [activeExample, setActiveExample] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const { addHistoryItem } = useAppStore();

  const [validation, setValidation] = React.useState<any>(null);

  React.useEffect(() => {
    let active = true;
    if (!input.trim() || mode !== 'yaml') {
      setValidation(null);
      return;
    }
    validateYaml(input).then(res => {
      if (active) setValidation(res);
    });
    return () => { active = false; };
  }, [input, mode]);

  const handleProcess = React.useCallback(async () => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      const result = mode === 'json' 
        ? await jsonToYaml(input, { indent: parseInt(indent, 10) }) 
        : await yamlToJson(input);
      
      setOutput(result);
      setError(result.startsWith('Invalid') ? result : null);

      if (!result.startsWith('Invalid')) {
        addHistoryItem('yaml-json', input.slice(0, 1000), result.slice(0, 1000), { mode });
      }
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  }, [input, mode, indent, addHistoryItem]);

  React.useEffect(() => {
    const t = setTimeout(handleProcess, 100);
    return () => clearTimeout(t);
  }, [handleProcess]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    setMode(examples[i].mode);
    setInput(examples[i].input);
    setError(null);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
    setActiveExample(-1);
  };

  const handleSwap = () => {
    if (!output || output.startsWith('Invalid')) return;
    setMode((m) => m === 'json' ? 'yaml' : 'json');
    setInput(output);
    setOutput('');
    setError(null);
    setActiveExample(-1);
    toast({ type: 'success', message: 'Swapped inputs and conversion direction!' });
  };

  const handleDownload = () => {
    if (!output || output.startsWith('Invalid')) return;
    const isTargetYaml = mode === 'json';
    const blob = new Blob([output], { type: isTargetYaml ? 'text/yaml' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isTargetYaml ? 'converted_config.yaml' : 'converted_config.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({ type: 'success', message: `Downloaded converted_config.${isTargetYaml ? 'yaml' : 'json'}` });
  };

  const handleRestore = (item: HistoryItem) => {
    setInput(item.input);
    if (item.metadata?.mode) {
      setMode(item.metadata.mode);
    }
  };

  return (
    <ToolLayout 
      name="YAML ↔ JSON Converter" 
      description="Convert bidirectionally between YAML and JSON formats with advanced multi-document parsing and precise line validation checks" 
      category="Formatting"
      historyComponent={<HistoryDrawer toolId="yaml-json" onRestore={handleRestore} />}
    >
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side Inputs */}
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium text-text-secondary">Input Code</h2>
              <span className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider',
                mode === 'json' 
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                  : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
              )}>
                {mode === 'json' ? 'JSON' : 'YAML'}
              </span>
            </div>

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
            placeholder={mode === 'json' ? '{"key": "value"}' : 'key: value'} 
            monospace 
            className="min-h-[260px]" 
          />

          {/* Validation Banner alerts (YAML only) */}
          {validation && (
            <div className={cn(
              'p-3.5 rounded-xl border flex items-start gap-2.5 text-xs shadow-sm animate-fade-in',
              validation.valid 
                ? 'bg-success/5 border-success/20 text-success font-semibold' 
                : 'bg-error/10 border-error/20 text-error'
            )}>
              {validation.valid ? (
                <>
                  <CheckCircle className="h-4 w-4 shrink-0 text-success mt-0.5" />
                  <span>Valid YAML Structure</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 shrink-0 text-error mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold">YAML Parse Alert</span>
                    <p className="leading-relaxed">
                      {validation.error} {validation.line ? `(Line: ${validation.line})` : ''}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {mode === 'json' && (
            <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary font-outfit border-b border-border pb-2.5">
                <Settings className="h-4 w-4 text-accent" />
                <span>Conversion Preferences</span>
              </div>
              <div className="w-full">
                <Select
                  label="YAML Indent Spacing"
                  options={indentOptions}
                  value={indent}
                  onChange={(e) => setIndent(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Side Outputs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium text-text-secondary">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent font-bold">
                  Converted Output
                </span>
              </h2>
              <span className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider',
                mode === 'yaml' 
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                  : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
              )}>
                {mode === 'yaml' ? 'JSON' : 'YAML'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSwap} 
                disabled={!output || output.startsWith('Invalid') || output.startsWith('Error')}
                icon={<ArrowRight className="h-4 w-4" />}
                title="Swap Inputs"
              >
                Swap
              </Button>
              <CopyButton value={output} disabled={!output || output.startsWith('Invalid')} />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={!output || output.startsWith('Invalid')}
                icon={<Download className="h-4 w-4" />}
              >
                Download
              </Button>
            </div>
          </div>

          <GradientBox value={output} placeholder="Output code will appear here..." className="min-h-[360px]" />
          
          {output && !output.startsWith('Invalid') && (
            <span className="text-xs text-text-muted font-medium block">
              {output.length.toLocaleString()} characters · {output.split('\n').length.toLocaleString()} lines
            </span>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
