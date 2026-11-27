import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('standalone demo embeds the CLI reconciliation engine', () => {
  const core = read('../src/reconcile.mjs')
    .replace(/\nexport\s*\{parseCsv,reconcile\};\s*$/, '')
    .trim();
  const demo = read('../demo.html');
  assert.ok(demo.includes(core), 'Browser engine differs from src/reconcile.mjs');
});

test('standalone demo embeds the committed sample data', () => {
  const demo = read('../demo.html');
  for (const [variable, filename] of [
    ['sourceSample', 'source.csv'],
    ['targetSample', 'target.csv'],
    ['cleanSample', 'clean.csv'],
  ]) {
    assert.ok(
      demo.includes(variable + '=' + JSON.stringify(read('../fixtures/' + filename))),
      'Browser fixture differs from ' + filename,
    );
  }
});
