import type { IBlock } from './files/Checksum';
import { ChecksumFile } from './files/Checksum';
import { DiffFile } from './files/Diff';
import type { Data } from './types';
import type { IFileBuilder } from './utils/FileBuilder';
import { FileBuilder } from './utils/FileBuilder';
import { adler32, rollingAdler32 } from './utils/adler32';
import type { Md5Hash } from './utils/md5';
import { md5 } from './utils/md5';

export type THashTableItem = [blockIndex: number, md5sum: Md5Hash];
export type THashTableEntry = Array<THashTableItem>;
export type THashTable = Map<number, THashTableEntry>;

export interface IParsedChecksum {
  blockSize: number;
  blocksCount: number;
  hashTable: THashTable;
}

export function diff(aFile: Data, checksum: ArrayBuffer): ArrayBuffer {
  const aView = new Uint8Array(aFile);
  const { blockSize, blocksCount, readBlock, readEof } = ChecksumFile.parse(checksum);

  const hashTable = createHashTable(blocksCount, readBlock, readEof);

  const file = DiffFile.build(blockSize);

  let offset = 0;

  // previous block checksum or null if prev is matched block or first block
  let blockSum: number | null = null;

  let currentPatchContent: null | IFileBuilder = null;

  while (offset < aView.length) {
    const blockEnd = offset + blockSize;
    if (blockEnd > aView.length) {
      // can't use rolling checksum if we don't have enough bytes, use straight adler32
      blockSum = null;
    }
    const block = aView.subarray(offset, blockEnd);
    const byte = aView[offset];
    // Compute block checksum using rolling checksum if previous sum is defined
    blockSum =
      blockSum === null
        ? adler32(block)
        : rollingAdler32(blockSum, blockSize, aView[offset - 1], aView[offset + blockSize - 1]);

    const matchedBlock = findMatch(hashTable, blockSum, block);

    if (matchedBlock === false) {
      // if we don't have a match
      // 1) add the current byte to the current patch
      if (currentPatchContent === null) {
        currentPatchContent = FileBuilder();
      }
      currentPatchContent.writeUint8(byte);
      // 2) move to the next byte
      offset++;
      continue;
    }

    // if we have a match
    // 1) add the current patch to the diff
    if (currentPatchContent !== null) {
      file.addPatch(currentPatchContent.getArrayBuffer());
      currentPatchContent = null;
    }
    // 2) add the matched block index to the diff
    file.addMatchedBlock(matchedBlock);
    // 3) move to the next block
    offset += blockSize;
    // 4) reset the block checksum
    blockSum = null;
  }

  // if we have a current patch, add it to the diff
  if (currentPatchContent !== null) {
    file.addPatch(currentPatchContent.getArrayBuffer());
  }

  return file.getArrayBuffer();
}

function createHashTable(blocksCount: number, readBlock: () => IBlock, readEof: () => void): THashTable {
  const hashTable: THashTable = new Map();

  for (let blockIndex = 1; blockIndex <= blocksCount; blockIndex++) {
    const { adler32, md5 } = readBlock();
    const entry: THashTableItem = [blockIndex, md5];
    const item = hashTable.get(adler32);
    if (item) {
      item.push(entry);
    } else {
      hashTable.set(adler32, [entry]);
    }
  }
  readEof();

  return hashTable;
}

/**
 * Returns false of the index of the matched block
 */
function findMatch(hashTable: THashTable, checksum: number, block: Uint8Array): number | false {
  const entry = hashTable.get(checksum);
  if (!entry) {
    return false;
  }

  for (let i = 0; i < entry.length; i++) {
    const [blockIndex, md5sum] = entry[i];
    //do strong comparison
    const blockMd5Raw = md5(block);
    const blockMd5 = new Uint32Array([blockMd5Raw[0], blockMd5Raw[1], blockMd5Raw[2], blockMd5Raw[3]]); //convert to unsigned 32

    if (
      md5sum[0] === blockMd5[0] &&
      md5sum[1] === blockMd5[1] &&
      md5sum[2] === blockMd5[2] &&
      md5sum[3] === blockMd5[3]
    ) {
      // remove the matched block from the hash table
      // beacause each matched block can only be used once
      entry.splice(i, 1);
      if (entry.length === 0) {
        hashTable.delete(checksum);
      }
      return blockIndex;
    }
  }

  return false;
}
