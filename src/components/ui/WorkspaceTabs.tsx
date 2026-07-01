import * as React from 'react';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

export interface WorkspaceTabsProps {
  workspaces: { id: string; name: string }[];
  activeId: string;
  onChange: (id: string) => void;
  onAdd: () => void;
  onClose: (id: string) => void;
}

export function WorkspaceTabs({ workspaces, activeId, onChange, onAdd, onClose }: WorkspaceTabsProps) {
  return (
    <div className="flex items-center gap-1.5 p-1 mb-6 rounded-xl bg-bg-secondary border border-border overflow-x-auto scrollbar-hide">
      {workspaces.map((w) => {
        const isActive = w.id === activeId;
        return (
          <div
            key={w.id}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap group',
              isActive
                ? 'bg-bg-tertiary text-text-primary border border-border shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
            )}
            onClick={() => onChange(w.id)}
          >
            <span>{w.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(w.id);
              }}
              className={cn(
                "p-0.5 rounded-md transition-all",
                isActive ? "text-text-muted hover:text-text-primary hover:bg-bg-hover" : "opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary hover:bg-bg-hover"
              )}
              title="Close Tab"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
      <button
        onClick={onAdd}
        className="p-1.5 ml-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors shrink-0"
        title="New Tab"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
