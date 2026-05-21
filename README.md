# DevTools Pro

A collection of 16 production-grade developer utilities in one beautiful platform.

## Tools

| Category | Tools |
|---|---|
| Formatting | JSON Beautifier, YAML ↔ JSON, Color Converter, HTML Preview |
| Encoding | Base64 Encoder, URL Encoder/Decoder, Number Base Converter, Image to Base64 |
| Security | JWT Decoder, Hash Generator, Password Generator |
| Text | Regex Tester, UUID Generator, Lorem Ipsum Generator |
| Date & Time | Timestamp Converter, Cron Parser |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5 (strict)
- **Styling:** Tailwind CSS v4
- **State:** Zustand v5 with persist middleware
- **Animations:** Framer Motion v12
- **Validation:** Zod v4
- **Icons:** Lucide React

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Set up Feedback System Email Alerts:
   To receive email alerts when users submit feedback, create a `.env.local` file at the root and configure your Resend API Key:
   ```env
   RESEND_API_KEY=re_your_resend_api_key
   FEEDBACK_EMAIL_TO=your-personal-email@example.com
   ```
   *Note: If no API key is provided, the platform will safely fall back to logging the submissions to the Next.js server console.*

3. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm run start
```

## Contributing

We welcome contributions to DevTools Pro! Whether you are fixing a bug, suggesting a feature, or adding a new developer utility, your help is highly appreciated.

### How to Add a New Tool

To add a new tool, please follow this checklist:

1. **Utility Functions:** Create pure TypeScript utility functions inside a new folder: `src/tools/<tool-name>/utils.ts` (e.g., `src/tools/json/utils.ts`). Avoid importing React or browser-only APIs here to keep them testable and pure.
2. **Page View:** Create the Next.js page in `src/app/tools/<tool-name>/page.tsx`. Use `'use client'` at the top and wire the state to your utility functions.
3. **Register the Tool:** Register your new tool in:
   - `src/components/homepage/ToolGrid.tsx` (add to the appropriate category list)
   - `src/components/layout/CommandPalette.tsx` (add to the searchable tools list)

### Code Style Guidelines

- **TypeScript:** Strict mode is enforced. Avoid `any`; use `unknown` or specific interfaces instead.
- **Styling:** Use Tailwind CSS v4 utility classes. There is no `tailwind.config.js`; all custom tokens live under the `@theme` block in `src/app/globals.css`.
- **UI Elements:** Use shared components located in `src/components/ui/` (like `Button`, `Input`, `Select`, `Modal`, `Card`, etc.) to keep a consistent look and feel.
- **Naming Conventions:**
  - Components & Component files: `PascalCase` (e.g., `ToolLayout.tsx`)
  - Hooks: `camelCase` with `use` prefix (e.g., `useTheme`)
  - Utility functions: `camelCase` (e.g., `parseJson`)
- **React Imports:** Always use namespace imports for React: `import * as React from 'react'`.
- **Error Handling:** Utility functions should return a result object rather than throwing errors:
  ```typescript
  type Result = { success: true; data: unknown } | { success: false; error: string };
  ```

### Development Workflow

1. Fork the repository and create your feature branch:
   ```bash
   git checkout -b feature/amazing-new-tool
   ```
2. Make your changes following the style guidelines.
3. Run linting to ensure no code styling or syntax issues:
   ```bash
   npm run lint
   ```
4. Build the application locally to verify there are no TypeScript or compilation errors:
   ```bash
   npm run build
   ```
5. Commit your changes with descriptive and concise commit messages:
   ```bash
   git commit -m "feat: add cron expression parser utility"
   ```
6. Push to your fork and submit a Pull Request!

---

Crafted with ❤️ by [Prayash Mishra](https://github.com/mishraprayash)
