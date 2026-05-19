'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FileJson, Lock, Hash, Clock, Regex, FileCode, Link2, CalendarClock, Type, Palette, KeyRound, Globe, AlignLeft, Binary, ImageUp, Earth, QrCode, Braces, Code, GitCompare, Ruler, CalendarPlus, SunMoon, Fingerprint } from 'lucide-react';
import { useAppStore } from '@/lib/store/useStore';
import { Modal } from '@/components/ui/Modal';

const tools = [
  { id: 'json', name: 'JSON Beautifier', description: 'Format, minify, sort & validate JSON', icon: FileJson, category: 'Formatting' },
  { id: 'color', name: 'Color Converter', description: 'Convert hex, RGB & HSL colours', icon: Palette, category: 'Formatting' },
  { id: 'yaml-json', name: 'YAML ↔ JSON', description: 'Convert between YAML and JSON', icon: FileCode, category: 'Formatting' },
  { id: 'html-preview', name: 'HTML Preview', description: 'Live render HTML with preview', icon: Globe, category: 'Formatting' },
  { id: 'base64', name: 'Base64 Encoder', description: 'Encode and decode Base64', icon: Lock, category: 'Encoding' },
  { id: 'url', name: 'URL Encoder', description: 'Encode and decode URLs', icon: Link2, category: 'Encoding' },
  { id: 'number-base', name: 'Base Converter', description: 'Convert decimal, hex, binary & octal', icon: Binary, category: 'Encoding' },
  { id: 'image-base64', name: 'Image to Base64', description: 'Convert images to base64 data URLs', icon: ImageUp, category: 'Encoding' },
  { id: 'jwt', name: 'JWT Decoder', description: 'Decode and inspect JWT tokens', icon: Lock, category: 'Security' },
  { id: 'hash', name: 'Hash Generator', description: 'Generate SHA-256 & SHA-512 hashes', icon: Hash, category: 'Security' },
  { id: 'password', name: 'Password Generator', description: 'Generate strong passwords', icon: KeyRound, category: 'Security' },
  { id: 'timestamp', name: 'Timestamp Converter', description: 'Convert Unix timestamps to dates', icon: Clock, category: 'Date & Time' },
  { id: 'cron', name: 'Cron Parser', description: 'Parse cron expressions to English', icon: CalendarClock, category: 'Date & Time' },
  { id: 'regex', name: 'Regex Tester', description: 'Test regex with live highlighting', icon: Regex, category: 'Text' },
  { id: 'uuid', name: 'UUID Generator', description: 'Generate UUID v4 identifiers', icon: Type, category: 'Text' },
  { id: 'lorem-ipsum', name: 'Lorem Ipsum', description: 'Generate placeholder text', icon: AlignLeft, category: 'Text' },
  { id: 'text-statistics', name: 'Text Statistics', description: 'Words, chars, lines & read time', icon: Search, category: 'Text' },
  { id: 'slugify', name: 'Slugify', description: 'Generate URL-friendly slugs', icon: Link2, category: 'Text' },
  { id: 'html-entities', name: 'HTML Entities', description: 'Encode or decode HTML entities', icon: FileCode, category: 'Formatting' },
  { id: 'timezone', name: 'Time Zone Converter', description: 'Convert time across timezones', icon: Earth, category: 'Date & Time' },
  { id: 'qr-code', name: 'QR Code Generator', description: 'Generate QR codes from text & URLs', icon: QrCode, category: 'Encoding' },
  { id: 'json-to-ts', name: 'JSON to TypeScript', description: 'Convert JSON into TypeScript interfaces & types', icon: Braces, category: 'Formatting' },
  { id: 'svg-to-jsx', name: 'SVG to JSX/React', description: 'Convert SVG into React/JSX components', icon: Code, category: 'Formatting' },
  { id: 'diff-checker', name: 'Diff Checker', description: 'Compare texts and highlight line-by-line differences', icon: GitCompare, category: 'Text' },
  { id: 'css-unit-converter', name: 'CSS Unit & Fluid Typography', description: 'Convert CSS sizing values or generate fluid responsive clamp layouts', icon: Ruler, category: 'Formatting' },
  { id: 'date-calculator', name: 'Date Calculator', description: 'Add/subtract time offsets or calculate business and working days', icon: CalendarPlus, category: 'Date & Time' },
  { id: 'nepali-calendar', name: 'Nepali BS ↔ AD Calendar', description: 'Convert dates bidirectionally between Bikram Sambat and Gregorian calendars', icon: SunMoon, category: 'Date & Time' },
  { id: 'rsa-generator', name: 'RSA Keypair Generator', description: 'Generate public and private RSA encryption keys in PEM format', icon: Fingerprint, category: 'Security' },
];

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const filteredTools = React.useMemo(() => {
    if (!query) return tools;
    const lower = query.toLowerCase();
    return tools.filter(
      (t) => t.name.toLowerCase().includes(lower) || t.description.toLowerCase().includes(lower) || t.category.toLowerCase().includes(lower)
    );
  }, [query]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (toolId: string) => {
    router.push(`/tools/${toolId}`);
    setCommandPaletteOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => (i + 1) % filteredTools.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => (i - 1 + filteredTools.length) % filteredTools.length); }
    else if (e.key === 'Enter' && filteredTools[selectedIndex]) { handleSelect(filteredTools[selectedIndex].id); }
  };

  return (
    <Modal open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)}>
      <div className="relative" onKeyDown={handleKeyDown}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
        <input type="text" placeholder="Search tools..." value={query} onChange={(e) => setQuery(e.target.value)}
          className="w-full h-14 pl-12 pr-10 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none text-lg" autoFocus />
        <button onClick={() => setCommandPaletteOpen(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 max-h-80 overflow-y-auto">
        <AnimatePresence mode="wait">
          {filteredTools.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center text-text-muted">No tools found</motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
              {filteredTools.map((tool, index) => {
                const Icon = tool.icon;
                return (
                  <button key={tool.id} onClick={() => handleSelect(tool.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      index === selectedIndex ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary'
                    }`}>
                    <div className="p-2 rounded-lg bg-bg-tertiary"><Icon className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{tool.name}</p>
                      <p className="text-xs text-text-muted truncate">{tool.description}</p>
                    </div>
                    <span className="text-xs text-text-muted">{tool.category}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded">↑↓</kbd> navigate</span>
        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded">↵</kbd> select</span>
        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-bg-tertiary rounded">esc</kbd> close</span>
      </div>
    </Modal>
  );
}
