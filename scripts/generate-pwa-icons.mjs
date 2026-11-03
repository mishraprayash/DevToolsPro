#!/usr/bin/env node
/**
 * Generates the PWA icon set (public/icons/ + src/app/apple-icon.png) using only Node built-ins
 * (zlib for PNG deflate). Icons are committed; re-run this only when the
 * brand mark changes:
 *
 *   node scripts/generate-pwa-icons.mjs
 *
 * The mark mirrors the header logo: a cyan -> indigo gradient tile with a
 * dark "D" glyph.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'icons');

const ACCENT = [0x22, 0xd3, 0xee]; // --accent-main
const ACCENT_2 = [0x81, 0x8c, 0xf8]; // --accent-secondary
const INK = [0x07, 0x07, 0x0a]; // --bg-primary

// ── PNG encoding ──────────────────────────────────────────────────────────
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Shapes (unit square coordinates) ─────────────────────────────────────
function inRoundedSquare(x, y, radius) {
  const cx = Math.min(Math.max(x, radius), 1 - radius);
  const cy = Math.min(Math.max(y, radius), 1 - radius);
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

/** "D" glyph: a stem plus a half-disc, minus the same shape inset by `stroke`. */
function inD(x, y, { left, top, height, stroke }) {
  const r = height / 2;
  const mid = top + r;
  const inShape = (l, t, b, rad, c) =>
    y >= t && y <= b && x >= l && (x <= c || (x - c) ** 2 + (y - mid) ** 2 <= rad ** 2);
  const c = left + r * 0.6; // where the straight part ends and the bowl begins
  const outer = inShape(left, top, top + height, r, c);
  const inner = inShape(left + stroke, top + stroke, top + height - stroke, r - stroke, c);
  return outer && !inner;
}

function render(size, { maskable }) {
  const rgba = Buffer.alloc(size * size * 4);
  const SS = 4; // 4x4 supersampling for anti-aliasing
  // Maskable icons must keep content inside the 80% safe-zone circle.
  const scale = maskable ? 0.72 : 1;
  const glyph = { height: 0.5 * scale, stroke: 0.105 * scale };
  const glyphWidth = glyph.height * 0.3 + glyph.height / 2;
  glyph.left = 0.5 - glyphWidth / 2 - glyph.height * 0.02;
  glyph.top = 0.5 - glyph.height / 2;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let bgCover = 0;
      let glyphCover = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) / size;
          const y = (py + (sy + 0.5) / SS) / size;
          if (maskable || inRoundedSquare(x, y, 0.22)) bgCover++;
          if (inD(x, y, glyph)) glyphCover++;
        }
      }
      const n = SS * SS;
      const t = (px + py) / (2 * size); // diagonal gradient
      const bg = ACCENT.map((v, i) => v + (ACCENT_2[i] - v) * t);
      const g = glyphCover / n;
      const color = bg.map((v, i) => Math.round(v * (1 - g) + INK[i] * g));
      const o = (py * size + px) * 4;
      rgba[o] = color[0];
      rgba[o + 1] = color[1];
      rgba[o + 2] = color[2];
      rgba[o + 3] = Math.round((bgCover / n) * 255);
    }
  }
  return encodePng(size, rgba);
}

const targets = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-maskable-192.png', size: 192, maskable: true },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
  // iOS ignores transparency and applies its own mask, so use a full-bleed tile.
  // Lives in src/app/ so Next.js' file-based metadata emits <link rel="apple-touch-icon">.
  { file: '../../src/app/apple-icon.png', size: 180, maskable: true },
];

mkdirSync(OUT_DIR, { recursive: true });
for (const { file, size, maskable } of targets) {
  const out = join(OUT_DIR, file);
  writeFileSync(out, render(size, { maskable }));
  console.log(`wrote ${out.slice(ROOT.length + 1)}`);
}
