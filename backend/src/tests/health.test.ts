import test from 'node:test'
import assert from 'node:assert/strict'

test('basic arithmetic sanity check', () => {
  assert.strictEqual(2 + 2, 4)
})

test('json parsing sanity check', () => {
  const payload = { ok: true, items: [1, 2, 3] }
  const clone = JSON.parse(JSON.stringify(payload))
  assert.deepStrictEqual(clone, payload)
})
