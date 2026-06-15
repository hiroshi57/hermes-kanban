/**
 * scripts/gen-pwa-icons.mjs
 * Hermes Kanban PWA アイコン生成スクリプト
 *
 * 追加ライブラリ不要（Node.js built-in の zlib のみ使用）
 * 生成物:
 *   public/pwa-192.png         — 192×192 RGBA 角丸
 *   public/pwa-512.png         — 512×512 RGBA 角丸
 *   public/apple-touch-icon.png — 180×180 RGB (iOS Safari 用・不透過)
 *
 * 実行: node scripts/gen-pwa-icons.mjs
 */

import { deflateSync } from 'zlib';
import { writeFileSync } from 'fs';

// ── ブランドカラー #6366f1 (Indigo-500) ─────────────────────────
const R = 99, G = 102, B = 241;

// ── CRC32 ───────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) | 0;
}

function chunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const db = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const crcVal = crc32(Buffer.concat([tb, db]));
  const out = Buffer.alloc(4 + 4 + db.length + 4);
  out.writeUInt32BE(db.length, 0);
  tb.copy(out, 4);
  db.copy(out, 8);
  out.writeInt32BE(crcVal, 8 + db.length);
  return out;
}

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// ── RGBA 角丸 PNG ───────────────────────────────────────────────
function makeRGBA(size, r, g, b, radius) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA

  const rowSize = 1 + size * 4;
  const raw = Buffer.alloc(rowSize * size, 0);

  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      // 角丸判定
      const cx = Math.min(x, size - 1 - x);
      const cy = Math.min(y, size - 1 - y);
      let inside = true;
      if (cx < radius && cy < radius) {
        const dx = radius - cx, dy = radius - cy;
        inside = dx * dx + dy * dy <= radius * radius;
      }
      const off = y * rowSize + 1 + x * 4;
      if (inside) { raw[off] = r; raw[off+1] = g; raw[off+2] = b; raw[off+3] = 255; }
      // else 透明 (0,0,0,0) — Buffer は 0 初期化済み
    }
  }

  return Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── RGB 不透過 PNG (iOS apple-touch-icon 用) ────────────────────
function makeRGB(size, r, g, b) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // RGB

  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(rowSize * size);
  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0;
    for (let x = 0; x < size; x++) {
      const off = y * rowSize + 1 + x * 3;
      raw[off] = r; raw[off+1] = g; raw[off+2] = b;
    }
  }

  return Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── 生成 & 保存 ─────────────────────────────────────────────────
const radius192 = Math.round(192 * 0.2);   // 20% 角丸
const radius512 = Math.round(512 * 0.2);

writeFileSync('public/pwa-192.png',          makeRGBA(192, R, G, B, radius192));
writeFileSync('public/pwa-512.png',          makeRGBA(512, R, G, B, radius512));
writeFileSync('public/apple-touch-icon.png', makeRGB(180, R, G, B));

console.log('✅ PWA icons generated:');
console.log('   public/pwa-192.png          (192×192 RGBA)');
console.log('   public/pwa-512.png          (512×512 RGBA)');
console.log('   public/apple-touch-icon.png (180×180 RGB)');
