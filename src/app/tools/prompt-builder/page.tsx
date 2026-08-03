'use client';

import * as React from 'react';
import { Settings, Plus, Trash2, Bot, FileText, Target, AlertTriangle } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { generateSystemPrompt, type PromptState } from '@/tools/prompt-builder/utils';

const TextareaGroup = ({ label, icon: Icon, value, onChange, placeholder, rows = 2 }: { label: string, icon: React.ComponentType<{ className?: string }>, value: string, onChange: (v: string) => void, placeholder: string, rows?: number }) => (
  <div className="space-y-1">
    <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1">
      <Icon className="h-4 w-4 text-accent" /> {label}
    </label>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:border-accent focus:outline-none transition-colors resize-y"
    />
  </div>
);

export default function Page() {
  const [state, setState] = React.useState<PromptState>({
    role: 'Senior Software Engineer',
    context: 'We are migrating a legacy React application to Next.js App Router.',
    task: 'Write a detailed step-by-step migration plan focusing on routing and data fetching.',
    constraints: ['Do not use class components', 'Prioritize Server Components', 'Keep it under 500 words'],
    tone: 'technical, direct, and professional',
    format: 'Markdown list with code blocks for examples.',
  });

  const updateState = (updates: Partial<PromptState>) => {
    setState(s => ({ ...s, ...updates }));
  };

  const handleConstraintChange = (index: number, val: string) => {
    const newConstraints = [...state.constraints];
    newConstraints[index] = val;
    updateState({ constraints: newConstraints });
  };

  const addConstraint = () => {
    updateState({ constraints: [...state.constraints, ''] });
  };

  const removeConstraint = (index: number) => {
    updateState({ constraints: state.constraints.filter((_, i) => i !== index) });
  };

  const generatedPrompt = React.useMemo(() => generateSystemPrompt(state), [state]);

  return (
    <ToolLayout
      name="System Prompt Builder"
      description="Structure and generate high-quality system prompts for LLMs using best-practice templates."
      category="Text"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Editor */}
        <div className="space-y-6 p-5 rounded-xl border border-border bg-bg-secondary">
          <TextareaGroup 
            label="Role / Persona" 
            icon={Bot} 
            value={state.role} 
            onChange={(val: string) => updateState({ role: val })} 
            placeholder="e.g. Senior Data Scientist" 
            rows={1}
          />

          <TextareaGroup 
            label="Context" 
            icon={FileText} 
            value={state.context} 
            onChange={(val: string) => updateState({ context: val })} 
            placeholder="Background information..." 
            rows={2}
          />

          <TextareaGroup 
            label="Task / Goal" 
            icon={Target} 
            value={state.task} 
            onChange={(val: string) => updateState({ task: val })} 
            placeholder="What exactly do you want the model to do?" 
            rows={2}
          />

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1">
              <AlertTriangle className="h-4 w-4 text-accent" /> Guidelines & Constraints
            </label>
            {state.constraints.map((constraint, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={constraint}
                  onChange={(e) => handleConstraintChange(i, e.target.value)}
                  placeholder="e.g. No markdown headers"
                  className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
                />
                <Button variant="ghost" size="sm" onClick={() => removeConstraint(i)} className="text-red-500 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={addConstraint} icon={<Plus className="h-3 w-3" />} className="w-full mt-2 border-dashed border border-border">
              Add Constraint
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextareaGroup 
              label="Tone" 
              icon={Settings} 
              value={state.tone} 
              onChange={(val: string) => updateState({ tone: val })} 
              placeholder="e.g. formal, concise" 
              rows={1}
            />
            <TextareaGroup 
              label="Output Format" 
              icon={FileText} 
              value={state.format} 
              onChange={(val: string) => updateState({ format: val })} 
              placeholder="e.g. JSON array" 
              rows={1}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary">Generated Prompt</h2>
            <CopyButton value={generatedPrompt} />
          </div>

          <div className="border border-border rounded-xl bg-bg-tertiary overflow-hidden shadow-sm h-full min-h-[500px]">
            <textarea
              readOnly
              value={generatedPrompt}
              className="w-full h-full p-5 bg-transparent text-text-primary font-mono text-sm focus:outline-none resize-none leading-relaxed"
              placeholder="Your generated prompt will appear here..."
            />
          </div>
        </div>

      </div>
    </ToolLayout>
  );
}
