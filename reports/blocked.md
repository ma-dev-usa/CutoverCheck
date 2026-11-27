# Migration exception report

**Cutover decision: BLOCKED**

| Measure | Result |
|---|---:|
| Source records | 8 |
| Target records | 7 |
| Comparable keys | 4 |
| Exact matches | 3 |
| Within tolerance | 0 |
| Blocking findings | 5 |

| Finding | Side | SKU | Warehouse | Evidence |
|---|---|---|---|---|
| duplicate | source | A500 | SEA | 2 records share this key |
| invalid | target | A600 | SEA | Record 6: invalid key, quantity or column count |
| mismatch | both | A200 | PDX | Source 10, target 7, delta -3 |
| missing | target | A400 | SEA | Source quantity 14 has no target record |
| unexpected | target | A800 | SEA | Target quantity 9 has no source record |

Synthetic sample data. READY means the configured reconciliation checks passed; business approval is still required.
