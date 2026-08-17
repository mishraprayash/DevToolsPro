# SQL Schema Designer (ERD Studio)

## 1. Overview
The **SQL Schema Designer** is a visual Entity-Relationship Diagram (ERD) and relational schema modeling studio. It enables developers to visually design database tables, configure columns, types, indexes, and primary/foreign keys, draw visual relationships, and export production DDL scripts for **PostgreSQL**, **MySQL**, **SQLite**, and **Prisma ORM**.

---

## 2. Directory Structure
```
src/tools/sql-designer/
├── README.md           # Developer documentation
└── utils.ts            # DDL generators, schema parsers, and type definitions

src/app/tools/sql-designer/
├── TableNode.tsx       # Custom interactive table node for ReactFlow
└── page.tsx            # Main ERD canvas, toolbar, schema editor & export modal
```

---

## 3. Core Data Model (`utils.ts`)

```typescript
export interface ColumnDef {
  id: string;
  name: string;
  type: string;
  isPrimary?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
  references?: {
    tableId: string;
    columnId: string;
  };
}

export interface TableDef {
  id: string;
  name: string;
  columns: ColumnDef[];
  color?: string;
}
```

### Key Functions
| Function | Parameters | Returns | Description |
|---|---|---|---|
| `generatePostgreSql(tables)` | `TableDef[]` | `string` | Generates PostgreSQL DDL (`CREATE TABLE`, constraints, foreign keys). |
| `generateMySql(tables)` | `TableDef[]` | `string` | Generates MySQL DDL with engine specifications. |
| `generateSqlite(tables)` | `TableDef[]` | `string` | Generates SQLite compliant table definitions. |
| `generatePrismaSchema(tables)`| `TableDef[]` | `string` | Generates Prisma schema models and relation bindings. |
| `generateMermaidErd(tables)`  | `TableDef[]` | `string` | Generates Mermaid ER diagram code for Markdown documentation. |

---

## 4. UI Architecture
* **Canvas Engine**: Powered by `@xyflow/react` (React Flow) for pan/zoom, grid snapping, and draggable table nodes.
* **Relationship Connecting**: Drag handles between primary and foreign key columns create typed edges.
* **Live Export Tabs**: Instant SQL / Prisma syntax highlighting in the script viewer drawer.

---

## 5. How to Contribute / Extend
1. **Adding Dialects**: Add new dialect generators (e.g. MS SQL Server, Oracle, TypeORM) inside `src/tools/sql-designer/utils.ts`.
2. **Importing SQL**: Enhance the reverse-engineering SQL parser in `utils.ts` to convert `CREATE TABLE` scripts back into visual diagram state.
