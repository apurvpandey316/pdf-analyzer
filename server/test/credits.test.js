import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseGrantArgs } from '../src/services/credits.js'

test('reads email, amount and a multi-word description', () => {
  const args = ['a@b.com', '50', 'Beta', 'tester', 'bonus']
  assert.deepEqual(parseGrantArgs(args), {
    email: 'a@b.com',
    amount: 50,
    description: 'Beta tester bonus',
  })
})

test('description is optional', () => {
  assert.equal(parseGrantArgs(['a@b.com', '5']).description, undefined)
})

test('rejects a missing or invalid email', () => {
  assert.throws(() => parseGrantArgs([]), /email/)
  assert.throws(() => parseGrantArgs(['not-an-email', '5']), /email/)
})

test('rejects zero, negative, fractional and non-numeric amounts', () => {
  for (const amount of [undefined, '0', '-5', '2.5', 'ten']) {
    assert.throws(() => parseGrantArgs(['a@b.com', amount]), /positive whole number/)
  }
})
