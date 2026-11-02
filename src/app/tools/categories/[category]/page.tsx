import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileCode2, Binary, Shield, Network as NetworkIcon, Type, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { tools, categories, type ToolCategory } from '@/tools/registry';
import { CategoryFormattingClient } from './CategoryClient';

const categoryMeta: Record<ToolCategory, { icon: React.ElementType; color: string; tagline: string; accent: string }> = {
  'Formatting': { icon: FileCode2, color: 'from-cyan-500 to-blue-500', tagline: 'Shape, validate & model data — JSON ↔ YAML ↔ CSV, SQL suites, and codegen.', accent: 'text-cyan-400' },
  'Encoding': { icon: Binary, color: 'from-indigo-500 to-purple-500', tagline: 'Encode, decode & bridge formats — Base64, URL, and transport layers.', accent: 'text-indigo-400' },
  'Security': { icon: Shield, color: 'from-emerald-500 to-teal-500', tagline: 'Secrets, hashes & crypto — passwords, JWT, and key sandboxes.', accent: 'text-emerald-400' },
  'Network': { icon: NetworkIcon, color: 'from-amber-500 to-orange-500', tagline: 'Inspect packets, subnets & headers — IP, DNS, and HTTP.', accent: 'text-amber-400' },
  'Text': { icon: Type, color: 'from-fuchsia-500 to-rose-500', tagline: 'Text, regex & diff — mutate, compare, and generate content.', accent: 'text-fuchsia-400' },
  'Date & Time': { icon: Clock, color: 'from-sky-500 to-teal-500', tagline: 'Time, cron & calendars — parse, convert, and schedule.', accent: 'text-sky-400' },
};

// Slug helpers — keep in sync with CategoryShowcase / ToolGrid
function slugifyCategory(cat: string) {
  return cat.toLowerCase().replace(/&/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();
}
function deslugifyCategory(slug: string): ToolCategory | undefined {
  return categories.find(c => slugifyCategory(c) === slug.toLowerCase()) as ToolCategory | undefined;
}

const formattingWorkflows: { title: string; desc: string; toolIds: string[]; cta: string }[] = [
  { title: 'Data Shaping', desc: 'Normalize between JSON, YAML, CSV & XML in one flow.', toolIds: ['json', 'yaml-json', 'csv-json', 'xml-json'], cta: 'Start with JSON Beautifier →' },
  { title: 'Type Generation', desc: 'Turn raw payloads into typed contracts.', toolIds: ['json-to-ts', 'json-schema', 'jsonpath', 'graphql-to-ts'], cta: 'Generate TS Interfaces →' },
  { title: 'SQL Suite', desc: 'Design, prettify & ship DB code — DDL → Prisma → TS.', toolIds: ['sql-designer', 'sql-prettify', 'sql-to-orm'], cta: 'Open SQL Designer →' },
];

export function generateStaticParams() {
  return categories.map(c => ({ category: slugifyCategory(c) }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const cat = deslugifyCategory(slug);
  if (!cat) return {};
  return { title: `${cat} Tools — DevTools Pro` };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const category = deslugifyCategory(slug);
  if (!category) notFound();

  const meta = categoryMeta[category];
  const Icon = meta.icon;
  const catTools = tools.filter(t => t.category === category);
  const newCount = catTools.filter(t => t.isNew).length;

  return (
    <main className="flex-1 pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className={`absolute -top-24 -right-24 w-[520px] h-[520px] rounded-full bg-gradient-to-br ${meta.color} opacity-10 blur-[80px] pointer-events-none`} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <nav className="flex items-center gap-1.5 text-xs text-text-muted mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-text-primary">Home</Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-text-primary">Tools</Link>
            <span>/</span>
            <span className="text-text-primary font-medium">{category}</span>
          </nav>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="flex gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-lg shrink-0`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold font-outfit tracking-tight flex items-center gap-3">
                  {category}
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-bg-tertiary border border-border text-text-secondary">
                    {catTools.length} tools {newCount > 0 && <span className="bg-accent text-white px-1.5 py-0.5 rounded-full text-[10px]">+{newCount} new</span>}
                  </span>
                </h1>
                <p className="mt-2 text-sm text-text-secondary max-w-2xl leading-relaxed">{meta.tagline}</p>
                <p className="mt-1 text-xs text-text-muted">100% client-side • Zero telemetry • Works offline</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/tools" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-bg-tertiary border border-border text-xs font-semibold hover:border-border-hover">All categories</Link>
              <Link href={`#tool-grid`} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-accent text-bg-primary text-xs font-bold hover:bg-accent-hover">Browse {category} <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          </div>

          {/* Workflows — Formatting only */}
          {category === 'Formatting' && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4" role="list" aria-label="Recommended workflows">
              {formattingWorkflows.map(wf => {
                const wfTools = wf.toolIds.map(id => tools.find(t => t.id === id)).filter(Boolean) as typeof tools;
                return (
                  <div key={wf.title} className="rounded-2xl border border-border bg-bg-secondary/70 backdrop-blur p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className={`w-4 h-4 ${meta.accent}`} />
                      <h3 className="text-sm font-bold font-outfit">{wf.title}</h3>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{wf.desc}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {wfTools.map(t => (
                        <Link key={t.id} href={`/tools/${t.id}`} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-bg-tertiary border border-border hover:border-accent/30">
                          <t.icon className="w-3 h-3" /> {t.name}
                        </Link>
                      ))}
                    </div>
                    <Link href={`/tools/${wfTools[0]?.id ?? ''}`} className="mt-3 text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1">
                      {wf.cta} <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Tool grid client island */}
      <CategoryFormattingClient category={category} />
    </main>
  );
}
