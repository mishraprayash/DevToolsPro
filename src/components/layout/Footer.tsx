'use client';

import Link from 'next/link';
import { useAppStore } from '@/lib/store/useStore';
import { tools, type ToolCategory } from '@/tools/registry';

const categoryLinks: { cat: ToolCategory; ids: string[] }[] = [
  { cat: 'Formatting', ids: ['json', 'yaml-json', 'html-preview', 'css-sandbox'] },
  { cat: 'Encoding', ids: ['encoder', 'number-base', 'qr-code', 'curl-converter'] },
  { cat: 'Security', ids: ['jwt', 'hash', 'password', 'aes'] },
];

const toolMap = new Map(tools.map(t => [t.id, t]));

export function Footer() {
  const { setFeedbackOpen } = useAppStore();

  const getTools = (ids: string[]) => ids.map(id => toolMap.get(id)).filter(Boolean) as typeof tools;

  return (
    <footer className="border-t border-border bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center shadow-sm shadow-accent/20">
                <span className="text-bg-primary font-bold text-sm">D</span>
              </div>
              <span className="font-outfit font-semibold text-base text-text-primary">DevTools Pro</span>
            </Link>
            <p className="mt-3 text-xs text-text-secondary leading-relaxed max-w-xs">
              An offline-first suite of {tools.length} developer utilities. Open source, privacy-first, keyboard-driven.
            </p>
          </div>

          {categoryLinks.map(({ cat, ids }) => (
            <div key={cat}>
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">{cat}</h3>
              <ul className="space-y-1.5">
                {getTools(ids).map((tool) => (
                  <li key={tool.id}>
                    <Link href={`/tools/${tool.id}`} className="text-xs text-text-secondary hover:text-text-primary transition-colors">
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-text-muted">
            © {new Date().getFullYear()} DevTools Pro. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFeedbackOpen(true)}
              className="text-[11px] text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              Feedback
            </button>
            <a
              href="https://github.com/mishraprayash/DevToolsPro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-text-primary transition-colors"
              aria-label="GitHub"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
