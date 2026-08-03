'use client';

import * as React from 'react';
import { Download, FileCode2, RotateCcw, AlertTriangle, Globe } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { GradientBox } from '@/components/ui/GradientBox';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  buildSitemap,
  buildRobotsTxt,
  CHANGEFREQ_VALUES,
  type Changefreq,
} from '@/tools/sitemap/utils';

type OutputMode = 'sitemap' | 'robots';

const examples = [
  {
    label: 'Marketing Site',
    paths: `/
/about
/blog
/blog/launch-post
/pricing
/contact
/privacy`,
  },
  {
    label: 'Documentation',
    paths: `/
/docs
/docs/getting-started
/docs/configuration
/docs/deployment
/docs/api-reference
/docs/troubleshooting`,
  },
];

const changefreqOptions = CHANGEFREQ_VALUES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Page() {
  const [baseUrl, setBaseUrl] = React.useState('https://example.com');
  const [paths, setPaths] = React.useState(examples[0].paths);
  const [changefreq, setChangefreq] = React.useState<Changefreq>('weekly');
  const [priority, setPriority] = React.useState(0.8);
  const [includeLastmod, setIncludeLastmod] = React.useState(true);
  const [lastmodDate, setLastmodDate] = React.useState(todayIso());
  const [mode, setMode] = React.useState<OutputMode>('sitemap');
  const [activeExample, setActiveExample] = React.useState(0);

  const result = React.useMemo(() => {
    if (mode === 'robots') {
      const res = buildRobotsTxt(baseUrl);
      return res.success ? { output: res.data, error: null } : { output: null, error: res.error };
    }
    const res = buildSitemap(baseUrl, paths, {
      changefreq,
      priority,
      includeLastmod,
      lastmodDate,
    });
    return res.success ? { output: res.data, error: null } : { output: null, error: res.error };
  }, [baseUrl, paths, changefreq, priority, includeLastmod, lastmodDate, mode]);

  const output = result.output;
  const error = result.error;

  const urlCount = React.useMemo(
    () =>
      paths
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean).length,
    [paths]
  );

  const applyExample = (i: number) => {
    setActiveExample(i);
    setPaths(examples[i].paths);
  };

  const handleClear = () => {
    setPaths('');
    setActiveExample(-1);
  };

  const handleDownload = () => {
    if (!output) return;
    const filename = mode === 'sitemap' ? 'sitemap.xml' : 'robots.txt';
    const blob = new Blob([output], { type: mode === 'sitemap' ? 'application/xml' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast({ type: 'success', message: `Downloaded ${filename}` });
  };

  return (
    <ToolLayout
      name="Sitemap Generator"
      description="Generate SEO-ready sitemap.xml and robots.txt files from your site URL and page paths."
      category="Text"
    >
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-secondary border border-border w-fit mb-4">
        <button
          onClick={() => setMode('sitemap')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5',
            mode === 'sitemap' ? 'bg-accent text-bg-primary' : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <FileCode2 className="h-3.5 w-3.5" /> sitemap.xml
        </button>
        <button
          onClick={() => setMode('robots')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5',
            mode === 'robots' ? 'bg-accent text-bg-primary' : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Globe className="h-3.5 w-3.5" /> robots.txt
        </button>
      </div>

      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[480px]">
        <div className="flex flex-col space-y-4 min-h-0">
          <div className="p-5 rounded-xl border border-border bg-bg-secondary space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-muted font-mono text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-text-secondary">Page paths (one per line)</label>
                <span className="text-[10px] text-text-muted font-mono bg-bg-tertiary border border-border px-1.5 py-0.5 rounded">
                  {urlCount} URL{urlCount === 1 ? '' : 's'}
                </span>
              </div>
              <div className="h-44">
                <Input
                  value={paths}
                  onChange={(e) => {
                    setPaths(e.target.value);
                    setActiveExample(-1);
                  }}
                  placeholder={'/\n/about\n/blog'}
                  monospace
                  className="w-full h-full"
                  wrapperClassName="h-full"
                />
              </div>
            </div>
          </div>

          {mode === 'sitemap' && (
            <div className="p-5 rounded-xl border border-border bg-bg-secondary space-y-4">
              <h3 className="text-xs font-semibold text-text-primary font-outfit">SEO Preferences</h3>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Change frequency"
                  options={changefreqOptions}
                  value={changefreq}
                  onChange={(e) => setChangefreq(e.target.value as Changefreq)}
                />
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Default priority ({priority.toFixed(1)})
                  </label>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.1}
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full accent-accent mt-2"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-4">
                <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={includeLastmod}
                    onChange={(e) => setIncludeLastmod(e.target.checked)}
                    className="accent-accent h-3.5 w-3.5"
                  />
                  Include lastmod
                </label>
                <input
                  type="date"
                  value={lastmodDate}
                  onChange={(e) => setLastmodDate(e.target.value)}
                  disabled={!includeLastmod}
                  className="h-9 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-xs disabled:opacity-40 focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-3 min-h-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-secondary">
              {mode === 'sitemap' ? 'XML Output' : 'Text Output'}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleClear} icon={<RotateCcw className="h-4 w-4" />}>
                Clear
              </Button>
              <CopyButton value={output ?? ''} disabled={!output} />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={!output}
                icon={<Download className="h-4 w-4" />}
              >
                Download
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-[260px]">
            {error ? (
              <div className="h-full w-full rounded-xl border border-error/20 bg-error/5 p-4 flex items-start gap-2.5 animate-fade-in">
                <AlertTriangle className="h-4 w-4 text-error shrink-0 mt-0.5" />
                <p className="text-xs text-error leading-relaxed">{error}</p>
              </div>
            ) : (
              <GradientBox value={output ?? ''} placeholder="Generated output will appear here..." className="h-full w-full overflow-y-auto" />
            )}
          </div>

          {output && (
            <span className="text-xs text-text-muted font-medium">
              {output.length.toLocaleString()} characters · {output.split('\n').length.toLocaleString()} lines
            </span>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
