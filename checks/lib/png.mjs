// tails · minimal PNG decoder
//
// Why this exists: the only honest way to measure contrast under text that sits
// on a photograph is to read the pixels the browser actually composited — the
// image, the scrim, the blend mode, all of it. getComputedStyle gives you the
// container's background and reports a clean pass for the most visible element
// on the page. That happened, and the real figure was 1,09:1.
//
// Playwright hands back a PNG buffer. Decoding it needs either a dependency or
// sixty lines of zlib. This is the sixty lines: no dependency to audit, no
// postinstall script, nothing to keep current.
//
// Scope on purpose: 8-bit, non-interlaced, colour type 2 (RGB) or 6 (RGBA),
// which is what Chromium produces. Anything else throws — and a throw here has
// to become exit code 2 upstream, never a pass.

import { inflateSync } from 'node:zlib';

const paeth = (a, b, c) => {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

export function decodePNG(buf) {
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');

  let off = 8, width = 0, height = 0, depth = 0, type = 0, interlace = 0;
  const idat = [];

  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const tag = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (tag === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8]; type = data[9]; interlace = data[12];
    } else if (tag === 'IDAT') idat.push(data);
    else if (tag === 'IEND') break;
    off += len + 12;
  }

  if (depth !== 8) throw new Error(`unsupported bit depth ${depth}`);
  if (interlace !== 0) throw new Error('interlaced PNG unsupported');
  if (type !== 2 && type !== 6) throw new Error(`unsupported colour type ${type}`);

  const ch = type === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * ch;
  if (raw.length < (stride + 1) * height) throw new Error('truncated image data');

  // one contiguous RGB buffer; alpha is dropped because a screenshot is opaque
  const out = Buffer.alloc(width * height * 3);
  let prev = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride));

    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? line[i - ch] : 0;
      const b = prev[i];
      const c = i >= ch ? prev[i - ch] : 0;
      if (filter === 1) line[i] = (line[i] + a) & 0xff;
      else if (filter === 2) line[i] = (line[i] + b) & 0xff;
      else if (filter === 3) line[i] = (line[i] + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) line[i] = (line[i] + paeth(a, b, c)) & 0xff;
      else if (filter !== 0) throw new Error(`unknown filter ${filter} on row ${y}`);
    }

    for (let x = 0; x < width; x++) {
      out[(y * width + x) * 3]     = line[x * ch];
      out[(y * width + x) * 3 + 1] = line[x * ch + 1];
      out[(y * width + x) * 3 + 2] = line[x * ch + 2];
    }
    prev = line;
  }

  return { width, height, rgb: out, at(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return null;
    const i = (y * width + x) * 3;
    return [out[i], out[i + 1], out[i + 2]];
  } };
}

// WCAG 2.x relative luminance and contrast ratio.
export const lum = ([r, g, b]) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

export const ratio = (a, b) => {
  const l1 = lum(a), l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};
