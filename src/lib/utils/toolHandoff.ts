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
