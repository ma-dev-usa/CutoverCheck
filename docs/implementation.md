# Implementation case study

## Scenario

A distributor is migrating inventory balances from a legacy system to a new operational platform. The implementation team receives two CSV exports taken from the same inventory snapshot. Before cutover, the team must verify that item/location balances survive the transfer.

## Discovery and mapping

| Source field | Target field | Validation |
|---|---|---|
| Item identifier | sku | Required; preserve case and leading zeros |
| Location code | warehouse | Required; agreed location mapping |
| On-hand units | quantity | Nonnegative integer; same unit of measure |

Assumptions: both exports use the same snapshot time, item master and unit of measure. In a real deployment, confirm warehouse mappings and freeze or reconcile transactions during extraction.

## Acceptance criteria

| ID | Requirement | Evidence |
|---|---|---|
| UAT-01 | Identical valid balances pass | [Clean report](../reports/ready.md) |
| UAT-02 | Missing and unexpected keys are reported | [Exception report](../reports/blocked.md) |
| UAT-03 | Duplicate keys block readiness | [Exception report](../reports/blocked.md) |
| UAT-04 | Invalid quantities block readiness | [Exception report](../reports/blocked.md) |
| UAT-05 | Variances above the approved tolerance block readiness | Automated regression suite |
| UAT-06 | Empty or malformed input cannot pass | Automated regression suite |

## Exception ownership

| Finding | Likely owner | Investigation |
|---|---|---|
| Missing | Migration engineer | Check extract filters, mapping and load failures |
| Unexpected | Data owner | Check orphaned or stale target records |
| Duplicate | Integration engineer | Check replay behavior and uniqueness rules |
| Invalid | Data steward | Check unit conversion, field types and source quality |
| Mismatch | Operations lead | Check snapshot timing, adjustments and transformations |

## Cutover checklist

1. Confirm the source extract timestamp, warehouse scope and units.
2. Run a dry migration and export the target balance snapshot.
3. Reconcile and assign every blocking finding to an owner.
4. Correct mappings or data, repeat the dry run, and archive both reports.
5. Obtain business approval; verify rollback procedures, integrations and operational UAT separately.
6. Reconcile again immediately after the final migration.

## Results

The seeded dry run has five blockers; the corrected seven-key dataset has zero. These are reproducible fixture results, not commercial deployment statistics.
