'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FileCode2, 
  Binary, 
  Shield, 
  Network as NetworkIcon, 
  Type, 
  Clock, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { tools } from '@/tools/registry';
import { cn } from '@/lib/utils';

const CATEGORY_SHOWCASE = [
  {
    name: 'Formatting',
    icon: FileCode2,
    color: 'from-cyan-500 to-blue-500',
    description: 'Visual SQL Schema Designer, SQL Prettifier, Prisma & TypeScript Exporters, SVG to JSX.',
    topTool: 'sql-designer',
    topToolName: 'SQL Schema Designer',
  },
  {
    name: 'Encoding',
    icon: Binary,
    color: 'from-indigo-500 to-purple-500',
    description: 'cURL to 12+ Languages, JWT Inspector, Base64 Image Converter, HTML Previewer.',
    topTool: 'curl-converter',
    topToolName: 'cURL Request Converter',
  },
  {
    name: 'Security',
    icon: Shield,
    color: 'from-emerald-500 to-teal-500',
    description: 'Diceware Passphrase Generator, Entropy Calculator, Bcrypt Hash Inspector, RSA Keys.',
    topTool: 'password',
    topToolName: 'Passphrase & Entropy',
  },
  {
    name: 'Network',
    icon: NetworkIcon,
    color: 'from-amber-500 to-orange-500',

    topTool: 'subnet',
    topToolName: 'Subnet Splitter',
  },
  {
    name: 'Text',
    icon: Type,
    color: 'from-fuchsia-500 to-rose-500',
    description: 'Interactive Regex Tester, Smart String Mutators, Side-by-Side Diff Checker, Mock Data.',
    topTool: 'regex',
    topToolName: 'Regex Tester',
  },
  {
    name: 'Date & Time',
    icon: Clock,
    color: 'from-sky-500 to-teal-500',
    description: 'Cron Expression Visualizer & Countdown, Timezone Converter Matrix, Nepali Calendar.',
    topTool: 'cron',
    topToolName: 'Cron Expression Parser',
  },
];

export function CategoryShowcase() {
  return (
    <section className="py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-bg-tertiary border border-border text-xs text-text-secondary font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            CATEGORIZED WORKFLOWS
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit text-text-primary tracking-tight">
            Explore <span className="gradient-text">6 Core Categories</span>
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Carefully curated utility suites tailored for every engineering discipline.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORY_SHOWCASE.map((cat, idx) => {
            const Icon = cat.icon;
            const toolCount = tools.filter((t) => t.category === cat.name).length;

            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group relative p-6 rounded-2xl border border-border/80 bg-bg-secondary/70 backdrop-blur-xl hover:border-accent/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between card-highlight"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md', cat.color)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-text-muted bg-bg-hover border border-border px-2.5 py-0.5 rounded-full">
                      {toolCount} Tools
                    </span>
                  </div>

                  <h3 className="text-lg font-bold font-outfit text-text-primary group-hover:text-accent transition-colors duration-200">
                    {cat.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                  <Link
                    href={`/tools/${cat.topTool}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                  >
                    Featured: {cat.topToolName} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
