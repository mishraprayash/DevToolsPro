'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center text-text-muted text-xs font-mono">Loading editor...</div>,
});
import { Database, RefreshCcw, Minimize2, BarChart2, Table } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { useToolPrefill } from '@/lib/hooks/useToolPrefill';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { formatSql, minifySql, analyzeSql, type SqlFormatterOptions, type SqlKeywordCase, type SqlDialect } from '@/tools/sql-prettify/utils';
import { useAppStore } from '@/lib/store/useStore';
import { defineEditorThemes } from '@/tools/editor-theme';
import { OpenInMenu } from '@/components/tool/OpenInMenu';
import { inputTarget } from '@/lib/utils/openInTargets';
import { hasCreateTable } from '@/tools/sql-to-orm/utils';
import { useToolShortcuts, useShortcutHint } from '@/lib/hooks/useToolShortcuts';
import { copyText } from '@/lib/utils/copyText';
import { OutputActions, downloadOutput } from '@/components/tool/OutputActions';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { useTextFileDrop } from '@/lib/hooks/useTextFileDrop';
import { TextFileDropOverlay } from '@/components/ui/TextFileDropOverlay';

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

const examples = [
  {
    label: 'Join query',
    hint: 'SELECT • JOIN',
    value: 'select id, name, created_at from users left join orders on users.id = orders.user_id where active=1 order by created_at desc;',
  },
  {
    label: 'CREATE TABLE',
    hint: 'DDL',
    value: 'create table posts (id serial primary key, author_id int not null references users(id), title varchar(200) not null, body text, published_at timestamptz default now());',
  },
  {
    label: 'CTE + window',
    hint: 'WITH • OVER',
    value: "with monthly as (select user_id, date_trunc('month', created_at) as month, sum(total) as revenue from orders group by 1, 2) select user_id, month, revenue, rank() over (partition by month order by revenue desc) as rnk from monthly where revenue > 100;",
  },
  {
    label: 'Upsert',
    hint: 'INSERT … ON CONFLICT',
    value: "insert into settings (user_id, key, value) values (42, 'theme', 'dark'), (42, 'lang', 'en') on conflict (user_id, key) do update set value = excluded.value;",
  },
];

export default function Page() {
  const [activeExample, setActiveExample] = React.useState(0);
  const { theme } = useAppStore();
  const monacoTheme = theme === 'dark' ? 'app-dark' : 'app-light';
  const editorBg = theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white';
  const [input, setInput] = React.useState(examples[0].value);
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  useToolPrefill('sql-prettify', ({ input }) => { setInput(input); setActiveExample(-1); });
  const { isDragging, dropProps } = useTextFileDrop((text) => { setInput(text); setActiveExample(-1); });
  const clearInput = () => { setInput(''); setActiveExample(-1); };

  const [options, setOptions] = React.useState<SqlFormatterOptions>({
    language: 'sql',
    keywordCase: 'upper',
    tabWidth: 2,
    useSpaces: true,
  });

  const handleFormat = React.useCallback(async () => {
    const res = await formatSql(input, options);
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

  const hint = useShortcutHint();
  useToolShortcuts({
    onRun: () => void handleFormat(),
    onCopy: () => void copyText(error ? '' : output, 'SQL'),
    onDownload: () => downloadOutput(error ? '' : output, 'query.sql'),
    onClear: clearInput,
  });

  return (
    <ToolLayout
      name="SQL Formatter & Prettifier"
      description="Format, prettify, minify, and standardize SQL queries with multi-dialect support and query statistics."
      category="Formatting"
    >
      <div className="flex flex-col space-y-4">
        <ExamplePills
          examples={examples}
          activeIndex={activeExample}
          onSelect={(i) => { setActiveExample(i); setInput(examples[i].value); }}
        />

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
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleFormat} title={hint('Format', 'run')} icon={<RefreshCcw className="h-4 w-4" />} className="flex-1">
              Format
            </Button>
            <Button variant="secondary" onClick={handleMinify} icon={<Minimize2 className="h-4 w-4" />} className="flex-1">
              Minify
            </Button>
          </div>
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
              <Button variant="ghost" size="sm" onClick={clearInput} title={hint('Clear', 'clear')} className="h-8 text-xs">Clear</Button>
            </div>
            <div className={`relative flex-1 rounded-xl border border-border ${editorBg} overflow-hidden`} {...dropProps}>
              <TextFileDropOverlay show={isDragging} />
              <Editor
                height="100%"
                defaultLanguage="sql"
                theme={monacoTheme}
                beforeMount={defineEditorThemes}
                value={input}
                onChange={(val) => { setInput(val || ''); setActiveExample(-1); }}
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <RefreshCcw className="h-4 w-4 text-emerald-500" /> Formatted / Minified Output
              </h2>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {hasCreateTable(input) && (
                  <OpenInMenu
                    targets={[
                      inputTarget('sql-designer', output || input, 'From SQL Formatter', { label: 'SQL Schema Designer', hint: 'Visualise the tables' }),
                      inputTarget('sql-to-orm', output || input, 'From SQL Formatter', { label: 'SQL to ORM', hint: 'Generate Prisma / TypeORM / Mongoose' }),
                    ]}
                  />
                )}
                <OutputActions value={error ? '' : output} filename="query.sql" />
              </div>
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
