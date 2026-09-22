import type { Result } from '@/types';
import { ok, err } from '@/types';

export interface YamlJsonOptions {
  indent: number;
  skipInvalid: boolean;
  flowLevel: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  line?: number;
}

// Dynamically import yaml to avoid blocking initial load
async function getYaml() {
  return (await import('js-yaml')).default;
}

export async function validateYaml(input: string): Promise<ValidationResult> {
  try {
    const yaml = await getYaml();
    yaml.load(input);
    return { valid: true };
  } catch (e) {
    const errObj = e as unknown as { reason?: string; message?: string; mark?: { line: number } };
    return {
      valid: false,
      error: errObj.reason || errObj.message,
      line: errObj.mark ? errObj.mark.line + 1 : undefined
    };
  }
}

export async function jsonToYamlResult(jsonStr: string, options: Partial<YamlJsonOptions> = {}): Promise<Result<string>> {
  try {
    const parsed = JSON.parse(jsonStr);
    const opts = {
      indent: 2,
      skipInvalid: true,
      flowLevel: -1,
      ...options
    };
    const yaml = await getYaml();
    const out = yaml.dump(parsed, {
      indent: opts.indent,
      skipInvalid: opts.skipInvalid,
      flowLevel: opts.flowLevel
    });
    return ok(out);
  } catch (e) {
    return err((e as Error).message || 'Invalid JSON');
  }
}

export async function yamlToJsonResult(yamlStr: string): Promise<Result<string>> {
  try {
    const yaml = await getYaml();
    const docs = yaml.loadAll(yamlStr);
    if (docs.length === 0) return ok('');
    if (docs.length === 1) return ok(JSON.stringify(docs[0], null, 2));
    return ok(JSON.stringify(docs, null, 2));
  } catch (e) {
    return err((e as Error).message || 'Invalid YAML');
  }
}

// Back-compat string wrappers — prefer the Result variants above in new code
export async function jsonToYaml(jsonStr: string, options: Partial<YamlJsonOptions> = {}): Promise<string> {
  const r = await jsonToYamlResult(jsonStr, options);
  return r.success ? r.data : `Invalid JSON: ${r.error}`;
}

export async function yamlToJson(yamlStr: string): Promise<string> {
  const r = await yamlToJsonResult(yamlStr);
  return r.success ? r.data : `Invalid YAML: ${r.error}`;
}
