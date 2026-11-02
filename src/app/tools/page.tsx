import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { tools, categories, categorySlug } from '@/tools/registry';

export default function ToolsPage() {
  return (
    <main className="flex-1 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-outfit">All Tools</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Browse all {tools.length} developer utilities across {categories.length} categories
          </p>
        </div>

        {/* Category jump bar — stays pinned under the header while scrolling */}
        <nav aria-label="Jump to category" className="sticky top-14 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-8 bg-bg-primary/85 backdrop-blur-xl border-b border-border">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <a
                key={category}
                href={`#${categorySlug(category)}`}
                className="shrink-0 px-3 py-1.5 rounded-full border border-border bg-bg-secondary text-xs font-medium text-text-secondary hover:text-accent hover:border-accent/40 transition-colors"
              >
                {category}
                <span className="ml-1.5 font-mono text-text-muted">{tools.filter((t) => t.category === category).length}</span>
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-10">
          {categories.map((category) => {
            const catTools = tools.filter((t) => t.category === category);
            return (
              <section key={category} id={categorySlug(category)} className="scroll-mt-32">
                <h2 className="text-lg font-bold font-outfit mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  {category}
                  <span className="text-xs text-text-muted font-mono bg-bg-tertiary px-2 py-0.5 rounded-md">
                    {catTools.length}
                  </span>
                  <Link href={`/tools/categories/${categorySlug(category)}`} className="ml-auto text-xs font-semibold text-accent hover:underline underline-offset-4">
                    Category page →
                  </Link>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {catTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <Link key={tool.id} href={`/tools/${tool.id}`}>
                        <div className="p-4 rounded-xl border border-border bg-bg-secondary hover:border-accent/50 hover:bg-bg-elevated hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full group">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="text-sm font-semibold font-outfit text-text-primary group-hover:text-accent transition-colors">{tool.name}</h3>
                          <p className="mt-1 text-xs text-text-secondary leading-relaxed">{tool.description}</p>
                        </div>
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
