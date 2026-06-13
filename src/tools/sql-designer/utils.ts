import { Node, Edge } from '@xyflow/react';

export interface ColumnDef {
  id: string;
  name: string;
  type: string;
  isPrimary: boolean;
  isNullable: boolean;
}

export interface TableNodeData extends Record<string, unknown> {
  tableName: string;
  columns: ColumnDef[];
}

export type TableNode = Node<TableNodeData>;

export type Result<T> = { success: true; data: T } | { success: false; error: string };

export type SqlDialect = 'postgresql' | 'mysql' | 'sqlite';

export function generateSql(nodes: TableNode[], edges: Edge[], dialect: SqlDialect = 'postgresql'): Result<string> {
  try {
    let sql = '';
    const q = dialect === 'mysql' ? '\`' : '"';

    nodes.forEach((node) => {
      const { tableName, columns } = node.data;
      if (!tableName) return;

      sql += `CREATE TABLE ${q}${tableName}${q} (\n`;
      
      const colStrings = columns.map((col) => {
        let colStr = `  ${q}${col.name || 'untitled'}${q} ${col.type || 'VARCHAR(255)'}`;
        
        if (col.isPrimary) {
          if (dialect === 'sqlite' && col.type.toUpperCase() === 'SERIAL') {
            // SQLite uses INTEGER PRIMARY KEY AUTOINCREMENT
            colStr = `  ${q}${col.name || 'untitled'}${q} INTEGER PRIMARY KEY AUTOINCREMENT`;
          } else if (dialect === 'mysql' && col.type.toUpperCase() === 'SERIAL') {
            colStr = `  ${q}${col.name || 'untitled'}${q} BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`;
          } else {
            colStr += ' PRIMARY KEY';
          }
        }

        if (!col.isNullable && !col.isPrimary) colStr += ' NOT NULL';
        return colStr;
      });

      sql += colStrings.join(',\n');
      sql += '\n);\n\n';
    });

    if (edges.length > 0 && dialect !== 'sqlite') {
      let fkSql = '';
      edges.forEach((edge) => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        if (!sourceNode || !targetNode) return;
        
        const sourceCol = sourceNode.data.columns.find(c => c.id === edge.sourceHandle);
        const targetCol = targetNode.data.columns.find(c => c.id === edge.targetHandle);
        
        if (!sourceCol || !targetCol) return;

        const fkName = `fk_${targetNode.data.tableName}_${targetCol.name}`;

        fkSql += `ALTER TABLE ${q}${targetNode.data.tableName}${q}\n`;
        fkSql += `  ADD CONSTRAINT ${q}${fkName}${q}\n`;
        fkSql += `  FOREIGN KEY (${q}${targetCol.name}${q})\n`;
        fkSql += `  REFERENCES ${q}${sourceNode.data.tableName}${q} (${q}${sourceCol.name}${q});\n\n`;
      });
      
      if (fkSql) {
        sql += '-- Foreign Keys\n' + fkSql;
      }
    }

    return { success: true, data: sql.trim() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export const initialNodes: TableNode[] = [
  {
    id: 'users',
    type: 'tableNode',
    position: { x: 50, y: 50 },
    data: {
      tableName: 'users',
      columns: [
        { id: 'u1', name: 'id', type: 'SERIAL', isPrimary: true, isNullable: false },
        { id: 'u2', name: 'email', type: 'VARCHAR(255)', isPrimary: false, isNullable: false },
        { id: 'u3', name: 'created_at', type: 'TIMESTAMP', isPrimary: false, isNullable: false },
      ]
    }
  },
  {
    id: 'posts',
    type: 'tableNode',
    position: { x: 450, y: 50 },
    data: {
      tableName: 'posts',
      columns: [
        { id: 'p1', name: 'id', type: 'SERIAL', isPrimary: true, isNullable: false },
        { id: 'p2', name: 'title', type: 'VARCHAR(255)', isPrimary: false, isNullable: false },
        { id: 'p3', name: 'user_id', type: 'INT', isPrimary: false, isNullable: false },
      ]
    }
  }
];

export const initialEdges: Edge[] = [
  {
    id: 'e-users-posts',
    source: 'users',
    sourceHandle: 'u1',
    target: 'posts',
    targetHandle: 'p3',
    animated: true,
    style: { stroke: '#818cf8', strokeWidth: 2 }
  }
];

// --- Parsing Logic (SQL to Nodes) ---

export function parseSqlToNodes(sql: string, existingNodes: TableNode[] = []): { nodes: TableNode[], edges: Edge[] } {
  const nodes: TableNode[] = [];
  const edges: Edge[] = [];
  
  // Strip comments
  let cleanSql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Split by statements roughly
  const statements = cleanSql.split(';').map(s => s.trim()).filter(Boolean);

  let edgeCounter = 1;

  statements.forEach((stmt) => {
    // Check for CREATE TABLE
    const createMatch = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?['"\`]?(\w+)['"\`]?\s*\(([\s\S]+)\)/i);
    if (createMatch) {
      const tableName = createMatch[1];
      const body = createMatch[2];
      
      const columns: ColumnDef[] = [];
      
      // We need a smart split by comma that ignores commas in parentheses
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

      // Preserve existing position if table exists
      const existingNode = existingNodes.find(n => n.data.tableName === tableName);
      const usedIds = new Set<string>();

      parts.forEach((part) => {
        // Table constraints
        const fkMatch = part.match(/FOREIGN\s+KEY\s*\(['"`]?(\w+)['"`]?\)\s*REFERENCES\s*['"`]?(\w+)['"`]?\s*\(['"`]?(\w+)['"`]?\)/i);
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
            style: { stroke: '#818cf8', strokeWidth: 2 }
          });
          return;
        }

        if (/^(?:PRIMARY\s+KEY|UNIQUE|CONSTRAINT|INDEX|KEY)\b/i.test(part)) {
           return;
        }

        // Column definition
        const tokens = part.split(/\s+/);
        if (tokens.length >= 2) {
          const name = tokens[0].replace(/['"`]/g, '');
          const type = tokens[1].toUpperCase();
          const rest = tokens.slice(2).join(' ').toUpperCase();
          
          const isPrimary = rest.includes('PRIMARY KEY') || type === 'SERIAL' || rest.includes('AUTOINCREMENT') || rest.includes('AUTO_INCREMENT');
          const isNullable = !rest.includes('NOT NULL');
          
          let colId = `col-${tableName}-${name}`; // force-cache-bust-1
          if (existingNode) {
            const matchedCol = existingNode.data.columns.find(c => c.name === name && !usedIds.has(c.id));
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
            isNullable
          });
        }
      });
      const position = existingNode ? existingNode.position : { 
        x: Math.random() * 400 + 50, 
        y: Math.random() * 400 + 50 
      };

      nodes.push({
        id: `tbl-${tableName}`,
        type: 'tableNode',
        position,
        data: {
          tableName,
          columns
        }
      });
    }

    // Check for ALTER TABLE ADD CONSTRAINT FOREIGN KEY
    const alterFkMatch = stmt.match(/ALTER\s+TABLE\s+['"\`]?(\w+)['"\`]?[\s\S]*?FOREIGN\s+KEY\s*\(['"\`]?(\w+)['"\`]?\)\s*REFERENCES\s*['"\`]?(\w+)['"\`]?\s*\(['"\`]?(\w+)['"\`]?\)/i);
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
        style: { stroke: '#818cf8', strokeWidth: 2 }
      });
    }
  });

  // Second pass: map edges table/col names to actual node/handle IDs
  const resolvedEdges: Edge[] = [];
  edges.forEach(edge => {
    // edge.source is currently parentTableName
    // edge.target is currently childTableName
    const parentNode = nodes.find(n => n.data.tableName === edge.source);
    const childNode = nodes.find(n => n.data.tableName === edge.target);

    if (parentNode && childNode) {
      const parentCol = parentNode.data.columns.find(c => c.name === edge.sourceHandle);
      const childCol = childNode.data.columns.find(c => c.name === edge.targetHandle);

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
