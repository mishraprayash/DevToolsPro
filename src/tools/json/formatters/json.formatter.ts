import type { JsonAction, JsonResult, JsonValidationResult } from '../types';

export function parseJson(input: string): JsonResult<unknown> {
  try {
    const data = JSON.parse(input);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export function beautifyJson(input: string, indent: number = 2): import('../types').JsonResult<string> {
  const parsed = parseJson(input);
  if (!parsed.success) return { success: false, error: parsed.error };
  try {
    return { success: true, data: JSON.stringify(parsed.data, null, indent) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export function minifyJson(input: string): import('../types').JsonResult<string> {
  const parsed = parseJson(input);
  if (!parsed.success) return { success: false, error: parsed.error };
  try {
    return { success: true, data: JSON.stringify(parsed.data) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export function sortJsonKeys(input: string, indent: number = 2): import('../types').JsonResult<string> {
  const parsed = parseJson(input);
  if (!parsed.success) return { success: false, error: parsed.error };

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

  try {
    return { success: true, data: JSON.stringify(sortObject(parsed.data), null, indent) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
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

export function processJson(input: string, action: JsonAction, indent: number = 2): import('../types').JsonResult<string> {
  switch (action) {
    case 'beautify':
      return beautifyJson(input, indent);
    case 'minify':
      return minifyJson(input);
    case 'sort':
      return sortJsonKeys(input, indent);
    case 'validate': {
      const result = validateJson(input);
      if (!result.valid) return { success: false, error: result.error ?? 'Invalid JSON' };
      return { success: true, data: input };
    }
    default:
      return { success: false, error: `Unknown action: ${String(action)}` };
  }
}

/**
 * Back-compat wrappers that return raw strings for legacy UI code.
 * Prefer the Result-returning variants above in new code.
 */
export function beautifyJsonString(input: string, indent: number = 2): string {
  const r = beautifyJson(input, indent);
  return r.success ? r.data : input;
}
export function minifyJsonString(input: string): string {
  const r = minifyJson(input);
  return r.success ? r.data : input;
}
export function sortJsonKeysString(input: string): string {
  const r = sortJsonKeys(input);
  return r.success ? r.data : input;
}
