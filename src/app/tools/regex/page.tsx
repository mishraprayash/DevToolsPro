'use client';

import * as React from 'react';
import { RotateCcw, AlertCircle, Sparkles, HelpCircle, Code, Copy, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { CopyButton } from '@/components/ui/CopyButton';
import { testRegex, RegexMatch } from '@/tools/regex/utils';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface Example { 
  label: string; 
  pattern: string; 
  flags: string; 
  testString: string; 
  description?: string;
}

const examples: Example[] = [
  {
    label: 'Email Addresses',
    pattern: '([\\w.+-]+)@([\\w-]+\\.[\\w.]+)',
    flags: 'g',
    testString: 'Contact alice@example.com or support@devtools.pro for quick help.',
    description: 'Captures email addresses. Group 1: Username, Group 2: Domain.',
  },
  {
    label: 'Extract Numbers',
    pattern: '\\d+',
    flags: 'g',
    testString: 'Order #1042 has 3 items totalling $49.99 with 2 discounts.',
    description: 'Matches all consecutive digits in the text.',
  },
  {
    label: 'Hex Colours',
    pattern: '#([0-9a-fA-F]{3,6})',
    flags: 'gi',
    testString: 'Colors list: #fff, #22d3ee, #3f3f46, and #A855F7.',
    description: 'Matches hex color codes. Group 1: Hex value without hash symbol.',
  },
  {
    label: 'URL Parser',
    pattern: 'https?:\\/\\/(www\\.)?([\\w-]+)\\.([a-z]{2,6})(\\/\\S*)?',
    flags: 'g',
    testString: 'Visit https://www.google.com or http://github.com/trending for resources.',
    description: 'Parses URLs. Group 2: Domain name, Group 3: TLD extension, Group 4: Path.',
  },
  {
    label: 'IPv4 Address',
    pattern: '^(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})$',
    flags: '',
    testString: '192.168.1.254',
    description: 'Matches an IPv4 address. Group 1-4: Individual IP octets.',
  }
];

const cheatSheetPatterns = [
  { name: 'Email Address', pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$', test: 'user@domain.com' },
  { name: 'Strong Password', pattern: '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$', test: 'SecurePass1' },
  { name: 'Date (YYYY-MM-DD)', pattern: '^\\d{4}-\\d{2}-\\d{2}$', test: '2026-05-19' },
  { name: 'HTML Tag', pattern: '<(\\/?[a-z0-9]+)[^>]*>', test: '<div>Hello</div>' },
  { name: 'IP Address (IPv4)', pattern: '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$', test: '10.0.0.1' },
  { name: 'Username (Alphanumeric)', pattern: '^[a-zA-Z0-9_]{3,16}$', test: 'coder_dev123' },
];

export default function Page() {
  const [pattern, setPattern] = React.useState(examples[0].pattern);
  const [testString, setTestString] = React.useState(examples[0].testString);
  const [flags, setFlags] = React.useState(examples[0].flags);
  const [replacement, setReplacement] = React.useState('');
  const [replacedOutput, setReplacedOutput] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'matches' | 'replace'>('matches');

  const [result, setResult] = React.useState<{ matches: RegexMatch[]; isValid: boolean; error?: string }>({ 
    matches: [], 
    isValid: true 
  });
  const [activeExample, setActiveExample] = React.useState(0);

  // Run Regex Matching
  React.useEffect(() => {
    const res = testRegex(pattern, flags, testString);
    setResult(res);
  }, [pattern, flags, testString]);

  // Run Regex Replacement Simulation
  React.useEffect(() => {
    if (!pattern.trim() || !result.isValid) {
      setReplacedOutput('');
      return;
    }
    try {
      const regex = new RegExp(pattern, flags);
      const output = testString.replace(regex, replacement);
      setReplacedOutput(output);
    } catch {
      setReplacedOutput('');
    }
  }, [pattern, flags, testString, replacement, result.isValid]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    setPattern(examples[i].pattern);
    setFlags(examples[i].flags);
    setTestString(examples[i].testString);
    setReplacement('');
  };

  const handleClear = () => {
    setPattern('');
    setTestString('');
    setReplacement('');
    setActiveExample(-1);
  };

  const toggleFlag = (f: string) => {
    setFlags(flags.includes(f) ? flags.replace(f, '') : flags + f);
  };

  const renderMatches = () => {
    if (!result.matches.length) return <span>{testString}</span>;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    result.matches.forEach((m, i) => {
      if (m.index > lastIndex) {
        parts.push(<span key={`t${i}`}>{testString.slice(lastIndex, m.index)}</span>);
      }
      parts.push(
        <mark 
          key={`m${i}`} 
          className="bg-accent/20 text-accent font-bold px-1 rounded border-b-2 border-accent/40 select-all hover:bg-accent/30 transition-all cursor-pointer"
          title={`Match ${i + 1} at index ${m.index}`}
        >
          {m.text}
        </mark>
      );
      lastIndex = m.index + m.text.length;
    });

    if (lastIndex < testString.length) {
      parts.push(<span key="end">{testString.slice(lastIndex)}</span>);
    }
    return <>{parts}</>;
  };

  const injectPattern = (item: typeof cheatSheetPatterns[0]) => {
    setPattern(item.pattern);
    setTestString(item.test);
    setFlags('g');
    setActiveExample(-1);
    toast({ type: 'success', message: `Injected ${item.name} pattern!` });
  };

  const currentDesc = examples[activeExample]?.description;

  return (
    <ToolLayout 
      name="Regex Tester" 
      description="Validate regular expressions with live highlights, browse the pattern cheat sheet, and test String replacements in real-time" 
      category="Text"
    >
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Input Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">Regex Pattern</h2>
            <Button variant="ghost" size="sm" onClick={handleClear} icon={<RotateCcw className="h-4 w-4" />}>
              Clear
            </Button>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-text-muted text-lg select-none">/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => { setPattern(e.target.value); setActiveExample(-1); }}
              placeholder="[a-zA-Z0-9]+..."
              className={cn(
                'w-full h-11 pl-7 pr-24 rounded-lg bg-bg-tertiary border text-sm font-mono text-text-primary focus:outline-none transition-all',
                result.isValid ? 'border-border focus:border-accent focus:ring-1 focus:ring-accent/30' : 'border-error focus:ring-error/30'
              )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-text-muted text-sm select-none">/{flags || ''}</span>
          </div>

          {currentDesc && (
            <p className="text-xs text-text-muted italic px-1 leading-relaxed">
              * {currentDesc}
            </p>
          )}

          {!result.isValid && result.error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-error/10 text-error border border-error/30 text-xs shadow-sm">
              <AlertCircle className="h-5 w-5 shrink-0 text-error mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Regex Syntax Error</span>
                <p className="leading-relaxed">{result.error}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 select-none">
            <span className="text-xs text-text-muted font-semibold">Flags:</span>
            {['g', 'i', 'm', 's'].map(f => (
              <button 
                key={f} 
                onClick={() => toggleFlag(f)}
                className={cn(
                  'px-3 py-1 text-xs rounded-lg border font-mono transition-all duration-150',
                  flags.includes(f) 
                    ? 'bg-accent text-white border-accent shadow-sm' 
                    : 'bg-bg-tertiary border-border text-text-secondary hover:border-border-hover'
                )}
                title={f === 'g' ? 'Global search' : f === 'i' ? 'Case insensitive' : f === 'm' ? 'Multiline matching' : 'Dotall (. matches newline)'}
              >
                {f}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs text-text-muted mb-1.5 block font-semibold">Test Source Text</label>
            <Input 
              value={testString} 
              onChange={(e) => { setTestString(e.target.value); setActiveExample(-1); }} 
              placeholder="Paste test string here..." 
              className="min-h-[140px]"
              monospace 
            />
          </div>

          {/* Quick Patterns Cheat Sheet */}
          <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary font-outfit border-b border-border pb-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Regex Pattern Cheat Sheet</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {cheatSheetPatterns.map((item, index) => (
                <button
                  key={index}
                  onClick={() => injectPattern(item)}
                  className="px-3 py-2 rounded-lg text-[11px] text-left bg-bg-tertiary hover:bg-bg-hover border border-border/60 hover:border-accent text-text-secondary hover:text-accent font-semibold transition-all truncate"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Output Column */}
        <div className="space-y-4">
          {/* Output view switcher */}
          <div className="flex border-b border-border/80">
            <button
              onClick={() => setActiveTab('matches')}
              className={cn(
                'px-4 py-2 border-b-2 font-medium text-xs transition-all duration-150',
                activeTab === 'matches' ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-primary'
              )}
            >
              Interactive Matches ({result.matches.length})
            </button>
            <button
              onClick={() => setActiveTab('replace')}
              className={cn(
                'px-4 py-2 border-b-2 font-medium text-xs transition-all duration-150',
                activeTab === 'replace' ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-primary'
              )}
            >
              String Replacement Simulator
            </button>
          </div>

          {activeTab === 'matches' ? (
            /* Tab 1: Interactive Matches View */
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <span className="text-xs text-text-muted font-semibold block">Highlighted Canvas</span>
                <div className="p-5 rounded-xl bg-bg-tertiary border border-border text-sm font-mono whitespace-pre-wrap min-h-[140px] leading-relaxed shadow-inner">
                  {testString ? renderMatches() : <span className="text-text-muted italic select-none">No test text provided.</span>}
                </div>
              </div>

              {result.matches.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-text-muted font-semibold block">Capture Groups Details</span>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {result.matches.map((m, i) => (
                      <div key={i} className="p-3.5 rounded-lg border border-border/80 bg-bg-secondary space-y-2 relative group hover:border-accent/40 hover:shadow-sm transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Match {i + 1}</span>
                          <span className="text-[10px] text-text-muted font-mono">Index: {m.index} · Len: {m.text.length}</span>
                        </div>
                        
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                          <code className="text-sm font-bold text-text-primary font-mono select-all bg-bg-tertiary px-2 py-0.5 rounded border border-border/30">{m.text}</code>
                          <CopyButton value={m.text} size="sm" className="opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                        </div>

                        {/* Capture groups list */}
                        {m.groups && m.groups.length > 0 ? (
                          <div className="space-y-1.5 pl-2 pt-1 border-l border-border">
                            {m.groups.map((group, gIdx) => (
                              <div key={gIdx} className="text-xs flex items-center gap-2">
                                <span className="text-text-muted font-medium font-outfit select-none">Group {gIdx + 1}:</span>
                                {group !== undefined ? (
                                  <code className="text-text-primary font-semibold select-all font-mono bg-bg-tertiary px-1 rounded">{group}</code>
                                ) : (
                                  <span className="text-text-muted/40 italic">undefined (optional)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-text-muted italic flex items-center gap-1">
                            <Info className="h-3 w-3" /> No capture groups configured. Wrap matching sections in parentheses `(...)` to capture groups.
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tab 2: String Replacement Simulator */
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <label className="text-xs text-text-muted font-semibold block">Replacement String (Supports standard `$1`, `$2`, `$&` parameters)</label>
                <input
                  type="text"
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                  placeholder="Insert replacement... e.g. [$1]"
                  className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-sm font-mono text-text-primary focus:outline-none focus:border-accent transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted font-semibold">Simulated Replacement Output</span>
                  <CopyButton value={replacedOutput} disabled={!replacedOutput} />
                </div>
                
                <div className="p-5 rounded-xl bg-bg-tertiary border border-border text-sm font-mono whitespace-pre-wrap min-h-[180px] leading-relaxed shadow-inner">
                  {replacedOutput ? (
                    <span className="select-all text-text-primary">{replacedOutput}</span>
                  ) : (
                    <span className="text-text-muted italic select-none">Replacement result will appear here...</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
