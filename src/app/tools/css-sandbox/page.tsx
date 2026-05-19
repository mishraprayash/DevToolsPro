'use client';

import * as React from 'react';
import { Sliders, RefreshCw, Layers, Grid, Code, Sparkles, HelpCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Select } from '@/components/ui/Select';
import { GradientBox } from '@/components/ui/GradientBox';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

// Flexbox directions mapping
const flexDirections = [
  { value: 'row', label: 'row (Horizontal)' },
  { value: 'row-reverse', label: 'row-reverse' },
  { value: 'column', label: 'column (Vertical)' },
  { value: 'column-reverse', label: 'column-reverse' },
];

const justifyOptions = [
  { value: 'flex-start', label: 'flex-start (Align Left/Top)' },
  { value: 'center', label: 'center (Center aligned)' },
  { value: 'flex-end', label: 'flex-end (Align Right/Bottom)' },
  { value: 'space-between', label: 'space-between' },
  { value: 'space-around', label: 'space-around' },
  { value: 'space-evenly', label: 'space-evenly' },
];

const alignOptions = [
  { value: 'stretch', label: 'stretch (Fill height)' },
  { value: 'flex-start', label: 'flex-start' },
  { value: 'center', label: 'center' },
  { value: 'flex-end', label: 'flex-end' },
  { value: 'baseline', label: 'baseline' },
];

// Grid mappings
const gridJustifyOptions = [
  { value: 'stretch', label: 'stretch' },
  { value: 'start', label: 'start' },
  { value: 'center', label: 'center' },
  { value: 'end', label: 'end' },
];

