import { describe, it, expect } from 'vitest';
import {
  calculateOctalAndSymbolic,
  parseOctal,
  parseSymbolic,
  ChmodState,
} from '../utils';

describe('Chmod Utilities', () => {
  const defaultState: ChmodState = {
    owner: { read: true, write: true, execute: true },
    group: { read: true, write: false, execute: true },
    other: { read: true, write: false, execute: true },
    special: { setuid: false, setgid: false, sticky: false },
  };

  describe('calculateOctalAndSymbolic', () => {
    it('should calculate octal and symbolic string for standard 755', () => {
      const res = calculateOctalAndSymbolic(defaultState);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.octal).toBe('755');
        expect(res.data.symbolic).toBe('rwxr-xr-x');
        expect(res.data.command).toBe('chmod 755 filename');
      }
    });

    it('should calculate octal and symbolic string for 4755 (setuid)', () => {
      const state: ChmodState = {
        ...defaultState,
        special: { setuid: true, setgid: false, sticky: false },
      };
      const res = calculateOctalAndSymbolic(state);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.octal).toBe('4755');
        expect(res.data.symbolic).toBe('rwsr-xr-x');
      }
    });

    it('should calculate uppercase S and T when execute permission is false', () => {
      const state: ChmodState = {
        owner: { read: true, write: true, execute: false },
        group: { read: true, write: false, execute: false },
        other: { read: true, write: false, execute: false },
        special: { setuid: true, setgid: true, sticky: true },
      };
      const res = calculateOctalAndSymbolic(state);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.octal).toBe('7644');
        expect(res.data.symbolic).toBe('rwSr-Sr-T');
      }
    });
  });

  describe('parseOctal', () => {
    it('should parse 3-digit octal string correctly', () => {
      const res = parseOctal('755');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.owner).toEqual({ read: true, write: true, execute: true });
        expect(res.data.group).toEqual({ read: true, write: false, execute: true });
        expect(res.data.other).toEqual({ read: true, write: false, execute: true });
        expect(res.data.special).toEqual({ setuid: false, setgid: false, sticky: false });
      }
    });

    it('should parse 4-digit octal with special permissions correctly', () => {
      const res = parseOctal('1777');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.special).toEqual({ setuid: false, setgid: false, sticky: true });
      }
    });

    it('should return error for invalid octal strings', () => {
      expect(parseOctal('888').success).toBe(false);
      expect(parseOctal('75').success).toBe(false);
      expect(parseOctal('abcd').success).toBe(false);
      expect(parseOctal('').success).toBe(false);
    });
  });

  describe('parseSymbolic', () => {
    it('should parse valid 9-character symbolic string', () => {
      const res = parseSymbolic('rwxr-xr-x');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.owner).toEqual({ read: true, write: true, execute: true });
        expect(res.data.group).toEqual({ read: true, write: false, execute: true });
        expect(res.data.other).toEqual({ read: true, write: false, execute: true });
      }
    });

    it('should handle leading file type character (e.g. - or d)', () => {
      const res = parseSymbolic('-rwxr-xr-x');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.owner.read).toBe(true);
      }
    });

    it('should handle special s/S/t/T characters in symbolic permissions', () => {
      const res = parseSymbolic('rwsr-Sr-t');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.special).toEqual({ setuid: true, setgid: true, sticky: true });
        expect(res.data.owner.execute).toBe(true);
        expect(res.data.group.execute).toBe(false);
        expect(res.data.other.execute).toBe(true);
      }
    });

    it('should return error for invalid symbolic lengths and patterns', () => {
      expect(parseSymbolic('rwx').success).toBe(false);
      expect(parseSymbolic('rwxrwxrwxextra').success).toBe(false);
      expect(parseSymbolic('invalid!!').success).toBe(false);
    });
  });
});
