/**
 * Diff file looks like this: (little Endian)
 * 4 bytes - blockSize
 * 4 bytes - number of patches
 * 4 bytes - number of matched blocks
 * For each matched block:
 *   4 bytes - the index of the matched block
 * For each patch:
 *   4 bytes - last matching block index. NOTE: This is 1 based index! Zero indicates beginning of file, NOT the first block
 *   4 bytes - patch size
 *   n bytes - new data
 */

import { readBufferFixed, readUint32, reader, writeBuffer, writeUint32, writer } from '@dldc/file';
import { throwUnexpectedEof } from '../erreur';

export interface IDiffBuilder {
  addMatchedBlock(index: number): void;
  addPatch(patch: ArrayBuffer): void;
  getArrayBuffer(): ArrayBuffer;
}

export interface IPatch {
  blockIndex: number;
  data: ArrayBuffer;
}

export interface IDiffParser {
  blockSize: number;
  patchesCount: number;
  matchedBlocksCount: number;
  matchedBlocksFile: ArrayBuffer;
  readMatchedBlock(): number | null;
  readPatch(): IPatch | null;
  readEof(): void;
}

export function buildDiff(blockSize: number): IDiffBuilder {
  let patchesCount = 0;
  let matchedBlocksCount = 0;
  let lastMatchIndex = 0;

  const matchedBlocksFile = writer();
  const patchesFile = writer();

  return {
    addMatchedBlock,
    addPatch,
    getArrayBuffer,
  };

  function addMatchedBlock(index: number) {
    matchedBlocksFile.write(writeUint32, index);
    matchedBlocksCount += 1;
    lastMatchIndex = index;
  }

  function addPatch(patch: ArrayBuffer) {
    patchesFile.write(writeUint32, lastMatchIndex);
    patchesFile.write(writeUint32, patch.byteLength);
    patchesFile.write(writeBuffer, new Uint8Array(patch));
    patchesCount += 1;
  }

  function getArrayBuffer() {
    const file = writer();
    file.write(writeUint32, blockSize);
    file.write(writeUint32, patchesCount);
    file.write(writeUint32, matchedBlocksCount);
    file.write(writeBuffer, new Uint8Array(matchedBlocksFile.getArrayBuffer()));
    file.write(writeBuffer, new Uint8Array(patchesFile.getArrayBuffer()));
    return file.getArrayBuffer();
  }
}

export function parseDiff(data: ArrayBuffer): IDiffParser {
  const file = reader(data);
  const blockSize = file.read(readUint32);
  const patchesCount = file.read(readUint32);
  const matchedBlocksCount = file.read(readUint32);

  const matchedBlocksFile = file.read(readBufferFixed(matchedBlocksCount * 4));
  const matchedBlocksFileParser = reader(matchedBlocksFile);

  let readPatchCount = 0;
  let readMatchedBlockCount = 0;

  return {
    blockSize,
    matchedBlocksCount,
    patchesCount,
    matchedBlocksFile,
    readMatchedBlock,
    readPatch,
    readEof: file.readEof,
  };

  function readMatchedBlock(): number | null {
    if (readMatchedBlockCount >= matchedBlocksCount) {
      return null;
    }
    const blockIndex = matchedBlocksFileParser.read(readUint32);
    readMatchedBlockCount += 1;
    return blockIndex;
  }

  function readPatch(): IPatch | null {
    if (readPatchCount >= patchesCount) {
      return null;
    }
    const blockIndex = file.read(readUint32);
    const patchSize = file.read(readUint32);
    const data = file.read(readBufferFixed(patchSize));
    readPatchCount += 1;
    return {
      blockIndex,
      data,
    };
  }
}

export function parseAllDiff(data: ArrayBuffer) {
  const { blockSize, matchedBlocksCount, readMatchedBlock, patchesCount, readPatch } = parseDiff(data);
  const matchedBlocks: number[] = [];
  for (let i = 0; i < matchedBlocksCount; i += 1) {
    const blockIndex = readMatchedBlock();
    if (blockIndex === null) {
      return throwUnexpectedEof();
    }
    matchedBlocks.push(blockIndex);
  }

  const patches: Array<IPatch> = [];
  for (let i = 0; i < patchesCount; i += 1) {
    const patch = readPatch();
    if (patch === null) {
      return throwUnexpectedEof();
    }
    patches.push(patch);
  }

  return {
    blockSize,
    matchedBlocks,
    patches,
  };
}
