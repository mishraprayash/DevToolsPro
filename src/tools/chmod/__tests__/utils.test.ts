import { describe, it, expect } from 'vitest';
import {
  calculateOctalAndSymbolic,
  parseOctal,
  parseSymbolic,
  ChmodState,
} from '../utils';

describe('Chmod Utilities', () => {
  const standard755State: ChmodState = {
    owner: { read: true, write: true, execute: true },
    group: { read: true, write: false, execute: true },
    other: { read: true, write: false, execute: true },
    special: { setuid: false, setgid: false, sticky: false },
  };

  const special4755State: ChmodState = {
    owner: { read: true, write: true, execute: true },
    group: { read: true, write: false, execute: true },
    other: { read: true, write: false, execute: true },
    special: { setuid: true, setgid: false, sticky: false },
  };

  describe('calculateOctalAndSymbolic', () => {
    it('should calculate 755 octal and rwxr-xr-x symbolic representation', () => {
      const res = calculateOctalAndSymbolic(standard755State);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.octal).toBe('755');
        expect(res.data.symbolic).toBe('rwxr-xr-x');
        expect(res.data.command).toBe('chmod 755 filename');
      }
    });

    it('should calculate special setuid octal 4755 and rwsr-xr-x symbolic representation', () => {
      const res = calculateOctalAndSymbolic(special4755State);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.octal).toBe('4755');
        expect(res.data.symbolic).toBe('rwsr-xr-x');
        expect(res.data.command).toBe('chmod 4755 filename');
      }
    });

    it('should uppercase setuid/setgid/sticky letter if execute bit is false', () => {
      const stateWithSetidNoExec: ChmodState = {
        owner: { read: true, write: true, execute: false },
        group: { read: true, write: false, execute: false },
        other: { read: true, write: false, execute: false },
        special: { setuid: true, setgid: true, sticky: true },
      };
      const res = calculateOctalAndSymbolic(stateWithSetidNoExec);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.octal).toBe('7644');
        expect(res.data.symbolic).toBe('rwSr-Sr-T');
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

    it('should parse 4-digit octal string "1777"', () => {
      const res = parseOctal('1777');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.special).toEqual({ setuid: false, setgid: false, sticky: true });
        expect(res.data.owner).toEqual({ read: true, write: true, execute: true });
      }
    });

    it('should fail on invalid octal strings', () => {
      expect(parseOctal('888').success).toBe(false);
      expect(parseOctal('75').success).toBe(false);
      expect(parseOctal('75555').success).toBe(false);
      expect(parseOctal('abc').success).toBe(false);
    });
  });

  describe('parseSymbolic', () => {
    it('should parse standard symbolic permissions "rwxr-xr-x"', () => {
      const res = parseSymbolic('rwxr-xr-x');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.owner).toEqual({ read: true, write: true, execute: true });
        expect(res.data.group).toEqual({ read: true, write: false, execute: true });
        expect(res.data.other).toEqual({ read: true, write: false, execute: true });
      }
    });

    it('should ignore optional leading file type indicator "-rwxr-xr-x"', () => {
      const res = parseSymbolic('-rwxr-xr-x');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.owner.read).toBe(true);
      }
    });

    it('should parse setuid/setgid/sticky characters in symbolic strings', () => {
      const res = parseSymbolic('rwsr-sr-t');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.special).toEqual({ setuid: true, setgid: true, sticky: true });
        expect(res.data.owner.execute).toBe(true);
      }
    });

    it('should fail on invalid symbolic strings', () => {
      expect(parseSymbolic('rwx').success).toBe(false);
      expect(parseSymbolic('rwxrwxrwx1').success).toBe(false);
      expect(parseSymbolic('invalid!!').success).toBe(false);
    });
  });
});
