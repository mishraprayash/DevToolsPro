# JSON Beautifier & Validator

## 1. Overview
The **JSON Beautifier** is a multi-tab JSON formatting, minification, key-sorting, validation, and schema generation workbench. It includes off-main-thread Web Worker processing for large payloads and automatic repair capabilities.

---

## 2. Directory Structure
```
src/tools/json/
├── __tests__/          # Unit tests for JSON utilities
├── README.md           # Developer documentation
└── utils.ts            # Pure functions (parsing, beautification, sorting, repair)

src/app/tools/json/
└── page.tsx            # Interactive UI with Workspaces and Web Worker integration
```

---

## 3. Pure Logic & APIs (`utils.ts`)

### Key Functions
| Function | Signature | Description |
|---|---|---|
| `parseJson(input)` | `(input: string) => Result<unknown>` | Safe wrapper around `JSON.parse`. |
| `beautifyJson(input, indent)` | `(input: string, indent?: number) => string` | Formats JSON with configurable space indentation. |
| `minifyJson(input)` | `(input: string) => string` | Compacts JSON by stripping extraneous whitespace. |
| `sortJsonKeys(input)` | `(input: string) => string` | Recursively sorts all keys in nested JSON objects. |
| `validateJson(input)` | `(input: string) => { valid: boolean; error?: string; line?: number }` | Validates syntax and locates the exact line of syntax error. |
| `repairJsonString(input)` | `(input: string) => { repaired: string; fixes: string[] }` | Automatically fixes common JSON issues (unquoted keys, trailing commas, single quotes). |

---

## 4. Performance & Background Concurrency
* **Off-Main-Thread Processing**: For processing large datasets without freezing the browser UI, the page dispatches formatting tasks to `useToolWorker` (`src/lib/workers/useToolWorker.ts`).
* **Multi-Tab Workspaces**: State is managed per workspace tab using `useWorkspaces`, allowing developers to switch between multiple JSON payloads.
* **Dual Output View**: Supports Raw Formatted JSON view with line numbers and interactive collapsible Tree view (`JsonTreeViewer`).

---

## 5. How to Contribute / Extend
* **Adding New Transformations**: Implement new transformation algorithms in `utils.ts` and ensure pure function contract.
* **Adding Tests**: Place new test cases under `src/tools/json/__tests__/`.
