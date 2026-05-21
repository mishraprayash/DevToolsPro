'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FileJson, Lock, Hash, Clock, Regex, Type, FileCode,
  Link2, CalendarClock, Palette, KeyRound,
  Globe, AlignLeft, Binary, ArrowRight,
  Earth, QrCode
} from 'lucide-react';

const tools = [
  { id: 'json', name: 'JSON Beautifier', description: 'Format, minify, sort & validate JSON', icon: FileJson, color: 'from-amber-500 to-orange-500', category: 'Formatting' },
  { id: 'color', name: 'Color Converter', description: 'Convert hex, RGB & HSL colours', icon: Palette, color: 'from-pink-500 to-purple-500', category: 'Formatting' },
  { id: 'yaml-json', name: 'YAML ↔ JSON', description: 'Convert between YAML and JSON', icon: FileCode, color: 'from-teal-500 to-emerald-500', category: 'Formatting' },
  { id: 'xml-json', name: 'XML ↔ JSON', description: 'Convert between XML and JSON', icon: FileCode, color: 'from-emerald-500 to-teal-500', category: 'Formatting' },
  { id: 'html-preview', name: 'HTML Preview', description: 'Live render HTML with preview', icon: Globe, color: 'from-orange-500 to-red-500', category: 'Formatting' },
  { id: 'base64', name: 'Base64 Encoder', description: 'Encode and decode Base64 strings', icon: Lock, color: 'from-blue-500 to-cyan-500', category: 'Encoding' },
  { id: 'url', name: 'URL Encoder', description: 'Encode and decode URLs', icon: Link2, color: 'from-orange-500 to-amber-500', category: 'Encoding' },
  { id: 'number-base', name: 'Base Converter', description: 'Convert decimal, hex, binary & octal', icon: Binary, color: 'from-violet-500 to-blue-500', category: 'Encoding' },
  { id: 'jwt', name: 'JWT Decoder', description: 'Decode and inspect JWT tokens', icon: Lock, color: 'from-purple-500 to-pink-500', category: 'Security' },
  { id: 'hash', name: 'Hash Generator', description: 'Generate SHA-256 & SHA-512 hashes', icon: Hash, color: 'from-green-500 to-emerald-500', category: 'Security' },
  { id: 'password', name: 'Password Generator', description: 'Generate strong passwords', icon: KeyRound, color: 'from-red-500 to-rose-500', category: 'Security' },
  { id: 'timestamp', name: 'Timestamp Converter', description: 'Convert Unix timestamps to dates', icon: Clock, color: 'from-rose-500 to-red-500', category: 'Date & Time' },
  { id: 'cron', name: 'Cron Parser', description: 'Parse cron expressions to plain English', icon: CalendarClock, color: 'from-indigo-500 to-blue-500', category: 'Date & Time' },
  { id: 'regex', name: 'Regex Tester', description: 'Test regex with live highlighting', icon: Regex, color: 'from-violet-500 to-purple-500', category: 'Text' },
  { id: 'uuid', name: 'UUID Generator', description: 'Generate UUID v4 identifiers', icon: Type, color: 'from-cyan-500 to-blue-500', category: 'Text' },
  { id: 'lorem-ipsum', name: 'Lorem Ipsum', description: 'Generate placeholder text', icon: AlignLeft, color: 'from-sky-500 to-indigo-500', category: 'Text' },
  { id: 'timezone', name: 'Time Zone Converter', description: 'Convert time across timezones worldwide', icon: Earth, color: 'from-emerald-500 to-teal-500', category: 'Date & Time' },
  { id: 'qr-code', name: 'QR Code Generator', description: 'Generate QR codes from text, URLs & more', icon: QrCode, color: 'from-fuchsia-500 to-pink-500', category: 'Encoding' },
];

const categories = [
  { name: 'Formatting', tools: ['json', 'color', 'yaml-json', 'xml-json', 'html-preview'] },
  { name: 'Encoding', tools: ['base64', 'url', 'number-base', 'qr-code'] },
  { name: 'Security', tools: ['jwt', 'hash', 'password'] },
  { name: 'Text', tools: ['regex', 'uuid', 'lorem-ipsum'] },
  { name: 'Date & Time', tools: ['timestamp', 'cron', 'timezone'] },
];

export default function ToolsPage() {
  return (
    <main className="flex-1 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-bold font-outfit">All Tools</h1>
          <p className="mt-4 text-xl text-text-secondary">
            Browse all {tools.length} developer utilities
          </p>
        </div>

        <div className="space-y-12">
          {categories.map((category) => (
            <section key={category.name}>
              <h2 className="text-2xl font-bold font-outfit mb-6">{category.name}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {category.tools.map((toolId) => {
                  const tool = tools.find((t) => t.id === toolId);
                  if (!tool) return null;
                  const Icon = tool.icon;
                  return (
                    <Link key={tool.id} href={`/tools/${tool.id}`}>
                      <motion.div whileHover={{ scale: 1.02, y: -4 }}
                        className="p-6 rounded-xl border border-border bg-bg-secondary hover:border-accent transition-colors cursor-pointer h-full">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-medium font-outfit">{tool.name}</h3>
                        <p className="mt-2 text-sm text-text-secondary">{tool.description}</p>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-accent transition-colors">
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
