// Smart paste: guess which tool a pasted blob of text belongs to.
// Pure module (no React, no DOM besides optional atob/TextDecoder) and it
// never throws — every detector is wrapped so a bad input just yields no
// suggestion from that detector.

export interface Detection {
  /** Tool id from the registry (`/tools/<toolId>`). */
  toolId: string;
  /** Short name of what was detected, e.g. "JSON Web Token". */
  label: string;
  /** Human readable explanation, e.g. "3 base64url segments with an alg header". */
  reason: string;
  /** 0..1, higher is more certain. */
  confidence: number;
  /** Partial tool state handed to the target tool via sendToTool. */
  payload: Record<string, unknown> & { input: string };
}

/** Only this much of the input is inspected, so huge pastes stay fast. */
export const MAX_SCAN_LENGTH = 100_000;
/** Maximum number of suggestions returned. */
export const MAX_DETECTIONS = 4;

type Detector = (text: string, raw: string) => Detection[];

const det = (
  toolId: string,
  label: string,
  reason: string,
  confidence: number,
  payload: Record<string, unknown> & { input: string },
): Detection => ({ toolId, label, reason, confidence, payload });

// ── helpers ──────────────────────────────────────────────────────

function base64ToBytes(b64: string): Uint8Array | null {
  try {
    let s = b64.replace(/-/g, '+').replace(/_/g, '/');
    if (s.length % 4 === 1) return null;
    while (s.length % 4 !== 0) s += '=';
    if (typeof atob !== 'function') return null;
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function bytesToUtf8(bytes: Uint8Array): string | null {
  try {
    if (typeof TextDecoder === 'undefined') return null;
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function printableRatio(s: string): number {
  if (!s.length) return 0;
  let printable = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 9 || c === 10 || c === 13 || (c >= 32 && c !== 127 && !(c >= 0x80 && c < 0xa0))) printable++;
  }
  return printable / s.length;
}

function tryParseJson(s: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(s) };
  } catch {
    return { ok: false };
  }
}

function isJsonContainer(s: string): boolean {
  const t = s.trim();
  if (!((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']')))) return false;
  const r = tryParseJson(t);
  return r.ok && typeof r.value === 'object' && r.value !== null;
}

function imageKindFromBytes(b: Uint8Array): string | null {
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'PNG';
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'JPEG';
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'GIF';
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return 'WebP';
  return null;
}

const HTML_TAGS = new Set([
  'html', 'head', 'body', 'div', 'span', 'p', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'section', 'article', 'header', 'footer', 'nav', 'main', 'aside', 'table', 'thead', 'tbody', 'tr', 'td',
  'th', 'img', 'button', 'form', 'input', 'label', 'select', 'textarea', 'script', 'style', 'link', 'meta',
  'br', 'hr', 'strong', 'em', 'b', 'i', 'code', 'pre', 'blockquote', 'iframe', 'canvas', 'video', 'audio',
  'figure', 'small', 'title',
]);

// ── detectors ────────────────────────────────────────────────────

const detectJwt: Detector = (text) => {
  const token = text.replace(/^Bearer\s+/i, '');
  if (!/^[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]*$/.test(token)) return [];
  const headerBytes = base64ToBytes(token.split('.')[0]);
  const headerText = headerBytes && bytesToUtf8(headerBytes);
  if (!headerText) return [];
  const parsed = tryParseJson(headerText);
  if (!parsed.ok || typeof parsed.value !== 'object' || parsed.value === null) return [];
  const alg = (parsed.value as Record<string, unknown>).alg;
  if (typeof alg !== 'string') return [];
  return [det('jwt', 'JSON Web Token', `JWT signed with ${alg}`, 0.98, { input: token, activeMode: 'decode' })];
};

