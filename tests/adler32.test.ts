import { expect } from "$std/expect/mod.ts";
import { adler32, rollingAdler32 } from "../src/utils/adler32.ts";

Deno.test("rollingAdler32", () => {
  const data = new ArrayBuffer(100);
  for (let i = 0; i < data.byteLength; i++) {
    new Uint8Array(data)[i] = Math.floor(Math.random() * 256);
  }

  const testData = new Uint8Array(data);
  const blockSize = 16;

  let checksum = adler32(testData.slice(0, blockSize));
  // roll through the whole set, verifying the rolling checksums match straight adler
  for (let i = 0; i < testData.length - blockSize; i++) {
    checksum = rollingAdler32(
      checksum,
      blockSize,
      testData[i],
      testData[i + blockSize],
    );
    expect(checksum).toBe(adler32(testData.slice(i + 1, i + blockSize + 1)));
  }
});
