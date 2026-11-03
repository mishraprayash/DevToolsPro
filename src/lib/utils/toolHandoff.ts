// Cross-tool handoff: one tool stages partial workspace state for another,
// which picks it up via useWorkspaces on mount and opens it in a new tab.
// Uses sessionStorage so payloads aren't size-limited like URL hashes.

export interface ToolHandoff<T> {
  name: string;
  state: Partial<T>;
}

const handoffKey = (storageKey: string) => `devtools-handoff-${storageKey}`;

export function sendToTool<T>(storageKey: string, state: Partial<T>, name: string): boolean {
  try {
    sessionStorage.setItem(handoffKey(storageKey), JSON.stringify({ name, state }));
    return true;
  } catch {
    return false;
  }
}

export function readToolHandoff<T>(storageKey: string): ToolHandoff<T> | null {
  try {
    const raw = sessionStorage.getItem(handoffKey(storageKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.state || typeof parsed.state !== 'object') return null;
    return { name: typeof parsed.name === 'string' ? parsed.name : 'Imported', state: parsed.state };
  } catch {
    return null;
  }
}

export function clearToolHandoff(storageKey: string): void {
  try {
    sessionStorage.removeItem(handoffKey(storageKey));
  } catch {
    // ignore
  }
}

// --- Prefill helpers -------------------------------------------------------
// Any tool can be opened pre-filled, either via a handoff payload (sendToTool)
// or a deep link (`/tools/<id>?input=...`). Payload state always carries `input`.

export const PREFILL_QUERY_PARAM = 'input';

export type ToolPrefill = { input: string } & Record<string, unknown>;

/** Link to a tool, optionally pre-filled via the `?input=` deep-link param. */
export function toolHref(toolId: string, input?: string): string {
  const base = `/tools/${toolId}`;
  return input ? `${base}?${PREFILL_QUERY_PARAM}=${encodeURIComponent(input)}` : base;
}

/** Validates handoff state as a prefill payload: requires a non-empty string `input`. */
export function prefillFromState(state: unknown): ToolPrefill | null {
  if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
  const input = (state as Record<string, unknown>).input;
  if (typeof input !== 'string' || input === '') return null;
  return state as ToolPrefill;
}

/** Reads a non-empty `?input=` value from a URL search string (e.g. `location.search`). */
export function prefillFromSearch(search: string): ToolPrefill | null {
  try {
    const input = new URLSearchParams(search).get(PREFILL_QUERY_PARAM);
    return input ? { input } : null;
  } catch {
    return null;
  }
}

/**
 * Returns `pathname + search + hash` with the `input` param removed (other params and
 * the hash preserved), or null when there is no `input` param to strip.
 */
export function stripPrefillParam(pathname: string, search: string, hash: string): string | null {
  try {
    const params = new URLSearchParams(search);
    if (!params.has(PREFILL_QUERY_PARAM)) return null;
    params.delete(PREFILL_QUERY_PARAM);
    const rest = params.toString();
    return `${pathname}${rest ? `?${rest}` : ''}${hash}`;
  } catch {
    return null;
  }
}

/** Schedules removal of the `?input=` param from the address bar on the next tick. */
export function scheduleStripPrefillParam(): void {
  setTimeout(() => {
    try {
      const { pathname, search, hash } = window.location;
      const next = stripPrefillParam(pathname, search, hash);
      if (next !== null) window.history.replaceState(null, '', next);
    } catch {
      // ignore
    }
  }, 0);
}
