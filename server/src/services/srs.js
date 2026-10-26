// Spaced repetition based on the SM-2 algorithm (the one Anki started from).
// Each review is rated, and the card's next due date moves further out the better you know it.

const DAY = 24 * 60 * 60 * 1000
const MINUTE = 60 * 1000
const MIN_EASE = 1.3

export const RATINGS = ['again', 'hard', 'good', 'easy']

// SM-2 "quality" score (0-5) for each button.
const QUALITY = { again: 1, hard: 3, good: 4, easy: 5 }

// Returns the card's new scheduling fields. Pure function: does not touch the database.
export function schedule(card, rating, now = new Date()) {
  const q = QUALITY[rating]
  if (q === undefined) throw new Error(`Unknown rating: ${rating}`)

  let { repetitions = 0, interval = 0, easeFactor = 2.5 } = card

  // Standard SM-2 ease update: easy raises it, hard/again lower it.
  easeFactor = Math.max(MIN_EASE, easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))

  if (rating === 'again') {
    // Forgot it: start over and show it again in 10 minutes.
    return {
      repetitions: 0,
      interval: 0,
      easeFactor,
      dueDate: new Date(now.getTime() + 10 * MINUTE),
      lastReviewedAt: now,
    }
  }

  if (repetitions === 0) interval = rating === 'easy' ? 4 : 1
  else if (repetitions === 1) interval = rating === 'hard' ? 3 : rating === 'easy' ? 8 : 6
  else if (rating === 'hard') interval = Math.max(interval + 1, Math.round(interval * 1.2))
  else if (rating === 'easy') interval = Math.round(interval * easeFactor * 1.3)
  else interval = Math.round(interval * easeFactor)

  return {
    repetitions: repetitions + 1,
    interval,
    easeFactor,
    dueDate: new Date(now.getTime() + interval * DAY),
    lastReviewedAt: now,
  }
}

// Human-readable next interval for each button, shown under the rating buttons.
export function previewIntervals(card, now = new Date()) {
  return Object.fromEntries(
    RATINGS.map((rating) => {
      const ms = schedule(card, rating, now).dueDate - now
      return [rating, ms < DAY ? `${Math.round(ms / MINUTE)}m` : `${Math.round(ms / DAY)}d`]
    }),
  )
}
