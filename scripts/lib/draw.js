/**
 * Shared drawing helpers for this app's generated PNG assets.
 *
 * Everything is rendered at a supersampled resolution and box downsampled.
 * Colour is averaged over covered samples only, with alpha taken from coverage,
 * so edge pixels keep full-strength colour instead of darkening toward black.
 *
 * There are no image dependencies here on purpose: the assets are committed
 * binaries, and a generator that needs no install is one that still runs years
 * from now.
 */
const fs = require('fs');
const zlib = require('zlib');

/** Signed-distance test for a rounded rectangle. Returns true when inside. */
function inRoundRect(px, py, x, y, w, h, r) {
  const cx = Math.min(Math.max(px, x + r), x + w - r);
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  const inCore =
    (px >= x && px <= x + w && py >= y + r && py <= y + h - r) ||
    (px >= x + r && px <= x + w - r && py >= y && py <= y + h);
  if (inCore) return true;
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

/** Linear blend between two RGB triples. */
function mix(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/**
 * Render by sampling `shade(px, py, W, H)` at supersampled positions, where
 * `W`/`H` are the supersampled dimensions. `shade` returns an `[r, g, b]`
 * triple, or `null` where the pixel should be transparent.
 *
 * Returns raw PNG scanlines (filter byte + RGBA per row).
 */
function render({ width, height, supersample = 4, shade }) {
  const ss = supersample;
  const W = width * ss;
  const H = height * ss;
  const acc = new Float64Array(width * height * 4);

  for (let sy = 0; sy < H; sy++) {
    const py = sy + 0.5;
    const ty = Math.floor(sy / ss);

    for (let sx = 0; sx < W; sx++) {
      const px = sx + 0.5;
      const color = shade(px, py, W, H);

      if (!color) continue;

      const tx = Math.floor(sx / ss);
      const o = (ty * width + tx) * 4;
      acc[o] += color[0];
      acc[o + 1] += color[1];
      acc[o + 2] += color[2];
      acc[o + 3] += 1; // covered-sample count
    }
  }

  const samples = ss * ss;
  const raw = Buffer.alloc(height * (width * 4 + 1));
  let p = 0;

  for (let y = 0; y < height; y++) {
    raw[p++] = 0; // filter type: none

    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      const covered = acc[o + 3];

      if (covered === 0) {
        raw[p++] = 0;
        raw[p++] = 0;
        raw[p++] = 0;
        raw[p++] = 0;
        continue;
      }

      raw[p++] = Math.round(acc[o] / covered);
      raw[p++] = Math.round(acc[o + 1] / covered);
      raw[p++] = Math.round(acc[o + 2] / covered);
      raw[p++] = Math.round((covered / samples) * 255);
    }
  }

  return raw;
}

// --- minimal PNG writer ---
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** Write raw scanlines out as an 8-bit RGBA PNG. */
function writePNG(out, width, height, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);

  fs.writeFileSync(out, png);
  console.log(`wrote ${out} (${png.length} bytes, ${width}x${height})`);
}

module.exports = { inRoundRect, mix, render, writePNG };
