import type { JsonAction, JsonResult, JsonValidationResult } from '../types';

export function parseJson(input: string): JsonResult<unknown> {
  try {
    const data = JSON.parse(input);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export function beautifyJson(input: string, indent: number = 2): string {
  const parsed = parseJson(input);
  if (!parsed.success) return input;
  return JSON.stringify(parsed.data, null, indent);
}

export function minifyJson(input: string): string {
  const parsed = parseJson(input);
  if (!parsed.success) return input;
  return JSON.stringify(parsed.data);
}

export function sortJsonKeys(input: string): string {
  const parsed = parseJson(input);
  if (!parsed.success) return input;

  const sortObject = (obj: unknown): unknown => {
    if (Array.isArray(obj)) {
      return obj.map(sortObject);
    }
    if (obj !== null && typeof obj === 'object') {
      const sorted: Record<string, unknown> = {};
      const keys = Object.keys(obj as Record<string, unknown>).sort();
      for (const key of keys) {
        sorted[key] = sortObject((obj as Record<string, unknown>)[key]);
      }
      return sorted;
    }
    return obj;
  };

  return JSON.stringify(sortObject(parsed.data), null, 2);
}

export function validateJson(input: string): JsonValidationResult {
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (e) {
    const error = e as SyntaxError;
    const match = error.message.match(/position (\d+)/);
    const position = match ? parseInt(match[1], 10) : undefined;
    const line = position !== undefined ? input.substring(0, position).split('\n').length : undefined;
    return { valid: false, error: error.message, line };
  }
}

export function processJson(input: string, action: JsonAction, indent: number = 2): string {
  switch (action) {
    case 'beautify':
      return beautifyJson(input, indent);
    case 'minify':
      return minifyJson(input);
    case 'sort':
      return sortJsonKeys(input);
    case 'validate': {
      const result = validateJson(input);
      if (!result.valid) {
        throw new Error(result.error);
      }
      return input;
    }
    default:
      return input;
  }
}