export default function Page() {
  const [layoutMode, setLayoutMode] = React.useState<'flex' | 'grid'>('flex');
  const [itemCount, setItemCount] = React.useState<number>(4);

  // --- Flexbox States ---
  const [flexDir, setFlexDir] = React.useState('row');
  const [justifyContent, setJustifyContent] = React.useState('center');
  const [alignItems, setAlignItems] = React.useState('center');
  const [flexWrap, setFlexWrap] = React.useState(false);
  const [flexGap, setFlexGap] = React.useState(16); // in px

  // --- Grid States ---
  const [gridCols, setGridCols] = React.useState(3);
  const [gridRows, setGridRows] = React.useState(2);
  const [gridGap, setGridGap] = React.useState(16); // in px
  const [gridJustify, setGridJustify] = React.useState('stretch');
  const [gridAlign, setGridAlign] = React.useState('stretch');

  const handleReset = () => {
    setItemCount(4);
    setFlexDir('row');
    setJustifyContent('center');
    setAlignItems('center');
    setFlexWrap(false);
    setFlexGap(16);
    setGridCols(3);
    setGridRows(2);
    setGridGap(16);
    setGridJustify('stretch');
    setGridAlign('stretch');
  };

  // Compile CSS output
  const cssCode = React.useMemo(() => {
    if (layoutMode === 'flex') {
      return `.container {
  display: flex;
  flex-direction: ${flexDir};
  justify-content: ${justifyContent};
  align-items: ${alignItems};
  flex-wrap: ${flexWrap ? 'wrap' : 'nowrap'};
  gap: ${flexGap}px;
}`;
    } else {
      return `.container {
  display: grid;
  grid-template-columns: repeat(${gridCols}, minmax(0, 1fr));
  grid-template-rows: repeat(${gridRows}, minmax(0, 1fr));
  gap: ${gridGap}px;
  justify-items: ${gridJustify};
  align-items: ${gridAlign};
}`;
    }
  }, [layoutMode, flexDir, justifyContent, alignItems, flexWrap, flexGap, gridCols, gridRows, gridGap, gridJustify, gridAlign]);

  // Compile Tailwind utility classes
  const tailwindClasses = React.useMemo(() => {
    if (layoutMode === 'flex') {
      const dirClass = flexDir === 'row' ? 'flex-row' : flexDir === 'row-reverse' ? 'flex-row-reverse' : flexDir === 'column' ? 'flex-col' : 'flex-col-reverse';
      const justClass = justifyContent === 'flex-start' ? 'justify-start' : justifyContent === 'flex-end' ? 'justify-end' : justifyContent === 'center' ? 'justify-center' : justifyContent === 'space-between' ? 'justify-between' : justifyContent === 'space-around' ? 'justify-around' : 'justify-evenly';
      const alignClass = alignItems === 'flex-start' ? 'items-start' : alignItems === 'flex-end' ? 'items-end' : alignItems === 'center' ? 'items-center' : alignItems === 'baseline' ? 'items-baseline' : 'items-stretch';
      const wrapClass = flexWrap ? 'flex-wrap' : 'flex-nowrap';
      
      const gapVal = Math.round(flexGap / 4);
      const gapClass = `gap-${gapVal}`;

      return `flex ${dirClass} ${justClass} ${alignClass} ${wrapClass} ${gapClass}`;
    } else {
      const colClass = `grid-cols-${gridCols}`;
      const rowClass = `grid-rows-${gridRows}`;
      const gapVal = Math.round(gridGap / 4);
      const gapClass = `gap-${gapVal}`;
      const justClass = `justify-items-${gridJustify}`;
      const alignClass = `items-${gridAlign}`;

      return `grid ${colClass} ${rowClass} ${gapClass} ${justClass} ${alignClass}`;
    }
  }, [layoutMode, flexDir, justifyContent, alignItems, flexWrap, flexGap, gridCols, gridRows, gridGap, gridJustify, gridAlign]);

  // Inline container styles for preview
  const containerStyle = React.useMemo(() => {
    if (layoutMode === 'flex') {
      return {
        display: 'flex',
        flexDirection: flexDir as any,
        justifyContent: justifyContent,
        alignItems: alignItems,
        flexWrap: (flexWrap ? 'wrap' : 'nowrap') as any,
        gap: `${flexGap}px`,
        width: '100%',
        height: '100%',
        minHeight: '220px',
      };
    } else {
      return {
        display: 'grid',
        gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
        gap: `${gridGap}px`,
        justifyItems: gridJustify,
        alignItems: gridAlign,
        width: '100%',
        height: '100%',
        minHeight: '220px',
      };
    }
  }, [layoutMode, flexDir, justifyContent, alignItems, flexWrap, flexGap, gridCols, gridRows, gridGap, gridJustify, gridAlign]);

  return (
    <ToolLayout
      name="CSS Flexbox & Grid Visual Sandbox"
      description="An interactive visual playground to build CSS Flexbox and Grid layouts and generate standard CSS rules or Tailwind classes instantly"
      category="Formatting"
    >
      {/* Layout switch tabs */}
      <div className="flex border-b border-border/80 mb-6 select-none">
        <button
          onClick={() => { setLayoutMode('flex'); }}
          className={cn(
            'px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200 flex items-center gap-1.5',
            layoutMode === 'flex'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          <Layers className="h-4 w-4" />
          <span>Flexbox Sandbox</span>
        </button>
        <button
          onClick={() => { setLayoutMode('grid'); }}
          className={cn(
            'px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200 flex items-center gap-1.5',
            layoutMode === 'grid'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-text-muted hover:text-text-primary'
          )}
        >
          <Grid className="h-4 w-4" />
          <span>CSS Grid Sandbox</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
        {/* Left Configurations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">Flex &amp; Grid Controls</h2>
            <Button variant="ghost" size="sm" onClick={handleReset} icon={<RotateCcw className="h-4 w-4" />}>
              Reset
            </Button>
          </div>

          <div className="p-5 rounded-xl border border-border bg-bg-secondary space-y-4 shadow-sm select-none">
            {/* General item count control */}
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-2 uppercase">Render Swatch Items: {itemCount}</label>
              <input
                type="range"
                min="1"
                max="12"
                value={itemCount}
                onChange={(e) => setItemCount(parseInt(e.target.value, 10))}
                className="w-full h-2 rounded-lg bg-bg-tertiary appearance-none cursor-pointer accent-accent border border-border"
              />
            </div>

            {layoutMode === 'flex' ? (
              /* Flexbox parameters form */
              <div className="space-y-4 animate-fade-in">
                <Select
                  label="flex-direction"
                  options={flexDirections}
                  value={flexDir}
                  onChange={(e) => setFlexDir(e.target.value)}
                />

                <Select
                  label="justify-content"
                  options={justifyOptions}
                  value={justifyContent}
                  onChange={(e) => setJustifyContent(e.target.value)}
                />

                <Select
                  label="align-items"
                  options={alignOptions}
                  value={alignItems}
                  onChange={(e) => setAlignItems(e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">Gap Spacing: {flexGap}px</label>
                    <input
                      type="range"
                      min="0"
                      max="48"
                      step="4"
                      value={flexGap}
                      onChange={(e) => setFlexGap(parseInt(e.target.value, 10))}
                      className="w-full h-2 rounded-lg bg-bg-tertiary appearance-none cursor-pointer accent-accent border border-border"
                    />
                  </div>

                  <div className="flex flex-col justify-end pb-1.5">
                    <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={flexWrap}
                        onChange={(e) => setFlexWrap(e.target.checked)}
                        className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-bg-tertiary cursor-pointer transition-all"
                      />
                      <span>flex-wrap (allow Wrap)</span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              /* Grid parameters form */
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">Columns: {gridCols}</label>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      value={gridCols}
                      onChange={(e) => setGridCols(parseInt(e.target.value, 10))}
                      className="w-full h-2 rounded-lg bg-bg-tertiary appearance-none cursor-pointer accent-accent border border-border"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">Rows: {gridRows}</label>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      value={gridRows}
                      onChange={(e) => setGridRows(parseInt(e.target.value, 10))}
                      className="w-full h-2 rounded-lg bg-bg-tertiary appearance-none cursor-pointer accent-accent border border-border"
                    />
                  </div>
                </div>

                <Select
                  label="justify-items"
                  options={gridJustifyOptions}
                  value={gridJustify}
                  onChange={(e) => setGridJustify(e.target.value)}
                />

                <Select
                  label="align-items"
                  options={gridJustifyOptions}
                  value={gridAlign}
                  onChange={(e) => setGridAlign(e.target.value)}
                />

                <div className="pt-2 border-t border-border/60">
                  <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">Grid Gap Spacing: {gridGap}px</label>
                  <input
                    type="range"
                    min="0"
                    max="48"
                    step="4"
                    value={gridGap}
                    onChange={(e) => setGridGap(parseInt(e.target.value, 10))}
                    className="w-full h-2 rounded-lg bg-bg-tertiary appearance-none cursor-pointer accent-accent border border-border"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sandbox Visual Canvas & Code Exports */}
        <div className="space-y-6">
          <h2 className="text-base font-medium text-text-secondary">Interactive Sandbox Canvas</h2>

          <div className="w-full p-6 rounded-2xl border border-border bg-bg-tertiary shadow-inner overflow-hidden min-h-[260px] flex items-center justify-center relative">
            {/* Grid visual dots background */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-10 dark:bg-[radial-gradient(#374151_1px,transparent_1px)]" />

            <div style={containerStyle} className="relative z-10 w-full h-full">
              {Array.from({ length: itemCount }).map((_, i) => (
                <div
                  key={i}
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-indigo-500 shadow-md flex items-center justify-center text-white font-mono font-bold text-xs select-none hover:scale-105 transition-transform"
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Generated Code Codes Display */}
          <div className="space-y-4">
            {/* Native CSS Block */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                  <Code className="h-3.5 w-3.5" /> Native CSS Syntax
                </span>
                <CopyButton value={cssCode} size="sm" />
              </div>
              <pre className="p-3.5 rounded-xl border border-border bg-bg-secondary text-xs font-mono font-bold text-text-primary overflow-x-auto shadow-inner leading-normal select-all">
                {cssCode}
              </pre>
            </div>

            {/* Tailwind utility */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse-glow" /> Tailwind Utility Classes
                </span>
                <CopyButton value={tailwindClasses} size="sm" />
              </div>
              <pre className="p-3.5 rounded-xl border border-border bg-bg-secondary text-xs font-mono font-bold text-accent overflow-x-auto shadow-inner leading-normal select-all">
                {tailwindClasses}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
