import type { Edge } from '@xyflow/react';
import type { TableNode, ColumnDef } from '../types/schema.types';

export function parseSqlToNodes(
  sql: string,
  existingNodes: TableNode[] = []
): { nodes: TableNode[]; edges: Edge[] } {
  const nodes: TableNode[] = [];
  const edges: Edge[] = [];

  const cleanSql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const statements = cleanSql.split(';').map((s) => s.trim()).filter(Boolean);

  let edgeCounter = 1;

  statements.forEach((stmt) => {
    const createMatch = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?['"`]?(\w+)['"`]?\s*\(([\s\S]+)\)/i);
    if (createMatch) {
      const tableName = createMatch[1];
      const body = createMatch[2];

      const columns: ColumnDef[] = [];
      const parts: string[] = [];
      let currentPart = '';
      let parenLevel = 0;

      for (let i = 0; i < body.length; i++) {
        const char = body[i];
        if (char === '(') parenLevel++;
        if (char === ')') parenLevel--;

        if (char === ',' && parenLevel === 0) {
          parts.push(currentPart.trim());
          currentPart = '';
        } else {
          currentPart += char;
        }
      }
      if (currentPart.trim()) parts.push(currentPart.trim());

      const existingNode = existingNodes.find((n) => n.data.tableName === tableName);
      const usedIds = new Set<string>();

      parts.forEach((part) => {
        const fkMatch = part.match(
          /FOREIGN\s+KEY\s*\(['"`]?(\w+)['"`]?\)\s*REFERENCES\s*['"`]?(\w+)['"`]?\s*\(['"`]?(\w+)['"`]?\)/i
        );
        if (fkMatch) {
          const sourceColName = fkMatch[1];
          const targetTableName = fkMatch[2];
          const targetColName = fkMatch[3];

          edges.push({
            id: `e-inline-${edgeCounter++}`,
            source: targetTableName,
            sourceHandle: targetColName,
            target: tableName,
            targetHandle: sourceColName,
            animated: true,
            type: 'smoothstep',
            label: `FK: ${sourceColName}`,
            style: { stroke: '#818cf8', strokeWidth: 2.5 },
          });
          return;
        }

        if (/^(?:PRIMARY\s+KEY|UNIQUE|CONSTRAINT|INDEX|KEY)\b/i.test(part)) {
          return;
        }

        const tokens = part.split(/\s+/);
        if (tokens.length >= 2) {
          const name = tokens[0].replace(/['"`]/g, '');
          const type = tokens[1].toUpperCase();
          const rest = tokens.slice(2).join(' ').toUpperCase();

          const isPrimary =
            rest.includes('PRIMARY KEY') ||
            type === 'SERIAL' ||
            rest.includes('AUTOINCREMENT') ||
            rest.includes('AUTO_INCREMENT');
          const isNullable = !rest.includes('NOT NULL');
          const isUnique = rest.includes('UNIQUE');

          let defaultValue = '';
          const defaultMatch = rest.match(/DEFAULT\s+([^\s,]+)/i);
          if (defaultMatch) {
            defaultValue = defaultMatch[1];
          }

          let colId = `col-${tableName}-${name}`;
          if (existingNode) {
            const matchedCol = existingNode.data.columns.find((c) => c.name === name && !usedIds.has(c.id));
            if (matchedCol) {
              colId = matchedCol.id;
            }
          }

          while (usedIds.has(colId)) {
            colId = `col-${tableName}-${name}-${Math.random().toString(36).substring(2, 7)}`;
          }
          usedIds.add(colId);

          columns.push({
            id: colId,
            name,
            type,
            isPrimary,
            isNullable,
            isUnique,
            defaultValue,
          });
        }
      });

      const position = existingNode
        ? existingNode.position
        : {
            x: (nodes.length % 2) * 720 + 60,
            y: Math.floor(nodes.length / 2) * 450 + 60,
          };

      nodes.push({
        id: `tbl-${tableName}`,
        type: 'tableNode',
        position,
        data: {
          tableName,
          columns,
        },
      });
    }

    const alterFkMatch = stmt.match(
      /ALTER\s+TABLE\s+['"`]?(\w+)['"`]?[\s\S]*?FOREIGN\s+KEY\s*\(['"`]?(\w+)['"`]?\)\s*REFERENCES\s*['"`]?(\w+)['"`]?\s*\(['"`]?(\w+)['"`]?\)/i
    );
    if (alterFkMatch) {
      const childTable = alterFkMatch[1];
      const childCol = alterFkMatch[2];
      const parentTable = alterFkMatch[3];
      const parentCol = alterFkMatch[4];

      edges.push({
        id: `e-alter-${edgeCounter++}`,
        source: parentTable,
        sourceHandle: parentCol,
        target: childTable,
        targetHandle: childCol,
        animated: true,
        type: 'smoothstep',
        label: `FK: ${childCol}`,
        style: { stroke: '#818cf8', strokeWidth: 2.5 },
      });
    }
  });

  const resolvedEdges: Edge[] = [];
  edges.forEach((edge) => {
    const parentNode = nodes.find((n) => n.data.tableName === edge.source);
    const childNode = nodes.find((n) => n.data.tableName === edge.target);

    if (parentNode && childNode) {
      const parentCol = parentNode.data.columns.find((c) => c.name === edge.sourceHandle);
      const childCol = childNode.data.columns.find((c) => c.name === edge.targetHandle);

      if (parentCol && childCol) {
        resolvedEdges.push({
          ...edge,
          source: parentNode.id,
          sourceHandle: parentCol.id,
          target: childNode.id,
          targetHandle: childCol.id,
        });
      }
    }
  });

  return { nodes, edges: resolvedEdges };
}
