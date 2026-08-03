'use client';

import * as React from 'react';
import { Pipette, Sun, Moon, Info, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { convertColor, type HarmonyColor } from '@/tools/color/utils';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

const examples = [
  { label: 'Tomato Red', value: 'tomato' },
  { label: 'Deep Blue', value: 'rgb(33, 150, 243)' },
  { label: 'Medium Purple', value: '#8e44ad' },
  { label: 'Sunset Orange', value: 'hsl(24, 100%, 50%)' },
  { label: 'Translucent Teal', value: 'rgba(0, 150, 136, 0.6)' },
];

function HarmonySwatch({ color, onSelect }: { color: HarmonyColor; onSelect: (val: string) => void }) {
  return (
    <div 
      onClick={() => onSelect(color.hex)}
      className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0"
    >
      <div
        className="w-10 h-10 rounded-xl border border-border shrink-0 transition-transform group-hover:scale-105 group-hover:shadow-sm"
        style={{ backgroundColor: color.hex }}
        title={`Click to copy: ${color.hex}`}
      />
      <span className="text-[10px] text-text-muted text-center font-semibold leading-tight max-w-[70px] truncate">
        {color.name.split(' (')[0]}
      </span>
      <span className="text-[9px] font-mono text-text-muted group-hover:text-accent transition-colors">
        {color.hex}
      </span>
    </div>
  );
}

export default function Page() {
  const [input, setInput] = React.useState(examples[0].value);
  const [activeExample, setActiveExample] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const result = React.useMemo(() => convertColor(input), [input]);

  const formats = result.success
    ? [
        { label: 'HEX', value: result.hex },
        { label: 'HEXA', value: result.hexa },
        { label: 'RGB', value: result.rgb },
        { label: 'RGBA', value: result.rgba },
        { label: 'HSL', value: result.hsl },
        { label: 'HSLA', value: result.hsla },
        { label: 'CMYK', value: result.cmyk },
      ]
    : [];

  const uniqueHarmonies = result.success
    ? result.harmonies.filter(
        (c, i, arr) => arr.findIndex((h) => h.name === c.name) === i,
      )
    : [];

  const handleSelectColor = (val: string) => {
    setInput(val);
    setActiveExample(-1);
    toast({ type: 'success', message: `Selected color: ${val}` });
  };

  // Browser eye-dropper API support
  const supportsEyeDropper = mounted && typeof window !== 'undefined' && 'EyeDropper' in window;
  
  const handleEyeDropper = async () => {
    if (!supportsEyeDropper) return;
    try {
      const eyeDropper = new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper();
      const result = await eyeDropper.open();
      if (result.sRGBHex) {
        setInput(result.sRGBHex);
        setActiveExample(-1);
        toast({ type: 'success', message: 'Color captured from screen!' });
      }
    } catch {
      // cancel/ignore
    }
  };

  // WCAG Compliance checker helper
  const getWcagChecks = (contrast: number) => {
    return {
      normalAA: contrast >= 4.5,
      normalAAA: contrast >= 7.0,
      largeAA: contrast >= 3.0,
      largeAAA: contrast >= 4.5,
    };
  };

  const whiteChecks = result.success ? getWcagChecks(result.contrastOnWhite) : null;
  const blackChecks = result.success ? getWcagChecks(result.contrastOnBlack) : null;

  return (
    <ToolLayout 
      name="Color Converter & Palette Builder" 
      description="Convert CSS color encodings, check WCAG 2.1 contrast accessibility standards, and generate harmonic color schemes" 
      category="Formatting"
    >
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={(i) => { setActiveExample(i); setInput(examples[i].value); }} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side Inputs & Actions */}
        <div className="space-y-4 animate-fade-in">
          <h2 className="text-base font-medium text-text-secondary">Input Color Value</h2>

          {result.success && (
            <div className="flex items-center gap-4 p-5 rounded-xl border border-border bg-bg-tertiary shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent pointer-events-none" />
              
              <div className="relative shrink-0 select-none">
                {/* Checkerboard background for transparent color previewing */}
                <div className="absolute inset-0 rounded-xl bg-[repeating-conic-gradient(#808080_0%_25%,transparent_0%_50%)_50%/8px_8px] border border-border" />
                <div 
                  className="relative w-16 h-16 rounded-xl border-2 border-border shadow-inner" 
                  style={{ backgroundColor: result.rgba }} 
                />
              </div>
              
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Currently Parsing</span>
                <span className="text-lg font-mono font-bold text-text-primary block truncate mt-0.5">{result.hex}</span>
                <span className="text-xs text-text-muted mt-1 inline-block">
                  {result.a < 1 ? `Alpha opacity: ${result.a}` : 'Opaque Color'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {supportsEyeDropper && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleEyeDropper}
                    icon={<Pipette className="h-4 w-4" />}
                    title="Pick a color from your screen"
                  />
                )}
                
                <input 
                  type="color" 
                  value={result.hex} 
                  onChange={(e) => { 
                    setInput(e.target.value); 
                    setActiveExample(-1); 
                  }}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-border bg-transparent p-0.5 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none shadow-sm hover:scale-105 transition-transform" 
                />
              </div>
            </div>
          )}

          <Input 
            value={input} 
            onChange={(e) => { setInput(e.target.value); setActiveExample(-1); }}
            placeholder="tomato, #ff6600, rgb(255, 102, 0), hsl(24, 100%, 50%)..."
            monospace 
          />

          {!result.success && (
            <div className="p-4 rounded-xl bg-error/10 text-error border border-error/30 text-sm flex gap-3 items-start shadow-sm">
              <ShieldAlert className="h-5 w-5 shrink-0 text-error mt-0.5" />
              <p className="leading-relaxed">{result.error}</p>
            </div>
          )}

          {result.success && (
            <div className="flex flex-wrap gap-2 animate-fade-in">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/30 font-mono">
                RGB: {result.r}, {result.g}, {result.b}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/30 font-mono">
                HSL: {result.h}°, {result.s}%, {result.l}%
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning/30 font-mono">
                CMYK: {result.c}%, {result.m}%, {result.y}%, {result.k}%
              </span>
            </div>
          )}

          {/* Quick Named Color swatches */}
          <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-3.5 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary font-outfit border-b border-border pb-2.5">
              <Sparkles className="h-4 w-4 text-accent animate-pulse-glow" />
              <span>Click to Try Named CSS Palette Colors</span>
            </div>
            
            <div className="flex flex-wrap gap-2.5 max-h-[140px] overflow-y-auto pr-1">
              {['crimson', 'tomato', 'darkorange', 'gold', 'chartreuse', 'lime', 'teal', 'darkslateblue', 'indigo', 'deeppink', 'papayawhip', 'lavender', 'wheat'].map((name) => (
                <button
                  key={name}
                  onClick={() => handleSelectColor(name)}
                  className="px-2.5 py-1.5 rounded-lg border border-border hover:border-accent flex items-center gap-1.5 text-xs font-semibold bg-bg-tertiary hover:bg-bg-hover text-text-secondary hover:text-accent transition-all capitalize"
                >
                  <span className="w-3.5 h-3.5 rounded-full border border-border shrink-0" style={{ backgroundColor: name }} />
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Formats, Harmonies, WCAG accessibility */}
        <div className="space-y-6">
          <h2 className="text-base font-medium text-text-secondary">Exportable Formats</h2>

          {result.success ? (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-2">
                {formats.map(({ label, value }) => (
                  <CopyButton key={label} value={value} variant="ghost" className="w-full flex items-center justify-between p-3.5 rounded-xl bg-bg-tertiary border border-border hover:bg-bg-hover transition-all">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider w-12 shrink-0 text-left">{label}</span>
                      <span className="text-sm font-mono text-text-primary truncate font-bold">{value}</span>
                    </div>
                  </CopyButton>
                ))}
              </div>

              {/* Advanced WCAG Accessibility Checker */}
              {whiteChecks && blackChecks && (
                <div className="p-5 rounded-xl border border-border bg-bg-tertiary space-y-4 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary font-outfit border-b border-border pb-2.5">
                    <Info className="h-4 w-4 text-accent" />
                    <span>WCAG 2.1 Contrast Level Audits</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* On White */}
                    <div className="p-4 rounded-xl bg-bg-secondary border border-border/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs font-bold text-text-secondary">
                          <Sun className="h-3.5 w-3.5 text-yellow-500 shrink-0" /> On White (1.0)
                        </span>
                        <span className="font-mono text-xs font-bold text-text-primary bg-bg-tertiary px-2 py-0.5 rounded border border-border">
                          {result.contrastOnWhite}:1
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-text-muted">
                        <div className="flex items-center gap-1">
                          {whiteChecks.normalAA ? <Check className="h-3.5 w-3.5 text-success" /> : <X className="h-3.5 w-3.5 text-error" />}
                          <span>AA Text</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {whiteChecks.normalAAA ? <Check className="h-3.5 w-3.5 text-success" /> : <X className="h-3.5 w-3.5 text-error" />}
                          <span>AAA Text</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {whiteChecks.largeAA ? <Check className="h-3.5 w-3.5 text-success" /> : <X className="h-3.5 w-3.5 text-error" />}
                          <span>AA Large</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {whiteChecks.largeAAA ? <Check className="h-3.5 w-3.5 text-success" /> : <X className="h-3.5 w-3.5 text-error" />}
                          <span>AAA Large</span>
                        </div>
                      </div>
                    </div>

                    {/* On Black */}
                    <div className="p-4 rounded-xl bg-bg-secondary border border-border/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs font-bold text-text-secondary">
                          <Moon className="h-3.5 w-3.5 text-blue-400 shrink-0" /> On Black (0.0)
                        </span>
                        <span className="font-mono text-xs font-bold text-text-primary bg-bg-tertiary px-2 py-0.5 rounded border border-border">
                          {result.contrastOnBlack}:1
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-text-muted">
                        <div className="flex items-center gap-1">
                          {blackChecks.normalAA ? <Check className="h-3.5 w-3.5 text-success" /> : <X className="h-3.5 w-3.5 text-error" />}
                          <span>AA Text</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {blackChecks.normalAAA ? <Check className="h-3.5 w-3.5 text-success" /> : <X className="h-3.5 w-3.5 text-error" />}
                          <span>AAA Text</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {blackChecks.largeAA ? <Check className="h-3.5 w-3.5 text-success" /> : <X className="h-3.5 w-3.5 text-error" />}
                          <span>AA Large</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {blackChecks.largeAAA ? <Check className="h-3.5 w-3.5 text-success" /> : <X className="h-3.5 w-3.5 text-error" />}
                          <span>AAA Large</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] text-text-muted pt-1 select-none">
                    <span>Luminance: <strong className="font-mono text-text-primary">{result.luminance.toFixed(4)}</strong></span>
                    <span>Contrast Ratio guidelines based on WCAG 2.1 normal (4.5:1) / large (3.0:1)</span>
                  </div>
                </div>
              )}

              {/* Advanced Harmonies Swatches */}
              <div className="p-5 rounded-xl border border-border bg-bg-tertiary space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-outfit">Interactive Color Harmonies</span>
                  <span className="text-[9px] text-text-muted uppercase font-bold tracking-wider">Click swatches to load</span>
                </div>
                
                <div className="flex items-start gap-4 flex-wrap select-none justify-center sm:justify-start">
                  {uniqueHarmonies.map((color) => (
                    <HarmonySwatch 
                      key={`${color.name}-${color.hex}`} 
                      color={color} 
                      onSelect={handleSelectColor} 
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 rounded-xl bg-bg-tertiary border border-border border-dashed text-text-muted text-sm italic">
              Please enter a valid colour token to view conversions and harmony palettes.
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
