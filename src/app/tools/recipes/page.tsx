'use client';

import * as React from 'react';
import {
  Plus, Search, ArrowUp, ArrowDown, Trash2, Power, ChevronDown, ChevronRight, GripVertical,
  Download, Save, FolderOpen, Upload, Copy, AlertTriangle, CheckCircle2, RotateCcw, Loader2, X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import {
  operations,
  opCategories,
  getOperation,
  createStep,
  runRecipe,
  serializeRecipe,
  toSerializable,
  parseRecipe,
  searchOperations,
  exampleRecipes,
  parseSavedRecipes,
  upsertSavedRecipe,
  type RecipeStep,
  type RecipeRunResult,
  type StepResult,
  type ParamDef,
  type ParamValue,
  type SavedRecipe,
  type OpCategory,
} from '@/tools/recipes/utils';

const STORAGE_KEY = 'devtools-pro:recipes:saved';
const RUN_DEBOUNCE_MS = 250;
const PREVIEW_LIMIT = 4000;

function stepsFromExample(index: number): RecipeStep[] {
  const parsed = parseRecipe(exampleRecipes[index].recipe);
  return parsed.success ? parsed.data.steps : [];
}

function readSaved(): SavedRecipe[] {
  try {
    return parseSavedRecipes(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

function writeSaved(list: SavedRecipe[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

function formatMs(ms: number): string {
  if (ms < 1) return '<1 ms';
  if (ms < 1000) return `${ms.toFixed(ms < 10 ? 1 : 0)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function truncate(text: string): { text: string; truncated: boolean } {
  if (text.length <= PREVIEW_LIMIT) return { text, truncated: false };
  return { text: text.slice(0, PREVIEW_LIMIT), truncated: true };
}

const fieldClass =
  'w-full h-8 px-2.5 rounded-md bg-bg-tertiary border border-border text-xs text-text-primary font-mono placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors';

// ─── Param editor ───────────────────────────────────────────────────────────

interface ParamFieldProps {
  def: ParamDef;
  value: ParamValue | undefined;
  idPrefix: string;
  onChange: (value: ParamValue) => void;
}

function ParamField({ def, value, idPrefix, onChange }: ParamFieldProps) {
  const id = `${idPrefix}-${def.key}`;
  if (def.type === 'checkbox') {
    return (
      <label htmlFor={id} className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer select-none h-8">
        <input
          id={id}
          type="checkbox"
          checked={typeof value === 'boolean' ? value : def.default}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-border text-accent focus:ring-accent bg-bg-tertiary h-4 w-4"
        />
        {def.label}
      </label>
    );
  }
  return (
    <div className="space-y-1 min-w-0">
      <label htmlFor={id} className="block text-[11px] font-medium text-text-muted uppercase tracking-wider">{def.label}</label>
      {def.type === 'select' ? (
        <Select
          id={id}
          value={typeof value === 'string' ? value : def.default}
          onChange={(e) => onChange(e.target.value)}
          options={def.options}
          className="h-8 px-2.5 pr-8 text-xs rounded-md"
        />
      ) : (
        <input
          id={id}
          type="text"
          value={typeof value === 'string' ? value : def.default}
          placeholder={def.placeholder}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
        />
      )}
    </div>
  );
}

// ─── Step card ──────────────────────────────────────────────────────────────

interface StepCardProps {
  step: RecipeStep;
  index: number;
  count: number;
  result: StepResult | undefined;
  expanded: boolean;
  dragOver: boolean;
  onToggleExpand: () => void;
  onMove: (dir: -1 | 1) => void;
  onToggleEnabled: () => void;
  onRemove: () => void;
  onParamChange: (key: string, value: ParamValue) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

function StepCard({
  step, index, count, result, expanded, dragOver,
  onToggleExpand, onMove, onToggleEnabled, onRemove, onParamChange,
  onDragStart, onDragOver, onDrop, onDragEnd,
}: StepCardProps) {
  const op = getOperation(step.op);
  const previewId = `recipe-step-${step.uid}-preview`;
  const status = result?.status;
  const preview = result?.output !== undefined ? truncate(result.output) : null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    onMove(e.key === 'ArrowUp' ? -1 : 1);
  };

  return (
    <li
      onKeyDown={onKeyDown}
      onDragOver={onDragOver}
      onDrop={onDrop}
      aria-label={`Step ${index + 1}: ${op?.label ?? step.op}`}
      className={cn(
        'rounded-xl border bg-bg-secondary transition-colors',
        status === 'error' ? 'border-error/40' : 'border-border',
        !step.enabled && 'opacity-60',
        dragOver && 'ring-2 ring-accent/50',
      )}
    >
      <div className="flex items-center gap-1.5 px-2 py-2">
        <span
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          title="Drag to reorder (or Alt + ↑/↓)"
          aria-hidden="true"
          className="hidden sm:flex cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary"
        >
          <GripVertical className="h-4 w-4" />
        </span>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-bg-tertiary text-[11px] font-mono text-text-muted">
          {index + 1}
        </span>
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          aria-controls={previewId}
          className="flex flex-1 min-w-0 items-center gap-1.5 text-left rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-muted" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-muted" />}
          <span className={cn('truncate text-sm font-medium', step.enabled ? 'text-text-primary' : 'text-text-muted line-through')}>
            {op?.label ?? step.op}
          </span>
          {status === 'ok' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" aria-label="Succeeded" />}
          {status === 'error' && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-error" aria-label="Failed" />}
          {result && status === 'ok' && (
            <span className="ml-auto shrink-0 text-[10px] font-mono text-text-muted">{formatMs(result.ms)}</span>
          )}
          {status === 'skipped' && <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wider text-text-muted">off</span>}
          {status === 'not-run' && <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wider text-text-muted">not run</span>}
        </button>
        <div className="flex items-center shrink-0">
          <IconButton id={`recipe-step-${step.uid}-up`} label={`Move step ${index + 1} up`} disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUp className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton id={`recipe-step-${step.uid}-down`} label={`Move step ${index + 1} down`} disabled={index === count - 1} onClick={() => onMove(1)}>
            <ArrowDown className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton
            label={step.enabled ? `Disable step ${index + 1}` : `Enable step ${index + 1}`}
            pressed={step.enabled}
            onClick={onToggleEnabled}
            className={step.enabled ? 'text-accent' : undefined}
          >
            <Power className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton label={`Remove step ${index + 1}`} onClick={onRemove} className="hover:text-error">
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>

      {op?.params && op.params.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-3 pb-3">
          {op.params.map((def) => (
            <div key={def.key} className={cn(def.type === 'text' && op.params!.filter((d) => d.type === 'text').length === 1 && 'sm:col-span-2')}>
              <ParamField
                def={def}
                value={step.params[def.key]}
                idPrefix={`recipe-step-${step.uid}`}
                onChange={(v) => onParamChange(def.key, v)}
              />
            </div>
          ))}
        </div>
      )}

      {expanded && (
        <div id={previewId} className="border-t border-border px-3 py-2">
          {status === 'error' ? (
            <p role="alert" className="text-xs font-mono text-error whitespace-pre-wrap break-words">{result?.error}</p>
          ) : status === 'not-run' ? (
            <p className="text-xs text-text-muted">Not run: an earlier step failed.</p>
          ) : preview ? (
            <>
              <pre className="max-h-40 overflow-auto text-xs font-mono text-text-secondary whitespace-pre-wrap break-all">
                {preview.text || <span className="italic text-text-muted">(empty)</span>}
              </pre>
              {preview.truncated && (
                <p className="mt-1 text-[10px] text-text-muted">Preview truncated ({result!.output!.length.toLocaleString()} chars total)</p>
              )}
            </>
          ) : (
            <p className="text-xs text-text-muted">Waiting for output…</p>
          )}
        </div>
      )}
    </li>
  );
}

interface IconButtonProps {
  id?: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  className?: string;
  children: React.ReactNode;
}

function IconButton({ id, label, onClick, disabled, pressed, className, children }: IconButtonProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors',
        'hover:bg-bg-hover hover:text-text-primary disabled:opacity-30 disabled:pointer-events-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
        className,
      )}
    >
      {children}
    </button>
  );
}

// ─── Operation picker ───────────────────────────────────────────────────────

interface OperationPickerProps {
  onPick: (opId: string) => void;
  onClose: () => void;
}

function OperationPicker({ onPick, onClose }: OperationPickerProps) {
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { inputRef.current?.focus(); }, []);

  const matches = React.useMemo(() => searchOperations(query), [query]);
  const grouped = React.useMemo(() => {
    const map = new Map<OpCategory, typeof operations>();
    for (const cat of opCategories) {
      const list = matches.filter((o) => o.category === cat);
      if (list.length) map.set(cat, list);
    }
    return map;
  }, [matches]);

  return (
    <div className="rounded-xl border border-accent/30 bg-bg-secondary shadow-lg">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-text-muted" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && matches[0]) { e.preventDefault(); onPick(matches[0].id); }
            if (e.key === 'Escape') { e.preventDefault(); onClose(); }
          }}
          placeholder="Search operations… (Enter adds first match)"
          aria-label="Search operations"
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        <IconButton label="Close operation picker" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </IconButton>
      </div>
      <div className="max-h-80 overflow-y-auto p-2 space-y-3">
        {grouped.size === 0 && <p className="px-2 py-4 text-center text-xs text-text-muted">No operations match “{query}”.</p>}
        {[...grouped.entries()].map(([cat, ops]) => (
          <div key={cat} role="group" aria-label={cat}>
            <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">{cat}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {ops.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onPick(o.id)}
                  className="flex flex-col items-start rounded-lg px-2.5 py-1.5 text-left hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  <span className="text-sm text-text-primary">{o.label}</span>
                  <span className="text-[11px] text-text-muted line-clamp-1">{o.description}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Page() {
  const [input, setInput] = React.useState(exampleRecipes[0].input);
  // Stable uids for the server-rendered initial recipe: createStep's time-based uids
  // would differ between server and client and cause a hydration mismatch.
  const [steps, setSteps] = React.useState<RecipeStep[]>(() =>
    stepsFromExample(0).map((step, i) => ({ ...step, uid: `initial-${i}` }))
  );
  const [recipeName, setRecipeName] = React.useState(exampleRecipes[0].recipe.name ?? '');
  const [activeExample, setActiveExample] = React.useState(0);
  const [run, setRun] = React.useState<RecipeRunResult | null>(null);
  const [running, setRunning] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState<Set<string>>(() => new Set());
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [saved, setSaved] = React.useState<SavedRecipe[]>([]);
  const [importOpen, setImportOpen] = React.useState(false);
  const [importText, setImportText] = React.useState('');
  const [importError, setImportError] = React.useState<string | null>(null);
  const [dragUid, setDragUid] = React.useState<string | null>(null);
  const [dragOverUid, setDragOverUid] = React.useState<string | null>(null);

  const runToken = React.useRef(0);
  const pendingFocus = React.useRef<{ uid: string; dir: -1 | 1 } | null>(null);

  // Load saved recipes after mount (localStorage is client-only)
  React.useEffect(() => {
    setSaved(readSaved());
  }, []);

  // Debounced live re-run; stale runs are discarded via a token
  React.useEffect(() => {
    const token = ++runToken.current;
    setRunning(true);
    const timer = window.setTimeout(() => {
      runRecipe(input, steps).then((res) => {
        if (token !== runToken.current) return;
        setRun(res);
        setRunning(false);
      });
    }, RUN_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [input, steps]);

  // Restore focus to the moved step's control after reorder
  React.useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending) return;
    pendingFocus.current = null;
    const primary = document.getElementById(`recipe-step-${pending.uid}-${pending.dir === -1 ? 'up' : 'down'}`);
    const fallback = document.getElementById(`recipe-step-${pending.uid}-${pending.dir === -1 ? 'down' : 'up'}`);
    for (const el of [primary, fallback]) {
      if (el instanceof HTMLButtonElement && !el.disabled) { el.focus(); break; }
    }
  }, [steps]);

  const resultsByUid = React.useMemo(() => {
    const map = new Map<string, StepResult>();
    for (const r of run?.results ?? []) map.set(r.uid, r);
    return map;
  }, [run]);

  const markCustom = () => setActiveExample(-1);

  const updateSteps = (updater: (prev: RecipeStep[]) => RecipeStep[]) => {
    setSteps(updater);
    markCustom();
  };

  const addStep = (opId: string) => {
    updateSteps((prev) => [...prev, createStep(opId)]);
    setPickerOpen(false);
  };

  const moveStep = (uid: string, dir: -1 | 1) => {
    updateSteps((prev) => {
      const i = prev.findIndex((s) => s.uid === uid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const moveStepTo = (fromUid: string, toUid: string) => {
    if (fromUid === toUid) return;
    updateSteps((prev) => {
      const from = prev.findIndex((s) => s.uid === fromUid);
      const to = prev.findIndex((s) => s.uid === toUid);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const patchStep = (uid: string, patch: (s: RecipeStep) => RecipeStep) => {
    updateSteps((prev) => prev.map((s) => (s.uid === uid ? patch(s) : s)));
  };

  const removeStep = (uid: string) => updateSteps((prev) => prev.filter((s) => s.uid !== uid));

  const toggleExpand = (uid: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  const loadExample = (index: number) => {
    const ex = exampleRecipes[index];
    setInput(ex.input);
    setSteps(stepsFromExample(index));
    setRecipeName(ex.recipe.name ?? ex.label);
    setActiveExample(index);
    setCollapsed(new Set());
  };

  const clearAll = () => {
    setInput('');
    setSteps([]);
    setRecipeName('');
    setActiveExample(-1);
  };

  // ── Saved recipes ──
  const saveRecipe = () => {
    const name = recipeName.trim();
    if (!name) { toast({ type: 'warning', message: 'Give the recipe a name before saving.' }); return; }
    if (steps.length === 0) { toast({ type: 'warning', message: 'Add at least one step before saving.' }); return; }
    const exists = saved.some((r) => r.name.trim().toLowerCase() === name.toLowerCase());
    const next = upsertSavedRecipe(saved, { name, recipe: toSerializable(steps, name), savedAt: Date.now() });
    setSaved(next);
    if (writeSaved(next)) toast({ type: 'success', message: exists ? `Updated “${name}”.` : `Saved “${name}”.` });
    else toast({ type: 'error', message: 'Could not write to browser storage.' });
  };

  const loadSaved = (entry: SavedRecipe) => {
    const parsed = parseRecipe(entry.recipe);
    if (!parsed.success) { toast({ type: 'error', message: parsed.error }); return; }
    setSteps(parsed.data.steps);
    setRecipeName(entry.name);
    setActiveExample(-1);
    setCollapsed(new Set());
    toast({ type: 'info', message: `Loaded “${entry.name}”.` });
  };

  const deleteSaved = (entry: SavedRecipe) => {
    const next = saved.filter((r) => r !== entry);
    setSaved(next);
    writeSaved(next);
    toast({ type: 'info', message: `Deleted “${entry.name}”.` });
  };

  // ── Import / export ──
  const exportRecipe = async () => {
    if (steps.length === 0) { toast({ type: 'warning', message: 'Nothing to export yet.' }); return; }
    try {
      await navigator.clipboard.writeText(serializeRecipe(steps, recipeName));
      toast({ type: 'success', message: 'Recipe JSON copied to clipboard.' });
    } catch {
      toast({ type: 'error', message: 'Clipboard access was blocked.' });
    }
  };

  const pasteIntoImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setImportText(text);
      setImportError(null);
    } catch {
      toast({ type: 'error', message: 'Clipboard access was blocked — paste manually instead.' });
    }
  };

  const confirmImport = () => {
    const parsed = parseRecipe(importText);
    if (!parsed.success) { setImportError(parsed.error); return; }
    setSteps(parsed.data.steps);
    if (parsed.data.name) setRecipeName(parsed.data.name);
    setActiveExample(-1);
    setCollapsed(new Set());
    setImportOpen(false);
    setImportText('');
    setImportError(null);
    toast({ type: 'success', message: `Imported ${parsed.data.steps.length} step${parsed.data.steps.length === 1 ? '' : 's'}.` });
  };

  // ── Output ──
  const finalOutput = run?.finalOutput ?? '';
  const failed = run && run.failedIndex >= 0 ? run.results[run.failedIndex] : null;
  const failedOp = failed ? getOperation(failed.op) : undefined;

  const downloadOutput = () => {
    try {
      const blob = new Blob([finalOutput], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(recipeName.trim() || 'recipe').replace(/[^\w.-]+/g, '-').toLowerCase()}-output.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ type: 'error', message: 'Download failed.' });
    }
  };

  return (
    <ToolLayout
      name="Recipes (Transform Pipeline)"
      description="Chain encode, decode, hash, JSON and text operations into a pipeline — every intermediate result is inspectable"
      category="Encoding"
    >
      <div className="space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <ExamplePills
            examples={exampleRecipes.map((e) => ({ label: e.label, hint: e.hint }))}
            activeIndex={activeExample}
            onSelect={loadExample}
          />
          <Button variant="ghost" size="sm" onClick={clearAll} icon={<RotateCcw className="h-4 w-4" />}>Clear</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-4 items-start">
          {/* ── Input ── */}
          <section aria-labelledby="recipe-input-heading" className="space-y-3 min-w-0">
            <div className="flex items-center justify-between h-8">
              <h2 id="recipe-input-heading" className="text-base font-medium text-text-secondary">Input</h2>
              <span className="text-xs text-text-muted font-mono">{input.length.toLocaleString()} chars</span>
            </div>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onDropText={(text) => { setInput(text); toast({ type: 'success', message: 'File loaded into input.' }); }}
              placeholder="Paste text or drop a text file here…"
              spellCheck={false}
              className="min-h-[220px] xl:min-h-[420px] font-mono text-sm"
            />
          </section>

          {/* ── Steps ── */}
          <section aria-labelledby="recipe-steps-heading" className="space-y-3 min-w-0">
            <div className="flex items-center justify-between h-8">
              <h2 id="recipe-steps-heading" className="text-base font-medium text-text-secondary">
                Recipe <span className="text-xs text-text-muted font-normal">· {steps.length} step{steps.length === 1 ? '' : 's'}</span>
              </h2>
              {running && <Loader2 className="h-4 w-4 animate-spin text-text-muted" aria-label="Running" />}
            </div>

            {steps.length === 0 && !pickerOpen && (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-text-muted">
                No steps yet. Add an operation to start transforming the input.
              </div>
            )}

            {steps.length > 0 && (
              <ol className="space-y-2" aria-label="Recipe steps">
                {steps.map((s, i) => (
                  <StepCard
                    key={s.uid}
                    step={s}
                    index={i}
                    count={steps.length}
                    result={resultsByUid.get(s.uid)}
                    expanded={!collapsed.has(s.uid)}
                    dragOver={dragOverUid === s.uid && dragUid !== s.uid}
                    onToggleExpand={() => toggleExpand(s.uid)}
                    onMove={(dir) => {
                      pendingFocus.current = { uid: s.uid, dir };
                      moveStep(s.uid, dir);
                    }}
                    onToggleEnabled={() => patchStep(s.uid, (st) => ({ ...st, enabled: !st.enabled }))}
                    onRemove={() => removeStep(s.uid)}
                    onParamChange={(key, value) => patchStep(s.uid, (st) => ({ ...st, params: { ...st.params, [key]: value } }))}
                    onDragStart={(e) => {
                      setDragUid(s.uid);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', s.uid);
                    }}
                    onDragOver={(e) => {
                      if (!dragUid) return;
                      e.preventDefault();
                      if (dragOverUid !== s.uid) setDragOverUid(s.uid);
                    }}
                    onDrop={(e) => {
                      if (!dragUid) return;
                      e.preventDefault();
                      moveStepTo(dragUid, s.uid);
                      setDragUid(null);
                      setDragOverUid(null);
                    }}
                    onDragEnd={() => { setDragUid(null); setDragOverUid(null); }}
                  />
                ))}
              </ol>
            )}

            {pickerOpen ? (
              <OperationPicker onPick={addStep} onClose={() => setPickerOpen(false)} />
            ) : (
              <Button variant="secondary" size="sm" className="w-full" onClick={() => setPickerOpen(true)} icon={<Plus className="h-4 w-4" />}>
                Add step
              </Button>
            )}

            {/* ── Save / load ── */}
            <div className="p-3 rounded-xl border border-border bg-bg-secondary space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <label htmlFor="recipe-name" className="sr-only">Recipe name</label>
                <input
                  id="recipe-name"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveRecipe(); }}
                  placeholder="Recipe name"
                  className={cn(fieldClass, 'h-9 text-sm font-sans flex-1')}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveRecipe} icon={<Save className="h-3.5 w-3.5" />}>Save</Button>
                  <Button size="sm" variant="secondary" onClick={exportRecipe} icon={<Copy className="h-3.5 w-3.5" />} title="Copy recipe JSON to clipboard">Export</Button>
                  <Button size="sm" variant="secondary" onClick={() => { setImportOpen(true); setImportError(null); }} icon={<Upload className="h-3.5 w-3.5" />}>Import</Button>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1.5">
                  <FolderOpen className="h-3 w-3" /> Saved recipes
                </p>
                {saved.length === 0 ? (
                  <p className="text-xs text-text-muted">Saved recipes live in this browser only.</p>
                ) : (
                  <ul className="space-y-1 max-h-48 overflow-y-auto">
                    {saved.map((r) => (
                      <li key={`${r.name}-${r.savedAt}`} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-bg-hover">
                        <button
                          type="button"
                          onClick={() => loadSaved(r)}
                          className="flex-1 min-w-0 text-left text-sm text-text-primary truncate rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                          title={`Load “${r.name}”`}
                        >
                          {r.name}
                          <span className="ml-2 text-[11px] text-text-muted">{r.recipe.steps.length} step{r.recipe.steps.length === 1 ? '' : 's'}</span>
                        </button>
                        <IconButton label={`Delete saved recipe ${r.name}`} onClick={() => deleteSaved(r)} className="hover:text-error">
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconButton>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* ── Output ── */}
          <section aria-labelledby="recipe-output-heading" className="space-y-3 min-w-0 lg:col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between h-8 gap-2">
              <h2 id="recipe-output-heading" className="text-base font-medium text-text-secondary">Output</h2>
              <div className="flex items-center gap-2">
                <CopyButton value={finalOutput} label="Output" disabled={!finalOutput || !!failed} />
                <Button variant="secondary" size="sm" onClick={downloadOutput} disabled={!finalOutput || !!failed} icon={<Download className="h-3.5 w-3.5" />}>
                  Download
                </Button>
              </div>
            </div>

            {failed && (
              <div role="alert" className="flex items-start gap-2 px-4 py-3 rounded-lg bg-error/10 text-error border border-error/30">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div className="text-sm min-w-0">
                  <p className="font-medium">Step {run!.failedIndex + 1} ({failedOp?.label ?? failed.op}) failed</p>
                  <p className="font-mono text-xs break-words mt-0.5">{failed.error}</p>
                </div>
              </div>
            )}

            <pre
              aria-live="polite"
              className={cn(
                'w-full p-4 rounded-xl bg-bg-tertiary border border-border text-sm font-mono text-text-primary',
                'whitespace-pre-wrap break-all overflow-auto min-h-[220px] max-h-[640px] xl:min-h-[420px]',
                failed && 'opacity-50',
              )}
            >
              {failed ? '' : finalOutput || <span className="text-text-muted italic">Output will appear here…</span>}
            </pre>
            {run && !failed && (
              <p className="text-xs text-text-muted font-mono">
                {finalOutput.length.toLocaleString()} chars · {run.results.filter((r) => r.status === 'ok').length} step(s) ran in {formatMs(run.totalMs)}
              </p>
            )}
          </section>
        </div>
      </div>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import recipe">
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">Paste recipe JSON (from Export). Unknown operations are rejected.</p>
          <Input
            value={importText}
            onChange={(e) => { setImportText(e.target.value); setImportError(null); }}
            placeholder={'{"v":1,"steps":[{"op":"trim"},{"op":"base64-encode"}]}'}
            spellCheck={false}
            className="min-h-[160px] font-mono text-xs"
            aria-label="Recipe JSON"
          />
          {importError && <p role="alert" className="text-xs text-error font-mono">{importError}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={pasteIntoImport}>Paste from clipboard</Button>
            <Button size="sm" onClick={confirmImport} disabled={!importText.trim()}>Load recipe</Button>
          </div>
        </div>
      </Modal>
    </ToolLayout>
  );
}
