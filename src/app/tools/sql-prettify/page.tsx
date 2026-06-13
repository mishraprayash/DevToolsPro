'use client';

import * as React from 'react';
import Editor from '@monaco-editor/react';
import { Database, Copy, RefreshCcw } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { CopyButton } from '@/components/ui/CopyButton';
import { formatSql, type SqlFormatterOptions } from '@/tools/sql-prettify/utils';
import { useAppStore } from '@/lib/store/useStore';
import { defineEditorThemes } from '@/tools/editor-theme';

export default function Page() {
  const { theme } = useAppStore();
  const monacoTheme = theme === 'dark' ? 'app-dark' : 'app-light';
  const editorBg = theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white';
  const [input, setInput] = React.useState('select id, name, created_at from users where active=1 order by created_at desc;');
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const [options, setOptions] = React.useState<SqlFormatterOptions>({
    language: 'sql',
    keywordCase: 'upper',
    tabWidth: 2,
    useSpaces: true,
  });

  const handleFormat = React.useCallback(() => {
    const res = formatSql(input, options);
    if (res.success) {
      setOutput(res.data);
      setError(null);
    } else {
      setError(res.error);
    }
  }, [input, options]);

  React.useEffect(() => {
    handleFormat();
  }, [handleFormat]);

  return (
    <ToolLayout
      name="SQL Formatter & Prettifier"
      description="Format, prettify, and standardize SQL queries with advanced casing rules and dialect support."
      category="Formatting"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[700px]">
        
        {/* Left Input */}
        <div className="lg:col-span-5 flex flex-col space-y-4 h-full">
          <div className="p-4 rounded-xl border border-border bg-bg-secondary space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Dialect"
                value={options.language}
                onChange={(e) => setOptions({ ...options, language: e.target.value as any })}
                options={[
                  { value: 'sql', label: 'Standard SQL' },
                  { value: 'postgresql', label: 'PostgreSQL' },
                  { value: 'mysql', label: 'MySQL / MariaDB' },
                  { value: 'plsql', label: 'PL/SQL' },
                ]}
              />
              <Select
                label="Keyword Case"
                value={options.keywordCase}
                onChange={(e) => setOptions({ ...options, keywordCase: e.target.value as any })}
                options={[
                  { value: 'upper', label: 'UPPERCASE' },
                  { value: 'lower', label: 'lowercase' },
                  { value: 'preserve', label: 'Preserve Original' },
                ]}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" /> Input Query
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setInput('')} className="h-8">Clear</Button>
          </div>
          <div className={`flex-1 rounded-xl border border-border ${editorBg} overflow-hidden`}>
            <Editor
              height="100%"
              defaultLanguage="sql"
              theme={monacoTheme}
              beforeMount={defineEditorThemes}
              value={input}
              onChange={(val) => setInput(val || '')}
              options={{ 
                minimap: { enabled: false }, 
                fontSize: 14, 
                wordWrap: 'on',
                padding: { top: 16, bottom: 16 }
              }}
            />
          </div>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-7 flex flex-col space-y-4 h-full">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <RefreshCcw className="h-4 w-4 text-emerald-500" /> Formatted Output
            </h2>
            <CopyButton value={output} />
          </div>
          <div className={`flex-1 relative rounded-xl border border-border ${editorBg} overflow-hidden`}>
            {error ? (
              <div className="p-4 text-sm text-red-400 font-mono">{error}</div>
            ) : (
              <Editor
                height="100%"
                defaultLanguage="sql"
                theme={monacoTheme}
                beforeMount={defineEditorThemes}
                value={output}
                options={{ 
                  readOnly: true, 
                  minimap: { enabled: false }, 
                  fontSize: 14, 
                  wordWrap: 'on',
                  padding: { top: 16, bottom: 16 }
                }}
              />
            )}
          </div>
        </div>

      </div>
    </ToolLayout>
  );
}
