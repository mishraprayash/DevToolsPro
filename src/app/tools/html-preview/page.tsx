'use client';

import * as React from 'react';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { useToolPrefill } from '@/lib/hooks/useToolPrefill';
import { Button } from '@/components/ui/Button';
import { wrapHtmlDocument, formatHtml } from '@/tools/html-preview/utils';
import { cn } from '@/lib/utils';
import { RotateCcw, Monitor, Smartphone, Tablet, Terminal, Settings } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { useToolShortcuts, useShortcutHint } from '@/lib/hooks/useToolShortcuts';

interface Example { 
  label: string; 
  value: string; 
  tailwind: boolean; 
  bootstrap: boolean; 
  fontawesome: boolean; 
}

const examples: Example[] = [
  { 
    label: 'Tailwind Card', 
    value: `<div class="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden md:max-w-2xl border border-slate-100 animate-fade-in mt-6">
  <div class="md:flex">
    <div class="p-8">
      <div class="uppercase tracking-wide text-xs text-indigo-500 font-extrabold flex items-center gap-1.5">
        <i class="fa-solid fa-sparkles"></i> Tailwind Live Sandbox
      </div>
      <a href="#" class="block mt-2 text-lg leading-tight font-extrabold text-slate-900 hover:underline">
        Stunning Layouts in Real-time
      </a>
      <p class="mt-2 text-slate-500 text-sm leading-relaxed">
        Toggle the Tailwind CSS framework on the left and start building beautiful, fully responsive mock components instantly in the browser preview container!
      </p>
      <button class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1 cursor-pointer">
        Get Started <i class="fa-solid fa-arrow-right ml-1"></i>
      </button>
    </div>
  </div>
</div>`,
    tailwind: true,
    bootstrap: false,
    fontawesome: true
  },
  { 
    label: 'Interactive JS Counter', 
    value: `<div class="text-center p-8 bg-slate-900 text-white rounded-2xl max-w-sm mx-auto shadow-2xl mt-8">
  <h2 class="text-xl font-bold mb-3 font-outfit">Interactive Sandbox</h2>
  <p class="text-slate-400 text-xs mb-4">Click below to trigger a standard javascript execution inside the iframe console!</p>
  <div class="text-4xl font-mono font-bold mb-4 text-cyan-400" id="countDisplay">0</div>
  <button class="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-sm font-semibold shadow-lg transition-colors cursor-pointer text-white border-none" onclick="increment()">
    Increment Counter
  </button>
</div>

<script>
  let count = 0;
  function increment() {
    count++;
    document.getElementById('countDisplay').innerText = count;
    console.log('Counter incremented to ' + count);
    if (count % 5 === 0) {
      console.warn('Milestone reached: ' + count + ' clicks!');
    }
  }
</script>`,
    tailwind: true,
    bootstrap: false,
    fontawesome: false
  },
  { 
    label: 'Bootstrap Card', 
    value: `<div class="container py-4 text-center mt-4">
  <h2 class="mb-4 font-bold text-primary">Bootstrap Pricing Table</h2>
  <div class="row justify-content-center">
    <div class="col-sm-8 col-md-6 col-lg-5">
      <div class="card shadow border-primary h-100">
        <div class="card-header bg-primary text-white py-3">
          <h4 class="my-0 font-weight-bold">Developer Suite</h4>
        </div>
        <div class="card-body p-4">
          <h1 class="card-title font-mono">$0 <small class="text-muted">/ mo</small></h1>
          <p class="card-text text-muted my-3">Ideal for local trials and basic mock components.</p>
          <button class="btn btn-outline-primary w-100 py-2 font-weight-bold" onclick="console.log('Clicked plan!')">
            Choose Package
          </button>
        </div>
      </div>
    </div>
  </div>
</div>`,
    tailwind: false,
    bootstrap: true,
    fontawesome: false
  }
];

interface LogItem {
  level: 'log' | 'warn' | 'error';
  message: string;
  time: string;
}

