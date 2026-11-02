import type { Result } from '@/types';
import { ok, err } from '@/types';
import {
  encodeBase64Result,
  decodeBase64Result,
  encodeUrlStrResult,
  decodeUrlStrResult,
  encodeEntitiesResult,
  decodeEntitiesResult,
  type UrlMode,
  type EntityMode,
  type EntityScope,
} from '@/tools/encoder/utils';
import { hashString, hashAlgorithms, type HashAlgorithm } from '@/tools/hash/utils';
import { beautifyJson, minifyJson, sortJsonKeys } from '@/tools/json/formatters/json.formatter';
import { evaluateJsonPath } from '@/tools/jsonpath/utils';
import { slugifyResult, transformTextResult } from '@/tools/string-utils/utils';
import { convertNumber, type NumberBase } from '@/tools/number-base/utils';
import { decodeJwtParts } from '@/tools/jwt/utils';
import { yamlToJsonResult, jsonToYamlResult } from '@/tools/yaml-json/utils';
import { xmlToJsonResult, jsonToXmlResult } from '@/tools/xml-json/utils';
import { replaceRegex } from '@/tools/regex/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

export type OpCategory = 'Encoding' | 'Hashing' | 'JSON' | 'Formats' | 'Text' | 'Lines' | 'Regex' | 'Tokens' | 'Numbers';

export const opCategories: OpCategory[] = ['Encoding', 'Hashing', 'JSON', 'Formats', 'Text', 'Lines', 'Regex', 'Tokens', 'Numbers'];

export type ParamValue = string | boolean;
export type ParamValues = Record<string, ParamValue>;

export type ParamDef =
  | { key: string; label: string; type: 'text'; default: string; placeholder?: string }
  | { key: string; label: string; type: 'select'; default: string; options: { value: string; label: string }[] }
  | { key: string; label: string; type: 'checkbox'; default: boolean };

export interface Operation {
  id: string;
  label: string;
  category: OpCategory;
  description: string;
  params?: ParamDef[];
  run: (input: string, params: ParamValues) => Promise<Result<string>>;
}

export interface RecipeStep {
  /** Unique per-instance id (stable across reorders; not serialized). */
  uid: string;
  op: string;
  params: ParamValues;
  enabled: boolean;
}

export type StepStatus = 'ok' | 'error' | 'skipped' | 'not-run';

export interface StepResult {
  uid: string;
  op: string;
  status: StepStatus;
  ok: boolean;
  output?: string;
  error?: string;
  ms: number;
}

export interface RecipeRunResult {
  results: StepResult[];
  /** Output of the pipeline, or null when a step failed. */
  finalOutput: string | null;
  /** Index of the failing step, or -1. */
  failedIndex: number;
  totalMs: number;
}

// ─── Small helpers ──────────────────────────────────────────────────────────

const str = (params: ParamValues, key: string, fallback = ''): string => {
  const v = params[key];
  return typeof v === 'string' ? v : fallback;
};
const bool = (params: ParamValues, key: string, fallback = false): boolean => {
  const v = params[key];
  return typeof v === 'boolean' ? v : fallback;
};

const indentParam: ParamDef = {
  key: 'indent',
  label: 'Indent',
  type: 'select',
  default: '2',
  options: [
    { value: '2', label: '2 spaces' },
    { value: '4', label: '4 spaces' },
    { value: 'tab', label: 'Tab' },
  ],
};

function applyIndent(json: string, indent: string): string {
  if (indent !== 'tab') return json;
  // JSON.stringify with 2-space indent → convert leading indentation to tabs
  return json.replace(/^( {2})+/gm, (m) => '\t'.repeat(m.length / 2));
}

function indentNumber(indent: string): number {
  return indent === '4' ? 4 : 2;
}

