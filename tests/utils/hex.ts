export function toHex(buf: ArrayBuffer): string[] {
  const base32End = buf.byteLength - (buf.byteLength % 4);
  const base32 = new Uint32Array(buf.slice(0, base32End));
  const base8 = new Uint8Array(buf.slice(base32End));

  return Array.from(base32)
    .map((b) => hex(b))
    .concat(Array.from(base8).map((b) => hex(b, 2)));
}

export function hex(num: number, size = 8): string {
  return num.toString(16).padStart(size, '0');
}
