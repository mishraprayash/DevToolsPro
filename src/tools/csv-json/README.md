# CSV ↔ JSON Converter

## 1. Overview
The **CSV ↔ JSON Converter** provides high-speed bidirectional translation between CSV/TSV spreadsheets and structured JSON payloads with automatic delimiter detection, header normalization, and data type inference (numbers, booleans, nulls).

---

## 2. Directory Structure
```
src/tools/csv-json/
├── __tests__/          # Automated tests for CSV/JSON conversion
├── README.md           # Developer documentation
└── utils.ts            # Parsing engine, delimiter sniffer, and formatters

src/app/tools/csv-json/
└── page.tsx            # Multi-workspace interactive UI
```

---

## 3. Pure Logic & APIs (`utils.ts`)

```typescript
export interface CsvToJsonOptions {
  delimiter?: string;           // Auto-detected or ',', ';', '\t', '|'
  hasHeader?: boolean;          // Defaults to true
  parseNumbers?: boolean;       // Infers numeric types
  parseBooleans?: boolean;      // Infers boolean flags
  trimWhitespace?: boolean;     // Trims cell values
}

export interface JsonToCsvOptions {
  delimiter?: string;           // Defaults to ','
  includeHeader?: boolean;      // Defaults to true
  flattenNested?: boolean;      // Dot-notation flattening for nested objects
}
```

### Key Functions
| Function | Parameters | Returns | Description |
|---|---|---|---|
| `csvToJson(csv, options?)` | `csv: string, options?: CsvToJsonOptions` | `Result<unknown[]>` | Parses RFC 4180 CSV/TSV text into JSON array. |
| `jsonToCsv(json, options?)` | `json: string, options?: JsonToCsvOptions` | `Result<string>` | Converts array of JSON objects into CSV table. |
| `detectDelimiter(text)` | `text: string` | `',' \| ';' \| '\t' \| '\|'` | Sniffs the primary delimiter by frequency analysis. |

---

## 4. UI Implementation
* **Direction Switch**: Toggle between `CSV → JSON` and `JSON → CSV` modes.
* **Smart Options**: Configurable delimiter override, type inference switches, and whitespace trimming.
* **Workspace Persistence**: Full support for multi-tab workspaces via `useWorkspaces`.

---

## 5. How to Contribute / Extend
* Run tests with the test suite in `__tests__/utils.test.ts`.
* Add custom quote escaping or Excel formula injection sanitization options in `utils.ts`.
