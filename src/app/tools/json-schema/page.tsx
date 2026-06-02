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
import { generateJsonSchema } from '@/tools/json-schema/utils';

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

  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerate = React.useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }
    const result = generateJsonSchema(input, {
      draftVersion,
      requireAllFields: requireAll,
    });
    if (result.success) {
      setOutput(result.code);
      setError(null);
    } else {
      setError(result.error || 'Failed to generate schema');
      setOutput('');
    }
  }, [input, draftVersion, requireAll]);

  React.useEffect(() => {
    const t = setTimeout(handleGenerate, 120);
    return () => clearTimeout(t);
  }, [handleGenerate]);

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
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">Input JSON Payloads</h2>
            <Button variant="ghost" size="sm" onClick={handleClear} icon={<RotateCcw className="h-4 w-4" />}>
              Clear
            </Button>
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
                onChange={(e) => setDraftVersion(e.target.value as any)}
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
              <CopyButton value={output} disabled={!output} />
            </div>
          </div>

          <GradientBox value={output} placeholder="JSON validation schema will appear here..." className="min-h-[360px]" />

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
