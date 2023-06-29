import { Buffer } from 'buffer';
import { expect, test } from 'vitest';
import { prepare } from '../src/mod';
import { data } from './utils/data';

test('checksums', () => {
  const testData1 = data.buffer.slice(0);
  const blockSize = 16;
  const doc1 = Buffer.from(prepare(testData1, blockSize));

  const testData2 = data.buffer.slice(0);
  const doc2 = Buffer.from(prepare(testData2, blockSize));

  expect(doc1.equals(doc2)).toBe(true);

  // change data in first block
  new Uint8Array(testData2)[0]++;
  const doc3 = Buffer.from(prepare(testData2, blockSize));

  expect(doc1.equals(doc3)).toBe(false);

  // adler32 is different for first block
  expect(doc1.slice(8, 12).equals(doc3.slice(8, 12))).toBe(false);
  // md5 is different for first block
  expect(doc1.slice(12, 28).equals(doc3.slice(12, 28))).toBe(false);
  // rest is the same
  expect(doc1.slice(28).equals(doc3.slice(28))).toBe(true);
});
