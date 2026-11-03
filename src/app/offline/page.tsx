import type { Metadata } from 'next';
import { WifiOff } from 'lucide-react';
import { tools } from '@/tools/registry';
import { RetryButton } from './RetryButton';

export const metadata: Metadata = {
  title: 'Offline | DevTools Pro',
  robots: { index: false, follow: false },
};

// Served by the service worker (public/sw.js) when a page isn't available offline.
const POPULAR = ['json', 'encoder', 'jwt', 'hash', 'uuid', 'regex'];

export default function Page() {
  const popular = POPULAR.map((id) => tools.find((t) => t.id === id)).filter((t) => t !== undefined);

  return (
    <main className="flex-1 min-h-[70vh] flex items-center justify-center px-4 pt-24 pb-16">
      <div className="max-w-md w-full p-6 rounded-2xl bg-bg-secondary border border-border text-center shadow-xl space-y-5">
        <div className="w-12 h-12 mx-auto rounded-full bg-accent/10 text-accent flex items-center justify-center">
          <WifiOff className="w-6 h-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-bold font-outfit text-text-primary">You&apos;re offline</h1>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            This page hasn&apos;t been saved for offline use yet. Every tool runs in your browser, so the ones
            below keep working without a connection.
          </p>
        </div>

        {/* Plain <a> on purpose: a full navigation is answered from the service worker cache. */}
        <ul className="grid grid-cols-2 gap-2 text-left">
          {popular.map((tool) => (
            <li key={tool.id}>
              <a
                href={`/tools/${tool.id}`}
                className="block px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-xs font-medium text-text-primary hover:border-accent/50 hover:text-accent transition-colors truncate"
              >
                {tool.name}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-center gap-3 pt-1">
          <RetryButton />
          <a
            href="/tools"
            className="px-4 py-2 rounded-xl bg-bg-tertiary border border-border text-xs font-semibold text-text-primary hover:bg-bg-hover transition-colors"
          >
            All tools
          </a>
        </div>
      </div>
    </main>
  );
}
