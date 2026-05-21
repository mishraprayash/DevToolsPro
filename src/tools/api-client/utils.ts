export interface HeaderItem {
  key: string;
  value: string;
  enabled: boolean;
}

export interface ApiRequestResult {
  success: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timeMs: number;
  error?: string;
}

/**
 * Converts array of HeaderItems to Record<string, string> headers
 */
export function buildHeaders(items: HeaderItem[]): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const item of items) {
    if (item.enabled && item.key.trim()) {
      headers[item.key.trim()] = item.value;
    }
  }
  return headers;
}

/**
 * Safely parse JSON strings to verify validity
 */
export function isValidJson(val: string): boolean {
  if (!val.trim()) return true;
  try {
    JSON.parse(val);
    return true;
  } catch {
    return false;
  }
}
