import { buildChecksum } from "./files/Checksum.ts";
import type { Data } from "./types.ts";
import { adler32 } from "./utils/adler32.ts";
import { md5 } from "./utils/md5.ts";
import { DEFAULT_BLOCK_SIZE } from "./utils/options.ts";

export function prepare(
  bFile: Data,
  blockSize = DEFAULT_BLOCK_SIZE,
): ArrayBuffer {
  const bView = new Uint8Array(bFile);

  const blocksCount = Math.ceil(bView.length / blockSize);
  const file = buildChecksum(blockSize, blocksCount);

  for (let i = 0; i < blocksCount; i++) {
    const start = i * blockSize;
    const end = i * blockSize + blockSize;

    const block = bView.subarray(start, end);

    file.addBlock({
      adler32: adler32(block),
      md5: md5(block),
    });
  }

  return file.getArrayBuffer();
}
