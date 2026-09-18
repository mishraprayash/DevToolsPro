import { describe, it, expect } from 'vitest';
import {
  generatePassword,
  generatePassphrase,
  calculateEntropy,
  PasswordOptions,
} from '../utils';

describe('Password Utilities', () => {
  const defaultOptions: PasswordOptions = {
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
    mode: 'random',
  };

  describe('generatePassword', () => {
    it('should generate a random password with specified length and character sets', () => {
      const pwd = generatePassword(defaultOptions);
      expect(pwd).toHaveLength(16);
    });

    it('should exclude ambiguous characters when option is enabled', () => {
      const opts: PasswordOptions = {
        ...defaultOptions,
        length: 100,
        excludeAmbiguous: true,
      };
      const pwd = generatePassword(opts);
      const ambiguousChars = 'iI1lLo0O8B';
      for (const char of ambiguousChars) {
        expect(pwd).not.toContain(char);
      }
    });

    it('should handle passphrase mode option', () => {
      const opts: PasswordOptions = {
        ...defaultOptions,
        mode: 'passphrase',
        wordCount: 4,
        separator: '-',
      };
      const pwd = generatePassword(opts);
      expect(pwd.split('-')).toHaveLength(4);
    });

    it('should return empty string if no character set is enabled', () => {
      const opts: PasswordOptions = {
        ...defaultOptions,
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false,
      };
      expect(generatePassword(opts)).toBe('');
    });
  });

  describe('generatePassphrase', () => {
    it('should generate passphrase with specified word count and custom separator', () => {
      const passphrase = generatePassphrase(5, '_');
      const words = passphrase.split('_');
      expect(words).toHaveLength(5);
    });

    it('should clamp word count between 2 and 10', () => {
      expect(generatePassphrase(1).split('-')).toHaveLength(2);
      expect(generatePassphrase(20).split('-')).toHaveLength(10);
    });
  });

  describe('calculateEntropy', () => {
    it('should return zero bits and instant time for empty password', () => {
      const details = calculateEntropy('');
      expect(details.bits).toBe(0);
      expect(details.label).toBe('Weak');
      expect(details.timeToCrack).toBe('Instant');
    });

    it('should classify password entropy labels (Weak, Fair, Strong, Ultra)', () => {
      const weak = calculateEntropy('abc');
      expect(weak.label).toBe('Weak');

      const fair = calculateEntropy('Abc12345');
      expect(fair.label).toBe('Fair');

      const strong = calculateEntropy('A1!b2@C3#d4$');
      expect(strong.label).toBe('Strong');

      const ultra = calculateEntropy('VeryLongComplexPasswordWith!@#$1234');
      expect(ultra.label).toBe('Ultra');
    });
  });
});
