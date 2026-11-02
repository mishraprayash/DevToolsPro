'use client';

import * as React from 'react';
import { RotateCcw, Settings, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { GradientBox } from '@/components/ui/GradientBox';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { OpenInMenu } from '@/components/tool/OpenInMenu';
import { jsonToolTarget } from '@/lib/utils/openInTargets';
import { useToolPrefill } from '@/lib/hooks/useToolPrefill';
import { generateJsonSchema, type SchemaResult } from '@/tools/json-schema/utils';
import { useHeavyTask } from '@/lib/workers/useHeavyTask';
import { shouldOffloadSchema } from '@/lib/workers/thresholds';

const draftOptions = [
  { value: 'draft-07', label: 'JSON Schema Draft-07 (Widely Compatible)' },
  { value: 'draft-2020-12', label: 'JSON Schema Draft 2020-12 (Modern)' },
];

const examples = [
  {
    label: 'User profile',
    value: `{
  "id": 4096,
  "username": "super_coder",
  "active": true,
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["admin", "developer"]
  },
  "metadata": {
    "lastLogin": "2026-05-19T08:00:00Z",
    "preferences": {
      "theme": "dark",
      "notifications": {
        "email": true,
        "push": false
      }
    }
  }
}`,
  },
  {
    label: 'Product catalog',
    value: `[
  {
    "sku": "KEYB-01",
    "name": "Mechanical Keyboard",
    "price": 129.99,
    "inStock": true,
    "tags": ["hardware", "peripheral"]
  },
  {
    "sku": "MOUSE-02",
    "name": "Wireless Mouse",
    "price": 79.99,
    "inStock": false,
    "tags": ["hardware"]
  }
]`,
  }
];

export default function Page() {
  const [input, setInput] = React.useState(examples[0].value);
  const [draftVersion, setDraftVersion] = React.useState<'draft-07' | 'draft-2020-12'>('draft-07');
  const [requireAll, setRequireAll] = React.useState(true);
  const [activeExample, setActiveExample] = React.useState(0);

  useToolPrefill('json-schema', ({ input }) => { setInput(input); setActiveExample(-1); });

  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const { run: runSchemaTask, cancel: cancelSchemaTask, pending: isInferring } = useHeavyTask('schema', { timeoutMs: 20_000 });

  React.useEffect(() => {
    let active = true;
    const applyResult = (result: SchemaResult) => {
      if (result.success) {
        setOutput(result.code);
        setError(null);
      } else {
        setError(result.error || 'Failed to generate schema');
        setOutput('');
      }
    };
    const t = setTimeout(() => {
      if (!input.trim()) {
        cancelSchemaTask();
        setOutput('');
        setError(null);
        return;
      }
      const options = { draftVersion, requireAllFields: requireAll };
      // Small payloads stay synchronous; large ones are inferred in a worker (latest-wins).
      if (!shouldOffloadSchema(input)) {
        cancelSchemaTask();
        applyResult(generateJsonSchema(input, options));
        return;
      }
      runSchemaTask({ json: input, options }).then((outcome) => {
        if (!active || outcome.status === 'cancelled') return;
        if (outcome.status === 'ok') applyResult(outcome.data);
        else applyResult({ success: false, error: outcome.error });
      });
    }, 120);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [input, draftVersion, requireAll, runSchemaTask, cancelSchemaTask]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    setInput(examples[i].value);
    setError(null);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
    setActiveExample(-1);
  };


  return (
    <ToolLayout
      name="JSON Schema Generator"
      description="Paste raw JSON structures and instantly generate valid, standard-compliant Draft-07 or Draft 2020-12 validation schemas"
      category="Formatting"
    >
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
        {/* Left Inputs */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-medium text-text-secondary">Input JSON Payloads</h2>
            <div className="flex items-center gap-2">
              <OpenInMenu targets={[jsonToolTarget(input, 'From JSON Schema', 'Beautify / validate')]} />
              <Button variant="ghost" size="sm" onClick={handleClear} icon={<RotateCcw className="h-4 w-4" />}>
                Clear
              </Button>
            </div>
          </div>

          <Input
            value={input}
            onChange={(e) => { setInput(e.target.value); setActiveExample(-1); }}
            placeholder='{"user": "alice", "roles": ["admin"]}'
            className="min-h-[260px]"
            monospace
          />

          {error && (
            <div className="p-4 rounded-xl bg-error/10 text-error border border-error/30 text-xs flex gap-2.5 items-start shadow-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 text-error mt-0.5" />
              <p className="leading-relaxed font-semibold">{error}</p>
            </div>
          )}

          {/* Config options */}
          <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-4 shadow-sm select-none">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary font-outfit border-b border-border pb-2.5">
              <Settings className="h-4 w-4 text-accent" />
              <span>Schema Generation Configurations</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="JSON Schema Specification"
                options={draftOptions}
                value={draftVersion}
                onChange={(e) => setDraftVersion(e.target.value as 'draft-07' | 'draft-2020-12')}
              />

              <div className="flex flex-col justify-end pb-1.5">
                <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireAll}
                    onChange={(e) => setRequireAll(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent bg-bg-tertiary cursor-pointer transition-all"
                  />
                  <span>Require all object properties</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent font-bold">
                Generated JSON Schema
              </span>
            </h2>
            
            <div className="flex items-center gap-2">
              {isInferring && <span className="text-xs text-text-muted" role="status">Inferring schema…</span>}
              <CopyButton value={output} disabled={!output} />
            </div>
          </div>

          <GradientBox value={output} placeholder={isInferring ? 'Inferring schema…' : 'JSON validation schema will appear here...'} className="min-h-[360px]" />

          <div className="p-4 rounded-xl border border-border bg-bg-secondary flex gap-3 text-xs text-text-muted select-none">
            <Sparkles className="h-5 w-5 text-accent shrink-0 animate-pulse-glow" />
            <div>
              <p className="font-semibold text-text-primary mb-0.5">Automated Format Detections</p>
              <p className="leading-relaxed">The parser scans all values recursively and automatically attaches standard formats for dates, times, emails, and URIs where matched.</p>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