/** Split identifiers / phrases into lowercase-able words (handles camel, snake, kebab, spaces). */
export function splitWords(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

type CaseStyle = 'camel' | 'pascal' | 'snake' | 'kebab' | 'constant';

export function toCase(input: string, style: CaseStyle): string {
  return input
    .split('\n')
    .map((line) => {
      const words = splitWords(line).map((w) => w.toLowerCase());
      if (words.length === 0) return line.trim();
      const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
      switch (style) {
        case 'camel': return words[0] + words.slice(1).map(cap).join('');
        case 'pascal': return words.map(cap).join('');
        case 'snake': return words.join('_');
        case 'kebab': return words.join('-');
        case 'constant': return words.join('_').toUpperCase();
      }
    })
    .join('\n');
}

function splitLines(input: string): string[] {
  return input.split(/\r?\n/);
}

const hexSeparators: Record<string, string> = { none: '', space: ' ', colon: ':', newline: '\n' };

// ─── Operations ─────────────────────────────────────────────────────────────

export const operations: Operation[] = [
  // Encoding
  {
    id: 'base64-encode',
    label: 'To Base64',
    category: 'Encoding',
    description: 'Encode UTF-8 text as Base64',
    params: [{ key: 'urlSafe', label: 'URL-safe', type: 'checkbox', default: false }],
    run: async (input, p) => encodeBase64Result(input, 'utf8', bool(p, 'urlSafe')),
  },
  {
    id: 'base64-decode',
    label: 'From Base64',
    category: 'Encoding',
    description: 'Decode Base64 into UTF-8 text',
    params: [{ key: 'urlSafe', label: 'URL-safe', type: 'checkbox', default: false }],
    run: async (input, p) => {
      // Accept URL-safe alphabet automatically when the input clearly uses it
      const urlSafe = bool(p, 'urlSafe') || /[-_]/.test(input);
      return decodeBase64Result(input.replace(/\s+/g, ''), 'utf8', urlSafe);
    },
  },
  {
    id: 'url-encode',
    label: 'URL Encode',
    category: 'Encoding',
    description: 'Percent-encode text',
    params: [{
      key: 'mode', label: 'Mode', type: 'select', default: 'component', options: [
        { value: 'component', label: 'Component' },
        { value: 'uri', label: 'Full URI' },
        { value: 'strict', label: 'Strict (RFC 3986)' },
      ],
    }],
    run: async (input, p) => encodeUrlStrResult(input, str(p, 'mode', 'component') as UrlMode),
  },
  {
    id: 'url-decode',
    label: 'URL Decode',
    category: 'Encoding',
    description: 'Decode percent-encoded text',
    params: [
      {
        key: 'mode', label: 'Mode', type: 'select', default: 'component', options: [
          { value: 'component', label: 'Component' },
          { value: 'uri', label: 'Full URI' },
        ],
      },
      { key: 'plus', label: '"+" as space', type: 'checkbox', default: false },
    ],
    run: async (input, p) => {
      const src = bool(p, 'plus') ? input.replace(/\+/g, ' ') : input;
      return decodeUrlStrResult(src, str(p, 'mode', 'component') as UrlMode);
    },
  },
  {
    id: 'html-encode',
    label: 'HTML Entities Encode',
    category: 'Encoding',
    description: 'Escape markup characters as HTML entities',
    params: [
      {
        key: 'mode', label: 'Style', type: 'select', default: 'named', options: [
          { value: 'named', label: 'Named' },
          { value: 'decimal', label: 'Decimal' },
          { value: 'hex', label: 'Hex' },
        ],
      },
      {
        key: 'scope', label: 'Scope', type: 'select', default: 'markup', options: [
          { value: 'markup', label: 'Markup only' },
          { value: 'all', label: 'Markup + non-ASCII' },
        ],
      },
    ],
    run: async (input, p) => encodeEntitiesResult(input, {
      mode: str(p, 'mode', 'named') as EntityMode,
      scope: str(p, 'scope', 'markup') as EntityScope,
    }),
  },
  {
    id: 'html-decode',
    label: 'HTML Entities Decode',
    category: 'Encoding',
    description: 'Unescape HTML entities',
    run: async (input) => decodeEntitiesResult(input),
  },
  {
    id: 'hex-encode',
    label: 'To Hex',
    category: 'Encoding',
    description: 'Encode UTF-8 bytes as hexadecimal',
    params: [
      {
        key: 'separator', label: 'Separator', type: 'select', default: 'none', options: [
          { value: 'none', label: 'None' },
          { value: 'space', label: 'Space' },
          { value: 'colon', label: 'Colon' },
          { value: 'newline', label: 'Newline' },
        ],
      },
      { key: 'upper', label: 'Uppercase', type: 'checkbox', default: false },
    ],
    run: async (input, p) => {
      if (!input) return ok('');
      const b64 = encodeBase64Result(input, 'utf8');
      if (!b64.success) return b64;
      const hex = decodeBase64Result(b64.data, 'hex');
      if (!hex.success) return hex;
      const sep = hexSeparators[str(p, 'separator', 'none')] ?? '';
      const pairs = hex.data.match(/.{2}/g) ?? [];
      const out = pairs.join(sep);
      return ok(bool(p, 'upper') ? out.toUpperCase() : out);
    },
  },
  {
    id: 'hex-decode',
    label: 'From Hex',
    category: 'Encoding',
    description: 'Decode hexadecimal bytes into UTF-8 text (separators ignored)',
    run: async (input) => {
      const clean = input.replace(/0x/gi, '').replace(/[\s:,-]/g, '');
      if (!clean) return ok('');
      if (/[^0-9a-f]/i.test(clean)) return err('Invalid hex: contains non-hex characters');
      const b64 = encodeBase64Result(clean, 'hex');
      if (!b64.success) return b64;
      return decodeBase64Result(b64.data, 'utf8');
    },
  },

  // Hashing
  {
    id: 'hash',
    label: 'Hash',
    category: 'Hashing',
    description: 'Digest text with MD5 / SHA-1 / SHA-2',
    params: [
      {
        key: 'algorithm', label: 'Algorithm', type: 'select', default: 'SHA-256',
        options: hashAlgorithms.map((a) => ({ value: a.id, label: a.name })),
      },
      { key: 'upper', label: 'Uppercase', type: 'checkbox', default: false },
    ],
    run: async (input, p) => {
      try {
        const algo = str(p, 'algorithm', 'SHA-256') as HashAlgorithm;
        if (!hashAlgorithms.some((a) => a.id === algo)) return err(`Unknown hash algorithm: ${algo}`);
        const digest = await hashString(algo, input);
        return ok(bool(p, 'upper') ? digest.toUpperCase() : digest);
      } catch (e) {
        return err((e as Error).message || 'Hashing failed');
      }
    },
  },

  // JSON
  {
    id: 'json-beautify',
    label: 'JSON Beautify',
    category: 'JSON',
    description: 'Pretty-print JSON',
    params: [indentParam],
    run: async (input, p) => {
      const indent = str(p, 'indent', '2');
      const r = beautifyJson(input, indentNumber(indent));
      return r.success ? ok(applyIndent(r.data, indent)) : err(`Invalid JSON: ${r.error}`);
    },
  },
  {
    id: 'json-minify',
    label: 'JSON Minify',
    category: 'JSON',
    description: 'Strip whitespace from JSON',
    run: async (input) => {
      const r = minifyJson(input);
      return r.success ? ok(r.data) : err(`Invalid JSON: ${r.error}`);
    },
  },
  {
    id: 'json-sort-keys',
    label: 'JSON Sort Keys',
    category: 'JSON',
    description: 'Recursively sort object keys',
    params: [indentParam],
    run: async (input, p) => {
      const indent = str(p, 'indent', '2');
      const r = sortJsonKeys(input, indentNumber(indent));
      return r.success ? ok(applyIndent(r.data, indent)) : err(`Invalid JSON: ${r.error}`);
    },
  },
  {
    id: 'jsonpath',
    label: 'JSONPath Extract',
    category: 'JSON',
    description: 'Query JSON with a JSONPath expression',
    params: [
      { key: 'path', label: 'Path', type: 'text', default: '$', placeholder: '$.store.book[*].title' },
      { key: 'unwrap', label: 'Unwrap single match', type: 'checkbox', default: true },
    ],
    run: async (input, p) => {
      const path = str(p, 'path').trim();
      if (!path) return err('JSONPath expression is required');
      if (!input.trim()) return err('Input is empty');
      const r = await evaluateJsonPath(input, path);
      if (!r.success) return err(r.error);
      let data = r.data;
      if (bool(p, 'unwrap', true) && Array.isArray(data) && data.length === 1) data = data[0];
      if (typeof data === 'string') return ok(data);
      try {
        return ok(JSON.stringify(data, null, 2) ?? '');
      } catch (e) {
        return err((e as Error).message);
      }
    },
  },

  // Formats
  {
    id: 'yaml-to-json',
    label: 'YAML → JSON',
    category: 'Formats',
    description: 'Convert YAML to JSON',
    run: (input) => yamlToJsonResult(input),
  },
  {
    id: 'json-to-yaml',
    label: 'JSON → YAML',
    category: 'Formats',
    description: 'Convert JSON to YAML',
    run: (input) => jsonToYamlResult(input),
  },
  {
    id: 'xml-to-json',
    label: 'XML → JSON',
    category: 'Formats',
    description: 'Convert XML to JSON',
    params: [{ key: 'ignoreAttributes', label: 'Ignore attributes', type: 'checkbox', default: false }],
    run: (input, p) => xmlToJsonResult(input, { ignoreAttributes: bool(p, 'ignoreAttributes') }),
  },
  {
    id: 'json-to-xml',
    label: 'JSON → XML',
    category: 'Formats',
    description: 'Convert JSON to XML',
    run: (input) => jsonToXmlResult(input),
  },

  // Text
  { id: 'upper-case', label: 'UPPER CASE', category: 'Text', description: 'Convert to upper case', run: async (i) => transformTextResult(i, 'upper') },
  { id: 'lower-case', label: 'lower case', category: 'Text', description: 'Convert to lower case', run: async (i) => transformTextResult(i, 'lower') },
  { id: 'title-case', label: 'Title Case', category: 'Text', description: 'Capitalize each word', run: async (i) => transformTextResult(i, 'title') },
  { id: 'camel-case', label: 'camelCase', category: 'Text', description: 'Convert each line to camelCase', run: async (i) => ok(toCase(i, 'camel')) },
  { id: 'pascal-case', label: 'PascalCase', category: 'Text', description: 'Convert each line to PascalCase', run: async (i) => ok(toCase(i, 'pascal')) },
  { id: 'snake-case', label: 'snake_case', category: 'Text', description: 'Convert each line to snake_case', run: async (i) => ok(toCase(i, 'snake')) },
  { id: 'kebab-case', label: 'kebab-case', category: 'Text', description: 'Convert each line to kebab-case', run: async (i) => ok(toCase(i, 'kebab')) },
  { id: 'constant-case', label: 'CONSTANT_CASE', category: 'Text', description: 'Convert each line to CONSTANT_CASE', run: async (i) => ok(toCase(i, 'constant')) },
  { id: 'slugify', label: 'Slugify', category: 'Text', description: 'URL-friendly slug', run: async (i) => slugifyResult(i) },
  { id: 'trim', label: 'Trim', category: 'Text', description: 'Remove leading/trailing whitespace', run: async (i) => transformTextResult(i, 'trim') },
  { id: 'reverse', label: 'Reverse Text', category: 'Text', description: 'Reverse characters (Unicode-aware)', run: async (i) => ok(Array.from(i).reverse().join('')) },

  // Lines
  {
    id: 'sort-lines',
    label: 'Sort Lines',
    category: 'Lines',
    description: 'Sort lines alphabetically or numerically',
    params: [
      {
        key: 'order', label: 'Order', type: 'select', default: 'asc', options: [
          { value: 'asc', label: 'A → Z' },
          { value: 'desc', label: 'Z → A' },
        ],
      },
      { key: 'numeric', label: 'Natural / numeric', type: 'checkbox', default: false },
      { key: 'ignoreCase', label: 'Ignore case', type: 'checkbox', default: false },
    ],
    run: async (input, p) => {
      const collator = new Intl.Collator(undefined, {
        numeric: bool(p, 'numeric'),
        sensitivity: bool(p, 'ignoreCase') ? 'base' : 'variant',
      });
      const lines = splitLines(input).sort((a, b) => {
        if (!bool(p, 'numeric') && !bool(p, 'ignoreCase')) return a < b ? -1 : a > b ? 1 : 0;
        return collator.compare(a, b);
      });
      if (str(p, 'order', 'asc') === 'desc') lines.reverse();
      return ok(lines.join('\n'));
    },
  },
  {
    id: 'unique-lines',
    label: 'Unique Lines',
    category: 'Lines',
    description: 'Remove duplicate lines (keeps first occurrence)',
    params: [{ key: 'ignoreCase', label: 'Ignore case', type: 'checkbox', default: false }],
    run: async (input, p) => {
      const seen = new Set<string>();
      const ic = bool(p, 'ignoreCase');
      const out = splitLines(input).filter((l) => {
        const k = ic ? l.toLowerCase() : l;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      return ok(out.join('\n'));
    },
  },
  {
    id: 'remove-empty-lines',
    label: 'Remove Empty Lines',
    category: 'Lines',
    description: 'Drop blank / whitespace-only lines',
    run: async (input) => ok(splitLines(input).filter((l) => l.trim() !== '').join('\n')),
  },
  {
    id: 'reverse-lines',
    label: 'Reverse Lines',
    category: 'Lines',
    description: 'Reverse the order of lines',
    run: async (input) => ok(splitLines(input).reverse().join('\n')),
  },

  // Regex
  {
    id: 'regex-replace',
    label: 'Regex Replace',
    category: 'Regex',
    description: 'Find & replace with a regular expression ($1 backrefs supported)',
    params: [
      { key: 'pattern', label: 'Pattern', type: 'text', default: '', placeholder: '\\s+' },
      { key: 'flags', label: 'Flags', type: 'text', default: 'g', placeholder: 'gimsuy' },
      { key: 'replacement', label: 'Replace with', type: 'text', default: '', placeholder: '$1' },
    ],
    run: async (input, p) => {
      const flags = str(p, 'flags', 'g');
      if (/[^dgimsuyv]/.test(flags)) return err(`Invalid regex flags: "${flags}"`);
      const r = replaceRegex(input, str(p, 'pattern'), flags, str(p, 'replacement'));
      return r.success ? ok(r.output) : err(r.error);
    },
  },

  // Tokens
  {
    id: 'jwt-decode',
    label: 'JWT Decode',
    category: 'Tokens',
    description: 'Decode a JWT header/payload as JSON (signature not verified)',
    params: [{
      key: 'part', label: 'Part', type: 'select', default: 'payload', options: [
        { value: 'payload', label: 'Payload' },
        { value: 'header', label: 'Header' },
        { value: 'both', label: 'Header + payload' },
      ],
    }],
    run: async (input, p) => {
      const token = input.trim().replace(/^Bearer\s+/i, '');
      if (!token) return err('Input is empty');
      const r = decodeJwtParts(token);
      if (!r.success) return err(r.error);
      const part = str(p, 'part', 'payload');
      const data = part === 'header' ? r.header : part === 'both' ? { header: r.header, payload: r.payload } : r.payload;
      return ok(JSON.stringify(data, null, 2));
    },
  },

  // Numbers
  {
    id: 'number-base',
    label: 'Convert Number Base',
    category: 'Numbers',
    description: 'Convert each non-empty line between decimal, hex, binary and octal',
    params: [
      {
        key: 'from', label: 'From', type: 'select', default: 'decimal', options: [
          { value: 'decimal', label: 'Decimal' },
          { value: 'hex', label: 'Hex' },
          { value: 'binary', label: 'Binary' },
          { value: 'octal', label: 'Octal' },
        ],
      },
      {
        key: 'to', label: 'To', type: 'select', default: 'hex', options: [
          { value: 'decimal', label: 'Decimal' },
          { value: 'hex', label: 'Hex' },
          { value: 'binary', label: 'Binary' },
          { value: 'octal', label: 'Octal' },
        ],
      },
      { key: 'prefix', label: 'Prefix (0x / 0b / 0o)', type: 'checkbox', default: true },
    ],
    run: async (input, p) => {
      const prefix = bool(p, 'prefix', true);
      const from = str(p, 'from', 'decimal') as NumberBase;
      const to = str(p, 'to', 'hex') as NumberBase;
      if (!['decimal', 'hex', 'binary', 'octal'].includes(to)) return err(`Unknown target base: ${to}`);
      const lines = splitLines(input);
      const out: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].trim()) { out.push(lines[i]); continue; }
        const r = convertNumber(lines[i], from);
        if (!r.success) return err(lines.length > 1 ? `Line ${i + 1}: ${r.error}` : r.error);
        out.push(prefix ? r[to] : r[to].replace(/^0[xbo]/i, ''));
      }
      return ok(out.join('\n'));
    },
  },
];

