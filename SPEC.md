# DevTools Pro - Developer Utilities Platform

## Project Overview

**Project Name:** DevTools Pro  
**Type:** Web Application (Next.js App Router)  
**Core Functionality:** A premium, production-grade developer utilities platform featuring 16 interactive tools for encoding, decoding, formatting, hashing, and testing.  
**Target Users:** Backend engineers, frontend developers, DevOps engineers, security engineers, and computer science students.

---

## Technical Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS v4 (no `tailwind.config.*`; all tokens in `globals.css` via `@theme`)
- **Animations:** Framer Motion ^12
- **State Management:** Zustand ^5 with `persist` middleware
- **Validation:** Zod ^4
- **Icons:** Lucide React ^1.14 (primary), React Icons ^5 (GitHub icon only)
- **Linting:** ESLint v9 flat config (`eslint.config.mjs`)
- **UI Components:** Custom (Button, Card, Input, Select, Modal, Toast, CopyButton, ExamplePills, JsonViewer, TextViewer)

---

## UI/UX Specification

### Color Palette

```css
/* Dark Theme (Default) — :root */
--bg-primary: #0a0a0b;
--bg-secondary: #111113;
--bg-tertiary: #18181b;
--bg-hover: #1f1f23;

--text-primary: #fafafa;
--text-secondary: #a1a1aa;
--text-muted: #71717a;

--border: #27272a;
--border-hover: #3f3f46;

--accent: #22d3ee;
--accent-hover: #06b6d4;
--accent-muted: rgba(34, 211, 238, 0.1);

--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;

/* Light Theme — .light overrides in globals.css */
```

### Typography

- **Font Family:**
  - Headings: "Outfit", sans-serif
  - Body: "IBM Plex Sans", sans-serif
  - Code: "JetBrains Mono", monospace
- **Font Sizes:**
  - Display: 4rem (64px)
  - H1: 2.5rem (40px)
  - H2: 1.875rem (30px)
  - H3: 1.5rem (24px)
  - H4: 1.25rem (20px)
  - Body: 1rem (16px)
  - Small: 0.875rem (14px)
  - XS: 0.75rem (12px)
- **Line Heights:** 1.2 (tight), 1.5 (normal), 1.75 (relaxed)

### Spacing System

- Base unit: 4px
- Spacing scale: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64

### Border Radius

- sm: 4px
- md: 8px
- lg: 12px
- xl: 16px
- 2xl: 24px
- full: 9999px

### Layout

- **Max Content Width:** 1280px (max-w-7xl)
- **Responsive Breakpoints:**
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

---

## Homepage Structure

### 1. Navigation Bar (Fixed)
- Logo (left)
- Search + filter bar with category pills
- Command palette trigger (Cmd+K)
- Theme toggle
- GitHub link

### 2. Popular Tools Grid (ToolGrid)
- 16 tool cards in a responsive grid (1→2→3→4 columns)
- Search input with `/` shortcut
- Category filter pills
- Each card: icon, name, description, category badge, hover animation

### 3. Categories Section
- 6 category cards: Encoding, Security, Formatting, Text, Date & Time, API Utilities
- Shows tool count per category

### 4. Features Section
- 4 feature highlights with icons:
  - "Instant Processing" — All tools run locally in your browser
  - "Privacy First" — Your data never leaves your device
  - "Keyboard Driven" — Cmd+K search, keyboard shortcuts
  - "Open Source" — Free forever, no registration

### 5. Footer
- Links: GitHub, Changelog, Privacy, Categories
- Copyright

---

## Tool Page Architecture

### Layout

```
┌─────────────────────────────────────────────┐
│ Breadcrumb (Home > Category > Tool Name)      │
├─────────────────────────────────────────────┤
│ Tool Name + Description                      │
├─────────────────────────────────────────────┤
│ Example Pills (interactive presets)           │
├─────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────────────┐ │
│ │ Input      │ │ Output                  │ │
│ │ Panel     │ │ Panel                  │ │
│ │           │ │                         │ │
│ └─────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Copy | Clear | Download buttons             │
└─────────────────────────────────────────────┘
```

### Features Per Tool
- Example pills for quick preset loading
- Copy to clipboard button (with inline "Copied" feedback)
- Clear/reset button
- Error display with styled status banners
- Reactive processing (debounced via `useEffect` with cleanup timer)

---

## Tools Specification

### 1. JSON Beautifier & Validator
- **Actions:** Beautify, Minify, Sort keys
- **Indent:** 2 or 4 spaces
- **Output:** Syntax-highlighted JSON with search & navigation
- **Features:** Search with match counter, Enter/Shift+Enter navigation, parent-context filtering

### 2. Base64 Encoder/Decoder
- **Actions:** Encode (Standard + URL-safe), Decode
- **Output:** Plain text or auto-detected JSON → switches to JsonViewer
- **Features:** Auto-detect JSON output, format detection badges

### 3. JWT Decoder
- **Input:** JWT token string
- **Output:** Color-coded Header / Payload / Signature panels
- **Features:** Expiry status (valid/expired), timestamp annotations on `exp`/`iat`, per-panel search with match counter, scrollable JSON

### 4. Hash Generator
- **Algorithms:** SHA-256, SHA-512 (Web Crypto API)
- **Output:** Hash in lowercase hex

### 5. Unix Timestamp Converter
- **Input:** Numeric timestamp
- **Output:** Locale date, ISO string, relative time
- **Features:** Live current-time clock, example presets

### 6. Regex Tester
- **Input:** Pattern + flags + test string
- **Output:** Live highlighted matches
- **Features:** Toggle flags (g, i, m, s), match list with groups