// Override standard console in Iframe and postMessage up
const CONSOLE_SCRIPT = `
    <script>
      (function() {
        const _log = console.log;
        const _warn = console.warn;
        const _error = console.error;
        
        const sendMsg = (level, args) => {
          window.parent.postMessage({
            type: 'iframe-console',
            level: level,
            message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
          }, '*');
        };

        console.log = (...args) => {
          _log(...args);
          sendMsg('log', args);
        };
        console.warn = (...args) => {
          _warn(...args);
          sendMsg('warn', args);
        };
        console.error = (...args) => {
          _error(...args);
          sendMsg('error', args);
        };

        window.onerror = (msg, url, line) => {
          sendMsg('error', [msg + ' (Line ' + line + ')']);
          return false;
        };
      })();
    </script>
`;

export default function Page() {
  const [input, setInput] = React.useState(examples[0].value);
  const [activeExample, setActiveExample] = React.useState(0);
  const [injectTailwind, setInjectTailwind] = React.useState(examples[0].tailwind);
  const [injectBootstrap, setInjectBootstrap] = React.useState(examples[0].bootstrap);
  const [injectFontAwesome, setInjectFontAwesome] = React.useState(examples[0].fontawesome);
  const [viewportWidth, setViewportWidth] = React.useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Console simulator logs state
  const [logs, setLogs] = React.useState<LogItem[]>([]);

  useToolPrefill('html-preview', ({ input }) => { setInput(input); setActiveExample(-1); setLogs([]); });

  // Build document with console injection + CDN injections
  const srcdoc = React.useMemo(() => {
    const options = {
      tailwind: injectTailwind,
      bootstrap: injectBootstrap,
      fontawesome: injectFontAwesome
    };
    const baseDoc = wrapHtmlDocument(input, options);
    // Inject our custom console catcher script right after <head>
    if (/<head>/i.test(baseDoc)) {
      return baseDoc.replace(/<head>/i, `<head>\n  ${CONSOLE_SCRIPT}`);
    }
    return CONSOLE_SCRIPT + baseDoc;
  }, [input, injectTailwind, injectBootstrap, injectFontAwesome]);

  // Listen to console log postMessage events from iframe
  React.useEffect(() => {
    const handleIframeMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'iframe-console') {
        const timestamp = new Date().toLocaleTimeString(undefined, { hour12: false });
        const newLog: LogItem = {
          level: e.data.level,
          message: e.data.message,
          time: timestamp
        };
        setLogs((prev) => [...prev, newLog]);
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  const applyExample = (i: number) => {
    setActiveExample(i);
    setInjectTailwind(examples[i].tailwind);
    setInjectBootstrap(examples[i].bootstrap);
    setInjectFontAwesome(examples[i].fontawesome);
    setInput(examples[i].value);
    setLogs([]);
  };

  const handleFormat = () => {
    try {
      setInput(formatHtml(input));
      toast({ type: 'success', message: 'HTML Formatted!' });
    } catch {
      toast({ type: 'error', message: 'Failed to format HTML' });
    }
  };

  const handleClear = () => {
    setInput('');
    setLogs([]);
    setActiveExample(-1);
  };

  const hint = useShortcutHint();
  useToolShortcuts({
    onClear: handleClear,
  });

  return (
    <ToolLayout 
      name="HTML Live Sandbox & Previewer" 
      description="Write HTML structure and styles with real-time responsive frames, custom CDN injections, and sandboxed developer console logging" 
      category="Formatting"
    >
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - HTML Editor */}
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">HTML Document Editor</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleFormat}>
                Beautify
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClear} title={hint('Clear', 'clear')} icon={<RotateCcw className="h-4 w-4" />}>
                Clear
              </Button>
            </div>
          </div>

          <textarea 
            value={input} 
            onChange={(e) => { setInput(e.target.value); setActiveExample(-1); }}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                const target = e.currentTarget;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                setInput(input.slice(0, start) + '  ' + input.slice(end));
                setTimeout(() => {
                  target.selectionStart = target.selectionEnd = start + 2;
                }, 0);
              }
            }}
            placeholder="<h1>Hello live HTML sandbox...</h1>"
            className="w-full h-[360px] p-4 rounded-xl bg-bg-tertiary border border-border text-sm font-mono text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all shadow-inner"
            spellCheck={false} 
          />

          {/* CDNs Libraries Injection Options */}
          <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-3.5 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary font-outfit border-b border-border pb-2.5">
              <Settings className="h-4 w-4 text-accent" />
              <span>Sandbox Library Injections</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 select-none">
              <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={injectTailwind} 
                  onChange={(e) => { setInjectTailwind(e.target.checked); if (e.target.checked) setInjectBootstrap(false); }}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-bg-tertiary cursor-pointer transition-all" 
                />
                <span>Tailwind CSS CDN</span>
              </label>

              <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={injectBootstrap} 
                  onChange={(e) => { setInjectBootstrap(e.target.checked); if (e.target.checked) setInjectTailwind(false); }}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-bg-tertiary cursor-pointer transition-all" 
                />
                <span>Bootstrap CSS</span>
              </label>

              <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={injectFontAwesome} 
                  onChange={(e) => setInjectFontAwesome(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-bg-tertiary cursor-pointer transition-all" 
                />
                <span>FontAwesome Icons</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column - Live Preview Framework */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">Responsive Sandbox</h2>
            
            {/* Viewport resizing tool */}
            <div className="flex items-center rounded-lg border border-border p-1 bg-bg-tertiary select-none">
              <button
                onClick={() => setViewportWidth('desktop')}
                className={cn(
                  'p-1.5 rounded-md text-text-secondary hover:text-text-primary transition-all',
                  viewportWidth === 'desktop' && 'bg-accent text-white hover:text-white'
                )}
                title="Desktop (100% width)"
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewportWidth('tablet')}
                className={cn(
                  'p-1.5 rounded-md text-text-secondary hover:text-text-primary transition-all',
                  viewportWidth === 'tablet' && 'bg-accent text-white hover:text-white'
                )}
                title="Tablet (768px width)"
              >
                <Tablet className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewportWidth('mobile')}
                className={cn(
                  'p-1.5 rounded-md text-text-secondary hover:text-text-primary transition-all',
                  viewportWidth === 'mobile' && 'bg-accent text-white hover:text-white'
                )}
                title="Mobile (375px width)"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Iframe preview box styled responsive */}
          <div className="w-full flex items-center justify-center p-4 bg-bg-secondary rounded-2xl border border-border min-h-[300px]">
            <iframe 
              srcDoc={srcdoc}
              title="Sandboxed Web preview"
              sandbox="allow-scripts allow-modals"
              className={cn(
                'rounded-xl border border-border bg-white shadow-inner transition-all duration-300 h-[380px]',
                viewportWidth === 'desktop' && 'w-full',
                viewportWidth === 'tablet' && 'w-[768px] max-w-full ring-4 ring-bg-tertiary ring-offset-2 ring-offset-bg-secondary',
                viewportWidth === 'mobile' && 'w-[375px] max-w-full ring-4 ring-bg-tertiary ring-offset-2 ring-offset-bg-secondary'
              )}
            />
          </div>

          {/* Simulated Sandbox Console Logs Panel */}
          <div className="p-4 rounded-xl border border-border bg-bg-tertiary space-y-2.5">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <span className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-accent" />
                <span>Sandbox Developer Console ({logs.length})</span>
              </span>
              {logs.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setLogs([])}
                  className="h-6 text-[10px] font-bold text-text-muted hover:text-text-primary bg-bg-secondary border border-border"
                >
                  Clear Console
                </Button>
              )}
            </div>

            <div className="max-h-[140px] overflow-y-auto divide-y divide-border/40 font-mono text-xs select-text space-y-1 pr-1">
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div key={i} className={cn(
                    'py-1.5 flex items-start gap-2.5 leading-relaxed',
                    log.level === 'error' && 'text-error bg-error/5 px-2 rounded',
                    log.level === 'warn' && 'text-warning bg-warning/5 px-2 rounded'
                  )}>
                    <span className="text-[9px] text-text-muted select-none mt-0.5 shrink-0 font-semibold">{log.time}</span>
                    <span className="text-[10px] text-text-muted select-none mt-0.5 font-bold uppercase shrink-0">
                      [{log.level}]
                    </span>
                    <span className="break-all font-semibold">{log.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-text-muted/50 py-4 italic select-none">
                  Console is empty. Script logs will display here...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
