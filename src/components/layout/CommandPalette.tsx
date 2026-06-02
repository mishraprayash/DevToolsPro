'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FileJson, Lock, Hash, Clock, Regex, FileCode, Link2, CalendarClock, Type, Palette, KeyRound, Globe, AlignLeft, Binary, ImageUp, Earth, QrCode, Braces, Code, GitCompare, Ruler, CalendarPlus, SunMoon, Fingerprint, Shield, Laptop, Layers, Grid, Star, History } from 'lucide-react';
import { useAppStore } from '@/lib/store/useStore';
import { Modal } from '@/components/ui/Modal';

const tools = [
  { id: 'json', name: 'JSON Beautifier', description: 'Format, minify, sort & validate JSON', icon: FileJson, category: 'Formatting' },
  { id: 'color', name: 'Color Converter', description: 'Convert hex, RGB & HSL colours', icon: Palette, category: 'Formatting' },
  { id: 'yaml-json', name: 'YAML ↔ JSON', description: 'Convert between YAML and JSON', icon: FileCode, category: 'Formatting' },
  { id: 'xml-json', name: 'XML ↔ JSON', description: 'Convert between XML and JSON', icon: FileCode, category: 'Formatting' },
  { id: 'html-preview', name: 'HTML Preview', description: 'Live render HTML with preview', icon: Globe, category: 'Formatting' },
  { id: 'encoder', name: 'Encoder & Decoder Sandbox', description: 'Encode & decode values via Base64, URL component, and HTML entities', icon: Lock, category: 'Encoding' },
  { id: 'number-base', name: 'Base Converter', description: 'Convert decimal, hex, binary & octal', icon: Binary, category: 'Encoding' },
  { id: 'image-base64', name: 'Image to Base64', description: 'Convert images to base64 data URLs', icon: ImageUp, category: 'Encoding' },
  { id: 'jwt', name: 'JWT Decoder', description: 'Decode and inspect JWT tokens', icon: Lock, category: 'Security' },
  { id: 'hash', name: 'Hash Generator', description: 'Generate SHA-256 & SHA-512 hashes', icon: Hash, category: 'Security' },
  { id: 'password', name: 'Password Generator', description: 'Generate strong passwords', icon: KeyRound, category: 'Security' },
  { id: 'date-toolbox', name: 'Date, Time & Epoch Sandbox', description: 'Parse Unix epoch timestamps, convert timezones, and calculate calendar offsets', icon: Clock, category: 'Date & Time' },
  { id: 'aes', name: 'AES Encrypt/Decrypt', description: 'Encrypt & decrypt text using AES CBC/CTR modes', icon: Shield, category: 'Security' },
  { id: 'cron', name: 'Cron Parser', description: 'Parse cron expressions to English', icon: CalendarClock, category: 'Date & Time' },
  { id: 'regex', name: 'Regex Tester', description: 'Test regex with live highlighting', icon: Regex, category: 'Text' },
  { id: 'uuid', name: 'UUID Generator', description: 'Generate UUID v4 identifiers', icon: Type, category: 'Text' },
  { id: 'string-utils', name: 'Rich Text & String Utilities', description: 'Analyze word counts, generate dummy Lorem paragraphs, and transform slug cases', icon: AlignLeft, category: 'Text' },
  { id: 'timezone', name: 'Time Zone Converter', description: 'Convert time across timezones', icon: Earth, category: 'Date & Time' },
  { id: 'qr-code', name: 'QR Code Generator', description: 'Generate QR codes from text & URLs', icon: QrCode, category: 'Encoding' },
  { id: 'json-to-ts', name: 'JSON to TypeScript', description: 'Convert JSON into TypeScript interfaces & types', icon: Braces, category: 'Formatting' },
  { id: 'svg-to-jsx', name: 'SVG to JSX/React', description: 'Convert SVG into React/JSX components', icon: Code, category: 'Formatting' },
  { id: 'diff-checker', name: 'Diff Checker', description: 'Compare texts and highlight line-by-line differences', icon: GitCompare, category: 'Text' },
  { id: 'css-unit-converter', name: 'CSS Unit & Fluid Typography', description: 'Convert CSS sizing values or generate fluid responsive clamp layouts', icon: Ruler, category: 'Formatting' },
  { id: 'nepali-calendar', name: 'Nepali BS ↔ AD Calendar', description: 'Convert dates bidirectionally between Bikram Sambat and Gregorian calendars', icon: SunMoon, category: 'Date & Time' },
  { id: 'rsa-sandbox', name: 'RSA Sandbox', description: 'Generate public and private RSA keys, sign messages & cryptographically verify payloads', icon: Shield, category: 'Security' },
  { id: 'user-agent', name: 'User-Agent Parser', description: 'Deconstruct browser User-Agent strings and inspect client metrics', icon: Laptop, category: 'Date & Time' },
  { id: 'json-schema', name: 'JSON Schema Generator', description: 'Generate standard draft validation schemas from raw JSON payloads', icon: Layers, category: 'Formatting' },
  { id: 'css-sandbox', name: 'CSS Flexbox & Grid visual sandbox', description: 'Prototype CSS Flex and Grid structures visually with Tailwind and CSS code outputs', icon: Grid, category: 'Formatting' },
];

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen, favorites, recentTools, addRecentTool } = useAppStore();
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const filteredTools = React.useMemo(() => {
    if (!query) {
      const favTools = favorites.map(id => tools.find(t => t.id === id)).filter(Boolean) as typeof tools;
      const recTools = recentTools.filter(id => !favorites.includes(id)).map(id => tools.find(t => t.id === id)).filter(Boolean) as typeof tools;
      const rest = tools.filter(t => !favorites.includes(t.id) && !recentTools.includes(t.id));
      return [...favTools, ...recTools, ...rest];
    }
    const lower = query.toLowerCase();
    return tools.filter(
      (t) => t.name.toLowerCase().includes(lower) || t.description.toLowerCase().includes(lower) || t.category.toLowerCase().includes(lower)
    );
  }, [query, favorites, recentTools]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query, commandPaletteOpen]);

  const handleSelect = (toolId: string) => {
    addRecentTool(toolId);
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
                const isFav = !query && favorites.includes(tool.id);
                const isRecent = !query && !isFav && recentTools.includes(tool.id);
                
                return (
                  <button key={tool.id} onClick={() => handleSelect(tool.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      index === selectedIndex ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:bg-bg-tertiary'
                    }`}>
                    <div className="p-2 rounded-lg bg-bg-tertiary"><Icon className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{tool.name}</p>
                        {isFav && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                        {isRecent && <History className="h-3 w-3 text-blue-500 shrink-0" />}
                      </div>
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
