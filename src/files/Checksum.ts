import { readUint32, reader, writeUint32, writer } from '@dldc/file';
import { RsyncErreur } from '../RsyncErreur';
import { readMd5, writeMd5 } from '../utils/blocks';
import type { Md5Hash } from '../utils/md5';

/**
 * - 4 bytes block size
 * - 4 bytes blocks count
 * - For each block:
 *   - 4 bytes adler32
 *   - 16 bytes md5
 */

const BLOCK_SIZE_BYTES = 4;
const BLOCK_COUNT_BYTES = 4;

const ADLER_32_BYTES = 4;
const MD5_BYTES = 16;

const CHUNK_SIZE = ADLER_32_BYTES + MD5_BYTES;

export interface IBlock {
  adler32: number;
  md5: Md5Hash;
}

export interface IChecksumParser {
  blockSize: number;
  blocksCount: number;
  readBlock(): IBlock;
  readEof(): void;
}

export interface IChecksumBuilder {
  addBlock(block: IBlock): IBlock;
  getArrayBuffer(): ArrayBuffer;
}

export function parseChecksum(data: ArrayBuffer): IChecksumParser {
  const file = reader(data);

  const blockSize = file.read(readUint32);
  const blocksCount = file.read(readUint32);

  let currentBlockCount = 0;

  return {
    blockSize,
    blocksCount,
    readBlock,
    readEof,
  };

  function readBlock(): IBlock {
    const adler32 = file.read(readUint32);
    const md5 = file.read(readMd5);
    const block: IBlock = {
      adler32,
      md5,
    };
    currentBlockCount += 1;
    return block;
  }

  function readEof() {
    if (blocksCount !== currentBlockCount) {
      throw RsyncErreur.BlockCountMismatch(blocksCount, currentBlockCount);
    }
    file.readEof();
  }
}

export function buildChecksum(blockSize: number, blocksCount: number): IChecksumBuilder {
  const size = BLOCK_SIZE_BYTES + BLOCK_COUNT_BYTES + blocksCount * CHUNK_SIZE;
  const file = writer(size);

  let currentBlockCount = 0;

  file.write(writeUint32, blockSize);
  file.write(writeUint32, blocksCount);

  return {
    addBlock,
    getArrayBuffer,
  };

  function addBlock(block: IBlock): IBlock {
    file.write(writeUint32, block.adler32);
    file.write(writeMd5, block.md5);
    currentBlockCount += 1;
    return block;
  }

  function getArrayBuffer(): ArrayBuffer {
    if (blocksCount !== currentBlockCount) {
      throw RsyncErreur.BlockCountMismatch(blocksCount, currentBlockCount);
    }
    return file.getArrayBuffer();
  }
}
