// Target builders for <OpenInMenu />: each returns the destination tool id plus the
// partial state that tool picks up from the sessionStorage handoff (see toolHandoff.ts).
// A null payload means "nothing to send", which disables that menu entry.

export interface OpenInTarget {
  /** Registry id of the destination tool (e.g. "json"). */
  toolId: string;
  /** Overrides the registry name shown in the menu / single button. */
  label?: string;
  /** Short secondary line under the label in the menu. */
  hint?: string;
  /** Partial state handed to the destination. `null` disables this target. */
  payload: Record<string, unknown> | null;
  /** Name of the workspace tab the destination opens. */
  tabName: string;
}

const has = (s: string | null | undefined): s is string => typeof s === 'string' && s.trim().length > 0;

/** JSON Beautifier, opened in beautify mode. */
export function jsonToolTarget(input: string | null | undefined, tabName: string, hint?: string): OpenInTarget {
  return {
    toolId: 'json',
    label: 'JSON Tool',
    hint,
    payload: has(input) ? { input, action: 'beautify', activeExample: -1 } : null,
    tabName,
  };
}

/** Plain `{ input }` handoff for tools whose only seed is their input text. */
export function inputTarget(
  toolId: string,
  input: string | null | undefined,
  tabName: string,
  extra?: { label?: string; hint?: string }
): OpenInTarget {
  return { toolId, ...extra, payload: has(input) ? { input } : null, tabName };
}

/** JSON → YAML (yaml-json `mode: 'json'` means the input is JSON). */
export function jsonToYamlTarget(json: string | null | undefined, tabName: string): OpenInTarget {
  return {
    toolId: 'yaml-json',
    label: 'YAML',
    hint: 'Convert JSON → YAML',
    payload: has(json) ? { input: json, mode: 'json', output: '', error: null, activeExample: -1 } : null,
    tabName,
  };
}

/** JSON → XML (xml-json `mode: 'json'` means the input is JSON). */
export function jsonToXmlTarget(json: string | null | undefined, tabName: string): OpenInTarget {
  return {
    toolId: 'xml-json',
    label: 'XML',
    hint: 'Convert JSON → XML',
    payload: has(json) ? { input: json, mode: 'json', output: '', activeExample: -1 } : null,
    tabName,
  };
}

/** JSON array → CSV. */
export function jsonToCsvTarget(json: string | null | undefined, tabName: string): OpenInTarget {
  return {
    toolId: 'csv-json',
    label: 'CSV',
    hint: 'Convert JSON array → CSV',
    payload: has(json) ? { input: json, mode: 'json-to-csv' } : null,
    tabName,
  };
}

/** The standard set of JSON consumers offered from any JSON output. */
export function jsonConsumerTargets(json: string | null | undefined, tabName: string, opts?: { csv?: boolean }): OpenInTarget[] {
  const targets: OpenInTarget[] = [
    inputTarget('json-to-ts', json, tabName, { label: 'JSON to TypeScript', hint: 'Generate interfaces' }),
    inputTarget('json-schema', json, tabName, { label: 'JSON Schema', hint: 'Generate a validation schema' }),
    inputTarget('jsonpath', json, tabName, { label: 'JSONPath Playground', hint: 'Query this document' }),
    jsonToYamlTarget(json, tabName),
    jsonToXmlTarget(json, tabName),
  ];
  if (opts?.csv) targets.push(jsonToCsvTarget(json, tabName));
  return targets;
}
