import type { Node, Edge } from '@xyflow/react';

export interface ColumnDef {
  id: string;
  name: string;
  type: string;
  isPrimary: boolean;
  isNullable: boolean;
  isUnique?: boolean;
  defaultValue?: string;
}

export interface TableNodeData extends Record<string, unknown> {
  tableName: string;
  columns: ColumnDef[];
}

export type TableNode = Node<TableNodeData>;

export type Result<T> = { success: true; data: T } | { success: false; error: string };

export type SqlDialect = 'postgresql' | 'mysql' | 'sqlite';
export type ExportFormat = 'sql' | 'prisma' | 'typescript' | 'mermaid';

export interface FkRelationship {
  parentNode: TableNode;
  parentCol: ColumnDef;
  childNode: TableNode;
  childCol: ColumnDef;
}

export interface PresetTemplate {
  nodes: TableNode[];
  edges: Edge[];
}
