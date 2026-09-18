'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Database, RefreshCcw, Minimize2, BarChart2, Table } from 'lucide-react';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { CopyButton } from '@/components/ui/CopyButton';
import { formatSql, minifySql, analyzeSql, type SqlFormatterOptions, type SqlKeywordCase, type SqlDialect } from '@/tools/sql-prettify/utils';
import { useAppStore } from '@/lib/store/useStore';
import { defineEditorThemes } from '@/tools/editor-theme';

const dialectOptions = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'transactsql', label: 'T-SQL (SQL Server)' },
  { value: 'plsql', label: 'Oracle PL/SQL' },
  { value: 'bigquery', label: 'Google BigQuery' },
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'redshift', label: 'Amazon Redshift' },
];

export default function Page() {
  const { theme } = useAppStore();
  const monacoTheme = theme === 'dark' ? 'app-dark' : 'app-light';
  const editorBg = theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white';
  const [input, setInput] = React.useState('select id, name, created_at from users left join orders on users.id = orders.user_id where active=1 order by created_at desc;');
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

  const handleMinify = React.useCallback(() => {
    const res = minifySql(input);
    if (res.success) {
      setOutput(res.data);
      setError(null);
    } else {
      setError(res.error);
    }
  }, [input]);

  React.useEffect(() => {
    handleFormat();
  }, [handleFormat]);

  const stats = React.useMemo(() => analyzeSql(input), [input]);

  return (
    <ToolLayout
      name="SQL Formatter & Prettifier"
      description="Format, prettify, minify, and standardize SQL queries with multi-dialect support and query statistics."
      category="Formatting"
    >
      <div className="flex flex-col space-y-4">
        {/* Controls */}
        <div className="p-4 rounded-xl border border-border bg-bg-secondary grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <Select
            label="Dialect"
            value={options.language}
            onChange={(e) => setOptions({ ...options, language: e.target.value as SqlDialect })}
            options={dialectOptions}
          />
          <Select
            label="Keyword Case"
            value={options.keywordCase}
            onChange={(e) => setOptions({ ...options, keywordCase: e.target.value as SqlKeywordCase })}
            options={[
              { value: 'upper', label: 'UPPERCASE' },
              { value: 'lower', label: 'lowercase' },
              { value: 'preserve', label: 'Preserve Original' },
            ]}
          />
          <Select
            label="Indentation"
            value={String(options.tabWidth)}
            onChange={(e) => setOptions({ ...options, tabWidth: parseInt(e.target.value, 10) })}
            options={[
              { value: '2', label: '2 Spaces' },
              { value: '4', label: '4 Spaces' },
            ]}
          />

        </div>

        {/* Stats banner */}
        <div className="p-3 rounded-xl border border-border/60 bg-bg-tertiary/40 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-text-secondary">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-semibold text-text-primary">
              <BarChart2 className="h-4 w-4 text-sky-400" /> Command: <span className="text-accent">{stats.commandType}</span>
            </span>
            <span>Lines: {stats.lineCount}</span>
            <span>Words: {stats.wordCount}</span>
            <span>Chars: {stats.characterCount}</span>
          </div>
          {stats.tablesDetected.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-sans">
              <Table className="h-3.5 w-3.5 text-emerald-400" />
              <span>Tables:</span>
              {stats.tablesDetected.map((tbl) => (
                <span key={tbl} className="px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 font-mono text-accent">
                  {tbl}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Editors grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[560px]">
          {/* Input */}
          <div className="lg:col-span-6 flex flex-col space-y-2 h-full">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" /> Input Query
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setInput('')} className="h-8 text-xs">Clear</Button>
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
                  padding: { top: 14, bottom: 14 }
                }}
              />
            </div>
          </div>

          {/* Output */}
          <div className="lg:col-span-6 flex flex-col space-y-2 h-full">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <RefreshCcw className="h-4 w-4 text-emerald-500" /> Formatted / Minified Output
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
                    padding: { top: 14, bottom: 14 }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
