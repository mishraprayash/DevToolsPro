'use client';

import * as React from 'react';
import { Compass, Laptop, Smartphone, Tablet, Terminal, Globe, RefreshCw, Cpu, Monitor, Eye, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { parseUserAgent, type ParsedUserAgent } from '@/tools/user-agent/utils';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

const examples = [
  { label: 'Chrome (macOS)', value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
  { label: 'Safari (iPhone)', value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1' },
  { label: 'Firefox (Linux)', value: 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0' },
  { label: 'Edge (Windows)', value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0' },
];

export default function Page() {
  const [input, setInput] = React.useState('');
  const [activeExample, setActiveExample] = React.useState(-1);
  const [mounted, setMounted] = React.useState(false);

  // Client-side hardware inspector states
  const [screenInfo, setScreenInfo] = React.useState({
    resolution: 'Unknown',
    viewport: 'Unknown',
    pixelRatio: 'Unknown',
    language: 'Unknown',
  });

  const detectMyBrowser = React.useCallback(() => {
    if (typeof navigator !== 'undefined') {
      setInput(navigator.userAgent);
      setActiveExample(-1);
      toast({ type: 'success', message: 'Detected your current browser User-Agent!' });
    }
  }, []);

  React.useEffect(() => {
    setMounted(true);
    detectMyBrowser();

    // Capture screen and client specs
    if (typeof window !== 'undefined') {
      setScreenInfo({
        resolution: `${window.screen.width} × ${window.screen.height} px`,
        viewport: `${window.innerWidth} × ${window.innerHeight} px`,
        pixelRatio: `${window.devicePixelRatio}x (DPR)`,
        language: navigator.language || 'en-US',
      });
    }
  }, [detectMyBrowser]);

  const parsed = React.useMemo(() => {
    return parseUserAgent(input);
  }, [input]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    setInput(examples[i].value);
  };

  const handleClear = () => {
    setInput('');
    setActiveExample(-1);
  };

  const getDeviceIcon = (type: 'Mobile' | 'Tablet' | 'Desktop') => {
    if (type === 'Mobile') return <Smartphone className="h-5 w-5 text-accent shrink-0 mt-0.5" />;
    if (type === 'Tablet') return <Tablet className="h-5 w-5 text-accent shrink-0 mt-0.5" />;
    return <Laptop className="h-5 w-5 text-accent shrink-0 mt-0.5" />;
  };

  return (
    <ToolLayout
      name="User-Agent Parser & Device Inspector"
      description="Deconstruct browser User-Agent strings completely client-side and inspect client hardware, viewport sizing, and pixel ratio metrics"
      category="Date & Time"
    >
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
        {/* Left Input Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">User-Agent String</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={detectMyBrowser}>
                Detect Mine
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClear} icon={<RotateCcw className="h-4 w-4" />}>
                Clear
              </Button>
            </div>
          </div>

          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setActiveExample(-1); }}
            placeholder="Paste a browser User-Agent string here..."
            className="w-full h-[180px] p-4 rounded-xl bg-bg-tertiary border border-border text-sm font-mono text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all shadow-inner"
          />

          {/* Client Device Details card */}
          {mounted && (
            <div className="p-5 rounded-xl border border-border bg-bg-secondary space-y-4 shadow-sm animate-slide-up select-none">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary font-outfit border-b border-border pb-2.5">
                <Eye className="h-4.5 w-4.5 text-accent animate-pulse-glow" />
                <span>Your Hardware &amp; Viewport Inspector</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-bg-tertiary border border-border/40">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Screen Resolution</span>
                  <span className="font-mono font-bold text-text-primary mt-1 block">{screenInfo.resolution}</span>
                </div>

                <div className="p-3 rounded-lg bg-bg-tertiary border border-border/40">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Browser Viewport</span>
                  <span className="font-mono font-bold text-text-primary mt-1 block">{screenInfo.viewport}</span>
                </div>

                <div className="p-3 rounded-lg bg-bg-tertiary border border-border/40">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Device Pixel Ratio</span>
                  <span className="font-mono font-bold text-text-primary mt-1 block">{screenInfo.pixelRatio}</span>
                </div>

                <div className="p-3 rounded-lg bg-bg-tertiary border border-border/40">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">System Language</span>
                  <span className="font-mono font-bold text-text-primary mt-1 block uppercase">{screenInfo.language}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Output details breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">Parsing Breakdown</h2>
            <CopyButton value={input} label="Copy UA" disabled={!input} />
          </div>

          {input.trim() ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
              {/* Browser Details */}
              <div className="p-4 rounded-xl border border-border bg-bg-tertiary flex items-start gap-3.5 shadow-sm">
                <Compass className="h-5 w-5 text-accent shrink-0 mt-0.5 animate-pulse-glow" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Web Browser</span>
                  <span className="text-sm font-bold text-text-primary truncate block mt-0.5">{parsed.browser.name}</span>
                  <span className="text-xs text-text-muted font-mono block mt-0.5">Version: {parsed.browser.version}</span>
                </div>
              </div>

              {/* Operating System */}
              <div className="p-4 rounded-xl border border-border bg-bg-tertiary flex items-start gap-3.5 shadow-sm">
                <Monitor className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Operating System</span>
                  <span className="text-sm font-bold text-text-primary truncate block mt-0.5">{parsed.os.name}</span>
                  <span className="text-xs text-text-muted font-mono block mt-0.5">Version: {parsed.os.version}</span>
                </div>
              </div>

              {/* Device Category */}
              <div className="p-4 rounded-xl border border-border bg-bg-tertiary flex items-start gap-3.5 shadow-sm">
                {getDeviceIcon(parsed.device.type)}
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Device Category</span>
                  <span className="text-sm font-bold text-text-primary truncate block mt-0.5">{parsed.device.type}</span>
                  <span className="text-xs text-text-muted font-mono block mt-0.5">Brand: {parsed.device.brand}</span>
                </div>
              </div>

              {/* Rendering Engine */}
              <div className="p-4 rounded-xl border border-border bg-bg-tertiary flex items-start gap-3.5 shadow-sm">
                <Cpu className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Rendering Engine</span>
                  <span className="text-sm font-bold text-text-primary truncate block mt-0.5">{parsed.engine.name}</span>
                  <span className="text-xs text-text-muted font-mono block mt-0.5">Engine: {parsed.engine.version}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 rounded-xl bg-bg-tertiary border border-border border-dashed text-text-muted text-sm italic">
              Paste a User-Agent string on the left to see the parsing deconstruction.
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
