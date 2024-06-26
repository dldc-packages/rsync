import { writeBuffer, writer, writeUint32 } from "@dldc/file";
import { throwInvalidDiff } from "./erreur.ts";
import { parseDiff } from "./files/Diff.ts";
import type { Data } from "./types.ts";
import { arrayBufferEquals } from "./utils/arrayBufferEquals.ts";

export function apply(file: Data, patch: ArrayBuffer): ArrayBuffer {
  const bView = new Uint8Array(file);

  const {
    blockSize,
    patchesCount,
    matchedBlocksCount,
    readMatchedBlock,
    matchedBlocksFile,
    readPatch,
    readEof,
  } = parseDiff(patch);

  // hanlde perfect equality
  const expectedMatchedBlocksCount = Math.ceil(file.byteLength / blockSize);
  const expectedMatchedBlocksFile = createExpectedMatchedBlockFile(
    expectedMatchedBlocksCount,
  );
  // file is the same if all matched blocks are in incremental order
  if (
    patchesCount === 0 &&
    matchedBlocksCount === expectedMatchedBlocksCount &&
    arrayBufferEquals(matchedBlocksFile, expectedMatchedBlocksFile)
  ) {
    // return a copy of the file
    return bView.buffer.slice(0);
  }

  // approximate size of the new file to be similar to the original file
  const result = writer(file.byteLength);

  const applyMatchedBlock = (blockNumber: number) => {
    const blockIndex = blockNumber - 1; // blockNumber is 1-based
    result.write(
      writeBuffer,
      bView.subarray(blockIndex * blockSize, (blockIndex + 1) * blockSize),
    );
    return readMatchedBlock();
  };

  let nextPatch = readPatch();
  let nextMatchedBlock = readMatchedBlock();

  if (nextPatch && nextPatch.blockIndex === 0) {
    // first patch is at the beginning of the file
    result.write(writeBuffer, new Uint8Array(nextPatch.data));
    nextPatch = readPatch();
  }

  while (nextPatch !== null) {
    // write all matched block until nextPatch.blockIndex
    while (
      nextMatchedBlock === null || nextMatchedBlock !== nextPatch.blockIndex
    ) {
      if (nextMatchedBlock === null) {
        return throwInvalidDiff(nextPatch.blockIndex);
      }
      nextMatchedBlock = applyMatchedBlock(nextMatchedBlock);
    }
    // at this point we have nextMatchedBlock === nextPatch.blockIndex
    // apply matched block before patch
    nextMatchedBlock = applyMatchedBlock(nextMatchedBlock);
    // apply patch
    result.write(writeBuffer, new Uint8Array(nextPatch.data));
    nextPatch = readPatch();
  }
  // no more patch, write all remaining matched blocks
  while (nextMatchedBlock !== null) {
    nextMatchedBlock = applyMatchedBlock(nextMatchedBlock);
  }
  // check eof
  readEof();

  return result.getArrayBuffer();
}

function createExpectedMatchedBlockFile(blocksCount: number): ArrayBuffer {
  const file = writer(blocksCount * 4);
  for (let i = 1; i <= blocksCount; i++) {
    file.write(writeUint32, i);
  }
  return file.getArrayBuffer();
}
