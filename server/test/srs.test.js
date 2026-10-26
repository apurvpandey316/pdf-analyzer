import assert from 'node:assert/strict'
import { test } from 'node:test'
import { previewIntervals, schedule } from '../src/services/srs.js'

const now = new Date('2026-01-01T00:00:00Z')
const DAY = 24 * 60 * 60 * 1000
const newCard = { repetitions: 0, interval: 0, easeFactor: 2.5 }

test('new card rated good is due in 1 day', () => {
  const next = schedule(newCard, 'good', now)
  assert.equal(next.repetitions, 1)
  assert.equal(next.interval, 1)
  assert.equal(next.dueDate - now, DAY)
})

test('second good review is due in 6 days, then grows by the ease factor', () => {
  const first = schedule(newCard, 'good', now)
  const second = schedule(first, 'good', now)
  assert.equal(second.interval, 6)
  const third = schedule(second, 'good', now)
  assert.equal(third.interval, Math.round(6 * third.easeFactor))
  assert.ok(third.interval > 6)
})

test('again resets progress and shows the card in 10 minutes', () => {
  const learned = { repetitions: 4, interval: 30, easeFactor: 2.5 }
  const next = schedule(learned, 'again', now)
  assert.equal(next.repetitions, 0)
  assert.equal(next.interval, 0)
  assert.equal(next.dueDate - now, 10 * 60 * 1000)
  assert.ok(next.easeFactor < 2.5)
})

test('easy schedules further out than good, hard schedules sooner', () => {
  const card = { repetitions: 3, interval: 10, easeFactor: 2.5 }
  const hard = schedule(card, 'hard', now).interval
  const good = schedule(card, 'good', now).interval
  const easy = schedule(card, 'easy', now).interval
  assert.ok(hard < good && good < easy, `${hard} < ${good} < ${easy}`)
  assert.ok(hard > 10, 'hard still moves the card forward')
})

test('ease factor never drops below 1.3', () => {
  let card = { repetitions: 2, interval: 5, easeFactor: 1.35 }
  for (let i = 0; i < 5; i++) card = { ...card, ...schedule(card, 'again', now) }
  assert.equal(card.easeFactor, 1.3)
})

test('unknown rating throws', () => {
  assert.throws(() => schedule(newCard, 'perfect', now))
})

test('previewIntervals labels each button', () => {
  assert.deepEqual(previewIntervals(newCard, now), { again: '10m', hard: '1d', good: '1d', easy: '4d' })
})
