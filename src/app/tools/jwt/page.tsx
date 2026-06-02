'use client';

import * as React from 'react';
import { RotateCcw, AlertCircle, CheckCircle, Clock, KeyRound, Eye, EyeOff, Search, X, ChevronUp, ChevronDown, Sparkles, Settings, ShieldCheck, ShieldAlert, PenTool, Timer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { CopyButton } from '@/components/ui/CopyButton';
import { Select } from '@/components/ui/Select';
import { GradientBox } from '@/components/ui/GradientBox';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { decodeJWT, decodeJwtParts, getJWTStatus, signJWT, verifyJwtSignature, type JWTPayload, type JWTAlgorithm } from '@/tools/jwt/utils';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIiwiaWF0IjoxNTE2MjM5MDIyfQ.' +
  'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const ADMIN_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiI5ODc2NTQzMjEwIiwibmFtZSI6IkJvYiBBZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjQyNjIyfQ.' +
  'abc123';

const examples = [
  { label: 'User Token (Valid)', value: SAMPLE_JWT },
  { label: 'Admin Token (Expired)', value: ADMIN_JWT },
];

const knownTimestamps = ['exp', 'iat', 'nbf', 'auth_time'];

const defaultSignerPayload = `{
  "sub": "1234567890",
  "name": "Alice Smith",
  "admin": true,
  "iat": 1710000000
}`;

const algoOptions = [
  { value: 'HS256', label: 'HMAC-SHA256 (HS256)' },
  { value: 'HS384', label: 'HMAC-SHA384 (HS384)' },
  { value: 'HS512', label: 'HMAC-SHA512 (HS512)' },
  { value: 'RS256', label: 'RSA-SHA256 (RS256)' },
];

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
    try {
      for (const [key, value] of Object.entries(JSON.parse(json))) {
        if (knownTimestamps.includes(key) && typeof value === 'number') {
          const lineIndex = lines.findIndex(l => l.trimStart().startsWith(`"${key}"`));
          if (lineIndex !== -1) timestampAnnotations[lineIndex] = formatDate(value);
        }
      }
    } catch {
      // ignore JSON parse failures
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
          onChange={(e) => { setSearchQuery(e.target.value); setActiveIndex(0); }}
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
  const [activeTab, setActiveTab] = React.useState<'decode' | 'sign'>('decode');

  // --- Decoder Tab States ---
  const [input, setInput] = React.useState(SAMPLE_JWT);
  const [activeExample, setActiveExample] = React.useState(0);
  const [verifySecret, setVerifySecret] = React.useState('your-secret-key-123');
  const [verifyAlgorithm, setVerifyAlgorithm] = React.useState<JWTAlgorithm>('HS256');
  const [signatureStatus, setSignatureStatus] = React.useState<'unknown' | 'valid' | 'invalid' | 'error'>('unknown');
  const [signatureMessage, setSignatureMessage] = React.useState<string | null>(null);

  // --- Signer Tab States ---
  const [signHeader, setSignHeader] = React.useState(`{\n  "alg": "HS256",\n  "typ": "JWT"\n}`);
  const [signPayload, setSignPayload] = React.useState(defaultSignerPayload);
  const [signSecret, setSignSecret] = React.useState('your-secret-key-123');
  const [signAlgo, setSignAlgo] = React.useState<JWTAlgorithm>('HS256');
  const [signedToken, setSignedToken] = React.useState('');
  const [signError, setSignError] = React.useState<string | null>(null);
  const [builderToken, setBuilderToken] = React.useState<string>('');
  const [builderDecodeError, setBuilderDecodeError] = React.useState<string | null>(null);

  const decoded = React.useMemo((): JWTPayload | null => {
    if (!input.trim()) return null;
    return decodeJWT(input);
  }, [input]);

  const status = React.useMemo((): 'valid' | 'expired' | 'invalid' => {
    if (!input.trim()) return 'invalid' as const;
    return decoded ? getJWTStatus(input) : 'invalid';
  }, [input, decoded]);

  // Signer live sync
  const handleSign = React.useCallback(async () => {
    try {
      const headerObj = JSON.parse(signHeader);
      const payloadObj = JSON.parse(signPayload);
      
      // Update algorithm header inside json dynamically if needed
      if (headerObj.alg !== signAlgo) {
        headerObj.alg = signAlgo;
        setSignHeader(JSON.stringify(headerObj, null, 2));
      }

      const token = await signJWT(headerObj, payloadObj, signSecret, signAlgo);
      setSignedToken(token);
      setSignError(null);
    } catch (e) {
      setSignError((e as Error).message || 'Invalid JSON syntax inside Header or Payload');
      setSignedToken('');
    }
  }, [signHeader, signPayload, signSecret, signAlgo]);

  React.useEffect(() => {
    const t = setTimeout(handleSign, 150);
    return () => clearTimeout(t);
  }, [handleSign]);

  const handleVerify = React.useCallback(async () => {
    if (!input.trim()) {
      setSignatureStatus('unknown');
      setSignatureMessage(null);
      return;
    }
    const partsResult = decodeJwtParts(input);
    if (!partsResult.success) {
      setSignatureStatus('error');
      setSignatureMessage(partsResult.error);
      return;
    }
    const alg = (partsResult.header?.alg as string | undefined) || verifyAlgorithm;
    if (!['HS256', 'HS384', 'HS512', 'RS256'].includes(alg)) {
      setSignatureStatus('error');
      setSignatureMessage(`Unsupported alg: ${alg || 'none'}`);
      return;
    }
    const verified = await verifyJwtSignature(input, verifySecret, alg as JWTAlgorithm);
    if (verified.valid) {
      setSignatureStatus('valid');
      setSignatureMessage('Signature verified successfully.');
    } else {
      setSignatureStatus('invalid');
      setSignatureMessage(verified.error || 'Signature mismatch');
    }
  }, [input, verifySecret, verifyAlgorithm]);

  const handleBuilderDecode = React.useCallback(() => {
    const result = decodeJwtParts(builderToken);
    if (!result.success) {
      setBuilderDecodeError(result.error);
      return;
    }
    setBuilderDecodeError(null);
    setSignHeader(JSON.stringify(result.header, null, 2));
    setSignPayload(JSON.stringify(result.payload, null, 2));
    const alg = result.header?.alg;
    if (alg === 'HS256' || alg === 'HS384' || alg === 'HS512') {
      setSignAlgo(alg);
    }
    setActiveTab('sign');
    toast({ type: 'success', message: 'Loaded token into builder for editing.' });
  }, [builderToken]);

  const handleClearDecoder = () => {
    setInput('');
    setActiveExample(-1);
    setSignatureStatus('unknown');
    setSignatureMessage(null);
  };
  const applyExample = (i: number) => { setActiveExample(i); setInput(examples[i].value); };

  const expValue = decoded?.payload?.exp && typeof decoded.payload.exp === 'number' ? decoded.payload.exp : null;
  const iatValue = decoded?.payload?.iat && typeof decoded.payload.iat === 'number' ? decoded.payload.iat : null;

  return (
    <ToolLayout name="JWT Decoder & Token Builder" description="Decode and inspect JWT header/payload structures, or sign new secure HMAC JSON Web Tokens instantly" category="Security">
      {/* Tab Switcher */}
      <div className="flex border-b border-border/80 mb-6 select-none">
        <button
          onClick={() => setActiveTab('decode')}
          className={cn(
            'px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200',
            activeTab === 'decode'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          JWT Decoder
        </button>
        <button
          onClick={() => setActiveTab('sign')}
          className={cn(
            'px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200',
            activeTab === 'sign'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          JWT Token Builder &amp; Signer
        </button>
      </div>

      {activeTab === 'decode' ? (
        /* Tab 1: JWT Decoder */
        <div className="space-y-4 animate-fade-in">
          <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-text-secondary">Encoded JWT Token String</h2>
            <Button variant="ghost" size="sm" onClick={handleClearDecoder} icon={<RotateCcw className="h-4 w-4" />}>Clear</Button>
          </div>

          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setActiveExample(-1); }}
            placeholder="Paste JWT token (header.payload.signature)..."
            className="w-full min-h-[140px] px-4 py-3 rounded-xl bg-bg-tertiary border border-border text-text-primary placeholder:text-text-muted font-mono text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-200 resize-none shadow-inner"
          />

          {decoded ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <JsonBlock data={decoded.header} label="Header" color="bg-gradient-to-r from-rose-600 to-pink-600" />
                <JsonBlock data={decoded.payload} label="Payload" color="bg-gradient-to-r from-blue-600 to-cyan-600" />
              </div>

              <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-gray-600 to-slate-600">
                  <h3 className="text-sm font-medium text-white">Signature</h3>
                  <CopyButton value={decoded.raw.signature} className="text-white/70 hover:text-white" />
                </div>
                <div className="p-4 bg-bg-tertiary">
                  <pre className="text-xs font-mono text-text-muted whitespace-pre-wrap break-all leading-normal">{decoded.signature}</pre>
                </div>
              </div>
            </div>
          ) : input.trim() ? null : (
            <div className="flex items-center justify-center h-32 rounded-xl bg-bg-tertiary border border-dashed border-border text-text-muted text-sm italic">
              Paste a JWT token above to decode header, payload and signature parts.
            </div>
          )}

          {decoded && (
            <div className="space-y-4">
              <div className={cn('flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl border flex-wrap',
                status === 'valid' && 'bg-success/10 border-success/30 text-success',
                status === 'expired' && 'bg-warning/10 border-warning/30 text-warning',
                status === 'invalid' && 'bg-error/10 border-error/30 text-error'
              )}>
                <div className="flex items-center gap-2 shrink-0">
                  {status === 'valid' && <CheckCircle className="h-5 w-5 text-success" />}
                  {status === 'expired' && <AlertCircle className="h-5 w-5 text-warning" />}
                  {status === 'invalid' && <AlertCircle className="h-5 w-5 text-error" />}
                  <span className="font-bold">
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

              <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    <span>Verify Signature (HMAC)</span>
                  </div>
                  <button
                    onClick={handleVerify}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-bg-tertiary border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
                  >
                    <Timer className="h-3.5 w-3.5" />
                    Verify Now
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Select
                    label="Algorithm"
                    options={algoOptions}
                    value={verifyAlgorithm}
                    onChange={(e) => setVerifyAlgorithm(e.target.value as JWTAlgorithm)}
                  />
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-text-secondary mb-2">
                      {verifyAlgorithm === 'RS256' ? 'RSA Public Key (PEM)' : 'Shared Secret'}
                    </label>
                    <input
                      type="text"
                      value={verifySecret}
                      onChange={(e) => setVerifySecret(e.target.value)}
                      placeholder={verifyAlgorithm === 'RS256' ? 'Paste RSA public key in PEM format' : 'paste shared secret'}
                      className="w-full h-9 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-xs font-mono focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                {signatureStatus !== 'unknown' && (
                  <div className={cn(
                    'flex items-start gap-2.5 p-3 rounded-lg border text-xs',
                    signatureStatus === 'valid' && 'bg-success/10 border-success/30 text-success',
                    signatureStatus === 'invalid' && 'bg-error/10 border-error/30 text-error',
                    signatureStatus === 'error' && 'bg-warning/10 border-warning/30 text-warning'
                  )}>
                    {signatureStatus === 'valid' && <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />}
                    {signatureStatus !== 'valid' && <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />}
                    <div>
                      <p className="font-semibold">
                        {signatureStatus === 'valid'
                          ? 'Signature Valid'
                          : signatureStatus === 'invalid'
                            ? 'Signature Invalid'
                            : 'Verification Error'}
                      </p>
                      <p className="text-text-secondary mt-1 leading-relaxed">{signatureMessage}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <PenTool className="h-4 w-4 text-accent" />
                  <span>Load Token into Builder</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={builderToken}
                    onChange={(e) => setBuilderToken(e.target.value)}
                    placeholder="Paste JWT here to edit and re-sign"
                    className="flex-1 h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-text-primary text-xs font-mono focus:outline-none focus:border-accent"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBuilderDecode}
                    icon={<PenTool className="h-4 w-4" />}
                  >
                    Load
                  </Button>
                </div>
                {builderDecodeError && (
                  <div className="text-xs text-error bg-error/10 border border-error/30 rounded-lg p-2">
                    {builderDecodeError}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Tab 2: JWT Builder/Signer */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          {/* Signer inputs */}
          <div className="space-y-4">
            <h2 className="text-base font-medium text-text-secondary">JWT Claims Configuration</h2>

            <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary font-outfit border-b border-border pb-2">
                <Settings className="h-4 w-4 text-accent" />
                <span>Signature Options</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Signing Algorithm"
                    options={algoOptions}
                    value={signAlgo}
                    onChange={(e) => setSignAlgo(e.target.value as JWTAlgorithm)}
                  />

                <div>
                    <label className="block text-xs font-medium text-text-secondary mb-2">
                      {signAlgo === 'RS256' ? 'RSA Private Key (PEM)' : 'HMAC Shared Secret Key'}
                    </label>
                    <input
                      type="text"
                      value={signSecret}
                      onChange={(e) => setSignSecret(e.target.value)}
                      placeholder={signAlgo === 'RS256' ? 'Paste RSA private key in PEM format' : 'your-secret-key'}
                      className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-text-primary text-xs font-mono focus:outline-none focus:border-accent"
                    />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Header JSON</span>
                <textarea
                  value={signHeader}
                  onChange={(e) => setSignHeader(e.target.value)}
                  className="w-full h-44 p-3 rounded-lg bg-bg-tertiary border border-border font-mono text-xs text-text-primary focus:outline-none focus:border-accent resize-none shadow-inner"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">Payload Claims JSON</span>
                <textarea
                  value={signPayload}
                  onChange={(e) => setSignPayload(e.target.value)}
                  className="w-full h-44 p-3 rounded-lg bg-bg-tertiary border border-border font-mono text-xs text-text-primary focus:outline-none focus:border-accent resize-none shadow-inner"
                  spellCheck={false}
                />
              </div>
            </div>

            {signError && (
              <div className="p-4 rounded-xl bg-error/10 text-error border border-error/30 text-xs flex gap-2.5 items-start shadow-sm">
                <AlertCircle className="h-5 w-5 shrink-0 text-error mt-0.5" />
                <p className="leading-relaxed font-semibold">{signError}</p>
              </div>
            )}
          </div>

          {/* Signer outputs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-text-secondary">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent font-bold">
                  Generated Signed Token
                </span>
              </h2>
              <CopyButton value={signedToken} disabled={!signedToken} />
            </div>

            <GradientBox value={signedToken} placeholder="JWT Signed token will appear here..." className="min-h-[140px] text-xs font-bold" />

            <div className="p-4 rounded-xl border border-border bg-bg-secondary flex gap-3 text-xs text-text-muted">
              <Sparkles className="h-5 w-5 text-accent shrink-0 animate-pulse-glow" />
              <div>
                <p className="font-semibold text-text-primary mb-0.5">Cryptographic HMAC Verification</p>
                <p className="leading-relaxed">This token is formed of base64url encoded header, payload, and a secure signature generated completely locally using browser Subtly Cryptography. Ideal for mock testing backend API endpoints.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
