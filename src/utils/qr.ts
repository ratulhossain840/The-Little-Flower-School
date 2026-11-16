// src/utils/qr.ts
// Small self-contained QR Code generator (byte mode, error correction M, versions 1–10).
// No external library needed (works offline, free).

const ECC_PER_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const NUM_BLOCKS = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];

function rawModules(ver: number): number {
  let r = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const n = Math.floor(ver / 7) + 2;
    r -= (25 * n - 10) * n - 55;
    if (ver >= 7) r -= 36;
  }
  return r;
}

function alignPositions(ver: number): number[] {
  if (ver === 1) return [];
  const n = Math.floor(ver / 7) + 2;
  const size = ver * 4 + 17;
  const step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
  const res = [6];
  for (let pos = size - 7; res.length < n; pos -= step) res.splice(1, 0, pos);
  return res;
}

function gfMul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsDivisor(degree: number): number[] {
  const result: number[] = new Array(degree - 1).fill(0);
  result.push(1);
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result: number[] = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coef, i) => {
      result[i] ^= gfMul(coef, factor);
    });
  }
  return result;
}

function utf8(text: string): number[] {
  const out: number[] = [];
  const enc = encodeURIComponent(text);
  for (let i = 0; i < enc.length; i++) {
    if (enc.charAt(i) === '%') {
      out.push(parseInt(enc.substr(i + 1, 2), 16));
      i += 2;
    } else out.push(enc.charCodeAt(i));
  }
  return out;
}

const bit = (x: number, i: number): boolean => ((x >>> i) & 1) !== 0;

/** Returns a square matrix (true = dark module). Throws if the text is too long (max ~210 bytes). */
export function qrMatrix(text: string): boolean[][] {
  const bytes = utf8(text);

  // 1. choose the smallest version
  let ver = 1;
  for (; ver <= 10; ver++) {
    const capBits = (Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ver] * NUM_BLOCKS[ver]) * 8;
    const need = 4 + (ver >= 10 ? 16 : 8) + bytes.length * 8;
    if (need <= capBits) break;
  }
  if (ver > 10) throw new Error('QR text too long');

  const size = ver * 4 + 17;
  const rawCw = Math.floor(rawModules(ver) / 8);
  const eccLen = ECC_PER_BLOCK[ver];
  const nBlocks = NUM_BLOCKS[ver];
  const dataCap = rawCw - eccLen * nBlocks;

  // 2. bit stream
  const bits: number[] = [];
  const put = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };
  put(0x4, 4);
  put(bytes.length, ver >= 10 ? 16 : 8);
  bytes.forEach((b) => put(b, 8));
  put(0, Math.min(4, dataCap * 8 - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < dataCap * 8; pad ^= 0xec ^ 0x11) put(pad, 8);
  const dataCw: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    dataCw.push(v);
  }

  // 3. error correction + interleave
  const shortLen = Math.floor(rawCw / nBlocks);
  const numShort = nBlocks - (rawCw % nBlocks);
  const div = rsDivisor(eccLen);
  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < nBlocks; i++) {
    const dat = dataCw.slice(k, k + shortLen - eccLen + (i < numShort ? 0 : 1));
    k += dat.length;
    const ecc = rsRemainder(dat, div);
    if (i < numShort) dat.push(0);
    blocks.push(dat.concat(ecc));
  }
  const all: number[] = [];
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((block, j) => {
      if (i !== shortLen - eccLen || j >= numShort) all.push(block[i]);
    });
  }

  // 4. matrix
  const mod: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const fn: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const setFn = (x: number, y: number, dark: boolean) => {
    mod[y][x] = dark;
    fn[y][x] = true;
  };

  for (let i = 0; i < size; i++) {
    setFn(6, i, i % 2 === 0);
    setFn(i, 6, i % 2 === 0);
  }
  const finder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) setFn(x, y, d !== 2 && d !== 4);
      }
    }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);
  const ap = alignPositions(ver);
  for (let i = 0; i < ap.length; i++) {
    for (let j = 0; j < ap.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === ap.length - 1) || (i === ap.length - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) setFn(ap[i] + dx, ap[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }

  const drawFormat = (mask: number) => {
    const data = (0 << 3) | mask; // ECC level M = 0
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits15 = ((data << 10) | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i++) setFn(8, i, bit(bits15, i));
    setFn(8, 7, bit(bits15, 6));
    setFn(8, 8, bit(bits15, 7));
    setFn(7, 8, bit(bits15, 8));
    for (let i = 9; i < 15; i++) setFn(14 - i, 8, bit(bits15, i));
    for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, bit(bits15, i));
    for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, bit(bits15, i));
    setFn(8, size - 8, true);
  };
  drawFormat(0);

  if (ver >= 7) {
    let rem = ver;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const v = (ver << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFn(a, b, bit(v, i));
      setFn(b, a, bit(v, i));
    }
  }

  // data placement
  let bi = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!fn[y][x] && bi < all.length * 8) {
          mod[y][x] = bit(all[bi >>> 3], 7 - (bi & 7));
          bi++;
        }
      }
    }
  }

  const applyMask = (mask: number) => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let inv = false;
        switch (mask) {
          case 0: inv = (x + y) % 2 === 0; break;
          case 1: inv = y % 2 === 0; break;
          case 2: inv = x % 3 === 0; break;
          case 3: inv = (x + y) % 3 === 0; break;
          case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: inv = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: inv = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: inv = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
        }
        if (!fn[y][x] && inv) mod[y][x] = !mod[y][x];
      }
    }
  };

  const penalty = (): number => {
    let p = 0;
    const lineScore = (get: (i: number) => boolean) => {
      let run = 1;
      let s = 0;
      for (let i = 1; i < size; i++) {
        if (get(i) === get(i - 1)) {
          run++;
          if (run === 5) s += 3;
          else if (run > 5) s += 1;
        } else run = 1;
      }
      return s;
    };
    for (let y = 0; y < size; y++) p += lineScore((i) => mod[y][i]);
    for (let x = 0; x < size; x++) p += lineScore((i) => mod[i][x]);
    for (let y = 0; y < size - 1; y++)
      for (let x = 0; x < size - 1; x++) {
        const c = mod[y][x];
        if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3;
      }
    const pat1 = [true, false, true, true, true, false, true, false, false, false, false];
    const pat2 = [false, false, false, false, true, false, true, true, true, false, true];
    const match = (get: (i: number) => boolean, start: number, pat: boolean[]) => pat.every((v, k) => get(start + k) === v);
    for (let y = 0; y < size; y++)
      for (let s = 0; s + 11 <= size; s++) {
        if (match((i) => mod[y][i], s, pat1) || match((i) => mod[y][i], s, pat2)) p += 40;
      }
    for (let x = 0; x < size; x++)
      for (let s = 0; s + 11 <= size; s++) {
        if (match((i) => mod[i][x], s, pat1) || match((i) => mod[i][x], s, pat2)) p += 40;
      }
    let dark = 0;
    for (const row of mod) for (const c of row) if (c) dark++;
    const k = Math.ceil(Math.abs(dark * 20 - size * size * 10) / (size * size)) - 1;
    p += Math.max(0, k) * 10;
    return p;
  };

  let bestMask = 0;
  let bestPen = Infinity;
  for (let m = 0; m < 8; m++) {
    applyMask(m);
    drawFormat(m);
    const pen = penalty();
    if (pen < bestPen) {
      bestPen = pen;
      bestMask = m;
    }
    applyMask(m); // undo
  }
  applyMask(bestMask);
  drawFormat(bestMask);
  return mod;
        }
