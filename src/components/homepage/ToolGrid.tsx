'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileJson, Lock, Hash, Clock, Regex, Type, Link2,
  CalendarClock, Palette, KeyRound, FileCode,
  Globe, AlignLeft, Binary, ImageUp, Search, ArrowRight, Command,
  Earth, QrCode, Braces, Code, GitCompare, Ruler, CalendarPlus, SunMoon, Fingerprint,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/useStore';

interface ToolDef {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  icon: React.ElementType;
}

const tools: ToolDef[] = [
  { id: 'json', name: 'JSON Beautifier', description: 'Format, minify, sort keys & validate JSON', category: 'Formatting', icon: FileJson, color: 'from-amber-500 to-orange-500' },
  { id: 'base64', name: 'Base64 Encoder', description: 'Encode & decode Base64 and URL-safe variants', category: 'Encoding', icon: Lock, color: 'from-blue-500 to-cyan-500' },
  { id: 'jwt', name: 'JWT Decoder', description: 'Inspect header, payload & expiry of any JWT', category: 'Security', icon: Lock, color: 'from-purple-500 to-pink-500' },
  { id: 'hash', name: 'Hash Generator', description: 'SHA-256 & SHA-512 via Web Crypto API', category: 'Security', icon: Hash, color: 'from-green-500 to-emerald-500' },
  { id: 'timestamp', name: 'Timestamp Converter', description: 'Convert Unix timestamps to human-readable dates', category: 'Date & Time', icon: Clock, color: 'from-rose-500 to-red-500' },
  { id: 'regex', name: 'Regex Tester', description: 'Live match highlighting with group capture', category: 'Text', icon: Regex, color: 'from-violet-500 to-purple-500' },
  { id: 'uuid', name: 'UUID Generator', description: 'Generate bulk UUID v4 identifiers instantly', category: 'Text', icon: Type, color: 'from-cyan-500 to-blue-500' },
  { id: 'url', name: 'URL Encoder', description: 'Encode & decode URL components', category: 'Encoding', icon: Link2, color: 'from-orange-500 to-amber-500' },
  { id: 'cron', name: 'Cron Parser', description: 'Translate cron expressions to plain English', category: 'Date & Time', icon: CalendarClock, color: 'from-indigo-500 to-blue-500' },
  { id: 'color', name: 'Color Converter', description: 'Convert between hex, RGB & HSL colour formats', category: 'Formatting', icon: Palette, color: 'from-pink-500 to-purple-500' },
  { id: 'password', name: 'Password Generator', description: 'Generate strong, customisable passwords', category: 'Security', icon: KeyRound, color: 'from-red-500 to-rose-500' },
  { id: 'yaml-json', name: 'YAML ↔ JSON', description: 'Convert between YAML and JSON formats', category: 'Formatting', icon: FileCode, color: 'from-teal-500 to-emerald-500' },
  { id: 'html-preview', name: 'HTML Preview', description: 'Live render HTML with instant preview', category: 'Formatting', icon: Globe, color: 'from-orange-500 to-red-500' },
  { id: 'lorem-ipsum', name: 'Lorem Ipsum', description: 'Generate placeholder text in various lengths', category: 'Text', icon: AlignLeft, color: 'from-sky-500 to-indigo-500' },
  { id: 'text-statistics', name: 'Text Statistics', description: 'Words, chars, lines & read time', category: 'Text', icon: Search, color: 'from-amber-400 to-yellow-500' },
  { id: 'slugify', name: 'Slugify', description: 'Generate URL-friendly slugs from titles', category: 'Text', icon: Link2, color: 'from-cyan-400 to-blue-500' },
  { id: 'html-entities', name: 'HTML Entities', description: 'Encode and decode HTML entities', category: 'Formatting', icon: FileCode, color: 'from-orange-400 to-rose-500' },
  { id: 'number-base', name: 'Base Converter', description: 'Convert between decimal, hex, binary & octal', category: 'Encoding', icon: Binary, color: 'from-violet-500 to-blue-500' },
  { id: 'image-base64', name: 'Image to Base64', description: 'Convert images to base64 data URLs', category: 'Encoding', icon: ImageUp, color: 'from-sky-500 to-teal-500' },
  { id: 'timezone', name: 'Time Zone Converter', description: 'Convert time across timezones worldwide', category: 'Date & Time', icon: Earth, color: 'from-emerald-500 to-teal-500' },
  { id: 'qr-code', name: 'QR Code Generator', description: 'Generate QR codes from text, URLs & more', category: 'Encoding', icon: QrCode, color: 'from-fuchsia-500 to-pink-500' },
  { id: 'json-to-ts', name: 'JSON to TypeScript', description: 'Convert raw JSON into typed TypeScript interfaces', category: 'Formatting', icon: Braces, color: 'from-blue-500 to-indigo-500' },
  { id: 'svg-to-jsx', name: 'SVG to JSX/React', description: 'Convert raw SVG into optimized React components', category: 'Formatting', icon: Code, color: 'from-teal-400 to-emerald-500' },
  { id: 'diff-checker', name: 'Diff Checker', description: 'Compare texts and highlight line-by-line differences', category: 'Text', icon: GitCompare, color: 'from-red-400 to-rose-600' },
  { id: 'css-unit-converter', name: 'CSS Unit & Fluid Typography', description: 'Convert CSS sizing values or generate fluid responsive clamp layouts', category: 'Formatting', icon: Ruler, color: 'from-fuchsia-500 to-purple-600' },
  { id: 'date-calculator', name: 'Date Calculator', description: 'Add/subtract time offsets or calculate business and working days', category: 'Date & Time', icon: CalendarPlus, color: 'from-orange-500 to-amber-500' },
  { id: 'nepali-calendar', name: 'Nepali BS ↔ AD Calendar', description: 'Convert dates bidirectionally between Bikram Sambat and Gregorian calendars', category: 'Date & Time', icon: SunMoon, color: 'from-red-500 to-rose-500' },
  { id: 'rsa-generator', name: 'RSA Keypair Generator', description: 'Generate public and private RSA encryption keys in PEM format', category: 'Security', icon: Fingerprint, color: 'from-indigo-500 to-purple-500' }
];

