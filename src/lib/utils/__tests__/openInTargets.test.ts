import { describe, it, expect } from 'vitest';
import { jsonToolTarget, inputTarget, jsonConsumerTargets, jsonToYamlTarget, jsonToXmlTarget } from '../openInTargets';

describe('openInTargets', () => {
  it('builds a JSON tool target in beautify mode', () => {
    expect(jsonToolTarget('{"a":1}', 'Tab')).toEqual({
      toolId: 'json',
      label: 'JSON Tool',
      hint: undefined,
      payload: { input: '{"a":1}', action: 'beautify', activeExample: -1 },
      tabName: 'Tab',
    });
  });

  it('nulls the payload when there is nothing to send', () => {
    expect(jsonToolTarget('   ', 'T').payload).toBeNull();
    expect(inputTarget('url-parser', '', 'T').payload).toBeNull();
    expect(inputTarget('url-parser', null, 'T').payload).toBeNull();
    expect(inputTarget('url-parser', 'https://x', 'T').payload).toEqual({ input: 'https://x' });
  });

  it('sets converter modes so the payload is read as JSON input', () => {
    expect(jsonToYamlTarget('{}', 'T').payload).toMatchObject({ input: '{}', mode: 'json' });
    expect(jsonToXmlTarget('{}', 'T').payload).toMatchObject({ input: '{}', mode: 'json' });
  });

  it('only offers CSV when asked', () => {
    expect(jsonConsumerTargets('[1]', 'T').map((t) => t.toolId)).toEqual(['json-to-ts', 'json-schema', 'jsonpath', 'yaml-json', 'xml-json']);
    const withCsv = jsonConsumerTargets('[1]', 'T', { csv: true });
    expect(withCsv.at(-1)).toMatchObject({ toolId: 'csv-json', payload: { input: '[1]', mode: 'json-to-csv' } });
  });
});
