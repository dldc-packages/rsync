import { Checksum, IBlock } from './files/Checksum';
import { Diff } from './files/Diff';
import { adler32, rollingAdler32 } from './utils/adler32';
import { FileBuilder, IFileBuilder } from './utils/FileBuilder';
import { md5, Md5Hash } from './utils/md5';
import { Data } from './utils/types';

export type HashTableItem = [blockIndex: number, adler32sum: number, md5sum: Md5Hash];
export type HashTableEntry = Array<HashTableItem>;
export type HashTable = Map<number, HashTableEntry>;

export interface ParsedChecksum {
  blockSize: number;
  blocksCount: number;
  hashTable: HashTable;
}

export function diff(aFile: Data, checksum: ArrayBuffer): ArrayBuffer {
  const aView = new Uint8Array(aFile);
  const { blockSize, blocksCount, readBlock, readEof } = Checksum.parse(checksum);

  const hashTable = createHashTable(blocksCount, readBlock, readEof);

  const file = Diff.build(blockSize);

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

function createHashTable(blocksCount: number, readBlock: () => IBlock, readEof: () => void): HashTable {
  const hashTable: HashTable = new Map();

  for (let blockIndex = 1; blockIndex <= blocksCount; blockIndex++) {
    const { adler32, md5 } = readBlock();
    const entry: HashTableItem = [blockIndex, adler32, md5];
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
function findMatch(hashTable: HashTable, checksum: number, block: Uint8Array): number | false {
  const entry = hashTable.get(checksum);
  if (!entry) {
    return false;
  }

  for (let i = 0; i < entry.length; i++) {
    const [blockIndex, adler32sum, md5sum] = entry[i];
    //compare adler32sum
    if ((adler32sum & 0xffffffff) !== checksum) {
      continue;
    }
    //do strong comparison
    const blockMd5Raw = md5(block);
    const blockMd5 = new Uint32Array([blockMd5Raw[0], blockMd5Raw[1], blockMd5Raw[2], blockMd5Raw[3]]); //convert to unsigned 32

    if (
      md5sum[0] === blockMd5[0] &&
      md5sum[1] === blockMd5[1] &&
      md5sum[2] === blockMd5[2] &&
      md5sum[3] === blockMd5[3]
    ) {
      return blockIndex;
    }
  }

  return false;
}
