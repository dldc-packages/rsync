export function arrayBufferEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  const aView = new Uint8Array(a);
  const bView = new Uint8Array(b);
  for (let i = 0; i < a.byteLength; i++) {
    if (aView[i] !== bView[i]) {
      return false;
    }
  }
  return true;
}
