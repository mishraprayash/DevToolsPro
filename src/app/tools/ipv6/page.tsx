'use client';

import * as React from 'react';
import { processIpv6 } from '@/tools/ipv6/utils';
import { Shield, Eye, Copy, Check, CheckCircle } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { useToolPrefill } from '@/lib/hooks/useToolPrefill';

export default function Ipv6HelperPage() {
  const [ipInput, setIpInput] = React.useState('2001:db8::1');

  useToolPrefill('ipv6', ({ input }) => setIpInput(input.trim()));
  const [copiedType, setCopiedType] = React.useState<string | null>(null);

  const result = React.useMemo(() => {
    return processIpv6(ipInput);
  }, [ipInput]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <ToolLayout
      name="IPv6 Address Helper"
      description="Expand, compress, validate, and convert IPv6 interfaces to reverse DNS queries"
      category="Encoding"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Input */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">IPv6 Address Input</h2>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">Address Input</label>
              <input
                type="text"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="e.g. 2001:0db8::0001"
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary text-sm"
              />
            </div>
            <p className="text-[10px] text-text-muted leading-relaxed">
              Accepts fully expanded, compressed notation with &quot;::&quot; gaps, and standard IPv6 networks.
            </p>
          </div>
        </div>

        {/* Right Output */}
        <div className="md:col-span-2">
          {result.success ? (
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-accent pb-2 border-b border-border">
                <Shield className="w-5 h-5" />
                <h3 className="font-semibold text-text-primary">IPv6 Expanded &amp; Compressed Results</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/20 p-3 rounded-lg border border-border flex items-center justify-between">
                  <div className="truncate pr-4">
                    <span className="block text-[10px] font-semibold text-text-muted uppercase">Fully Expanded Form</span>
                    <span className="font-mono text-xs text-text-primary break-all">{result.data.expanded}</span>
                  </div>
                  <button onClick={() => handleCopy(result.data.expanded, 'exp')} className="text-text-muted hover:text-text-primary flex-shrink-0 cursor-pointer">
                    {copiedType === 'exp' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="bg-muted/20 p-3 rounded-lg border border-border flex items-center justify-between">
                  <div className="truncate pr-4">
                    <span className="block text-[10px] font-semibold text-text-muted uppercase">RFC 5952 Compressed Form</span>
                    <span className="font-mono text-sm text-text-primary font-bold break-all">{result.data.compressed}</span>
                  </div>
                  <button onClick={() => handleCopy(result.data.compressed, 'comp')} className="text-text-muted hover:text-text-primary flex-shrink-0 cursor-pointer">
                    {copiedType === 'comp' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="bg-muted/20 p-3 rounded-lg border border-border flex items-center justify-between">
                  <div className="truncate pr-4">
                    <span className="block text-[10px] font-semibold text-text-muted uppercase">Reverse DNS Lookup (PTR)</span>
                    <span className="font-mono text-[10px] text-text-muted break-all">{result.data.reverseDns}</span>
                  </div>
                  <button onClick={() => handleCopy(result.data.reverseDns, 'dns')} className="text-text-muted hover:text-text-primary flex-shrink-0 cursor-pointer">
                    {copiedType === 'dns' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* IP Scope details */}
              <div className="border-t border-border pt-4 space-y-3">
                <span className="block text-xs font-semibold text-text-muted uppercase tracking-wider">IPv6 Address Scope Properties</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className={`w-4 h-4 ${result.data.isLinkLocal ? 'text-green-500' : 'text-text-muted/40'}`} />
                    <span className="text-text-secondary font-medium">Link Local Address (fe80::/10)</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className={`w-4 h-4 ${result.data.isMulticast ? 'text-green-500' : 'text-text-muted/40'}`} />
                    <span className="text-text-secondary font-medium">Multicast Group Address (ff00::/8)</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className={`w-4 h-4 ${result.data.isLoopback ? 'text-green-500' : 'text-text-muted/40'}`} />
                    <span className="text-text-secondary font-medium">Loopback Interface Address (::1/128)</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className={`w-4 h-4 ${result.data.isUnspecified ? 'text-green-500' : 'text-text-muted/40'}`} />
                    <span className="text-text-secondary font-medium">Unspecified Address (::/128)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm flex items-center gap-2">
              <Eye className="w-5 h-5 flex-shrink-0" />
              <span>{result.error}</span>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
