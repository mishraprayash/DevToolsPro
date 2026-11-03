import { describe, it, expect } from 'vitest';
import { detectInput, hasConfidentDetection, isIpv6, MAX_DETECTIONS, type Detection } from '../detectInput';
import { toolsMap } from '@/tools/registry';

const top = (text: string): Detection | undefined => detectInput(text)[0];
const ids = (text: string): string[] => detectInput(text).map((d) => d.toolId);
const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');
const b64url = (s: string) => b64(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const JWT = `${b64url('{"alg":"HS256","typ":"JWT"}')}.${b64url('{"sub":"1234567890","name":"John Doe","iat":1516239022}')}.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;

describe('detectInput — basics', () => {
  it('returns [] for empty / whitespace / non-string input', () => {
    expect(detectInput('')).toEqual([]);
    expect(detectInput('   \n\t ')).toEqual([]);
    expect(detectInput(undefined as unknown as string)).toEqual([]);
    expect(detectInput(42 as unknown as string)).toEqual([]);
  });

  it('never suggests more than MAX_DETECTIONS and one entry per tool', () => {
    const samples = ['{"a":1}', 'CREATE TABLE t (id int, name text);', JWT, 'hello\nworld', '* * * * *'];
    for (const s of samples) {
      const res = detectInput(s);
      expect(res.length).toBeLessThanOrEqual(MAX_DETECTIONS);
      expect(new Set(res.map((d) => d.toolId)).size).toBe(res.length);
    }
  });

  it('sorts results by confidence descending', () => {
    const res = detectInput('{"user":{"id":1,"tags":["a"]}}');
    for (let i = 1; i < res.length; i++) expect(res[i - 1].confidence).toBeGreaterThanOrEqual(res[i].confidence);
  });

  it('only suggests tools that exist in the registry and always sets payload.input', () => {
    const samples = [
      JWT, '{"a":1}', 'a: 1\nb:\n  c: 2', '<?xml version="1.0"?><a/>', '<div><p>Hi</p></div>', b64('{"a":1}'),
      'data:image/png;base64,iVBORw0KGgo=', '*/5 * * * *', '1700000000', 'curl https://x.dev', 'https://a.dev/?q=1',
      'a%20b%2Fc', '#ff0000', '10.0.0.0/8', '2001:db8::1', '123e4567-e89b-42d3-a456-426614174000',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'CREATE TABLE t (id int);', 'SELECT * FROM t',
      '/^a+$/gi', 'd41d8cd98f00b204e9800998ecf8427e', 'some\nplain text', 'docker run -p 80:80 nginx', 'a,b\n1,2',
      '<svg viewBox="0 0 1 1"></svg>', '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234',
    ];
    for (const s of samples) {
      const res = detectInput(s);
      expect(res.length, s).toBeGreaterThan(0);
      for (const d of res) {
        expect(toolsMap.has(d.toolId), `${d.toolId} for ${s}`).toBe(true);
        expect(typeof d.payload.input).toBe('string');
        expect(d.confidence).toBeGreaterThan(0);
        expect(d.confidence).toBeLessThanOrEqual(1);
        expect(d.reason.length).toBeGreaterThan(0);
      }
    }
  });

  it('is fast and safe on huge input', () => {
    const big = '{"a":"' + 'x'.repeat(2_000_000) + '"}';
    const start = Date.now();
    const res = detectInput(big);
    expect(Date.now() - start).toBeLessThan(1000);
    expect(res[0].toolId).toBe('json');
    // full text is still handed over, not the truncated scan window
    expect(res[0].payload.input.length).toBe(big.length);
  });

  it('never throws on odd input', () => {
    const weird = ['\u0000\u0001', '%E0%A4%A', '<<<>>>', '{{{', '[', '::::', '/', '//', '/(/', 'eyJ.eyJ.', '\uD800'];
    for (const s of weird) expect(() => detectInput(s)).not.toThrow();
  });
});

describe('JWT', () => {
  it('detects a JWT with decode mode', () => {
    const d = top(JWT)!;
    expect(d.toolId).toBe('jwt');
    expect(d.confidence).toBeGreaterThan(0.9);
    expect(d.payload).toEqual({ input: JWT, activeMode: 'decode' });
    expect(d.reason).toContain('HS256');
  });
  it('strips a Bearer prefix', () => {
    expect(top(`Bearer ${JWT}`)!.payload.input).toBe(JWT);
  });
  it('rejects dotted strings whose header is not a JWT header', () => {
    expect(ids('www.example.com')).not.toContain('jwt');
    expect(ids(`${b64url('{"foo":1}')}.${b64url('{}')}.sig`)).not.toContain('jwt');
    expect(ids('a.b.c')).not.toContain('jwt');
  });
});

describe('JSON', () => {
  it('detects objects and arrays with json-to-ts / json-schema ranked lower', () => {
    expect(ids('{"a": 1, "b": [1,2]}')).toEqual(['json', 'json-to-ts', 'json-schema']);
    expect(top('[1, 2, 3]')!.toolId).toBe('json');
  });
  it('flags almost-JSON with lower confidence', () => {
    const d = top('{"a": 1,}')!;
    expect(d.toolId).toBe('json');
    expect(d.confidence).toBeLessThan(0.7);
  });
  it('does not treat log prefixes or primitives as JSON', () => {
    expect(ids('[INFO] server started')).not.toContain('json');
    expect(ids('"just a string"')).not.toContain('json');
    expect(ids('true')).not.toContain('json');
  });
});

describe('YAML', () => {
  it('detects multi-line key/value YAML with yaml input mode', () => {
    const y = 'name: app\nversion: 1.0\nservices:\n  web:\n    image: nginx\n  - item';
    const d = top(y)!;
    expect(d.toolId).toBe('yaml-json');
    expect(d.payload.mode).toBe('yaml');
  });
  it('rejects JSON, single lines, CSS and prose', () => {
    expect(ids('{"a": 1}')).not.toContain('yaml-json');
    expect(ids('name: app')).not.toContain('yaml-json');
    expect(ids('a {\n  color: red;\n  margin: 0;\n}')).not.toContain('yaml-json');
    expect(ids('This is a sentence: with a colon\nand another line of prose')).not.toContain('yaml-json');
  });
});

describe('XML / HTML / SVG', () => {
  it('detects XML declarations and custom root elements with xml input mode', () => {
    expect(top('<?xml version="1.0"?>\n<note><to>Tove</to></note>')!.payload).toMatchObject({ mode: 'xml' });
    const d = top('<catalog><book id="1"><title>X</title></book></catalog>')!;
    expect(d.toolId).toBe('xml-json');
    expect(d.payload.mode).toBe('xml');
  });
  it('detects HTML documents and fragments', () => {
    expect(top('<!DOCTYPE html><html><body>Hi</body></html>')!.toolId).toBe('html-preview');
    expect(top('<div class="x"><p>Hello</p></div>')!.toolId).toBe('html-preview');
  });
  it('routes SVG to svg-to-jsx', () => {
    expect(top('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>')!.toolId).toBe('svg-to-jsx');
  });
  it('rejects unbalanced markup and non-markup', () => {
    expect(ids('<catalog><book>')).not.toContain('xml-json');
    expect(ids('a < b > c')).not.toContain('xml-json');
  });
});

describe('Base64', () => {
  it('detects base64 text and uses encoder decode mode', () => {
    const d = top(b64('Hello, World! This is base64.'))!;
    expect(d.toolId).toBe('encoder');
    expect(d.payload).toMatchObject({ encodingMode: 'base64', direction: 'decode', b64Mode: 'utf8' });
  });
  it('ranks base64 that decodes to JSON higher', () => {
    const json = top(b64('{"user":"alice","admin":true}'))!;
    const text = top(b64('Hello, World! This is base64.'))!;
    expect(json.toolId).toBe('encoder');
    expect(json.reason).toMatch(/JSON/);
    expect(json.confidence).toBeGreaterThan(text.confidence);
  });
  it('detects base64 image magic bytes and image data URLs', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]).toString('base64');
    expect(top(png)!.toolId).toBe('image-base64');
    const gif = Buffer.from('GIF89a\u0001\u0000').toString('base64');
    expect(top(gif)!.toolId).toBe('image-base64');
    expect(top('data:image/jpeg;base64,/9j/4AAQSkZJRg==')!.toolId).toBe('image-base64');
  });
  it('rejects plain words, digits, hex and bad padding', () => {
    expect(ids('password')).not.toContain('encoder');
    expect(ids('12345678')).not.toContain('encoder');
    expect(ids('d41d8cd98f00b204e9800998ecf8427e')).not.toContain('encoder');
    expect(ids('SGVsbG8=x')).not.toContain('encoder');
    expect(ids('hello world foo bar')).not.toContain('encoder');
  });
});

describe('cron', () => {
  it('detects 5 and 6 field expressions and macros', () => {
    expect(top('*/15 9-17 * * MON-FRI')!.toolId).toBe('cron');
    expect(top('0 0 12 * * ?')!.toolId).toBe('cron');
    expect(top('@daily')!.toolId).toBe('cron');
    expect(top('*/5 * * * *')!.confidence).toBeGreaterThanOrEqual(0.9);
  });
  it('rejects prose and wrong field counts', () => {
    expect(ids('the quick brown fox jumps')).not.toContain('cron');
    expect(ids('* * * *')).not.toContain('cron');
    expect(ids('* * * * * * *')).not.toContain('cron');
  });
});

describe('Unix timestamp', () => {
  it('detects seconds and milliseconds in a plausible range', () => {
    expect(top('1700000000')!.toolId).toBe('date-toolbox');
    expect(top('1700000000000')!.toolId).toBe('date-toolbox');
    expect(top('1700000000')!.reason).toContain('2023-11-14');
  });
  it('rejects implausible dates and other lengths', () => {
    expect(ids('0000000001')).not.toContain('date-toolbox');
    expect(ids('9999999999999')).not.toContain('date-toolbox');
    expect(ids('12345')).not.toContain('date-toolbox');
  });
});

describe('cURL / docker', () => {
  it('detects curl commands, including a shell prompt prefix', () => {
    expect(top('curl -X POST https://api.example.com -d \'{"a":1}\'')!.toolId).toBe('curl-converter');
    expect(top('$ curl https://example.com')!.payload.input).toBe('curl https://example.com');
  });
  it('rejects mentions of curl in prose', () => {
    expect(ids('I used curl yesterday')).not.toContain('curl-converter');
  });
  it('detects docker run', () => {
    expect(top('docker run -d -p 8080:80 nginx')!.toolId).toBe('docker-converter');
  });
});

describe('URLs and URL encoding', () => {
  it('detects URLs, ranking ones with query strings higher', () => {
    const withQ = top('https://example.com/search?q=test&page=2')!;
    const without = top('https://example.com/about')!;
    expect(withQ.toolId).toBe('url-parser');
    expect(without.toolId).toBe('url-parser');
    expect(withQ.confidence).toBeGreaterThan(without.confidence);
  });
  it('detects percent-encoded strings for the encoder in url decode mode', () => {
    const d = top('name%3DJohn%20Doe%26city%3DNYC')!;
    expect(d.toolId).toBe('encoder');
    expect(d.payload).toMatchObject({ encodingMode: 'url', direction: 'decode' });
  });
  it('rejects non-URLs and invalid percent sequences', () => {
    expect(ids('ftp://example.com')).not.toContain('url-parser');
    expect(ids('example.com page')).not.toContain('url-parser');
    expect(ids('100% sure')).not.toContain('encoder');
  });
});

describe('colors', () => {
  it('detects hex, rgb and hsl colors', () => {
    expect(top('#ff5733')!.toolId).toBe('color');
    expect(top('#fff')!.toolId).toBe('color');
    expect(top('rgb(255, 87, 51)')!.toolId).toBe('color');
    expect(top('rgba(0 0 0 / 50%)')!.toolId).toBe('color');
    expect(top('hsl(210, 50%, 40%)')!.toolId).toBe('color');
  });
  it('rejects invalid colors', () => {
    expect(ids('#ggg')).not.toContain('color');
    expect(ids('#12345')).not.toContain('color');
    expect(ids('rgb')).not.toContain('color');
  });
});

describe('IP addresses', () => {
  it('detects IPv4 and IPv4 CIDR', () => {
    expect(top('192.168.1.1')!.toolId).toBe('subnet');
    expect(top('10.0.0.0/8')!.toolId).toBe('subnet');
  });
  it('rejects bad IPv4', () => {
    expect(ids('256.1.1.1')).not.toContain('subnet');
    expect(ids('10.0.0.0/33')).not.toContain('subnet');
    expect(ids('1.2.3')).not.toContain('subnet');
  });
  it('detects IPv6 variants', () => {
    for (const ip of ['2001:db8::1', '::1', 'fe80::1%eth0', '2001:0db8:85a3:0000:0000:8a2e:0370:7334', '2001:db8::/32', '::ffff:192.168.0.1']) {
      expect(top(ip)!.toolId, ip).toBe('ipv6');
    }
  });
  it('rejects bad IPv6', () => {
    expect(isIpv6('2001:db8::1::2')).toBe(false);
    expect(isIpv6('12:30:45')).toBe(false);
    expect(isIpv6('gggg::1')).toBe(false);
    expect(isIpv6('2001:db8::/129')).toBe(false);
    expect(ids('12:30:45')).not.toContain('ipv6');
  });
});

describe('UUID', () => {
  it('detects UUIDs and reports the version', () => {
    const d = top('123e4567-e89b-42d3-a456-426614174000')!;
    expect(d.toolId).toBe('uuid');
    expect(d.reason).toContain('version 4');
    expect(d.payload).toEqual({ input: '123e4567-e89b-42d3-a456-426614174000' });
  });
  it('rejects malformed UUIDs', () => {
    expect(ids('123e4567-e89b-42d3-a456-42661417400')).not.toContain('uuid');
  });
});

describe('User-Agent', () => {
  it('detects browser and client UA strings', () => {
    expect(top('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36')!.toolId).toBe('user-agent');
    expect(top('User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')!.payload.input).toMatch(/^Mozilla/);
  });
  it('rejects text that only mentions Mozilla', () => {
    expect(ids('Mozilla makes Firefox')).not.toContain('user-agent');
  });
});

describe('SQL', () => {
  it('routes CREATE TABLE to sql-to-orm with sql-designer lower', () => {
    const r = ids('-- users\nCREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  email VARCHAR(255)\n);');
    expect(r[0]).toBe('sql-to-orm');
    expect(r).toContain('sql-designer');
    expect(r.indexOf('sql-designer')).toBeGreaterThan(0);
  });
  it('routes other statements to sql-prettify', () => {
    expect(top('SELECT id, name FROM users WHERE id = 1')!.toolId).toBe('sql-prettify');
    expect(top("insert into t (a) values ('x')")!.toolId).toBe('sql-prettify');
    expect(top('UPDATE users SET name = 1')!.toolId).toBe('sql-prettify');
  });
  it('rejects English sentences starting with SQL keywords', () => {
    expect(ids('Select the best option')).not.toContain('sql-prettify');
    expect(ids('update the docs please')).not.toContain('sql-prettify');
  });
});

describe('regex and hashes', () => {
  it('detects regex literals with low confidence', () => {
    const d = top('/^[a-z0-9._%+-]+@[a-z]+\\.[a-z]{2,}$/i')!;
    expect(d.toolId).toBe('regex');
    expect(d.confidence).toBeLessThan(0.7);
  });
  it('rejects file paths and invalid patterns', () => {
    expect(ids('/usr/local/bin/')).not.toContain('regex');
    expect(ids('/(/')).not.toContain('regex');
  });
  it('detects MD5/SHA hashes with low confidence', () => {
    const md5 = top('d41d8cd98f00b204e9800998ecf8427e')!;
    expect(md5.toolId).toBe('hash');
    expect(md5.reason).toContain('MD5');
    expect(md5.confidence).toBeLessThan(0.7);
    expect(top('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')!.reason).toContain('SHA-256');
  });
  it('rejects hex of other lengths as a hash', () => {
    expect(ids('abcdef0123')).not.toContain('hash');
  });
  it('detects bcrypt hashes', () => {
    expect(top('$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234')!.toolId).toBe('bcrypt');
  });
});

describe('CSV and plain text fallbacks', () => {
  it('detects CSV', () => {
    expect(top('name,age,city\nAlice,30,NYC\nBob,25,LA')!.toolId).toBe('csv-json');
  });
  it('falls back to string-utils / diff-checker for multi-line text', () => {
    const r = detectInput('The quick brown fox\njumps over the lazy dog');
    expect(r.map((d) => d.toolId)).toEqual(['string-utils', 'diff-checker']);
    expect(r[0].confidence).toBeLessThan(0.5);
  });
  it('falls back to string-utils only for single-line text', () => {
    expect(ids('hello there')).toEqual(['string-utils']);
  });
  it('returns nothing for symbol-only input', () => {
    expect(detectInput('!!! ???')).toEqual([]);
  });
});

describe('hasConfidentDetection', () => {
  it('uses the top detection and a threshold', () => {
    expect(hasConfidentDetection(detectInput(JWT))).toBe(true);
    expect(hasConfidentDetection(detectInput('hello there'))).toBe(false);
    expect(hasConfidentDetection([])).toBe(false);
    expect(hasConfidentDetection(detectInput('d41d8cd98f00b204e9800998ecf8427e'), 0.4)).toBe(true);
  });
});