export const operationsMap = new Map<string, Operation>(operations.map((o) => [o.id, o]));

export function getOperation(id: string): Operation | undefined {
  return operationsMap.get(id);
}

export function defaultParams(op: Operation): ParamValues {
  const out: ParamValues = {};
  for (const p of op.params ?? []) out[p.key] = p.default;
  return out;
}

/** Keep only known params with the right type; fill the rest from defaults. */
export function normalizeParams(op: Operation, raw: unknown): ParamValues {
  const out = defaultParams(op);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const src = raw as Record<string, unknown>;
  for (const def of op.params ?? []) {
    const v = src[def.key];
    if (def.type === 'checkbox') {
      if (typeof v === 'boolean') out[def.key] = v;
    } else if (typeof v === 'string') {
      if (def.type === 'select' && !def.options.some((o) => o.value === v)) continue;
      out[def.key] = v;
    }
  }
  return out;
}

export function searchOperations(query: string): Operation[] {
  const q = query.toLowerCase().trim();
  if (!q) return operations;
  return operations.filter((o) =>
    [o.id, o.label, o.category, o.description].join(' ').toLowerCase().includes(q),
  );
}

let uidCounter = 0;
export function createStep(opId: string, params?: unknown, enabled = true): RecipeStep {
  uidCounter += 1;
  const op = getOperation(opId);
  return {
    uid: `s${Date.now().toString(36)}${uidCounter.toString(36)}`,
    op: opId,
    params: op ? normalizeParams(op, params) : {},
    enabled,
  };
}

