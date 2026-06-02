'use client';

import * as React from 'react';
import { RotateCcw, Settings, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { GradientBox } from '@/components/ui/GradientBox';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { svgToJsx, type SvgToJsxOptions } from '@/tools/svg-to-jsx/utils';

const dimensionOptions = [
  { value: 'props', label: 'Responsive ({...props})' },
  { value: 'icon', label: 'Icon Fit (1em × 1em)' },
  { value: 'original', label: 'Retain original sizes' },
];

const languageOptions = [
  { value: 'ts', label: 'TypeScript (TSX)' },
  { value: 'js', label: 'JavaScript (JSX)' },
];

const examples = [
  {
    label: 'Checkmark Icon',
    input: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20 6 9 17 4 12"></polyline>
</svg>`,
    componentName: 'CheckIcon',
  },
  {
    label: 'Gradient Graphic',
    input: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22d3ee" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="40" fill="url(#circleGrad)" />
</svg>`,
    componentName: 'GradientCircle',
  },
  {
    label: 'Warning Alert',
    input: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 2px 8px rgba(244, 63, 94, 0.4));">
  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
  <line x1="12" y1="9" x2="12" y2="13"></line>
  <line x1="12" y1="17" x2="12.01" y2="17"></line>
</svg>`,
    componentName: 'AlertIcon',
  }
];

export default function Page() {
  const [input, setInput] = React.useState(examples[0].input);
  const [output, setOutput] = React.useState('');
  const [previewSvg, setPreviewSvg] = React.useState('');
  const [componentName, setComponentName] = React.useState(examples[0].componentName);
  const [language, setLanguage] = React.useState('ts');
  const [dimensionMode, setDimensionMode] = React.useState<'props' | 'icon' | 'original'>('props');
  const [forwardRef, setForwardRef] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeExample, setActiveExample] = React.useState(0);

  const handleProcess = React.useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setPreviewSvg('');
      setError(null);
      return;
    }

    const options: SvgToJsxOptions = {
      componentName: componentName.trim() || 'SvgIcon',
      typescript: language === 'ts',
      forwardRef,
      dimensionMode,
    };

    const result = svgToJsx(input, options);

    if (result.success) {
      setOutput(result.code);
      setPreviewSvg(result.previewSvg);
      setError(null);
    } else {
      setError(result.error || 'Failed to convert');
      setOutput('');
      setPreviewSvg('');
    }
  }, [input, componentName, language, forwardRef, dimensionMode]);

  React.useEffect(() => {
    const t = setTimeout(handleProcess, 100);
    return () => clearTimeout(t);
  }, [handleProcess]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    setInput(examples[i].input);
    setComponentName(examples[i].componentName);
    setError(null);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setPreviewSvg('');
    setError(null);
  };


  return (
    <ToolLayout
      name="SVG to JSX/React Converter"
      description="Transform raw SVG code from illustration and icon editors into fully optimized React/TypeScript functional components"
      category="Formatting"
    >
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">Input Raw SVG</h2>
            <Button variant="ghost" size="sm" onClick={handleClear} icon={<RotateCcw className="h-4 w-4" />}>
              Clear
            </Button>
          </div>

          <Input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActiveExample(-1);
            }}
            placeholder="<svg>...</svg>"
            className="min-h-[200px]"
            monospace
          />

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
              <Eye className="h-4 w-4 text-accent" />
              <span>Visual Live Preview</span>
            </div>
            
            <div className="w-full p-8 rounded-xl bg-bg-tertiary border border-border flex items-center justify-center min-h-[140px] relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-10 dark:bg-[radial-gradient(#374151_1px,transparent_1px)]" />
              {previewSvg ? (
                <div
                  className="relative z-10 max-h-[120px] max-w-[120px] [&>svg]:w-full [&>svg]:h-auto flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                />
              ) : (
                <span className="text-text-muted text-sm italic relative z-10">Pasted SVG preview will render here...</span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary font-outfit border-b border-border pb-2">
              <Settings className="h-4 w-4 text-accent" />
              <span>Component Settings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Component Name</label>
                <input
                  type="text"
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  placeholder="SvgIcon"
                  className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 text-sm transition-all duration-200"
                />
              </div>

              <Select
                label="Language / Syntax"
                options={languageOptions}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Sizing / Dimensions"
                options={dimensionOptions}
                value={dimensionMode}
                onChange={(e) => setDimensionMode(e.target.value as 'props' | 'icon' | 'original')}
              />

              <div className="flex flex-col justify-center pt-2">
                <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={forwardRef}
                    onChange={(e) => setForwardRef(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-bg-primary bg-bg-tertiary transition-all cursor-pointer"
                  />
                  <span>Wrap in React.forwardRef</span>
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-error/10 text-error border border-error/30 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">Generated React Component</h2>
            <div className="flex items-center gap-2">
              <CopyButton value={output} label="Copy" disabled={!output} />
            </div>
          </div>

          <GradientBox value={output} placeholder="React SVG component will appear here..." className="min-h-[480px]" />
          
          {output && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>{output.length.toLocaleString()} characters</span>
              <span>·</span>
              <span>{output.split('\n').length.toLocaleString()} lines</span>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
