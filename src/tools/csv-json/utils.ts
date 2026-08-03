export type Result<T> = { success: true; data: T } | { success: false; error: string };

export const DELIMITERS = [',', ';', '\t', '|'] as const;
export type Delimiter = (typeof DELIMITERS)[number];

export interface CsvToJsonOptions {
  delimiter: string;
  hasHeader: boolean;
  inferTypes: boolean;
}

export interface JsonToCsvOptions {
  delimiter: string;
  includeHeader: boolean;
}

/**
 * Parse CSV text into rows of cells, respecting RFC 4180 quoting rules
 * (quoted fields, escaped quotes via "", and newlines inside quotes).
 */
export function parseCsv(text: string, delimiter: string): Result<string[][]> {
  if (delimiter.length !== 1) {
    return { success: false, error: 'Delimiter must be a single character.' };
  }

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === delimiter) {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (ch === '\r') {
      i += 1;
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) {
    return { success: false, error: 'No CSV data found. Provide at least one row.' };
  }

  return { success: true, data: rows };
}

function inferScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === '') return value;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  return value;
}

function uniqueHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((h) => {
    const base = h.trim() || 'column';
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
}

export function csvToJson(text: string, options: CsvToJsonOptions): Result<unknown> {
  const parsed = parseCsv(text, options.delimiter);
  if (!parsed.success) return parsed;

  const rows = parsed.data;
  if (rows.length === 1 && rows[0].length === 1 && rows[0][0] === '') {
    return { success: false, error: 'CSV input is empty.' };
  }

  if (!options.hasHeader) {
    const data = rows.map((r) =>
      options.inferTypes ? r.map(inferScalar) : r.map((c) => c)
    );
    return { success: true, data };
  }

  const headers = uniqueHeaders(rows[0]);
  const records = rows.slice(1).map((r) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      const cell = r[idx] ?? '';
      obj[h] = options.inferTypes ? inferScalar(cell) : cell;
    });
    return obj;
  });

  return { success: true, data: records };
}

function escapeCsvCell(value: unknown, delimiter: string): string {
  const s = value === null || value === undefined ? '' : String(value);
  if (s.includes(delimiter) || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function jsonToCsv(value: string, options: JsonToCsvOptions): Result<string> {
  let data: unknown;
  try {
    data = JSON.parse(value);
  } catch {
    return { success: false, error: 'Invalid JSON. Check for missing quotes, brackets, or trailing commas.' };
  }

  if (!Array.isArray(data) || data.length === 0) {
    return { success: false, error: 'JSON must be a non-empty array of objects or arrays.' };
  }

  const allObjects = data.every((item) => item !== null && typeof item === 'object' && !Array.isArray(item));

  let headers: string[];
  let rows: unknown[][];

  if (allObjects) {
    const keys = data.flatMap((item) => Object.keys(item as Record<string, unknown>));
    headers = uniqueHeaders([...new Set(keys)]);
    rows = data.map((item) => {
      const obj = item as Record<string, unknown>;
      return headers.map((h) => obj[h] ?? '');
    });
  } else {
    const maxLen = Math.max(
      1,
      ...data.map((r) => (Array.isArray(r) ? r.length : 1))
    );
    headers = Array.from({ length: maxLen }, (_, idx) => `column_${idx + 1}`);
    rows = data.map((r) => {
      const arr = Array.isArray(r) ? r : [r];
      return Array.from({ length: maxLen }, (_, idx) => arr[idx] ?? '');
    });
  }

  const lines: string[] = [];
  if (options.includeHeader && allObjects) {
    lines.push(headers.map((h) => escapeCsvCell(h, options.delimiter)).join(options.delimiter));
  }
  for (const row of rows) {
    lines.push(row.map((cell) => escapeCsvCell(cell, options.delimiter)).join(options.delimiter));
  }

  return { success: true, data: lines.join('\n') };
}

/**
 * Guess the most likely delimiter by counting occurrences on the first
 * logical line, ignoring values wrapped in double quotes.
 */
export function detectDelimiter(text: string): Delimiter {
  const line = text.split(/\r?\n/, 1)[0] ?? '';
  const scores: Array<[Delimiter, number]> = DELIMITERS.map((d) => {
    let inQuotes = false;
    let count = 0;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          i += 1;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === d && !inQuotes) count += 1;
    }
    return [d, count];
  });

  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][0];
}

export function formatJson(value: unknown, indent = 2): string {
  return JSON.stringify(value, null, indent);
}
