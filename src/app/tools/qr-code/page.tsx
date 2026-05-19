'use client';

import * as React from 'react';
import { QrCode, Download, RotateCcw } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { CopyButton } from '@/components/ui/CopyButton';
import { generateQrCode, type QrResult } from '@/tools/qr-code/utils';

const examples = [
  { label: 'URL', value: 'https://example.com' },
  { label: 'WiFi', value: 'WIFI:S:MyNetwork;T:WPA;P:secret123;;' },
  { label: 'vCard', value: 'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+1234567890\nEND:VCARD' },
  { label: 'Email', value: 'mailto:hello@example.com' },
];

export default function Page() {
  const [input, setInput] = React.useState(examples[0].value);
  const [size, setSize] = React.useState(300);
  const [errorLevel, setErrorLevel] = React.useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [result, setResult] = React.useState<QrResult | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleGenerate = React.useCallback(async () => {
    setLoading(true);
    const res = await generateQrCode(input, { size, errorCorrectionLevel: errorLevel });
    setResult(res);
    setLoading(false);
  }, [input, size, errorLevel]);

  React.useEffect(() => {
    const timer = setTimeout(handleGenerate, 200);
    return () => clearTimeout(timer);
  }, [handleGenerate]);

  const applyExample = React.useCallback((value: string) => {
    setInput(value);
  }, []);

  const handleDownload = React.useCallback(() => {
    if (!result?.success) return;
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = result.dataUrl;
    link.click();
  }, [result]);

  const handleReset = React.useCallback(() => {
    setInput('');
    setResult(null);
  }, []);

  return (
    <ToolLayout name="QR Code Generator" description="Generate QR codes from text, URLs, and more" category="Encoding">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">Content</label>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text, URL, or any data..."
              monospace
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {examples.map((ex) => (
              <button key={ex.label} onClick={() => applyExample(ex.value)}
                className="px-2.5 py-1 rounded-full text-xs bg-bg-tertiary border border-border hover:border-accent hover:text-accent transition-colors">
                {ex.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Size (px)</label>
              <input type="range" min="128" max="600" step="8" value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-accent" />
              <p className="text-xs text-text-muted mt-1">{size} × {size}</p>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">Error Correction</label>
              <Select value={errorLevel} onChange={(e) => setErrorLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}
                options={[
                  { value: 'L', label: 'Low (7%)' },
                  { value: 'M', label: 'Medium (15%)' },
                  { value: 'Q', label: 'Quartile (25%)' },
                  { value: 'H', label: 'High (30%)' },
                ]} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleReset} icon={<RotateCcw className="h-4 w-4" />}>
              Clear
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-medium text-text-secondary">Preview</h2>

          <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-bg-tertiary border border-border min-h-[320px]">
            {loading ? (
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <div className="h-4 w-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                Generating...
              </div>
            ) : result?.success ? (
              <>
                <div className="bg-white p-4 rounded-xl border border-border/40 shadow-sm">
                  <img src={result.dataUrl} alt="QR Code" width={size} height={size}
                    className="max-w-full h-auto rounded-lg" style={{ imageRendering: 'pixelated' }} />
                </div>
                <p className="text-xs text-text-muted mt-3 break-all max-w-full text-center">
                  {input.slice(0, 60)}{input.length > 60 ? '…' : ''}
                </p>
              </>
            ) : (
              <div className="text-text-muted text-sm text-center">
                <QrCode className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Enter content to generate a QR code</p>
                {result?.success === false && <p className="text-error text-xs mt-2">{result.error}</p>}
              </div>
            )}
          </div>

          {result?.success && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleDownload} icon={<Download className="h-4 w-4" />}>
                Download PNG
              </Button>
              <CopyButton value={result.dataUrl} label="Copy Data URL" />
            </div>
          )}

          <div className="p-5 rounded-xl bg-bg-secondary border border-border">
            <h3 className="text-sm font-medium mb-2">About QR Codes</h3>
            <ul className="space-y-1.5 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <QrCode className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
                <span>Higher error correction adds more redundancy but reduces data capacity</span>
              </li>
              <li className="flex items-start gap-2">
                <QrCode className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
                <span>All processing happens in your browser — nothing is uploaded to any server</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
