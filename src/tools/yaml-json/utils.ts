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
    const err = e as any;
    return {
      valid: false,
      error: err.reason || err.message,
      line: err.mark ? err.mark.line + 1 : undefined
    };
  }
}

export async function jsonToYaml(jsonStr: string, options: Partial<YamlJsonOptions> = {}): Promise<string> {
  try {
    const parsed = JSON.parse(jsonStr);
    const opts = {
      indent: 2,
      skipInvalid: true,
      flowLevel: -1, 
      ...options
    };
    const yaml = await getYaml();
    return yaml.dump(parsed, {
      indent: opts.indent,
      skipInvalid: opts.skipInvalid,
      flowLevel: opts.flowLevel
    });
  } catch (e) {
    return `Invalid JSON: ${(e as Error).message}`;
  }
}

export async function yamlToJson(yamlStr: string): Promise<string> {
  try {
    const yaml = await getYaml();
    const docs = yaml.loadAll(yamlStr);
    if (docs.length === 0) return '';
    if (docs.length === 1) {
      return JSON.stringify(docs[0], null, 2);
    }
    return JSON.stringify(docs, null, 2);
  } catch (e) {
    return `Invalid YAML: ${(e as Error).message}`;
  }
}
