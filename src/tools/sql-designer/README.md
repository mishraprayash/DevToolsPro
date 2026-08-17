# SQL Schema Designer (ERD Studio)

## 1. Overview
The **SQL Schema Designer** is a visual Entity-Relationship Diagram (ERD) and relational schema modeling studio. It enables developers to visually design database tables, configure columns, types, indexes, and primary/foreign keys, draw visual relationships, and export production DDL scripts for **PostgreSQL**, **MySQL**, **SQLite**, and **Prisma ORM**.

---

## 2. Modular Architecture & Directory Structure
Following Single Responsibility Architecture, the engine is organized into dedicated domain modules:

```
src/tools/sql-designer/
├── types/
│   └── schema.types.ts       # Core domain types (ColumnDef, TableNode, SqlDialect, etc.)
├── constants/
│   └── datatypes.ts          # Dialect-specific SQL data type categories
├── generators/
│   ├── sql.generator.ts      # SQL DDL & Foreign Key generation (Postgres, MySQL, SQLite)
│   ├── prisma.generator.ts   # Prisma schema model generator
│   ├── typescript.generator.ts # TypeScript interfaces generator
│   └── mermaid.generator.ts  # Mermaid ERD diagram generator
├── parsers/
│   └── sql.parser.ts         # Reverse-engineering parser (SQL DDL -> Diagram nodes)
├── layout/
│   └── auto-layout.ts        # Auto-layout matrix grid engine
├── presets/
│   └── presets.ts            # E-commerce, SaaS Auth, and starter schema presets
├── index.ts                  # Barrel export of all domain modules
├── utils.ts                  # Backwards-compatible barrel export
└── README.md                 # Developer documentation
```

---

## 3. Core Domain Models (`types/schema.types.ts`)

```typescript
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
export type SqlDialect = 'postgresql' | 'mysql' | 'sqlite';
export type ExportFormat = 'sql' | 'prisma' | 'typescript' | 'mermaid';
```

---

## 4. Domain Generators & Functions

| Module | Function | Returns | Description |
|---|---|---|---|
| `generators/sql.generator.ts` | `generateSql(nodes, edges, dialect)` | `Result<string>` | Generates dialect-specific DDL and foreign key alter statements. |
| `generators/prisma.generator.ts` | `generatePrisma(nodes, edges)` | `string` | Generates schema-valid Prisma models and `@relation` bindings. |
| `generators/typescript.generator.ts` | `generateTypeScript(nodes)` | `string` | Generates TypeScript interfaces from database table schemas. |
| `generators/mermaid.generator.ts` | `generateMermaid(nodes, edges)` | `string` | Generates Mermaid ER diagram code for Markdown documentation. |
| `parsers/sql.parser.ts` | `parseSqlToNodes(sql, existingNodes)` | `{ nodes, edges }` | Parses standard SQL DDL into visual nodes and foreign key edges. |
| `layout/auto-layout.ts` | `autoLayoutNodes(nodes)` | `TableNode[]` | Arranges nodes in a non-overlapping grid layout. |

---

## 5. UI Architecture (`src/app/tools/sql-designer/`)
* **Canvas Engine**: Powered by `@xyflow/react` (React Flow) for pan/zoom, grid snapping, and draggable table nodes (`TableNode.tsx`).
* **Relationship Connecting**: Drag handles between primary and foreign key columns create typed edges.
* **Live Export Tabs**: Instant SQL / Prisma syntax highlighting in the script viewer drawer.

---

## 6. How to Contribute / Extend
1. **Adding Dialects**: Create dialect logic in `generators/` and register datatypes in `constants/datatypes.ts`.
2. **Improving SQL Parser**: Extend `parsers/sql.parser.ts` to support additional constraint syntax (e.g. `CHECK`, composite keys).