// ─── Engine ─────────────────────────────────────────────────────────────────

const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/**
 * Run each enabled step in order, feeding each output into the next.
 * Disabled steps are skipped (pass-through). Stops at the first failing step;
 * steps after it are reported as 'not-run'. Never throws.
 */
export async function runRecipe(input: string, steps: RecipeStep[]): Promise<RecipeRunResult> {
  const results: StepResult[] = [];
  let current = input;
  let failedIndex = -1;
  const start = now();

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (failedIndex !== -1) {
      results.push({ uid: step.uid, op: step.op, status: 'not-run', ok: false, ms: 0 });
      continue;
    }
    if (!step.enabled) {
      results.push({ uid: step.uid, op: step.op, status: 'skipped', ok: true, output: current, ms: 0 });
      continue;
    }
    const op = getOperation(step.op);
    const t0 = now();
    let res: Result<string>;
    if (!op) {
      res = err(`Unknown operation: ${step.op}`);
    } else {
      try {
        res = await op.run(current, normalizeParams(op, step.params));
      } catch (e) {
        res = err((e as Error)?.message || 'Operation failed');
      }
    }
    const ms = now() - t0;
    if (res.success) {
      current = typeof res.data === 'string' ? res.data : String(res.data);
      results.push({ uid: step.uid, op: step.op, status: 'ok', ok: true, output: current, ms });
    } else {
      failedIndex = i;
      results.push({ uid: step.uid, op: step.op, status: 'error', ok: false, error: res.error, ms });
    }
  }

  return {
    results,
    finalOutput: failedIndex === -1 ? current : null,
    failedIndex,
    totalMs: now() - start,
  };
}

