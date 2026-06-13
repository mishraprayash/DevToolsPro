'use client';

import * as React from 'react';
import Editor from '@monaco-editor/react';
import { Database, Code, Braces } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { CopyButton } from '@/components/ui/CopyButton';
import { parseSqlCreate, generateOrmEntities, type GeneratedEntity } from '@/tools/sql-to-orm/utils';
import { useAppStore } from '@/lib/store/useStore';
import { defineEditorThemes } from '@/tools/editor-theme';

const DEFAULT_SQL = `CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  age INT DEFAULT 18,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

export default function Page() {
  const { theme } = useAppStore();
  const monacoTheme = theme === 'dark' ? 'app-dark' : 'app-light';
  const editorBg = theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white';
  const [input, setInput] = React.useState(DEFAULT_SQL);
  const [orm, setOrm] = React.useState<'prisma' | 'typeorm' | 'mongoose'>('prisma');
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

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

  return (
    <ToolLayout
      name="SQL to ORM Entity Generator"
      description="Convert raw SQL CREATE TABLE statements into fully-typed models for Prisma, TypeORM, or Mongoose."
      category="Formatting"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[650px]">
        
        {/* Left Input */}
        <div className="flex flex-col space-y-3 h-full">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" /> SQL DDL
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
            <CopyButton value={output} />
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
