'use client';

import * as React from 'react';
import { AlignLeft, Search, Link2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Select } from '@/components/ui/Select';
import { GradientBox } from '@/components/ui/GradientBox';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { generateParagraphs, generateSentences, generateWords, analyzeText, transformText, type TextStats } from '@/tools/string-utils/utils';
import { useToolShortcuts, useShortcutHint } from '@/lib/hooks/useToolShortcuts';
import { copyText } from '@/lib/utils/copyText';

type LoremType = 'paragraphs' | 'sentences' | 'words';

function generateLorem(type: LoremType, count: number): string {
  if (type === 'paragraphs') return generateParagraphs(count);
  if (type === 'sentences') return generateSentences(count);
  return generateWords(count);
}

export default function Page() {
  const [activeTab, setActiveTab] = React.useState<'analyzer' | 'generator' | 'transformer'>('analyzer');

  // --- Analyzer States ---
  const [analyzeInput, setAnalyzeInput] = React.useState('Paste your text here to analyze its character structure, word patterns, read duration metrics, and clean structural diagnostics.');
  const [stats, setStats] = React.useState<TextStats | null>(null);

  React.useEffect(() => {
    const res = analyzeText(analyzeInput);
    if (res.success) {
      setStats(res.data);
    }
  }, [analyzeInput]);

  // --- Generator States ---
  const [genType, setGenType] = React.useState<LoremType>('paragraphs');
  const [genCount, setGenCount] = React.useState(3);
  const [genOutput, setGenOutput] = React.useState('');

  // Auto-regenerate silently whenever the type or count changes.
  React.useEffect(() => {
    setGenOutput(generateLorem(genType, genCount));
  }, [genType, genCount]);

  const handleGenerate = () => {
    setGenOutput(generateLorem(genType, genCount));
    toast({ type: 'success', message: `Generated ${genCount} ${genType}!` });
  };

  // --- Transformer States ---
  const [transformInput, setTransformInput] = React.useState('Transform this text into URL-friendly Slugs, UPPERCASE, lowercase, or Title Case.');
  const [transformType, setTransformType] = React.useState<'slug' | 'upper' | 'lower' | 'title' | 'trim'>('slug');
  const [transformOutput, setTransformOutput] = React.useState('');

  React.useEffect(() => {
    setTransformOutput(transformText(transformInput, transformType));
  }, [transformInput, transformType]);

  const hint = useShortcutHint();
  useToolShortcuts({
    onRun: () => { if (activeTab === 'generator') handleGenerate(); },
    onCopy: () => { if (activeTab === 'generator') void copyText(genOutput); else if (activeTab === 'transformer') void copyText(transformOutput, 'Result'); },
    onClear: () => { if (activeTab === 'analyzer') setAnalyzeInput(''); },
  });

  return (
    <ToolLayout
      name="Rich Text & String Utilities"
      description="All-in-one text workspace to inspect reading statistics, generate Lorem Ipsum paragraphs, and transform case layouts"
      category="Text"
    >
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-secondary border border-border overflow-x-auto scrollbar-hide max-w-md">
        <button
          onClick={() => setActiveTab('analyzer')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'analyzer'
              ? 'bg-bg-tertiary text-accent border border-border'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Search className="h-3.5 w-3.5" />
          Text Analyzer
        </button>
        <button
          onClick={() => setActiveTab('generator')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'generator'
              ? 'bg-bg-tertiary text-accent border border-border'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <AlignLeft className="h-3.5 w-3.5" />
          Lorem Generator
        </button>
        <button
          onClick={() => setActiveTab('transformer')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'transformer'
              ? 'bg-bg-tertiary text-accent border border-border'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Link2 className="h-3.5 w-3.5" />
          String Transformer
        </button>
      </div>

      <div className="mt-6">
        {/* ANALYZER TAB */}
        {activeTab === 'analyzer' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-primary">Source Text</h2>
                <Button variant="ghost" size="sm" onClick={() => setAnalyzeInput('')} title={hint('Clear', 'clear')}>Clear</Button>
              </div>
              <textarea
                value={analyzeInput}
                onChange={(e) => setAnalyzeInput(e.target.value)}
                placeholder="Type or paste text to analyze..."
                className="w-full min-h-[300px] p-4 rounded-xl bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent resize-y"
              />
            </div>

            <div className="space-y-6">
              <h2 className="text-base font-semibold text-text-primary">Text Metrics & Insights</h2>
              {stats ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-bg-secondary p-4 rounded-xl border border-border">
                    <span className="text-xs text-text-muted block mb-1">Characters (with spaces)</span>
                    <span className="text-2xl font-bold font-mono text-text-primary">{stats.chars.toLocaleString()}</span>
                  </div>
                  <div className="bg-bg-secondary p-4 rounded-xl border border-border">
                    <span className="text-xs text-text-muted block mb-1">Characters (no spaces)</span>
                    <span className="text-2xl font-bold font-mono text-text-primary">{stats.charsNoSpaces.toLocaleString()}</span>
                  </div>
                  <div className="bg-bg-secondary p-4 rounded-xl border border-border">
                    <span className="text-xs text-text-muted block mb-1">Word Count</span>
                    <span className="text-2xl font-bold font-mono text-accent">{stats.words.toLocaleString()}</span>
                  </div>
                  <div className="bg-bg-secondary p-4 rounded-xl border border-border">
                    <span className="text-xs text-text-muted block mb-1">Paragraph Count</span>
                    <span className="text-2xl font-bold font-mono text-text-primary">{stats.paragraphs.toLocaleString()}</span>
                  </div>
                  <div className="bg-bg-secondary p-4 rounded-xl border border-border col-span-2 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-text-muted block mb-1">Estimated Reading Time</span>
                      <span className="text-lg font-bold text-success font-outfit">{stats.readingTimeMinutes} minutes</span>
                    </div>
                    <span className="text-[10px] bg-bg-tertiary border border-border text-text-muted px-2.5 py-1 rounded font-mono">
                      @ 200 WPM speed
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-48 rounded-xl bg-bg-tertiary border border-dashed border-border flex items-center justify-center text-text-muted italic text-sm">
                  Enter some text to see live statistics.
                </div>
              )}
            </div>
          </div>
        )}

        {/* GENERATOR TAB */}
        {activeTab === 'generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-text-primary">Generation Settings</h2>
              <div className="p-5 rounded-xl border border-border bg-bg-secondary space-y-5 shadow-sm">
                <Select
                  label="Placeholder Format Type"
                  options={[
                    { value: 'paragraphs', label: 'Paragraphs' },
                    { value: 'sentences', label: 'Sentences' },
                    { value: 'words', label: 'Individual Words' }
                  ]}
                  value={genType}
                  onChange={(e) => setGenType(e.target.value as LoremType)}
                />
                
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Count ({genCount})</label>
                  <input
                    type="range"
                    min="1"
                    max={genType === 'words' ? '150' : '15'}
                    value={genCount}
                    onChange={(e) => setGenCount(parseInt(e.target.value, 10))}
                    className="w-full accent-accent cursor-pointer"
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerate} title={hint('Generate', 'run')}
                className="w-full h-11"
                icon={<RefreshCw className="h-4 w-4" />}
              >
                Regenerate Text
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-primary font-outfit">Lorem Ipsum Output</h2>
                {genOutput && <CopyButton shortcut="copy" value={genOutput} label="Copy Output" />}
              </div>
              <GradientBox value={genOutput} className="min-h-[280px] text-sm leading-relaxed" />
            </div>
          </div>
        )}

        {/* TRANSFORMER TAB */}
        {activeTab === 'transformer' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-text-primary">String Input</h2>
              <textarea
                value={transformInput}
                onChange={(e) => setTransformInput(e.target.value)}
                placeholder="Type text to transform..."
                className="w-full min-h-[160px] p-4 rounded-xl bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-accent resize-y"
              />

              <div className="p-4 rounded-xl border border-border bg-bg-secondary shadow-sm">
                <Select
                  label="Select Layout Transformation"
                  options={[
                    { value: 'slug', label: 'URL Slugify' },
                    { value: 'upper', label: 'UPPERCASE' },
                    { value: 'lower', label: 'lowercase' },
                    { value: 'title', label: 'Title Case' },
                    { value: 'trim', label: 'Trim Whitespaces' }
                  ]}
                  value={transformType}
                  onChange={(e) => setTransformType(e.target.value as 'slug' | 'upper' | 'lower' | 'title' | 'trim')}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-primary">Transformed Result</h2>
                {transformOutput && <CopyButton shortcut="copy" value={transformOutput} label="Copy Result" />}
              </div>
              <GradientBox value={transformOutput} className="min-h-[220px] text-sm font-mono leading-relaxed" />
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
