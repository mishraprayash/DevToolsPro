'use client';

import * as React from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import { TableNodeData } from '@/tools/sql-designer/utils';
import { Key, Trash2, Plus, GripVertical } from 'lucide-react';

interface TableNodeProps {
  id: string;
  data: TableNodeData & {
    onColumnAdd?: (nodeId: string) => void;
    onColumnDelete?: (nodeId: string, colId: string) => void;
    onColumnChange?: (nodeId: string, colId: string, field: string, value: any) => void;
    onTableNameChange?: (nodeId: string, name: string) => void;
    onDeleteNode?: (nodeId: string) => void;
  };
}

export function TableNode({ id, data }: TableNodeProps) {
  const updateNodeInternals = useUpdateNodeInternals();

  // Force handles to re-register when columns change
  React.useEffect(() => {
    updateNodeInternals(id);
  }, [data.columns, id, updateNodeInternals]);

  return (
    <div className="bg-bg-elevated border border-border rounded-xl shadow-lg w-[450px] flex flex-col font-sans relative">
      <div className="bg-bg-tertiary px-3 py-3 border-b border-border flex items-center justify-between group rounded-t-xl cursor-grab active:cursor-grabbing nodrag-trigger">
        <div className="flex items-center gap-2 flex-1">
          <GripVertical className="w-4 h-4 text-text-muted opacity-50 shrink-0" />
          <input
            value={data.tableName}
            onChange={(e) => data.onTableNameChange?.(id, e.target.value)}
            className="bg-transparent text-text-primary font-bold text-sm focus:outline-none flex-1 min-w-0 border-b border-transparent focus:border-accent/50 transition-colors"
            placeholder="table_name"
          />
        </div>
        <button 
          onClick={() => data.onDeleteNode?.(id)}
          className="text-text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete Table"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col py-1">
        {data.columns.map((col) => (
          <div key={col.id} className="relative group flex items-center gap-2 px-3 py-1.5 hover:bg-bg-hover">
            <Handle
              type="target"
              position={Position.Left}
              id={col.id}
              className="w-3 h-3 bg-indigo-400 border-2 border-bg-elevated -ml-[21px]"
            />

            <div className="flex-1 flex items-center gap-2">
              <button 
                onClick={() => data.onColumnChange?.(id, col.id, 'isPrimary', !col.isPrimary)}
                className={`${col.isPrimary ? 'text-amber-400' : 'text-text-muted/30 hover:text-text-muted'}`}
                title="Toggle Primary Key"
              >
                <Key className="w-3.5 h-3.5" />
              </button>
              
              <input
                value={col.name}
                onChange={(e) => data.onColumnChange?.(id, col.id, 'name', e.target.value)}
                className="bg-transparent text-text-primary text-xs focus:outline-none flex-1 min-w-0 border-b border-transparent focus:border-accent/30 transition-colors"
                placeholder="column_name"
              />
              
              <input
                list="sql-types"
                value={col.type}
                onChange={(e) => data.onColumnChange?.(id, col.id, 'type', e.target.value)}
                className="bg-bg-tertiary text-text-secondary text-[11px] rounded px-2 py-1 focus:outline-none w-[130px] shrink-0 uppercase font-mono border border-transparent focus:border-accent/30"
                placeholder="TYPE"
              />

              <button
                onClick={() => data.onColumnChange?.(id, col.id, 'isNullable', !col.isNullable)}
                className={`text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap shrink-0 min-w-[70px] text-center ${col.isNullable ? 'text-text-muted bg-transparent' : 'text-text-primary bg-bg-tertiary border border-border'}`}
                title="Toggle Nullable"
              >
                {col.isNullable ? 'NULL' : 'NOT NULL'}
              </button>
            </div>

            <button 
              onClick={() => data.onColumnDelete?.(id, col.id)}
              className="text-text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity ml-1"
            >
              <Trash2 className="w-3 h-3" />
            </button>

            <Handle
              type="source"
              position={Position.Right}
              id={col.id}
              className="w-3 h-3 bg-cyan-400 border-2 border-bg-elevated -mr-[21px]"
            />
          </div>
        ))}
      </div>

      <div 
        className="px-3 py-2 border-t border-border/50 bg-bg-tertiary/50 hover:bg-bg-tertiary cursor-pointer flex items-center justify-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors rounded-b-xl"
        onClick={() => data.onColumnAdd?.(id)}
      >
        <Plus className="w-3.5 h-3.5" /> Add Column
      </div>

      <datalist id="sql-types">
        <option value="INT" />
        <option value="SERIAL" />
        <option value="BIGINT" />
        <option value="VARCHAR(255)" />
        <option value="TEXT" />
        <option value="BOOLEAN" />
        <option value="TIMESTAMP" />
        <option value="UUID" />
        <option value="JSONB" />
        <option value="DECIMAL(10,2)" />
      </datalist>
    </div>
  );
}
