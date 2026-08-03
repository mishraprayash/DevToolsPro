'use client';

import * as React from 'react';
import { ArrowLeftRight, Download, FileSpreadsheet, Braces, RotateCcw, AlertTriangle } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { GradientBox } from '@/components/ui/GradientBox';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  csvToJson,
  jsonToCsv,
  detectDelimiter,
  formatJson,
  DELIMITERS,
  type Delimiter,
} from '@/tools/csv-json/utils';

type Mode = 'csv-to-json' | 'json-to-csv';

const delimiterOptions: Array<{ value: string; label: string }> = [
  { value: 'auto', label: 'Auto-detect' },
  ...DELIMITERS.map((d) => ({
    value: d,
    label: d === '\t' ? 'Tab' : `Comma${d === ',' ? '' : ` (${d})`}`,
  })),
];

const examples: Array<{ label: string; mode: Mode; input: string }> = [
  {
    label: 'CSV → JSON (Users)',
    mode: 'csv-to-json',
    input: `name,age,email,active
Alice Smith,30,alice@example.com,true
Bob Johnson,25,bob@example.com,false
Carol Williams,41,carol@example.com,true`,
  },
  {
    label: 'JSON → CSV (Products)',
    mode: 'json-to-csv',
    input: `[
  { "id": 1, "name": "Keyboard", "price": 49.99, "inStock": true },
  { "id": 2, "name": "Mouse", "price": 19.5, "inStock": true },
  { "id": 3, "name": "Monitor", "price": 299, "inStock": false }
]`,
  },
  {
    label: 'CSV with Quoted Fields',
    mode: 'csv-to-json',
    input: `product,description,price
"Wireless ""Pro"" Mouse","Small, ergonomic, with USB-C",29.99
USB-C Cable,"1 meter, fast charging",9.99`,
  },
];

