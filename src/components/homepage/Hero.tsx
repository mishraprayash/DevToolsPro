'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Command } from 'lucide-react';
import { useAppStore } from '@/lib/store/useStore';

export function Hero() {
  const { setCommandPaletteOpen } = useAppStore();

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] rounded-full bg-accent/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] rounded-full bg-accent-secondary/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bg-tertiary border border-border mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-glow" />
            <span className="text-xs text-text-secondary font-medium">All tools run locally in your browser</span>
          </div>
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold font-outfit leading-[1.05] tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <span className="text-text-primary">Production-grade utilities for</span>
          <br />
          <span className="gradient-text">modern developers</span>
        </motion.h1>

        <motion.p
          className="mt-5 text-base sm:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          An offline-first suite of 49 developer tools — hashers, encoders, formatters, calculators, and more.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <button
            onClick={() => {
              const grid = document.getElementById('tool-grid');
              grid?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-accent text-bg-primary text-sm font-semibold hover:bg-accent-hover transition-all duration-200 active:scale-[0.97] shadow-lg shadow-accent/20"
          >
            Explore Tools
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-bg-tertiary border border-border text-text-secondary text-sm font-medium hover:border-border-hover hover:text-text-primary transition-all duration-200 active:scale-[0.97]"
          >
            <Command className="h-4 w-4" />
            Quick Search
            <kbd className="ml-1 px-1.5 py-0.5 text-[10px] bg-bg-hover rounded border border-border">⌘K</kbd>
          </button>
        </motion.div>

        <motion.div
          className="mt-10 flex items-center justify-center gap-6 sm:gap-10 text-xs text-text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>49 tools</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span>6 categories</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent/50" />
            <span>100% offline</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