// ─── Serialization ──────────────────────────────────────────────────────────

export const RECIPE_FORMAT_VERSION = 1;

/** Compact wire form: only non-default params, `off` only when disabled. */
export interface SerializedStep {
  op: string;
  args?: ParamValues;
  off?: true;
}

export interface SerializedRecipe {
  v: number;
  name?: string;
  steps: SerializedStep[];
}

export interface ParsedRecipe {
  name?: string;
  steps: RecipeStep[];
}

export function toSerializable(steps: RecipeStep[], name?: string): SerializedRecipe {
  const out: SerializedRecipe = { v: RECIPE_FORMAT_VERSION, steps: [] };
  if (name && name.trim()) out.name = name.trim();
  for (const s of steps) {
    const op = getOperation(s.op);
    const entry: SerializedStep = { op: s.op };
    if (op) {
      const defaults = defaultParams(op);
      const params = normalizeParams(op, s.params);
      const args: ParamValues = {};
      for (const [k, v] of Object.entries(params)) if (defaults[k] !== v) args[k] = v;
      if (Object.keys(args).length) entry.args = args;
    }
    if (!s.enabled) entry.off = true;
    out.steps.push(entry);
  }
  return out;
}

export function serializeRecipe(steps: RecipeStep[], name?: string): string {
  return JSON.stringify(toSerializable(steps, name));
}

