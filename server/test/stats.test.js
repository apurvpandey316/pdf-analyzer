import assert from 'node:assert/strict'
import { test } from 'node:test'
import { computeStreak, endOfLocalDay, localDateString, safeTimeZone } from '../src/services/stats.js'

test('streak counts consecutive days ending today', () => {
  assert.equal(computeStreak(['2026-03-10', '2026-03-09', '2026-03-08'], '2026-03-10'), 3)
})

test('streak still counts up to yesterday if nothing reviewed today yet', () => {
  assert.equal(computeStreak(['2026-03-09', '2026-03-08'], '2026-03-10'), 2)
})

test('a missed day breaks the streak', () => {
  assert.equal(computeStreak(['2026-03-10', '2026-03-08', '2026-03-07'], '2026-03-10'), 1)
  assert.equal(computeStreak(['2026-03-07'], '2026-03-10'), 0)
  assert.equal(computeStreak([], '2026-03-10'), 0)
})

test('streak crosses month boundaries', () => {
  assert.equal(computeStreak(['2026-03-01', '2026-02-28', '2026-02-27'], '2026-03-01'), 3)
})

test('local date uses the timezone (IST is UTC+5:30)', () => {
  const lateUtc = new Date('2026-03-10T20:00:00Z') // 01:30 on 11 March in India
  assert.equal(localDateString(lateUtc, 'Asia/Kolkata'), '2026-03-11')
  assert.equal(localDateString(lateUtc, 'UTC'), '2026-03-10')
})

test('end of local day is the next local midnight', () => {
  const now = new Date('2026-03-10T06:30:00Z') // 12:00 noon in India
  assert.equal(endOfLocalDay(now, 'Asia/Kolkata').toISOString(), '2026-03-10T18:30:00.000Z')
})

test('invalid timezone falls back to UTC', () => {
  assert.equal(safeTimeZone('Not/AZone'), 'UTC')
  assert.equal(safeTimeZone(undefined), 'UTC')
  assert.equal(safeTimeZone('Asia/Kolkata'), 'Asia/Kolkata')
})
