'use client';

import * as React from 'react';
import { Settings, Copy, RefreshCw, Smartphone, Monitor, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { convertUnits, generateFluidClamp, calculateCurrentSize, type UnitConversionResult } from '@/tools/css-unit-converter/utils';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

const unitOptions = [
  { value: 'px', label: 'Pixels (px)' },
  { value: 'rem', label: 'Root Em (rem)' },
  { value: 'em', label: 'Element Em (em)' },
  { value: 'vw', label: 'Viewport Width (vw)' },
  { value: 'vh', label: 'Viewport Height (vh)' },
  { value: '%', label: 'Percentage (%)' },
];

export default function Page() {
  const [activeTab, setActiveTab] = React.useState<'converter' | 'fluid'>('converter');

  // --- Converter Tab States ---
  const [inputValue, setInputValue] = React.useState<string>('16');
  const [fromUnit, setFromUnit] = React.useState<'px' | 'rem' | 'em' | 'vw' | 'vh' | '%'>('px');
  const [rootFontSize, setRootFontSize] = React.useState<string>('16');
  const [viewportWidth, setViewportWidth] = React.useState<string>('1920');
  const [viewportHeight, setViewportHeight] = React.useState<string>('1080');
  const [conversionResult, setConversionResult] = React.useState<UnitConversionResult | null>(null);

  // --- Fluid Typography Tab States ---
  const [minSize, setMinSize] = React.useState<string>('16');
  const [maxSize, setMaxSize] = React.useState<string>('48');
  const [minWidth, setMinWidth] = React.useState<string>('320');
  const [maxWidth, setMaxWidth] = React.useState<string>('1200');
  const [fluidRootSize, setFluidRootSize] = React.useState<string>('16');
  const [useRem, setUseRem] = React.useState<boolean>(true);
  
  // Interactive Sandbox Viewport slider state
  const [simulatedViewport, setSimulatedViewport] = React.useState<number>(768);

  // Run Unit Conversions
  const handleConvert = React.useCallback(() => {
    const val = parseFloat(inputValue);
    const rootBase = parseFloat(rootFontSize) || 16;
    const vWidth = parseFloat(viewportWidth) || 1920;
    const vHeight = parseFloat(viewportHeight) || 1080;

    if (isNaN(val)) {
      setConversionResult(null);
      return;
    }

    const res = convertUnits(val, fromUnit, rootBase, vWidth, vHeight);
    setConversionResult(res);
  }, [inputValue, fromUnit, rootFontSize, viewportWidth, viewportHeight]);

  React.useEffect(() => {
    handleConvert();
  }, [handleConvert]);

  // Generate Fluid Clamp
  const fluidResult = React.useMemo(() => {
    const minS = parseFloat(minSize) || 16;
    const maxS = parseFloat(maxSize) || 48;
    const minW = parseFloat(minWidth) || 320;
    const maxW = parseFloat(maxWidth) || 1200;
    const base = parseFloat(fluidRootSize) || 16;

    return generateFluidClamp({
      minSize: minS,
      maxSize: maxS,
      minWidth: minW,
      maxWidth: maxW,
      rootFontSize: base,
      useRem,
    });
  }, [minSize, maxSize, minWidth, maxWidth, fluidRootSize, useRem]);

  // Calculate live current simulated font size for sandbox
  const simulatedFontSize = React.useMemo(() => {
    const minS = parseFloat(minSize) || 16;
    const maxS = parseFloat(maxSize) || 48;
    const minW = parseFloat(minWidth) || 320;
    const maxW = parseFloat(maxWidth) || 1200;

    return calculateCurrentSize(simulatedViewport, {
      minSize: minS,
      maxSize: maxS,
      minWidth: minW,
      maxWidth: maxW,
      rootFontSize: 16,
      useRem: false
    });
  }, [simulatedViewport, minSize, maxSize, minWidth, maxWidth]);

  const handleCopyValue = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ type: 'success', message: `Copied ${label}: ${text}` });
  };

  const handleResetConverter = () => {
    setInputValue('16');
    setFromUnit('px');
    setRootFontSize('16');
    setViewportWidth('1920');
    setViewportHeight('1080');
  };

  const handleResetFluid = () => {
    setMinSize('16');
    setMaxSize('48');
    setMinWidth('320');
    setMaxWidth('1200');
    setFluidRootSize('16');
    setUseRem(true);
    setSimulatedViewport(768);
  };

  return (
    <ToolLayout
      name="CSS Unit & Fluid Typography Converter"
      description="Convert CSS dimensions dynamically or generate fluid responsive clamp() typography expressions with interactive sandbox previews"
      category="Formatting"
    >
      {/* Dynamic Tab Switcher */}
      <div className="flex border-b border-border/80 mb-6">
        <button
          onClick={() => setActiveTab('converter')}
          className={cn(
            'px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200',
            activeTab === 'converter'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          CSS Unit Converter
        </button>
        <button
          onClick={() => setActiveTab('fluid')}
          className={cn(
            'px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200',
            activeTab === 'fluid'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          Fluid Responsive Typography
        </button>
      </div>

      {activeTab === 'converter' ? (
        /* Tab 1: CSS Unit Converter */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-text-secondary">Sizing Dimensions</h2>
              <Button variant="ghost" size="sm" onClick={handleResetConverter} icon={<RefreshCw className="h-4 w-4" />}>
                Reset
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Input Sizing Value</label>
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="16"
                  className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 text-sm transition-all"
                />
              </div>

              <Select
                label="Source Unit"
                options={unitOptions}
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value as any)}
              />
            </div>

            <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-text-primary font-outfit border-b border-border pb-2">
                <Settings className="h-4 w-4 text-accent" />
                <span>Conversion Context Settings</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Root size (px)</label>
                  <input
                    type="number"
                    value={rootFontSize}
                    onChange={(e) => setRootFontSize(e.target.value)}
                    placeholder="16"
                    className="w-full h-9 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-xs focus:outline-none focus:border-accent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Viewport width (px)</label>
                  <input
                    type="number"
                    value={viewportWidth}
                    onChange={(e) => setViewportWidth(e.target.value)}
                    placeholder="1920"
                    className="w-full h-9 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-xs focus:outline-none focus:border-accent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Viewport height (px)</label>
                  <input
                    type="number"
                    value={viewportHeight}
                    onChange={(e) => setViewportHeight(e.target.value)}
                    placeholder="1080"
                    className="w-full h-9 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-xs focus:outline-none focus:border-accent transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sizing Output Grid */}
          <div className="space-y-4">
            <h2 className="text-base font-medium text-text-secondary">Converted Values</h2>
            
            <div className="border border-border rounded-xl bg-bg-tertiary overflow-hidden shadow-sm">
              {conversionResult ? (
                <div className="divide-y divide-border/60">
                  {Object.entries(conversionResult).map(([unit, val]) => (
                    <div key={unit} className="flex items-center justify-between p-4 hover:bg-bg-hover/20 transition-colors">
                      <div>
                        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{unit}</span>
                        <p className="text-lg font-semibold font-mono text-text-primary mt-0.5">{val}</p>
                      </div>
                      <button
                        onClick={() => handleCopyValue(val, unit.toUpperCase())}
                        className="p-2 rounded-lg border border-border hover:bg-bg-secondary text-text-secondary hover:text-accent transition-all"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-text-muted italic">
                  Enter a sizing value to begin conversion.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Fluid Typography Generator */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-text-secondary">Clamp Sizing Rules</h2>
              <Button variant="ghost" size="sm" onClick={handleResetFluid} icon={<RefreshCw className="h-4 w-4" />}>
                Reset
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Min Font Size (px)</label>
                <input
                  type="number"
                  value={minSize}
                  onChange={(e) => setMinSize(e.target.value)}
                  placeholder="16"
                  className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-accent text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Max Font Size (px)</label>
                <input
                  type="number"
                  value={maxSize}
                  onChange={(e) => setMaxSize(e.target.value)}
                  placeholder="48"
                  className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-accent text-sm transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Min Viewport Width (px)</label>
                <input
                  type="number"
                  value={minWidth}
                  onChange={(e) => setMinWidth(e.target.value)}
                  placeholder="320"
                  className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-accent text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Max Viewport Width (px)</label>
                <input
                  type="number"
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(e.target.value)}
                  placeholder="1200"
                  className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-text-primary focus:outline-none focus:border-accent text-sm transition-all"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-text-primary font-outfit border-b border-border pb-2">
                <Settings className="h-4 w-4 text-accent" />
                <span>Typography Settings</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Root size (px)</label>
                  <input
                    type="number"
                    value={fluidRootSize}
                    onChange={(e) => setFluidRootSize(e.target.value)}
                    placeholder="16"
                    className="w-full h-9 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-xs focus:outline-none focus:border-accent transition-all"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useRem}
                      onChange={(e) => setUseRem(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-bg-primary bg-bg-tertiary transition-all cursor-pointer"
                    />
                    <span>Convert sizes to rem units</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Fluid Sizing Clamp Outputs */}
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-medium text-text-secondary mb-3">Responsive CSS Code</h2>
              <div className="space-y-3.5">
                {/* CSS Native style */}
                <div className="p-4 rounded-xl bg-bg-tertiary border border-border flex items-center justify-between shadow-sm">
                  <div className="flex-1 min-w-0 pr-4">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">CSS Rule</span>
                    <pre className="text-sm font-semibold font-mono text-text-primary mt-1 break-all truncate select-all">
                      font-size: {fluidResult.clampCode};
                    </pre>
                  </div>
                  <button
                    onClick={() => handleCopyValue(`font-size: ${fluidResult.clampCode};`, 'CSS Rule')}
                    className="p-2.5 rounded-lg border border-border bg-bg-secondary hover:bg-bg-hover text-text-secondary hover:text-accent transition-all shrink-0"
                  >
                    <Copy className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Tailwind CSS arbitrary */}
                <div className="p-4 rounded-xl bg-bg-tertiary border border-border flex items-center justify-between shadow-sm">
                  <div className="flex-1 min-w-0 pr-4">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Tailwind Utility Class</span>
                    <pre className="text-sm font-semibold font-mono text-text-primary mt-1 break-all truncate select-all">
                      {fluidResult.tailwindArbitrary}
                    </pre>
                  </div>
                  <button
                    onClick={() => handleCopyValue(fluidResult.tailwindArbitrary, 'Tailwind Arbitrary Class')}
                    className="p-2.5 rounded-lg border border-border bg-bg-secondary hover:bg-bg-hover text-text-secondary hover:text-accent transition-all shrink-0"
                  >
                    <Copy className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* CSS Variable */}
                <div className="p-4 rounded-xl bg-bg-tertiary border border-border flex items-center justify-between shadow-sm">
                  <div className="flex-1 min-w-0 pr-4">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">CSS Variable</span>
                    <pre className="text-sm font-semibold font-mono text-text-primary mt-1 break-all truncate select-all">
                      {fluidResult.cssVariable}
                    </pre>
                  </div>
                  <button
                    onClick={() => handleCopyValue(fluidResult.cssVariable, 'CSS Variable')}
                    className="p-2.5 rounded-lg border border-border bg-bg-secondary hover:bg-bg-hover text-text-secondary hover:text-accent transition-all shrink-0"
                  >
                    <Copy className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Viewport Interactive Sandbox */}
            <div className="p-5 rounded-xl border border-border bg-bg-secondary/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
                  <Eye className="h-4.5 w-4.5 text-accent" />
                  <span>Fluid Viewport Simulator</span>
                </div>
                
                <div className="flex items-center gap-3.5 text-xs text-text-muted font-mono bg-bg-tertiary px-3.5 py-1.5 rounded-lg border border-border">
                  <span className="flex items-center gap-1">
                    <Monitor className="h-3.5 w-3.5 text-accent/80" />
                    Width: <strong>{simulatedViewport}px</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Size: <strong>{simulatedFontSize.toFixed(1)}px</strong>
                  </span>
                </div>
              </div>

              {/* Viewport Slider */}
              <div className="space-y-1.5">
                <input
                  type="range"
                  min="320"
                  max="1500"
                  value={simulatedViewport}
                  onChange={(e) => setSimulatedViewport(parseInt(e.target.value, 10))}
                  className="w-full h-2 rounded-lg bg-bg-tertiary appearance-none cursor-pointer accent-accent border border-border"
                />
                <div className="flex justify-between text-[10px] font-mono text-text-muted px-1">
                  <span>320px (Mobile)</span>
                  <span>768px (Tablet)</span>
                  <span>1024px (Laptop)</span>
                  <span>1440px+ (Desktop)</span>
                </div>
              </div>

              {/* Text simulation canvas */}
              <div className="border border-border/80 rounded-lg p-5 bg-bg-tertiary overflow-hidden flex items-center justify-center min-h-[140px]">
                <div className="text-center w-full space-y-2">
                  <h3
                    style={{ fontSize: `${simulatedFontSize}px`, lineHeight: '1.2' }}
                    className="font-bold text-text-primary font-outfit transition-all duration-75 select-none"
                  >
                    Responsive Heading
                  </h3>
                  <p className="text-xs text-text-muted select-none">
                    Watch this text scale smoothly as you drag the slider above!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
