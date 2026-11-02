export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

function md5(str: string): string {
  const k = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
    0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
    0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
    0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
    0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
    0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ];

  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];

  const utf8Bytes = new TextEncoder().encode(str);
  let utf8 = '';
  for (let i = 0; i < utf8Bytes.length; i++) utf8 += String.fromCharCode(utf8Bytes[i]);
  const n = utf8.length;
  const words: number[] = [];
  for (let i = 0; i < n; i++) {
    words[i >> 2] |= utf8.charCodeAt(i) << ((i % 4) * 8);
  }
  
  words[n >> 2] |= 0x80 << ((n % 4) * 8);
  const len = (n + 8 >> 6) + 1 << 4;
  while (words.length < len) words.push(0);
  words[len - 2] = n * 8;

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;

  for (let chunk = 0; chunk < len; chunk += 16) {
    let a = h0, b = h1, c = h2, d = h3;

    for (let index = 0; index < 64; index++) {
      let f, g;
      if (index < 16) {
        f = (b & c) | (~b & d);
        g = index;
      } else if (index < 32) {
        f = (d & b) | (~d & c);
        g = (5 * index + 1) % 16;
      } else if (index < 48) {
        f = b ^ c ^ d;
        g = (3 * index + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * index) % 16;
      }

      const temp = d;
      d = c;
      c = b;
      
      const x = (a + f + k[index] + (words[chunk + g] || 0)) | 0;
      const rotate = (x << s[index]) | (x >>> (32 - s[index]));
      b = (b + rotate) | 0;
      a = temp;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
  }

  const toHex = (n: number) => {
    let out = '';
    for (let i = 0; i < 4; i++) {
      out += ((n >> (i * 8)) & 0xff).toString(16).padStart(2, '0');
    }
    return out;
  };

  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3);
}

export async function hashString(algorithm: HashAlgorithm, input: string): Promise<string> {
  if (algorithm === 'MD5') {
    return md5(input);
  }
  
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashFile(algorithm: HashAlgorithm, file: File): Promise<string> {
  if (algorithm === 'MD5') {
    return md5(await file.text());
  }
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest(algorithm, arrayBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const hashAlgorithms: { id: HashAlgorithm; name: string; secure: boolean }[] = [
  { id: 'MD5', name: 'MD5', secure: false },
  { id: 'SHA-1', name: 'SHA-1', secure: false },
  { id: 'SHA-256', name: 'SHA-256', secure: true },
  { id: 'SHA-384', name: 'SHA-384', secure: true },
  { id: 'SHA-512', name: 'SHA-512', secure: true },
];
