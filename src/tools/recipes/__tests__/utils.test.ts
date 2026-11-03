import { describe, it, expect } from 'vitest';
import {
  operations,
  getOperation,
  createStep,
  runRecipe,
  serializeRecipe,
  parseRecipe,
  toSerializable,
  normalizeParams,
  defaultParams,
  searchOperations,
  splitWords,
  toCase,
  exampleRecipes,
  parseSavedRecipes,
  upsertSavedRecipe,
  type RecipeStep,
} from '../utils';

const step = (op: string, params?: Record<string, unknown>, enabled = true): RecipeStep => createStep(op, params, enabled);

async function runOp(op: string, input: string, params?: Record<string, unknown>) {
  const res = await runRecipe(input, [step(op, params)]);
  return res.results[0];
}

describe('operation catalogue', () => {
  it('has unique ids and every op has label/category/run', () => {
    const ids = operations.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const o of operations) {
      expect(o.label).toBeTruthy();
      expect(o.category).toBeTruthy();
      expect(typeof o.run).toBe('function');
    }
  });

  it('select param defaults are valid options', () => {
    for (const o of operations) {
      for (const p of o.params ?? []) {
        if (p.type === 'select') expect(p.options.some((x) => x.value === p.default)).toBe(true);
      }
    }
  });

  it('no op throws on empty or garbage input', async () => {
    for (const o of operations) {
      for (const input of ['', '\u0000￿%%%{{{', '<<<']) {
        const r = await o.run(input, defaultParams(o));
        expect(typeof r.success).toBe('boolean');
      }
    }
  });

  it('searchOperations matches label, id, category and description', () => {
    expect(searchOperations('').length).toBe(operations.length);
    expect(searchOperations('base64').map((o) => o.id)).toEqual(expect.arrayContaining(['base64-encode', 'base64-decode']));
    expect(searchOperations('HASHING').some((o) => o.id === 'hash')).toBe(true);
    expect(searchOperations('jsonpath').some((o) => o.id === 'jsonpath')).toBe(true);
    expect(searchOperations('zzz-nothing')).toEqual([]);
  });
});

describe('encoding operations', () => {
  it('base64 round-trips unicode', async () => {
    const enc = await runOp('base64-encode', 'héllo 🌍');
    expect(enc.ok).toBe(true);
    const dec = await runOp('base64-decode', enc.output!);
    expect(dec.output).toBe('héllo 🌍');
  });

  it('base64 url-safe encode strips padding and decode auto-detects', async () => {
    const enc = await runOp('base64-encode', '??>>', { urlSafe: true });
    expect(enc.output).not.toMatch(/[+/=]/);
    const dec = await runOp('base64-decode', enc.output!);
    expect(dec.output).toBe('??>>');
  });

  it('base64 decode rejects invalid input', async () => {
    const r = await runOp('base64-decode', 'not base64!!');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/invalid/i);
  });

  it('url encode/decode, including + as space', async () => {
    expect((await runOp('url-encode', 'a b&c')).output).toBe('a%20b%26c');
    expect((await runOp('url-encode', "it's", { mode: 'strict' })).output).toBe('it%27s');
    expect((await runOp('url-decode', 'a%20b')).output).toBe('a b');
    expect((await runOp('url-decode', 'a+b', { plus: true })).output).toBe('a b');
    expect((await runOp('url-decode', '%E0%A4%A')).ok).toBe(false);
  });

  it('html entities encode/decode', async () => {
    expect((await runOp('html-encode', '<a href="x">&</a>')).output).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
    expect((await runOp('html-encode', '<', { mode: 'decimal' })).output).toBe('&#60;');
    expect((await runOp('html-decode', '&lt;b&gt;&#65;&#x42;')).output).toBe('<b>AB');
  });

  it('hex encode with separators and decode tolerant of separators', async () => {
    expect((await runOp('hex-encode', 'Hi')).output).toBe('4869');
    expect((await runOp('hex-encode', 'Hi', { separator: 'colon', upper: true })).output).toBe('48:69');
    expect((await runOp('hex-encode', 'é', { separator: 'space' })).output).toBe('c3 a9');
    expect((await runOp('hex-decode', '48 69')).output).toBe('Hi');
    expect((await runOp('hex-decode', '0x48:0x69')).output).toBe('Hi');
    expect((await runOp('hex-decode', 'zz')).ok).toBe(false);
    expect((await runOp('hex-decode', 'abc')).ok).toBe(false);
  });
});

