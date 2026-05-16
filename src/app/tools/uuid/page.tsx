'use client';

import * as React from 'react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { CopyButton } from '@/components/ui/CopyButton';
import { cn } from '@/lib/utils';

const defaultCount = 5;

export default function Page() {
  const [count, setCount] = React.useState(defaultCount);
  const [uuids, setUuids] = React.useState<string[]>([]);

  const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: string) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const generate = React.useCallback(() => {
    const newUuids: string[] = [];
    const safeCount = Math.min(Math.max(count, 1), 100);
    for (let i = 0; i < safeCount; i++) {
      newUuids.push(generateUUID());
    }
    setUuids(newUuids);
  }, [count]);

  React.useEffect(() => { generate(); }, [generate]);

  return (
    <ToolLayout name="UUID Generator" description="Bulk generate cryptographically random UUID v4 identifiers (1–100)" category="Text">
      <div className="space-y-4">
        {/* Example pills + count control */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Count:</span>
            <input type="number" min="1" max="100" value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="w-16 px-2.5 py-1.5 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary text-center focus:outline-none focus:border-accent" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Quick:</span>
            {[1, 5, 20].map(n => (
              <button key={n} onClick={() => setCount(n)}
                className={cn('px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                  count === n
                    ? 'bg-accent text-bg-primary border-accent'
                    : 'bg-bg-tertiary text-text-secondary border-border hover:border-border-hover hover:text-text-primary'
                )}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* UUID list */}
        <div className="space-y-1.5">
          {uuids.map((u, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-bg-tertiary group hover:bg-bg-hover transition-colors">
              <span className="font-mono text-sm tabular-nums tracking-tight">{u}</span>
              <CopyButton value={u} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}
