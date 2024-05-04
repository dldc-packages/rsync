import { expect } from "$std/expect/mod.ts";
import { readFile } from "node:fs/promises";
import { apply, diff, prepare } from "../mod.ts";
import { adler32 } from "../src/utils/adler32.ts";
import { md5 } from "../src/utils/md5.ts";
import { data } from "./utils/data.ts";
import { hex, toHex } from "./utils/hex.ts";

Deno.test("simple file", () => {
  const blockSize = 16;

  const testData1 = data.buffer.slice(0, 16 * 3);

  const checksum = prepare(testData1, blockSize);

  // prettier-ignore
  expect(toHex(checksum)).toEqual([
    "00000010", // = 16 (block size)
    "00000003", // = 3 (block count)
    "02b80079",
    "01efc11a",
    "1baf6ce9",
    "3329d3e0",
    "a8c24f1a", // first block
    "0b380179",
    "242ef41b",
    "29ba1618",
    "7b305fff",
    "161dbcb1", // second block
    "13b80279",
    "086dba35",
    "154ce3f0",
    "99b0d0b9",
    "b60e9698", // third block
  ]);

  const block1 = new Uint8Array(testData1, 0, blockSize);
  const block2 = new Uint8Array(testData1, blockSize, blockSize);
  const block3 = new Uint8Array(testData1, blockSize * 2, blockSize);

  expect(hex(adler32(block1))).toBe("02b80079");
  expect(hex(adler32(block2))).toBe("0b380179");
  expect(hex(adler32(block3))).toBe("13b80279");

  expect(toHex(new Uint32Array(md5(block1)))).toEqual([
    "01efc11a",
    "1baf6ce9",
    "3329d3e0",
    "a8c24f1a",
  ]);
  expect(toHex(new Uint32Array(md5(block2)))).toEqual([
    "242ef41b",
    "29ba1618",
    "7b305fff",
    "161dbcb1",
  ]);
  expect(toHex(new Uint32Array(md5(block3)))).toEqual([
    "086dba35",
    "154ce3f0",
    "99b0d0b9",
    "b60e9698",
  ]);

  const testData2 = data.buffer.slice(0, 16 * 3);
  // change data in second block
  new Uint8Array(testData2)[16] = 0;

  const patch = diff(testData2, checksum);

  const pacthData = new Uint8Array([
    0,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
  ]).buffer;
  expect(toHex(pacthData)).toEqual([
    "13121100",
    "17161514",
    "1b1a1918",
    "1f1e1d1c",
  ]);

  // prettier-ignore
  expect(toHex(patch)).toEqual([
    "00000010",
    "00000001",
    "00000002", // = 16 (block size), 1 patch, 2 matched
    "00000001",
    "00000003", // matched block 1 & 3
    "00000001", // patch is after block 1
    "00000010", // patch is 16 bytes long
    "13121100",
    "17161514",
    "1b1a1918",
    "1f1e1d1c", // patch data
  ]);

  const testData3 = apply(testData1, patch);
  expect(toHex(testData3)).toEqual(toHex(testData2));
});

Deno.test("simple file add a block", () => {
  const blockSize = 16;
  const testData1 = data.buffer.slice(0, 16 * 3);
  const checksum = prepare(testData1, blockSize);
  const testData2 = data.buffer.slice(0, 16 * 4);
  const patch = diff(testData2, checksum);
  const testData3 = apply(testData1, patch);

  expect(toHex(testData3)).toEqual(toHex(testData2));
});

Deno.test("simple file add a block before", () => {
  const blockSize = 16;
  const testData1 = data.buffer.slice(blockSize, blockSize * 4);
  const checksum = prepare(testData1, blockSize);
  const testData2 = data.buffer.slice(0, blockSize * 4);
  const patch = diff(testData2, checksum);
  const testData3 = apply(testData1, patch);

  expect(toHex(testData3)).toEqual(toHex(testData2));
});

Deno.test("simple file add a block before and after", () => {
  const blockSize = 16;
  const testData1 = data.buffer.slice(blockSize, blockSize * 4);
  const checksum = prepare(testData1, blockSize);
  const testData2 = data.buffer.slice(0, blockSize * 5);
  const patch = diff(testData2, checksum);
  const testData3 = apply(testData1, patch);

  expect(toHex(testData3)).toEqual(toHex(testData2));
});

Deno.test("different bigger file", () => {
  const blockSize = 16;
  const testData1 = data.buffer.slice(0, blockSize * 4);
  const checksum = prepare(testData1, blockSize);
  const testData2 = data.buffer.slice(blockSize * 5, blockSize * 12);
  const patch = diff(testData2, checksum);
  const testData3 = apply(testData1, patch);

  expect(toHex(testData3)).toEqual(toHex(testData2));
});

