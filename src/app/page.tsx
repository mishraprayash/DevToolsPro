import { Hero } from '@/components/homepage/Hero';
import { SmartPaste } from '@/components/homepage/SmartPaste';
import { Features } from '@/components/homepage/Features';
import { CategoryShowcase } from '@/components/homepage/CategoryShowcase';
import { ToolGrid } from '@/components/homepage/ToolGrid';

export default function Home() {
  return (
    <main className="flex-1 relative">
      <Hero />
      <SmartPaste />
      <Features />
      <CategoryShowcase />
      <div id="tool-grid">
        <ToolGrid />
      </div>
    </main>
  );
}