describe('hashing', () => {
  it('computes SHA-256, SHA-1 and MD5', async () => {
    expect((await runOp('hash', 'hello world')).output).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    expect((await runOp('hash', 'abc', { algorithm: 'SHA-1' })).output).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect((await runOp('hash', 'abc', { algorithm: 'MD5' })).output).toBe('900150983cd24fb0d6963f7d28e17f72');
  });

  it('supports uppercase output; invalid algorithm falls back to default', async () => {
    expect((await runOp('hash', 'abc', { algorithm: 'MD5', upper: true })).output).toBe('900150983CD24FB0D6963F7D28E17F72');
    // normalizeParams drops the unknown select value → default SHA-256
    expect((await runOp('hash', 'hello world', { algorithm: 'CRC32' })).output).toHaveLength(64);
  });
});

describe('json operations', () => {
  it('beautify / minify / sort keys', async () => {
    expect((await runOp('json-beautify', '{"a":1}')).output).toBe('{\n  "a": 1\n}');
    expect((await runOp('json-beautify', '{"a":{"b":1}}', { indent: 'tab' })).output).toBe('{\n\t"a": {\n\t\t"b": 1\n\t}\n}');
    expect((await runOp('json-beautify', '{"a":1}', { indent: '4' })).output).toBe('{\n    "a": 1\n}');
    expect((await runOp('json-minify', '{ "a" : [1, 2] }')).output).toBe('{"a":[1,2]}');
    expect((await runOp('json-sort-keys', '{"b":1,"a":{"d":1,"c":2}}')).output).toBe('{\n  "a": {\n    "c": 2,\n    "d": 1\n  },\n  "b": 1\n}');
  });

  it('reports invalid JSON', async () => {
    const r = await runOp('json-beautify', '{oops');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Invalid JSON/);
  });

  it('JSONPath extract with unwrap', async () => {
    const doc = '{"users":[{"name":"ada"},{"name":"bob"}]}';
    expect((await runOp('jsonpath', doc, { path: '$.users[*].name' })).output).toBe('[\n  "ada",\n  "bob"\n]');
    expect((await runOp('jsonpath', doc, { path: '$.users[0].name' })).output).toBe('ada');
    expect((await runOp('jsonpath', doc, { path: '$.users[0]' })).output).toBe('{\n  "name": "ada"\n}');
    expect((await runOp('jsonpath', doc, { path: '$.users[0].name', unwrap: false })).output).toBe('[\n  "ada"\n]');
    expect((await runOp('jsonpath', doc, { path: '' })).ok).toBe(false);
    expect((await runOp('jsonpath', 'nope', { path: '$' })).ok).toBe(false);
  });
});

describe('format conversions', () => {
  it('yaml ↔ json', async () => {
    expect((await runOp('yaml-to-json', 'a: 1\nb: [x, y]')).output).toBe('{\n  "a": 1,\n  "b": [\n    "x",\n    "y"\n  ]\n}');
    expect((await runOp('json-to-yaml', '{"a":1}')).output).toBe('a: 1\n');
    expect((await runOp('json-to-yaml', '{bad')).ok).toBe(false);
  });

  it('xml ↔ json', async () => {
    const r = await runOp('xml-to-json', '<root><a>1</a></root>');
    expect(JSON.parse(r.output!)).toEqual({ root: { a: 1 } });
    const back = await runOp('json-to-xml', '{"root":{"a":1}}');
    expect(back.output).toContain('<a>1</a>');
    expect((await runOp('xml-to-json', '<a><b></a>')).ok).toBe(false);
  });
});

