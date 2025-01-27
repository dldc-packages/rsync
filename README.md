# ♻️ Rsync

> A pure TypeScript implementation of the
> [rsync algorithm](https://www.andrew.cmu.edu/course/15-749/READINGS/required/cas/tridgell96.pdf)

> [!WARNING]
> There is an issue wit the implementation of the algorithm when diffing 2 empty
> files. Unfortunately, I don't have the time to fix it right now as I'm no
> longer using this package. Instead, I'm using
> [@dldc/librsync](https://github.com/dldc-packages/librsync) which is a WASM
> port of a Rust implementation.

## Installation

```sh
npm install @dldc/rsync
```

## Usage

```ts
import { apply, diff, prepare } from "@dldc/rsync";

const checksum = prepare(destFile); // you can specify block size as second argument (default: 1024)
// send checksum to source
const patches = diff(sourceFile, checksum);
// send patches to dest
const syncedFile = apply(destFile, patches);
```

## Performance

This package was not designed to be fast. Since it's implemented fully in
TypeScript, it's not as fast as the C implementation of rsync. I tried to use
the best practices to make it less slow but I did not benchmark it 🤷.

## Dependencies 🪶

This package has a single dependency
[@dldc/erreur](https://github.com/dldc-packages/erreur) to define custom errors.
