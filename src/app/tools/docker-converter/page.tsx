'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center text-text-muted text-xs font-mono">Loading editor...</div>,
});
import { ArrowLeftRight } from 'lucide-react';
import { ToolLayout } from '@/components/tool/ToolLayout';
import { Button } from '@/components/ui/Button';
import { dockerRunToCompose, dockerComposeToRun } from '@/tools/docker-converter/utils';
import { useAppStore } from '@/lib/store/useStore';
import { defineEditorThemes } from '@/tools/editor-theme';
import { useToolShortcuts, useShortcutHint } from '@/lib/hooks/useToolShortcuts';
import { copyText } from '@/lib/utils/copyText';
import { OutputActions, downloadOutput } from '@/components/tool/OutputActions';
import { ExamplePills } from '@/components/ui/ExamplePills';
import { useTextFileDrop } from '@/lib/hooks/useTextFileDrop';
import { TextFileDropOverlay } from '@/components/ui/TextFileDropOverlay';

const DEFAULT_RUN = `docker run -d \\
  --name web-app \\
  -p 8080:80 \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  -e NODE_ENV=production \\
  -e PORT=80 \\
  --restart always \\
  nginx:latest`;

const DEFAULT_COMPOSE = `version: '3.8'

services:
  web-app:
    image: nginx:latest
    container_name: web-app
    ports:
      - "8080:80"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
    environment:
      - NODE_ENV=production
      - PORT=80
    restart: always`;

type DockerMode = 'run-to-compose' | 'compose-to-run';

const examples: { label: string; hint: string; mode: DockerMode; value: string }[] = [
  { label: 'nginx', hint: 'run → compose', mode: 'run-to-compose', value: DEFAULT_RUN },
  {
    label: 'Postgres',
    hint: 'run → compose',
    mode: 'run-to-compose',
    value: `docker run -d \\
  --name db \\
  -p 5432:5432 \\
  -e POSTGRES_USER=app \\
  -e POSTGRES_PASSWORD=secret \\
  -v pgdata:/var/lib/postgresql/data \\
  postgres:16`,
  },
  {
    label: 'Redis',
    hint: 'run → compose',
    mode: 'run-to-compose',
    value: `docker run -d --name cache -p 6379:6379 --restart unless-stopped redis:7-alpine`,
  },
  { label: 'Compose file', hint: 'compose → run', mode: 'compose-to-run', value: DEFAULT_COMPOSE },
];

export default function Page() {
  const { theme } = useAppStore();
  const monacoTheme = theme === 'dark' ? 'app-dark' : 'app-light';
  const editorBg = theme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white';
  const [mode, setMode] = React.useState<DockerMode>('run-to-compose');
  const [input, setInput] = React.useState(DEFAULT_RUN);
  const [activeExample, setActiveExample] = React.useState(0);
  const { isDragging, dropProps } = useTextFileDrop((text) => { setInput(text); setActiveExample(-1); });
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (mode === 'run-to-compose') {
      const res = dockerRunToCompose(input);
      if (res.success) {
        setOutput(res.data);
        setError(null);
      } else {
        setError(res.error);
      }
    } else {
      let cancelled = false;
      dockerComposeToRun(input).then((res) => {
        if (cancelled) return;
        if (res.success) {
          setOutput(res.data);
          setError(null);
        } else {
          setError(res.error);
        }
      });
      return () => { cancelled = true; };
    }
  }, [input, mode]);

  const toggleMode = () => {
    if (mode === 'run-to-compose') {
      setMode('compose-to-run');
      setInput(DEFAULT_COMPOSE);
      setActiveExample(3);
    } else {
      setMode('run-to-compose');
      setInput(DEFAULT_RUN);
      setActiveExample(0);
    }
  };

  const hint = useShortcutHint();
  const outputFile = mode === 'run-to-compose' ? 'docker-compose.yml' : 'docker-run.sh';
  const applyExample = (i: number) => {
    setActiveExample(i);
    setMode(examples[i].mode);
    setInput(examples[i].value);
  };

  useToolShortcuts({
    onCopy: () => void copyText(error ? '' : output),
    onDownload: () => downloadOutput(error ? '' : output, outputFile),
    onClear: () => { setInput(''); setActiveExample(-1); },
  });

  return (
    <ToolLayout
      name="Docker Run ↔ Compose Converter"
      description="Convert Docker run commands into docker-compose.yml files, and vice-versa."
      category="Formatting"
    >
      <div className="space-y-4 h-[700px] flex flex-col">
        
        {/* Toggle Bar */}
        <div className="flex items-center gap-4 bg-bg-secondary p-3 rounded-xl border border-border shrink-0">
          <span className="text-sm font-semibold text-text-primary">
            {mode === 'run-to-compose' ? 'Docker Run → Docker Compose' : 'Docker Compose → Docker Run'}
          </span>
          <Button variant="secondary" size="sm" onClick={toggleMode} icon={<ArrowLeftRight className="h-4 w-4" />}>
            Switch Direction
          </Button>
        </div>

        <div className="shrink-0">
          <ExamplePills examples={examples} activeIndex={activeExample} onSelect={applyExample} />
        </div>

        {/* Editor Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
          
          {/* Input */}
          <div className="flex flex-col space-y-3 h-full">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary">
                {mode === 'run-to-compose' ? 'Docker Run Command' : 'docker-compose.yml'}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => { setInput(''); setActiveExample(-1); }} title={hint('Clear', 'clear')} className="h-8">Clear</Button>
            </div>
            <div className={`relative flex-1 rounded-xl border border-border ${editorBg} overflow-hidden`} {...dropProps}>
              <TextFileDropOverlay show={isDragging} />
              <Editor
                height="100%"
                defaultLanguage={mode === 'run-to-compose' ? 'shell' : 'yaml'}
                theme={monacoTheme}
                beforeMount={defineEditorThemes}
                value={input}
                onChange={(val) => { setInput(val || ''); setActiveExample(-1); }}
                options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' }}
              />
            </div>
          </div>

          {/* Output */}
          <div className="flex flex-col space-y-3 h-full">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary">
                {mode === 'run-to-compose' ? 'docker-compose.yml' : 'Docker Run Command'}
              </h2>
              <OutputActions value={error ? '' : output} filename={outputFile} />
            </div>
            <div className={`flex-1 relative rounded-xl border border-border ${editorBg} overflow-hidden`}>
              {error ? (
                <div className="p-4 text-sm text-red-400 font-mono">{error}</div>
              ) : (
                <Editor
                  height="100%"
                  defaultLanguage={mode === 'run-to-compose' ? 'yaml' : 'shell'}
                  theme={monacoTheme}
                  beforeMount={defineEditorThemes}
                  value={output}
                  options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' }}
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </ToolLayout>
  );
}
