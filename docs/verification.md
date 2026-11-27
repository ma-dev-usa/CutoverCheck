# Verification guide

## Expected fixture results

| Input pair | Decision | Source | Target | Exact matches | Findings |
|---|---|---:|---:|---:|---:|
| source.csv / target.csv | BLOCKED | 8 | 7 | 3 | 5 |
| clean.csv / clean.csv | READY | 7 | 7 | 7 | 0 |

See [blocked JSON](../reports/blocked.json) and [ready JSON](../reports/ready.json) for the complete outputs.

## Reproduce

Requires Node.js 22+ and Python 3 with SQLite support.

```sh
npm test
python -m unittest discover -s tests -p 'test_sql.py'
node src/cli.mjs fixtures/clean.csv fixtures/clean.csv
node src/cli.mjs fixtures/source.csv fixtures/target.csv
```

The final command is expected to return exit code 2. This is a successful detection of a blocked migration, not an execution failure.

## Browser review

1. Download and open [demo.html](../demo.html).
2. The exception scenario loads automatically; confirm five findings.
3. Select the clean scenario; confirm seven exact matches and zero findings.
4. Export the report as JSON.
5. Edit an input; the previous result must clear until reconciliation is run again.

## Automated checks

The [validation workflow](../.github/workflows/ci.yml) runs the JavaScript and SQLite tests, compares CLI output against committed reports, and checks that the standalone browser demo embeds the same engine as the CLI. Current workflow results are available under the repository's Actions tab.

The sample data and acceptance criteria exercise specific implementation controls. They are not production performance measurements.
