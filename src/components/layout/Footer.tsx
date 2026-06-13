'use client';

import Link from 'next/link';
import { FaGithub } from 'react-icons/fa';
import { useAppStore } from '@/lib/store/useStore';
import { tools, categories, type ToolCategory } from '@/tools/registry';

const categoryLinks: { cat: ToolCategory; ids: string[] }[] = [
  { cat: 'Formatting', ids: ['json', 'yaml-json', 'html-preview', 'css-sandbox'] },
  { cat: 'Encoding', ids: ['encoder', 'number-base', 'qr-code', 'curl-converter'] },
  { cat: 'Security', ids: ['jwt', 'hash', 'password', 'aes'] },
];

export function Footer() {
  const { setFeedbackOpen } = useAppStore();

  const getTools = (ids: string[]) => ids.map(id => tools.find(t => t.id === id)).filter(Boolean) as typeof tools;

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
              An offline-first suite of 49 developer utilities. Open source, privacy-first, keyboard-driven.
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
              href="https://github.com/mishraprayash/web-tools"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <FaGithub className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
