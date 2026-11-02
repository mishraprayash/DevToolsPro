'use client';

import * as React from 'react';
import { 
  calculateOctalAndSymbolic, 
  parseOctal, 
  parseSymbolic, 
  type ChmodState, 
  type ChmodPermissions 
} from '@/tools/chmod/utils';
import { Copy, Terminal, Check, RefreshCw } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';

const INITIAL_STATE: ChmodState = {
  owner: { read: true, write: true, execute: true },
  group: { read: true, write: false, execute: true },
  other: { read: true, write: false, execute: true },
  special: { setuid: false, setgid: false, sticky: false }
};

export default function ChmodCalculatorPage() {
  const [state, setState] = React.useState<ChmodState>(INITIAL_STATE);
  const [octalInput, setOctalInput] = React.useState('755');
  const [symInput, setSymInput] = React.useState('rwxr-xr-x');
  const [copiedType, setCopiedType] = React.useState<'octal' | 'sym' | 'cmd' | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Derive results
  const derived = React.useMemo(() => {
    const res = calculateOctalAndSymbolic(state);
    if (res.success) {
      return res.data;
    }
    return { octal: '755', symbolic: 'rwxr-xr-x', command: 'chmod 755 filename' };
  }, [state]);

  // Sync state to inputs on state change
  React.useEffect(() => {
    setOctalInput(derived.octal);
    setSymInput(derived.symbolic);
  }, [derived]);

  const handleCheckboxChange = (
    category: 'owner' | 'group' | 'other' | 'special',
    permission: keyof ChmodPermissions | 'setuid' | 'setgid' | 'sticky'
  ) => {
    setError(null);
    setState((prev) => {
      if (category === 'special') {
        return {
          ...prev,
          special: {
            ...prev.special,
            [permission]: !prev.special[permission as keyof typeof prev.special]
          }
        };
      } else {
        return {
          ...prev,
          [category]: {
            ...prev[category],
            [permission]: !prev[category][permission as keyof ChmodPermissions]
          }
        };
      }
    });
  };

  const handleOctalChange = (val: string) => {
    setOctalInput(val);
    if (/^[0-7]{3,4}$/.test(val)) {
      const parsed = parseOctal(val);
      if (parsed.success) {
        setState(parsed.data);
        setError(null);
      } else {
        setError(parsed.error);
      }
    } else if (val.length > 0) {
      setError('Octal must be 3 or 4 digits (0-7)');
    }
  };

  const handleSymChange = (val: string) => {
    setSymInput(val);
    if (val.length === 9) {
      const parsed = parseSymbolic(val);
      if (parsed.success) {
        setState(parsed.data);
        setError(null);
      } else {
        setError(parsed.error);
      }
    } else if (val.length > 0) {
      setError('Symbolic format must be exactly 9 characters');
    }
  };

  const handleCopy = (text: string, type: 'octal' | 'sym' | 'cmd') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleReset = () => {
    setState(INITIAL_STATE);
    setError(null);
  };

  return (
    <ToolLayout
      name="Chmod Calculator"
      description="Convert and calculate Unix octal, symbolic, and text permissions"
      category="Security"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main permission grid */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center justify-between">
              <span>Standard Permissions</span>
              <button 
                onClick={handleReset}
                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset to 755
              </button>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Owner */}
              <div className="bg-muted/30 p-4 rounded-lg border border-border">
                <span className="text-sm font-medium text-foreground block mb-3 border-b border-border pb-1">
                  Owner (User)
                </span>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={state.owner.read}
                      onChange={() => handleCheckboxChange('owner', 'read')}
                      className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                    />
                    Read (r / 4)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={state.owner.write}
                      onChange={() => handleCheckboxChange('owner', 'write')}
                      className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                    />
                    Write (w / 2)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={state.owner.execute}
                      onChange={() => handleCheckboxChange('owner', 'execute')}
                      className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                    />
                    Execute (x / 1)
                  </label>
                </div>
              </div>

              {/* Group */}
              <div className="bg-muted/30 p-4 rounded-lg border border-border">
                <span className="text-sm font-medium text-foreground block mb-3 border-b border-border pb-1">
                  Group
                </span>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={state.group.read}
                      onChange={() => handleCheckboxChange('group', 'read')}
                      className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                    />
                    Read (r / 4)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={state.group.write}
                      onChange={() => handleCheckboxChange('group', 'write')}
                      className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                    />
                    Write (w / 2)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={state.group.execute}
                      onChange={() => handleCheckboxChange('group', 'execute')}
                      className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                    />
                    Execute (x / 1)
                  </label>
                </div>
              </div>

              {/* Other */}
              <div className="bg-muted/30 p-4 rounded-lg border border-border">
                <span className="text-sm font-medium text-foreground block mb-3 border-b border-border pb-1">
                  Other (Public)
                </span>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={state.other.read}
                      onChange={() => handleCheckboxChange('other', 'read')}
                      className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                    />
                    Read (r / 4)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={state.other.write}
                      onChange={() => handleCheckboxChange('other', 'write')}
                      className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                    />
                    Write (w / 2)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={state.other.execute}
                      onChange={() => handleCheckboxChange('other', 'execute')}
                      className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                    />
                    Execute (x / 1)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Special Flags */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Special Permissions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-muted/30 p-4 rounded-lg border border-border">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer select-none mb-1">
                  <input
                    type="checkbox"
                    checked={state.special.setuid}
                    onChange={() => handleCheckboxChange('special', 'setuid')}
                    className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                  />
                  SetUID (4)
                </label>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  Allows executables to be run with the privileges of the owner.
                </p>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg border border-border">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer select-none mb-1">
                  <input
                    type="checkbox"
                    checked={state.special.setgid}
                    onChange={() => handleCheckboxChange('special', 'setgid')}
                    className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                  />
                  SetGID (2)
                </label>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  Executes files with privileges of the group owner.
                </p>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg border border-border">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer select-none mb-1">
                  <input
                    type="checkbox"
                    checked={state.special.sticky}
                    onChange={() => handleCheckboxChange('special', 'sticky')}
                    className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                  />
                  Sticky Bit (1)
                </label>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  Restricts file deletion inside directories to owners only.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick inputs and Outputs */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between h-full">
            <div>
              <h2 className="text-lg font-semibold mb-4 text-foreground">Interactive Inputs</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Octal Notation
                  </label>
                  <input
                    type="text"
                    value={octalInput}
                    onChange={(e) => handleOctalChange(e.target.value)}
                    placeholder="755"
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Symbolic Notation
                  </label>
                  <input
                    type="text"
                    value={symInput}
                    onChange={(e) => handleSymChange(e.target.value)}
                    placeholder="rwxr-xr-x"
                    className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 p-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-border pt-6 space-y-4">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Resulting Command
                </span>
                <div className="bg-neutral-900 text-neutral-100 rounded-lg p-3 flex items-center justify-between font-mono text-sm border border-neutral-800">
                  <span className="truncate flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    chmod {derived.octal} file
                  </span>
                  <button
                    onClick={() => handleCopy(`chmod ${derived.octal} file`, 'cmd')}
                    className="p-1 hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-neutral-200 cursor-pointer"
                    title="Copy command"
                  >
                    {copiedType === 'cmd' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
