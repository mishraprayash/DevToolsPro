'use client';

import * as React from 'react';
import { Download, Image as ImageIcon, Code2, RotateCcw, AlertTriangle } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  buildFavicon,
  validateHexColor,
  DEFAULT_OPTIONS,
  type FaviconShape,
} from '@/tools/favicon/utils';

const shapeOptions: Array<{ value: FaviconShape; label: string }> = [
  { value: 'rounded', label: 'Rounded' },
  { value: 'circle', label: 'Circle' },
  { value: 'square', label: 'Square' },
];

const colorPresets = [
  { label: 'Cyan', value: '#22d3ee' },
  { label: 'Indigo', value: '#818cf8' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Violet', value: '#a855f7' },
  { label: 'Dark', value: '#1c1c1e' },
];

export default function Page() {
  const [text, setText] = React.useState(DEFAULT_OPTIONS.text);
  const [backgroundColor, setBackgroundColor] = React.useState(DEFAULT_OPTIONS.backgroundColor);
  const [textColor, setTextColor] = React.useState(DEFAULT_OPTIONS.textColor);
  const [fontSize, setFontSize] = React.useState(DEFAULT_OPTIONS.fontSize);
  const [shape, setShape] = React.useState<FaviconShape>(DEFAULT_OPTIONS.shape);
  const [padding, setPadding] = React.useState(DEFAULT_OPTIONS.padding);

  const computed = React.useMemo(() => {
    const fgCheck = validateHexColor(textColor);
    const bgCheck = validateHexColor(backgroundColor);
    if (!fgCheck.success) return { output: null, error: fgCheck.error };
    if (!bgCheck.success) return { output: null, error: bgCheck.error };

    const res = buildFavicon({
      text,
      textColor,
      backgroundColor,
      fontSize,
      shape,
      padding,
    });
    return res.success
      ? { output: res.data, error: null }
      : { output: null, error: res.error };
  }, [text, backgroundColor, textColor, fontSize, shape, padding]);

  const output = computed.output;
  const error = computed.error;

  const handleReset = () => {
    setText(DEFAULT_OPTIONS.text);
    setBackgroundColor(DEFAULT_OPTIONS.backgroundColor);
    setTextColor(DEFAULT_OPTIONS.textColor);
    setFontSize(DEFAULT_OPTIONS.fontSize);
    setShape(DEFAULT_OPTIONS.shape);
    setPadding(DEFAULT_OPTIONS.padding);
  };

  const handleDownloadSvg = () => {
    if (!output) return;
    const blob = new Blob([output.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'favicon.svg';
    a.click();
    URL.revokeObjectURL(url);
    toast({ type: 'success', message: 'Downloaded favicon.svg' });
  };

  const handleDownloadPng = () => {
    if (!output) return;
    const size = 256;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, size, size);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'favicon.png';
      a.click();
      toast({ type: 'success', message: 'Downloaded favicon.png' });
    };
    img.src = output.dataUri;
  };

  return (
    <ToolLayout
      name="Favicon Generator"
      description="Design an instant SVG favicon from text or emoji, tune shape and colors, and export as SVG or PNG."
      category="Encoding"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-border bg-bg-secondary space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary font-outfit">Favicon Text</h2>
              <Button variant="ghost" size="sm" onClick={handleReset} icon={<RotateCcw className="h-4 w-4" />}>
                Reset
              </Button>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Text or emoji (up to 6 characters)</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 6))}
                placeholder="D, 🚀, Dev"
                className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-border bg-bg-tertiary cursor-pointer p-1"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary font-mono text-xs focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Text color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-border bg-bg-tertiary cursor-pointer p-1"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary font-mono text-xs focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Background presets</label>
              <div className="flex items-center gap-2 flex-wrap">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setBackgroundColor(preset.value)}
                    title={preset.label}
                    className={cn(
                      'w-8 h-8 rounded-lg border transition-transform hover:scale-110 cursor-pointer',
                      backgroundColor === preset.value ? 'border-accent ring-1 ring-accent/40' : 'border-border'
                    )}
                    style={{ backgroundColor: preset.value }}
                    aria-label={preset.label}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Font size ({fontSize}px)</label>
                <input
                  type="range"
                  min={12}
                  max={48}
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Padding ({padding}px)</label>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={padding}
                  onChange={(e) => setPadding(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Shape</label>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-tertiary border border-border w-fit">
                {shapeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setShape(opt.value)}
                    className={cn(
                      'px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                      shape === opt.value ? 'bg-accent text-bg-primary' : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl border border-error/20 bg-error/5 flex items-start gap-2.5 animate-fade-in">
              <AlertTriangle className="h-4 w-4 text-error shrink-0 mt-0.5" />
              <p className="text-xs text-error">{error}</p>
            </div>
          )}

          <div className="p-5 rounded-xl border border-border bg-bg-secondary">
            <h3 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-accent" /> Add to your HTML
            </h3>
            {output && (
              <div className="flex items-start gap-2">
                <code className="flex-1 text-[11px] font-mono text-text-secondary bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 overflow-x-auto whitespace-nowrap">
                  {output.linkTag}
                </code>
                <CopyButton value={output.linkTag} />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-border bg-bg-secondary flex flex-col items-center">
            <h2 className="text-sm font-semibold text-text-primary font-outfit self-start mb-4">Live Preview</h2>
            <div className="flex items-center justify-center gap-6 min-h-[120px] w-full">
              {output ? (
                <>
                  <img src={output.dataUri} alt="Favicon preview" className="w-16 h-16 shadow-lg rounded" />
                  <img src={output.dataUri} alt="Favicon preview large" className="w-24 h-24 shadow-lg rounded" />
                  <div className="hidden sm:flex flex-col items-center gap-1">
                    <img src={output.dataUri} alt="Favicon preview tab" className="w-12 h-12 shadow-lg rounded" />
                    <span className="text-[9px] text-text-muted">Browser tab</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-text-muted">Fix the error to see a preview.</p>
              )}
            </div>

            <div className="mt-6 w-full border-t border-border pt-4">
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div className="p-2 rounded-lg bg-bg-tertiary border border-border">
                  <p className="text-sm font-bold text-text-primary">16×16</p>
                  <p className="text-[10px] text-text-muted">Favicon</p>
                </div>
                <div className="p-2 rounded-lg bg-bg-tertiary border border-border">
                  <p className="text-sm font-bold text-text-primary">32×32</p>
                  <p className="text-[10px] text-text-muted">Tab icon</p>
                </div>
                <div className="p-2 rounded-lg bg-bg-tertiary border border-border">
                  <p className="text-sm font-bold text-text-primary">180×180</p>
                  <p className="text-[10px] text-text-muted">Apple touch</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button onClick={handleDownloadSvg} disabled={!output} icon={<Download className="h-4 w-4" />}>
                  Download SVG
                </Button>
                <Button onClick={handleDownloadPng} disabled={!output} variant="secondary" icon={<ImageIcon className="h-4 w-4" />}>
                  Download PNG
                </Button>
                {output && <CopyButton value={output.svg} label="Copy SVG" />}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-bg-secondary">
            <h3 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-accent" /> SVG Source
            </h3>
            {output && (
              <pre className="max-h-64 overflow-auto font-mono text-[11px] text-text-secondary bg-bg-tertiary border border-border rounded-lg p-3 whitespace-pre-wrap break-all">
                {output.svg}
              </pre>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
