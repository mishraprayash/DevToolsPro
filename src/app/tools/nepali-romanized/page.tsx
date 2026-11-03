'use client';

import * as React from 'react';
import { Languages, Type } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/Button';
import { convertToNepali } from '@/tools/nepali-romanized/utils';
import { useToolShortcuts, useShortcutHint } from '@/lib/hooks/useToolShortcuts';
import { copyText } from '@/lib/utils/copyText';
import { OutputActions, downloadOutput } from '@/components/tool/OutputActions';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { useTextFileDrop } from '@/lib/hooks/useTextFileDrop';
import { TextFileDropOverlay } from '@/components/ui/TextFileDropOverlay';

const examples = [
  { label: 'Greeting', hint: 'namaste', value: 'namaste' },
  { label: 'Introduction', hint: 'sentence', value: 'mero naam ram ho. ma kathmandu ma baschhu.' },
  { label: 'Question', hint: 'with ?', value: 'tapai lai kasto chha?' },
  { label: 'Festival wish', hint: 'Dashain', value: 'dashain ko hardik shubhakamana' },
];

export default function Page() {
  const [input, setInput] = React.useState('namaste');
  const [activeExample, setActiveExample] = React.useState(0);
  const { isDragging, dropProps } = useTextFileDrop((text) => { setInput(text); setActiveExample(-1); });
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const res = await convertToNepali(input);
      if (res.success) {
        setOutput(res.data);
        setError(null);
      } else {
        setError(res.error);
      }
      setIsLoading(false);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [input]);

  const clearInput = () => { setInput(''); setActiveExample(-1); };

  const hint = useShortcutHint();
  useToolShortcuts({
    onCopy: () => void copyText(error ? '' : output),
    onDownload: () => downloadOutput(error ? '' : output, 'nepali.txt'),
    onClear: clearInput,
  });

  return (
    <ToolLayout
      name="Romanized to Nepali"
      description="Type Romanized English text and instantly convert it into Nepali Unicode (Devanagari script)."
      category="Text"
    >
      <ExamplePills
        examples={examples}
        activeIndex={activeExample}
        onSelect={(i) => { setActiveExample(i); setInput(examples[i].value); }}
      />

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[500px]">
        {/* Left Input */}
        <div className="flex flex-col space-y-3 h-full">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Type className="h-4 w-4 text-orange-500" /> Romanized English
            </h2>
            <Button variant="ghost" size="sm" onClick={clearInput} title={hint('Clear', 'clear')} className="h-8">Clear</Button>
          </div>
          <div className="flex-1 relative rounded-xl border border-border bg-bg-secondary overflow-hidden focus-within:border-orange-500 transition-colors shadow-inner" {...dropProps}>
            <TextFileDropOverlay show={isDragging} />
            <textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); setActiveExample(-1); }}
              placeholder="Mero naam..."
              className="absolute inset-0 w-full h-full p-4 bg-transparent text-text-primary text-base focus:outline-none resize-none custom-scrollbar"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right Output */}
        <div className="flex flex-col space-y-3 h-full">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Languages className="h-4 w-4 text-red-500" /> Nepali Output
            </h2>
            <OutputActions value={error ? '' : output} filename="nepali.txt" />
          </div>
          <div className="flex-1 relative rounded-xl border border-border bg-bg-secondary overflow-hidden shadow-inner">
            {isLoading && (
              <div className="absolute top-2 right-2 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {error ? (
              <div className="p-4 text-sm text-red-400 font-mono">{error}</div>
            ) : (
              <textarea
                readOnly
                value={output}
                placeholder="मेरो नाम..."
                className="absolute inset-0 w-full h-full p-4 bg-transparent text-text-primary text-base focus:outline-none resize-none custom-scrollbar"
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-bg-secondary/50 rounded-xl border border-border max-w-3xl mx-auto">
        <h3 className="text-sm font-bold text-text-primary mb-3">Powered by Google Input Tools (AI Transliteration)</h3>
        <ul className="text-sm text-text-secondary space-y-2">
          <li>• Type naturally exactly as you would speak. E.g., <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-text-primary">Mero naam</kbd> = मेरो नाम</li>
          <li>• The AI contextually understands full sentences and outputs perfect grammar (e.g. <kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded text-text-primary">sampurna</kbd> evaluates instantly to सम्पूर्ण).</li>
          <li>• Special characters and punctuation remain preserved automatically.</li>
        </ul>
      </div>
    </ToolLayout>
  );
}
