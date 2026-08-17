# Design Implementation Plan: Standardize Mobile Search Trigger in Header

## 1. Overview & Goal
Standardize the header search trigger contract in `src/components/layout/Header.tsx` so that mobile users (`< sm` viewports) can easily launch the Command Palette search directly from the fixed top navigation bar, eliminating the current responsive visibility mismatch between the header and the main tool grid search controls.

## 2. Target File
- `src/components/layout/Header.tsx`

## 3. Strict Project Rules & Constraints
1. **React 19 & Next.js 16 Compatibility**:
   - Component must retain `'use client';` at line 1.
   - Import syntax must use `import * as React from 'react'`.
2. **Tailwind CSS v4 Integration**:
   - Compose utility classes directly in JSX.
   - Do not use `@apply` or standard `tailwind.config.*` overrides.
3. **API Contracts**:
   - Trigger `setCommandPaletteOpen(true)` from `useAppStore()`.

## 4. Implementation Steps

1. **Update `src/components/layout/Header.tsx`**:
   - Modify the search button container in `Header.tsx` to render a responsive mobile search trigger button (`flex sm:hidden`) alongside the desktop search bar button (`hidden sm:flex`).
   - Mobile search button:
     ```tsx
     <button
       onClick={() => setCommandPaletteOpen(true)}
       className="flex sm:hidden items-center justify-center h-8 w-8 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-all"
       aria-label="Search tools"
       title="Search tools (⌘K)"
     >
       <Search className="h-4 w-4" />
     </button>
     ```
   - Keep the desktop search button intact for `>= sm` screens:
     ```tsx
     <button
       onClick={() => setCommandPaletteOpen(true)}
       className="hidden sm:flex items-center gap-2 h-8 px-3 text-xs text-text-muted bg-bg-tertiary border border-border rounded-lg hover:border-border-hover hover:text-text-primary transition-all duration-200"
       aria-label="Search tools"
     >
       <Search className="h-3.5 w-3.5" />
       <span>Search tools...</span>
       <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] bg-bg-hover rounded border border-border font-mono">
         <Command className="h-2.5 w-2.5" />K
       </kbd>
     </button>
     ```

## 5. Verification Steps
1. Run `npm run lint` and ensure 0 errors.
2. Run `npm run build` and ensure production build completes with 0 errors across all routes.
