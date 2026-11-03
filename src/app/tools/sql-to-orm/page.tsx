'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center text-text-muted text-xs font-mono">Loading editor...</div>,
});
import { Database, Code } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { useToolPrefill } from '@/lib/hooks/useToolPrefill';
import { Button } from '@/components/ui/Button';
import { parseSqlCreate, generateOrmEntities, hasCreateTable } from '@/tools/sql-to-orm/utils';
import { useAppStore } from '@/lib/store/useStore';
import { defineEditorThemes } from '@/tools/editor-theme';
import { OpenInMenu } from '@/components/tool/OpenInMenu';
import { inputTarget } from '@/lib/utils/openInTargets';
import { useToolShortcuts, useShortcutHint } from '@/lib/hooks/useToolShortcuts';
import { copyText } from '@/lib/utils/copyText';
import { OutputActions, downloadOutput } from '@/components/tool/OutputActions';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { useTextFileDrop } from '@/lib/hooks/useTextFileDrop';
import { TextFileDropOverlay } from '@/components/ui/TextFileDropOverlay';

const DEFAULT_SQL = `CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  age INT DEFAULT 18,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const examples = [
  { label: 'Users', hint: 'defaults • unique', value: DEFAULT_SQL },
  {
    label: 'Orders',
    hint: 'foreign key',
    value: `CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_cents INT NOT NULL,
  notes TEXT,
  placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
  },
  {
    label: 'Products',
    hint: 'decimal • nullable',
    value: `CREATE TABLE products (
  sku VARCHAR(32) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INT DEFAULT 0,
  discontinued BOOLEAN DEFAULT false,
  description TEXT
);`,
  },
];

const ormFilename = { prisma: 'schema.prisma', typeorm: 'entity.ts', mongoose: 'model.ts' } as const;

export default function Page() {
  const [activeExample, setActiveExample] = React.useState(0);
  const { theme } = useAppStore();
  const monacoTheme = theme === 'dark' ? 'app-dark' : 'app-light';
  const editorBg = theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white';
  const [input, setInput] = React.useState(DEFAULT_SQL);
  const [orm, setOrm] = React.useState<'prisma' | 'typeorm' | 'mongoose'>('prisma');
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  useToolPrefill('sql-to-orm', ({ input }) => { setInput(input); setActiveExample(-1); });
  const { isDragging, dropProps } = useTextFileDrop((text) => { setInput(text); setActiveExample(-1); });
  const clearInput = () => { setInput(''); setActiveExample(-1); };

  React.useEffect(() => {
    const parseRes = parseSqlCreate(input);
    if (parseRes.success) {
      const generated = generateOrmEntities(parseRes.tableName, parseRes.data);
      setOutput(generated[orm]);
      setError(null);
    } else {
      setError(parseRes.error);
    }
  }, [input, orm]);

  const hint = useShortcutHint();
  useToolShortcuts({
    onCopy: () => void copyText(error ? '' : output, 'Schema'),
    onDownload: () => downloadOutput(error ? '' : output, ormFilename[orm]),
    onClear: clearInput,
  });

  return (
    <ToolLayout
      name="SQL to ORM Entity Generator"
      description="Convert raw SQL CREATE TABLE statements into fully-typed models for Prisma, TypeORM, or Mongoose."
      category="Formatting"
    >
      <ExamplePills
        examples={examples}
        activeIndex={activeExample}
        onSelect={(i) => { setActiveExample(i); setInput(examples[i].value); }}
      />

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-8 h-[650px]">
        
        {/* Left Input */}
        <div className="flex flex-col space-y-3 h-full">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" /> SQL DDL
            </h2>
            <div className="flex items-center gap-2">
              <OpenInMenu
                targets={[
                  inputTarget('sql-designer', hasCreateTable(input) ? input : null, 'From SQL to ORM', { label: 'SQL Schema Designer', hint: 'Visualise the tables' }),
                  inputTarget('sql-prettify', input, 'From SQL to ORM', { label: 'SQL Formatter', hint: 'Format this SQL' }),
                ]}
              />
              <Button variant="ghost" size="sm" onClick={clearInput} title={hint('Clear', 'clear')} className="h-8">Clear</Button>
            </div>
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
              options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' }}
            />
          </div>
        </div>

        {/* Right Output */}
        <div className="flex flex-col space-y-3 h-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Code className="h-4 w-4 text-emerald-500" /> ORM Entity
              </h2>
              <div className="flex bg-bg-tertiary rounded-lg p-0.5 border border-border">
                {(['prisma', 'typeorm', 'mongoose'] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() => setOrm(o)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                      orm === o 
                        ? 'bg-accent text-white shadow-sm' 
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <OutputActions value={error ? '' : output} filename={ormFilename[orm]} />
          </div>
          <div className={`flex-1 relative rounded-xl border border-border ${editorBg} overflow-hidden`}>
            {error ? (
              <div className="p-4 text-sm text-red-400 font-mono">{error}</div>
            ) : (
              <Editor
                height="100%"
                defaultLanguage={orm === 'prisma' ? 'graphql' : 'typescript'}
                theme={monacoTheme}
                beforeMount={defineEditorThemes}
                value={output}
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' }}
              />
            )}
          </div>
        </div>

      </div>
    </ToolLayout>
  );
}
