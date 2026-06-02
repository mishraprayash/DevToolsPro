'use client';

import * as React from 'react';
import { RotateCcw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { GradientBox } from '@/components/ui/GradientBox';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { jsonToTs, type JsonToTsOptions } from '@/tools/json-to-ts/utils';

const outputOptions = [
  { value: 'interface', label: 'Interface' },
  { value: 'type', label: 'Type Alias' },
];

const nestedOptions = [
  { value: 'extract', label: 'Extract Nested Sub-types' },
  { value: 'inline', label: 'Inline Nested Objects' },
];

const examples = [
  {
    label: 'User profile',
    input: `{
  "id": 1024,
  "username": "coder_dev",
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
    label: 'Product Catalog',
    input: `[
  {
    "sku": "PROD-001",
    "name": "Mechanical Keyboard",
    "price": 129.99,
    "inStock": true,
    "tags": ["hardware", "peripheral"],
    "specs": {
      "switches": "Cherry MX Blue",
      "backlight": "RGB"
    }
  },
  {
    "sku": "PROD-002",
    "name": "Wireless Mouse",
    "price": 79.99,
    "inStock": false,
    "tags": ["hardware"],
    "specs": {
      "sensor": "Optical",
      "dpi": 16000
    }
  }
]`,
  },
  {
    label: 'API Response',
    input: `{
  "status": "success",
  "code": 200,
  "data": {
    "items": [
      { "id": "1", "value": 10.5 },
      { "id": "2", "value": 20.0, "notes": "high value" }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10
    }
  }
}`,
  }
];

export default function Page() {
  const [input, setInput] = React.useState(examples[0].input);
  const [output, setOutput] = React.useState('');
  const [rootName, setRootName] = React.useState('RootObject');
  const [outputType, setOutputType] = React.useState('interface');
  const [nestedMode, setNestedMode] = React.useState<'extract' | 'inline'>('extract');
  const [makeOptional, setMakeOptional] = React.useState(false);
  const [addExport, setAddExport] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeExample, setActiveExample] = React.useState(0);

  const handleProcess = React.useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    const options: JsonToTsOptions = {
      rootName: rootName.trim() || 'RootObject',
      useInterface: outputType === 'interface',
      nestedMode,
      makeOptional,
      addExport,
    };

    const result = jsonToTs(input, options);

    if (result.success) {
      setOutput(result.code);
      setError(null);
    } else {
      setError(result.error || 'Failed to convert');
      setOutput('');
    }
  }, [input, rootName, outputType, nestedMode, makeOptional, addExport]);

  React.useEffect(() => {
    const t = setTimeout(handleProcess, 100);
    return () => clearTimeout(t);
  }, [handleProcess]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    setInput(examples[i].input);
    setError(null);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };


  return (
    <ToolLayout
      name="JSON to TypeScript Converter"
      description="Convert JSON objects or arrays into clean, robust TypeScript interfaces and type definitions"
      category="Formatting"
    >
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-text-secondary">Input JSON</h2>
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
            onDropText={(text) => {
              setInput(text);
              setActiveExample(-1);
            }}
            placeholder='{"user": {"name": "alice"}}'
            monospace
            className="min-h-[300px]"
          />

          <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary font-outfit border-b border-border pb-2">
              <Settings className="h-4 w-4 text-accent" />
              <span>Conversion Options</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Root Type Name</label>
                <input
                  type="text"
                  value={rootName}
                  onChange={(e) => setRootName(e.target.value)}
                  placeholder="RootObject"
                  className="w-full h-10 px-4 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 text-sm transition-all duration-200"
                />
              </div>

              <Select
                label="Output Format"
                options={outputOptions}
                value={outputType}
                onChange={(e) => setOutputType(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Nested Property Treatment"
                options={nestedOptions}
                value={nestedMode}
                onChange={(e) => setNestedMode(e.target.value as 'extract' | 'inline')}
              />

              <div className="flex flex-col justify-center gap-3 pt-2">
                <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={makeOptional}
                    onChange={(e) => setMakeOptional(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-bg-primary bg-bg-tertiary transition-all cursor-pointer"
                  />
                  <span>Make all properties optional (?)</span>
                </label>

                <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addExport}
                    onChange={(e) => setAddExport(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-bg-primary bg-bg-tertiary transition-all cursor-pointer"
                  />
                  <span>Prepend export keyword</span>
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
            <h2 className="text-base font-medium text-text-secondary">TypeScript Definitions</h2>
            <div className="flex items-center gap-2">
              <CopyButton value={output} label="Copy" disabled={!output} />
            </div>
          </div>

          <GradientBox value={output} placeholder="TypeScript output will appear here..." className="min-h-[440px]" />
          
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
