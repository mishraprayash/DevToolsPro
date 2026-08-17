import type { Edge } from '@xyflow/react';
import type { TableNode } from '../types/schema.types';
import { resolveFkRelationship } from './sql.generator';

export function generateMermaid(nodes: TableNode[], edges: Edge[]): string {
  let m = `erDiagram\n`;

  nodes.forEach((node) => {
    const { tableName, columns } = node.data;
    m += `  ${tableName} {\n`;
    columns.forEach((col) => {
      const pk = col.isPrimary ? 'PK' : col.isUnique ? 'UK' : '';
      const typeStr = col.type.replace(/\s+/g, '_');
      m += `    ${typeStr} ${col.name} ${pk}\n`;
    });
    m += `  }\n`;
  });

  edges.forEach((edge) => {
    const rel = resolveFkRelationship(nodes, edge);
    if (rel) {
      m += `  ${rel.parentNode.data.tableName} ||--o{ ${rel.childNode.data.tableName} : "${rel.childCol.name}"\n`;
    }
  });

  return m.trim();
}