### 7. UUID Generator
- **Version:** v4 only
- **Actions:** Bulk generate (1–100)
- **Output:** List of UUIDs with per-item copy

### 8. URL Encoder/Decoder
- **Actions:** `encodeURIComponent` / `decodeURIComponent`
- **Features:** Toast error on invalid encoding

### 9. Cron Expression Parser
- **Input:** 6-field cron expression
- **Output:** Human-readable description
- **Features:** Format reference table, step value (e.g. `*/15`) support

### 10. Color Converter
- **Input:** HEX, HEXA, RGB, RGBA, HSL, HSLA strings
- **Output:** All 6 formats
- **Features:** Native color picker, WCAG luminance/contrast ratios, accessibility rating (AAA/AA/Fail), 7 color harmonies (complementary, analogous, triadic, etc.)

### 11. Password Generator
- **Options:** Length, uppercase, lowercase, numbers, symbols
- **Output:** Generated password with strength indicator
- **Features:** Configurable character sets, regenerate

### 12. YAML ↔ JSON
- **Actions:** JSON → YAML, YAML → JSON
- **Features:** Bidirectional conversion, swap button

### 13. HTML Preview
- **Input:** Raw HTML
- **Output:** Live rendered preview in sandboxed iframe
- **Features:** Tab key support in textarea, Format button (indent by nesting), syntax-highlighted source view toggle

### 14. Lorem Ipsum Generator
- **Modes:** Paragraphs, sentences, words
- **Features:** Configurable count, regenerate, character count display

### 15. Number Base Converter
- **Bases:** Decimal, Hexadecimal, Binary, Octal
- **Features:** 4-way conversion, per-format copy, color-coded result labels

### 16. Image to Base64
- **Input:** Image file upload
- **Output:** Base64 data URL
- **Features:** Preview thumbnail, copy to clipboard

---

## Component Specifications

### Button
- Variants: primary, secondary, ghost, danger
- Sizes: sm, md, lg
- Icon support (`icon` prop)

### Input / Textarea
- Monospace font option
- No line numbers
- No auto-resize

### Card
- Hover lift animation
- Gradient accent border on hover

### Tool Card (Homepage)
- Icon with gradient background
- Title + description
- Hover: scale(1.02), y(-4px), shadow, border glow

### ExamplePills
- Displays an interactive row of pill-shaped preset buttons
- Props: `examples: { label: string }[]`, `activeIndex: number`, `onSelect: (index: number) => void`
- Selected pill: accent background, border, and text
- Unselected pills: tertiary background, secondary text, hover effects

### JsonViewer
- Syntax-highlighted JSON output (colored keys, strings, numbers, booleans)
- Per-keyword search with match counter
- Enter/Shift+Enter to navigate matches
- Parent-context filtering

### TextViewer
- Plain text display with search
- Auto-detect JSON → switches to JsonViewer

### Modal/Dialog
- Backdrop blur
- Slide-up animation
- Focus trap

### Toast
- Position: bottom-right
- Auto-dismiss (5s)
- Types: success, error, warning, info

### Command Palette
- Trigger: Cmd+K / Ctrl+K
- Search tools by name, description, or category
- Arrow key navigation, Enter to select

---

## Animation Specifications

### Tool Cards
- Hover: scale(1.02) + translateY(-4px)
- Transition: 200ms ease-out

### Buttons
- Hover: brightness increase
- Click: scale(0.95)
- Transition: 100ms

### Input Focus
- Border color transition: 150ms
- Glow effect (ring): 200ms

---

## Responsive Behavior

### Mobile (< 640px)
- Single column layout
- Stacked input/output panels
- Full-width buttons

### Tablet (640px - 1024px)
- 2-column tool card grid
- Side-by-side panels where possible

### Desktop (> 1024px)
- 3–4 column tool card grid
- Side-by-side input/output panels
- Command palette (Cmd+K)

---

## State Management (Zustand)

```typescript
interface AppStore {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  recentTools: string[];
  addRecentTool: (toolId: string) => void;
  favorites: string[];
  toggleFavorite: (toolId: string) => void;
}
```

---

## File Structure

```
src/
  app/
    globals.css              # Tailwind v4 @theme tokens + global styles
    layout.tsx               # Root layout (Header, Footer, CommandPalette, Toaster)
    page.tsx                 # Homepage (Hero, ToolGrid, Categories, Features)
    tools/
      page.tsx               # All tools listing
      <tool-name>/
        page.tsx             # One directory per tool — no dynamic [toolId] routing
  components/
    homepage/                # Hero, ToolGrid, Categories, Features
    layout/                  # Header, Footer, CommandPalette, ThemeSync
    tool/                    # ToolLayout (shared wrapper)
    ui/                      # Button, Card, CopyButton, ExamplePills, GradientBox,
                             # Input, JsonViewer, Modal, Select, TextViewer, Toast
  lib/
    hooks/useTheme.tsx       # ThemeProvider + useTheme context
    store/useStore.ts        # Zustand global store
    utils/index.ts           # cn, formatDate, formatTime, debounce, throttle
  tools/                     # Pure utility logic — one dir per tool
    <tool-name>/utils.ts
  types/index.ts
```

---

## Acceptance Criteria

1. ✅ Homepage loads in < 2 seconds
2. ✅ Tool pages are accessible and functional
3. ✅ All tools produce correct output
4. ✅ Dark/light theme toggle works
5. ✅ Command palette opens with Cmd+K
6. ✅ Mobile responsive layout works
7. ✅ No console errors
8. ✅ Build passes without errors
9. ✅ TypeScript strict mode passes
10. ✅ Keyboard shortcuts (Cmd+K, / to focus search)
