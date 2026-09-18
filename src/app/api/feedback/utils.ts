/**
 * Escapes special HTML characters in a string to prevent HTML injection/XSS.
 *
 * @param str - The input string to escape.
 * @returns The escaped HTML string.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (match) => {
    switch (match) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return match;
    }
  });
}
