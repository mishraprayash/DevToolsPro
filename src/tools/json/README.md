# JSON Beautifier & Validator

## 1. Overview
The **JSON Beautifier** is a multi-tab JSON formatting, minification, key-sorting, validation, and schema generation workbench. It includes off-main-thread Web Worker processing for large payloads and automatic repair capabilities.

---

## 2. Modular Architecture & Directory Structure
```
src/tools/json/
├── types.ts                  # Domain action types & validation interfaces
├── formatters/
│   └── json.formatter.ts     # Beautify, minify, sort keys, validate, process
├── repair/
│   └── json.repair.ts        # Syntax repair heuristics (unquoted keys, trailing commas, single quotes)
├── converters/
│   └── json.converters.ts    # JSON to YAML, XML, CSV, and Query parameters
├── __tests__/                # Unit tests
├── index.ts                  # Barrel export for all json domain modules
├── utils.ts                  # Backwards-compatible barrel export
└── README.md                 # Developer documentation
```

---

## 3. Pure Logic & APIs

### Formatters (`formatters/json.formatter.ts`)
| Function | Signature | Description |
|---|---|---|
| `parseJson(input)` | `(input: string) => JsonResult<unknown>` | Safe wrapper around `JSON.parse`. |
| `beautifyJson(input, indent)` | `(input: string, indent?: number) => string` | Formats JSON with configurable space indentation. |
| `minifyJson(input)` | `(input: string) => string` | Compacts JSON by stripping extraneous whitespace. |
| `sortJsonKeys(input)` | `(input: string) => string` | Recursively sorts all keys in nested JSON objects. |
| `validateJson(input)` | `(input: string) => JsonValidationResult` | Validates syntax and locates the exact line of syntax error. |

### Repair & Converters (`repair/` and `converters/`)
| Function | Module | Description |
|---|---|---|
| `repairJsonString(raw)` | `repair/json.repair.ts` | Automatically fixes common syntax errors (Markdown wrappers, missing quotes, trailing commas). |
| `jsonToYaml(val)` | `converters/json.converters.ts` | Converts JS object/JSON into formatted YAML. |
| `jsonToXml(val)` | `converters/json.converters.ts` | Converts JS object/JSON into XML tree. |
| `jsonToCsv(val)` | `converters/json.converters.ts` | Flattens nested JSON records into CSV spreadsheet. |
| `jsonToQueryParams(val)` | `converters/json.converters.ts` | Converts object into URL-encoded query parameters. |

---

## 4. Performance & Background Concurrency
* **Off-Main-Thread Processing**: Dispatches formatting tasks to `useToolWorker` (`src/lib/workers/useToolWorker.ts`) to prevent UI thread lockup on multi-megabyte payloads.
* **Multi-Tab Workspaces**: State is managed per workspace tab using `useWorkspaces`.
* **Dual Output View**: Supports raw formatted text with line numbers and collapsible Tree view (`JsonTreeViewer`).

---

## 5. How to Contribute / Extend
* **Adding New Formats**: Add converter functions to `converters/json.converters.ts` and re-export in `index.ts`.
* **Adding Tests**: Place new test cases under `src/tools/json/__tests__/`.
