'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Sun, Moon, Menu, X, Command } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { useAppStore } from '@/lib/store/useStore';

const tools = [
  { id: 'json', name: 'JSON Beautifier', category: 'formatting' },
  { id: 'base64', name: 'Base64 Encoder', category: 'encoding' },
  { id: 'jwt', name: 'JWT Decoder', category: 'security' },
  { id: 'hash', name: 'Hash Generator', category: 'security' },
  { id: 'timestamp', name: 'Timestamp Converter', category: 'datetime' },
  { id: 'regex', name: 'Regex Tester', category: 'text' },
  { id: 'uuid', name: 'UUID Generator', category: 'text' },
  { id: 'url', name: 'URL Encoder', category: 'encoding' },
  { id: 'cron', name: 'Cron Parser', category: 'datetime' },
  { id: 'text', name: 'Text Case Converter', category: 'text' },
];

const categories = [
  { id: 'encoding', name: 'Encoding', tools: ['base64', 'url'] },
  { id: 'security', name: 'Security', tools: ['jwt', 'hash'] },
  { id: 'formatting', name: 'Formatting', tools: ['json'] },
  { id: 'text', name: 'Text', tools: ['regex', 'uuid', 'text'] },
  { id: 'datetime', name: 'Date & Time', tools: ['timestamp', 'cron'] },
];

export function Header() {
  const { theme, toggleTheme, setCommandPaletteOpen } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [categoriesOpen, setCategoriesOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setCommandPaletteOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-bg-primary/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-viol-500 flex items-center justify-center">
              <span className="text-bg-primary font-bold text-sm">D</span>
            </div>
            <span className="font-outfit font-semibold text-lg group-hover:text-accent transition-colors">
              DevTools Pro
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-md hover:bg-bg-hover"
              >
                Tools
              </button>
              {categoriesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 mt-2 w-48 py-2 rounded-lg border border-border bg-bg-secondary shadow-xl"
                >
                  {categories.map((cat) => (
                    <div key={cat.id} className="px-3 py-2">
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                        {cat.name}
                      </p>
                      {cat.tools.map((toolId) => {
                        const tool = tools.find((t) => t.id === toolId);
                        return tool ? (
                          <Link
                            key={toolId}
                            href={`/tools/${toolId}`}
                            className="block py-1.5 px-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded transition-colors"
                            onClick={() => setCategoriesOpen(false)}
                          >
                            {tool.name}
                          </Link>
                        ) : null;
                      })}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-text-muted bg-bg-tertiary border border-border rounded-lg hover:border-border-hover transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Search tools...</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-bg-hover rounded">
                <Command className="h-3 w-3" />K
              </kbd>
            </button>

            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="sm:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>

            <a
              href="https://github.com/mishraprayash/web-tools"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-bg-hover"
            >
              <FaGithub className="h-5 w-5" />
            </a>

            <button
              onClick={toggleTheme}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-bg-hover"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="md:hidden border-t border-border bg-bg-primary"
        >
          <div className="px-4 py-4 space-y-2">
            {categories.map((cat) => (
              <div key={cat.id}>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">{cat.name}</p>
                <div className="space-y-1">
                  {cat.tools.map((toolId) => {
                    const tool = tools.find((t) => t.id === toolId);
                    return tool ? (
                      <Link
                        key={toolId}
                        href={`/tools/${toolId}`}
                        className="block py-2 px-3 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {tool.name}
                      </Link>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </header>
  );
}