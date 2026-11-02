import { describe, it, expect } from 'vitest';
import { normalizeTabName, nextTabName, MAX_TAB_NAME_LENGTH } from '../workspaceNames';

describe('workspaceNames', () => {
  describe('normalizeTabName', () => {
    it('should trim and collapse whitespace', () => {
      expect(normalizeTabName('  My   API\tpayload  ', 'JSON 1')).toBe('My API payload');
    });

    it('should fall back to the previous name when empty', () => {
      expect(normalizeTabName('', 'JSON 1')).toBe('JSON 1');
      expect(normalizeTabName('   \n ', 'JSON 1')).toBe('JSON 1');
    });

    it('should cap the length', () => {
      const result = normalizeTabName('x'.repeat(100), 'JSON 1');
      expect(result).toHaveLength(MAX_TAB_NAME_LENGTH);
    });

    it('should keep unicode names intact', () => {
      expect(normalizeTabName('Prod 🚀 tokens', 'JWT 1')).toBe('Prod 🚀 tokens');
    });
  });

  describe('nextTabName', () => {
    it('should number from the current tab count', () => {
      expect(nextTabName('JSON', [])).toBe('JSON 1');
      expect(nextTabName('JSON', ['JSON 1'])).toBe('JSON 2');
    });

    it('should skip names that are already taken', () => {
      // "JSON 2" was closed, so there are 2 tabs but "JSON 3" exists
      expect(nextTabName('JSON', ['JSON 1', 'JSON 3'])).toBe('JSON 4');
    });

    it('should ignore renamed tabs when counting', () => {
      expect(nextTabName('JSON', ['Users API', 'Orders API'])).toBe('JSON 3');
    });
  });
});
