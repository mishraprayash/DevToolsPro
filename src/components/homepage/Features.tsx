'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Zap, Lock, Keyboard, Sparkles, Cpu, Layers, Code, ShieldCheck } from 'lucide-react';
import { tools, categories } from '@/tools/registry';

const features = [
  {
    icon: Zap,
    title: 'Client-Side Engine',
    description: `All ${tools.length} micro-apps process data strictly inside your browser using WebAssembly and Web Crypto API. No server latency.`,
    badge: '0ms Overhead',
    gradient: 'from-cyan-500/20 to-blue-500/20 text-cyan-400',
  },
  {
    icon: Lock,
    title: 'Zero Telemetry Privacy',
    description: 'Your secrets, passwords, RSA keys, and API payloads stay 100% on your device. Zero telemetry, zero analytics tracking.',
    badge: 'Private & Offline',
    gradient: 'from-emerald-500/20 to-teal-500/20 text-emerald-400',
  },
  {
    icon: Keyboard,
    title: 'Keyboard-Driven UX',
    description: 'Press ⌘K or / anytime to launch the instant fuzzy search command palette. Switch tools effortlessly without touch context switches.',
    badge: '⌘K Quick Launch',
    gradient: 'from-indigo-500/20 to-purple-500/20 text-indigo-400',
  },
  {
    icon: Sparkles,
    title: 'Multi-Format Exporters',
    description: 'Export SQL DDL, Prisma Schema, TypeScript Interfaces, Diceware Passphrases, and curl scripts across 12+ programming languages.',
    badge: 'Polyglot Ready',
    gradient: 'from-fuchsia-500/20 to-pink-500/20 text-fuchsia-400',
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
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.015] to-transparent pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-14"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-tertiary border border-border text-xs text-text-secondary font-medium mb-3">
            <Cpu className="w-3.5 h-3.5 text-accent" />
            ENGINEERED FOR POWER USERS
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold font-outfit text-text-primary tracking-tight">
            Built for modern <span className="gradient-text">engineering workflows</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-secondary leading-relaxed">
            Everything you need for rapid debugging, security generation, network planning, and schema modeling.
          </p>
        </motion.div>

        {/* 4 Core Value Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
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
                className="group relative p-6 rounded-2xl border border-border/70 bg-bg-secondary/70 backdrop-blur-xl hover:border-accent/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between card-highlight"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-inner`}>
                      <Icon className="h-5.5 w-5.5" />
                    </div>
                    <span className="text-[10px] font-semibold text-text-muted bg-bg-hover border border-border px-2 py-0.5 rounded-full">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold font-outfit text-text-primary group-hover:text-accent transition-colors duration-200">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
