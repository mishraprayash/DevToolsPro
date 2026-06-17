import type { ElementType } from 'react';
import {
  Shield, Network, Layers, Globe, Cpu, FileJson, Lock, Hash, Clock, Regex, Type,
  TerminalSquare, CalendarClock, Palette, KeyRound, FileCode, AlignLeft, Binary,
  ImageUp, Earth, QrCode, Braces, Code, GitCompare, Ruler, SunMoon, Fingerprint,
  Laptop, Grid, Database, GitBranch, Calculator, Bot, Sparkles, FileMinus, Star,
  CreditCard, GripHorizontal, Box, Monitor, ScanLine, Ban, ArrowLeftRight, Wifi,
  Smartphone, Paintbrush, SlidersHorizontal, Combine, ListTree, Languages
} from 'lucide-react';

export type ToolCategory = 'Formatting' | 'Encoding' | 'Security' | 'Network' | 'Text' | 'Date & Time';

export interface ToolDef {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  color: string;
  icon: ElementType;
  isNew?: boolean;
}

export const tools: ToolDef[] = [
  // ── Formatting ─────────────────────────────────────────────────
  { id: 'json', name: 'JSON Beautifier', description: 'Format, minify, sort keys & validate JSON', category: 'Formatting', icon: FileJson, color: 'from-amber-500 to-orange-500' },
  { id: 'color', name: 'Color Converter', description: 'Convert between hex, RGB, HSL, and more', category: 'Formatting', icon: Palette, color: 'from-pink-500 to-purple-500' },
  { id: 'yaml-json', name: 'YAML ↔ JSON', description: 'Bidirectional YAML and JSON conversion', category: 'Formatting', icon: FileCode, color: 'from-teal-500 to-emerald-500' },
  { id: 'xml-json', name: 'XML ↔ JSON', description: 'Convert between XML and JSON formats', category: 'Formatting', icon: FileCode, color: 'from-emerald-500 to-teal-500' },
  { id: 'html-preview', name: 'HTML Preview', description: 'Live render HTML with instant preview sandbox', category: 'Formatting', icon: Globe, color: 'from-orange-500 to-red-500' },
  { id: 'css-sandbox', name: 'CSS Flexbox & Grid Sandbox', description: 'Prototype CSS Flex and Grid layouts visually', category: 'Formatting', icon: Grid, color: 'from-fuchsia-500 to-pink-500' },
  { id: 'css-unit-converter', name: 'CSS Unit & Fluid Typography', description: 'Convert CSS units and generate fluid clamp() values', category: 'Formatting', icon: Ruler, color: 'from-fuchsia-500 to-purple-600' },
  { id: 'json-to-ts', name: 'JSON to TypeScript', description: 'Convert raw JSON into typed TypeScript interfaces', category: 'Formatting', icon: Braces, color: 'from-blue-500 to-indigo-500' },
  { id: 'json-schema', name: 'JSON Schema Generator', description: 'Generate draft validation schemas from JSON', category: 'Formatting', icon: Layers, color: 'from-amber-500 to-orange-500' },
  { id: 'jsonpath', name: 'JSONPath Playground', description: 'Query JSON payloads with JSONPath expressions', category: 'Formatting', icon: ListTree, color: 'from-blue-500 to-indigo-500' },
  { id: 'svg-to-jsx', name: 'SVG to JSX/React', description: 'Convert SVG into optimized React components', category: 'Formatting', icon: Code, color: 'from-teal-400 to-emerald-500' },
  { id: 'sql-prettify', name: 'SQL Formatter & Prettifier', description: 'Format SQL statements with configurable casing', category: 'Formatting', icon: Database, color: 'from-sky-500 to-blue-500' },
  { id: 'sql-to-orm', name: 'SQL to ORM Entity Generator', description: 'Generate ORM models from SQL CREATE TABLE', category: 'Formatting', icon: Code, color: 'from-teal-500 to-emerald-500' },
  { id: 'mock-data', name: 'Mock Data Generator', description: 'Generate random JSON or CSV data from schemas', category: 'Formatting', icon: Database, color: 'from-violet-500 to-fuchsia-500' },
  { id: 'graphql-to-ts', name: 'GraphQL to TypeScript', description: 'Generate TypeScript types from GraphQL schemas', category: 'Formatting', icon: Braces, color: 'from-pink-500 to-rose-500' },
  { id: 'docker-converter', name: 'Docker Run ↔ Compose', description: 'Translate Docker run commands to compose configs', category: 'Formatting', icon: Layers, color: 'from-cyan-500 to-blue-500' },

  // ── Encoding ───────────────────────────────────────────────────
  { id: 'encoder', name: 'Encoder & Decoder Sandbox', description: 'Encode/decode via Base64, URL, and HTML entities', category: 'Encoding', icon: Lock, color: 'from-blue-500 to-cyan-500' },
  { id: 'number-base', name: 'Base Converter', description: 'Convert between decimal, hex, binary & octal', category: 'Encoding', icon: Binary, color: 'from-violet-500 to-blue-500' },
  { id: 'image-base64', name: 'Image to Base64', description: 'Convert images to base64 data URLs', category: 'Encoding', icon: ImageUp, color: 'from-sky-500 to-teal-500' },
  { id: 'qr-code', name: 'QR Code Generator', description: 'Generate QR codes from text, URLs & more', category: 'Encoding', icon: QrCode, color: 'from-fuchsia-500 to-pink-500' },
  { id: 'curl-converter', name: 'cURL Converter', description: 'Convert cURL commands to Fetch, Axios, Python & Go', category: 'Encoding', icon: TerminalSquare, color: 'from-fuchsia-500 to-pink-500' },

  // ── Security ───────────────────────────────────────────────────
  { id: 'jwt', name: 'JWT Decoder & Generator', description: 'Decode, inspect, and sign JWT tokens', category: 'Security', icon: Lock, color: 'from-purple-500 to-pink-500' },
  { id: 'hash', name: 'Hash Generator', description: 'Generate SHA-256 & SHA-512 hashes via Web Crypto', category: 'Security', icon: Hash, color: 'from-green-500 to-emerald-500' },
  { id: 'password', name: 'Password Generator', description: 'Generate strong passwords with entropy estimation', category: 'Security', icon: KeyRound, color: 'from-red-500 to-rose-500' },
  { id: 'aes', name: 'AES Encrypt/Decrypt', description: 'Encrypt & decrypt text using AES CBC/CTR/GCM modes', category: 'Security', icon: Shield, color: 'from-zinc-500 to-indigo-500' },
  { id: 'rsa-sandbox', name: 'RSA Sandbox', description: 'Generate RSA keys, sign messages & verify payloads', category: 'Security', icon: Shield, color: 'from-indigo-500 to-purple-500' },
  { id: 'bcrypt', name: 'Bcrypt Generator & Checker', description: 'Generate and verify Bcrypt hashes with configurable rounds', category: 'Security', icon: Shield, color: 'from-rose-500 to-pink-600' },
  { id: 'chmod', name: 'Chmod Calculator', description: 'Convert Unix permissions: octal, symbolic & special bits', category: 'Security', icon: Shield, color: 'from-blue-500 to-indigo-600' },
  { id: 'card-iban', name: 'Card & IBAN Helper', description: 'Generate test card numbers and validate IBANs by country', category: 'Security', icon: CreditCard, color: 'from-rose-500 to-pink-600' },

  // ── Network ────────────────────────────────────────────────────
  { id: 'subnet', name: 'IP Subnet Calculator', description: 'Calculate CIDR subnets, mask values & usable hosts', category: 'Network', icon: Network, color: 'from-cyan-500 to-blue-500' },
  { id: 'mask-converter', name: 'Subnet Mask Converter', description: 'Convert between CIDR, subnet masks & wildcard masks', category: 'Network', icon: Layers, color: 'from-teal-500 to-emerald-600' },
  { id: 'ipv6', name: 'IPv6 Address Helper', description: 'Expand, compress, validate & parse IPv6 addresses', category: 'Network', icon: Globe, color: 'from-blue-500 to-cyan-500' },
  { id: 'mac-lookup', name: 'MAC Address Lookup', description: 'Look up MAC vendor, type & admin status', category: 'Network', icon: Cpu, color: 'from-purple-500 to-indigo-500' },
  { id: 'dns-decoder', name: 'DNS Record Decoder', description: 'Parse DNS queries and responses from HEX streams', category: 'Network', icon: Globe, color: 'from-emerald-500 to-teal-600' },
  { id: 'http-status', name: 'HTTP Status Code Glossary', description: 'Searchable reference for all HTTP status codes', category: 'Network', icon: Globe, color: 'from-blue-500 to-cyan-500' },
  { id: 'user-agent', name: 'User-Agent Parser', description: 'Parse browser UA strings and detect client specs', category: 'Network', icon: Laptop, color: 'from-teal-500 to-emerald-500' },

  // ── Text ───────────────────────────────────────────────────────
  { id: 'regex', name: 'Regex Tester', description: 'Live regex matching with group capture support', category: 'Text', icon: Regex, color: 'from-violet-500 to-purple-500' },
  { id: 'uuid', name: 'UUID Generator', description: 'Generate bulk UUIDs (v1, v4, v7)', category: 'Text', icon: Type, color: 'from-cyan-500 to-blue-500' },
  { id: 'string-utils', name: 'Text & String Utilities', description: 'Analyze word counts, generate Lorem, transform cases', category: 'Text', icon: AlignLeft, color: 'from-sky-500 to-indigo-500' },
  { id: 'diff-checker', name: 'Diff Checker', description: 'Compare texts and highlight line-by-line differences', category: 'Text', icon: GitCompare, color: 'from-red-400 to-rose-600' },
  { id: 'git-generator', name: 'Git Command Generator', description: 'Visually construct Git commands with explanations', category: 'Text', icon: GitBranch, color: 'from-orange-500 to-red-500' },
  { id: 'prompt-builder', name: 'System Prompt Builder', description: 'Structure and generate high-quality LLM prompts', category: 'Text', icon: Bot, color: 'from-purple-500 to-indigo-500' },
  { id: 'gitignore', name: '.gitignore Generator', description: 'Compile a .gitignore for OS, IDE & language', category: 'Text', icon: FileMinus, color: 'from-orange-500 to-amber-500' },
  { id: 'llm-pricing', name: 'LLM Pricing Calculator', description: 'Compare token costs across AI models', category: 'Text', icon: Calculator, color: 'from-teal-400 to-emerald-600' },


  { id: 'nepali-romanized', name: 'Romanized to Nepali', description: 'Instantly convert Romanized English (e.g., "namaste") to Nepali Unicode (Devanagari).', category: 'Text', icon: Languages, color: 'from-orange-500 to-red-500', isNew: true },

  // ── Date & Time ────────────────────────────────────────────────
  { id: 'date-toolbox', name: 'Date, Time & Epoch Sandbox', description: 'Parse timestamps, convert timezones & calculate offsets', category: 'Date & Time', icon: Clock, color: 'from-rose-500 to-red-500' },
  { id: 'cron', name: 'Cron Parser', description: 'Translate cron expressions to plain English', category: 'Date & Time', icon: CalendarClock, color: 'from-indigo-500 to-blue-500' },
  { id: 'timezone', name: 'Time Zone Converter', description: 'Convert time across IANA timezones worldwide', category: 'Date & Time', icon: Earth, color: 'from-emerald-500 to-teal-500' },
  { id: 'nepali-calendar', name: 'Nepali BS ↔ AD Calendar', description: 'Convert between Bikram Sambat and Gregorian dates', category: 'Date & Time', icon: SunMoon, color: 'from-red-500 to-rose-500' },
  { id: 'sql-designer', name: 'SQL Schema Designer', description: 'Visually design database schemas, draw relationships, and generate SQL scripts.', category: 'Formatting', icon: Database, color: 'from-blue-500 to-indigo-500', isNew: true },
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

export function searchTools(query: string): ToolDef[] {
  const q = query.toLowerCase().trim();
  if (!q) return tools;
  return tools.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
  );
}
