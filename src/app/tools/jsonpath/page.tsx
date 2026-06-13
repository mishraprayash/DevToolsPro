'use client';

import * as React from 'react';
import Editor from '@monaco-editor/react';
import { Search, Code, Braces } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { CopyButton } from '@/components/ui/CopyButton';
import { evaluateJsonPath } from '@/tools/jsonpath/utils';
import { JsonTreeViewer } from '@/components/ui/JsonTreeViewer';
import { useAppStore } from '@/lib/store/useStore';
import { defineEditorThemes } from '@/tools/editor-theme';

const DEFAULT_JSON = `{
  "store": {
    "book": [
      {
        "category": "reference",
        "author": "Nigel Rees",
        "title": "Sayings of the Century",
        "price": 8.95
      },
      {
        "category": "fiction",
        "author": "Evelyn Waugh",
        "title": "Sword of Honour",
        "price": 12.99
      },
      {
        "category": "fiction",
        "author": "J. R. R. Tolkien",
        "title": "The Lord of the Rings",
        "isbn": "0-395-19395-8",
        "price": 22.99
      }
    ],
    "bicycle": {
      "color": "red",
      "price": 19.95
    }
  }
}`;

export default function Page() {
  const { theme } = useAppStore();
  const monacoTheme = theme === 'dark' ? 'app-dark' : 'app-light';
  const editorBg = theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white';
  const [jsonInput, setJsonInput] = React.useState(DEFAULT_JSON);
  const [path, setPath] = React.useState('$.store.book[*].author');
  const [output, setOutput] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const res = evaluateJsonPath(jsonInput, path);
    if (res.success) {
      setOutput(res.data);
      setError(null);
    } else {
      setError(res.error);
    }
  }, [jsonInput, path]);

  return (
    <ToolLayout
      name="JSONPath Playground"
      description="Test JSONPath queries against complex JSON payloads and extract data in real-time."
      category="Formatting"
    >
      <div className="space-y-6">
        
        {/* Query Input */}
        <div className="relative">
          <label className="block text-sm font-bold text-text-primary mb-2 flex items-center gap-2">
            <Search className="h-4 w-4 text-accent" /> JSONPath Expression
          </label>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="$.store.book[*].author"
            className="w-full h-12 px-4 font-mono rounded-lg bg-bg-tertiary border border-border text-text-primary focus:border-accent focus:outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
          
          {/* Source JSON */}
          <div className="flex flex-col space-y-3 h-full">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Code className="h-4 w-4 text-emerald-500" /> Source JSON
              </h2>
            </div>
            <div className={`flex-1 rounded-xl border border-border ${editorBg} overflow-hidden`}>
              <Editor
                height="100%"
                defaultLanguage="json"
                theme={monacoTheme}
                beforeMount={defineEditorThemes}
                value={jsonInput}
                onChange={(val) => setJsonInput(val || '')}
                options={{ minimap: { enabled: false }, fontSize: 14, tabSize: 2 }}
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex flex-col space-y-3 h-full">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Braces className="h-4 w-4 text-blue-500" /> Extraction Results
              </h2>
              {output && (
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span>{Array.isArray(output) ? `${output.length} matches` : ''}</span>
                  <CopyButton value={JSON.stringify(output, null, 2)} />
                </div>
              )}
            </div>
            <div className="flex-1 rounded-xl border border-border bg-bg-secondary overflow-hidden flex flex-col">
              {error ? (
                <div className="p-4 text-sm text-red-400 font-mono">{error}</div>
              ) : (
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                   {output === null ? (
                     <div className="text-text-muted text-sm">Enter a valid JSONPath to see results.</div>
                   ) : (
                     <JsonTreeViewer data={output} />
                   )}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </ToolLayout>
  );
}
