'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ClipboardPaste, CornerDownLeft, Sparkles, Wand2, X } from 'lucide-react';
import { detectInput, type Detection } from '@/lib/utils/detectInput';
import { sendToTool } from '@/lib/utils/toolHandoff';
import { toolsMap } from '@/tools/registry';
import { useAppStore } from '@/lib/store/useStore';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

const DEBOUNCE_MS = 150;

const SAMPLES: { label: string; value: string }[] = [
  { label: 'JWT', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' },
  { label: 'Cron', value: '*/15 9-17 * * MON-FRI' },
  { label: 'Timestamp', value: '1700000000' },
  { label: 'Color', value: 'hsl(210, 80%, 55%)' },
  { label: 'CIDR', value: '10.0.0.0/22' },
];

/** Hand a detection off to its tool and navigate there. Shared with the command palette. */
function openDetection(detection: Detection, router: ReturnType<typeof useRouter>, addRecentTool?: (id: string) => void) {
  const tool = toolsMap.get(detection.toolId);
  const tabName = `Pasted ${detection.label}`;
  if (!sendToTool(detection.toolId, detection.payload, tabName)) {
    toast({ type: 'warning', message: `Couldn't pre-fill ${tool?.name ?? 'the tool'} — opening it empty.` });
  }
  addRecentTool?.(detection.toolId);
  router.push(`/tools/${detection.toolId}`);
}

function SmartPaste() {
  const router = useRouter();
  const addRecentTool = useAppStore((s) => s.addRecentTool);
  const [value, setValue] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const inputId = React.useId();
  const hintId = React.useId();

  React.useEffect(() => {
    if (value === debounced) return;
    const t = setTimeout(() => setDebounced(value), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value, debounced]);

  const detections = React.useMemo(() => detectInput(debounced), [debounced]);
  const hasInput = debounced.trim().length > 0;

  const setNow = (text: string) => {
    setValue(text);
    setDebounced(text);
  };

  const open = (d: Detection) => openDetection(d, router, addRecentTool);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      // Evaluate synchronously so Enter right after a paste doesn't use stale results.
      const fresh = detectInput(value);
      if (fresh.length > 0) {
        e.preventDefault();
        open(fresh[0]);
      }
    } else if (e.key === 'Escape' && value) {
      e.preventDefault();
      setNow('');
    }
  };

  const pasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard?.readText) throw new Error('unsupported');
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast({ type: 'info', message: 'Your clipboard is empty.' });
        return;
      }
      setNow(text);
      textareaRef.current?.focus();
    } catch {
      toast({ type: 'error', message: 'Clipboard access was blocked — paste with ⌘V / Ctrl+V instead.' });
      textareaRef.current?.focus();
    }
  };

  const [primary, ...rest] = detections;
  const primaryTool = primary ? toolsMap.get(primary.toolId) : undefined;

  return (
    <section aria-labelledby={`${inputId}-title`} className="relative -mt-6 pb-8 sm:pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border border-border bg-bg-secondary/90 backdrop-blur-xl shadow-xl card-highlight overflow-hidden">
          <div className="px-4 sm:px-5 pt-4 flex items-center justify-between gap-3">
            <label htmlFor={inputId} id={`${inputId}-title`} className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Wand2 className="h-4 w-4 text-accent" aria-hidden />
              Paste anything
            </label>
            <div className="flex items-center gap-1.5">
              {value && (
                <button
                  type="button"
                  onClick={() => { setNow(''); textareaRef.current?.focus(); }}
                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
                  aria-label="Clear input"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
              <button
                type="button"
                onClick={pasteFromClipboard}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-bg-tertiary border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors cursor-pointer"
              >
                <ClipboardPaste className="h-3.5 w-3.5 text-accent" aria-hidden />
                <span className="hidden sm:inline">Paste from clipboard</span>
                <span className="sm:hidden">Paste</span>
              </button>
            </div>
          </div>

          <div className="px-4 sm:px-5 pt-3">
            <textarea
              ref={textareaRef}
              id={inputId}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-describedby={hintId}
              rows={3}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              placeholder="Paste a JWT, JSON, cron, timestamp, cURL, color, IP… we'll pick the tool"
              className="w-full min-h-[84px] max-h-60 resize-y rounded-xl bg-bg-primary border border-border px-3.5 py-3 font-mono text-[13px] leading-relaxed text-text-primary placeholder:text-text-muted placeholder:font-sans focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-colors"
            />
            <p id={hintId} className="mt-1.5 text-[11px] text-text-muted flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-accent shrink-0" aria-hidden />
              Detected locally in your browser. Press
              <kbd className="px-1 py-0.5 bg-bg-tertiary rounded text-[10px] inline-flex items-center"><CornerDownLeft className="h-2.5 w-2.5" /></kbd>
              to open the top match, Shift+Enter for a new line.
            </p>
          </div>

          <div className="px-4 sm:px-5 pt-3 pb-4" aria-live="polite" aria-atomic="false">
            <AnimatePresence mode="wait" initial={false}>
              {!hasInput ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-wrap items-center gap-1.5"
                >
                  <span className="text-xs text-text-muted mr-1">Try:</span>
                  {SAMPLES.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => { setNow(s.value); textareaRef.current?.focus(); }}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-bg-tertiary border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors cursor-pointer"
                    >
                      {s.label}
                    </button>
                  ))}
                </motion.div>
              ) : detections.length === 0 ? (
                <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-text-muted py-1">
                  No matching tool found for this input. Try the{' '}
                  <button
                    type="button"
                    onClick={() => useAppStore.getState().setCommandPaletteOpen(true)}
                    className="text-accent font-medium hover:underline cursor-pointer"
                  >
                    command palette
                  </button>{' '}
                  to search all tools.
                </motion.p>
              ) : (
                <motion.div key="results" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <p className="sr-only">
                    {detections.length} suggestion{detections.length === 1 ? '' : 's'}. Best match: {primaryTool?.name ?? primary.toolId}.
                  </p>
                  <ul className="space-y-2" aria-label="Suggested tools">
                    {primary && primaryTool && (
                      <li>
                        <button
                          type="button"
                          onClick={() => open(primary)}
                          className="group w-full flex items-center gap-3 p-3 rounded-xl border border-accent/40 bg-accent/[0.06] hover:bg-accent/10 hover:border-accent/60 text-left transition-colors cursor-pointer"
                        >
                          <ToolIcon toolId={primary.toolId} size="lg" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-text-primary">{primaryTool.name}</span>
                              <span className="text-[10px] font-bold uppercase tracking-wide text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded-full">
                                {primary.label}
                              </span>
                            </div>
                            <p className="text-xs text-text-secondary truncate mt-0.5">{primary.reason}</p>
                          </div>
                          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-accent">
                            Open
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                          <ArrowRight className="sm:hidden h-4 w-4 text-accent shrink-0" aria-hidden />
                        </button>
                      </li>
                    )}
                    {rest.length > 0 && (
                      <li>
                        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2" aria-label="Other suggestions">
                          {rest.map((d) => {
                            const tool = toolsMap.get(d.toolId);
                            if (!tool) return null;
                            return (
                              <li key={d.toolId}>
                                <button
                                  type="button"
                                  onClick={() => open(d)}
                                  title={d.reason}
                                  className="w-full h-full flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-bg-tertiary/50 hover:bg-bg-hover hover:border-border-hover text-left transition-colors cursor-pointer"
                                >
                                  <ToolIcon toolId={d.toolId} size="sm" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-text-primary truncate">{tool.name}</p>
                                    <p className="text-[11px] text-text-muted truncate">{d.reason}</p>
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    )}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ToolIconProps {
  toolId: string;
  size?: 'sm' | 'lg';
}

function ToolIcon({ toolId, size = 'sm' }: ToolIconProps) {
  const tool = toolsMap.get(toolId);
  if (!tool) return null;
  const Icon = tool.icon;
  return (
    <div className={cn('rounded-lg bg-gradient-to-br shrink-0', tool.color, size === 'lg' ? 'p-2.5' : 'p-1.5')} aria-hidden>
      <Icon className={cn('text-white', size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5')} />
    </div>
  );
}

export { SmartPaste, ToolIcon, openDetection, type ToolIconProps };
