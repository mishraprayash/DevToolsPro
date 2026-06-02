import yaml from 'js-yaml';

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

export function validateYaml(input: string): ValidationResult {
  try {
    yaml.load(input);
    return { valid: true };
  } catch (e) {
    const err = e as any;
    return {
      valid: false,
      error: err.reason || err.message,
      line: err.mark ? err.mark.line + 1 : undefined
    };
  }
}

export function jsonToYaml(jsonStr: string, options: Partial<YamlJsonOptions> = {}): string {
  try {
    const parsed = JSON.parse(jsonStr);
    const opts = {
      indent: 2,
      skipInvalid: true,
      flowLevel: -1, // disable flow styles, force block styles
      ...options
    };
    return yaml.dump(parsed, {
      indent: opts.indent,
      skipInvalid: opts.skipInvalid,
      flowLevel: opts.flowLevel
    });
  } catch (e) {
    return `Invalid JSON: ${(e as Error).message}`;
  }
}

export function yamlToJson(yamlStr: string): string {
  try {
    // Support multi-document YAML strings (separated by ---)
    const docs = yaml.loadAll(yamlStr);
    if (docs.length === 0) return '';
    if (docs.length === 1) {
      return JSON.stringify(docs[0], null, 2);
    }
    // Return list of documents if there are multiple documents
    return JSON.stringify(docs, null, 2);
  } catch (e) {
    return `Invalid YAML: ${(e as Error).message}`;
  }
}
