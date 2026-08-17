import type { TableNode } from '../types/schema.types';

export function generateTypeScript(nodes: TableNode[]): string {
  let ts = `// Generated TypeScript Interfaces\n\n`;

  const mapTsType = (type: string): string => {
    const t = type.toUpperCase();
    if (t.includes('INT') || t.includes('DECIMAL') || t.includes('FLOAT') || t.includes('DOUBLE') || t === 'SERIAL') return 'number';
    if (t.includes('VARCHAR') || t.includes('TEXT') || t.includes('CHAR') || t.includes('UUID')) return 'string';
    if (t.includes('BOOL')) return 'boolean';
    if (t.includes('TIME') || t.includes('DATE')) return 'Date | string';
    if (t.includes('JSON')) return 'Record<string, unknown>';
    return 'string';
  };

  nodes.forEach((node) => {
    const { tableName, columns } = node.data;
    const interfaceName = tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase());

    ts += `export interface ${interfaceName} {\n`;
    columns.forEach((col) => {
      const optional = col.isNullable ? '?' : '';
      ts += `  ${col.name}${optional}: ${mapTsType(col.type)};\n`;
    });
    ts += `}\n\n`;
  });

  return ts.trim();
}
