import * as React from 'react';

export type ReactComponent = React.ComponentType<unknown>;

/**
 * Canonical Result type for all pure tool utilities in `src/tools/*\/utils.ts`.
 * Utilities must never throw to the UI — return a Result instead.
 */
export type Result<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

export function err<T = never>(error: string): Result<T> {
  return { success: false, error };
}

export function unwrap<T>(result: Result<T>, fallback: T): T {
  return result.success ? result.data : fallback;
}