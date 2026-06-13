'use client';

import * as React from 'react';
import { FileMinus, Download, Search, CheckCircle } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { generateGitignore, gitignoreTemplates, type GitignoreTemplate } from '@/tools/gitignore/utils';
import { cn } from '@/lib/utils';

export default function Page() {
  const [query, setQuery] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [output, setOutput] = React.useState('');

  const filteredTemplates = React.useMemo(() => {
    if (!query) return gitignoreTemplates;
    const q = query.toLowerCase();
    return gitignoreTemplates.filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  }, [query]);

  // Group by category
  const groupedTemplates = React.useMemo(() => {
    const groups: Record<string, GitignoreTemplate[]> = {};
    for (const t of filteredTemplates) {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    }
    return groups;
  }, [filteredTemplates]);

  React.useEffect(() => {
    const res = generateGitignore(selectedIds);
    if (res.success) {
      setOutput(res.data);
    }
  }, [selectedIds]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.gitignore';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout
      name=".gitignore Generator"
      description="Select combinations of operating systems, IDEs, and languages to compile a complete .gitignore file."
      category="Text"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Config Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search templates (e.g. Node, macOS)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-lg bg-bg-tertiary border border-border text-text-primary focus:border-accent focus:outline-none transition-colors"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
          </div>

          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(groupedTemplates).map(([category, templates]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">{category}</h3>
                <div className="flex flex-wrap gap-2">
                  {templates.map(t => {
                    const isSelected = selectedIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => toggleSelection(t.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border",
                          isSelected 
                            ? "bg-accent/10 border-accent text-accent shadow-sm" 
                            : "bg-bg-secondary border-border text-text-secondary hover:text-text-primary hover:border-text-muted"
                        )}
                      >
                        {t.name}
                        {isSelected && <CheckCircle className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {Object.keys(groupedTemplates).length === 0 && (
              <div className="text-center py-10 text-text-muted text-sm">
                No templates found for "{query}".
              </div>
            )}
          </div>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary">Preview</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleDownload} icon={<Download className="h-4 w-4" />} disabled={!output}>
                Download .gitignore
              </Button>
              <CopyButton value={output} />
            </div>
          </div>

          <div className="border border-border rounded-xl bg-bg-secondary overflow-hidden shadow-sm h-full min-h-[600px]">
            <textarea
              readOnly
              value={output || '# Select templates from the left to generate your .gitignore...'}
              className="w-full h-full min-h-[600px] p-5 bg-transparent text-text-primary font-mono text-sm focus:outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

      </div>
    </ToolLayout>
  );
}
