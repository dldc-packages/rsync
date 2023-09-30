import type { TKey, TVoidKey } from '@dldc/erreur';
import { Erreur, Key } from '@dldc/erreur';

export const ZenRsyncErreur = (() => {
  const InvalidDiffKey: TKey<{ blockIndex: number }> = Key.create('InvalidDiff');
  const BlockCountMismatchKey: TKey<{ expected: number; actual: number }> = Key.create('BlockCountMismatch');
  const UnexpectedEofKey: TVoidKey = Key.createEmpty('UnexpectedEof');
  const ExpectedEofKey: TVoidKey = Key.createEmpty('ExpectedEof');

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
