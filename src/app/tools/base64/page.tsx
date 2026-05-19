'use client';

import * as React from 'react';
import { RotateCcw, Braces, Code, AlertTriangle, ShieldCheck, Check, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { JsonViewer } from '@/components/ui/JsonViewer';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { TextViewer } from '@/components/ui/TextViewer';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { 
  processBase64, 
  validateBase64, 
  autofixPadding, 
  type Base64Action, 
  type Base64Mode 
} from '@/tools/base64/utils';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface Example { 
  label: string; 
  action: Base64Action; 
  mode: Base64Mode;
  urlSafe: boolean; 
  input: string; 
}

const examples: Example[] = [
  { label: 'Encode Text (UTF-8)', action: 'encode', mode: 'utf8', urlSafe: false, input: 'Hello, World! Welcome to DevTools Pro.' },
  { label: 'Encode JSON', action: 'encode', mode: 'utf8', urlSafe: false, input: '{"user":"alice","role":"admin","session":"active"}' },
  { label: 'Decode Base64', action: 'decode', mode: 'utf8', urlSafe: false, input: 'SGVsbG8sIFdvcmxkISBXZWxjb21lIHRvIERldlRvb2xzIFByby4=' },
  { label: 'Hex to Base64', action: 'encode', mode: 'hex', urlSafe: false, input: '48656c6c6f2c20576f726c6421' },
  { label: 'Binary to Base64', action: 'encode', mode: 'binary', urlSafe: false, input: '01001000 01100101 01101100 01101100 01101111' },
];

const actionOptions = [
  { value: 'encode', label: 'Encode' },
  { value: 'decode', label: 'Decode' },
];

const modeOptions = [
  { value: 'utf8', label: 'Plain Text (UTF-8)' },
  { value: 'hex', label: 'Hexadecimal' },
  { value: 'binary', label: 'Binary Bits' },
];

export default function Page() {
  const [input, setInput] = React.useState(examples[0].input);
  const [output, setOutput] = React.useState('');
  const [action, setAction] = React.useState<Base64Action>(examples[0].action);
  const [mode, setMode] = React.useState<Base64Mode>(examples[0].mode);
  const [urlSafe, setUrlSafe] = React.useState(examples[0].urlSafe);
  const [rfcLines, setRfcLines] = React.useState(false); // 64-char chunks
  const [activeExample, setActiveExample] = React.useState(0);

  // Live validation for Decode mode
  const validation = React.useMemo(() => {
    if (action === 'decode') {
      return validateBase64(input, urlSafe);
    }
    return { valid: true };
  }, [input, action, urlSafe]);

  const handleProcess = React.useCallback(() => {
    if (!input.trim()) { 
      setOutput(''); 
      return; 
    }

    if (action === 'decode' && !validation.valid) {
      setOutput('');
      return;
    }

    let processed = processBase64(input, action, mode, urlSafe);
    
    // Check if user wants 64-character line breaks (RFC 2045 standard)
    if (action === 'encode' && rfcLines && processed) {
      const chunks = processed.match(/.{1,64}/g) || [];
      processed = chunks.join('\n');
    }

    setOutput(processed);
  }, [input, action, mode, urlSafe, rfcLines, validation]);

  React.useEffect(() => {
    const t = setTimeout(handleProcess, 100);
    return () => clearTimeout(t);
  }, [handleProcess]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    setAction(examples[i].action);
    setMode(examples[i].mode);
    setUrlSafe(examples[i].urlSafe);
    setInput(examples[i].input);
    setRfcLines(false);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setActiveExample(-1);
  };

  const handleAutofixPadding = () => {
    const fixed = autofixPadding(input);
    setInput(fixed);
    toast({ type: 'success', message: 'Missing base64 padding auto-completed!' });
  };

  const isJsonOutput = React.useMemo(() => {
    if (!output || action !== 'decode') return false;
    try { 
      JSON.parse(output); 
      return true; 
    } catch { 
      return false; 
    }
  }, [output, action]);

  // Compute inflation or compression stats
  const sizeStats = React.useMemo(() => {
    if (!input || !output) return null;
    const inLen = input.length;
    const outLen = output.length;
    if (action === 'encode') {
      const bloat = ((outLen - inLen) / inLen) * 100;
      return {
        label: 'Sizing Inflation',
        val: `+${bloat.toFixed(1)}% size increase`,
        type: 'bloat'
      };
    } else {
      const saved = ((inLen - outLen) / inLen) * 100;
      return {
        label: 'Sizing Compression',
        val: `-${saved.toFixed(1)}% size decrease`,
        type: 'save'
      };
    }
  }, [input, output, action]);

  return (
    <ToolLayout 
      name="Base64 Encoder / Decoder" 
      description="Encode and decode text, hexadecimal, and binary variables, including URL-safe standard conversions and interactive auto-fixing padding validations" 
      category="Encoding"
    >
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side Inputs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">Input Variable</h2>
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
            placeholder={action === 'encode' ? 'Enter text, hex or binary bits to encode...' : 'Enter Base64 string to decode...'}
            className="min-h-[220px]" 
            monospace={mode !== 'utf8' || action === 'decode'}
          />

          {/* Action options & validation errors */}
          {action === 'decode' && !validation.valid && validation.error && (
            <div className="p-4 rounded-xl border border-error/30 bg-error/10 text-error text-xs flex items-start gap-3 shadow-sm animate-fade-in">
              <AlertTriangle className="h-5 w-5 shrink-0 text-error mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="font-semibold">Base64 Structure Alert</p>
                <p className="leading-relaxed">{validation.error}</p>
                
                {/* Auto-fix padding button option */}
                {(validation.error.includes('multiple of 4') || validation.error.includes('padding structure')) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleAutofixPadding}
                    className="text-error bg-error/10 hover:bg-error/20 border border-error/30 h-8 text-[11px] font-bold mt-1.5"
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                  >
                    Auto-fix Base64 Padding
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Conversion Direction"
                options={actionOptions}
                value={action}
                onChange={(e) => setAction(e.target.value as Base64Action)}
              />

              <Select
                label="Text Format Representation"
                options={modeOptions}
                value={mode}
                onChange={(e) => setMode(e.target.value as Base64Mode)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-1 select-none">
              <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={urlSafe} 
                  onChange={(e) => setUrlSafe(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-bg-tertiary transition-all cursor-pointer" 
                />
                <span>URL-safe encoding (RFC 4648)</span>
              </label>

              {action === 'encode' && (
                <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rfcLines} 
                    onChange={(e) => setRfcLines(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-bg-tertiary transition-all cursor-pointer" 
                  />
                  <span>Format in 64-char chunks (RFC 2045)</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Outputs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent font-bold">
                Converted Output
              </span>
            </h2>
            <CopyButton value={output} disabled={!output} />
          </div>

          {isJsonOutput ? (
            <JsonViewer value={output} maxHeight="480px" minHeight="240px" />
          ) : (
            <TextViewer value={output} maxHeight="480px" minHeight="240px" />
          )}

          <div className="flex flex-wrap items-center gap-3">
            {isJsonOutput && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                <Braces className="h-3 w-3" /> Auto-Formatted JSON
              </span>
            )}
            
            {output && action === 'encode' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <Code className="h-3 w-3" /> Valid Base64
              </span>
            )}

            {output && sizeStats && (
              <span className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border',
                sizeStats.type === 'bloat' 
                  ? 'bg-warning/10 text-warning border-warning/30' 
                  : 'bg-success/10 text-success border-success/30'
              )}>
                {sizeStats.label}: {sizeStats.val}
              </span>
            )}

            {output && (
              <span className="text-xs text-text-muted font-medium ml-auto">
                {output.length.toLocaleString()} characters · {output.split('\n').length.toLocaleString()} lines
              </span>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
