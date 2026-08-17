'use client';

import * as React from 'react';
import { calculateSubnet, calculateSubnetSplits } from '@/tools/subnet/utils';
import { Network, Copy, Check, Info, Layers } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { cn } from '@/lib/utils';

export default function SubnetCalculatorPage() {
  const [ipAddress, setIpAddress] = React.useState('192.168.1.1');
  const [cidr, setCidr] = React.useState(24);
  const [targetSplitCidr, setTargetSplitCidr] = React.useState(26);
  const [activeTab, setActiveTab] = React.useState<'calc' | 'split'>('calc');
  const [copiedType, setCopiedType] = React.useState<string | null>(null);

  const result = React.useMemo(() => {
    return calculateSubnet(ipAddress, cidr);
  }, [ipAddress, cidr]);

  const splitResult = React.useMemo(() => {
    if (activeTab !== 'split') return null;
    return calculateSubnetSplits(ipAddress, cidr, targetSplitCidr);
  }, [ipAddress, cidr, targetSplitCidr, activeTab]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <ToolLayout
      name="IP Subnet Calculator & Splitter"
      description="Calculate network parameters, usable range, binary masks, and split CIDR blocks into smaller subnets."
      category="Network"
    >
      <div className="flex gap-2 mb-6 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab('calc')}
          className={cn(
            'px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all',
            activeTab === 'calc' ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Network className="w-4 h-4" /> Subnet Calculator
        </button>
        <button
          onClick={() => {
            setActiveTab('split');
            if (targetSplitCidr <= cidr) setTargetSplitCidr(Math.min(32, cidr + 2));
          }}
          className={cn(
            'px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all',
            activeTab === 'split' ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Layers className="w-4 h-4" /> Subnet Splitter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left configurations */}
        <div className="space-y-4 md:col-span-1">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Network Configurations</h2>
            
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1 uppercase">IP Address</label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="e.g. 192.168.1.1"
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">Base CIDR Prefix: /{cidr}</label>
              <input
                type="range"
                min="0"
                max="32"
                value={cidr}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setCidr(val);
                  if (targetSplitCidr <= val) setTargetSplitCidr(Math.min(32, val + 1));
                }}
                className="w-full h-2 rounded-lg bg-bg-tertiary appearance-none cursor-pointer accent-accent border border-border"
              />
            </div>

            {activeTab === 'split' && (
              <div className="pt-3 border-t border-border">
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">
                  Target Subnet Mask: /{targetSplitCidr}
                </label>
                <input
                  type="range"
                  min={Math.min(32, cidr + 1)}
                  max="32"
                  value={targetSplitCidr}
                  onChange={(e) => setTargetSplitCidr(parseInt(e.target.value, 10))}
                  className="w-full h-2 rounded-lg bg-bg-tertiary appearance-none cursor-pointer accent-accent border border-border"
                />
                <p className="text-[11px] text-text-secondary mt-1.5 font-mono">
                  Splitting /{cidr} into 2^{targetSplitCidr - cidr} = {Math.pow(2, targetSplitCidr - cidr)} child subnets
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Outputs */}
        <div className="md:col-span-2 space-y-4">
          {activeTab === 'calc' ? (
            result.success ? (
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2 text-accent pb-2 border-b border-border">
                  <Network className="w-5 h-5" />
                  <h3 className="font-semibold text-text-primary">Subnet Calculation Results</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-muted/20 p-3 rounded-lg border border-border flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-semibold text-text-muted uppercase">Subnet Mask</span>
                      <span className="font-mono text-sm text-text-primary">{result.data.subnetMask}</span>
                    </div>
                    <button onClick={() => handleCopy(result.data.subnetMask, 'mask')} className="text-text-muted hover:text-text-primary cursor-pointer">
                      {copiedType === 'mask' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="bg-muted/20 p-3 rounded-lg border border-border flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-semibold text-text-muted uppercase">Network Address</span>
                      <span className="font-mono text-sm text-text-primary">{result.data.networkAddress}</span>
                    </div>
                    <button onClick={() => handleCopy(result.data.networkAddress, 'net')} className="text-text-muted hover:text-text-primary cursor-pointer">
                      {copiedType === 'net' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="bg-muted/20 p-3 rounded-lg border border-border flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-semibold text-text-muted uppercase">Usable IP Range</span>
                      <span className="font-mono text-xs text-text-primary">
                        {result.data.firstUsable} — {result.data.lastUsable}
                      </span>
                    </div>
                    <button onClick={() => handleCopy(`${result.data.firstUsable} - ${result.data.lastUsable}`, 'range')} className="text-text-muted hover:text-text-primary cursor-pointer">
                      {copiedType === 'range' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-text-muted" />}
                    </button>
                  </div>

                  <div className="bg-muted/20 p-3 rounded-lg border border-border flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-semibold text-text-muted uppercase">Broadcast Address</span>
                      <span className="font-mono text-sm text-text-primary">{result.data.broadcastAddress}</span>
                    </div>
                    <button onClick={() => handleCopy(result.data.broadcastAddress, 'bcast')} className="text-text-muted hover:text-text-primary cursor-pointer">
                      {copiedType === 'bcast' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Class & Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-border pt-4">
                  <div>
                    <span className="block text-[10px] font-semibold text-text-muted uppercase">Usable Hosts</span>
                    <span className="font-mono text-sm font-semibold text-accent">{result.data.usableHosts.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-text-muted uppercase">Total Hosts</span>
                    <span className="font-mono text-sm text-text-primary">{result.data.totalHosts.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-text-muted uppercase">IP Class</span>
                    <span className="font-mono text-sm text-text-primary">Class {result.data.ipClass}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-text-muted uppercase">Scope type</span>
                    <span className={`font-mono text-sm font-semibold ${result.data.isPrivate ? 'text-amber-500' : 'text-blue-500'}`}>
                      {result.data.isPrivate ? 'Private Space' : 'Public Internet'}
                    </span>
                  </div>
                </div>

                {/* Binary Outputs */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <span className="block text-xs font-semibold text-text-muted uppercase tracking-wider">Binary Representations</span>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-secondary font-medium">IP address bits:</span>
                      <span className="font-mono text-accent text-right break-all">{result.data.ipBinary}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-secondary font-medium">Subnet mask bits:</span>
                      <span className="font-mono text-text-muted text-right break-all">{result.data.maskBinary}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                <Info className="w-5 h-5 flex-shrink-0" />
                <span>{result.error}</span>
              </div>
            )
          ) : (
            splitResult?.success ? (
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" /> Subnet Split Matrix
                  </h3>
                  <span className="text-xs font-mono text-text-secondary">
                    Total {splitResult.data.length} subnets of /{targetSplitCidr}
                  </span>
                </div>

                <div className="max-h-[440px] overflow-y-auto space-y-2 pr-1">
                  {splitResult.data.map((sub, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-border bg-bg-secondary/60 font-mono text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-accent">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-text-primary">{sub.networkAddress}/{sub.cidr}</span>
                      </div>
                      <div className="text-text-secondary text-[11px]">
                        Usable: <span className="text-text-primary">{sub.firstUsable} — {sub.lastUsable}</span>
                      </div>
                      <div className="text-text-muted text-[11px]">
                        Hosts: <span className="text-accent font-semibold">{sub.usableHosts}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm">
                {splitResult?.error || 'Failed to split subnet'}
              </div>
            )
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
