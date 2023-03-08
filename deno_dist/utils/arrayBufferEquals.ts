/**
 * Compare two array buffers for equality.
 * Compare using a 32-bit view first, then a 8-bit view if the length is not a multiple of 4.
 * (I guess this is faster than comparing 8-bit views only but did not benchmark it 🤷)
 */
export function arrayBufferEquals(left: ArrayBuffer, right: ArrayBuffer): boolean {
  if (left.byteLength !== right.byteLength) {
    return false;
  }
  const base32Size = left.byteLength - (left.byteLength % 4);
  if (base32Size > 0) {
    const leftBase32 = new Uint32Array(left, 0, base32Size / 4);
    const rightBase32 = new Uint32Array(right, 0, base32Size / 4);
    for (let i = 0; i < leftBase32.length; i++) {
      if (leftBase32[i] !== rightBase32[i]) {
        return false;
      }
    }
  }
  const leftBase8 = new Uint8Array(left, base32Size);
  const rightBase8 = new Uint8Array(right, base32Size);
  for (let i = 0; i < leftBase8.length; i++) {
    if (leftBase8[i] !== rightBase8[i]) {
      return false;
    }
  }
  return true;
}
