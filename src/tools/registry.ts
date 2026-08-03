import type { ElementType } from 'react';
import {
  Shield, Network, Layers, Globe, Cpu, FileJson, Lock, Hash, Clock, Regex, Type,
  TerminalSquare, CalendarClock, Palette, KeyRound, FileCode, AlignLeft, Binary,
  ImageUp, Earth, QrCode, Braces, Code, GitCompare, Ruler, SunMoon,
  Laptop, Grid, Database, GitBranch, Calculator, Bot, FileMinus,
  CreditCard, Paintbrush, ListTree, Languages,
  FileSpreadsheet
} from 'lucide-react';

export type ToolCategory = 'Formatting' | 'Encoding' | 'Security' | 'Network' | 'Text' | 'Date & Time';

export interface ToolDef {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  color: string;
  icon: ElementType;
  keywords?: string[];
  isNew?: boolean;
}

export const tools: ToolDef[] = [
  // ── Formatting ─────────────────────────────────────────────────
  { id: 'json', name: 'JSON Beautifier', description: 'Format, minify, sort keys & validate JSON', keywords: ['beautify', 'minify', 'pretty print', 'format', 'sort', 'validate', 'lint', 'parse'], category: 'Formatting', icon: FileJson, color: 'from-amber-500 to-orange-500' },
  { id: 'color', name: 'Color Converter', description: 'Convert between hex, RGB, HSL, and more', keywords: ['rgb', 'hsl', 'hex', 'css', 'colour', 'paint', 'convert'], category: 'Formatting', icon: Palette, color: 'from-pink-500 to-purple-500' },
  { id: 'yaml-json', name: 'YAML ↔ JSON', description: 'Bidirectional YAML and JSON conversion', keywords: ['yml', 'convert', 'to yaml', 'to json', 'config'], category: 'Formatting', icon: FileCode, color: 'from-teal-500 to-emerald-500' },
  { id: 'xml-json', name: 'XML ↔ JSON', description: 'Convert between XML and JSON formats', keywords: ['convert', 'parse', 'markup', 'to xml', 'to json'], category: 'Formatting', icon: FileCode, color: 'from-emerald-500 to-teal-500' },
  { id: 'csv-json', name: 'CSV ↔ JSON', description: 'Convert between CSV spreadsheets and JSON with type inference', keywords: ['spreadsheet', 'convert', 'parse', 'table', 'excel', 'delimiter'], category: 'Formatting', icon: FileSpreadsheet, color: 'from-green-500 to-emerald-600', isNew: true },
  { id: 'html-preview', name: 'HTML Preview', description: 'Live render HTML with instant preview sandbox', keywords: ['render', 'browser', 'live preview', 'html viewer', 'sandbox'], category: 'Formatting', icon: Globe, color: 'from-orange-500 to-red-500' },
  { id: 'css-sandbox', name: 'CSS Flexbox & Grid Sandbox', description: 'Prototype CSS Flex and Grid layouts visually', keywords: ['flexbox', 'flex', 'grid', 'layout', 'prototype', 'design'], category: 'Formatting', icon: Grid, color: 'from-fuchsia-500 to-pink-500' },
  { id: 'css-unit-converter', name: 'CSS Unit & Fluid Typography', description: 'Convert CSS units and generate fluid clamp() values', keywords: ['rem', 'px', 'em', 'vw', 'vh', 'clamp', 'fluid', 'typography'], category: 'Formatting', icon: Ruler, color: 'from-fuchsia-500 to-purple-600' },
  { id: 'json-to-ts', name: 'JSON to TypeScript', description: 'Convert raw JSON into typed TypeScript interfaces', keywords: ['typescript', 'interface', 'type', 'generate types'], category: 'Formatting', icon: Braces, color: 'from-blue-500 to-indigo-500' },
  { id: 'json-schema', name: 'JSON Schema Generator', description: 'Generate draft validation schemas from JSON', keywords: ['draft-07', '2020-12', 'validate', 'openapi', 'schema generator'], category: 'Formatting', icon: Layers, color: 'from-amber-500 to-orange-500' },
  { id: 'jsonpath', name: 'JSONPath Playground', description: 'Query JSON payloads with JSONPath expressions', keywords: ['query', 'json path', 'select', 'filter', 'extract'], category: 'Formatting', icon: ListTree, color: 'from-blue-500 to-indigo-500' },
  { id: 'svg-to-jsx', name: 'SVG to JSX/React', description: 'Convert SVG into optimized React components', keywords: ['react', 'component', 'jsx', 'convert', 'icon'], category: 'Formatting', icon: Code, color: 'from-teal-400 to-emerald-500' },
  { id: 'sql-prettify', name: 'SQL Formatter & Prettifier', description: 'Format SQL statements with configurable casing', keywords: ['format', 'prettier', 'beautify', 'sql formatter'], category: 'Formatting', icon: Database, color: 'from-sky-500 to-blue-500' },
  { id: 'sql-to-orm', name: 'SQL to ORM Entity Generator', description: 'Generate ORM models from SQL CREATE TABLE', keywords: ['prisma', 'sequelize', 'model', 'entity', 'typescript', 'create table'], category: 'Formatting', icon: Code, color: 'from-teal-500 to-emerald-500' },
  { id: 'mock-data', name: 'Mock Data Generator', description: 'Generate random JSON or CSV data from schemas', keywords: ['fake', 'random', 'seed', 'faker', 'test data', 'generate'], category: 'Formatting', icon: Database, color: 'from-violet-500 to-fuchsia-500' },
  { id: 'graphql-to-ts', name: 'GraphQL to TypeScript', description: 'Generate TypeScript types from GraphQL schemas', keywords: ['typescript', 'schema', 'type', 'generate', 'graphql'], category: 'Formatting', icon: Braces, color: 'from-pink-500 to-rose-500' },
  { id: 'docker-converter', name: 'Docker Run ↔ Compose', description: 'Translate Docker run commands to compose configs', keywords: ['docker run', 'compose', 'dockerfile', 'container', 'translate'], category: 'Formatting', icon: Layers, color: 'from-cyan-500 to-blue-500' },

  // ── Encoding ───────────────────────────────────────────────────
  { id: 'encoder', name: 'Encoder & Decoder Sandbox', description: 'Encode/decode via Base64, URL, and HTML entities', keywords: ['base64', 'url encode', 'decode', 'html entities', 'percent', 'urlsafe'], category: 'Encoding', icon: Lock, color: 'from-blue-500 to-cyan-500' },
  { id: 'number-base', name: 'Base Converter', description: 'Convert between decimal, hex, binary & octal', keywords: ['decimal', 'hex', 'binary', 'octal', 'radix', 'convert'], category: 'Encoding', icon: Binary, color: 'from-violet-500 to-blue-500' },
  { id: 'image-base64', name: 'Image to Base64', description: 'Convert images to base64 data URLs', keywords: ['data url', 'image', 'convert', 'png', 'jpeg'], category: 'Encoding', icon: ImageUp, color: 'from-sky-500 to-teal-500' },
  { id: 'qr-code', name: 'QR Code Generator', description: 'Generate QR codes from text, URLs & more', keywords: ['qrcode', 'scan', 'barcode', 'generate', 'qr'], category: 'Encoding', icon: QrCode, color: 'from-fuchsia-500 to-pink-500' },
  { id: 'curl-converter', name: 'cURL Converter', description: 'Convert cURL commands to Fetch, Axios, Python & Go', keywords: ['http', 'request', 'fetch', 'axios', 'rest', 'api', 'python', 'go'], category: 'Encoding', icon: TerminalSquare, color: 'from-fuchsia-500 to-pink-500' },
  { id: 'favicon', name: 'Favicon Generator', description: 'Design SVG favicons from text or emoji with live preview', keywords: ['icon', 'emoji', 'svg', 'browser tab', 'website', 'ico'], category: 'Encoding', icon: Paintbrush, color: 'from-pink-500 to-rose-500', isNew: true },

  // ── Security ───────────────────────────────────────────────────
  { id: 'jwt', name: 'JWT Decoder & Generator', description: 'Decode, inspect, and sign JWT tokens', keywords: ['token', 'jose', 'sign', 'verify', 'auth', 'bearer', 'decode'], category: 'Security', icon: Lock, color: 'from-purple-500 to-pink-500' },
  { id: 'hash', name: 'Hash Generator', description: 'Generate SHA-256 & SHA-512 hashes via Web Crypto', keywords: ['sha256', 'sha512', 'md5', 'digest', 'checksum'], category: 'Security', icon: Hash, color: 'from-green-500 to-emerald-500' },
  { id: 'password', name: 'Password Generator', description: 'Generate strong passwords with entropy estimation', keywords: ['passphrase', 'random', 'entropy', 'strength', 'generate'], category: 'Security', icon: KeyRound, color: 'from-red-500 to-rose-500' },
  { id: 'aes', name: 'AES Encrypt/Decrypt', description: 'Encrypt & decrypt text using AES CBC/CTR/GCM modes', keywords: ['encrypt', 'decrypt', 'cipher', 'cbc', 'ctr', 'gcm', 'key'], category: 'Security', icon: Shield, color: 'from-zinc-500 to-indigo-500' },
  { id: 'rsa-sandbox', name: 'RSA Sandbox', description: 'Generate RSA keys, sign messages & verify payloads', keywords: ['public key', 'private key', 'sign', 'verify', 'cryptography', 'signature'], category: 'Security', icon: Shield, color: 'from-indigo-500 to-purple-500' },
  { id: 'bcrypt', name: 'Bcrypt Generator & Checker', description: 'Generate and verify Bcrypt hashes with configurable rounds', keywords: ['hash', 'salt', 'rounds', 'verify', 'password'], category: 'Security', icon: Shield, color: 'from-rose-500 to-pink-600' },
  { id: 'chmod', name: 'Chmod Calculator', description: 'Convert Unix permissions: octal, symbolic & special bits', keywords: ['unix', 'permissions', 'octal', 'symbolic', '777', '755'], category: 'Security', icon: Shield, color: 'from-blue-500 to-indigo-600' },
  { id: 'card-iban', name: 'Card & IBAN Helper', description: 'Generate test card numbers and validate IBANs by country', keywords: ['credit card', 'luhn', 'iban', 'bank', 'visa', 'mastercard', 'validate'], category: 'Security', icon: CreditCard, color: 'from-rose-500 to-pink-600' },

  // ── Network ────────────────────────────────────────────────────
  { id: 'subnet', name: 'IP Subnet Calculator', description: 'Calculate CIDR subnets, mask values & usable hosts', keywords: ['cidr', 'ip', 'mask', 'hosts', 'ipv4', 'network'], category: 'Network', icon: Network, color: 'from-cyan-500 to-blue-500' },
  { id: 'mask-converter', name: 'Subnet Mask Converter', description: 'Convert between CIDR, subnet masks & wildcard masks', keywords: ['cidr', 'subnet mask', 'wildcard', 'convert'], category: 'Network', icon: Layers, color: 'from-teal-500 to-emerald-600' },
  { id: 'ipv6', name: 'IPv6 Address Helper', description: 'Expand, compress, validate & parse IPv6 addresses', keywords: ['address', 'expand', 'compress', 'validate', 'ip'], category: 'Network', icon: Globe, color: 'from-blue-500 to-cyan-500' },
  { id: 'mac-lookup', name: 'MAC Address Lookup', description: 'Look up MAC vendor, type & admin status', keywords: ['vendor', 'oui', 'ethernet', 'hardware', 'mac address'], category: 'Network', icon: Cpu, color: 'from-purple-500 to-indigo-500' },
  { id: 'dns-decoder', name: 'DNS Record Decoder', description: 'Parse DNS queries and responses from HEX streams', keywords: ['dns', 'packet', 'hex', 'query', 'response', 'parser'], category: 'Network', icon: Globe, color: 'from-emerald-500 to-teal-600' },
  { id: 'http-status', name: 'HTTP Status Code Glossary', description: 'Searchable reference for all HTTP status codes', keywords: ['404', '500', 'status codes', 'rest', 'api', 'reference'], category: 'Network', icon: Globe, color: 'from-blue-500 to-cyan-500' },
  { id: 'user-agent', name: 'User-Agent Parser', description: 'Parse browser UA strings and detect client specs', keywords: ['browser', 'ua', 'device', 'detect', 'client'], category: 'Network', icon: Laptop, color: 'from-teal-500 to-emerald-500' },

  // ── Text ───────────────────────────────────────────────────────
  { id: 'regex', name: 'Regex Tester', description: 'Live regex matching with group capture support', keywords: ['regular expression', 'pattern', 'match', 'capture', 'test'], category: 'Text', icon: Regex, color: 'from-violet-500 to-purple-500' },
  { id: 'uuid', name: 'UUID Generator', description: 'Generate bulk UUIDs (v1, v4, v7)', keywords: ['guid', 'generate', 'random', 'v4', 'v7', 'bulk'], category: 'Text', icon: Type, color: 'from-cyan-500 to-blue-500' },
  { id: 'string-utils', name: 'Text & String Utilities', description: 'Analyze word counts, generate Lorem, transform cases', keywords: ['case', 'slug', 'lorem', 'word count', 'transform', 'uppercase'], category: 'Text', icon: AlignLeft, color: 'from-sky-500 to-indigo-500' },
  { id: 'diff-checker', name: 'Diff Checker', description: 'Compare texts and highlight line-by-line differences', keywords: ['compare', 'text', 'diff', 'git diff'], category: 'Text', icon: GitCompare, color: 'from-red-400 to-rose-600' },
  { id: 'git-generator', name: 'Git Command Generator', description: 'Visually construct Git commands with explanations', keywords: ['git command', 'commit', 'branch', 'cheat sheet', 'build'], category: 'Text', icon: GitBranch, color: 'from-orange-500 to-red-500' },
  { id: 'prompt-builder', name: 'System Prompt Builder', description: 'Structure and generate high-quality LLM prompts', keywords: ['llm', 'ai', 'prompt', 'chatgpt', 'system', 'context'], category: 'Text', icon: Bot, color: 'from-purple-500 to-indigo-500' },
  { id: 'gitignore', name: '.gitignore Generator', description: 'Compile a .gitignore for OS, IDE & language', keywords: ['git', 'ignore', 'templates', 'node_modules'], category: 'Text', icon: FileMinus, color: 'from-orange-500 to-amber-500' },
  { id: 'llm-pricing', name: 'LLM Pricing Calculator', description: 'Compare token costs across AI models', keywords: ['token', 'cost', 'ai', 'gpt', 'claude', 'estimate'], category: 'Text', icon: Calculator, color: 'from-teal-400 to-emerald-600' },
  { id: 'sitemap', name: 'Sitemap Generator', description: 'Generate sitemap.xml and robots.txt for SEO', keywords: ['seo', 'robots.txt', 'xml', 'crawl', 'sitemap.xml'], category: 'Text', icon: ListTree, color: 'from-emerald-500 to-green-600', isNew: true },


  { id: 'nepali-romanized', name: 'Romanized to Nepali', description: 'Instantly convert Romanized English (e.g., "namaste") to Nepali Unicode (Devanagari).', keywords: ['devanagari', 'unicode', 'nepali', 'roman', 'translate', 'typ'], category: 'Text', icon: Languages, color: 'from-orange-500 to-red-500', isNew: true },

  // ── Date & Time ────────────────────────────────────────────────
  { id: 'date-toolbox', name: 'Date, Time & Epoch Sandbox', description: 'Parse timestamps, convert timezones & calculate offsets', keywords: ['epoch', 'timestamp', 'unix', 'timezone', 'convert'], category: 'Date & Time', icon: Clock, color: 'from-rose-500 to-red-500' },
  { id: 'cron', name: 'Cron Parser', description: 'Translate cron expressions to plain English', keywords: ['schedule', 'cronjob', 'expression', 'every', 'time'], category: 'Date & Time', icon: CalendarClock, color: 'from-indigo-500 to-blue-500' },
  { id: 'timezone', name: 'Time Zone Converter', description: 'Convert time across IANA timezones worldwide', keywords: ['time', 'utc', 'gmt', 'world clock', 'iana'], category: 'Date & Time', icon: Earth, color: 'from-emerald-500 to-teal-500' },
  { id: 'nepali-calendar', name: 'Nepali BS ↔ AD Calendar', description: 'Convert between Bikram Sambat and Gregorian dates', keywords: ['bikram sambat', 'bs', 'gregorian', 'ad', 'convert'], category: 'Date & Time', icon: SunMoon, color: 'from-red-500 to-rose-500' },
  { id: 'sql-designer', name: 'SQL Schema Designer', description: 'Visually design database schemas, draw relationships, and generate SQL scripts.', keywords: ['erd', 'database', 'diagram', 'schema', 'tables', 'relationship'], category: 'Formatting', icon: Database, color: 'from-blue-500 to-indigo-500', isNew: true },
] as const;

export const categories: ToolCategory[] = ['Formatting', 'Encoding', 'Security', 'Network', 'Text', 'Date & Time'];

export const categoryLabels: Record<ToolCategory, string> = {
  'Formatting': 'Formatting',
  'Encoding': 'Encoding',
  'Security': 'Security',
  'Network': 'Network',
  'Text': 'Text',
  'Date & Time': 'Date & Time',
};

export function getToolById(id: string): ToolDef | undefined {
  return tools.find((t) => t.id === id);
}

export function getToolsByCategory(category: ToolCategory): ToolDef[] {
  return tools.filter((t) => t.category === category);
}

export function getNewTools(): ToolDef[] {
  return tools.filter((t) => t.isNew);
}

export function toolMatchesQuery(tool: ToolDef, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return (
    tool.name.toLowerCase().includes(q) ||
    tool.description.toLowerCase().includes(q) ||
    tool.category.toLowerCase().includes(q) ||
    (tool.keywords ?? []).some((k) => k.toLowerCase().includes(q))
  );
}

export function searchTools(query: string): ToolDef[] {
  const q = query.toLowerCase().trim();
  if (!q) return tools;
  return tools.filter((t) => toolMatchesQuery(t, q));
}
