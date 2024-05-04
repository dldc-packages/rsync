import type { IReadBlock, IWriteBlock } from "@dldc/file";
import { readUint32, seqRead, seqWrite, writeUint32 } from "@dldc/file";
import type { Md5Hash } from "./md5.ts";

export const readMd5: IReadBlock<Md5Hash> = seqRead(
  readUint32,
  readUint32,
  readUint32,
  readUint32,
);

export const writeMd5: IWriteBlock<Md5Hash> = seqWrite(
  writeUint32,
  writeUint32,
  writeUint32,
  writeUint32,
);
