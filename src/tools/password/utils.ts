export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  mode: 'random' | 'passphrase';
  wordCount?: number;
  separator?: string;
}

export interface EntropyDetails {
  bits: number;
  label: 'Weak' | 'Fair' | 'Strong' | 'Ultra';
  score: number;
  color: string;
  timeToCrack: string;
  poolSize: number;
}

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS = 'iI1lLo0O8B';

const WORD_LIST = [
  'apple', 'anchor', 'beacon', 'breeze', 'canvas', 'canyon', 'castle', 'cobalt',
  'crystal', 'dragon', 'dune', 'eagle', 'echo', 'ember', 'falcon', 'feather',
  'flame', 'forest', 'galaxy', 'glacier', 'granite', 'harbor', 'horizon', 'island',
  'jaguar', 'jungle', 'lagoon', 'legend', 'lotus', 'magnet', 'meadow', 'meteor',
  'monarch', 'mountain', 'nebula', 'oasis', 'ocean', 'orchid', 'panther', 'phoenix',
  'planet', 'prism', 'pyramid', 'quantum', 'quartz', 'radar', 'river', 'rocket',
  'shadow', 'shield', 'solar', 'spark', 'sphere', 'spirit', 'summit', 'thunder',
  'tiger', 'timber', 'titan', 'beacon', 'topaz', 'trident', 'tundra', 'valley',
  'vessel', 'vortex', 'whisper', 'willow', 'zenith', 'zephyr'
];

import type { Result } from '@/types';
import { ok, err } from '@/types';

export function generatePasswordResult(options: PasswordOptions): Result<string> {
  if (options.mode === 'passphrase') return ok(generatePassphrase(options.wordCount || 4, options.separator || '-'));

  let lower = LOWERCASE;
  let upper = UPPERCASE;
  let num = NUMBERS;
  let sym = SYMBOLS;

  if (options.excludeAmbiguous) {
    const ambSet = new Set(AMBIGUOUS.split(''));
    lower = lower.split('').filter((c) => !ambSet.has(c)).join('');
    upper = upper.split('').filter((c) => !ambSet.has(c)).join('');
    num = num.split('').filter((c) => !ambSet.has(c)).join('');
    sym = sym.split('').filter((c) => !ambSet.has(c)).join('');
  }

  let chars = '';
  if (options.lowercase) chars += lower;
  if (options.uppercase) chars += upper;
  if (options.numbers) chars += num;
  if (options.symbols) chars += sym;

  if (!chars) return err('Select at least one character set (lower/upper/numbers/symbols).');
  const safeLen = Math.max(4, Math.min(options.length, 128));

  try {
    const array = new Uint32Array(safeLen);
    crypto.getRandomValues(array);
    let password = '';
    for (let i = 0; i < safeLen; i++) password += chars[array[i] % chars.length];
    return ok(password);
  } catch (e) {
    return err((e as Error).message || 'Failed to generate password');
  }
}

export function generatePassword(options: PasswordOptions): string {
  const r = generatePasswordResult(options);
  return r.success ? r.data : '';
}

export function generatePassphrase(count: number = 4, separator: string = '-'): string {
  const safeCount = Math.max(2, Math.min(count, 10));
  const array = new Uint32Array(safeCount);
  crypto.getRandomValues(array);

  const chosen: string[] = [];
  for (let i = 0; i < safeCount; i++) {
    chosen.push(WORD_LIST[array[i] % WORD_LIST.length]);
  }

  return chosen.join(separator);
}

export function calculateEntropy(pwd: string): EntropyDetails {
  if (!pwd) {
    return {
      bits: 0,
      label: 'Weak',
      score: 0,
      color: 'text-red-400',
      timeToCrack: 'Instant',
      poolSize: 0,
    };
  }

  let poolSize = 0;
  if (/[a-z]/.test(pwd)) poolSize += 26;
  if (/[A-Z]/.test(pwd)) poolSize += 26;
  if (/[0-9]/.test(pwd)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(pwd)) poolSize += 32;

  if (poolSize === 0) poolSize = 26;

  const bits = Math.round(Math.log2(poolSize) * pwd.length);
  const totalCombinations = Math.pow(poolSize, pwd.length);

  const secondsToCrack = totalCombinations / 10000000000;
  const timeToCrack = formatTimeToCrack(secondsToCrack);

  if (bits < 40) {
    return { bits, label: 'Weak', score: 0.25, color: 'text-red-400', timeToCrack, poolSize };
  } else if (bits < 60) {
    return { bits, label: 'Fair', score: 0.5, color: 'text-amber-400', timeToCrack, poolSize };
  } else if (bits < 80) {
    return { bits, label: 'Strong', score: 0.75, color: 'text-emerald-400', timeToCrack, poolSize };
  } else {
    return { bits, label: 'Ultra', score: 1.0, color: 'text-cyan-400', timeToCrack, poolSize };
  }
}

function formatTimeToCrack(seconds: number): string {
  if (seconds < 1) return 'Instant (< 1 second)';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} years`;
  return 'Trillions of centuries';
}
