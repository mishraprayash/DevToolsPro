export interface UuidOptions {
  version: 1 | 4 | 7;
  casing: 'lower' | 'upper';
  brackets: 'none' | 'curly' | 'parentheses';
  noHyphens: boolean;
}

function formatBytesToUuid(bytes: Uint8Array): string {
  let uuid = '';
  for (let i = 0; i < 16; i++) {
    if (i === 4 || i === 6 || i === 8 || i === 10) {
      uuid += '-';
    }
    uuid += bytes[i].toString(16).padStart(2, '0');
  }
  return uuid;
}

export function generateV1(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  
  // 100-nanosecond intervals since Gregorian Epoch (Oct 15, 1582)
  const GREGORIAN_OFFSET = BigInt('122192928000000000');
  const now100ns = BigInt(Date.now()) * BigInt(10000) + GREGORIAN_OFFSET;
  
  const timeLow = Number(now100ns & BigInt('4294967295')); // 0xffffffff
  const timeMid = Number((now100ns >> BigInt(32)) & BigInt('65535')); // 0xffff
  const timeHi = Number((now100ns >> BigInt(48)) & BigInt('4095')); // 0x0fff
  
  bytes[0] = (timeLow >> 24) & 0xff;
  bytes[1] = (timeLow >> 16) & 0xff;
  bytes[2] = (timeLow >> 8) & 0xff;
  bytes[3] = timeLow & 0xff;
  
  bytes[4] = (timeMid >> 8) & 0xff;
  bytes[5] = timeMid & 0xff;
  
  bytes[6] = ((timeHi >> 8) & 0x0f) | 0x10; // version 1 (0001)
  bytes[7] = timeHi & 0xff;
  
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant (10xx)
  
  return formatBytesToUuid(bytes);
}

export function generateV4(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4 (0100)
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant (10xx)
  
  return formatBytesToUuid(bytes);
}

export function generateV7(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  
  const timestamp = Date.now();
  bytes[0] = (timestamp >> 40) & 0xff;
  bytes[1] = (timestamp >> 32) & 0xff;
  bytes[2] = (timestamp >> 24) & 0xff;
  bytes[3] = (timestamp >> 16) & 0xff;
  bytes[4] = (timestamp >> 8) & 0xff;
  bytes[5] = timestamp & 0xff;
  
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7 (0111)
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant (10xx)
  
  return formatBytesToUuid(bytes);
}

export function formatUuid(uuid: string, options: UuidOptions): string {
  let result = uuid;
  if (options.noHyphens) {
    result = result.replace(/-/g, '');
  }
  if (options.casing === 'upper') {
    result = result.toUpperCase();
  }
  if (options.brackets === 'curly') {
    result = `{${result}}`;
  } else if (options.brackets === 'parentheses') {
    result = `(${result})`;
  }
  return result;
}

export function generateBulkUuids(count: number, options: UuidOptions): string[] {
  const list: string[] = [];
  const limit = Math.min(Math.max(count, 1), 500);

  for (let i = 0; i < limit; i++) {
    let raw = '';
    if (options.version === 1) {
      raw = generateV1();
    } else if (options.version === 7) {
      raw = generateV7();
    } else {
      raw = generateV4();
    }
    list.push(formatUuid(raw, options));
  }

  return list;
}
