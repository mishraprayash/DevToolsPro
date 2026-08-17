'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Sparkles, 
  Command, 
  ShieldCheck, 
  Database, 
  Key, 
  Terminal, 
  Network, 
  CheckCircle2,
  Copy
} from 'lucide-react';
import { useAppStore } from '@/lib/store/useStore';
import { tools, categories } from '@/tools/registry';
import { cn } from '@/lib/utils';

const SHOWCASE_TABS = [
  {
    id: 'sql',
    label: 'SQL Designer',
    icon: Database,
    code: `-- Generated PostgreSQL Schema\nCREATE TABLE "users" (\n  "id" SERIAL PRIMARY KEY,\n  "email" VARCHAR(255) NOT NULL UNIQUE,\n  "role" VARCHAR(50) DEFAULT 'USER'\n);`,
    badge: 'DDL & Prisma & TS',
  },
  {
    id: 'curl',
    label: 'cURL Converter',
    icon: Terminal,
    code: `import httpx\n\nheaders = {"Authorization": "Bearer tok_live_99"}\nresponse = httpx.get("https://api.devtools.pro/v1/metrics", headers=headers)`,
    badge: '12 Target Languages',
  },
  {
    id: 'password',
    label: 'Diceware Passphrase',
    icon: Key,
    code: `passphrase: "correct-horse-battery-staple"\nentropy: 77.5 bits (Very Strong)\ntime_to_crack: ~1,200,000 years`,
    badge: 'Diceware & Entropy',
  },
  {
    id: 'subnet',
    label: 'IP Subnet Splitter',
    icon: Network,
    code: `Network: 192.168.1.0/24\nHost Range: 192.168.1.1 ➔ 192.168.1.254\nSubnet Mask: 255.255.255.0 (32 Hosts / Split)`,
    badge: 'Visual Subnet Matrix',
  },
];

export function Hero() {
  const { setCommandPaletteOpen } = useAppStore();
  const [activeTab, setActiveTab] = React.useState('sql');
  const [copied, setCopied] = React.useState(false);

  const currentTab = SHOWCASE_TABS.find((t) => t.id === activeTab) || SHOWCASE_TABS[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentTab.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative min-h-[85vh] flex flex-col justify-center overflow-hidden pt-12 pb-16">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full bg-accent/10 blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-10 right-1/4 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-accent-secondary/10 blur-[130px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Hero Copy & CTA */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bg-elevated border border-border mb-6 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-text-secondary font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
                100% Client-Side Engine • Zero Server Roundtrips
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-outfit leading-[1.08] tracking-tight"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <span className="text-text-primary">Supercharge your workflow with</span>
              <br />
              <span className="gradient-text">DevTools Pro</span>
            </motion.h1>

            <motion.p 
              className="mt-6 text-base sm:text-lg text-text-secondary max-w-2xl mx-auto lg:mx-0 leading-relaxed"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              A suite of <strong className="text-text-primary font-semibold">{tools.length} high-performance micro-apps</strong> built for developers — schema designers, request converters, password diceware, subnet calculators, and formatters.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <button
                onClick={() => {
                  const grid = document.getElementById('tool-grid');
                  grid?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-accent text-bg-primary text-sm font-bold hover:bg-accent-hover transition-all duration-200 active:scale-[0.97] shadow-lg shadow-accent/25 cursor-pointer"
              >
                Explore All {tools.length} Tools
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-bg-elevated border border-border text-text-secondary text-sm font-semibold hover:border-border-hover hover:text-text-primary transition-all duration-200 active:scale-[0.97] shadow-sm cursor-pointer"
              >
                <Command className="h-4 w-4 text-accent" />
                Quick Launcher
                <kbd className="ml-1.5 px-2 py-0.5 text-[10px] font-mono bg-bg-hover text-text-muted rounded border border-border">⌘K</kbd>
              </button>
            </motion.div>

            {/* Quick Metrics Bar */}
            <motion.div
              className="mt-10 pt-6 border-t border-border/60 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div>
                <div className="text-2xl font-bold font-outfit text-text-primary">{tools.length}+</div>
                <div className="text-xs text-text-muted mt-0.5">Developer Tools</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-outfit text-text-primary">{categories.length}</div>
                <div className="text-xs text-text-muted mt-0.5">Categories</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-outfit text-accent">0ms</div>
                <div className="text-xs text-text-muted mt-0.5">Server Latency</div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Interactive Live Showcase Card */}
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative rounded-2xl border border-border/80 bg-bg-secondary/90 backdrop-blur-2xl shadow-2xl overflow-hidden card-highlight">
              
              {/* Card Header Bar */}
              <div className="px-4 py-3 bg-bg-tertiary/70 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2 text-xs font-mono text-text-muted">devtools-pro-interactive.sh</span>
                </div>
                <span className="text-[10px] font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full">
                  LIVE PREVIEW
                </span>
              </div>

              {/* Tab Selector Buttons */}
              <div className="p-2 bg-bg-primary/50 border-b border-border/60 flex items-center gap-1 overflow-x-auto scrollbar-hide">
                {SHOWCASE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer',
                        isActive
                          ? 'bg-accent text-bg-primary font-semibold shadow-sm'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Preview Content Area */}
              <div className="p-5 font-mono text-xs text-text-primary min-h-[190px] flex flex-col justify-between bg-bg-secondary">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTab.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    <pre className="text-text-secondary whitespace-pre-wrap leading-relaxed overflow-x-auto font-mono text-[11px] sm:text-xs">
                      {currentTab.code}
                    </pre>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[11px] text-text-muted flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    {currentTab.badge}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-text-secondary hover:text-accent transition-colors cursor-pointer"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy snippet'}
                  </button>
                </div>
              </div>

              {/* Bottom Quick Direct Link Banner */}
              <div className="px-5 py-3 bg-bg-elevated/60 border-t border-border flex items-center justify-between text-xs">
                <span className="text-text-muted">Want to try the full tool?</span>
                <Link
                  href={
                    activeTab === 'sql'
                      ? '/tools/sql-designer'
                      : activeTab === 'curl'
                      ? '/tools/curl-converter'
                      : activeTab === 'password'
                      ? '/tools/password'
                      : '/tools/subnet'
                  }
                  className="font-semibold text-accent hover:underline flex items-center gap-1"
                >
                  Launch App <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
