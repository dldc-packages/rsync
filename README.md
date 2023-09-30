# ♻️ Rsync

> A pure TypeScript implementation of the [rsync algorithm](https://www.andrew.cmu.edu/course/15-749/READINGS/required/cas/tridgell96.pdf)

## Installation

```sh
npm install @dldc/rsync
```

## Usage

```ts
import { prepare, diff, apply } from '@dldc/rsync';

const checksum = prepare(destFile); // you can specify block size as second argument (default: 1024)
// send checksum to source
const patches = diff(sourceFile, checksum);
// send patches to dest
const syncedFile = apply(destFile, patches);
```

## Performance

This package was not designed to be fast. Since it's implemented fully in TypeScript, it's not as fast as the C implementation of rsync.
I tried to use the best practices to make is less slow but I did not benchmark it 🤷.

## Dependencies 🪶

This package has a single dependency [etienne-dldc/erreur](https://github.com/etienne-dldc/erreur) to define custom errors.
