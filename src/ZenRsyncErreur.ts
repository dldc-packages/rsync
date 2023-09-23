import type { IKey } from '@dldc/erreur';
import { Erreur, Key } from '@dldc/erreur';

export const ZenRsyncErreur = (() => {
  const InvalidDiffKey: IKey<{ blockIndex: number }, false> = Key.create('InvalidDiff');
  const BlockCountMismatchKey: IKey<{ expected: number; actual: number }, false> = Key.create('BlockCountMismatch');
  const UnexpectedEofKey: IKey<undefined, false, []> = Key.createEmpty('UnexpectedEof');
  const ExpectedEofKey: IKey<undefined, false, []> = Key.createEmpty('ExpectedEof');

  return {
    InvalidDiff: {
      Key: InvalidDiffKey,
      create(blockIndex: number) {
        return Erreur.createWith(InvalidDiffKey, { blockIndex }).withMessage(
          `Unexpected diff, patch block after ${blockIndex}, but the block is not matched`,
        );
      },
    },
    BlockCountMismatch: {
      Key: BlockCountMismatchKey,
      create(expected: number, actual: number) {
        return Erreur.createWith(BlockCountMismatchKey, { expected, actual }).withMessage(
          `Block count mismatch, expected ${expected}, got ${actual}`,
        );
      },
    },
    UnexpectedEof: {
      Key: UnexpectedEofKey,
      create() {
        return Erreur.createWith(UnexpectedEofKey).withMessage('Unexpected end of file');
      },
    },
    ExpectedEof: {
      Key: ExpectedEofKey,
      create() {
        return Erreur.createWith(ExpectedEofKey).withMessage('Expected end of file but found more data');
      },
    },
  };
})();
