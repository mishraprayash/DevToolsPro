import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';

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

export function validateXml(input: string): ValidationResult {
  if (!input.trim()) {
    return { valid: false, error: 'Input is empty' };
  }
  const result = XMLValidator.validate(input);
  if (result === true) {
    return { valid: true };
  } else {
    return {
      valid: false,
      error: result.err.msg,
      line: result.err.line
    };
  }
}

export function validateJson(input: string): ValidationResult {
  if (!input.trim()) {
    return { valid: false, error: 'Input is empty' };
  }
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (e) {
    const msg = (e as Error).message;
    const match = msg.match(/position\s+(\d+)/i);
    let line: number | undefined;
    if (match) {
      const pos = parseInt(match[1], 10);
      line = input.slice(0, pos).split('\n').length;
    }
    return { valid: false, error: msg, line };
  }
}

export function xmlToJson(xmlStr: string, options: XmlJsonOptions = {}): string {
  try {
    const validation = validateXml(xmlStr);
    if (!validation.valid) {
      return `Invalid XML: ${validation.error} ${validation.line ? `(Line: ${validation.line})` : ''}`;
    }

    const parser = new XMLParser({
      ignoreAttributes: options.ignoreAttributes ?? false,
      attributeNamePrefix: options.attributePrefix ?? '@_',
      parseAttributeValue: options.parseValues ?? true,
      parseTagValue: options.parseValues ?? true,
      trimValues: true,
    });
    const parsed = parser.parse(xmlStr);
    return JSON.stringify(parsed, null, options.indent ?? 2);
  } catch (e) {
    return `Invalid XML: ${(e as Error).message}`;
  }
}

export function jsonToXml(jsonStr: string, options: XmlJsonOptions = {}): string {
  try {
    const validation = validateJson(jsonStr);
    if (!validation.valid) {
      return `Invalid JSON: ${validation.error} ${validation.line ? `(Line: ${validation.line})` : ''}`;
    }

    const parsed = JSON.parse(jsonStr);
    const builder = new XMLBuilder({
      ignoreAttributes: options.ignoreAttributes ?? false,
      attributeNamePrefix: options.attributePrefix ?? '@_',
      format: options.format ?? true,
      indentBy: ' '.repeat(options.indent ?? 2),
    });
    return builder.build(parsed);
  } catch (e) {
    return `Invalid JSON: ${(e as Error).message}`;
  }
}
