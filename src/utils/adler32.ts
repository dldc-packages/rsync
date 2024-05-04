const ADLER_BASE = 65521;
const ADLER_NMAX = 5552;

export function adler32(buf: Uint8Array): number {
  const max = buf.length;

  const sum = 1;
  let a = sum & 0xffff;
  let b = (sum >>> 16) & 0xffff;
  let i = 0;
  let n;

  while (i < max) {
    n = Math.min(ADLER_NMAX, max - i);

    do {
      a += buf[i++] << 0;
      b += a;
    } while (--n);

    a %= ADLER_BASE;
    b %= ADLER_BASE;
  }

  return ((b << 16) | a) >>> 0;
}

export function rollingAdler32(
  prev: number,
  size: number,
  oldByte: number,
  newByte: number,
): number {
  let a = prev & 0xffff;
  let b = (prev >>> 16) & 0xffff;

  a = (a - oldByte + newByte + ADLER_BASE) % ADLER_BASE;
  b = (b - ((size * oldByte) % ADLER_BASE) + a - 1 + ADLER_BASE) % ADLER_BASE;

  return ((b << 16) | a) >>> 0;
}