Deno.test("different smaller file", () => {
  const blockSize = 16;
  const testData1 = data.buffer.slice(0, blockSize * 4);
  const checksum = prepare(testData1, blockSize);
  const testData2 = data.buffer.slice(blockSize * 5, blockSize * 7);
  const patch = diff(testData2, checksum);
  const testData3 = apply(testData1, patch);

  expect(toHex(testData3)).toEqual(toHex(testData2));
});

Deno.test("same file", () => {
  const blockSize = 16;
  const testData1 = data.buffer.slice(0, blockSize * 4);
  const checksum = prepare(testData1, blockSize);
  const testData2 = data.buffer.slice(0, blockSize * 4);
  const patch = diff(testData2, checksum);
  const testData3 = apply(testData1, patch);

  expect(toHex(testData3)).toEqual(toHex(testData2));
  // still return a copy
  expect(testData3).not.toBe(testData1);
});

Deno.test("file of same size not aligned on block size", () => {
  const blockSize = 16;
  const testData1 = data.buffer.slice(0, 50);
  const checksum = prepare(testData1, blockSize);
  const testData2 = new Uint8Array(data.buffer.slice(0, 50));
  // change data in block 1
  testData2[0] = 42;
  // change data in block 2
  testData2[25] = 0;
  const patch = diff(testData2, checksum);
  const testData3 = apply(testData1, patch);

  expect(toHex(testData3)).toEqual(toHex(testData2.buffer));
});

Deno.test("sync text files A -> B", async () => {
  const fileA = await readFile("tests/fixtures/text-a.txt");
  const fileB = await readFile("tests/fixtures/text-b.txt");

  expect(fileA.byteLength).toBe(992);
  expect(fileB.byteLength).toBe(1232);

  const checksum = prepare(fileB, 16);
  expect(checksum.byteLength).toBe(1548);
  const patch = diff(fileA, checksum);
  expect(patch.byteLength).toBe(300);
  const fileB2 = apply(fileB, patch);

  expect(toHex(fileB2)).toEqual(toHex(fileA.buffer));
});

Deno.test("sync text files A -> A", async () => {
  const fileA = await readFile("tests/fixtures/text-a.txt");
  const fileB = await readFile("tests/fixtures/text-a.txt");

  expect(fileA.byteLength).toBe(992);
  expect(fileB.byteLength).toBe(992);

  const checksum = prepare(fileB, 128);
  // prettier-ignore
  expect(toHex(checksum)).toEqual([
    "00000080", // = 128 (block size)
    "00000008", // = 8 (number of blocks)
    "0ed52c37",
    "9b6be986",
    "c4e17ad5",
    "7b19cbb8",
    "96290aee",
    "e3132cfe",
    "333af37b",
    "1cd6bf7e",
    "6f752de9",
    "6a2cf985",
    "814d3159",
    "2f2a9a9f",
    "8eedfed8",
    "ec53c8d6",
    "b0ac9d47",
    "e0612fa6",
    "b8501ae8",
    "a39deb6c",
    "7bd4bacb",
    "1b4e74ec",
    "06b1332e",
    "05c408d9",
    "9e8085d2",
    "f9c4a4c0",
    "9b135883",
    "6e072e53",
    "ef37098b",
    "9b5c34f6",
    "30156b84",
    "65df4d6b",
    "2f353071",
    "ff0c6ecb",
    "b4332f2a",
    "653a6b18",
    "436d069e",
    "08fe24e5",
    "a6cc56d7",
    "0d22ba53",
    "38ccc048",
    "3a11a902",
  ]);

  expect(checksum.byteLength).toBe(168);
  const patch = diff(fileA, checksum);
  expect(patch.byteLength).toBe(44);
  // prettier-ignore
  expect(toHex(patch)).toEqual([
    "00000080", // = 128 (block size)
    "00000000", // 0 patch
    "00000008", // 8 matches
    "00000001",
    "00000002",
    "00000003",
    "00000004",
    "00000005",
    "00000006",
    "00000007",
    "00000008", // 8 matches
  ]);

  const fileB2 = apply(fileB, patch);

  expect(toHex(fileB2)).toEqual(toHex(fileA.buffer));
});

Deno.test("sync to empty file", () => {
  const emptyFile = new ArrayBuffer(0);
  const checksum = prepare(emptyFile);
  expect(toHex(checksum)).toEqual(["00000400", "00000000"]);
  expect(checksum.byteLength).toBe(8);
  const patch = diff(data.buffer, checksum);
  expect(toHex(patch)).toHaveLength(69);
  const fileB2 = apply(emptyFile, patch);
  expect(toHex(fileB2)).toEqual(toHex(data.buffer));
});
