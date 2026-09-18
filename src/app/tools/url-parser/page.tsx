'use client';

import * as React from 'react';
import {
  Link2,
  Plus,
  Trash2,
  RotateCcw,
  SlidersHorizontal,
  AlertCircle
} from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { CopyButton } from '@/components/ui/CopyButton';
import { parseUrlString, constructUrl, encodeUrlComponentSafe, decodeUrlComponentSafe, type QueryParam, type ParsedUrlData } from '@/tools/url-parser/utils';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

const DEFAULT_URL =
  'https://api.example.com:8443/v1/users/search?query=developers&role=admin&active=true&tags=typescript&tags=react#results-header';

const SAMPLE_URLS = [
  { label: 'REST Search API', value: DEFAULT_URL },
  { label: 'OAuth Callback URL', value: 'https://auth.provider.com/oauth/authorize?client_id=dev_app_123&redirect_uri=https%3A%2F%2Fmyapp.io%2Fcallback&response_type=code&scope=read%20write' },
  { label: 'E-commerce Deep Link', value: 'https://shop.store.org/products/category/shoes?sort=price_desc&size=10.5&in_stock=1&currency=USD' },
  { label: 'Local Dev Endpoint', value: 'http://localhost:3000/dashboard?tab=analytics&period=30d&theme=dark' },
];