const detectJson: Detector = (text, raw) => {
  const t = text.trim();
  if (!(t.startsWith('{') || t.startsWith('['))) return [];
  if (isJsonContainer(t)) {
    const isArray = t.startsWith('[');
    const kind = isArray ? 'array' : 'object';
    return [
      det('json', 'JSON', `Valid JSON ${kind}`, 0.95, { input: raw }),
      det('json-to-ts', 'JSON', `Generate TypeScript types from this JSON ${kind}`, 0.6, { input: raw }),
      det('json-schema', 'JSON', `Generate a JSON Schema for this ${kind}`, 0.5, { input: raw }),
    ];
  }
  // Truncated (very large) or slightly broken JSON: still most likely JSON.
  if (/^[{[]\s*["{[\]}\d-]/.test(t) && !/^\[[^\]\n]*\]\s*\S/.test(t)) {
    return [det('json', 'JSON', 'Looks like JSON (could not be fully parsed)', 0.6, { input: raw })];
  }
  return [];
};

const detectDataUrlImage: Detector = (text) => {
  const m = /^data:image\/(png|jpe?g|gif|webp|svg\+xml|bmp|x-icon|avif);base64,/i.exec(text);
  if (!m) return [];
  return [det('image-base64', 'Image data URL', `Base64 ${m[1].toUpperCase().replace('+XML', '')} image data URL`, 0.97, { input: text })];
};

const detectBase64: Detector = (text) => {
  const compact = text.replace(/\s+/g, '');
  if (compact.length < 8) return [];
  // Base64 may be wrapped over lines, but spaces between "words" mean prose.
  if (/[ \t]/.test(text)) return [];
  if (/^\d+$/.test(compact)) return [];
  const std = /^[A-Za-z0-9+/]+={0,2}$/.test(compact);
  const urlSafe = !std && /^[A-Za-z0-9_-]+$/.test(compact) && /[-_]/.test(compact);
  if (!std && !urlSafe) return [];
  if (compact.includes('=') && compact.length % 4 !== 0) return [];
  if (compact.length % 4 === 1) return [];
  // Hex-only strings are far more likely to be hashes/hex dumps.
  if (/^[0-9a-f]+$/i.test(compact)) return [];

  const bytes = base64ToBytes(compact);
  if (!bytes || bytes.length === 0) return [];

  const image = imageKindFromBytes(bytes);
  if (image) {
    return [
      det('image-base64', 'Base64 image', `Base64 data with ${image} magic bytes`, 0.93, { input: text.trim() }),
    ];
  }

  const decoded = bytesToUtf8(bytes);
  if (decoded === null || printableRatio(decoded) < 0.95) return [];
  // Require some real letters to reduce false positives on random words.
  if (!/[A-Za-z]{2}/.test(decoded)) return [];
  const payload = { input: text.trim(), encodingMode: 'base64', direction: 'decode', b64Mode: 'utf8' };
  if (isJsonContainer(decoded)) {
    return [det('encoder', 'Base64', 'Base64 that decodes to JSON', 0.92, payload)];
  }
  // Plain identifiers (camelCase words) happen to be valid base64 — penalise
  // inputs without any digit/+/=/ character unless they are long.
  const looksEncoded = /[0-9+/=_-]/.test(compact) || compact.length >= 24;
  return [det('encoder', 'Base64', 'Base64 that decodes to readable text', looksEncoded ? 0.78 : 0.55, payload)];
};

const CRON_MACROS = /^@(yearly|annually|monthly|weekly|daily|midnight|hourly|reboot)$/i;
const CRON_NAMES = '(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|MON|TUE|WED|THU|FRI|SAT|SUN)';
const CRON_ATOM = `(\\*|\\?|L|LW|\\d{1,4}[LW]?|\\d#\\d|${CRON_NAMES})`;
const CRON_FIELD = new RegExp(`^${CRON_ATOM}(-${CRON_ATOM})?(\\/\\d{1,4})?(,${CRON_ATOM}(-${CRON_ATOM})?(\\/\\d{1,4})?)*$`, 'i');

const detectCron: Detector = (text) => {
  if (CRON_MACROS.test(text)) return [det('cron', 'Cron expression', `Cron macro ${text}`, 0.9, { input: text })];
  if (text.includes('\n')) return [];
  const fields = text.split(/\s+/);
  if (fields.length !== 5 && fields.length !== 6) return [];
  if (!fields.every((f) => CRON_FIELD.test(f))) return [];
  // "1 2 3 4 5" is technically a cron; anything with * or / is a lot more likely to be one.
  const strong = fields.some((f) => /[*/?]/.test(f));
  return [
    det('cron', 'Cron expression', `${fields.length}-field cron schedule`, strong ? 0.93 : 0.7, { input: text }),
  ];
};

const MIN_TS = Date.UTC(1990, 0, 1);
const MAX_TS = Date.UTC(2100, 0, 1);

const detectTimestamp: Detector = (text) => {
  const m = /^(\d{10}|\d{13})$/.exec(text);
  if (!m) return [];
  const ms = text.length === 10 ? Number(text) * 1000 : Number(text);
  if (ms < MIN_TS || ms > MAX_TS) return [];
  let iso = '';
  try {
    iso = new Date(ms).toISOString().replace('.000Z', 'Z');
  } catch {
    return [];
  }
  const unit = text.length === 10 ? 'seconds' : 'milliseconds';
  return [det('date-toolbox', 'Unix timestamp', `Unix timestamp in ${unit} (${iso})`, 0.9, { input: text })];
};

const detectCurl: Detector = (text) => {
  const cmd = text.replace(/^\$\s+/, '');
  if (!/^curl(\.exe)?\s+\S/i.test(cmd)) return [];
  return [det('curl-converter', 'cURL command', 'cURL command — convert it to fetch, Axios, Python…', 0.97, { input: cmd })];
};

const detectDockerRun: Detector = (text) => {
  const cmd = text.replace(/^\$\s+/, '');
  if (!/^docker\s+run\s+\S/.test(cmd)) return [];
  return [det('docker-converter', 'docker run', 'docker run command — convert it to Compose', 0.95, { input: cmd })];
};

const detectUrl: Detector = (text) => {
  if (/\s/.test(text) || !/^https?:\/\/[^/\s?#]+/i.test(text)) return [];
  const out: Detection[] = [];
  const hasQuery = /\?[^#]*=/.test(text) || /\?./.test(text);
  out.push(
    det(
      'url-parser',
      'URL',
      hasQuery ? 'URL with query parameters' : 'HTTP(S) URL',
      hasQuery ? 0.9 : 0.7,
      { input: text },
    ),
  );
  if (/%[0-9A-Fa-f]{2}/.test(text)) {
    out.push(det('encoder', 'URL-encoded', 'Contains percent-encoded characters', 0.45, { input: text, encodingMode: 'url', direction: 'decode' }));
  }
  return out;
};

const detectUrlEncoded: Detector = (text) => {
  if (/^https?:\/\//i.test(text)) return [];
  const matches = text.match(/%[0-9A-Fa-f]{2}/g);
  if (!matches) return [];
  let decoded: string;
  try {
    decoded = decodeURIComponent(text.replace(/\+/g, ' '));
  } catch {
    return [];
  }
  if (decoded === text) return [];
  const confidence = matches.length >= 2 ? 0.82 : 0.65;
  return [det('encoder', 'URL-encoded text', `Percent-encoded text (${matches.length} escape${matches.length === 1 ? '' : 's'})`, confidence, { input: text, encodingMode: 'url', direction: 'decode' })];
};

const detectColor: Detector = (text) => {
  if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(text)) {
    return [det('color', 'Color', `Hex color ${text}`, 0.95, { input: text })];
  }
  const fn = /^(rgba?|hsla?|hwb|oklch|oklab|lab|lch)\(\s*[-\d.%\s,/a-z]+\)$/i.exec(text);
  if (fn) return [det('color', 'Color', `CSS ${fn[1].toLowerCase()}() color`, 0.95, { input: text })];
  if (/^[0-9a-f]{6}$/i.test(text) && /[a-f]/i.test(text) && /\d/.test(text)) {
    return [det('color', 'Color', 'Could be a hex color without #', 0.45, { input: `#${text}` })];
  }
  return [];
};

const detectIpv4: Detector = (text) => {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/.exec(text);
  if (!m) return [];
  const octets = m.slice(1, 5).map(Number);
  if (octets.some((o) => o > 255)) return [];
  if (m[5] !== undefined && Number(m[5]) > 32) return [];
  return [
    det('subnet', m[5] !== undefined ? 'IPv4 CIDR' : 'IPv4 address', m[5] !== undefined ? `IPv4 network /${m[5]}` : 'IPv4 address', 0.95, { input: text }),
  ];
};

export function isIpv6(text: string): boolean {
  let s = text;
  const slash = s.indexOf('/');
  if (slash !== -1) {
    const prefix = s.slice(slash + 1);
    if (!/^\d{1,3}$/.test(prefix) || Number(prefix) > 128) return false;
    s = s.slice(0, slash);
  }
  const pct = s.indexOf('%');
  if (pct !== -1) s = s.slice(0, pct);
  if (s.startsWith('[') && s.endsWith(']')) s = s.slice(1, -1);
  if (!s.includes(':')) return false;
  let groupsAllowed = 8;
  // Embedded IPv4 tail, e.g. ::ffff:192.168.0.1
  const v4 = /:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(s);
  if (v4) {
    if (v4[1].split('.').some((o) => Number(o) > 255)) return false;
    s = s.slice(0, s.length - v4[1].length) + '0';
    groupsAllowed = 7;
  }
  const doubles = s.split('::').length - 1;
  if (doubles > 1) return false;
  const hex = /^[0-9a-f]{1,4}$/i;
  if (doubles === 1) {
    const [l, r] = s.split('::');
    const left = l ? l.split(':') : [];
    const right = r ? r.split(':') : [];
    if (![...left, ...right].every((g) => hex.test(g))) return false;
    return left.length + right.length < groupsAllowed;
  }
  const groups = s.split(':');
  return groups.length === groupsAllowed && groups.every((g) => hex.test(g));
}

const detectIpv6: Detector = (text) => {
  if (!isIpv6(text)) return [];
  return [det('ipv6', 'IPv6 address', text.includes('/') ? 'IPv6 network prefix' : 'IPv6 address', 0.92, { input: text })];
};

const detectUuid: Detector = (text) => {
  const m = /^\{?([0-9a-f]{8}-[0-9a-f]{4}-([0-9a-f])[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12})\}?$/i.exec(text);
  if (!m) return [];
  const v = m[2];
  const reason = /[1-8]/.test(v) ? `UUID version ${v}` : 'UUID';
  return [det('uuid', 'UUID', reason, 0.9, { input: text })];
};

const detectUserAgent: Detector = (text) => {
  if (text.includes('\n')) return [];
  const ua = text.replace(/^User-Agent:\s*/i, '');
  if (/^Mozilla\/\d\.\d\s+\(/.test(ua) || /^(Opera|Dalvik|okhttp|curl|Wget|PostmanRuntime|python-requests|Googlebot)\/[\d.]+/i.test(ua)) {
    return [det('user-agent', 'User-Agent', 'Browser / client User-Agent string', 0.95, { input: ua })];
  }
  return [];
};

const stripSqlComments = (s: string) => s.replace(/--[^\n]*\n?/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();

const detectSql: Detector = (text, raw) => {
  const sql = stripSqlComments(text);
  if (/^CREATE\s+(TEMP(ORARY)?\s+)?TABLE\b/i.test(sql)) {
    return [
      det('sql-to-orm', 'SQL DDL', 'CREATE TABLE statement — generate ORM models', 0.92, { input: raw }),
      det('sql-designer', 'SQL DDL', 'Visualise the schema as a diagram', 0.6, { input: raw }),
      det('sql-prettify', 'SQL', 'Format the SQL', 0.5, { input: raw }),
    ];
  }
  const isQuery =
    (/^SELECT\b/i.test(sql) && /\bFROM\b/i.test(sql)) ||
    /^SELECT\s+[\d'"(@*]/i.test(sql) ||
    /^INSERT\s+INTO\b/i.test(sql) ||
    (/^UPDATE\s+\S+\s+SET\b/i.test(sql)) ||
    /^DELETE\s+FROM\b/i.test(sql) ||
    (/^WITH\s+\w+\s+AS\s*\(/i.test(sql)) ||
    /^(ALTER|DROP)\s+(TABLE|INDEX|VIEW|SCHEMA|DATABASE)\b/i.test(sql) ||
    /^CREATE\s+(UNIQUE\s+)?(INDEX|VIEW|SCHEMA|DATABASE)\b/i.test(sql);
  if (!isQuery) return [];
  return [det('sql-prettify', 'SQL', 'SQL statement — format and prettify it', 0.88, { input: raw })];
};

const detectXmlOrHtml: Detector = (text, raw) => {
  const t = text.trim();
  if (!t.startsWith('<')) return [];
  if (/^<\?xml\b/i.test(t)) {
    if (/<svg[\s>]/i.test(t)) {
      return [
        det('svg-to-jsx', 'SVG', 'SVG markup — convert it to a React component', 0.9, { input: raw }),
        det('xml-json', 'XML', 'XML document', 0.7, { input: raw, mode: 'xml' }),
      ];
    }
    return [det('xml-json', 'XML', 'XML document with <?xml declaration', 0.95, { input: raw, mode: 'xml' })];
  }
  if (/^<!doctype\s+html/i.test(t) || /^<html[\s>]/i.test(t)) {
    return [det('html-preview', 'HTML', 'HTML document', 0.95, { input: raw })];
  }
  if (/^<svg[\s>]/i.test(t)) {
    return [det('svg-to-jsx', 'SVG', 'SVG markup — convert it to a React component', 0.92, { input: raw })];
  }
  const root = /^<([A-Za-z_][\w.:-]*)[\s>/]/.exec(t);
  if (!root || !t.endsWith('>')) return [];
  const tag = root[1];
  const tags = Array.from(t.matchAll(/<([A-Za-z][\w.:-]*)/g), (m) => m[1].toLowerCase());
  const htmlTags = tags.filter((n) => HTML_TAGS.has(n)).length;
  if (HTML_TAGS.has(tag.toLowerCase()) || (tags.length > 0 && htmlTags / tags.length >= 0.6)) {
    return [det('html-preview', 'HTML', 'HTML fragment', 0.82, { input: raw })];
  }
  const closes = new RegExp(`</${tag.replace(/[.]/g, '\\.')}\\s*>$`).test(t) || /\/>$/.test(t);
  if (!closes) return [];
  return [det('xml-json', 'XML', `XML with <${tag}> root element`, 0.85, { input: raw, mode: 'xml' })];
};

const YAML_KEY_LINE = /^\s*(-\s+)?("[^"]+"|'[^']+'|[A-Za-z_$][\w$.\-/]*)\s*:(\s|$)/;
const YAML_LIST_LINE = /^\s*-\s+\S/;

const detectYaml: Detector = (text, raw) => {
  const t = text.trim();
  if (t.startsWith('{') || t.startsWith('[') || t.startsWith('<')) return [];
  const lines = t.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#') && l.trim() !== '---');
  if (lines.length < 2) return [];
  let keyLines = 0;
  let structural = 0;
  for (const line of lines) {
    if (/;\s*$/.test(line) || /[{}]\s*$/.test(line)) return []; // CSS / code
    if (YAML_KEY_LINE.test(line)) {
      keyLines++;
      structural++;
    } else if (YAML_LIST_LINE.test(line) || /^\s+\S/.test(line)) {
      structural++;
    }
  }
  if (keyLines < 2 || structural / lines.length < 0.8) return [];
  const nested = lines.some((l) => /^\s+\S/.test(l));
  const confidence = t.startsWith('---') || nested ? 0.85 : 0.75;
  return [det('yaml-json', 'YAML', `YAML with ${keyLines} key${keyLines === 1 ? '' : 's'}`, confidence, { input: raw, mode: 'yaml' })];
};

const detectCsv: Detector = (text, raw) => {
  const lines = text.trim().split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  for (const delim of [',', '\t', ';']) {
    const counts = lines.slice(0, 50).map((l) => l.split(delim).length - 1);
    if (counts[0] >= 1 && counts.every((c) => c === counts[0])) {
      const name = delim === '\t' ? 'TSV' : 'CSV';
      return [det('csv-json', name, `${name} with ${counts[0] + 1} columns`, 0.72, { input: raw })];
    }
  }
  return [];
};

const detectRegex: Detector = (text) => {
  if (text.includes('\n')) return [];
  const m = /^\/(.+)\/([dgimsuvy]*)$/.exec(text);
  if (!m) return [];
  if (!/[\\^$.|?*+()[\]{}]/.test(m[1])) return [];
  try {
    new RegExp(m[1], m[2]);
  } catch {
    return [];
  }
  return [det('regex', 'Regex', 'Regular expression literal', 0.6, { input: text })];
};

const detectHash: Detector = (text) => {
  if (/^\$2[abxy]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(text)) {
    return [det('bcrypt', 'Bcrypt hash', 'Bcrypt hash — verify it against a password', 0.9, { input: text })];
  }
  if (!/^[0-9a-f]+$/i.test(text)) return [];
  const names: Record<number, string> = { 32: 'MD5', 40: 'SHA-1', 64: 'SHA-256', 128: 'SHA-512' };
  const name = names[text.length];
  if (!name) return [];
  return [det('hash', 'Hash', `Looks like an ${name} hash`, 0.5, { input: text })];
};

const DETECTORS: Detector[] = [
  detectJwt,
  detectDataUrlImage,
  detectCurl,
  detectDockerRun,
  detectJson,
  detectXmlOrHtml,
  detectSql,
  detectUrl,
  detectUrlEncoded,
  detectUserAgent,
  detectUuid,
  detectIpv4,
  detectIpv6,
  detectColor,
  detectTimestamp,
  detectCron,
  detectHash,
  detectRegex,
  detectBase64,
];

/** Loose structural detectors; only consulted when nothing stronger matched. */
const WEAK_DETECTORS: Detector[] = [detectYaml, detectCsv];
const STRONG_THRESHOLD = 0.85;

function fallback(text: string, raw: string): Detection[] {
  if (!/[A-Za-z]/.test(text)) return [];
  const multiline = text.includes('\n');
  const out = [det('string-utils', 'Text', multiline ? 'Multi-line text — count, transform or slugify it' : 'Plain text — transform case, count words…', 0.3, { input: raw })];
  if (multiline) out.push(det('diff-checker', 'Text', 'Compare it against another version', 0.25, { input: raw }));
  return out;
}

/**
 * Detect what kind of data `text` is and suggest the best tools for it.
 * Returns at most {@link MAX_DETECTIONS} suggestions sorted by confidence
 * (best first), one per tool. Never throws.
 */
export function detectInput(text: string): Detection[] {
  try {
    if (typeof text !== 'string') return [];
    const raw = text.length > MAX_SCAN_LENGTH ? text.slice(0, MAX_SCAN_LENGTH) : text;
    const trimmed = raw.replace(/\r\n?/g, '\n').trim();
    if (!trimmed) return [];
    const payloadRaw = text.trim();

    const found: Detection[] = [];
    const run = (detectors: Detector[]) => {
      for (const detector of detectors) {
        try {
          for (const d of detector(trimmed, payloadRaw)) found.push(d);
        } catch {
          // a misbehaving detector must never break detection as a whole
        }
      }
    };
    run(DETECTORS);
    if (!found.some((d) => d.confidence >= STRONG_THRESHOLD)) run(WEAK_DETECTORS);
    if (found.length === 0) found.push(...fallback(trimmed, payloadRaw));

    found.sort((a, b) => b.confidence - a.confidence);
    const seen = new Set<string>();
    const out: Detection[] = [];
    for (const d of found) {
      if (seen.has(d.toolId)) continue;
      seen.add(d.toolId);
      out.push(d);
      if (out.length >= MAX_DETECTIONS) break;
    }
    return out;
  } catch {
    return [];
  }
}

/** True when the top detection is confident enough to surface unprompted. */
export function hasConfidentDetection(detections: Detection[], threshold = 0.7): boolean {
  return detections.length > 0 && detections[0].confidence >= threshold;
}
