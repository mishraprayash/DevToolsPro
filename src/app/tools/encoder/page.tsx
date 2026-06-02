'use client';

import * as React from 'react';
import { Lock, Link2, FileCode, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Select } from '@/components/ui/Select';
import { GradientBox } from '@/components/ui/GradientBox';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { encodeBase64, decodeBase64, encodeUrlStr, decodeUrlStr, encodeEntities, decodeEntities } from '@/tools/encoder/utils';

export default function Page() {
  const [activeTab, setActiveTab] = React.useState<'base64' | 'url' | 'entities'>('base64');
  const [direction, setDirection] = React.useState<'encode' | 'decode'>('encode');
  const [input, setInput] = React.useState('Encode or decode this string to keep it secure or transmit it safely.');
  const [output, setOutput] = React.useState('');

  // --- Base64 Configs ---
  const [b64Mode, setB64Mode] = React.useState<'utf8' | 'hex' | 'binary'>('utf8');
  const [b64UrlSafe, setB64UrlSafe] = React.useState(false);

  // --- URL Configs ---
  const [urlMode, setUrlMode] = React.useState<'component' | 'uri' | 'strict'>('component');

  // --- HTML Entities Configs ---
  const [entMode, setEntMode] = React.useState<'named' | 'decimal' | 'hex'>('named');
  const [entScope, setEntScope] = React.useState<'markup' | 'all'>('markup');

  const handleProcess = React.useCallback(() => {
    if (!input) {
      setOutput('');
      return;
    }
    let res = '';
    if (activeTab === 'base64') {
      res = direction === 'encode' 
        ? encodeBase64(input, b64Mode, b64UrlSafe)
        : decodeBase64(input, b64Mode, b64UrlSafe);
    } else if (activeTab === 'url') {
      res = direction === 'encode'
        ? encodeUrlStr(input, urlMode)
        : decodeUrlStr(input, urlMode);
    } else if (activeTab === 'entities') {
      res = direction === 'encode'
        ? encodeEntities(input, { mode: entMode, scope: entScope })
        : decodeEntities(input);
    }
    setOutput(res);
  }, [input, activeTab, direction, b64Mode, b64UrlSafe, urlMode, entMode, entScope]);

  React.useEffect(() => {
    const t = setTimeout(handleProcess, 100);
    return () => clearTimeout(t);
  }, [handleProcess]);

  const handleSwap = () => {
    setInput(output);
    setDirection(d => d === 'encode' ? 'decode' : 'encode');
    toast({ type: 'success', message: 'Swapped input and output direction!' });
  };

  return (
    <ToolLayout
      name="Encoder & Decoder Sandbox"
      description="Consolidated encoding utility to convert text via Base64 binary wrappers, URL components, and HTML entities"
      category="Encoding"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navigation tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-secondary border border-border overflow-x-auto scrollbar-hide max-w-md">
          <button
            onClick={() => setActiveTab('base64')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'base64'
                ? 'bg-bg-tertiary text-accent border border-border'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Lock className="h-3.5 w-3.5" />
            Base64 Converter
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'url'
                ? 'bg-bg-tertiary text-accent border border-border'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Link2 className="h-3.5 w-3.5" />
            URL Encoder
          </button>
          <button
            onClick={() => setActiveTab('entities')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'entities'
                ? 'bg-bg-tertiary text-accent border border-border'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <FileCode className="h-3.5 w-3.5" />
            HTML Entities
          </button>
        </div>

        {/* Direction Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-secondary border border-border">
          <button
            onClick={() => setDirection('encode')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
              direction === 'encode' ? 'bg-accent text-bg-primary' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            Encode
          </button>
          <button
            onClick={() => setDirection('decode')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
              direction === 'decode' ? 'bg-accent text-bg-primary' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            Decode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        {/* Left Side Inputs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">Source Input</h2>
            <Button variant="ghost" size="sm" onClick={() => setInput('')}>Clear</Button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full min-h-[160px] p-4 rounded-xl bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent resize-y font-mono"
            placeholder="Type values here..."
          />

          {/* Configs Panel based on active tab */}
          <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Parameters</h3>
            
            {activeTab === 'base64' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Text Character Standard"
                  options={[
                    { value: 'utf8', label: 'UTF-8 String' },
                    { value: 'hex', label: 'Hexadecimal Bytes' },
                    { value: 'binary', label: 'Raw Binary Bits' }
                  ]}
                  value={b64Mode}
                  onChange={(e) => setB64Mode(e.target.value as any)}
                />
                <label className="flex items-center gap-2.5 cursor-pointer select-none pt-7">
                  <input
                    type="checkbox"
                    checked={b64UrlSafe}
                    onChange={(e) => setB64UrlSafe(e.target.checked)}
                    className="rounded border-border text-accent focus:ring-accent bg-bg-tertiary h-4 w-4"
                  />
                  <span className="text-xs text-text-secondary font-medium">URL-Safe (+/ to -_)</span>
                </label>
              </div>
            )}

            {activeTab === 'url' && (
              <Select
                label="URI Encoding Strictness"
                options={[
                  { value: 'component', label: 'URI Component (Complete Query values)' },
                  { value: 'uri', label: 'URI (Preserves http:// schemes)' },
                  { value: 'strict', label: 'Strict RFC-3986 (Includes all symbols)' }
                ]}
                value={urlMode}
                onChange={(e) => setUrlMode(e.target.value as any)}
              />
            )}

            {activeTab === 'entities' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Entity Output Format"
                  options={[
                    { value: 'named', label: 'Named (&amp;)' },
                    { value: 'decimal', label: 'Decimal (&#38;)' },
                    { value: 'hex', label: 'Hexadecimal (&#x26;)' }
                  ]}
                  value={entMode}
                  onChange={(e) => setEntMode(e.target.value as any)}
                  disabled={direction === 'decode'}
                />
                <Select
                  label="Characters to Target"
                  options={[
                    { value: 'markup', label: 'Markup Symbols only (<, >, &, \', ")' },
                    { value: 'all', label: 'All Non-ASCII characters' }
                  ]}
                  value={entScope}
                  onChange={(e) => setEntScope(e.target.value as any)}
                  disabled={direction === 'decode'}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Side Outputs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">Converted Output</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleSwap} disabled={!output} icon={<Copy className="h-3.5 w-3.5" />}>Swap</Button>
              {output && <CopyButton value={output} label="Copy Output" />}
            </div>
          </div>
          <GradientBox value={output} placeholder="Conversion output will appear here..." className="min-h-[260px] font-mono leading-relaxed" />
        </div>
      </div>
    </ToolLayout>
  );
}