describe('text operations', () => {
  it('splitWords handles mixed identifiers', () => {
    expect(splitWords('helloWorld foo_bar-baz XMLHttpRequest')).toEqual(['hello', 'World', 'foo', 'bar', 'baz', 'XML', 'Http', 'Request']);
  });

  it('case conversions work per line', () => {
    expect(toCase('hello world', 'camel')).toBe('helloWorld');
    expect(toCase('hello world', 'pascal')).toBe('HelloWorld');
    expect(toCase('helloWorld', 'snake')).toBe('hello_world');
    expect(toCase('Hello World', 'kebab')).toBe('hello-world');
    expect(toCase('hello-world', 'constant')).toBe('HELLO_WORLD');
    expect(toCase('one two\nthree four', 'camel')).toBe('oneTwo\nthreeFour');
  });

  it('upper / lower / title / trim / reverse / slugify', async () => {
    expect((await runOp('upper-case', 'abc')).output).toBe('ABC');
    expect((await runOp('lower-case', 'ABC')).output).toBe('abc');
    expect((await runOp('title-case', 'hello wORLD')).output).toBe('Hello World');
    expect((await runOp('trim', '  x  ')).output).toBe('x');
    expect((await runOp('reverse', 'ab🌍')).output).toBe('🌍ba');
    expect((await runOp('slugify', 'Héllo, World!')).output).toBe('hello-world');
    expect((await runOp('camel-case', 'foo bar')).output).toBe('fooBar');
  });
});

describe('line operations', () => {
  it('sort lines (plain, desc, numeric, ignore case)', async () => {
    expect((await runOp('sort-lines', 'b\na\nC')).output).toBe('C\na\nb');
    expect((await runOp('sort-lines', 'b\na\nC', { ignoreCase: true })).output).toBe('a\nb\nC');
    expect((await runOp('sort-lines', 'a\nb', { order: 'desc' })).output).toBe('b\na');
    expect((await runOp('sort-lines', '10\n9\n100', { numeric: true })).output).toBe('9\n10\n100');
  });

  it('unique / remove empty / reverse lines', async () => {
    expect((await runOp('unique-lines', 'a\nb\na\nA')).output).toBe('a\nb\nA');
    expect((await runOp('unique-lines', 'a\nb\na\nA', { ignoreCase: true })).output).toBe('a\nb');
    expect((await runOp('remove-empty-lines', 'a\n\n  \r\nb')).output).toBe('a\nb');
    expect((await runOp('reverse-lines', '1\n2\n3')).output).toBe('3\n2\n1');
  });
});

describe('regex replace', () => {
  it('replaces with backrefs and flags', async () => {
    expect((await runOp('regex-replace', 'a1 b2', { pattern: '([a-z])(\\d)', flags: 'g', replacement: '$2$1' })).output).toBe('1a 2b');
    expect((await runOp('regex-replace', 'A a', { pattern: 'a', flags: 'gi', replacement: 'x' })).output).toBe('x x');
    expect((await runOp('regex-replace', 'aaa', { pattern: 'a', flags: '', replacement: 'b' })).output).toBe('baa');
  });

  it('empty pattern passes through; invalid pattern/flags fail', async () => {
    expect((await runOp('regex-replace', 'keep', { pattern: '' })).output).toBe('keep');
    expect((await runOp('regex-replace', 'x', { pattern: '(' })).ok).toBe(false);
    expect((await runOp('regex-replace', 'x', { pattern: 'x', flags: 'q' })).ok).toBe(false);
  });
});

describe('jwt + number base', () => {
  const jwt = exampleRecipes[0].input;

  it('decodes payload, header and both; strips Bearer', async () => {
    expect(JSON.parse((await runOp('jwt-decode', jwt)).output!)).toEqual({ sub: '1234567890', name: 'John Doe', iat: 1516239022 });
    expect(JSON.parse((await runOp('jwt-decode', `Bearer ${jwt}`, { part: 'header' })).output!)).toEqual({ alg: 'HS256', typ: 'JWT' });
    const both = JSON.parse((await runOp('jwt-decode', jwt, { part: 'both' })).output!);
    expect(both.header.alg).toBe('HS256');
    expect(both.payload.name).toBe('John Doe');
    expect((await runOp('jwt-decode', 'a.b')).ok).toBe(false);
  });

  it('converts number bases per line', async () => {
    expect((await runOp('number-base', '255', { from: 'decimal', to: 'hex' })).output).toBe('0xFF');
    expect((await runOp('number-base', '255', { from: 'decimal', to: 'hex', prefix: false })).output).toBe('FF');
    expect((await runOp('number-base', 'ff', { from: 'hex', to: 'binary', prefix: false })).output).toBe('11111111');
    expect((await runOp('number-base', '1010\n\n11', { from: 'binary', to: 'decimal' })).output).toBe('10\n\n3');
    const bad = await runOp('number-base', '1\nxyz', { from: 'decimal', to: 'hex' });
    expect(bad.ok).toBe(false);
    expect(bad.error).toMatch(/Line 2/);
  });
});

