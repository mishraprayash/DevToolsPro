import type { Edge } from '@xyflow/react';
import type { TableNode } from '../types/schema.types';
import { resolveFkRelationship } from './sql.generator';

export function generatePrisma(nodes: TableNode[], edges: Edge[]): string {
  let prisma = `// Generated Prisma Schema\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\n`;

  const mapPrismaType = (type: string): string => {
    const t = type.toUpperCase();
    if (t.includes('INT') || t === 'SERIAL') return 'Int';
    if (t.includes('BIGINT')) return 'BigInt';
    if (t.includes('VARCHAR') || t.includes('TEXT') || t.includes('CHAR')) return 'String';
    if (t.includes('BOOL')) return 'Boolean';
    if (t.includes('TIME') || t.includes('DATE')) return 'DateTime';
    if (t.includes('UUID')) return 'String';
    if (t.includes('DECIMAL') || t.includes('FLOAT') || t.includes('DOUBLE')) return 'Float';
    if (t.includes('JSON')) return 'Json';
    return 'String';
  };

  nodes.forEach((node) => {
    const { tableName, columns } = node.data;
    const modelName = tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase());

    prisma += `model ${modelName} {\n`;

    columns.forEach((col) => {
      let pType = mapPrismaType(col.type);
      if (col.isNullable && !col.isPrimary) pType += '?';

      const attributes: string[] = [];
      if (col.isPrimary) {
        attributes.push('@id');
        if (col.type.toUpperCase().includes('SERIAL') || col.type.toUpperCase().includes('INT')) {
          attributes.push('@default(autoincrement())');
        } else if (col.type.toUpperCase().includes('UUID')) {
          attributes.push('@default(uuid())');
        }
      }

      if (col.isUnique && !col.isPrimary) {
        attributes.push('@unique');
      }

      if (col.defaultValue && col.defaultValue.trim() && !attributes.some((a) => a.startsWith('@default'))) {
        attributes.push(`@default(${col.defaultValue.trim()})`);
      }

      prisma += `  ${col.name.padEnd(16)} ${pType.padEnd(12)} ${attributes.join(' ')}\n`;
    });

    // Relations
    edges.forEach((edge) => {
      const rel = resolveFkRelationship(nodes, edge);
      if (rel && rel.childNode.id === node.id) {
        const parentModel = rel.parentNode.data.tableName.charAt(0).toUpperCase() + rel.parentNode.data.tableName.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        const relationField = rel.parentNode.data.tableName.toLowerCase();
        prisma += `  ${relationField.padEnd(16)} ${parentModel.padEnd(12)} @relation(fields: [${rel.childCol.name}], references: [${rel.parentCol.name}])\n`;
      }
    });

    prisma += `}\n\n`;
  });

  return prisma.trim();
}
