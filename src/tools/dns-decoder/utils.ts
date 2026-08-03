export interface DnsHeader {
  transactionId: string;
  flags: {
    qr: 'Query (0)' | 'Response (1)';
    opcode: string;
    aa: boolean;
    tc: boolean;
    rd: boolean;
    ra: boolean;
    rcode: string;
  };
  questionsCount: number;
  answersCount: number;
  authorityCount: number;
  additionalCount: number;
}

export interface DnsQuestion {
  name: string;
  type: string;
  class: string;
}

export interface DnsRecord {
  name: string;
  type: string;
  class: string;
  ttl: number;
  data: string;
}

export interface DnsPacketDecoded {
  header: DnsHeader;
  questions: DnsQuestion[];
  answers: DnsRecord[];
}

export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

function parseHexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^a-fA-F0-9]/g, '');
  if (clean.length % 2 !== 0) {
    throw new Error('Hex string must have an even length');
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

function readDomainName(bytes: Uint8Array, offset: { val: number }): string {
  const parts: string[] = [];
  let jumped = false;
  const jumpOffset = 0;
  let currentOffset = offset.val;
  let loops = 0;

  while (loops < 128) { // Safety limit against cycles
    loops++;
    if (currentOffset >= bytes.length) break;

    const len = bytes[currentOffset];
    if (len === 0) {
      if (!jumped) {
        offset.val = currentOffset + 1;
      }
      break;
    }

    // Checking if it's a pointer (starts with 0b11...)
    if ((len & 0xC0) === 0xC0) {
      if (currentOffset + 1 >= bytes.length) break;
      const target = ((len & 0x3F) << 8) | bytes[currentOffset + 1];
      if (!jumped) {
        offset.val = currentOffset + 2;
      }
      jumped = true;
      currentOffset = target;
      continue;
    }

    currentOffset++;
    if (currentOffset + len > bytes.length) break;

    const label = new TextDecoder().decode(bytes.subarray(currentOffset, currentOffset + len));
    parts.push(label);
    currentOffset += len;
  }

  return parts.join('.');
}

const TYPE_MAP: Record<number, string> = {
  1: 'A',
  2: 'NS',
  5: 'CNAME',
  6: 'SOA',
  12: 'PTR',
  15: 'MX',
  16: 'TXT',
  28: 'AAAA',
  33: 'SRV',
  257: 'CAA'
};

const CLASS_MAP: Record<number, string> = {
  1: 'IN (Internet)',
  3: 'CH (Chaos)',
  4: 'HS (Hesiod)'
};

const RCODE_MAP: Record<number, string> = {
  0: 'NoError (0) - No Error',
  1: 'FormErr (1) - Format Error',
  2: 'ServFail (2) - Server Failure',
  3: 'NXDomain (3) - Non-Existent Domain',
  4: 'NotImp (4) - Not Implemented',
  5: 'Refused (5) - Query Refused'
};

export function decodeDnsPacket(hexString: string): Result<DnsPacketDecoded> {
  try {
    const bytes = parseHexToBytes(hexString);
    if (bytes.length < 12) {
      return {
        success: false,
        error: 'DNS Packet payload must be at least 12 bytes long (Header size).'
      };
    }

    // 1. Parse Header (first 12 bytes)
    const transactionId = '0x' + Array.from(bytes.subarray(0, 2))
      .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    const flagsWord = (bytes[2] << 8) | bytes[3];
    const qr = ((flagsWord >> 15) & 1) === 1 ? 'Response (1)' : 'Query (0)';
    const opcodeVal = (flagsWord >> 11) & 0xF;
    const opcode = `Opcode: ${opcodeVal}`;
    const aa = ((flagsWord >> 10) & 1) === 1;
    const tc = ((flagsWord >> 9) & 1) === 1;
    const rd = ((flagsWord >> 8) & 1) === 1;
    const ra = ((flagsWord >> 7) & 1) === 1;
    const rcodeVal = flagsWord & 0xF;
    const rcode = RCODE_MAP[rcodeVal] || `Unknown (${rcodeVal})`;

    const questionsCount = (bytes[4] << 8) | bytes[5];
    const answersCount = (bytes[6] << 8) | bytes[7];
    const authorityCount = (bytes[8] << 8) | bytes[9];
    const additionalCount = (bytes[10] << 8) | bytes[11];

    const offset = { val: 12 };

    // 2. Parse Questions Section
    const questions: DnsQuestion[] = [];
    for (let q = 0; q < questionsCount; q++) {
      if (offset.val >= bytes.length) break;
      const name = readDomainName(bytes, offset);
      if (offset.val + 4 > bytes.length) break;
      const typeCode = (bytes[offset.val] << 8) | bytes[offset.val + 1];
      const classCode = (bytes[offset.val + 2] << 8) | bytes[offset.val + 3];
      offset.val += 4;

      questions.push({
        name: name || '.',
        type: TYPE_MAP[typeCode] || `Unknown (${typeCode})`,
        class: CLASS_MAP[classCode] || `Unknown (${classCode})`
      });
    }

    // 3. Parse Answers Section
    const answers: DnsRecord[] = [];
    for (let a = 0; a < answersCount; a++) {
      if (offset.val >= bytes.length) break;
      const name = readDomainName(bytes, offset);
      if (offset.val + 10 > bytes.length) break;

      const typeCode = (bytes[offset.val] << 8) | bytes[offset.val + 1];
      const classCode = (bytes[offset.val + 2] << 8) | bytes[offset.val + 3];
      const ttl = (bytes[offset.val + 4] << 24) | (bytes[offset.val + 5] << 16) | (bytes[offset.val + 6] << 8) | bytes[offset.val + 7];
      const rdLength = (bytes[offset.val + 8] << 8) | bytes[offset.val + 9];
      offset.val += 10;

      if (offset.val + rdLength > bytes.length) break;

      let rdataStr = '';
      const type = TYPE_MAP[typeCode] || `Unknown (${typeCode})`;
      if (type === 'A' && rdLength === 4) {
        rdataStr = Array.from(bytes.subarray(offset.val, offset.val + 4)).join('.');
      } else if (type === 'AAAA' && rdLength === 16) {
        const segments: string[] = [];
        for (let i = 0; i < 16; i += 2) {
          segments.push(((bytes[offset.val + i] << 8) | bytes[offset.val + i + 1]).toString(16));
        }
        rdataStr = segments.join(':');
      } else if ((type === 'CNAME' || type === 'NS' || type === 'PTR')) {
        const tempOffset = { val: offset.val };
        rdataStr = readDomainName(bytes, tempOffset);
      } else {
        // Fallback hex representation
        rdataStr = Array.from(bytes.subarray(offset.val, offset.val + rdLength))
          .map(b => b.toString(16).padStart(2, '0')).join('');
      }

      offset.val += rdLength;

      answers.push({
        name: name || '.',
        type,
        class: CLASS_MAP[classCode] || `Unknown (${classCode})`,
        ttl,
        data: rdataStr
      });
    }

    return {
      success: true,
      data: {
        header: {
          transactionId,
          flags: { qr, opcode, aa, tc, rd, ra, rcode },
          questionsCount,
          answersCount,
          authorityCount,
          additionalCount
        },
        questions,
        answers
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to decode DNS packet hex representation.'
    };
  }
}
