import { describe, it, expect } from 'vitest';
import { toolHref, prefillFromState, prefillFromSearch, stripPrefillParam } from '../toolHandoff';

describe('toolHref', () => {
  it('should link to the tool without input', () => {
    expect(toolHref('hash')).toBe('/tools/hash');
    expect(toolHref('hash', '')).toBe('/tools/hash');
  });

  it('should encode input as the ?input= param', () => {
    expect(toolHref('hash', 'hello')).toBe('/tools/hash?input=hello');
    expect(toolHref('subnet', '10.0.0.0/8')).toBe('/tools/subnet?input=10.0.0.0%2F8');
    expect(toolHref('url-parser', 'a b&c=d#e')).toBe('/tools/url-parser?input=a%20b%26c%3Dd%23e');
  });

  it('should round-trip through prefillFromSearch', () => {
    const input = '{"a": [1, 2]} & ?#/%';
    const href = toolHref('json-to-ts', input);
    expect(prefillFromSearch(href.slice(href.indexOf('?')))).toEqual({ input });
  });
});

describe('prefillFromState', () => {
  it('should accept state with a non-empty string input and keep extras', () => {
    expect(prefillFromState({ input: 'x' })).toEqual({ input: 'x' });
    expect(prefillFromState({ input: 'x', pattern: '\\d+' })).toEqual({ input: 'x', pattern: '\\d+' });
  });

  it('should reject missing, empty or non-string input', () => {
    expect(prefillFromState(null)).toBeNull();
    expect(prefillFromState(undefined)).toBeNull();
    expect(prefillFromState('input')).toBeNull();
    expect(prefillFromState([])).toBeNull();
    expect(prefillFromState({})).toBeNull();
    expect(prefillFromState({ input: '' })).toBeNull();
    expect(prefillFromState({ input: 42 })).toBeNull();
  });
});

describe('prefillFromSearch', () => {
  it('should read the input param', () => {
    expect(prefillFromSearch('?input=hello')).toEqual({ input: 'hello' });
    expect(prefillFromSearch('?tab=2&input=a%2Bb')).toEqual({ input: 'a+b' });
  });

  it('should return null when absent or empty', () => {
    expect(prefillFromSearch('')).toBeNull();
    expect(prefillFromSearch('?tab=2')).toBeNull();
    expect(prefillFromSearch('?input=')).toBeNull();
  });
});

describe('stripPrefillParam', () => {
  it('should remove only the input param, preserving other params and the hash', () => {
    expect(stripPrefillParam('/tools/hash', '?input=hello', '')).toBe('/tools/hash');
    expect(stripPrefillParam('/tools/hash', '?a=1&input=x&b=2', '#top')).toBe('/tools/hash?a=1&b=2#top');
    expect(stripPrefillParam('/tools/json', '?input=x', '#share=abc')).toBe('/tools/json#share=abc');
  });

  it('should return null when there is no input param', () => {
    expect(stripPrefillParam('/tools/hash', '', '')).toBeNull();
    expect(stripPrefillParam('/tools/hash', '?a=1', '#x')).toBeNull();
  });
});
