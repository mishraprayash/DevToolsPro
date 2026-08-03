export type Result<T> = { success: true; data: T } | { success: false; error: string };

export const CHANGEFREQ_VALUES = [
  'always',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never',
] as const;
export type Changefreq = (typeof CHANGEFREQ_VALUES)[number];

export interface SitemapOptions {
  changefreq: Changefreq;
  priority: number;
  includeLastmod: boolean;
  lastmodDate: string;
}

export interface SitemapEntry {
  loc: string;
  priority: number;
  changefreq: Changefreq;
}

const URL_PATTERN = /^(https?):\/\/[^\s/$.?#].[^\s]*$/i;
const PATH_PATTERN = /^\/[^\s?#]*(?:\?[^\s]*)?$/;

export function normalizeBaseUrl(baseUrl: string): Result<string> {
  const clean = baseUrl.trim().replace(/\/+$/, '');
  if (!clean) {
    return { success: false, error: 'Enter your website base URL.' };
  }
  if (!/^https?:\/\//i.test(clean)) {
    return { success: false, error: 'Base URL must start with http:// or https://.' };
  }
  if (!URL_PATTERN.test(clean) || !clean.includes('.') && !clean.includes('localhost')) {
    return { success: false, error: 'Base URL does not look valid. Example: https://example.com' };
  }
  return { success: true, data: clean };
}

export function parsePaths(raw: string): Result<string[]> {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { success: false, error: 'Add at least one page path, e.g. /, /about, /blog/post.' };
  }
  if (lines.length > 500) {
    return { success: false, error: 'Sitemaps support up to 50,000 URLs; this generator caps input at 500 paths per request.' };
  }

  for (const line of lines) {
    const isFullUrl = /^https?:\/\//i.test(line);
    const valid = isFullUrl ? URL_PATTERN.test(line) : PATH_PATTERN.test(line);
    if (!valid) {
      return {
        success: false,
        error: `Invalid path or URL: "${line}". Paths should look like /about and URLs should look like https://example.com/about.`,
      };
    }
  }

  return { success: true, data: [...new Set(lines)] };
}

export function toAbsolute(baseUrl: string, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${baseUrl}${pathOrUrl}`;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatPriority(priority: number): string {
  return Math.max(0, Math.min(1, priority)).toFixed(1);
}

export function buildSitemap(baseUrl: string, rawPaths: string, options: SitemapOptions): Result<string> {
  const baseRes = normalizeBaseUrl(baseUrl);
  if (!baseRes.success) return baseRes;

  const pathsRes = parsePaths(rawPaths);
  if (!pathsRes.success) return pathsRes;

  const entries: SitemapEntry[] = pathsRes.data.map((pathOrUrl) => ({
    loc: toAbsolute(baseRes.data, pathOrUrl),
    priority: options.priority,
    changefreq: options.changefreq,
  }));

  const blocks = entries.map((entry) => {
    const lines = [
      '  <url>',
      `    <loc>${escapeXml(entry.loc)}</loc>`,
    ];
    if (options.includeLastmod && options.lastmodDate) {
      lines.push(`    <lastmod>${options.lastmodDate}</lastmod>`);
    }
    lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
    lines.push(`    <priority>${formatPriority(entry.priority)}</priority>`);
    lines.push('  </url>');
    return lines.join('\n');
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...blocks,
    '</urlset>',
  ].join('\n');

  return { success: true, data: xml };
}

export function buildRobotsTxt(baseUrl: string): Result<string> {
  const baseRes = normalizeBaseUrl(baseUrl);
  if (!baseRes.success) return baseRes;

  const data = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${baseRes.data}/sitemap.xml`,
  ].join('\n');

  return { success: true, data };
}