const categories = ['All', 'Formatting', 'Encoding', 'Security', 'Text', 'Date & Time'];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.035 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// ─── Memoised card ───────────────────────────────────────────────────────────

interface ToolCardProps { tool: ToolDef }

const ToolCard = React.memo(function ToolCard({ tool }: ToolCardProps) {
  const Icon = tool.icon;
  return (
    <motion.div variants={cardVariant}>
      <Link href={`/tools/${tool.id}`} className="block h-full">
        <Card hover className="h-full p-5 group cursor-pointer flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110', tool.color)}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] text-text-muted bg-bg-hover border border-border px-2 py-0.5 rounded-full whitespace-nowrap leading-relaxed">
              {tool.category}
            </span>
          </div>
          <div className="mt-3 flex-1">
            <h3 className="font-semibold font-outfit text-sm text-text-primary group-hover:text-accent transition-colors duration-150 leading-snug">
              {tool.name}
            </h3>
            <p className="mt-1 text-xs text-text-secondary leading-relaxed">
              {tool.description}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Open tool
            <ArrowRight className="h-3 w-3" />
          </div>
        </Card>
      </Link>
    </motion.div>
  );
});

// ─── Main export ─────────────────────────────────────────────────────────────

export function ToolGrid() {
  const [query, setQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState('All');
  const { setCommandPaletteOpen } = useAppStore();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    return tools.filter((t) => {
      const matchesCat = activeCategory === 'All' || t.category === activeCategory;
      const matchesQ = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [query, activeCategory]);

  const handleClear = React.useCallback(() => { setQuery(''); setActiveCategory('All'); }, []);

  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { All: tools.length };
    for (const t of tools) {
      counts[t.category] = (counts[t.category] || 0) + 1;
    }
    return counts;
  }, []);

  return (
    <section className="min-h-[calc(100vh-4rem)]">
      <div className="border-b border-border bg-bg-primary/95 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="shrink-0">
              <h1 className="text-lg font-bold font-outfit gradient-text leading-none">DevTools Pro</h1>
            </div>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
              <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools…"
                className="w-full h-9 pl-9 pr-10 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-200" />
              {!query && (
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-text-muted bg-bg-hover border border-border rounded">/</kbd>
              )}
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors text-xs" aria-label="Clear search">✕</button>
              )}
            </div>

            <button onClick={() => setCommandPaletteOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 h-9 shrink-0 rounded-lg border border-border bg-bg-tertiary text-xs text-text-muted hover:text-text-primary hover:border-border-hover transition-all duration-200">
              <Command className="h-3 w-3" /><span>K</span><span className="text-text-muted/70 ml-0.5">quick jump</span>
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={cn('flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150',
                  activeCategory === cat
                    ? 'bg-accent text-bg-primary shadow-sm'
                    : 'bg-bg-tertiary text-text-secondary border border-border hover:border-border-hover hover:text-text-primary'
                )}>
                {cat}
                <span className={cn('text-[10px] px-1.5 py-0 rounded-full leading-5',
                  activeCategory === cat ? 'bg-white/25 text-bg-primary' : 'bg-bg-hover text-text-muted')}>
                  {categoryCounts[cat]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center">
              <Search className="h-8 w-8 text-text-muted mb-3" />
              <p className="text-text-secondary text-sm">No tools match &ldquo;{query}&rdquo;</p>
              <button onClick={handleClear} className="mt-3 text-sm text-accent hover:underline">Clear filters</button>
            </motion.div>
          ) : (
            <motion.div key={activeCategory + query} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              variants={container} initial="hidden" animate="show">
              {filtered.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
            </motion.div>
          )}
        </AnimatePresence>

        {filtered.length > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-12 text-center text-xs text-text-muted">
            Press <kbd className="px-1.5 py-0.5 bg-bg-tertiary border border-border rounded text-[10px]">⌘K</kbd> to jump to any tool instantly
          </motion.p>
        )}
      </div>
    </section>
  );
}
