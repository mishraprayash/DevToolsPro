'use client';

import * as React from 'react';
import { fromCidr, fromSubnetMask, fromWildcardMask, type MaskConversion } from '@/tools/mask-converter/utils';
import { Layers, Copy, Check, Info } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';

export default function MaskConverterPage() {
  const [cidrInput, setCidrInput] = React.useState('24');
  const [subnetInput, setSubnetInput] = React.useState('255.255.255.0');
  const [wildcardInput, setWildcardInput] = React.useState('0.0.0.255');
  
  const [activeSource, setActiveSource] = React.useState<'cidr' | 'subnet' | 'wildcard'>('cidr');
  const [copiedType, setCopiedType] = React.useState<string | null>(null);

  // Derive conversions depending on active editing state
  const derived = React.useMemo<{ data: MaskConversion | null; error: string | null }>(() => {
    if (activeSource === 'cidr') {
      const parsed = parseInt(cidrInput, 10);
      const res = fromCidr(isNaN(parsed) ? 24 : parsed);
      return res.success ? { data: res.data, error: null } : { data: null, error: res.error };
    }
    if (activeSource === 'subnet') {
      const res = fromSubnetMask(subnetInput);
      return res.success ? { data: res.data, error: null } : { data: null, error: res.error };
    }
    const res = fromWildcardMask(wildcardInput);
    return res.success ? { data: res.data, error: null } : { data: null, error: res.error };
  }, [activeSource, cidrInput, subnetInput, wildcardInput]);

  const conversion = derived.data;
  const error = derived.error;

  // Sync secondary outputs when active changes
  React.useEffect(() => {
    if (conversion) {
      if (activeSource !== 'cidr') {
        setCidrInput(conversion.cidr.toString());
      }
      if (activeSource !== 'subnet') {
        setSubnetInput(conversion.subnetMask);
      }
      if (activeSource !== 'wildcard') {
        setWildcardInput(conversion.wildcardMask);
      }
    }
  }, [conversion, activeSource]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <ToolLayout
      name="Subnet Mask Converter"
      description="Translate bidirectionally between CIDR subnets, subnet masks, wildcard masks, and target address bounds"
      category="Encoding"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Interactive Form Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-5">
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide border-b border-border pb-2">
              Bidirectional Inputs
            </h2>

            {/* CIDR */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text-muted uppercase">CIDR Bitmask</label>
              <input
                type="text"
                value={cidrInput}
                onChange={(e) => {
                  setActiveSource('cidr');
                  setCidrInput(e.target.value);
                }}
                placeholder="e.g. 24"
                className="w-full bg-bg-tertiary/50 border border-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent text-sm"
              />
            </div>

            {/* Subnet Mask */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text-muted uppercase">Subnet Mask</label>
              <input
                type="text"
                value={subnetInput}
                onChange={(e) => {
                  setActiveSource('subnet');
                  setSubnetInput(e.target.value);
                }}
                placeholder="e.g. 255.255.255.0"
                className="w-full bg-bg-tertiary/50 border border-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent text-sm"
              />
            </div>

            {/* Wildcard Mask */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text-muted uppercase">Wildcard Mask</label>
              <input
                type="text"
                value={wildcardInput}
                onChange={(e) => {
                  setActiveSource('wildcard');
                  setWildcardInput(e.target.value);
                }}
                placeholder="e.g. 0.0.0.255"
                className="w-full bg-bg-tertiary/50 border border-border rounded-lg px-3 py-2 text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent text-sm"
              />
            </div>

            {error && (
              <div className="p-3 text-xs text-error bg-error/10 border border-error/20 rounded">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Info Card Column */}
        <div className="md:col-span-1">
          <div className="bg-bg-secondary border border-border rounded-xl p-5 shadow-sm space-y-6 h-full flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide border-b border-border pb-2 mb-4">
                Mask Statistics
              </h2>

              {conversion ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="block text-text-muted font-medium mb-1">Prefix Bitcount</span>
                    <span className="font-mono text-sm font-bold text-accent">/{conversion.cidr}</span>
                  </div>
                  <div>
                    <span className="block text-text-muted font-medium mb-1">Total Network Host IPs</span>
                    <span className="font-mono text-sm font-bold text-text-primary">
                      {conversion.totalHosts.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-text-muted font-medium mb-1">Usable Interface IPs</span>
                    <span className="font-mono text-xs text-text-secondary">
                      {conversion.cidr <= 30 ? (conversion.totalHosts - 2).toLocaleString() : conversion.totalHosts}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-muted">Fill out a valid address parameter to calculate statistics.</p>
              )}
            </div>

            {conversion && (
              <div className="border-t border-border pt-4 mt-6">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(`Subnet: ${conversion.subnetMask} | Wildcard: ${conversion.wildcardMask}`, 'all')}
                    className="w-full text-center py-2 px-3 bg-accent hover:bg-accent-hover text-bg-primary font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    {copiedType === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy configuration summary</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
