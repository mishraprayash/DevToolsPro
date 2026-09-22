import type { Result } from '@/types';
import { ok, err } from '@/types';

export interface XmlJsonOptions {
  ignoreAttributes?: boolean;
  attributePrefix?: string;
  parseValues?: boolean;
  indent?: number;
  format?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  line?: number;
}

// Dynamically import fast-xml-parser to avoid blocking initial load
async function getFastXmlParser() {
  return await import('fast-xml-parser');
}

export async function validateXml(input: string): Promise<ValidationResult> {
  if (!input.trim()) {
    return { valid: false, error: 'Input is empty' };
  }
  try {
    const { XMLValidator } = await getFastXmlParser();
    const result = XMLValidator.validate(input);
    if (result === true) {
      return { valid: true };
    } else {
      return {
        valid: false,
        error: result.err.msg,
        line: result.err.line,
      };
    }
  } catch (e) {
    return {
      valid: false,
      error: (e as Error).message || 'Failed to validate XML',
    };
  }
}

export async function xmlToJsonResult(xmlStr: string, options: XmlJsonOptions = {}): Promise<Result<string>> {
  if (!xmlStr.trim()) {
    return err('Input is empty');
  }
  try {
    const validation = await validateXml(xmlStr);
    if (!validation.valid) {
      const lineMsg = validation.line ? ` (Line: ${validation.line})` : '';
      return err(`Invalid XML: ${validation.error ?? 'Syntax error'}${lineMsg}`.trim());
    }

    const { XMLParser } = await getFastXmlParser();
    const parser = new XMLParser({
      ignoreAttributes: options.ignoreAttributes ?? false,
      attributeNamePrefix: options.attributePrefix ?? '@_',
      parseAttributeValue: options.parseValues ?? true,
      parseTagValue: options.parseValues ?? true,
      trimValues: true,
    });
    const parsed = parser.parse(xmlStr);
    return ok(JSON.stringify(parsed, null, options.indent ?? 2));
  } catch (e) {
    return err((e as Error).message || 'Invalid XML');
  }
}

export async function jsonToXmlResult(jsonStr: string, options: XmlJsonOptions = {}): Promise<Result<string>> {
  if (!jsonStr.trim()) {
    return err('Input is empty');
  }
  try {
    const parsed = JSON.parse(jsonStr);
    const { XMLBuilder } = await getFastXmlParser();
    const builder = new XMLBuilder({
      ignoreAttributes: options.ignoreAttributes ?? false,
      attributeNamePrefix: options.attributePrefix ?? '@_',
      format: options.format ?? true,
      indentBy: ' '.repeat(options.indent ?? 2),
    });
    return ok(builder.build(parsed));
  } catch (e) {
    return err((e as Error).message || 'Invalid JSON');
  }
}

// Back-compat string wrappers
export async function xmlToJson(xmlStr: string, options: XmlJsonOptions = {}): Promise<string> {
  const r = await xmlToJsonResult(xmlStr, options);
  if (r.success) return r.data;
  return r.error.startsWith('Invalid') ? r.error : `Invalid XML: ${r.error}`;
}

export async function jsonToXml(jsonStr: string, options: XmlJsonOptions = {}): Promise<string> {
  const r = await jsonToXmlResult(jsonStr, options);
  if (r.success) return r.data;
  return r.error.startsWith('Invalid') ? r.error : `Invalid JSON: ${r.error}`;
}
