import { describe, it, expect } from 'vitest';
import { gitignoreTemplates, generateGitignore } from '../utils';

describe('Gitignore Utilities', () => {
  it('should list available gitignore templates', () => {
    expect(Array.isArray(gitignoreTemplates)).toBe(true);
    expect(gitignoreTemplates.length).toBeGreaterThan(0);
    expect(gitignoreTemplates.some(t => t.id === 'node')).toBe(true);
  });

  it('should generate merged gitignore content for selected templates', () => {
    const res = generateGitignore(['node', 'macos']);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toContain('# Node.js');
      expect(res.data).toContain('node_modules/');
      expect(res.data).toContain('# macOS');
      expect(res.data).toContain('.DS_Store');
    }
  });

  it('should return empty string if no templates selected', () => {
    const res = generateGitignore([]);
    expect(res.success).toBe(true);
    if (res.success) expect(res.data).toBe('');
  });
});
