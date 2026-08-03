# DevTools Pro

A collection of **53 production-grade developer utilities** in one beautiful, offline-first platform.

## Tools

| Category | Tools |
|---|---|
| **Formatting** (18) | JSON Beautifier, Color Converter, YAML ↔ JSON, XML ↔ JSON, CSV ↔ JSON, HTML Preview, CSS Flexbox & Grid Sandbox, CSS Unit & Fluid Typography, JSON to TypeScript, JSON Schema Generator, JSONPath Playground, SVG to JSX/React, SQL Formatter, SQL to ORM Entity Generator, Mock Data Generator, GraphQL to TypeScript, Docker Run ↔ Compose, SQL Schema Designer |
| **Encoding** (6) | Encoder & Decoder Sandbox, Base Converter, Image to Base64, QR Code Generator, cURL Converter, Favicon Generator |
| **Security** (8) | JWT Decoder & Generator, Hash Generator, Password Generator, AES Encrypt/Decrypt, RSA Sandbox, Bcrypt Generator & Checker, Chmod Calculator, Card & IBAN Helper |
| **Network** (7) | IP Subnet Calculator, Subnet Mask Converter, IPv6 Address Helper, MAC Address Lookup, DNS Record Decoder, HTTP Status Code Glossary, User-Agent Parser |
| **Text** (10) | Regex Tester, UUID Generator, Text & String Utilities, Diff Checker, Git Command Generator, System Prompt Builder, .gitignore Generator, LLM Pricing Calculator, Sitemap Generator, Romanized to Nepali |
| **Date & Time** (4) | Date, Time & Epoch Sandbox, Cron Parser, Time Zone Converter, Nepali BS ↔ AD Calendar |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5 (strict)
- **Styling:** Tailwind CSS v4
- **State:** Zustand v5 with persist middleware
- **Animations:** Framer Motion v12
- **Validation:** Zod v4
- **Icons:** Lucide React
- **Testing:** Vitest v4

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

## Build & Test

```bash
npm run lint   # ESLint
npm run test   # Vitest unit tests
npm run build  # Production build
npm run start  # Start production server
```

## Contributing

We welcome contributions to DevTools Pro! Whether you are fixing a bug, suggesting a feature, or adding a new developer utility, your help is highly appreciated.

### How to Add a New Tool

To add a new tool, please follow this checklist:

1. **Utility Functions:** Create pure TypeScript utility functions inside a new folder: `src/tools/<tool-name>/utils.ts` (e.g., `src/tools/json/utils.ts`). Avoid importing React or browser-only APIs here to keep them testable and pure.
2. **Page View:** Create the Next.js page in `src/app/tools/<tool-name>/page.tsx`. Use `'use client'` at the top and wire the state to your utility functions.
3. **Register the Tool:** Register your new tool in `src/tools/registry.ts`. The homepage grid, command palette, header menu, and all-tools page consume the registry automatically.

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
4. Run the unit tests for your utility functions:
   ```bash
   npm run test
   ```
5. Build the application locally to verify there are no TypeScript or compilation errors:
   ```bash
   npm run build
   ```
6. Commit your changes with descriptive and concise commit messages:
   ```bash
   git commit -m "feat: add cron expression parser utility"
   ```
7. Push to your fork and submit a Pull Request!

---

Crafted with ❤️ by [Prayash Mishra](https://github.com/mishraprayash)
