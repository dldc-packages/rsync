import type { Md5Hash } from './md5';

export interface IFileBuilder {
  writeUint8(value: number): void;
  writeUint32(value: number): void;
  writeMd5(value: Md5Hash): void;
  writeArrayBuffer(buf: ArrayBuffer): void;
  getArrayBuffer(): ArrayBuffer;
}

export const FileBuilder = (() => {
  return create;

  function create(initialSize: number = 32 * 4): IFileBuilder {
    let content = new Uint8Array(initialSize);
    let offset = 0;

    const tmpbuf = new ArrayBuffer(8);
    const u8arr = new Uint8Array(tmpbuf);
    const u32arr = new Uint32Array(tmpbuf);

    return {
      writeUint8,
      writeUint32,
      writeMd5,
      writeArrayBuffer,
      getArrayBuffer,
    };

    function writeUint8(value: number) {
      expand(offset + 1);
      content[offset] = value;
      offset += 1;
    }

    function writeUint32(value: number) {
      expand(offset + 4);
      u32arr[0] = value;
      content[offset] = u8arr[0];
      content[offset + 1] = u8arr[1];
      content[offset + 2] = u8arr[2];
      content[offset + 3] = u8arr[3];
      offset += 4;
    }

    function writeMd5(value: Md5Hash) {
      expand(offset + 16);
      value.forEach((v) => {
        writeUint32(v);
      });
    }

    function writeArrayBuffer(buf: ArrayBuffer) {
      expand(offset + buf.byteLength);
      content.set(new Uint8Array(buf), offset);
      offset += buf.byteLength;
    }

    function getArrayBuffer() {
      return content.buffer.slice(0, offset);
    }

    /**
     * Make sure
     */
    function expand(minsize: number) {
      if (minsize < content.byteLength) {
        return;
      }
      // we don't use current facade size bacause it might not be a power of 4
      let newsize = 32 * 4;
      while (newsize < minsize) {
        newsize *= 4;
      }
      const newBuffer = new Uint8Array(newsize);
      newBuffer.set(content);
      content = newBuffer;
    }
  }
})();
