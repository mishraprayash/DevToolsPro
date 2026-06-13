'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sun, Moon, Menu, X, Command, MessageSquare } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { useAppStore } from '@/lib/store/useStore';
import { tools, categories, type ToolCategory } from '@/tools/registry';
import { cn } from '@/lib/utils';

export function Header() {
  const { theme, toggleTheme, setCommandPaletteOpen, setFeedbackOpen } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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

  const toolsByCategory = React.useMemo(() => {
    const map = new Map<ToolCategory, typeof tools>();
    for (const cat of categories) {
      map.set(cat, tools.filter(t => t.category === cat));
    }
    return map;
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-bg-primary/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center shadow-sm shadow-accent/20">
              <span className="text-bg-primary font-bold text-sm">D</span>
            </div>
            <span className="font-outfit font-semibold text-base text-text-primary group-hover:text-accent transition-colors">
              DevTools Pro
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            <Link href="/" className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-all">
              Home
            </Link>
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 h-8 px-3 text-xs text-text-muted bg-bg-tertiary border border-border rounded-lg hover:border-border-hover hover:text-text-primary transition-all duration-200"
              aria-label="Search tools"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search tools...</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] bg-bg-hover rounded border border-border font-mono">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </button>

            <button
              onClick={() => setFeedbackOpen(true)}
              className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-all border border-transparent"
              title="Send Feedback"
            >
              <MessageSquare className="h-3.5 w-3.5 text-accent" />
              <span className="hidden md:inline">Feedback</span>
            </button>

            <a
              href="https://github.com/mishraprayash/web-tools"
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 w-8 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-all"
              aria-label="GitHub"
            >
              <FaGithub className="h-4 w-4" />
            </a>

            <button
              onClick={toggleTheme}
              className="h-8 w-8 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-all"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-8 w-8 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-all"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border bg-bg-primary overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
              {categories.map((cat) => {
                const catTools = toolsByCategory.get(cat) || [];
                return (
                  <div key={cat}>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-2">{cat}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {catTools.map((tool) => (
                        <Link
                          key={tool.id}
                          href={`/tools/${tool.id}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 py-1.5 px-2.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-all"
                        >
                          <tool.icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{tool.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-border">
                <button
                  onClick={() => { setMobileMenuOpen(false); setFeedbackOpen(true); }}
                  className="flex items-center gap-2 w-full text-left py-2 px-3 text-xs text-accent hover:text-accent-hover hover:bg-bg-tertiary rounded-lg transition-all font-medium cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Send Feedback</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
