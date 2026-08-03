'use client';

import * as React from 'react';
import { Sliders, RefreshCw, Layers, Grid, Code, Sparkles, RotateCcw, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { cn } from '@/lib/utils';

interface ItemConfig {
  id: number;
  colSpan: number;
  rowSpan: number;
}

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

const gridJustifyOptions = [
  { value: 'stretch', label: 'stretch' },
  { value: 'start', label: 'start' },
  { value: 'center', label: 'center' },
  { value: 'end', label: 'end' },
];

export default function Page() {
  const [layoutMode, setLayoutMode] = React.useState<'flex' | 'grid'>('flex');
  const [itemCount, setItemCount] = React.useState<number>(6);

  // --- Flexbox States ---
  const [flexDir, setFlexDir] = React.useState('row');
  const [justifyContent, setJustifyContent] = React.useState('center');
  const [alignItems, setAlignItems] = React.useState('center');
  const [flexWrap, setFlexWrap] = React.useState(false);
  const [flexGap, setFlexGap] = React.useState(16); // in px

  // --- Grid States ---
  const [gridTemplateType, setGridTemplateType] = React.useState<'fixed' | 'auto-fill' | 'auto-fit'>('fixed');
  const [gridCols, setGridCols] = React.useState(3);
  const [gridRows, setGridRows] = React.useState(2);
  const [minMaxColWidth, setMinMaxColWidth] = React.useState(120); // in px
  const [gridGap, setGridGap] = React.useState(16); // in px
  const [gridJustify, setGridJustify] = React.useState('stretch');
  const [gridAlign, setGridAlign] = React.useState('stretch');

  // Track configurations for individual grid items (spans)
  const [itemConfigs, setItemConfigs] = React.useState<ItemConfig[]>([
    { id: 1, colSpan: 1, rowSpan: 1 },
    { id: 2, colSpan: 1, rowSpan: 1 },
    { id: 3, colSpan: 1, rowSpan: 1 },
    { id: 4, colSpan: 1, rowSpan: 1 },
    { id: 5, colSpan: 1, rowSpan: 1 },
    { id: 6, colSpan: 1, rowSpan: 1 },
    { id: 7, colSpan: 1, rowSpan: 1 },
    { id: 8, colSpan: 1, rowSpan: 1 },
    { id: 9, colSpan: 1, rowSpan: 1 },
    { id: 10, colSpan: 1, rowSpan: 1 },
    { id: 11, colSpan: 1, rowSpan: 1 },
    { id: 12, colSpan: 1, rowSpan: 1 },
  ]);
  const [selectedItemId, setSelectedItemId] = React.useState<number | null>(null);

  const handleReset = () => {
    setItemCount(6);
    setFlexDir('row');
    setJustifyContent('center');
    setAlignItems('center');
    setFlexWrap(false);
    setFlexGap(16);
    setGridTemplateType('fixed');
    setGridCols(3);
    setGridRows(2);
    setMinMaxColWidth(120);
    setGridGap(16);
    setGridJustify('stretch');
    setGridAlign('stretch');
    setItemConfigs(
      Array.from({ length: 12 }, (_, i) => ({ id: i + 1, colSpan: 1, rowSpan: 1 }))
    );
    setSelectedItemId(null);
  };

  const handleSpanChange = (itemId: number, type: 'col' | 'row', change: number) => {
    setItemConfigs((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const key = type === 'col' ? 'colSpan' : 'rowSpan';
          const maxLimit = type === 'col' ? gridCols : gridRows;
          const newVal = Math.max(1, Math.min(maxLimit, item[key] + change));
          return { ...item, [key]: newVal };
        }
        return item;
      })
    );
  };

  // Compile CSS template track declarations
  const gridTemplateColsStr = React.useMemo(() => {
    if (gridTemplateType === 'fixed') {
      return `repeat(${gridCols}, minmax(0, 1fr))`;
    }
    return `repeat(${gridTemplateType}, minmax(${minMaxColWidth}px, 1fr))`;
  }, [gridTemplateType, gridCols, minMaxColWidth]);

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
      let customItemRules = '';
      itemConfigs.slice(0, itemCount).forEach((item, idx) => {
        if (item.colSpan > 1 || item.rowSpan > 1) {
          customItemRules += `\n\n.item-${idx + 1} {${
            item.colSpan > 1 ? `\n  grid-column: span ${item.colSpan};` : ''
          }${item.rowSpan > 1 ? `\n  grid-row: span ${item.rowSpan};` : ''}\n}`;
        }
      });

      return `.container {
  display: grid;
  grid-template-columns: ${gridTemplateColsStr};
  grid-template-rows: repeat(${gridRows}, minmax(0, 1fr));
  gap: ${gridGap}px;
  justify-items: ${gridJustify};
  align-items: ${gridAlign};
}${customItemRules}`;
    }
  }, [
    layoutMode,
    flexDir,
    justifyContent,
    alignItems,
    flexWrap,
    flexGap,
    gridTemplateColsStr,
    gridRows,
    gridGap,
    gridJustify,
    gridAlign,
    itemConfigs,
    itemCount,
  ]);

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
      const colClass = gridTemplateType === 'fixed' ? `grid-cols-${gridCols}` : `grid-cols-[repeat(${gridTemplateType},minmax(${minMaxColWidth}px,1fr))]`;
      const rowClass = `grid-rows-${gridRows}`;
      const gapVal = Math.round(gridGap / 4);
      const gapClass = `gap-${gapVal}`;
      const justClass = `justify-items-${gridJustify}`;
      const alignClass = `items-${gridAlign}`;

      let customItemRules = '';
      itemConfigs.slice(0, itemCount).forEach((item, idx) => {
        if (item.colSpan > 1 || item.rowSpan > 1) {
          const colSpanClass = item.colSpan > 1 ? ` col-span-${item.colSpan}` : '';
          const rowSpanClass = item.rowSpan > 1 ? ` row-span-${item.rowSpan}` : '';
          customItemRules += `\n<!-- Item ${idx + 1} utilities -->\nclass="${colSpanClass.trim()}${rowSpanClass}"`;
        }
      });

      return `grid ${colClass} ${rowClass} ${gapClass} ${justClass} ${alignClass}${customItemRules}`;
    }
  }, [
    layoutMode,
    flexDir,
    justifyContent,
    alignItems,
    flexWrap,
    flexGap,
    gridTemplateType,
    gridCols,
    gridRows,
    minMaxColWidth,
    gridGap,
    gridJustify,
    gridAlign,
    itemConfigs,
    itemCount,
  ]);

  // Inline container styles for preview
  const containerStyle = React.useMemo(() => {
    if (layoutMode === 'flex') {
      return {
        display: 'flex',
        flexDirection: flexDir as React.CSSProperties['flexDirection'],
        justifyContent: justifyContent,
        alignItems: alignItems,
        flexWrap: (flexWrap ? 'wrap' : 'nowrap') as React.CSSProperties['flexWrap'],
        gap: `${flexGap}px`,
        width: '100%',
        height: '100%',
        minHeight: '280px',
      };
    } else {
      return {
        display: 'grid',
        gridTemplateColumns: gridTemplateColsStr,
        gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
        gap: `${gridGap}px`,
        justifyItems: gridJustify,
        alignItems: gridAlign,
        width: '100%',
        height: '100%',
        minHeight: '280px',
      };
    }
  }, [
    layoutMode,
    flexDir,
    justifyContent,
    alignItems,
    flexWrap,
    flexGap,
    gridTemplateColsStr,
    gridRows,
    gridGap,
    gridJustify,
    gridAlign,
  ]);

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
            'px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200 flex items-center gap-1.5 cursor-pointer',
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
            'px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200 flex items-center gap-1.5 cursor-pointer',
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
                onChange={(e) => {
                  setItemCount(parseInt(e.target.value, 10));
                  setSelectedItemId(null);
                }}
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
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-text-muted uppercase">Grid Template Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['fixed', 'auto-fill', 'auto-fit'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setGridTemplateType(t as 'fixed' | 'auto-fill' | 'auto-fit')}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer',
                          gridTemplateType === t
                            ? 'bg-accent/10 border-accent text-accent'
                            : 'bg-bg-tertiary border-border text-text-muted hover:text-text-primary'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {gridTemplateType === 'fixed' ? (
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
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase">Min Col Width: {minMaxColWidth}px</label>
                      <input
                        type="range"
                        min="60"
                        max="240"
                        step="10"
                        value={minMaxColWidth}
                        onChange={(e) => setMinMaxColWidth(parseInt(e.target.value, 10))}
                        className="w-full h-2 rounded-lg bg-bg-tertiary appearance-none cursor-pointer accent-accent border border-border"
                      />
                    </div>
                  )}

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

                {/* Individual Item Configuration Panels */}
                <div className="pt-4 border-t border-border/60 space-y-2">
                  <span className="block text-xs font-semibold text-text-muted uppercase">Grid Item Settings</span>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Click an item in the sandbox preview canvas to configure its column-span or row-span.
                  </p>

                  {selectedItemId !== null && (
                    <div className="p-3 bg-bg-tertiary border border-border rounded-lg flex items-center justify-between animate-fade-in">
                      <span className="text-xs font-bold text-text-primary">Item {selectedItemId} Spans:</span>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase text-text-muted font-mono">Cols:</span>
                          <button
                            onClick={() => handleSpanChange(selectedItemId, 'col', -1)}
                            className="p-1 bg-bg-secondary border border-border rounded text-text-secondary hover:text-text-primary cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-mono font-bold w-4 text-center">
                            {itemConfigs.find((i) => i.id === selectedItemId)?.colSpan || 1}
                          </span>
                          <button
                            onClick={() => handleSpanChange(selectedItemId, 'col', 1)}
                            className="p-1 bg-bg-secondary border border-border rounded text-text-secondary hover:text-text-primary cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase text-text-muted font-mono">Rows:</span>
                          <button
                            onClick={() => handleSpanChange(selectedItemId, 'row', -1)}
                            className="p-1 bg-bg-secondary border border-border rounded text-text-secondary hover:text-text-primary cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-mono font-bold w-4 text-center">
                            {itemConfigs.find((i) => i.id === selectedItemId)?.rowSpan || 1}
                          </span>
                          <button
                            onClick={() => handleSpanChange(selectedItemId, 'row', 1)}
                            className="p-1 bg-bg-secondary border border-border rounded text-text-secondary hover:text-text-primary cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sandbox Visual Canvas & Code Exports */}
        <div className="space-y-6">
          <h2 className="text-base font-medium text-text-secondary">Interactive Sandbox Canvas</h2>

          <div className="w-full p-6 rounded-2xl border border-border bg-bg-tertiary shadow-inner overflow-hidden min-h-[320px] flex items-center justify-center relative">
            {/* Grid visual dots background */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-10 dark:bg-[radial-gradient(#374151_1px,transparent_1px)]" />

            <div style={containerStyle} className="relative z-10 w-full h-full">
              {itemConfigs.slice(0, itemCount).map((item, i) => {
                const isSelected = selectedItemId === item.id;
                const inlineItemStyle = layoutMode === 'grid' ? {
                  gridColumn: `span ${item.colSpan}`,
                  gridRow: `span ${item.rowSpan}`
                } : {};

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (layoutMode === 'grid') {
                        setSelectedItemId(item.id);
                      }
                    }}
                    style={inlineItemStyle}
                    className={cn(
                      "rounded-xl bg-gradient-to-br from-accent to-indigo-500 shadow-md flex flex-col items-center justify-center text-white font-mono font-bold text-xs select-none transition-all cursor-pointer",
                      layoutMode === 'grid' && "hover:border-white/50 hover:ring-2 hover:ring-accent/50",
                      isSelected && "border-2 border-white ring-4 ring-accent scale-[1.02] shadow-xl",
                      layoutMode === 'flex' ? 'w-14 h-14' : 'w-full h-full min-h-[60px]'
                    )}
                  >
                    <span>{i + 1}</span>
                    {layoutMode === 'grid' && (item.colSpan > 1 || item.rowSpan > 1) && (
                      <span className="text-[9px] opacity-80 mt-1">
                        {item.colSpan}x{item.rowSpan}
                      </span>
                    )}
                  </div>
                );
              })}
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
