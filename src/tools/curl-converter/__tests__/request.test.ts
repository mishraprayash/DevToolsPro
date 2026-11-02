import { describe, it, expect } from 'vitest';
import { tokenizeShell, extractCurlUrl, extractCurlJsonBody } from '../request';

describe('tokenizeShell', () => {
  it('splits on whitespace and honours quotes and continuations', () => {
    expect(tokenizeShell(`curl -H "A: b c" \\\n  -d '{"x": 1}' https://e.com`)).toEqual([
      'curl', '-H', 'A: b c', '-d', '{"x": 1}', 'https://e.com',
    ]);
  });

  it('handles escapes inside double quotes and bare backslashes', () => {
    expect(tokenizeShell('a "say \\"hi\\"" b\\ c')).toEqual(['a', 'say "hi"', 'b c']);
  });

  it('returns [] for non-strings', () => {
    expect(tokenizeShell(undefined as unknown as string)).toEqual([]);
  });
});

describe('extractCurlUrl', () => {
  it('finds a trailing positional URL', () => {
    expect(extractCurlUrl('curl -X POST -H "Accept: */*" https://api.example.com/users?id=1')).toBe(
      'https://api.example.com/users?id=1'
    );
  });

  it('finds a leading URL and skips flag values', () => {
    expect(extractCurlUrl(`curl https://a.io/x -d 'hello' -u me:pw`)).toBe('https://a.io/x');
  });

  it('prefers --url', () => {
    expect(extractCurlUrl('curl --url=https://u.dev/p -sSL')).toBe('https://u.dev/p');
    expect(extractCurlUrl('curl --url https://u.dev/q')).toBe('https://u.dev/q');
  });

  it('accepts scheme-less hosts and quoted URLs', () => {
    expect(extractCurlUrl(`curl -sL 'example.com/a b'`)).toBe('example.com/a b');
  });

  it('handles attached short values like -XPOST', () => {
    expect(extractCurlUrl('curl -XPOST -HAccept:json http://h/')).toBe('http://h/');
  });

  it('returns empty string when no URL', () => {
    expect(extractCurlUrl('curl -v')).toBe('');
    expect(extractCurlUrl('')).toBe('');
  });
});

describe('extractCurlJsonBody', () => {
  it('pretty-prints a JSON object body', () => {
    const cmd = `curl -X POST https://api.example.com/login \\\n  -H "Content-Type: application/json" \\\n  -d '{"email":"t@t.com", "password":"123"}'`;
    expect(extractCurlJsonBody(cmd)).toBe('{\n  "email": "t@t.com",\n  "password": "123"\n}');
  });

  it('supports --data-raw, --json and --data=', () => {
    expect(extractCurlJsonBody(`curl --data-raw '[1,2]' http://x`)).toBe('[\n  1,\n  2\n]');
    expect(extractCurlJsonBody(`curl --json '{"a":true}' http://x`)).toBe('{\n  "a": true\n}');
    expect(extractCurlJsonBody(`curl --data='{"a":1}' http://x`)).toBe('{\n  "a": 1\n}');
  });

  it('returns null for non-JSON, file or missing bodies', () => {
    expect(extractCurlJsonBody('curl -d "a=1&b=2" http://x')).toBeNull();
    expect(extractCurlJsonBody('curl -d @body.json http://x')).toBeNull();
    expect(extractCurlJsonBody('curl http://x')).toBeNull();
    expect(extractCurlJsonBody(`curl -d '{broken' http://x`)).toBeNull();
    expect(extractCurlJsonBody(`curl -d '"str"' http://x`)).toBeNull();
  });

  it('returns null when several data parts are joined', () => {
    expect(extractCurlJsonBody(`curl -d '{"a":1}' -d '{"b":2}' http://x`)).toBeNull();
  });
});
