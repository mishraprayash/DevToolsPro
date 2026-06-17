'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Zap, Lock, Keyboard, Sparkles } from 'lucide-react';
import { tools } from '@/tools/registry';

const features = [
  {
    icon: Zap,
    title: 'Instant Processing',
    description: `All ${tools.length} tools run locally in your browser. No server roundtrips, no network delays, instant results.`,
  },
  {
    icon: Lock,
    title: 'Privacy First',
    description: 'Your data never leaves your device. No tracking, no analytics, no cloud uploads. Everything stays local.',
  },
  {
    icon: Keyboard,
    title: 'Keyboard Driven',
    description: 'Cmd+K for quick search, keyboard shortcuts across all tools, slash to focus search. Built for power users.',
  },
  {
    icon: Sparkles,
    title: 'Open Source',
    description: 'Free forever. No registration, no paywalls, no limits. MIT licensed on GitHub.',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function Features() {
  return (
    <section className="py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.02] to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold font-outfit">
            Built for <span className="gradient-text">developers</span>
          </h2>
          <p className="mt-2 text-sm text-text-muted max-w-lg mx-auto">
            Speed, privacy, and a seamless keyboard-first experience
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={item}
                className="group relative p-6 rounded-xl border border-border/50 bg-bg-elevated hover:border-accent/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent-secondary/20 flex items-center justify-center mb-3 group-hover:from-accent/30 group-hover:to-accent-secondary/30 transition-all">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-base font-semibold font-outfit text-text-primary">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
