import { describe, it, expect } from 'vitest';
import {
  calculateOctalAndSymbolic,
  parseOctal,
  parseSymbolic,
  ChmodState,
} from '../utils';

describe('Chmod Utilities', () => {
  describe('calculateOctalAndSymbolic', () => {
    it('should calculate octal, symbolic, and command for standard 755 state', () => {
      const state: ChmodState = {
        owner: { read: true, write: true, execute: true },
        group: { read: true, write: false, execute: true },
        other: { read: true, write: false, execute: true },
        special: { setuid: false, setgid: false, sticky: false },
      };

      const result = calculateOctalAndSymbolic(state);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.octal).toBe('755');
        expect(result.data.symbolic).toBe('rwxr-xr-x');
        expect(result.data.command).toBe('chmod 755 filename');
      }
    });

    it('should calculate 644 permission state correctly', () => {
      const state: ChmodState = {
        owner: { read: true, write: true, execute: false },
        group: { read: true, write: false, execute: false },
        other: { read: true, write: false, execute: false },
        special: { setuid: false, setgid: false, sticky: false },
      };

      const result = calculateOctalAndSymbolic(state);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.octal).toBe('644');
        expect(result.data.symbolic).toBe('rw-r--r--');
      }
    });

    it('should handle special bits (setuid, setgid, sticky)', () => {
      const state: ChmodState = {
        owner: { read: true, write: true, execute: true },
        group: { read: true, write: true, execute: true },
        other: { read: true, write: true, execute: true },
        special: { setuid: true, setgid: true, sticky: true },
      };

      const result = calculateOctalAndSymbolic(state);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.octal).toBe('7777');
        expect(result.data.symbolic).toBe('rwsrwsrwt');
      }
    });

    it('should format uppercase setid/sticky when execute bit is false', () => {
      const state: ChmodState = {
        owner: { read: true, write: true, execute: false },
        group: { read: true, write: true, execute: false },
        other: { read: true, write: true, execute: false },
        special: { setuid: true, setgid: true, sticky: true },
      };

      const result = calculateOctalAndSymbolic(state);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.symbolic).toBe('rwSrwSrwT');
      }
    });
  });

  describe('parseOctal', () => {
    it('should parse 3-digit octal string "755"', () => {
      const res = parseOctal('755');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.owner).toEqual({ read: true, write: true, execute: true });
        expect(res.data.group).toEqual({ read: true, write: false, execute: true });
        expect(res.data.other).toEqual({ read: true, write: false, execute: true });
        expect(res.data.special).toEqual({ setuid: false, setgid: false, sticky: false });
      }
    });

    it('should parse 4-digit octal string with special bits "4755"', () => {
      const res = parseOctal('4755');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.special).toEqual({ setuid: true, setgid: false, sticky: false });
      }
    });

    it('should return error on invalid octal inputs', () => {
      expect(parseOctal('899').success).toBe(false);
      expect(parseOctal('12').success).toBe(false);
      expect(parseOctal('abc').success).toBe(false);
      expect(parseOctal('').success).toBe(false);
    });
  });

  describe('parseSymbolic', () => {
    it('should parse standard 9-character symbolic permission "rwxr-xr-x"', () => {
      const res = parseSymbolic('rwxr-xr-x');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.owner).toEqual({ read: true, write: true, execute: true });
        expect(res.data.group).toEqual({ read: true, write: false, execute: true });
        expect(res.data.other).toEqual({ read: true, write: false, execute: true });
      }
    });

    it('should parse symbolic string with file type prefix "-rwxr-xr-x"', () => {
      const res = parseSymbolic('-rwxr-xr-x');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.owner.read).toBe(true);
      }
    });

    it('should parse special permissions in symbolic string "rwsrwsrwt"', () => {
      const res = parseSymbolic('rwsrwsrwt');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.special).toEqual({ setuid: true, setgid: true, sticky: true });
        expect(res.data.owner.execute).toBe(true);
      }
    });

    it('should return error on invalid symbolic permissions', () => {
      expect(parseSymbolic('invalid').success).toBe(false);
      expect(parseSymbolic('rwxrwxrwxextra').success).toBe(false);
      expect(parseSymbolic('rwx???rwx').success).toBe(false);
    });
  });
});
