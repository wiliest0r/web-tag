import test from 'node:test';
import assert from 'node:assert';

test('web-tag test environment sanity check', () => {
  assert.strictEqual(typeof 1, 'number');
});
