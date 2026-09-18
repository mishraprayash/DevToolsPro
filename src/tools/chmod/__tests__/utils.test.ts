import { describe, expect, it } from 'vitest';
import {
  calculateOctalAndSymbolic,
  ChmodState,
  parseOctal,
  parseSymbolic,
} from '../utils';

describe('chmod utils', () => {
  const defaultState: ChmodState = {
    owner: { read: true, write: true, execute: true },
    group: { read: true, write: false, execute: true },
    other: { read: true, write: false, execute: true },
    special: { setuid: false, setgid: false, sticky: false },
  };

  describe('calculateOctalAndSymbolic', () => {
    it('calculates standard 755 permissions correctly', () => {
      const res = calculateOctalAndSymbolic(defaultState);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.octal).toBe('755');
        expect(res.data.symbolic).toBe('rwxr-xr-x');
        expect(res.data.command).toBe('chmod 755 filename');
      }
    });

    it('calculates special bits setuid, setgid, sticky correctly', () => {
      const specialState: ChmodState = {
        owner: { read: true, write: true, execute: true },
        group: { read: true, write: true, execute: true },
        other: { read: true, write: true, execute: true },
        special: { setuid: true, setgid: true, sticky: true },
      };
      const res = calculateOctalAndSymbolic(specialState);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.octal).toBe('7777');
        expect(res.data.symbolic).toBe('rwsrwsrwt');
        expect(res.data.command).toBe('chmod 7777 filename');
      }
    });

    it('formats uppercase S and T when execute permission is missing', () => {
      const specialNoExecState: ChmodState = {
        owner: { read: true, write: true, execute: false },
        group: { read: true, write: false, execute: false },
        other: { read: true, write: false, execute: false },
        special: { setuid: true, setgid: true, sticky: true },
      };
      const res = calculateOctalAndSymbolic(specialNoExecState);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.octal).toBe('7644');
        expect(res.data.symbolic).toBe('rwSr-Sr-T');
      }
    });
  });

  describe('parseOctal', () => {
    it('parses 3-digit octal permission strings', () => {
      const res = parseOctal('644');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.owner).toEqual({ read: true, write: true, execute: false });
        expect(res.data.group).toEqual({ read: true, write: false, execute: false });
        expect(res.data.other).toEqual({ read: true, write: false, execute: false });
        expect(res.data.special).toEqual({ setuid: false, setgid: false, sticky: false });
      }
    });

    it('parses 4-digit octal permission strings with special bits', () => {
      const res = parseOctal('4755');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.special.setuid).toBe(true);
        expect(res.data.special.setgid).toBe(false);
        expect(res.data.special.sticky).toBe(false);
        expect(res.data.owner).toEqual({ read: true, write: true, execute: true });
      }
    });

    it('rejects invalid octal strings', () => {
      expect(parseOctal('888').success).toBe(false);
      expect(parseOctal('75').success).toBe(false);
      expect(parseOctal('75555').success).toBe(false);
      expect(parseOctal('abc').success).toBe(false);
    });
  });

  describe('parseSymbolic', () => {
    it('parses standard 9-character symbolic permission strings', () => {
      const res = parseSymbolic('rwxr-xr-x');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.owner).toEqual({ read: true, write: true, execute: true });
        expect(res.data.group).toEqual({ read: true, write: false, execute: true });
        expect(res.data.other).toEqual({ read: true, write: false, execute: true });
      }
    });

    it('strips leading file type identifier (- or d)', () => {
      const resFile = parseSymbolic('-rwxr-xr-x');
      expect(resFile.success).toBe(true);
      const resDir = parseSymbolic('drwxr-xr-x');
      expect(resDir.success).toBe(true);
    });

    it('parses symbolic permissions with special characters (s, S, t, T)', () => {
      const res = parseSymbolic('rwsr-Sr-T');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.special).toEqual({ setuid: true, setgid: true, sticky: true });
        expect(res.data.owner.execute).toBe(true);
        expect(res.data.group.execute).toBe(false);
        expect(res.data.other.execute).toBe(false);
      }
    });

    it('rejects invalid symbolic strings', () => {
      expect(parseSymbolic('rwx').success).toBe(false);
      expect(parseSymbolic('rwxrwxrwxextra').success).toBe(false);
      expect(parseSymbolic('invalid!!').success).toBe(false);
    });
  });
});
