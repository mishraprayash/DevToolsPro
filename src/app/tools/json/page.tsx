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
import { useWorkspaces } from '@/lib/hooks/useWorkspaces';
import { WorkspaceTabs } from '@/components/ui/WorkspaceTabs';
import { SplitPanesView } from '@/components/ui/SplitPanesView';

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

interface JsonState {
  input: string;
  output: string;
  action: JsonAction;
  indent: string;
  error: string | null;
  activeExample: number;
  activeTab: OutputTab;
  repairApplied: string[];
  parsedData: unknown | null;
}

const defaultState: JsonState = {
  input: examples[0].input,
  output: '',
  action: examples[0].action,
  indent: '2',
  error: null,
  activeExample: 0,
  activeTab: 'json_text',
  repairApplied: [],
  parsedData: null
};

export default function Page() {
  const {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    setActiveWorkspaceId,
    addWorkspace,
    removeWorkspace,
    updateActiveWorkspace,
    copyShareLink
  } = useWorkspaces<JsonState>(defaultState, 'JSON', 'json');

  const { state } = activeWorkspace;
  const { addHistoryItem } = useAppStore();

  const handleProcess = React.useCallback(() => {
    if (!state.input.trim()) {
      updateActiveWorkspace({ output: '', error: null, parsedData: null });
      return;
    }
    try {
      const processed = processJson(state.input, state.action, parseInt(state.indent, 10));
      
      let newParsedData: unknown | null = null;
      const parsed = parseJson(processed);
      if (parsed.success) {
        newParsedData = parsed.data;
      }
      
      updateActiveWorkspace({ output: processed, error: null, parsedData: newParsedData });
      
      // Dynamic Zustand history log
      addHistoryItem('json', state.input.slice(0, 1000), processed.slice(0, 1000), { action: state.action });
    } catch (e) {
      updateActiveWorkspace({ error: (e as Error).message, output: '', parsedData: null });
    }
  }, [state.input, state.action, state.indent, addHistoryItem, updateActiveWorkspace]);

  React.useEffect(() => {
    const t = setTimeout(handleProcess, 100);
    return () => clearTimeout(t);
  }, [handleProcess]);

  const applyExample = (i: number) => {
    updateActiveWorkspace({
      activeExample: i,
      action: examples[i].action,
      input: examples[i].input,
      repairApplied: [],
      error: null
    });
  };

  const handleClear = () => {
    updateActiveWorkspace({
      input: '',
      output: '',
      parsedData: null,
      error: null,
      repairApplied: [],
      activeExample: -1
    });
  };

  const handleRepair = () => {
    const { repaired, changes } = repairJsonString(state.input);
    if (changes.length > 0) {
      updateActiveWorkspace({
        input: repaired,
        repairApplied: changes,
        error: null,
        activeExample: -1
      });
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
    const content = state.output;
    const filename = 'formatted.json';
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const validation = state.input.trim() ? validateJson(state.input) : null;

  // JSON Statistics calculation
  const stats = React.useMemo(() => {
    if (!state.parsedData) return null;
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

      const depth = traverse(state.parsedData, 1);
      const rootType = state.parsedData === null ? 'null' : Array.isArray(state.parsedData) ? 'Array' : typeof state.parsedData;
      const sizeInBytes = new Blob([state.output]).size;

      return {
        nodeCount,
        depth,
        rootType: rootType.charAt(0).toUpperCase() + rootType.slice(1),
        sizeInKb: (sizeInBytes / 1024).toFixed(3)
      };
    } catch {
      return null;
    }
  }, [state.parsedData, state.output]);

  const handleRestore = (item: HistoryItem) => {
    const update: Partial<JsonState> = { input: item.input, activeExample: -1 };
    if (item.metadata?.action) {
      update.action = item.metadata.action as JsonAction;
    }
    updateActiveWorkspace(update);
  };

  const toolbarContent = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-secondary border border-border overflow-x-auto scrollbar-hide">
        <button
          onClick={() => updateActiveWorkspace({ activeTab: 'json_text' })}
          disabled={!state.output}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer',
            state.activeTab === 'json_text'
              ? 'bg-bg-tertiary text-accent border border-border'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <FileCode className="h-3.5 w-3.5" />
          JSON Text
        </button>
        <button
          onClick={() => updateActiveWorkspace({ activeTab: 'tree' })}
          disabled={!state.parsedData}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer',
            state.activeTab === 'tree'
              ? 'bg-bg-tertiary text-accent border border-border'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          Interactive Tree
        </button>
      </div>
    </div>
  );

  const leftPane = (
    <div className="flex flex-col h-full space-y-4 min-h-0">
      <div className="flex items-center justify-between shrink-0">
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
        value={state.input}
        onChange={(e) => updateActiveWorkspace({ input: e.target.value, activeExample: -1 })}
        onDropText={(text) => updateActiveWorkspace({ input: text, activeExample: -1 })}
        placeholder='{"key": "value"}'
        monospace
        className="w-full h-full"
        wrapperClassName="flex-1 min-h-[200px]"
      />

      <div className="flex flex-wrap items-center gap-4 bg-bg-secondary p-4 rounded-xl border border-border shrink-0">
        <Select
          label="Format Action"
          options={actions}
          value={state.action}
          onChange={(e) => updateActiveWorkspace({ action: e.target.value as JsonAction })}
        />
        {state.action === 'beautify' && (
          <Select
            label="Indent Size"
            options={indentOptions}
            value={state.indent}
            onChange={(e) => updateActiveWorkspace({ indent: e.target.value })}
          />
        )}
      </div>

      {/* Smart Auto-Repair Section */}
      {validation && !validation.valid && (
        <div className="flex flex-col gap-3 p-4 rounded-xl border border-error/20 bg-error/5 text-error shrink-0">
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
      {validation && validation.valid && !state.error && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-success/10 text-success border border-success/20 shrink-0">
          <CheckCircle className="h-4 w-4" />
          <span>Valid JSON Structure</span>
        </div>
      )}

      {/* Repair Applied Logs */}
      {state.repairApplied.length > 0 && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-success/20 bg-success/5 text-success shrink-0">
          <Check className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold block">Auto-Repair Successful!</span>
            <span className="text-text-secondary mt-1 block leading-relaxed">
              Corrected syntactic errors: {state.repairApplied.join(', ')}.
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const rightPane = (
    <div className="flex flex-col h-full space-y-4 min-h-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <h2 className="text-base font-semibold font-outfit text-text-primary">
          Output Viewer
        </h2>
        <div className="flex items-center gap-2">
          <CopyButton value={state.output} label="Copy Output" disabled={!state.output} />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={!state.output}
            icon={<Download className="h-4 w-4" />}
          >
            Download
          </Button>
        </div>
      </div>

      {/* Active Tab Viewport */}
      <div className="flex-1 min-h-[200px] flex flex-col h-full">
        {state.activeTab === 'json_text' && (
          <JsonViewer value={state.output} className="flex-1 h-full min-h-[200px]" />
        )}
        {state.activeTab === 'tree' && state.parsedData !== null && (
          <JsonTreeViewer data={state.parsedData} className="flex-1 h-full min-h-[200px]" />
        )}
      </div>

      {/* Line & Char Counts or Error Banners */}
      {state.error && (
        <div className="p-4 rounded-xl border border-error/20 bg-error/5 text-error flex items-center gap-2 text-sm shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Processing Error: {state.error}</span>
        </div>
      )}

      {!state.error && state.output && (
        <div className="flex items-center gap-2 text-xs text-text-muted shrink-0">
          <span>{state.output.length.toLocaleString()} characters</span>
          <span>·</span>
          <span>{state.output.split('\n').length.toLocaleString()} lines</span>
        </div>
      )}

      {/* Real-time Insights and Schema statistics panel */}
      {stats && (
        <div className="bg-bg-secondary p-4 rounded-xl border border-border mt-2 space-y-3 shrink-0">
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
  );

  return (
    <ToolLayout
      name="JSON Beautifier & Validator"
      description="Format, minify, sort, intelligently repair, and visualize JSON structures with interactive trees"
      category="Formatting"
      historyComponent={<HistoryDrawer toolId="json" onRestore={handleRestore} />}
    >
      <WorkspaceTabs
        workspaces={workspaces}
        activeId={activeWorkspaceId}
        onChange={setActiveWorkspaceId}
        onAdd={addWorkspace}
        onClose={removeWorkspace}
        onShare={copyShareLink}
      />
      
      <ExamplePills examples={examples} activeIndex={state.activeExample} onSelect={applyExample} />

      <div className="mt-4">
        <SplitPanesView
          toolbarContent={toolbarContent}
          leftPane={leftPane}
          rightPane={rightPane}
        />
      </div>
    </ToolLayout>
  );
}
