'use client';

import * as React from 'react';
import { RotateCcw, ArrowRight, Settings, Download, AlertTriangle, CheckCircle, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { GradientBox } from '@/components/ui/GradientBox';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import {
  jsonToYaml,
  yamlToJson,
  validateYaml
} from '@/tools/yaml-json/utils';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { HistoryDrawer } from '@/components/tool/HistoryDrawer';
import { useAppStore, type HistoryItem } from '@/lib/store/useStore';
import { useWorkspaces } from '@/lib/hooks/useWorkspaces';
import { WorkspaceTabs } from '@/components/ui/WorkspaceTabs';
import { SplitPanesView } from '@/components/ui/SplitPanesView';

const indentOptions = [
  { value: '2', label: '2 Spaces' },
  { value: '4', label: '4 Spaces' },
];

const examples = [
  {
    label: 'JSON → YAML (User Config)',
    input: `{
  "name": "Alice Smith",
  "age": 30,
  "roles": ["admin", "developer"],
  "active": true,
  "address": {
    "city": "New York",
    "zip": "10001"
  },
  "metadata": null
}`,
    mode: 'json' as const,
  },
  {
    label: 'YAML → JSON (K8s Service)',
    input: `apiVersion: v1
kind: Service
metadata:
  name: my-app-service
  labels:
    app: my-app
spec:
  type: ClusterIP
  selector:
    app: my-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 9376`,
    mode: 'yaml' as const,
  }
];

interface YamlJsonState {
  input: string;
  output: string;
  mode: 'json' | 'yaml';
  indent: string;
  activeExample: number;
  error: string | null;
  validation: any;
}

const defaultState: YamlJsonState = {
  input: examples[0].input,
  output: '',
  mode: 'json',
  indent: '2',
  activeExample: 0,
  error: null,
  validation: null,
};

export default function Page() {
  const {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    setActiveWorkspaceId,
    addWorkspace,
    removeWorkspace,
    updateActiveWorkspace
  } = useWorkspaces<YamlJsonState>(defaultState, 'Converter');

  const { state } = activeWorkspace;
  const { addHistoryItem } = useAppStore();

  React.useEffect(() => {
    let active = true;
    if (!state.input.trim() || state.mode !== 'yaml') {
      updateActiveWorkspace({ validation: null });
      return;
    }
    validateYaml(state.input).then(res => {
      if (active) updateActiveWorkspace({ validation: res });
    });
    return () => { active = false; };
  }, [state.input, state.mode, updateActiveWorkspace]);

  const handleProcess = React.useCallback(async () => {
    if (!state.input.trim()) {
      updateActiveWorkspace({ output: '', error: null });
      return;
    }

    try {
      const result = state.mode === 'json' 
        ? await jsonToYaml(state.input, { indent: parseInt(state.indent, 10) }) 
        : await yamlToJson(state.input);
      
      updateActiveWorkspace({
        output: result,
        error: result.startsWith('Invalid') ? result : null
      });

      if (!result.startsWith('Invalid')) {
        addHistoryItem('yaml-json', state.input.slice(0, 1000), result.slice(0, 1000), { mode: state.mode });
      }
    } catch (e) {
      updateActiveWorkspace({ error: (e as Error).message, output: '' });
    }
  }, [state.input, state.mode, state.indent, addHistoryItem, updateActiveWorkspace]);

  React.useEffect(() => {
    const t = setTimeout(handleProcess, 100);
    return () => clearTimeout(t);
  }, [handleProcess]);

  const applyExample = (i: number) => {
    updateActiveWorkspace({
      activeExample: i,
      mode: examples[i].mode,
      input: examples[i].input,
      error: null
    });
  };

  const handleClear = () => {
    updateActiveWorkspace({
      input: '',
      output: '',
      error: null,
      activeExample: -1
    });
  };

  const handleSwap = () => {
    if (!state.output || state.output.startsWith('Invalid')) return;
    updateActiveWorkspace({
      mode: state.mode === 'json' ? 'yaml' : 'json',
      input: state.output,
      output: '',
      error: null,
      activeExample: -1
    });
    toast({ type: 'success', message: 'Swapped inputs and conversion direction!' });
  };

  const handleDownload = () => {
    if (!state.output || state.output.startsWith('Invalid')) return;
    const isTargetYaml = state.mode === 'json';
    const blob = new Blob([state.output], { type: isTargetYaml ? 'text/yaml' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isTargetYaml ? 'converted_config.yaml' : 'converted_config.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({ type: 'success', message: `Downloaded converted_config.${isTargetYaml ? 'yaml' : 'json'}` });
  };

  const handleRestore = (item: HistoryItem) => {
    const updates: Partial<YamlJsonState> = { input: item.input, activeExample: -1 };
    if (item.metadata?.mode) {
      updates.mode = item.metadata.mode as 'json' | 'yaml';
    }
    updateActiveWorkspace(updates);
  };

  const toolbarContent = (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-secondary border border-border shrink-0">
        <button
          onClick={() => updateActiveWorkspace({ mode: 'json' })}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
            state.mode === 'json' ? 'bg-accent text-bg-primary' : 'text-text-secondary hover:text-text-primary'
          )}
        >
          JSON to YAML
        </button>
        <button
          onClick={() => updateActiveWorkspace({ mode: 'yaml' })}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
            state.mode === 'yaml' ? 'bg-accent text-bg-primary' : 'text-text-secondary hover:text-text-primary'
          )}
        >
          YAML to JSON
        </button>
      </div>
    </div>
  );

  const leftPane = (
    <div className="flex flex-col h-full space-y-4 min-h-0">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium text-text-secondary">Input Code</h2>
          <span className={cn(
            'text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider',
            state.mode === 'json' 
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
              : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
          )}>
            {state.mode === 'json' ? 'JSON' : 'YAML'}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClear} icon={<RotateCcw className="h-4 w-4" />}>
          Clear
        </Button>
      </div>

      <Input 
        value={state.input} 
        onChange={(e) => updateActiveWorkspace({ input: e.target.value, activeExample: -1 })}
        onDropText={(text) => updateActiveWorkspace({ input: text, activeExample: -1 })}
        placeholder={state.mode === 'json' ? '{"key": "value"}' : 'key: value'} 
        monospace 
        className="w-full h-full"
        wrapperClassName="flex-1 min-h-[200px]" 
      />

      {/* Validation Banner alerts (YAML only) */}
      {state.validation && (
        <div className={cn(
          'p-3.5 rounded-xl border flex items-start gap-2.5 text-xs shadow-sm animate-fade-in shrink-0',
          state.validation.valid 
            ? 'bg-success/5 border-success/20 text-success font-semibold' 
            : 'bg-error/10 border-error/20 text-error'
        )}>
          {state.validation.valid ? (
            <>
              <CheckCircle className="h-4 w-4 shrink-0 text-success mt-0.5" />
              <span>Valid YAML Structure</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 shrink-0 text-error mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">YAML Parse Alert</span>
                <p className="leading-relaxed">
                  {state.validation.error} {state.validation.line ? `(Line: ${state.validation.line})` : ''}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {state.mode === 'json' && (
        <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-4 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary font-outfit border-b border-border pb-2.5">
            <Settings className="h-4 w-4 text-accent" />
            <span>Conversion Preferences</span>
          </div>
          <div className="w-full">
            <Select
              label="YAML Indent Spacing"
              options={indentOptions}
              value={state.indent}
              onChange={(e) => updateActiveWorkspace({ indent: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );

  const rightPane = (
    <div className="flex flex-col h-full space-y-4 min-h-0">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium text-text-secondary">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent font-bold">
              Converted Output
            </span>
          </h2>
          <span className={cn(
            'text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider',
            state.mode === 'yaml' 
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
              : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
          )}>
            {state.mode === 'yaml' ? 'JSON' : 'YAML'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSwap} 
            disabled={!state.output || state.output.startsWith('Invalid') || state.output.startsWith('Error')}
            icon={<ArrowRight className="h-4 w-4" />}
            title="Swap Inputs"
          >
            Swap
          </Button>
          <CopyButton value={state.output} disabled={!state.output || state.output.startsWith('Invalid')} />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={!state.output || state.output.startsWith('Invalid')}
            icon={<Download className="h-4 w-4" />}
          >
            Download
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-[200px]">
        <GradientBox value={state.output} placeholder="Output code will appear here..." className="h-full w-full overflow-y-auto" />
      </div>
      
      {state.output && !state.output.startsWith('Invalid') && (
        <span className="text-xs text-text-muted font-medium block shrink-0">
          {state.output.length.toLocaleString()} characters · {state.output.split('\n').length.toLocaleString()} lines
        </span>
      )}
    </div>
  );

  return (
    <ToolLayout 
      name="YAML ↔ JSON Converter" 
      description="Convert bidirectionally between YAML and JSON formats with advanced multi-document parsing and precise line validation checks" 
      category="Formatting"
      historyComponent={<HistoryDrawer toolId="yaml-json" onRestore={handleRestore} />}
    >
      <WorkspaceTabs
        workspaces={workspaces}
        activeId={activeWorkspaceId}
        onChange={setActiveWorkspaceId}
        onAdd={addWorkspace}
        onClose={removeWorkspace}
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
