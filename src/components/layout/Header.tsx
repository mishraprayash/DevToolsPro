'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sun, Moon, Menu, X, Command, MessageSquare, Keyboard, ChevronDown, Home, LayoutGrid, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/lib/store/useStore';
import { GithubIcon } from '@/components/ui/GithubIcon';
import { tools, categories, categorySlug, type ToolCategory } from '@/tools/registry';
import { useFullscreenOverlay } from '@/lib/hooks/useFullscreenOverlay';
import { cn } from '@/lib/utils';

const navLinkClass = 'px-3 py-1.5 text-xs font-medium rounded-lg transition-all';

export function Header() {
  const { theme, toggleTheme, setCommandPaletteOpen, setFeedbackOpen, setShortcutsOpen } = useAppStore();
  const pathname = usePathname() ?? '/';
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [categoriesOpen, setCategoriesOpen] = React.useState(false);
  const categoriesRef = React.useRef<HTMLDivElement>(null);

  // Close menus whenever the route changes (adjusting state during render, not in an effect)
  const [menuPath, setMenuPath] = React.useState(pathname);
  if (pathname !== menuPath) {
    setMenuPath(pathname);
    setMobileMenuOpen(false);
    setCategoriesOpen(false);
  }

  // Mobile menu: Esc closes it and the page behind doesn't scroll
  const closeMobileMenu = React.useCallback(() => setMobileMenuOpen(false), []);
  useFullscreenOverlay(mobileMenuOpen, closeMobileMenu);

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

  // Categories dropdown: close on outside click or Esc
  React.useEffect(() => {
    if (!categoriesOpen) return;
    const handlePointer = (e: PointerEvent) => {
      if (!categoriesRef.current?.contains(e.target as Node)) setCategoriesOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCategoriesOpen(false);
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [categoriesOpen]);

  const toolsByCategory = React.useMemo(() => {
    const map = new Map<ToolCategory, typeof tools>();
    for (const cat of categories) {
      map.set(cat, []);
    }
    for (const tool of tools) {
      map.get(tool.category)?.push(tool);
    }
    return map;
  }, []);

  const isHome = pathname === '/';
  const isAllTools = pathname === '/tools';
  const isCategories = pathname.startsWith('/tools/categories');

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-bg-primary/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center shadow-sm shadow-accent/20">
                  <span className="text-bg-primary font-bold text-sm">D</span>
                </div>
                <span className="font-outfit font-semibold text-base text-text-primary group-hover:text-accent transition-colors">
                  DevTools Pro
                </span>
              </Link>

              <nav className="hidden lg:flex items-center gap-1" aria-label="Main">
                <Link
                  href="/"
                  aria-current={isHome ? 'page' : undefined}
                  className={cn(navLinkClass, isHome ? 'text-text-primary bg-bg-tertiary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary')}
                >
                  Home
                </Link>
                <Link
                  href="/tools"
                  aria-current={isAllTools ? 'page' : undefined}
                  className={cn(navLinkClass, isAllTools ? 'text-text-primary bg-bg-tertiary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary')}
                >
                  All Tools
                </Link>
                <div ref={categoriesRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setCategoriesOpen((open) => !open)}
                    aria-expanded={categoriesOpen}
                    aria-haspopup="true"
                    className={cn(
                      navLinkClass,
                      'flex items-center gap-1',
                      isCategories || categoriesOpen ? 'text-text-primary bg-bg-tertiary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                    )}
                  >
                    Categories
                    <ChevronDown className={cn('h-3 w-3 transition-transform', categoriesOpen && 'rotate-180')} />
                  </button>
                  <AnimatePresence>
                    {categoriesOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-2 w-72 p-2 rounded-xl border border-border bg-bg-secondary shadow-xl"
                      >
                        {categories.map((cat) => {
                          const href = `/tools/categories/${categorySlug(cat)}`;
                          return (
                            <Link
                              key={cat}
                              href={href}
                              aria-current={pathname === href ? 'page' : undefined}
                              className={cn(
                                'flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors',
                                pathname === href ? 'bg-bg-tertiary text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                              )}
                            >
                              <span className="font-medium">{cat}</span>
                              <span className="text-[10px] font-mono text-text-muted">{toolsByCategory.get(cat)?.length ?? 0} tools</span>
                            </Link>
                          );
                        })}
                        <Link
                          href="/tools"
                          className="mt-1 flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-accent hover:bg-accent/10 border-t border-border"
                        >
                          Browse all {tools.length} tools
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Mobile Search Button */}
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="flex sm:hidden items-center justify-center h-8 w-8 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-all"
                aria-label="Search tools"
                title="Search tools (⌘K)"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Desktop Search Button */}
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

              <button
                onClick={() => setShortcutsOpen(true)}
                className="hidden md:flex items-center justify-center h-8 w-8 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-all"
                title="Keyboard Shortcuts (⌘/)"
                aria-label="Keyboard Shortcuts"
              >
                <Keyboard className="h-4 w-4" />
              </button>

              <a
                href="https://github.com/mishraprayash/DevToolsPro"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-all"
                aria-label="GitHub"
              >
                <GithubIcon className="h-4 w-4" />
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
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-border bg-bg-primary overflow-hidden"
            >
              <nav className="px-4 py-4 space-y-5 max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain scrollbar-thin" aria-label="Mobile">
                {/* Quick links */}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/"
                    aria-current={isHome ? 'page' : undefined}
                    className={cn('flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold', isHome ? 'border-accent/30 bg-accent/10 text-accent' : 'border-border bg-bg-secondary text-text-primary')}
                  >
                    <Home className="h-3.5 w-3.5" /> Home
                  </Link>
                  <Link
                    href="/tools"
                    aria-current={isAllTools ? 'page' : undefined}
                    className={cn('flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold', isAllTools ? 'border-accent/30 bg-accent/10 text-accent' : 'border-border bg-bg-secondary text-text-primary')}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" /> All {tools.length} Tools
                  </Link>
                </div>

                {categories.map((cat) => {
                  const catTools = toolsByCategory.get(cat) || [];
                  return (
                    <div key={cat}>
                      <Link
                        href={`/tools/categories/${categorySlug(cat)}`}
                        className="flex items-center justify-between mb-2 text-[10px] text-text-muted uppercase tracking-wider font-semibold hover:text-accent"
                      >
                        <span>{cat}</span>
                        <span className="normal-case tracking-normal font-medium">View {catTools.length} →</span>
                      </Link>
                      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-1">
                        {catTools.map((tool) => {
                          const active = pathname === `/tools/${tool.id}`;
                          return (
                            <Link
                              key={tool.id}
                              href={`/tools/${tool.id}`}
                              aria-current={active ? 'page' : undefined}
                              className={cn(
                                'flex items-center gap-2 py-2 px-2.5 text-xs rounded-lg transition-all',
                                active ? 'bg-accent/10 text-accent font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                              )}
                            >
                              <tool.icon className="h-3.5 w-3.5 shrink-0" />
                              <span className="leading-snug">{tool.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-border grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setMobileMenuOpen(false); setFeedbackOpen(true); }}
                    className="flex items-center gap-2 w-full text-left py-2 px-3 text-xs text-accent hover:text-accent-hover hover:bg-bg-tertiary rounded-lg transition-all font-medium cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Send Feedback</span>
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); setShortcutsOpen(true); }}
                    className="flex items-center gap-2 w-full text-left py-2 px-3 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-all font-medium cursor-pointer"
                  >
                    <Keyboard className="h-3.5 w-3.5" />
                    <span>Shortcuts</span>
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Tap-outside backdrop for the mobile menu (outside the header: its backdrop-filter would contain a fixed child) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileMenu}
            className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
}
