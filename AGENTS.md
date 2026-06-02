<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# DevTools Pro — Agent Instructions

## Critical Constraints & Context

1. **Next.js & React Version Quirks**: Running **Next.js 16.2.6** (App Router) and **React 19.2.4**. DO NOT assume typical Next.js 13/14 or React 17/18 behaviors. Consult `node_modules/next/dist/docs/` for specific API compatibility.
2. **Tailwind CSS v4 Integration**: Styling uses Tailwind CSS v4.
   - **No `tailwind.config.*` files exist.**
   - All customizations/theme overrides must reside under the `@theme` directive inside `src/app/globals.css`.
   - Never use `@apply` in CSS; compose utility classes directly in JSX.
3. **Strict Code & Type Architecture**:
   - `import * as React from 'react'` is required (do not use `import React`).
   - Use the `@/` path alias for all internal source imports.
   - Utility/pure functions (in `src/tools/`) must **never throw** to the UI. Return a result object matching:
     `type Result = { success: true; data: unknown } | { success: false; error: string };`
   - Interactive components MUST begin with `'use client'`.
   - All shared components must use named exports: `export { Component, type ComponentProps }`.
   - Page components use `export default function Page()` (Next.js convention).

## Workflow: Adding a New Tool

1. **Pure Logic**: Create `src/tools/<tool-name>/utils.ts` (pure functions only, no React imports).
2. **Interactive UI**: Create `src/app/tools/<tool-name>/page.tsx` (`'use client'`, wires state to utils).
3. **Register**: Add the tool definition to `src/components/homepage/ToolGrid.tsx` and `src/components/layout/CommandPalette.tsx`.

## Executable Dev Commands

- **Start Dev Server**: `npm run dev`
- **Lint Code**: `npm run lint`
- **Production Build**: `npm run build`
- **Start Production**: `npm run start`

> **Note**: There is no test runner installed. DO NOT install or configure one unless explicitly requested.
