# URL & Query Parameter Inspector

## 1. Overview
The **URL & Query Parameter Inspector** allows developers to parse, dissect, manipulate, encode/decode, and reconstruct complex URLs and query strings in real time with 100% client-side execution.

---

## 2. Directory Structure
```
src/tools/url-parser/
├── README.md           # Developer documentation
└── utils.ts            # Pure functions (URL parser, builder, encoders)

src/app/tools/url-parser/
└── page.tsx            # Interactive UI (Next.js Client Component)
```

---

## 3. Pure Logic & APIs (`utils.ts`)

All core operations in `utils.ts` are pure functions adhering to strict `Result<T>` returns and never throwing exceptions directly to the UI.

```typescript
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### Key Functions
| Function | Parameters | Returns | Description |
|---|---|---|---|
| `parseUrlString(rawUrl)` | `rawUrl: string` | `Result<ParsedUrlData>` | Parses standard or partial URLs into structured parts (protocol, host, port, path, hash, params). |
| `constructUrl(...)` | `protocol, host, pathname, queryParams, hash, auth?` | `Result<string>` | Reconstructs a clean URL string from individual components and enabled query parameters. |
| `encodeUrlComponentSafe(val)` | `val: string` | `Result<string>` | Safely applies `encodeURIComponent` without throwing. |
| `decodeUrlComponentSafe(val)` | `val: string` | `Result<string>` | Safely applies `decodeURIComponent` without throwing. |

---

## 4. UI Implementation (`src/app/tools/url-parser/page.tsx`)

* **Live Dissection Grid**: Displays Protocol, Hostname, Port, and Pathname cards.
* **Query Parameter Manager**:
  * Checkbox toggle to temporarily enable/disable specific query params.
  * Live URL rebuild upon editing key/value fields.
  * In-place `%` (URL encode) and `Aa` (URL decode) buttons per value.
* **One-Click Exports**:
  * Copy Clean Base URL (strips query parameters and hashes).
  * Export Query Parameters as JSON payload.

---

## 5. How to Contribute / Extend
1. **Adding New Presets**: Add sample URLs to `SAMPLE_URLS` in `page.tsx`.
2. **Adding Export Formats**: Add cURL or Fetch generation functions to `utils.ts` and wire export buttons in `page.tsx`.
