import type { TableNode } from '../types/schema.types';

export function autoLayoutNodes(nodes: TableNode[]): TableNode[] {
  const columnsCount = Math.min(3, Math.ceil(Math.sqrt(nodes.length)));
  const nodeWidth = 500;
  const nodeHeight = 350;
  const spacingX = 220; // 220px horizontal gap between tables
  const spacingY = 120; // 120px vertical gap between rows

  return nodes.map((node, idx) => {
    const col = idx % columnsCount;
    const row = Math.floor(idx / columnsCount);
    return {
      ...node,
      position: {
        x: 60 + col * (nodeWidth + spacingX),
        y: 60 + row * (nodeHeight + spacingY),
      },
    };
  });
}
