export interface RegexMatch {
  index: number;
  text: string;
  groups: string[];
}

export interface RegexResult {
  matches: RegexMatch[];
  isValid: boolean;
  error?: string;
  pattern: string;
}

export interface RegexPatternPreset {
  id: string;
  name: string;
  pattern: string;
  flags: string;
  description: string;
  sample: string;
}

export const REGEX_LIBRARY: RegexPatternPreset[] = [
  {
    id: 'email',
    name: 'Email Address',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    flags: 'gm',
    description: 'Matches standard RFC 5322 email addresses',
    sample: 'user@example.com, invalid.email@com, dev.test+1@sub.domain.co',
  },
  {
    id: 'url',
    name: 'URL / Web Link',
    pattern: 'https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)',
    flags: 'g',
    description: 'Matches HTTP and HTTPS URLs',
    sample: 'Visit https://github.com/developer/project or http://localhost:3000/api',
  },
  {
    id: 'ipv4',
    name: 'IPv4 Address',
    pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
    flags: 'g',
    description: 'Matches valid IPv4 addresses',
    sample: 'Server at 192.168.1.1 and DNS at 8.8.8.8',
  },
  {
    id: 'date-iso',
    name: 'ISO Date (YYYY-MM-DD)',
    pattern: '\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b',
    flags: 'g',
    description: 'Matches ISO-8601 formatted date strings',
    sample: 'Created on 2026-08-17, target deadline 2026-12-31',
  },
];

export function testRegex(pattern: string, flags: string, input: string): RegexResult {
  if (!pattern) {
    return { matches: [], isValid: true, pattern };
  }

  try {
    const regex = new RegExp(pattern, flags);
    const matches: RegexMatch[] = [];
    let match;

    if (flags.includes('g')) {
      while ((match = regex.exec(input)) !== null) {
        matches.push({
          index: match.index,
          text: match[0],
          groups: match.slice(1),
        });
        if (match[0].length === 0) {
          regex.lastIndex++;
        }
      }
    } else {
      match = regex.exec(input);
      if (match) {
        matches.push({
          index: match.index,
          text: match[0],
          groups: match.slice(1),
        });
      }
    }

    return { matches, isValid: true, pattern };
  } catch (e) {
    return {
      matches: [],
      isValid: false,
      error: (e as Error).message,
      pattern,
    };
  }
}

export function replaceRegex(
  input: string,
  pattern: string,
  flags: string,
  replacement: string
): { success: true; output: string } | { success: false; error: string } {
  try {
    if (!pattern) return { success: true, output: input };
    const regex = new RegExp(pattern, flags);
    const output = input.replace(regex, replacement);
    return { success: true, output };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export function highlightMatches(input: string, matches: RegexMatch[]): { start: number; end: number }[] {
  return matches.map((m) => ({
    start: m.index,
    end: m.index + m.text.length,
  }));
}

export const regexFlags = [
  { id: 'g', name: 'Global', description: 'Find all matches' },
  { id: 'i', name: 'Case Insensitive', description: 'Ignore case' },
  { id: 'm', name: 'Multiline', description: '^ and $ match line breaks' },
  { id: 's', name: 'Dot All', description: '. matches newlines' },
];
