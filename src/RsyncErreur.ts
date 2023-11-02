import type { TKey } from '@dldc/erreur';
import { Erreur, Key } from '@dldc/erreur';

export type TRsyncErreurData =
  | { kind: 'InvalidDiffKey'; blockIndex: number }
  | { kind: 'BlockCountMismatchKey'; expected: number; actual: number }
  | { kind: 'UnexpectedEofKey' }
  | { kind: 'ExpectedEofKey' };

export const RsyncErreurKey: TKey<TRsyncErreurData, false> = Key.create<TRsyncErreurData>('RsyncErreur');

export const RsyncErreur = {
  InvalidDiff: (blockIndex: number) => {
    return Erreur.create(new Error(`Unexpected diff, patch block after ${blockIndex}, but the block is not matched`))
      .with(RsyncErreurKey.Provider({ kind: 'InvalidDiffKey', blockIndex }))
      .withName('RsyncErreur');
  },
  BlockCountMismatch: (expected: number, actual: number) => {
    return Erreur.create(new Error(`Block count mismatch, expected ${expected}, got ${actual}`))
      .with(RsyncErreurKey.Provider({ kind: 'BlockCountMismatchKey', expected, actual }))
      .withName('RsyncErreur');
  },
  UnexpectedEof: () => {
    return Erreur.create(new Error('Unexpected end of file'))
      .with(RsyncErreurKey.Provider({ kind: 'UnexpectedEofKey' }))
      .withName('RsyncErreur');
  },
  ExpectedEof: () => {
    return Erreur.create(new Error('Expected end of file but found more data'))
      .with(RsyncErreurKey.Provider({ kind: 'ExpectedEofKey' }))
      .withName('RsyncErreur');
  },
};
