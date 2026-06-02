'use client';

import * as React from 'react';
import { History, X, Trash2, ArrowRight } from 'lucide-react';
import { useAppStore, type HistoryItem } from '@/lib/store/useStore';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface HistoryDrawerProps {
  toolId: string;
  onRestore: (item: HistoryItem) => void;
}

export function HistoryDrawer({ toolId, onRestore }: HistoryDrawerProps) {
  const [open, setOpen] = React.useState(false);
  const { history, clearHistory } = useAppStore();
  const items = React.useMemo(() => history[toolId] || [], [history, toolId]);

  const handleClear = () => {
    clearHistory(toolId);
    toast({ type: 'success', message: 'History cleared successfully.' });
  };

  const handleRestoreClick = (item: HistoryItem) => {
    onRestore(item);
    setOpen(false);
    toast({ type: 'success', message: 'Restored action from history!' });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-bg-secondary hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        title="View tool execution history"
      >
        <History className="h-3.5 w-3.5" />
        <span>History ({items.length})</span>
      </button>

      {/* Drawer Overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-80 md:w-96 bg-bg-secondary border-l border-border z-50 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-accent" />
            <h3 className="font-semibold font-outfit text-sm text-text-primary">Execution History</h3>
          </div>
          <button 
            onClick={() => setOpen(false)}
            className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-text-muted text-xs italic gap-1">
              <History className="h-8 w-8 opacity-25 mb-1" />
              <span>No history items recorded yet.</span>
            </div>
          ) : (
            items.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleRestoreClick(item)}
                className="p-3 rounded-lg border border-border bg-bg-tertiary hover:border-accent/40 cursor-pointer group transition-all duration-150"
              >
                <div className="flex justify-between items-center text-[10px] text-text-muted mb-1.5 font-mono">
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  {item.metadata?.action && (
                    <span className="bg-bg-hover border border-border px-1.5 py-0.5 rounded uppercase font-bold text-[9px] text-accent">
                      {item.metadata.action}
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-text-secondary line-clamp-2 font-mono bg-bg-secondary p-1.5 rounded border border-border/40">
                  {item.input}
                </p>

                <div className="mt-2 flex items-center justify-between text-[10px] text-accent font-medium opacity-0 group-hover:opacity-100 transition-all duration-150">
                  <span>Restore configuration</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-border bg-bg-tertiary">
            <Button
              onClick={handleClear}
              variant="ghost"
              size="sm"
              className="w-full text-error hover:bg-error/5"
              icon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Clear Tool History
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
