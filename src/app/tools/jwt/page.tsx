'use client';

import * as React from 'react';
import { RotateCcw, AlertCircle, CheckCircle, Clock, KeyRound, Eye, EyeOff, Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { CopyButton } from '@/components/ui/CopyButton';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { decodeJWT, getJWTStatus, type JWTPayload } from '@/tools/jwt/utils';
import { cn } from '@/lib/utils';

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIiwiaWF0IjoxNTE2MjM5MDIyfQ.' +
  'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const ADMIN_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiI5ODc2NTQzMjEwIiwibmFtZSI6IkJvYiBBZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjQyNjIyfQ.' +
  'abc123';

const examples = [
  { label: 'User token (valid)', value: SAMPLE_JWT },
  { label: 'Admin token (expired)', value: ADMIN_JWT },
];

const knownTimestamps = ['exp', 'iat', 'nbf', 'auth_time'];

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

function highlightMatch(text: string, query: string, className: string): React.ReactNode {
  if (!query) return text;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className={className}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

function getIndent(line: string): number {
  const m = line.match(/^(\s*)/);
  return m ? m[1].length : 0;
}

function processLine(
  line: string,
  i: number,
  q: string,
  indent: number,
  timestampAnnotations: Record<number, string>,
  highlightBg: string,
): { node: React.ReactNode; matched: boolean } {
  const tokens: React.ReactNode[] = [];
  let remaining = line;
  const keyMatch = remaining.match(/^(\s*)"([^"]+)":\s*/);
  if (keyMatch) {
    tokens.push(<span key="ws" className="text-text-muted/30">{keyMatch[1]}</span>);
    tokens.push(<span key="key" className="text-accent">{highlightMatch(`"${keyMatch[2]}"`, q, `${highlightBg} text-accent rounded`)}</span>);
    tokens.push(<span key="colon">: </span>);
    remaining = remaining.slice(keyMatch[0].length);
  }
  if (remaining) {
    const valueMatch = remaining.match(/^(null|true|false|-?\d+\.?\d*(?:e[+-]?\d+)?)/);
    if (valueMatch) {
      tokens.push(<span key="val" className="text-success">{highlightMatch(valueMatch[1], q, `${highlightBg} text-success rounded`)}</span>);
      remaining = remaining.slice(valueMatch[0].length);
    } else {
      const strMatch = remaining.match(/^"(?:[^"\\]|\\.)*"/);
      if (strMatch) {
        tokens.push(<span key="val" className="text-yellow-400">{highlightMatch(strMatch[0], q, `rounded ${highlightBg}`)}</span>);
        remaining = remaining.slice(strMatch[0].length);
      }
    }
  }
  tokens.push(<span key="rest">{remaining}</span>);

  const lineText = line.toLowerCase();
  const matched = !q || lineText.includes(q);

  const node = (
    <React.Fragment key={i}>
      {tokens}{timestampAnnotations[i] ? <span className="text-text-muted text-xs ml-2">{'//'} {timestampAnnotations[i]}</span> : null}
      {'\n'}
    </React.Fragment>
  );

  return { node, matched };
}

interface HighlightResult {
  nodes: React.ReactNode[];
  matchIndices: number[];
}

