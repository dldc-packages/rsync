import { Diff } from './files/Diff';
import { arrayBufferEquals } from './utils/arrayBufferEquals';
import { FileBuilder } from './utils/FileBuilder';
import { Data } from './utils/types';
import { ZenRsyncErreur } from './ZenRsyncErreur';

export function apply(bFile: Data, patch: ArrayBuffer): ArrayBuffer {
  const bView = new Uint8Array(bFile);

  const { blockSize, patchesCount, matchedBlocksCount, readMatchedBlock, matchedBlocksFile, readPatch, readEof } =
    Diff.parse(patch);

  // hanlde perfect equality
  const expectedMatchedBlocksCount = Math.ceil(bFile.byteLength / blockSize);
  const expectedMatchedBlocksFile = createExpectedMatchedBlockFile(expectedMatchedBlocksCount);
  // file is the same if all matched blocks are in incremental order
  if (
    patchesCount === 0 &&
    matchedBlocksCount === expectedMatchedBlocksCount &&
    arrayBufferEquals(matchedBlocksFile, expectedMatchedBlocksFile)
  ) {
    return bFile.slice(0);
  }

  // approximate size of the new file to be similar to the original file
  const file = FileBuilder(bFile.byteLength);

  const applyMatchedBlock = (blockNumber: number) => {
    const blockIndex = blockNumber - 1; // blockNumber is 1-based
    file.writeArrayBuffer(bView.subarray(blockIndex * blockSize, (blockIndex + 1) * blockSize));
    return readMatchedBlock();
  };

  let nextPatch = readPatch();
  let nextMatchedBlock = readMatchedBlock();

  if (nextPatch && nextPatch.blockIndex === 0) {
    // first patch is at the beginning of the file
    file.writeArrayBuffer(nextPatch.data);
    nextPatch = readPatch();
  }

  while (nextPatch !== null) {
    // write all matched block until nextPatch.blockIndex
    while (nextMatchedBlock === null || nextMatchedBlock !== nextPatch.blockIndex) {
      if (nextMatchedBlock === null) {
        throw ZenRsyncErreur.InvalidDiff.create(nextPatch.blockIndex);
      }
      nextMatchedBlock = applyMatchedBlock(nextMatchedBlock);
    }
    // at this point we have nextMatchedBlock === nextPatch.blockIndex
    // apply matched block before patch
    nextMatchedBlock = applyMatchedBlock(nextMatchedBlock);
    // apply patch
    file.writeArrayBuffer(nextPatch.data);
    nextPatch = readPatch();
  }
  // no more patch, write all remaining matched blocks
  while (nextMatchedBlock !== null) {
    nextMatchedBlock = applyMatchedBlock(nextMatchedBlock);
  }
  // check eof
  readEof();

  return file.getArrayBuffer();
}

function createExpectedMatchedBlockFile(blocksCount: number): ArrayBuffer {
  const file = FileBuilder(blocksCount * 4);
  for (let i = 1; i <= blocksCount; i++) {
    file.writeUint32(i);
  }
  return file.getArrayBuffer();
}
