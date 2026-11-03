import { describe, it, expect } from 'vitest';
import { extensionOf, mimeForFilename, sanitizeFilename, downloadText } from '../download';

describe('download helpers', () => {
  describe('extensionOf', () => {
    it('returns the lower-cased extension', () => {
      expect(extensionOf('types.TS')).toBe('ts');
      expect(extensionOf('archive.tar.gz')).toBe('gz');
      expect(extensionOf('dir/sub/schema.prisma')).toBe('prisma');
    });

    it('treats dotfiles and trailing dots as extension-less', () => {
      expect(extensionOf('.gitignore')).toBe('');
      expect(extensionOf('README')).toBe('');
      expect(extensionOf('weird.')).toBe('');
      expect(extensionOf(undefined as unknown as string)).toBe('');
    });
  });

  describe('mimeForFilename', () => {
    it('maps common tool outputs', () => {
      expect(mimeForFilename('out.json')).toBe('application/json');
      expect(mimeForFilename('config.yaml')).toBe('application/yaml');
      expect(mimeForFilename('config.yml')).toBe('application/yaml');
      expect(mimeForFilename('data.xml')).toBe('application/xml');
      expect(mimeForFilename('query.sql')).toBe('application/sql');
      expect(mimeForFilename('icon.svg')).toBe('image/svg+xml');
    });

    it('adds a utf-8 charset to text types', () => {
      expect(mimeForFilename('rows.csv')).toBe('text/csv;charset=utf-8');
      expect(mimeForFilename('types.ts')).toBe('text/typescript;charset=utf-8');
      expect(mimeForFilename('Icon.jsx')).toBe('text/javascript;charset=utf-8');
    });

    it('falls back to text/plain', () => {
      expect(mimeForFilename('.gitignore')).toBe('text/plain;charset=utf-8');
      expect(mimeForFilename('blob.unknownext')).toBe('text/plain;charset=utf-8');
    });
  });

  describe('sanitizeFilename', () => {
    it('strips path separators and reserved characters', () => {
      expect(sanitizeFilename('../etc/passwd')).toBe('..-etc-passwd');
      expect(sanitizeFilename('my file:v2?.json')).toBe('my-file-v2-.json');
    });

    it('falls back when nothing usable is left', () => {
      expect(sanitizeFilename('')).toBe('output.txt');
      expect(sanitizeFilename('///', 'x.json')).toBe('x.json');
      expect(sanitizeFilename('..')).toBe('output.txt');
    });

    it('caps very long names', () => {
      expect(sanitizeFilename('a'.repeat(500)).length).toBe(120);
    });
  });

  it('downloadText is a safe no-op without a DOM', () => {
    expect(downloadText('hello', 'a.txt')).toBe(false);
  });
});