function highlightJson(json: string, showRaw: boolean, searchQuery: string, activeIndex: number): HighlightResult {
  const lines = json.split('\n');
  const timestampAnnotations: Record<number, string> = {};
  if (!showRaw) {
    for (const [key, value] of Object.entries(JSON.parse(json))) {
      if (knownTimestamps.includes(key) && typeof value === 'number') {
        const lineIndex = lines.findIndex(l => l.trimStart().startsWith(`"${key}"`));
        if (lineIndex !== -1) timestampAnnotations[lineIndex] = formatDate(value);
      }
    }
  }
  const q = searchQuery.toLowerCase().trim();

  if (!q) {
    return {
      nodes: lines.map((line, i) => processLine(line, i, '', getIndent(line), timestampAnnotations, '').node),
      matchIndices: [],
    };
  }

  const indents = lines.map(getIndent);
  const matched = lines.map((line) => line.toLowerCase().includes(q));

  const parentStack: number[] = [];
  const childOfMatch = new Set<number>();
  for (let i = 0; i < lines.length; i++) {
    while (parentStack.length > 0 && indents[i] <= indents[parentStack[parentStack.length - 1]]) {
      parentStack.pop();
    }
    if (parentStack.length > 0 && matched[parentStack[parentStack.length - 1]]) {
      childOfMatch.add(i);
    }
    if (matched[i]) {
      parentStack.push(i);
    }
  }

  const matchIndices = lines.map((_, i) => i).filter(i => matched[i]);
  const active = matchIndices[activeIndex] ?? -1;

  return {
    matchIndices,
    nodes: lines.map((line, i) => {
      const showHighlight = matched[i] || childOfMatch.has(i);
      const isActive = i === active;
      const highlightBg = isActive ? 'bg-accent/15 ring-2 ring-accent ring-inset' : (matched[i] ? 'bg-accent/8' : (childOfMatch.has(i) ? 'bg-accent/4' : ''));
      const result = processLine(line, i, q, indents[i], timestampAnnotations, isActive ? 'bg-accent/20' : highlightBg);
      const opacity = q && !showHighlight ? 'opacity-30' : '';

      return (
        <div key={i} data-line={i} className={cn(opacity, showHighlight && 'rounded -mx-1 px-1', highlightBg)}>
          {result.node}
        </div>
      );
    }),
  };
}

