'use client';

import * as React from 'react';
import {
  Download,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Sparkles,
  FileCode,
  Check,
  AlertTriangle,
  Eye,
  BarChart2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { JsonViewer } from '@/components/ui/JsonViewer';
import { JsonTreeViewer } from '@/components/ui/JsonTreeViewer';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { toast } from '@/components/ui/Toast';
import {
  processJson,
  validateJson,
  JsonAction,
  repairJsonString,
  parseJson
} from '@/tools/json/utils';
import { cn } from '@/lib/utils';

import { HistoryDrawer } from '@/components/tool/HistoryDrawer';
import { useAppStore, type HistoryItem } from '@/lib/store/useStore';

const actions: { value: JsonAction; label: string }[] = [
  { value: 'beautify', label: 'Beautify' },
  { value: 'minify', label: 'Minify' },
  { value: 'sort', label: 'Sort Keys' }
];

const indentOptions = [
  { value: '2', label: '2 spaces' },
  { value: '4', label: '4 spaces' },
];

interface Example {
  label: string;
  action: JsonAction;
  input: string;
}

const examples: Example[] = [
  {
    label: 'User object',
    action: 'beautify',
    input: '{"name":"Alice","age":30,"address":{"city":"New York","zip":"10001"},"tags":["admin","user"]}',
  },
  {
    label: 'Sort keys',
    action: 'sort',
    input: '{"zebra":1,"apple":2,"mango":3,"banana":4}',
  },
  {
    label: 'Minify',
    action: 'minify',
    input: '{\n  "id": 1,\n  "product": "Widget",\n  "price": 9.99,\n  "inStock": true\n}',
  }
];

type OutputTab = 'json_text' | 'tree';

export default function Page() {
  const [input, setInput] = React.useState(examples[0].input);
  const [output, setOutput] = React.useState('');
  const [action, setAction] = React.useState<JsonAction>(examples[0].action);
  const [indent, setIndent] = React.useState('2');
  const [error, setError] = React.useState<string | null>(null);
  const [activeExample, setActiveExample] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState<OutputTab>('json_text');
  const [repairApplied, setRepairApplied] = React.useState<string[]>([]);
  const { addHistoryItem } = useAppStore();

  // State to hold parsed JSON for tree viewer and stats
  const [parsedData, setParsedData] = React.useState<unknown | null>(null);

  const handleProcess = React.useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      setParsedData(null);
      return;
    }
    try {
      const processed = processJson(input, action, parseInt(indent, 10));
      setOutput(processed);
      setError(null);

      // Attempt parsing for parsed view
      const parsed = parseJson(processed);
      if (parsed.success) {
        setParsedData(parsed.data);
      } else {
        setParsedData(null);
      }

      // Dynamic Zustand history log
      addHistoryItem('json', input.slice(0, 1000), processed.slice(0, 1000), { action });
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
      setParsedData(null);
    }
  }, [input, action, indent, addHistoryItem]);

  React.useEffect(() => {
    const t = setTimeout(handleProcess, 100);
    return () => clearTimeout(t);
  }, [handleProcess]);

  const applyExample = (i: number) => {
    setActiveExample(i);
    setAction(examples[i].action);
    setInput(examples[i].input);
    setRepairApplied([]);
    setError(null);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setParsedData(null);
    setError(null);
    setRepairApplied([]);
  };

  const handleRepair = () => {
    const { repaired, changes } = repairJsonString(input);
    if (changes.length > 0) {
      setInput(repaired);
      setRepairApplied(changes);
      setError(null);
      toast({
        type: 'success',
        message: `Successfully repaired: ${changes.join(', ')}`
      });
    } else {
      toast({
        type: 'error',
        message: 'No repairable syntax errors detected.'
      });
    }
  };

  const handleDownload = () => {
    const content = output;
    const filename = 'formatted.json';
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const validation = input.trim() ? validateJson(input) : null;

  // JSON Statistics calculation
  const stats = React.useMemo(() => {
    if (!parsedData) return null;
    try {
      let nodeCount = 0;

      const traverse = (item: unknown, currentDepth: number): number => {
        nodeCount++;
        if (item === null || typeof item !== 'object') {
          return currentDepth;
        }
        let deepestChild = currentDepth;
        if (Array.isArray(item)) {
          for (const el of item) {
            deepestChild = Math.max(deepestChild, traverse(el, currentDepth + 1));
          }
        } else {
          const obj = item as Record<string, unknown>;
          for (const k of Object.keys(obj)) {
            deepestChild = Math.max(deepestChild, traverse(obj[k], currentDepth + 1));
          }
        }
        return deepestChild;
      };

      const depth = traverse(parsedData, 1);
      const rootType = parsedData === null ? 'null' : Array.isArray(parsedData) ? 'Array' : typeof parsedData;
      const sizeInBytes = new Blob([output]).size;

      return {
        nodeCount,
        depth,
        rootType: rootType.charAt(0).toUpperCase() + rootType.slice(1),
        sizeInKb: (sizeInBytes / 1024).toFixed(3)
      };
    } catch {
      return null;
    }
  }, [parsedData, output]);

  // Determine current active output tab value
  const getOutputValue = () => output;

  const handleRestore = (item: HistoryItem) => {
    setInput(item.input);
    if (item.metadata?.action) {
      setAction(item.metadata.action);
    }
  };

  return (
    <ToolLayout
      name="JSON Beautifier & Validator"
      description="Format, minify, sort, intelligently repair, and visualize JSON structures with interactive trees"
      category="Formatting"
      historyComponent={<HistoryDrawer toolId="json" onRestore={handleRestore} />}
    >
      <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Input Pane */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold font-outfit text-text-primary flex items-center gap-1.5">
              <span>Input Source</span>
              {validation && !validation.valid && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-error/10 text-error border border-error/20 px-2 py-0.5 rounded-full">
                  <AlertCircle className="h-3 w-3" /> Syntax Error
                </span>
              )}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              icon={<RotateCcw className="h-4 w-4" />}
            >
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
            placeholder='{"key": "value"}'
            monospace
            className="min-h-[300px]"
          />

          <div className="flex flex-wrap items-center gap-4 bg-bg-secondary p-4 rounded-xl border border-border">
            <Select
              label="Format Action"
              options={actions}
              value={action}
              onChange={(e) => setAction(e.target.value as JsonAction)}
            />
            {action === 'beautify' && (
              <Select
                label="Indent Size"
                options={indentOptions}
                value={indent}
                onChange={(e) => setIndent(e.target.value)}
              />
            )}
          </div>

          {/* Smart Auto-Repair Section */}
          {validation && !validation.valid && (
            <div className="flex flex-col gap-3 p-4 rounded-xl border border-error/20 bg-error/5 text-error">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Syntactic Issues Detected</h3>
                  <p className="text-xs text-text-secondary mt-1 break-words">{validation.error}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRepair}
                className="self-start gap-1.5 text-xs text-accent hover:bg-accent/10 border border-accent/25 hover:border-accent/40 bg-bg-secondary"
                icon={<Sparkles className="h-3.5 w-3.5" />}
              >
                Auto-Repair JSON
              </Button>
            </div>
          )}

          {/* Validation Banner (Success) */}
          {validation && validation.valid && !error && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-success/10 text-success border border-success/20">
              <CheckCircle className="h-4 w-4" />
              <span>Valid JSON Structure</span>
            </div>
          )}

          {/* Repair Applied Logs */}
          {repairApplied.length > 0 && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-success/20 bg-success/5 text-success">
              <Check className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold block">Auto-Repair Successful!</span>
                <span className="text-text-secondary mt-1 block leading-relaxed">
                  Corrected syntactic errors: {repairApplied.join(', ')}.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Output Pane */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-semibold font-outfit text-text-primary">
              Output Viewer
            </h2>
            <div className="flex items-center gap-2">
              <CopyButton value={getOutputValue()} label="Copy Output" disabled={!getOutputValue()} />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={!getOutputValue()}
                icon={<Download className="h-4 w-4" />}
              >
                Download
              </Button>
            </div>
          </div>

          {/* Navigation tabs for text view, tree view and conversion targets */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-secondary border border-border overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('json_text')}
              disabled={!output}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer',
                activeTab === 'json_text'
                  ? 'bg-bg-tertiary text-accent border border-border'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <FileCode className="h-3.5 w-3.5" />
              JSON Text
            </button>
            <button
              onClick={() => setActiveTab('tree')}
              disabled={!parsedData}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer',
                activeTab === 'tree'
                  ? 'bg-bg-tertiary text-accent border border-border'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              Interactive Tree
            </button>
          </div>

          {/* Active Tab Viewport */}
          {activeTab === 'json_text' && (
            <JsonViewer value={output} maxHeight="480px" minHeight="240px" />
          )}

          {activeTab === 'tree' && parsedData !== null && (
            <JsonTreeViewer data={parsedData} maxHeight="480px" minHeight="240px" />
          )}


          {/* Line & Char Counts or Error Banners */}
          {error && (
            <div className="p-4 rounded-xl border border-error/20 bg-error/5 text-error flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Processing Error: {error}</span>
            </div>
          )}

          {!error && getOutputValue() && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>{getOutputValue().length.toLocaleString()} characters</span>
              <span>·</span>
              <span>{getOutputValue().split('\n').length.toLocaleString()} lines</span>
            </div>
          )}

          {/* Real-time Insights and Schema statistics panel */}
          {stats && (
            <div className="bg-bg-secondary p-4 rounded-xl border border-border mt-2 space-y-3">
              <h3 className="text-xs font-bold font-outfit uppercase tracking-wider text-accent flex items-center gap-1.5">
                <BarChart2 className="h-4 w-4" />
                <span>JSON Schema Insights</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-bg-tertiary p-2 rounded-lg border border-border">
                  <span className="text-text-muted block mb-0.5">Root Element</span>
                  <span className="font-semibold text-text-primary font-mono">{stats.rootType}</span>
                </div>
                <div className="bg-bg-tertiary p-2 rounded-lg border border-border">
                  <span className="text-text-muted block mb-0.5">Total Nodes</span>
                  <span className="font-semibold text-text-primary font-mono">{stats.nodeCount}</span>
                </div>
                <div className="bg-bg-tertiary p-2 rounded-lg border border-border">
                  <span className="text-text-muted block mb-0.5">Nesting Depth</span>
                  <span className="font-semibold text-text-primary font-mono">{stats.depth} levels</span>
                </div>
                <div className="bg-bg-tertiary p-2 rounded-lg border border-border">
                  <span className="text-text-muted block mb-0.5">Uncompressed</span>
                  <span className="font-semibold text-text-primary font-mono">{stats.sizeInKb} KB</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
