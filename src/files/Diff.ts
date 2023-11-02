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

import { RsyncErreur } from '../RsyncErreur';
import { FileBuilder } from '../utils/FileBuilder';
import { FileParser } from '../utils/FileParser';

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

export const DiffFile = (() => {
  return {
    build,
    parse,
    parseAll,
  };

  function build(blockSize: number): IDiffBuilder {
    let patchesCount = 0;
    let matchedBlocksCount = 0;
    let lastMatchIndex = 0;

    const matchedBlocksFile = FileBuilder();
    const patchesFile = FileBuilder();

    return {
      addMatchedBlock,
      addPatch,
      getArrayBuffer,
    };

    function addMatchedBlock(index: number) {
      matchedBlocksFile.writeUint32(index);
      matchedBlocksCount += 1;
      lastMatchIndex = index;
    }

    function addPatch(patch: ArrayBuffer) {
      patchesFile.writeUint32(lastMatchIndex);
      patchesFile.writeUint32(patch.byteLength);
      patchesFile.writeArrayBuffer(patch);
      patchesCount += 1;
    }

    function getArrayBuffer() {
      const file = FileBuilder();
      file.writeUint32(blockSize);
      file.writeUint32(patchesCount);
      file.writeUint32(matchedBlocksCount);
      file.writeArrayBuffer(matchedBlocksFile.getArrayBuffer());
      file.writeArrayBuffer(patchesFile.getArrayBuffer());
      return file.getArrayBuffer();
    }
  }

  function parse(data: ArrayBuffer): IDiffParser {
    const file = FileParser(data);
    const blockSize = file.readUint32();
    const patchesCount = file.readUint32();
    const matchedBlocksCount = file.readUint32();

    const matchedBlocksFile = file.readArrayBuffer(matchedBlocksCount * 4);
    const matchedBlocksFileParser = FileParser(matchedBlocksFile);

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
      const blockIndex = matchedBlocksFileParser.readUint32();
      readMatchedBlockCount += 1;
      return blockIndex;
    }

    function readPatch(): IPatch | null {
      if (readPatchCount >= patchesCount) {
        return null;
      }
      const blockIndex = file.readUint32();
      const patchSize = file.readUint32();
      const data = file.readArrayBuffer(patchSize);
      readPatchCount += 1;
      return {
        blockIndex,
        data,
      };
    }
  }

  function parseAll(data: ArrayBuffer) {
    const { blockSize, matchedBlocksCount, readMatchedBlock, patchesCount, readPatch } = parse(data);
    const matchedBlocks: number[] = [];
    for (let i = 0; i < matchedBlocksCount; i += 1) {
      const blockIndex = readMatchedBlock();
      if (blockIndex === null) {
        throw RsyncErreur.UnexpectedEof();
      }
      matchedBlocks.push(blockIndex);
    }

    const patches: Array<IPatch> = [];
    for (let i = 0; i < patchesCount; i += 1) {
      const patch = readPatch();
      if (patch === null) {
        throw RsyncErreur.UnexpectedEof();
      }
      patches.push(patch);
    }

    return {
      blockSize,
      matchedBlocks,
      patches,
    };
  }
})();