export default function Page() {
  const [mode, setMode] = React.useState<Mode>('csv-to-json');
  const [input, setInput] = React.useState(examples[0].input);
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [delimiter, setDelimiter] = React.useState('auto');
  const [hasHeader, setHasHeader] = React.useState(true);
  const [inferTypes, setInferTypes] = React.useState(true);
  const [includeHeader, setIncludeHeader] = React.useState(true);
  const [activeExample, setActiveExample] = React.useState(0);

  const process = React.useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    const resolvedDelimiter: string =
      mode === 'csv-to-json' && delimiter === 'auto'
        ? detectDelimiter(input)
        : delimiter;

    let result: { success: boolean; data?: unknown; error?: string };

    if (mode === 'csv-to-json') {
      const res = csvToJson(input, {
        delimiter: resolvedDelimiter,
        hasHeader,
        inferTypes,
      });
      result = res.success
        ? { success: true, data: formatJson(res.data) }
        : res;
    } else {
      result = jsonToCsv(input, {
        delimiter: resolvedDelimiter === 'auto' ? ',' : resolvedDelimiter,
        includeHeader,
      });
    }

    if (result.success) {
      setOutput(result.data as string);
      setError(null);
    } else {
      setOutput('');
      setError(result.error ?? 'Conversion failed.');
    }
  }, [input, mode, delimiter, hasHeader, inferTypes, includeHeader]);

  React.useEffect(() => {
    const t = setTimeout(process, 150);
    return () => clearTimeout(t);
  }, [process]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    setMode(examples[i].mode);
    setInput(examples[i].input);
    setError(null);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
    setActiveExample(-1);
  };

  const handleSwap = () => {
    if (!output || error) return;
    setMode(mode === 'csv-to-json' ? 'json-to-csv' : 'csv-to-json');
    setInput(output);
    setOutput('');
    setError(null);
    setActiveExample(-1);
    toast({ type: 'success', message: 'Swapped input and conversion direction.' });
  };

  const handleDownload = () => {
    if (!output || error) return;
    const isCsv = mode === 'json-to-csv';
    const blob = new Blob([output], { type: isCsv ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isCsv ? 'converted.csv' : 'converted.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({ type: 'success', message: `Downloaded converted.${isCsv ? 'csv' : 'json'}` });
  };

  const stats = React.useMemo(() => {
    if (!output) return null;
    const rows = output.split('\n').length;
    const chars = output.length;
    return `${rows.toLocaleString()} line${rows === 1 ? '' : 's'} · ${chars.toLocaleString()} characters`;
  }, [output]);

  return (
    <ToolLayout
      name="CSV ↔ JSON Converter"
      description="Convert bidirectionally between CSV spreadsheets and JSON data with delimiter detection, type inference, and quoting support."
      category="Formatting"
    >
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-secondary border border-border w-fit mb-4">
        <button
          onClick={() => setMode('csv-to-json')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5',
            mode === 'csv-to-json' ? 'bg-accent text-bg-primary' : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <FileSpreadsheet className="h-3.5 w-3.5" /> CSV to JSON
        </button>
        <button
          onClick={() => setMode('json-to-csv')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5',
            mode === 'json-to-csv' ? 'bg-accent text-bg-primary' : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Braces className="h-3.5 w-3.5" /> JSON to CSV
        </button>
      </div>

      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[480px]">
        <div className="flex flex-col space-y-3 min-h-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-secondary">
              {mode === 'csv-to-json' ? 'CSV Input' : 'JSON Input'}
            </h2>
            <Button variant="ghost" size="sm" onClick={handleClear} icon={<RotateCcw className="h-4 w-4" />}>
              Clear
            </Button>
          </div>

          <div className="flex-1 min-h-[260px]">
            <Input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setActiveExample(-1);
              }}
              placeholder={mode === 'csv-to-json' ? 'name,age,email\nAlice,30,...' : '[{"name": "Alice", "age": 30}]'}
              monospace
              className="w-full h-full"
              wrapperClassName="h-full"
            />
          </div>

          <div className="flex flex-wrap items-end gap-4 p-4 rounded-xl border border-border bg-bg-secondary">
            <div className="w-40">
              <Select
                label="Delimiter"
                options={delimiterOptions}
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
              />
            </div>

            {mode === 'csv-to-json' ? (
              <>
                <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer pb-1.5">
                  <input
                    type="checkbox"
                    checked={hasHeader}
                    onChange={(e) => setHasHeader(e.target.checked)}
                    className="accent-accent h-3.5 w-3.5"
                  />
                  First row is header
                </label>
                <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer pb-1.5">
                  <input
                    type="checkbox"
                    checked={inferTypes}
                    onChange={(e) => setInferTypes(e.target.checked)}
                    className="accent-accent h-3.5 w-3.5"
                  />
                  Infer number / boolean types
                </label>
              </>
            ) : (
              <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer pb-1.5">
                <input
                  type="checkbox"
                  checked={includeHeader}
                  onChange={(e) => setIncludeHeader(e.target.checked)}
                  className="accent-accent h-3.5 w-3.5"
                />
                Include header row
              </label>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-3 min-h-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-secondary">
              {mode === 'csv-to-json' ? 'JSON Output' : 'CSV Output'}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSwap}
                disabled={!output || !!error}
                icon={<ArrowLeftRight className="h-4 w-4" />}
                title="Swap input and output"
              >
                Swap
              </Button>
              <CopyButton value={output} disabled={!output || !!error} />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={!output || !!error}
                icon={<Download className="h-4 w-4" />}
              >
                Download
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-[260px]">
            {error ? (
              <div className="h-full w-full rounded-xl border border-error/20 bg-error/5 p-4 flex items-start gap-2.5 animate-fade-in">
                <AlertTriangle className="h-4 w-4 text-error shrink-0 mt-0.5" />
                <p className="text-xs text-error leading-relaxed">{error}</p>
              </div>
            ) : (
              <GradientBox value={output} placeholder="Converted output will appear here..." className="h-full w-full overflow-y-auto" />
            )}
          </div>

          {stats && !error && (
            <span className="text-xs text-text-muted font-medium">{stats}</span>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
