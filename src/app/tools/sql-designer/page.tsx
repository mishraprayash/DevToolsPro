'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { ToolLayout } from '@/components/tool/ToolLayout';

const FlowDesigner = dynamic(() => import('./FlowDesigner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[720px] flex items-center justify-center p-8 font-mono text-sm text-text-muted bg-bg-secondary rounded-xl border border-border">
      Loading Schema Designer Canvas...
    </div>
  ),
});

export default function Page() {
  return (
    <ToolLayout
      name="SQL Schema Designer"
      description="Visually design database schemas, draw relationships, auto-layout tables, and export SQL, Prisma, or TypeScript models."
      category="Formatting"
    >
      <FlowDesigner />
    </ToolLayout>
  );
}
