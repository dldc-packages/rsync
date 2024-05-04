import { createErreurStore, type TErreurStore } from "@dldc/erreur";

export type TRsyncErreurData =
  | { kind: "InvalidDiff"; blockIndex: number }
  | { kind: "BlockCountMismatch"; expected: number; actual: number }
  | { kind: "UnexpectedEof" };

const RsyncErreurInternal: TErreurStore<TRsyncErreurData> = createErreurStore<
  TRsyncErreurData
>();

export const RsyncErreur = RsyncErreurInternal.asReadonly;

export function throwInvalidDiff(blockIndex: number): never {
  throw RsyncErreurInternal.setAndThrow(
    `Unexpected diff, patch block after ${blockIndex}, but the block is not matched`,
    { kind: "InvalidDiff", blockIndex },
  );
}

export function throwBlockCountMismatch(
  expected: number,
  actual: number,
): never {
  throw RsyncErreurInternal.setAndThrow(
    `Block count mismatch, expected ${expected}, got ${actual}`,
    {
      kind: "BlockCountMismatch",
      expected,
      actual,
    },
  );
}

export function throwUnexpectedEof(): never {
  throw RsyncErreurInternal.setAndThrow("Unexpected end of file", {
    kind: "UnexpectedEof",
  });
}
