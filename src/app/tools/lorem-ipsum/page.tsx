'use client';

import * as React from 'react';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { CopyButton } from '@/components/ui/CopyButton';
import { generateWords, generateSentences, generateParagraphs } from '@/tools/lorem-ipsum/utils';
import { cn } from '@/lib/utils';

const examples = [
  { label: '3 paragraphs', mode: 'paragraphs' as const, count: 3 },
  { label: '5 sentences', mode: 'sentences' as const, count: 5 },
  { label: '10 words', mode: 'words' as const, count: 10 },
  { label: '50 words', mode: 'words' as const, count: 50 },
];

export default function Page() {
  const [mode, setMode] = React.useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [count, setCount] = React.useState(3);
  const [output, setOutput] = React.useState('');
  const [activeExample, setActiveExample] = React.useState(0);

  const generate = React.useCallback(() => {
    switch (mode) {
      case 'paragraphs': setOutput(generateParagraphs(count)); break;
      case 'sentences': setOutput(generateSentences(count)); break;
      case 'words': setOutput(generateWords(count)); break;
    }
  }, [mode, count]);

  React.useEffect(() => { generate(); }, [generate]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    setMode(examples[i].mode);
    setCount(examples[i].count);
  };

  return (
    <ToolLayout name="Lorem Ipsum Generator" description="Generate placeholder text in paragraphs, sentences or words" category="Text">
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="space-y-4 max-w-3xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {(['paragraphs', 'sentences', 'words'] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setActiveExample(-1); }}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition-all capitalize',
                  mode === m ? 'bg-accent text-bg-primary border-accent' : 'bg-bg-tertiary text-text-secondary border-border hover:border-border-hover'
                )}>{m}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Count:</span>
            <input type="number" min="1" max={mode === 'paragraphs' ? 500 : mode === 'sentences' ? 1000 : 10000} value={count}
              onChange={(e) => { setCount(parseInt(e.target.value) || 1); setActiveExample(-1); }}
              className="w-16 px-2.5 py-1.5 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary text-center focus:outline-none focus:border-accent" />
            <button onClick={generate}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-bg-tertiary text-text-secondary hover:border-border-hover hover:text-text-primary transition-all">
              Regenerate
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea value={output} readOnly
            className="w-full min-h-[250px] p-4 rounded-xl bg-bg-tertiary border border-border text-sm text-text-primary font-serif leading-relaxed resize-y focus:outline-none focus:border-accent"
            spellCheck={false} />
          <CopyButton value={output} label="Copy" variant="secondary" className="absolute top-3 right-3" />
        </div>

        <span className="text-xs text-text-muted">{output.length.toLocaleString()} characters</span>
      </div>
    </ToolLayout>
  );
}
