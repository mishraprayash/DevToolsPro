import * as React from 'react';
import { cn } from '@/lib/utils';
import { Plus, X, Share2, Pencil } from 'lucide-react';
import { MAX_TAB_NAME_LENGTH } from '@/lib/utils/workspaceNames';

export interface WorkspaceTabsProps {
  workspaces: { id: string; name: string }[];
  activeId: string;
  onChange: (id: string) => void;
  onAdd: () => void;
  onClose: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  onShare?: () => void;
}

export function WorkspaceTabs({ workspaces, activeId, onChange, onAdd, onClose, onRename, onShare }: WorkspaceTabsProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState('');
  // Enter commits and unmounts the input; this stops a trailing blur from committing twice
  const editDoneRef = React.useRef(false);

  const startEditing = (w: { id: string; name: string }) => {
    if (!onRename) return;
    editDoneRef.current = false;
    setDraft(w.name);
    setEditingId(w.id);
  };

  const finishEditing = (commit: boolean) => {
    if (editDoneRef.current || !editingId) return;
    editDoneRef.current = true;
    if (commit) onRename?.(editingId, draft);
    setEditingId(null);
  };

  return (
    <div className="flex items-center gap-1.5 p-1 mb-6 rounded-xl bg-bg-secondary border border-border overflow-x-auto scrollbar-hide">
      <div role="tablist" aria-label="Workspace tabs" className="flex items-center gap-1.5">
        {workspaces.map((w) => {
          const isActive = w.id === activeId;
          const isEditing = w.id === editingId;
          return (
            <div
              key={w.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
                isActive
                  ? 'bg-bg-tertiary text-text-primary border border-border shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
              )}
              onClick={() => !isEditing && onChange(w.id)}
              onKeyDown={(e) => {
                if (isEditing || e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(w.id);
                } else if (e.key === 'F2') {
                  e.preventDefault();
                  startEditing(w);
                }
              }}
            >
              {isEditing ? (
                <input
                  // Focus and select the current name once, when the editor mounts
                  ref={(el) => {
                    if (el && document.activeElement !== el) {
                      el.focus();
                      el.select();
                    }
                  }}
                  value={draft}
                  maxLength={MAX_TAB_NAME_LENGTH}
                  size={Math.max(draft.length, 6)}
                  aria-label="Tab name"
                  onChange={(e) => setDraft(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={() => finishEditing(true)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      finishEditing(true);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      finishEditing(false);
                    }
                  }}
                  className="bg-bg-primary border border-accent/60 rounded-md px-1.5 py-0 text-sm font-medium text-text-primary outline-none focus:ring-2 focus:ring-accent/30"
                />
              ) : (
                <span
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startEditing(w);
                  }}
                  title={onRename ? 'Double-click to rename' : undefined}
                >
                  {w.name}
                </span>
              )}
              {onRename && !isEditing && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(w);
                  }}
                  className={cn(
                    'p-0.5 rounded-md transition-all text-text-muted hover:text-text-primary hover:bg-bg-hover',
                    isActive ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
                  )}
                  title="Rename tab (F2)"
                  aria-label={`Rename ${w.name}`}
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
              {!isEditing && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(w.id);
                  }}
                  className={cn(
                    "p-0.5 rounded-md transition-all",
                    isActive ? "text-text-muted hover:text-text-primary hover:bg-bg-hover" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-text-muted hover:text-text-primary hover:bg-bg-hover"
                  )}
                  title="Close Tab"
                  aria-label={`Close ${w.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={onAdd}
        className="p-1.5 ml-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors shrink-0"
        title="New Tab"
        aria-label="New tab"
      >
        <Plus className="h-4 w-4" />
      </button>

      {onShare && (
        <div className="ml-auto pl-2 border-l border-border/50 shrink-0">
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            title="Share current tab state via URL"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        </div>
      )}
    </div>
  );
}