/** Parse a recipe from JSON text or an already-parsed value. Never throws. */
export function parseRecipe(source: unknown): Result<ParsedRecipe> {
  let data: unknown = source;
  if (typeof source === 'string') {
    if (!source.trim()) return err('Recipe is empty');
    try {
      data = JSON.parse(source);
    } catch (e) {
      return err(`Invalid recipe JSON: ${(e as Error).message}`);
    }
  }

  let rawSteps: unknown;
  let name: string | undefined;
  if (Array.isArray(data)) {
    rawSteps = data;
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.v === 'number' && obj.v > RECIPE_FORMAT_VERSION) {
      return err(`Unsupported recipe version ${obj.v}`);
    }
    rawSteps = obj.steps;
    if (typeof obj.name === 'string' && obj.name.trim()) name = obj.name.trim();
  } else {
    return err('Recipe must be an object with a "steps" array');
  }
  if (!Array.isArray(rawSteps)) return err('Recipe must contain a "steps" array');

  const steps: RecipeStep[] = [];
  for (let i = 0; i < rawSteps.length; i++) {
    const raw = rawSteps[i];
    let opId: unknown;
    let args: unknown;
    let enabled = true;
    if (typeof raw === 'string') {
      opId = raw;
    } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const r = raw as Record<string, unknown>;
      opId = r.op;
      args = r.args ?? r.params;
      if (r.off === true || r.enabled === false) enabled = false;
    } else {
      return err(`Step ${i + 1} is malformed`);
    }
    if (typeof opId !== 'string' || !opId) return err(`Step ${i + 1} is missing an "op"`);
    if (!getOperation(opId)) return err(`Step ${i + 1}: unknown operation "${opId}"`);
    steps.push(createStep(opId, args, enabled));
  }
  return ok(name ? { name, steps } : { steps });
}

