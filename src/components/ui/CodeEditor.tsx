'use client';

import dynamic from 'next/dynamic';
import type { EditorProps } from '@monaco-editor/react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center p-4 font-mono text-xs text-text-muted bg-bg-secondary">
      Loading Editor...
    </div>
  ),
});

export function CodeEditor(props: EditorProps) {
  return <MonacoEditor {...props} />;
}