function JsonBlock({ data, label, color }: { data: Record<string, unknown>; label: string; color: string }) {
  const [showRaw, setShowRaw] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const jsonStr = JSON.stringify(data, null, 2);
  const { nodes: highlighted, matchIndices } = highlightJson(jsonStr, showRaw, searchQuery, activeIndex);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const matchCount = matchIndices.length;

  const scrollToActive = React.useCallback(() => {
    if (!scrollRef.current || matchIndices.length === 0) return;
    const activeLine = matchIndices[activeIndex];
    const el = scrollRef.current.querySelector(`[data-line="${activeLine}"]`) as HTMLElement | null;
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeIndex, matchIndices]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery]);

  React.useEffect(() => {
    scrollToActive();
  }, [activeIndex, scrollToActive]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (matchIndices.length === 0) return;
      if (e.shiftKey) {
        setActiveIndex(i => (i - 1 + matchIndices.length) % matchIndices.length);
      } else {
        setActiveIndex(i => (i + 1) % matchIndices.length);
      }
    }
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden flex flex-col">
      <div className={cn('flex items-center justify-between px-4 py-2.5 shrink-0', color)}>
        <h3 className="text-sm font-medium text-white">{label}</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowRaw(!showRaw)} icon={showRaw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            className="text-white/70 hover:text-white" />
          <CopyButton value={jsonStr} className="text-white/70 hover:text-white [&>svg]:text-white/70 [&>svg]:hover:text-white" />
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 p-4 bg-bg-tertiary overflow-auto min-h-[180px] max-h-[360px] font-mono text-sm text-text-primary whitespace-pre">
        {highlighted}
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border-t border-border">
        <Search className="h-3.5 w-3.5 text-text-muted shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); }}
          onKeyDown={handleKeyDown}
          placeholder="Search keys or values..."
          className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        {matchIndices.length > 0 && (
          <>
            <span className="text-xs text-text-muted whitespace-nowrap tabular-nums">
              {activeIndex + 1}/{matchCount}
            </span>
            <button onClick={() => setActiveIndex(i => i - 1 < 0 ? matchCount - 1 : i - 1)}
              className="p-0.5 text-text-muted hover:text-text-primary transition-colors disabled:opacity-30"
              disabled={matchCount <= 1}>
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setActiveIndex(i => (i + 1) % matchCount)}
              className="p-0.5 text-text-muted hover:text-text-primary transition-colors disabled:opacity-30"
              disabled={matchCount <= 1}>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {searchQuery && matchIndices.length === 0 && (
          <span className="text-xs text-text-muted">No matches</span>
        )}
        {searchQuery && (
          <button onClick={() => { setSearchQuery(''); setActiveIndex(0); }} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  const [input, setInput] = React.useState(SAMPLE_JWT);
  const [decoded, setDecoded] = React.useState<JWTPayload | null>(null);
  const [status, setStatus] = React.useState<'valid' | 'expired' | 'invalid'>('valid');
  const [activeExample, setActiveExample] = React.useState(0);

  React.useEffect(() => {
    if (!input.trim()) { setDecoded(null); return; }
    const result = decodeJWT(input);
    setDecoded(result);
    setStatus(result ? getJWTStatus(input) : 'invalid');
  }, [input]);

  const handleClear = () => { setInput(''); setDecoded(null); setActiveExample(-1); };
  const applyExample = (i: number) => { setActiveExample(i); setInput(examples[i].value); };

  const expValue = decoded?.payload?.exp && typeof decoded.payload.exp === 'number' ? decoded.payload.exp : null;
  const iatValue = decoded?.payload?.iat && typeof decoded.payload.iat === 'number' ? decoded.payload.iat : null;

  return (
    <ToolLayout name="JWT Decoder" description="Decode and inspect JWT tokens — header, payload and expiry" category="Security">
      <div className="space-y-4">
        <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

        {/* Encoded input */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-secondary">Encoded</h2>
          <Button variant="ghost" size="sm" onClick={handleClear} icon={<RotateCcw className="h-4 w-4" />}>Clear</Button>
        </div>

        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); setActiveExample(-1); }}
          placeholder="Paste JWT token..."
          className="w-full min-h-[200px] px-4 py-3 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-muted font-mono text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-200 resize-none"
        />

        {/* Decoded sections */}
        {decoded ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <JsonBlock data={decoded.header} label="Header" color="bg-gradient-to-r from-rose-600 to-pink-600" />
              <JsonBlock data={decoded.payload} label="Payload" color="bg-gradient-to-r from-blue-600 to-cyan-600" />
            </div>

            {/* Signature */}
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-gray-600 to-slate-600">
                <h3 className="text-sm font-medium text-white">Signature</h3>
                <CopyButton value={decoded.raw.signature} className="text-white/70 hover:text-white" />
              </div>
              <div className="p-4 bg-bg-tertiary">
                <pre className="text-sm font-mono text-text-muted whitespace-pre-wrap break-all">{decoded.signature}</pre>
              </div>
            </div>
          </div>
        ) : input.trim() ? null : (
          <div className="flex items-center justify-center h-32 rounded-xl bg-bg-tertiary border border-dashed border-border text-text-muted text-sm">
            Paste a JWT token above to decode
          </div>
        )}

        {/* Status + timestamps */}
        {decoded && (
          <div className={cn('flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl border flex-wrap',
            status === 'valid' && 'bg-success/10 border-success/30',
            status === 'expired' && 'bg-warning/10 border-warning/30',
            status === 'invalid' && 'bg-error/10 border-error/30'
          )}>
            <div className="flex items-center gap-2 shrink-0">
              {status === 'valid' && <CheckCircle className="h-5 w-5 text-success" />}
              {status === 'expired' && <AlertCircle className="h-5 w-5 text-warning" />}
              {status === 'invalid' && <AlertCircle className="h-5 w-5 text-error" />}
              <span className={cn('font-medium',
                status === 'valid' && 'text-success',
                status === 'expired' && 'text-warning',
                status === 'invalid' && 'text-error'
              )}>
                {status === 'valid' ? 'Token Valid' : status === 'expired' ? 'Token Expired' : 'Invalid Token'}
              </span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {expValue && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Clock className="h-4 w-4 text-text-muted shrink-0" />
                  <span>Expires: <span className="font-mono text-text-primary">{formatDate(expValue)}</span></span>
                </div>
              )}
              {iatValue && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <KeyRound className="h-4 w-4 text-text-muted shrink-0" />
                  <span>Issued: <span className="font-mono text-text-primary">{formatDate(iatValue)}</span></span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
