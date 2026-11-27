-- SQLite 3.25+; load the validated, unique rows from each export into
-- these staging tables. Invalid and duplicate records must be rejected
-- before loading. Quantities represent integer units.
CREATE TABLE source_stock (
  sku TEXT NOT NULL CHECK(length(trim(sku)) > 0),
  warehouse TEXT NOT NULL CHECK(length(trim(warehouse)) > 0),
  quantity INTEGER NOT NULL CHECK(typeof(quantity) = 'integer' AND quantity BETWEEN 0 AND 1000000000),
  PRIMARY KEY (sku, warehouse)
);
CREATE TABLE target_stock (
  sku TEXT NOT NULL CHECK(length(trim(sku)) > 0),
  warehouse TEXT NOT NULL CHECK(length(trim(warehouse)) > 0),
  quantity INTEGER NOT NULL CHECK(typeof(quantity) = 'integer' AND quantity BETWEEN 0 AND 1000000000),
  PRIMARY KEY (sku, warehouse)
);

-- Full outer join emulation for SQLite versions without FULL OUTER JOIN.
CREATE VIEW stock_comparison AS
WITH keys AS (
  SELECT sku, warehouse FROM source_stock
  UNION
  SELECT sku, warehouse FROM target_stock
)
SELECT k.sku, k.warehouse, s.quantity AS source_qty,
       t.quantity AS target_qty, t.quantity - s.quantity AS delta,
       CASE WHEN s.sku IS NULL THEN 'unexpected'
            WHEN t.sku IS NULL THEN 'missing'
            WHEN s.quantity <> t.quantity THEN 'mismatch'
            ELSE 'matched' END AS status
FROM keys k
LEFT JOIN source_stock s USING (sku, warehouse)
LEFT JOIN target_stock t USING (sku, warehouse);

-- Warehouse-level reconciliation using a CTE.
CREATE VIEW warehouse_summary AS
WITH grouped AS (
  SELECT warehouse, COUNT(*) AS keys_checked,
    SUM(CASE WHEN status = 'matched' THEN 1 ELSE 0 END) AS exact_matches,
    SUM(CASE WHEN status <> 'matched' THEN 1 ELSE 0 END) AS exceptions
  FROM stock_comparison GROUP BY warehouse
)
SELECT *, ROUND(100.0 * exact_matches / keys_checked, 2) AS exact_match_pct
FROM grouped;

-- Prioritized quantity exceptions; ties retain the same rank.
CREATE VIEW ranked_mismatches AS
SELECT sku, warehouse, source_qty, target_qty, delta,
       DENSE_RANK() OVER (PARTITION BY warehouse ORDER BY ABS(delta) DESC) AS severity_rank
FROM stock_comparison WHERE status = 'mismatch';
