'use client';

import * as React from 'react';
import { Hero } from '@/components/homepage/Hero';
import { Features } from '@/components/homepage/Features';
import { CategoryShowcase } from '@/components/homepage/CategoryShowcase';
import { ToolGrid } from '@/components/homepage/ToolGrid';

export default function Home() {
  return (
    <main className="flex-1 relative">
      <Hero />
      <Features />
      <CategoryShowcase />
      <div id="tool-grid">
        <ToolGrid />
      </div>
    </main>
  );
}