describe('runRecipe engine', () => {
  it('returns input unchanged for an empty recipe', async () => {
    const r = await runRecipe('abc', []);
    expect(r.finalOutput).toBe('abc');
    expect(r.results).toEqual([]);
    expect(r.failedIndex).toBe(-1);
  });

  it('chains steps and records each intermediate output with timing', async () => {
    const r = await runRecipe(' Hello ', [step('trim'), step('upper-case'), step('base64-encode')]);
    expect(r.results.map((x) => x.output)).toEqual(['Hello', 'HELLO', 'SEVMTE8=']);
    expect(r.results.every((x) => x.ok && x.status === 'ok' && x.ms >= 0)).toBe(true);
    expect(r.finalOutput).toBe('SEVMTE8=');
  });

  it('skips disabled steps as pass-through', async () => {
    const r = await runRecipe('abc', [step('upper-case', undefined, false), step('reverse')]);
    expect(r.results[0].status).toBe('skipped');
    expect(r.results[0].output).toBe('abc');
    expect(r.finalOutput).toBe('cba');
  });

  it('stops at the first failing step and marks the rest not-run', async () => {
    const r = await runRecipe('not json', [step('trim'), step('json-beautify'), step('upper-case')]);
    expect(r.failedIndex).toBe(1);
    expect(r.finalOutput).toBeNull();
    expect(r.results[0].status).toBe('ok');
    expect(r.results[1].status).toBe('error');
    expect(r.results[1].error).toMatch(/Invalid JSON/);
    expect(r.results[2].status).toBe('not-run');
    expect(r.results[2].output).toBeUndefined();
  });

  it('reports unknown operations as errors', async () => {
    const r = await runRecipe('x', [{ uid: 'u1', op: 'does-not-exist', params: {}, enabled: true }]);
    expect(r.failedIndex).toBe(0);
    expect(r.results[0].error).toMatch(/Unknown operation/);
  });

  it('catches ops that throw', async () => {
    const op = getOperation('reverse')!;
    const original = op.run;
    op.run = async () => { throw new Error('boom'); };
    try {
      const r = await runRecipe('x', [step('reverse')]);
      expect(r.results[0].error).toBe('boom');
    } finally {
      op.run = original;
    }
  });
});

describe('params normalization', () => {
  it('fills defaults, drops unknown keys and wrong types/options', () => {
    const op = getOperation('sort-lines')!;
    expect(normalizeParams(op, undefined)).toEqual({ order: 'asc', numeric: false, ignoreCase: false });
    expect(normalizeParams(op, { order: 'desc', numeric: 'yes', bogus: 1 })).toEqual({ order: 'desc', numeric: false, ignoreCase: false });
    expect(normalizeParams(op, { order: 'sideways' }).order).toBe('asc');
    expect(normalizeParams(op, [1, 2])).toEqual(defaultParams(op));
  });

  it('createStep assigns unique uids', () => {
    const a = createStep('trim');
    const b = createStep('trim');
    expect(a.uid).not.toBe(b.uid);
  });
});

