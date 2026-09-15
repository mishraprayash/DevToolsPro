import { describe, it, expect } from 'vitest';
import { tools, type ToolDef } from '@/tools/registry';

const categoryLinks = [
  { cat: 'Formatting', ids: ['json', 'yaml-json', 'html-preview', 'css-sandbox'] },
  { cat: 'Encoding', ids: ['encoder', 'number-base', 'qr-code', 'curl-converter'] },
  { cat: 'Security', ids: ['jwt', 'hash', 'password', 'aes'] },
];

// Current implementation
function getToolsLinear(ids: string[]): ToolDef[] {
  return ids.map(id => tools.find(t => t.id === id)).filter(Boolean) as ToolDef[];
}

// Optimized implementation using Map
const toolMap = new Map(tools.map(t => [t.id, t]));
function getToolsMap(ids: string[]): ToolDef[] {
  return ids.map(id => toolMap.get(id)).filter(Boolean) as ToolDef[];
}

describe('Footer tool lookup performance', () => {
  it('should return identical results', () => {
    for (const category of categoryLinks) {
      const linearResult = getToolsLinear(category.ids);
      const mapResult = getToolsMap(category.ids);
      expect(mapResult).toEqual(linearResult);
    }
  });

  it('benchmark: linear vs map lookup', () => {
    const iterations = 100_000;

    // Linear benchmark
    const startLinear = performance.now();
    for (let i = 0; i < iterations; i++) {
      for (const category of categoryLinks) {
        getToolsLinear(category.ids);
      }
    }
    const endLinear = performance.now();
    const durationLinear = endLinear - startLinear;

    // Map benchmark
    const startMap = performance.now();
    for (let i = 0; i < iterations; i++) {
      for (const category of categoryLinks) {
        getToolsMap(category.ids);
      }
    }
    const endMap = performance.now();
    const durationMap = endMap - startMap;

    const opsLinear = Math.round((iterations * 1000) / durationLinear);
    const opsMap = Math.round((iterations * 1000) / durationMap);
    const speedup = (durationLinear / durationMap).toFixed(2);

    console.log(`\n--- BENCHMARK RESULTS (${iterations} render cycles) ---`);
    console.log(`Linear search: ${durationLinear.toFixed(2)} ms (~${opsLinear.toLocaleString()} ops/sec)`);
    console.log(`Map lookup:    ${durationMap.toFixed(2)} ms (~${opsMap.toLocaleString()} ops/sec)`);
    console.log(`Speedup:       ${speedup}x faster`);
    console.log(`----------------------------------------------------\n`);

    expect(durationMap).toBeLessThan(durationLinear);
  });
});
