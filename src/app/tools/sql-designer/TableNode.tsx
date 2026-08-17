'use client';

import * as React from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { TableNodeData, SqlDialect, DIALECT_DATATYPES } from '@/tools/sql-designer/utils';
import { Key, Trash2, Plus, GripVertical, Fingerprint, Copy, SlidersHorizontal } from 'lucide-react';

interface TableNodeProps {
  id: string;
  data: TableNodeData & {
    dialect?: SqlDialect;
    onColumnAdd?: (nodeId: string) => void;
    onColumnDelete?: (nodeId: string, colId: string) => void;
    onColumnChange?: (nodeId: string, colId: string, field: string, value: string | boolean) => void;
    onTableNameChange?: (nodeId: string, name: string) => void;
    onDeleteNode?: (nodeId: string) => void;
    onDuplicateNode?: (nodeId: string) => void;
  };
}

export function TableNode({ id, data }: TableNodeProps) {
  const updateNodeInternals = useUpdateNodeInternals();
  const [expandedCol, setExpandedCol] = React.useState<string | null>(null);

  const activeDialect = data.dialect || 'postgresql';

  React.useEffect(() => {
    updateNodeInternals(id);
  }, [data.columns, id, updateNodeInternals]);

  return (
    <div className="bg-bg-elevated border border-border/80 rounded-xl shadow-xl w-[500px] flex flex-col font-sans relative hover:border-accent/40 transition-colors">
      {/* Header */}
      <div className="bg-bg-tertiary px-3.5 py-3 border-b border-border flex items-center justify-between group rounded-t-xl cursor-grab active:cursor-grabbing nodrag-trigger">
        <div className="flex items-center gap-2 flex-1">
          <GripVertical className="w-4 h-4 text-text-muted opacity-50 shrink-0" />
          <input
            value={data.tableName}
            onChange={(e) => data.onTableNameChange?.(id, e.target.value)}
            className="bg-transparent text-text-primary font-extrabold text-sm focus:outline-none flex-1 min-w-0 border-b border-transparent focus:border-accent/50 transition-colors font-mono"
            placeholder="table_name"
          />
        </div>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => data.onDuplicateNode?.(id)}
            className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-bg-hover transition-colors"
            title="Duplicate Table"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => data.onDeleteNode?.(id)}
            className="p-1 text-text-muted hover:text-error rounded hover:bg-bg-hover transition-colors"
            title="Delete Table"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Columns list */}
      <div className="flex flex-col py-1 divide-y divide-border/20">
        {data.columns.map((col) => (
          <div key={col.id} className="relative group flex flex-col px-3 py-1.5 hover:bg-bg-tertiary/40">
            <Handle
              type="target"
              position={Position.Left}
              id={col.id}
              className="!w-3.5 !h-3.5 !bg-indigo-500 !border-2 !border-bg-elevated !-left-[8px] hover:!scale-125 transition-transform shadow-md"
            />

            <div className="flex items-center gap-2">
              {/* Primary key toggle */}
              <button 
                onClick={() => data.onColumnChange?.(id, col.id, 'isPrimary', !col.isPrimary)}
                className={`p-1 rounded transition-colors ${col.isPrimary ? 'text-amber-400 bg-amber-400/10' : 'text-text-muted/40 hover:text-text-muted'}`}
                title="Toggle Primary Key"
              >
                <Key className="w-3.5 h-3.5" />
              </button>

              {/* Unique toggle */}
              <button 
                onClick={() => data.onColumnChange?.(id, col.id, 'isUnique', !col.isUnique)}
                className={`p-1 rounded transition-colors ${col.isUnique ? 'text-cyan-400 bg-cyan-400/10' : 'text-text-muted/30 hover:text-text-muted'}`}
                title="Toggle Unique Constraint"
              >
                <Fingerprint className="w-3.5 h-3.5" />
              </button>

              {/* Name */}
              <input
                value={col.name}
                onChange={(e) => data.onColumnChange?.(id, col.id, 'name', e.target.value)}
                className="bg-transparent text-text-primary text-xs font-mono focus:outline-none flex-1 min-w-0 border-b border-transparent focus:border-accent/30 transition-colors"
                placeholder="column_name"
              />

              {/* Dialect Datatypes Datalist */}
              <input
                list={`sql-types-${activeDialect}`}
                value={col.type}
                onChange={(e) => data.onColumnChange?.(id, col.id, 'type', e.target.value)}
                className="bg-bg-tertiary text-text-secondary text-[11px] rounded px-2 py-1 focus:outline-none w-[130px] shrink-0 uppercase font-mono border border-border/50 focus:border-accent/50"
                placeholder="TYPE"
              />

              {/* Nullable toggle */}
              <button
                onClick={() => data.onColumnChange?.(id, col.id, 'isNullable', !col.isNullable)}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shrink-0 border transition-colors ${
                  col.isNullable
                    ? 'text-text-muted bg-transparent border-transparent hover:border-border'
                    : 'text-text-primary bg-bg-tertiary border-border/80'
                }`}
                title="Toggle Nullable"
              >
                {col.isNullable ? 'NULL' : 'NOT NULL'}
              </button>

              {/* Expand Default Options */}
              <button
                onClick={() => setExpandedCol(expandedCol === col.id ? null : col.id)}
                className={`p-1 rounded transition-colors ${
                  col.defaultValue ? 'text-accent' : 'text-text-muted/40 hover:text-text-muted'
                }`}
                title="Default Value Settings"
              >
                <SlidersHorizontal className="w-3 h-3" />
              </button>

              {/* Delete column */}
              <button 
                onClick={() => data.onColumnDelete?.(id, col.id)}
                className="text-text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="Delete Column"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Extra details dropdown for Default value */}
            {expandedCol === col.id && (
              <div className="mt-1.5 pl-8 pr-2 py-1.5 bg-bg-tertiary/70 rounded-lg border border-border/40 flex items-center gap-2 text-xs font-mono">
                <span className="text-[10px] text-text-muted uppercase">Default:</span>
                <input
                  type="text"
                  value={col.defaultValue || ''}
                  onChange={(e) => data.onColumnChange?.(id, col.id, 'defaultValue', e.target.value)}
                  placeholder="e.g. CURRENT_TIMESTAMP or 'active'"
                  className="flex-1 bg-bg-secondary border border-border/60 rounded px-2 py-0.5 text-[11px] text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            )}

            <Handle
              type="source"
              position={Position.Right}
              id={col.id}
              className="!w-3.5 !h-3.5 !bg-cyan-400 !border-2 !border-bg-elevated !-right-[8px] hover:!scale-125 transition-transform shadow-md"
            />
          </div>
        ))}
      </div>

      {/* Add column */}
      <div 
        className="px-3.5 py-2 border-t border-border/50 bg-bg-tertiary/40 hover:bg-bg-tertiary cursor-pointer flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors rounded-b-xl font-semibold"
        onClick={() => data.onColumnAdd?.(id)}
      >
        <Plus className="w-3.5 h-3.5 text-accent" /> Add Column
      </div>

      {/* Dialect specific datalist */}
      <datalist id={`sql-types-${activeDialect}`}>
        {(DIALECT_DATATYPES[activeDialect] || DIALECT_DATATYPES.postgresql).flatMap((group) =>
          group.types.map((t) => <option key={t} value={t} label={`${t} (${group.category})`} />)
        )}
      </datalist>
    </div>
  );
}
