import sqlite3
import unittest
from pathlib import Path

class ReconciliationSQLTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.addCleanup(self.db.close)
        self.db.executescript((Path(__file__).parents[1] / "sql/reconciliation.sql").read_text())
        self.db.executemany("INSERT INTO source_stock VALUES (?,?,?)", [
            ("A","PDX",10),("B","PDX",5),("C","SEA",3),("D","PDX",9)])
        self.db.executemany("INSERT INTO target_stock VALUES (?,?,?)", [
            ("A","PDX",10),("B","PDX",2),("D","PDX",8),("E","SEA",1)])

    def test_comparison(self):
        result = dict(self.db.execute("SELECT sku,status FROM stock_comparison"))
        self.assertEqual(result, {"A":"matched","B":"mismatch","C":"missing","D":"mismatch","E":"unexpected"})

    def test_ranking(self):
        result = dict(self.db.execute("SELECT sku,severity_rank FROM ranked_mismatches"))
        self.assertEqual(result, {"B":1,"D":2})

    def test_summary(self):
        result = self.db.execute("SELECT keys_checked,exact_matches,exceptions FROM warehouse_summary WHERE warehouse='PDX'").fetchone()
        self.assertEqual(result, (3,1,2))

    def test_duplicate_rejected(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO source_stock VALUES ('A','PDX',1)")

    def test_negative_rejected(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO target_stock VALUES ('F','SEA',-1)")

if __name__ == "__main__":
    unittest.main()
