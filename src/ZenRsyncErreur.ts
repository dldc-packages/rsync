import { Erreur } from 'erreur';

export const ZenRsyncErreur = {
  InvalidDiff: Erreur.declare<{ blockIndex: number }>('InvalidDiff')
    .withMessage(({ blockIndex }) => `Unexpected diff, patch block after ${blockIndex}, but the block is not matched`)
    .withTransform((blockIndex: number) => ({ blockIndex })),
  BlockCountMismatch: Erreur.declare<{ expected: number; actual: number }>('BlockCountMismatch').withMessage(
    ({ expected, actual }) => `Block count mismatch, expected ${expected}, got ${actual}`
  ),
  UnexpectedEof: Erreur.declare<null>('UnexpectedEof')
    .withMessage('Unexpected end of file')
    .withTransform(() => null),
  ExpectedEof: Erreur.declare<null>('ExpectedEof')
    .withMessage('Expected end of file but found more data')
    .withTransform(() => null),
};
