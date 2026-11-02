export type NumberBase = 'decimal' | 'hex' | 'binary' | 'octal';

export interface BaseResult {
  decimal: string;
  hex: string;
  binary: string;
  octal: string;
}

export type ConvertResult = 
  | { success: true; decimal: string; hex: string; binary: string; octal: string; custom?: string }
  | { success: false; error: string };

export function convertNumber(
  input: string, 
  from: NumberBase | number, 
  customTargetBase?: number
): ConvertResult {
  const trimmed = input.trim().replace(/\s+/g, '');
  if (!trimmed) return { success: false, error: 'Enter a value' };

  try {
    let num: bigint;

    // 1. Parsing input using BigInt to support arbitrary precision and prevent MAX_SAFE_INTEGER bounds issues
    if (typeof from === 'string') {
      if (from === 'hex') {
        const cleanHex = trimmed.replace(/^0x/i, '');
        num = BigInt('0x' + cleanHex);
      } else if (from === 'binary') {
        const cleanBin = trimmed.replace(/^0b/i, '');
        num = BigInt('0b' + cleanBin);
      } else if (from === 'octal') {
        const cleanOct = trimmed.replace(/^0o/i, '');
        num = BigInt('0o' + cleanOct);
      } else {
        num = BigInt(trimmed);
      }
    } else {
      // Parsing custom base (radix 2 to 36)
      const radix = from;
      if (radix < 2 || radix > 36) {
        return { success: false, error: 'Radix must be between 2 and 36' };
      }
      
      // Manual BigInt custom base parser
      num = parseBigIntFromRadix(trimmed, radix);
    }

    const res: ConvertResult = {
      success: true,
      decimal: num.toString(10),
      hex: '0x' + num.toString(16).toUpperCase(),
      binary: '0b' + num.toString(2),
      octal: '0o' + num.toString(8),
    };

    if (customTargetBase && customTargetBase >= 2 && customTargetBase <= 36) {
      res.custom = num.toString(customTargetBase).toUpperCase();
    }

    return res;
  } catch (e) {
    return { success: false, error: `Invalid number value for selected base: ${(e as Error).message}` };
  }
}

// Helper to parse a string in any radix between 2 and 36 into a BigInt safely
function parseBigIntFromRadix(str: string, radix: number): bigint {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
  const cleanStr = str.toLowerCase().replace(/^(0x|0b|0o)/gi, '');
  
  let result = BigInt(0);
  const bigRadix = BigInt(radix);

  for (let i = 0; i < cleanStr.length; i++) {
    const char = cleanStr[i];
    const val = alphabet.indexOf(char);
    if (val === -1 || val >= radix) {
      throw new Error(`Invalid character "${char}" for base ${radix}`);
    }
    result = result * bigRadix + BigInt(val);
  }
  
  return result;
}

export function toTwosComplement(
  numStr: string, 
  bitSize: 8 | 16 | 32 | 64
): { signed: string; unsigned: string; binary: string } {
  try {
    const num = BigInt(numStr);
    
    // Limits
    const maxUnsigned = BigInt(2) ** BigInt(bitSize);
    const halfVal = BigInt(2) ** BigInt(bitSize - 1);
    
    // Restrict within 2's complement range
    let unsignedVal = num % maxUnsigned;
    if (unsignedVal < BigInt(0)) {
      unsignedVal += maxUnsigned;
    }
    
    let signedVal = unsignedVal;
    if (unsignedVal >= halfVal) {
      signedVal = unsignedVal - maxUnsigned;
    }
    
    let binStr = unsignedVal.toString(2).padStart(bitSize, '0');
    binStr = binStr.slice(-bitSize);
    
    // Space format: every 4 bits for 8/16-bit, 8 bits for 32/64-bit
    const spacing = bitSize === 8 || bitSize === 16 ? 4 : 8;
    const regex = new RegExp(`.{1,${spacing}}`, 'g');
    const chunkedBinary = binStr.match(regex)?.join(' ') || binStr;
    
    return {
      signed: signedVal.toString(10),
      unsigned: unsignedVal.toString(10),
      binary: chunkedBinary
    };
  } catch {
    return { signed: '0', unsigned: '0', binary: '00000000' };
  }
}

export function formatLabel(base: NumberBase | number): string {
  if (typeof base === 'number') {
    return `Base ${base}`;
  }
  const labels: Record<NumberBase, string> = {
    decimal: 'Decimal (0–9)',
    hex: 'Hexadecimal (0–9, A–F)',
    binary: 'Binary (0, 1)',
    octal: 'Octal (0–7)',
  };
  return labels[base];
}