describe('serialization', () => {
  it('serializes compactly: only non-default args and off flag', () => {
    const steps = [step('trim'), step('hash', { algorithm: 'SHA-512' }), step('reverse', undefined, false)];
    const json = serializeRecipe(steps, ' My recipe ');
    expect(JSON.parse(json)).toEqual({
      v: 1,
      name: 'My recipe',
      steps: [{ op: 'trim' }, { op: 'hash', args: { algorithm: 'SHA-512' } }, { op: 'reverse', off: true }],
    });
  });

  it('round-trips through parseRecipe', () => {
    const steps = [step('regex-replace', { pattern: '\\d+', replacement: '#' }), step('sort-lines', { order: 'desc' }, false)];
    const parsed = parseRecipe(serializeRecipe(steps, 'rt'));
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.name).toBe('rt');
    expect(parsed.data.steps.map((s) => [s.op, s.params, s.enabled])).toEqual(steps.map((s) => [s.op, s.params, s.enabled]));
    expect(toSerializable(parsed.data.steps)).toEqual(toSerializable(steps));
  });

  it('accepts bare arrays, string steps and objects', () => {
    const a = parseRecipe('["trim", {"op":"upper-case"}]');
    expect(a.success && a.data.steps.map((s) => s.op)).toEqual(['trim', 'upper-case']);
    const b = parseRecipe({ steps: [{ op: 'hash', params: { algorithm: 'MD5' }, enabled: false }] });
    expect(b.success && b.data.steps[0].params.algorithm).toBe('MD5');
    expect(b.success && b.data.steps[0].enabled).toBe(false);
  });

  it('never throws on bad input and explains why', () => {
    const cases: unknown[] = ['', '   ', '{', 'null', '42', '"str"', '{}', '{"steps":3}', '{"steps":[1]}', '{"steps":[{}]}', '{"steps":[{"op":"nope"}]}', '{"v":99,"steps":[]}', null, undefined, 42];
    for (const c of cases) {
      const r = parseRecipe(c);
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.length).toBeGreaterThan(0);
    }
    const unknownOp = parseRecipe('{"steps":[{"op":"nope"}]}');
    expect(!unknownOp.success && unknownOp.error).toMatch(/unknown operation "nope"/);
  });
});

describe('saved recipes helpers', () => {
  it('parses persisted list safely', () => {
    expect(parseSavedRecipes(null)).toEqual([]);
    expect(parseSavedRecipes('garbage')).toEqual([]);
    expect(parseSavedRecipes('{}')).toEqual([]);
    const good = { name: 'a', savedAt: 1, recipe: { v: 1, steps: [{ op: 'trim' }] } };
    const bad = { name: 'b', savedAt: 2, recipe: { v: 1, steps: [{ op: 'nope' }] } };
    expect(parseSavedRecipes(JSON.stringify([good, bad, 5, null]))).toEqual([good]);
  });

  it('upserts by case-insensitive name, newest first', () => {
    const r = (name: string, savedAt: number) => ({ name, savedAt, recipe: { v: 1, steps: [] } });
    const list = upsertSavedRecipe([r('One', 1), r('Two', 2)], r('one', 3));
    expect(list.map((x) => [x.name, x.savedAt])).toEqual([['one', 3], ['Two', 2]]);
  });
});

describe('example recipes', () => {
  it('all parse and run successfully', async () => {
    for (const ex of exampleRecipes) {
      const parsed = parseRecipe(ex.recipe);
      expect(parsed.success, ex.label).toBe(true);
      if (!parsed.success) continue;
      const r = await runRecipe(ex.input, parsed.data.steps);
      expect(r.failedIndex, `${ex.label}: ${r.results.find((x) => !x.ok)?.error}`).toBe(-1);
      expect(r.finalOutput).toBeTruthy();
    }
  });

  it('produce the expected outputs', async () => {
    const run = async (label: string) => {
      const ex = exampleRecipes.find((e) => e.label === label)!;
      const p = parseRecipe(ex.recipe);
      if (!p.success) throw new Error(p.error);
      return (await runRecipe(ex.input, p.data.steps)).finalOutput;
    };
    expect(await run('Slugify title')).toBe('hello-world-10-tips-tricks-for-nextjs');
    expect(await run('SHA-256 of trimmed text')).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    expect(JSON.parse((await run('Base64 → pretty JSON'))!)).toEqual({ user: 'ada', roles: ['admin', 'dev'], active: true, meta: { id: 42 } });
    expect(await run('URL decode → sorted JSON')).toBe('{\n  "alpha": {\n    "charlie": 3,\n    "delta": 4\n  },\n  "beta": [\n    2,\n    1\n  ],\n  "zeta": 1\n}');
    expect(await run('Clean up a list')).toBe('apple\nbanana\nBanana\ncherry');
  });
});
