import { ZenRsyncErreur } from '../ZenRsyncErreur';
import type { Md5Hash } from './md5';

export interface IFileParser {
  readUint8(): number;
  readUint32(): number;
  readMd5(): Md5Hash;
  readArrayBuffer(size: number): ArrayBuffer;
  readEof(): void;
}

export const FileParser = (() => {
  return create;

  function create(data: ArrayBuffer): IFileParser {
    const buffer = new Uint8Array(data);
    let offset = 0;

    const tmpbuf = new ArrayBuffer(8);
    const u8arr = new Uint8Array(tmpbuf);
    const u32arr = new Uint32Array(tmpbuf);

    return {
      readUint8,
      readUint32,
      readMd5,
      readArrayBuffer,
      readEof,
    };

    function readUint8(): number {
      ensureRead(1);
      const value = buffer[offset];
      offset += 1;
      return value;
    }

    function readUint32(): number {
      ensureRead(4);
      u8arr[0] = buffer[offset];
      u8arr[1] = buffer[offset + 1];
      u8arr[2] = buffer[offset + 2];
      u8arr[3] = buffer[offset + 3];
      const value = u32arr[0];
      offset += 4;
      return value;
    }

    function readMd5(): Md5Hash {
      return [readUint32(), readUint32(), readUint32(), readUint32()];
    }

    function readArrayBuffer(size: number): ArrayBuffer {
      ensureRead(size);
      const value = buffer.buffer.slice(offset, offset + size);
      offset += size;
      return value;
    }

    function readEof() {
      if (offset !== buffer.byteLength) {
        throw ZenRsyncErreur.ExpectedEof.create();
      }
    }

    function ensureRead(size: number) {
      if (offset + size > buffer.byteLength) {
        throw ZenRsyncErreur.UnexpectedEof.create();
      }
    }
  }
})();
