import { expect } from "@std/expect";
import { prepare } from "../mod.ts";
import { arrayBufferEqual } from "./utils/arrayBufferEqual.ts";
import { data } from "./utils/data.ts";

Deno.test("checksums", () => {
  const testData1 = data.buffer.slice(0);
  const blockSize = 16;
  const doc1 = prepare(testData1, blockSize);

  const testData2 = data.buffer.slice(0);
  const doc2 = prepare(testData2, blockSize);

  expect(arrayBufferEqual(doc1, doc2)).toBe(true);

  // change data in first block
  new Uint8Array(testData2)[0]++;
  const doc3 = prepare(testData2, blockSize);

  expect(arrayBufferEqual(doc1, doc3)).toBe(false);

  // adler32 is different for first block
  expect(arrayBufferEqual(doc1.slice(8, 12), doc3.slice(8, 12))).toBe(false);
  // md5 is different for first block
  expect(arrayBufferEqual(doc1.slice(12, 28), doc3.slice(12, 28))).toBe(false);
  // rest is the same
  expect(arrayBufferEqual(doc1.slice(28), doc3.slice(28))).toBe(true);
});
