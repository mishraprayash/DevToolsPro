'use client';

import * as React from 'react';
import { decodeDnsPacket, type DnsPacketDecoded } from '@/tools/dns-decoder/utils';
import { Search, Database, Globe, Layers } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';

// Standard mock DNS Query: queries google.com for IN A record
const MOCK_QUERY_HEX = 'abcd0100000100000000000006676f6f676c6503636f6d0000010001';

// Standard mock DNS Response: google.com response with A record
const MOCK_RESPONSE_HEX = 'abcd8180000100010000000006676f6f676c6503636f6d0000010001c00c000100010000003c00048efb280e';

export default function DnsDecoderPage() {
  const [hexInput, setHexInput] = React.useState(MOCK_RESPONSE_HEX);
  const [decoded, setDecoded] = React.useState<DnsPacketDecoded | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleDecode = React.useCallback(() => {
    if (!hexInput.trim()) {
      setDecoded(null);
      setError(null);
      return;
    }
    const res = decodeDnsPacket(hexInput);
    if (res.success) {
      setDecoded(res.data);
      setError(null);
    } else {
      setError(res.error);
      setDecoded(null);
    }
  }, [hexInput]);

  React.useEffect(() => {
    handleDecode();
  }, [handleDecode]);

  return (
    <ToolLayout
      name="DNS Record Decoder"
      description="Inspect binary DNS queries and response packets parsed from raw hex streams"
      category="Formatting"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Payload Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">Hex Packet Payload</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setHexInput(MOCK_QUERY_HEX)}
                className="text-[10px] bg-bg-secondary hover:bg-bg-hover text-text-secondary px-2 py-1 rounded border border-border cursor-pointer"
              >
                Mock Query
              </button>
              <button
                onClick={() => setHexInput(MOCK_RESPONSE_HEX)}
                className="text-[10px] bg-bg-secondary hover:bg-bg-hover text-text-secondary px-2 py-1 rounded border border-border cursor-pointer"
              >
                Mock Response
              </button>
            </div>
          </div>

          <textarea
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            className="w-full min-h-[220px] p-4 rounded-xl bg-bg-tertiary border border-border text-xs text-text-primary focus:outline-none focus:border-accent resize-y font-mono"
            placeholder="Paste raw DNS hex payload here..."
          />

          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Right Side: Decoded Results */}
        <div className="space-y-6">
          {decoded ? (
            <div className="space-y-6 animate-fade-in">
              {/* Header Info */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border">
                  <Database className="h-4 w-4" /> Header Fields
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="block text-text-muted font-medium">Tx Transaction ID</span>
                    <span className="font-mono font-bold text-text-primary">{decoded.header.transactionId}</span>
                  </div>
                  <div>
                    <span className="block text-text-muted font-medium">Direction Type</span>
                    <span className="font-mono text-accent font-semibold">{decoded.header.flags.qr}</span>
                  </div>
                  <div>
                    <span className="block text-text-muted font-medium">Result Status</span>
                    <span className="font-mono text-text-primary">{decoded.header.flags.rcode}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-t border-border pt-4">
                  <div>
                    <span className="block text-text-muted">Questions</span>
                    <span className="font-mono font-bold text-text-primary">{decoded.header.questionsCount}</span>
                  </div>
                  <div>
                    <span className="block text-text-muted">Answer RRs</span>
                    <span className="font-mono font-bold text-text-primary">{decoded.header.answersCount}</span>
                  </div>
                  <div>
                    <span className="block text-text-muted">Authority RRs</span>
                    <span className="font-mono font-bold text-text-primary">{decoded.header.authorityCount}</span>
                  </div>
                  <div>
                    <span className="block text-text-muted">Additional RRs</span>
                    <span className="font-mono font-bold text-text-primary">{decoded.header.additionalCount}</span>
                  </div>
                </div>
              </div>

              {/* Questions Section */}
              {decoded.questions.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border">
                    <Search className="h-4 w-4" /> DNS Questions
                  </h3>
                  {decoded.questions.map((q, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 bg-muted/10 border border-border rounded-lg font-mono">
                      <div>
                        <span className="block font-bold text-text-primary">{q.name}</span>
                        <span className="text-text-muted text-[10px]">Class: {q.class}</span>
                      </div>
                      <span className="bg-accent/15 text-accent font-semibold px-2 py-0.5 rounded text-[10px]">
                        Type: {q.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Answers Section */}
              {decoded.answers.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-border">
                    <Globe className="h-4 w-4" /> DNS Answers (Resource Records)
                  </h3>
                  {decoded.answers.map((ans, idx) => (
                    <div key={idx} className="p-3 bg-muted/20 border border-border rounded-lg space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-text-primary">{ans.name}</span>
                        <span className="bg-green-500/15 text-green-500 font-semibold px-2 py-0.5 rounded text-[10px]">
                          Type: {ans.type}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-text-muted">
                        <span>Class: {ans.class}</span>
                        <span>TTL: {ans.ttl}s</span>
                      </div>
                      <div className="border-t border-border/60 pt-1.5 flex items-start gap-1">
                        <span className="text-[10px] text-text-muted uppercase font-semibold">Data:</span>
                        <span className="text-accent font-bold break-all">{ans.data}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center text-text-muted min-h-[200px]">
              <Layers className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Enter a valid HEX payload on the left to start decoding.</p>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
