import { ErreurType } from '@dldc/erreur';

export const ZenRsyncErreur = {
  InvalidDiff: ErreurType.defineWithTransform(
    'InvalidDiff',
    (blockIndex: number) => ({ blockIndex }),
    (err, provider, { blockIndex }) => {
      return err
        .with(provider)
        .withMessage(`Unexpected diff, patch block after ${blockIndex}, but the block is not matched`);
    }
  ),
  BlockCountMismatch: ErreurType.define<{ expected: number; actual: number }>(
    'BlockCountMismatch',
    (err, provider, { expected, actual }) => {
      return err.with(provider).withMessage(`Block count mismatch, expected ${expected}, got ${actual}`);
    }
  ),
  UnexpectedEof: ErreurType.defineEmpty('UnexpectedEof', (err, provider) => {
    return err.with(provider).withMessage('Unexpected end of file');
  }),
  ExpectedEof: ErreurType.defineEmpty('ExpectedEof', (err, provider) => {
    return err.with(provider).withMessage('Expected end of file but found more data');
  }),
};
