# SFDMU Soql Merge Where Clauses

> Implementation and unit tests for utility functions used in SFDMU's `sourceRecordsFilter` feature

> Merges two WHERE clauses in `"soql-parser-js": "^1.2.1"`

See the implementation in [src/index.ts](src/index.ts), which corresponds the changes in
- https://github.com/forcedotcom/SFDX-Data-Move-Utility/pull/936

See tests in [src/index.test.ts](src/index.test.ts).

## Setup

```
pnpm i
```

## Usage

Run [src/main.ts](src/main.ts) for quick debugging

```sh
npx start
```

Run unit tests (vitest)

```sh
pnpm t
```
