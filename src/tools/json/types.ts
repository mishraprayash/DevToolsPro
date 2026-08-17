export type JsonAction = 'beautify' | 'minify' | 'validate' | 'sort';

export type JsonResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface JsonValidationResult {
  valid: boolean;
  error?: string;
  line?: number;
}

export interface JsonRepairResult {
  repaired: string;
  changes: string[];
}
