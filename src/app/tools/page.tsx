'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Grid3X3 } from 'lucide-react';
import { tools, categories, type ToolCategory } from '@/tools/registry';

export default function ToolsPage() {
  return (
    <main className="flex-1 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <h1 className="text-3xl font-bold font-outfit">All Tools</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Browse all {tools.length} developer utilities across {categories.length} categories
          </p>
        </div>

        <div className="space-y-10">
          {categories.map((category) => {
            const catTools = tools.filter((t) => t.category === category);
            return (
              <section key={category}>
                <h2 className="text-lg font-bold font-outfit mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  {category}
                  <span className="text-xs text-text-muted font-mono bg-bg-tertiary px-2 py-0.5 rounded-md">
                    {catTools.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {catTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <Link key={tool.id} href={`/tools/${tool.id}`}>
                        <motion.div whileHover={{ scale: 1.02, y: -3 }}
                          className="p-4 rounded-xl border border-border bg-bg-secondary hover:border-accent/50 hover:bg-bg-elevated transition-all duration-200 cursor-pointer h-full group">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="text-sm font-semibold font-outfit text-text-primary group-hover:text-accent transition-colors">{tool.name}</h3>
                          <p className="mt-1 text-xs text-text-secondary leading-relaxed">{tool.description}</p>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent transition-colors">
            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