export default function UrlParserPage() {
  const [inputUrl, setInputUrl] = React.useState<string>(DEFAULT_URL);
  const [parsed, setParsed] = React.useState<ParsedUrlData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Sync parsing when input changes
  React.useEffect(() => {
    if (!inputUrl.trim()) {
      setParsed(null);
      setError(null);
      return;
    }
    const result = parseUrlString(inputUrl);
    if (result.success) {
      setParsed(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [inputUrl]);

  // Update a single query param
  const handleUpdateParam = (id: string, field: 'key' | 'value' | 'enabled', val: string | boolean) => {
    if (!parsed) return;
    const updated = parsed.queryParams.map((p) => (p.id === id ? { ...p, [field]: val } : p));
    syncRebuiltUrl(updated);
  };

  // Add new param row
  const handleAddParam = () => {
    if (!parsed) return;
    const newParam: QueryParam = {
      id: `param-${Date.now()}-${parsed.queryParams.length}`,
      key: '',
      value: '',
      enabled: true,
    };
    const updated = [...parsed.queryParams, newParam];
    syncRebuiltUrl(updated);
  };

  // Remove param row
  const handleRemoveParam = (id: string) => {
    if (!parsed) return;
    const updated = parsed.queryParams.filter((p) => p.id !== id);
    syncRebuiltUrl(updated);
  };

  // Helper to recompute full URL from components
  const syncRebuiltUrl = (params: QueryParam[]) => {
    if (!parsed) return;
    const res = constructUrl(
      parsed.protocol,
      parsed.host,
      parsed.pathname,
      params,
      parsed.hash,
      parsed.username ? { username: parsed.username, password: parsed.password } : undefined
    );
    if (res.success) {
      setInputUrl(res.data);
    }
  };

  const handleClear = () => {
    setInputUrl('');
    setParsed(null);
    setError(null);
    toast({ type: 'info', message: 'Cleared URL input.' });
  };

  const handleCopyCleanUrl = () => {
    if (!parsed) return;
    const cleanOriginAndPath = `${parsed.origin}${parsed.pathname}`;
    navigator.clipboard.writeText(cleanOriginAndPath);
    toast({ type: 'success', message: 'Copied base URL without query strings.' });
  };

  const handleCopyAsJson = () => {
    if (!parsed) return;
    const paramsObj: Record<string, string | string[]> = {};
    parsed.queryParams.forEach((p) => {
      if (p.enabled && p.key) {
        if (paramsObj[p.key]) {
          if (Array.isArray(paramsObj[p.key])) {
            (paramsObj[p.key] as string[]).push(p.value);
          } else {
            paramsObj[p.key] = [paramsObj[p.key] as string, p.value];
          }
        } else {
          paramsObj[p.key] = p.value;
        }
      }
    });

    const out = {
      href: parsed.href,
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || null,
      pathname: parsed.pathname,
      hash: parsed.hash || null,
      queryParams: paramsObj,
    };

    navigator.clipboard.writeText(JSON.stringify(out, null, 2));
    toast({ type: 'success', message: 'Copied URL structure as JSON.' });
  };

  return (
    <ToolLayout
      name="URL & Query Parameter Inspector"
      description="Inspect, dissect, edit, encode, and rebuild URLs and query strings in real time."
      category="Network"
    >
      <div className="space-y-6">
        {/* Sample Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-text-muted">Presets:</span>
          {SAMPLE_URLS.map((sample) => (
            <button
              key={sample.label}
              onClick={() => setInputUrl(sample.value)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-tertiary border border-border hover:border-accent/40 hover:text-accent transition-all cursor-pointer font-medium"
            >
              {sample.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 rounded-2xl bg-bg-secondary border border-border shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold font-outfit text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Link2 className="w-4 h-4 text-accent" />
              Target URL
            </label>
            <div className="flex items-center gap-2">
              {inputUrl && (
                <button
                  onClick={handleClear}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              )}
              {inputUrl && <CopyButton value={inputUrl} />}
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste or enter a URL (e.g. https://api.site.com/v1/search?q=test)..."
              className="w-full p-3.5 rounded-xl bg-bg-tertiary border border-border font-mono text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-y"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* URL Component Matrix */}
        {parsed && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-bg-secondary border border-border">
              <span className="text-[10px] font-bold text-text-muted uppercase">Protocol</span>
              <p className="text-sm font-mono font-semibold text-accent mt-0.5 truncate">{parsed.protocol}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-bg-secondary border border-border">
              <span className="text-[10px] font-bold text-text-muted uppercase">Host / Domain</span>
              <p className="text-sm font-mono font-semibold text-text-primary mt-0.5 truncate">{parsed.hostname}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-bg-secondary border border-border">
              <span className="text-[10px] font-bold text-text-muted uppercase">Port</span>
              <p className="text-sm font-mono font-semibold text-text-secondary mt-0.5">
                {parsed.port || <span className="text-text-muted italic">Default (80/443)</span>}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-bg-secondary border border-border">
              <span className="text-[10px] font-bold text-text-muted uppercase">Path</span>
              <p className="text-sm font-mono font-semibold text-text-primary mt-0.5 truncate">{parsed.pathname}</p>
            </div>
          </div>
        )}

        {/* Query Parameters Editor */}
        {parsed && (
          <div className="p-5 rounded-2xl bg-bg-secondary border border-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-bold font-outfit text-text-primary">
                  Query Parameters ({parsed.queryParams.filter((p) => p.enabled).length} active)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCleanUrl}
                  className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  Copy Base URL
                </button>
                <button
                  onClick={handleCopyAsJson}
                  className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  Export as JSON
                </button>
                <button
                  onClick={handleAddParam}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-bg-primary text-xs font-bold hover:bg-accent-hover transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Param
                </button>
              </div>
            </div>

            {parsed.queryParams.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted">
                No query parameters detected in this URL. Click &ldquo;Add Param&rdquo; to create one.
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin pr-1">
                {parsed.queryParams.map((param) => (
                  <div
                    key={param.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-xl border transition-all',
                      param.enabled
                        ? 'bg-bg-tertiary/70 border-border'
                        : 'bg-bg-tertiary/20 border-border/40 opacity-60'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={param.enabled}
                      onChange={(e) => handleUpdateParam(param.id, 'enabled', e.target.checked)}
                      className="w-4 h-4 rounded border-border text-accent focus:ring-accent cursor-pointer ml-1"
                      title="Enable/Disable query parameter"
                    />

                    <input
                      type="text"
                      value={param.key}
                      onChange={(e) => handleUpdateParam(param.id, 'key', e.target.value)}
                      placeholder="key"
                      className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-bg-primary border border-border text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                    />

                    <span className="text-text-muted font-mono text-xs">=</span>

                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) => handleUpdateParam(param.id, 'value', e.target.value)}
                      placeholder="value"
                      className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-bg-primary border border-border text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
                    />

                    <button
                      onClick={() => {
                        const encoded = encodeUrlComponentSafe(param.value);
                        if (encoded.success) handleUpdateParam(param.id, 'value', encoded.data);
                      }}
                      className="px-2 py-1 text-[10px] rounded bg-bg-hover hover:bg-bg-primary text-text-muted hover:text-text-primary border border-border/60 transition-colors font-mono cursor-pointer"
                      title="URL Encode Value"
                    >
                      %
                    </button>

                    <button
                      onClick={() => {
                        const decoded = decodeUrlComponentSafe(param.value);
                        if (decoded.success) handleUpdateParam(param.id, 'value', decoded.data);
                      }}
                      className="px-2 py-1 text-[10px] rounded bg-bg-hover hover:bg-bg-primary text-text-muted hover:text-text-primary border border-border/60 transition-colors font-mono cursor-pointer"
                      title="URL Decode Value"
                    >
                      Aa
                    </button>

                    <button
                      onClick={() => handleRemoveParam(param.id)}
                      className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete Parameter"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
