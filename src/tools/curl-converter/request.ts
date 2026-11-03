// Pure, synchronous cURL helpers used for cross-tool handoffs (URL Parser, JSON tool).
// Kept out of ./utils.ts because that module is a 'use server' file (async exports only).

// Split a shell command into argv-style tokens. Handles single/double quotes,
// $'…' strings, backslash escapes and backslash-newline continuations. Never throws.
export function tokenizeShell(command: string): string[] {
  if (typeof command !== 'string') return [];
  const s = command.replace(/\\\r?\n/g, ' ');
  const tokens: string[] = [];
  let cur = '';
  let inToken = false;
  let quote: "'" | '"' | null = null;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote === "'") {
      if (ch === "'") quote = null;
      else cur += ch;
    } else if (quote === '"') {
      if (ch === '\\' && i + 1 < s.length && '"\\$`'.includes(s[i + 1])) cur += s[++i];
      else if (ch === '"') quote = null;
      else cur += ch;
    } else if (/\s/.test(ch)) {
      if (inToken) tokens.push(cur);
      cur = '';
      inToken = false;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
      inToken = true;
    } else if (ch === '$' && s[i + 1] === "'") {
      quote = "'";
      inToken = true;
      i++;
    } else if (ch === '\\' && i + 1 < s.length) {
      cur += s[++i];
      inToken = true;
    } else {
      cur += ch;
      inToken = true;
    }
  }
  if (inToken) tokens.push(cur);
  return tokens;
}

// Long options that consume the following argument.
const LONG_WITH_VALUE = new Set([
  'header', 'request', 'data', 'data-raw', 'data-binary', 'data-ascii', 'data-urlencode', 'json',
  'user', 'user-agent', 'referer', 'cookie', 'cookie-jar', 'form', 'form-string', 'output',
  'upload-file', 'proxy', 'proxy-user', 'cert', 'key', 'cacert', 'capath', 'connect-timeout',
  'max-time', 'retry', 'retry-delay', 'retry-max-time', 'url', 'resolve', 'write-out', 'range',
  'limit-rate', 'oauth2-bearer', 'config', 'interface', 'dump-header', 'max-redirs', 'aws-sigv4',
  'connect-to', 'cert-type', 'key-type', 'pass', 'ciphers', 'trace', 'trace-ascii', 'stderr',
  'speed-limit', 'speed-time', 'time-cond', 'quote', 'request-target', 'unix-socket', 'netrc-file',
  'local-port', 'max-filesize', 'variable', 'expand-url',
]);

// Short options that consume an argument (either attached, `-XPOST`, or the next token).
const SHORT_WITH_VALUE = new Set('dHXuAebcFoTxEmrwKDUyYztQC'.split(''));

const DATA_LONG = new Set(['data', 'data-raw', 'data-binary', 'data-ascii', 'json']);

interface ParsedCurlArgs {
  url: string;
  data: string[];
}

function parseCurlArgs(command: string): ParsedCurlArgs {
  const tokens = tokenizeShell(command);
  const result: ParsedCurlArgs = { url: '', data: [] };
  let i = tokens[0] === 'curl' ? 1 : 0;
  let explicitUrl = '';
  let positional = '';

  for (; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok === '--') {
      if (!positional && i + 1 < tokens.length) positional = tokens[i + 1];
      break;
    }
    if (tok.startsWith('--')) {
      const eq = tok.indexOf('=');
      const name = (eq === -1 ? tok.slice(2) : tok.slice(2, eq)).toLowerCase();
      if (!LONG_WITH_VALUE.has(name)) continue;
      const value = eq === -1 ? tokens[++i] : tok.slice(eq + 1);
      if (value === undefined) break;
      if (name === 'url' && !explicitUrl) explicitUrl = value;
      if (DATA_LONG.has(name)) {
        // --data-raw never reads files; the others treat a leading '@' as a filename.
        if (name === 'data-raw' || !value.startsWith('@')) result.data.push(value);
      }
      continue;
    }
    if (tok.startsWith('-') && tok.length > 1) {
      // Short option cluster, e.g. -sSL or -XPOST or -d'{"a":1}'.
      for (let j = 1; j < tok.length; j++) {
        const flag = tok[j];
        if (!SHORT_WITH_VALUE.has(flag)) continue;
        const attached = tok.slice(j + 1);
        const value = attached || tokens[++i];
        if (value !== undefined && flag === 'd' && !value.startsWith('@')) result.data.push(value);
        break;
      }
      continue;
    }
    if (!positional) positional = tok;
  }

  result.url = explicitUrl || positional;
  if (!result.url) {
    const m = command.match(/https?:\/\/[^\s"']+/);
    if (m) result.url = m[0];
  }
  return result;
}

// The request URL of a cURL command ('' when none could be found).
export function extractCurlUrl(command: string): string {
  try {
    return parseCurlArgs(command).url;
  } catch {
    return '';
  }
}

// The request body pretty-printed as JSON, or null when the command has no body
// or the body isn't a JSON object/array.
export function extractCurlJsonBody(command: string): string | null {
  try {
    const { data } = parseCurlArgs(command);
    if (data.length !== 1) return null;
    const raw = data[0].trim();
    if (!raw.startsWith('{') && !raw.startsWith('[')) return null;
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') return null;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return null;
  }
}
