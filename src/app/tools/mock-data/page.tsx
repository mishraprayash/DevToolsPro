'use client';

import * as React from 'react';
import { Database, Plus, Trash2, Download } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { CopyButton } from '@/components/ui/CopyButton';
import { generateMockData, type MockSchema, type MockFieldType } from '@/tools/mock-data/utils';
import { useHeavyTask } from '@/lib/workers/useHeavyTask';
import { shouldOffloadMockData } from '@/lib/workers/thresholds';
import { useToolShortcuts, useShortcutHint } from '@/lib/hooks/useToolShortcuts';
import { copyText } from '@/lib/utils/copyText';

const fieldTypes: { label: string; value: MockFieldType }[] = [
  { label: 'Auto-increment ID', value: 'id' },
  { label: 'UUID', value: 'uuid' },
  { label: 'Full Name', value: 'name' },
  { label: 'Email Address', value: 'email' },
  { label: 'Age (Number)', value: 'age' },
  { label: 'Boolean (true/false)', value: 'boolean' },
  { label: 'ISO Date', value: 'date' },
  { label: 'Status String', value: 'status' },
];

export default function Page() {
  const [schema, setSchema] = React.useState<MockSchema[]>([
    { name: 'id', type: 'id' },
    { name: 'name', type: 'name' },
    { name: 'email', type: 'email' },
    { name: 'isActive', type: 'boolean' }
  ]);
  const [count, setCount] = React.useState<number>(10);
  const [format, setFormat] = React.useState<'json' | 'csv'>('json');
  const [output, setOutput] = React.useState<string>('');

  const handleAddField = () => {
    setSchema([...schema, { name: `field${schema.length + 1}`, type: 'name' }]);
  };

  const handleRemoveField = (index: number) => {
    setSchema(schema.filter((_, i) => i !== index));
  };

  const handleUpdateField = (index: number, key: keyof MockSchema, value: string) => {
    const newSchema = [...schema];
    newSchema[index] = { ...newSchema[index], [key]: value };
    setSchema(newSchema);
  };

  const { run: runMockTask, cancel: cancelMockTask, pending: isGenerating } = useHeavyTask('mock', { timeoutMs: 15_000 });

  const handleGenerate = () => {
    const applyResult = (res: ReturnType<typeof generateMockData>) => {
      setOutput(res.success ? res.data : `Error: ${res.error}`);
    };
    // Small batches stay synchronous; large batches are generated in a worker (latest click wins).
    if (!shouldOffloadMockData(count)) {
      cancelMockTask();
      applyResult(generateMockData(schema, count, format));
      return;
    }
    runMockTask({ schema, count, format }).then((outcome) => {
      if (outcome.status === 'cancelled') return;
      if (outcome.status === 'ok') applyResult(outcome.data);
      else setOutput(`Error: ${outcome.error}`);
    });
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mock_data.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hint = useShortcutHint();
  useToolShortcuts({
    onRun: handleGenerate,
    onCopy: () => void copyText(output),
    onDownload: () => { if (output) handleDownload(); },
  });

  return (
    <ToolLayout
      name="Mock Data Generator"
      description="Generate robust random JSON or CSV data arrays based on custom schemas."
      category="Formatting"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Schema Builder */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Database className="h-5 w-5 text-accent" />
              Data Schema
            </h2>
          </div>

          <div className="p-5 rounded-xl border border-border bg-bg-secondary space-y-4">
            {schema.map((field, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-text-muted mb-1">Field Name</label>
                  <input 
                    type="text"
                    value={field.name || ''}
                    onChange={(e) => handleUpdateField(index, 'name', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <Select
                    label="Data Type"
                    value={field.type}
                    options={fieldTypes}
                    onChange={(e) => handleUpdateField(index, 'type', e.target.value as MockFieldType)}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveField(index)} className="h-10 text-red-500 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button variant="secondary" onClick={handleAddField} className="w-full border-dashed" icon={<Plus className="h-4 w-4" />}>
              Add Field
            </Button>
          </div>

          <div className="p-5 rounded-xl border border-border bg-bg-secondary grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Row Count</label>
              <input 
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 10)}
                min={1}
                max={1000}
                className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
              />
            </div>
            <div>
              <Select
                label="Output Format"
                value={format}
                options={[
                  { label: 'JSON', value: 'json' },
                  { label: 'CSV', value: 'csv' }
                ]}
                onChange={(e) => setFormat(e.target.value as 'json' | 'csv')}
              />
            </div>
          </div>

          <Button onClick={handleGenerate} title={hint('Generate', 'run')} className="w-full h-12 text-sm font-bold" aria-busy={isGenerating}>
            {isGenerating ? 'Generating…' : 'Generate Data'}
          </Button>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary">Output</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleDownload} title={hint('Download', 'download')} icon={<Download className="h-4 w-4" />} disabled={!output}>
                Download
              </Button>
              <CopyButton shortcut="copy" value={output} />
            </div>
          </div>

          <div className="border border-border rounded-xl bg-bg-tertiary overflow-hidden shadow-sm h-[500px]">
            <textarea
              readOnly
              value={output}
              className="w-full h-full p-4 bg-transparent text-text-primary font-mono text-sm focus:outline-none resize-none"
              placeholder="Generated data will appear here..."
            />
          </div>
        </div>

      </div>
    </ToolLayout>
  );
}