// ─── Saved recipes (localStorage list helpers, pure) ────────────────────────

export interface SavedRecipe {
  name: string;
  recipe: SerializedRecipe;
  savedAt: number;
}

/** Parse the persisted saved-recipes list, dropping anything invalid. Never throws. */
export function parseSavedRecipes(raw: string | null): SavedRecipe[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter((x): x is SavedRecipe =>
      !!x && typeof x === 'object' &&
      typeof (x as SavedRecipe).name === 'string' &&
      typeof (x as SavedRecipe).savedAt === 'number' &&
      parseRecipe((x as SavedRecipe).recipe).success,
    );
  } catch {
    return [];
  }
}

/** Insert or replace (by case-insensitive name) a saved recipe, newest first. */
export function upsertSavedRecipe(list: SavedRecipe[], entry: SavedRecipe): SavedRecipe[] {
  const key = entry.name.trim().toLowerCase();
  return [entry, ...list.filter((r) => r.name.trim().toLowerCase() !== key)];
}

// ─── Built-in examples ──────────────────────────────────────────────────────

export interface ExampleRecipe {
  label: string;
  hint?: string;
  input: string;
  recipe: SerializedRecipe;
}

export const exampleRecipes: ExampleRecipe[] = [
  {
    label: 'Decode JWT payload',
    input: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    recipe: { v: 1, name: 'Decode JWT payload', steps: [{ op: 'jwt-decode' }, { op: 'json-sort-keys' }] },
  },
  {
    label: 'Base64 → pretty JSON',
    input: 'eyJ1c2VyIjoiYWRhIiwicm9sZXMiOlsiYWRtaW4iLCJkZXYiXSwiYWN0aXZlIjp0cnVlLCJtZXRhIjp7ImlkIjo0Mn19',
    recipe: { v: 1, name: 'Base64 → pretty JSON', steps: [{ op: 'base64-decode' }, { op: 'json-beautify' }] },
  },
  {
    label: 'Slugify title',
    input: '   Hello World: 10 Tips & Tricks for Next.js!   ',
    recipe: { v: 1, name: 'Slugify title', steps: [{ op: 'trim' }, { op: 'slugify' }] },
  },
  {
    label: 'URL decode → sorted JSON',
    input: '%7B%22zeta%22%3A1%2C%22alpha%22%3A%7B%22delta%22%3A4%2C%22charlie%22%3A3%7D%2C%22beta%22%3A%5B2%2C1%5D%7D',
    recipe: { v: 1, name: 'URL decode → JSON → sort keys', steps: [{ op: 'url-decode' }, { op: 'json-sort-keys' }] },
  },
  {
    label: 'SHA-256 of trimmed text',
    input: '   hello world   \n',
    recipe: { v: 1, name: 'SHA-256 of trimmed text', steps: [{ op: 'trim' }, { op: 'hash', args: { algorithm: 'SHA-256' } }] },
  },
  {
    label: 'Clean up a list',
    input: 'banana\napple\n\ncherry\napple\n  \nBanana\nbanana',
    recipe: {
      v: 1,
      name: 'Clean up a list',
      steps: [{ op: 'remove-empty-lines' }, { op: 'unique-lines' }, { op: 'sort-lines', args: { ignoreCase: true } }],
    },
  },
];
