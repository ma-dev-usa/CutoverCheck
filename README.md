# CutoverCheck

Inventory migration reconciliation for SaaS and ERP implementations.

A cutover can fail even when source and target record counts agree. Missing stock records, duplicate item/location keys, invalid quantities and changed balances need to be isolated before the business approves a migration. CutoverCheck compares two CSV exports and produces an auditable exception register and a deterministic readiness decision.

![Sample reconciliation report preview](docs/preview.svg)

## Review in two minutes

| Scenario | Result | Evidence |
|---|---|---|
| Migration with seeded defects | BLOCKED | [Exception report](reports/blocked.md) |
| Corrected migration | READY | [Clean report](reports/ready.md) |

The exception fixture contains 8 source and 7 target records. The tool identifies five blocking findings: an invalid quantity, duplicate key, missing record, unexpected record and quantity mismatch. The corrected fixture contains seven unique item/location balances, all of which reconcile exactly.

- [Implementation case study and acceptance criteria](docs/implementation.md)
- [SQL reconciliation queries](sql/reconciliation.sql)
- [Architecture and tradeoffs](docs/design.md)
- [Example machine-readable report](reports/blocked.json)
- [Test suite](tests/reconcile.test.mjs)

## Browser demo

[Download the standalone demo HTML](demo.html) using GitHub's download button and open it in a browser. Both sample scenarios are embedded; no installation, server, credentials or dependencies are required. The demo also accepts local CSV files and exports JSON. A hosted GitHub Pages deployment is not required for reviewing the reports above.

## CLI

Node.js 22+; no npm dependencies.

```sh
node src/cli.mjs fixtures/source.csv fixtures/target.csv
node src/cli.mjs fixtures/clean.csv fixtures/clean.csv
npm test
```

The CLI returns exit code 0 when ready, 2 when blocked and 1 for input errors. JSON output can be redirected to a file. Optional third positional argument is the integer quantity tolerance (default 0).

## Input contract

CSV headers: `sku,warehouse,quantity` (any column order). SKU and warehouse are case-sensitive after trimming whitespace; the combination is the business key. Quantity must be a nonnegative integer no larger than 1 billion. Blank rows are ignored. Quoted CSV fields, escaped quotes and CRLF are supported. The record number in findings counts logical nonblank CSV records including the header. Files are limited to 100,000 data rows, and the CLI and demo file picker limit each file to 10 MB.

## Decision rules

| Finding | Condition |
|---|---|
| Invalid | Missing key, malformed quantity or wrong column count |
| Duplicate | Multiple valid records with the same key on either side |
| Missing | Valid unique source key absent from target |
| Unexpected | Valid unique target key absent from source |
| Mismatch | Absolute quantity difference exceeds tolerance |
| Empty | Either dataset has no data records |

Invalid or duplicate keys are excluded from cross-file comparisons to avoid misleading secondary exceptions. Any finding blocks readiness. Within-tolerance differences are counted separately from exact matches.

## Repository layout

- `src/`: reconciliation engine and CLI.
- `demo.html`: standalone browser interface with the same reconciliation logic.
- `fixtures/`: synthetic migration exports.
- `reports/`: precomputed examples.
- `sql/`: relational reconciliation companion.
- `tests/`: automated regression checks.
- `docs/`: implementation case study and design decisions.

This is a self-contained implementation lab, using fictional inventory data. It does not connect to a commercial ERP or WMS. A READY result is a technical control, not final business approval.
