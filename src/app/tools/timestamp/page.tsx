'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { fromTimestamp, getRelativeTime } from '@/tools/timestamp/utils';
const examples = [
  { label: 'Epoch (s)', value: '1716239022' },
  { label: 'Milliseconds', value: '1716239022000' },
  { label: 'Year 2000', value: '946684800' },
  { label: 'Now', value: '' }, // dynamic, filled on click
];

export default function Page() {
  const [input, setInput] = React.useState(examples[0].value);
  const [timestamp, setTimestamp] = React.useState(Math.floor(Date.now() / 1000));
  const [activeExample, setActiveExample] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setTimestamp(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const date = input.trim() && !isNaN(Number(input)) ? fromTimestamp(Number(input)) : null;

  const applyExample = (i: number) => {
    setActiveExample(i);
    setInput(examples[i].value || String(Math.floor(Date.now() / 1000)));
  };

  return (
    <ToolLayout name="Unix Timestamp Converter" description="Convert between Unix timestamps and human-readable dates" category="Date & Time">
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-base font-medium text-text-secondary">Current Time</h2>
          <div className="flex items-center gap-4 p-6 rounded-xl bg-bg-tertiary">
            <Clock className="h-12 w-12 text-accent animate-pulse shrink-0" />
            <div>
              <p className="text-2xl font-mono font-bold tabular-nums">{timestamp}</p>
              <p className="text-xs text-text-muted">Current Unix timestamp</p>
            </div>
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1.5 block">Convert</label>
            <Input value={input} onChange={(e) => { setInput(e.target.value); setActiveExample(-1); }} placeholder="Enter timestamp..." monospace />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-medium text-text-secondary">Result</h2>
          {date ? (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-bg-tertiary text-lg font-mono">
                {date.toLocaleString()}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-bg-tertiary border border-border">
                  <p className="text-xs text-text-muted mb-1">ISO String</p>
                  <p className="text-xs font-mono break-all">{date.toISOString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-bg-tertiary border border-border">
                  <p className="text-xs text-text-muted mb-1">Relative</p>
                  <p className="text-sm">{getRelativeTime(date.getTime())}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 rounded-lg bg-bg-tertiary text-text-muted text-sm">
              Enter a timestamp to convert
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
