const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

const WORDS = LOREM.replace(/[,.]/g, '').split(/\s+/);

export function generateWords(count: number): string {
  const result: string[] = [];
  const safe = Math.max(1, Math.min(count, 10000));
  for (let i = 0; i < safe; i++) {
    result.push(WORDS[i % WORDS.length]);
  }
  return result.join(' ');
}

export function generateSentences(count: number): string {
  const result: string[] = [];
  const safe = Math.max(1, Math.min(count, 1000));
  for (let i = 0; i < safe; i++) {
    const sentence = generateWords(Math.floor(Math.random() * 15) + 5);
    result.push(sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.');
  }
  return result.join(' ');
}

export function generateParagraphs(count: number): string {
  const result: string[] = [];
  const safe = Math.max(1, Math.min(count, 500));
  for (let i = 0; i < safe; i++) {
    const para = generateSentences(Math.floor(Math.random() * 4) + 3);
    result.push(para);
  }
  return result.join('\n\n');
}

export interface TextStats {
  chars: number;
  charsNoSpaces: number;
  words: number;
  lines: number;
  paragraphs: number;
  readingTimeMinutes: number;
}

export type StatsResult = { success: true; data: TextStats } | { success: false; error: string };

export function analyzeText(input: string): StatsResult {
  try {
    const text = input ?? '';
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s+/g, '').length;
    const lines = text === '' ? 0 : text.split(/\r?\n/).length;
    const paragraphs = text.trim() === '' ? 0 : text.split(/\n\s*\n/).filter(Boolean).length;
    const words = text.trim() === '' ? 0 : (text.trim().split(/\s+/).filter(Boolean).length);
    const readingTimeMinutes = Math.max(0, +(words / 200).toFixed(2));

    return {
      success: true,
      data: {
        chars,
        charsNoSpaces,
        words,
        lines,
        paragraphs,
        readingTimeMinutes,
      },
    };
  } catch (e) {
    return { success: false, error: (e as Error).message || 'Unknown error' };
  }
}

import type { Result } from '@/types';
import { ok, err } from '@/types';

export function slugify(input: string): string {
  const r = slugifyResult(input);
  return r.success ? r.data : '';
}

export function slugifyResult(input: string): Result<string> {
  try {
    if (!input) return ok('');
    const out = input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    return ok(out);
  } catch (e) {
    return err((e as Error).message || 'Failed to slugify');
  }
}

export function transformText(input: string, transformType: 'slug' | 'upper' | 'lower' | 'title' | 'trim'): string {
  const r = transformTextResult(input, transformType);
  return r.success ? r.data : '';
}

export function transformTextResult(input: string, transformType: 'slug' | 'upper' | 'lower' | 'title' | 'trim'): Result<string> {
  try {
    if (!input) return ok('');
    switch (transformType) {
      case 'slug':
        return slugifyResult(input);
      case 'upper':
        return ok(input.toUpperCase());
      case 'lower':
        return ok(input.toLowerCase());
      case 'title':
        return ok(input.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()));
      case 'trim':
        return ok(input.trim());
      default:
        return ok(input);
    }
  } catch (e) {
    return err((e as Error).message || 'Failed to transform text');
  }
}
