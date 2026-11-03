// Text download helpers shared by tool pages (see <OutputActions />).
// The filename / MIME helpers are pure and never throw; downloadText touches the DOM.

const MIME_BY_EXT: Record<string, string> = {
  json: 'application/json',
  yaml: 'application/yaml',
  yml: 'application/yaml',
  xml: 'application/xml',
  csv: 'text/csv',
  tsv: 'text/tab-separated-values',
  sql: 'application/sql',
  ts: 'text/typescript',
  tsx: 'text/typescript',
  js: 'text/javascript',
  jsx: 'text/javascript',
  prisma: 'text/plain',
  html: 'text/html',
  css: 'text/css',
  svg: 'image/svg+xml',
  md: 'text/markdown',
  sh: 'application/x-sh',
  diff: 'text/x-diff',
  pem: 'application/x-pem-file',
  txt: 'text/plain',
};

/** Lower-cased extension of a filename without the dot ("" when there is none). Dotfiles like ".gitignore" have none. */
export function extensionOf(filename: string): string {
  if (typeof filename !== 'string') return '';
  const base = filename.split(/[\\/]/).pop() ?? '';
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return '';
  return base.slice(dot + 1).toLowerCase();
}

/** MIME type for a filename (by extension), with a UTF-8 charset for text types. Falls back to text/plain. */
export function mimeForFilename(filename: string): string {
  const mime = MIME_BY_EXT[extensionOf(filename)] ?? 'text/plain';
  return mime.startsWith('text/') ? `${mime};charset=utf-8` : mime;
}

/**
 * Makes a filename safe for downloads: strips path separators / reserved characters,
 * collapses whitespace to dashes and falls back to `fallback` when nothing is left.
 */
export function sanitizeFilename(name: string, fallback = 'output.txt'): string {
  if (typeof name !== 'string') return fallback;
  const cleaned = name
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return cleaned && cleaned !== '.' && cleaned !== '..' ? cleaned : fallback;
}

/** Saves text as a file via a temporary object URL. Returns false (never throws) on failure. */
export function downloadText(content: string, filename: string, mime?: string): boolean {
  try {
    if (typeof document === 'undefined' || !content) return false;
    const safeName = sanitizeFilename(filename);
    const blob = new Blob([content], { type: mime ?? mimeForFilename(safeName) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return true;
  } catch {
    return false;
  }
}
