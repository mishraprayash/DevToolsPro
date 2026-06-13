'use client';

import * as React from 'react';
import { GitBranch, GitCommit, GitPullRequest, RotateCcw, Box } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Select } from '@/components/ui/Select';
import { CopyButton } from '@/components/ui/CopyButton';
import { generateGitCommand, type GitCommandType, type GitCommandState } from '@/tools/git-generator/utils';
import { cn } from '@/lib/utils';

const commandTypes: { id: GitCommandType; label: string; icon: React.ElementType }[] = [
  { id: 'commit', label: 'Commit', icon: GitCommit },
  { id: 'branch', label: 'Branch', icon: GitBranch },
  { id: 'remote', label: 'Remote', icon: GitPullRequest },
  { id: 'reset', label: 'Reset', icon: RotateCcw },
  { id: 'stash', label: 'Stash', icon: Box },
];

export default function Page() {
  const [state, setState] = React.useState<GitCommandState>({
    type: 'commit',
    addAll: true,
    message: '',
    resetMode: 'mixed',
    resetTarget: 'HEAD~1',
    stashAction: 'save'
  });

  const updateState = (updates: Partial<GitCommandState>) => {
    setState(s => ({ ...s, ...updates }));
  };

  const result = React.useMemo(() => generateGitCommand(state), [state]);

  return (
    <ToolLayout
      name="Git Command Generator"
      description="Visually construct complex Git commands with clear explanations of what they do."
      category="Text"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Nav */}
        <div className="lg:col-span-4 space-y-2">
          <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 px-2">Command Type</h2>
          {commandTypes.map(cmd => {
            const Icon = cmd.icon;
            const isActive = state.type === cmd.id;
            return (
              <button
                key={cmd.id}
                onClick={() => updateState({ type: cmd.id })}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                  isActive 
                    ? "bg-accent text-white shadow-md font-medium" 
                    : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-text-muted")} />
                {cmd.label}
              </button>
            );
          })}
        </div>

        {/* Right Config */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-xl border border-border bg-bg-secondary space-y-6">
            <h2 className="text-lg font-bold text-text-primary border-b border-border pb-4">
              Configure {state.type.charAt(0).toUpperCase() + state.type.slice(1)} Command
            </h2>

            {/* Commit Config */}
            {state.type === 'commit' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Commit Message</label>
                  <input 
                    type="text"
                    value={state.message || ''}
                    onChange={(e) => updateState({ message: e.target.value })}
                    placeholder="Fix button alignment..."
                    className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!state.addAll} onChange={e => updateState({ addAll: e.target.checked })} className="rounded bg-bg-tertiary border-border text-accent focus:ring-accent w-4 h-4" />
                    <span className="text-sm text-text-primary">Stage all changes (<code className="text-xs bg-bg-tertiary px-1 rounded">git add .</code>)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!state.amend} onChange={e => updateState({ amend: e.target.checked })} className="rounded bg-bg-tertiary border-border text-accent focus:ring-accent w-4 h-4" />
                    <span className="text-sm text-text-primary">Amend previous commit (<code className="text-xs bg-bg-tertiary px-1 rounded">--amend</code>)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Branch Config */}
            {state.type === 'branch' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Branch Name</label>
                  <input 
                    type="text"
                    value={state.branchName || ''}
                    onChange={(e) => updateState({ branchName: e.target.value })}
                    placeholder="feature/new-login"
                    className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!state.newBranch} onChange={e => updateState({ newBranch: e.target.checked, deleteBranch: false })} className="rounded bg-bg-tertiary border-border text-accent focus:ring-accent w-4 h-4" />
                    <span className="text-sm text-text-primary">Create & checkout new branch (<code className="text-xs bg-bg-tertiary px-1 rounded">-b</code>)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!state.deleteBranch} onChange={e => updateState({ deleteBranch: e.target.checked, newBranch: false })} className="rounded bg-bg-tertiary border-border text-accent focus:ring-accent w-4 h-4" />
                    <span className="text-sm text-text-primary">Delete branch (<code className="text-xs bg-bg-tertiary px-1 rounded">-d</code>)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Remote Config */}
            {state.type === 'remote' && (
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer mb-4">
                  <input type="checkbox" checked={!!state.addRemote} onChange={e => updateState({ addRemote: e.target.checked })} className="rounded bg-bg-tertiary border-border text-accent focus:ring-accent w-4 h-4" />
                  <span className="text-sm text-text-primary">Add a new remote</span>
                </label>
                
                {state.addRemote && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Remote Name</label>
                      <input 
                        type="text"
                        value={state.remoteName || ''}
                        onChange={(e) => updateState({ remoteName: e.target.value })}
                        placeholder="origin"
                        className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Remote URL</label>
                      <input 
                        type="text"
                        value={state.remoteUrl || ''}
                        onChange={(e) => updateState({ remoteUrl: e.target.value })}
                        placeholder="https://github.com/..."
                        className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Reset Config */}
            {state.type === 'reset' && (
              <div className="space-y-4">
                <Select
                  label="Reset Mode"
                  value={state.resetMode || 'mixed'}
                  onChange={e => updateState({ resetMode: e.target.value as any })}
                  options={[
                    { value: 'soft', label: '--soft (Keep all changes staged)' },
                    { value: 'mixed', label: '--mixed (Keep changes, but unstage them)' },
                    { value: 'hard', label: '--hard (DANGEROUS: Discard all changes)' }
                  ]}
                />
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Target Commit</label>
                  <input 
                    type="text"
                    value={state.resetTarget || ''}
                    onChange={(e) => updateState({ resetTarget: e.target.value })}
                    placeholder="HEAD~1 (previous commit) or commit hash"
                    className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Stash Config */}
            {state.type === 'stash' && (
              <div className="space-y-4">
                <Select
                  label="Action"
                  value={state.stashAction || 'save'}
                  onChange={e => updateState({ stashAction: e.target.value as any })}
                  options={[
                    { value: 'save', label: 'Save (Stash changes)' },
                    { value: 'pop', label: 'Pop (Apply and remove from stash)' },
                    { value: 'apply', label: 'Apply (Apply but keep in stash)' },
                    { value: 'list', label: 'List all stashes' },
                    { value: 'clear', label: 'Clear all stashes' }
                  ]}
                />
                {state.stashAction === 'save' && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Stash Message (Optional)</label>
                    <input 
                      type="text"
                      value={state.stashMessage || ''}
                      onChange={(e) => updateState({ stashMessage: e.target.value })}
                      placeholder="WIP: layout fixes"
                      className="w-full h-10 px-3 rounded-lg bg-bg-tertiary border border-border text-text-primary text-sm focus:border-accent focus:outline-none transition-colors"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Generated Result */}
          {result.success && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Generated Command</h3>
              <div className="p-4 rounded-xl bg-bg-secondary border border-border flex items-center justify-between gap-4">
                <code className="text-green-400 font-mono text-sm break-all">
                  {result.data.command}
                </code>
                <CopyButton value={result.data.command} />
              </div>
              <p className="text-sm text-text-secondary leading-relaxed bg-blue-500/10 text-blue-500 border border-blue-500/20 p-3 rounded-lg">
                <span className="font-bold">Explanation:</span> {result.data.explanation}
              </p>
            </div>
          )}

        </div>
      </div>
    </ToolLayout>
  );
}
